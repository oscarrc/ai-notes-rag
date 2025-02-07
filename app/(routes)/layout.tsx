import type { Metadata } from 'next';
import '@/app/globals.css';
import QueryProvider from '@/app/_providers/QueryProvider';

export const metadata: Metadata = {
  title: 'AI Notes',
  description: 'RAG-based AI powered knowledge base',
};

const RootLayout = ({ children }: LayoutProps) => {
  return (
    <html lang='en'>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
};

export default RootLayout;
