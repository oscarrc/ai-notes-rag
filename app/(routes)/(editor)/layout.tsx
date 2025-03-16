import Search from '@/app/_components/Search';
import Settings from '@/app/_components/Settings';
import Shortcuts from '@/app/_components/Shortcuts';

interface EditorLayoutProps extends LayoutProps {
  sidebar: React.ReactNode;
  tabbar: React.ReactNode;
}

const EditorLayout = ({ children, sidebar, tabbar }: EditorLayoutProps) => {
  return (
    <div className='grid-max-auto grid bg-base-100'>
      {sidebar}
      <div className='grid-nav-auto grid h-dvh'>
        {tabbar}
        <main className='flex max-h-dvh w-full flex-col overflow-y-auto'>
          {children}
          <Shortcuts />
          <Settings />
          <Search />
        </main>
      </div>
    </div>
  );
};

export default EditorLayout;
