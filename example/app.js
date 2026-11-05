/* Orbit: a small app for trying every playskin skin. It marks its parts the way the README says (data-topbar,
   data-brand, data-wordmark, data-nav, data-theme-toggle, data-card, data-button, data-cat-chart) and redraws the whole
   page on every navigation, as real apps do, so each skin has to keep up on its own. */
import { createPlayskin, THEME_NAMES } from "../src/index.js";
import { chartsPage } from "./charts-page.js";
import { motionPage } from "./motion-page.js";

const ICONS = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  folder: '<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  spark: '<path d="M12 3l2.2 6.3L20.5 12l-6.3 2.2L12 20.5l-2.2-6.3L3.5 12l6.3-2.7z"/>',
};
const icon = (name, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const PAGES = [
  ["dashboard", "home", "Dashboard"],
  ["projects", "folder", "Projects"],
  ["reports", "chart", "Reports"],
  ["charts", "pie", "Charts"],
  ["motion", "spark", "Motion"],
  ["settings", "gear", "Settings"],
];
const PROJECTS = [
  ["Launch site", "Maya", "On track", 82],
  ["Mobile app", "Arjun", "On track", 64],
  ["Billing move", "Lena", "Late", 38],
  ["Help centre", "Sam", "Done", 100],
  ["Data export", "Priya", "On track", 51],
];
const WEEKS = [42, 58, 51, 73, 66, 88, 79, 95];
const state = { tab: "week" };

const page = () => (PAGES.some(([id]) => id === location.hash.slice(1)) ? location.hash.slice(1) : "dashboard");
const cards = (items) => `<div class="grid" data-motion>${items.map(([title, value, delta]) => `<section class="card" data-card data-m="rise"><h3 data-card-title>${title}</h3><div class="stat" data-count>${value}</div><div class="delta">${delta}</div></section>`).join("")}</div>`;
const chart = (values) => {
  const max = Math.max(...values);
  return `<div class="chart" data-cat-chart data-m-group role="img" aria-label="Tasks done each week">${values.map((v, i) => `<div class="bar"><i data-m="grow-y sheen" style="height:${Math.round((v / max) * 100)}%"></i>W${i + 1}</div>`).join("")}</div>`;
};
const status = (s) => `<span class="pill ${s === "Late" ? "late" : s === "Done" ? "ok" : ""}">${s}</span>`;

const BODY = {
  dashboard: () => `
    <div class="page-head"><div><h1>Good afternoon</h1><p class="lede">Five projects, one running late.</p></div>
      <div class="row"><button class="btn" data-button="outline">Share</button><button class="btn" data-button="default">${icon("plus")}New project</button></div></div>
    ${cards([["Tasks done", "1,204", "+12% on last week"], ["Open tasks", "86", "14 due this week"], ["On time", "92%", "Up from 88%"], ["Team", "12", "2 joined this month"]])}
    <h2>Tasks done each week</h2>
    <section class="card wide" data-card data-motion>
      <div class="tabs" role="tablist">${["week", "month", "year"].map((t) => `<button role="tab" data-tab="${t}" aria-selected="${state.tab === t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div>
      ${chart(state.tab === "week" ? WEEKS : state.tab === "month" ? [210, 260, 240, 300, 330, 310] : [2100, 2600, 3100, 3800])}
    </section>`,
  projects: () => `
    <div class="page-head"><div><h1>Projects</h1><p class="lede">Everything the team is working on.</p></div><button class="btn" data-button="default">${icon("plus")}New project</button></div>
    <section class="card" data-card><h3 data-card-title>All projects</h3>
      <table><thead><tr><th>Project</th><th>Lead</th><th>Status</th><th>Done</th></tr></thead>
      <tbody data-motion>${PROJECTS.map(([n, lead, s, d]) => `<tr data-m="fade"><td>${n}</td><td>${lead}</td><td>${status(s)}</td><td><span class="done"><i data-m="grow-x" style="width:${d}%"></i></span>${d}%</td></tr>`).join("")}</tbody></table>
    </section>`,
  reports: () => `
    <div class="page-head"><div><h1>Reports</h1><p class="lede">How the quarter went.</p></div><button class="btn" data-button="secondary">Download</button></div>
    ${cards([["Shipped", "38", "features this quarter"], ["Bugs fixed", "214", "median 2 days"], ["Customer score", "4.7", "out of 5"]])}
    <h2>Done by project</h2>
    <section class="card wide" data-card data-motion>${chart(PROJECTS.map((p) => p[3]))}</section>`,
  settings: () => `
    <div class="page-head"><div><h1>Settings</h1><p class="lede">Your profile and notifications.</p></div></div>
    <section class="card" data-card><h3 data-card-title>Profile</h3>
      <form onsubmit="return false">
        <label>Name<input value="Alex Morgan"></label>
        <label>Team<select><option>Design</option><option selected>Engineering</option><option>Sales</option></select></label>
        <label>About<textarea rows="3">Builds the things the team ships.</textarea></label>
        <label class="check"><input type="checkbox" checked> Email me a weekly summary</label>
        <div class="row"><button class="btn" data-button="default">Save</button><button class="btn" data-button="ghost">Cancel</button><button class="btn" data-button="destructive">Delete account</button><button class="btn" data-button="link">Help</button></div>
      </form>
    </section>`,
  charts: chartsPage,
  motion: motionPage,
};

// One narrated tour per page for the Record skin.
const TOURS = {
  dashboard: { title: "Orbit dashboard", steps: [{ heading: "Good afternoon", say: "This is Orbit, a small app dressed by playskin." }, { heading: "Tasks done each week", say: "Charts, cards and buttons all take the skin's look." }] },
  projects: { title: "Orbit projects", steps: [{ heading: "Projects", say: "Every project, its lead and how far along it is." }] },
  reports: { title: "Orbit reports", steps: [{ heading: "Reports", say: "The quarter at a glance." }, { heading: "Done by project", say: "How much of each project is done." }] },
  charts: { title: "Orbit charts", steps: [{ heading: "Charts", say: "Every chart playskin draws, on made-up numbers." }, { heading: "Rings, pies and gauges", say: "Rings fill, pies spin in and gauges sweep up." }] },
  motion: { title: "Orbit motion", steps: [{ heading: "Motion", say: "Every card builds in as it comes into view." }, { heading: "Line draws, area reveals, dots pop", say: "Lines draw themselves, areas sweep in and points pop." }] },
  settings: { title: "Orbit settings", steps: [{ heading: "Settings", say: "Form fields and every button style." }] },
};

const nav = () => PAGES.map(([id, ic, label]) => `<a href="#${id}" ${page() === id ? 'aria-current="page"' : ""}>${icon(ic)}<span>${label}</span></a>`).join("");
const skin = createPlayskin({ record: { script: () => TOURS[page()], offset: 72 } });

function render() {
  const now = skin.get();
  document.getElementById("app").innerHTML = `
    <header class="topbar" data-topbar>
      <a class="brand" href="#dashboard" data-brand aria-label="Orbit home"><span class="brand-mark" aria-hidden="true"></span><span class="wordmark" data-wordmark>Orbit</span></a>
      <nav class="nav" data-nav aria-label="Main">${nav()}</nav>
      <div class="actions">
        <label><span class="sr">Skin </span><select class="skin-select" id="skin" aria-label="Skin">
          <option value="">Plain</option>${Object.entries(THEME_NAMES).map(([id, name]) => `<option value="${id}" ${now === id ? "selected" : ""}>${name}</option>`).join("")}
        </select></label>
        <button class="icon-button" id="dark" data-theme-toggle aria-label="Light or dark">${icon("sun", "sun")}${icon("moon", "moon")}</button>
      </div>
    </header>
    <main>${BODY[page()]()}</main>
    <nav class="tabbar" data-nav data-playskin-floor aria-label="Main">${nav()}</nav>`;
}

document.addEventListener("change", (e) => {
  if (e.target.id === "skin") skin.set(e.target.value || null);
});
document.addEventListener("click", (e) => {
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
