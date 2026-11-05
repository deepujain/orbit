import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readMs, pickType, restoreOf, withIntro, scriptWords, recordingName, RECORD_TYPES, startRecord } from "../src/record.js";
import { THEMES, THEME_NAMES, bootScript } from "../src/index.js";

// Just enough of a page for startRecord to put its parts on: what it appends to the body, and the attributes it sets.
const fakePage = () => {
  const added = [];
  const el = () => ({ hidden: true, style: {}, classList: { toggle() {} }, setAttribute() {}, addEventListener() {}, remove() {} });
  globalThis.document = { createElement: el, body: { append: (...els) => added.push(...els) }, querySelectorAll: () => [] };
  globalThis.addEventListener = () => {};
  globalThis.removeEventListener = () => {};
  const marks = new Set();
  const root = { getAttribute: () => null, toggleAttribute: (name, on) => (on ? marks.add(name) : marks.delete(name)) };
  return { added, root, marks };
};

test("Record is an action, not a skin, so a page can be filmed in any skin", () => {
  assert.deepEqual(THEMES, ["aura", "crayon", "whiskers"]);
  assert.equal(THEME_NAMES.record, undefined);
  assert.doesNotMatch(bootScript(), /record/);
  const { added, root } = fakePage();
  const rec = startRecord({ script: () => ({ title: "Page", steps: [{ heading: "Page", say: "Hello." }] }), root });
  assert.equal(added.length, 3, "its own button, ring and caption");
  assert.equal(added[0].hidden, false, "the button is out with no skin turned on");
  assert.equal(rec.available(), true);
});

test("with button: false the app's own button drives Record and follows it through onChange", () => {
  const { added, root } = fakePage();
  let script = { title: "Page", steps: [{ heading: "Page", say: "Hello." }] };
  const seen = [];
  const rec = startRecord({ script: () => script, root, button: false, onChange: (s) => seen.push(s) });
  assert.equal(added.length, 2, "only the ring and caption");
  assert.deepEqual(seen, [{ available: true, busy: false, recording: false }]);
  rec.refresh();
  assert.equal(seen.length, 1, "nothing is said again while nothing changed");
  script = null;
  rec.refresh();
  assert.deepEqual(seen.at(-1), { available: false, busy: false, recording: false }, "a page without a script has nothing to record");
  assert.equal(rec.available(), false);
});

test("the intro leads every script and the length is counted in words", () => {
  const intro = [{ target: ".brand", say: "One two three." }];
  const s = withIntro({ title: "Page", steps: [{ heading: "Page", say: "Four five." }] }, intro);
  assert.deepEqual(s.steps.map((x) => x.say), ["One two three.", "Four five."]);
  assert.equal(scriptWords(s), 5);
  assert.equal(withIntro(null, intro), null, "a page without a script shows no button");
});

test("a line without a voice lasts as long as reading it would", () => {
  assert.equal(readMs("one"), 1800, "never shorter than 1.8 seconds");
  assert.equal(readMs(Array(26).fill("word").join(" ")), 10000);
});

test("the recording type prefers MP4 and falls back to whatever the browser supports", () => {
  assert.equal(pickType((t) => t.startsWith("video/webm")), "video/webm;codecs=vp9,opus");
  assert.equal(pickType(() => true), RECORD_TYPES[0]);
  assert.equal(pickType(() => false), "");
  assert.equal(pickType(() => { throw new Error("no"); }), "");
});

test("a pressed toggle is pressed back, found by its new state", () => {
  assert.equal(restoreOf({ press: '[data-do="costs"][aria-pressed="false"]' }), '[data-do="costs"][aria-pressed="true"]');
  assert.equal(restoreOf({ press: "#tab-b", restore: "#tab-a" }), "#tab-a");
  assert.equal(restoreOf({ press: "#toggle" }), "#toggle", "a plain control is pressed again");
});

test("the file is named for the script and the local time, safe on every system", () => {
  const at = new Date(2026, 10, 4, 9, 5);
  assert.equal(recordingName("Team: Q4/plan", "video/mp4;codecs=avc1", at), "Team Q4 plan 2026-11-04 09.05.mp4");
  assert.equal(recordingName("", "video/webm", at), "Recording 2026-11-04 09.05.webm");
});

test("the button, and the app's own marked button, hide while recording so neither is in the video, and the look is the page's own", () => {
  const css = readFileSync(new URL("../themes/record.css", import.meta.url), "utf8");
  assert.match(css, /\[data-playskin-recording\] \.playskin-record \{ display: none; \}/);
  assert.match(css, /\[data-playskin-recording\] \[data-record-hide\] \{ visibility: hidden; \}/);
  assert.doesNotMatch(css, /\[data-playskin="record"\]/, "Record changes no colours");
  const js = readFileSync(new URL("../src/record.js", import.meta.url), "utf8");
  assert.match(js, /src\.connect\(run\.out\);\s*src\.connect\(run\.ctx\.destination\);/, "the voice is in the file and heard aloud");
  assert.match(js, /const current = \(\) => safe\(\(\) => withIntro\(script\(\), intro\)\);/, "a page that is not ready yet shows no button instead of breaking");
});

test("the voice track runs through every pause, so the voice stays in time with the picture", () => {
  const js = readFileSync(new URL("../src/record.js", import.meta.url), "utf8");
  assert.match(js, /const hold = ctx\.createConstantSource\(\);\s*hold\.offset\.value = 0;\s*hold\.connect\(run\.out\);\s*hold\.start\(\);/);
  assert.ok(js.indexOf("hold.start()") < js.indexOf("new MediaRecorder("), "the track is held before recording starts");
});

test("Record films one fixed frame size, so a tab that changes size never breaks the MP4", async () => {
  const { fitInto } = await import("../src/record.js");
  assert.deepEqual(fitInto({ width: 1400, height: 840 }, { width: 1400, height: 788 }), { x: 44, y: 0, width: 1313, height: 788 }, "a taller tab is scaled to fit, centred");
  assert.deepEqual(fitInto({ width: 1400, height: 788 }, { width: 1400, height: 788 }), { x: 0, y: 0, width: 1400, height: 788 });
  const src = readFileSync(new URL("../src/record.js", import.meta.url), "utf8");
  assert.match(src, /const steady = await steadyTrack\(stream\);/);
  assert.match(src, /new MediaRecorder\(new MediaStream\(\[steady\.track, /, "the recorder films the steady canvas, not the tab itself");
  assert.equal(src.match(/steady\.stop\(\);/g)?.length, 2, "the canvas stops when recording ends or cannot start");
});
