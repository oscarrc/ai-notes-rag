'use client'

import { createContext, useEffect, useState, useRef } from 'react';
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

    const saveEmbeddings = async ( data: EmbeddingRecord ) => {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}api/embeddings`, {
        method: 'POST',
        body: JSON.stringify(data),
      });  
    }

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

    const getQuery = async (data: Embedding) => {
      const result = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}api/embeddings`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      const files = await result.json();
      return files;
    };    
    
    useEffect(() => {
        initPipeline()
    }, [model])

  return (
    <EmbeddingsContext.Provider value={{ calculateEmbeddings, saveEmbeddings, getQuery, progress, model, setModel }}>
      {children}
    </EmbeddingsContext.Provider>
  );
};
