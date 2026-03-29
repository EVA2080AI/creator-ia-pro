import { useState, useEffect } from 'react';
import { X, Zap, Copy, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Node } from '@xyflow/react';
import { toast } from 'sonner';

const NODE_TYPE_LABELS: Record<string, string> = {
  characterBreakdown: 'Texto / Persona',
  modelView: 'Generar imagen',
  videoModel: 'Generar video',
  layoutBuilder: 'Diseño / Layout',
  campaignManager: 'Gestor de campaña',
  antigravityBridge: 'Conector de nodos',
};

const NODE_TYPE_COLORS: Record<string, string> = {
  characterBreakdown: 'text-aether-purple bg-aether-purple/10 border-aether-purple/20',
  modelView: 'text-white bg-white/10 border-white/10',
  videoModel: 'text-aether-blue bg-aether-blue/10 border-aether-blue/20',
  layoutBuilder: 'text-white/50 bg-white/5 border-white/10',
  campaignManager: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  antigravityBridge: 'text-white bg-white/15 border-white/10',
};

const IMAGE_MODELS = [
  { id: 'flux-schnell',  label: 'FLUX Schnell (2cr)' },
  { id: 'flux-pro',      label: 'FLUX Pro (4cr)' },
  { id: 'flux-pro-1.1',  label: 'FLUX Pro 1.1 (4cr)' },
  { id: 'sdxl',          label: 'SDXL (2cr)' },
];

const TEXT_MODELS = [
  { id: 'deepseek-chat',      label: 'DeepSeek V3 (1cr)' },
  { id: 'gemini-3-flash',     label: 'Gemini Flash (1cr)' },
  { id: 'gemini-3.1-pro-low', label: 'Gemini 2.5 Pro (1cr)' },
  { id: 'claude-3.5-sonnet',  label: 'Claude Sonnet (4cr)' },
  { id: 'gpt-oss-120b',       label: 'Llama 4 (2cr)' },
];

interface PropertyInspectorProps {
  node: Node | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: Partial<Record<string, any>>) => void;
  onExecute: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
}

export function PropertyInspector({ node, onClose, onUpdate, onExecute, onDelete }: PropertyInspectorProps) {
  const [localPrompt, setLocalPrompt] = useState('');
  const [localModel, setLocalModel] = useState('');

  useEffect(() => {
    if (node) {
      setLocalPrompt((node.data as any)?.prompt || '');
      setLocalModel((node.data as any)?.model || '');
    }
  }, [node?.id]);

  if (!node) return null;

  const nodeType = node.type || 'modelView';
  const data = node.data as any;
  const typeLabel = NODE_TYPE_LABELS[nodeType] || nodeType;
  const typeColor = NODE_TYPE_COLORS[nodeType] || 'text-white/50 bg-white/5 border-white/10';
  const isImageNode = nodeType === 'modelView';
  const isTextNode = nodeType === 'characterBreakdown' || nodeType === 'layoutBuilder' || nodeType === 'campaignManager';
  const models = isImageNode ? IMAGE_MODELS : TEXT_MODELS;

  const handleApply = () => {
    onUpdate(node.id, { prompt: localPrompt, model: localModel });
    toast.success('Propiedades actualizadas');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(localPrompt);
    toast.success('Prompt copiado');
  };

  return (
    <div className="w-[280px] shrink-0 flex flex-col border-l border-white/[0.06] bg-[#030304] animate-in slide-in-from-right duration-200 overflow-y-auto no-scrollbar">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border uppercase tracking-widest ${typeColor}`}>
            {typeLabel}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="w-7 h-7 rounded-lg text-white/20 hover:text-white hover:bg-white/5">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Node ID */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-[9px] text-white/20 font-mono">{node.id.slice(0, 16)}…</p>
        <p className="text-sm font-bold text-white mt-0.5 truncate">{data.title || 'Sin título'}</p>
      </div>

      <div className="px-4 py-3 space-y-4">

        {/* Status badge */}
        {data.status && (
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${
              data.status === 'ready' ? 'bg-green-400' :
              data.status === 'executing' ? 'bg-amber-400 animate-pulse' :
              data.status === 'error' ? 'bg-rose-400' : 'bg-white/20'
            }`} />
            <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">{data.status}</span>
          </div>
        )}

        {/* Prompt editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Prompt</label>
            <button onClick={handleCopy} className="text-white/20 hover:text-white transition-colors">
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <textarea
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            rows={4}
            placeholder="Describe lo que quieres generar..."
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white/80 placeholder:text-white/15 focus:outline-none focus:border-aether-purple/30 resize-none transition-all"
          />
        </div>

        {/* Model selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Modelo</label>
          <div className="relative">
            <select
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full appearance-none bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white/70 focus:outline-none focus:border-aether-purple/30 cursor-pointer pr-8 transition-all"
            >
              <option value="">Seleccionar modelo...</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20 pointer-events-none" />
          </div>
        </div>

        {/* Apply button */}
        <Button
          onClick={handleApply}
          className="w-full h-9 bg-white/5 border border-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
        >
          Aplicar cambios
        </Button>

        <div className="h-px bg-white/[0.04]" />

        {/* Asset preview */}
        {data.assetUrl && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Output</label>
            {nodeType === 'videoModel' ? (
              <video src={data.assetUrl} className="w-full rounded-xl" controls />
            ) : (
              <img src={data.assetUrl} alt="output" className="w-full rounded-xl border border-white/[0.06]" />
            )}
          </div>
        )}
        {data.text && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Resultado</label>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 text-xs text-white/50 max-h-40 overflow-y-auto no-scrollbar leading-relaxed">
              {data.text}
            </div>
          </div>
        )}

        <div className="h-px bg-white/[0.04]" />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onExecute(node.id)}
            className="flex-1 h-9 bg-aether-purple/10 border border-aether-purple/20 text-aether-purple hover:bg-aether-purple/20 rounded-xl text-[10px] font-bold uppercase tracking-widest gap-1.5 transition-all"
          >
            <Zap className="w-3 h-3 fill-current" /> Ejecutar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { onDelete(node.id); onClose(); }}
            className="h-9 w-9 rounded-xl text-white/20 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

      </div>
    </div>
  );
}
