'use client';

import { createContext, useEffect, useRef, useState } from 'react';
import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
  InterruptableStoppingCriteria,
  env
} from '@huggingface/transformers';

env.allowRemoteModels = true;
env.remoteHost = '/api/models';
env.remotePathTemplate = '{model}';

export const InferenceContext = createContext<any>(null);

export const InferenceModels = ['Llama-3.2-1B-Instruct-q4f16'];

export const InferenceProvider = ({ children }: { children: React.ReactNode }) => {
  const [model, setModel] = useState(InferenceModels[0]);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  const tokenizerRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const stoppingCriteria = useRef(new InterruptableStoppingCriteria());

  const initPipeline = async () => {
    tokenizerRef.current = await AutoTokenizer.from_pretrained(`inference/${model}`, {
      progress_callback: (p: any) => setProgress(p.progress),
    });

    modelRef.current = await AutoModelForCausalLM.from_pretrained(`inference/${model}`, {
      dtype: "q4f16",
      //@ts-ignore
      device: !!navigator.gpu ? 'webgpu' : 'wasm',
      progress_callback: (p: any) => setProgress(p.progress),
    });

    setReady(true);
    testModel();
  };

  const testModel = async () => {
    if (!tokenizerRef.current || !modelRef.current) return;
    try{
      console.log('Testing model with sample input...');
      const output = await generateText([{ role: 'user', content: 'Hello, how are you?' }]);
      console.log('Test output:', output);
    }catch(e){
      console.log(e)
    }
  };

  const generateText = async (messages: any) => {
    if (!tokenizerRef.current || !modelRef.current) return;

    const tokenizer = tokenizerRef.current;
    const model = modelRef.current;

    const inputs = tokenizer.apply_chat_template(messages, {
      add_generation_prompt: true,
      return_dict: true,
    });
    console.log("Generated inputs:", inputs);
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
      console.log({ status: 'update', output, tps, numTokens });
    };

    const streamer = new TextStreamer(tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function,
      token_callback_function,
    });

    console.log({ status: 'start' });
    try {
      console.log("Starting text generation...");
      const { sequences } = await model.generate({
        input_ids: inputs.input_ids,
        attention_mask: inputs.attention_mask,
        do_sample: false,
        max_new_tokens: 1024,
        streamer,
        stopping_criteria: stoppingCriteria.current,
        return_dict_in_generate: true,
      });
    
      console.log("Model executed successfully!");
      const decoded = tokenizer.batch_decode(sequences, { skip_special_tokens: true });
      console.log("Decoded Output:", decoded);
      return decoded;
    } catch (error) {
      console.error("Error during model execution:", error);
    }
  };

  useEffect(() => {
    initPipeline();
  }, [model]);

  return (
    <InferenceContext.Provider value={{ progress, ready, generateText, stoppingCriteria, model, setModel }}>
      {children}
    </InferenceContext.Provider>
  );
};