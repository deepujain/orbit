import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCount, formatCount } from "../src/motion.js";
import { CHARTS, compact } from "../src/charts.js";
import { CHART_PAGES, chartPage, chartCount } from "../example/charts-page.js";
import { motionPage } from "../example/motion-page.js";

const motionCss = readFileSync(new URL("../themes/motion.css", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../example/charts-page.js", import.meta.url), "utf8");

test("a count keeps what is around its number, its decimals and its digit grouping", () => {
  const c = parseCount("$1,204.50k");
  assert.deepEqual(c, { pre: "$", suf: "k", to: 1204.5, dp: 2, group: true });
  assert.equal(formatCount(c, 0), "$0.00k");
  assert.equal(formatCount(c, c.to), "$1,204.50k");
  assert.equal(formatCount(parseCount("92%"), 46), "46%");
  assert.equal(formatCount(parseCount("−610 kg"), 305), "−305 kg");
  assert.equal(parseCount("no number"), null);
});

test("big numbers read short", () => {
  assert.equal(compact(950), "950");
  assert.equal(compact(9800), "9,800");
  assert.equal(compact(18400), "18.4k");
  assert.equal(compact(2500000), "2.5M");
  assert.equal(compact(-14200), "-14.2k");
});

const chartsPage = () => CHART_PAGES.map((p) => chartPage(p.id)).join("");

test("the chart pages show every chart playskin draws between them, a few to a page, each a motion block with sound numbers", () => {
  const html = chartsPage();
  for (const p of CHART_PAGES) assert.ok(p.sections.reduce((n, [, items]) => n + items.length, 0) <= 10, `${p.label} is not crowded`);
  for (const name of Object.keys(CHARTS)) assert.match(pageSource, new RegExp(`c\\.${name}\\(`), `${name} is on the Charts page`);
  assert.ok(chartCount >= 40);
  assert.ok((html.match(/class="pc pc-k-/g) || []).length >= Object.keys(CHARTS).length);
  assert.doesNotMatch(html, /NaN|undefined|Infinity|\[object/);
  assert.equal((html.match(/class="pc pc-k-/g) || []).length, (html.match(/<div class="pc pc-k-[^"]*" data-motion/g) || []).length + (html.match(/pc-k-lollipop"(?! data-motion)/g) || []).length);
});

test("every effect a page asks for is one motion.css draws", () => {
  const known = new Set([...motionCss.matchAll(/\[data-m~="([a-z-]+)"\]/g)].map((m) => m[1]));
  for (const html of [chartsPage(), motionPage()]) {
    for (const [, tokens] of html.matchAll(/data-m="([^"]+)"/g)) for (const t of tokens.split(/\s+/)) assert.ok(known.has(t), `motion.css draws ${t}`);
  }
});

test("under reduced motion nothing moves", () => {
  const moving = motionCss.slice(motionCss.indexOf("@media (prefers-reduced-motion: no-preference)"));
  assert.match(moving, /\[data-motion\] \[data-m\] \{[^}]*animation-duration/);
  const before = motionCss.slice(0, motionCss.indexOf("@media (prefers-reduced-motion: no-preference)"));
  assert.doesNotMatch(before, /animation:/);
});
