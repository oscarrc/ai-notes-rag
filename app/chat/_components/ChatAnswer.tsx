import { VscCopy, VscRefresh, VscSave } from 'react-icons/vsc';

import ButtonSquare from '@/app/_components/ButtonSquare';
import ChatSource from './ChatSource';
import ReactMarkdown from 'react-markdown';
import { getFilePath } from '@/app/_utils/files';
import { useFilesQuery } from '@/app/_hooks/useFilesQuery';
import useNavigationStore from '@/app/_store/navigationStore';
import { useToast } from '@/app/_hooks/useToast';

interface ChatAnswerProps {
  text: string;
  isCurrent: boolean;
  isGenerating: boolean;
  sources?: FileNode[];
}

const ChatAnswer = ({
  text,
  isCurrent,
  isGenerating,
  sources = [],
}: ChatAnswerProps) => {
  const { showToast } = useToast();
  const { createFile } = useFilesQuery();

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(text)
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
      content: text,
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
  return text.length ? (
    <div className='flex w-full max-w-2xl flex-col gap-4'>
      <div className='flex flex-col gap-4 rounded-box p-4'>
        <div className='prose prose-pre:whitespace-pre-wrap'>
          <ReactMarkdown>{text}</ReactMarkdown>
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
        <div className='flex w-full gap-2'>
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
          <ButtonSquare size='xs' className='opacity-75 hover:opacity-100'>
            <VscRefresh className='h-4 w-4' />
          </ButtonSquare>
        </div>
      )}
    </div>
  ) : null;
};

export default ChatAnswer;
