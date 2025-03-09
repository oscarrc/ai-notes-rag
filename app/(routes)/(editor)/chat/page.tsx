'use client';

import ChatAnswer from './_components/ChatAnswer';
import ChatInput from './_components/ChatInput';
import ChatQuestion from './_components/ChatQuestion';
import { Status } from '@/app/_providers/InferenceProvider';
import { useCallback } from 'react';
import { useEmbeddings } from '@/app/_hooks/useEmbeddings';
import { useInference } from '@/app/_hooks/useInference';

const ChatTab = () => {
  const {
    history,
    sendMessage,
    addUserMessage,
    status,
    setStatus,
    stoppingCriteria,
  } = useInference();
  const { getQuery, calculateEmbeddings } = useEmbeddings();

  const hasHistory = history.length > 1;

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      try {
        addUserMessage(text);

        const embeddings = await calculateEmbeddings(text);
        if (!embeddings) {
          console.error('Failed to calculate embeddings');
          setStatus(Status.IDLE);
          return;
        }

        const context = await getQuery(embeddings);
        sendMessage(text, context);
      } catch (error) {
        console.error('Error in chat submission:', error);
        setStatus(Status.IDLE);
      }
    },
    [calculateEmbeddings, getQuery, sendMessage, addUserMessage, setStatus]
  );

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
        {status === Status.LOADING ||
        status === Status.GENERATING ||
        hasHistory ? (
          history.map((h: HistoryMessage, i: number) => {
            const isLatestMessage = i === history.length - 1;

            if (h.role === 'user')
              return <ChatQuestion key={`user-${i}`} text={h.content} />;

            if (h.role === 'assistant')
              return (
                <ChatAnswer
                  key={`assistant-${i}`}
                  text={h.content}
                  isGenerating={status === Status.GENERATING && isLatestMessage}
                  sources={h.sources || []}
                />
              );

            return null;
          })
        ) : (
          <h2 className='px-4 text-center text-4xl font-bold'>
            Ask any question about your notes
          </h2>
        )}
        {status === Status.LOADING && (
          <div className='flex w-full max-w-2xl items-center justify-start'>
            <span className='mx-2 block h-2 w-2 animate-ping rounded-full bg-neutral align-middle' />
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
