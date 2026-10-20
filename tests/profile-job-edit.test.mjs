import { test } from "node:test";
import assert from "node:assert/strict";
import { profileAmount, profileJobChanges, saveProfileJob } from "../src/services/profileJobEdit.js";
const p = { occupation: "Analista QA", employerName: "Empresa QA", validFrom: "2025-01-01", validTo: null, isCurrent: true };
const f = { individualMonthlyIncome: "1234.56", householdMonthlyIncome: null, declaredNetWorth: 0, currencyCode: "BRL", effectiveFrom: "2025-01-01", effectiveTo: null };
const draft = () => ({ occupation: p.occupation, ...f });
test("optional empty amounts remain null while explicit zero and precise decimals survive", () => {
  assert.equal(profileAmount(""), null);
  assert.equal(profileAmount(null), null);
  assert.equal(profileAmount(0), "0");
  assert.equal(profileAmount("9007199254740993.01"), "9007199254740993.01");
  const changes = profileJobChanges(p, f, { ...draft(), individualMonthlyIncome: "1234.57", householdMonthlyIncome: "" });
  assert.equal(changes.professional, null);
  assert.deepEqual(changes.financial, { ...f, individualMonthlyIncome: "1234.57", declaredNetWorth: "0" });
});
test("equivalent numeric formatting does not rewrite either unchanged profile", () => {
  assert.deepEqual(profileJobChanges(p, f, { ...draft(), occupation: " Analista QA ", individualMonthlyIncome: "001234.5600", householdMonthlyIncome: "", declaredNetWorth: "0.00" }), { professional: null, financial: null });
});
test("an intentional clear changes a saved amount to null without erasing metadata", () => {
  const changes = profileJobChanges(p, f, { ...draft(), individualMonthlyIncome: "" });
  assert.equal(changes.professional, null);
  assert.equal(changes.financial.individualMonthlyIncome, null);
  assert.equal(changes.financial.currencyCode, "BRL");
  assert.equal(changes.financial.effectiveFrom, f.effectiveFrom);
});
test("occupation-only changes retain professional metadata and do not rewrite financial data", () => {
  assert.deepEqual(profileJobChanges(p, f, { ...draft(), occupation: "Novo cargo QA" }), { professional: { ...p, occupation: "Novo cargo QA" }, financial: null });
});
test("invalid amounts fail preflight even when occupation also changed", () => {
  for (const amount of ["-1", "abc", "1,2", "1e309", Infinity, {}, true])
    assert.throws(() => profileJobChanges(p, f, { ...draft(), occupation: "Novo cargo QA", individualMonthlyIncome: amount }), /financeiros/);
  assert.throws(() => profileJobChanges(p, f, { ...draft(), occupation: "" }), /atividade/);
});


test("retry after a partial save preserves the draft and skips the confirmed professional write", async () => {
  const baseline = { professional: { ...p }, financial: { ...f } };
  const edited = { ...draft(), occupation: "Novo cargo QA", individualMonthlyIncome: "2345.67" };
  const originalDraft = structuredClone(edited);
  const writes = [];
  let failFinancial = true;
  const operations = {
    assertSession() {},
    async professional(payload) { writes.push(["professional", payload]); },
    async financial(payload) {
      writes.push(["financial", payload]);
      if (failFinancial) throw new Error("indisponível");
    },
  };
  await assert.rejects(saveProfileJob(baseline, edited, operations), /indisponível/);
  assert.deepEqual(edited, originalDraft);
  assert.equal(baseline.professional.occupation, edited.occupation);
  assert.equal(baseline.financial.individualMonthlyIncome, f.individualMonthlyIncome);
  failFinancial = false;
  await saveProfileJob(baseline, edited, operations);
  assert.deepEqual(writes.map(([section]) => section), ["professional", "financial", "financial"]);
  assert.equal(baseline.financial.individualMonthlyIncome, "2345.67");
  await saveProfileJob(baseline, edited, operations);
  assert.equal(writes.length, 3);
});
test("a failed first write leaves both sections pending, without sending financial data", async () => {
  const baseline = { professional: { ...p }, financial: { ...f } };
  let financialCalls = 0;
  await assert.rejects(saveProfileJob(baseline, { ...draft(), occupation: "Novo cargo QA", declaredNetWorth: "5" }, {
    assertSession() {},
    async professional() { throw new Error("falha"); },
    async financial() { financialCalls++; },
  }), /falha/);
  assert.deepEqual(baseline, { professional: p, financial: f });
  assert.equal(financialCalls, 0);
});
test("changing sessions during the first write stops subsequent writes and local confirmation", async () => {
  const baseline = { professional: { ...p }, financial: { ...f } };
  let current = true, financialCalls = 0;
  await assert.rejects(saveProfileJob(baseline, { ...draft(), occupation: "Novo cargo QA", declaredNetWorth: "5" }, {
    assertSession() { if (!current) throw new Error("sessão alterada"); },
    async professional() { current = false; },
    async financial() { financialCalls++; },
  }), /sessão alterada/);
  assert.equal(financialCalls, 0);
  assert.deepEqual(baseline.professional, p);
});
