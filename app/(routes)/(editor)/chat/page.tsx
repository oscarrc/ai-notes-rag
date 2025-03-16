'use client';

import { AiStatus } from '@/app/_providers/AiProvider';
import ChatAnswer from './_components/ChatAnswer';
import ChatInput from './_components/ChatInput';
import ChatQuestion from './_components/ChatQuestion';
import { useAi } from '@/app/_hooks/useAi';
import { useCallback } from 'react';

const ChatTab = () => {
  const { conversation, status, generateAnswer, stopper } = useAi();

  const hasConversation = conversation.length > 1;

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      try {
        await generateAnswer(text);
      } catch (error) {
        console.error('Error in chat submission:', error);
      }
    },
    [generateAnswer]
  );

  const handleStop = useCallback(() => {
    if (stopper.current) {
      stopper.current.interrupt();
    }
  }, [stopper]);

  return (
    <section className='flex flex-1 flex-col justify-end p-8'>
      <div
        className={`flex flex-1 flex-col items-center gap-8 ${status === AiStatus.LOADING || hasConversation ? 'justify-end' : 'justify-center'}`}
      >
        {status === AiStatus.LOADING ||
        status === AiStatus.GENERATING ||
        hasConversation ? (
          conversation.map((h: HistoryMessage, i: number) => {
            const isLatestMessage = i === conversation.length - 1;

            if (h.role === 'user')
              return <ChatQuestion key={`user-${i}`} text={h.content} />;

            if (h.role === 'assistant')
              return (
                <ChatAnswer
                  key={`assistant-${i}`}
                  text={h.content}
                  isGenerating={
                    status === AiStatus.GENERATING && isLatestMessage
                  }
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
        {status === AiStatus.LOADING && (
          <div className='flex w-full max-w-2xl items-center justify-start'>
            <span className='mx-2 block h-2 w-2 animate-ping rounded-full bg-neutral align-middle' />
          </div>
        )}
        <ChatInput
          onSubmit={handleSubmit}
          onStop={handleStop}
          isGenerating={status === AiStatus.GENERATING}
          className={hasConversation ? 'sticky bottom-8' : ''}
        />
      </div>
    </section>
  );
};

export default ChatTab;
