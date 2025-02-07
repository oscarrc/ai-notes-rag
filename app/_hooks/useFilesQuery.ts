import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { removeFile, insertFile, replaceFile } from '../_utils/utils';

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

  const updateFile = async (file: FileNode) => {
    const data = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/files/${file.path}`, {
      method: 'PUT',
      body: JSON.stringify(file)
    });

    const updatedFile = await data.json();
    return updatedFile;
  }

  const deleteFile = async (file: FileNode) => {
    const data = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/files/${file.path}`, {
      method: 'DELETE'
    });

    const deleted = await data.json();
    return deleted;
  }

  const { data: files, refetch } = useQuery({
    queryKey: ['files'],
    queryFn: getFiles,
  });

  const createMutation = useMutation({
    mutationFn: (file: FileNode) => createFile(file),
    onSuccess: (newFile) => {
      queryClient.setQueryData(['files'], (files: FileNode[]) =>
        insertFile(files, newFile)
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (file: FileNode) => updateFile(file),
    onSuccess: (updatedFile, file) => {
      queryClient.setQueryData(['files'], (files: FileNode[]) =>
        replaceFile(files, file, updatedFile)
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (file: FileNode) => deleteFile(file),
    onSuccess: (_, file) => {
      queryClient.setQueryData(['files'], (files: FileNode[]) =>
        removeFile(files, file)
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
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation
  };
};
