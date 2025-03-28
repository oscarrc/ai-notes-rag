import {
  AiContext,
  AiProvider,
  AiStatus,
} from '../../../app/_providers/AiProvider';
import React, { useContext } from 'react';
import { act, render, waitFor } from '@testing-library/react';

// Mock the aiWorker.ts module
jest.mock('../../../app/_workers/aiWorker.ts', () => ({}));

// Create a mock Worker implementation
class MockWorker {
  onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null;
  postMessage(data: any) {
    // Simulate worker behavior
    if (data.type === 'INIT_EMBEDDER') {
      setTimeout(() => {
        //@ts-ignore
        this.onmessage?.({
          data: {
            type: 'EMBEDDER_INITIALIZED',
            success: true,
          },
        } as MessageEvent);
      }, 0);
    } else if (data.type === 'INIT_GENERATOR') {
      setTimeout(() => {
        //@ts-ignore
        this.onmessage?.({
          data: {
            type: 'GENERATOR_INITIALIZED',
            success: true,
          },
        } as MessageEvent);
      }, 0);
    } else if (data.type === 'GET_EMBEDDINGS' && data.payload.id) {
      setTimeout(() => {
        //@ts-ignore
        this.onmessage?.({
          data: {
            type: 'EMBEDDINGS_RESULT',
            id: data.payload.id,
            success: true,
            embeddings: { dim: 384, values: new Array(384).fill(0) },
          },
        } as MessageEvent);
      }, 0);
    } else if (data.type === 'GENERATE_ANSWER') {
      setTimeout(() => {
        //@ts-ignore
        this.onmessage?.({
          data: {
            type: 'STREAM_RESPONSE',
            text: 'This is a test response.',
          },
        } as MessageEvent);

        setTimeout(() => {
          //@ts-ignore
          this.onmessage?.({
            data: {
              type: 'PERFORMANCE_UPDATE',
              tps: 10,
              numTokens: 100,
              totalTime: 1000,
            },
          } as MessageEvent);

          setTimeout(() => {
            //@ts-ignore
            this.onmessage?.({
              data: {
                type: 'GENERATION_COMPLETE',
              },
            } as MessageEvent);
          }, 0);
        }, 0);
      }, 0);
    }
  }
  terminate() {}
}

// Mock URL and Worker
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.Worker = MockWorker as unknown as typeof Worker;

// Mock fetch for API calls
global.fetch = jest.fn().mockImplementation((url) => {
  if (url.toString().includes('/api/embeddings')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve([
          { name: 'test.md', path: '/vault/test.md', content: 'Test content' },
        ]),
    });
  }
  return Promise.resolve({
    ok: false,
    statusText: 'Not found',
  });
}) as jest.Mock;

// Simple test component to access context values
const TestComponent = () => {
  const context = useContext(AiContext);
  return (
    <div data-testid='test-component'>
      <div data-testid='status'>{context.status}</div>
      <div data-testid='embedding-model'>{context.embeddingModel}</div>
      <div data-testid='generation-model'>{context.generationModel}</div>
    </div>
  );
};

describe('AiProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default values', async () => {
    const { getByTestId } = render(
      <AiProvider>
        <TestComponent />
      </AiProvider>
    );

    // Initially status is IDLE
    expect(getByTestId('status').textContent).toBe(AiStatus.IDLE);
    expect(getByTestId('embedding-model').textContent).toBe('all-MiniLM-L6-v2');
    expect(getByTestId('generation-model').textContent).toBe(
      'Llama-3.2-1B-Instruct-q4f16'
    );
  });

  it('exposes expected methods in context', async () => {
    let contextValue: any;

    const TestContextGrabber = () => {
      contextValue = useContext(AiContext);
      return null;
    };

    render(
      <AiProvider>
        <TestContextGrabber />
      </AiProvider>
    );

    await waitFor(() => {
      expect(typeof contextValue.generateAnswer).toBe('function');
      expect(typeof contextValue.regenerateAnswer).toBe('function');
      expect(typeof contextValue.getNotes).toBe('function');
      expect(typeof contextValue.getEmbeddings).toBe('function');
      expect(typeof contextValue.fetchEmbeddings).toBe('function');
      expect(typeof contextValue.saveEmbeddings).toBe('function');
      expect(typeof contextValue.stopGeneration).toBe('function');
    });
  });

  it('processes getEmbeddings requests correctly', async () => {
    let contextValue: any;

    const TestContextGrabber = () => {
      contextValue = useContext(AiContext);
      return null;
    };

    render(
      <AiProvider>
        <TestContextGrabber />
      </AiProvider>
    );

    // Wait for the worker to be initialized
    await waitFor(() => {
      expect(contextValue).not.toBeNull();
    });

    let embeddingsResult: any;

    // Call getEmbeddings and store the result
    await act(async () => {
      embeddingsResult = await contextValue.getEmbeddings('test query');
    });

    // Check that we got a valid embedding structure
    expect(embeddingsResult).toHaveProperty('dim', 384);
    expect(embeddingsResult).toHaveProperty('values');
    expect(Array.isArray(embeddingsResult.values)).toBe(true);
    expect(embeddingsResult.values.length).toBe(384);
  });
});
