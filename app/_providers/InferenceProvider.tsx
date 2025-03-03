'use client';

import {
  AutoModelForCausalLM,
  AutoTokenizer,
  InterruptableStoppingCriteria,
  TextStreamer,
  env,
} from '@huggingface/transformers';
import { createContext, useEffect, useRef, useState } from 'react';

env.allowRemoteModels = true;
env.remoteHost = '/api/models';
env.remotePathTemplate = '{model}';

const BASE_PROMPT =
  "You are a helpful assistant. Your role is to provide helpful answers based on the role context provided from the user notes. You should answer with 'I don't find anything related to that in your notes' if context is provided and it is empty";

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
  const [history, setHistory] = useState<HistoryMessage[]>([
    { role: 'system', content: BASE_PROMPT },
  ]);
  const tokenizerRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const stoppingCriteria = useRef(new InterruptableStoppingCriteria());

  const initPipeline = async () => {
    tokenizerRef.current = await AutoTokenizer.from_pretrained(
      `inference/${model}`,
      {
        //@ts-ignore
        device: !!navigator.gpu ? 'webgpu' : 'wasm',
        progress_callback: (p: any) => setProgress(p.progress),
      }
    );

    modelRef.current = await AutoModelForCausalLM.from_pretrained(
      `inference/${model}`,
      {
        dtype: 'q4f16',
        //@ts-ignore
        device: !!navigator.gpu ? 'webgpu' : 'wasm',
        progress_callback: (p: any) => setProgress(p.progress),
      }
    );

    setReady(true);
  };

  const generateText = async (messages: HistoryMessage[]) => {
    if (!tokenizerRef.current || !modelRef.current) return;
    console.log(messages);
    const tokenizer = tokenizerRef.current;
    const model = modelRef.current;
    let partialResponse = '';

    const inputs = tokenizer.apply_chat_template(messages, {
      add_generation_prompt: true,
      return_dict: true,
    });

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
      const { sequences } = await model.generate({
        input_ids: inputs.input_ids,
        attention_mask: inputs.attention_mask,
        do_sample: false,
        max_new_tokens: 1024,
        streamer,
        stopping_criteria: stoppingCriteria.current,
        return_dict_in_generate: true,
      });

      // const decoded = tokenizer.batch_decode(sequences, {
      //   skip_special_tokens: true,
      // });

      // setHistory((h) => [...h, { role: 'assistant', content: decoded }]);

      // return decoded;
    } catch (error) {
      console.error('Error during model execution:', error);
    }
  };

  const sendMessage = async (message: string, context: string) => {
    const newHistory = [...history];
    newHistory.push({ role: 'user', content: message });
    newHistory.push({
      role: 'context',
      content: "User's birthday is 10th december 1987",
    });
    if (context) newHistory.push({ role: 'context', content: context });

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
        stoppingCriteria,
        model,
        setModel,
      }}
    >
      {children}
    </InferenceContext.Provider>
  );
};
