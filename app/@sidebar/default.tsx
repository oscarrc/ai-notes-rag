'use client';

import { BsChatDots, BsSearch } from 'react-icons/bs';
import { chatTab, graphTab } from '@/app/_utils/tabs';
import { useEffect, useState } from 'react';

import ButtonSquare from '@/app/_components/ButtonSquare';
import { PiGraphLight } from 'react-icons/pi';
import SidebarDrawer from './_components/SidebarDrawer';
import SidebarFileTree from './_components/SidebarFileTree';
import SidebarShortcuts from './_components/SidebarShortcuts';
import SidebarSkeleton from './_components/SidebarSkeleton';
import { showModal } from '@/app/_utils/modals';
import useBreakpoint from '@/app/_hooks/useBreakpoint';
import { useFilesQuery } from '@/app/_hooks/useFilesQuery';
import useNavigationStore from '@/app/_store/navigationStore';

const Sidebar = () => {
  const { isMinWidth } = useBreakpoint('lg');
  const { files, isLoading, moveFile } = useFilesQuery();
  const { addTab } = useNavigationStore();

  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setIsOpen(isMinWidth);
  }, [isMinWidth]);

  return (
    <nav className='flex h-dvh flex-row'>
      <SidebarShortcuts onToggle={() => setIsOpen((o) => !o)}>
        <ButtonSquare
          className='tooltip tooltip-right'
          size='sm'
          tip='Search'
          onClick={() => showModal('search')}
        >
          <BsSearch className='mx-auto h-4 w-4' />
        </ButtonSquare>
        <ButtonSquare
          className='tooltip tooltip-right'
          size='sm'
          tip='Chat'
          onClick={() => addTab(chatTab)}
        >
          <BsChatDots className='mx-auto h-4 w-4' />
        </ButtonSquare>
        <ButtonSquare
          className='tooltip tooltip-right'
          size='sm'
          tip='Graph'
          onClick={() => addTab(graphTab)}
        >
          <PiGraphLight className='mx-auto h-6 w-6' />
        </ButtonSquare>
      </SidebarShortcuts>
      <SidebarDrawer isOpen={isOpen}>
        {isLoading ? (
          <SidebarSkeleton />
        ) : (
          <SidebarFileTree files={files} onMoveFile={moveFile} />
        )}
      </SidebarDrawer>
    </nav>
  );
};

export default Sidebar;
