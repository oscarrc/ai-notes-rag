'use client';

import {
  FeatureExtractionPipeline,
  PipelineType,
  env,
  pipeline,
} from '@huggingface/transformers';
import { createContext, useEffect, useRef, useState } from 'react';

env.allowRemoteModels = true;
env.remoteHost = '/api/models';
env.remotePathTemplate = '{model}';

export const EmbeddingsContext = createContext<any>(null);

export const EmbeddingsModels = ['all-MiniLM-L6-v2'];

export const EmbeddingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const task: PipelineType = 'feature-extraction';
  const [model, setModel] = useState(EmbeddingsModels[0]);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(true);

  const extractor = useRef<FeatureExtractionPipeline | null>(null);

  const saveEmbeddings = async (data: EmbeddingRecord) => {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}api/embeddings`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const initPipeline = async () => {
    const e = await pipeline(task, `embeddings/${model}`, {
      //@ts-ignore
      device: !!navigator.gpu ? 'webgpu' : 'wasm',
      progress_callback: (p: any) => setProgress(p.progress),
    });

    extractor.current = e;
    setReady(true);
  };

  const calculateEmbeddings = async (input: string) => {
    if (!extractor.current) return;
    console.log(input);
    const output = await extractor.current(input, {
      pooling: 'mean',
      normalize: true,
    });

    return Array.from(output.data);
  };

  const getQuery = async (data: Embedding) => {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/embeddings`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    const files = await result.json();
    return files;
  };

  useEffect(() => {
    initPipeline();
  }, [model]);

  return (
    <EmbeddingsContext.Provider
      value={{
        calculateEmbeddings,
        saveEmbeddings,
        getQuery,
        progress,
        ready,
        model,
        setModel,
      }}
    >
      {children}
    </EmbeddingsContext.Provider>
  );
};
