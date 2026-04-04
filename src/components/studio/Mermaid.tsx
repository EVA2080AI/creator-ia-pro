import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { AlertCircle } from 'lucide-react';

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
      if (!chart || chart.trim().length === 0) {
        setSvg('');
        return;
      }
      
      try {
        setError(null);
        // Clean chart for common markdown artifacts that cause syntax errors
        const cleanChart = chart
          .replace(/```mermaid\n?/g, '')
          .replace(/```/g, '')
          .trim();

        if (!cleanChart) return;

        // Generate unique ID to avoid collisions
        const uniqueId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(uniqueId, cleanChart);
        setSvg(renderedSvg);
      } catch (err) {
        console.error('Mermaid rendering failed:', err);
        // Only show error in console during development, silent in UI if it's junk content
        // Or show a very subtle indicator
        setError('Error en la sintaxis del diagrama. Solicita a Genesis que lo regenere.');
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="p-10 rounded-[2rem] border border-rose-50 bg-rose-50/20 text-rose-500 text-[11px] font-black uppercase tracking-[0.2em] flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
           <AlertCircle className="w-5 h-5 text-rose-400" />
        </div>
        <div>
           {error}
           <p className="mt-1 text-[9px] opacity-60 normal-case font-medium">Mermaid Engine v11.14.0 • Syntax Validation Failed</p>
        </div>
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
