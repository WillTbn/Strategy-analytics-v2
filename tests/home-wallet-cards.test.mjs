import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { parse, compileScript } from "@vue/compiler-sfc";
import * as Vue from "vue";
import { renderToString } from "@vue/server-renderer";
import { amountLabel } from "../src/services/walletPresentation.js";
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

async function renderedCards() {
  const context = vm.createContext({ console, Number, Array });
  const code = compileScript(
    parse(
      readFileSync(
        "src/system/layouts/wallet/BalancecurrentLayout.vue",
        "utf8",
      ),
    ).descriptor,
    { id: "balance-render", inlineTemplate: true },
  ).content;
  const mod = new vm.SourceTextModule(code, { context });
  const layout = Vue.reactive({ dashboard: { view_wallet_value: false } });
  const card = {
    props: ["title", "amounts", "loading", "error", "viewValues"],
    setup: (p) => () =>
      Vue.h(
        "output",
        { "data-card": p.title || "Total" },
        p.loading
          ? "loading"
          : p.error
            ? "error"
            : (p.viewValues ?? layout.dashboard.view_wallet_value)
              ? "hidden"
              : amountLabel(p.amounts?.[0]),
      ),
  };
  const deps = {
    vue: Vue,
    pinia: { storeToRefs: Vue.toRefs },
    "src/stores/layoutStore": { useStoreLayout: () => layout },
    "src/services/walletModel": { YIELD_DESCRIPTION: "" },
    "src/services/homeWalletCards": cards,
    "src/system/components/wallet/BalanceItems.vue": { default: card },
    "src/system/components/wallet/WalletTotal.vue": { default: card },
  };
  await mod.link(async (name) => {
    const values = deps[name] || { default: { render: () => null } };
    return new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const [key, value] of Object.entries(values))
          this.setExport(key, value);
      },
      { context },
    );
  });
  await mod.evaluate();
  const props = Vue.reactive({
    home: { loading: true, error: "", data: null },
    wallets: { loading: true, error: "", data: null },
    profile: { loading: true, data: null },
    deposits: { loading: true, data: null },
  });
  const container = {
    setup:
      (_, { slots }) =>
      () =>
        Vue.h("div", slots.default?.()),
  };
  const render = async () => {
    const app = Vue.createSSRApp({
      render: () => Vue.h(mod.namespace.default, props),
    });
    app.component("q-card", container).component("q-card-section", container);
    return Array.from(
      (await renderToString(app)).matchAll(/<output[^>]*>(.*?)<\/output>/g),
      (m) => m[1],
    );
  };
  return { props, layout, render };
}

test("all four rendered card boundaries release one snapshot, independent of slower or failed auxiliary reads", async () => {
  const f = await renderedCards();
  assert.deepEqual(await f.render(), Array(4).fill("loading"));
  f.props.wallets.loading = false;
  f.props.wallets.error = "Operational wallets failed";
  assert.deepEqual(await f.render(), Array(4).fill("loading"));
  f.props.home.data = home();
  f.props.home.loading = false;
  const visible = [999, 10, 20, 30].map((value) =>
    amountLabel({ currency: "BRL", value }),
  );
  assert.deepEqual(await f.render(), visible);
  f.layout.dashboard.view_wallet_value = true;
  assert.deepEqual(await f.render(), Array(4).fill("hidden"));
  f.layout.dashboard.view_wallet_value = false;
  assert.deepEqual(await f.render(), visible);
  f.props.home.loading = true;
  assert.deepEqual(await f.render(), Array(4).fill("loading"));
  f.props.home.loading = false;
  f.props.home.error = "Home failed";
  assert.deepEqual(await f.render(), Array(4).fill("error"));
});

test("zero balances render R$ 0,00 together; missing metrics remain unavailable instead of invented zero", async () => {
  const f = await renderedCards();
  const snapshot = home();
  for (const key of ["total", "deposit", "strategy", "patrimony"])
    snapshot.wallets[key] = metric(0);
  f.props.home.data = snapshot;
  f.props.home.loading = false;
  assert.deepEqual(
    await f.render(),
    Array(4).fill(amountLabel({ currency: "BRL", value: 0 })),
  );
  f.props.home.data.wallets.strategy = { status: "NotAvailable", value: null };
  const values = await f.render();
  assert.equal(values[2], "—");
  assert.equal(values[0], amountLabel({ currency: "BRL", value: 0 }));
});
