'use client';

import {
  VscNewFile,
  VscNewFolder,
  VscRefresh,
  VscTrash,
} from 'react-icons/vsc';
import ButtonSquare from '@/app/_components/ButtonSquare';
import { useFilesQuery } from '@/app/_hooks/useFilesQuery';
import useNavigationStore from '@/app/_store/navigationStore';
import { getFilePath } from '@/app/_utils/files';

interface SidebarDrawerProps extends LayoutProps {
  isOpen: boolean;
}

const SidebarDrawer = ({ isOpen, children }: SidebarDrawerProps) => {
  const { createFile, deleteFile, refetch } = useFilesQuery();
  const { selectedNode } = useNavigationStore();

  return (
    <div
      className={`grid-nav-auto relative grid overflow-hidden overflow-x-hidden transition-all duration-500 ${!isOpen ? 'w-0' : 'w-80'}`}
    >
      <div className='flex min-h-10 items-center gap-4 border-b border-base-300 bg-base-200 p-0 px-2'>
        <ButtonSquare
          size='sm'
          onClick={() =>
            createFile({
              name: 'New File',
              path: getFilePath(selectedNode),
              extension: '.md',
            })
          }
        >
          <VscNewFile className='h-4 w-4' />
        </ButtonSquare>
        <ButtonSquare
          size='sm'
          onClick={() =>
            createFile({ name: 'New Folder', path: getFilePath(selectedNode) })
          }
        >
          <VscNewFolder className='h-4 w-4' />
        </ButtonSquare>
        <ButtonSquare
          size='sm'
          onClick={() => selectedNode && deleteFile(selectedNode)}
        >
          <VscTrash className='h-4 w-4' />
        </ButtonSquare>
        <ButtonSquare size='sm' onClick={refetch}>
          <VscRefresh className='h-4 w-4' />
        </ButtonSquare>
      </div>
      <div className='relative flex flex-col overflow-y-auto'>
        {children}
        <div className='absolute right-0 h-full w-px cursor-col-resize bg-base-300'></div>
      </div>
    </div>
  );
};

export default SidebarDrawer;
