'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export enum AiStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
}

export const EMBEDDING_MODELS = ['all-MiniLM-L6-v2'];
export const GENERATION_MODELS = ['Llama-3.2-1B-Instruct-q4f16'];

export const AiContext = createContext<any>(null);

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: {
    name: string;
    path: string;
    extension?: string;
  }[];
}

type Embedding = number[];

interface EmbeddingRecord {
  path: string;
  name: string;
  content: string;
}

export const AiProvider = ({ children }: { children: React.ReactNode }) => {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, PendingRequest>>(new Map());

  const [status, setStatus] = useState<AiStatus>(AiStatus.IDLE);
  const [tps, setTps] = useState(0);
  const [embeddingModel, setEmbeddingModel] = useState(EMBEDDING_MODELS[0]);
  const [embeddingProgress, setEmbeddingProgress] = useState(0);
  const [generationModel, setGenerationModel] = useState(GENERATION_MODELS[0]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [conversation, setConversation] = useState<HistoryMessage[]>([]);

  const progress = useMemo((): number => {
    return (embeddingProgress + generationProgress) / 2;
  }, [embeddingProgress, generationProgress]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const worker = new Worker(
      new URL('../_workers/aiWorker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event) => {
      const { type, id, ...data } = event.data;
      switch (type) {
        case 'WORKER_READY':
          console.log('AI worker is ready');
          break;

        case 'EMBEDDER_INITIALIZED':
        case 'GENERATOR_INITIALIZED':
          if (data.success) {
            checkModelsReady();
          } else {
            setStatus(AiStatus.ERROR);
            console.error(`Model initialization failed: ${data.error}`);
          }
          break;

        case 'EMBEDDING_PROGRESS':
          setEmbeddingProgress(data.progress);
          break;

        case 'GENERATION_PROGRESS':
          setGenerationProgress(data.progress);
          break;

        case 'STATUS_UPDATE':
          setStatus(data.status);
          break;

        case 'STREAM_RESPONSE':
          streamResponse(data.text);
          break;

        case 'PERFORMANCE_UPDATE':
          setTps(data.tps);
          break;

        case 'GENERATION_COMPLETE':
          finalizeGeneration(data.content);
          break;

        case 'EMBEDDINGS_RESULT':
          if (id && pendingRequests.current.has(id)) {
            const { resolve, reject } = pendingRequests.current.get(id)!;
            if (data.success) {
              resolve(data.embeddings);
            } else {
              reject(new Error(data.error));
            }
            pendingRequests.current.delete(id);
          }
          break;

        case 'ERROR':
          console.error('Worker error:', data.error);
          if (id && pendingRequests.current.has(id)) {
            const { reject } = pendingRequests.current.get(id)!;
            reject(new Error(data.error));
            pendingRequests.current.delete(id);
          }
          break;
      }
    };

    workerRef.current = worker;

    initEmbedder();
    initGenerator();

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const checkModelsReady = useCallback(() => {
    if (embeddingProgress === 1 && generationProgress === 1) {
      setStatus(AiStatus.READY);
    }
  }, [embeddingProgress, generationProgress]);

  const initEmbedder = useCallback(() => {
    if (!workerRef.current) return;

    workerRef.current.postMessage({
      type: 'INIT_EMBEDDER',
      payload: { embeddingModel },
    });
  }, [embeddingModel]);

  const initGenerator = useCallback(() => {
    if (!workerRef.current) return;

    workerRef.current.postMessage({
      type: 'INIT_GENERATOR',
      payload: { generationModel },
    });
  }, [generationModel]);

  const sendToWorker = useCallback((type: string, payload: any) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const id = Math.random().toString(36).substring(2, 9);

      pendingRequests.current.set(id, { resolve, reject });

      workerRef.current.postMessage({
        type,
        payload: { ...payload, id },
        id,
      });

      setTimeout(() => {
        if (pendingRequests.current.has(id)) {
          const { reject } = pendingRequests.current.get(id)!;
          reject(new Error('Worker request timeout'));
          pendingRequests.current.delete(id);
        }
      }, 60000);
    });
  }, []);

  const getEmbeddings = useCallback(
    async (input: string): Promise<Embedding> => {
      return sendToWorker('GET_EMBEDDINGS', { input }) as Promise<Embedding>;
    },
    [sendToWorker]
  );

  const fetchEmbeddings = useCallback(
    async (embeddings: Embedding): Promise<EmbeddingRecord[]> => {
      try {
        const result = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/embeddings`,
          {
            method: 'PUT',
            body: JSON.stringify(embeddings),
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!result.ok) {
          throw new Error(`API error: ${result.statusText}`);
        }

        return await result.json();
      } catch (error) {
        console.error('Error fetching embeddings:', error);
        throw error;
      }
    },
    []
  );

  const saveEmbeddings = useCallback(
    async (data: EmbeddingRecord): Promise<void> => {
      try {
        const result = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/embeddings`,
          {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!result.ok) {
          throw new Error(`API error: ${result.statusText}`);
        }
      } catch (error) {
        console.error('Error saving embeddings:', error);
        throw error;
      }
    },
    []
  );

  const getPrompt = useCallback(
    (notes: EmbeddingRecord[], question: string): string => {
      if (!notes || notes.length === 0) {
        return `<s>[INST] Answer this question: ${question}

I don't have any relevant documents to help answer this question. Please respond with:
"I don't have enough information in my sources to answer this question." [/INST]</s>`;
      }

      const context = notes
        .map((note) => {
          return `Source: ${note.path}
Title: ${note.name}
Content: ${note.content.trim()}`;
        })
        .join('\n\n');

      // Format using a structure that works well with instruction-based LLama models
      return `<s>[INST] 
I'll provide you with some sources and a question. Please answer the question based ONLY on the provided sources.

Question: ${question}

Sources:
${context}

If you can't find the answer in the sources, just say "I don't have enough information to answer this question."

Answer in a clear, concise way. If you use information from the sources, include the source IDs in your answer like this: [${notes[0]?.path}]. At the end of your answer, list all the sources you used in the format [source_1, source_2, etc.].
[/INST]</s>`;
    },
    []
  );

  const getNotes = useCallback(
    async (query: string): Promise<EmbeddingRecord[]> => {
      const embeddings = await getEmbeddings(query);
      return fetchEmbeddings(embeddings);
    },
    [getEmbeddings, fetchEmbeddings]
  );

  const streamResponse = useCallback((text: string) => {
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
  }, []);

  const finalizeGeneration = useCallback((content: string) => {
    setConversation((c) => {
      const newHistory = [...c];

      if (
        newHistory.length > 0 &&
        newHistory[newHistory.length - 1].role === 'assistant'
      ) {
        const sources = newHistory[newHistory.length - 1].sources;
        newHistory[newHistory.length - 1] = {
          role: 'assistant',
          content,
          sources,
        };
      }

      return newHistory;
    });
  }, []);

  const stopGeneration = () => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: 'STOP_GENERATION' });
  };

  const generateAnswer = useCallback(
    async (question: string) => {
      if (!workerRef.current) return;

      setConversation((c) => [...c, { role: 'user', content: question }]);
      setTps(0);

      try {
        setStatus(AiStatus.LOADING);

        const notes = await getNotes(question);

        if (notes.length === 0) {
          setStatus(AiStatus.GENERATING);
          streamResponse(
            "I don't have enough information in my sources to answer this question."
          );
          setStatus(AiStatus.IDLE);
          return;
        }

        const prompt = getPrompt(notes, question);
        console.log(prompt);

        setConversation((c) => {
          const newHistory = [...c];

          newHistory.push({
            role: 'assistant',
            content: '',
            sources: notes.map((n) => ({
              name: n.name,
              path: n.path,
              extension: n.path.split('.').pop(),
            })),
          });

          return newHistory;
        });

        workerRef.current.postMessage({
          type: 'GENERATE_ANSWER',
          payload: { prompt },
        });
      } catch (error) {
        console.error('Error during model execution:', error);
        setStatus(AiStatus.ERROR);
        setConversation((c) => [
          ...c,
          {
            role: 'assistant',
            content: `Sorry, I encountered an error while generating a response. Please try again.`,
          },
        ]);
      }
    },
    [getNotes, getPrompt, streamResponse]
  );

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
        stopGeneration,
        progress,
        tps,
      }}
    >
      {children}
    </AiContext.Provider>
  );
};
