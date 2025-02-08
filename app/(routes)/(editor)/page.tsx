const NewTab = () => {
  return (
    <section className="flex items-center justify-center p-8 h-full">
      <div className="max-w-md flex flex-col align-center gap-16">
        <h2 className="text-4xl font-bold text-center justify-between">No file is open</h2>
        <div className="grid grid-cols-2 items-center col-gap-4">
          <button className="btn btn-link justify-end">Ask AI</button> 
          <div className="flex gap-2">
            <kbd className="kbd kbd-xs">Ctrl</kbd><kbd className="kbd kbd-xs">A</kbd>
          </div>
          <button className="btn btn-link justify-end">Search  file</button> 
          <div className="flex gap-2">
            <kbd className="kbd kbd-xs">Ctrl</kbd><kbd className="kbd kbd-xs">K</kbd>
          </div>
          <button className="btn btn-link justify-end">Create file</button> 
          <div className="flex gap-2">
            <kbd className="kbd kbd-xs">Ctrl</kbd><kbd className="kbd kbd-xs">N</kbd>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewTab;
