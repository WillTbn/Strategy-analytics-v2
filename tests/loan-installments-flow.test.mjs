import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import * as Vue from "vue";
import { parse, compileScript } from "@vue/compiler-sfc";
import * as rules from "../src/services/loanOfferPresentation.js";
import * as drafts from "../src/services/loanRequestDraft.js";
async function mount(overrides = {}) {
  const context = vm.createContext({ console, Function });
  const cache = new Map();
  const deps = {
    vue: Vue,
    "src/services/loanOfferPresentation": rules,
    "src/services/loanRequestDraft": drafts,
    "src/services/onboardingBlock": { onboardingBlockMessage: () => "" },
  };
  async function dependency(name) {
    if (cache.has(name)) return cache.get(name);
    if (name === "src/composables/useFinanceResource") {
      const module = new vm.SourceTextModule(
        readFileSync("src/composables/useFinanceResource.js", "utf8"),
        { context },
      );
      cache.set(name, module);
      await module.link(dependency);
      return module;
    }
    const values = deps[name] || { default: {} };
    const module = new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const key in values) this.setExport(key, values[key]);
      },
      { context },
    );
    cache.set(name, module);
    return module;
  }
  const file = "src/system/components/loan/../leverage/TableInstallments.vue";
  const { descriptor } = parse(readFileSync(file, "utf8"));
  const script = compileScript(descriptor, { id: file });
  const module = new vm.SourceTextModule(script.content, { context });
  await module.link(dependency);
  await module.evaluate();
  const props = Vue.reactive({
    parcelas: [paid, open, future],
    paidOff: false,
    paySelected: null,
    payOne: null,
    uploadReceipt: null,
    downloadStatement: null,
    anticipate: null,
    ...overrides,
  });
  const scope = Vue.effectScope();
  const h = scope.run(() =>
    module.namespace.default.setup(props, { expose() {}, emit() {} }),
  );

  return { h, props, stop: () => scope.stop() };
}

const paid = { numero: 1, status: "Pago: 04/05/25", valor: 100 },
  open = {
    numero: 2,
    status: "Atrasado: 2 dias",
    pagar_agora: true,
    valor: 100,
  },
  future = { numero: 3, status: "Em aberto", pagar_agora: false, valor: 100 };
test("pending toggle filters paid rows and does not mutate supplied installments", async () => {
  const f = await mount();
  f.h.pending.value = true;
  assert.equal(f.h.visibleRows.value.length, 2);
  assert.equal(f.props.parcelas.length, 3);
  f.stop();
});
test("payment handlers cannot act without callbacks or send a paid/future single installment", async () => {
  let calls = 0;
  const f = await mount({ payOne: async () => calls++ });
  await f.h.pagarParcela(paid);
  await f.h.pagarParcela(future);
  await f.h.pagarParcela(open);
  assert.equal(calls, 1);
  f.stop();
  const missing = await mount();
  await missing.h.pagarParcelasSelecionadas();
  assert.equal(missing.h.busy.value, false);
  missing.stop();
});
test("failed statement download preserves selection and retry is possible", async () => {
  let fail = true;
  const f = await mount({
    downloadStatement: async () => {
      if (fail) throw Error("qa");
    },
  });
  f.h.selected.value = [f.props.parcelas[1]];
  await f.h.baixarExtrato();
  assert.ok(f.h.error.value);
  assert.equal(f.h.selected.value.length, 1);
  fail = false;
  await f.h.baixarExtrato();
  assert.equal(f.h.error.value, "");
  f.stop();
});
test("new installment projection clears stale selection", async () => {
  const f = await mount();
  f.h.selected.value = [f.props.parcelas[1]];
  f.props.parcelas = [{ ...future }];
  await Vue.nextTick();
  assert.equal(f.h.selected.value.length, 0);
  f.stop();
});
