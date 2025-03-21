// ai-worker.ts

import {
  FeatureExtractionPipeline,
  InterruptableStoppingCriteria,
  TextGenerationPipeline,
  TextStreamer,
  env,
  pipeline,
} from '@huggingface/transformers';

// Configure Hugging Face environment
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.remoteHost = '/api/models';
env.remotePathTemplate = '{model}';

// Define worker message types
type WorkerMessage = {
  type: string;
  payload: any;
  id?: string;
};

// Model references
let embedder: FeatureExtractionPipeline | null = null;
let generator: TextGenerationPipeline | null = null;
let streamer: TextStreamer | null = null;
let stopper = new InterruptableStoppingCriteria();

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
    generator = await pipeline(
      'text-generation',
      `generation/${generationModel}`,
      {
        // @ts-ignore
        device: !!navigator.gpu ? 'webgpu' : 'wasm',
        progress_callback: (p: any) => {
          if (!isNaN(p.progress)) {
            generationProgress = p.progress;
            self.postMessage({ type: 'GENERATION_PROGRESS', progress: p.progress });
          }
        },
      }
    );

    // Create streamer with callbacks that post messages back to the main thread
    streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      callback_function: (text: string) => {
        self.postMessage({ type: 'STREAM_RESPONSE', text });
      },
      token_callback_function: () => {
        startTime = startTime ?? performance.now();
        numTokens += 1;
        tps = (numTokens / (performance.now() - startTime)) * 1000;
        self.postMessage({ type: 'PERFORMANCE_UPDATE', tps, numTokens });
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
async function generateAnswer(prompt: string): Promise<{success: boolean, error?: string}> {
  if (!generator || !streamer) {
    return { success: false, error: 'Generator not initialized' };
  }

  try {
    // Reset metrics
    tps = 0;
    numTokens = 0;
    startTime = null;
    
    self.postMessage({ type: 'STATUS_UPDATE', status: 'GENERATING' });

    const result = await generator(prompt.trim(), {
      max_new_tokens: 512,
      temperature: 0.1,
      do_sample: true,
      top_p: 0.5,
      repetition_penalty: 1.2,
      return_full_text: false,
      streamer: streamer,
    });

    const response = Array.isArray(result[0]) ? result[0][0] : result[0];
    if (!response) {
      throw new Error('No generation output received');
    }

    // Send completion message
    self.postMessage({
      type: 'GENERATION_COMPLETE',
      content: typeof response.generated_text === 'string'
        ? response.generated_text
        : response.generated_text.reduce((acc: string, message: any) => acc + message.content, '')
    });

    self.postMessage({ type: 'STATUS_UPDATE', status: 'IDLE' });
    return { success: true };
  } catch (error: any) {
    self.postMessage({ type: 'STATUS_UPDATE', status: 'ERROR' });
    self.postMessage({
      type: 'ERROR',
      error: error.message,
    });
    return { success: false, error: error.message };
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
      await generateAnswer(payload.prompt);
      break;
      
    case 'STOP_GENERATION':
      if (stopper) {
        stopper.interrupt();
        self.postMessage({ type: 'GENERATION_STOPPED', id });
      }
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