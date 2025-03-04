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

const BASE_PROMPT =
  'You are a helpful assistant. Your role is to provide helpful answers based on the role context provided from the user notes.';

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

  const generateText = async (messages: HistoryMessage[]) => {
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
          newHistory[newHistory.length - 1].content = partialResponse;
        } else {
          newHistory.push({ role: 'assistant', content: partialResponse });
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
        do_sample: false,
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
    const newHistory = [...history];

    if (context.length > 0) {
      context.forEach((c) => {
        newHistory.push({ role: 'system', content: `Knowledge: ${c.content}` });
      });
    }

    newHistory.push({ role: 'user', content: message });
    setHistory(newHistory);
    await generateText(newHistory);
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
