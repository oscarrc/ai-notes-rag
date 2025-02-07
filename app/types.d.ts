interface LayoutProps {
  children: React.ReactNode;
}

interface FileNode {
  name: string;
  path: string;
  extension?: string;
  children?: FileNode[];
}

enum FileType {
  FILE = 'file',
  DIR = 'dir'
}
