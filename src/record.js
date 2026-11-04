/* Record: a narrated tour of the page, filmed as a video. The skin keeps the page's own look and adds a Record button
   to every page that has a script. Pressing it gets each line's voice ready, asks once to share the tab, then walks
   the page: it scrolls to each step's part, rings it, shows the line as a caption and plays the voice, which goes
   into the video and out of the speakers. Esc or the browser's Stop sharing ends it early. The file downloads at the
   end; nothing leaves the browser.

   A script is { title, steps: [{ heading | target, say, press }] }. heading is the text of a heading on the page;
   target is a CSS selector. press is a control to click before the line, only while it matches; at the end restore
   (or press with aria-pressed="true") is clicked so the page is left as it was. intro steps lead every script. Pages re-render, so the ring is an overlay that
   finds its part again on every frame. */

export const RECORD_TYPES = [
  "video/mp4;codecs=avc1,mp4a",
  "video/mp4;codecs=avc1,mp4a.40.2",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];
const GAP_MS = 450;
const LEAD_MS = 900;
const TAIL_MS = 1400;
const SCROLL_MS = 900;
const CAP_MS = 6 * 60e3;
const BPS = 14e6;
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));

/** How long a line lasts without a voice: about 2.6 words a second, at least 1.8 seconds. */
export const readMs = (text) =>
  Math.max(1800, Math.round((String(text).split(/\s+/).filter(Boolean).length / 2.6) * 1000));
