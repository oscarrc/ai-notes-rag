const TabActions = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <div className='h-full flex-1 items-center justify-between border-b border-base-300 px-2'>
      {children}
    </div>
  );
};

export default TabActions;
