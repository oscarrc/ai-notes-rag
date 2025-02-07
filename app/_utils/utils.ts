
export const insertFile = (files: FileNode[], newFile: FileNode): FileNode[] => {
  const parentPath = newFile.path.substring(0, newFile.path.lastIndexOf('/'));

  const insertRecursively = (nodes: FileNode[]): FileNode[] => {
    return nodes.map(node => {
      if (!node.children) return node;

      if (node.path === parentPath) {
        return { ...node, children: [...node.children, newFile] };
      }

      return { ...node, children: insertRecursively(node.children) };
    });
  };
  
  return insertRecursively(files);
};