import type { Metadata } from 'next';
import '@/app/globals.css';
import QueryProvider from '@/app/_providers/QueryProvider';
import PwaProvider from '@/app/_providers/PwaProvider';

export const metadata: Metadata = {
  title: 'AI Notes',
  description: 'RAG-based AI powered knowledge base',
};

const RootLayout = ({ children }: LayoutProps) => {
  return (
    <html lang='en'>
      <body>
        <PwaProvider>
          <QueryProvider>{children}</QueryProvider>
        </PwaProvider>
      </body>
    </html>
  );
};

export default RootLayout;
