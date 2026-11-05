/* Orbit's Charts page: every chart playskin/charts draws, on made-up numbers for Platform Alpha, an offshore oil rig. */
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

const SECTIONS = [
  ["Numbers", [
    ["Headline", "headline", c.headline({ value: "18,420 bbl", delta: 3, caption: "Oil produced today, against yesterday" })],
    ["Stat line", "statLine", c.statLine({ items: [["On board", "112"], ["Gas", "24.6 MMscf"], ["Water cut", "31%"], ["Uptime", "97.2%"]] })],
    ["KPI with sparkline", "kpi", `<div class="kpis">${c.kpi({ label: "Oil rate", value: "18,420 bbl/d", delta: 3, values: wave(10, 60, 14) })}${c.kpi({ label: "Gas flared", value: "1.8 MMscf", delta: -14, invert: true, values: wave(10, 40, 10, 3).reverse() })}</div>`, true],
  ]],
  ["Columns and bars", [
    ["Oil produced each day", "columns (BarChart)", c.columns({ rows: DAYS.map((label, i) => ({ label, value: [17200, 17900, 18100, 16400, 18800, 19300, 18420][i] })), format: bbl })],
    ["Rig hours by activity", "stackedColumns (stackId)", c.stackedColumns({ rows: DAYS.map((label, i) => ({ label, values: [12 + (i % 3), 6 - (i % 2), 3 + ((i * 2) % 3)] })), keys: ["Drilling", "Tripping", "Casing"], format: hrs })],
    ["Output by well", "RankedBars", c.rankedBars({ rows: WELLS.map((label, i) => ({ label, value: OUTPUT[i] })), format: bbl })],
    ["Output and water cut", "ComboBarLine (ComposedChart)", c.comboBarLine({ rows: WELLS.map((label, i) => ({ label, value: OUTPUT[i], rate: [18, 24, 31, 36, 42, 55][i] })), format: bbl })],
    ["Monthly output", "HighlightBars", c.highlightBars({ rows: MONTHS.slice(0, 9).map((label, i) => ({ label, value: wave(9, 520, 60, 2)[i] * 1000 })), tabs: ["Oil", "Gas", "Water"], format: bbl })],
    ["Wells against plan", "TargetBars", c.targetBars({ rows: WELLS.slice(0, 5).map((label, i) => ({ label, value: [3900, 3400, 3200, 2500, 2300][i], target: [4000, 3800, 3300, 3000, 2600][i] })), format: bbl })],
    ["Safety cards against target", "ProgressTargets", c.progressTargets({ rows: CREWS.slice(0, 5).map((label, i) => ({ label, value: [46, 38, 52, 29, 35][i] })), target: 40 })],
    ["Work orders closed", "LollipopColumns", c.lollipops({ rows: CREWS.map((label, i) => ({ label, value: [64, 51, 47, 38, 29, 18][i] })) })],
    ["Most safety cards", "PodiumLeaders", c.podium({ rows: PEOPLE.map((label, i) => ({ label, value: [48, 41, 37, 30, 26, 21, 15][i] })) })],
    ["Hours by person", "StackedAvatarColumns", c.avatarColumns({ rows: PEOPLE.slice(0, 6).map((label, i) => ({ label, values: [40 + i * 7, 30 + ((i * 13) % 25), 8 + ((i * 7) % 10)] })), keys: ["Drilling", "Maintenance", "Drills and training"], format: hrs })],
    ["Trips to the rig", "DotMatrixColumns", c.dotMatrix({ rows: MONTHS.slice(0, 8).map((label, i) => ({ label, values: [3 + (i % 3), 2 + ((i * 5) % 4), 1 + ((i * 3) % 5)] })), keys: ["Supply boats", "Helicopters", "Crew change"] })],
    ["From the wells to the tanker", "WaterfallColumns", c.waterfall({ width: 900, height: 260, steps: [{ label: "Well output", value: 21400, total: true }, { label: "Used on rig", value: -620 }, { label: "Flared", value: -480 }, { label: "Shrinkage", value: -220 }, { label: "From storage", value: 500 }, { label: "Sold", value: 20580, total: true }], format: bbl }), true],
    ["Output by quarter", "StackedBandColumns", c.bandColumns({ periods: ["Q1", "Q2", "Q3", "Q4"].map((label, i) => ({ label, values: [1200 + i * 300, 900 + ((i * 410) % 600), 600 + i * 120] })), keys: ["Oil", "Gas", "Condensate"], format: (v) => `${c.compact(v)}k boe` })],
  ]],
  ["Lines and areas", [
    ["Monthly output with target", "LineChart + ReferenceLine + ReferenceDot", c.lineChart({ width: 900, height: 260, labels: MONTHS, series: [{ name: "Oil", values: wave(12, 560, 120).map((v) => v * 1000) }, { name: "Water", values: wave(12, 260, 70, 4).map((v) => v * 1000) }], target: 700000, format: bbl }), true],
    ["Drilling speed, this week against last", "AreaChart", c.areaChart({ labels: DAYS, now: [42, 50, 47, 66, 72, 91, 80], before: [38, 44, 49, 52, 61, 70, 74], format: (v) => `${v} ft/h` })],
    ["Water cut by well", "MarginStrips", c.marginStrips({ series: [{ name: "A-1", values: wave(14, 18, 3) }, { name: "A-3", values: wave(14, 31, 4, 2) }, { name: "A-6", values: wave(14, 52, 5, 5) }] })],
    ["What the rig produces", "FlowRibbon", c.flowRibbon({ width: 900, height: 240, labels: MONTHS, series: [{ name: "Oil", values: wave(12, 40, 12) }, { name: "Gas", values: wave(12, 25, 15, 2) }, { name: "Water", values: wave(12, 15, 6, 4) }], markers: [3, 8] }), true],
    ["Permits to work", "LayeredStageArea", c.stageArea({ width: 900, height: 180, stages: [["Raised", 1200], ["Reviewed", 980], ["Approved", 860], ["Issued", 820], ["Closed", 790]].map(([label, value]) => ({ label, value })) }), true],
  ]],
  ["Rings, pies and gauges", [
    ["Where today went", "DonutWithLegend (Pie)", c.donut({ rows: DAY, format: hrs, center: "Hours" })],
    ["Diesel by user", "PieChart", c.pie({ rows: [["Generators", 38], ["Mud pumps", 21], ["Supply boat", 14], ["Cranes", 9], ["Living quarters", 7]].map(([label, value]) => ({ label, value })), format: (v) => `${v} m³` })],
    ["Spend today", "HatchedDonut", c.hatchedDonut({ rows: SPEND, format: money })],
    ["Output by well", "RadialRanks (RadialBarChart)", c.radialRanks({ rows: WELLS.slice(0, 5).map((label, i) => ({ label, value: OUTPUT[i] })), format: bbl })],
    ["Rig time", "SplitGauge", c.splitGauge({ rows: [["Working", 21.5], ["Repairs", 1.5], ["Weather", 1]].map(([label, value]) => ({ label, value })), format: hrs, center: "Hours" })],
    ["Rig uptime", "BlockGauge", c.blockGauge({ value: 0.97, label: "97%", caption: "Uptime this month" })],
    ["Mud pit level", "gauge", c.gauge({ value: 0.64, label: "64%", caption: "Active mud pits" })],
    ["Crane lifts by hour", "RadialSegments", c.radialSegments({ rows: Array.from({ length: 24 }, (_, h) => ({ label: `${h}:00`, value: Math.max(2, Math.round(30 * Math.exp(-((h - 9) ** 2) / 8) + 22 * Math.exp(-((h - 15) ** 2) / 10))) })), center: "Crane lifts" })],
    ["Inspections done", "CoverageRings", c.coverageRings({ rows: PEOPLE.slice(0, 5).map((label, i) => ({ label, value: [96, 84, 67, 52, 31][i] })), unit: "of checks" }), true],
  ]],
  ["Shares", [
    ["Spend today", "ShareTreemap (Treemap)", c.treemap({ rows: SPEND, format: money }), true],
    ["Spend split", "BreakdownStrip", c.breakdownStrip({ rows: SPEND.slice(0, 5), format: money })],
    ["Spend, each tick $1k", "TickBreakdown", c.tickBreakdown({ rows: SPEND.slice(1, 5), format: money }), true],
    ["Progress", "SegmentedProgress", `${c.segmentedProgress({ value: 0.72, label: "Well A-7 depth to target" })}${c.segmentedProgress({ value: 0.35, label: "Diesel tank" })}`],
    ["Output by well", "HexBinShare", c.hexShare({ rows: WELLS.slice(0, 5).map((label, i) => ({ label, value: OUTPUT[i] })), format: bbl }), true],
    ["Wells", "shareTable", c.shareTable({ title: "Wells", rows: WELLS.map((label, i) => ({ label, type: i === 4 ? "Gas" : "Oil", qty: OUTPUT[i], amount: OUTPUT[i] * 78 })), qtyLabel: "Barrels", amountLabel: "Value", money }), true],
  ]],
  ["Grids, rows and flows", [
    ["Faults by system", "HeatGrid", c.heatGrid({ rows: ["Mud pumps", "Top drive", "Cranes", "Compressors", "Generators", "Water makers"].map((label, i) => ({ label, values: DAYS.map((_, d) => ((i * 31 + d * 17) % 11) * ((i + d) % 4 ? 1 : 0) + (i === 0 && d > 3 ? 6 : 0)) })), columns: DAYS }), true],
    ["Barrels each day", "chart-calendar (month)", c.monthCalendar({ year: 2026, month: 9, format: (v) => `${(v / 1000).toFixed(1)}k`, values: october((d, w) => 16800 + ((d * 37) % 23) * 110 + (w > 4 ? 600 : 0) - (d === 14 ? 9000 : 0)) })],
    ["Gas checks, on time and late", "Check-in overview", c.monthCalendar({ year: 2026, month: 9, split: true, labels: ["On time", "Late"], values: october((d) => (d > 29 ? null : [14 + ((d * 7) % 9), (d * 5) % 4])) })],
    ["Safety walks each day", "chart-calendar", c.calendarHeat({ values: Array.from({ length: 126 }, (_, i) => ((i * 47) % 13) + (i % 7 > 4 ? 8 : 0)) })],
    ["Boat cargo", "ButterflyRows", c.butterfly({ rows: ["Pipe", "Drilling mud", "Fresh water", "Diesel", "Waste"].map((label, i) => ({ label, left: [320, 260, 410, 180, 40][i], right: [90, 120, 0, 0, 210][i] })), left: "Tonnes out", right: "Tonnes back" })],
    ["Late permits by area", "DotRows", c.dotRows({ rows: AREAS.slice(0, 4).map((label, i) => ({ label, total: [28, 34, 22, 30][i], flagged: [2, 6, 1, 9][i] })), flaggedLabel: "late" })],
    ["Permit flow", "OrderFunnelCard", c.funnel({ stages: [["Raised", 420], ["Approved", 365], ["Issued", 331], ["Closed", 298]].map(([label, value]) => ({ label, value })) })],
    ["Spend settling by category", "ExpenseFlowAnimationCard", c.dropColumns({ rows: SPEND.slice(1, 7), format: money })],
    ["Diesel stock", "StockBridge", c.stockBridge({ open: 820, moves: [{ label: "From supply boat", value: 400 }, { label: "Generators", value: -610 }, { label: "Cranes", value: -24 }], unit: " m³" })],
    ["Who is on shift", "PumpsCard", c.shiftTimeline({ from: 0, to: 24, rows: [["Drill crew A", [[6, 18]]], ["Drill crew B", [[0, 6], [18, 24]]], ["Crane ops", [[7, 12], [13, 17]]], ["Helideck", [[8, 9.5], [14, 15.5]]]].map(([label, spans]) => ({ label, spans })) })],
    ["Most permits issued", "RankTiles (most)", c.rankTiles({ rows: AREAS.map((label, i) => ({ label, value: [64, 51, 38, 22, 14, 9][i] })), unit: "permits" }), true],
    ["Equipment with fewest checks", "RankTiles (fewest)", c.rankTiles({ view: "fewest", rows: ["Lifeboat 2", "Fire pump B", "Gas detector 14", "Crane 3", "BOP panel", "Emergency light 7", "Mud pump 2", "Winch 4", "Fire pump A", "Lifeboat 1"].map((label, i) => ({ label, value: [0, 0, 1, 2, 3, 0, 5, 6, 7, 4][i] })), unit: "checks", empty: "not checked" }), true],
    ["Well fluid through the separator", "FlowAnimationCard", c.flow({ width: 900, height: 240, source: "Separator", sinks: [["Oil to tanker", 18400], ["Water treated", 8200], ["Fuel gas", 620], ["Flare", 480]].map(([label, value]) => ({ label, value })) }), true],
  ]],
];

// Two charts to a row: when a section has an odd number of half-width cards, its last one takes the whole row.
const paired = (items) => {
  const half = items.filter((it) => !it[3]);
  const last = half.length % 2 ? half.at(-1) : null;
  return items.map((it) => (it === last ? [...it.slice(0, 3), true] : it));
};

export const chartsPage = () => `
  <div class="page-head"><div><h1>Charts</h1><p class="lede">Every chart playskin draws, on made-up numbers for Platform Alpha, an offshore oil rig. Each one builds in as it comes into view.</p></div>
    <button class="btn" data-button="default" data-replay-all>Replay all</button></div>
  ${SECTIONS.map(([name, items]) => `<h2>${name}</h2><div class="shows">${paired(items).map(([title, spark, body, wide]) => card(title, spark, body, wide)).join("")}</div>`).join("")}`;

export const chartCount = SECTIONS.reduce((n, [, items]) => n + items.length, 0);
