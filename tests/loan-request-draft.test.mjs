import test from "node:test";
import assert from "node:assert/strict";
import {
  newSecuredDraft,
  securedStepError,
  clearInapplicableLoanFields,
  validLoanAmount,
  securedDisplayStep,
} from "../src/services/loanRequestDraft.js";
test("property and vehicle drafts never share amounts, owners or spouse identifiers", () => {
  const property = newSecuredDraft(),
    vehicle = newSecuredDraft();
  property.amount = 200000;
  property.owners.push("Meu Nome");
  property.spouseRg = "QA";
  assert.equal(vehicle.amount, null);
  assert.deepEqual(vehicle.owners, []);
  assert.equal(vehicle.spouseRg, "");
  property.creditAmount = 400000;
  property.installmentAmount = 1000;
  property.consortiumMode = "installment";
  assert.equal(property.creditAmount, 400000);
  assert.equal(property.installmentAmount, 1000);
  assert.equal(vehicle.creditAmount, null);
});
test("amount boundaries reject missing, non-finite, string and out-of-range values", () => {
  for (const value of [null, "", "50000", NaN, Infinity, 49999.99, 3000000.01])
    assert.equal(validLoanAmount(value), false);
  for (const value of [50000, 200000, 3000000])
    assert.equal(validLoanAmount(value), true);
  assert.equal(validLoanAmount(6000, 300, 6000), true);
  assert.equal(validLoanAmount(6000.01, 300, 6000), false);
});
test("request cannot skip amount, reason or required time selection", () => {
  const draft = newSecuredDraft();
  for (const step of [0, 1, 2])
    assert.ok(securedStepError(draft, step, "imovel"));
  draft.reason = "vehicle";
  assert.ok(securedStepError(draft, 1, "imovel"));
  assert.equal(securedStepError(draft, 1, "automovel"), "");
  draft.neededBy = "Em até 30 dias";
  assert.equal(securedStepError(draft, 2, "imovel"), "");
});
test("conditional values are cleared without mutating unrelated values", () => {
  const draft = {
    ...newSecuredDraft(),
    spouse: false,
    spouseCpf: "QA",
    spouseRg: "QA",
    noNumber: true,
    number: "100",
    unknownPostalCode: true,
    postalCode: "12345678",
    paying: false,
    outstanding: 1000,
    complement: "Bloco de teste",
  };
  clearInapplicableLoanFields(draft);
  assert.equal(draft.spouseCpf, "");
  assert.equal(draft.spouseRg, "");
  assert.equal(draft.number, "");
  assert.equal(draft.postalCode, "");
  assert.equal(draft.outstanding, null);
  assert.equal(draft.complement, "Bloco de teste");
});
test("spouse must be explicitly chosen and CPF validated only when applicable", () => {
  const draft = newSecuredDraft();
  assert.ok(securedStepError(draft, 3, "imovel"));
  draft.spouse = false;
  assert.equal(securedStepError(draft, 3, "imovel"), "");
  draft.spouse = true;
  draft.spouseCpf = "11111111111";
  draft.spouseRg = "TESTE";
  assert.ok(securedStepError(draft, 3, "imovel"));
});
test("property requires valid CEP or declaration, number or no-number, and positive area", () => {
  const draft = {
    ...newSecuredDraft(),
    propertyType: "Casa residencial",
    propertyValue: 200000,
    postalCode: "12345-678",
    number: "100",
    area: "80",
  };
  assert.equal(securedStepError(draft, 4, "imovel"), "");
  draft.postalCode = "123";
  assert.ok(securedStepError(draft, 4, "imovel"));
  draft.unknownPostalCode = true;
  draft.noNumber = true;
  draft.number = "";
  assert.equal(securedStepError(draft, 4, "imovel"), "");
  for (const area of ["0", "-1", "x", "Infinity"]) {
    draft.area = area;
    assert.ok(securedStepError(draft, 4, "imovel"));
  }
});
test("outstanding payment is separate from complement and required only when financed", () => {
  const draft = {
    ...newSecuredDraft(),
    owners: ["Meu Nome"],
    paying: true,
    registration: "yes",
    occupancy: "no",
    contracting: "self",
    complement: "Bloco de teste",
  };
  assert.ok(securedStepError(draft, 5, "imovel"));
  draft.outstanding = 10000;
  assert.equal(securedStepError(draft, 5, "imovel"), "");
  draft.paying = false;
  clearInapplicableLoanFields(draft);
  assert.equal(draft.complement, "Bloco de teste");
  assert.equal(securedStepError(draft, 5, "imovel"), "");
});
test("vehicle cannot pretend a valid FIPE simulation without a real catalogue", () => {
  const draft = {
    ...newSecuredDraft(),
    vehicleOwner: "Meu Nome",
    plate: "ABC1D23",
    model: "Modelo Carro",
  };
  assert.match(securedStepError(draft, 4, "automovel"), /FIPE/);
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5].map(securedDisplayStep),
    [1, 2, 3, 3, 4, 4],
  );
});
