import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { parse } from "@vue/compiler-sfc";
import * as Vue from "vue";
const source = parse(
  readFileSync(
    new URL(
      "../src/system/layouts/config/RegisterAssetsLayout.vue",
      import.meta.url,
    ),
    "utf8",
  ),
).descriptor.scriptSetup.content;
async function harness({ blocked = false } = {}) {
  const tabs = [],
    requests = [],
    disposers = [];
  let session = 0;
  const context = vm.createContext({
    URL,
    window: {
      location: { origin: "https://portal.example.test" },
      open() {
        if (blocked) return null;
        const tab = {
          opener: {},
          closed: false,
          destinations: [],
          close() {
            this.closed = true;
          },
          document: {
            head: {
              appendChild(node) {
                this.meta = node;
              },
            },
            body: {
              appendChild(node) {
                this.link = node;
              },
            },
            createElement(tag) {
              return {
                tag,
                click() {
                  tab.destinations.push(this.href);
                },
              };
            },
          },
        };
        tabs.push(tab);
        return tab;
      },
    },
  });
  const api = {
    captureClientSession: () => session,
    isClientSessionCurrent: (v) => v === session,
    assertClientSessionCurrent(v) {
      if (v !== session) throw Error("changed session");
    },
  };
  const resource = () => ({
    state: Vue.reactive({ data: null, error: "", loading: false }),
    async load(fn) {
      this.state.loading = true;
      try {
        return (this.state.data = await fn());
      } catch (e) {
        this.state.error = e.message;
      } finally {
        this.state.loading = false;
      }
    },
    reset() {
      this.state.data = null;
      this.state.loading = false;
    },
  });
  const values = {
    vue: { ...Vue, onScopeDispose: (fn) => disposers.push(fn) },
    "src/services/clientApi": api,
    "src/composables/useFinanceResource": { useFinanceResource: resource },
    "src/services/clientAuthService": { getApiErrorMessage: (e) => e.message },
    "src/services/clientAssetsService": {
      listClientAssets: async () => [],
      getClientAssetCurrencies: async () => [],
      getClientAssetDocumentUrl: (id, documentId) =>
        new Promise((resolve, reject) =>
          requests.push({ id, documentId, resolve, reject }),
        ),
    },
  };
  const imports = new Map();
  for (const match of source.matchAll(
    /import\s+([\s\S]*?)\s+from\s+["']([^"']+)["'];/g,
  )) {
    const exports = match[1].trim().startsWith("{")
      ? match[1]
          .replace(/[{}]/g, "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
      : ["default"];
    imports.set(match[2], exports);
  }
  const mod = new vm.SourceTextModule(
    source + "\nexport { viewDocument, viewing, saveError };",
    { context },
  );
  await mod.link((name) => {
    const exports = imports.get(name);
    return new vm.SyntheticModule(
      exports,
      function () {
        for (const key of exports)
          this.setExport(key, values[name]?.[key] ?? {});
      },
      { context },
    );
  });
  await mod.evaluate();
  return {
    m: mod.namespace,
    tabs,
    requests,
    dispose: () => disposers.forEach((fn) => fn()),
    changeSession: () => session++,
  };
}
const valid = { url: "https://files.example.test/ficticio.pdf" };
test("asset document reserves its tab before the delayed URL and strips opener/referrer", async () => {
  const h = await harness(),
    p = h.m.viewDocument("asset", "doc");
  assert.equal(h.tabs.length, 1);
  assert.equal(h.tabs[0].opener, null);
  assert.equal(h.tabs[0].document.head.meta.content, "no-referrer");
  h.requests[0].resolve(valid);
  await p;
  assert.deepEqual(h.tabs[0].destinations, [valid.url]);
  assert.equal(h.tabs[0].document.body.link.rel, "noopener noreferrer");
  assert.equal(h.tabs[0].document.body.link.referrerPolicy, "no-referrer");
  h.dispose();
  assert.equal(h.tabs[0].closed, false);
});
test("blocked popup gives feedback without querying a URL", async () => {
  const h = await harness({ blocked: true });
  const p = h.m.viewDocument("asset", "doc");
  assert.equal(h.requests.length, 0);
  await p;
  assert.match(h.m.saveError.value, /Permita/);
  assert.equal(h.m.viewing.value, null);
});
test("failure closes reserved tab and retry clears the previous error", async () => {
  const h = await harness(),
    p = h.m.viewDocument("asset", "doc");
  h.requests[0].reject(Error("Falha controlada"));
  await p;
  assert.equal(h.tabs[0].closed, true);
  assert.equal(h.m.saveError.value, "Falha controlada");
  const retry = h.m.viewDocument("asset", "doc");
  assert.equal(h.m.saveError.value, "");
  h.requests[1].resolve(valid);
  await retry;
  assert.equal(h.tabs[1].closed, false);
  assert.equal(h.m.viewing.value, null);
});
test("leaving closes a pending tab and prevents late navigation or further calls", async () => {
  const h = await harness(),
    p = h.m.viewDocument("asset", "doc");
  h.dispose();
  assert.equal(h.tabs[0].closed, true);
  h.requests[0].resolve(valid);
  await p;
  assert.equal(h.tabs[0].destinations.length, 0);
  const late = h.m.viewDocument("asset", "doc");
  assert.equal(h.requests.length, 1);
  await late;
});
test("session change discards late failures without exposing errors", async () => {
  const h = await harness(),
    p = h.m.viewDocument("asset", "doc");
  h.changeSession();
  h.requests[0].reject(Error("Erro antigo"));
  await p;
  assert.equal(h.tabs[0].closed, true);
  assert.equal(h.m.saveError.value, "");
});
test("duplicate clicks request one URL and open one tab", async () => {
  const h = await harness(),
    p = h.m.viewDocument("asset", "doc");
  await h.m.viewDocument("asset2", "doc2");
  assert.equal(h.requests.length, 1);
  assert.equal(h.tabs.length, 1);
  h.requests[0].resolve(valid);
  await p;
});
test("invalid and external insecure URLs close the pending tab", async () => {
  for (const url of [
    "javascript:alert(1)",
    "http://external.example.test/file",
    "not a url",
  ]) {
    const h = await harness(),
      p = h.m.viewDocument("asset", "doc");
    h.requests[0].resolve({ url });
    await p;
    assert.equal(h.tabs[0].closed, true);
    assert.ok(h.m.saveError.value);
    assert.equal(h.tabs[0].destinations.length, 0);
  }
});
test("closing reserved tab manually produces recoverable error", async () => {
  const h = await harness(),
    p = h.m.viewDocument("asset", "doc");
  h.tabs[0].close();
  h.requests[0].resolve(valid);
  await p;
  assert.ok(h.m.saveError.value);
  assert.equal(h.tabs[0].destinations.length, 0);
  assert.equal(h.m.viewing.value, null);
});
