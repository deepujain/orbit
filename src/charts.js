/* orbit charts: the charts a modern dashboard draws, as plain SVG and HTML with no chart library. Each function takes
   rows of data and returns the chart's markup as a string. Every chart is its own data-motion block marked for
   startMotion (bars grow, lines draw, rings fill, dots pop, numbers count up) and a data-cat-chart for Whiskers to sit
   on. Colours come from --pc-1 to --pc-8 in charts.css, which follow the shadcn --chart-1 to --chart-5 variables. */

const f = (n) => Math.round(n * 10) / 10;
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const C = (i) => `var(--pc-${(i % 8) + 1})`;
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** 1234 as "1.2k", 2500000 as "2.5M". */
export function compact(v) {
  const a = Math.abs(v);
  const [d, s] = a >= 1e9 ? [1e9, "B"] : a >= 1e6 ? [1e6, "M"] : a >= 1e4 ? [1e3, "k"] : [1, ""];
  const n = v / d;
  return `${s ? n.toFixed(Math.abs(n) >= 100 ? 0 : 1).replace(/\.0$/, "") : Math.round(n).toLocaleString("en-US")}${s}`;
}
export const pct = (v) => `${Math.round(v)}%`;
const nice = (v) => {
  const p = 10 ** Math.floor(Math.log10(v || 1));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
};
const initials = (name) => name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const at = (cx, cy, r, deg) => {
  const t = ((deg - 90) * Math.PI) / 180;
  return [f(cx + r * Math.cos(t)), f(cy + r * Math.sin(t))];
};
const arc = (cx, cy, r, a0, a1) => `M${at(cx, cy, r, a0)} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${at(cx, cy, r, a1)}`;
const wedge = (cx, cy, r0, r1, a0, a1) => {
  const big = a1 - a0 > 180 ? 1 : 0;
  return `M${at(cx, cy, r1, a0)} A${r1},${r1} 0 ${big} 1 ${at(cx, cy, r1, a1)} L${at(cx, cy, r0, a1)} A${r0},${r0} 0 ${big} 0 ${at(cx, cy, r0, a0)}Z`;
};
// A smooth curve through the points (Catmull-Rom as cubic Béziers).
function smooth(pts) {
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1] || pts[i], pts[i], pts[i + 1], pts[i + 2] || pts[i + 1]];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}
const box = (kind, label, inner, attrs = "") => `<div class="pc pc-k-${kind}" data-motion data-cat-chart role="figure" aria-label="${esc(label)}" ${attrs}>${inner}</div>`;
const svg = (w, h, inner, cls = "") => `<svg class="pc-svg ${cls}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${inner}</svg>`;
const legend = (rows, format, total) => `<div class="pc-legend">${rows.map((r, i) => `<span data-m="fade" style="--m-delay:300ms"><i style="background:${r.color || C(i)}"></i>${esc(r.label)}<b>${format(r.value)}</b>${total ? `<em>${pct((r.value / total) * 100)}</em>` : ""}</span>`).join("")}</div>`;
const xLabels = (labels, x, y) => {
  const edge = x(0) < 20;
  return labels.map((l, i) => `<text x="${f(x(i))}" y="${y}" class="pc-axis" text-anchor="${edge && i === 0 ? "start" : edge && i === labels.length - 1 ? "end" : "middle"}" data-m="fade" style="--m-delay:200ms">${esc(l)}</text>`).join("");
};
const gridLines = (w, ys) => ys.map((y) => `<line x1="0" x2="${w}" y1="${f(y)}" y2="${f(y)}" class="pc-grid" data-m="grow-x"/>`).join("");

/** The big number over a chart, with a change pill and a caption. */
export function headline({ value, delta, caption, invert = false }) {
  const up = delta >= 0;
  const good = invert ? !up : up;
  return `<div class="pc-head" data-motion><b data-count data-m="rise">${esc(value)}</b>${delta == null ? "" : `<span class="pc-pill ${good ? "good" : "bad"}" data-m="pop">${up ? "▲" : "▼"} ${Math.abs(delta)}%</span>`}${caption ? `<small data-m="fade">${esc(caption)}</small>` : ""}</div>`;
}

/** Several small numbers on one line, split by hairlines. */
export function statLine({ items }) {
  return box("statline", "Key numbers", items.map(([label, value]) => `<div data-m="rise"><small>${esc(label)}</small><b data-count>${esc(value)}</b></div>`).join(""));
}

/** A number with its change and a sparkline of the last few periods. */
export function kpi({ label, value, delta, values, invert = false }) {
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => [2 + (i * 116) / (values.length - 1), 34 - ((v - min) / (max - min || 1)) * 30]);
  const good = (delta >= 0) !== invert;
  return box("kpi", label, `<small>${esc(label)}</small><b data-count>${esc(value)}</b><span class="pc-pill ${good ? "good" : "bad"}">${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}%</span>
    ${svg(120, 38, `<path d="${smooth(pts)}" pathLength="1" class="pc-line ${good ? "good" : "bad"}" data-m="draw"/><circle cx="${f(pts.at(-1)[0])}" cy="${f(pts.at(-1)[1])}" r="3" class="pc-dot ${good ? "good" : "bad"}" data-m="pop" style="--m-delay:1100ms"/>`)}`);
}

/** Columns with the peak in full colour, its value above it, and a dashed average line. */
export function columns({ rows, format = compact, width = 440, height = 220, average = true }) {
  const W = width, H = height, top = 26, bottom = 22, n = rows.length;
  const max = nice(Math.max(...rows.map((r) => r.value)));
  const peak = rows.reduce((b, r, i) => (r.value > rows[b].value ? i : b), 0);
  const slot = W / n, bw = slot * 0.62;
  const y = (v) => H - bottom - (v / max) * (H - top - bottom);
  const avg = sum(rows.map((r) => r.value)) / n;
  const bars = rows.map((r, i) => `<rect x="${f(i * slot + (slot - bw) / 2)}" y="${f(y(r.value))}" width="${f(bw)}" height="${f(H - bottom - y(r.value))}" rx="6" fill="${C(0)}" opacity="${i === peak ? 1 : 0.5}" data-m="grow-y"><title>${esc(r.label)}: ${format(r.value)}</title></rect>`).join("");
  const tag = `<text x="${f(peak * slot + slot / 2)}" y="${f(y(rows[peak].value) - 8)}" text-anchor="middle" class="pc-val" data-m="pop" style="--m-delay:700ms" data-count="${format(rows[peak].value)}">${format(rows[peak].value)}</text>`;
  const ref = average ? `<line x1="0" x2="${W}" y1="${f(y(avg))}" y2="${f(y(avg))}" class="pc-ref" data-m="grow-x" style="--m-delay:500ms"/><text x="${W - 4}" y="${f(y(avg) - 5)}" text-anchor="end" class="pc-axis" data-m="fade" style="--m-delay:900ms">avg ${format(avg)}</text>` : "";
  return box("columns", "Columns", svg(W, H, `${gridLines(W, [top, (top + H - bottom) / 2])}<g data-m-group>${bars}</g>${ref}${tag}${xLabels(rows.map((r) => r.label), (i) => i * slot + slot / 2, H - 4)}`));
}

/** Columns stacked by category, with a legend of totals. */
export function stackedColumns({ rows, keys, format = compact, width = 440, height = 220 }) {
  const W = width, H = height, top = 10, bottom = 22, n = rows.length;
  const max = nice(Math.max(...rows.map((r) => sum(r.values))));
  const slot = W / n, bw = slot * 0.56, k = (H - top - bottom) / max;
  const cols = rows.map((r, i) => {
    let base = H - bottom;
    const segs = r.values.map((v, j) => {
      base -= v * k;
      return `<rect x="${f(i * slot + (slot - bw) / 2)}" y="${f(base)}" width="${f(bw)}" height="${f(v * k)}" rx="3" fill="${C(j)}"><title>${esc(keys[j])}: ${format(v)}</title></rect>`;
    }).join("");
    return `<g data-m="grow-y">${segs}</g>`;
  }).join("");
  const totals = keys.map((label, j) => ({ label, value: sum(rows.map((r) => r.values[j])) }));
  return box("stacked", "Stacked columns", svg(W, H, `${gridLines(W, [top, (top + H - bottom) / 2])}<g data-m-group>${cols}</g>${xLabels(rows.map((r) => r.label), (i) => i * slot + slot / 2, H - 4)}`) + legend(totals, format));
}

