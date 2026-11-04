/* playskin: playful skins for a web page. A skin is turned on by one attribute on <html>, data-playskin="aura",
   "crayon" or "whiskers", and its stylesheet does the rest. createPlayskin() keeps that attribute in step with the
   visitor's saved choice and, unless told not to, brings out what a skin draws beyond CSS: Crayon's doodles and the
   Whiskers cat. */
import { mountCrayonDoodles } from "./crayon-doodles.js";

export const THEMES = ["aura", "crayon", "whiskers"];
export const THEME_NAMES = { aura: "Aura", crayon: "Crayon", whiskers: "Whiskers" };
export const CHANGE_EVENT = "playskin-change";
export { mountCrayonDoodles };

const DEFAULTS = { themes: THEMES, storageKey: "playskin", attribute: "data-playskin", effects: true, whiskers: {} };

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
 * root (the element that carries the attribute), effects (false to skip doodles and the cat), whiskers (options for
 * startWhiskers).
 */
export function createPlayskin(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const root = o.root || document.documentElement;
  const listeners = new Set();
  let current = null;
  let unmountDoodles = null;
  let catStarted = false;

  const valid = (theme) => (o.themes.includes(theme) ? theme : null);

  function effects(theme) {
    if (!o.effects) return;
    if (theme === "crayon" && !unmountDoodles) unmountDoodles = mountCrayonDoodles();
    if (theme !== "crayon" && unmountDoodles) {
      unmountDoodles();
      unmountDoodles = null;
    }
    if (theme === "whiskers" && !catStarted) {
      catStarted = true;
      import("./whiskers/index.js")
        .then((m) => m.startWhiskers({ root, attribute: o.attribute, ...o.whiskers }))
        .catch(() => {
          catStarted = false;
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
    destroy() {
      window.removeEventListener("storage", onStorage);
      listeners.clear();
      if (unmountDoodles) unmountDoodles();
      unmountDoodles = null;
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
