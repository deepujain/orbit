/* Orbit: a small app for trying every playskin skin. It marks its parts the way the README says (data-topbar,
   data-brand, data-wordmark, data-nav, data-theme-toggle, data-card, data-button, data-cat-chart) and redraws the whole
   page on every navigation, as real apps do, so each skin has to keep up on its own. */
import { createPlayskin, THEME_NAMES } from "../src/index.js";
import { rankedBars, blockGauge, splitGauge, rankTiles, compact } from "../src/charts.js";
import { chartsPage } from "./charts-page.js";
import { motionPage } from "./motion-page.js";

const ICONS = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  spark: '<path d="M12 3l2.2 6.3L20.5 12l-6.3 2.2L12 20.5l-2.2-6.3L3.5 12l6.3-2.7z"/>',
};
const icon = (name, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const PAGES = [
  ["dashboard", "home", "Dashboard"],
  ["charts", "pie", "Charts"],
  ["motion", "spark", "Motion"],
  ["settings", "gear", "Settings"],
];
const OUTPUT = {
  week: [["Mon", 17200], ["Tue", 17900], ["Wed", 18100], ["Thu", 16400], ["Fri", 18800], ["Sat", 19300], ["Sun", 18420]],
  month: [["Week 1", 121000], ["Week 2", 126500], ["Week 3", 118200], ["Week 4", 129800]],
  year: [["Q1", 1580000], ["Q2", 1660000], ["Q3", 1610000], ["Q4", 1720000]],
};
const state = { tab: "week", team: "Drill crew" };
const SKINS = [["", "Plain", "The app's own look"], ["aura", THEME_NAMES.aura, "Frosted glass and soft colour"], ["crayon", THEME_NAMES.crayon, "Paper by day, chalkboard by night"], ["whiskers", THEME_NAMES.whiskers, "A cat that lives on the page"], ["record", THEME_NAMES.record, "A narrated tour, filmed as a video"]];
const TEAMS = [["Drill crew", "Drill crew", "Runs the drill floor"], ["Deck crew", "Deck crew", "Cranes, cargo and the boats"], ["Maintenance", "Maintenance", "Keeps pumps, engines and power running"], ["Control room", "Control room", "Watches the wells and the process"]];

const page = () => (PAGES.some(([id]) => id === location.hash.slice(1)) ? location.hash.slice(1) : "dashboard");
const cards = (items) => `<div class="grid" data-motion>${items.map(([title, value, delta]) => `<section class="card" data-card data-m="rise"><h3 data-card-title>${title}</h3><div class="stat" data-count>${value}</div><div class="delta">${delta}</div></section>`).join("")}</div>`;
const chart = (rows) => {
  const max = Math.max(...rows.map(([, v]) => v));
  return `<div class="chart" data-cat-chart data-m-group role="img" aria-label="Barrels of oil produced">${rows.map(([label, v]) => `<div class="bar" title="${compact(v)} bbl"><i data-m="grow-y sheen" style="height:${Math.round((v / max) * 100)}%"></i>${label}</div>`).join("")}</div>`;
};
// A dropdown drawn by the app rather than the browser, so every skin dresses it. Opening it changes only the menu, so
// the page and its charts are not drawn again.
const menu = (id, label, options, value, cls = "") => {
  const chosen = options.find(([v]) => v === value) || options[0];
  return `<div class="menu ${cls}" data-menu="${id}">
    <button type="button" class="menu-button" id="${id}" aria-haspopup="listbox" aria-expanded="false" aria-label="${label}"><span class="menu-value">${chosen[1]}</span>${icon("down", "menu-caret")}</button>
    <ul class="menu-list" role="listbox" aria-label="${label}" hidden>${options.map(([v, name, hint]) => `<li role="option" tabindex="-1" data-value="${v}" aria-selected="${v === chosen[0]}">${icon("check", "menu-check")}<span><b>${name}</b>${hint ? `<small>${hint}</small>` : ""}</span></li>`).join("")}</ul>
  </div>`;
};

const BODY = {
  dashboard: () => `
    <div class="page-head"><div><h1>Good morning, Platform Alpha</h1><p class="lede">Six wells flowing, one on test. Seas are calm and the next crew change is Thursday.</p></div>
      <div class="row"><button class="btn" data-button="outline">Share report</button><button class="btn" data-button="default">${icon("plus")}New permit</button></div></div>
    ${cards([["Oil today", "18,420 bbl", "Up 3% on yesterday"], ["On board", "112", "Crew change Thursday"], ["Uptime", "97.2%", "Up from 95.8%"], ["Days without injury", "214", "Best run this year"]])}
    <h2>Oil produced</h2>
    <section class="card wide" data-card data-motion>
      <div class="tabs" role="tablist">${["week", "month", "year"].map((t) => `<button role="tab" data-tab="${t}" aria-selected="${state.tab === t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div>
      ${chart(OUTPUT[state.tab])}
    </section>
    <div class="shows dash">
      <section class="card" data-card><h3 data-card-title>Output by well</h3>${rankedBars({ rows: [["A-1", 4200], ["A-2", 3650], ["A-3", 3100], ["A-4", 2900], ["A-5", 2400], ["A-6", 1800]].map(([label, value]) => ({ label, value })), format: (v) => `${compact(v)} bbl` })}</section>
      <section class="card" data-card><h3 data-card-title>Rig time today</h3>${splitGauge({ rows: [["Working", 21.5], ["Repairs", 1.5], ["Weather", 1]].map(([label, value]) => ({ label, value })), format: (v) => `${v}h`, center: "Hours" })}</section>
      <section class="card" data-card><h3 data-card-title>Uptime</h3>${blockGauge({ value: 0.97, label: "97%", caption: "Uptime this month" })}</section>
      <section class="card" data-card><h3 data-card-title>Most permits issued</h3>${rankTiles({ rows: [["Drill floor", 64], ["Pipe deck", 51], ["Pump room", 38], ["Process deck", 22]].map(([label, value]) => ({ label, value })), unit: "permits" })}</section>
    </div>`,
  settings: () => `
    <div class="page-head"><div><h1>Settings</h1><p class="lede">Your profile and the reports you get.</p></div></div>
    <section class="card" data-card><h3 data-card-title>Profile</h3>
      <form onsubmit="return false">
        <label>Name<input value="Alex Morgan"></label>
        <div class="field"><span>Crew</span>${menu("team", "Crew", TEAMS, state.team, "wide-menu")}</div>
        <label>About<textarea rows="3">Night toolpusher on Platform Alpha, two weeks on and two weeks off.</textarea></label>
        <label class="check"><input type="checkbox" checked> Email me the morning report</label>
        <div class="row"><button class="btn" data-button="default">Save</button><button class="btn" data-button="ghost">Cancel</button><button class="btn" data-button="destructive">Delete account</button><button class="btn" data-button="link">Help</button></div>
      </form>
    </section>`,
  charts: chartsPage,
  motion: motionPage,
};

// One narrated tour per page for the Record skin.
const TOURS = {
  dashboard: { title: "Platform Alpha dashboard", steps: [{ heading: "Good morning, Platform Alpha", say: "This is Orbit, the control room for an offshore oil rig, dressed by playskin." }, { heading: "Oil produced", say: "Barrels, wells, uptime and permits all take the skin's look." }] },
  charts: { title: "Platform Alpha charts", steps: [{ heading: "Charts", say: "Every chart playskin draws, on made-up rig numbers." }, { heading: "Rings, pies and gauges", say: "Rings fill, pies spin in and gauges sweep up." }] },
  motion: { title: "Platform Alpha motion", steps: [{ heading: "Motion", say: "Every card builds in as it comes into view." }, { heading: "Line draws, area reveals, dots pop", say: "Lines draw themselves, areas sweep in and points pop." }] },
  settings: { title: "Platform Alpha settings", steps: [{ heading: "Settings", say: "Form fields and every button style." }] },
};

const nav = () => PAGES.map(([id, ic, label]) => `<a href="#${id}" ${page() === id ? 'aria-current="page"' : ""} title="${label}">${icon(ic)}<span>${label}</span></a>`).join("");
const skin = createPlayskin({ record: { script: () => TOURS[page()], offset: 72 } });

function render() {
  const now = skin.get();
  document.getElementById("app").innerHTML = `
    <header class="topbar" data-topbar>
      <a class="brand" href="#dashboard" data-brand aria-label="Orbit home"><span class="brand-mark" aria-hidden="true"></span><span class="wordmark" data-wordmark>Orbit</span></a>
      <div class="actions">
        ${menu("skin", "Skin", SKINS, now || "")}
        <button class="icon-button" id="dark" data-theme-toggle aria-label="Light or dark">${icon("sun", "sun")}${icon("moon", "moon")}</button>
      </div>
    </header>
    <div class="shell">
      <nav class="rail" data-nav aria-label="Main">${nav()}</nav>
      <main>${BODY[page()]()}</main>
    </div>
    <nav class="tabbar" data-nav data-playskin-floor aria-label="Main">${nav()}</nav>`;
}

function openMenu(box, focus = "selected") {
  closeMenus(box);
  box.querySelector(".menu-button").setAttribute("aria-expanded", "true");
  const list = box.querySelector(".menu-list");
  list.hidden = false;
  const items = [...list.children];
  (focus === "last" ? items.at(-1) : items.find((li) => li.getAttribute("aria-selected") === "true") || items[0]).focus();
}
function closeMenus(except) {
  for (const box of document.querySelectorAll("[data-menu]")) {
    if (box === except) continue;
    box.querySelector(".menu-button").setAttribute("aria-expanded", "false");
    box.querySelector(".menu-list").hidden = true;
  }
}
function choose(box, li) {
  const id = box.dataset.menu, value = li.dataset.value;
  closeMenus();
  if (id === "skin") {
    skin.set(value || null);
    return document.getElementById("skin").focus();
  }
  state.team = value;
  for (const o of box.querySelectorAll("[role=option]")) o.setAttribute("aria-selected", String(o === li));
  box.querySelector(".menu-value").textContent = li.querySelector("b").textContent;
  box.querySelector(".menu-button").focus();
}
document.addEventListener("keydown", (e) => {
  const box = e.target.closest?.("[data-menu]");
  if (!box) return;
  const open = !box.querySelector(".menu-list").hidden;
  if (e.target.matches(".menu-button")) {
    if (["ArrowDown", "Enter", " "].includes(e.key)) openMenu(box);
    else if (e.key === "ArrowUp") openMenu(box, "last");
    else return;
    return e.preventDefault();
  }
  if (!open || !e.target.matches("[role=option]")) return;
  const items = [...box.querySelectorAll("[role=option]")], at = items.indexOf(e.target);
  const go = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: items.length - 1 }[e.key];
  if (go !== undefined) items[(go + items.length) % items.length].focus();
  else if (e.key === "Enter" || e.key === " ") choose(box, e.target);
  else if (e.key === "Escape") {
    closeMenus();
    box.querySelector(".menu-button").focus();
  } else if (e.key === "Tab") closeMenus();
  else return;
  e.preventDefault();
});
document.addEventListener("click", (e) => {
  const box = e.target.closest("[data-menu]");
  if (!box) closeMenus();
  else if (e.target.closest(".menu-button")) box.querySelector(".menu-list").hidden ? openMenu(box) : closeMenus();
  else if (e.target.closest("[role=option]")) choose(box, e.target.closest("[role=option]"));
  if (e.target.closest("#dark")) {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("orbit-dark", dark ? "1" : "0");
    } catch {}
  }
  const one = e.target.closest("[data-replay]");
  if (one) {
    const card = one.closest("[data-card]");
    for (const b of [card, ...card.querySelectorAll("[data-motion]")]) if (b.matches("[data-motion]")) skin.motion?.replay(b);
  }
  if (e.target.closest("[data-replay-all]")) skin.motion?.replay();
  const tab = e.target.closest("[data-tab]");
  if (tab) {
    state.tab = tab.dataset.tab;
    render();
  }
});
addEventListener("hashchange", () => {
  render();
  scrollTo(0, 0);
});
skin.subscribe(render);
render();
window.orbit = { skin, render };