/** A ranked list of horizontal bars on soft tracks; the leader in full colour, the rest lighter. */
export function rankedBars({ rows, format = compact, color = 0 }) {
  const max = Math.max(...rows.map((r) => r.value));
  return box("ranked", "Ranked bars", `<div class="pc-rows" data-m-group>${rows.map((r, i) => `<div class="pc-rank"><span>${esc(r.label)}</span><b data-count>${format(r.value)}</b><div class="pc-track"><i data-m="grow-x sheen" style="width:${f((r.value / max) * 100)}%;background:${C(color)};opacity:${i ? 0.55 : 1}"></i></div></div>`).join("")}</div>`);
}

/** Lines over time; the first series also fills an area, its peak gets a dot, and a dashed target line. */
export function lineChart({ labels, series, format = compact, target, width = 440, height = 220, area = true }) {
  const W = width, H = height, top = 16, bottom = 22, n = labels.length;
  const max = nice(Math.max(target || 0, ...series.flatMap((s) => s.values)));
  const x = (i) => 8 + (i * (W - 16)) / (n - 1);
  const y = (v) => H - bottom - (v / max) * (H - top - bottom);
  const lines = series.map((s, k) => {
    const pts = s.values.map((v, i) => [x(i), y(v)]);
    const d = smooth(pts);
    const fill = area && k === 0 ? `<path d="${d} L${f(x(n - 1))},${H - bottom} L${f(x(0))},${H - bottom}Z" fill="url(#pc-fade-${k})" data-m="reveal"/>` : "";
    return `${fill}<path d="${d}" pathLength="1" class="pc-line${s.dashed ? " dashed" : ""}" style="stroke:${C(k + 1)};--i:${k}" data-m="${s.dashed ? "fade" : "draw"}"/>`;
  }).join("");
  const s0 = series[0].values;
  const pk = s0.indexOf(Math.max(...s0));
  const defs = `<defs><linearGradient id="pc-fade-0" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${C(1)}" stop-opacity=".35"/><stop offset="1" stop-color="${C(1)}" stop-opacity="0"/></linearGradient></defs>`;
  const ref = target ? `<line x1="0" x2="${W}" y1="${f(y(target))}" y2="${f(y(target))}" class="pc-ref" data-m="grow-x" style="--m-delay:400ms"/><text x="4" y="${f(y(target) - 5)}" class="pc-axis" data-m="fade">target ${format(target)}</text>` : "";
  const dot = `<circle cx="${f(x(pk))}" cy="${f(y(s0[pk]))}" r="6" class="pc-dot" style="stroke:${C(1)};--m-delay:1200ms" data-m="pop"/><text x="${f(x(pk))}" y="${f(y(s0[pk]) - 12)}" text-anchor="middle" class="pc-val" data-m="pop" style="--m-delay:1250ms">${format(s0[pk])}</text>`;
  return box("line", "Line chart", svg(W, H, `${defs}${gridLines(W, [top, (top + H - bottom) / 2])}${ref}${lines}${dot}${xLabels(labels, x, H - 4)}`) + (series.length > 1 ? legend(series.map((s, k) => ({ label: s.name, value: sum(s.values), color: C(k + 1) })), format) : ""));
}

/** This period as a filled area against last period as a dashed line. */
export function areaChart({ labels, now, before, format = compact, width = 440, height = 210 }) {
  return lineChart({ labels, series: [{ name: "This period", values: now }, { name: "Last period", values: before, dashed: true }], format, width, height });
}

/** Pie: wedges that spin in together, with a legend. */
export function pie({ rows, format = compact }) {
  const total = sum(rows.map((r) => r.value));
  let a = 0;
  const parts = rows.map((r, i) => {
    const a0 = a;
    a += (r.value / total) * 360;
    return `<path d="${wedge(100, 100, 0.01, 90, a0, a - 0.01)}" fill="${C(i)}" stroke="var(--pc-card)" stroke-width="2"><title>${esc(r.label)}: ${format(r.value)}</title></path>`;
  }).join("");
  return box("pie", "Pie", `<div class="pc-side">${svg(200, 200, `<g data-m="zoom" data-m-group>${parts}</g>`)}${legend(rows, format, total)}</div>`);
}

/** A donut with rounded, separated segments, the total in the middle, and legend rows with amount and share. */
export function donut({ rows, format = compact, center = "Total" }) {
  const total = sum(rows.map((r) => r.value));
  let a = 0;
  const segs = rows.map((r, i) => {
    const a0 = a;
    a += (r.value / total) * 360;
    return `<path d="${arc(100, 100, 74, a0 + 3, Math.max(a0 + 3.5, a - 3))}" pathLength="1" class="pc-arc" style="stroke:${C(i)}" data-m="draw"><title>${esc(r.label)}</title></path>`;
  }).join("");
  return box("donut", "Donut", `<div class="pc-side"><div class="pc-ringbox">${svg(200, 200, `<circle cx="100" cy="100" r="74" class="pc-arc pc-track-ring"/><g style="--m-step:120ms" data-m-group>${segs}</g>`)}<div class="pc-mid"><b data-count>${format(total)}</b><small>${esc(center)}</small></div></div>${legend(rows, format, total)}</div>`);
}

/** A donut where the leading parts are solid and the long tail is one hatched arc, beside pill legends. */
export function hatchedDonut({ rows, format = compact, solid = 3, center = "Total" }) {
  const sorted = [...rows].sort((p, q) => q.value - p.value);
  const head = sorted.slice(0, solid);
  const rest = { label: "Everything else", value: sum(sorted.slice(solid).map((r) => r.value)) };
  const total = sum(sorted.map((r) => r.value));
  let a = 0;
  const segs = [...head, rest].map((r, i) => {
    const a0 = a;
    a += (r.value / total) * 360;
    return `<path d="${arc(100, 100, 72, a0 + 2.5, a - 2.5)}" pathLength="1" class="pc-arc fat" style="stroke:${i < head.length ? C(i) : "url(#pc-hatch)"}" data-m="draw"/>`;
  }).join("");
  const hatch = `<defs><pattern id="pc-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--pc-muted)"/><rect width="2.5" height="6" fill="var(--pc-sub)" opacity=".55"/></pattern></defs>`;
  const pills = [...head, rest].map((r, i) => `<span class="pc-tag" data-m="pop" style="--m-delay:500ms"><i style="background:${i < head.length ? C(i) : "var(--pc-sub)"}"></i>${esc(r.label)} <b>${pct((r.value / total) * 100)}</b></span>`).join("");
  return box("hatched", "Hatched donut", `<div class="pc-side"><div class="pc-ringbox">${svg(200, 200, `${hatch}<g style="--m-step:140ms">${segs}</g>`)}<div class="pc-mid"><b data-count>${format(total)}</b><small>${esc(center)}</small></div></div><div class="pc-tags">${pills}</div></div>`);
}

/** Concentric radial bars, one ring per row with the largest outermost, beside a legend. */
export function radialRanks({ rows, format = compact }) {
  const sorted = [...rows].sort((p, q) => q.value - p.value);
  const max = sorted[0].value, total = sum(sorted.map((r) => r.value));
  const rings = sorted.map((r, i) => {
    const rad = 88 - i * 16;
    return `<circle cx="100" cy="100" r="${rad}" class="pc-arc thin pc-track-ring"/><path d="${arc(100, 100, rad, 0, 270)}" pathLength="1" class="pc-arc thin" style="stroke:${C(i)};--m-fill:${f(r.value / max)}" data-m="draw"/>`;
  }).join("");
  return box("radial", "Radial bars", `<div class="pc-side"><div class="pc-ringbox">${svg(200, 200, `<g style="--m-step:110ms">${rings}</g>`)}</div>${legend(sorted, format, total)}</div>`);
}

