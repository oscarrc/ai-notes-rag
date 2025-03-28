import '@/app/globals.css';

import { AiProvider } from '@/app/_providers/AiProvider';
import type { Metadata } from 'next';
import QueryProvider from '@/app/_providers/QueryProvider';
import Search from '@/app/_components/Search';
import Settings from '@/app/_components/Settings';
import Shortcuts from '@/app/_components/Shortcuts';
import { ToastProvider } from './_providers/ToastProvider';

interface EditorLayoutProps extends LayoutProps {
  sidebar: React.ReactNode;
  tabbar: React.ReactNode;
  toast: React.ReactNode;
}

export const metadata: Metadata = {
  title: 'AI Notes',
  description: 'RAG-based AI powered knowledge base',
};

const EditorLayout = ({
  children,
  sidebar,
  tabbar,
  toast,
}: EditorLayoutProps) => {
  return (
    <html lang='en'>
      <body>
        <ToastProvider>
          <AiProvider>
            <QueryProvider>
              <div className='grid-max-auto grid bg-base-100'>
                {sidebar}
                <div className='grid-nav-auto grid h-dvh'>
                  {tabbar}
                  <main className='flex max-h-dvh w-full flex-col overflow-y-auto'>
                    {children}
                    <Shortcuts />
                    <Settings />
                    <Search />
                  </main>
                </div>
                {toast}
              </div>
            </QueryProvider>
          </AiProvider>
        </ToastProvider>
      </body>
    </html>
  );
};

export default EditorLayout;
