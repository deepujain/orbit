/* Crayon's moving parts. startCrayon() brings out everything Crayon draws beyond CSS: the doodles behind the page, a
   paper plane that loops off the brand, a sun or moon in the light and dark button, bunting under the top bar and a
   crayon for every letter of the wordmark. The app only marks its parts: data-brand, data-wordmark, data-topbar,
   data-nav and data-theme-toggle. The drawings are exported too, for apps that place their own. */
import { mountCrayonDoodles } from "./crayon-doodles.js";
import { BUNTING, CRAYON_TOGGLE, PLANE_MS, PLANE_SVG, planeFrames } from "./crayon-art.js";

export { mountCrayonDoodles };
export * from "./crayon-art.js";

/**
 * Sends the paper plane off the anchor every so often while active() says so, never under reduced motion or while the
 * tab is hidden. The plane lives on <body>, so the app may re-render freely. Returns fly(force) for a flight now,
 * flights() for how many are in the air and stop() to land it for good.
 */
export function startCrayonPlane({
  doc = document,
  win = window,
  anchor = () => doc.querySelector("[data-brand]") || doc.querySelector("[data-wordmark]"),
  active = () => doc.documentElement.getAttribute("data-playskin") === "crayon",
  reducedMotion = () => win.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  every = [14000, 26000],
  first = [4000, 7000],
} = {}) {
  const flights = new Set();
  const plane = doc.createElement("i");
  plane.className = "cr-flyer";
  plane.setAttribute("aria-hidden", "true");
  plane.innerHTML = PLANE_SVG;
  doc.body.append(plane);
  const between = ([a, b]) => a + Math.random() * (b - a);
  let timer = 0;
  function fly(force = false) {
    if (flights.size || !active() || (!force && (doc.hidden || reducedMotion()))) return null;
    const r = anchor()?.getBoundingClientRect();
    if (!r?.width) return null;
    const anim = plane.animate(planeFrames({ cx: r.right, cy: r.top + r.height / 2 }, win.innerWidth), { duration: PLANE_MS, fill: "both", easing: "linear" });
    flights.add(anim);
    plane.classList.add("is-flying");
    const done = () => {
      flights.delete(anim);
      anim.cancel();
      plane.classList.remove("is-flying");
    };
    anim.finished.then(done, done);
    return anim;
  }
  const loop = (wait) => {
    timer = win.setTimeout(() => {
      fly();
      loop(between(every));
    }, wait);
  };
  loop(between(first));
  const onVisible = () => {
    for (const a of flights) doc.hidden ? a.pause() : a.play();
  };
  doc.addEventListener("visibilitychange", onVisible);
  return {
    fly: (force = true) => Boolean(fly(force)),
    flights: () => flights.size,
    stop() {
      win.clearTimeout(timer);
      doc.removeEventListener("visibilitychange", onVisible);
      for (const a of flights) a.cancel();
      plane.remove();
    },
  };
}

/**
 * Brings out all of Crayon on the page and returns { fly, flights, stop }; stop() takes every part away again and
 * gives the wordmark back its text. Parts the app re-renders are dressed again on the next frame.
 */
export function startCrayon({ doc = document, win = window, reducedMotion, anchor, doodles = true, plane = true } = {}) {
  const unmount = doodles ? mountCrayonDoodles(doc.body) : () => {};
  const flyer = plane ? startCrayonPlane({ doc, win, reducedMotion, active: () => true, ...(anchor ? { anchor } : {}) }) : null;
  const added = new Set();
  const words = new Map();
  const add = (host, html) => {
    const t = doc.createElement("template");
    t.innerHTML = html;
    const el = t.content.firstElementChild;
    host.append(el);
    added.add(el);
  };
  // Each letter becomes its own crayon; a hidden copy of the word keeps it read as one word.
  const letters = (el) => {
    const text = el.textContent;
    words.set(el, text);
    el.textContent = "";
    for (const c of text) {
      const b = doc.createElement("span");
      b.setAttribute("aria-hidden", "true");
      b.textContent = c === " " ? "\u00a0" : c;
      el.append(b);
    }
    const said = doc.createElement("span");
    said.className = "playskin-said";
    said.textContent = text;
    el.append(said);
  };
  function dress() {
    for (const el of doc.querySelectorAll("[data-theme-toggle]")) if (!el.querySelector(":scope > .cr-toggle")) add(el, CRAYON_TOGGLE);
    for (const el of doc.querySelectorAll("[data-topbar]")) if (!el.querySelector(":scope > .cr-bunting")) add(el, BUNTING);
    for (const el of doc.querySelectorAll("[data-wordmark]")) if (!el.children.length && el.textContent.trim()) letters(el);
  }
  let queued = false;
  const watch = new win.MutationObserver(() => {
    if (queued) return;
    queued = true;
    win.requestAnimationFrame(() => {
      queued = false;
      dress();
    });
  });
  dress();
  watch.observe(doc.body, { childList: true, subtree: true, characterData: true });
  return {
    fly: (force = true) => Boolean(flyer?.fly(force)),
    flights: () => flyer?.flights() ?? 0,
    stop() {
      watch.disconnect();
      for (const el of added) el.remove();
      added.clear();
      for (const [el, text] of words) if (el.isConnected) el.textContent = text;
      words.clear();
      flyer?.stop();
      unmount();
    },
  };
}
