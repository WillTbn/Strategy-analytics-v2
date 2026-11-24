import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { parse, compileScript } from "@vue/compiler-sfc";
import * as Vue from "vue";
import * as cards from "../src/services/homeWalletCards.js";
const metric = (value) => ({ status: "Available", value });
const home = () => ({
  access: { financialStatus: "Available" },
  wallets: {
    status: "Available",
    currencyIsoCode: "BRL",
    deposit: metric(10),
    strategy: metric(20),
    patrimony: metric(30),
    total: metric(999),
    quotes: [{ brlPerUnit: 123 }],
  },
});
test("all four Home cards read the supplied converted amount without summing parts or applying quotes", () => {
  const h = home();
  h.summaries = [
    { currencyIsoCode: "USD", contractedCapital: metric(1234567) },
  ];
  const result = cards.homeWalletCardAmounts(h);
  assert.deepEqual(result, {
    deposit: [{ currency: "BRL", value: 10 }],
    strategy: [{ currency: "BRL", value: 20 }],
    assets: [{ currency: "BRL", value: 30 }],
    total: [{ currency: "BRL", value: 999 }],
  });
  h.wallets.currencyIsoCode = "EUR";
  assert.equal(cards.homeWalletCardAmounts(h).total[0].currency, "EUR");
});
test("confirmed zero amounts remain zero in every card", () => {
  const h = home();
  for (const k of ["deposit", "strategy", "patrimony", "total"])
    h.wallets[k] = metric(0);
  for (const a of Object.values(cards.homeWalletCardAmounts(h)))
    assert.equal(a[0].value, 0);
});
test("missing or blocked section never falls back to old summaries or a computed total", () => {
  for (const mutate of [
    (h) => delete h.wallets,
    (h) => (h.access.financialStatus = "Blocked"),
    (h) => (h.wallets.status = "NotAvailable"),
    (h) => (h.wallets.currencyIsoCode = null),
    (h) => (h.wallets.currencyIsoCode = "invalid"),
  ]) {
    const h = home();
    mutate(h);
    assert.deepEqual(cards.homeWalletCardAmounts(h), {
      deposit: [],
      strategy: [],
      assets: [],
      total: [],
    });
  }
});
test("unavailable or malformed metrics never become zero or suppress other confirmed cards", () => {
  for (const v of [
    null,
    undefined,
    "",
    true,
    false,
    {},
    NaN,
    Infinity,
    "NaN",
  ]) {
    const h = home();
    h.wallets.total = metric(v);
    assert.equal(cards.homeWalletCardAmounts(h).total[0].value, null);
    assert.equal(cards.homeWalletCardAmounts(h).strategy[0].value, 20);
  }
  const h = home();
  h.wallets.total = { status: "NotAvailable", value: 0 };
  assert.equal(cards.homeWalletCardAmounts(h).total[0].value, null);
  h.wallets.total = metric("1912700.10");
  assert.equal(cards.homeWalletCardAmounts(h).total[0].value, 1912700.1);
});
async function setup() {
  const context = vm.createContext({ console, Number, Array });
  const code = compileScript(
    parse(
      readFileSync(
        "src/system/layouts/wallet/BalancecurrentLayout.vue",
        "utf8",
      ),
    ).descriptor,
    { id: "balance" },
  ).content;
  const mod = new vm.SourceTextModule(code, { context });
  const deps = {
    vue: Vue,
    pinia: { storeToRefs: Vue.toRefs },
    "src/stores/layoutStore": {
      useStoreLayout: () =>
        Vue.reactive({ dashboard: { view_wallet_value: false } }),
    },
    "src/services/walletModel": { YIELD_DESCRIPTION: "" },
    "src/services/homeWalletCards": cards,
  };
  await mod.link(async (name) => {
    const values = deps[name] || { default: {} };
    return new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const [k, v] of Object.entries(values)) this.setExport(k, v);
      },
      { context },
    );
  });
  await mod.evaluate();
  const props = Vue.reactive({
    home: { loading: false, error: "", data: home() },
    wallets: { loading: true, error: "", data: null },
    deposits: { loading: true, error: "", data: null },
    profile: { data: null },
    walletModel: {
      principalCurrency: "USD",
      deposit: { total: 777 },
      strategy: { total: 888 },
      total: { total: 1665 },
    },
  });
  const h = mod.namespace.default.setup(props, { expose() {}, emit() {} });
  return { h, props };
}
test("separate wallet/deposit failures or loading cannot replace a valid backend Home total", async () => {
  const f = await setup();
  assert.equal(f.h.totals.value[0].value, 999);
  f.props.wallets.error = "separate read failed";
  f.props.deposits.error = "history failed";
  assert.equal(f.h.totals.value[0].value, 999);
  assert.equal(f.h.assetAmounts.value[0].value, 30);
  f.props.walletModel = null;
  assert.equal(f.h.depositAmounts.value[0].value, 10);
});
test("Home reload and failure clear old headlines instead of showing stale operational balances", async () => {
  const f = await setup();
  f.props.home.loading = true;
  assert.deepEqual(Array.from(f.h.totals.value), []);
  f.props.home.loading = false;
  f.props.home.error = "failed";
  assert.deepEqual(Array.from(f.h.totals.value), []);
  f.props.home.error = "";
  assert.equal(f.h.totals.value[0].value, 999);
});
