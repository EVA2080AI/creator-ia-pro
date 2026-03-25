import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { UserCircle } from 'lucide-react';

interface CharacterNodeData {
  title?: string;
  flavor?: string;
  description?: string;
}

const CharacterBreakdownNode = ({ data }: { data: CharacterNodeData }) => {
  return (
    <div className="group relative bg-card/40 border border-white/5 rounded-3xl p-0 w-72 shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in duration-300">
      {/* V4.7 Industrial Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-emerald-500/10 to-transparent flex items-center gap-3">
        <div className="bg-emerald-500/20 p-2 rounded-xl shadow-inner">
           <UserCircle className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-[11px] font-black uppercase tracking-tighter text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
            {data.title || "CHARACTER PROFILE"}
          </h3>
          <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">V4.7 Industrial</span>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <div className="space-y-2">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Flavor Context</span>
              <span className="text-[10px] opacity-50 font-mono">ID: 0x47</span>
           </div>
           <p className="text-xs text-foreground/80 bg-white/5 p-2 rounded-xl border border-white/5 italic">
              {data.flavor || "Blueberry & Lavender"}
           </p>
        </div>

        <div className="space-y-2">
           <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Description & Narrative</span>
           <p className="text-xs leading-relaxed text-foreground/70 bg-black/20 p-3 rounded-2xl border border-white/5 min-h-[80px]">
              {data.description || "Starting point: Morning routine. Trying to wake up but loving the slow pace of the morning."}
           </p>
        </div>

        <div className="bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10 transition-all group-hover:bg-emerald-500/10">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             Casting Direction
          </p>
          <ul className="space-y-1 opacity-70">
            <li className="text-[10px] flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
               Natural, relaxed presence
            </li>
            <li className="text-[10px] flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
               Expressive without overperforming
            </li>
          </ul>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-4 h-4 -right-2 bg-emerald-500 border-4 border-background shadow-lg !z-20" />
    </div>
  );
};

export default memo(CharacterBreakdownNode);
