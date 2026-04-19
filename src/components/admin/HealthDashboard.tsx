import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Database, Server, AlertCircle,
  CheckCircle2, Clock, Zap, TrendingUp,
  RefreshCw, HardDrive, Cpu, Wifi
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDatabaseHealth, useTableMetrics } from '@/hooks/useDatabase';
import { useSystemMonitoring, useApiMonitoring, useUserActivity } from '@/hooks/useMonitoring';

export function HealthDashboard() {
  const { health, loading: healthLoading, refetch: refetchHealth } = useDatabaseHealth();
  const { metrics: tableMetrics, loading: metricsLoading } = useTableMetrics();
  const { metrics: systemMetrics } = useSystemMonitoring();
  const { calls, getAverageResponseTime, getErrorRate } = useApiMonitoring();
  const { isActive, sessionDuration } = useUserActivity();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchHealth();
    setIsRefreshing(false);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">System Health</h2>
          <p className="text-zinc-500">Real-time monitoring dashboard</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${
            health?.status === 'healthy'
              ? 'bg-emerald-50 border-emerald-200'
              : health?.status === 'degraded'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <Database className={`h-5 w-5 ${
              health?.status === 'healthy' ? 'text-emerald-600' :
              health?.status === 'degraded' ? 'text-amber-600' : 'text-red-600'
            }`} />
            {health?.status === 'healthy' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
          </div>
          <p className="mt-2 text-2xl font-bold capitalize">{health?.status || 'Unknown'}</p>
          <p className="text-sm text-zinc-600">{health?.latency}ms latency</p>
        </motion.div>

        {/* Memory Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border bg-white"
        >
          <div className="flex items-center justify-between">
            <HardDrive className="h-5 w-5 text-blue-600" />
            <Activity className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-2xl font-bold">
            {systemMetrics.memory.percentage.toFixed(1)}%
          </p>
          <p className="text-sm text-zinc-600">
            {formatBytes(systemMetrics.memory.used)} / {formatBytes(systemMetrics.memory.total)}
          </p>
        </motion.div>

        {/* Network Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-4 rounded-xl border ${
            systemMetrics.network.online ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <Wifi className={`h-5 w-5 ${systemMetrics.network.online ? 'text-emerald-600' : 'text-red-600'}`} />
            <Zap className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-2xl font-bold">
            {systemMetrics.network.online ? 'Online' : 'Offline'}
          </p>
          <p className="text-sm text-zinc-600">
            {systemMetrics.network.downlink ? `${systemMetrics.network.downlink} Mbps` : 'N/A'}
          </p>
        </motion.div>

        {/* API Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl border bg-white"
        >
          <div className="flex items-center justify-between">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <Clock className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-2xl font-bold">{getAverageResponseTime().toFixed(0)}ms</p>
          <p className="text-sm text-zinc-600">
            {calls.length} calls, {getErrorRate().toFixed(1)}% errors
          </p>
        </motion.div>
      </div>

      {/* Table Metrics */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Server className="h-5 w-5" />
          Database Tables
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm font-medium text-zinc-600">Table</th>
                <th className="text-right py-2 text-sm font-medium text-zinc-600">Rows</th>
                <th className="text-right py-2 text-sm font-medium text-zinc-600">Size</th>
              </tr>
            </thead>
            <tbody>
              {tableMetrics.map((table) => (
                <tr key={table.name} className="border-b last:border-0">
                  <td className="py-3 text-sm">{table.name}</td>
                  <td className="py-3 text-sm text-right font-mono">
                    {table.rowCount.toLocaleString()}
                  </td>
                  <td className="py-3 text-sm text-right">{table.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Info */}
      <div className="bg-zinc-50 rounded-xl border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="text-sm text-zinc-600">
            Session duration: {formatDuration(sessionDuration)}
          </span>
        </div>
        <span className="text-xs text-zinc-400">
          Last check: {health?.lastCheck.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
