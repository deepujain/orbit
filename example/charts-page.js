/* Orbit's Charts page: every chart playskin/charts draws, on made-up numbers for a small coffee chain. */
import * as c from "../src/charts.js";

const money = (v) => `$${c.compact(v)}`;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SHOPS = ["Harbor", "Old Town", "Riverside", "Airport", "Campus", "Market"];
const DRINKS = [["Latte", 4200], ["Cold brew", 3100], ["Espresso", 2300], ["Mocha", 1500], ["Tea", 900], ["Juice", 600], ["Water", 400]].map(([label, value]) => ({ label, value }));
const wave = (n, base, amp, seed = 1) => Array.from({ length: n }, (_, i) => Math.round(base + amp * Math.sin(i / 1.7 + seed) + (i * amp) / n + ((i * 37 + seed * 11) % 7) * (amp / 10)));

const card = (title, spark, body, wide = false) => `
  <section class="card chart-card${wide ? " wide" : ""}" data-card>
    <div class="show-head"><h3 data-card-title>${title}</h3><button class="btn" data-button="ghost" data-replay>Replay</button></div>
    <code class="how">${spark}</code>
    ${body}
  </section>`;

const SECTIONS = [
  ["Numbers", [
    ["Headline", "headline", c.headline({ value: "$48,210", delta: 12, caption: "Sales this week, against last week" })],
    ["Stat line", "statLine", c.statLine({ items: [["Orders", "1,284"], ["Average", "$7.40"], ["Refunds", "6"], ["Tips", "$912"]] })],
    ["KPI with sparkline", "kpi", `<div class="kpis">${c.kpi({ label: "Revenue", value: "$9,420", delta: 8, values: wave(10, 60, 14) })}${c.kpi({ label: "Waste", value: "3.1%", delta: -14, invert: true, values: wave(10, 40, 10, 3).reverse() })}</div>`, true],
  ]],
  ["Columns and bars", [
    ["Columns with average", "columns (BarChart)", c.columns({ rows: DAYS.map((label, i) => ({ label, value: [820, 940, 880, 1120, 1380, 1720, 1510][i] })), format: money })],
    ["Stacked columns", "stackedColumns (stackId)", c.stackedColumns({ rows: DAYS.map((label, i) => ({ label, values: [300 + i * 40, 220 + ((i * 53) % 140), 120 + i * 18] })), keys: ["Dine in", "Takeaway", "Delivery"] })],
    ["Ranked bars", "RankedBars", c.rankedBars({ rows: SHOPS.map((label, i) => ({ label, value: [18400, 15200, 12900, 9800, 7100, 4300][i] })), format: money })],
    ["Bars and a line", "ComboBarLine (ComposedChart)", c.comboBarLine({ rows: DRINKS.slice(0, 6).map((d, i) => ({ ...d, rate: [62, 71, 74, 58, 80, 45][i] })), format: money })],
    ["Highlighted bar", "HighlightBars", c.highlightBars({ rows: MONTHS.slice(0, 9).map((label, i) => ({ label, value: wave(9, 50, 20, 2)[i] })), tabs: ["Sales", "Orders", "Visits"] })],
    ["Against target", "TargetBars", c.targetBars({ rows: SHOPS.slice(0, 5).map((label, i) => ({ label, value: [82, 64, 95, 41, 70][i], target: [100, 90, 100, 80, 85][i] })) })],
    ["Progress against target", "ProgressTargets", c.progressTargets({ rows: SHOPS.slice(0, 5).map((label, i) => ({ label, value: [9200, 7600, 11400, 5100, 6800][i] })), target: 9000, format: money })],
    ["Lollipops", "LollipopColumns", c.lollipops({ rows: SHOPS.map((label, i) => ({ label, value: [312, 280, 244, 198, 150, 96][i] })) })],
    ["Podium", "PodiumLeaders", c.podium({ rows: ["Maya", "Arjun", "Lena", "Sam", "Priya", "Omar", "Kai"].map((label, i) => ({ label, value: [148, 131, 122, 98, 87, 71, 54][i] })) })],
    ["Stacked with avatars", "StackedAvatarColumns", c.avatarColumns({ rows: ["Maya Ray", "Arjun Mehta", "Lena Fox", "Sam Ito", "Priya Das", "Omar Ali"].map((label, i) => ({ label, values: [40 + i * 7, 30 + ((i * 13) % 25), 20 + ((i * 7) % 18)] })), keys: ["Coffee", "Food", "Beans"] })],
    ["Dot matrix", "DotMatrixColumns", c.dotMatrix({ rows: MONTHS.slice(0, 8).map((label, i) => ({ label, values: [3 + (i % 3), 2 + ((i * 5) % 4), 1 + ((i * 3) % 5)] })), keys: ["New", "Returning", "Members"] })],
    ["Waterfall", "WaterfallColumns", c.waterfall({ width: 900, height: 260, steps: [{ label: "Sales", value: 48000, total: true }, { label: "Beans", value: -14200 }, { label: "Staff", value: -16800 }, { label: "Rent", value: -6200 }, { label: "Catering", value: 5400 }, { label: "Profit", value: 16200, total: true }], format: money }), true],
    ["Band columns", "StackedBandColumns", c.bandColumns({ periods: ["Q1", "Q2", "Q3", "Q4"].map((label, i) => ({ label, values: [120 + i * 30, 90 + ((i * 41) % 60), 60 + i * 12] })), keys: ["Coffee", "Food", "Beans"] })],
  ]],
  ["Lines and areas", [
    ["Line with target and peak", "LineChart + ReferenceLine + ReferenceDot", c.lineChart({ width: 900, height: 260, labels: MONTHS, series: [{ name: "Visits", values: wave(12, 60, 22) }, { name: "Orders", values: wave(12, 38, 14, 4) }], target: 90 }), true],
    ["This period against last", "AreaChart", c.areaChart({ labels: DAYS, now: [42, 50, 47, 66, 72, 91, 80], before: [38, 44, 49, 52, 61, 70, 74], format: money })],
    ["Margin strips", "MarginStrips", c.marginStrips({ series: [{ name: "Coffee", values: wave(14, 62, 5) }, { name: "Food", values: wave(14, 38, 6, 2) }, { name: "Beans", values: wave(14, 24, 4, 5) }] })],
    ["Flow ribbon", "FlowRibbon", c.flowRibbon({ width: 900, height: 240, labels: MONTHS, series: [{ name: "Latte", values: wave(12, 40, 12) }, { name: "Cold brew", values: wave(12, 25, 15, 2) }, { name: "Tea", values: wave(12, 15, 6, 4) }], markers: [3, 8] }), true],
    ["Stage area", "LayeredStageArea", c.stageArea({ width: 900, height: 180, stages: [["Visited", 12000], ["Browsed", 7400], ["Added", 3900], ["Paid", 2600], ["Came back", 1100]].map(([label, value]) => ({ label, value })) }), true],
  ]],
  ["Rings, pies and gauges", [
    ["Donut with legend", "DonutWithLegend (Pie)", c.donut({ rows: DRINKS.slice(0, 5), format: money })],
    ["Pie", "PieChart", c.pie({ rows: DRINKS.slice(0, 5), format: money })],
    ["Hatched donut", "HatchedDonut", c.hatchedDonut({ rows: DRINKS, format: money })],
    ["Radial bars", "RadialRanks (RadialBarChart)", c.radialRanks({ rows: SHOPS.slice(0, 5).map((label, i) => ({ label, value: [920, 780, 640, 510, 300][i] })) })],
    ["Split gauge", "SplitGauge", c.splitGauge({ rows: [["Card", 31200], ["Cash", 9800], ["App", 7200]].map(([label, value]) => ({ label, value })), format: money })],
    ["Block gauge", "BlockGauge", c.blockGauge({ value: 0.78, label: "78%", caption: "Orders on time" })],
    ["Gauge", "gauge", c.gauge({ value: 0.64, label: "64", caption: "Health score" })],
    ["Polar segments", "RadialSegments", c.radialSegments({ rows: Array.from({ length: 24 }, (_, h) => ({ label: `${h}:00`, value: Math.max(4, Math.round(60 * Math.exp(-((h - 9) ** 2) / 8) + 40 * Math.exp(-((h - 15) ** 2) / 10))) })), center: "Orders by hour" })],
    ["Coverage rings", "CoverageRings", c.coverageRings({ rows: ["Maya Ray", "Arjun Mehta", "Lena Fox", "Sam Ito", "Priya Das"].map((label, i) => ({ label, value: [96, 84, 67, 52, 31][i] })), unit: "of visits" }), true],
  ]],
  ["Shares", [
    ["Treemap", "ShareTreemap (Treemap)", c.treemap({ rows: DRINKS, format: money }), true],
    ["Breakdown strip", "BreakdownStrip", c.breakdownStrip({ rows: DRINKS.slice(0, 5), format: money })],
    ["Tick breakdown", "TickBreakdown", c.tickBreakdown({ rows: DRINKS.slice(0, 4), format: money }), true],
    ["Segmented progress", "SegmentedProgress", `${c.segmentedProgress({ value: 0.72, label: "Monthly goal" })}${c.segmentedProgress({ value: 0.35, label: "Bean stock" })}`],
    ["Hex share", "HexBinShare", c.hexShare({ rows: DRINKS.slice(0, 5), format: money }), true],
  ]],
  ["Grids, rows and flows", [
    ["Heat grid", "HeatGrid", c.heatGrid({ rows: SHOPS.slice(0, 5).map((label, i) => ({ label, values: DAYS.map((_, d) => 40 + ((i * 31 + d * 17) % 70) + (d > 4 ? 40 : 0)) })), columns: DAYS }), true],
    ["Calendar heat", "chart-calendar", c.calendarHeat({ values: Array.from({ length: 126 }, (_, i) => ((i * 47) % 13) + (i % 7 > 4 ? 8 : 0)) })],
    ["Butterfly rows", "ButterflyRows", c.butterfly({ rows: SHOPS.slice(0, 5).map((label, i) => ({ label, left: [320, 260, 410, 180, 220][i], right: [290, 300, 350, 210, 160][i] })), left: "Full cups out", right: "Empties back" })],
    ["Dot rows", "DotRows", c.dotRows({ rows: SHOPS.slice(0, 4).map((label, i) => ({ label, total: [28, 34, 22, 30][i], flagged: [2, 6, 1, 9][i] })), flaggedLabel: "late" })],
    ["Funnel", "OrderFunnelCard", c.funnel({ stages: [["Created", 420], ["Approved", 365], ["Packed", 331], ["Delivered", 298]].map(([label, value]) => ({ label, value })) })],
    ["Stock bridge", "StockBridge", c.stockBridge({ open: 820, moves: [{ label: "Received", value: 400 }, { label: "Sold", value: -610 }, { label: "Spilled", value: -24 }], unit: " kg" })],
    ["Shift timeline", "PumpsCard", c.shiftTimeline({ rows: [["Bar 1", [[6, 11], [13, 18]]], ["Bar 2", [[7, 15]]], ["Bar 3", [[10, 14], [16, 22]]], ["Drive-in", [[6, 9.5], [11, 20]]]].map(([label, spans]) => ({ label, spans })) })],
    ["Rank tiles", "RankTiles", c.rankTiles({ rows: SHOPS.slice(0, 4).map((label, i) => ({ label, value: [64, 51, 38, 22][i] })), unit: "check-ins" }), true],
    ["Flow", "FlowAnimationCard", c.flow({ width: 900, height: 240, source: "Roastery", sinks: SHOPS.slice(0, 4).map((label, i) => ({ label, value: [420, 310, 220, 140][i] })) }), true],
  ]],
];

// Two charts to a row: when a section has an odd number of half-width cards, its last one takes the whole row.
const paired = (items) => {
  const half = items.filter((it) => !it[3]);
  const last = half.length % 2 ? half.at(-1) : null;
  return items.map((it) => (it === last ? [...it.slice(0, 3), true] : it));
};

export const chartsPage = () => `
  <div class="page-head"><div><h1>Charts</h1><p class="lede">Every chart playskin draws, on made-up numbers for a small coffee chain. Each one builds in as it comes into view.</p></div>
    <button class="btn" data-button="default" data-replay-all>Replay all</button></div>
  ${SECTIONS.map(([name, items]) => `<h2>${name}</h2><div class="shows">${paired(items).map(([title, spark, body, wide]) => card(title, spark, body, wide)).join("")}</div>`).join("")}`;

export const chartCount = SECTIONS.reduce((n, [, items]) => n + items.length, 0);
