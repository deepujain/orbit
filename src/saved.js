/** Moves choices saved under the library's old name, playskin and playskin.*, to orbit and orbit.*, once. */
export function moveSaved(store = globalThis.localStorage) {
  try {
    for (const key of Object.keys(store)) {
      if (key !== "playskin" && !key.startsWith("playskin.")) continue;
      const now = "orbit" + key.slice("playskin".length);
      if (store.getItem(now) === null) store.setItem(now, store.getItem(key));
      store.removeItem(key);
    }
  } catch {}
}
