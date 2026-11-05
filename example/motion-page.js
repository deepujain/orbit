/* Orbit's Motion page: every playskin motion effect on the kind of boxes and bars a dashboard has. Each card is one
   data-motion block, so it builds in when scrolled to, again when scrolled back, and on its Replay button. */

const WEEKS = [118, 124, 121, 129, 126, 131, 127, 134];
const WELLS = [["A-1", 92], ["A-2", 81], ["A-3", 67], ["A-4", 54], ["A-5", 38]];
const SHARE = [["Drilling", 46, 2], ["Tripping", 22, 4], ["Casing", 19, 1], ["Weather", 13, 5]];
const LINE = [18, 26, 22, 38, 34, 52, 47, 63, 58, 74, 70, 86];

const show = (title, how, body, extra = "") => `
  <section class="card show" data-card data-motion ${extra}>
    <div class="show-head"><h3 data-card-title>${title}</h3><button class="btn" data-button="ghost" data-replay>Replay</button></div>
    <code class="how">${how}</code>
    ${body}
  </section>`;

const tiles = () => `<div class="tiles">${[["Barrels today", "18,420"], ["Uptime", "97%"], ["Days safe", "214"]].map(([k, v]) => `<div class="tile" data-m="rise"><b data-count>${v}</b><span>${k}</span></div>`).join("")}</div>`;

const columns = () => {
  const max = Math.max(...WEEKS);
  return `<div class="chart" data-m-group role="img" aria-label="Thousand barrels each week">${WEEKS.map((v, i) => `<div class="bar"><i data-m="grow-y sheen" style="height:${Math.round((v / max) * 100)}%"></i>W${i + 1}</div>`).join("")}</div>`;
};

const ranked = () => `<div class="ranked" data-m-group>${WELLS.map(([name, v]) => `
  <div class="rank"><span>${name}</span><div class="track"><i data-m="grow-x sheen" style="width:${v}%"></i></div><b data-count>${v}%</b></div>`).join("")}</div>`;

const share = () => `
  <div class="share">${SHARE.map(([, v, c]) => `<i data-m="grow-x" style="flex:${v};background:hsl(var(--chart-${c}))"></i>`).join("")}</div>
  <div class="legend">${SHARE.map(([k, v, c]) => `<span data-m="fade" style="--m-delay:400ms"><i style="background:hsl(var(--chart-${c}))"></i>${k} ${v}%</span>`).join("")}</div>`;

// Each ring segment is one circle drawn to its share; pathLength="1" lets CSS draw it without measuring.
const ring = () => {
  let at = 0;
  const segs = SHARE.map(([, v, c]) => {
    const seg = `<circle cx="60" cy="60" r="44" pathLength="1" data-m="draw" style="--m-fill:${v / 100 - 0.01};rotate:${at * 3.6 - 90}deg;transform-origin:center;stroke:hsl(var(--chart-${c}))"/>`;
    at += v;
    return seg;
  });
  return `<div class="ring-box"><svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="44" class="ring-track"/>${segs.join("")}</svg><div class="ring-mid"><b data-count>46%</b><span>drilling</span></div></div>`;
};

const gauge = () => `<div class="gauge-box"><svg class="gauge" viewBox="0 0 120 70" aria-hidden="true">
  <path d="M10 62 A50 50 0 0 1 110 62" class="ring-track"/>
  <path d="M10 62 A50 50 0 0 1 110 62" pathLength="1" data-m="draw" style="--m-fill:.72"/></svg><div class="gauge-mid"><b data-count>72%</b><span>mud pits</span></div></div>`;

