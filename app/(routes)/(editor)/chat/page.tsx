'use client';

import ChatAnswer from './_components/ChatAnswer';
import ChatInput from './_components/ChatInput';
import ChatQuestion from './_components/ChatQuestion';
import { Status } from '@/app/_providers/InferenceProvider';
import { useCallback } from 'react';
import { useEmbeddings } from '@/app/_hooks/useEmbeddings';
import { useInference } from '@/app/_hooks/useInference';

const ChatTab = () => {
  const { history, sources, sendMessage, status, setStatus, stoppingCriteria } =
    useInference();
  const { getQuery, calculateEmbeddings } = useEmbeddings();

  const hasHistory = history.length > 1;

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      try {
        setStatus(Status.LOADING);
        const embeddings = await calculateEmbeddings(text);
        if (!embeddings) {
          console.error('Failed to calculate embeddings');
          return;
        }

        const context = await getQuery(embeddings);

        sendMessage(text, context);
      } catch (error) {
        console.error('Error in chat submission:', error);
        setStatus(Status.IDLE);
      }
    },
    [calculateEmbeddings, getQuery, sendMessage, setStatus]
  );

  // Stop generation when requested
  const handleStop = useCallback(() => {
    if (stoppingCriteria.current) {
      stoppingCriteria.current.interrupt();
    }
  }, [stoppingCriteria]);

  return (
    <section className='flex flex-1 flex-col justify-end p-8'>
      <div
        className={`flex flex-1 flex-col items-center gap-8 ${status === Status.LOADING || hasHistory ? 'justify-end' : 'justify-center'}`}
      >
        {status === Status.LOADING || hasHistory ? (
          history.map((h: HistoryMessage, i: number) => {
            if (h.role === 'user')
              return <ChatQuestion key={`user-${i}`} text={h.content} />;
            else if (h.role === 'assistant')
              return (
                <ChatAnswer
                  key={`assistant-${i}`}
                  text={h.content}
                  isGenerating={status === Status.GENERATING}
                  sources={sources}
                />
              );
            else return null;
          })
        ) : (
          <h2 className='px-4 text-center text-4xl font-bold'>
            Ask any question about your notes
          </h2>
        )}
        {status === Status.LOADING && (
          <div className='flex w-full max-w-2xl items-center justify-start'>
            <span className='mx-2 block h-2 w-2 animate-ping rounded-full bg-base-300 align-middle' />
          </div>
        )}
        <ChatInput
          onSubmit={handleSubmit}
          onStop={handleStop}
          isGenerating={status === Status.GENERATING}
          className={hasHistory ? 'sticky bottom-8' : ''}
        />
      </div>
    </section>
  );
};

export default ChatTab;