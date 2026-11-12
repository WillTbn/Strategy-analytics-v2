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
async function harness({ popupAllowed = true } = {}) {
  const tabs = [],
    notifications = [],
    downloads = [],
    urls = [],
    revoked = [],
    blobs = [];
  const makeDocument = (destinations) => ({
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
    createElement: (tag) => ({
      tag,
      click() {
        if (destinations) destinations.push(this.href);
        else downloads.push({ href: this.href, name: this.download });
      },
    }),
  });
  class TestURL extends URL {
    static createObjectURL(blob) {
      blobs.push(blob);
      return "blob:test/" + urls.push(blob);
    }
    static revokeObjectURL(url) {
      revoked.push(url);
    }
  }
  const context = vm.createContext({
    URL: TestURL,
    Blob,
    setTimeout: (callback) => callback(),
    document: makeDocument(),
    window: {
      location: { origin: "https://portal.example.test" },
      open(url) {
        if (!popupAllowed) return null;
        const destinations = [];
        const tab = {
          closed: false,
          opener: {},
          document: makeDocument(destinations),
          destinations,
          close() {
            this.closed = true;
          },
        };
        tab.location = { replace: (url) => tab.destinations.push(url) };
        if (url) tab.destinations.push(url);
        tabs.push(tab);
        return tab;
      },
    },
  });
  const lists = [],
    terms = [],
    docs = [],
    dispose = [],
    fileRequests = [],
    urlRequests = [];
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
      downloadProfileTermDocument: (id) => pending(fileRequests, id),
      getProfileContractDocumentUrl: (contractId, documentId) =>
        pending(urlRequests, { contractId, documentId }),
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
        errorNotify(message) {
          notifications.push(message);
        },
      }),
    },
  };
  const mod = new vm.SourceTextModule(
    descriptor.scriptSetup.content +
      "\nexport { contracts, terms, loadContracts, loadTerms, download, downloading };",
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
    tabs,
    notifications,
    downloads,
    revoked,
    blobs,
    fileRequests,
    urlRequests,
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

const contractDownload = {
  key: "contract:document",
  name: "Arquivo fictício",
  contractId: "contract",
  documentId: "document",
  downloadable: true,
};
test("contract download reserves its tab in the click handler before waiting for its URL", async () => {
  const h = await harness(),
    pending = h.model.download(contractDownload);
  assert.equal(h.tabs.length, 1);
  assert.equal(h.tabs[0].opener, null);
  assert.equal(h.tabs[0].document.head.meta.name, "referrer");
  assert.equal(h.tabs[0].document.head.meta.content, "no-referrer");
  h.urlRequests[0].resolve({ url: "https://files.example.test/contract.pdf" });
  await pending;
  assert.deepEqual(h.tabs[0].destinations, [
    "https://files.example.test/contract.pdf",
  ]);
  assert.equal(h.tabs[0].document.body.link.referrerPolicy, "no-referrer");
  assert.equal(h.tabs[0].document.body.link.rel, "noopener noreferrer");
  h.dispose();
  assert.equal(h.tabs[0].closed, false);
});
test("a blocked popup prevents the temporary URL call and reports the existing recovery", async () => {
  const h = await harness({ popupAllowed: false }),
    pending = h.model.download(contractDownload);
  for (const request of h.urlRequests)
    request.resolve({ url: "https://files.example.test/contract.pdf" });
  await pending;
  assert.equal(h.urlRequests.length, 0);
  assert.match(h.notifications[0], /Permita a abertura/);
  assert.equal(h.model.downloading.value, null);
});
test("leaving Contracts and Terms closes a pending tab and ignores its late URL", async () => {
  const h = await harness(),
    pending = h.model.download(contractDownload);
  h.dispose();
  assert.equal(h.tabs[0]?.closed, true);
  h.urlRequests[0].resolve({ url: "https://files.example.test/late.pdf" });
  await pending;
  assert.deepEqual(h.tabs[0].destinations, []);
  assert.equal(h.notifications.length, 0);
});
test("session changes close the pending tab without exposing a stale URL or error", async () => {
  const h = await harness(),
    pending = h.model.download(contractDownload);
  h.changeSession();
  h.urlRequests[0].resolve({
    url: "https://files.example.test/old-session.pdf",
  });
  await pending;
  assert.equal(h.tabs[0]?.closed, true);
  assert.deepEqual(h.tabs[0].destinations, []);
  assert.equal(h.notifications.length, 0);
});
test("invalid URL or API failure closes its reserved tab and allows another attempt", async () => {
  for (const fail of [false, true]) {
    const h = await harness(),
      pending = h.model.download(contractDownload);
    if (fail) h.urlRequests[0].reject(Error("Falha controlada"));
    else h.urlRequests[0].resolve({ url: "javascript:alert(1)" });
    await pending;
    assert.equal(h.tabs[0]?.closed, true);
    assert.equal(h.notifications.length, 1);
    assert.equal(h.model.downloading.value, null);
    const retry = h.model.download(contractDownload);
    h.urlRequests[1].resolve({ url: "https://files.example.test/retry.pdf" });
    await retry;
    assert.deepEqual(h.tabs[1].destinations, [
      "https://files.example.test/retry.pdf",
    ]);
  }
});
test("double click starts only one contract URL call", async () => {
  const h = await harness(),
    one = h.model.download(contractDownload),
    two = h.model.download(contractDownload);
  assert.equal(h.urlRequests.length, 1);
  h.urlRequests[0].resolve({ url: "https://files.example.test/one.pdf" });
  await Promise.all([one, two]);
  assert.equal(h.tabs.length, 1);
});
test("leaving stops an old handler from initiating another download", async () => {
  const h = await harness();
  h.dispose();
  const pending = h.model.download(contractDownload);
  for (const request of h.urlRequests)
    request.resolve({ url: "https://files.example.test/old.pdf" });
  await pending;
  assert.equal(h.urlRequests.length, 0);
  assert.equal(h.tabs.length, 0);
});
test("a profile file uses its blob download and releases the URL without a popup", async () => {
  const h = await harness(),
    pending = h.model.download({
      key: "profile:file",
      name: "Arquivo fictício",
      profileDocumentId: "file",
      downloadable: true,
    });
  h.fileRequests[0].resolve({ data: new Blob(["FICTICIO"]) });
  await pending;
  assert.equal(h.tabs.length, 0);
  assert.equal(h.downloads.length, 1);
  assert.deepEqual(h.revoked, [h.downloads[0].href]);
});
test("term text is downloaded as plain text and never executes markup", async () => {
  const h = await harness();
  await h.model.download({
    key: "term",
    name: "Termo fictício",
    downloadable: true,
    content: { body: "<script>ficticio</script>" },
  });
  assert.equal(h.tabs.length, 0);
  assert.equal(h.blobs[0].type, "text/plain;charset=utf-8");
  assert.equal(await h.blobs[0].text(), "<script>ficticio</script>");
  assert.equal(h.downloads[0].name, "Termo fictício.txt");
});

test("leaving or changing session prevents a pending profile file from triggering a blob download", async () => {
  for (const invalidate of ["dispose", "changeSession"]) {
    const h = await harness(),
      pending = h.model.download({
        key: "file",
        name: "Fictício",
        profileDocumentId: "file",
        downloadable: true,
      });
    h[invalidate]();
    h.fileRequests[0].resolve({ data: new Blob(["fictício"]) });
    await pending;
    assert.equal(h.downloads.length, 0);
    assert.equal(h.blobs.length, 0);
    assert.equal(h.notifications.length, 0);
  }
});
test("a manually closed pending tab is not navigated when the URL arrives", async () => {
  const h = await harness(),
    pending = h.model.download(contractDownload);
  h.tabs[0].close();
  h.urlRequests[0].resolve({ url: "https://files.example.test/closed.pdf" });
  await pending;
  assert.deepEqual(h.tabs[0].destinations, []);
  assert.equal(h.notifications.length, 1);
  assert.equal(h.model.downloading.value, null);
});
