import fs from 'fs';
import path from 'path';

const DATA_PATH = process.env.NEXT_PUBLIC_DATA_PATH || 'data';
const VAULT_PATH = process.env.NEXT_PUBLIC_VAULT_PATH || 'vault';
const BASE_PATH = `/${DATA_PATH}/${VAULT_PATH}/`.replace('//', '');

export const fetchFiles = (dir: string, relativePath = ''): FileNode[] => {
  const results: FileNode[] = [];
  const baseDir = path.join(process.cwd(), dir);
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativeEntryPath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      results.push({
        name: entry.name,
        path: `${VAULT_PATH}/${relativeEntryPath}`,
        children: fetchFiles(fullPath, relativeEntryPath),
      });
    } else {
      const ext = path.extname(entry.name);
      results.push({
        name: path.basename(entry.name, ext),
        path: `${VAULT_PATH}/${relativeEntryPath}`,
        extension: ext,
      });
    }
  }

  return results;
};

const getUniqueName = (
  dir: string,
  baseName: string,
  extension?: string
): string => {
  if(!fs.existsSync(dir)){
    return extension ? `${baseName}${extension}` : baseName;
  }

  const files = new Set(fs.readdirSync(dir));

  if (!files.has(extension ? `${baseName}${extension}` : baseName)) {
    return extension ? `${baseName}${extension}` : baseName;
  }

  const regex = new RegExp(
    `^${baseName} \\((\\d+)\\)${extension ? `\\${extension}` : ''}$`
  );
  const existingNumbers = new Set<number>();

  for (const file of files) {
    const match = file.match(regex);
    if (match) existingNumbers.add(Number(match[1]));
  }

  let count = 1;
  while (existingNumbers.has(count)) count++;

  return extension
    ? `${baseName} (${count})${extension}`
    : `${baseName} (${count})`;
};

export const createFile = (baseDir: string, item: FileNode): FileNode => {
  const targetDir = path.join(process.cwd(), baseDir, item.path);
  const uniqueName = getUniqueName(targetDir, item.name, item.extension);
  const newPath = path.join(targetDir, uniqueName);

  if (item?.extension) {
    // If target do note exist, create it
    if (!fs.existsSync(targetDir)){
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    fs.writeFileSync(newPath, item?.content || '', 'utf-8');
    return {
      name: path.basename(uniqueName, item.extension),
      path: `${item.path}/${uniqueName}`,
      extension: item.extension,
    };
  } else {
    fs.mkdirSync(newPath, { recursive: true });   
    return {
      name: uniqueName,
      path: `${item.path}/${uniqueName}`,
      children: [],
    };
  }
};

export const getFile = (filePath: string[]): FileNode | null => {
  const fullPath = path.join(BASE_PATH, ...filePath);

  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory())
    return null;

  const name = path.basename(fullPath, path.extname(fullPath));
  const extension = path.extname(fullPath);
  const content = fs.readFileSync(fullPath, 'utf-8');

  return { name, path: path.join(VAULT_PATH, ...filePath), extension, content };
};

export const updateFile = (
  filePath: string[],
  fileNode: FileNode
): FileNode | null => {
  const absolutePath = path.join(process.cwd(), DATA_PATH, ...filePath);
  if (!fs.existsSync(absolutePath)) throw new Error('File not found');

  const isFile = !!fileNode.extension;
  const newPath = path.join(process.cwd(), DATA_PATH, fileNode.path);

  if (newPath && newPath !== absolutePath) {
    fs.renameSync(absolutePath, newPath);
  }

  if (isFile && fileNode.content !== undefined) {
    fs.writeFileSync(newPath, fileNode.content, 'utf-8');
  }

  return { ...fileNode, path: fileNode.path };
};

export const deleteFile = (filePath: string): void => {
  const absolutePath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) throw new Error('File not found');

  const stat = fs.statSync(absolutePath);

  if (stat.isDirectory()) {
    fs.rmSync(absolutePath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(absolutePath);
  }
};

export function extractFilePaths(node: FileNode, paths: string[] = []): string[] {
  if (node.extension && node.extension === '.md') {
    paths.push(node.path);
  }
  
  if (node.children) {
    for (const child of node.children) {
      extractFilePaths(child, paths);
    }
  }
  
  return paths;
}

export function moveFile(sourcePath: string[], targetPath: string): FileNode {
    const absoluteSourcePath = path.join(process.cwd(), DATA_PATH, ...sourcePath);    
    const name = path.basename(absoluteSourcePath, path.extname(absoluteSourcePath));    
    const extension = path.extname(absoluteSourcePath);
    const absoluteTargetPath = path.join(process.cwd(), DATA_PATH, targetPath, name + extension);

    if (!fs.existsSync(absoluteSourcePath)) {
      throw new Error(`Source file does not exist: ${absoluteSourcePath}`);
    }

    const targetDir = path.dirname(absoluteTargetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Store source information before moving
    const isDirectory = fs.statSync(absoluteSourcePath).isDirectory();
    const originalPathPrefix = path.join(VAULT_PATH, ...sourcePath);
    const newPathPrefix = path.join(VAULT_PATH, targetPath, name + extension);

    // Perform the file or directory move
    fs.renameSync(absoluteSourcePath, absoluteTargetPath);
    
    // Return info based on whether it's a file or directory
    if (isDirectory) {
      return {
        name,
        path: path.join(VAULT_PATH, targetPath, name),
        children: [],
        _pathMapping: {
          from: originalPathPrefix,
          to: newPathPrefix
        }
      };
    } else {
      return { 
        name, 
        path: path.join(VAULT_PATH, targetPath, name + extension), 
        extension,
        _pathMapping: {
          from: originalPathPrefix,
          to: newPathPrefix  
        }
      };
    }
}

export function renameFile(sourcePath: string[], newName: string): FileNode {
    const absoluteSourcePath = path.join(process.cwd(), DATA_PATH, ...sourcePath);
    if (!fs.existsSync(absoluteSourcePath)) {
      throw new Error(`Source file does not exist: ${absoluteSourcePath}`);
    }
    
    const sourceDir = path.dirname(absoluteSourcePath);
    const extension = path.extname(absoluteSourcePath);
    const isDirectory = fs.statSync(absoluteSourcePath).isDirectory();
    
    const absoluteTargetPath = path.join(sourceDir, newName + (isDirectory ? '' : extension));
    
    const relativeDirPath = path.relative(
      path.join(process.cwd(), DATA_PATH),
      sourceDir
    );
    
    const originalPathPrefix = path.join(VAULT_PATH, ...sourcePath);
    const parentVaultPath = originalPathPrefix.substring(0, originalPathPrefix.lastIndexOf('/'));
    const newPathPrefix = path.join(parentVaultPath, newName + (isDirectory ? '' : extension));
    
    fs.renameSync(absoluteSourcePath, absoluteTargetPath);
    
    if (isDirectory) {
      return {
        name: newName,
        path: newPathPrefix,
        children: [],
        _pathMapping: { 
          from: originalPathPrefix,
          to: newPathPrefix
        }
      };
    } else {
      return {
        name: newName, 
        path: newPathPrefix,
        extension,
        _pathMapping: {
          from: originalPathPrefix,
          to: newPathPrefix
        }
      };
    }
}