/* Whiskers: brings the cat out onto the page. It shows while the page's skin is "whiskers" and leaves when the skin
   changes. Pages tell it what to stand on and what to leave alone with a few attributes:
   data-playskin-floor  the element whose top edge is its floor, such as a bottom tab bar
   data-playskin-ignore anything it should never walk on
   data-card            a card it can hop onto (any boxed element works too) */
import { startTimelineCat } from "./cat.js";

export { MEOWS } from "./cat-voice.js";
export { JOKES, REVIEW_JOKES, STATION_LINES, catLine } from "./cat.js";

/**
 * Options: root and attribute (where the skin is read from), show (a function saying whether the cat should be out;
 * defaults to the skin being "whiskers"), global (the window property for its controls), storage (prefix for its saved
 * name and hunger), floor and ignore (selectors), meow (URL of the meow recording), music ({ on } while page music
 * plays), reducedMotion (a function; defaults to the visitor's setting).
 * A host app can also give it its own pages and a game: scenes, room, game, boss, pet, label, jokes, aloud, slide and
 * follow, as described on startTimelineCat in cat.js.
 */
export function startWhiskers({
  root = document.documentElement,
  attribute = "data-playskin",
  show,
  reducedMotion,
  ...rest
} = {}) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  return startTimelineCat({
    reducedMotion: reducedMotion || (() => motion.matches),
    waiting: show || (() => root.getAttribute(attribute) === "whiskers"),
    ...rest,
  });
}
