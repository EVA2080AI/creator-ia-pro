import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

interface UseVirtualizedListOptions<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
}

interface VirtualItem<T> {
  item: T;
  index: number;
  style: {
    position: 'absolute';
    top: number;
    left: 0;
    right: 0;
    height: number;
  };
}

export function useVirtualizedList<T>({
  items,
  itemHeight,
  overscan = 5,
  containerHeight,
}: UseVirtualizedListOptions<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = useMemo(() => items.length * itemHeight, [items.length, itemHeight]);

  const virtualItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const virtualItems: VirtualItem<T>[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      virtualItems.push({
        item: items[i],
        index: i,
        style: {
          position: 'absolute',
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        },
      });
    }
    return virtualItems;
  }, [scrollTop, items, itemHeight, containerHeight, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Auto-scroll to item
  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  }, [itemHeight]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = totalHeight;
    }
  }, [totalHeight]);

  return {
    containerRef,
    virtualItems,
    totalHeight,
    handleScroll,
    scrollToIndex,
    scrollToBottom,
  };
}

// Hook for infinite scroll
interface UseInfiniteScrollOptions {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  threshold?: number;
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  threshold = 200,
}: UseInfiniteScrollOptions) {
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loading && hasMore) {
          setLoading(true);
          await onLoadMore();
          setLoading(false);
        }
      },
      { rootMargin: `${threshold}px` }
    );

    observerRef.current = observer;

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore, threshold]);

  return { targetRef, loading };
}

// Hook for smooth scroll with easing
export function useSmoothScroll() {
  const scrollTo = useCallback((element: HTMLElement | null, options?: ScrollIntoViewOptions) => {
    if (!element) return;

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      ...options,
    });
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, []);

  return { scrollTo, scrollToTop, scrollToBottom };
}
