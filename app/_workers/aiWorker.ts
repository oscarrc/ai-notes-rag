import {
  AutoModelForCausalLM,
  AutoTokenizer,
  FeatureExtractionPipeline,
  InterruptableStoppingCriteria,
  PreTrainedModel,
  PreTrainedTokenizer,
  TextStreamer,
  env,
  pipeline,
} from '@huggingface/transformers';

// Configure Hugging Face environment
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.remoteHost = '/api/models';
env.remotePathTemplate = '{model}';

enum AiStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
}

// Define worker message types
type WorkerMessage = {
  type: string;
  payload: any;
  id?: string;
};

// Model references
let embedder: FeatureExtractionPipeline | null = null;
let generator: PreTrainedModel | null = null;
let tokenizer: PreTrainedTokenizer | null = null;
let streamer: TextStreamer | null = null;
let stopping_criteria = new InterruptableStoppingCriteria();

// Status tracking
let embeddingProgress: number = 0;
let generationProgress: number = 0;
let tps: number = 0;
let numTokens: number = 0;
let startTime: number | null = null;

// Initialize embedding model
async function initEmbedder(embeddingModel: string): Promise<{success: boolean, error?: string}> {
  try {
    embedder = await pipeline(
      'feature-extraction',
      `embedding/${embeddingModel}`,
      {
        // @ts-ignore
        device: !!navigator.gpu ? 'webgpu' : 'wasm',
        progress_callback: (p: any) => {
          if (!isNaN(p.progress)) {
            embeddingProgress = p.progress;
            self.postMessage({ type: 'EMBEDDING_PROGRESS', progress: p.progress });
          }
        },
      }
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Initialize generation model
async function initGenerator(generationModel: string): Promise<{success: boolean, error?: string}> {
  try {
    const model = `generation/${generationModel}`;

    generator =  await AutoModelForCausalLM.from_pretrained(model, {
        dtype: 'q4f16',
        device: 'webgpu',
        progress_callback: (p: any) => {
          if (!isNaN(p.progress)) {
            generationProgress = p.progress;
            self.postMessage({ type: 'GENERATION_PROGRESS', progress: p.progress });
          }
        },
    });

    tokenizer = await AutoTokenizer.from_pretrained(model, {
      legacy: true,
      progress_callback: (p: any) => {
        if (!isNaN(p.progress)) {
          generationProgress = p.progress;
          self.postMessage({ type: 'GENERATION_PROGRESS', progress: p.progress });
        }
      },
    });


    // Create streamer with callbacks that post messages back to the main thread
    streamer = new TextStreamer(tokenizer, {
      skip_prompt: true,
      callback_function: (text: string) => {
        self.postMessage({ type: 'STREAM_RESPONSE', text });
      },
      token_callback_function: () => {
        startTime = startTime ?? performance.now();
        numTokens += 1;
        tps = (numTokens / (performance.now() - startTime)) * 1000;        
      },
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Generate embeddings for input text
async function getEmbeddings(input: string): Promise<{success: boolean, embeddings?: number[], error?: string}> {
  if (!embedder) return { success: false, error: 'Embedder not initialized' };

  try {
    const embeddings = await embedder(input, {
      pooling: 'mean',
      normalize: true,
    });

    return { 
      success: true, 
      embeddings: Array.from(embeddings.data as Float32Array) 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Generate answer with the model
async function generateAnswer(messages: any[]): Promise<{success: boolean, response?: string, performance?: any, error?: string}> {
  if (!generator || !streamer || !tokenizer) {
    throw new Error('Generator not initialized');
  }
  
  const inputs = tokenizer.apply_chat_template(messages, {
    add_generation_prompt: true,
    return_dict: true,
  });

  tps = 0;
  numTokens = 0;
  startTime = performance.now();
  
  const outputs = await generator.generate({
      ...(inputs as any),
      max_new_tokens: 512,
      temperature: 0.1,
      top_p: 0.9,
      repetition_penalty: 1.2,
      do_sample: false,
      stop_sequences: ["I don't have enough", "I don't know", "MY QUESTION:", "MY NOTES:"],
      streamer,
      stopping_criteria,
  });

  const response = tokenizer.batch_decode(outputs as any, { skip_special_tokens: true });

  if (!response) {
    throw new Error('No generation output received');
  }

  return  {
    response: response[0] || '',
    success: true,
    performance: {
      tps,
      numTokens,
      totalTime: performance.now() - startTime,
    }
  }
}

// Message handler
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = event.data;

  switch (type) {
    case 'INIT_EMBEDDER':
      const embedderResult = await initEmbedder(payload.embeddingModel);
      self.postMessage({ 
        type: 'EMBEDDER_INITIALIZED', 
        success: embedderResult.success,
        error: embedderResult.error,
        id
      });
      break;
      
    case 'INIT_GENERATOR':
      const generatorResult = await initGenerator(payload.generationModel);

      self.postMessage({ 
        type: 'GENERATOR_INITIALIZED', 
        success: generatorResult.success,
        error: generatorResult.error,
        id
      });
      break;
      
    case 'GET_EMBEDDINGS':
      const embeddingsResult = await getEmbeddings(payload.input);
      self.postMessage({ 
        type: 'EMBEDDINGS_RESULT',
        id,
        ...embeddingsResult
      });
      break;
      
    case 'GENERATE_ANSWER':
      stopping_criteria.reset();      
          
      self.postMessage({ type: 'STATUS_UPDATE', status: AiStatus.GENERATING });

      try{        
        const generationResult = await generateAnswer(payload.messages);
        
        self.postMessage({
          type: 'GENERATION_COMPLETE',
          ...generationResult,
          id,
        });

        self.postMessage({ type: 'STATUS_UPDATE', status: AiStatus.IDLE });
      }catch(error){        
        self.postMessage({ type: 'STATUS_UPDATE', status: AiStatus.ERROR });
        self.postMessage({
          type: 'ERROR',
          error: (error as Error).message,
        });
      }     

      break;
      
    case 'STOP_GENERATION':
      stopping_criteria.interrupt();
      self.postMessage({ type: 'GENERATION_STOPPED', id });
      break;
      
    default:
      self.postMessage({ 
        type: 'ERROR', 
        error: `Unknown message type: ${type}`,
        id
      });
  }
});

// Notify that the worker is ready
self.postMessage({ type: 'WORKER_READY' });