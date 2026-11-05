/* Orbit's chart pages: a few charts to a page by topic, on made-up numbers for Platform Alpha, an offshore oil rig.
   Each chart type appears once in Orbit; the dashboard and the Motion page draw the rest. */
import * as c from "../src/charts.js";

const money = (v) => `$${c.compact(v)}`;
const bbl = (v) => `${c.compact(v)} bbl`;
const hrs = (v) => `${v}h`;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WELLS = ["A-1", "A-2", "A-3", "A-4", "A-5", "A-6"];
const OUTPUT = [4200, 3650, 3100, 2900, 2400, 1800];
const CREWS = ["Drill crew", "Deck crew", "Mechanics", "Electricians", "Control room", "Catering"];
const PEOPLE = ["Maya Ray", "Arjun Mehta", "Lena Fox", "Sam Ito", "Priya Das", "Omar Ali", "Kai Berg"];
const AREAS = ["Drill floor", "Pipe deck", "Pump room", "Process deck", "Helideck", "Living quarters"];
const SPEND = [["Rig day rate", 182000, 1], ["Fuel", 41000, 18], ["Supply boats", 36000, 9], ["Helicopters", 28000, 12], ["Chemicals", 17000, 22], ["Catering", 12000, 31], ["Rentals", 9000, 7]].map(([label, value, count]) => ({ label, value, count }));
const DAY = [["Drilling", 11.5], ["Tripping pipe", 5], ["Running casing", 3.5], ["Circulating", 2.5], ["Waiting on weather", 1.5]].map(([label, value]) => ({ label, value }));
const wave = (n, base, amp, seed = 1) => Array.from({ length: n }, (_, i) => Math.round(base + amp * Math.sin(i / 1.7 + seed) + (i * amp) / n + ((i * 37 + seed * 11) % 7) * (amp / 10)));
const october = (fn) => Array.from({ length: 31 }, (_, i) => fn(i + 1, (i + 3) % 7));

const card = (title, spark, body, wide = false) => `
  <section class="card chart-card${wide ? " wide" : ""}" data-card>
    <div class="show-head"><h3 data-card-title>${title}</h3><button class="btn" data-button="ghost" data-replay>Replay</button></div>
    <code class="how">${spark}</code>
    ${body}
  </section>`;

