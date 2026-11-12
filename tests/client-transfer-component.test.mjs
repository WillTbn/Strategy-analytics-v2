import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { parse } from "@vue/compiler-sfc";
import * as Vue from "vue";
import * as model from "../src/services/clientTransferModel.js";
import * as walletModel from "../src/services/walletModel.js";
const flush = async () => {
  for (let i = 0; i < 15; i++) await Promise.resolve();
  await Vue.nextTick();
};
async function harness() {
  const emitted = [],
    writes = [],
    reads = [],
    disposals = [],
    timers = new Map();
  let version = 0,
    session = 0;
  const context = vm.createContext({
    Intl,
    Date,
    setTimeout: (fn) => {
      const id = ++version;
      timers.set(id, fn);
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    defineEmits:
      () =>
      (...v) =>
        emitted.push(v),
  });
  const wallet = {
    currencyId: "brl",
    currencyIsoCode: "BRL",
    type: "Free",
    available: 100,
  };
  const resource = {
    state: Vue.reactive({ data: null, error: "", loading: false }),
    async load(fn) {
      this.state.loading = true;
      try {
        this.state.data = await fn();
      } catch {
        this.state.error = "failed";
      } finally {
        this.state.loading = false;
      }
    },
    reset() {
      this.state.data = null;
    },
  };
  const modules = {
    vue: {
      computed: Vue.computed,
      reactive: Vue.reactive,
      ref: Vue.ref,
      watch: Vue.watch,
      onScopeDispose: (fn) => disposals.push(fn),
    },
    quasar: { useQuasar: () => ({ notify: () => {} }) },
    "src/system/components/form/MoneyInput.vue": { default: {} },
    "src/services/clientApi": {
      captureClientSession: () => session,
      assertClientSessionCurrent: (s) => {
        if (s !== session) throw new Error("session changed");
      },
      clientApi: {
        post: (...args) =>
          new Promise((resolve, reject) =>
            writes.push({ args, resolve, reject }),
          ),
      },
    },
    "src/services/financeService": {
      money: () => "formatted",
      financeGet: async (path) =>
        path === "client/wallets"
          ? { data: [wallet] }
          : new Promise((resolve, reject) =>
              reads.push({ path, resolve, reject }),
            ),
    },
    "src/composables/useFinanceResource": {
      useFinanceResource: () => resource,
    },
    "src/services/walletModel": walletModel,
    "src/services/clientTransferModel": model,
    "src/services/onboardingBlock": { onboardingBlockMessage: () => "" },
  };
  const code = parse(
    readFileSync(
      new URL(
        "../src/system/components/wallet/ClientTransferOperation.vue",
        import.meta.url,
      ),
      "utf8",
    ),
  ).descriptor.scriptSetup.content;
  const mod = new vm.SourceTextModule(
    code +
      "\nexport { form, recipient, recipientError, recipientLoading, canSubmit, confirm, error, busy };",
    { context },
  );
  await mod.link((spec) => {
    const values = modules[spec];
    assert.ok(values, spec);
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
    m: mod.namespace,
    reads,
    writes,
    emitted,
    async lookup(id) {
      mod.namespace.form.recipientStrategyId = id;
      await flush();
      const tasks = [...timers.values()];
      timers.clear();
      for (const task of tasks) task();
      await flush();
    },
    dispose() {
      disposals.forEach((fn) => fn());
    },
    changeSession() {
      session++;
    },
  };
}
test("component drops late recipient response and does not submit without current identity", async () => {
  const h = await harness();
  await h.lookup("SA-OLD");
  await h.lookup("SA-NEW");
  h.reads[1].resolve({ data: { strategyId: "SA-NEW", displayName: "New T." } });
  await flush();
  h.reads[0].resolve({ data: { strategyId: "SA-OLD", displayName: "Old T." } });
  await flush();
  assert.equal(h.m.recipient.value.strategyId, "SA-NEW");
  h.m.form.amount = 1;
  h.m.form.withdrawalPassword = "ficticia";
  assert.equal(h.m.canSubmit.value, true);
  h.m.form.recipientStrategyId = "SA-OTHER";
  await flush();
  assert.equal(h.m.canSubmit.value, false);
  await h.m.confirm();
  assert.equal(h.writes.length, 0);
  h.dispose();
});
test("component submits contract once, clears secret after 409 and reports no success", async () => {
  const h = await harness();
  await h.lookup("SA-TEST");
  h.reads[0].resolve({
    data: { strategyId: "SA-TEST", displayName: "Test T." },
  });
  await flush();
  Object.assign(h.m.form, { amount: 1, withdrawalPassword: "ficticia" });
  const a = h.m.confirm(),
    b = h.m.confirm();
  await flush();
  assert.equal(h.writes.length, 1);
  const [path, payload, options] = h.writes[0].args;
  assert.equal(path, "/api/v1/client/transactions/transfers");
  assert.equal(payload.recipientStrategyId, "SA-TEST");
  assert.ok(options.headers["Idempotency-Key"]);
  h.writes[0].reject({
    response: {
      status: 409,
      data: { errors: [{ code: "transaction.withdrawal_password_not_set" }] },
    },
  });
  await Promise.all([a, b]);
  assert.equal(h.m.form.withdrawalPassword, "");
  assert.match(h.m.error.value, /confirmação da senha/);
  assert.equal(h.emitted.length, 0);
  h.dispose();
});
test("component disposal clears secret and ignores recipient arriving after close", async () => {
  const h = await harness();
  await h.lookup("SA-TEST");
  h.m.form.withdrawalPassword = "ficticia";
  h.dispose();
  h.reads[0].resolve({
    data: { strategyId: "SA-TEST", displayName: "Test T." },
  });
  await flush();
  assert.equal(h.m.form.withdrawalPassword, "");
  assert.equal(h.m.recipient.value, null);
  assert.equal(h.emitted.length, 0);
});
