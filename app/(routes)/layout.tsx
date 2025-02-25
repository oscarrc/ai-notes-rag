import type { Metadata } from 'next';
import '@/app/globals.css';
import QueryProvider from '@/app/_providers/QueryProvider';
import { EmbeddingsProvider } from '../_providers/EmbeddingsProvider';
import { InferenceProvider } from '../_providers/InferenceProvider';

export const metadata: Metadata = {
  title: 'AI Notes',
  description: 'RAG-based AI powered knowledge base',
};

const RootLayout = ({ children }: LayoutProps) => {
  return (
    <html lang='en'>
      <body>
        <EmbeddingsProvider>
          <InferenceProvider>            
            <QueryProvider>{children}</QueryProvider>
          </InferenceProvider>
        </EmbeddingsProvider>
      </body>
    </html>
  );
};

export default RootLayout;
