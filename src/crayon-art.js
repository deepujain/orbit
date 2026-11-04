/* Crayon's drawings: a paper plane, a ladybug, a snail, a sun and moon for the light and dark button, a crayon icon, and
   the keyframes of the plane's loop-the-loop. themes/crayon.css colours them in light and dark. */
const INK = "#2b2118";
/** A folded paper plane facing right; mirror it to fly left. */
export const PLANE_SVG = `<svg viewBox="0 0 48 30" aria-hidden="true" focusable="false"><path class="pl-under" d="M17 17.5 46 3 21.5 27.5z"/><path class="pl-wing" d="M2 13.5 46 3 17 17.5z"/><path class="pl-fold" d="M17 17.5 46 3M17 17.5l2.5 6.5 2-3.5"/></svg>`;
/** A ladybug facing up; rotate it to face along its path. */
export const LADYBUG_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g class="lb-legs"><path d="M6.5 10 2.5 8M6 14H1.8M7.5 18l-3 3M17.5 10l4-2M18 14h4.2M16.5 18l3 3"/></g><circle class="lb-head" cx="12" cy="5.4" r="3.6"/><ellipse class="lb-shell" cx="12" cy="13.6" rx="7.4" ry="7.8"/><path class="lb-seam" d="M12 6.4v15"/><g class="lb-spots"><circle cx="8.6" cy="11.4" r="1.5"/><circle cx="15.4" cy="11.4" r="1.5"/><circle cx="9" cy="16.6" r="1.2"/><circle cx="15" cy="16.6" r="1.2"/></g><circle class="lb-eye" cx="10.5" cy="4.4" r=".8"/><circle class="lb-eye" cx="13.5" cy="4.4" r=".8"/></svg>`;
/** A snail facing right. Inside an element with the cr-snail class it crawls the width of the page and back. */
export const SNAIL_SVG = `<svg viewBox="0 0 54 34" aria-hidden="true" focusable="false"><path class="sn-body" d="M4 30.5c6-.4 10-1.4 14-1.4h26c3.4 0 6-2.2 6.6-5.6l.8-5.8c.2-1.8-1.4-2.8-2.8-1.8l-3 2.4c-1 .8-1.6 2.4-1.6 4.2H16c-5 0-9.6 3.2-12 8z"/><path class="sn-horn" d="M47.4 17.5 45 7.5M50.4 17.6 52 8"/><circle class="sn-tip" cx="45" cy="7" r="1.8"/><circle class="sn-tip" cx="52" cy="7.5" r="1.8"/><circle class="sn-shell" cx="27" cy="17" r="12"/><path class="sn-swirl" d="M27 17.5c0-1.6 2.4-1.6 2.4.4 0 2.6-4.2 3.2-5.4.2-1.4-3.4 2.2-6.6 6-5.2 4.4 1.6 4.6 8-.2 10.2-5 2.4-10.6-1.2-10.2-6.6"/></svg>`;
const SUN = `<svg class="cr-sun" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><g class="cr-rays">${Array.from({ length: 10 }, (_, i) => `<path d="M32 4.5v8" transform="rotate(${i * 36} 32 32)"/>`).join("")}</g><circle class="cr-sun-face" cx="32" cy="32" r="14"/><circle class="cr-eye" cx="27" cy="29.5" r="1.6"/><circle class="cr-eye" cx="37" cy="29.5" r="1.6"/><path class="cr-smile" d="M26 35c3.4 4 8.6 4 12 0"/><circle class="cr-cheek" cx="23.5" cy="35" r="2.2"/><circle class="cr-cheek" cx="40.5" cy="35" r="2.2"/></svg>`;
const MOON = `<svg class="cr-moon" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path class="cr-moon-face" d="M40 10.5a22 22 0 1 0 14 34 18 18 0 0 1-14-34z"/><circle class="cr-eye" cx="30" cy="31" r="1.5"/><path class="cr-smile" d="M27 38c2.6 2.4 6 2.4 8.4 0"/><g class="cr-stars"><path d="M52 12l1.4 3 3.2.4-2.4 2.2.6 3.2-2.8-1.6-2.8 1.6.6-3.2-2.4-2.2 3.2-.4z"/><path d="M58 30l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/></g></svg>`;
/** The light and dark button's face: a smiling sun in light, a moon with stars in dark. */
export const CRAYON_TOGGLE = `<span class="cr-toggle" aria-hidden="true">${SUN}${MOON}</span>`;
/** A red crayon, tip up and to the right, for a style menu. */
export const CRAYON_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(-40 12 12)"><rect x="3" y="9" width="14" height="6" rx="1.2" fill="#e63946" stroke="${INK}" stroke-width="1.2"/><path d="M17 9l4.6 3-4.6 3z" fill="#f4d6b0" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/><path d="M20 11v2l1.6-1z" fill="#e63946"/><path d="M6.4 9v6M13.6 9v6" stroke="${INK}" stroke-width="1"/><path d="M8.4 10.6c1 .6 2.2.6 3.2 0" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round"/></g></svg>`;
export const PLANE_MS = 5200;

const tf = (x, y, r = 0, s = 1) => `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${r.toFixed(1)}deg) scale(${s.toFixed(3)})`;
/** Keyframes for one flight from a point: climbing, one loop-the-loop, then a long glide off the right edge. */
export function planeFrames({ cx, cy }, width = 1280) {
  const f = [{ offset: 0, opacity: 0, transform: tf(cx, cy, -10, 0.4) }, { offset: 0.06, opacity: 1, transform: tf(cx + 18, cy - 6, -14, 0.8) }];
  const lx = cx + 130, ly = cy + 40, r = 26, n = 20;
  f.push({ offset: 0.22, transform: tf(lx, ly, 0, 1) });
  // Up the front of the loop, over the top upside down, and back down to where it started.
  for (let i = 1; i <= n; i++) {
    const a = Math.PI * 2 * (i / n);
    f.push({ offset: 0.22 + 0.36 * (i / n), transform: tf(lx + r * Math.sin(a), ly - r + r * Math.cos(a), -360 * (i / n), 1) });
  }
  f.push({ offset: 0.8, opacity: 1, transform: tf(lx + (width - lx) * 0.5, ly + 14, 6, 0.95) });
  f.push({ offset: 1, opacity: 0, transform: tf(width + 60, ly + 30, 10, 0.8) });
  return f;
}

const FLAGS = ["#e63946", "#f4a261", "#ffd60a", "#52b788", "#4895ef", "#9d4edd"];
// One 600px swag of string with twelve flags; the row repeats it across the page so the flags never stretch.
const sag = (x) => 3 + 5.5 * Math.sin((Math.PI * (x % 300)) / 300);
const SWAG = `<svg viewBox="0 0 600 34" aria-hidden="true" focusable="false"><path class="cr-string" d="M0 3Q150 14 300 3T600 3"/>${Array.from({ length: 12 }, (_, i) => {
  const x = i * 50 + 6;
  return `<path class="cr-flag" style="--i:${i % 4}" d="M${x} ${sag(x).toFixed(1)}L${x + 38} ${sag(x + 38).toFixed(1)}L${x + 19} ${(sag(x + 19) + 22 + (i % 3) * 2).toFixed(1)}z" fill="${FLAGS[i % FLAGS.length]}"/>`;
}).join("")}</svg>`;
/** Flags on a sagging string, enough to cross a wide screen. */
export const BUNTING = `<div class="cr-bunting" aria-hidden="true">${SWAG.repeat(5)}</div>`;
