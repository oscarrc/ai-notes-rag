'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { format } from 'path';

export const EMBEDDING_MODELS = ['all-MiniLM-L6-v2'];
export const GENERATION_MODELS = [
  'Llama-3.2-1B-Instruct-finetuned',
  'Llama-3.2-1B-Instruct',
];

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

const SYSTEM_PROMPT = `
You are an AI assistant that helps answer questions based on the user's personal notes. 
Follow these instructions carefully:
1. Only use information found in the user's notes
2. If the notes don't contain the answer, say "I don't have enough information in your notes to answer this question."
3. Never make up, expand or infer information not present in the notes
4. Provide a complete response based on one or more notes
5. Do not provide a response that is not based on the notes
6. If the notes contain conflicting information, provide a balanced response that acknowledges the different perspectives.
7. Maintain conversational continuity by referring to previous exchanges when relevant
8. Do not include meta-commentary about the conversation or your process of answering 
9. Never refer to "previous conversation context" or similar phrases in your response 
10. Do not explain that you're answering "directly from notes" or make statements about sticking to available data or context.  
`;

export const AiProvider = ({ children }: { children: React.ReactNode }) => {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, PendingRequest>>(new Map());

  const [status, setStatus] = useState<AiStatus>(AiStatus.IDLE);
  const [embeddingModel, setEmbeddingModel] = useState(EMBEDDING_MODELS[0]);
  const [generationModel, setGenerationModel] = useState(GENERATION_MODELS[0]);
  const [conversation, setConversation] = useState<HistoryMessage[]>([]);

  const regeneratingIndex = useRef<number | null>(null);

  // Use refs for progress tracking to avoid dependency cycles
  const embeddingProgressRef = useRef(0);
  const generationProgressRef = useRef(0);

  const clearConversation = () => {
    setConversation([]);
  };

  // Calculate the combined progress without dependencies
  const progress = useMemo((): number => {
    return (embeddingProgressRef.current + generationProgressRef.current) / 2;
  }, []);

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
      }, 120000);
    });
  }, []);

  const receiveFromWorker = useCallback(
    (id: string, data: { success: any; error: string | undefined }) => {
      if (id && pendingRequests.current.has(id)) {
        const { resolve, reject } = pendingRequests.current.get(id)!;
        if (data?.success) {
          resolve(true);
        } else {
          reject(new Error(data?.error));
        }
        pendingRequests.current.delete(id);
      }
    },
    []
  );

  useEffect(() => {
    if (status === AiStatus.IDLE && regeneratingIndex.current !== null) {
      regeneratingIndex.current = null;
    }
  }, [status]);

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
          receiveFromWorker(id, data);
          if (data.success) {
            checkModelsReady();
          } else {
            setStatus(AiStatus.ERROR);
            console.error(`Model initialization failed: ${data.error}`);
          }
          break;

        case 'EMBEDDING_PROGRESS':
          embeddingProgressRef.current = data.progress;
          setStatus((prev) => prev);
          checkModelsReady();
          break;

        case 'GENERATION_PROGRESS':
          generationProgressRef.current = data.progress;
          setStatus((prev) => prev);
          checkModelsReady();
          break;

        case 'STATUS_UPDATE':
          setStatus(data.status);
          break;

        case 'STREAM_RESPONSE':
          streamResponse(data.text);
          break;

        case 'GENERATION_COMPLETE':
          setStatus(AiStatus.IDLE);
          if (id && pendingRequests.current.has(id)) {
            const { resolve, reject } = pendingRequests.current.get(id)!;
            if (data.success) {
              resolve({
                response: data.response,
                performance: data.performance,
              });
            } else {
              reject(new Error(data.error));
            }
            pendingRequests.current.delete(id);
          }
          regeneratingIndex.current = null;
          break;

        case 'GENERATION_STOPPED':
          setStatus(AiStatus.IDLE);
          receiveFromWorker(id, data);
          pendingRequests.current.delete(id);
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
          receiveFromWorker(id, data);
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
    if (
      embeddingProgressRef.current === 100 &&
      generationProgressRef.current === 100
    ) {
      setStatus(AiStatus.READY);
    }
  }, []);

  const initEmbedder = useCallback(async () => {
    return sendToWorker('INIT_EMBEDDER', { embeddingModel });
  }, [embeddingModel]);

  const initGenerator = useCallback(async () => {
    return sendToWorker('INIT_GENERATOR', { generationModel });
  }, [generationModel]);

  const getEmbeddings = useCallback(
    async (input: string): Promise<Embedding> => {
      return sendToWorker('GET_EMBEDDINGS', { input }) as Promise<Embedding>;
    },
    [sendToWorker]
  );

  const fetchEmbeddings = useCallback(
    async (
      embeddings: Embedding,
      query?: string | null
    ): Promise<EmbeddingRecord[]> => {
      try {
        const result = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/embeddings`,
          {
            method: 'PUT',
            body: JSON.stringify({
              vector: embeddings,
              text: query,
            }),
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

  const createContextualQuery = (
    question: string,
    history: HistoryMessage[]
  ) => {
    const contextWindow = history.slice(-6);

    if (contextWindow.length === 0) {
      return question;
    }

    return contextWindow
      .filter((msg) => msg.role === 'user')
      .map((msg) => msg.content)
      .filter(Boolean)
      .join('\n\n');
  };

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
    (message: HistoryMessage, index?: number): HistoryMessage[] => {
      // Instruction-based system message
      const systemMessage: HistoryMessage = {
        role: 'system',
        content: SYSTEM_PROMPT,
      };

      const relevantHistory = index
        ? conversation.slice(index, -5)
        : conversation.slice(-5);

      relevantHistory.push(message);

      // Format notes as simple context
      const formatContext = (ctx: EmbeddingRecord[]) => {
        return ctx
          .map((note) => `NOTE - ${note.name}:\n${note.content.trim()}`)
          .join('\n\n');
      };

      const formattedHistory = relevantHistory.map((msg) => {
        if (msg.role === 'system') return;
        if (msg.role === 'assistant')
          return {
            role: 'assistant',
            content: Array.isArray(msg.content)
              ? msg.content.join(' ')
              : msg.content,
          };
        if (msg.role === 'user')
          return {
            role: 'user',
            content: `INSTRUCTION: Answer my question using only information from my notes and previous conversation context. If my notes don't contain the answer, tell me you don't have enough information.
                      MY NOTES:
                      ${formatContext(msg.context || [])}
                      MY QUESTION: ${msg.content}`,
          };
      }) as HistoryMessage[];

      return [systemMessage, ...formattedHistory];
    },
    [conversation]
  );

  const streamResponse = useCallback((text: string) => {
    setStatus(AiStatus.GENERATING);

    setConversation((c) => {
      const newHistory = [...c];

      const targetIndex =
        regeneratingIndex.current !== null
          ? regeneratingIndex.current
          : newHistory.length - 1;

      if (
        targetIndex >= 0 &&
        targetIndex < newHistory.length &&
        newHistory[targetIndex].role === 'assistant'
      ) {
        const targetMessage = newHistory[targetIndex];

        if (typeof targetMessage.content === 'string') {
          newHistory[targetIndex] = {
            ...targetMessage,
            content: targetMessage.content + text,
          };
        } else if (Array.isArray(targetMessage.content)) {
          const contentArray = [...targetMessage.content];

          if (
            contentArray.length > 0 &&
            contentArray[contentArray.length - 1] === ''
          ) {
            // Replace the empty placeholder with the first token
            contentArray[contentArray.length - 1] = text;
          } else {
            // Continue appending to the last element
            const lastIndex = contentArray.length - 1;
            contentArray[lastIndex] = contentArray[lastIndex] + text;
          }

          newHistory[targetIndex] = {
            ...targetMessage,
            content: contentArray,
          };
        }
      } else {
        newHistory.push({
          role: 'assistant',
          content: text,
        });
      }

      return newHistory;
    });
  }, []);

  const stopGeneration = async () => {
    return sendToWorker('STOP_GENERATION', {});
  };

  const generateAnswer = useCallback(
    async (question: string): Promise<Generation | undefined> => {
      if (!workerRef.current) return;

      regeneratingIndex.current = null;
      const userMessage: HistoryMessage = { role: 'user', content: question };

      setConversation((c) => [...c, userMessage]);

      try {
        let query = question;
        setStatus(AiStatus.LOADING);

        if (conversation.length > 0) {
          query = createContextualQuery(question, conversation);
        }

        const notes = await getNotes(query);

        if (notes.length === 0 && conversation.length === 0) {
          setStatus(AiStatus.GENERATING);
          streamResponse(
            "I don't have enough information in my sources to answer this question."
          );
          setStatus(AiStatus.IDLE);
          return;
        }

        userMessage.context = notes;

        setConversation((c) => {
          const newHistory = [...c];
          const lastUserMessageIndex = newHistory.length - 1;
          newHistory[lastUserMessageIndex] = userMessage;
          return newHistory;
        });

        // Create the chat messages array using the helper function
        const chatMessages = createChatMessages(userMessage);

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

        return sendToWorker('GENERATE_ANSWER', {
          messages: chatMessages,
        }) as Promise<Generation>;
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

  // Modified regenerateAnswer function
  const regenerateAnswer = useCallback(
    async (messageIndex: number): Promise<Generation | undefined> => {
      if (
        !workerRef.current ||
        messageIndex < 0 ||
        messageIndex >= conversation.length
      )
        return;

      let question = conversation[messageIndex - 1];
      let query = question.content as string;

      regeneratingIndex.current = messageIndex;

      if (conversation.length > 0) {
        query = createContextualQuery(
          query,
          conversation.slice(0, messageIndex - 2)
        );
      }

      if (!query) return;

      setStatus(AiStatus.LOADING);

      try {
        const notes = await getNotes(query);

        const currentAssistantMessage = conversation[messageIndex];
        const currentContent = currentAssistantMessage.content;

        if (notes.length === 0 && conversation.length === 0) {
          setStatus(AiStatus.GENERATING);

          const newContent =
            typeof currentContent === 'string'
              ? [
                  currentContent,
                  "I don't have enough information in my sources to answer this question.",
                ]
              : [
                  ...currentContent,
                  "I don't have enough information in my sources to answer this question.",
                ];

          setConversation((c) => {
            const newHistory = [...c];
            newHistory[messageIndex] = {
              ...newHistory[messageIndex],
              content: newContent,
            };
            return newHistory;
          });

          setStatus(AiStatus.IDLE);
          regeneratingIndex.current = null;
          return;
        }

        const chatMessages = createChatMessages(
          question,
          regeneratingIndex.current
        );

        setConversation((c) => {
          const newHistory = [...c];
          const assistantMessage = newHistory[messageIndex];

          let newContent;
          if (typeof assistantMessage.content === 'string') {
            newContent = [assistantMessage.content, ''];
          } else if (Array.isArray(assistantMessage.content)) {
            newContent = [...assistantMessage.content, ''];
          }

          newHistory[messageIndex] = {
            ...assistantMessage,
            content: newContent || '',
            sources: notes.map((n) => ({
              name: n.name,
              path: n.path,
              extension: n.path.split('.').pop(),
            })),
          };

          return newHistory;
        });

        return sendToWorker('GENERATE_ANSWER', {
          messages: chatMessages,
        }) as Promise<Generation>;
      } catch (error) {
        console.error('Error during model execution:', error);
        setStatus(AiStatus.ERROR);

        // Add error message
        setConversation((c) => {
          const newHistory = [...c];
          const assistantMessage = newHistory[messageIndex];

          const errorMsg =
            'Sorry, I encountered an error while generating a response. Please try again.';

          if (typeof assistantMessage.content === 'string') {
            assistantMessage.content = [assistantMessage.content, errorMsg];
          } else if (Array.isArray(assistantMessage.content)) {
            assistantMessage.content = [...assistantMessage.content, errorMsg];
          }

          return newHistory;
        });

        regeneratingIndex.current = null;
      }
    },
    [getNotes, createChatMessages]
  );

  const resetChat = () => {
    stopGeneration();
    setConversation([]);
    setStatus(AiStatus.IDLE);
  };

  // Create a memoized context value to avoid unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      embeddingModel,
      // Expose the ref values as normal properties
      embeddingProgress: embeddingProgressRef.current,
      setEmbeddingModel,
      getEmbeddings,
      fetchEmbeddings,
      saveEmbeddings,
      clearConversation,
      generationModel,
      generationProgress: generationProgressRef.current,
      setGenerationModel,
      generateAnswer,
      regenerateAnswer,
      resetChat,
      getNotes,
      conversation,
      status,
      stopGeneration,
      progress,
      regeneratingIndex: regeneratingIndex.current,
    }),
    [
      embeddingModel,
      generationModel,
      conversation,
      status,
      progress,
      clearConversation,
      generateAnswer,
      regenerateAnswer,
      resetChat,
      getNotes,
      stopGeneration,
      getEmbeddings,
      fetchEmbeddings,
      saveEmbeddings,
      setEmbeddingModel,
      setGenerationModel,
    ]
  );

  return (
    <AiContext.Provider value={contextValue}>{children}</AiContext.Provider>
  );
};
