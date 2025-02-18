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

interface WorkerState {
  ready: boolean;
  loaded: number;
  result: any;
  getResult: (input: any) => void;
}

type Embedding = Float32Array | number[];

enum FileType {
  FILE = 'file',
  DIR = 'dir',
}
