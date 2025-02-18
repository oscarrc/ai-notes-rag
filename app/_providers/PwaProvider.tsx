'use client';

import { useEffect } from 'react';

const PwaProvider = ({ children }: LayoutProps) => {
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      const registerServiceWorker = async () => {
        try {
          await navigator.serviceWorker.register(
            '../../workers/service.worker.ts'
          );
        } catch (error) {
          console.error('Error registering service worker');
        }
      };

      registerServiceWorker();
    }
  }, []);

  return <>{children}</>;
};

export default PwaProvider;
