import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  themeVariables: {
    fontFamily: 'Inter, system-ui, sans-serif',
    primaryColor: '#3b82f6', // blue-500
    primaryTextColor: '#fff',
    primaryBorderColor: '#3b82f6',
    lineColor: '#52525b', // zinc-500
    secondaryColor: '#18181b', // zinc-900
    tertiaryColor: '#09090b', // zinc-950
  },
  flowchart: {
    curve: 'basis',
    useMaxWidth: true,
    htmlLabels: true,
  },
  securityLevel: 'loose',
});

interface MermaidProps {
  chart: string;
  id?: string;
  className?: string;
}

export const Mermaid: React.FC<MermaidProps> = ({ chart, id = 'mermaid-chart', className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart) return;
      
      try {
        setError(null);
        // Generate unique ID to avoid collisions
        const uniqueId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, chart);
        setSvg(svg);
      } catch (err) {
        console.error('Mermaid rendering failed:', err);
        setError('Error al renderizar el diagrama Mercurial.');
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 text-[10px] font-medium">
        {error}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
