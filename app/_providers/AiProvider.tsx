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
2. If the notes don't contain the answer, say "I don't have enough information in your notes to answer this question." and stop answering.
3. Never make up information not present in the notes. Do not add information that is not on the notes.
4. Provide a complete response based on one or more notes
5. Do not provide a response that is not based on the notes
6. If the notes contain conflicting information, provide a balanced response that acknowledges the different perspectives.
7. When responding to follow-up questions, consider the previous conversation context.
8. Always indicate which note(s) you are drawing information from in your response
9. For complex answers spanning multiple notes, organize your response with clear headings or sections
10. When information is ambiguous, indicate your level of confidence in the answer
11. If notes contain partial information on the topic, acknowledge the limitations while providing what is available
12. If you notice date information in notes that suggests content might be outdated, mention this to the user
13. Provide concise but comprehensive answers appropriate to the complexity of the question
14. For technical content like code or formulas, maintain proper formatting in your response
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
    const relevantHistory = history.slice(-4);

    if (relevantHistory.length === 0) {
      return question;
    }

    const contextString = relevantHistory
      .map((msg) => {
        if (msg.role === 'system') return;
        return `${msg.role === 'user' ? 'Question' : 'Answer'}: ${Array.isArray(msg.content) ? msg.content.join('\n') : msg.content}`;
      })
      .join('\n');

    return `${contextString}\n Question: ${question}`;
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
    (
      notes: EmbeddingRecord[],
      question: string,
      index?: number
    ): HistoryMessage[] => {
      // Instruction-based system message
      const systemMessage: HistoryMessage = {
        role: 'system',
        content: SYSTEM_PROMPT,
      };

      // Format notes as simple context
      const formattedNotes = notes
        .map((note) => `NOTE - ${note.name}:\n${note.content.trim()}`)
        .join('\n\n');

      // Fetch relevant history
      const relevantHistory = index
        ? conversation.slice(index, -5)
        : conversation.slice(-5);

      // Structure as instruction + context + question
      const userMessage: HistoryMessage = {
        role: 'user',
        content: `INSTRUCTION: Answer my question using only information from my notes and previous conversation context. If my notes don't contain the answer, tell me you don't have enough information.

MY NOTES:
${formattedNotes}

MY QUESTION: ${question}`,
      };

      return [systemMessage, ...relevantHistory, userMessage];
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

      setConversation((c) => [...c, { role: 'user', content: question }]);

      try {
        setStatus(AiStatus.LOADING);

        const notes = await getNotes(question);

        if (notes.length === 0 && conversation.length === 0) {
          setStatus(AiStatus.GENERATING);
          streamResponse(
            "I don't have enough information in my sources to answer this question."
          );
          setStatus(AiStatus.IDLE);
          return;
        }

        // Create the chat messages array using the helper function
        const chatMessages = createChatMessages(notes, question);

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

      // Find the corresponding user question before this answer
      let question = '';

      regeneratingIndex.current = messageIndex;

      for (let i = messageIndex - 1; i >= 0; i--) {
        if (conversation[i].role === 'user') {
          question = conversation[i].content as string;
          break;
        }
      }

      if (!question) return;
      setStatus(AiStatus.LOADING);

      try {
        const notes = await getNotes(question);

        // Store current message info for regeneration before modifying
        const currentAssistantMessage = conversation[messageIndex];
        const currentContent = currentAssistantMessage.content;

        if (notes.length === 0 && conversation.length === 0) {
          setStatus(AiStatus.GENERATING);

          // Prepare a new answer array without empty strings
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

          // Update conversation with the complete answer
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

        // Create the chat messages array using the helper function
        const chatMessages = createChatMessages(
          notes,
          question,
          regeneratingIndex.current
        );

        // Prepare the conversation for receiving a new answer
        setConversation((c) => {
          const newHistory = [...c];
          const assistantMessage = newHistory[messageIndex];

          // Prepare for streaming - convert to array if needed and add empty string placeholder
          let newContent;
          if (typeof assistantMessage.content === 'string') {
            // First regeneration: convert string to array with original content and add placeholder
            newContent = [assistantMessage.content, ''];
          } else if (Array.isArray(assistantMessage.content)) {
            // Already an array, just add a placeholder
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
