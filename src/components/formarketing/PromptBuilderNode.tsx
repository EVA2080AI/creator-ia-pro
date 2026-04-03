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
    <div className="group relative rounded-[2rem] overflow-hidden bg-white/90 backdrop-blur-xl border border-zinc-200/60 hover:border-zinc-300 hover:bg-white transition-all w-[300px] shadow-sm hover:shadow-xl duration-500">
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-5 border-b border-zinc-100/80 bg-zinc-50/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-orange-50 border border-orange-100">
            <Braces className="w-4 h-4 text-orange-500" />
          </div>
          <h3 className="text-[10px] font-bold text-zinc-900 tracking-[0.15em] font-sans uppercase">
            {data.title || 'Prompt Builder'}
          </h3>
        </div>
        <button onClick={deleteNode} className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 bg-white">
        {/* Preset templates */}
        <div className="relative">
          <button onClick={() => setPresetsOpen(!presetsOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-white border border-zinc-200 shadow-sm text-[10px] text-zinc-600 hover:border-orange-300 transition-all font-medium">
            <span>Plantillas rápidas</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${presetsOpen ? 'rotate-180' : ''}`} />
          </button>
          {presetsOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-zinc-200 overflow-hidden z-50 bg-white shadow-lg">
              {PRESET_TEMPLATES.map(pt => (
                <button key={pt.label} onClick={() => { handleTemplateChange(pt.template); setPresetsOpen(false); }}
                  className="w-full px-3 py-2 text-left text-[10px] text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all">
                  {pt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Template editor */}
        <div>
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">Template — usa {'{{variable}}'}</p>
          <textarea
            value={data.template || ''}
            onChange={e => handleTemplateChange(e.target.value)}
            onKeyDown={e => e.stopPropagation()}
            placeholder="Ej: Crea un anuncio para {{producto}} dirigido a {{audiencia}}…"
            className="w-full text-xs leading-relaxed text-zinc-900 bg-white border border-zinc-200 shadow-sm p-3 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 transition-all resize-none min-h-[60px] placeholder:text-zinc-400"
          />
        </div>

        {/* Variable inputs */}
        {vars.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Variables detectadas</p>
            {vars.map(v => (
              <div key={v.key} className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-mono shrink-0 min-w-[70px] truncate">{`{{${v.key}}}`}</span>
                <input
                  value={v.value}
                  onChange={e => handleVarChange(v.key, e.target.value)}
                  onKeyDown={e => e.stopPropagation()}
                  placeholder={v.key}
                  className="flex-1 text-[10px] text-zinc-800 bg-white border border-zinc-200 shadow-sm px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-500/10 transition-all placeholder:text-zinc-400"
                />
              </div>
            ))}
          </div>
        )}

        {/* Compiled preview */}
        {compiled && data.template && (
          <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 shadow-sm">
            <p className="text-[9px] text-orange-700 uppercase tracking-widest font-bold mb-1">Preview del prompt</p>
            <p className="text-[10px] text-zinc-700 leading-relaxed line-clamp-3">{compiled}</p>
          </div>
        )}

        {/* Port label */}
        <div className="flex items-center justify-end text-[9px] text-zinc-400 uppercase tracking-widest font-sans mt-2">
          <span className="flex items-center gap-1">Prompt compilado<span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block shadow-sm" /></span>
        </div>
      </div>

      <NodeConnectionDropdown nodeType="promptBuilder" nodeId={id} onAddConnected={data.onAddConnected ?? (() => {})} />

      <Handle type="target" position={Position.Left} id="text-in" className="!w-4 !h-4 !-left-2 !bg-amber-400 !border-2 !border-white hover:!scale-125 transition-transform cursor-crosshair shadow-sm" />
      <Handle type="source" position={Position.Right} id="text-out" className="!w-4 !h-4 !-right-2 !bg-orange-500 !border-2 !border-white hover:!scale-125 transition-transform cursor-crosshair shadow-sm" />
    </div>
  );
};

export default memo(PromptBuilderNode);
