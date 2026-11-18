import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import * as Vue from "vue";
import { parse, compileScript } from "@vue/compiler-sfc";
import * as payments from "../src/services/loanPaymentPresentation.js";
import * as summary from "../src/services/loanSummaryPresentation.js";
async function mount(overrides = {}) {
  const context = vm.createContext({ console, Function }),
    cache = new Map();
  const deps = {
    vue: Vue,
    "src/services/loanPaymentPresentation": payments,
    "src/services/loanSummaryPresentation": summary,
    "src/services/onboardingBlock": { onboardingBlockMessage: () => "" },
  };
  async function dependency(name) {
    if (cache.has(name)) return cache.get(name);
    let module;
    if (name === "src/composables/useFinanceResource")
      module = new vm.SourceTextModule(
        readFileSync("src/composables/useFinanceResource.js", "utf8"),
        { context },
      );
    else {
      const values = deps[name] || { default: {} };
      module = new vm.SyntheticModule(
        Object.keys(values),
        function () {
          for (const key in values) this.setExport(key, values[key]);
        },
        { context },
      );
    }
    cache.set(name, module);
    await module.link(dependency);
    return module;
  }
  const file = "src/system/components/leverage/LeverageInstallments.vue";
  const module = new vm.SourceTextModule(
    compileScript(parse(readFileSync(file, "utf8")).descriptor, {
      id: file,
    }).content,
    { context },
  );
  await module.link(dependency);
  await module.evaluate();
  const props = Vue.reactive({
      loan: { id: "loan-1", currencyIsoCode: "BRL" },
      adapter: null,
      ...overrides,
    }),
    scope = Vue.effectScope();
  const h = scope.run(() =>
    module.namespace.default.setup(props, { expose() {}, emit() {} }),
  );
  await Vue.nextTick();
  return { props, h, stop: () => scope.stop() };
}
const rows = [{ numero: 11, status: "Em aberto" }];
const result = () => ({
  quote: {
    currency: "BRL",
    paymentDate: "2026-11-18",
    grossAmount: 100,
    discountAmount: 0,
    totalAmount: 100,
  },
  pixCode: "FICTICIO",
  pixKey: "QA",
});
test("missing adapter leaves all payment actions unavailable and never creates a session", async () => {
  const f = await mount();
  await f.h.beginPayment(rows);
  assert.equal(f.h.canPay.value, false);
  assert.equal(f.h.session.value, null);
  assert.equal(f.h.paymentOpen.value, false);
  f.stop();
});
test("failed installment consultation can retry independently without exposing raw error", async () => {
  let fail = true;
  const f = await mount({
    adapter: {
      listInstallments: async () => {
        if (fail) throw Error("private detail");
        return rows;
      },
    },
  });
  await f.h.load();
  await new Promise(setImmediate);
  assert.match(f.h.resource.state.error, /Não foi possível/);
  assert.doesNotMatch(f.h.resource.state.error, /private/);
  fail = false;
  await f.h.load();
  await new Promise(setImmediate);
  assert.equal(f.h.resource.state.error, "");
  assert.equal(f.h.resource.state.data.length, 1);
  f.stop();
});
test("pending quote cannot duplicate and late result cannot open payment for another loan", async () => {
  let resolve,
    calls = 0;
  const f = await mount({
    adapter: {
      listInstallments: async () => rows,
      preparePayment: () => {
        calls++;
        return new Promise((r) => (resolve = r));
      },
      submitReceipt: async () => ({ submitted: true }),
    },
  });
  await f.h.load();
  await new Promise(setImmediate);
  const pending = f.h.beginPayment(rows);
  await f.h.beginPayment(rows);
  assert.equal(calls, 1);
  f.props.loan = { id: "loan-2", currencyIsoCode: "BRL" };
  await Vue.nextTick();
  resolve(result());
  await pending;
  assert.equal(f.h.session.value, null);
  assert.equal(f.h.paymentOpen.value, false);
  f.stop();
});
test("receipt response after closing the session cannot confirm payment and refresh preserves server status", async () => {
  let resolve;
  const f = await mount({
    adapter: {
      listInstallments: async () => rows,
      preparePayment: async () => result(),
      submitReceipt: () => new Promise((r) => (resolve = r)),
    },
  });
  await f.h.load();
  await new Promise(setImmediate);
  await f.h.beginPayment(rows);
  assert.equal(f.h.paymentOpen.value, true);
  const pending = f.h.uploadPaymentReceipt({ name: "ficticio.txt", size: 1 });
  f.h.close();
  resolve({ submitted: true });
  await assert.rejects(pending, /alterado/);
  f.h.completed();
  await new Promise(setImmediate);
  assert.equal(f.h.resource.state.data[0].status, "Em aberto");
  assert.equal(f.h.session.value, null);
  f.stop();
});

test("changing loans releases the old preparation lock without letting its response unlock the new one", async () => {
  const resolvers = {},
    calls = [];
  const f = await mount({
    adapter: {
      listInstallments: async () => rows,
      preparePayment: (loan) => {
        calls.push(loan.id);
        return new Promise((r) => (resolvers[loan.id] = r));
      },
      submitReceipt: async () => ({ submitted: true }),
    },
  });
  await f.h.load();
  const old = f.h.beginPayment(rows);
  f.props.loan = { id: "loan-2", currencyIsoCode: "BRL" };
  await Vue.nextTick();
  await f.h.load();
  const current = f.h.beginPayment(rows);
  resolvers["loan-1"](result());
  await old;
  await f.h.beginPayment(rows);
  assert.equal(calls.length, 2);
  assert.equal(f.h.paymentOpen.value, false);
  resolvers["loan-2"](result());
  await current;
  assert.equal(f.h.session.value.loanId, "loan-2");
  assert.equal(f.h.paymentOpen.value, true);
  f.stop();
});
