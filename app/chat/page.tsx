'use client';

import { AiStatus } from '@/app/_providers/AiProvider';
import ChatAnswer from './_components/ChatAnswer';
import ChatInput from './_components/ChatInput';
import ChatQuestion from './_components/ChatQuestion';
import { useAi } from '@/app/_hooks/useAi';
import { useCallback } from 'react';
import { useToast } from '../_hooks/useToast';

const ChatTab = () => {
  const {
    conversation,
    status,
    generateAnswer,
    stopGeneration,
    regenerateAnswer,
    regeneratingIndex,
  } = useAi();

  const { showToast } = useToast();

  const hasConversation = conversation.length > 0;

  const showPerformance = (performance: AiPerformance) => {
    if (!performance) return;

    showToast({
      message: (
        <>
          Generation complete: <br />
          Generated {performance.numTokens} tokens in{' '}
          {(performance.totalTime / 1000).toFixed(2)} seconds. <br />
          {performance.tps.toFixed(2)} tokens per second. <br />
          Time to first token: {(performance.ttf / 1000).toFixed(2)} seconds.
        </>
      ),
      type: 'success',
      duration: 15000,
    });
  };

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      try {
        const result = await generateAnswer(text);
        console.log(result);
        showPerformance(result?.performance);
      } catch (error) {
        console.error('Error in chat submission:', error);
      }
    },
    [generateAnswer]
  );

  const handleRegenerate = useCallback(
    (messageIndex: number) => {
      if (status !== AiStatus.GENERATING && status !== AiStatus.LOADING) {
        const result = regenerateAnswer(messageIndex);
        showPerformance(result.performance);
      }
    },
    [status, regenerateAnswer]
  );

  return (
    <section
      className={`flex flex-1 flex-col-reverse overflow-y-auto p-8 ${status === AiStatus.LOADING || hasConversation ? 'justify-start' : 'justify-center'}`}
    >
      <ChatInput
        onSubmit={handleSubmit}
        onStop={stopGeneration}
        isGenerating={
          status === AiStatus.GENERATING || status === AiStatus.LOADING
        }
        className='sticky bottom-0 z-50 min-h-32 self-center'
      />

      <div className='z-0 mb-8 flex flex-col items-center gap-8'>
        {!hasConversation && (
          <h2 className='px-4 text-center text-4xl font-bold'>
            Ask any question about your notes
          </h2>
        )}

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
