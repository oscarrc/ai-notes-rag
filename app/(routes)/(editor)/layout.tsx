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
        </main>
      </div>
    </div>
  );
};

export default EditorLayout;
