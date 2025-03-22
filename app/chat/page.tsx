'use client';

import { useCallback, useEffect } from 'react';

import { AiStatus } from '@/app/_providers/AiProvider';
import ChatAnswer from './_components/ChatAnswer';
import ChatInput from './_components/ChatInput';
import ChatQuestion from './_components/ChatQuestion';
import { useAi } from '@/app/_hooks/useAi';
import { useToast } from '../_hooks/useToast';

const ChatTab = () => {
  const { conversation, status, generateAnswer, stopGeneration, performance } =
    useAi();
  const { showToast } = useToast();

  const hasConversation = conversation.length > 0;

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

  useEffect(() => {
    if (status === AiStatus.IDLE && conversation.length > 0) {
      showToast({
        message: (
          <>
            Generation complete: Generated {performance.numTokens} in{' '}
            {(performance.totalTime / 1000).toFixed(2)} seconds.
            {performance.tps.toFixed(2)} tokens per second
          </>
        ),
        type: 'success',
        duration: 5000,
      });
    }
  }, [status]);

  return (
    <section className='flex flex-1 flex-col justify-end p-8'>
      <div
        className={`flex flex-1 flex-col items-center gap-8 ${status === AiStatus.LOADING || hasConversation ? 'justify-end' : 'justify-center'}`}
      >
        {hasConversation ? (
          conversation.map((h: HistoryMessage, i: number) => {
            if (h.role === 'user')
              return <ChatQuestion key={`user-${i}`} text={h.content} />;

            if (h.role === 'assistant')
              return (
                <ChatAnswer
                  key={`assistant-${i}`}
                  text={h.content}
                  isGenerating={
                    status === AiStatus.GENERATING ||
                    status === AiStatus.LOADING
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
          onStop={stopGeneration}
          isGenerating={
            status === AiStatus.GENERATING || status === AiStatus.LOADING
          }
          className={hasConversation ? 'sticky bottom-8' : ''}
        />
      </div>
    </section>
  );
};

export default ChatTab;
