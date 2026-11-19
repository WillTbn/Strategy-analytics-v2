import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { parse, compileScript } from "@vue/compiler-sfc";
import * as Vue from "vue";
import * as model from "../src/services/contractDetailPresentation.js";
import * as directory from "../src/services/contractDirectory.js";
const root = "src/system/components/contract/";
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
async function setup(file, provided = {}) {
  const context = vm.createContext({ Date, URL, Intl, Array, Number, console });
  const source = compileScript(
    parse(readFileSync(root + file, "utf8")).descriptor,
    { id: file },
  ).content;
  const mod = new vm.SourceTextModule(source, { context });
  const deps = {
    vue: Vue,
    "src/services/contractDetailPresentation": model,
    "src/services/contractDirectory": directory,
  };
  await mod.link(async (name) => {
    const values = deps[name] || { default: {} };
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
  const props = Vue.reactive({ contractId: "qa-a", ...provided }),
    events = [],
    scope = Vue.effectScope();
  const h = scope.run(() =>
    mod.namespace.default.setup(props, {
      expose() {},
      emit: (...args) => events.push(args),
    }),
  );
  return { h, props, events, stop: () => scope.stop() };
}
const series = [
  {
    name: "Contrato",
    data: [
      { x: Date.UTC(2025, 0, 1), y: 0 },
      { x: Date.UTC(2026, 10, 1), y: 100 },
    ],
  },
];
test("detail model never substitutes global capital, result or unknown metrics for individual balances", () => {
  const m = model.contractDetailModel({
    id: "qa",
    currency: { isoCode: "BRL" },
    initialContractualCapital: 999999,
    result: { status: "Available", value: 400 },
    myParticipation: { allocatedAmount: 500 },
  });
  assert.equal(m.applied, null);
  assert.equal(m.acquisition, null);
  assert.equal(m.current, null);
  assert.equal(model.detailMoney(null, "BRL"), "—");
  assert.match(model.detailMoney(0, "BRL"), /0,00/);
  assert.equal(
    model.detailMetric({ status: "NotAvailable", value: 900 }),
    null,
  );
  assert.equal(
    model.detailMetric({ calculationStatus: "Available", value: 0 }),
    0,
  );
  assert.equal(model.detailMetric({ status: "Available", value: false }), null);
});
test("detail currency and dates reject invalid values without leaking epoch dates", () => {
  assert.equal(
    model.contractDetailModel({ currency: { isoCode: "invalid" } }).currency,
    null,
  );
  for (const d of [null, false, 0, "", "invalid", "2026-02-30", "2026-13-01"])
    assert.equal(model.detailDate(d), "—");
  assert.equal(model.detailDate("2026-11-19T12:00:00Z"), "19/11/2026");
  assert.equal(
    model.detailRemainingTerm("2030-03-19", new Date("2026-11-19T12:00:00Z")),
    "3 anos e 4 meses",
  );
  assert.equal(
    model.detailRemainingTerm("2026-10-19", new Date("2026-11-19")),
    "Encerrado",
  );
});
test("compositions require real percentages, totals and unique categories", () => {
  assert.equal(
    model.validDetailComposition([
      { label: "A", value: 60 },
      { label: "B", value: 40 },
    ]),
    true,
  );
  for (const rows of [
    null,
    [],
    [{ label: "A", value: 0 }],
    [{ label: "A", value: true }],
    [{ label: "A", value: 101 }],
    [
      { label: "A", value: 50 },
      { label: "A", value: 50 },
    ],
    [
      { label: "A", value: -1 },
      { label: "B", value: 101 },
    ],
  ])
    assert.equal(model.validDetailComposition(rows), false);
  assert.equal(
    model.detailSeriesReady([{ name: "A", data: [{ x: 1e308, y: 10 }] }]),
    false,
  );
  assert.equal(model.detailSeriesReady(series), true);
});
test("application cannot embed an unapproved source or authentication-bearing origin", () => {
  assert.equal(
    model.approvedAppUrl("https://app.example.test/path", [
      "https://app.example.test",
    ]),
    "https://app.example.test/path",
  );
  for (const src of [
    "javascript:alert(1)",
    "http://app.example.test",
    "https://elsewhere.test",
    "https://u:p@app.example.test",
  ])
    assert.equal(model.approvedAppUrl(src, ["https://app.example.test"]), null);
  assert.equal(model.approvedAppUrl("https://app.example.test", []), null);
  assert.equal(model.safeDetailImage("//external.test/a.png"), null);
  assert.equal(model.safeDetailImage("/\\external.test/a.png"), null);
  assert.equal(model.safeDetailImage("data:text/html,<script>"), null);
  assert.equal(
    model.escapeDetailText('<img onerror="x"> &'),
    "&lt;img onerror=&quot;x&quot;&gt; &amp;",
  );
});
test("charts disable unavailable units and comparisons, preserve zero and reset when contract series changes", async () => {
  const f = await setup("ContractDetailCharts.vue", {
    performance: { absolute: series },
    distribution: null,
  });
  assert.equal(f.h.hasSeries.value, true);
  assert.equal(f.h.canChangeUnit.value, false);
  assert.equal(f.h.canCompare.value, false);
  f.h.compare.value = true;
  assert.equal(f.h.visibleSeries.value.length, 1);
  f.props.performance = { percent: series };
  await Vue.nextTick();
  assert.equal(f.h.absolute.value, false);
  assert.equal(f.h.compare.value, false);
  f.h.period.value = "1M";
  assert.equal(f.h.visibleSeries.value[0].data.length, 1);
  f.props.performance = null;
  await Vue.nextTick();
  assert.equal(f.h.hasSeries.value, false);
  assert.equal(f.h.visibleSeries.value.length, 0);
  f.stop();
});
test("empty assets, unknown assets and unavailable export remain distinct", async () => {
  const f = await setup("ContractAssetsDialog.vue", {
    modelValue: true,
    rows: null,
  });
  assert.equal(f.h.canExport.value, false);
  await f.h.exportPdf();
  assert.equal(f.h.exporting.value, false);
  f.props.rows = [];
  assert.equal(f.h.validRows.value.length, 0);
  f.stop();
});
test("PDF export failure permits retry and rejects duplicate concurrent work", async () => {
  let calls = 0,
    req = deferred();
  const f = await setup("ContractAssetsDialog.vue", {
    rows: [{ id: "a" }],
    exportDocument: () => {
      calls++;
      return req.promise;
    },
  });
  const p = f.h.exportPdf();
  await f.h.exportPdf();
  assert.equal(calls, 1);
  req.reject(Error("network"));
  await p;
  assert.ok(f.h.error.value);
  assert.equal(f.h.exporting.value, false);
  req = deferred();
  const retry = f.h.exportPdf();
  req.resolve();
  await retry;
  assert.equal(calls, 2);
  assert.equal(f.h.error.value, "");
  f.stop();
});
test("late export failures cannot overwrite the next contract", async () => {
  const req = deferred(),
    f = await setup("ContractAssetsDialog.vue", {
      rows: [{ id: "a" }],
      exportDocument: () => req.promise,
    });
  const p = f.h.exportPdf();
  f.props.contractId = "qa-b";
  await Vue.nextTick();
  req.reject(Error("old"));
  await p;
  assert.equal(f.h.error.value, "");
  assert.equal(f.h.exporting.value, false);
  f.stop();
});
test("dividend destination changes only after confirmed callback and preserves value after failure", async () => {
  let calls = 0;
  const f = await setup("ContractDividendPanel.vue", {
    data: { destination: "Strategy" },
    saveDestination: async () => {
      calls++;
      return {};
    },
  });
  await f.h.setDestination("Deposit");
  assert.equal(calls, 1);
  assert.equal(f.h.destination.value, "Strategy");
  assert.ok(f.h.error.value);
  f.props.saveDestination = async () => ({ destination: "Deposit" });
  await f.h.setDestination("Deposit");
  assert.equal(f.h.destination.value, "Deposit");
  assert.equal(f.h.error.value, "");
  f.stop();
});
test("dividend destination guards unknown values, double submissions, stale responses and disposal", async () => {
  let req = deferred(),
    calls = 0;
  const f = await setup("ContractDividendPanel.vue", {
    data: { destination: "Strategy" },
    saveDestination: () => {
      calls++;
      return req.promise;
    },
  });
  await f.h.setDestination("Other");
  assert.equal(calls, 0);
  const p = f.h.setDestination("Deposit");
  await f.h.setDestination("Deposit");
  assert.equal(calls, 1);
  f.props.contractId = "qa-b";
  await Vue.nextTick();
  req.resolve({ destination: "Deposit" });
  await p;
  assert.equal(f.h.destination.value, "Strategy");
  req = deferred();
  const late = f.h.setDestination("Deposit");
  f.stop();
  req.resolve({ destination: "Deposit" });
  await late;
  assert.equal(f.h.destination.value, "Strategy");
});
test("dividend absence does not become zero yield or a selected wallet", async () => {
  const f = await setup("ContractDividendPanel.vue", { data: null });
  assert.equal(f.h.canSave.value, false);
  assert.equal(f.h.destination.value, null);
  assert.equal(f.h.ready.value, false);
  f.stop();
});
test("participant/history props are isolated and a new contract restores the history view", async () => {
  const f = await setup("ContractContributions.vue", {
    data: {
      participants: [{ id: "a", name: "Pessoa QA", avatar: "javascript:bad" }],
      history: [],
    },
  });
  assert.equal(f.h.participants.value[0].avatar, null);
  assert.equal(f.props.data.participants[0].avatar, "javascript:bad");
  assert.equal(f.h.seriesReady.value, false);
  assert.equal(f.h.historyRows.value.length, 0);
  f.h.historyOpen.value = false;
  f.props.contractId = "qa-b";
  await Vue.nextTick();
  assert.equal(f.h.historyOpen.value, true);
  f.stop();
});
test("asset dialog closes on contract switch and unavailable values remain dashes", async () => {
  const f = await setup("ContractDetailDashboard.vue", {
    contract: { id: "a", currency: { isoCode: "USD" } },
  });
  assert.equal(f.h.cards.value[0].value, "—");
  assert.equal(f.h.appUrl.value, null);
  f.h.assetsOpen.value = true;
  f.props.contract = { id: "b" };
  await Vue.nextTick();
  assert.equal(f.h.assetsOpen.value, false);
  f.stop();
});
