import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { AlertCircle, Layout, Activity } from 'lucide-react';

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
        // ─── ROBUST CLEANING ───
        let cleanChart = chart
          .replace(/```mermaid\n?/g, '')
          .replace(/```/g, '')
          .replace(/# .*/g, '') // Remove comments
          .trim();

        if (!cleanChart) return;

        // Auto-fix: Ensure it starts with a valid directive
        if (!cleanChart.match(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|journey|quadrantChart|xychart|mindmap|timeline)/i)) {
          cleanChart = `graph TD\n${cleanChart}`;
        }

        // Auto-fix: Quote labels with special characters like () [] {}
        // This is a common LLM mistake: node1[Label (info)] -> node1["Label (info)"]
        cleanChart = cleanChart.replace(/([\[\(]|\s)([^\n\]\)\"]*[\(\)\[\]{}][^\n\]\)\"]*)([\]\)])/g, '$1"$2"$3');

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
      <div className="p-12 rounded-[3.5rem] border border-zinc-100 bg-zinc-50/50 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-700">
        <div className="h-16 w-16 rounded-[2rem] bg-white border border-black/5 flex items-center justify-center text-zinc-300 shadow-sm relative overflow-hidden">
           <div className="absolute inset-0 bg-primary/5 opacity-40 animate-pulse" />
           <Layout className="w-8 h-8 relative z-10" />
        </div>
        <div className="space-y-2">
           <h4 className="text-[13px] font-black text-zinc-900 uppercase tracking-tighter">Procesando Arquitectura...</h4>
           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed max-w-[240px] mx-auto">
             Genesis está refinando el diagrama sitemap. Solicita "Regenerar Blueprint" si esta vista persiste.
           </p>
        </div>
        <div className="flex gap-1">
           <div className="w-1 h-1 rounded-full bg-zinc-300 animate-bounce" />
           <div className="w-1 h-1 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: '0.2s' }} />
           <div className="w-1 h-1 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: '0.4s' }} />
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