/** A half-donut split between a few parts, the total under the arc and one tile per part. */
export function splitGauge({ rows, format = compact, center = "Total" }) {
  const total = sum(rows.map((r) => r.value));
  let a = -90;
  const segs = rows.map((r, i) => {
    const a0 = a;
    a += (r.value / total) * 180;
    return `<path d="${arc(110, 104, 84, a0 + 1.5, a - 1.5)}" pathLength="1" class="pc-arc fat" style="stroke:${C(i)}" data-m="draw"/>`;
  }).join("");
  return box("split", "Split gauge", `<div class="pc-ringbox half">${svg(220, 112, `<g style="--m-step:160ms">${segs}</g>`)}<div class="pc-mid low"><b data-count>${format(total)}</b><small>${esc(center)}</small></div></div>
    <div class="pc-tiles">${rows.map((r, i) => `<div data-m="rise"><i style="background:${C(i)}"></i><small>${esc(r.label)}</small><b data-count>${format(r.value)}</b><em>${pct((r.value / total) * 100)}</em></div>`).join("")}</div>`);
}

/** A half-circle gauge made of blocks, for a rate from 0 to 1. */
export function blockGauge({ value, label, caption, blocks = 18, color = 1 }) {
  const filled = Math.round(Math.min(1, Math.max(0, value)) * blocks);
  const step = 180 / blocks;
  const cells = Array.from({ length: blocks }, (_, i) => `<path d="${wedge(100, 96, 58, 80, -90 + i * step + 1.1, -90 + (i + 1) * step - 1.1)}" fill="${i < filled ? C(color) : "var(--pc-muted)"}" opacity="${i < filled ? f(0.55 + (0.45 * (i + 1)) / filled) : 1}" data-m="pop"/>`).join("");
  return box("blockgauge", "Block gauge", `<div class="pc-ringbox half">${svg(200, 100, `<g style="--m-step:40ms">${cells}</g>`)}<div class="pc-mid low"><b data-count>${esc(label)}</b>${caption ? `<small>${esc(caption)}</small>` : ""}</div></div>`);
}

/** A smooth arc gauge from 0 to 1 with the value under it. */
export function gauge({ value, label, caption }) {
  return box("gauge", "Gauge", `<div class="pc-ringbox half">${svg(220, 116, `<path d="${arc(110, 106, 88, -90, 90)}" class="pc-arc fat pc-track-ring"/><path d="${arc(110, 106, 88, -90, 90)}" pathLength="1" class="pc-arc fat" style="stroke:${C(1)};--m-fill:${value}" data-m="draw"/>`)}<div class="pc-mid low"><b data-count>${esc(label)}</b>${caption ? `<small>${esc(caption)}</small>` : ""}</div></div>`);
}

/** Polar bars: one wedge per point around a ring, longer for larger values, the total in the middle. */
export function radialSegments({ rows, format = compact, center = "Total" }) {
  const max = Math.max(...rows.map((r) => r.value)), n = rows.length, step = 360 / n;
  const parts = rows.map((r, i) => `<path d="${wedge(110, 110, 50, 54 + (r.value / max) * 54, i * step + 1, (i + 1) * step - 1)}" fill="${C(0)}" opacity="${f(0.35 + (0.65 * r.value) / max)}" data-m="pop"><title>${esc(r.label)}: ${format(r.value)}</title></path>`).join("");
  return box("polar", "Radial segments", `<div class="pc-ringbox">${svg(220, 220, `<g style="--m-step:30ms;--m-cap:40" data-m-group>${parts}</g>`)}<div class="pc-mid"><b data-count>${format(sum(rows.map((r) => r.value)))}</b><small>${esc(center)}</small></div></div>`);
}

/** Bars for an amount with a line for a rate on its own axis. */
export function comboBarLine({ rows, format = compact, rate = pct, width = 440, height = 220 }) {
  const W = width, H = height, top = 18, bottom = 22, n = rows.length;
  const max = nice(Math.max(...rows.map((r) => r.value)));
  const rmax = nice(Math.max(...rows.map((r) => r.rate)));
  const slot = W / n, bw = slot * 0.5;
  const y = (v) => H - bottom - (v / max) * (H - top - bottom);
  const yr = (v) => H - bottom - (v / rmax) * (H - top - bottom);
  const cx = (i) => i * slot + slot / 2;
  const bars = rows.map((r, i) => `<rect x="${f(cx(i) - bw / 2)}" y="${f(y(r.value))}" width="${f(bw)}" height="${f(H - bottom - y(r.value))}" rx="5" fill="${C(0)}" opacity=".8" data-m="grow-y"><title>${esc(r.label)}: ${format(r.value)}, ${rate(r.rate)}</title></rect>`).join("");
  const pts = rows.map((r, i) => [cx(i), yr(r.rate)]);
  const dots = pts.map(([px, py]) => `<circle cx="${f(px)}" cy="${f(py)}" r="4.5" class="pc-dot" style="stroke:${C(3)}" data-m="pop"/>`).join("");
  return box("combo", "Bars and a line", svg(W, H, `${gridLines(W, [top, (top + H - bottom) / 2])}<g data-m-group>${bars}</g><path d="${smooth(pts)}" pathLength="1" class="pc-line" style="stroke:${C(3)};--m-delay:400ms" data-m="draw"/><g style="--m-delay:700ms;--m-step:80ms">${dots}</g>${xLabels(rows.map((r) => r.label), cx, H - 4)}`) + legend([{ label: "Amount", value: sum(rows.map((r) => r.value)), color: C(0) }, { label: "Margin (right axis)", value: sum(rows.map((r) => r.rate)) / n, color: C(3) }], (v) => (v > 100 ? format(v) : rate(v))));
}

function squarify(values, x, y, w, h) {
  const out = [];
  let items = values.map((v, i) => ({ v, i })).filter((d) => d.v > 0);
  const scale = (w * h) / sum(items.map((d) => d.v));
  items = items.map((d) => ({ ...d, a: d.v * scale }));
  while (items.length) {
    const short = Math.min(w, h);
    let row = [items[0]], best = Infinity;
    for (let k = 1; k <= items.length; k++) {
      const r = items.slice(0, k), s = sum(r.map((d) => d.a));
      const worst = Math.max(...r.map((d) => Math.max((short * short * d.a) / (s * s), (s * s) / (short * short * d.a))));
      if (worst > best) break;
      best = worst;
      row = r;
    }
    const s = sum(row.map((d) => d.a)), side = s / short;
    let off = 0;
    for (const d of row) {
      const len = d.a / side;
      out.push(w >= h ? { i: d.i, x, y: y + off, w: side, h: len } : { i: d.i, x: x + off, y, w: len, h: side });
      off += len;
    }
    if (w >= h) { x += side; w -= side; } else { y += side; h -= side; }
    items = items.slice(row.length);
  }
  return out;
}
/** Area-proportional tiles: where value is concentrated, largest tile first. */
export function treemap({ rows, format = compact, height = 260 }) {
  const sorted = [...rows].sort((p, q) => q.value - p.value);
  const total = sum(sorted.map((r) => r.value));
  const tiles = squarify(sorted.map((r) => r.value), 0, 0, 100, 100).sort((p, q) => p.i - q.i);
  return box("treemap", "Treemap", `<div class="pc-tree" style="height:${height}px;--m-step:45ms" data-m-group>${tiles.map((t) => {
    const r = sorted[t.i];
    return `<div data-m="pop" style="left:${f(t.x)}%;top:${f(t.y)}%;width:${f(t.w)}%;height:${f(t.h)}%;--c:${C(t.i)}" title="${esc(r.label)}: ${format(r.value)}"><span>${esc(r.label)}</span><b>${format(r.value)}</b><em>${pct((r.value / total) * 100)}</em></div>`;
  }).join("")}</div>`);
}

/** One 100% bar split by share, with a legend underneath. */
export function breakdownStrip({ rows, format = compact }) {
  const total = sum(rows.map((r) => r.value));
  return box("strip", "Breakdown", `<div class="pc-strip" data-m-group style="--m-step:110ms">${rows.map((r, i) => `<i data-m="grow-x" style="flex:${r.value};background:${C(i)}" title="${esc(r.label)}"></i>`).join("")}</div>${legend(rows, format, total)}`);
}

