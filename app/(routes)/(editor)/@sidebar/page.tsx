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

const Sidebar = () => {
  const { isMinWidth } = useBreakpoint('lg');
  const { files } = useFilesQuery();

  const [isOpen, setIsOpen] = useState(true);
  const searchRef = useRef<HTMLDialogElement | null>(null);

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
          onClick={() => searchRef?.current?.showModal()}
        >
          <BsSearch className='mx-auto h-4 w-4' />
        </ButtonSquare>
        <ButtonSquare className='tooltip tooltip-right' size='sm' tip='Chat'>
          <BsChatDots className='mx-auto h-4 w-4' />
        </ButtonSquare>
        <ButtonSquare className='tooltip tooltip-right' size='sm' tip='Graph'>
          <PiGraphLight className='mx-auto h-6 w-6' />
        </ButtonSquare>
      </SidebarShortcuts>
      <SidebarDrawer isOpen={isOpen}>
        <SidebarFileTree files={files} />
      </SidebarDrawer>
      <Search ref={searchRef} />
    </nav>
  );
};

export default Sidebar;
