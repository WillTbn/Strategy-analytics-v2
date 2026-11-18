import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import * as Vue from "vue";
import { parse, compileScript } from "@vue/compiler-sfc";
import * as wallet from "../src/services/walletModel.js";
import * as flow from "../src/services/withdrawalFlow.js";
import * as assets from "../src/services/withdrawalAssets.js";
const bank = {
  id: "qa-bank",
  status: "Active",
  currencyIsoCode: "BRL",
  bankName: "Banco QA",
  branch: "0001",
  accountNumberMasked: "****1234",
};
const model = { deposit: { currencies: [{ currency: "BRL", balance: 1000 }] } };
const form = { amount: 100, currency: "BRL", bankId: bank.id };
async function mount(submitOperation = async () => ({ id: "test" })) {
  const context = vm.createContext({ console, Function });
  const script = compileScript(
    parse(
      readFileSync("src/system/components/wallet/WithdrawalFlow.vue", "utf8"),
    ).descriptor,
    { id: "withdrawal" },
  );
  const module = new vm.SourceTextModule(script.content, { context });
  const deps = {
    vue: Vue,
    "src/services/walletModel": wallet,
    "src/services/withdrawalFlow": flow,
    "src/services/withdrawalAssets": assets,
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
  const props = Vue.reactive({
    model: structuredClone(model),
    banks: [{ ...bank }],
    bankState: { loading: false, error: "" },
    submitOperation,
  });
  const events = [],
    scope = Vue.effectScope();
  const h = scope.run(() =>
    module.namespace.default.setup(props, {
      expose() {},
      emit: (...args) => events.push(args),
    }),
  );
  h.bankId.value = bank.id;
  h.amount.value = 100;
  return { h, props, events, stop: () => scope.stop() };
}
test("review validates account, currency and balance before asking for password", () => {
  assert.equal(flow.withdrawalFormError(form, model, bank), "");
  assert.match(flow.withdrawalFormError(form, model, bank, true), /Senha/);
  assert.match(
    flow.withdrawalFormError({ ...form, password: "   " }, model, bank, true),
    /Senha/,
  );
  assert.ok(flow.withdrawalFormError({ ...form, amount: 1001 }, model, bank));
  assert.ok(
    flow.withdrawalFormError(form, model, { ...bank, status: "Inactive" }),
  );
  assert.ok(
    flow.withdrawalFormError(form, model, { ...bank, currencyIsoCode: null }),
  );
  assert.ok(
    flow.withdrawalFormError({ ...form, bankId: "other" }, model, bank),
  );
});
test("snapshot freezes reviewed values without password and masks account", () => {
  const snapshot = flow.withdrawalSnapshot(
    { ...form, password: "never-retain" },
    model,
    { ...bank, accountNumberMasked: "123456789" },
    new Date("2026-11-18T12:00:00Z"),
  );
  assert.ok(Object.isFrozen(snapshot));
  assert.ok(Object.isFrozen(snapshot.bank));
  assert.equal(snapshot.bank.account, "****6789");
  assert.equal(snapshot.after, 900);
  assert.ok(!JSON.stringify(snapshot).includes("never-retain"));
  for (const value of [false, " ", null, undefined])
    assert.equal(
      wallet.walletBalance(
        { deposit: { currencies: [{ currency: "BRL", balance: value }] } },
        "deposit",
        "BRL",
      ),
      null,
    );
});
test("changed balance, account or amount invalidates the reviewed operation", () => {
  const s = flow.withdrawalSnapshot(form, model, bank);
  assert.equal(flow.currentWithdrawal(s, form, model, bank), true);
  assert.equal(
    flow.currentWithdrawal(s, { ...form, amount: 101 }, model, bank),
    false,
  );
  assert.equal(
    flow.currentWithdrawal(
      s,
      form,
      { deposit: { currencies: [{ currency: "BRL", balance: 999 }] } },
      bank,
    ),
    false,
  );
  assert.equal(
    flow.currentWithdrawal(s, form, model, {
      ...bank,
      accountNumberMasked: "****4321",
    }),
    false,
  );
});
test("first two steps never write; final submit cannot duplicate; success waits for response", async () => {
  let finish,
    calls = 0,
    payload;
  const f = await mount((value) => {
    calls++;
    payload = value;
    return new Promise((resolve) => (finish = resolve));
  });
  await f.h.next();
  assert.equal(f.h.step.value, "review");
  assert.equal(calls, 0);
  await f.h.next();
  assert.equal(f.h.step.value, "password");
  assert.equal(calls, 0);
  f.h.password.value = "fictional-only";
  const pending = f.h.next();
  await f.h.next();
  assert.equal(calls, 1);
  assert.equal(f.h.busy.value, true);
  assert.equal(f.h.step.value, "password");
  assert.equal(payload.from, "deposit");
  assert.equal(payload.bankId, bank.id);
  assert.ok(!("to" in payload));
  finish({ id: "test" });
  await pending;
  assert.equal(f.h.step.value, "success");
  assert.equal(f.h.password.value, "");
  assert.equal(f.events.filter((e) => e[0] === "completed").length, 0);
  f.stop();
});
test("failure clears credential, keeps reviewed data and allows retry without false success", async () => {
  const f = await mount(async () => {
    throw Error("Falha controlada");
  });
  await f.h.next();
  await f.h.next();
  f.h.password.value = "fictional-only";
  await f.h.next();
  assert.equal(f.h.step.value, "password");
  assert.equal(f.h.password.value, "");
  assert.equal(f.h.snapshot.value.amount, 100);
  assert.match(f.h.error.value, /Falha controlada/);
  f.h.password.value = "discard-me";
  f.h.back();
  assert.equal(f.h.step.value, "review");
  assert.equal(f.h.password.value, "");
  f.h.back();
  assert.equal(f.h.amount.value, 100);
  assert.equal(f.h.bankId.value, bank.id);
  f.stop();
});
test("changed API balance returns to form and late completion after disposal is ignored", async () => {
  const f = await mount();
  await f.h.next();
  f.props.model.deposit.currencies[0].balance = 999;
  await f.h.next();
  assert.equal(f.h.step.value, "form");
  assert.match(f.h.error.value, /mudaram/);
  f.stop();
  let finish;
  const g = await mount(() => new Promise((resolve) => (finish = resolve)));
  await g.h.next();
  await g.h.next();
  g.h.password.value = "fictional-only";
  const pending = g.h.next();
  g.stop();
  finish({ id: "test" });
  await pending;
  assert.notEqual(g.h.step.value, "success");
  assert.equal(g.h.password.value, "");
});

test("resource reload or error prevents advancing even by keyboard submission", async () => {
  const f = await mount();
  f.props.bankState.loading = true;
  await f.h.next();
  assert.equal(f.h.step.value, "form");
  f.props.bankState.loading = false;
  await f.h.next();
  await f.h.next();
  f.h.password.value = "fictional-only";
  f.props.bankState.error = "Indisponível";
  await f.h.next();
  assert.equal(f.h.step.value, "form");
  assert.equal(f.h.password.value, "");
  f.stop();
});
