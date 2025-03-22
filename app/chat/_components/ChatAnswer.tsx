import { VscCopy, VscRefresh, VscSave } from 'react-icons/vsc';

import ButtonSquare from '@/app/_components/ButtonSquare';
import ChatSource from './ChatSource';

interface ChatAnswerProps {
  text: string;
  isGenerating: boolean;
  sources?: FileNode[];
}

const ChatAnswer = ({ text, isGenerating, sources = [] }: ChatAnswerProps) => {
  return text.length ? (
    <div className='flex w-full max-w-2xl flex-col gap-4'>
      <div className='flex flex-col gap-4 rounded-box p-4'>
        <div className='prose'>{text}</div>
        {!isGenerating && sources.length > 0 && (
          <div className='flex flex-1 flex-wrap justify-end gap-2'>
            {sources.map((source, index) => (
              <ChatSource key={`source-${index}`} source={source} />
            ))}
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
  ) : null;
};

export default ChatAnswer;
