import test from "node:test";
import assert from "node:assert/strict";
import { moveSaved } from "../src/saved.js";
import { bootScript } from "../src/index.js";

const memory = (init) => {
  const m = new Map(Object.entries(init));
  return new Proxy({ getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }, {
    ownKeys: () => [...m.keys()],
    getOwnPropertyDescriptor: (t, k) => (m.has(k) ? { enumerable: true, configurable: true, value: m.get(k) } : Object.getOwnPropertyDescriptor(t, k)),
    get: (t, k) => t[k],
  });
};

test("choices saved under the old name move to orbit, and never overwrite a newer one", () => {
  const store = memory({ playskin: "crayon", "playskin.cat.name": "Miso", "playskin.cat.voice": "on", "orbit.cat.voice": "off", "playskinny": "x", other: "y" });
  moveSaved(store);
  assert.equal(store.getItem("orbit"), "crayon");
  assert.equal(store.getItem("orbit.cat.name"), "Miso");
  assert.equal(store.getItem("orbit.cat.voice"), "off", "a choice already saved under orbit wins");
  assert.equal(store.getItem("playskin"), null);
  assert.equal(store.getItem("playskin.cat.name"), null);
  assert.equal(store.getItem("playskinny"), "x", "only the old keys move");
  assert.equal(store.getItem("other"), "y");
});

test("the boot script also reads a skin saved under the old name, before anything moves it", () => {
  assert.match(bootScript(), /localStorage\.getItem\("orbit"\)\|\|localStorage\.getItem\("playskin"\)/);
  assert.doesNotMatch(bootScript({ storageKey: "mine" }), /playskin/, "an app's own key has no old name");
  assert.match(bootScript(), /setAttribute\("data-orbit",s\)/);
});
