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


interface GraphNode {
  id: string;
  name: string;
  path: string;
  val: number;
  color: string;
  isFolder?: boolean;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
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