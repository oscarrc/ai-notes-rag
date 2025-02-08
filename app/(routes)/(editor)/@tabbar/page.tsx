'use client';

import ButtonSquare from '@/app/_components/ButtonSquare';
import Tab from './_components/Tab';
import TabList from './_components/TabList';
import TabActions from './_components/TabActions';
import TabMenu from './_components/TabMenu';
import { usePathname } from 'next/navigation';
import { VscAdd } from 'react-icons/vsc';
import useNavigationStore from '@/app/_store/navigationStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Tabbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { tabs, activeTab, setActive, addTab, removeTab } =
    useNavigationStore();

  useEffect(() => {
    setActive(pathname);
  }, [pathname]);
  useEffect(() => {
    const activePath = tabs[activeTab].path || '/';
    if (pathname !== activePath) router.push(activePath);
  }, [activeTab, tabs]);

  return (
    <div className='navbar sticky z-50 min-h-10 items-end bg-base-200 p-0'>
      <TabList>
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            file={tab}
            onClose={() => removeTab(activeTab)}
            isActive={activeTab === index}
          />
        ))}
      </TabList>
      <TabActions>
        <ButtonSquare size='xs' className='mt-2' onClick={() => addTab()}>
          <VscAdd className='h-4 w-4' />
        </ButtonSquare>
        <TabMenu />
      </TabActions>
    </div>
  );
};

export default Tabbar;
