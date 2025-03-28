import { renderHook, waitFor } from '@testing-library/react';
import { useAi } from '../../../app/_hooks/useAi';
import { AiProvider } from '../../../app/_providers/AiProvider';
import { ReactNode } from 'react';

// Mock the AiProvider context values
jest.mock('../../../app/_providers/AiProvider', () => ({
  AiContext: {
    Provider: ({ children, value }: { children: ReactNode; value: any }) => children,
    Consumer: ({ children }: { children: any }) => children({}),
  },
  AiProvider: ({ children }: { children: ReactNode }) => children,
  AiStatus: {
    IDLE: 'idle',
    GENERATING: 'generating',
    LOADING: 'loading',
    READY: 'ready',
    ERROR: 'error',
  },
  EMBEDDING_MODELS: ['all-MiniLM-L6-v2'],
  GENERATION_MODELS: ['Llama-3.2-1B-Instruct-q4f16'],
}));

// Mock the useContext hook
const mockAiContext = {
  embeddingModel: 'all-MiniLM-L6-v2',
  embeddingProgress: 100,
  setEmbeddingModel: jest.fn(),
  getEmbeddings: jest.fn(),
  fetchEmbeddings: jest.fn(),
  saveEmbeddings: jest.fn(),
  generationModel: 'Llama-3.2-1B-Instruct-q4f16',
  generationProgress: 100,
  setGenerationModel: jest.fn(),
  generateAnswer: jest.fn(),
  regenerateAnswer: jest.fn(),
  getNotes: jest.fn(),
  conversation: [],
  status: 'idle',
  stopGeneration: jest.fn(),
  progress: 100,
  performance: { tps: 0, numTokens: 0, totalTime: 0 },
  regeneratingIndex: null,
};

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: () => mockAiContext,
}));

describe('useAi', () => {
  it('returns the context from AiProvider', () => {
    const { result } = renderHook(() => useAi());
    
    expect(result.current).toBe(mockAiContext);
    expect(result.current.embeddingModel).toBe('all-MiniLM-L6-v2');
    expect(result.current.generationModel).toBe('Llama-3.2-1B-Instruct-q4f16');
    expect(result.current.status).toBe('idle');
  });

  it('should have the expected methods and properties', () => {
    const { result } = renderHook(() => useAi());
    
    expect(typeof result.current.generateAnswer).toBe('function');
    expect(typeof result.current.regenerateAnswer).toBe('function');
    expect(typeof result.current.getNotes).toBe('function');
    expect(typeof result.current.stopGeneration).toBe('function');
    expect(typeof result.current.getEmbeddings).toBe('function');
    expect(typeof result.current.fetchEmbeddings).toBe('function');
    expect(typeof result.current.saveEmbeddings).toBe('function');
    expect(typeof result.current.setEmbeddingModel).toBe('function');
    expect(typeof result.current.setGenerationModel).toBe('function');
    
    expect(result.current.conversation).toEqual([]);
    expect(result.current.performance).toEqual({ tps: 0, numTokens: 0, totalTime: 0 });
    expect(result.current.progress).toBe(100);
  });
});
