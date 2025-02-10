import Breadcrumbs from '@/app/_components/Breadcrumbs';
import MarkdownEditor from '@/app/_components/editor';

const Editor = () => {
  return (
    <section className='relative flex flex-1 flex-col items-center gap-4'>
      <aside className='sticky top-0 w-full p-4'>
        <Breadcrumbs />
      </aside>
      <MarkdownEditor />
    </section>
  );
};

export default Editor;
