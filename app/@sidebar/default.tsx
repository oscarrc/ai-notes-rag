'use client';

import ButtonSquare from '@/app/_components/ButtonSquare';
import useBreakpoint from '@/app/_hooks/useBreakpoint';
import { useEffect, useRef, useState } from 'react';
import SidebarShortcuts from './_components/SidebarShortcuts';
import { BsSearch, BsChatDots } from 'react-icons/bs';
import { PiGraphLight } from 'react-icons/pi';
import SidebarDrawer from './_components/SidebarDrawer';
import { useFilesQuery } from '@/app/_hooks/useFilesQuery';
import SidebarFileTree from './_components/SidebarFileTree';
import Search from '@/app/_components/Search';
import useNavigationStore from '@/app/_store/navigationStore';
import { chatTab, graphTab } from '@/app/_utils/tabs';
import SidebarSkeleton from './_components/SidebarSkeleton';
import { showModal } from '@/app/_utils/modals';

const Sidebar = () => {
  const { isMinWidth } = useBreakpoint('lg');
  const { files, isLoading } = useFilesQuery();
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
        {isLoading ? <SidebarSkeleton /> : <SidebarFileTree files={files} />}
      </SidebarDrawer>
    </nav>
  );
};

export default Sidebar;
