import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { parse } from "@vue/compiler-sfc";
import * as Vue from "vue";

const component = parse(
  readFileSync(
    new URL("../src/system/pages/contract/ContractPage.vue", import.meta.url),
    "utf8",
  ),
).descriptor;
const resourceSource = readFileSync(
  new URL("../src/composables/useFinanceResource.js", import.meta.url),
  "utf8",
);
const flush = async () => {
  await Vue.nextTick();
  for (let i = 0; i < 10; i++) await Promise.resolve();
};
async function harness({ popupAllowed = true } = {}) {
  const route = Vue.reactive({ name: "contract", params: { id: "a" } }),
    reads = [],
    tabs = [],
    disposers = [];
  let session = 0;
  const context = vm.createContext({
    URL,
    window: {
      open() {
        if (!popupAllowed) return null;
        const tab = {
          closed: false,
          destinations: [],
          opener: undefined,
          close() {
            this.closed = true;
          },
        };
        tab.location = {
          replace(url) {
            tab.destinations.push(url);
          },
        };
        tabs.push(tab);
        return tab;
      },
    },
  });
  const stubs = {
    vue: {
      ref: Vue.ref,
      watch: Vue.watch,
      reactive: Vue.reactive,
      onScopeDispose: (callback) => disposers.push(callback),
    },
    "vue-router": { useRoute: () => route },
    "src/services/clientApi": {
      captureClientSession: () => session,
      isClientSessionCurrent: (value) => value === session,
    },
    "src/services/onboardingBlock": { onboardingBlockMessage: () => null },
    "src/services/financeService": {
      financeGet: (path) =>
        new Promise((resolve, reject) => reads.push({ path, resolve, reject })),
      financeLabel: (v) => v || "—",
      money: (v) => v,
      dateLabel: (v) => v,
      columns: (definitions) => definitions,
    },
    "../../components/TitlePage.vue": { default: {} },
    "../../components/finance/ResourceState.vue": { default: {} },
  };
  const cache = new Map();
  async function link(specifier) {
    if (cache.has(specifier)) return cache.get(specifier);
    let mod;
    if (specifier === "src/composables/useFinanceResource") {
      mod = new vm.SourceTextModule(resourceSource, { context });
      cache.set(specifier, mod);
      await mod.link(link);
    } else {
      const values = stubs[specifier];
      assert.ok(values, specifier);
      mod = new vm.SyntheticModule(
        Object.keys(values),
        function () {
          for (const [key, value] of Object.entries(values))
            this.setExport(key, value);
        },
        { context },
      );
      cache.set(specifier, mod);
    }
    return mod;
  }
  const mod = new vm.SourceTextModule(
    component.scriptSetup.content +
      "\nexport { detail, documents, history, opening, error, loadDetail, loadDocuments, loadHistory, openDocument };",
    { context },
  );
  await mod.link(link);
  await mod.evaluate();
  const settle = async (id = "a") => {
    for (const r of reads.filter(
      (r) =>
        !r.done &&
        !r.path.endsWith("temporary-url") &&
        r.path.startsWith("client/contracts/" + id),
    )) {
      r.done = true;
      r.resolve({
        data: r.path.endsWith("/documents")
          ? [{ documentId: "doc-" + id }]
          : r.path.endsWith("/history")
            ? []
            : { id, name: "Contrato " + id },
      });
    }
    await flush();
  };
  await settle();
  return {
    model: mod.namespace,
    reads,
    tabs,
    route,
    settle,
    temporary: () => reads.filter((r) => r.path.endsWith("temporary-url")),
    changeSession: () => session++,
    dispose: () => disposers.forEach((fn) => fn()),
  };
}

