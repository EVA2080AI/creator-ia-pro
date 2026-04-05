import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

export function renderMarkdown(text: string): string {
  let raw = text
    // Thinking blocks
    .replace(/(?:<thinking>|\[thinking\]|thinking\n)([\s\S]*?)(?:<\/thinking>|\[\/thinking\]|(?=\s*\n\w+:\s*)|$)/gi, (_m, content) => 
      `<details class="thinking-block group my-6 rounded-[24px] border border-zinc-200 bg-zinc-50/50 overflow-hidden transition-all duration-500">
        <summary class="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-zinc-100/50 transition-colors list-none outline-none">
          <div class="flex items-center gap-3">
            <div class="h-6 w-6 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 group-open:text-primary group-open:border-primary/20 transition-all">
              <svg class="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z"/></svg>
            </div>
            <span class="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 group-open:text-zinc-900 transition-colors">Pensamiento Crítico de Genesis AI</span>
          </div>
          <svg class="w-4 h-4 text-zinc-300 group-open:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </summary>
        <div class="px-7 pb-6 pt-2">
          <div class="text-[11px] text-zinc-500 font-bold italic leading-relaxed pl-4 border-l-2 border-primary/20">${content.trim()}</div>
        </div>
      </details>`)
    // GitHub-style Alerts
    .replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n((?:>.*\n?)*)/gm, (_m, type, body) => {
      const content = body.replace(/^>\s?/gm, '').trim();
      const alertStyles: Record<string, { bg: string; border: string; icon: string; label: string; text: string }> = {
        'NOTE':      { bg: 'bg-blue-50',    border: 'border-blue-200', icon: '💡', label: 'Nota',       text: 'text-blue-800' },
        'TIP':       { bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: '✅', label: 'Tip',      text: 'text-emerald-800' },
        'IMPORTANT': { bg: 'bg-violet-50',   border: 'border-violet-200', icon: '🔮', label: 'Importante', text: 'text-violet-800' },
        'WARNING':   { bg: 'bg-amber-50',    border: 'border-amber-200', icon: '⚠️', label: 'Advertencia', text: 'text-amber-800' },
        'CAUTION':   { bg: 'bg-rose-50',     border: 'border-rose-200', icon: '🚨', label: 'Precaución', text: 'text-rose-800' },
      };
      const s = alertStyles[type] || alertStyles['NOTE'];
      return `<div class="my-6 rounded-2xl ${s.bg} ${s.border} border p-5 animate-in fade-in duration-500">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-sm">${s.icon}</span>
          <span class="text-[10px] font-black uppercase tracking-[0.2em] ${s.text}">${s.label}</span>
        </div>
        <div class="text-[12px] font-medium ${s.text} leading-relaxed">${content}</div>
      </div>`;
    })
    // Mermaid
    .replace(/```mermaid\n?([\s\S]*?)```/g, (_m, code) =>
      `<div class="my-6 rounded-[24px] border border-indigo-200 bg-indigo-50/50 overflow-hidden animate-in zoom-in-95 duration-500">
        <div class="flex items-center gap-2 px-5 py-3 border-b border-indigo-100">
          <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
          <span class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.15em]">Diagrama de Arquitectura</span>
        </div>
        <pre class="p-5 text-[11px] font-mono leading-relaxed text-indigo-700 overflow-x-auto">${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </div>`)
    // Tables
    .replace(/^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (_m, headerRow, bodyRows) => {
      const headers = headerRow.split('|').map((h: string) => h.trim()).filter(Boolean);
      const rows = bodyRows.trim().split('\n').map((row: string) => 
        row.split('|').map((c: string) => c.trim()).filter(Boolean)
      );
      return `<div class="my-6 rounded-2xl border border-zinc-200 overflow-hidden">
        <table class="w-full text-[11px]">
          <thead><tr class="bg-zinc-50 border-b border-zinc-200">
            ${headers.map((h: string) => `<th class="px-4 py-2.5 text-left font-black text-zinc-600 uppercase tracking-widest text-[10px]">${h}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${rows.map((row: string[]) => `<tr class="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">${row.map((c: string) => `<td class="px-4 py-2.5 text-zinc-600 font-medium">${c}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    })
    // Code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, lang, code) =>
      `<div class="code-mini-frame group my-6 rounded-[24px] border border-zinc-200 bg-zinc-900 shadow-2xl shadow-zinc-200/50 overflow-hidden animate-in zoom-in-95 duration-500">
        <div class="flex items-center justify-between px-5 py-3 bg-zinc-800/50 border-b border-white/5">
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/40"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-amber-500/30 border border-amber-500/40"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-emerald-500/30 border border-emerald-500/40"></div>
            <span class="ml-3 text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">${lang || 'archivo'}</span>
          </div>
          <div class="h-4 w-4 rounded-md bg-white/5 flex items-center justify-center text-white/20 hover:text-white/60 transition-colors cursor-pointer">
            <svg class="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          </div>
        </div>
        <pre class="p-6 text-[11px] font-mono leading-relaxed bg-transparent overflow-x-auto"><code class="text-zinc-300 block">${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      </div>`)
    // Diff blocks
    .replace(/```diff\n?([\s\S]*?)```/g, (_m, code) =>
      `<div class="my-6 rounded-[24px] border border-zinc-200 bg-zinc-900 overflow-hidden">
        <div class="flex items-center gap-2 px-5 py-3 bg-zinc-800/50 border-b border-white/5">
          <span class="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">diff</span>
        </div>
        <pre class="p-5 text-[11px] font-mono leading-relaxed overflow-x-auto">${code.trim().split('\n').map((line: string) => {
          const escaped = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          if (line.startsWith('+')) return `<span class="text-emerald-400">${escaped}</span>`;
          if (line.startsWith('-')) return `<span class="text-rose-400">${escaped}</span>`;
          return `<span class="text-zinc-500">${escaped}</span>`;
        }).join('\n')}</pre>
      </div>`)
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-[14px] font-black text-zinc-900 mt-6 mb-2 tracking-tight">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-[16px] font-black text-zinc-900 mt-8 mb-3 tracking-tight">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="text-[18px] font-black text-zinc-900 mt-10 mb-4 tracking-tight">$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-900 font-black">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-100 px-2 py-0.5 rounded-lg text-primary font-mono text-[10px] border border-zinc-200/50 font-bold">$1</code>')
    // Plan Checkboxes
    .replace(/^\[( |x|X)\] (.+)$/gm, (_m, check, text) => 
      `<div class="flex items-center gap-3 my-2 group/task">
        <div class="h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all ${check.toLowerCase() === 'x' ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-white border-zinc-200 group-hover/task:border-primary/50'}">
          ${check.toLowerCase() === 'x' ? '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
        </div>
        <span class="text-xs font-bold ${check.toLowerCase() === 'x' ? 'text-zinc-400 line-through decoration-primary/30' : 'text-zinc-700'}">${text}</span>
      </div>`)
    .replace(/^\d+\. (.+)$/gm, '<li class="flex items-start gap-3 text-zinc-600 mb-1.5 font-medium"><span class="text-primary font-black text-[11px] mt-0.5 tracking-tighter">0$1.</span><span>$2</span></li>')
    .replace(/^[-•] (.+)$/gm, '<li class="flex items-start gap-3 text-zinc-600 mb-1.5 font-medium"><div class="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0 shadow-sm shadow-primary/50"></div><span>$1</span></li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-zinc-100 my-8"/>')
    // Line breaks
    .replace(/\n\n/g, '<div class="my-4"></div>')
    .replace(/\n/g, '<br/>');

  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['strong','em','code','pre','li','br','h1','h2','h3','span','div','hr','svg','path','details','summary','table','thead','tbody','tr','th','td'],
    ALLOWED_ATTR: ['class','style','fill','stroke','viewBox','d','stroke-linecap','stroke-linejoin','stroke-width'],
  });
}
