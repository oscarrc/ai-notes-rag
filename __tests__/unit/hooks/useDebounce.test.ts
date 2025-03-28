import { renderHook, act } from '@testing-library/react';
import useDebounce from '../../../app/_hooks/useDebounce';

describe('useDebounce', () => {
  jest.useFakeTimers();

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial value', 500));
    expect(result.current).toBe('initial value');
  });

  it('should debounce the value update', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial value', delay: 500 } }
    );

    // Initial value should be set immediately
    expect(result.current).toBe('initial value');

    // Update the value
    rerender({ value: 'updated value', delay: 500 });

    // Value should not have changed yet
    expect(result.current).toBe('initial value');

    // Fast-forward time by 250ms (half the delay)
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Value should still not have changed
    expect(result.current).toBe('initial value');

    // Fast-forward time by another 250ms (to reach the full delay)
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Now the value should be updated
    expect(result.current).toBe('updated value');
  });

  it('should use the default delay if none is provided', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial value' } }
    );

    // Update the value
    rerender({ value: 'updated value' });

    // Value should not have changed yet
    expect(result.current).toBe('initial value');

    // Fast-forward time by the default delay (500ms)
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now the value should be updated
    expect(result.current).toBe('updated value');
  });

  it('should cancel the previous timer when the value changes again', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial value', delay: 500 } }
    );

    // Update the value first time
    rerender({ value: 'updated value 1', delay: 500 });

    // Fast-forward time by 250ms (half the delay)
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Update the value second time before the first update is applied
    rerender({ value: 'updated value 2', delay: 500 });

    // Fast-forward time by 250ms (half the delay for second update)
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // First update should never be applied
    expect(result.current).not.toBe('updated value 1');
    // Still not enough time for second update
    expect(result.current).toBe('initial value');

    // Fast-forward time by another 250ms (to reach the full delay for second update)
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Now the second update should be applied
    expect(result.current).toBe('updated value 2');
  });
});
