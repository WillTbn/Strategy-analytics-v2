import { test } from "node:test";
import assert from "node:assert/strict";
import { profileAmount, profileJobChanges } from "../src/services/profileJobEdit.js";
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
