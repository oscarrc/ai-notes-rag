'use client'

import { VscNewFile, VscNewFolder, VscRefresh } from 'react-icons/vsc';
import ButtonSquare from '@/app/_components/ButtonSquare';
import { useFilesQuery } from '@/app/_hooks/useFilesQuery';
import useNavigationStore from '@/app/_store/navigationStore';
import { useMemo } from 'react';

interface SidebarDrawerProps extends LayoutProps {
  isOpen: boolean;
}

const SidebarDrawer = ({ isOpen, children }: SidebarDrawerProps) => {
  const { create, refetch } = useFilesQuery();
  const { selectedNode } = useNavigationStore();

  const filePath = useMemo(() => {
    if(!selectedNode) return process.env.NEXT_PUBLIC_VAULT_PATH || '/vault';
    if(selectedNode?.children) return selectedNode.path;
    return selectedNode.path.substring(0, selectedNode.path.lastIndexOf('/'));
  }, [selectedNode])

  return (
    <div
      className={`grid-nav-auto grid relative overflow-x-hidden transition-all duration-500 overflow-hidden ${!isOpen ? 'w-0' : 'w-80'}`}
    >
      <div className='flex min-h-10 items-center gap-4 bg-base-200 p-0 px-2 border-b border-base-300'>
        <ButtonSquare size='sm' onClick={() => create.mutate({ name: "New File", path: filePath, extension: ".md"})}>
          <VscNewFile className='h-4 w-4' />
        </ButtonSquare>
        <ButtonSquare size='sm' onClick={() => create.mutate({ name: "New Folder", path: filePath })}>
          <VscNewFolder className='h-4 w-4' />
        </ButtonSquare>
        <ButtonSquare size='sm' onClick={refetch}>
          <VscRefresh className='h-4 w-4' />
        </ButtonSquare>
      </div>
      <div className='flex flex-col overflow-y-auto relative'>
        {children}
        <div className='h-full w-px cursor-col-resize bg-base-300 absolute right-0'></div>
      </div>
    </div>
  );
};

export default SidebarDrawer;