/** The first type the browser can record, or "" to let it choose. */
export function pickType(isTypeSupported, types = RECORD_TYPES) {
  for (const type of types) {
    try {
      if (isTypeSupported?.(type)) return type;
    } catch {}
  }
  return "";
}
/** The control that undoes a step's press: its restore selector, or its press with aria-pressed turned true. */
export const restoreOf = (step) => step.restore || step.press.replace(/\[aria-pressed=(["']?)false\1\]/, '[aria-pressed="true"]');
/** A script with the intro steps in front, or null. */
export const withIntro = (script, intro = []) => (script ? { ...script, steps: [...intro, ...script.steps] } : null);
/** Words in a script, to keep its length in check: about 2.4 words a second with pauses and scrolling. */
export const scriptWords = (script) =>
  (script?.steps || []).reduce((n, s) => n + s.say.split(/\s+/).filter(Boolean).length, 0);
/** The video's file name: the script's title and the local time, safe on every system. */
export function recordingName(title, type, at = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())} ${pad(at.getHours())}.${pad(at.getMinutes())}`;
  return `${String(title || "Recording").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim()} ${stamp}.${/^video\/mp4/.test(type) ? "mp4" : "webm"}`;
}
/** The size a frame of `from` takes inside a fixed `to` frame: scaled to fit, centred. */
export function fitInto(from, to) {
  const k = Math.min(to.width / from.width, to.height / from.height);
  const width = Math.round(from.width * k), height = Math.round(from.height * k);
  return { x: Math.round((to.width - width) / 2), y: Math.round((to.height - height) / 2), width, height };
}
const even = (n) => Math.max(2, Math.round(n / 2) * 2);
/* Chrome's MP4 writer keeps the frame size the recording started with, so when the shared tab changes size (Chrome's
   "sharing this tab" bar appears, or the window is resized) every later frame no longer matches it and players stop on
   the first picture. The tab is copied onto a canvas of one fixed size instead: the size it settles at once sharing
   starts, with later changes scaled to fit. */
async function steadyTrack(stream, { settleMs = 600, waitMs = 2000 } = {}) {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  await video.play().catch(() => {});
  const size = () => `${video.videoWidth}x${video.videoHeight}`;
  const until = Date.now() + waitMs;
  let last = size(), since = Date.now();
  while (Date.now() < until && (!video.videoWidth || Date.now() - since < settleMs)) {
    await sleep(100);
    if (size() !== last) {
      last = size();
      since = Date.now();
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = even(video.videoWidth || innerWidth * (devicePixelRatio || 1));
  canvas.height = even(video.videoHeight || innerHeight * (devicePixelRatio || 1));
  const g = canvas.getContext("2d", { alpha: false });
  let on = true, handle = 0;
  const draw = () => {
    if (!on) return;
    if (video.videoWidth) {
      const r = fitInto({ width: video.videoWidth, height: video.videoHeight }, canvas);
      if (r.width !== canvas.width || r.height !== canvas.height) g.fillRect(0, 0, canvas.width, canvas.height);
      g.drawImage(video, r.x, r.y, r.width, r.height);
    }
    handle = video.requestVideoFrameCallback ? video.requestVideoFrameCallback(draw) : requestAnimationFrame(draw);
  };
  draw();
  const track = canvas.captureStream(60).getVideoTracks()[0];
  track.contentHint = "detail";
  return {
    track,
    stop() {
      on = false;
      if (video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(handle);
      else cancelAnimationFrame(handle);
      track.stop();
      video.srcObject = null;
    },
  };
}
// An element inside something fixed or sticky stays put while the page scrolls, so the tour never scrolls to it.
const pinned = (el) => {
  for (let at = el; at && at.nodeType === 1; at = at.parentElement) {
    if (/^(fixed|sticky)$/.test(getComputedStyle(at).position)) return true;
  }
  return false;
};

/**
 * Options: script (a function returning the current page's script, or null), intro (steps that lead every script),
 * voice (async text => ArrayBuffer of audio, or null for captions alone), show (a function saying whether the button
 * is out; defaults to the skin being "record"), root and attribute (where the skin is read from), headings (where
 * heading steps look), sectionOf (the part to ring for a matched heading), offset (pixels left above a part when the
 * page scrolls to it), label (the button text), onMessage (text, tone) for problems and the saved length.
 */
export function startRecord({
  script = () => null,
  intro = [],
  voice = null,
  root = document.documentElement,
  attribute = "data-playskin",
  show,
  headings = "main h1, main h2, main h3",
  sectionOf = (h) => h.closest("section, [data-card]") || h.closest("header") || h,
  offset = 88,
  label = "Record",
  onMessage = (text) => console.info(text),
} = {}) {
  // The page may not be ready when Record starts, so a script or show that throws means no button yet.
  const safe = (fn) => {
    try {
      return fn();
    } catch {
      return null;
    }
  };
  const visible = () => safe(show || (() => root.getAttribute(attribute) === "record"));
  const current = () => safe(() => withIntro(script(), intro));
  const make = (cls, tag = "div") => Object.assign(document.createElement(tag), { className: cls, hidden: true });
  const button = make("playskin-record", "button");
  button.type = "button";
  const ring = make("playskin-record-ring");
  const caption = make("playskin-record-caption");
  caption.setAttribute("aria-live", "polite");
  document.body.append(button, ring, caption);
  let run = null;

  const findHeading = (text) => {
    for (const h of document.querySelectorAll(headings)) if (h.textContent.trim() === text) return sectionOf(h);
    return null;
  };
  const locate = (step) =>
    step?.target ? document.querySelector(step.target) : step?.heading ? findHeading(step.heading) : null;

  function refresh() {
    const s = run ? null : visible() ? current() : null;
    button.hidden = !s && !run;
    button.classList.toggle("is-busy", Boolean(run));
    button.innerHTML = `<i class="playskin-record-dot"></i>${run ? (run.recording ? "Recording" : "Getting the voice ready") : label}`;
    button.setAttribute("aria-label", run ? "Recording. Press Esc to stop" : `${label} this page with its narration`);
    root.toggleAttribute("data-playskin-recording", Boolean(run?.recording));
  }
  function follow() {
    if (!run) return;
    const r = locate(run.step)?.getBoundingClientRect();
    ring.hidden = !r;
    if (r) Object.assign(ring.style, { left: `${r.left - 8}px`, top: `${r.top - 8}px`, width: `${r.width + 16}px`, height: `${r.height + 16}px` });
    run.raf = requestAnimationFrame(follow);
  }
  function glide(y) {
    const from = scrollY;
    const to = Math.max(0, Math.min(y, document.documentElement.scrollHeight - innerHeight));
    const t0 = performance.now();
    return new Promise((ok) => {
      const step = (now) => {
        if (!run || run.stopped) return ok();
        const t = Math.min(1, (now - t0) / SCROLL_MS);
        const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        scrollTo({ top: from + (to - from) * e, behavior: "instant" });
        if (t < 1) requestAnimationFrame(step);
        else ok();
      };
      requestAnimationFrame(step);
    });
  }
  async function until(test, ms) {
    const end = Date.now() + ms;
    while (run && !run.stopped && !test() && Date.now() < end) await sleep(120);
    return test();
  }
  async function clip(ctx, text) {
    if (!voice) return null;
    try {
      const audio = await voice(text);
      return audio ? await ctx.decodeAudioData(audio) : null;
    } catch {
      return null;
    }
  }
  function play(buffer) {
    return new Promise((ok) => {
      const src = run.ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(run.out);
      src.connect(run.ctx.destination);
      src.onended = () => {
        run.src = null;
        ok();
      };
      run.src = src;
      run.wake = ok;
      src.start();
    });
  }
  function stop() {
    if (!run || run.stopped) return;
    run.stopped = true;
    try {
      run.src?.stop();
    } catch {}
    run.wake?.();
  }
  const onKey = (e) => {
    if (e.key === "Escape" && run) stop();
  };
  addEventListener("keydown", onKey);

  function save(blob, name) {
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  }

  async function start() {
    if (run) return stop();
    const s = current();
    if (!s) return;
    if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder !== "function") {
      onMessage("This browser cannot record the tab. Use a current Chrome or Edge.", "error");
      return;
    }
    const ctx = new AudioContext();
    run = { ctx, out: ctx.createMediaStreamDestination(), stopped: false, recording: false, step: null, pressed: [] };
    // With nothing playing into it, Chrome records no audio at all, so every pause would drop out of the voice track and
    // the voice would run ahead of the picture. A silent source keeps the track going between lines.
    const hold = ctx.createConstantSource();
    hold.offset.value = 0;
    hold.connect(run.out);
    hold.start();
    refresh();
    const clips = await Promise.all(s.steps.map((step) => clip(ctx, step.say)));
    if (voice && clips.some((c) => !c)) onMessage("Some lines have no voice, so they show as captions only.", "error");
    const dpr = devicePixelRatio || 1;
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser", frameRate: { ideal: 60, max: 60 }, width: { ideal: Math.round(innerWidth * dpr) }, height: { ideal: Math.round(innerHeight * dpr) } },
        audio: false,
        preferCurrentTab: true,
        selfBrowserSurface: "include",
        surfaceSwitching: "exclude",
      });
    } catch (e) {
      if (e?.name !== "NotAllowedError") onMessage(`Could not start recording: ${e?.message || e}`, "error");
      ctx.close();
      run = null;
      refresh();
      return;
    }
    const track = stream.getVideoTracks()[0];
    track.contentHint = "detail";
    track.addEventListener("ended", stop, { once: true });
    const steady = await steadyTrack(stream);
    const type = pickType((t) => MediaRecorder.isTypeSupported(t));
    const chunks = [];
    let recorder;
    try {
      recorder = new MediaRecorder(new MediaStream([steady.track, ...run.out.stream.getAudioTracks()]), { ...(type ? { mimeType: type } : {}), videoBitsPerSecond: BPS, audioBitsPerSecond: 128e3 });
    } catch (e) {
      onMessage(`Could not start recording: ${e?.message || e}`, "error");
      steady.stop();
      stream.getTracks().forEach((t) => t.stop());
      ctx.close();
      run = null;
      refresh();
      return;
    }
    const saved = new Promise((ok) => {
      recorder.onstop = ok;
    });
    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunks.push(e.data);
    };
    recorder.start(1000);
    const startedAt = Date.now();
    const cap = setTimeout(stop, CAP_MS);
    run.recording = true;
    refresh();
    follow();
    await sleep(LEAD_MS);
    for (const [i, step] of s.steps.entries()) {
      if (run.stopped) break;
      const control = step.press && document.querySelector(step.press);
      if (control) {
        control.click();
        run.pressed.push(step);
      }
      const el = (await until(() => locate(step), control ? 6000 : 2500)) ? locate(step) : null;
      run.step = el ? step : null;
      if (el && !pinned(el)) await glide(scrollY + el.getBoundingClientRect().top - offset);
      caption.textContent = step.say;
      caption.hidden = false;
      if (clips[i]) await play(clips[i]);
      else await sleep(readMs(step.say));
      if (!run.stopped) await sleep(GAP_MS);
    }
    caption.hidden = true;
    run.step = null;
    ring.hidden = true;
    // A re-render may have replaced a pressed control, so the one on the page now is found again.
    for (const step of run.pressed.reverse()) document.querySelector(restoreOf(step))?.click();
    if (!run.stopped) {
      await glide(0);
      await sleep(TAIL_MS);
    }
    clearTimeout(cap);
    const took = Math.round((Date.now() - startedAt) / 1000);
    recorder.stop();
    await saved;
    save(new Blob(chunks, { type: (recorder.mimeType || type || "video/webm").split(";")[0] }), recordingName(s.title, recorder.mimeType || type));
    cancelAnimationFrame(run.raf);
    steady.stop();
    stream.getTracks().forEach((t) => t.stop());
    ctx.close();
    run = null;
    refresh();
    onMessage(`Recorded ${Math.floor(took / 60)}:${String(took % 60).padStart(2, "0")}.`, "done");
  }

  button.addEventListener("click", start);
  const onChange = () => refresh();
  root.addEventListener("playskin-change", onChange);
  refresh();
  return {
    refresh,
    start,
    stop,
    get running() {
      return Boolean(run);
    },
    destroy() {
      stop();
      removeEventListener("keydown", onKey);
      root.removeEventListener("playskin-change", onChange);
      button.remove();
      ring.remove();
      caption.remove();
    },
  };
}
