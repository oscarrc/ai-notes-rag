import { VscCopy, VscRefresh, VscSave } from 'react-icons/vsc';

import ButtonSquare from '@/app/_components/ButtonSquare';

interface ChatAnswerProps {
  text: string;
  isGenerating: boolean;
}

const ChatAnswer = ({ text, isGenerating }: ChatAnswerProps) => {
  return (
    <div className='flex w-full max-w-2xl flex-col gap-4'>
      <div className='flex flex-col gap-4 rounded-box p-4'>
        <div className='prose'>{text}</div>
        {!isGenerating && (
          <div className='flex flex-1 justify-end gap-2'>
            <div className='badge badge-neutral badge-outline badge-md'>
              Source 1
            </div>
            <div className='badge badge-neutral badge-outline badge-md'>
              Source 2
            </div>
            <div className='badge badge-neutral badge-outline badge-md'>
              Source 3
            </div>
          </div>
        )}
      </div>
      {!isGenerating && (
        <div className='flex w-full gap-2'>
          <ButtonSquare size='xs' className='opacity-75 hover:opacity-100'>
            <VscCopy className='h-4 w-4' />
          </ButtonSquare>
          <ButtonSquare size='xs' className='opacity-75 hover:opacity-100'>
            <VscSave className='h-4 w-4' />
          </ButtonSquare>
          <ButtonSquare size='xs' className='opacity-75 hover:opacity-100'>
            <VscRefresh className='h-4 w-4' />
          </ButtonSquare>
        </div>
      )}
    </div>
  );
};

export default ChatAnswer;
