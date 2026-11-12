import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { parse } from "@vue/compiler-sfc";
import * as Vue from "vue";
const helperSource = readFileSync(
  new URL("../src/services/documentWindow.js", import.meta.url),
  "utf8",
);
const cases = [
  {
    name: "documentation",
    file: "src/system/layouts/config/DocumentationSettingLayout.vue",
    fn: "temporaryUrl",
    arg: { id: "doc" },
    service: "getClientDocumentTemporaryUrl",
  },
  {
    name: "gallery",
    file: "src/system/components/profile/AssetDocumentGallery.vue",
    fn: "view",
    arg: { documentId: "doc" },
    service: "getClientAssetDocumentUrl",
  },
  {
    name: "editor",
    file: "src/system/components/profile/AssetAttachmentEditor.vue",
    fn: "view",
    arg: { key: "doc", documentId: "doc" },
    service: "getClientAssetDocumentUrl",
  },
];
async function harness(c, { blocked = false } = {}) {
  const content = process.env.QA_BASELINE
    ? execFileSync("git", ["show", "HEAD:" + c.file], { encoding: "utf8" })
    : readFileSync(new URL("../" + c.file, import.meta.url), "utf8");
  const source = parse(content).descriptor.scriptSetup.content;
  const tabs = [],
    requests = [],
    dispose = [],
    notifications = [],
    revoked = [],
    timers = [];
  let session = 1;
  class WindowURL extends URL {
    static createObjectURL() {
      return "blob:https://portal.example.test/local-qa";
    }
    static revokeObjectURL(url) {
      revoked.push(url);
    }
  }
  const context = vm.createContext({
    URL: WindowURL,
    setTimeout: (fn) => timers.push(fn),
    defineProps: () => ({ assetId: "asset", disabled: false }),
    defineExpose() {},
    window: {
      location: { origin: "https://portal.example.test" },
      open() {
        if (blocked) return null;
        const tab = {
          closed: false,
          opener: {},
          urls: [],
          close() {
            this.closed = true;
          },
        };
        tab.document = {
          head: {
            appendChild(n) {
              this.meta = n;
            },
          },
          body: {
            appendChild(n) {
              this.link = n;
            },
          },
          createElement() {
            return {
              click() {
                tab.urls.push(this.href);
              },
            };
          },
        };
        tabs.push(tab);
        return tab;
      },
    },
  });
  const helper = new vm.SourceTextModule(helperSource, { context });
  await helper.link(() => {});
  const imports = new Map();
  for (const m of source.matchAll(
    /import\s+([\s\S]*?)\s+from\s+["']([^"']+)["'];/g,
  ))
    imports.set(
      m[2],
      m[1].trim().startsWith("{")
        ? m[1]
            .replace(/[{}]/g, "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : ["default"],
    );
  const resource = () => ({
    state: Vue.reactive({ data: null, loading: false, error: "" }),
    load: async () => [],
    reset() {},
  });
  const api = {
    captureClientSession: () => session,
    isClientSessionCurrent: (v) => v === session,
    assertClientSessionCurrent(v) {
      if (v !== session) throw Error("changed session");
    },
  };
  const values = {
    vue: { ...Vue, onScopeDispose: (fn) => dispose.push(fn) },
    "src/services/clientApi": api,
    "src/composables/useFinanceResource": { useFinanceResource: resource },
    "src/composables/useNotify": {
      default: () => ({
        successNotify: (m) => notifications.push(m),
        errorNotify: (m) => notifications.push(m),
      }),
    },
    "src/services/clientAuthService": { getApiErrorMessage: (e) => e.message },
  };
  const mod = new vm.SourceTextModule(source + "\nexport { " + c.fn + " };", {
    context,
  });
  await mod.link((name) => {
    if (name === "src/services/documentWindow") return helper;
    const keys = imports.get(name);
    return new vm.SyntheticModule(
      keys,
      function () {
        for (const key of keys) {
          let value = values[name]?.[key];
          if (key === c.service)
            value = (...args) =>
              new Promise((resolve, reject) =>
                requests.push({ args, resolve, reject }),
              );
          if (value === undefined)
            value = key === "default" ? {} : () => new Promise(() => {});
          this.setExport(key, value);
        }
      },
      { context },
    );
  });
  await mod.evaluate();
  return {
    run: (arg = c.arg) => mod.namespace[c.fn](arg),
    tabs,
    requests,
    notifications,
    revoked,
    timers,
    dispose: () => dispose.forEach((fn) => fn()),
    change: () => session++,
  };
}
for (const c of cases) {
  test(
    c.name +
      ": reserves tab synchronously, opens without opener/referrer and preserves file on exit",
    async () => {
      const h = await harness(c),
        p = h.run();
      assert.equal(h.tabs.length, 1);
      assert.equal(h.tabs[0].opener, null);
      assert.equal(h.tabs[0].document.head.meta.content, "no-referrer");
      assert.deepEqual(
        h.requests[0].args,
        c.name === "documentation" ? ["doc"] : ["asset", "doc"],
      );
      h.requests[0].resolve({ url: "https://files.example.test/ficticio.pdf" });
      await p;
      assert.equal(h.tabs[0].document.body.link.referrerPolicy, "no-referrer");
      assert.equal(h.tabs[0].urls.length, 1);
      h.dispose();
      assert.equal(h.tabs[0].closed, false);
    },
  );
  test(c.name + ": blocked popup avoids API request", async () => {
    const h = await harness(c, { blocked: true }),
      p = h.run();
    assert.equal(h.requests.length, 0);
    await p;
    assert.equal(h.tabs.length, 0);
  });
  test(c.name + ": failure closes reservation; retry opens once", async () => {
    const h = await harness(c),
      p = h.run();
    h.requests[0].reject(Error("controlled"));
    await p;
    assert.equal(h.tabs[0].closed, true);
    const retry = h.run();
    h.requests[1].resolve({ url: "https://files.example.test/retry.pdf" });
    await retry;
    assert.equal(h.tabs[1].urls.length, 1);
  });
  test(c.name + ": duplicate clicks make one URL request", async () => {
    const h = await harness(c),
      p = h.run();
    await h.run();
    assert.equal(h.requests.length, 1);
    h.requests[0].resolve({
      temporaryUrl: "https://files.example.test/x.pdf",
      url: "https://files.example.test/x.pdf",
    });
    await p;
    assert.equal(h.tabs.length, 1);
  });
  test(
    c.name +
      ": exit closes pending tab, rejects further actions and ignores late response",
    async () => {
      const h = await harness(c),
        p = h.run();
      h.dispose();
      assert.equal(h.tabs[0].closed, true);
      h.requests[0].resolve({ url: "https://files.example.test/late.pdf" });
      await p;
      const again = h.run();
      assert.equal(h.requests.length, 1);
      await again;
      assert.equal(h.tabs[0].urls.length, 0);
    },
  );
  test(c.name + ": previous-session success cannot open a file", async () => {
    const h = await harness(c),
      p = h.run();
    h.change();
    h.requests[0].resolve({ url: "https://files.example.test/old.pdf" });
    await p;
    assert.equal(h.tabs[0].closed, true);
    assert.equal(h.tabs[0].urls.length, 0);
    assert.equal(h.notifications.length, 0);
  });
  test(
    c.name + ": invalid and insecure external destinations leave no empty tab",
    async () => {
      for (const url of [
        "javascript:alert(1)",
        "http://external.test/file",
        "invalid",
      ]) {
        const h = await harness(c),
          p = h.run();
        h.requests[0].resolve({ url });
        await p;
        assert.equal(h.tabs[0].closed, true);
        assert.equal(h.tabs[0].urls.length, 0);
      }
    },
  );
  test(c.name + ": manually closed reservation remains retryable", async () => {
    const h = await harness(c),
      p = h.run();
    h.tabs[0].close();
    h.requests[0].resolve({ url: "https://files.example.test/x.pdf" });
    await p;
    assert.equal(h.tabs[0].urls.length, 0);
    const retry = h.run();
    h.requests[1].resolve({ url: "https://files.example.test/y.pdf" });
    await retry;
    assert.equal(h.tabs[1].urls.length, 1);
  });
}

test("editor: local fictitious file opens without upload and releases its object URL", async () => {
  const h = await harness(cases[2]);
  await h.run({ key: "local", file: { name: "ficticio.pdf" } });
  assert.equal(h.requests.length, 0);
  assert.deepEqual(h.tabs[0].urls, [
    "blob:https://portal.example.test/local-qa",
  ]);
  assert.equal(h.timers.length, 1);
  h.timers[0]();
  assert.deepEqual(h.revoked, ["blob:https://portal.example.test/local-qa"]);
});
