import { memo, useCallback, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Braces, Trash2, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NodeConnectionDropdown } from './NodeConnectionDropdown';

interface Variable {
  key: string;
  value: string;
}

interface PromptBuilderNodeData {
  title?: string;
  template?: string;
  variables?: Variable[];
  compiledPrompt?: string;
  onAddConnected?: (sourceId: string, targetType: string) => void;
}

const PRESET_TEMPLATES = [
  { label: 'Producto', template: 'Crea contenido para {{producto}} dirigido a {{audiencia}}. Tono: {{tono}}. Objetivo: {{objetivo}}.' },
  { label: 'Campaña', template: 'Campaña de {{tipo_campaña}} para {{marca}} en {{plataforma}}. Presupuesto: {{presupuesto}}. Duración: {{duracion}}.' },
  { label: 'Post Social', template: 'Post para {{red_social}} sobre {{tema}}. La {{marca}} quiere transmitir {{mensaje_clave}}.' },
];

const PromptBuilderNode = ({ id, data }: { id: string; data: PromptBuilderNodeData }) => {
  const { setNodes } = useReactFlow();
  const [presetsOpen, setPresetsOpen] = useState(false);

  const update = useCallback((patch: Partial<PromptBuilderNodeData>) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
  }, [id, setNodes]);

  const deleteNode = async () => {
    await supabase.from('canvas_nodes').delete().eq('id', id);
    setNodes(nds => nds.filter(n => n.id !== id));
    toast.success('Nodo eliminado');
  };

  // Extract variables from template
  const extractVars = (template: string): string[] => {
    const matches = template.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.slice(2, -2)))];
  };

  const handleTemplateChange = (template: string) => {
    const foundVarNames = extractVars(template);
    const existing = data.variables || [];
    const newVars: Variable[] = foundVarNames.map(key => ({
      key,
      value: existing.find(v => v.key === key)?.value || '',
    }));
    const compiled = compilePrompt(template, newVars);
    update({ template, variables: newVars, compiledPrompt: compiled });
  };

  const handleVarChange = (key: string, value: string) => {
    const vars = (data.variables || []).map(v => v.key === key ? { ...v, value } : v);
    const compiled = compilePrompt(data.template || '', vars);
    update({ variables: vars, compiledPrompt: compiled });
  };

  const compilePrompt = (template: string, vars: Variable[]): string => {
    let result = template;
    for (const v of vars) {
      result = result.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.value || `[${v.key}]`);
    }
    return result;
  };

  const vars = data.variables || [];
  const compiled = data.compiledPrompt || compilePrompt(data.template || '', vars);

  return (
    <div className="group relative rounded-3xl overflow-hidden aether-card w-[300px] shadow-2xl">
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-[#fb923c]/10 border border-[#fb923c]/20">
            <Braces className="w-4 h-4 text-[#fb923c]" />
          </div>
          <h3 className="text-[11px] font-bold text-white/90 tracking-wide font-sans uppercase">
            {data.title || 'Prompt Builder'}
          </h3>
        </div>
        <button onClick={deleteNode} className="p-2 hover:bg-rose-500/10 text-white/20 hover:text-rose-500 rounded-lg transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 bg-black/20">
        {/* Preset templates */}
        <div className="relative">
          <button onClick={() => setPresetsOpen(!presetsOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/40 hover:border-[#fb923c]/30 transition-all">
            <span>Plantillas rápidas</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${presetsOpen ? 'rotate-180' : ''}`} />
          </button>
          {presetsOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 overflow-hidden z-50" style={{ background: '#1e2028' }}>
              {PRESET_TEMPLATES.map(pt => (
                <button key={pt.label} onClick={() => { handleTemplateChange(pt.template); setPresetsOpen(false); }}
                  className="w-full px-3 py-2 text-left text-[10px] text-white/50 hover:bg-white/[0.06] hover:text-white transition-all">
                  {pt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Template editor */}
        <div>
          <p className="text-[9px] text-white/25 uppercase tracking-widest mb-1.5 font-bold">Template — usa {'{{variable}}'}</p>
          <textarea
            value={data.template || ''}
            onChange={e => handleTemplateChange(e.target.value)}
            onKeyDown={e => e.stopPropagation()}
            placeholder="Ej: Crea un anuncio para {{producto}} dirigido a {{audiencia}}…"
            className="w-full text-xs leading-relaxed text-white/60 bg-white/[0.03] border border-white/[0.06] p-3 rounded-xl focus:outline-none focus:border-[#fb923c]/40 transition-all resize-none min-h-[60px] placeholder:text-white/15"
          />
        </div>

        {/* Variable inputs */}
        {vars.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] text-white/25 uppercase tracking-widest font-bold">Variables detectadas</p>
            {vars.map(v => (
              <div key={v.key} className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-[#fb923c]/70 font-mono shrink-0 min-w-[70px] truncate">{`{{${v.key}}}`}</span>
                <input
                  value={v.value}
                  onChange={e => handleVarChange(v.key, e.target.value)}
                  onKeyDown={e => e.stopPropagation()}
                  placeholder={v.key}
                  className="flex-1 text-[10px] text-white/70 bg-white/[0.04] border border-white/[0.07] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#fb923c]/40 transition-all placeholder:text-white/15"
                />
              </div>
            ))}
          </div>
        )}

        {/* Compiled preview */}
        {compiled && data.template && (
          <div className="rounded-xl bg-[#fb923c]/[0.05] border border-[#fb923c]/[0.15] p-3">
            <p className="text-[9px] text-[#fb923c]/60 uppercase tracking-widest font-bold mb-1">Preview del prompt</p>
            <p className="text-[10px] text-white/50 leading-relaxed line-clamp-3">{compiled}</p>
          </div>
        )}

        {/* Port label */}
        <div className="flex items-center justify-end text-[9px] text-white/15 uppercase tracking-widest font-sans">
          <span className="flex items-center gap-1">Prompt compilado<span className="w-1.5 h-1.5 rounded-full bg-[#fb923c] inline-block" /></span>
        </div>
      </div>

      <NodeConnectionDropdown nodeType="promptBuilder" nodeId={id} onAddConnected={data.onAddConnected ?? (() => {})} />

      <Handle type="source" position={Position.Right} id="text-out" className="!w-3 !h-3 !-right-1.5 !bg-[#fb923c] !border-2 !border-[#191a1f] hover:scale-125 transition-transform" />
    </div>
  );
};

export default memo(PromptBuilderNode);
