import { test } from "node:test";
import assert from "node:assert/strict";
import {
  employmentFields,
  newRegistrationEmployment,
  parseRegistrationAmount,
  validateRegistrationEmployment,
} from "../src/services/registrationEmployment.js";
test("the employment draft contains only the four Figma fields and no invented initial zero", () => {
  assert.deepEqual(
    Object.keys(newRegistrationEmployment()),
    employmentFields.map((field) => field.key),
  );
  assert.equal(newRegistrationEmployment().occupation, null);
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
  const errors = validateRegistrationEmployment(draft);
  assert.deepEqual(Object.keys(errors).sort(), [
    "declaredNetWorth",
    "householdMonthlyIncome",
    "individualMonthlyIncome",
  ]);
  assert.deepEqual(draft, copy);
  assert.ok(!JSON.stringify(errors).includes("9876.54"));
});
test("catalog and requiredness come from supplied rules without adding employment metadata or income ranges", () => {
  const options = [{ value: "test-only", label: "Atividade de teste" }];
  assert.deepEqual(
    validateRegistrationEmployment(newRegistrationEmployment()),
    {},
  );
  assert.equal(
    Object.keys(
      validateRegistrationEmployment(
        newRegistrationEmployment(),
        options,
        employmentFields.map((f) => f.key),
      ),
    ).length,
    4,
  );
  assert.ok(
    validateRegistrationEmployment(
      { ...newRegistrationEmployment(), occupation: "invented" },
      options,
    ).occupation,
  );
  assert.deepEqual(
    validateRegistrationEmployment(
      {
        ...newRegistrationEmployment(),
        occupation: "test-only",
        individualMonthlyIncome: "2",
        householdMonthlyIncome: "1",
        declaredNetWorth: "0",
      },
      options,
    ),
    {},
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
