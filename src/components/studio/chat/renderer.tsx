import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

export function renderMarkdown(text: string): string {
  let raw = text
    // Thinking blocks
    .replace(/(?:<thinking>|\[thinking\]|thinking\n)([\s\S]*?)(?:<\/thinking>|\[\/thinking\]|(?=\s*\n\w+:\s*)|$)/gi, (_m, content) => 
      `<details class="thinking-block group my-8 rounded-[2rem] border border-zinc-200/50 bg-zinc-50/20 backdrop-blur-xl overflow-hidden transition-all duration-700 hover:border-primary/30 hover:shadow-2xl">
        <summary class="flex items-center justify-between px-8 py-5 cursor-pointer hover:bg-white/40 transition-all list-none outline-none relative overflow-hidden">
          <div class="absolute inset-0 scanline-overlay opacity-0 group-open:opacity-100 transition-opacity"></div>
          <div class="flex items-center gap-4 relative z-10">
            <div class="h-9 w-9 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 group-open:text-primary group-open:border-primary/30 group-open:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all">
              <svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z"/></svg>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 group-open:text-zinc-900 transition-colors italic leading-none mb-1">NEURAL_DEEP_THINK</span>
              <span class="text-[8px] font-bold text-zinc-300 group-open:text-primary/60 tracking-[0.1em] uppercase italic">Quantum_State: Coherent</span>
            </div>
          </div>
          <svg class="w-4 h-4 text-zinc-300 group-open:rotate-180 transition-transform duration-700 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </summary>
        <div class="px-10 pb-10 pt-4 relative">
          <div class="absolute inset-0 neural-mesh opacity-[0.03] pointer-events-none"></div>
          <div class="text-[12px] text-zinc-600 font-medium italic leading-relaxed pl-8 border-l-[3px] border-primary/30 bg-gradient-to-r from-primary/5 to-transparent py-5 rounded-r-2xl relative z-10">${content.trim()}</div>
        </div>
      </details>`)
    // GitHub-style Alerts
    .replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n((?:>.*\n?)*)/gm, (_m, type, body) => {
      const content = body.replace(/^>\s?/gm, '').trim();
      const alertStyles: Record<string, { bg: string; border: string; icon: string; label: string; text: string; glow: string }> = {
        'NOTE':      { bg: 'bg-blue-50/50',    border: 'border-blue-200/60', icon: '💡', label: 'Protocol_Note',     text: 'text-blue-800',    glow: 'shadow-blue-500/5' },
        'TIP':       { bg: 'bg-emerald-50/50', border: 'border-emerald-200/60', icon: '✅', label: 'Optimization_Tip',   text: 'text-emerald-800', glow: 'shadow-emerald-500/5' },
        'IMPORTANT': { bg: 'bg-violet-50/50',  border: 'border-violet-200/60', icon: '🔮', label: 'Critical_Data',     text: 'text-violet-800',  glow: 'shadow-violet-500/5' },
        'WARNING':   { bg: 'bg-amber-50/50',   border: 'border-amber-200/60', icon: '⚠️', label: 'System_Warning',    text: 'text-amber-800',   glow: 'shadow-amber-500/5' },
        'CAUTION':   { bg: 'bg-rose-50/50',    border: 'border-rose-200/60', icon: '🚨', label: 'High_Risk_Action',  text: 'text-rose-800',    glow: 'shadow-rose-500/5' },
      };
      const s = alertStyles[type] || alertStyles['NOTE'];
      return `<div class="my-8 rounded-[2rem] ${s.bg} ${s.border} border-2 p-7 animate-in fade-in duration-700 backdrop-blur-sm ${s.glow} shadow-2xl">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-lg">${s.icon}</span>
          <span class="text-[10px] font-black uppercase tracking-[0.3em] ${s.text} italic">${s.label}</span>
        </div>
        <div class="text-[13px] font-medium ${s.text} leading-relaxed opacity-90">${content}</div>
      </div>`;
    })
    // Mermaid
    .replace(/```mermaid\n?([\s\S]*?)```/g, (_m, code) =>
      `<div class="my-8 rounded-[2.5rem] border-2 border-indigo-200/50 bg-indigo-50/30 backdrop-blur-md overflow-hidden animate-in zoom-in-95 duration-700 shadow-2xl">
        <div class="flex items-center justify-between px-8 py-4 border-b border-indigo-100/50 bg-indigo-100/30">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
            <span class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em] italic">System_Architecture_Node</span>
          </div>
        </div>
        <pre class="p-8 text-[11px] font-mono leading-relaxed text-indigo-700 overflow-x-auto bg-white/40">${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </div>`)
    // Tables
    .replace(/^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (_m, headerRow, bodyRows) => {
      const headers = headerRow.split('|').map((h: string) => h.trim()).filter(Boolean);
      const rows = bodyRows.trim().split('\n').map((row: string) => 
        row.split('|').map((c: string) => c.trim()).filter(Boolean)
      );
      return `<div class="my-8 rounded-[2rem] border-2 border-zinc-200/60 overflow-hidden shadow-2xl backdrop-blur-sm">
        <table class="w-full text-[12px]">
          <thead><tr class="bg-zinc-50/80 border-b-2 border-zinc-200/60">
            ${headers.map((h: string) => `<th class="px-6 py-4 text-left font-black text-zinc-800 uppercase tracking-[0.2em] text-[10px] italic">${h}</th>`).join('')}
          </tr></thead>
          <tbody class="bg-white/40">
            ${rows.map((row: string[]) => `<tr class="border-b border-zinc-100/50 hover:bg-white/60 transition-colors">${row.map((c: string) => `<td class="px-6 py-4 text-zinc-600 font-medium">${c}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    })
    // Code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, lang, code) =>
      `<div class="code-mini-frame group my-8 rounded-[2.5rem] border border-white/10 bg-zinc-950 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 duration-700 relative">
        <div class="absolute inset-0 scanline-overlay opacity-[0.05] pointer-events-none"></div>
        <div class="flex items-center justify-between px-8 py-5 bg-zinc-900/40 border-b border-white/5 backdrop-blur-3xl relative z-10">
          <div class="flex items-center gap-2">
            <div class="flex gap-1.5 mr-4 opacity-40 group-hover:opacity-100 transition-opacity">
              <div class="w-2.5 h-2.5 rounded-full bg-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]"></div>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] italic group-hover:text-primary transition-colors leading-none mb-1">${lang || 'SOURCE_CODE'}</span>
              <span class="text-[7px] font-bold text-zinc-600 uppercase tracking-[0.1em] italic">Sub-pixel_Rendering: Active</span>
            </div>
          </div>
          <div class="flex items-center gap-4">
             <div class="h-8 w-px bg-white/5 mx-2"></div>
             <div class="h-8 w-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-primary/30 hover:border-primary/50 transition-all cursor-pointer group/copy">
               <svg class="h-4 w-4 group-hover/copy:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
             </div>
          </div>
        </div>
        <pre class="p-10 text-[12.5px] font-mono leading-relaxed bg-[#060608]/50 overflow-x-auto relative z-10 custom-scrollbar selection:bg-primary/40"><code class="text-zinc-300 block">${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        <div class="absolute bottom-4 right-8 text-[8px] font-black text-white/5 uppercase tracking-[0.5em] italic pointer-events-none group-hover:text-white/10 transition-colors">SOVEREIGN_V21.0</div>
      </div>`)
    // Diff blocks
    .replace(/```diff\n?([\s\S]*?)```/g, (_m, code) =>
      `<div class="my-8 rounded-[2.5rem] border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
        <div class="flex items-center gap-3 px-8 py-4 bg-zinc-900 border-b border-white/5">
          <div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] italic">Engineering_Delta</span>
        </div>
        <pre class="p-8 text-[12px] font-mono leading-relaxed overflow-x-auto bg-zinc-950/50">${code.trim().split('\n').map((line: string) => {
          const escaped = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          if (line.startsWith('+')) return `<span class="text-emerald-400 bg-emerald-400/5 px-1 rounded-sm">${escaped}</span>`;
          if (line.startsWith('-')) return `<span class="text-rose-400 bg-rose-400/5 px-1 rounded-sm">${escaped}</span>`;
          return `<span class="text-zinc-500/80">${escaped}</span>`;
        }).join('\n')}</pre>
      </div>`)
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-[15px] font-black text-zinc-900 mt-10 mb-3 tracking-tighter uppercase italic">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-[18px] font-black text-zinc-900 mt-12 mb-4 tracking-tighter uppercase italic">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="text-[22px] font-black text-zinc-950 mt-14 mb-6 tracking-tighter uppercase italic border-b-2 border-primary/20 pb-2 w-fit">$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-950 font-black tracking-tight">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-zinc-700 italic">$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-100/80 px-2.5 py-1 rounded-xl text-primary font-mono text-[11px] border border-primary/10 font-bold shadow-sm">$1</code>')
    // Plan Checkboxes
    .replace(/^\[( |x|X)\] (.+)$/gm, (_m, check, text) => 
      `<div class="flex items-center gap-4 my-3 group/task">
        <div class="h-6 w-6 rounded-xl border-2 flex items-center justify-center transition-all duration-500 ${check.toLowerCase() === 'x' ? 'bg-primary border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]' : 'bg-white border-zinc-200 group-hover/task:border-primary/50 group-hover/task:shadow-lg'}">
          ${check.toLowerCase() === 'x' ? '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
        </div>
        <span class="text-[13px] font-bold ${check.toLowerCase() === 'x' ? 'text-zinc-400 line-through decoration-primary/40' : 'text-zinc-800' }">${text}</span>
      </div>`)
    .replace(/^\d+\. (.+)$/gm, '<li class="flex items-start gap-4 text-zinc-700 mb-2.5 font-medium leading-relaxed"><span class="text-primary font-black text-[12px] mt-1 tracking-tighter opacity-70">0$1.</span><span class="flex-1">$2</span></li>')
    .replace(/^[-•] (.+)$/gm, '<li class="flex items-start gap-4 text-zinc-700 mb-2.5 font-medium leading-relaxed"><div class="h-2 w-2 rounded-full bg-primary/40 mt-2.5 flex-shrink-0 shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]"></div><span class="flex-1">$1</span></li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-zinc-100/60 my-10 relative after:content-[\'AETHER_SYSTEM\'] after:absolute after:left-1/2 after:-translate-x-1/2 after:-top-2 after:bg-white after:px-4 after:text-[8px] after:font-black after:text-zinc-300 after:tracking-[0.5em]"/>')
    // Line breaks
    .replace(/\n\n/g, '<div class="my-6"></div>')
    .replace(/\n/g, '<br/>');

  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['strong','em','code','pre','li','br','h1','h2','h3','span','div','hr','svg','path','details','summary','table','thead','tbody','tr','th','td'],
    ALLOWED_ATTR: ['class','style','fill','stroke','viewBox','d','stroke-linecap','stroke-linejoin','stroke-width'],
  });
}