/** Each part a section of equal-height ticks, so the row reads as a keyboard; nearer the end, stronger. */
export function tickBreakdown({ rows, format = compact, ticks = 54 }) {
  const total = sum(rows.map((r) => r.value));
  let start = 0;
  return box("ticks", "Tick breakdown", `<div class="pc-keys" data-m-group>${rows.map((r, i) => {
    const count = Math.max(3, Math.round((r.value / total) * ticks));
    const cells = Array.from({ length: count }, (_, t) => `<i data-m="grow-y" style="background:${C(i)};opacity:${t < count / 3 ? 0.3 : t < (2 * count) / 3 ? 0.6 : 1};--m-delay:${200 + (start + t) * 12}ms"></i>`).join("");
    start += count;
    return `<div style="flex:${count} 1 0"><span class="pc-edge" style="background:${C(i)}" data-m="grow-y"></span><small>${esc(r.label)}</small><b data-count>${pct((r.value / total) * 100)}</b><span class="pc-sub">${format(r.value)}</span><div class="pc-keyrow" style="--m-step:0ms">${cells}</div></div>`;
  }).join("")}</div>`);
}

/** Progress as a row of ticks filled up to value (0 to 1). */
export function segmentedProgress({ value, segments = 40, label = "" }) {
  const filled = Math.round(value * segments);
  return box("segments", label || "Progress", `${label ? `<div class="pc-row-head"><small>${esc(label)}</small><b data-count>${pct(value * 100)}</b></div>` : ""}<div class="pc-segs" style="--m-step:18ms;--m-cap:60">${Array.from({ length: segments }, (_, i) => `<i data-m="grow-y" style="background:${i < filled ? C(1) : "var(--pc-muted)"}"></i>`).join("")}</div>`);
}

/** Column waterfall: each change floats from its running start to its running end; totals stand on zero. */
export function waterfall({ steps, format = compact, width = 440, height = 240 }) {
  let run = 0;
  const cols = steps.map((s) => {
    const start = s.total ? 0 : run;
    const end = s.total ? s.value : run + s.value;
    run = end;
    return { ...s, start, end };
  });
  const W = width, H = height, top = 24, bottom = 22, n = cols.length;
  const lo = Math.min(0, ...cols.map((c) => Math.min(c.start, c.end)));
  const hi = nice(Math.max(...cols.map((c) => Math.max(c.start, c.end))));
  const y = (v) => H - bottom - ((v - lo) / (hi - lo)) * (H - top - bottom);
  const slot = W / n, bw = slot * 0.6;
  const body = cols.map((c, i) => {
    const x0 = i * slot + (slot - bw) / 2;
    const t = Math.min(y(c.start), y(c.end)), h = Math.max(2, Math.abs(y(c.start) - y(c.end)));
    const color = c.total ? C(0) : c.value >= 0 ? "var(--pc-good)" : "var(--pc-bad)";
    const link = i < n - 1 ? `<line x1="${f(x0 + bw)}" x2="${f(x0 + slot)}" y1="${f(y(c.end))}" y2="${f(y(c.end))}" class="pc-ref" data-m="fade" style="--m-delay:${500 + i * 60}ms"/>` : "";
    const sign = c.total ? "" : c.value >= 0 ? "+" : "−";
    return `<rect x="${f(x0)}" y="${f(t)}" width="${f(bw)}" height="${f(h)}" rx="4" fill="${color}" data-m="grow-y" style="transform-origin:${c.value < 0 && !c.total ? "center top" : "center bottom"}"><title>${esc(c.label)}</title></rect>${link}<text x="${f(x0 + bw / 2)}" y="${f(t - 6)}" text-anchor="middle" class="pc-val small" data-m="fade" style="--m-delay:${600 + i * 60}ms">${sign}${format(Math.abs(c.value))}</text>`;
  }).join("");
  return box("waterfall", "Waterfall", svg(W, H, `<line x1="0" x2="${W}" y1="${f(y(0))}" y2="${f(y(0))}" class="pc-grid"/><g data-m-group>${body}</g>${xLabels(cols.map((c) => c.label), (i) => i * slot + slot / 2, H - 4)}`));
}

/** Opening stock, what came in and went out, and what is left, as one bridge of horizontal bars. */
export function stockBridge({ open, moves, format = compact, unit = "" }) {
  let run = open;
  const rows = [{ label: "Opening", start: 0, end: open, total: true }];
  for (const m of moves) rows.push({ label: m.label, start: run, end: (run += m.value), value: m.value });
  rows.push({ label: "Closing", start: 0, end: run, total: true });
  const max = Math.max(...rows.map((r) => Math.max(r.start, r.end)));
  return box("bridge", "Stock bridge", `<div class="pc-rows">${rows.map((r) => {
    const l = (Math.min(r.start, r.end) / max) * 100, w = (Math.abs(r.end - r.start) / max) * 100;
    const color = r.total ? C(0) : r.value >= 0 ? "var(--pc-good)" : "var(--pc-bad)";
    return `<div class="pc-rank"><span>${esc(r.label)}</span><b data-count>${r.total ? "" : r.value >= 0 ? "+" : "−"}${format(Math.abs(r.total ? r.end : r.value))}${unit}</b><div class="pc-track clear"><i data-m="grow-x" style="margin-left:${f(l)}%;width:${f(Math.max(w, 0.8))}%;background:${color};${!r.total && r.value < 0 ? "transform-origin:right center" : ""}"></i></div></div>`;
  }).join("")}</div>`);
}

/** Small areas stacked one per series, each with its average dashed and a marker on the latest value. */
export function marginStrips({ series, format = (v) => `${v.toFixed(1)}%`, width = 380, height = 56 }) {
  return box("margins", "Margin strips", series.map((s, k) => {
    const W = width, H = height, max = Math.max(...s.values) * 1.1, min = Math.min(...s.values) * 0.9;
    const x = (i) => 4 + (i * (W - 70)) / (s.values.length - 1);
    const y = (v) => H - 6 - ((v - min) / (max - min)) * (H - 12);
    const pts = s.values.map((v, i) => [x(i), y(v)]);
    const avg = sum(s.values) / s.values.length, last = pts.at(-1);
    return `<div class="pc-strip-row"><small>${esc(s.name)}</small>${svg(W, H, `<path d="${smooth(pts)} L${f(last[0])},${H} L4,${H}Z" fill="${C(k)}" opacity=".18" data-m="reveal"/><path d="${smooth(pts)}" pathLength="1" class="pc-line" style="stroke:${C(k)}" data-m="draw"/><line x1="4" x2="${f(last[0])}" y1="${f(y(avg))}" y2="${f(y(avg))}" class="pc-ref" data-m="fade"/><circle cx="${f(last[0])}" cy="${f(last[1])}" r="4.5" class="pc-dot" style="stroke:${C(k)};--m-delay:1100ms" data-m="pop"/><text x="${f(last[0] + 10)}" y="${f(last[1] + 4)}" class="pc-val small" data-m="fade" style="--m-delay:1100ms">${format(s.values.at(-1))}</text>`)}</div>`;
  }).join(""));
}

/** One progress ring per person, coloured by how complete it is. */
export function coverageRings({ rows, unit = "" }) {
  const tone = (p) => (p >= 80 ? "var(--pc-good)" : p >= 50 ? "var(--pc-warn)" : "var(--pc-bad)");
  return box("coverage", "Coverage rings", `<div class="pc-ringrow">${rows.map((r) => `<div class="pc-cover" data-m="rise"><div class="pc-ringbox small">${svg(80, 80, `<circle cx="40" cy="40" r="32" class="pc-arc pc-track-ring"/><circle cx="40" cy="40" r="32" pathLength="1" class="pc-arc" style="stroke:${tone(r.value)};--m-fill:${r.value / 100};rotate:-90deg;transform-origin:center" data-m="draw"/>`)}<div class="pc-mid"><b>${initials(r.label)}</b></div></div><small>${esc(r.label)}</small><b data-count>${pct(r.value)}</b>${unit ? `<span class="pc-sub">${esc(unit)}</span>` : ""}</div>`).join("")}</div>`);
}

