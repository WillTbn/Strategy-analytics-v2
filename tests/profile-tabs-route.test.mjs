import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { parse } from "@vue/compiler-sfc";
import * as Vue from "vue";
import { createRouter, createMemoryHistory } from "vue-router";

const descriptor = parse(
  readFileSync(
    new URL("../src/system/pages/Config/ProfilePage.vue", import.meta.url),
    "utf8",
  ),
).descriptor;
const flush = async () => {
  for (let i = 0; i < 35; i++) {
    await Promise.resolve();
    await Vue.nextTick();
  }
};
async function harness(query = { tab: "contracts", keep: "yes" }) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/system/config/profile", name: "profile", component: {} },
      { path: "/system/dashboard", name: "dashboard", component: {} },
    ],
  });
  router.onError(() => {});
  await router.replace({ name: "profile", query });
  await router.isReady();
  const route = Vue.shallowReactive(
    Object.defineProperties(
      {},
      {
        query: { get: () => router.currentRoute.value.query },
        name: { get: () => router.currentRoute.value.name },
      },
    ),
  );
  let delayed = false;
  const guards = [],
    disposers = [];
  router.beforeEach((to) =>
    delayed
      ? new Promise((resolve, reject) => guards.push({ to, resolve, reject }))
      : true,
  );
  const context = vm.createContext({});
  const modules = {
    vue: {
      defineComponent: Vue.defineComponent,
      ref: Vue.ref,
      watch: Vue.watch,
      onScopeDispose: (fn) => disposers.push(fn),
    },
    "vue-router": { useRoute: () => route, useRouter: () => router },
  };
  const mod = new vm.SourceTextModule(
    descriptor.scriptSetup.content + "\nexport { tab };",
    { context },
  );
  await mod.link((specifier) => {
    const values = modules[specifier] || { default: {} };
    return new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const [k, v] of Object.entries(values)) this.setExport(k, v);
      },
      { context },
    );
  });
  await mod.evaluate();
  await flush();
  return {
    router,
    model: mod.namespace,
    guards,
    delay: () => (delayed = true),
    dispose: () => disposers.forEach((fn) => fn()),
  };
}
test("the latest tab cancels a pending navigation even when returning to the current URL", async () => {
  const h = await harness();
  h.delay();
  h.model.tab.value = "documentation";
  await flush();
  assert.equal(h.guards.length, 1);
  h.model.tab.value = "contracts";
  await flush();
  assert.equal(h.guards.length, 2);
  h.guards[0].resolve();
  await flush();
  assert.equal(h.router.currentRoute.value.query.tab, "contracts");
  assert.equal(h.model.tab.value, "contracts");
  h.guards[1].resolve();
  await flush();
  assert.equal(h.model.tab.value, "contracts");
  assert.equal(h.router.currentRoute.value.query.tab, "contracts");
});
test("rapid choices and reversed guard completion preserve the last selection", async () => {
  const h = await harness();
  h.delay();
  for (const tab of ["documentation", "bank", "patrimonio"]) {
    h.model.tab.value = tab;
    await flush();
  }
  assert.equal(h.guards.length, 3);
  h.guards[2].resolve();
  await flush();
  h.guards[1].resolve();
  h.guards[0].resolve();
  await flush();
  assert.equal(h.model.tab.value, "patrimonio");
  assert.equal(h.router.currentRoute.value.query.tab, "patrimonio");
});
test("profile tab changes cannot modify the query of another route after leaving", async () => {
  const h = await harness();
  h.delay();
  h.model.tab.value = "documentation";
  await flush();
  const leave = h.router.push({ name: "dashboard" });
  await flush();
  h.guards[1].resolve();
  await leave;
  await flush();
  h.guards[0].resolve();
  await flush();
  assert.equal(h.router.currentRoute.value.name, "dashboard");
  assert.equal(h.router.currentRoute.value.query.tab, undefined);
  assert.equal(h.guards.length, 2);
  h.dispose();
  h.model.tab.value = "bank";
  await flush();
  assert.equal(h.guards.length, 2);
});
test("Back and Forward restore tab from query without adding navigation loops", async () => {
  const h = await harness();
  await h.router.push({ name: "profile", query: { tab: "bank" } });
  await flush();
  assert.equal(h.model.tab.value, "bank");
  h.router.back();
  await flush();
  assert.equal(h.router.currentRoute.value.query.tab, "contracts");
  assert.equal(h.model.tab.value, "contracts");
  h.router.forward();
  await flush();
  assert.equal(h.router.currentRoute.value.query.tab, "bank");
  assert.equal(h.model.tab.value, "bank");
});
test("missing or invalid tab falls back to personal when external navigation changes the URL", async () => {
  const h = await harness();
  await h.router.push({ name: "profile", query: { keep: "yes" } });
  await flush();
  assert.equal(h.model.tab.value, "personal");
  assert.equal(h.router.currentRoute.value.query.tab, undefined);
  await h.router.push({ name: "profile", query: { tab: "invalid" } });
  await flush();
  assert.equal(h.model.tab.value, "personal");
});
test("selecting another tab drops the bank action while preserving unrelated query", async () => {
  const h = await harness({ tab: "bank", action: "add", keep: "yes" });
  h.model.tab.value = "contracts";
  await flush();
  assert.equal(h.router.currentRoute.value.query.tab, "contracts");
  assert.equal(h.router.currentRoute.value.query.action, undefined);
  assert.equal(h.router.currentRoute.value.query.keep, "yes");
});
test("a rejected navigation restores the last committed tab and a retry remains possible", async () => {
  const h = await harness();
  h.delay();
  h.model.tab.value = "documentation";
  await flush();
  h.guards[0].reject(Error("controlled navigation failure"));
  await flush();
  assert.equal(h.model.tab.value, "contracts");
  h.model.tab.value = "bank";
  await flush();
  h.guards[1].resolve();
  await flush();
  assert.equal(h.model.tab.value, "bank");
  assert.equal(h.router.currentRoute.value.query.tab, "bank");
});

test("an aborted navigation returns the picker to the committed tab without a loop", async () => {
  const h = await harness();
  h.delay();
  h.model.tab.value = "documentation";
  await flush();
  h.guards[0].resolve(false);
  await flush();
  assert.equal(h.model.tab.value, "contracts");
  assert.equal(h.router.currentRoute.value.query.tab, "contracts");
  assert.equal(h.guards.length, 1);
});
