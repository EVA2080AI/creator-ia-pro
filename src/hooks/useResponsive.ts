import { useState, useEffect } from 'react';

interface Breakpoint {
  name: string;
  min: number;
  max: number | null;
}

const breakpoints: Breakpoint[] = [
  { name: 'xs', min: 0, max: 639 },
  { name: 'sm', min: 640, max: 767 },
  { name: 'md', min: 768, max: 1023 },
  { name: 'lg', min: 1024, max: 1279 },
  { name: 'xl', min: 1280, max: 1535 },
  { name: '2xl', min: 1536, max: null },
];

export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const [breakpoint, setBreakpoint] = useState('lg');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setWindowSize({ width, height });

      const current = breakpoints.find(bp =>
        width >= bp.min && (bp.max === null || width <= bp.max)
      );

      if (current) {
        setBreakpoint(current.name);
        setIsMobile(current.name === 'xs');
        setIsTablet(['sm', 'md'].includes(current.name));
        setIsDesktop(['lg', 'xl', '2xl'].includes(current.name));
      }
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    windowSize,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isTouch: isMobile || isTablet,
  };
}

export default useResponsive;
