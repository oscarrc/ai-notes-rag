const NewTab = () => {
  return (
    <section className='flex h-full items-center justify-center p-8'>
      <div className='align-center flex max-w-md flex-col gap-16'>
        <h2 className='justify-between text-center text-4xl font-bold'>
          No file is open
        </h2>
        <div className='col-gap-4 grid grid-cols-2 items-center'>
          <button className='btn btn-link justify-end'>Ask AI</button>
          <div className='flex gap-2'>
            <kbd className='kbd kbd-xs'>Ctrl</kbd>
            <kbd className='kbd kbd-xs'>A</kbd>
          </div>
          <button className='btn btn-link justify-end'>Search file</button>
          <div className='flex gap-2'>
            <kbd className='kbd kbd-xs'>Ctrl</kbd>
            <kbd className='kbd kbd-xs'>K</kbd>
          </div>
          <button className='btn btn-link justify-end'>Create file</button>
          <div className='flex gap-2'>
            <kbd className='kbd kbd-xs'>Ctrl</kbd>
            <kbd className='kbd kbd-xs'>N</kbd>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewTab;
