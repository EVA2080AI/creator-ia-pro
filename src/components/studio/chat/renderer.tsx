import DOMPurify from 'dompurify';

export function renderMarkdown(text: string): string {
  if (!text) return '';
  const raw = text
    // ── Thinking blocks ─────────────────────────────────────────────────────
    .replace(/(?:<thinking>|\[thinking\]|thinking\n)([\s\S]*?)(?:<\/thinking>|\[\/thinking\]|(?=\s*\n\w+:\s*)|$)/gi, (_m, content) =>
      `<details class="thinking-block group my-6 rounded-2xl border border-zinc-200 bg-zinc-50 overflow-hidden">
        <summary class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-zinc-100/70 transition-colors list-none outline-none">
          <div class="flex items-center gap-3">
            <svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z"/></svg>
            <span class="text-[11px] font-bold text-zinc-500 tracking-wide">Razonamiento interno</span>
          </div>
          <svg class="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </summary>
        <div class="px-6 pb-5 pt-3 text-[12.5px] text-zinc-600 font-medium leading-relaxed border-t border-zinc-200 bg-white/60 italic">
          ${content.trim()}
        </div>
      </details>`)
    // ── GitHub-style Alerts ──────────────────────────────────────────────────
    .replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n((?:>.*\n?)*)/gm, (_m, type, body) => {
      const content = body.replace(/^>\s?/gm, '').trim();
      const styles: Record<string, { bg: string; border: string; dot: string; label: string; text: string }> = {
        'NOTE':      { bg: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-blue-400',    label: 'Nota',        text: 'text-blue-800' },
        'TIP':       { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-400', label: 'Consejo',     text: 'text-emerald-800' },
        'IMPORTANT': { bg: 'bg-violet-50',  border: 'border-violet-200',  dot: 'bg-violet-400',  label: 'Importante',  text: 'text-violet-800' },
        'WARNING':   { bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-400',   label: 'Advertencia', text: 'text-amber-800' },
        'CAUTION':   { bg: 'bg-rose-50',    border: 'border-rose-200',    dot: 'bg-rose-400',    label: 'Precaución',  text: 'text-rose-800' },
      };
      const s = styles[type] || styles['NOTE'];
      return `<div class="my-5 rounded-xl ${s.bg} border ${s.border} px-5 py-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 rounded-full ${s.dot}"></div>
          <span class="text-[10px] font-black uppercase tracking-widest ${s.text}">${s.label}</span>
        </div>
        <div class="text-[13px] font-medium ${s.text} leading-relaxed">${content}</div>
      </div>`;
    })
    // ── Mermaid diagrams ─────────────────────────────────────────────────────
    .replace(/```mermaid\n?([\s\S]*?)```/g, (_m, code) =>
      `<div class="my-6 rounded-xl border border-indigo-200 bg-indigo-50/50 overflow-hidden">
        <div class="flex items-center gap-2 px-5 py-3 border-b border-indigo-100 bg-indigo-100/40">
          <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
          <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Diagrama</span>
        </div>
        <pre class="p-5 text-[12px] font-mono leading-relaxed text-indigo-700 overflow-x-auto">${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </div>`)
    // ── Markdown tables ──────────────────────────────────────────────────────
    .replace(/^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (_m, headerRow, bodyRows) => {
      const headers = headerRow.split('|').map((h: string) => h.trim()).filter(Boolean);
      const rows = bodyRows.trim().split('\n').map((row: string) =>
        row.split('|').map((c: string) => c.trim()).filter(Boolean)
      );
      return `<div class="my-6 rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <table class="w-full text-[12.5px]">
          <thead><tr class="bg-zinc-50 border-b border-zinc-200">
            ${headers.map((h: string) => `<th class="px-4 py-3 text-left font-bold text-zinc-700 text-[11px] uppercase tracking-wide">${h}</th>`).join('')}
          </tr></thead>
          <tbody class="divide-y divide-zinc-100">
            ${rows.map((row: string[]) => `<tr class="hover:bg-zinc-50/70 transition-colors">${row.map((c: string) => `<td class="px-4 py-3 text-zinc-600 font-medium">${c}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    })
    // ── Diff blocks ──────────────────────────────────────────────────────────
    .replace(/```diff\n?([\s\S]*?)```/g, (_m, code) =>
      `<div class="my-5 rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden shadow-md">
        <div class="flex items-center gap-2 px-5 py-3 bg-zinc-800 border-b border-zinc-700">
          <div class="w-2 h-2 rounded-full bg-blue-400"></div>
          <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cambios (diff)</span>
        </div>
        <pre class="p-5 text-[12px] font-mono leading-relaxed overflow-x-auto">${code.trim().split('\n').map((line: string) => {
          const escaped = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          if (line.startsWith('+')) return `<span class="text-emerald-400">${escaped}</span>`;
          if (line.startsWith('-')) return `<span class="text-rose-400">${escaped}</span>`;
          return `<span class="text-zinc-500">${escaped}</span>`;
        }).join('\n')}</pre>
      </div>`)
    // ── Code blocks ──────────────────────────────────────────────────────────
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, lang, code) => {
      const displayName =
        lang === 'tsx'  ? 'TSX'        :
        lang === 'ts'   ? 'TypeScript' :
        lang === 'js'   ? 'JavaScript' :
        lang === 'jsx'  ? 'JSX'        :
        lang === 'css'  ? 'CSS'        :
        lang === 'json' ? 'JSON'       :
        lang === 'html' ? 'HTML'       :
        lang === 'sql'  ? 'SQL'        :
        (lang === 'bash' || lang === 'sh') ? 'Shell' :
        lang ? lang.toUpperCase() : 'Código';
      return `<div class="code-block group my-5 rounded-xl border border-zinc-200 bg-zinc-950 overflow-hidden shadow-md">
        <div class="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
          <div class="flex items-center gap-3">
            <div class="flex gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            </div>
            <span class="text-[11px] font-semibold text-zinc-400">${displayName}</span>
          </div>
          <button
            onclick="(function(btn){const code=btn.closest('.code-block').querySelector('code');if(code){navigator.clipboard.writeText(code.innerText).then(()=>{btn.textContent='✓ Copiado';setTimeout(()=>{btn.textContent='Copiar'},1600)})}})(this)"
            class="text-[10px] font-semibold text-zinc-500 hover:text-zinc-200 transition-colors px-2.5 py-1 rounded-md hover:bg-zinc-700/60"
          >Copiar</button>
        </div>
        <pre class="p-5 text-[12.5px] font-mono leading-[1.7] overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700"><code class="text-zinc-200 block whitespace-pre">${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      </div>`;
    })
    // ── Headers ──────────────────────────────────────────────────────────────
    .replace(/^### (.+)$/gm, '<h3 class="text-[15px] font-bold text-zinc-900 mt-8 mb-2 leading-snug">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-[18px] font-bold text-zinc-900 mt-10 mb-3 leading-snug">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="text-[21px] font-bold text-zinc-900 mt-12 mb-4 pb-2 border-b border-zinc-200 leading-snug">$1</h1>')
    // ── Bold + Italic ─────────────────────────────────────────────────────────
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-zinc-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-zinc-700">$1</em>')
    // ── Inline code ──────────────────────────────────────────────────────────
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-100 text-primary px-1.5 py-0.5 rounded-md font-mono text-[11.5px] font-semibold border border-zinc-200">$1</code>')
    // ── Task checkboxes ───────────────────────────────────────────────────────
    .replace(/^\[( |x|X)\] (.+)$/gm, (_m, check, content) => {
      const done = check.toLowerCase() === 'x';
      return `<div class="flex items-center gap-3 my-2">
        <div class="h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 ${done ? 'bg-primary border-primary' : 'border-zinc-300 bg-white'}">
          ${done ? '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
        </div>
        <span class="text-[13px] font-medium ${done ? 'text-zinc-400 line-through decoration-zinc-300' : 'text-zinc-800'}">${content}</span>
      </div>`;
    })
    // ── Ordered list ──────────────────────────────────────────────────────────
    .replace(/^\d+\. (.+)$/gm, '<li class="flex items-baseline gap-3 text-zinc-700 mb-2 font-medium leading-relaxed"><span class="text-primary font-bold text-[11px] shrink-0 mt-0.5">▸</span><span>$1</span></li>')
    // ── Unordered list ────────────────────────────────────────────────────────
    .replace(/^[-•] (.+)$/gm, '<li class="flex items-baseline gap-3 text-zinc-700 mb-2 font-medium leading-relaxed"><span class="text-zinc-400 shrink-0 mt-0.5">–</span><span>$1</span></li>')
    // ── Horizontal rule ───────────────────────────────────────────────────────
    .replace(/^---$/gm, '<hr class="border-zinc-200 my-8"/>')
    // ── Paragraph spacing ─────────────────────────────────────────────────────
    .replace(/\n\n/g, '<div class="my-4"></div>')
    .replace(/\n/g, '<br/>');

  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'strong', 'em', 'code', 'pre', 'li', 'br', 'h1', 'h2', 'h3',
      'span', 'div', 'hr', 'svg', 'path',
      'details', 'summary',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'button',
    ],
    ALLOWED_ATTR: [
      'class', 'style', 'fill', 'stroke', 'viewBox', 'd',
      'stroke-linecap', 'stroke-linejoin', 'stroke-width',
      'onclick',
    ],
  });
}
