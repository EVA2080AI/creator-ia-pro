// Auditoría de contraste WCAG para pegar en la consola (o en javascript_tool de Claude in Chrome)
// de cualquier página de la app. Recorre cada texto visible, calcula su razón de contraste contra el
// primer fondo sólido de sus ancestros (salta lo que tenga imagen/degradado de fondo: no se puede medir
// así) y devuelve cuántos fallan (<4.5:1 texto normal, <3:1 texto grande) agrupados por clases.
//
// Uso: pegar y leer el resultado. Scrollear la página antes: los bloques con animación de entrada
// (framer-motion) cuentan con opacity 0 hasta que se ven. Se usó en el ciclo 7 (2026-09-30) sobre /pricing.
(async () => {
  window.scrollTo(0, document.body.scrollHeight);
  await new Promise((r) => setTimeout(r, 1500));
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 800));

  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const bgOf = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      // Una TEXTURA en mosaico (la trama de puntos del modo oscuro: background-size de
      // 22px) no cambia el color de fondo en la práctica, pero antes hacía que se
      // saltara TODO el chat. Se atraviesa y se sigue buscando el color sólido de abajo;
      // una imagen o un degradado de verdad (background-size grande o auto) se sigue
      // saltando porque ahí el contraste no se puede calcular con un solo color.
      const tile = cs.backgroundSize.split(" ").map((v) => parseFloat(v));
      const isTexture = tile.length === 2 && tile.every((v) => v > 0 && v <= 64);
      if (cs.backgroundImage !== "none" && !isTexture) return null;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      base = { r: l.r * l.a + base.r * (1 - l.a), g: l.g * l.a + base.g * (1 - l.a), b: l.b * l.a + base.b * (1 - l.a), a: 1 };
    }
    return base;
  };

  const out = {};
  let checked = 0;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode()); ) {
    const t = n.textContent.trim();
    if (t.length < 3) continue;
    const el = n.parentElement;
    if (!el || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    // Un control DESHABILITADO está exento de la regla de contraste (WCAG 1.4.3), y
    // además suele llevar opacity:.3-.4 a propósito. Sin esto, /a/arena salía con 4
    // "fallos" que eran el botón Comparar sin texto escrito y los Votar antes de que
    // haya respuestas — ruido que ya había mandado a investigar una vez.
    if (el.closest("[disabled], [aria-disabled='true'], fieldset:disabled")) continue;
    const box = el.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) continue;
    const cs = getComputedStyle(el);
    const fg = parse(cs.color);
    const bg = bgOf(el);
    if (!fg || !bg) continue;
    let op = 1;
    for (let e = el; e; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity) || 1;
    const a = fg.a * op;
    const mixed = { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) };
    const [hi, lo] = [Math.max(lum(mixed), lum(bg)), Math.min(lum(mixed), lum(bg))];
    const ratio = (hi + 0.05) / (lo + 0.05);
    checked++;
    const size = parseFloat(cs.fontSize);
    const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight) >= 700);
    if (ratio < (large ? 3 : 4.5)) {
      const k = (el.className || "").toString().split(" ").filter((c) => /^(text-|font-)/.test(c)).slice(0, 3).join(" ") + " @" + Math.round(size) + "px";
      out[k] = out[k] || { n: 0, min: 99, ex: t.slice(0, 28) };
      out[k].n++;
      out[k].min = Math.min(out[k].min, ratio);
    }
  }
  const rows = Object.entries(out).sort((a, b) => b[1].n - a[1].n).slice(0, 20).map(([k, v]) => `${v.n}x r=${v.min.toFixed(1)} ${k} "${v.ex}"`);
  return `checked=${checked} failing=${Object.values(out).reduce((a, v) => a + v.n, 0)}\n${rows.join("\n")}`;
})();
