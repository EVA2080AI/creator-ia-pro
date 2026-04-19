import { useState, useEffect, useCallback, useRef } from 'react';

interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  network: {
    online: boolean;
    downlink: number | null;
    rtt: number | null;
  };
  errors: {
    count: number;
    lastError: Error | null;
  };
}

export function useSystemMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    memory: { used: 0, total: 0, percentage: 0 },
    cpu: { usage: 0, cores: navigator.hardwareConcurrency || 1 },
    network: { online: navigator.onLine, downlink: null, rtt: null },
    errors: { count: 0, lastError: null },
  });

  const errorCount = useRef(0);

  // Monitor memory (Chrome only)
  useEffect(() => {
    if ('memory' in performance) {
      const updateMemory = () => {
        const memory = (performance as any).memory;
        if (memory) {
          setMetrics((prev) => ({
            ...prev,
            memory: {
              used: memory.usedJSHeapSize,
              total: memory.totalJSHeapSize,
              percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
            },
          }));
        }
      };

      updateMemory();
      const interval = setInterval(updateMemory, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  // Monitor network
  useEffect(() => {
    const handleOnline = () => {
      setMetrics((prev) => ({
        ...prev,
        network: { ...prev.network, online: true },
      }));
    };

    const handleOffline = () => {
      setMetrics((prev) => ({
        ...prev,
        network: { ...prev.network, online: false },
      }));
    };

    // Network Information API
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        setMetrics((prev) => ({
          ...prev,
          network: {
            online: navigator.onLine,
            downlink: connection.downlink,
            rtt: connection.rtt,
          },
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', updateNetworkInfo);
      updateNetworkInfo();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Error tracking
  const trackError = useCallback((error: Error) => {
    errorCount.current += 1;
    setMetrics((prev) => ({
      ...prev,
      errors: {
        count: errorCount.current,
        lastError: error,
      },
    }));
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError(event.error || new Error(event.message));
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      trackError(
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason))
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [trackError]);

  return { metrics, trackError };
}

// API call monitoring
interface ApiCall {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: Date;
}

export function useApiMonitoring() {
  const [calls, setCalls] = useState<ApiCall[]>([]);
  const [slowCalls, setSlowCalls] = useState<ApiCall[]>([]);

  const trackCall = useCallback(
    (call: Omit<ApiCall, 'timestamp'>) => {
      const apiCall = { ...call, timestamp: new Date() };
      setCalls((prev) => [...prev.slice(-99), apiCall]);

      if (call.duration > 1000) {
        setSlowCalls((prev) => [...prev.slice(-49), apiCall]);
      }
    },
    []
  );

  const getAverageResponseTime = useCallback(() => {
    if (calls.length === 0) return 0;
    return calls.reduce((acc, call) => acc + call.duration, 0) / calls.length;
  }, [calls]);

  const getErrorRate = useCallback(() => {
    if (calls.length === 0) return 0;
    const errors = calls.filter((call) => call.status >= 400).length;
    return (errors / calls.length) * 100;
  }, [calls]);

  return {
    calls,
    slowCalls,
    trackCall,
    getAverageResponseTime,
    getErrorRate,
  };
}

// Real-time user activity monitoring
export function useUserActivity() {
  const [isActive, setIsActive] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionDuration, setSessionDuration] = useState(0);

  useEffect(() => {
    let activityTimeout: NodeJS.Timeout;
    let durationInterval: NodeJS.Timeout;

    const updateActivity = () => {
      setIsActive(true);
      setLastActivity(Date.now());
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => setIsActive(false), 30000); // 30s inactivity
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => {
      document.addEventListener(event, updateActivity);
    });

    // Track session duration
    const startTime = Date.now();
    durationInterval = setInterval(() => {
      setSessionDuration(Date.now() - startTime);
    }, 1000);

    updateActivity();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });
      clearTimeout(activityTimeout);
      clearInterval(durationInterval);
    };
  }, []);

  return { isActive, lastActivity, sessionDuration };
}
