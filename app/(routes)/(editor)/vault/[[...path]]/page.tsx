'use client';

import Breadcrumbs from '@/app/_components/Breadcrumbs';
import MarkdownEditor from '@/app/(routes)/(editor)/vault/_components/editor';
import { useFilesQuery } from '@/app/_hooks/useFilesQuery';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { useEmbeddings } from '@/app/_hooks/useEmbeddings';

const Editor = () => {
  const pathname = usePathname();
  const vault = process.env.NEXT_PUBLIC_VAULT_PATH || '/vault';
  const filePath = decodeURI(pathname.replace(vault, ''));
  const { getFile, updateFile, file } = useFilesQuery();
  const { data } = getFile(filePath);
  const { calculateEmbeddings } = useEmbeddings();

  const handleUpdate = useCallback(
    async (markdown: string, text: string) => {
      const currentFile = (await file(filePath)) as FileNode;
      if (!currentFile) return;

      updateFile({ ...currentFile, content: markdown });
      const test = await calculateEmbeddings(text, filePath);
      console.log(test)
    },
    [file, updateFile]
  );

  return (
    <section className='relative flex flex-1 flex-col items-center gap-4'>
      <aside className='sticky top-0 z-10 w-full p-4'>
        <Breadcrumbs />
      </aside>
      <MarkdownEditor content={data?.content} onChange={handleUpdate} />
    </section>
  );
};

export default Editor;
