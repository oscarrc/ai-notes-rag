import { useEffect, useRef, useState, useCallback } from "react";

const useEmbeddings = () => {
    const worker = useRef<Worker | null>(null);

    const [ready, setReady] = useState<boolean>(false);
    const [loaded, setLoaded] = useState<number>(0);

    useEffect(() => {
        if (!worker.current) {
          worker.current = new Worker(new URL("../../worker/embeddings.ts", import.meta.url), {
            type: "module",
          });
        }
      
        const onMessageReceived = async (e: any) => {
            const { data: { progress, status, embedding } } = e;
            
            switch (status) {
              case "init":             
                setReady(false);
                setLoaded(progress.progress);
                console.log(progress.progress);
                break;
              case "ready":                
                setReady(true);
                break;
              case "complete":
                console.log(embedding)
                break;
            }
        };
      
        // Attach the callback function as an event listener.
        worker.current.addEventListener("message", onMessageReceived);

        // Initialize
        worker.current.postMessage({ type: 'init' });
    
        // Define a cleanup function for when the component is unmounted.
        return () =>
          worker.current?.removeEventListener("message", onMessageReceived);
    }, []);

    const getEmbeddings = useCallback((text: string) => {
        if (worker.current && ready) {
            worker.current.postMessage({ type: 'run', text });
        }
    }, [ready]);

    return { ready, loaded, getEmbeddings }
}

export default useEmbeddings;