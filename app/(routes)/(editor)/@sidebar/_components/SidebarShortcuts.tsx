'use client';

import ButtonSquare from '@/app/_components/ButtonSquare';
import { showModal } from '@/app/_utils/modals';
import { VscLayoutSidebarLeft, VscSettingsGear } from 'react-icons/vsc';

interface SidebarActionsProps {
  onToggle: () => void;
  children: React.ReactNode;
}

const SidebarShortcuts = ({ onToggle, children }: SidebarActionsProps) => {
  return (
    <div className='grid-nav-auto grid border-r-2 border-neutral'>
      <div className='flex items-center justify-center border-b border-base-300 bg-base-200 px-2'>
        <ButtonSquare className='mx-auto' size='sm' onClick={onToggle}>
          <VscLayoutSidebarLeft className='h-4 w-4' />
        </ButtonSquare>
      </div>
      <div className='flex flex-1 flex-col items-center p-2'>
        <div className='flex flex-1 flex-col gap-2'>{children}</div>
        <ButtonSquare
          className='tooltip tooltip-right'
          size='sm'
          tip='Settings'          
          onClick={() => showModal('settings')}
        >
          <VscSettingsGear className='mx-auto h-4 w-4' />
        </ButtonSquare>
      </div>      
    </div>
  );
};

export default SidebarShortcuts;
