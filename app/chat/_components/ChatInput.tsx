'use client';

import { FormEvent, useState } from 'react';
import { VscDebugStop, VscSend } from 'react-icons/vsc';

import ButtonSquare from '@/app/_components/ButtonSquare';

const ChatInput = ({
  onSubmit,
  onStop,
  className,
  isGenerating,
}: {
  onSubmit: (m: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  className?: string;
}) => {
  const [value, setValue] = useState('');
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isGenerating) {
      onStop();
    } else {
      onSubmit(value);
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(value);
      setValue('');
    }
  };

  return (
    <div
      className={`flex w-full max-w-2xl flex-col gap-2 bg-base-100 p-2 ${className}`}
    >
      <form
        className='textarea flex w-full items-center gap-4 rounded-box bg-base-200 p-2'
        onSubmit={handleSubmit}
      >
        <textarea
          placeholder='Send a message'
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className='h-24 flex-1 resize-none bg-transparent focus-visible:outline-none'
        />
        {isGenerating ? (
          <ButtonSquare size='md' className='btn-neutral self-end'>
            <VscDebugStop className='h-6 w-6' />
          </ButtonSquare>
        ) : (
          <ButtonSquare size='md' className='btn-neutral self-end'>
            <VscSend className='h-6 w-6' />
          </ButtonSquare>
        )}
      </form>
      <p className='text-sm italic text-neutral'>
        This chat uses AI and your notes to answer your questions. Please verify
        the responses.
      </p>
    </div>
  );
};

export default ChatInput;
