import { useCallback, useEffect, useRef } from 'react';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

interface PageView {
  path: string;
  referrer: string;
  title: string;
  timestamp: number;
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private pageViews: PageView[] = [];
  private sessionId: string;
  private flushInterval: number | null = null;
  private endpoint: string | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startFlushInterval();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setEndpoint(endpoint: string) {
    this.endpoint = endpoint;
  }

  track(event: string, properties?: Record<string, unknown>) {
    const eventData: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        url: window.location.href,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.queue.push(eventData);

    // Flush immediately for important events
    if (event === 'purchase' || event === 'subscription') {
      this.flush();
    }
  }

  pageView(path: string) {
    const pageView: PageView = {
      path,
      referrer: document.referrer,
      title: document.title,
      timestamp: Date.now(),
    };

    this.pageViews.push(pageView);
    this.track('page_view', { path, title: document.title });
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    this.track('identify', { userId, traits });
  }

  private startFlushInterval() {
    // Flush every 30 seconds
    this.flushInterval = window.setInterval(() => {
      this.flush();
    }, 30000);
  }

  async flush() {
    if (!this.endpoint || this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events, pageViews: this.pageViews }),
        keepalive: true,
      });

      this.pageViews = [];
    } catch (error) {
      // Put events back in queue
      this.queue.unshift(...events);
      console.error('Failed to send analytics:', error);
    }
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

const analytics = new Analytics();

export function useAnalytics() {
  const track = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      if (import.meta.env.PROD) {
        analytics.track(event, properties);
      } else {
        console.log('[Analytics]', event, properties);
      }
    },
    []
  );

  const pageView = useCallback((path: string) => {
    analytics.pageView(path);
  }, []);

  const identify = useCallback((userId: string, traits?: Record<string, unknown>) => {
    analytics.identify(userId, traits);
  }, []);

  useEffect(() => {
    return () => {
      analytics.flush();
    };
  }, []);

  return { track, pageView, identify };
}

// Hook for tracking component interactions
export function useTrackInteraction(event: string) {
  const { track } = useAnalytics();
  const startTime = useRef(Date.now());

  const trackClick = useCallback(
    (properties?: Record<string, unknown>) => {
      track(`${event}_click`, properties);
    },
    [event, track]
  );

  const trackView = useCallback(
    (properties?: Record<string, unknown>) => {
      track(`${event}_view`, { duration: Date.now() - startTime.current, ...properties });
    },
    [event, track]
  );

  const trackSubmit = useCallback(
    (properties?: Record<string, unknown>) => {
      track(`${event}_submit`, properties);
    },
    [event, track]
  );

  return { trackClick, trackView, trackSubmit };
}

// Track page views automatically
export function usePageTracking() {
  const { pageView } = useAnalytics();
  const lastPath = useRef('');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentPath = window.location.pathname;
      if (currentPath !== lastPath.current) {
        lastPath.current = currentPath;
        pageView(currentPath);
      }
    });

    observer.observe(document, { subtree: true, childList: true });

    // Track initial page view
    pageView(window.location.pathname);

    return () => observer.disconnect();
  }, [pageView]);
}

export { analytics };
