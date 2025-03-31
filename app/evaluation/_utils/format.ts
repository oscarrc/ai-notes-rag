// Format precision/recall for display
export const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

// Format time for display
export const formatTime = (ms: number) => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};
