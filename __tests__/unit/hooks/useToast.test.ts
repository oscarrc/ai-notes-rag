import { renderHook } from '@testing-library/react';
import { useToast } from '../../../app/_hooks/useToast';
import { ToastContext } from '../../../app/_providers/ToastProvider';
import React, { ReactNode } from 'react';

// Mock the ToastContext value
const mockToastContext = {
  toasts: [],
  showToast: jest.fn(() => 'mock-id'),
  dismissToast: jest.fn(),
  updateToast: jest.fn(),
};

// Mock the ToastProvider module
jest.mock('../../../app/_providers/ToastProvider', () => ({
  ToastContext: {
    Provider: ({ children, value }: { children: ReactNode; value: any }) => children,
    Consumer: ({ children }: { children: any }) => children({}),
  },
}));

// Mock useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: () => mockToastContext,
}));

describe('useToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the toast context', () => {
    const { result } = renderHook(() => useToast());
    
    expect(result.current).toBe(mockToastContext);
    expect(result.current.toasts).toEqual([]);
    expect(typeof result.current.showToast).toBe('function');
    expect(typeof result.current.dismissToast).toBe('function');
    expect(typeof result.current.updateToast).toBe('function');
  });

  it('should have working showToast function', () => {
    const { result } = renderHook(() => useToast());
    
    const toastId = result.current.showToast({ 
      message: 'Test message', 
      type: 'success' 
    });
    
    expect(mockToastContext.showToast).toHaveBeenCalledWith({ 
      message: 'Test message', 
      type: 'success' 
    });
    expect(toastId).toBe('mock-id');
  });

  it('should have working dismissToast function', () => {
    const { result } = renderHook(() => useToast());
    
    result.current.dismissToast('test-id');
    
    expect(mockToastContext.dismissToast).toHaveBeenCalledWith('test-id');
  });

  it('should have working updateToast function', () => {
    const { result } = renderHook(() => useToast());
    
    result.current.updateToast('test-id', { 
      message: 'Updated message',
      progress: 50 
    });
    
    expect(mockToastContext.updateToast).toHaveBeenCalledWith(
      'test-id', 
      { message: 'Updated message', progress: 50 }
    );
  });
});