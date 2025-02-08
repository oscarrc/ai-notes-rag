import Breadcrumbs from '@/app/_components/Breadcrumbs';
import MdEditor from '@/app/_components/MarkdownEditor';

const Editor = () => {
  return (
    <section className='relative flex flex-1 flex-col items-center gap-4'>
      <aside className='bg sticky top-0 w-full bg-base-100 p-4'>
        <Breadcrumbs />
      </aside>
      <div className='prose flex w-full max-w-6xl flex-1 flex-col p-4'>
        <div className='h-full'>
          <MdEditor />
        </div>
      </div>
    </section>
  );
};

export default Editor;
