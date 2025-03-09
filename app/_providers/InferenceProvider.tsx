'use client';

import {
  InterruptableStoppingCriteria,
  TextStreamer,
  env,
  pipeline,
} from '@huggingface/transformers';
import { createContext, useEffect, useRef, useState } from 'react';

env.allowRemoteModels = true;
env.remoteHost = '/api/models';
env.remotePathTemplate = '{model}';

const BASE_PROMPT = `
You are a helpful assistant that answers questions based only on the user's notes that are provided to you. 
If the answer cannot be found in the notes, say "I don't have enough information in your notes to answer this question."
Do not make up information.
`;

export enum Status {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  GENERATING = 'GENERATING',
}

export const InferenceContext = createContext<any>(null);
export const InferenceModels = ['Llama-3.2-1B-Instruct-q4f16'];

export const InferenceProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [model, setModel] = useState(InferenceModels[0]);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState(Status.IDLE);
  const [history, setHistory] = useState<HistoryMessage[]>([
    { role: 'system', content: BASE_PROMPT },
  ]);
  const generatorRef = useRef<any>(null);
  const stoppingCriteria = useRef(new InterruptableStoppingCriteria());

  const initPipeline = async () => {
    generatorRef.current = await pipeline(
      'text-generation',
      `inference/${model}`,
      {
        //@ts-ignore
        device: !!navigator.gpu ? 'webgpu' : 'wasm',
        progress_callback: (p: any) => setProgress(p.progress),
      }
    );
    setReady(true);
  };

  const generateText = async (
    messages: HistoryMessage[],
    sources: FileNode[]
  ) => {
    if (!generatorRef.current) return;

    const tokenizer = generatorRef.current.tokenizer;

    let partialResponse = '';
    let startTime;
    let numTokens = 0;
    let tps: number;

    const token_callback_function = () => {
      startTime ??= performance.now();
      if (numTokens++ > 0) {
        tps = (numTokens / (performance.now() - startTime)) * 1000;
      }
    };

    const callback_function = (output: any) => {
      partialResponse += output;

      setHistory((h) => {
        const newHistory = [...h];

        if (
          newHistory.length > 0 &&
          newHistory[newHistory.length - 1].role === 'assistant'
        ) {
          // Update the existing assistant message with content and sources
          newHistory[newHistory.length - 1] = {
            role: 'assistant',
            content: partialResponse,
            sources: sources,
          };
        } else {
          // Add a new assistant message with content and sources
          newHistory.push({
            role: 'assistant',
            content: partialResponse,
            sources: sources,
          });
        }

        return newHistory;
      });
    };

    const streamer = new TextStreamer(tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function,
      token_callback_function,
    });

    try {
      setStatus(Status.GENERATING);
      await generatorRef.current(messages, {
        do_sample: true, // Enable sampling for more creative responses
        temperature: 0.7, // Add some temperature to make responses more varied
        max_new_tokens: 1024,
        streamer,
        stopping_criteria: stoppingCriteria.current,
        return_dict_in_generate: true,
      });
    } catch (error) {
      console.error('Error during model execution:', error);
    } finally {
      setStatus(Status.IDLE);
    }
  };

  const sendMessage = async (message: string, context: EmbeddingRecord[]) => {
    // Format sources
    const sources = context.map((c) => ({
      name: c.name,
      path: c.path,
      extension: c.path.split('.').pop(),
    }));

    // Create a new history array preserving conversation
    const conversationHistory = history.filter(
      (msg) => msg.role === 'user' || msg.role === 'assistant'
    );

    // Start with system messages
    const newHistory: HistoryMessage[] = [
      { role: 'system', content: BASE_PROMPT },
    ];

    // Add the notes context
    if (context.length > 0) {
      const contextBlock = context
        .map((c, index) => `[Note ${index + 1}] ${c.path}\n${c.content}`)
        .join('\n\n');

      newHistory.push({
        role: 'system',
        content: `NOTES:\n${contextBlock}\n\nAnswer the user's question based only on these notes..`,
      });
    } else {
      newHistory.push({
        role: 'system',
        content:
          'No relevant notes were found. If you cannot answer from general knowledge, tell the user there is not enough information in their notes to answer the question.',
      });
    }

    // Add conversation history
    newHistory.push(...conversationHistory);

    // Add the new user message
    newHistory.push({ role: 'user', content: message });

    setHistory(newHistory);

    await generateText(newHistory, sources);
  };

  useEffect(() => {
    initPipeline();
  }, [model]);

  return (
    <InferenceContext.Provider
      value={{
        progress,
        ready,
        history,
        sendMessage,
        generateText,
        status,
        setStatus,
        stoppingCriteria,
        model,
        setModel,
      }}
    >
      {children}
    </InferenceContext.Provider>
  );
};
