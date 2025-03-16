'use client';

import Breadcrumbs from '@/app/_components/Breadcrumbs';
import MarkdownEditor from '@/app/(routes)/(editor)/vault/_components/editor';
import { useAi } from '@/app/_hooks/useAi';
import { useCallback } from 'react';
import { useFilesQuery } from '@/app/_hooks/useFilesQuery';
import { usePathname } from 'next/navigation';

const Editor = () => {
  const pathname = usePathname();
  const vault = process.env.NEXT_PUBLIC_VAULT_PATH || '/vault';
  const filePath = decodeURI(pathname.replace(vault, ''));
  const { getFile, updateFile, file } = useFilesQuery();
  const { data } = getFile(filePath);
  const { getEmbeddings, saveEmbeddings } = useAi();

  const handleUpdate = useCallback(
    async (markdown: string, text: string) => {
      const currentFile = (await file(filePath)) as FileNode;
      if (!currentFile) return;

      const { name, path } = currentFile;
      const embbeddings = await getEmbeddings(text);

      updateFile({ ...currentFile, content: markdown });
      saveEmbeddings({ name, path, content: text, vector: embbeddings });
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
