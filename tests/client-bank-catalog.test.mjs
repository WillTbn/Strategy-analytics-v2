import { test } from "node:test";
import assert from "node:assert/strict";
import { readBankCatalog } from "../src/services/clientBankCatalog.js";

const bank = (id) => ({ id, name: "Banco " + id, code: id });
const response = (page, data, pages, items) => ({
  success: true, data,
  pagination: { page, pageSize: 200, totalPages: pages, totalItems: items },
});
test("profile bank catalog includes later pages and preserves all API names", async () => {
  const calls = [];
  const records = Array.from({ length: 513 }, (_, i) => bank(String(i + 1)));
  const all = await readBankCatalog(async (params) => {
    calls.push(params);
    return response(params.page, records.slice((params.page - 1) * 200, params.page * 200), 3, 513);
  });
  assert.deepEqual(all, records);
  assert.deepEqual(calls, [{ page: 1, pageSize: 200 }, { page: 2, pageSize: 200 }, { page: 3, pageSize: 200 }]);
  assert.equal(all[512].name, "Banco 513");
});
test("an empty valid catalog returns an empty array without extra requests", async () => {
  let calls = 0;
  assert.deepEqual(await readBankCatalog(async () => { calls++; return response(1, [], 0, 0); }), []);
  assert.equal(calls, 1);
});
test("later-page failures reject the entire load instead of publishing a partial bank catalog", async () => {
  await assert.rejects(readBankCatalog(async ({ page }) => {
    if (page === 2) throw new Error("falha de rede");
    return response(1, [bank("1")], 2, 2);
  }), /falha de rede/);
});
test("pagination mismatches, repeated pages and truncated catalogs never appear as successful empty data", async () => {
  for (const invalid of [
    { ...response(1, [], 0, 0), success: false },
    { data: [] },
    { ...response(1, [], 0, 0), pagination: { page: 1, totalPages: null, totalItems: null } },
    response(2, [], 0, 0),
    response(1, [bank("1")], 0, 1),
    response(1, [bank("1")], 1, 2),
    response(1, [], 2, 2),
  ]) await assert.rejects(readBankCatalog(async () => invalid), /catálogo completo/);
});
test("a changing catalog and duplicated bank IDs stop the load", async () => {
  for (const second of [
    response(2, [bank("2")], 3, 3),
    response(2, [bank("1")], 2, 2),
  ]) await assert.rejects(readBankCatalog(async ({ page }) =>
    page === 1 ? response(1, [bank("1")], 2, 2) : second), /catálogo completo/);
});
test("a session change after the first page prevents subsequent reads and stale results", async () => {
  let current = true, calls = 0;
  await assert.rejects(readBankCatalog(async () => {
    calls++; current = false;
    return response(1, [bank("1")], 2, 2);
  }, () => { if (!current) throw new Error("sessão anterior"); }), /sessão anterior/);
  assert.equal(calls, 1);
});
