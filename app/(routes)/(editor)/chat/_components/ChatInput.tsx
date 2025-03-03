'use client';

import { FormEvent, useState } from 'react';

import ButtonSquare from '@/app/_components/ButtonSquare';
import { VscSend } from 'react-icons/vsc';

const ChatInput = ({ onSubmit }: { onSubmit: (m: string) => void }) => {
  const [value, setValue] = useState('');
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(value);
  };

  return (
    <form
      className='textarea flex w-full max-w-2xl items-center gap-4 rounded-box bg-base-200 pr-2'
      onSubmit={handleSubmit}
    >
      <textarea
        placeholder='Send a message'
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className='h-24 flex-1 resize-none bg-transparent focus-visible:outline-none'
      />
      <ButtonSquare size='md' className='btn-neutral self-end'>
        <VscSend className='h-6 w-6' />
      </ButtonSquare>
    </form>
  );
};

export default ChatInput;
