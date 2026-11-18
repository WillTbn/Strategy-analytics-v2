import test from "node:test";
import assert from "node:assert/strict";
import {
  contractOverview,
  contractDirectoryRow,
  contractMoney,
  finiteContractValue,
  availableContractValue,
  readContractDirectory,
  validContractSeries,
  contractSeriesPeriod,
} from "../src/services/contractDirectory.js";
test("missing or blocked metrics never become zero and currencies never merge", () => {
  for (const v of [null, undefined, false, true, "", " ", Infinity, NaN, {}])
    assert.equal(finiteContractValue(v), null);
  assert.equal(finiteContractValue("0"), 0);
  assert.equal(
    availableContractValue({ status: "NotAvailable", value: 100 }),
    null,
  );
  assert.equal(contractMoney(false, "BRL"), "—");
  assert.equal(contractMoney(100, null), "—");
  const summaries = [
    {
      currencyIsoCode: "BRL",
      contractedCapital: { status: "Available", value: 100 },
    },
    {
      currencyIsoCode: "USD",
      contractedCapital: { status: "Available", value: 200 },
    },
  ];
  assert.deepEqual(
    contractOverview([], {
      access: { financialStatus: "Available" },
      summaries,
    }).applied,
    [
      { currency: "BRL", value: 100 },
      { currency: "USD", value: 200 },
    ],
  );
  assert.deepEqual(
    contractOverview([], { access: { financialStatus: "Blocked" }, summaries })
      .applied,
    [],
  );
});
test("active counter depends on complete supplied list, preserves empty and excludes closed", () => {
  assert.equal(contractOverview(null, null).active, null);
  assert.equal(contractOverview([], null).active, 0);
  assert.equal(
    contractOverview(
      [
        { businessStatus: { code: "ACTIVE" } },
        { businessStatus: { code: "CLOSED" } },
      ],
      null,
    ).active,
    1,
  );
  assert.equal(contractOverview([{}], null).active, null);
});
test("global contractual capital is never presented as the client's initial entry", () => {
  const row = contractDirectoryRow({
    id: "x",
    currencyCode: "USD",
    initialContractualCapital: 500000,
    myParticipation: { allocatedAmount: 200000, baseAmount: 200000 },
  });
  assert.equal(row.initial, null);
  assert.equal(row.base, 200000);
  assert.equal(row.current, null);
  assert.equal(row.next, null);
  assert.equal(row.currency, "USD");
  assert.equal(
    contractDirectoryRow({ entryValue: { status: "Available", value: 0 } })
      .initial,
    0,
  );
});
test("all contract pages are fetched once, no incomplete first-page counter", async () => {
  const calls = [];
  const rows = await readContractDirectory(async (path, params) => {
    calls.push([path, params.page]);
    return { data: [{ id: "c" + params.page }], pagination: { totalPages: 3 } };
  });
  assert.equal(rows.length, 3);
  assert.deepEqual(calls, [
    ["client/contracts", 1],
    ["client/contracts", 2],
    ["client/contracts", 3],
  ]);
});
test("canceled, duplicate and malformed paginated responses cannot replace a list", async () => {
  let current = true,
    calls = 0;
  assert.equal(
    await readContractDirectory(
      async () => {
        calls++;
        current = false;
        return { data: [{ id: "x" }] };
      },
      () => current,
    ),
    null,
  );
  assert.equal(calls, 1);
  await assert.rejects(
    readContractDirectory(async () => ({ data: [{ id: "x" }, { id: "x" }] })),
    /inconsistente/,
  );
  await assert.rejects(
    readContractDirectory(async () => ({ data: null })),
    /indisponíveis/,
  );
  await assert.rejects(
    readContractDirectory(async () => ({
      data: [],
      pagination: { totalPages: Infinity },
    })),
    /Paginação/,
  );
});
test("performance requires valid series and period filter uses supplied dates without mutating them", () => {
  for (const input of [
    null,
    [],
    [{ name: "x", data: [] }],
    [{ name: "x", data: [{ x: 1, y: false }] }],
    [{ name: "x", data: [{ x: "bad", y: 1 }] }],
  ])
    assert.equal(validContractSeries(input), false);
  const series = [
    {
      name: "x",
      data: [
        { x: Date.UTC(2025, 0, 1), y: 1 },
        { x: Date.UTC(2026, 9, 1), y: 0 },
        { x: Date.UTC(2026, 10, 1), y: 2 },
      ],
    },
  ];
  const original = JSON.stringify(series);
  assert.equal(contractSeriesPeriod(series, "1M")[0].data.length, 2);
  assert.equal(contractSeriesPeriod(series, "2026")[0].data.length, 2);
  assert.equal(JSON.stringify(series), original);
  assert.deepEqual(contractSeriesPeriod(null, "Máximo"), []);
});
