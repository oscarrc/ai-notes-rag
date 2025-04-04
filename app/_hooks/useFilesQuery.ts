import { insertFile, removeFile, replaceFile } from '../_utils/files';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useEffect } from 'react';
import useNavigationStore from '../_store/navigationStore';

const vault = process.env.NEXT_PUBLIC_VAULT_PATH || '/vault';

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
  
  const renameFile = async ({ path, newName }: { path: string, newName: string }) => {
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/files/${path}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: newName
        }),
      }
    );

    const renamedFile = await data.json();
    return renamedFile;
  };

  const moveFile = async ({ file, targetPath }: { file: FileNode; targetPath: string }) => {
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/files/${file.path}`,
      {
        method: 'POST',
        body: JSON.stringify({ targetPath }),
      }
    );

    const movedFile = await data.json();
    return movedFile;
  }

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

  const getQuery = (path: string) => {
    const result = useQuery({
      queryKey: ['files', path],
      queryFn: () => getFile(path),
    });

    return result;
  };

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
      queryClient.setQueryData(
        ['files', file.path.replace(vault, '')],
        updatedFile
      );
    },
  });
  
  const renameMutation = useMutation({
    mutationFn: ({ path, newName }: { path: string, newName: string }) => 
      renameFile({ path, newName }),
    onSuccess: () => {
      // Full refetch since renaming might affect multiple files (for folders)
      refetch();
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ file, targetPath }: { file: FileNode; targetPath: string }) => moveFile({ file, targetPath }),
    onSuccess: () => {
      refetch();
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

  const getCurrentFile = (path: string) =>
    queryClient.ensureQueryData({
      queryKey: ['files', path],
      queryFn: () => getFile(path),
    });

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['files'],
      queryFn: getFiles,
    });
  }, [queryClient]);

  return {
    files,
    refetch,
    isLoading,
    file: getCurrentFile,
    getFile: getQuery,
    createFile: createMutation.mutate,
    updateFile: updateMutation.mutate,
    deleteFile: deleteMutation.mutate,
    moveFile: moveMutation.mutate,
    renameFile: renameMutation.mutate,
  };
};
