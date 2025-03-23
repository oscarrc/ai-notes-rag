// ChatTab.tsx
'use client';

import { useCallback, useEffect } from 'react';

import { AiStatus } from '@/app/_providers/AiProvider';
import ChatAnswer from './_components/ChatAnswer';
import ChatInput from './_components/ChatInput';
import ChatQuestion from './_components/ChatQuestion';
import { useAi } from '@/app/_hooks/useAi';
import { useToast } from '../_hooks/useToast';

const ChatTab = () => {
  const {
    conversation,
    status,
    generateAnswer,
    stopGeneration,
    performance,
    regenerateAnswer,
    regeneratingIndex,
  } = useAi();

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

  const handleRegenerate = useCallback(
    (messageIndex: number) => {
      if (status !== AiStatus.GENERATING && status !== AiStatus.LOADING) {
        regenerateAnswer(messageIndex);
      }
    },
    [status, regenerateAnswer]
  );

  useEffect(() => {
    if (status === AiStatus.IDLE && conversation.length > 0) {
      showToast({
        message: (
          <>
            Generation complete: Generated {performance.numTokens} tokens in{' '}
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
    <section
      className={`flex flex-1 flex-col-reverse overflow-y-auto p-8 ${status === AiStatus.LOADING || hasConversation ? 'justify-start' : 'justify-center'}`}
    >
      {/* ChatInput at the bottom visually, but at the start of the flex container */}
      <ChatInput
        onSubmit={handleSubmit}
        onStop={stopGeneration}
        isGenerating={
          status === AiStatus.GENERATING || status === AiStatus.LOADING
        }
        className='z-5 sticky bottom-0 min-h-32 self-center'
      />

      {/* Messages container - visually above the input due to flex-col-reverse */}
      <div className='z-0 mb-8 flex flex-col items-center gap-8'>
        {/* Empty state message */}
        {!hasConversation && (
          <h2 className='px-4 text-center text-4xl font-bold'>
            Ask any question about your notes
          </h2>
        )}

        {/* Conversation messages in normal order now */}
        {hasConversation &&
          conversation.map((h: HistoryMessage, i: number) => {
            if (h.role === 'user')
              return (
                <ChatQuestion key={`user-${i}`} text={h.content as string} />
              );

            if (h.role === 'assistant')
              return (
                <ChatAnswer
                  key={`assistant-${i}`}
                  text={h.content}
                  messageIndex={i}
                  isCurrent={i === conversation.length - 1}
                  isGenerating={
                    status === AiStatus.GENERATING ||
                    status === AiStatus.LOADING
                  }
                  isBeingRegenerated={regeneratingIndex === i}
                  onRegenerate={handleRegenerate}
                  sources={h.sources || []}
                />
              );

            return null;
          })}

        {status === AiStatus.LOADING && regeneratingIndex === null && (
          <div className='flex w-full max-w-2xl items-center justify-start'>
            <span className='mx-2 block h-2 w-2 animate-ping rounded-full bg-neutral align-middle' />
          </div>
        )}
      </div>
    </section>
  );
};

export default ChatTab;
