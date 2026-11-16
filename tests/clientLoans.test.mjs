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

test('collateral flow cannot reach local fake success and clamps a restored final step',async()=>{
 const Vue=await import('vue'),{parse,compileScript}=await import('@vue/compiler-sfc');
 const context=vm.createContext({console,Function}),step=Vue.ref(5),notices=[];
 const file='src/system/pages/loan/CollateraLoanPage.vue';const {descriptor}=parse(readFileSync(file,'utf8'));const script=compileScript(descriptor,{id:file});
 const deps={vue:Vue,quasar:{useQuasar:()=>({notify:value=>notices.push(value)})},'src/stores/loan':{useLoanStore:()=>({})},pinia:{storeToRefs:()=>({step_collateral:step,loan_callateral:Vue.ref([])})}};
 const m=new vm.SourceTextModule(script.content,{context});await m.link(async name=>{const values=deps[name]||{default:{}};return new vm.SyntheticModule(Object.keys(values),function(){for(const k in values)this.setExport(k,values[k])},{context})});await m.evaluate();const scope=Vue.effectScope();const h=scope.run(()=>m.namespace.default.setup({}, {expose(){}}));assert.equal(step.value,3);h.nextStep();assert.equal(step.value,3);assert.equal(notices.length,1);h.backStep();assert.equal(step.value,2);h.nextStep();assert.equal(step.value,3);scope.stop();
});
test('changed loan and wallet templates compile, including gated offer slots',async()=>{
 const {parse,compileScript,compileTemplate}=await import('@vue/compiler-sfc');
 for(const file of ['src/system/pages/loan/CollateraLoanPage.vue','src/system/pages/loan/OffersFinalLoanPage.vue','src/system/layouts/loans/consortium/steps/OffersConsortiumLayout.vue','src/system/layouts/loans/collateral/InstallmentCollateralLayout.vue','src/system/pages/Wallet/CashWalletPage.vue','src/system/layouts/leverage/LendingAccess.vue']){const {descriptor}=parse(readFileSync(file,'utf8'));const script=compileScript(descriptor,{id:file});const compiled=compileTemplate({source:descriptor.template.content,filename:file,id:file,compilerOptions:{bindingMetadata:script.bindings}});assert.deepEqual(compiled.errors,[],file);}
});
