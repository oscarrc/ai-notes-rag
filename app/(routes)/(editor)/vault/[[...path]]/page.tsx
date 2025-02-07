import Breadcrumbs from '@/app/_components/Breadcrumbs';
import MdEditor from '@/app/_components/MarkdownEditor';

const Editor = () => {
  return (
    <section className='relative flex flex-1 flex-col items-center gap-4'>
      <aside className="sticky top-0 w-full bg p-4 bg-base-100">
        <Breadcrumbs />
      </aside>
      <div className="flex flex-col flex-1 prose w-full max-w-6xl p-4">        
        <div className='h-full'>
          <MdEditor />
        </div>
      </div>
    </section>
  );
};

export default Editor;
