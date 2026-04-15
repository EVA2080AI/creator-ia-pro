import { memo, useMemo } from 'react';
import { EdgeProps, getBezierPath } from '@xyflow/react';
import { DATA_TYPE_COLORS, DataType } from './nodeConnections';

interface AnimatedEdgeData {
  dataType?: DataType;
  isActive?: boolean;
  isExecuting?: boolean;
  pulseDirection?: 'forward' | 'backward';
}

// Enhanced color system with better visibility
const ENHANCED_COLORS: Record<DataType, { primary: string; glow: string; light: string }> = {
  text: { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)', light: '#fef3c7' },      // amber-500
  image: { primary: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)', light: '#f3e8ff' },      // purple-500
  video: { primary: '#ec4899', glow: 'rgba(236, 72, 153, 0.5)', light: '#fce7f3' },      // pink-500
  layout: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', light: '#dbeafe' },      // blue-500
  campaign: { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.5)', light: '#d1fae5' },   // emerald-500
  context: { primary: '#f97316', glow: 'rgba(249, 115, 22, 0.5)', light: '#ffedd5' },    // orange-500
  json: { primary: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)', light: '#cffafe' },        // cyan-500
  any: { primary: '#64748b', glow: 'rgba(100, 116, 139, 0.5)', light: '#f1f5f9' },        // slate-500
};

const AnimatedEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) => {
  const edgeData = data as AnimatedEdgeData;
  const dataType = edgeData?.dataType || 'any';
  const isActive = edgeData?.isActive || false;
  const isExecuting = edgeData?.isExecuting || false;

  const colors = ENHANCED_COLORS[dataType];

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const gradientId = useMemo(() => `edge-gradient-${id}`, [id]);
  const patternId = useMemo(() => `edge-pattern-${id}`, [id]);

  return (
    <>
      {/* Definitions */}
      <defs>
        {/* Dynamic gradient that flows */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.2" />
          <stop offset="50%" stopColor={colors.primary} stopOpacity="1" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0.2" />
        </linearGradient>

        {/* Pattern for inactive state */}
        <pattern
          id={patternId}
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="10" stroke={colors.primary} strokeWidth="2" strokeOpacity="0.3" />
        </pattern>

        {/* Arrow marker with dynamic color */}
        <marker
          id={`arrow-${id}`}
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,8 L10,4 z"
            fill={colors.primary}
          />
        </marker>

        {/* Handle dots */}
        <circle id={`handle-${id}`} r="5" fill={colors.primary} />
      </defs>

      {/* Shadow/glow layer */}
      {(isActive || isExecuting) && (
        <path
          d={edgePath}
          fill="none"
          stroke={colors.primary}
          strokeWidth="8"
          strokeOpacity="0.15"
          className="animate-pulse"
          style={{ filter: `blur(4px)` }}
        />
      )}

      {/* Background track */}
      <path
        d={edgePath}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth="4"
        className="transition-all duration-300"
      />

      {/* Main line - colored by data type */}
      <path
        d={edgePath}
        fill="none"
        stroke={isActive || isExecuting ? `url(#${gradientId})` : colors.primary}
        strokeWidth={isActive || isExecuting ? 4 : 3}
        strokeLinecap="round"
        className="transition-all duration-300"
        style={{
          filter: isActive ? `drop-shadow(0 0 6px ${colors.glow})` : undefined,
        }}
        markerEnd={`url(#arrow-${id})`}
      />

      {/* Animated flow particles */}
      {isExecuting && (
        <>
          {/* Flowing particles */}
          {[0, 0.25, 0.5, 0.75].map((delay, i) => (
            <circle
              key={i}
              r="5"
              fill="white"
              stroke={colors.primary}
              strokeWidth="2"
            >
              <animateMotion
                dur="1.2s"
                repeatCount="indefinite"
                begin={`${delay}s`}
                path={edgePath}
              />
            </circle>
          ))}

          {/* Center glow line */}
          <path
            d={edgePath}
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeOpacity="0.6"
            strokeLinecap="round"
          >
            <animate
              attributeName="stroke-dasharray"
              values="0,100;20,100;0,100"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </path>
        </>
      )}

      {/* Selected highlight */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke="#a855f7"
          strokeWidth="6"
          strokeOpacity="0.3"
          className="pointer-events-none"
          style={{ filter: 'blur(2px)' }}
        />
      )}

      {/* Data type badge - always visible */}
      <foreignObject
        width="80"
        height="24"
        x={labelX - 40}
        y={labelY - 12}
        className="pointer-events-none"
      >
        <div
          className="flex items-center justify-center h-full rounded-full text-[9px] font-bold uppercase tracking-wider px-2 shadow-sm"
          style={{
            backgroundColor: isActive ? colors.light : 'white',
            color: colors.primary,
            border: `2px solid ${isActive ? colors.primary : colors.primary + '40'}`,
            opacity: isActive ? 1 : 0.8,
          }}
        >
          {dataType === 'any' ? 'conexión' : dataType}
        </div>
      </foreignObject>

      {/* Connection dots at handles */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r="6"
        fill="white"
        stroke={colors.primary}
        strokeWidth="3"
        className="transition-all duration-300"
      />
      <circle
        cx={targetX}
        cy={targetY}
        r="6"
        fill="white"
        stroke={colors.primary}
        strokeWidth="3"
        className="transition-all duration-300"
      />
    </>
  );
});

AnimatedEdge.displayName = 'AnimatedEdge';

export default AnimatedEdge;
