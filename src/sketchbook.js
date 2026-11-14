/* Sketchbook's pieces for a page that builds its own posters: the Google Fonts address for its three faces, the three
   drawings that ship with it, and poster(), which writes the markup themes/sketchbook.css styles. */

/** The three faces the skin uses: brush script for big titles, Kalam handwriting for small titles and captions, and
    the big block letters. Body text keeps the page's own face. */
export const SKETCHBOOK_FONTS = "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Caveat+Brush&family=Kalam:wght@400;700&display=swap";

/** Four friends walking and laughing, a girl on a bike with a flower basket beside a friend on a skateboard, and two
    friends sharing chai on a brick wall, each drawn on a transparent ground. */
export const SKETCHBOOK_ART = {
  walk: new URL("../art/sketchbook/walk.webp", import.meta.url).href,
  ride: new URL("../art/sketchbook/ride.webp", import.meta.url).href,
  talk: new URL("../art/sketchbook/talk.webp", import.meta.url).href,
};

const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/**
 * Markup for a poster: huge yellow letters behind a drawing, a title and handwritten caption lines.
 * Options: letters, art (image URL), alt, title, titleStyle ("script" brush or "marker" caps), lines (array of
 * strings), side ("right" puts the words on the left, "left" on the right), ticks (false to leave out the motion ticks).
 */
export function poster({ letters = "", art, alt = "", title = "", titleStyle = "script", lines = [], side = "right", ticks = true } = {}) {
  const head = titleStyle === "marker" ? `<p class="sb-marker">${escape(title)}</p>` : `<p class="sb-script"><span class="sb-swash">${escape(title)}</span></p>`;
  const list = lines.length ? `<ul class="sb-lines">${lines.map((l) => `<li>${escape(l)}</li>`).join("")}</ul>` : "";
  const n = [...String(letters)].length;
  return `<figure class="sb-poster" data-side="${side === "left" ? "left" : "right"}">`
    + `<figcaption class="sb-words">${title ? head : ""}${list}</figcaption>`
    + `<div class="sb-stage">`
    + (letters ? `<span class="sb-letters" style="--sb-n:${n}" aria-hidden="true">${escape(letters)}</span>` : "")
    + (art ? `<img class="sb-art" src="${escape(art)}" alt="${escape(alt)}" loading="lazy">` : "")
    + `</div>`
    + (ticks ? `<span class="sb-ticks" aria-hidden="true"></span>` : "")
    + `</figure>`;
}
