// ChatAnswer.tsx

import {
  VscChevronLeft,
  VscChevronRight,
  VscCopy,
  VscRefresh,
  VscSave,
} from 'react-icons/vsc';
import { useEffect, useState } from 'react';

import ButtonSquare from '@/app/_components/ButtonSquare';
import ChatSource from './ChatSource';
import ReactMarkdown from 'react-markdown';
import { getFilePath } from '@/app/_utils/files';
import { useAi } from '@/app/_hooks/useAi';
import { useFilesQuery } from '@/app/_hooks/useFilesQuery';
import { useToast } from '@/app/_hooks/useToast';

interface ChatAnswerProps {
  text: string | string[];
  messageIndex: number;
  isCurrent: boolean;
  isGenerating: boolean;
  isBeingRegenerated: boolean;
  onRegenerate: (messageIndex: number) => void;
  sources?: FileNode[];
}

const ChatAnswer = ({
  text,
  messageIndex,
  isCurrent,
  isGenerating,
  isBeingRegenerated,
  onRegenerate,
  sources = [],
}: ChatAnswerProps) => {
  const { showToast } = useToast();
  const { createFile } = useFilesQuery();
  const { status } = useAi();

  const [answerIndex, setAnswerIndex] = useState(
    Array.isArray(text) ? text.length - 1 : 0
  );

  useEffect(() => {
    if (Array.isArray(text) && text.length > 0) {
      setAnswerIndex(text.length - 1);
    }
  }, [Array.isArray(text) ? text.length : 0]);

  const activeAnswerText = Array.isArray(text) ? text[answerIndex] || '' : text;
  const hasMultipleAnswers = Array.isArray(text) && text.length > 1;

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(activeAnswerText)
      .then(() => {
        showToast({
          message: 'Answer copied to clipboard',
          type: 'success',
          duration: 3000,
        });
      })
      .catch(() => {
        showToast({
          message: 'Failed to copy to clipboard',
          type: 'error',
          duration: 3000,
        });
      });
  };

  const createNote = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const newFile: FileNode = {
      name: `answer-${timestamp}`,
      path: `${getFilePath(null)}/answers`,
      extension: '.md',
      content: activeAnswerText,
    };

    try {
      await createFile(newFile);

      showToast({
        message: 'Note created and opened in new tab',
        type: 'success',
        duration: 3000,
      });
    } catch {
      showToast({
        message: 'Failed to save answer as note',
        type: 'error',
        duration: 3000,
      });
    }
  };

  const handleRegenerate = () => {
    onRegenerate(messageIndex);
  };

  const handlePreviousAnswer = () => {
    if (Array.isArray(text) && answerIndex > 0) {
      setAnswerIndex(answerIndex - 1);
    }
  };

  const handleNextAnswer = () => {
    if (Array.isArray(text) && answerIndex < text.length - 1) {
      setAnswerIndex(answerIndex + 1);
    }
  };

  // Display loading indicator if this specific message is being regenerated
  if (isBeingRegenerated && status === 'loading') {
    return (
      <div className='flex w-full max-w-2xl flex-col gap-4'>
        <div className='flex items-center justify-start p-4'>
          <span className='mx-2 block h-2 w-2 animate-ping rounded-full bg-neutral align-middle' />
          <span className='text-sm text-neutral-500'>
            Regenerating answer...
          </span>
        </div>
      </div>
    );
  }

  // Don't render if no text
  if (!activeAnswerText.length) {
    return null;
  }

  // Otherwise, render the normal answer
  return (
    <div className='flex w-full max-w-2xl flex-col gap-4'>
      <div className='flex flex-col gap-4 rounded-box p-4'>
        <div className='prose prose-pre:whitespace-pre-wrap'>
          <ReactMarkdown>{activeAnswerText}</ReactMarkdown>
        </div>
        {(!isGenerating || !isCurrent) && sources.length > 0 && (
          <div className='flex flex-1 flex-wrap justify-end gap-2'>
            {sources.map((source, index) => (
              <ChatSource key={`source-${index}`} source={source} />
            ))}
          </div>
        )}
      </div>
      {(!isGenerating || !isCurrent) && (
        <div className='flex w-full items-center justify-between'>
          <div className='flex items-center gap-2'>
            <ButtonSquare
              size='xs'
              className='opacity-75 hover:opacity-100'
              onClick={copyToClipboard}
            >
              <VscCopy className='h-4 w-4' />
            </ButtonSquare>
            <ButtonSquare
              size='xs'
              className='opacity-75 hover:opacity-100'
              onClick={createNote}
            >
              <VscSave className='h-4 w-4' />
            </ButtonSquare>
            <ButtonSquare
              size='xs'
              className='opacity-75 hover:opacity-100'
              onClick={handleRegenerate}
              disabled={isGenerating || isBeingRegenerated}
            >
              <VscRefresh className='h-4 w-4' />
            </ButtonSquare>
          </div>
          {hasMultipleAnswers && (
            <div className='flex items-center gap-2 text-xs text-neutral-500'>
              <ButtonSquare
                size='xs'
                className='opacity-75 hover:opacity-100'
                onClick={handlePreviousAnswer}
                disabled={answerIndex === 0}
              >
                <VscChevronLeft className='h-3 w-3' />
              </ButtonSquare>
              <span>
                Answer {answerIndex + 1} of{' '}
                {Array.isArray(text) ? text.length : 1}
              </span>
              <ButtonSquare
                size='xs'
                className='opacity-75 hover:opacity-100'
                onClick={handleNextAnswer}
                disabled={
                  Array.isArray(text) && answerIndex === text.length - 1
                }
              >
                <VscChevronRight className='h-3 w-3' />
              </ButtonSquare>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatAnswer;
