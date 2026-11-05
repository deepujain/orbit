/* Motion: cards and charts that build in as they come into view, the way modern dashboards do on their
   charts. An app marks a block with data-motion and each moving part inside it with data-m="<effect>"
   (rise, fade, slide-left, slide-right, grow-x, grow-y, pop, zoom, flip, blur, draw, reveal, plus sheen, and the
   always-on pulse, float and shimmer); a number with data-count counts up. motion.css draws the effects.

   startMotion() holds each block at its first frame until enough of it is on screen, then plays it; parts next to
   each other start one after another. A block that leaves the screen is reset, so it plays again when it comes back,
   and every block on screen replays when a Record recording starts. Blocks the app re-renders are found again on the
   next frame. Under reduced motion everything shows at once, still. */

const BLOCK = "[data-motion]";
const PART = "[data-m]";
const COUNT_MS = 1400;
const expo = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/** A number's text split for counting: what comes before and after it, its value, decimals and digit grouping. */
export function parseCount(text) {
  const m = /^(\D*?)(-?[\d,]*\.?\d+)(.*)$/s.exec(String(text).trim());
  if (!m) return null;
  const [, pre, num, suf] = m;
  const dp = num.includes(".") ? num.split(".")[1].length : 0;
  return { pre, suf, to: Number(num.replace(/,/g, "")), dp, group: num.includes(",") };
}
/** The text for a count part way to its value. */
export function formatCount({ pre, suf, dp, group }, value) {
  const fixed = value.toFixed(dp);
  if (!group) return `${pre}${fixed}${suf}`;
  const [int, frac] = fixed.split(".");
  return `${pre}${Number(int).toLocaleString("en-US")}${frac ? `.${frac}` : ""}${suf}`;
}
/** Parts beside each other in a block get their place in line, so they start one after another. */
export function staggerParts(block) {
  const seen = new Map();
  for (const el of block.querySelectorAll(PART)) {
    if (el.style.getPropertyValue("--i")) continue;
    const n = seen.get(el.parentElement) || 0;
    seen.set(el.parentElement, n + 1);
    el.style.setProperty("--i", String(n));
  }
}

export function startMotion({
  doc = document,
  win = window,
  root = doc.documentElement,
  threshold = 0.15,
  replay = true,
  reducedMotion = () => win.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
} = {}) {
  const state = (b) => b.getAttribute("data-motion-state");
  const set = (b, s) => b.setAttribute("data-motion-state", s);
  const anims = (b) => (b.getAnimations ? b.getAnimations({ subtree: true }) : []);
  const counts = new Map();

  function count(block) {
    for (const el of block.querySelectorAll("[data-count]")) {
      const c = parseCount(el.getAttribute("data-count") || el.textContent);
      if (!c) continue;
      const host = win.getComputedStyle(el.closest(PART) || el);
      const ms = (name) => parseFloat(host.getPropertyValue(name)) || 0;
      const delay = ms("--m-delay") + Math.min(ms("--i"), host.getPropertyValue("--m-cap") ? ms("--m-cap") : 12) * ms("--m-step");
      const at = performance.now() + delay;
      counts.set(el, { c, at });
      el.textContent = formatCount(c, 0);
    }
    tick();
  }
  let frame = 0;
  function tick() {
    if (frame) return;
    frame = win.requestAnimationFrame(() => {
      frame = 0;
      const now = performance.now();
      for (const [el, { c, at }] of counts) {
        const k = Math.max(0, (now - at) / COUNT_MS);
        el.textContent = formatCount(c, c.to * expo(k));
        if (k >= 1 || !el.isConnected) counts.delete(el);
      }
      if (counts.size) tick();
    });
  }
  const settle = (block) => {
    for (const el of block.querySelectorAll("[data-count]")) {
      counts.delete(el);
      const c = parseCount(el.getAttribute("data-count") || el.textContent);
      if (c) el.textContent = formatCount(c, c.to);
    }
  };

  function play(block) {
    set(block, "play");
    if (reducedMotion()) return settle(block);
    for (const a of anims(block)) a.play();
    count(block);
  }
  // Back to the first frame, held, so the block builds in again when it is next seen.
  function rewind(block) {
    set(block, "wait");
    for (const a of anims(block)) {
      a.currentTime = 0;
      a.pause();
    }
    settle(block);
  }

  const seen = new win.IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting && e.intersectionRatio >= threshold && state(e.target) === "wait") play(e.target);
        else if (!e.isIntersecting && replay && state(e.target) === "play") rewind(e.target);
      }
    },
    { threshold: [0, threshold] },
  );
  const onScreen = (b) => {
    const r = b.getBoundingClientRect();
    const h = win.innerHeight;
    return r.height > 0 && r.bottom > 0 && r.top < h && (Math.min(r.bottom, h) - Math.max(r.top, 0)) / Math.min(r.height, h) >= threshold;
  };

  function tag() {
    for (const block of doc.querySelectorAll(BLOCK)) {
      if (state(block)) continue;
      staggerParts(block);
      for (const el of block.querySelectorAll("[data-count]")) if (!el.getAttribute("data-count")) el.setAttribute("data-count", el.textContent.trim());
      seen.observe(block);
      if (reducedMotion()) {
        set(block, "play");
        settle(block);
      } else if (onScreen(block)) play(block);
      else rewind(block);
    }
  }
  let queued = false;
  const watch = new win.MutationObserver(() => {
    if (queued) return;
    queued = true;
    win.requestAnimationFrame(() => {
      queued = false;
      tag();
    });
  });
  watch.observe(doc.body, { childList: true, subtree: true });
  // A recording films the page from the top, so whatever is on screen builds in again for it.
  const film = new win.MutationObserver(() => {
    if (!root.hasAttribute("data-orbit-recording")) return;
    for (const b of doc.querySelectorAll(BLOCK)) if (onScreen(b)) {
      rewind(b);
      play(b);
    }
  });
  film.observe(root, { attributes: true, attributeFilter: ["data-orbit-recording"] });
  tag();

  return {
    /** Plays a block (or every block on screen) again from the start. */
    replay(block) {
      for (const b of block ? [block] : [...doc.querySelectorAll(BLOCK)].filter(onScreen)) {
        rewind(b);
        play(b);
      }
    },
    stop() {
      watch.disconnect();
      film.disconnect();
      seen.disconnect();
      if (frame) win.cancelAnimationFrame(frame);
      for (const b of doc.querySelectorAll(BLOCK)) {
        settle(b);
        b.removeAttribute("data-motion-state");
      }
    },
  };
}
