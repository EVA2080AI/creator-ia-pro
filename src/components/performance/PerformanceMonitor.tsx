import { useState, useEffect } from 'react';
import { useWebVitals } from '@/hooks/useWebVitals';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X, Gauge, Clock, Zap } from 'lucide-react';

interface PerformanceMonitorProps {
  enabled?: boolean;
}

export function PerformanceMonitor({ enabled = import.meta.env.DEV }: PerformanceMonitorProps) {
  const { vitals, getRating } = useWebVitals();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!enabled || !mounted) return null;

  const getRatingColor = (rating: ReturnType<typeof getRating>) => {
    switch (rating) {
      case 'good':
        return 'text-emerald-500';
      case 'needs-improvement':
        return 'text-amber-500';
      case 'poor':
        return 'text-red-500';
      default:
        return 'text-zinc-400';
    }
  };

  const formatValue = (value: number | null, unit: string = 'ms') => {
    if (value === null) return '—';
    if (unit === 'ms') return `${Math.round(value)}ms`;
    if (unit === 's') return `${value.toFixed(2)}s`;
    return value.toFixed(3);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-zinc-900 text-white rounded-full shadow-lg hover:bg-zinc-800 transition-colors"
        title="Performance Monitor"
      >
        <Activity className="h-5 w-5" />
      </button>

      {/* Monitor Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-16 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-zinc-600" />
                <span className="font-semibold text-sm text-zinc-900">Web Vitals</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-zinc-200 rounded transition-colors"
              >
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>

            {/* Metrics */}
            <div className="p-4 space-y-3">
              {/* LCP */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-zinc-600">LCP</span>
                </div>
                <span className={`font-mono text-sm ${getRatingColor(getRating('lcp'))}`}>
                  {formatValue(vitals.lcp)}
                </span>
              </div>

              {/* FID */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-zinc-600">FID</span>
                </div>
                <span className={`font-mono text-sm ${getRatingColor(getRating('fid'))}`}>
                  {formatValue(vitals.fid)}
                </span>
              </div>

              {/* CLS */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-zinc-600">CLS</span>
                </div>
                <span className={`font-mono text-sm ${getRatingColor(getRating('cls'))}`}>
                  {formatValue(vitals.cls, '')}
                </span>
              </div>

              {/* FCP */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-zinc-600">FCP</span>
                </div>
                <span className={`font-mono text-sm ${getRatingColor(getRating('fcp'))}`}>
                  {formatValue(vitals.fcp)}
                </span>
              </div>

              {/* TTFB */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-zinc-600">TTFB</span>
                </div>
                <span className={`font-mono text-sm ${getRatingColor(getRating('ttfb'))}`}>
                  {formatValue(vitals.ttfb)}
                </span>
              </div>

              {/* Render Time */}
              <div className="flex items-center justify-between border-t border-zinc-100 pt-3 mt-3">
                <span className="text-sm text-zinc-500">Render Time</span>
                <span className={`font-mono text-sm ${getRatingColor(getRating('renderTime'))}`}>
                  {formatValue(vitals.renderTime, 's')}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-zinc-500">Good</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-zinc-500">Needs Improvement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-zinc-500">Poor</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
