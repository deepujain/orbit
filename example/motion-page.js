/* Orbit's Motion page: every orbit motion effect, each played by a chart that appears nowhere else in Orbit or by
   plain boxes and lists. Each card builds in when scrolled to, again when scrolled back, and on its Replay button. */
import * as c from "../src/charts.js";

const CREWS = ["Drill crew", "Deck crew", "Mechanics", "Electricians", "Control room"];
const DAY = [["Drilling", 46], ["Tripping", 22], ["Casing", 19], ["Weather", 13]].map(([label, value]) => ({ label, value }));
const wave = (n, base, amp, seed) => Array.from({ length: n }, (_, i) => Math.round(base + amp * Math.sin(i / 1.7 + seed) + i / 2));

// A builder's chart is its own motion block, so only hand-built cards make the card one.
const show = (title, how, body, extra = "", motion = false) => `
  <section class="card show" data-card${motion ? " data-motion" : ""} ${extra}>
    <div class="show-head"><h3 data-card-title>${title}</h3><button class="btn" data-button="ghost" data-replay>Replay</button></div>
    <code class="how">${how}</code>
    ${body}
  </section>`;

const flaps = () => `<div class="flaps" style="--m-step:90ms" aria-label="Bit depth 12,480 feet">${[..."12"].map((d) => `<b data-m="flip">${d}</b>`).join("")}<span class="flap-gap"></span>${[..."480"].map((d) => `<b data-m="flip">${d}</b>`).join("")}<span class="flap-gap"></span><small>feet down</small></div>`;

const feed = () => `<ul class="feed">${[["Pipe lift done on the pipe deck", "2m"], ["Permit 4821 approved", "8m"], ["Supply boat alongside", "21m"], ["Gas test passed in the pump room", "1h"]].map(([t, w], i) => `
  <li data-m="${i % 2 ? "slide-right" : "slide-left"}">${i === 0 ? '<span class="live" data-m="pulse"></span>' : '<span class="dotty"></span>'}<span>${t}</span><time>${w}</time></li>`).join("")}</ul>`;

const always = () => `<div class="always">
  <div><span class="live big" data-m="pulse"></span><small>pulse</small></div>
  <div><span class="floaty" data-m="float">🛢️</span><small>float</small></div>
  <div class="skeleton"><i data-m="shimmer"></i><i data-m="shimmer" style="width:70%"></i><i data-m="shimmer" style="width:45%"></i><small>shimmer</small></div>
</div>`;

export const motionPage = () => `
  <div class="page-head"><div><h1 data-motion><span data-m="blur">Motion</span></h1>
    <p class="lede">Every effect orbit can play on boxes and bars. Each card builds in when you scroll to it and again when you come back.</p></div>
    <button class="btn" data-button="default" data-replay-all>Replay all</button></div>
  <div class="shows">
    ${show("Rise and count up", 'data-m="rise" + data-count', c.statLine({ items: [["Barrels today", "18,420"], ["Uptime", "97%"], ["Days safe", "214"]] }))}
    ${show("Columns grow up, the best pops", 'data-m="grow-y" "pop"', c.highlightBars({ rows: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((label, i) => ({ label, value: wave(9, 520, 60, 2)[i] * 1000 })), tabs: ["Oil", "Gas", "Water"], format: (v) => `${c.compact(v)} bbl` }))}
    ${show("Bars grow across, then shine", 'data-m="grow-x sheen"', c.progressTargets({ rows: CREWS.map((label, i) => ({ label, value: [46, 38, 52, 29, 35][i] })), target: 40 }))}
    ${show("Share bar", 'data-m="grow-x"', c.breakdownStrip({ rows: DAY, format: (v) => `${v}%` }))}
    ${show("Donut draws itself", 'data-m="draw" pathLength="1"', c.donut({ rows: DAY, format: (v) => `${v}%`, center: "Rig time" }))}
    ${show("Gauge", 'data-m="draw"', c.gauge({ value: 0.64, label: "64%", caption: "Active mud pits" }))}
    ${show("Lines draw, areas reveal, dots pop", 'data-m="draw" "reveal" "pop"', c.marginStrips({ series: [["A-1", 18, 1], ["A-3", 31, 2], ["A-6", 52, 5]].map(([name, base, seed]) => ({ name, values: wave(14, base, 4, seed) })) }), 'style="grid-column:1/-1"')}
    ${show("Heat calendar pops in a wave", 'data-m="pop"', c.calendarHeat({ values: Array.from({ length: 126 }, (_, i) => ((i * 47) % 13) + (i % 7 > 4 ? 8 : 0)) }))}
    ${show("Split-flap tiles", 'data-m="flip"', flaps(), "", true)}
    ${show("Pie zooms in", 'data-m="zoom"', c.pie({ rows: [["Generators", 38], ["Mud pumps", 21], ["Supply boat", 14], ["Cranes", 9], ["Living quarters", 7]].map(([label, value]) => ({ label, value })), format: (v) => `${v} m³` }))}
    ${show("Activity slides from both sides", 'data-m="slide-left" "slide-right"', feed(), "", true)}
    ${show("Always on", 'data-m="pulse" "float" "shimmer"', always(), "", true)}
  </div>
  <p class="lede hint">Hover a bar: the rest step back (<code>data-m-group</code>). With reduced motion turned on, every card shows still and complete.</p>`;
