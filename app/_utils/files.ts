const VAULT_PATH = process.env.NEXT_PUBLIC_VAULT_PATH || '/vault';

export const insertFile = (
  files: FileNode[],
  newFile: FileNode
): FileNode[] => {
  const parentPath = newFile.path.substring(0, newFile.path.lastIndexOf('/'));

  // If the parent is "/vault", insert at the root level
  if (parentPath === VAULT_PATH) {
    return [...files, newFile];
  }

  const insertRecursively = (nodes: FileNode[]): FileNode[] => {
    return nodes.map((node) => {
      if (!node.children) return node;

      if (node.path === parentPath) {
        return { ...node, children: [...node.children, newFile] };
      }

      return { ...node, children: insertRecursively(node.children) };
    });
  };

  return insertRecursively(files);
};

export const replaceFile = (
  files: FileNode[],
  targetNode: FileNode,
  updatedNode: FileNode
): FileNode[] => {
  const targetPath = targetNode.path;

  if (files.some((node) => node.path === targetPath)) {
    return files.map((node) => (node.path === targetPath ? updatedNode : node));
  }

  const replaceRecursively = (nodes: FileNode[]): FileNode[] => {
    return nodes.map((node) => {
      if (!node.children) return node;

      return {
        ...node,
        children: replaceRecursively(node.children).map((child) =>
          child.path === targetPath ? updatedNode : child
        ),
      };
    });
  };

  return replaceRecursively(files);
};

export const removeFile = (
  files: FileNode[],
  targetNode: FileNode
): FileNode[] => {
  const targetPath = targetNode.path;

  if (files.some((node) => node.path === targetPath)) {
    return files.filter((node) => node.path !== targetPath);
  }

  const deleteRecursively = (nodes: FileNode[]): FileNode[] => {
    return nodes
      .map((node) => {
        if (!node.children) return node;

        return { ...node, children: deleteRecursively(node.children) };
      })
      .filter((node) => node.path !== targetPath);
  };

  return deleteRecursively(files);
};

export const getFilePath = (file: FileNode | null) => {
  if (!file) return process.env.NEXT_PUBLIC_VAULT_PATH || '/vault';
  if (file?.children) return file.path;
  return file.path.substring(0, file.path.lastIndexOf('/'));
};
