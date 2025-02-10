'use client';

import { useFilesQuery } from '@/app/_hooks/useFilesQuery';
import useNavigationStore from '@/app/_store/navigationStore';
import { getFilePath } from '@/app/_utils/files';
import { showModal } from '@/app/_utils/modals';
import { IS_APPLE } from '@/app/_utils/shortcuts';
import { chatTab } from '@/app/_utils/tabs';

const NewTab = () => {
  const { addTab, selectedNode } = useNavigationStore();
  const { createFile } = useFilesQuery();

  return (
    <section className='flex h-full items-center justify-center p-8'>
      <div className='align-center flex max-w-md flex-col gap-16'>
        <h2 className='text-center text-4xl font-bold'>
          No file is open
        </h2>
        <div className='col-gap-4 grid grid-cols-2 items-center'>
          <button
            className='btn btn-link justify-end'
            onClick={() => addTab(chatTab)}
          >
            Ask AI
          </button>
          <div className='flex gap-2'>
            <kbd className='kbd kbd-xs'>{ IS_APPLE ? 'Cmd' : 'Ctrl' }</kbd>
            <kbd className='kbd kbd-xs'>a</kbd>
          </div>
          <button 
            className='btn btn-link justify-end'
            onClick={ () => showModal('search') }
          >
            Search file
          </button>
          <div className='flex gap-2'>
            <kbd className='kbd kbd-xs'>{ IS_APPLE ? 'Cmd' : 'Ctrl' }</kbd>
            <kbd className='kbd kbd-xs'>k</kbd>
          </div>
          <button
            className='btn btn-link justify-end'
            onClick={() =>
              createFile({
                name: 'New File',
                path: getFilePath(selectedNode),
                extension: '.md',
              })
            }
          >
            Create file
          </button>
          <div className='flex gap-2'>
            <kbd className='kbd kbd-xs'>{ IS_APPLE ? 'Cmd' : 'Ctrl' }</kbd>
            <kbd className='kbd kbd-xs'>f</kbd>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewTab;
