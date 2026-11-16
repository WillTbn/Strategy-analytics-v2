import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
async function load(file) {
  const context = vm.createContext({ console });
  const m = new vm.SourceTextModule(readFileSync(file, "utf8"), { context });
  await m.link(
    () =>
      new vm.SyntheticModule(
        ["financeGet"],
        function () {
          this.setExport("financeGet", () => {});
        },
        { context },
      ),
  );
  await m.evaluate();
  return m.namespace;
}
const loans = await load("src/services/clientLoans.js"),
  wallet = await load("src/services/clientWalletOperations.js");
test("loan pagination reads every confirmed page and discards stale contexts", async () => {
  let calls = 0;
  const rows = await loans.listClientLoans(async () => ({
    data: [{ id: String(++calls) }],
    pagination: { totalPages: 2 },
  }));
  assert.equal(rows.length, 2);
  assert.equal(calls, 2);
  assert.equal(
    (
      await loans.listClientLoans(
        async () => {
          throw Error("should not read");
        },
        () => false,
      )
    ).length,
    0,
  );
  await assert.rejects(() =>
    loans.listClientLoans(async () => ({ data: null })),
  );
});
test("debt totals preserve currencies and unknown values, without assuming principal is outstanding", () => {
  const result = loans.loanDebtAmounts([
    {
      status: "Active",
      currencyIsoCode: "BRL",
      principalAmount: 900,
      outstandingAmount: null,
    },
    { status: "Active", currencyIsoCode: "USD", outstandingAmount: 100 },
    { status: "PaidOff", currencyIsoCode: "USD", outstandingAmount: 200 },
  ]);
  assert.equal(result.find((r) => r.currency === "BRL").value, null);
  assert.equal(result.find((r) => r.currency === "USD").value, 100);
});
test("loan grouping and access use real status/level, never the legacy store default", () => {
  assert.equal(loans.lendingLevel({ documentLevel: 2 }), 2);
  assert.equal(loans.lendingLevel({}), null);
  assert.equal(loans.lendingLevel({ documentLevel: "bad" }), null);
  assert.equal(
    loans.loansByStatus(
      [{ status: "Active" }, { status: "PaidOff" }],
      "actives",
    ).length,
    1,
  );
});
test("withdrawal resolves currency ID only from confirmed Free wallet and rejects excess", () => {
  const form = { currency: "BRL", amount: 10, bankId: "bank" },
    rows = [
      {
        type: "Free",
        currencyId: "brl",
        currencyIsoCode: "BRL",
        available: 20,
      },
    ];
  assert.equal(wallet.clientWithdrawalPayload(form, rows).currencyId, "brl");
  assert.throws(() =>
    wallet.clientWithdrawalPayload({ ...form, amount: 21 }, rows),
  );
  assert.throws(() =>
    wallet.clientWithdrawalPayload(form, [{ ...rows[0], available: null }]),
  );
});
test("withdrawal cannot pretend to verify a password the documented DTO cannot receive", async () => {
  let reads = 0;
  await assert.rejects(
    () =>
      wallet.submitClientWalletOperation(
        {
          mode: "withdrawal",
          currency: "BRL",
          amount: 1,
          bankId: "bank",
          withdrawalPassword: "test",
        },
        async () => {
          reads++;
          return {
            data: [
              {
                type: "Free",
                currencyId: "brl",
                currencyIsoCode: "BRL",
                available: 20,
              },
            ],
          };
        },
      ),
    /senha/,
  );
  assert.equal(reads, 1);
});
