interface LayoutProps {
  children: React.ReactNode;
}

interface FileNode {
  name: string;
  path: string;
  extension?: string;
  content?: any;
  children?: FileNode[];
}

enum FileType {
  FILE = 'file',
  DIR = 'dir'
}