const line = () => {
  const x = (i) => 10 + (i * 580) / (LINE.length - 1);
  const y = (v) => 190 - v * 2;
  const pts = LINE.map((v, i) => `${x(i)},${y(v)}`).join(" L");
  return `<svg class="line" viewBox="0 0 600 200" role="img" aria-label="Oil rate by week">
    <defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="hsl(var(--chart-2))" stop-opacity=".35"/><stop offset="1" stop-color="hsl(var(--chart-2))" stop-opacity="0"/></linearGradient></defs>
    ${[50, 100, 150].map((g) => `<line x1="10" x2="590" y1="${g}" y2="${g}" class="grid-line" data-m="grow-x"/>`).join("")}
    <path d="M${pts} L${x(LINE.length - 1)},190 L10,190Z" fill="url(#fill)" data-m="reveal"/>
    <path d="M${pts}" pathLength="1" class="stroke" data-m="draw"/>
    <g style="--m-step:90ms;--m-delay:300ms">${LINE.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4.5" class="dot" data-m="pop"/>`).join("")}</g>
  </svg>`;
};

const sparks = () => `<div class="sparks">${[[3, 5, 4, 7, 6, 9, 8], [9, 7, 8, 5, 6, 4, 3], [4, 4, 6, 5, 7, 7, 9]].map((s, k) => `
  <div class="spark" data-m="slide-right"><span>${["Oil rate", "Gas alarms", "Crane lifts"][k]}</span><b data-count>${["18,420", "3", "146"][k]}</b>
  <svg viewBox="0 0 70 24" aria-hidden="true"><path pathLength="1" data-m="draw" style="--m-delay:${200 + k * 60}ms" d="M${s.map((v, i) => `${i * 11 + 2},${22 - v * 2}`).join(" L")}"/></svg></div>`).join("")}</div>`;

const calendar = () => `<div class="cal" style="--m-step:14ms;--m-cap:70">${Array.from({ length: 70 }, (_, i) => `<i data-m="pop" style="opacity:${0.15 + (((i * 37) % 11) / 10) * 0.85}"></i>`).join("")}</div>`;

const flaps = () => `<div class="flaps" style="--m-step:90ms" aria-label="Bit depth 12,480 feet">${[..."12"].map((d) => `<b data-m="flip">${d}</b>`).join("")}<span class="flap-gap"></span>${[..."480"].map((d) => `<b data-m="flip">${d}</b>`).join("")}<span class="flap-gap"></span><small>feet down</small></div>`;

const zoom = () => `<div class="badges">${["chart-1", "chart-2", "chart-4", "chart-5"].map((c, i) => `<div class="pie" data-m="zoom" style="background:conic-gradient(hsl(var(--${c})) 0 ${[64, 48, 81, 30][i]}%, hsl(var(--muted)) 0)"></div>`).join("")}</div>`;

const feed = () => `<ul class="feed">${[["Pipe lift done on the pipe deck", "2m"], ["Permit 4821 approved", "8m"], ["Supply boat alongside", "21m"], ["Gas test passed in the pump room", "1h"]].map(([t, w], i) => `
  <li data-m="${i % 2 ? "slide-right" : "slide-left"}">${i === 0 ? '<span class="live" data-m="pulse"></span>' : '<span class="dotty"></span>'}<span>${t}</span><time>${w}</time></li>`).join("")}</ul>`;

const always = () => `<div class="always">
  <div><span class="live big" data-m="pulse"></span><small>pulse</small></div>
  <div><span class="floaty" data-m="float">🛢️</span><small>float</small></div>
  <div class="skeleton"><i data-m="shimmer"></i><i data-m="shimmer" style="width:70%"></i><i data-m="shimmer" style="width:45%"></i><small>shimmer</small></div>
</div>`;

export const motionPage = () => `
  <div class="page-head"><div><h1 data-motion><span data-m="blur">Motion</span></h1>
    <p class="lede">Every effect playskin can play on boxes and bars. Each card builds in when you scroll to it and again when you come back.</p></div>
    <button class="btn" data-button="default" data-replay-all>Replay all</button></div>
  <div class="shows">
    ${show("Rise and count up", 'data-m="rise" + data-count', tiles())}
    ${show("Columns grow up, then shine", 'data-m="grow-y sheen"', columns())}
    ${show("Ranked bars grow across", 'data-m="grow-x sheen"', ranked())}
    ${show("Share bar", 'data-m="grow-x" + "fade"', share())}
    ${show("Donut draws itself", 'data-m="draw" pathLength="1"', ring())}
    ${show("Gauge", 'data-m="draw" --m-fill:.72', gauge())}
    ${show("Line draws, area reveals, dots pop", 'data-m="draw" "reveal" "pop"', line(), 'style="grid-column:1/-1"')}
    ${show("Sparklines slide in", 'data-m="slide-right" + "draw"', sparks())}
    ${show("Heat calendar pops in a wave", 'data-m="pop" --m-step:14ms', calendar())}
    ${show("Split-flap tiles", 'data-m="flip"', flaps())}
    ${show("Pies spin in", 'data-m="zoom"', zoom())}
    ${show("Activity slides from both sides", 'data-m="slide-left" "slide-right"', feed())}
    ${show("Always on", 'data-m="pulse" "float" "shimmer"', always())}
  </div>
  <p class="lede hint">Hover a bar or a well: the rest step back (<code>data-m-group</code>). With reduced motion turned on, every card shows still and complete.</p>`;
