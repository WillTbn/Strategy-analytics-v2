import { test } from "node:test";
import assert from "node:assert/strict";
import {
  employmentFields,
  newRegistrationEmployment,
  parseRegistrationAmount,
  validateRegistrationEmployment,
} from "../src/services/registrationEmployment.js";
test("the employment draft contains the business fields authorized by design and QA and no invented initial zero", () => {
  assert.deepEqual(
    Object.keys(newRegistrationEmployment()),
    employmentFields.map((field) => field.key),
  );
  assert.equal(newRegistrationEmployment().occupation, "");
  assert.equal(newRegistrationEmployment().declaredNetWorth, "");
  assert.equal(parseRegistrationAmount("").kind, "empty");
  assert.deepEqual(parseRegistrationAmount("0"), {
    kind: "valid",
    decimal: "0.00",
  });
});
test("Brazilian currency input preserves cents and grouping without binary floating point", () => {
  for (const [input, decimal] of [
    ["R$ 1.234,56", "1234.56"],
    ["R$ 0,01", "0.01"],
    ["1234", "1234.00"],
    ["1.234", "1234.00"],
    ["000,1", "0.10"],
    ["999.999.999.999.999.999,99", "999999999999999999.99"],
  ])
    assert.deepEqual(parseRegistrationAmount(input), {
      kind: "valid",
      decimal,
    });
});
test("malformed, negative and ambiguous values are rejected rather than rounded or silently coerced", () => {
  for (const input of [
    "-1,00",
    "1.23",
    "1,234",
    "1.00,00",
    "1e3",
    "NaN",
    "Infinity",
    "$1,00",
    "1 234,56",
    "1,",
    "R$",
    "1,00abc",
  ])
    assert.equal(parseRegistrationAmount(input).kind, "invalid", input);
});
test("all three monetary fields validate independently and failure preserves the exact draft", () => {
  const draft = {
      ...newRegistrationEmployment(),
      individualMonthlyIncome: "-1",
      householdMonthlyIncome: "9876.54",
      declaredNetWorth: "1,234",
    },
    copy = { ...draft };
  const errors = validateRegistrationEmployment(draft, [], []);
  assert.deepEqual(Object.keys(errors).sort(), [
    "declaredNetWorth",
    "householdMonthlyIncome",
    "individualMonthlyIncome",
  ]);
  assert.deepEqual(draft, copy);
  assert.ok(!JSON.stringify(errors).includes("9876.54"));
});
test("free-text occupation is required, employer optional, and both currencies come from the API catalogue", () => {
  const options = [
    { value: "BRL", label: "Real" },
    { value: "USD", label: "Dólar" },
  ];
  const draft = newRegistrationEmployment();
  assert.deepEqual(
    Object.keys(validateRegistrationEmployment(draft, options)),
    ["occupation", "primaryCurrencyCode", "secondaryCurrencyCode"],
  );
  Object.assign(draft, {
    occupation: "Analista",
    primaryCurrencyCode: "BRL",
    secondaryCurrencyCode: "USD",
  });
  assert.deepEqual(validateRegistrationEmployment(draft, options), {});
  assert.deepEqual(
    validateRegistrationEmployment({ ...draft, employerName: "" }, options),
    {},
  );
  assert.ok(
    validateRegistrationEmployment(
      { ...draft, secondaryCurrencyCode: "INVALID" },
      options,
    ).secondaryCurrencyCode,
  );
  assert.ok(
    validateRegistrationEmployment({ ...draft, occupation: "   " }, options)
      .occupation,
  );
});
test("copied drafts preserve user strings and isolate state for navigation", () => {
  const original = {
      ...newRegistrationEmployment(),
      individualMonthlyIncome: "R$ 1.234,56",
    },
    copy = newRegistrationEmployment(original);
  copy.individualMonthlyIncome = "0";
  assert.equal(original.individualMonthlyIncome, "R$ 1.234,56");
  assert.equal(newRegistrationEmployment().individualMonthlyIncome, "");
});
