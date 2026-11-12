import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { parse, compileTemplate } from "@vue/compiler-sfc";
import * as Vue from "vue";
import { renderToString } from "@vue/server-renderer";
const file = "../src/system/components/finance/FinanceTable.vue";
const descriptor = parse(
  readFileSync(new URL(file, import.meta.url), "utf8"),
).descriptor;
const resourceSource = readFileSync(
  new URL("../src/composables/useFinanceResource.js", import.meta.url),
  "utf8",
);
const flush = async () => {
  await Vue.nextTick();
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
async function harness() {
  const props = Vue.reactive({
      path: "client/contracts",
      params: {},
      columns: [],
      rowKey: "id",
    }),
    reads = [],
    disposers = [];
  let session = 0;
  const context = vm.createContext({
    defineProps: () => props,
    defineExpose: () => {},
  });
  const modules = {
    vue: {
      reactive: Vue.reactive,
      computed: Vue.computed,
      ref: Vue.ref,
      watch: Vue.watch,
      onScopeDispose: (fn) => disposers.push(fn),
    },
    "./ResourceState.vue": { default: {} },
    "src/services/onboardingBlock": { onboardingBlockMessage: () => null },
    "src/services/clientApi": {
      captureClientSession: () => session,
      isClientSessionCurrent: (value) => value === session,
    },
    "src/services/financeService": {
      financeGet: (path, params) =>
        new Promise((resolve, reject) =>
          reads.push({ path, params, resolve, reject }),
        ),
    },
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
      const values = modules[specifier];
      assert.ok(values, specifier);
      mod = new vm.SyntheticModule(
        Object.keys(values),
        function () {
          for (const [k, v] of Object.entries(values)) this.setExport(k, v);
        },
        { context },
      );
      cache.set(specifier, mod);
    }
    return mod;
  }
  const mod = new vm.SourceTextModule(
    descriptor.scriptSetup.content +
      "\nexport { resource, page, rows, total, pages, reload };",
    { context },
  );
  await mod.link(link);
  await mod.evaluate();
  return {
    model: mod.namespace,
    props,
    reads,
    dispose: () => disposers.forEach((fn) => fn()),
    changeSession: () => session++,
  };
}
const response = (ids, total = ids.length, pages = 1) => ({
  data: ids.map((id) => ({ id })),
  pagination: { totalItems: total, totalPages: pages },
});
const compiled = compileTemplate({
  source: descriptor.template.content,
  filename: file,
  id: "finance-table",
  compilerOptions: { mode: "function" },
});
assert.deepEqual(compiled.errors, []);
const render = new Function("Vue", compiled.code)(Vue);
const renderModel = (h) =>
  renderToString(
    Vue.createSSRApp({
      render,
      setup: () => ({ ...h.model, ...h.props }),
      components: {
        ResourceState: {
          emits: ["retry"],
          props: ["state"],
          setup:
            (p, { slots }) =>
            () =>
              p.state.loading
                ? Vue.h("p", "Carregando")
                : p.state.error
                  ? Vue.h("p", p.state.error)
                  : slots.default?.(),
        },
        QTable: {
          props: ["rows"],
          setup: (p) => () =>
            Vue.h(
              "p",
              p.rows.length
                ? "Tabela de contratos"
                : "Nenhum registro encontrado",
            ),
        },
        QPagination: {
          props: ["max"],
          setup: (p) => () => Vue.h("nav", String(p.max)),
        },
      },
    }),
  );
test("initial loading and errors never show a fabricated zero total", async () => {
  const h = await harness();
  let html = await renderModel(h);
  assert.doesNotMatch(html, /0 registros/);
  assert.match(html, /Carregando/);
  h.reads[0].reject(Error("controlled"));
  await flush();
  html = await renderModel(h);
  assert.doesNotMatch(html, /0 registros/);
  assert.doesNotMatch(html, /Nenhum registro encontrado/);
  const retry = h.model.reload();
  h.reads.at(-1).resolve(response([], 0, 0));
  await retry;
  html = await renderModel(h);
  assert.match(html, /0 registros/);
  assert.match(html, /Nenhum registro encontrado/);
});
test("filter change from a later page makes exactly one request for page one", async () => {
  const h = await harness();
  h.reads[0].resolve(response(["a"], 25, 3));
  await flush();
  h.model.page.value = 3;
  await flush();
  h.reads.at(-1).resolve(response(["last"], 25, 3));
  await flush();
  const before = h.reads.length;
  h.props.params.search = "new";
  await flush();
  assert.equal(h.reads.length, before + 1);
  assert.equal(h.reads.at(-1).params.page, 1);
});
test("shrinking result corrects the page without rendering that empty page or count", async () => {
  const h = await harness();
  h.reads[0].resolve(response(["first"], 25, 3));
  await flush();
  h.model.page.value = 3;
  await flush();
  h.reads.at(-1).resolve(response([], 1, 1));
  await flush();
  assert.equal(h.model.page.value, 1);
  assert.equal(h.reads.at(-1).params.page, 1);
  assert.equal(h.model.resource.state.loading, true);
  assert.doesNotMatch(
    await renderModel(h),
    /0 registros|Nenhum registro encontrado/,
  );
  h.reads.at(-1).resolve(response(["only"], 1, 1));
  await flush();
  assert.equal(h.model.rows.value[0].id, "only");
});
test("zero pages corrects to page one without ever requesting page zero", async () => {
  const h = await harness();
  h.reads[0].resolve(response(["first"], 25, 3));
  await flush();
  h.model.page.value = 3;
  await flush();
  h.reads.at(-1).resolve(response([], 0, 0));
  await flush();
  assert.equal(h.model.page.value, 1);
  assert.equal(h.reads.at(-1).params.page, 1);
  h.reads.at(-1).resolve(response([], 0, 0));
  await flush();
  assert.equal(h.model.total.value, 0);
});
test("disposing invalidates pending reads and prevents later reloads", async () => {
  const h = await harness();
  h.dispose();
  h.reads[0].resolve(response(["old"]));
  await flush();
  assert.equal(h.model.resource.state.data, null);
  const count = h.reads.length;
  await h.model.reload();
  assert.equal(h.reads.length, count);
});
test("a changed session cannot publish old rows or an old error", async () => {
  for (const fails of [false, true]) {
    const h = await harness();
    h.changeSession();
    if (fails) h.reads[0].reject(Error("old"));
    else h.reads[0].resolve(response(["other-account"]));
    await flush();
    assert.equal(h.model.resource.state.data, null);
    assert.equal(h.model.resource.state.error, "");
  }
});
test("an old page response cannot replace the latest selection", async () => {
  const h = await harness();
  h.reads[0].resolve(response(["first"], 25, 3));
  await flush();
  h.model.page.value = 2;
  await flush();
  const old = h.reads.at(-1);
  h.model.page.value = 3;
  await flush();
  h.reads.at(-1).resolve(response(["latest"], 25, 3));
  await flush();
  old.resolve(response(["old"], 25, 3));
  await flush();
  assert.equal(h.model.rows.value[0].id, "latest");
});

test("a successful response without pagination keeps the actual collection count", async () => {
  const h = await harness();
  h.reads[0].resolve({ data: [{ id: "one" }, { id: "two" }] });
  await flush();
  assert.equal(h.model.total.value, 2);
  assert.equal(h.model.pages.value, 1);
});
test("session-invalidated data does not turn into a false successful empty table", async () => {
  const h = await harness();
  h.changeSession();
  h.reads[0].resolve(response(["old"]));
  await flush();
  const html = await renderModel(h);
  assert.doesNotMatch(html, /0 registros|Nenhum registro encontrado/);
});
