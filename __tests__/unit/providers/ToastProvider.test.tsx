import React, { useContext } from 'react';
import {
  ToastContext,
  ToastProvider,
} from '../../../app/_providers/ToastProvider';
import { act, render, screen, waitFor } from '@testing-library/react';

// Mock the crypto.randomUUID function
const mockUuid = 'test-uuid-123';
global.crypto = {
  ...global.crypto,
  randomUUID: jest.fn(() => mockUuid),
};

// Create a test component to access context
const TestComponent = () => {
  const context = useContext(ToastContext);

  if (!context) {
    return <div>No context available</div>;
  }

  return (
    <div>
      <button
        data-testid='show-toast'
        onClick={() =>
          context.showToast({ message: 'Test toast', type: 'success' })
        }
      >
        Show Toast
      </button>
      <button
        data-testid='dismiss-toast'
        onClick={() => context.dismissToast(mockUuid)}
      >
        Dismiss Toast
      </button>
      <button
        data-testid='update-toast'
        onClick={() =>
          context.updateToast(mockUuid, {
            message: 'Updated toast',
            progress: 50,
          })
        }
      >
        Update Toast
      </button>
      <div data-testid='toast-count'>{context.toasts.length}</div>
      {context.toasts.map((toast, idx) => (
        <div key={idx} data-testid={`toast-${toast.id}`}>
          <span data-testid={`toast-message-${toast.id}`}>{toast.message}</span>
          <span data-testid={`toast-type-${toast.id}`}>{toast.type}</span>
          {toast.progress !== undefined && (
            <span data-testid={`toast-progress-${toast.id}`}>
              {toast.progress}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

describe('ToastProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('provides the context with correct values', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Context should be provided with initial values
    expect(screen.getByTestId('toast-count').textContent).toBe('0');
  });

  it('adds a toast when showToast is called', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show a toast
    act(() => {
      screen.getByTestId('show-toast').click();
    });

    // Toast should be added to the list
    expect(screen.getByTestId('toast-count').textContent).toBe('1');
    expect(screen.getByTestId(`toast-${mockUuid}`)).toBeInTheDocument();
    expect(screen.getByTestId(`toast-message-${mockUuid}`).textContent).toBe(
      'Test toast'
    );
    expect(screen.getByTestId(`toast-type-${mockUuid}`).textContent).toBe(
      'success'
    );
  });

  it('removes a toast when dismissToast is called', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show a toast
    act(() => {
      screen.getByTestId('show-toast').click();
    });

    // Dismiss the toast
    act(() => {
      screen.getByTestId('dismiss-toast').click();
    });

    // Toast should be removed from the list
    expect(screen.getByTestId('toast-count').textContent).toBe('0');
    expect(screen.queryByTestId(`toast-${mockUuid}`)).not.toBeInTheDocument();
  });

  it('updates a toast when updateToast is called', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show a toast
    act(() => {
      screen.getByTestId('show-toast').click();
    });

    // Update the toast
    act(() => {
      screen.getByTestId('update-toast').click();
    });

    // Toast should be updated
    expect(screen.getByTestId(`toast-message-${mockUuid}`).textContent).toBe(
      'Updated toast'
    );
    expect(screen.getByTestId(`toast-progress-${mockUuid}`).textContent).toBe(
      '50'
    );
  });

  it('automatically dismisses toasts after duration', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show a toast (default duration is 5000ms)
    act(() => {
      screen.getByTestId('show-toast').click();
    });

    // Toast should be in the list
    expect(screen.getByTestId('toast-count').textContent).toBe('1');

    // Fast-forward time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Toast should be automatically removed
    expect(screen.getByTestId('toast-count').textContent).toBe('0');
  });

  it('automatically dismisses toasts when progress reaches 100%', async () => {
    let updateToastFn:
      | ((id: string, updates: Partial<Omit<Toast, 'id'>>) => void)
      | undefined;

    const TestContextCapture = () => {
      const context = useContext(ToastContext);
      updateToastFn = context?.updateToast;
      return <TestComponent />;
    };

    render(
      <ToastProvider>
        <TestContextCapture />
      </ToastProvider>
    );

    // Show a toast
    act(() => {
      screen.getByTestId('show-toast').click();
    });

    // Update toast progress to 100%
    act(() => {
      // Use the captured update function
      updateToastFn?.(mockUuid, { progress: 100 });
    });

    // Toast should still be visible
    expect(screen.getByTestId('toast-count').textContent).toBe('1');

    // Fast-forward time by 1 second (auto-dismiss delay after 100%)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Toast should be automatically removed
    expect(screen.getByTestId('toast-count').textContent).toBe('0');
  });

  it('does not update toast if update object is empty', async () => {
    let updateToastFn:
      | ((id: string, updates: Partial<Omit<Toast, 'id'>>) => void)
      | undefined;

    const TestContextCapture = () => {
      const context = useContext(ToastContext);
      updateToastFn = context?.updateToast;
      return <TestComponent />;
    };

    render(
      <ToastProvider>
        <TestContextCapture />
      </ToastProvider>
    );

    // Show a toast
    act(() => {
      screen.getByTestId('show-toast').click();
    });

    // Get the original message
    const originalMessage = screen.getByTestId(
      `toast-message-${mockUuid}`
    ).textContent;

    // Try to update with empty object
    act(() => {
      updateToastFn?.(mockUuid, {});
    });

    // Message should remain unchanged
    expect(screen.getByTestId(`toast-message-${mockUuid}`).textContent).toBe(
      originalMessage
    );
  });

  it('cleans up timeouts when unmounted', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    let showToastFn: ((toast: Partial<Toast>) => string) | undefined;

    const TestContextCapture = () => {
      const context = useContext(ToastContext);
      showToastFn = context?.showToast;
      return <TestComponent />;
    };

    const { unmount } = render(
      <ToastProvider>
        <TestContextCapture />
      </ToastProvider>
    );

    // Show multiple toasts
    act(() => {
      showToastFn?.({ message: 'Toast 1', type: 'info' });
      showToastFn?.({ message: 'Toast 2', type: 'success' });
    });

    // Unmount the component
    unmount();

    // Should clear all timeouts
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
