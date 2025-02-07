'useClient';

import ButtonSquare from '@/app/_components/ButtonSquare';
import useNavigationStore from '@/app/_store/navigationStore';
import { VscFile, VscChevronDown, VscClose } from 'react-icons/vsc';

const TabMenu = () => {
  const { addTab, resetTabs } = useNavigationStore();

  return (
    <div className='flex items-center gap-4 pr-2'>
      <div className='dropdown dropdown-end'>
        <ButtonSquare size='sm'>
          <VscChevronDown className='h-4 w-4' />
        </ButtonSquare>
        <ul
          tabIndex={0}
          className='z-1 menu dropdown-content top-11 w-40 rounded-md bg-base-100 p-2 shadow'
        >
          <li>
            <button
              className='btn-ghost btn-sm cursor-pointer py-1'
              onClick={() => addTab()}
            >
              <VscFile className='h-4 w-4' /> New tab
            </button>
          </li>
          <li>
            <button
              className='btn-ghost btn-sm cursor-pointer py-1'
              onClick={resetTabs}
            >
              <VscClose className='h-4 w-4' /> Close all
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TabMenu;