/** Gold, silver and bronze podium for the top three, then a lollipop for each remaining rank. */
export function podium({ rows, format = compact }) {
  const sorted = [...rows].sort((p, q) => q.value - p.value);
  const top = [sorted[1], sorted[0], sorted[2]];
  const steps = [72, 100, 56], medals = ["silver", "gold", "bronze"], places = [2, 1, 3];
  return box("podium", "Podium", `<div class="pc-podium">${top.map((r, i) => `<div><span class="pc-medal ${medals[i]}" data-m="pop" style="--m-delay:${500 + i * 90}ms">${initials(r.label)}</span><small>${esc(r.label)}</small><b data-count>${format(r.value)}</b><div class="pc-step ${medals[i]}" data-m="grow-y" style="height:${steps[i]}px">${places[i]}</div></div>`).join("")}</div>${lollipops({ rows: sorted.slice(3), format, offset: 3, height: 130 }).replace(/^<div class="pc pc-k-lollipop" data-motion/, '<div class="pc pc-k-lollipop"')}`);
}

/** Vertical lollipops, one colour per item, the value on its head. */
export function lollipops({ rows, format = compact, height = 170, offset = 0 }) {
  const max = Math.max(...rows.map((r) => r.value));
  return box("lollipop", "Lollipops", `<div class="pc-lolli" style="height:${height}px" data-m-group>${rows.map((r, i) => `<div><div class="pc-stick" style="height:${f((r.value / max) * 100)}%"><i data-m="grow-y" style="background:${C(i + offset)}"></i><b data-m="pop" style="--m-delay:600ms;background:${C(i + offset)}">${format(r.value)}</b></div><small>${offset ? `${i + offset + 1}. ` : ""}${esc(r.label)}</small></div>`).join("")}</div>`);
}

/** One dot per event: flagged ones in colour, the rest muted, so a rate reads at a glance. */
export function dotRows({ rows, flaggedLabel = "flagged" }) {
  return box("dots", "Dot rows", `<div class="pc-rows">${rows.map((r) => `<div class="pc-dotrow"><span>${esc(r.label)}</span><div style="--m-step:14ms;--m-cap:40">${Array.from({ length: r.total }, (_, i) => `<i data-m="pop" class="${i < r.flagged ? "on" : ""}"></i>`).join("")}</div><b>${r.flagged} ${esc(flaggedLabel)}</b></div>`).join("")}</div>`);
}

/** Two amounts per row mirrored around its label: the left grows leftwards, the right rightwards. */
export function butterfly({ rows, left, right, format = compact }) {
  const max = Math.max(...rows.flatMap((r) => [r.left, r.right]));
  return box("butterfly", "Butterfly rows", `<div class="pc-fly-head"><span style="color:${C(0)}">${esc(left)}</span><span style="color:${C(1)}">${esc(right)}</span></div><div class="pc-rows">${rows.map((r) => `<div class="pc-fly"><b>${format(r.left)}</b><div class="pc-track clear flip"><i data-m="grow-x" style="width:${f((r.left / max) * 100)}%;background:${C(0)};transform-origin:right center"></i></div><span>${esc(r.label)}</span><div class="pc-track clear"><i data-m="grow-x" style="width:${f((r.right / max) * 100)}%;background:${C(1)}"></i></div><b>${format(r.right)}</b></div>`).join("")}</div>`);
}

/** Rows by columns in one colour, each cell darker the larger it is, with column totals overhead and a row total at
    the end; empty cells stay muted. */
export function heatGrid({ rows, columns: cols, format = compact, color = 7 }) {
  const max = Math.max(...rows.flatMap((r) => r.values));
  const colSum = cols.map((_, j) => sum(rows.map((r) => r.values[j])));
  const cell = (v, n) => {
    const p = Math.round(18 + (v / max) * 82);
    const style = `--m-step:0ms;--m-delay:${n * 18}ms;background:${v ? `color-mix(in srgb, ${C(color)} ${p}%, var(--pc-muted))` : "var(--pc-muted)"}`;
    return `<td data-m="pop" class="${p > 62 ? "hot" : ""}" style="${style}">${v ? format(v) : ""}</td>`;
  };
  return box("heat", "Heat grid", `<table class="pc-heat"><thead><tr><th></th>${cols.map((c, j) => `<th>${esc(c)}<small>${format(colSum[j])}</small></th>`).join("")}<th>Total</th></tr></thead><tbody>${rows.map((r, i) => `<tr><th>${esc(r.label)}</th>${r.values.map((v, j) => cell(v, i + j)).join("")}<td><b data-count>${format(sum(r.values))}</b></td></tr>`).join("")}</tbody></table>`);
}

/** Ranked columns stacked by category, each under an initials avatar, with a legend of category totals. */
export function avatarColumns({ rows, keys, format = compact, height = 190 }) {
  const sorted = [...rows].sort((p, q) => sum(q.values) - sum(p.values));
  const max = sum(sorted[0].values);
  return box("avatars", "Stacked columns with avatars", `<div class="pc-avcols" style="height:${height}px" data-m-group>${sorted.map((r) => `<div><b class="pc-v" data-m="fade" style="--m-delay:600ms">${format(sum(r.values))}</b><div class="pc-stack" data-m="grow-y" style="height:${f((sum(r.values) / max) * 100)}%">${r.values.map((v, j) => `<i style="flex:${v};background:${C(j)}"></i>`).reverse().join("")}</div><span class="pc-avatar" data-m="pop">${initials(r.label)}</span></div>`).join("")}</div>${legend(keys.map((label, j) => ({ label, value: sum(rows.map((r) => r.values[j])), color: C(j) })), format)}`);
}

/** Hatched columns with one glowing highlighted column and a value pill, under metric tabs. */
export function highlightBars({ rows, format = compact, tabs = [], height = 210 }) {
  const max = Math.max(...rows.map((r) => r.value));
  const hi = rows.reduce((b, r, i) => (r.value > rows[b].value ? i : b), 0);
  return box("highlight", "Highlight bars", `${tabs.length ? `<div class="pc-tabs">${tabs.map((t, i) => `<span class="${i ? "" : "on"}">${esc(t)}</span>`).join("")}</div>` : ""}<div class="pc-hbars" style="height:${height}px" data-m-group>${rows.map((r, i) => `<div><div class="pc-hbar ${i === hi ? "on" : ""}" data-m="grow-y" style="height:${f((r.value / max) * 100)}%">${i === hi ? `<b class="pc-tip" data-m="pop" style="--m-delay:800ms">${format(r.value)}</b>` : ""}</div><small>${esc(r.label)}</small></div>`).join("")}</div>`);
}

/** Columns of small squares, each one a fixed amount, filled bottom up in series colours; the rest a grey grid. */
export function dotMatrix({ rows, keys, levels = 10, format = compact }) {
  const max = Math.max(...rows.map((r) => sum(r.values)));
  const per = max / levels;
  let n = 0;
  return box("matrix", "Dot matrix columns", `<div class="pc-matrix" data-m-group>${rows.map((r) => {
    const cells = [];
    r.values.forEach((v, j) => { for (let k = 0; k < Math.round(v / per); k++) cells.push(C(j)); });
    const col = Array.from({ length: levels }, (_, k) => `<i data-m="pop" style="--m-delay:${(n++) * 6}ms;--m-step:0ms;background:${cells[k] || "var(--pc-muted)"}"></i>`).join("");
    return `<div><div class="pc-mcol">${col}</div><small>${esc(r.label)}</small></div>`;
  }).join("")}</div>${legend(keys.map((label, j) => ({ label, value: sum(rows.map((r) => r.values[j])), color: C(j) })), format)}`);
}

// Hexagon cells in rings around a centre, in axial coordinates, as [q, r, ring].
function hexRings(count) {
  const cells = [[0, 0, 0]];
  const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  for (let ring = 1; cells.length < count; ring++) {
    let q = -ring, r = ring;
    for (const [dq, dr] of dirs) for (let k = 0; k < ring && cells.length < count; k++) {
      cells.push([q, r, ring]);
      q += dq;
      r += dr;
    }
  }
  return cells.slice(0, count);
}
/** A round honeycomb, each hexagon an equal share: the smallest part at the core, the largest on the rim, building
    out ring by ring; then each part's share and a legend. */
