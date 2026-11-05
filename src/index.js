/* playskin: playful skins for a web page. A skin is turned on by one attribute on <html>, data-playskin="aura",
   "crayon", "whiskers" or "record", and its stylesheet does the rest. createPlayskin() keeps that attribute in step
   with the visitor's saved choice and, unless told not to, brings out what a skin draws beyond CSS: Crayon's doodles,
   the Whiskers cat and Record's narrated tour. */
import { mountCrayonDoodles } from "./crayon-doodles.js";
import { startCrayon } from "./crayon.js";
import { startMotion } from "./motion.js";

export const THEMES = ["aura", "crayon", "whiskers", "record"];
export const THEME_NAMES = { aura: "Aura", crayon: "Crayon", whiskers: "Whiskers", record: "Record" };
export const CHANGE_EVENT = "playskin-change";
export { mountCrayonDoodles, startCrayon, startMotion };

const DEFAULTS = { themes: THEMES, storageKey: "playskin", attribute: "data-playskin", effects: true, crayon: {}, whiskers: {}, record: null, motion: {} };

function readStored(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {}
}

/**
 * Keeps <html data-playskin> in step with the chosen skin.
 * Options: themes (allowed names), storageKey (where the choice is saved, or null to not save), attribute,
 * root (the element that carries the attribute), effects (false to skip Crayon's drawings, the cat and the tour), crayon
 * (options for startCrayon), whiskers
 * (options for startWhiskers), record (options for startRecord; Record shows nothing without a script), motion
 * (options for startMotion, or false to leave data-motion blocks still).
 */
export function createPlayskin(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const root = o.root || document.documentElement;
  const listeners = new Set();
  let current = null;
  let crayon = null;
  let catStarted = false;
  let recordStarted = false;
  const motion = o.motion === false ? null : startMotion({ root, ...o.motion });

  const valid = (theme) => (o.themes.includes(theme) ? theme : null);

  function effects(theme) {
    if (!o.effects) return;
    if (theme === "crayon" && !crayon) crayon = startCrayon(o.crayon);
    if (theme !== "crayon" && crayon) {
      crayon.stop();
      crayon = null;
    }
    if (theme === "whiskers" && !catStarted) {
      catStarted = true;
      import("./whiskers/index.js")
        .then((m) => m.startWhiskers({ root, attribute: o.attribute, ...o.whiskers }))
        .catch(() => {
          catStarted = false;
        });
    }
    if (theme === "record" && o.record && !recordStarted) {
      recordStarted = true;
      import("./record.js")
        .then((m) => m.startRecord({ root, attribute: o.attribute, ...o.record }))
        .catch(() => {
          recordStarted = false;
        });
    }
  }

  function apply(theme) {
    current = valid(theme);
    if (current) root.setAttribute(o.attribute, current);
    else root.removeAttribute(o.attribute);
    effects(current);
    for (const fn of listeners) fn(current);
    root.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: current, bubbles: true }));
    return current;
  }

  const onStorage = (event) => {
    if (o.storageKey && event.key === o.storageKey) apply(event.newValue);
  };
  window.addEventListener("storage", onStorage);
  apply(o.storageKey ? readStored(o.storageKey) : null);

  return {
    /** The skin that is on, or null for the page's own look. */
    get: () => current,
    /** Turns a skin on (or off with null) and saves the choice. */
    set(theme) {
      const next = valid(theme);
      if (o.storageKey) writeStored(o.storageKey, next);
      return apply(next);
    },
    /** Calls fn with the skin each time it changes; returns a function that stops listening. */
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    /** The page's build-in motion (see startMotion), or null when turned off. */
    motion,
    destroy() {
      window.removeEventListener("storage", onStorage);
      motion?.stop();
      listeners.clear();
      crayon?.stop();
      crayon = null;
    },
  };
}

let shared = null;
const instance = () => (shared ||= createPlayskin());

/** Turns a skin on for the page with the default options. */
export const setTheme = (theme) => instance().set(theme);
/** The skin that is on with the default options. */
export const getTheme = () => instance().get();

/**
 * A tiny script for <head> that sets the attribute before the page paints, so a saved skin never flashes the
 * page's own look first. Put its text in an inline <script>.
 */
export function bootScript({ storageKey = DEFAULTS.storageKey, attribute = DEFAULTS.attribute, themes = THEMES } = {}) {
  return `(function(){try{var s=localStorage.getItem(${JSON.stringify(storageKey)});if(${JSON.stringify(themes)}.indexOf(s)>-1)document.documentElement.setAttribute(${JSON.stringify(attribute)},s);}catch(e){}})();`;
}
