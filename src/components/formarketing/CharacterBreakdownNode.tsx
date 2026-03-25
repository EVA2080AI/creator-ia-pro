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
    <div className="bg-card/90 border border-white/10 rounded-xl p-5 w-72 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary/20 p-2 rounded-lg">
           <UserCircle className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-foreground font-bold tracking-tight">Character Breakdown</h3>
      </div>
      
      <div className="space-y-3 text-muted-foreground text-sm">
        <p className="flex items-center gap-2"><span className="font-bold text-foreground">1. {data.title || "The Slow Starter"}</span> 😌</p>
        <p className="text-xs opacity-80">{data.flavor || "Flavor: Blueberry & Lavender"}</p>
        <p className="border-t border-white/10 pt-3 leading-relaxed">{data.description || "Starting point: Morning routine. Trying to wake up but loving the slow pace of the morning."}</p>
        
        <div className="bg-black/20 p-3 rounded-lg text-xs mt-4 border border-white/5">
          <p className="font-bold text-foreground mb-2">Casting direction:</p>
          <ul className="list-disc list-inside space-y-1 opacity-80">
            <li>Natural, relaxed presence</li>
            <li>Expressive without overperforming</li>
            <li>Cozy aesthetic</li>
          </ul>
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="a" className="w-3 h-3 bg-primary border-none" />
    </div>
  );
};

export default memo(CharacterBreakdownNode);
