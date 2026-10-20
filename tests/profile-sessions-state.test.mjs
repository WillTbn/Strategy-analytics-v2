import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { parse, compileTemplate } from "@vue/compiler-sfc";
import * as Vue from "vue";
import { renderToString } from "@vue/server-renderer";
import { sessionRows } from "../src/services/profileSessions.js";
import { collection } from "../src/services/profilePresentation.js";

const source = readFileSync(new URL("../src/system/components/setting/LoginSetting.vue", import.meta.url), "utf8");
const descriptor = parse(source).descriptor;
const context = vm.createContext({});
const fixture = (id) => ({ sessionId: id, createdAtUtc: "2026-10-20T12:00:00Z", ipAddress: "192.0.2.12", userAgent: "Navegador de teste", isCurrent: false });
async function harness() {
  const requests = [], disposed = [];
  let session = 0;
  const modules = {
    vue: { ref: Vue.ref, onScopeDispose: (fn) => disposed.push(fn) },
    "src/system/components/TextareaTitle.vue": { default: {} },
    "src/services/clientAccountService": {
      listSessions: () => new Promise((resolve, reject) => requests.push({ resolve, reject })),
      revokeSession: async () => { throw new Error("Unexpected write"); },
    },
    "src/services/clientAuthService": { getApiErrorMessage: () => "Falha ao consultar sessões." },
    "src/services/clientApi": { captureClientSession: () => session, isClientSessionCurrent: (snapshot) => snapshot === session },
    "src/composables/system/useAuth": { default: () => ({ setLogout: async () => { throw new Error("Unexpected logout"); } }) },
    "src/services/profilePresentation": { collection },
    "src/services/profileSessions": { sessionRows },
  };
  const mod = new vm.SourceTextModule(descriptor.scriptSetup.content + "\nexport { load, rows, loading, error };", { context });
  await mod.link((specifier) => {
    const values = modules[specifier];
    assert.ok(values, "Unexpected import: " + specifier);
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await mod.evaluate();
  return { model: mod.namespace, requests, dispose: () => disposed.forEach((fn) => fn()), changeSession: () => session++ };
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
test("an older sessions error cannot replace a newer successful retry", async () => {
  const { model, requests } = await harness();
  const retry = model.load();
  requests[1].resolve([fixture("new")]);
  await retry;
  requests[0].reject(new Error("old failure"));
  await flush();
  assert.equal(model.error.value, "");
  assert.equal(model.rows.value[0].sessionId, "new");
  assert.equal(model.loading.value, false);
});
test("an older sessions success cannot hide the latest failed request", async () => {
  const { model, requests } = await harness();
  const retry = model.load();
  requests[1].reject(new Error("latest failure"));
  await retry;
  requests[0].resolve([fixture("old")]);
  await flush();
  assert.equal(model.error.value, "Falha ao consultar sessões.");
  assert.equal(model.rows.value.length, 0);
  assert.equal(model.loading.value, false);
});
test("session changes and disposed views ignore late session errors", async () => {
  for (const invalidate of ["changeSession", "dispose"]) {
    const h = await harness();
    h[invalidate]();
    h.requests[0].reject(new Error("late failure"));
    await flush();
    assert.equal(h.model.error.value, "");
    assert.equal(h.model.rows.value.length, 0);
  }
});
test("retry clears only the failed sessions state and restores real masked rows", async () => {
  const { model, requests } = await harness();
  requests[0].reject(new Error("failure"));
  await flush();
  assert.equal(model.error.value, "Falha ao consultar sessões.");
  const retry = model.load();
  assert.equal(model.error.value, "");
  assert.equal(model.loading.value, true);
  requests[1].resolve([fixture("current")]);
  await retry;
  assert.equal(model.rows.value[0].ip, "192.0.***.***");
  assert.equal(model.rows.value[0].equipment, "Navegador de teste");
  assert.equal(model.loading.value, false);
});

const compiled = compileTemplate({
  source: descriptor.template.content,
  filename: "LoginSetting.vue",
  id: "session-state-test",
  compilerOptions: { mode: "function" },
});
assert.deepEqual(compiled.errors, []);
const render = new Function("Vue", compiled.code)(Vue);
const renderState = (state) => renderToString(Vue.createSSRApp({
  setup: () => ({ rows: [], columns: [], loading: false, error: "", revoking: null, load() {}, handleLogout() {}, ...state }),
  components: {
    TextareaTitle: { props: ["text"], render() { return Vue.h("h2", this.text); } },
    QCard: { render() { return Vue.h("section", this.$slots.default?.()); } },
    QBtn: { props: ["label"], render() { return Vue.h("button", this.label); } },
    QTable: {
      props: ["rows", "noDataLabel"],
      render() {
        return Vue.h("div", this.rows.length ? this.rows.map((row) => Vue.h("span", row.equipment)) :
          this.$slots["no-data"] ? this.$slots["no-data"]() : this.noDataLabel);
      },
    },
  },
  render,
}));
test("loading and failure never claim the account has no sessions", async () => {
  const failed = await renderState({ error: "Consulta indisponível" });
  assert.match(failed, /Consulta indisponível/);
  assert.match(failed, /<button[^>]*>Tentar novamente<\/button>/);
  assert.doesNotMatch(failed, /Nenhuma sessão disponível/);
  const loading = await renderState({ loading: true });
  assert.doesNotMatch(loading, /Nenhuma sessão disponível/);
});
test("a successful empty response keeps the existing empty text and actual sessions remain visible", async () => {
  assert.match(await renderState({}), /Nenhuma sessão disponível/);
  const loaded = await renderState({ rows: sessionRows([fixture("loaded")]) });
  assert.match(loaded, /Navegador de teste/);
  assert.doesNotMatch(loaded, /Nenhuma sessão disponível/);
});
