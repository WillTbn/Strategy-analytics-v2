import { test } from "node:test";
import assert from "node:assert/strict";
import {
  appendRegistrationNationality,
  newRegistrationPersonal,
  personalCatalogReady,
  validBirthDate,
  validateRegistrationPersonal,
} from "../src/services/registrationPersonal.js";

// Injected fixtures only: never used as HTTP enum values or options in the preview.
const catalog = {
  genders: [{ value: "gender-test", label: "Gênero de teste" }],
  maritalStatuses: [{ value: "civil-test", label: "Estado de teste" }],
  nationalities: [
    { value: "nationality-a", label: "Nacionalidade A" },
    { value: "nationality-b", label: "Nacionalidade B" },
  ],
  countries: [{ value: "country-test", label: "País de teste" }],
};
const today = new Date(2026, 9, 20, 19);
const valid = () => ({
  ...newRegistrationPersonal(),
  birthDate: "29/02/2000",
  gender: "gender-test",
  maritalStatus: "civil-test",
  nationalities: ["nationality-a", "nationality-b"],
  birthCountry: "country-test",
  birthCity: "São João d'Aliança",
});

test("birth date checks leap years, actual calendar dates and the local day boundary", () => {
  for (const date of ["29/02/2000", "20/10/2026", "01/01/0001", "01/01/1800"])
    assert.equal(validBirthDate(date, today), true, date);
  for (const date of [
    "29/02/1900",
    "31/04/2000",
    "00/12/2000",
    "01/00/2000",
    "01/13/2000",
    "01/01/0000",
    "21/10/2026",
    "2020-01-01",
    "1/1/2000",
    "20/10/26",
    "",
  ])
    assert.equal(validBirthDate(date, today), false, date);
});
test("blank fields are not declared mandatory without confirmed rules", () => {
  assert.deepEqual(validateRegistrationPersonal(newRegistrationPersonal()), {});
  assert.deepEqual(
    validateRegistrationPersonal(valid(), catalog, { today }),
    {},
  );
  const errors = validateRegistrationPersonal(
    newRegistrationPersonal(),
    catalog,
    {
      required: [
        "birthDate",
        "gender",
        "maritalStatus",
        "nationalities",
        "birthCountry",
        "birthCity",
      ],
    },
  );
  assert.equal(Object.keys(errors).length, 6);
});
test("catalog readiness requires all four lists without manufacturing options", () => {
  assert.equal(personalCatalogReady(), false);
  assert.equal(personalCatalogReady(catalog), true);
  for (const key of Object.keys(catalog))
    assert.equal(personalCatalogReady({ ...catalog, [key]: [] }), false);
});
test("selections must belong to their supplied catalog and nationality duplicates are rejected", () => {
  const errors = validateRegistrationPersonal(
    {
      ...valid(),
      gender: "invented",
      maritalStatus: "invented",
      birthCountry: "invented",
      nationalities: ["nationality-a", "nationality-a"],
    },
    catalog,
    { today },
  );
  assert.deepEqual(Object.keys(errors).sort(), [
    "birthCountry",
    "gender",
    "maritalStatus",
    "nationalities",
  ]);
  assert.ok(
    validateRegistrationPersonal(
      { ...valid(), nationalities: ["invented"] },
      catalog,
    ).nationalities,
  );
});
test("an extra blank nationality is harmless because Figma has no remove action", () => {
  const draft = valid();
  assert.equal(appendRegistrationNationality(draft), true);
  assert.deepEqual(draft.nationalities, [
    "nationality-a",
    "nationality-b",
    null,
  ]);
  assert.deepEqual(validateRegistrationPersonal(draft, catalog, { today }), {});
  assert.equal(appendRegistrationNationality(draft), false);
  assert.equal(draft.nationalities.length, 3);
});
test("draft copies preserve exact city and date without sharing lists or adding profile fields", () => {
  const first = valid(),
    second = newRegistrationPersonal(first);
  second.nationalities[0] = "edited";
  assert.equal(first.nationalities[0], "nationality-a");
  assert.deepEqual(Object.keys(second).sort(), [
    "birthCity",
    "birthCountry",
    "birthDate",
    "gender",
    "maritalStatus",
    "nationalities",
  ]);
  const fresh = newRegistrationPersonal();
  fresh.nationalities[0] = "edited";
  assert.deepEqual(newRegistrationPersonal().nationalities, [null]);
  assert.equal(second.birthCity, first.birthCity);
});
test("validation preserves draft after failure and does not echo personal data", () => {
  const draft = {
      ...valid(),
      birthDate: "31/02/2000",
      birthCountry: "private-unrecognized-value",
    },
    copy = structuredClone(draft);
  const errors = validateRegistrationPersonal(draft, catalog, { today });
  assert.deepEqual(draft, copy);
  assert.ok(errors.birthDate);
  assert.ok(!JSON.stringify(errors).includes(draft.birthCountry));
  assert.ok(!JSON.stringify(errors).includes(draft.birthDate));
});