export function hexShare({ rows, cells = 91, format = compact }) {
  const data = [...rows].filter((r) => r.value > 0).sort((p, q) => p.value - q.value);
  const total = sum(data.map((r) => r.value));
  const counts = data.map((r) => Math.max(1, Math.round((r.value / total) * cells)));
  counts[counts.length - 1] += cells - sum(counts);
  const owner = counts.flatMap((c, i) => Array(c).fill(i));
  const layout = hexRings(owner.length);
  const rim = layout.at(-1)[2];
  const strays = hexRings(owner.length + (rim + 1) * 6 + 6).slice(owner.length).filter((_, i) => i % 4 === 1);
  const R = 10;
  const centre = ([q, r]) => [R * Math.sqrt(3) * (q + r / 2), R * 1.5 * r];
  const hex = ([cx, cy]) => Array.from({ length: 6 }, (_, k) => {
    const t = (Math.PI / 180) * (60 * k - 30);
    return `${f(cx + (R - 0.8) * Math.cos(t))},${f(cy + (R - 0.8) * Math.sin(t))}`;
  }).join(" ");
  const pts = [...layout, ...strays].map(centre);
  const ext = Math.ceil(Math.max(...pts.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y)))) + R + 2);
  const lead = data.length - 1;
  const comb = layout.map((cell, i) => {
    const shade = f(0.35 + (((i * 37) % 11) / 10) * 0.65);
    return `<polygon points="${hex(centre(cell))}" fill="${C(lead - owner[i])}" fill-opacity="${shade}" data-m="pop" style="--m-step:0ms;--m-delay:${cell[2] * 70 + (i % 6) * 10}ms"><title>${esc(data[owner[i]].label)}</title></polygon>`;
  }).join("");
  const halo = strays.map((cell) => `<polygon points="${hex(centre(cell))}" fill="${C(0)}" fill-opacity=".12" data-m="fade" style="--m-delay:${(rim + 1) * 70}ms"/>`).join("");
  const desc = [...data].reverse();
  const shares = `<div class="pc-hexshares" style="--n:${desc.length}">${desc.map((r, i) => `<div data-m="rise" style="--m-delay:300ms"><small><i style="background:${C(i)}"></i>${esc(r.label)}</small><b data-count class="${i ? "pc-sub" : ""}">${pct((r.value / total) * 100)}</b></div>`).join("")}</div>`;
  const list = `<ul class="pc-hexlist" data-m-group>${desc.map((r, i) => `<li data-m="rise" style="--m-delay:400ms"><span class="pc-chip" style="background:color-mix(in srgb, ${C(i)} 14%, transparent)"><i style="background:${C(i)}"></i></span><span>${esc(r.label)}</span><b data-count>${format(r.value)}</b></li>`).join("")}</ul>`;
  return box("hex", "Hex share", `<div class="pc-hexwrap"><div class="pc-comb">${svg(ext * 2, ext * 2, `<g transform="translate(${ext} ${ext})">${halo}${comb}</g>`)}</div><div class="pc-hexside">${shares}${list}</div></div>`);
}

/** A streamgraph: layers stacked around a centre line so the flow of each part reads over time, with markers. */
export function flowRibbon({ labels, series, markers = [], format = compact, width = 440, height = 220 }) {
  const W = width, H = height, n = labels.length, bottom = 20;
  const totals = labels.map((_, i) => sum(series.map((s) => s.values[i])));
  const max = Math.max(...totals) * 1.08;
  const x = (i) => (i * W) / (n - 1);
  const k = (H - bottom) / max, mid = (H - bottom) / 2;
  const base = totals.map((t) => mid - (t * k) / 2);
  const layers = series.map((s, j) => {
    const lo = labels.map((_, i) => base[i] + sum(series.slice(0, j).map((q) => q.values[i])) * k);
    const hi = lo.map((v, i) => v + s.values[i] * k);
    const top = smooth(lo.map((v, i) => [x(i), v]));
    const back = smooth(hi.map((v, i) => [x(i), v]).reverse()).replace(/^M/, "L");
    return `<path d="${top} ${back}Z" fill="${C(j)}" opacity=".85"><title>${esc(s.name)}</title></path>`;
  }).join("");
  const marks = markers.map((i) => `<line x1="${f(x(i))}" x2="${f(x(i))}" y1="0" y2="${H - bottom}" class="pc-ref" data-m="fade" style="--m-delay:1000ms"/>`).join("");
  return box("flow", "Flow ribbon", svg(W, H, `<g data-m="reveal" data-m-group>${layers}</g>${marks}${xLabels(labels, x, H - 4)}`) + legend(series.map((s, j) => ({ label: s.name, value: sum(s.values), color: C(j) })), format));
}

/** A few stacked columns, one per period, with translucent bands linking each layer to the next period. */
export function bandColumns({ periods, keys, format = compact, width = 440, height = 220 }) {
  const W = width, H = height, bottom = 22, n = periods.length;
  const max = Math.max(...periods.map((p) => sum(p.values)));
  const slot = W / n, bw = Math.min(54, slot * 0.42), k = (H - bottom - 8) / max;
  const tops = periods.map((p) => {
    let b = H - bottom;
    return p.values.map((v) => [(b -= v * k), b + v * k]);
  });
  const cx = (i) => i * slot + slot / 2;
  const bands = periods.slice(0, -1).map((_, i) => keys.map((_, j) => {
    const [a0, a1] = tops[i][j], [b0, b1] = tops[i + 1][j], l = cx(i) + bw / 2, r = cx(i + 1) - bw / 2;
    return `<path d="M${f(l)},${f(a0)} C${f((l + r) / 2)},${f(a0)} ${f((l + r) / 2)},${f(b0)} ${f(r)},${f(b0)} L${f(r)},${f(b1)} C${f((l + r) / 2)},${f(b1)} ${f((l + r) / 2)},${f(a1)} ${f(l)},${f(a1)}Z" fill="${C(j)}" opacity=".22"/>`;
  }).join("")).join("");
  const cols = periods.map((p, i) => `<g data-m="grow-y">${p.values.map((v, j) => `<rect x="${f(cx(i) - bw / 2)}" y="${f(tops[i][j][0])}" width="${bw}" height="${f(Math.max(1, v * k - 2))}" rx="4" fill="${C(j)}"><title>${esc(keys[j])}: ${format(v)}</title></rect>`).join("")}</g>`).join("");
  return box("bands", "Band columns", svg(W, H, `<g data-m="fade" style="--m-delay:700ms">${bands}</g><g style="--m-step:120ms">${cols}</g>${xLabels(periods.map((p) => p.label), cx, H - 4)}`) + legend(keys.map((label, j) => ({ label, value: sum(periods.map((p) => p.values[j])), color: C(j) })), format));
}

/** Each column a dashed target outline with the actual amount rising inside it; the closest to target glows. */
export function targetBars({ rows, format = compact, height = 210 }) {
  const max = Math.max(...rows.flatMap((r) => [r.value, r.target]));
  const best = rows.reduce((b, r, i) => (r.value / r.target > rows[b].value / rows[b].target ? i : b), 0);
  return box("target", "Target bars", `<div class="pc-hbars" style="height:${height}px" data-m-group>${rows.map((r, i) => `<div><div class="pc-goal" style="height:${f((r.target / max) * 100)}%"><i data-m="grow-y" class="${i === best ? "on" : ""}" style="height:${f(Math.min(100, (r.value / r.target) * 100))}%"></i><b data-m="fade" style="--m-delay:700ms">${pct((r.value / r.target) * 100)}</b></div><small>${esc(r.label)}</small></div>`).join("")}</div><div class="pc-legend"><span><i class="dash"></i>Target</span><span><i style="background:${C(4)}"></i>Actual</span></div>`);
}

