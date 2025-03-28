import { sortFileNodes, insertFile, replaceFile, removeFile, getFilePath } from '../../../app/_utils/files';

describe('sortFileNodes', () => {
  const folders: FileNode[] = [
    { name: 'b-folder', path: '/vault/b-folder', children: [] },
    { name: 'a-folder', path: '/vault/a-folder', children: [] },
  ];
  
  const files: FileNode[] = [
    { name: 'b-file.md', path: '/vault/b-file.md' },
    { name: 'a-file.md', path: '/vault/a-file.md' },
  ];
  
  const mixedNodes = [...folders, ...files];
  
  it('places folders before files', () => {
    const sorted = sortFileNodes(mixedNodes);
    
    // First two elements should be folders
    expect(sorted[0].children).toBeDefined();
    expect(sorted[1].children).toBeDefined();
    
    // Last two elements should be files
    expect(sorted[2].children).toBeUndefined();
    expect(sorted[3].children).toBeUndefined();
  });
  
  it('sorts folders alphabetically', () => {
    const sorted = sortFileNodes(mixedNodes);
    
    // First folder should be 'a-folder'
    expect(sorted[0].name).toBe('a-folder');
    expect(sorted[1].name).toBe('b-folder');
  });
  
  it('sorts files alphabetically', () => {
    const sorted = sortFileNodes(mixedNodes);
    
    // Check the files are sorted alphabetically
    expect(sorted[2].name).toBe('a-file.md');
    expect(sorted[3].name).toBe('b-file.md');
  });
});

describe('insertFile', () => {
  // Root level files and folders
  const rootFolder: FileNode = { name: 'folder', path: '/vault/folder', children: [] };
  const rootFile: FileNode = { name: 'file.md', path: '/vault/file.md' };
  
  // Nested files and folders
  const nestedFolder: FileNode = {
    name: 'folder',
    path: '/vault/folder',
    children: [
      { name: 'nested-file.md', path: '/vault/folder/nested-file.md' }
    ]
  };
  
  it('inserts a file into the root level', () => {
    const files: FileNode[] = [rootFolder];
    const newFile = rootFile;
    
    const result = insertFile(files, newFile);
    
    expect(result).toHaveLength(2);
    expect(result[1].name).toBe('file.md');
  });
  
  it('inserts a file into a nested folder', () => {
    const files: FileNode[] = [nestedFolder];
    const newFile: FileNode = { name: 'new-file.md', path: '/vault/folder/new-file.md' };
    
    const result = insertFile(files, newFile);
    
    // The folder should now have 2 children
    expect(result[0].children).toHaveLength(2);
    // It should contain our new file
    expect(result[0].children?.some(child => child.name === 'new-file.md')).toBeTruthy();
  });
});

describe('replaceFile', () => {
  const rootFiles: FileNode[] = [
    { name: 'file.md', path: '/vault/file.md' }
  ];
  
  const nestedFiles: FileNode[] = [
    {
      name: 'folder',
      path: '/vault/folder',
      children: [
        { name: 'nested-file.md', path: '/vault/folder/nested-file.md' }
      ]
    }
  ];
  
  it('replaces a file at the root level', () => {
    const targetNode = rootFiles[0];
    const updatedNode = { 
      name: 'file.md', 
      path: '/vault/file.md',
      content: 'Updated content' 
    };
    
    const result = replaceFile(rootFiles, targetNode, updatedNode);
    
    expect(result[0].content).toBe('Updated content');
  });
  
  it('replaces a nested file', () => {
    const targetNode = nestedFiles[0].children?.[0] as FileNode;
    const updatedNode = { 
      name: 'nested-file.md', 
      path: '/vault/folder/nested-file.md',
      content: 'Updated nested content' 
    };
    
    const result = replaceFile(nestedFiles, targetNode, updatedNode);
    
    expect(result[0].children?.[0].content).toBe('Updated nested content');
  });
});

describe('removeFile', () => {
  const rootFiles: FileNode[] = [
    { name: 'file1.md', path: '/vault/file1.md' },
    { name: 'file2.md', path: '/vault/file2.md' }
  ];
  
  const nestedFiles: FileNode[] = [
    {
      name: 'folder',
      path: '/vault/folder',
      children: [
        { name: 'nested-file1.md', path: '/vault/folder/nested-file1.md' },
        { name: 'nested-file2.md', path: '/vault/folder/nested-file2.md' }
      ]
    }
  ];
  
  it('removes a file at the root level', () => {
    const targetNode = rootFiles[0];
    
    const result = removeFile(rootFiles, targetNode);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('file2.md');
  });
  
  it('removes a nested file', () => {
    const targetNode = nestedFiles[0].children?.[0] as FileNode;
    
    const result = removeFile(nestedFiles, targetNode);
    
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children?.[0].name).toBe('nested-file2.md');
  });
});

describe('getFilePath', () => {
  it('returns default vault path for null file', () => {
    const result = getFilePath(null);
    expect(result).toBe('/vault');
  });
  
  it('returns the folder path for a folder', () => {
    const folder: FileNode = { name: 'folder', path: '/vault/folder', children: [] };
    const result = getFilePath(folder);
    expect(result).toBe('/vault/folder');
  });
  
  it('returns the parent path for a file', () => {
    const file: FileNode = { name: 'file.md', path: '/vault/folder/file.md' };
    const result = getFilePath(file);
    expect(result).toBe('/vault/folder');
  });
});