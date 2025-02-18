import { useEffect, useRef, useState, useCallback } from 'react';

const useEmbeddings = () => {
  const worker = useRef<Worker | null>(null);

  const [ready, setReady] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<number>(0);
  const [embedding, setEmbedding] = useState<Embedding | null>(null);

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(
        new URL('../../workers/embeddings.worker.ts', import.meta.url),
        {
          type: 'module',
        }
      );
    }

    const onMessageReceived = async (e: MessageEvent) => {
      const {
        data: { progress, status, embedding },
      } = e;

      switch (status) {
        case 'init':
          setReady(false);
          setLoaded(progress.progress);
          break;
        case 'ready':
          setReady(true);
          break;
        case 'complete':
          setEmbedding(embedding);
          console.log('Embedding received:', embedding);
          break;
        default:
          console.warn('Unknown message status:', status);
      }
    };

    if (worker.current) {
      worker.current.addEventListener('message', onMessageReceived);
      worker.current.postMessage({ type: 'init' });
    }

    return () => {
      if (worker.current) {
        worker.current.removeEventListener('message', onMessageReceived);
        worker.current.terminate();
        worker.current = null;
      }
    };
  }, []);

  const getEmbeddings = (text: string) => {
      if (!worker.current) {
        console.error('Worker is not initialized yet.');
        return;
      }
      worker.current.postMessage({ type: 'run', text });
    };

  return { ready, loaded, getEmbeddings, embedding };
};

export default useEmbeddings;
