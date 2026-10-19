import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contractsAreEmpty,
  portfolioIsEmpty,
  comparisonIsVisible,
  homePeriods,
  homeChartPoints,
  chartWindow,
  homeChartBounds,
} from "../src/services/homePresentation.js";
import { readHomeDepositHistory } from "../src/services/homeDepositHistory.js";
const state = (data) => ({ data, loading: false, error: "" });
const value = (value) => ({ status: "Available", value });
const unavailable = { status: "NotAvailable", value: null };
function emptyData() {
  return {
    home: state({
      access: { financialStatus: "Available" },
      summaries: ["BRL", "USD"].map((currencyIsoCode) => ({
        currencyIsoCode,
        availableBalance: value(0),
        contractedCapital: value(0),
        currentPosition: unavailable,
        result: unavailable,
      })),
      contracts: { status: "Available", items: [], totalItems: 0 },
      composition: { status: "Available", currencies: [] },
      chart: { status: "NotAvailable", points: [] },
    }),
    wallets: state([]),
    deposits: state({ hasCompletedDeposit: false, firstDepositAtUtc: null }),
  };
}
const isEmpty = ({ home, wallets, deposits }) =>
  portfolioIsEmpty(home, wallets, deposits);
test("a complete, accessible and zero portfolio with no executed deposits is empty", () => {
  assert.equal(isEmpty(emptyData()), true);
  const input = emptyData();
  input.home.data.summaries = [];
  assert.equal(isEmpty(input), true);
});
test("the real uninitialized account response is empty only with independent confirmation", () => {
  const input = emptyData();
  input.home.data.summaries = [];
  input.home.data.composition = { status: "NotAvailable", currencies: [] };
  assert.equal(isEmpty(input), true);
  for (const mutate of [
    (value) => (value.wallets.error = "Read failed"),
    (value) => (value.deposits.data.hasCompletedDeposit = true),
    (value) => (value.home.data.contracts.totalItems = 1),
    (value) =>
      value.home.data.composition.currencies.push({ total: 1, items: [] }),
    (value) => (value.home.data.composition.currencies = null),
    (value) =>
      value.wallets.data.push({ balance: 0, reserved: 0, available: 0 }),
  ]) {
    const changed = structuredClone(input);
    mutate(changed);
    assert.equal(isEmpty(changed), false);
  }
});

