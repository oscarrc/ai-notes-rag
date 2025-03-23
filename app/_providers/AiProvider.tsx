'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export const EMBEDDING_MODELS = ['all-MiniLM-L6-v2'];
export const GENERATION_MODELS = ['Llama-3.2-1B-Instruct-q4f16'];

export const AiContext = createContext<any>(null);

export enum AiStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
}

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};

export const AiProvider = ({ children }: { children: React.ReactNode }) => {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, PendingRequest>>(new Map());

  const [status, setStatus] = useState<AiStatus>(AiStatus.IDLE);
  const [performance, setPerformance] = useState<AiPerformance>({
    tps: 0,
    numTokens: 0,
    totalTime: 0,
  });
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
          const { tps, numTokens, totalTime } = data;
          setPerformance({ tps, numTokens, totalTime });
          break;

        case 'GENERATION_COMPLETE':
          setStatus(AiStatus.IDLE);
          // finalizeGeneration(data.content);
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

  const getNotes = useCallback(
    async (query: string): Promise<EmbeddingRecord[]> => {
      const embeddings = await getEmbeddings(query);
      return fetchEmbeddings(embeddings);
    },
    [getEmbeddings, fetchEmbeddings]
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

  // Create chat messages array for the model
  const createChatMessages = useCallback(
    (notes: EmbeddingRecord[], question: string): HistoryMessage[] => {
      // Instruction-based system message
      const systemMessage: HistoryMessage = {
        role: 'system',
        content: `You are an AI assistant that helps answer questions based on the user's personal notes. 
Follow these instructions carefully:
1. Only use information found in the user's notes
2. If the notes don't contain the answer, say "I don't have enough information in your notes to answer this question."
3. Never make up information not present in the notes
4. Provide a complete response based on one or more notes
5. Do not provide a response that is not based on the notes`,
      };

      // Format notes as simple context
      const formattedNotes = notes
        .map((note) => `NOTE - ${note.name}:\n${note.content.trim()}`)
        .join('\n\n');

      // Structure as instruction + context + question
      const userMessage: HistoryMessage = {
        role: 'user',
        content: `INSTRUCTION: Answer my question using only information from my notes. If my notes don't contain the answer, tell me you don't have enough information.

MY NOTES:
${formattedNotes}

MY QUESTION: ${question}`,
      };

      return [systemMessage, userMessage];
    },
    []
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
          sources: newHistory[newHistory.length - 1].sources,
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
      setPerformance({ tps: 0, numTokens: 0, totalTime: 0 });

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

        // Create the chat messages array using the helper function
        const chatMessages = createChatMessages(notes, question);
        console.log({ chatMessages });
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
          payload: { messages: chatMessages },
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
    [getNotes, createChatMessages, streamResponse]
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
        performance,
      }}
    >
      {children}
    </AiContext.Provider>
  );
};
