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

test("collateral draft validates each step and never reaches a fake submitted state", async () => {
  const Vue = await import("vue"),
    { parse, compileScript } = await import("@vue/compiler-sfc");
  const draftRules = await import("../src/services/loanRequestDraft.js");
  const presentation = await import("../src/services/profilePresentation.js");
  const offerPresentation = await import(
    "../src/services/loanOfferPresentation.js"
  );
  const context = vm.createContext({ console, Function });
  const file = "src/system/components/loan/CollateralRequestWizard.vue";
  const { descriptor } = parse(readFileSync(file, "utf8"));
  const script = compileScript(descriptor, { id: file });
  const deps = {
    vue: Vue,
    "src/services/loanRequestDraft": draftRules,
    "src/services/profilePresentation": presentation,
    "src/services/loanOfferPresentation": offerPresentation,
  };
  const module = new vm.SourceTextModule(script.content, { context });
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
  const scope = Vue.effectScope(),
    events = [];
  const h = scope.run(() =>
    module.namespace.default.setup(
      {},
      { expose() {}, emit: (event) => events.push(event) },
    ),
  );
  h.next();
  assert.equal(h.step.value, 0);
  assert.match(h.error.value, /motivo/);
  h.draft.reason = "investment";
  h.next();
  assert.equal(h.step.value, 1);
  h.next();
  assert.equal(h.step.value, 1);
  assert.match(h.error.value, /valor/);
  h.draft.amount = 200000;
  h.next();
  assert.equal(h.step.value, 2);
  h.next();
  assert.equal(h.step.value, 2);
  assert.match(h.error.value, /parcelamento/);
  h.draft.installments = 60;
  h.next();
  assert.equal(h.step.value, 3);
  for (let i = 0; i < 5; i++) h.next();
  assert.equal(h.step.value, 3);
  assert.ok(h.summaryRows.value.some((row) => row[1] === "Indisponível"));
  assert.deepEqual(events, []);
  h.back();
  assert.equal(h.step.value, 2);
  scope.stop();
});
test("changed loan and wallet templates compile, including gated offer slots", async () => {
  const { parse, compileScript, compileTemplate } = await import(
    "@vue/compiler-sfc"
  );
  for (const file of [
    "src/system/components/loan/CollateralRequestWizard.vue",
    "src/system/components/loan/SecuredRequestWizard.vue",
    "src/system/components/loan/LoanAmountControl.vue",
    "src/system/pages/loan/SecuredLoanPage.vue",
    "src/system/pages/loan/ConsortiumLoanPage.vue",
    "src/system/pages/loan/CollateraLoanPage.vue",
    "src/system/pages/loan/OffersFinalLoanPage.vue",
    "src/system/layouts/loans/consortium/steps/OffersConsortiumLayout.vue",
    "src/system/layouts/loans/collateral/InstallmentCollateralLayout.vue",
    "src/system/pages/Wallet/CashWalletPage.vue",
    "src/system/layouts/leverage/LendingAccess.vue",
  ]) {
    const { descriptor } = parse(readFileSync(file, "utf8"));
    const script = compileScript(descriptor, { id: file });
    const compiled = compileTemplate({
      source: descriptor.template.content,
      filename: file,
      id: file,
      compilerOptions: { bindingMetadata: script.bindings },
    });
    assert.deepEqual(compiled.errors, [], file);
  }
});
