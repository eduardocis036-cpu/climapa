import { useCallback, useRef } from 'react';

interface Options {
  onRefresh: () => void;
  threshold?: number;
  enabled?: boolean;
}

export function usePullToRefresh({ onRefresh, threshold = 70, enabled = true }: Options) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const distance = useRef(0);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const scrollY = document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollY <= 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
        distance.current = 0;
      } else {
        pulling.current = false;
      }
    },
    [enabled]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current) return;
      distance.current = e.touches[0].clientY - startY.current;
      if (distance.current < 0) distance.current = 0;
    },
    []
  );

  const onTouchEnd = useCallback((_e?: React.TouchEvent) => {
    if (!pulling.current) return;
    if (distance.current >= threshold) {
      onRefresh();
    }
    pulling.current = false;
    distance.current = 0;
  }, [onRefresh, threshold]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
