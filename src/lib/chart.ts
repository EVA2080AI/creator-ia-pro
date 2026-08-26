// Renderiza bloques ```chart (JSON) emitidos por el modelo como SVG inline.
// Puerto directo de la implementación de referencia (asistente-ia.html).
import { escapeHtml } from "./markdown";

const VIZ = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)", "var(--viz-4)"];
const r2 = (v: number) => Math.round(v * 100) / 100;

function fmtNum(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return r2(n / 1e9) + " mil M";
  if (abs >= 1e6) return r2(n / 1e6) + " M";
  if (abs >= 1000) return Math.round(n).toLocaleString("es-CO");
  return String(r2(n));
}
const fmtVal = (n: number, u: string) => (u === "$" ? "$" + fmtNum(n) : fmtNum(n) + (u || ""));

function niceTicks(min: number, max: number): number[] {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return [min, max];
  const step0 = Math.pow(10, Math.floor(Math.log10(span / 4)));
  const err = span / 4 / step0;
  const step = step0 * (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const count = Math.round((hi - lo) / step);
  if (!Number.isFinite(count) || count < 1 || count > 20) return [min, max];
  const t: number[] = [];
  for (let i = 0; i <= count; i++) t.push(Math.round((lo + i * step) * 1e9) / 1e9);
  return t;
}

interface Series { nombre: string; datos: number[] }

function chartTable(labels: string[], series: Series[], u: string): string {
  let t = "<div class='md-table-wrap'><table><tr><th></th>" +
    series.map((s) => "<th>" + escapeHtml(s.nombre) + "</th>").join("") + "</tr>";
  labels.forEach((l, i) => {
    t += "<tr><td>" + escapeHtml(l) + "</td>" +
      series.map((s) => "<td>" + escapeHtml(fmtVal(s.datos[i], u)) + "</td>").join("") + "</tr>";
  });
  return "<details class='md-chart-data'><summary>Ver datos</summary>" + t + "</table></div></details>";
}

export function chartHtml(code: string): string | null {
  let spec: any;
  try { spec = JSON.parse(code); } catch { return null; }
  if (!spec || typeof spec !== "object") return null;
  const tipo = spec.tipo;
  if (!["lineas", "barras", "dona"].includes(tipo)) return null;
  const u = typeof spec.unidad === "string" ? spec.unidad.slice(0, 6) : "";
  const titulo = escapeHtml(String(spec.titulo || ""));
  let labels: string[] = Array.isArray(spec.etiquetas) ? spec.etiquetas.slice(0, 12).map(String) : [];
  let series: Series[] = (Array.isArray(spec.series) ? spec.series.slice(0, 4) : []).map((s: any) => ({
    nombre: String(s?.nombre ?? "Serie"),
    datos: (Array.isArray(s?.datos) ? s.datos : []).map((v: unknown) =>
      typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN),
  })).filter((s: Series) => s.datos.length && s.datos.every(Number.isFinite));
  if (!labels.length || !series.length) return null;
  const n = Math.min(labels.length, ...series.map((s) => s.datos.length));
  if (n < (tipo === "lineas" ? 2 : 1)) return null;
  labels = labels.slice(0, n);
  series = series.map((s) => ({ ...s, datos: s.datos.slice(0, n) }));

  const legend = series.length > 1
    ? "<div class='md-chart-legend'>" + series.map((s, i) =>
        "<span><i style='background:" + VIZ[i] + "'></i>" + escapeHtml(s.nombre) + "</span>").join("") + "</div>"
    : "";
  const head = "<div class='md-chart-card'>" + (titulo ? "<div class='md-chart-title'>" + titulo + "</div>" : "");
  const foot = chartTable(labels, series, u) + "</div>";

  if (tipo === "dona") return donutSvg(head, foot, labels, series[0], u, String(spec.titulo || ""));

  const all = series.flatMap((s) => s.datos);
  let dMin = Math.min(...all), dMax = Math.max(...all);
  if (tipo === "barras") { dMin = Math.min(0, dMin); dMax = Math.max(0, dMax); }
  const ticks = niceTicks(dMin, dMax);
  const lo = ticks[0], hi = ticks[ticks.length - 1];
  if (ticks.length < 2 || !(hi > lo) || !Number.isFinite(hi - lo)) return null;
  const W = 560, H = 230, padL = 48, padT = 12, padB = 24;
  const padR = tipo === "lineas" ? 14 + Math.min(90, 8 + 7 * Math.max(...series.map((s) => s.nombre.length))) : 12;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const y = (v: number) => r2(padT + ((hi - v) / (hi - lo)) * plotH);
  let g = "";
  for (const t of ticks) {
    const yy = y(t);
    g += `<line x1='${padL}' y1='${yy}' x2='${W - padR}' y2='${yy}' stroke='${t === 0 || t === lo ? "var(--viz-axis)" : "var(--viz-grid)"}' stroke-width='1'/>`;
    g += `<text x='${padL - 8}' y='${yy + 3.5}' text-anchor='end'>${escapeHtml(fmtVal(t, u))}</text>`;
  }
  const xStep = Math.ceil(n / 8);

  if (tipo === "barras") {
    const groupW = plotW / n;
    const k = series.length;
    const barW = r2(Math.min(30, Math.max(6, (groupW - 10 - 2 * (k - 1)) / k)));
    const y0 = y(Math.max(lo, Math.min(hi, 0)));
    labels.forEach((lb, i) => {
      const start = r2(padL + i * groupW + (groupW - (barW * k + 2 * (k - 1))) / 2);
      series.forEach((s, si) => {
        const v = s.datos[i];
        const x = r2(start + si * (barW + 2));
        const yv = y(v);
        const rr = Math.min(4, barW / 2);
        const top = Math.min(yv, y0), h = Math.max(1, Math.abs(y0 - yv));
        g += `<rect x='${x}' y='${top}' width='${barW}' height='${h}' rx='${rr}' fill='${VIZ[si]}'><title>${escapeHtml(lb + " · " + s.nombre + ": " + fmtVal(v, u))}</title></rect>`;
      });
      if (i % xStep === 0) g += `<text x='${r2(padL + i * groupW + groupW / 2)}' y='${H - 6}' text-anchor='middle'>${escapeHtml(lb)}</text>`;
    });
  } else {
    const x = (i: number) => r2(padL + (i * plotW) / (n - 1));
    const endLbls: { y: number; txt: string }[] = [];
    series.forEach((s, si) => {
      const pts = s.datos.map((v, i) => x(i) + " " + y(v)).join(" L");
      g += `<path d='M${pts}' fill='none' stroke='${VIZ[si]}' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'/>`;
      s.datos.forEach((v, i) => {
        g += `<circle cx='${x(i)}' cy='${y(v)}' r='3' fill='${VIZ[si]}'/>`;
      });
      const last = s.datos[n - 1];
      endLbls.push({ y: y(last), txt: series.length > 1 ? s.nombre : fmtVal(last, u) });
    });
    endLbls.sort((a, b) => a.y - b.y);
    for (let i = 1; i < endLbls.length; i++) if (endLbls[i].y - endLbls[i - 1].y < 13) endLbls[i].y = endLbls[i - 1].y + 13;
    for (const e of endLbls) g += `<text x='${W - padR + 6}' y='${r2(e.y + 3.5)}'>${escapeHtml(e.txt)}</text>`;
    labels.forEach((lb, i) => {
      if (i === n - 1 || (i % xStep === 0 && n - 1 - i > xStep / 2))
        g += `<text x='${x(i)}' y='${H - 6}' text-anchor='middle'>${escapeHtml(lb)}</text>`;
    });
  }
  return head + legend +
    `<svg viewBox='0 0 ${W} ${H}' role='img'>` + g + "</svg>" + foot;
}

function donutSvg(head: string, foot: string, labels: string[], serie: Series, u: string, titulo: string): string | null {
  let items = labels.map((l, i) => ({ l, v: serie.datos[i] }));
  if (items.some((it) => it.v < 0)) return null;
  if (items.length > 4) {
    items.sort((a, b) => b.v - a.v);
    const rest = items.slice(3).reduce((acc, it) => acc + it.v, 0);
    items = [...items.slice(0, 3), { l: "Otros", v: rest }];
  }
  const total = items.reduce((acc, it) => acc + it.v, 0);
  if (!(total > 0)) return null;
  const cx = 80, cy = 80, r0 = 48, r1 = 74;
  const P = (r: number, a: number) => r2(cx + r * Math.sin(a)) + " " + r2(cy - r * Math.cos(a));
  let a = 0, g = "", rows = "";
  items.forEach((it, i) => {
    const isOther = it.l === "Otros" && items.length === 4 && i === 3;
    const frac = it.v / total;
    const a1 = a + frac * Math.PI * 2;
    const large = a1 - a > Math.PI ? 1 : 0;
    const color = isOther ? "var(--txt-3)" : VIZ[i];
    const pct = Math.round(frac * 1000) / 10 + " %";
    if (frac > 0.0005) {
      g += `<path d='M${P(r1, a)} A${r1} ${r1} 0 ${large} 1 ${P(r1, a1)} L${P(r0, a1)} A${r0} ${r0} 0 ${large} 0 ${P(r0, a)} Z' fill='${color}' stroke='var(--bg)' stroke-width='2'><title>${escapeHtml(it.l + ": " + fmtVal(it.v, u) + " (" + pct + ")")}</title></path>`;
    }
    rows += "<span><i style='display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px;background:" + color + "'></i>" +
      escapeHtml(it.l) + " · <b>" + escapeHtml(fmtVal(it.v, u)) + "</b> (" + pct + ")</span>";
    a = a1;
  });
  g += `<text x='${cx}' y='${cy + 6}' text-anchor='middle' font-size='21' font-weight='500' fill='var(--txt)'>${escapeHtml(fmtVal(total, u))}</text>`;
  return head + "<div class='md-chart-donut'>" +
    `<svg viewBox='0 0 160 160' role='img' aria-label='${escapeHtml("Gráfico de dona" + (titulo ? ": " + titulo : ""))}'>` + g + "</svg>" +
    "<div class='md-chart-rows'>" + rows + "</div></div>" + foot;
}
