import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { insertFile } from '../_utils/utils';

export const useFilesQuery = () => {
  const queryClient = useQueryClient();

  const getFiles = async () => {
    const data = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/files`);
    const files = await data.json();
    return files;
  };

  const createFile = async (file: FileNode) => {
    const data = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/files`, {
      method: 'POST',
      body: JSON.stringify(file)
    });

    const newFile = await data.json();
    return newFile;
  }

  const { data: files, refetch } = useQuery({
    queryKey: ['files'],
    queryFn: getFiles,
  });

  const createMutation = useMutation({
    mutationFn: (file: FileNode) => createFile(file),
    onSuccess: (newFile) => {
      queryClient.setQueryData(['files'], (files: FileNode[]) =>
        insertFile([...files], newFile)
      );
    },
  });

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['getFiles'],
      queryFn: getFiles,
    });
  }, [queryClient]);

  return {
    files,
    refetch,
    create: createMutation
  };
};
