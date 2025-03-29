interface LayoutProps {
  children: React.ReactNode;
}

interface FileNode {
  name: string;
  path: string;
  extension?: string;
  content?: any;
  children?: FileNode[];
  _pathMapping?: {
    from: string;
    to: string;
  };
}

interface WorkerState {
  ready: boolean;
  loaded: number;
  result: any;
  getResult: (input: any) => void;
}

type Embedding = Float32Array | number[];

interface EmbeddingRecord {
  name: string;
  path: string;
  content: string;
  vector: Embedding
}

interface HistoryMessage {
  role: 'user' | 'assistant' | 'system' | 'context';
  content: string | string[];
  sources?: FileNode[];
}

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string | React.ReactNode;
  type: ToastType;
  duration?: number;
  progress?: number;
}

interface AiPerformance {
  tps: number;
  numTokens: number;
  totalTime: number;
}

enum FileType {
  FILE = 'file',
  DIR = 'dir',
}

enum AiStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
}