import ButtonSquare from '@/app/_components/ButtonSquare';
import { VscCopy, VscSave, VscRefresh } from 'react-icons/vsc';

interface ChatAnswerProps {
  text: string;
}

const ChatAnswer = ({ text }: ChatAnswerProps) => {
  return (
    <div className='flex w-full max-w-2xl flex-col gap-4'>
      <div className='flex flex-col gap-4 rounded-box p-4'>
        <div className='prose'>{text}</div>
        <div className='flex flex-1 justify-end gap-2'>
          <div className='badge badge-neutral badge-md'>Source 1</div>
          <div className='badge badge-neutral badge-md'>Source 2</div>
          <div className='badge badge-neutral badge-md'>Source 3</div>
        </div>
      </div>
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
    </div>
  );
};

export default ChatAnswer;