test("double activation starts only one document request and opens one tab", async () => {
  const h = await harness();
  const first = h.model.openDocument("doc-a"),
    second = h.model.openDocument("doc-a");
  assert.equal(h.temporary().length, 1);
  assert.equal(h.tabs.length, 1);
  h.temporary()[0].resolve({
    data: { url: "https://files.example.test/a.pdf" },
  });
  await Promise.all([first, second]);
  assert.deepEqual(h.tabs[0].destinations, [
    "https://files.example.test/a.pdf",
  ]);
});
test("changing contract closes a pending tab and ignores its late URL", async () => {
  const h = await harness(),
    pending = h.model.openDocument("doc-a");
  h.route.params.id = "b";
  await flush();
  await h.settle("b");
  assert.equal(h.tabs[0].closed, true);
  h.temporary()[0].resolve({
    data: { url: "https://files.example.test/old.pdf" },
  });
  await pending;
  assert.deepEqual(h.tabs[0].destinations, []);
  assert.equal(h.model.detail.state.data.id, "b");
  assert.equal(h.model.error.value, "");
});
test("an old failure cannot overwrite a new opening or error after changing contract", async () => {
  const h = await harness(),
    old = h.model.openDocument("doc-a");
  h.route.params.id = "b";
  await flush();
  await h.settle("b");
  const current = h.model.openDocument("doc-b");
  h.temporary()[0].reject(Error("old failure"));
  await old;
  assert.equal(h.model.error.value, "");
  assert.equal(h.model.opening.value, "doc-b");
  h.temporary()[1].resolve({
    data: { url: "https://files.example.test/current.pdf" },
  });
  await current;
  assert.equal(h.model.opening.value, null);
  assert.deepEqual(h.tabs[1].destinations, [
    "https://files.example.test/current.pdf",
  ]);
});
test("leaving closes pending tabs, clears sensitive sections and suppresses late errors", async () => {
  const h = await harness(),
    pending = h.model.openDocument("doc-a");
  h.dispose();
  assert.equal(h.tabs[0].closed, true);
  h.temporary()[0].reject(Error("late error"));
  await pending;
  assert.equal(h.model.error.value, "");
  for (const key of ["detail", "documents", "history"])
    assert.equal(h.model[key].state.data, null);
});
test("a response from the previous session cannot open a document", async () => {
  const h = await harness(),
    pending = h.model.openDocument("doc-a");
  h.changeSession();
  h.temporary()[0].resolve({
    data: { url: "https://files.example.test/old-session.pdf" },
  });
  await pending;
  assert.equal(h.tabs[0].closed, true);
  assert.deepEqual(h.tabs[0].destinations, []);
  assert.equal(h.model.error.value, "");
});
test("blocked popups make no temporary-URL request and keep the existing recovery message", async () => {
  const h = await harness({ popupAllowed: false });
  const pending = h.model.openDocument("doc-a");
  for (const r of h.temporary())
    r.resolve({ data: { url: "https://files.example.test/test.pdf" } });
  await pending;
  assert.equal(h.temporary().length, 0);
  assert.match(h.model.error.value, /Permita a abertura/);
  assert.equal(h.model.opening.value, null);
});
test("invalid URLs close the blank tab and a failed document can be retried", async () => {
  const h = await harness(),
    first = h.model.openDocument("doc-a");
  h.temporary()[0].resolve({
    data: { url: "http://unsafe.example.test/file" },
  });
  await first;
  assert.equal(h.tabs[0].closed, true);
  assert.match(h.model.error.value, /Não foi possível/);
  const retry = h.model.openDocument("doc-a");
  h.temporary()[1].resolve({
    data: { url: "https://files.example.test/retry.pdf" },
  });
  await retry;
  assert.equal(h.model.error.value, "");
  assert.deepEqual(h.tabs[1].destinations, [
    "https://files.example.test/retry.pdf",
  ]);
});
test("route changes clear document errors and old reads cannot overwrite the new contract", async () => {
  const h = await harness(),
    pending = h.model.openDocument("doc-a");
  h.temporary()[0].reject(Error("failed"));
  await pending;
  assert.ok(h.model.error.value);
  const old = h.model.loadDetail(),
    read = h.reads.at(-1);
  h.route.params.id = "b";
  await flush();
  await h.settle("b");
  read.resolve({ data: { id: "a" } });
  await old;
  assert.equal(h.model.detail.state.data.id, "b");
  assert.equal(h.model.error.value, "");
});
test("a document-section failure leaves detail and history usable, and retry recovers", async () => {
  const h = await harness();
  const failed = h.model.loadDocuments();
  h.reads.at(-1).reject(Error("unavailable"));
  await failed;
  assert.ok(h.model.documents.state.error);
  assert.equal(h.model.detail.state.data.id, "a");
  assert.deepEqual(Array.from(h.model.history.state.data), []);
  const retry = h.model.loadDocuments();
  h.reads.at(-1).resolve({ data: [{ documentId: "doc-a" }] });
  await retry;
  assert.equal(h.model.documents.state.error, "");
  assert.equal(h.model.documents.state.data[0].documentId, "doc-a");
});

test("leaving preserves a document that already opened successfully", async () => {
  const h = await harness(),
    pending = h.model.openDocument("doc-a");
  h.temporary()[0].resolve({
    data: { url: "https://files.example.test/opened.pdf" },
  });
  await pending;
  h.dispose();
  assert.equal(h.tabs[0].closed, false);
  assert.deepEqual(h.tabs[0].destinations, [
    "https://files.example.test/opened.pdf",
  ]);
});
test("an old document ID cannot start an opening in another contract", async () => {
  const h = await harness();
  h.route.params.id = "b";
  await flush();
  await h.settle("b");
  await h.model.openDocument("doc-a");
  assert.equal(h.temporary().length, 0);
  assert.equal(h.tabs.length, 0);
});
test("session changes suppress stale data and errors in independent reads", async () => {
  for (const fails of [false, true]) {
    const h = await harness();
    const pending = h.model.loadDetail(),
      request = h.reads.at(-1);
    h.changeSession();
    if (fails) request.reject(Error("previous session"));
    else request.resolve({ data: { id: "old-account" } });
    await pending;
    assert.equal(h.model.detail.state.data, null);
    assert.equal(h.model.detail.state.error, "");
  }
});
test("closing the blank tab while loading cannot navigate it on completion", async () => {
  const h = await harness(),
    pending = h.model.openDocument("doc-a");
  h.tabs[0].close();
  h.temporary()[0].resolve({
    data: { url: "https://files.example.test/closed.pdf" },
  });
  await pending;
  assert.deepEqual(h.tabs[0].destinations, []);
  assert.equal(h.model.opening.value, null);
});

test("leaving for another route never requests contracts for that route's ID or undefined", async () => {
  const h = await harness(),
    count = h.reads.length;
  h.route.name = "Contratos";
  h.route.params.id = undefined;
  await flush();
  assert.equal(h.reads.length, count);
  h.route.name = "transaction";
  h.route.params.id = "transaction-id";
  await flush();
  assert.equal(h.reads.length, count);
  assert.equal(h.model.detail.state.data, null);
});
