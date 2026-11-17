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
  const file = "src/system/components/loan/LoanOffersScreen.vue";
  const { descriptor } = parse(readFileSync(file, "utf8"));
  const script = compileScript(descriptor, { id: file });
  const module = new vm.SourceTextModule(script.content, { context });
  await module.link(dependency);
  await module.evaluate();
  const props = Vue.reactive({
    kind: "final",
    securedType: "imovel",
    reader: async () => [row],
    openOffer: null,
    submitOffer: null,
    continueAction: null,
    initialAmount: null,
    initialInstallments: null,
    ...overrides,
  });
  const scope = Vue.effectScope();
  const h = scope.run(() =>
    module.namespace.default.setup(props, { expose() {}, emit() {} }),
  );
  await h.load();
  return { h, props, stop: () => scope.stop() };
}
const row = {
  id: "qa-offer",
  status: "Accepted",
  canSelect: true,
  amount: 200000,
  currency: "BRL",
  installments: 60,
  installmentAmount: 4000,
  interestRate: 1,
};
const flush = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};
test("opening an offer cannot display submission success, even if a reader returns a submitted-like property", async () => {
  const f = await mount({ openOffer: async () => ({ submitted: true }) });
  f.h.selectOffer(row);
  f.h.viewOffer(row);
  await flush();
  assert.equal(f.h.confirmation.value, null);
  assert.equal(f.h.selected.value.id, row.id);
  f.stop();
});
test("a pending submission is not sent twice and only a confirmed result enables success", async () => {
  let calls = 0,
    resolve;
  const f = await mount({
    submitOffer: () => {
      calls++;
      return new Promise((done) => {
        resolve = done;
      });
    },
  });
  f.h.selectOffer(row);
  f.h.requestOffer(row);
  f.h.requestOffer(row);
  assert.equal(calls, 1);
  assert.equal(f.h.busy.value, true);
  assert.equal(f.h.confirmation.value, null);
  resolve({ submitted: true });
  await flush();
  assert.equal(f.h.confirmation.value.submitted, true);
  assert.equal(f.h.busy.value, false);
  f.stop();
});
test("failed writes preserve selection; rejected or changed offers do not reach the writer", async () => {
  let calls = 0;
  const f = await mount({
    submitOffer: async () => {
      calls++;
      throw Error("controlled");
    },
  });
  f.h.selectOffer(row);
  f.h.requestOffer({ ...row, status: "Rejected" });
  f.h.requestOffer({ ...row, amount: 250000 });
  assert.equal(calls, 0);
  f.h.requestOffer(row);
  await flush();
  assert.equal(calls, 1);
  assert.equal(f.h.confirmation.value, null);
  assert.equal(f.h.selected.value.id, row.id);
  assert.ok(f.h.error.value);
  f.stop();
});
test("switching context invalidates a pending response and missing API adapters make no writes", async () => {
  let resolve;
  const f = await mount({
    submitOffer: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  f.h.requestOffer(row);
  f.props.kind = "consortium";
  await Vue.nextTick();
  resolve({ submitted: true });
  await flush();
  assert.equal(f.h.confirmation.value, null);
  f.stop();
  const unavailable = await mount({ reader: null });
  unavailable.h.requestOffer(row);
  await flush();
  assert.equal(unavailable.h.confirmation.value, null);
  assert.equal(unavailable.h.rows.value.length, 0);
  unavailable.stop();
});