export const CHART_PAGES = [
  { id: "production", icon: "drop", label: "Production", lede: "Oil, gas and water from Platform Alpha, today and over the year.", sections: [
    ["Today", [
      ["Headline", "headline", c.headline({ value: "18,420 bbl", delta: 3, caption: "Oil produced today, against yesterday" })],
      ["Barrels each day", "chart-calendar (month)", c.monthCalendar({ year: 2026, month: 9, format: (v) => `${(v / 1000).toFixed(1)}k`, values: october((d, w) => 16800 + ((d * 37) % 23) * 110 + (w > 4 ? 600 : 0) - (d === 14 ? 9000 : 0)) })],
    ]],
    ["Over time", [
      ["Output by quarter", "StackedBandColumns", c.bandColumns({ periods: ["Q1", "Q2", "Q3", "Q4"].map((label, i) => ({ label, values: [1200 + i * 300, 900 + ((i * 410) % 600), 600 + i * 120] })), keys: ["Oil", "Gas", "Condensate"], format: (v) => `${c.compact(v)}k boe` })],
      ["Monthly output with target", "LineChart + ReferenceLine + ReferenceDot", c.lineChart({ width: 900, height: 260, labels: MONTHS, series: [{ name: "Oil", values: wave(12, 560, 120).map((v) => v * 1000) }, { name: "Water", values: wave(12, 260, 70, 4).map((v) => v * 1000) }], target: 700000, format: bbl }), true],
      ["From the wells to the tanker", "WaterfallColumns", c.waterfall({ width: 900, height: 260, steps: [{ label: "Well output", value: 21400, total: true }, { label: "Used on rig", value: -620 }, { label: "Flared", value: -480 }, { label: "Shrinkage", value: -220 }, { label: "From storage", value: 500 }, { label: "Sold", value: 20580, total: true }], format: bbl }), true],
    ]],
  ] },
  { id: "wells", icon: "derrick", label: "Wells", lede: "How each of the six wells is flowing, and where the fluid goes.", sections: [
    ["Output", [
      ["Output and water cut", "ComboBarLine (ComposedChart)", c.comboBarLine({ rows: WELLS.map((label, i) => ({ label, value: OUTPUT[i], rate: [18, 24, 31, 36, 42, 55][i] })), format: bbl })],
      ["Wells against plan", "TargetBars", c.targetBars({ rows: WELLS.slice(0, 5).map((label, i) => ({ label, value: [3900, 3400, 3200, 2500, 2300][i], target: [4000, 3800, 3300, 3000, 2600][i] })), format: bbl })],
    ]],
    ["Shares and flow", [
      ["Well output rings", "RadialRanks (RadialBarChart)", c.radialRanks({ rows: WELLS.slice(0, 5).map((label, i) => ({ label, value: OUTPUT[i] })), format: bbl })],
      ["Share of output", "HexBinShare", c.hexShare({ rows: WELLS.slice(0, 5).map((label, i) => ({ label, value: OUTPUT[i] })), format: bbl })],
      ["Wells", "shareTable", c.shareTable({ title: "Wells", rows: WELLS.map((label, i) => ({ label, type: i === 4 ? "Gas" : "Oil", qty: OUTPUT[i], amount: OUTPUT[i] * 78 })), qtyLabel: "Barrels", amountLabel: "Value", money }), true],
      ["What the rig produces", "FlowRibbon", c.flowRibbon({ width: 900, height: 240, labels: MONTHS, series: [{ name: "Oil", values: wave(12, 40, 12) }, { name: "Gas", values: wave(12, 25, 15, 2) }, { name: "Water", values: wave(12, 15, 6, 4) }], markers: [3, 8] }), true],
      ["Well fluid through the separator", "FlowAnimationCard", c.flow({ width: 900, height: 240, source: "Separator", sinks: [["Oil to tanker", 18400], ["Water treated", 8200], ["Fuel gas", 620], ["Flare", 480]].map(([label, value]) => ({ label, value })) }), true],
    ]],
  ] },
  { id: "drilling", icon: "drill", label: "Drilling", lede: "Well A-7: how the rig spends its day and how fast the bit goes down.", sections: [
    ["Rig time and equipment", [
      ["Rig hours by activity", "stackedColumns (stackId)", c.stackedColumns({ rows: DAYS.map((label, i) => ({ label, values: [12 + (i % 3), 6 - (i % 2), 3 + ((i * 2) % 3)] })), keys: ["Drilling", "Tripping", "Casing"], format: hrs })],
      ["Progress", "SegmentedProgress", [[0.72, "Well A-7 depth to target"], [0.35, "Diesel tank"]].map(([value, label]) => c.segmentedProgress({ value, label })).join("")],
      ["Faults by system", "HeatGrid", c.heatGrid({ rows: ["Mud pumps", "Top drive", "Cranes", "Compressors", "Generators", "Water makers"].map((label, i) => ({ label, values: DAYS.map((_, d) => ((i * 31 + d * 17) % 11) * ((i + d) % 4 ? 1 : 0) + (i === 0 && d > 3 ? 6 : 0)) })), columns: DAYS }), true],
    ]],
  ] },
  { id: "safety", icon: "shield", label: "Safety", lede: "Safety cards, inspections, and permits to work from raised to closed.", sections: [
    ["People", [
      ["Most safety cards", "PodiumLeaders", c.podium({ rows: PEOPLE.map((label, i) => ({ label, value: [48, 41, 37, 30, 26, 21, 15][i] })) })],
      ["Inspections done", "CoverageRings", c.coverageRings({ rows: PEOPLE.slice(0, 5).map((label, i) => ({ label, value: [96, 84, 67, 52, 31][i] })), unit: "of checks" }), true],
    ]],
    ["Permits to work", [
      ["Permits to work", "LayeredStageArea", c.stageArea({ width: 900, height: 180, stages: [["Raised", 1200], ["Reviewed", 980], ["Approved", 860], ["Issued", 820], ["Closed", 790]].map(([label, value]) => ({ label, value })) }), true],
      ["Permit flow", "OrderFunnelCard", c.funnel({ stages: [["Raised", 420], ["Approved", 365], ["Issued", 331], ["Closed", 298]].map(([label, value]) => ({ label, value })) })],
      ["Late permits by area", "DotRows", c.dotRows({ rows: AREAS.slice(0, 4).map((label, i) => ({ label, total: [28, 34, 22, 30][i], flagged: [2, 6, 1, 9][i] })), flaggedLabel: "late" })],
    ]],
  ] },
  { id: "supply", icon: "ship", label: "Supply", lede: "Boats, helicopters, diesel, cranes and the crews who run them.", sections: [
    ["Boats and stock", [
      ["Trips to the rig", "DotMatrixColumns", c.dotMatrix({ rows: MONTHS.slice(0, 8).map((label, i) => ({ label, values: [3 + (i % 3), 2 + ((i * 5) % 4), 1 + ((i * 3) % 5)] })), keys: ["Supply boats", "Helicopters", "Crew change"] })],
      ["Boat cargo", "ButterflyRows", c.butterfly({ rows: ["Pipe", "Drilling mud", "Fresh water", "Diesel", "Waste"].map((label, i) => ({ label, left: [320, 260, 410, 180, 40][i], right: [90, 120, 0, 0, 210][i] })), left: "Tonnes out", right: "Tonnes back" })],
      ["Diesel stock", "StockBridge", c.stockBridge({ open: 820, moves: [{ label: "From supply boat", value: 400 }, { label: "Generators", value: -610 }, { label: "Cranes", value: -24 }], unit: " m³" })],
    ]],
    ["Crew", [
      ["Crane lifts by hour", "RadialSegments", c.radialSegments({ rows: Array.from({ length: 24 }, (_, h) => ({ label: `${h}:00`, value: Math.max(2, Math.round(30 * Math.exp(-((h - 9) ** 2) / 8) + 22 * Math.exp(-((h - 15) ** 2) / 10))) })), center: "Crane lifts" })],
      ["Who is on shift", "PumpsCard", c.shiftTimeline({ from: 0, to: 24, rows: [["Drill crew A", [[6, 18]]], ["Drill crew B", [[0, 6], [18, 24]]], ["Crane ops", [[7, 12], [13, 17]]], ["Helideck", [[8, 9.5], [14, 15.5]]]].map(([label, spans]) => ({ label, spans })) })],
      ["Hours by person", "StackedAvatarColumns", c.avatarColumns({ rows: PEOPLE.slice(0, 6).map((label, i) => ({ label, values: [40 + i * 7, 30 + ((i * 13) % 25), 8 + ((i * 7) % 10)] })), keys: ["Drilling", "Maintenance", "Drills and training"], format: hrs })],
    ]],
  ] },
  { id: "costs", icon: "dollar", label: "Costs", lede: "What a day on the rig costs, and where the money goes.", sections: [
    ["Spend", [
      ["Spend today", "ShareTreemap (Treemap)", c.treemap({ rows: SPEND, format: money }), true],
      ["Biggest costs", "HatchedDonut", c.hatchedDonut({ rows: SPEND, format: money })],
      ["Spend, each tick $1k", "TickBreakdown", c.tickBreakdown({ rows: SPEND.slice(1, 5), format: money })],
      ["Spend settling by category", "ExpenseFlowAnimationCard", c.dropColumns({ rows: SPEND.slice(1, 7), format: money })],
    ]],
  ] },
];

// Two charts to a row: when a section has an odd number of half-width cards, its last one takes the whole row.
const paired = (items) => {
  const half = items.filter((it) => !it[3]);
  const last = half.length % 2 ? half.at(-1) : null;
  return items.map((it) => (it === last ? [...it.slice(0, 3), true] : it));
};

export const chartPage = (id) => {
  const { label, lede, sections } = CHART_PAGES.find((p) => p.id === id);
  return `
  <div class="page-head"><div><h1>${label}</h1><p class="lede">${lede}</p></div>
    <button class="btn" data-button="default" data-replay-all>Replay all</button></div>
  ${sections.map(([name, items]) => `<h2>${name}</h2><div class="shows">${paired(items).map(([title, spark, body, wide]) => card(title, spark, body, wide)).join("")}</div>`).join("")}`;
};

export const chartCount = CHART_PAGES.reduce((n, p) => n + p.sections.reduce((m, [, items]) => m + items.length, 0), 0);
