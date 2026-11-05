import { SNAIL_SVG } from "./crayon-art.js";

/* Crayon doodles behind the page: bunting, drifting clouds, corner drawings and a snail that crawls the page and back. crayon.css shows them
   only while <html data-orbit="crayon"> is set; everything here sits behind the content and never takes a click. */
const MARKUP = `<div class="crayon-doodles" aria-hidden="true">
  <svg class="cd-defs" width="0" height="0" focusable="false">
    <filter id="cd-rough" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" />
    </filter>
  </svg>

  <div class="cd-bunting">
    ${'<i></i>'.repeat(36)}
  </div>

  <svg class="cd-cloud cd-cloud-1" viewBox="0 0 120 56" focusable="false">
    <path d="M24 46c-11 0-17-7-15-15 2-7 9-10 15-8 2-10 11-16 21-14 7 1 12 6 14 12 4-6 13-8 20-4 6 3 8 9 7 14 9-1 16 5 15 12-1 2-2 3-4 3z" />
  </svg>
  <svg class="cd-cloud cd-cloud-2" viewBox="0 0 120 56" focusable="false">
    <path d="M20 44c-9 0-14-6-12-13 2-6 8-8 13-6 3-9 12-13 20-11 6 2 10 6 11 11 5-5 13-5 18-1 4 3 6 8 5 12 8 0 13 4 13 9z" />
  </svg>
  <svg class="cd-cloud cd-cloud-3" viewBox="0 0 120 56" focusable="false">
    <path d="M30 45c-10 0-15-6-13-12 2-6 8-9 14-7 3-8 11-12 19-10 6 2 9 6 10 10 6-4 13-3 17 1 5 4 5 10 3 13 7 1 11 4 10 5z" />
  </svg>

  <svg class="cd-doodle cd-rainbow" viewBox="0 0 140 80" focusable="false">
    <path class="c-red" d="M10 74a60 60 0 0 1 120 0" />
    <path class="c-orange" d="M19 74a51 51 0 0 1 102 0" />
    <path class="c-yellow" d="M28 74a42 42 0 0 1 84 0" />
    <path class="c-green" d="M37 74a33 33 0 0 1 66 0" />
    <path class="c-blue" d="M46 74a24 24 0 0 1 48 0" />
    <path class="c-purple" d="M55 74a15 15 0 0 1 30 0" />
  </svg>

  <svg class="cd-doodle cd-spiral" viewBox="0 0 60 60" focusable="false">
    <path class="c-purple" d="M31 30c0-2 3-2 3 0 0 4-6 5-7 0-1-6 7-9 11-5 6 5 2 15-6 15-10 0-14-11-9-18 6-9 21-7 24 3 4 12-6 22-17 21" />
  </svg>

  <svg class="cd-doodle cd-heart" viewBox="0 0 60 54" focusable="false">
    <path class="c-red" d="M30 48C14 37 6 28 7 18c1-8 9-12 15-9 4 2 6 5 8 8 2-3 4-6 8-8 6-3 14 1 15 9 1 10-7 19-23 30z" />
  </svg>

  <svg class="cd-doodle cd-star" viewBox="0 0 64 62" focusable="false">
    <path class="c-yellow" d="M32 4l8 18 19 2-14 13 4 19-17-10-17 10 4-19L5 24l19-2z" />
  </svg>

  <svg class="cd-doodle cd-hopscotch" viewBox="0 0 96 150" focusable="false">
    <g class="c-blue">
      <path d="M33 118h30v28H33zM33 90h30v28H33zM18 62h30v28H18zM48 62h30v28H48zM33 34h30v28H33z" />
      <path d="M33 34c0-18 30-18 30 0" />
    </g>
    <g class="cd-hop-num">
      <text x="48" y="138">1</text>
      <text x="48" y="110">2</text>
      <text x="33" y="82">3</text>
      <text x="63" y="82">4</text>
      <text x="48" y="54">5</text>
      <text x="48" y="28">6</text>
    </g>
  </svg>

  <i class="cr-snail">${SNAIL_SVG}</i>
</div>`;

/** Adds the doodles to the page once and returns a function that takes them away. */
export function mountCrayonDoodles(target = document.body) {
  const existing = target.querySelector(":scope > .crayon-doodles");
  if (existing) return () => existing.remove();
  const holder = document.createElement("div");
  holder.innerHTML = MARKUP;
  const doodles = holder.firstElementChild;
  target.append(doodles);
  return () => doodles.remove();
}
