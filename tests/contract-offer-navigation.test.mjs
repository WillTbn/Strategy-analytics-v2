import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { parse, compileScript } from "@vue/compiler-sfc";
import * as Vue from "vue";
import * as drafts from "../src/services/contractRequestDraft.js";
async function mount(submit = async () => ({ id: "qa" })) {
  const events = [],
    routes = [],
    store = Vue.reactive({ stepHighPerfomance: 1, highPerfomance: {} }),
    context = vm.createContext({ console, Function });
  const code = compileScript(
    parse(
      readFileSync(
        "src/system/layouts/contracts/OpportunityInvestment.vue",
        "utf8",
      ),
    ).descriptor,
    { id: "offer" },
  ).content;
  const module = new vm.SourceTextModule(code, { context });
  const deps = {
    vue: Vue,
    pinia: { storeToRefs: Vue.toRefs },
    "src/stores/investments": { useInvestmentStore: () => store },
    "src/services/contractRequestDraft": drafts,
    "vue-router": {
      useRouter: () => ({
        replace: (route) => {
          assert.equal(route.name, "Contratos");
          routes.push(route);
        },
      }),
    },
  };
  await module.link(async (name) => {
    const values = deps[name] || { default: {} };
    return new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const key in values) this.setExport(key, values[key]);
      },
      { context },
    );
  });
  await module.evaluate();
  const scope = Vue.effectScope(),
    props = Vue.reactive({ offer: true, submit }),
    h = scope.run(() =>
      module.namespace.default.setup(props, {
        expose() {},
        emit: (...args) => events.push(args),
      }),
    );
  return { h, store, events, routes, stop: () => scope.stop() };
}
test("success action closes the offer and uses the existing case-sensitive route name", async () => {
  const f = await mount();
  f.store.stepHighPerfomance = 6;
  f.h.goContract();
  assert.deepEqual(f.events, [["closed"]]);
  assert.equal(f.routes[0].name, "Contratos");
  f.stop();
  assert.equal(f.store.stepHighPerfomance, 1);
});
test("offer return is blocked while submit is pending and a failed submit never reaches success", async () => {
  let reject;
  const f = await mount(() => new Promise((_, r) => (reject = r)));
  f.store.highPerfomance = {
    objective: "Crescimento",
    time: "Curto",
    modality: "Aplicação Única",
    amount: "1.000,00",
    types: [1],
    regions: ["EUA"],
  };
  f.store.stepHighPerfomance = 5;
  const pending = f.h.increment();
  assert.equal(f.h.busy.value, true);
  f.h.goContract();
  assert.equal(f.routes.length, 0);
  reject(Error("Falha controlada"));
  await pending;
  assert.equal(f.store.stepHighPerfomance, 5);
  assert.equal(f.store.highPerfomance.amount, "1.000,00");
  assert.match(f.h.error.value, /Falha/);
  f.stop();
});
