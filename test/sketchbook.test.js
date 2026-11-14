import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { poster, SKETCHBOOK_ART, SKETCHBOOK_FONTS } from "../src/sketchbook.js";

const css = readFileSync(new URL("../themes/sketchbook.css", import.meta.url), "utf8");
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("a poster puts the words before the drawing, escapes what it is given and keeps the letters from screen readers", () => {
  const html = poster({ letters: "LPG", art: "/a.webp", alt: 'Rider & "cylinders"', title: "Gas <on> time", lines: ["Orders", "Trips"], side: "left" });
  assert.match(html, /^<figure class="sb-poster" data-side="left">/);
  assert.match(html, /<div class="sb-stage"><span class="sb-letters" style="--sb-n:3" aria-hidden="true">LPG<\/span><img class="sb-art"/);
  assert.match(html, /<span class="sb-swash">Gas &lt;on&gt; time<\/span>/);
  assert.match(html, /alt="Rider &amp; &quot;cylinders&quot;"/);
  assert.ok(html.indexOf("sb-words") < html.indexOf("sb-stage"), "words come first so the grid reads left to right");
  assert.match(html, /<ul class="sb-lines"><li>Orders<\/li><li>Trips<\/li><\/ul>/);
});

test("a marker poster drops the swash, and an unknown side falls back to right", () => {
  const html = poster({ title: "Walk together", titleStyle: "marker", side: "up", ticks: false });
  assert.match(html, /<p class="sb-marker">Walk together<\/p>/);
  assert.match(html, /data-side="right"/);
  assert.doesNotMatch(html, /sb-swash|sb-ticks|<img/);
});

test("the drawings ship with the package and the fonts address names all four faces", () => {
  for (const name of ["walk", "ride", "talk"]) {
    assert.ok(existsSync(new URL(`../art/sketchbook/${name}.webp`, import.meta.url)), name);
    assert.match(SKETCHBOOK_ART[name], new RegExp(`art/sketchbook/${name}\\.webp$`));
  }
  for (const face of ["Archivo+Black", "Caveat+Brush", "Kalam:wght@400;700"]) assert.ok(SKETCHBOOK_FONTS.includes(face), face);
  assert.ok(pkg.files.includes("art"));
  assert.equal(pkg.exports["./sketchbook.css"], "./themes/sketchbook.css");
  assert.equal(pkg.exports["./sketchbook"].default, "./src/sketchbook.js");
});

test("the skin works on a wrapper as well as <html>, has a night page, and steps aside for forced colours", () => {
  assert.match(css, /\[data-orbit="sketchbook"\]:is\(html\) body, \[data-orbit="sketchbook"\]:not\(html\)/);
  assert.match(css, /:is\(\.dark, \[data-theme="dark"\]\) \[data-orbit="sketchbook"\], \[data-orbit="sketchbook"\]:is\(\.dark, \[data-theme="dark"\]\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)/);
  assert.doesNotMatch(css, /@import/, "fonts are the page's to load");
});
