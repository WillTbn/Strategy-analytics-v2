import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { parse, compileTemplate } from "@vue/compiler-sfc";
import * as Vue from "vue";
import { renderToString } from "@vue/server-renderer";
import { collection } from "../src/services/profilePresentation.js";

const file = "../src/system/layouts/config/TermsContractLayouts.vue";
const descriptor = parse(
  readFileSync(new URL(file, import.meta.url), "utf8"),
).descriptor;
const pending = (queue, value) =>
  new Promise((resolve, reject) => queue.push({ resolve, reject, value }));
async function harness() {
  const context = vm.createContext({});
  const lists = [],
    terms = [],
    docs = [],
    dispose = [];
  let session = 0;
  const modules = {
    vue: {
      computed: Vue.computed,
      reactive: Vue.reactive,
      ref: Vue.ref,
      onScopeDispose: (fn) => dispose.push(fn),
    },
    "src/services/profileDocumentsService": {
      listProfileContracts: (page) => pending(lists, page),
      listProfileContractDocuments: (id) => pending(docs, id),
      listProfileTerms: () => pending(terms),
      getProfileContractDocumentUrl: () => {
        throw Error("Unexpected download");
      },
    },
    "src/services/profilePresentation": { collection },
    "src/services/clientAuthService": { getApiErrorMessage: (e) => e.message },
    "src/services/clientApi": {
      captureClientSession: () => session,
      isClientSessionCurrent: (value) => value === session,
      assertClientSessionCurrent: (value) => {
        if (value !== session) throw Error("changed session");
      },
    },
    "src/composables/useNotify": {
      default: () => ({
        errorNotify() {
          throw Error("Unexpected notification");
        },
      }),
    },
  };
  const mod = new vm.SourceTextModule(
    descriptor.scriptSetup.content +
      "\nexport { contracts, terms, loadContracts, loadTerms };",
    { context },
  );
  await mod.link((specifier) => {
    const values = modules[specifier];
    assert.ok(values, specifier);
    return new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const [key, value] of Object.entries(values))
          this.setExport(key, value);
      },
      { context },
    );
  });
  await mod.evaluate();
  return {
    model: mod.namespace,
    lists,
    terms,
    docs,
    dispose: () => dispose.forEach((fn) => fn()),
    changeSession: () => session++,
  };
}
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
const contract = (id) => ({ id, name: "Contrato " + id });
const document = (id) => ({ documentId: id, fileName: "Documento " + id });
test("older contract error cannot replace a successful retry", async () => {
  const h = await harness(),
    retry = h.model.loadContracts();
  h.lists[1].resolve([contract("current")]);
  await flush();
  h.docs[0].resolve([document("current")]);
  await retry;
  h.lists[0].reject(Error("old failure"));
  await flush();
  assert.equal(h.model.contracts.error, "");
  assert.equal(h.model.contracts.items[0].documentId, "current");
});
test("older contract details cannot replace the latest failed retry", async () => {
  const h = await harness();
  h.lists[0].resolve([contract("old")]);
  await flush();
  const retry = h.model.loadContracts();
  h.lists[1].reject(Error("latest failure"));
  await retry;
  h.docs[0].resolve([document("old")]);
  await flush();
  assert.equal(h.model.contracts.error, "latest failure");
  assert.equal(h.model.contracts.items.length, 0);
});
test("superseded pagination does not request additional pages or documents", async () => {
  const h = await harness(),
    retry = h.model.loadContracts();
  h.lists[0].resolve(
    Array.from({ length: 100 }, (_, i) => contract("old" + i)),
  );
  await flush();
  assert.equal(h.lists.length, 2);
  assert.equal(h.docs.length, 0);
  assert.equal(h.model.contracts.loading, true);
  h.lists[1].resolve([]);
  await retry;
  assert.equal(h.model.contracts.items.length, 0);
  assert.equal(h.model.contracts.error, "");
});
test("terms loading remains active when an old request finishes first", async () => {
  const h = await harness(),
    retry = h.model.loadTerms();
  h.terms[0].resolve({ items: [{ versionId: "old", code: "old" }] });
  await flush();
  assert.equal(h.model.terms.loading, true);
  assert.equal(h.model.terms.items.length, 0);
  h.terms[1].resolve({ items: [] });
  await retry;
  assert.equal(h.model.terms.loading, false);
  assert.equal(h.model.terms.items.length, 0);
});
test("older terms error cannot overwrite the latest successful response", async () => {
  const h = await harness(),
    retry = h.model.loadTerms();
  h.terms[1].resolve({ items: [{ versionId: "new", code: "new" }] });
  await retry;
  h.terms[0].reject(Error("old terms error"));
  await flush();
  assert.equal(h.model.terms.error, "");
  assert.equal(h.model.terms.items[0].key, "new");
});
test("disposal and changed sessions stop late data publication and child requests", async () => {
  for (const invalidate of ["dispose", "changeSession"]) {
    const h = await harness();
    h[invalidate]();
    h.lists[0].resolve([contract("old")]);
    h.terms[0].reject(Error("old failure"));
    await flush();
    assert.equal(h.docs.length, 0);
    assert.equal(h.model.contracts.items.length, 0);
    assert.equal(h.model.contracts.error, "");
    assert.equal(h.model.terms.error, "");
  }
});
test("partial document failure keeps available files and does not block the terms section", async () => {
  const h = await harness();
  h.lists[0].resolve([contract("one"), contract("two")]);
  await flush();
  h.docs[0].resolve([document("one")]);
  h.docs[1].reject(Error("unavailable"));
  h.terms[0].resolve({ items: [{ versionId: "term", code: "term" }] });
  await flush();
  assert.match(h.model.contracts.error, /todos os contratos/);
  assert.equal(h.model.contracts.items.length, 1);
  assert.equal(h.model.terms.items[0].key, "term");
  assert.equal(h.model.terms.error, "");
});
const compiled = compileTemplate({
  source: descriptor.template.content,
  filename: file,
  id: "profile-documents",
  compilerOptions: { mode: "function" },
});
assert.deepEqual(compiled.errors, []);
const render = new Function("Vue", compiled.code)(Vue);
const renderState = (sections) =>
  renderToString(
    Vue.createSSRApp({
      render,
      setup: () => ({ sections, downloading: null, download() {} }),
      components: {
        QCard: {
          setup:
            (_, { slots }) =>
            () =>
              Vue.h("section", slots.default?.()),
        },
        QBtn: {
          props: ["label"],
          setup: (props) => () => Vue.h("button", props.label),
        },
        QSpinner: { render: () => Vue.h("span", "spinner") },
        QIcon: { render: () => null },
      },
    }),
  );
test("real template distinguishes errors and loading from a successful empty section", async () => {
  for (const state of [
    { loading: true, error: "" },
    { loading: false, error: "Consulta indisponível" },
  ]) {
    const html = await renderState([
      { key: "contracts", title: "Contratos", items: [], ...state, load() {} },
    ]);
    assert.doesNotMatch(html, /Nenhum documento disponível/);
    if (state.error) {
      assert.match(html, /Consulta indisponível/);
      assert.match(html, />Tentar novamente<\/button>/);
    }
  }
  const html = await renderState([
    {
      key: "contracts",
      title: "Contratos",
      items: [],
      loading: false,
      error: "",
      load() {},
    },
  ]);
  assert.match(html, /Nenhum documento disponível/);
});
