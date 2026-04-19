import { useEffect, useState } from 'react';

interface WebVitals {
  // Core Web Vitals
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  fid: number | null; // First Input Delay
  lcp: number | null; // Largest Contentful Paint
  ttfb: number | null; // Time to First Byte
  inp: number | null; // Interaction to Next Paint

  // Custom metrics
  renderTime: number | null;
  domInteractive: number | null;
  domComplete: number | null;
}

export function useWebVitals() {
  const [vitals, setVitals] = useState<WebVitals>({
    cls: null,
    fcp: null,
    fid: null,
    lcp: null,
    ttfb: null,
    inp: null,
    renderTime: null,
    domInteractive: null,
    domComplete: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // CLS Observer
    let clsValue = 0;
    let clsEntries: PerformanceEntry[] = [];

    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsEntries.push(entry);
          clsValue += (entry as any).value;
        }
      }
      setVitals((prev) => ({ ...prev, cls: clsValue }));
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch {
      // Layout Shift API not supported
    }

    // LCP Observer
    let lcpValue = 0;
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      lcpValue = (lastEntry as any).startTime;
      setVitals((prev) => ({ ...prev, lcp: lcpValue }));
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch {
      // LCP API not supported
    }

    // FID Observer
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const delay = (entry as any).processingStart - entry.startTime;
        setVitals((prev) => ({ ...prev, fid: delay }));
      }
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch {
      // FID API not supported
    }

    // Navigation Timing
    const navigationObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const nav = entry as PerformanceNavigationTiming;
        setVitals((prev) => ({
          ...prev,
          fcp: nav.responseEnd - nav.startTime,
          ttfb: nav.responseStart - nav.startTime,
          renderTime: nav.loadEventEnd - nav.startTime,
          domInteractive: nav.domInteractive - nav.startTime,
          domComplete: nav.domComplete - nav.startTime,
        }));
      }
    });

    try {
      navigationObserver.observe({ entryTypes: ['navigation'] });
    } catch {
      // Navigation Timing API not supported
    }

    // INP Observer (experimental)
    let inpValue = 0;
    const inpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      // Get the worst interaction
      entries.forEach((entry: any) => {
        if (entry.duration > inpValue) {
          inpValue = entry.duration;
        }
      });
      setVitals((prev) => ({ ...prev, inp: inpValue }));
    });

    try {
      inpObserver.observe({ entryTypes: ['event'] });
    } catch {
      // Event Timing API not supported
    }

    return () => {
      clsObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      navigationObserver.disconnect();
      inpObserver.disconnect();
    };
  }, []);

  // Get performance rating
  const getRating = (metric: keyof WebVitals): 'good' | 'needs-improvement' | 'poor' | 'unknown' => {
    const value = vitals[metric];
    if (value === null) return 'unknown';

    const thresholds: Record<string, [number, number]> = {
      cls: [0.1, 0.25],
      fcp: [1800, 3000],
      fid: [100, 300],
      lcp: [2500, 4000],
      ttfb: [800, 1800],
      inp: [200, 500],
      renderTime: [3000, 5000],
      domInteractive: [3800, 7300],
      domComplete: [3800, 7300],
    };

    const [good, poor] = thresholds[metric] || [0, 0];
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  };

  // Send metrics to analytics (optional)
  const sendMetrics = () => {
    if (import.meta.env.PROD) {
      // Send to your analytics endpoint
      console.log('Web Vitals:', vitals);
    }
  };

  return { vitals, getRating, sendMetrics };
}

// Hook for tracking component render performance
export function useComponentRender(name: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (import.meta.env.DEV && renderTime > 16) {
        console.warn(`[Performance] ${name} took ${renderTime.toFixed(2)}ms to render`);
      }
    };
  }, [name]);
}