test("loading, denied, failed or missing reads never become zero balances", () => {
  for (const key of ["home", "wallets", "deposits"])
    for (const change of [
      { loading: true },
      { error: "403 PreferencesRequired" },
      { data: null },
    ]) {
      const input = emptyData();
      Object.assign(input[key], change);
      assert.equal(isEmpty(input), false);
    }
  const input = emptyData();
  input.home.data.access.financialStatus = "Blocked";
  assert.equal(isEmpty(input), false);
});
test("money, reserves, allocated contracts or an executed deposit prevent the new-account state", () => {
  const inputs = [
    (input) => (input.home.data.summaries[0].availableBalance.value = 50000),
    (input) => (input.home.data.summaries[1].contractedCapital.value = 250000),
    (input) => (input.home.data.summaries[0].currentPosition = value(1)),
    (input) =>
      input.wallets.data.push({ balance: 10, reserved: 0, available: 10 }),
    (input) =>
      input.wallets.data.push({ balance: 0, reserved: 5, available: 0 }),
    (input) => (input.deposits.data.hasCompletedDeposit = true),
    (input) =>
      input.home.data.composition.currencies.push({ total: 10, items: [] }),
    (input) => (input.home.data.contracts.totalItems = 1),
  ];
  for (const change of inputs) {
    const input = emptyData();
    change(input);
    assert.equal(isEmpty(input), false);
  }
});
test("malformed totals and unavailable composition do not authorize an empty state", () => {
  for (const invalid of [null, undefined, "", false]) {
    const input = emptyData();
    input.home.data.summaries[0].availableBalance.value = invalid;
    assert.equal(isEmpty(input), false);
  }
  const input = emptyData();
  input.home.data.composition.status = "NotAvailable";
  assert.equal(isEmpty(input), false);
});
test("contracts empty state requires available items and an explicit total of zero", () => {
  assert.equal(contractsAreEmpty(emptyData().home), true);
  for (const contracts of [
    { status: "NotAvailable", items: [], totalItems: 0 },
    { status: "Available", items: [] },
    { status: "Available", items: [], totalItems: 2 },
    { status: "Available", items: [{ id: "real" }], totalItems: 1 },
  ])
    assert.equal(contractsAreEmpty(state({ contracts })), false);
});
test("periods follow account age; there are no controls before a confirmed deposit", () => {
  const values = (since) =>
    homePeriods(since, true, "2026-10-19T15:00:00Z").map(
      (option) => option.value,
    );
  assert.deepEqual(homePeriods("2020-01-01T00:00:00Z", false), []);
  assert.deepEqual(homePeriods("2020-01-01T00:00:00Z", undefined), []);
  assert.deepEqual(values("2026-10-01T15:00:00Z"), ["max"]);
  assert.deepEqual(values("2026-09-19T15:00:00Z"), ["1M", "max"]);
  assert.deepEqual(values("2026-04-19T15:00:00Z"), ["1M", "6M", "max"]);
  assert.deepEqual(values("2025-10-19T15:00:00Z"), [
    "2026",
    "1M",
    "6M",
    "12M",
    "max",
  ]);
  assert.deepEqual(values(null), ["max"]);
});
test("the year follows the customer's timezone rather than the UTC midnight", () => {
  const options = homePeriods(
    "2025-01-01T12:00:00Z",
    true,
    "2027-01-01T01:00:00Z",
    "America/Sao_Paulo",
  );
  assert.equal(options[0].value, "2026");
  assert.equal(
    chartWindow(
      "2026",
      "2025-12-01T00:00:00Z",
      "2026-02-01T12:00:00Z",
      "America/Sao_Paulo",
    ).from,
    Date.parse("2026-01-01T03:00:00Z"),
  );
});
test("comparison is hidden only in the first month; month-end anniversaries are clamped", () => {
  assert.equal(
    comparisonIsVisible("2026-10-01T12:00:00Z", "2026-10-19T12:00:00Z"),
    false,
  );
  assert.equal(
    comparisonIsVisible("2026-09-19T12:00:00Z", "2026-10-19T12:00:00Z"),
    true,
  );
  assert.equal(
    comparisonIsVisible("2026-01-31T12:00:00Z", "2026-02-28T12:00:00Z"),
    true,
  );
  assert.equal(comparisonIsVisible(null), true);
});
test("chart excludes time before the first executed deposit, invalid and future points", () => {
  const chart = {
    status: "Available",
    points: [
      { atUtc: "2026-10-01T12:00:00Z", value: 0 },
      { atUtc: "2026-10-10T12:00:00Z", value: 5000 },
      { atUtc: "2026-10-19T12:00:00Z", value: "5100" },
      { atUtc: "2026-11-01T12:00:00Z", value: 5200 },
      { atUtc: "2026-10-18T12:00:00Z", value: null },
    ],
  };
  assert.deepEqual(
    homeChartPoints(
      chart,
      "2026-10-10T12:00:00Z",
      "max",
      "2026-10-19T12:00:00Z",
    ).map((point) => point[1]),
    [5000, 5100],
  );
  assert.deepEqual(homeChartPoints(chart, null), []);
  assert.deepEqual(
    homeChartPoints(
      { ...chart, status: "NotAvailable" },
      "2026-10-10T12:00:00Z",
    ),
    [],
  );
});
test("period filtering is anchored to today, without inventing samples at the range boundary", () => {
  const chart = {
    status: "Available",
    points: [
      { atUtc: "2026-08-15T12:00:00Z", value: 1 },
      { atUtc: "2026-09-20T12:00:00Z", value: 2 },
    ],
  };
  assert.deepEqual(
    homeChartPoints(
      chart,
      "2026-08-01T12:00:00Z",
      "1M",
      "2026-10-19T12:00:00Z",
    ).map((point) => point[1]),
    [2],
  );
});

