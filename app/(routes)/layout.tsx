import '@/app/globals.css';

import { AiProvider } from '../_providers/AiProvider';
import type { Metadata } from 'next';
import QueryProvider from '@/app/_providers/QueryProvider';

export const metadata: Metadata = {
  title: 'AI Notes',
  description: 'RAG-based AI powered knowledge base',
};

const RootLayout = ({ children }: LayoutProps) => {
  return (
    <html lang='en'>
      <body>
        <AiProvider>
          <QueryProvider>{children}</QueryProvider>
        </AiProvider>
      </body>
    </html>
  );
};

export default RootLayout;
