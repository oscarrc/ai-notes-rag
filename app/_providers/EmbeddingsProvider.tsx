'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
    env,
    FeatureExtractionPipeline,
    pipeline,
    PipelineType,
  } from '@huggingface/transformers';
  
  env.allowRemoteModels = true;
  env.remoteHost = '/api/models/embeddings';
  env.remotePathTemplate = '{model}';
  
export const EmbeddingsContext = createContext<any>(null);

export const EmbeddingsModels = ['all-MiniLM-L6-v2'];

export const EmbeddingsProvider = ({ children }: { children: React.ReactNode }) => {
    const task: PipelineType = 'feature-extraction';
    const [model, setModel] = useState('all-MiniLM-L6-v2');
    const [progress, setProgress] = useState(0);

    const extractor  = useRef<FeatureExtractionPipeline | null>(null);

    const initPipeline = async () => {
        const e = await pipeline(task, model, {
            //@ts-ignore
            device: !!navigator.gpu ? 'webgpu' : 'wasm',
            progress_callback: (p: any) => setProgress(p.progress),
        })

        extractor.current = e;
    }

    const calculateEmbeddings = async (input: string) => {
        if(!extractor.current) return;

        const output = await extractor.current(input, {
            pooling: 'mean',
            normalize: true,
        });

        return Array.from(output.data)
    }
    
    useEffect(() => {
        initPipeline()
    }, [model])

  return (
    <EmbeddingsContext.Provider value={{ calculateEmbeddings, progress, model, setModel }}>
      {children}
    </EmbeddingsContext.Provider>
  );
};
