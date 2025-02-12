import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { removeFile, insertFile, replaceFile } from '../_utils/files';
import useNavigationStore from '../_store/navigationStore';

export const useFilesQuery = () => {
  const queryClient = useQueryClient();
  const { addTab } = useNavigationStore();

  const getFiles = async () => {
    const data = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}api/files`);
    const files = await data.json();
    return files;
  };

  const createFile = async (file: FileNode) => {
    const data = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}api/files`, {
      method: 'POST',
      body: JSON.stringify(file),
    });

    const newFile = await data.json();
    return newFile;
  };

  const getFile = async (path: string) => {
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/files/${path}`
    );
    const content = await data.json();
    return content;
  };

  const updateFile = async (file: FileNode) => {
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/files/${file.path}`,
      {
        method: 'PUT',
        body: JSON.stringify(file),
      }
    );

    const updatedFile = await data.json();
    return updatedFile;
  };

  const deleteFile = async (file: FileNode) => {
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/files/${file.path}`,
      {
        method: 'DELETE',
      }
    );

    const deleted = await data.json();
    return deleted;
  };

  const {
    data: files,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['files'],
    queryFn: getFiles,
  });

  const file = (path: string) =>
    useQuery({
      queryKey: ['files', path],
      queryFn: async () => await getFile(path),
    });

  const createMutation = useMutation({
    mutationFn: (file: FileNode) => createFile(file),
    onSuccess: (newFile) => {
      queryClient.setQueryData(['files'], (files: FileNode[]) =>
        insertFile(files, newFile)
      );
      addTab(newFile);
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
    file,
    refetch,
    isLoading,
    createFile: createMutation.mutate,
    updateFile: updateMutation.mutate,
    deleteFile: deleteMutation.mutate,
  };
};
