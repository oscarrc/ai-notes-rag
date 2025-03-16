'use client';

import {
  FeatureExtractionPipeline,
  InterruptableStoppingCriteria,
  TextGenerationPipeline,
  TextStreamer,
  env,
  pipeline,
} from '@huggingface/transformers';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

env.allowRemoteModels = true;
env.useBrowserCache = true;
env.remoteHost = '/api/models';
env.remotePathTemplate = '{model}';

export enum AiStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
}

export const EMBEDDING_MODELS = ['all-MiniLM-L6-v2'];
export const GENERATION_MODELS = [
  'SmolLM2-1.7B-Instruct',
  'Llama-3.2-1B-Instruct-q4f16',
];

export const AiContext = createContext<any>(null);

export const AiProvider = ({ children }: { children: React.ReactNode }) => {
  const embedder = useRef<FeatureExtractionPipeline | null>(null);
  const generator = useRef<TextGenerationPipeline | null>(null);
  const streamer = useRef<TextStreamer | null>(null);
  const stopper = useRef(new InterruptableStoppingCriteria());

  const [status, setStatus] = useState(AiStatus.IDLE);

  const [tps, setTps] = useState(0);
  const [numTokens, setNumTokens] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const [embeddingModel, setEmbeddingModel] = useState(EMBEDDING_MODELS[0]);
  const [embeddingProgress, setEmbeddingProgress] = useState(0);

  const [generationModel, setGenerationModel] = useState(GENERATION_MODELS[0]);
  const [generationProgress, setGenerationProgress] = useState(0);

  const [conversation, setConversation] = useState<HistoryMessage[]>([]);

  const progress = useMemo((): number => {
    return (embeddingProgress + generationProgress) / 2;
  }, [embeddingProgress, generationProgress]);

  const initEmbedder = useCallback(async () => {
    embedder.current = await pipeline(
      'feature-extraction',
      `embedding/${embeddingModel}`,
      {
        //@ts-ignore
        device: !!navigator.gpu ? 'webgpu' : 'wasm',
        progress_callback: (p: any) =>
          !isNaN(p.progress) && setEmbeddingProgress(p.progress),
      }
    );
  }, [embeddingModel]);

  const getEmbeddings = async (input: string) => {
    if (!embedder.current) return;

    const embeddings = await embedder.current(input, {
      pooling: 'mean',
      normalize: true,
    });

    return Array.from(embeddings.data);
  };

  const fetchEmbeddings = async (data: Embedding) => {
    console.log({ data });
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/embeddings`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    console.log({ result });
    const files = await result.json();
    return files;
  };

  const saveEmbeddings = async (data: EmbeddingRecord) => {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}api/embeddings`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const getPrompt = async (notes: EmbeddingRecord[], question: string) => {
    const context = notes
      .map(
        (note, idx) => `
          <|source_start|>
            <|source_id_start|>${note.name} (${idx})<|source_id_end|>
            ${note.content.trim()}
          <|source_end|>
        `
      )
      .join('\n');

    return `
      <|query_start|>
        ${question}. 
        Use only sources to answer the question. 
        If there's no relevant information in the sources answer "There is not enough informations on your notes to answer this question."
      <|query_end|>
      ${context}
      <|source_analysis_start|>
    `;
  };

  const getNotes = async (query: string) => {
    const embeddings = await getEmbeddings(query);
    const notes = await fetchEmbeddings(embeddings as Embedding);
    return notes;
  };

  const streamResponse = (text: string) => {
    setStatus(AiStatus.GENERATING);
    setConversation((c) => {
      const newHistory = [...c];

      if (
        newHistory.length > 0 &&
        newHistory[newHistory.length - 1].role === 'assistant'
      ) {
        newHistory[newHistory.length - 1] = {
          role: 'assistant',
          content: newHistory[newHistory.length - 1].content + text,
        };
      } else {
        newHistory.push({
          role: 'assistant',
          content: text,
        });
      }

      return newHistory;
    });
  };

  const generationPerformance = () => {
    setStartTime((s) => s ?? performance.now());
    setNumTokens((n) => n + 1);
    setTps((numTokens / (performance.now() - (startTime ?? 0))) * 1000);
    console.log(tps);
  };

  const initGenerator = useCallback(async () => {
    generator.current = await pipeline(
      'text-generation',
      `generation/${generationModel}`,
      {
        //@ts-ignore
        device: !!navigator.gpu ? 'webgpu' : 'wasm',
        dtype: 'q8',
        progress_callback: (p: any) =>
          !isNaN(p.progress) && setGenerationProgress(p.progress),
      }
    );

    streamer.current = new TextStreamer(generator.current.tokenizer, {
      skip_prompt: true,
      callback_function: streamResponse,
      token_callback_function: generationPerformance,
    });
  }, [generationModel]);

  const generateAnswer = async (question: string) => {
    if (!generator.current || !streamer.current) return;

    setStatus(AiStatus.GENERATING);
    setConversation((c) => [...c, { role: 'user', content: question }]);
    setTps(0);
    setNumTokens(0);

    try {
      const notes = await getNotes(question);
      const prompt = await getPrompt(notes, question);

      const result = await generator.current(prompt.trim(), {
        max_new_tokens: 1024,
        do_sample: false,
        return_full_text: false,
        streamer: streamer.current,
      });
      console.log(result);
      const response = Array.isArray(result[0]) ? result[0][0] : result[0];

      if (!response) {
        throw new Error('No generation output received');
      }

      setStatus(AiStatus.IDLE);
      setConversation((c) => {
        const newHistory = [...c];

        newHistory[newHistory.length - 1] = {
          role: 'assistant',
          content:
            typeof response.generated_text === 'string'
              ? response.generated_text
              : response.generated_text.reduce(
                  (acc, message) => acc + message.content,
                  ''
                ),
          sources: notes.map((n: EmbeddingRecord) => ({
            name: n.name,
            path: n.path,
            extension: n.path.split('.').pop(),
          })),
        };

        return newHistory;
      });
    } catch (error) {
      console.error('Error during model execution:', error);
      setStatus(AiStatus.ERROR);
    }
  };

  useEffect(() => {
    initEmbedder();
    initGenerator();
  }, [initEmbedder, initGenerator]);

  useEffect(() => {
    if (embedder.current && generator.current) {
      setStatus(AiStatus.READY);
    }
  }, [embedder, generator]);

  return (
    <AiContext.Provider
      value={{
        embeddingModel,
        embeddingProgress,
        setEmbeddingModel,
        getEmbeddings,
        fetchEmbeddings,
        saveEmbeddings,
        generationModel,
        generationProgress,
        setGenerationModel,
        generateAnswer,
        getNotes,
        conversation,
        status,
        stopper,
        progress,
        tps,
      }}
    >
      {children}
    </AiContext.Provider>
  );
};