/** Layered smooth areas across ordered stages, with dividers and each stage's value underneath. */
export function stageArea({ stages, format = compact, width = 440, height = 160 }) {
  const W = width, H = height, n = stages.length, max = stages[0].value;
  const x = (i) => (i * W) / (n - 1);
  const layer = (s, color, op) => {
    const top = smooth(stages.map((st, i) => [x(i), H / 2 - ((st.value / max) * (H - 10) * s) / 2]));
    const bot = smooth(stages.map((st, i) => [x(i), H / 2 + ((st.value / max) * (H - 10) * s) / 2]).reverse()).replace(/^M/, "L");
    return `<path d="${top} ${bot}Z" fill="${color}" opacity="${op}"/>`;
  };
  const divs = stages.slice(1, -1).map((_, i) => `<line x1="${f(x(i + 1))}" x2="${f(x(i + 1))}" y1="0" y2="${H}" class="pc-grid"/>`).join("");
  return box("stages", "Stage area", svg(W, H, `<g data-m="reveal">${layer(1, C(1), 0.18)}${layer(0.68, C(1), 0.36)}${layer(0.36, C(1), 0.85)}</g>${divs}`) + `<div class="pc-stage-row">${stages.map((s, i) => `<div data-m="rise"><small>${esc(s.label)}</small><b data-count>${format(s.value)}</b>${i ? `<em>${pct((s.value / stages[i - 1].value) * 100)}</em>` : ""}</div>`).join("")}</div>`);
}

/** How many reach each step, as bars that narrow toward the end, with the share kept between steps. */
export function funnel({ stages, format = compact }) {
  const max = stages[0].value;
  return box("funnel", "Funnel", `<div class="pc-funnel">${stages.map((s, i) => `<div><span>${esc(s.label)}</span><div class="pc-fbar"><i data-m="grow-x" style="width:${f((s.value / max) * 100)}%;background:${C(i)};transform-origin:center"><b data-count>${format(s.value)}</b></i></div><em>${i ? `${pct((s.value / stages[i - 1].value) * 100)} kept` : ""}</em></div>`).join("")}</div>`);
}

/** Horizontal gradient bars on soft tracks against one axis, with a dashed target line. */
export function progressTargets({ rows, target, format = compact }) {
  const max = nice(Math.max(target || 0, ...rows.map((r) => r.value)));
  return box("progress", "Progress against target", `<div class="pc-rows pc-targets" style="--t:${f(((target || 0) / max) * 100)}%">${rows.map((r) => `<div class="pc-rank"><span>${esc(r.label)}</span><b data-count>${format(r.value)}</b><div class="pc-track"><i data-m="grow-x sheen" style="width:${f((r.value / max) * 100)}%;background:linear-gradient(90deg, ${C(1)}, ${C(2)})"></i>${target ? '<s data-m="fade" style="--m-delay:700ms"></s>' : ""}</div></div>`).join("")}</div>${target ? `<div class="pc-legend"><span><i class="dash"></i>Target ${format(target)}</span></div>` : ""}`);
}

/** When each row was on duty across a day, its hours at the end. */
export function shiftTimeline({ rows, from = 6, to = 22 }) {
  const span = to - from, ticks = [];
  for (let h = from; h <= to; h += 4) ticks.push(h);
  const pos = (h) => ((h - from) / span) * 100;
  return box("shifts", "Shift timeline", `<div class="pc-shifts"><div class="pc-hours">${ticks.map((h) => `<span style="left:${f(pos(h))}%">${h % 12 || 12}${h % 24 < 12 ? "a" : "p"}</span>`).join("")}</div>${rows.map((r, i) => `<div class="pc-shift"><span>${esc(r.label)}</span><div class="pc-track clear">${r.spans.map(([a, b]) => `<i data-m="grow-x" style="left:${f(pos(a))}%;width:${f(pos(b) - pos(a))}%;background:${C(i)}"></i>`).join("")}</div><b>${f(sum(r.spans.map(([a, b]) => b - a)))}h</b></div>`).join("")}</div>`);
}

/** Every item as a tile in rank order, its colour as strong as its count. "most" puts the busiest first with medals
    for the top three; "fewest" puts the least first, zeros in red, below average in amber. */
export function rankTiles({ rows, unit = "", view = "most", empty = "none yet" }) {
  const list = [...rows].sort((p, q) => (view === "most" ? q.value - p.value : p.value - q.value));
  const max = Math.max(1, ...list.map((r) => r.value));
  const seen = list.filter((r) => r.value > 0);
  const avg = seen.length ? sum(seen.map((r) => r.value)) / seen.length : 0;
  const hue = (r) => (view === "most" ? C(3) : !r.value ? "var(--pc-bad)" : r.value < avg ? "var(--pc-warn)" : "var(--pc-good)");
  const strength = (r) => (view === "most" ? 0.25 + 0.75 * (r.value / max) : !r.value ? 0.85 : 0.35 + 0.5 * (1 - Math.min(1, r.value / Math.max(1, avg))));
  const medal = ["gold", "silver", "bronze"];
  return box("ranktiles", "Rank tiles", `<div class="pc-ranktiles" data-m-group>${list.map((r, i) => {
    const mix = Math.round(strength(r) * 100);
    return `<div data-m="pop" class="${mix >= 62 ? "hot" : ""}" style="--m-step:30ms;--m-cap:24;background:linear-gradient(150deg, color-mix(in srgb, ${hue(r)} ${mix}%, var(--pc-card)), color-mix(in srgb, ${hue(r)} ${Math.round(mix * 0.75)}%, var(--pc-card)));border-color:color-mix(in srgb, ${hue(r)} 35%, transparent)"><small>${esc(r.label)}</small><em class="${view === "most" && i < 3 ? medal[i] : ""}">${i + 1}</em><p><b data-count>${r.value}</b><span>${r.value ? esc(unit) : esc(empty)}</span></p></div>`;
  }).join("")}</div>`);
}

/** A month laid out Monday to Sunday, each day showing its number tinted by size; days still to come stay outlined.
    With split, each day is [good, bad]: the good share fills from the top, the bad share sits under it. */
export function monthCalendar({ year, month, values, format = compact, split, labels = ["Done", "Missed"] }) {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const total = (v) => (Array.isArray(v) ? v[0] + v[1] : v);
  const max = Math.max(1, ...values.filter((v) => v != null).map(total));
  const cells = Array.from({ length: lead }, () => "<i></i>");
  for (let d = 1; d <= days; d++) {
    const v = values[d - 1], slot = lead + d - 1, delay = `--m-step:0ms;--m-delay:${(Math.floor(slot / 7) + (slot % 7)) * 40}ms`;
    if (v == null) { cells.push(`<i class="later" data-m="fade" style="${delay}">${d}</i>`); continue; }
    const t = total(v), fill = Math.round(30 + (t / max) * 70);
    const bg = split ? `linear-gradient(color-mix(in srgb, ${C(0)} ${fill}%, var(--pc-muted)) 0 ${f(t ? (v[0] / t) * 100 : 100)}%, color-mix(in srgb, var(--pc-bad) ${fill}%, var(--pc-muted)) 0)` : t ? `color-mix(in srgb, ${C(1)} ${fill}%, var(--pc-muted))` : "var(--pc-muted)";
    cells.push(`<i class="${t ? "on" : ""}" data-m="pop" style="${delay};background:${bg}" title="${d}: ${split ? `${format(v[0])} ${esc(labels[0])}, ${format(v[1])} ${esc(labels[1])}` : format(t)}">${t ? format(t) : "0"}</i>`);
  }
  const done = values.filter((v) => v != null);
  const foot = split
    ? `<div class="pc-legend"><span><i style="background:${C(0)}"></i>${esc(labels[0])} <b>${format(sum(done.map((v) => v[0])))}</b></span><span><i style="background:var(--pc-bad)"></i>${esc(labels[1])} <b>${format(sum(done.map((v) => v[1])))}</b></span></div>`
    : `<div class="pc-legend"><span>Less</span>${[30, 55, 80, 100].map((p) => `<i class="sq" style="background:color-mix(in srgb, ${C(1)} ${p}%, var(--pc-muted))"></i>`).join("")}<span>More</span><span><b>${format(sum(done))}</b> over ${done.length} days</span></div>`;
  return box("month", "Month calendar", `<div class="pc-month">${["M", "T", "W", "T", "F", "S", "S"].map((d) => `<small>${d}</small>`).join("")}${cells.join("")}</div>${foot}`);
}

