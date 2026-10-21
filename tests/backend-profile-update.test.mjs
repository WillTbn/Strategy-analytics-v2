import test from "node:test";
import assert from "node:assert/strict";
import {
  personalRegistrationPatch,
  addressRegistrationPatch,
  registrationAddressValues,
  financialRegistrationPayload,
  contactRegistrationPayload,
  registrationCatalog,
} from "../src/services/registrationIntegration.js";
import {
  currentProfilePatch,
  basicProfileDraft,
  basicProfilePatch,
  locationProfilePatch,
} from "../src/services/profileEdit.js";
import {
  newRegistrationPersonal,
  validateRegistrationPersonal,
  appendRegistrationNationality,
} from "../src/services/registrationPersonal.js";
import { profileJobChanges } from "../src/services/profileJobEdit.js";
import {
  profileShareScope,
  publicProfileFields,
} from "../src/services/profileShare.js";
const profile = {
  birthDate: "1990-01-01",
  names: [{ id: "name", kind: "Legal", displayName: "QA", isPrimary: true }],
  contacts: [],
  addresses: [
    {
      id: "home",
      kind: "Residential",
      isPrimary: true,
      line1: "Rua, 100",
      line2: "Sala",
      neighborhood: "Centro",
      city: "Cidade",
      countryId: "br",
    },
  ],
  personalDetails: {
    gender: "Other",
    maritalStatus: "Single",
    nationality: "Legado",
    birthCountryId: "pt",
    nationalityCountryIds: ["br", "pt"],
  },
};
const catalog = {
  countries: [
    { id: "br", name: "Brasil" },
    { id: "pt", name: "Portugal" },
  ],
  genders: [{ value: "Other", label: "Outro" }],
  maritalStatuses: [{ value: "Single", label: "Solteiro(a)" }],
};
test("registration saves all nationalities and birthplace IDs and resumes supported values", () => {
  const c = registrationCatalog(catalog, profile, {});
  const draft = newRegistrationPersonal({
    nationalities: ["br", "pt"],
    birthCountry: "pt",
    gender: "Other",
    maritalStatus: "Single",
  });
  assert.equal(validateRegistrationPersonal(draft, c).nationalities, undefined);
  const result = personalRegistrationPatch(profile, draft);
  assert.deepEqual(result.personalDetails.nationalityCountryIds, ["br", "pt"]);
  assert.equal(result.personalDetails.birthCountryId, "pt");
  assert.equal(result.personalDetails.nationality, "Legado");
  assert.deepEqual(
    currentProfilePatch(result).personalDetails.nationalityCountryIds,
    ["br", "pt"],
  );
  assert.deepEqual(basicProfileDraft(result).nationality, ["br", "pt"]);
  assert.deepEqual(
    personalRegistrationPatch(profile, { nationalities: [] }).personalDetails
      .nationalityCountryIds,
    [],
  );
});
test("nationality limits reject repeated and fourth countries before submission", () => {
  const c = {
    ...registrationCatalog(catalog, profile, {}),
    nationalities: ["br", "pt", "us", "jp"].map((value) => ({
      value,
      label: value,
    })),
  };
  for (const selected of [
    ["br", "br"],
    ["br", "pt", "us", "jp"],
  ]) {
    assert.ok(
      validateRegistrationPersonal({ nationalities: selected }, c)
        .nationalities,
    );
    assert.throws(
      () => personalRegistrationPatch(profile, { nationalities: selected }),
      /nacionalidades/,
    );
  }
  assert.equal(
    appendRegistrationNationality({ nationalities: ["br", "pt", "us"] }),
    false,
  );
});
test("neighborhood persists independently from complement and has the confirmed length limit", () => {
  const draft = {
    values: {
      street: "Rua",
      number: "100",
      city: "Cidade",
      district: "Bairro QA",
      complement: "Sala",
    },
  };
  const result = addressRegistrationPatch(profile, draft, "br");
  assert.equal(result.addresses[0].neighborhood, "Bairro QA");
  assert.equal(result.addresses[0].line2, "Sala");
  assert.equal(
    registrationAddressValues(result.addresses[0], "br").district,
    "Bairro QA",
  );
  assert.equal(
    locationProfilePatch(profile, {
      ...profile.addresses[0],
      neighborhood: "Outro",
    }).addresses[0].neighborhood,
    "Outro",
  );
  assert.deepEqual(
    currentProfilePatch(profile).personalDetails.nationalityCountryIds,
    ["br", "pt"],
  );
  assert.throws(
    () =>
      addressRegistrationPatch(
        profile,
        { values: { ...draft.values, district: "a".repeat(121) } },
        "br",
      ),
    /120/,
  );
  assert.throws(
    () => locationProfilePatch(profile, { neighborhood: "a".repeat(121) }),
    /120/,
  );
});
test("financial writes omit a legacy end date even when the current profile has one", () => {
  const current = {
    currencyCode: "BRL",
    effectiveFrom: "2026-10-20",
    effectiveTo: "2026-10-20",
    individualMonthlyIncome: 1,
    householdMonthlyIncome: 2,
    declaredNetWorth: 0,
  };
  const registration = financialRegistrationPayload(
    current,
    {
      individualMonthlyIncome: "3",
      householdMonthlyIncome: "4",
      declaredNetWorth: "0",
    },
    "2026-10-21",
  );
  assert.ok(!Object.hasOwn(registration, "effectiveTo"));
  const change = profileJobChanges({ occupation: "QA" }, current, {
    occupation: "QA",
    individualMonthlyIncome: "3",
    householdMonthlyIncome: "4",
    declaredNetWorth: 0,
  });
  assert.ok(!Object.hasOwn(change.financial, "effectiveTo"));
  assert.equal(current.effectiveTo, "2026-10-20");
});
test("new trusted contacts do not invent relationships or email", () => {
  assert.deepEqual(
    contactRegistrationPayload(null, {
      name: " QA ",
      phoneNumber: " +5511999999999 ",
    }),
    {
      name: "QA",
      phoneNumber: "+5511999999999",
      relationship: null,
      email: null,
    },
  );
});
test("shared profiles use explicit scopes and never render arbitrary returned properties", () => {
  assert.equal(profileShareScope("Profile"), "Basic");
  assert.equal(profileShareScope("Full"), "Full");
  assert.throws(() => profileShareScope("Anything"));
  assert.deepEqual(
    publicProfileFields({
      scope: "Basic",
      occupation: "Hidden",
      documentLevel: 1,
      email: "private",
    }),
    [],
  );
  assert.deepEqual(
    publicProfileFields({
      scope: "Full",
      occupation: "QA",
      documentLevel: 1,
      email: "private",
      scopeInternal: "secret",
    }).map((f) => f.label),
    ["Atividade trabalhista", "Nível documental"],
  );
});
