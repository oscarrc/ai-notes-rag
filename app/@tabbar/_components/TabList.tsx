const TabList = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <div role='tablist' className='tabs tabs-lifted'>
      {children}
    </div>
  );
};

export default TabList;