/** A table of items with their quantity, amount and a small share bar, closed by a total row. */
export function shareTable({ title, rows, qtyLabel = "Qty", amountLabel = "Amount", format = compact, money = compact, color = 1 }) {
  const qty = sum(rows.map((r) => r.qty)), amount = sum(rows.map((r) => r.amount));
  const typed = rows.some((r) => r.type);
  return box("table", title || "Share table", `<div class="pc-tablehead"><b><i style="background:${C(color)}"></i>${esc(title || "")}</b><small>${format(qty)} ${esc(qtyLabel.toLowerCase())} · ${money(amount)}</small></div><table class="pc-table"><thead><tr><th>Name</th>${typed ? "<th>Type</th>" : ""}<th>${esc(qtyLabel)}</th><th>${esc(amountLabel)}</th><th>%</th></tr></thead><tbody>${rows.map((r) => {
    const share = amount ? (r.amount / amount) * 100 : 0;
    return `<tr data-m="rise" style="--m-step:50ms"><td>${esc(r.label)}</td>${typed ? `<td><small>${esc(r.type || "")}</small></td>` : ""}<td data-count>${format(r.qty)}</td><td data-count>${money(r.amount)}</td><td><span class="pc-share"><span class="pc-track"><i data-m="grow-x" style="width:${f(share)}%;background:${C(color)};--m-delay:300ms"></i></span>${pct(share)}</span></td></tr>`;
  }).join("")}</tbody><tfoot><tr><td>Total</td>${typed ? "<td></td>" : ""}<td>${format(qty)}</td><td style="color:${C(color)}">${money(amount)}</td><td></td></tr></tfoot></table>`);
}

/** Units dropping through a funnel and settling into a column per category, one dot each, the busiest first. */
export function dropColumns({ rows, format = compact, dots = 120, width = 440, height = 230 }) {
  const data = [...rows].sort((p, q) => q.value - p.value);
  const units = sum(data.map((r) => r.count)), total = sum(data.map((r) => r.value));
  const scale = Math.min(1, dots / units);
  const W = width, H = height, n = data.length, slot = W / n, per = 6, pitch = 8, floor = H - 6;
  const counts = data.map((r) => Math.max(1, Math.round(r.count * scale)));
  const mouth = 60, top = 8, neck = 52, cx0 = W / 2;
  const col = (i) => i * slot + slot / 2;
  const order = [];
  for (let k = 0; order.length < sum(counts); k++) counts.forEach((c, i) => { if (k < c) order.push([i, k]); });
  const balls = order.map(([i, k], at) => {
    const x = col(i) - ((per - 1) * pitch) / 2 + (k % per) * pitch, y = floor - 6 - Math.floor(k / per) * pitch;
    const sway = ((at * 37) % 11) / 10 - 0.5;
    return `<circle cx="${f(x)}" cy="${f(y)}" r="3" fill="${C(i)}" data-m="drop" style="--m-step:0ms;--m-delay:${at * 22}ms;--m-x0:${f(cx0 + sway * mouth - x)}px;--m-y0:${f(top - y)}px;--m-x1:${f(cx0 - x)}px;--m-y1:${f(neck - y)}px"/>`;
  }).join("");
  const backs = counts.map((c, i) => {
    const h = Math.ceil(c / per) * pitch + 6;
    return `<rect x="${f(col(i) - (per * pitch) / 2 - 3)}" y="${f(floor - h)}" width="${per * pitch + 6}" height="${h}" rx="5" fill="${C(i)}" fill-opacity=".14" stroke="${C(i)}" stroke-opacity=".35" data-m="grow-y" style="--m-delay:${order.length * 22 + 500}ms"/>`;
  }).join("");
  const cone = `<path d="M${cx0 - mouth},${top} L${cx0 - 7},${neck - 10} L${cx0 - 7},${neck} M${cx0 + mouth},${top} L${cx0 + 7},${neck - 10} L${cx0 + 7},${neck}" class="pc-funnel-cone" pathLength="1" data-m="draw"/>`;
  const keys = `<div class="pc-droplabels" style="--n:${n}">${data.map((r, i) => `<div data-m="fade" style="--m-delay:400ms"><small><i style="background:${C(i)}"></i>${esc(r.label)}</small><b>${format(r.value)} · ${pct((r.value / total) * 100)}</b></div>`).join("")}</div>`;
  return box("drop", "Drop columns", svg(W, H, `${cone}${backs}<line x1="0" x2="${W}" y1="${floor}" y2="${floor}" class="pc-grid"/>${balls}`) + keys);
}

/** A calendar of days, each tinted by how much happened, that pops in as a wave. */
export function calendarHeat({ values, weeks = 18 }) {
  const max = Math.max(...values);
  return box("calendar", "Calendar heat", `<div class="pc-cal" style="--weeks:${weeks}">${values.slice(0, weeks * 7).map((v, i) => `<i data-m="pop" style="--m-step:0ms;--m-delay:${(Math.floor(i / 7) + (i % 7)) * 22}ms;background:color-mix(in srgb, ${C(1)} ${Math.round(8 + (v / max) * 92)}%, var(--pc-muted))" title="${v}"></i>`).join("")}</div><div class="pc-legend"><span>Less</span>${[10, 35, 60, 100].map((p) => `<i class="sq" style="background:color-mix(in srgb, ${C(1)} ${p}%, var(--pc-muted))"></i>`).join("")}<span>More</span></div>`);
}

/** Units flowing from a source into a few destinations, each ball one unit, the totals at the ends. */
export function flow({ source, sinks, format = compact, width = 440, height = 240 }) {
  const W = width, H = height, total = sum(sinks.map((s) => s.value));
  const ys = sinks.map((_, i) => 30 + (i * (H - 60)) / Math.max(1, sinks.length - 1));
  const paths = sinks.map((s, i) => `M70,${H / 2} C${f(W / 2)},${H / 2} ${f(W / 2)},${f(ys[i])} ${W - 110},${f(ys[i])}`);
  const balls = sinks.flatMap((s, i) => {
    const n = Math.max(2, Math.round((s.value / total) * 14));
    return Array.from({ length: n }, (_, k) => `<circle r="4.5" fill="${C(i)}" class="pc-ball"><animateMotion dur="${f(2.4 + i * 0.3)}s" begin="${f((k * (2.4 + i * 0.3)) / n)}s" repeatCount="indefinite" path="${paths[i]}"/></circle>`);
  }).join("");
  return box("flow-balls", "Flow", svg(W, H, `${paths.map((d, i) => `<path d="${d}" pathLength="1" class="pc-line soft" style="stroke:${C(i)}" data-m="draw"/>`).join("")}${balls}<circle cx="56" cy="${H / 2}" r="26" fill="var(--pc-fg)" data-m="pop"/><text x="56" y="${H / 2 + 4}" text-anchor="middle" class="pc-val inv">${format(total)}</text><text x="56" y="${H / 2 + 44}" text-anchor="middle" class="pc-axis">${esc(source)}</text>${sinks.map((s, i) => `<g data-m="pop" style="--m-delay:${700 + i * 90}ms"><circle cx="${W - 96}" cy="${f(ys[i])}" r="18" fill="${C(i)}"/><text x="${W - 96}" y="${f(ys[i] + 4)}" text-anchor="middle" class="pc-val inv small">${format(s.value)}</text></g><text x="${W - 72}" y="${f(ys[i] + 4)}" class="pc-axis" data-m="fade">${esc(s.label)}</text>`).join("")}`));
}

/** Every chart builder by name, for galleries and tests. */
export const CHARTS = { headline, statLine, kpi, columns, stackedColumns, rankedBars, lineChart, areaChart, pie, donut, hatchedDonut, radialRanks, splitGauge, blockGauge, gauge, radialSegments, comboBarLine, treemap, breakdownStrip, tickBreakdown, segmentedProgress, waterfall, stockBridge, marginStrips, coverageRings, podium, lollipops, dotRows, butterfly, heatGrid, avatarColumns, highlightBars, dotMatrix, hexShare, flowRibbon, bandColumns, targetBars, stageArea, funnel, progressTargets, shiftTimeline, rankTiles, calendarHeat, monthCalendar, shareTable, dropColumns, flow };
