import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readMs, pickType, restoreOf, withIntro, scriptWords, recordingName, RECORD_TYPES } from "../src/record.js";
import { THEMES, THEME_NAMES } from "../src/index.js";

test("Record is a skin like the others", () => {
  assert.ok(THEMES.includes("record"));
  assert.equal(THEME_NAMES.record, "Record");
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

test("the button hides while recording so it is never in the video, and the look is the page's own", () => {
  const css = readFileSync(new URL("../themes/record.css", import.meta.url), "utf8");
  assert.match(css, /\[data-playskin-recording\] \.playskin-record \{ display: none; \}/);
  assert.doesNotMatch(css, /\[data-playskin="record"\]/, "Record changes no colours");
  const js = readFileSync(new URL("../src/record.js", import.meta.url), "utf8");
  assert.match(js, /src\.connect\(run\.out\);\s*src\.connect\(run\.ctx\.destination\);/, "the voice is in the file and heard aloud");
});