test("a flat chart has readable bounds and negative balances remain inside the axis", () => {
  assert.deepEqual(
    homeChartBounds([
      [1, 5000],
      [2, 5000],
    ]),
    { min: 0, max: 10000 },
  );
  assert.deepEqual(
    homeChartBounds([
      [1, -5000],
      [2, 6000],
    ]),
    { min: -10000, max: 10000 },
  );
  assert.deepEqual(
    homeChartBounds([
      [1, 0],
      [2, 0],
    ]),
    { min: 0, max: 1 },
  );
});
const record = (id) => ({
  id,
  type: "Deposit",
  status: "Completed",
  requestedAtUtc: "2026-01-01T00:00:00Z",
});
const page = (data, totalItems = data.length, hasNextPage = false) => ({
  success: true,
  data,
  pagination: { totalItems, hasNextPage },
});
test("deposit history confirms none only after a successful complete empty query", async () => {
  let details = 0;
  const result = await readHomeDepositHistory({
    list: async (params) => {
      assert.equal(params.type, "Deposit");
      assert.equal(params.status, "Completed");
      return page([]);
    },
    detail: async () => {
      details++;
    },
  });
  assert.equal(result.hasCompletedDeposit, false);
  assert.equal(details, 0);
  await assert.rejects(
    () =>
      readHomeDepositHistory({
        list: async () => {
          throw new Error("403");
        },
      }),
    /403/,
  );
  await assert.rejects(
    () => readHomeDepositHistory({ list: async () => ({ data: [] }) }),
    /confirmado/,
  );
});
test("history reads every page and uses execution timestamps rather than request dates", async () => {
  const result = await readHomeDepositHistory({
    list: async (params) =>
      params.page === 1 ? page([record("a")], 2, true) : page([record("b")], 2),
    detail: async (id) => ({
      ...record(id),
      completedAtUtc:
        id === "a" ? "2026-10-11T10:00:00Z" : "2026-10-09T10:00:00Z",
    }),
  });
  assert.equal(result.hasCompletedDeposit, true);
  assert.equal(result.firstDepositAtUtc, "2026-10-09T10:00:00Z");
});
test("a failed execution-date read preserves the fact that a deposit exists, without guessing its date", async () => {
  const result = await readHomeDepositHistory({
    list: async () => page([record("a")]),
    detail: async () => {
      throw new Error("503");
    },
  });
  assert.equal(result.hasCompletedDeposit, true);
  assert.equal(result.firstDepositAtUtc, null);
  assert.equal(result.dateUnavailable, true);
});
test("inconsistent, canceled or duplicated deposit records cannot be interpreted as an empty account", async () => {
  for (const response of [
    page([], 1),
    page([{ ...record("a"), status: "Canceled" }]),
    page([record("a"), record("a")]),
  ]) {
    await assert.rejects(() =>
      readHomeDepositHistory({
        list: async () => response,
        detail: async () => ({}),
      }),
    );
  }
});
test("a session change aborts history reading before it can start another request", async () => {
  let current = true,
    details = 0;
  await assert.rejects(
    () =>
      readHomeDepositHistory({
        list: async () => {
          current = false;
          return page([record("a")]);
        },
        detail: async () => {
          details++;
        },
        assertCurrent: () => {
          if (!current) throw new Error("session changed");
        },
      }),
    /session changed/,
  );
  assert.equal(details, 0);
});

test("an unavailable chart needs only one existence query, without scanning deposit history or reading details", async () => {
  let queries = 0;
  const result = await readHomeDepositHistory({
    executionDatesNeeded: false,
    list: async (params) => {
      queries++;
      assert.equal(params.pageSize, 1);
      return page([record("a")], 500, true);
    },
    detail: async () => {
      throw new Error("must not read details");
    },
  });
  assert.equal(result.hasCompletedDeposit, true);
  assert.equal(result.firstDepositAtUtc, null);
  assert.equal(queries, 1);
});
