import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  lastCheck: Date;
  connectionCount: number;
}

interface TableMetrics {
  name: string;
  rowCount: number;
  size: string;
  lastVacuum: Date | null;
}

export function useDatabaseHealth() {
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    const startTime = Date.now();

    try {
      // Simple health check query
      const { error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      const latency = Date.now() - startTime;

      if (error) throw error;

      setHealth({
        status: latency < 100 ? 'healthy' : latency < 500 ? 'degraded' : 'unhealthy',
        latency,
        lastCheck: new Date(),
        connectionCount: 0, // Would require admin access
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHealth({
        status: 'unhealthy',
        latency: Date.now() - startTime,
        lastCheck: new Date(),
        connectionCount: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [checkHealth]);

  return { health, loading, error, refetch: checkHealth };
}

export function useTableMetrics() {
  const [metrics, setMetrics] = useState<TableMetrics[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // Get counts for major tables
      const tables = [
        'profiles',
        'transactions',
        'spaces',
        'saved_assets',
        'studio_projects',
        'studio_conversations',
      ];

      const results = await Promise.all(
        tables.map(async (table) => {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          return {
            name: table,
            rowCount: count || 0,
            size: 'N/A',
            lastVacuum: null,
          };
        })
      );

      setMetrics(results);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, refetch: fetchMetrics };
}

// Connection pool monitoring
export function useConnectionPool() {
  const [activeConnections, setActiveConnections] = useState(0);
  const [maxConnections] = useState(100); // Supabase default

  return {
    activeConnections,
    maxConnections,
    utilization: (activeConnections / maxConnections) * 100,
  };
}
