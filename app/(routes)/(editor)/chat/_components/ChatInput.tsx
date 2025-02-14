'use client';

import ButtonSquare from '@/app/_components/ButtonSquare';
import { FormEvent } from 'react';
import { VscSend } from 'react-icons/vsc';

const ChatInput = () => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <form
      className='textarea flex w-full max-w-2xl items-center gap-4 rounded-box bg-base-200 pr-2'
      onSubmit={handleSubmit}
    >
      <textarea
        placeholder='Send a message'
        autoFocus
        className='h-24 flex-1 bg-transparent focus-visible:outline-none resize-none'
      />
      <ButtonSquare size='md' className='btn-neutral self-end'>
        <VscSend className='h-6 w-6' />
      </ButtonSquare>
    </form>
  );
};

export default ChatInput;
