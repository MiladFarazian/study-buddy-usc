
import { useState, useEffect } from 'react';

export function useDynamicResize() {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
}

export function useResponsiveValue<T>(mobileValue: T, desktopValue: T, breakpoint: number = 768) {
  const { width } = useDynamicResize();
  return width < breakpoint ? mobileValue : desktopValue;
}
