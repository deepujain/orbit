import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PLANE_SVG, LADYBUG_SVG, SNAIL_SVG, CRAYON_TOGGLE, CRAYON_ICON, BUNTING, planeFrames, startCrayonPlane, startCrayon, mountCrayonDoodles } from "../src/crayon.js";

const css = readFileSync(new URL("../themes/crayon.css", import.meta.url), "utf8");

test("the paper plane leaves its anchor hidden, loops once upside down and glides off the right edge", () => {
  const f = planeFrames({ cx: 120, cy: 30 }, 1280);
  assert.equal(f[0].opacity, 0);
  assert.equal(f.at(-1).opacity, 0);
  assert.ok(f.every((x, i) => i === 0 || x.offset >= f[i - 1].offset), "offsets increase");
  const rot = f.map((x) => Number(/rotate\(([-\d.]+)deg/.exec(x.transform)[1]));
  assert.ok(rot.some((r) => Math.abs(r + 180) < 20), "it is upside down at the top of the loop");
  assert.ok(Number(/translate\(([-\d.]+)px/.exec(f.at(-1).transform)[1]) > 1280, "it leaves past the right edge");
});

test("every part of every drawing is drawn by crayon.css, in light and in dark", () => {
  for (const svg of [PLANE_SVG, LADYBUG_SVG, SNAIL_SVG, CRAYON_TOGGLE, BUNTING])
    for (const [, cls] of svg.matchAll(/class="([^"]+)"/g)) assert.match(css, new RegExp(`\\.${cls}\\b`), `.${cls} is styled`);
  assert.match(css, /:is\(\.dark, \[data-theme="dark"\]\) \.cr-moon \{ display: block; \}/, "dark shows the moon");
  assert.match(CRAYON_ICON, /^<svg viewBox="0 0 24 24"/);
  assert.equal(typeof mountCrayonDoodles, "function", "the doodles come from the same module");
});

test("the plane moves only when asked: never under reduced motion, in a hidden tab or with the skin off", () => {
  const timers = [], on = { skin: false, still: false };
  const plane = { animations: [], setAttribute() {}, classList: { add() {}, remove() {} }, remove() {} };
  plane.animate = (frames) => {
    const a = { frames, finished: new Promise(() => {}), cancel() {}, pause() {}, play() {} };
    plane.animations.push(a);
    return a;
  };
  const brand = { getBoundingClientRect: () => ({ width: 80, right: 100, top: 10, height: 20 }) };
  const doc = { hidden: false, body: { append() {} }, documentElement: { getAttribute: () => (on.skin ? "crayon" : null) }, createElement: () => plane, querySelector: () => brand, addEventListener() {}, removeEventListener() {} };
  const win = { innerWidth: 1280, matchMedia: () => ({ matches: on.still }), setTimeout: (fn, ms) => timers.push([fn, ms]), clearTimeout() {} };
  const p = startCrayonPlane({ doc, win });
  timers.shift()[0]();
  assert.equal(plane.animations.length, 0, "no flight with the skin off");
  on.skin = true;
  on.still = true;
  timers.shift()[0]();
  assert.equal(plane.animations.length, 0, "no flight under reduced motion");
  on.still = false;
  doc.hidden = true;
  timers.shift()[0]();
  assert.equal(plane.animations.length, 0, "no flight in a hidden tab");
  doc.hidden = false;
  timers.shift()[0]();
  assert.equal(plane.animations.length, 1, "it flies when everything allows");
  assert.equal(p.flights(), 1);
  assert.equal(p.fly(), false, "one plane in the air at a time");
  assert.ok(timers[0][1] >= 14000 && timers[0][1] <= 26000, "the next flight is 14 to 26 seconds away");
});

test("Crayon is whole from the library: createOrbit brings out every part, and each theme reads either dark switch", () => {
  const index = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
  assert.match(index, /if \(theme === "crayon" && !crayon\) crayon = startCrayon\(o\.crayon\);/);
  assert.match(index, /crayon\.stop\(\);/, "turning Crayon off takes its parts away");
  assert.equal(typeof startCrayon, "function");
  for (const part of ["data-topbar", "data-wordmark", "data-nav", "data-theme-toggle"]) assert.ok(css.includes(`[${part}]`), `Crayon styles [${part}]`);
  const aura = readFileSync(new URL("../themes/aura.css", import.meta.url), "utf8");
  for (const part of ["data-topbar", "data-wordmark", "data-nav"]) assert.ok(aura.includes(`[${part}]`), `Aura styles [${part}]`);
  for (const [name, sheet] of [["crayon", css], ["aura", aura]]) {
    assert.doesNotMatch(sheet, /\]\.dark\b/, `${name} never reads .dark alone`);
    assert.match(sheet, /:is\(\.dark, \[data-theme="dark"\]\)/, `${name} reads .dark or data-theme="dark"`);
  }
  assert.match(readFileSync(new URL("../src/crayon-doodles.js", import.meta.url), "utf8"), /<i class="cr-snail">\$\{SNAIL_SVG\}<\/i>/, "the doodles' snail turns at the edge");
});
