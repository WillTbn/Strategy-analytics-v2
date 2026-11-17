import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import * as Vue from "vue";
import { parse, compileScript } from "@vue/compiler-sfc";
import * as profile from "../src/services/profilePresentation.js";
import * as summary from "../src/services/loanSummaryPresentation.js";
async function mount(name, overrides = {}) {
  const file = "src/system/components/loan/" + name + ".vue",
    context = vm.createContext({ console, Function });
  const compiled = compileScript(parse(readFileSync(file, "utf8")).descriptor, {
    id: file,
  });
  const module = new vm.SourceTextModule(compiled.content, { context });
  const deps = {
    vue: Vue,
    "src/services/profilePresentation": profile,
    "src/services/loanSummaryPresentation": summary,
    quasar: { copyToClipboard: async () => {} },
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
      title: "QA",
      type: "secured_automovel",
      installments: [],
      quote: null,
      canContinue: false,
      pixCode: "",
      pixKey: "",
      submitReceipt: null,
      ...overrides,
    }),
    events = [],
    scope = Vue.effectScope();
  const h = scope.run(() =>
    module.namespace.default.setup(props, {
      expose() {},
      emit: (...args) => events.push(args),
    }),
  );
  return { props, h, events, stop: () => scope.stop() };
}
test("quote uses supplied amounts, accepts zero discount and does not create a date or fixed discount", async () => {
  const f = await mount("CardPayInstallments");
  assert.equal(Boolean(f.h.validQuote.value), false);
  assert.equal(f.h.money(null), "—");
  f.props.quote = {
    currency: "BRL",
    paymentDate: "2026-11-17",
    grossAmount: 100,
    discountAmount: 0,
    totalAmount: 100,
  };
  assert.equal(f.h.validQuote.value, true);
  assert.match(f.h.money(0), /0,00/);
  f.props.quote.totalAmount = null;
  assert.equal(f.h.validQuote.value, false);
  f.stop();
});
test("selecting a receipt alone never emits submitted or simulates completion", async () => {
  const f = await mount("CardQrcodePayment", {
    pixCode: "QA",
    pixKey: "QA",
    submitReceipt: async () => ({ submitted: false }),
  });
  f.h.choose([{ name: "ficticio.pdf", size: 32 }]);
  assert.equal(f.events.length, 0);
  await f.h.submit();
  assert.equal(f.events.length, 0);
  assert.match(f.h.error.value, /enviar/);
  assert.equal(f.h.file.value.name, "ficticio.pdf");
  f.stop();
});
test("explicit receipt confirmation emits once and pending submission cannot duplicate", async () => {
  let finish,
    calls = 0;
  const f = await mount("CardQrcodePayment", {
    pixCode: "QA",
    pixKey: "QA",
    submitReceipt: () => {
      calls++;
      return new Promise((r) => (finish = r));
    },
  });
  f.h.choose([{ name: "ficticio.pdf", size: 32 }]);
  const pending = f.h.submit();
  await f.h.submit();
  assert.equal(calls, 1);
  finish({ submitted: true });
  await pending;
  assert.equal(f.events.length, 1);
  assert.equal(f.events[0][0], "next");
  f.stop();
});
test("missing Pix data or adapter cannot submit, and late receipt response is discarded", async () => {
  const missing = await mount("CardQrcodePayment");
  missing.h.choose([{ name: "ficticio.pdf", size: 32 }]);
  await missing.h.submit();
  assert.equal(missing.h.file.value, null);
  assert.equal(missing.events.length, 0);
  missing.stop();
  let finish;
  const f = await mount("CardQrcodePayment", {
    pixCode: "QA",
    pixKey: "QA",
    submitReceipt: () => new Promise((r) => (finish = r)),
  });
  f.h.choose([{ name: "ficticio.pdf", size: 32 }]);
  const pending = f.h.submit();
  f.stop();
  finish({ submitted: true });
  await pending;
  assert.equal(f.events.length, 0);
});
