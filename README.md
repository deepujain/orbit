# playskin

Playful skins for any web page. Turn one on with a single attribute, and your page becomes soft glass, crayon paper, or the home of a cat.

| Skin | What it does |
|---|---|
| **Aura** | Soft white glass by day, graphite by night. Cards catch a soft glow in their corners, buttons become pills, page titles get a violet-to-pink wash. |
| **Crayon** | Cream ruled paper by day, a green chalkboard in a wooden frame by night. Hand-drawn borders, handwriting headings, and doodles behind the page: bunting, drifting clouds, a rainbow and a slow snail. |
| **Whiskers** | A cat that lives in the whole window. It hops between your cards under real physics, rolls round buttons like wheels, chases a ball of yarn, naps, gets hungry and asks to be fed. Tap it for a trick; double-tap for its trick panel. |

All three follow light and dark mode (a `dark` class on `<html>`), respect `prefers-reduced-motion`, and step aside in forced-colors mode.

## Screenshots

The same demo page in each skin, light on the left and dark on the right.

### Aura

<p>
  <img src="docs/aura-light.png" alt="Aura skin in light mode: white glass cards with soft coloured glows and pill buttons" width="49%">
  <img src="docs/aura-dark.png" alt="Aura skin in dark mode: graphite glass cards with coloured glows in their corners" width="49%">
</p>

### Crayon

<p>
  <img src="docs/crayon-light.png" alt="Crayon skin in light mode: ruled cream paper, hand-drawn cards, bunting, clouds, a rainbow and a snail" width="49%">
  <img src="docs/crayon-dark.png" alt="Crayon skin in dark mode: a green chalkboard in a wooden frame with chalk doodles" width="49%">
</p>

### Whiskers

<p>
  <img src="docs/whiskers-light.png" alt="Whiskers skin in light mode: the cat sitting on the page title next to its ball of yarn" width="49%">
  <img src="docs/whiskers-dark.png" alt="Whiskers skin in dark mode: the cat walking across the cards while a round button spins like a wheel" width="49%">
</p>

## Try it

Open `index.html` from this repository in a browser (`npm run demo` serves it), or see the live demo once GitHub Pages is on.

## Use it on any page

No build step is needed. Add the stylesheet and set the attribute:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/playskin/themes/aura.css">
<html data-playskin="aura">
```

Crayon's doodles and the Whiskers cat need a little JavaScript, which `createPlayskin` runs for you:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/playskin/themes/crayon.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/playskin/themes/whiskers.css">
<script type="module">
  import { createPlayskin } from "https://cdn.jsdelivr.net/npm/playskin/src/index.js";
  const skin = createPlayskin();   // applies the visitor's saved skin
  skin.set("whiskers");            // or "aura", "crayon", or null for your own look
</script>
```

## Use it with npm

```bash
npm install playskin
```

```js
import "playskin/aura.css";
import "playskin/crayon.css";
import "playskin/whiskers.css";
import { setTheme } from "playskin";

setTheme("crayon");
```

### React and Next.js

```jsx
import { usePlayskin } from "playskin/react";

export function SkinPicker() {
  const [skin, setSkin] = usePlayskin();
  return (
    <select value={skin ?? ""} onChange={(e) => setSkin(e.target.value || null)}>
      <option value="">Plain</option>
      <option value="aura">Aura</option>
      <option value="crayon">Crayon</option>
      <option value="whiskers">Whiskers</option>
    </select>
  );
}
```

`<PlayskinRoot />` applies the saved skin without any picker. To avoid a flash of the plain look on load, put the output of `bootScript()` in an inline `<script>` in `<head>`.

## How your page is read

The skins repaint the colour variables that Tailwind and shadcn/ui sites already use: `--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border`, `--ring` and the rest, each an HSL triple such as `240 10% 4%`. A site built that way changes colour everywhere with no other work. Any other site can define the same variables.

A few markers let a skin restyle specific parts:

| Marker | Used for |
|---|---|
| `data-card` | Cards: glass in Aura, hand-drawn in Crayon, platforms for the cat |
| `data-card-title` | Card titles |
| `data-button="default"`, `"outline"`, `"secondary"`, `"ghost"`, `"destructive"`, `"link"` | Buttons and their variants |
| `data-playskin-floor` | An element whose top edge is the cat's floor, such as a bottom tab bar |
| `data-playskin-ignore` | Anything the cat should never walk on |
| `data-cat-chart` | Charts the cat plays with |

Headings, `main`, form fields, menus (`role="menu"`, `role="listbox"`) and tabs (`role="tab"`) are styled with no markers.

## API

### `createPlayskin(options)`

Keeps the attribute on `<html>` in step with the chosen skin and runs each skin's effects. Returns `{ get, set, subscribe, destroy }`.

| Option | Default | Meaning |
|---|---|---|
| `themes` | `["aura", "crayon", "whiskers"]` | Skins that may be turned on |
| `storageKey` | `"playskin"` | `localStorage` key for the visitor's choice; `null` to not save it |
| `attribute` | `"data-playskin"` | Attribute set on the root element |
| `root` | `document.documentElement` | Element that carries the attribute |
| `effects` | `true` | Set `false` to run Crayon's doodles and the cat yourself |
| `whiskers` | `{}` | Options passed to `startWhiskers` |

`setTheme(name)` and `getTheme()` do the same with the default options. `bootScript(options)` returns the no-flash script text.

### `startWhiskers(options)` from `playskin/whiskers`

Brings out the cat. It shows while `show()` returns true (by default, while the skin is `"whiskers"`) and leaves when it returns false. Options: `floor` and `ignore` (CSS selectors), `storage` (prefix for its saved name and hunger, default `"playskin.cat"`), `global` (window property for its controls, default `"playskinCat"`), `meow` (URL of its meow recording), `music` (an object whose `on` is true while page music plays), `reducedMotion` (a function).

### `mountCrayonDoodles(target)` from `playskin/crayon-doodles`

Adds Crayon's doodles to `target` (default `document.body`) and returns a function that removes them. `crayon.css` shows them only while the Crayon skin is on.

## Credits

The cat's meow is a public domain (CC0) recording from the "Micro Pack - Cat Meows" sound pack. Everything else is original work.

## Licence

[MIT](LICENSE)
