import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '@/tailwind.config';
import { useState, useEffect } from 'react';

const fullConfig = resolveConfig(tailwindConfig);
const breakpoints = fullConfig.theme.screens;
type BreakpointKey = keyof typeof breakpoints;

const useBreakpoint = (breakpoint: BreakpointKey) => {
  const getBreakpointValue = (b: BreakpointKey): number =>
    parseInt(breakpoints[b].slice(0, -2));

  const [isMinWidth, setIsMinWidth] = useState<boolean>(false);
  const [isMaxWidth, setIsMaxWidth] = useState<boolean>(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<
    BreakpointKey | 'xs'
  >('xs');

  const getCurrentBreakpoint = (width: number): BreakpointKey | 'xs' => {
    return (
      (Object.keys(breakpoints) as BreakpointKey[])
        .reverse()
        .find((b) => width >= getBreakpointValue(b)) || 'xs'
    );
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      setCurrentBreakpoint(getCurrentBreakpoint(width));
      setIsMinWidth(width >= getBreakpointValue(breakpoint));
      setIsMaxWidth(width < getBreakpointValue(breakpoint));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return { currentBreakpoint, isMinWidth, isMaxWidth };
};

export default useBreakpoint;
