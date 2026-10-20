import { test } from "node:test";
import assert from "node:assert/strict";
import {
  personalRegistrationPatch,
  addressRegistrationPatch,
  financialRegistrationPayload,
  professionalRegistrationPayload,
  contactRegistrationPayload,
  documentRegistrationPayload,
  registrationCatalog,
} from "../src/services/registrationIntegration.js";
import { newRegistrationDocuments } from "../src/services/registrationDocuments.js";
const profile = () => ({
  birthDate: "1990-01-02",
  names: [
    {
      id: "name",
      kind: "Legal",
      displayName: "Teste",
      validFrom: "2020-01-01",
      validTo: null,
      isPrimary: true,
    },
  ],
  contacts: [
    { id: "email", kind: "Email", value: "qa@example.com", isPrimary: true },
  ],
  addresses: [
    {
      id: "secondary",
      kind: "Other",
      line1: "Secundário",
      isPrimary: false,
      countryId: "other",
    },
  ],
  personalDetails: {
    gender: null,
    maritalStatus: null,
    nationality: null,
    birthCity: null,
    birthState: "existing-state",
    motherName: "Preservar",
    fatherName: null,
  },
});
test("personal save maps dates and existing fields while preserving unrelated data without unsupported extras", () => {
  const original = profile(),
    p = personalRegistrationPatch(original, {
      birthDate: "29/02/2000",
      gender: null,
      maritalStatus: null,
      nationalities: ["BR", "PT"],
      birthCity: "Cidade",
      birthCountry: "country-id",
    });
  assert.equal(p.birthDate, "2000-02-29");
  assert.equal(p.personalDetails.nationality, "BR");
  assert.equal(p.personalDetails.motherName, "Preservar");
  assert.equal(p.personalDetails.birthState, "existing-state");
  assert.ok(!("birthCountry" in p.personalDetails));
  assert.deepEqual(p.contacts, original.contacts);
  assert.equal(original.birthDate, "1990-01-02");
});
test("address creation preserves secondary addresses and does not conflate district with complement", () => {
  const draft = newRegistrationDocuments("br");
  Object.assign(draft.values, {
    street: "Rua",
    number: "10",
    city: "Cidade",
    district: "Bairro",
    complement: "Sala",
  });
  const p = addressRegistrationPatch(profile(), draft, "country");
  assert.equal(p.addresses.length, 2);
  assert.equal(p.addresses[0].id, "secondary");
  assert.equal(p.addresses[1].line1, "Rua, 10");
  assert.equal(p.addresses[1].line2, "Sala");
  assert.ok(!JSON.stringify(p.addresses).includes("Bairro"));
  assert.throws(() => addressRegistrationPatch(profile(), draft, null), /país/);
});
test("financial save preserves zero absence precision and temporal metadata, rejects implicit currency conversion", () => {
  const current = {
    currencyCode: "BRL",
    effectiveFrom: "2020-01-01",
    effectiveTo: null,
  };
  const draft = {
    individualMonthlyIncome: "1.234,56",
    householdMonthlyIncome: "",
    declaredNetWorth: "0",
  };
  const p = financialRegistrationPayload(current, draft, "2026-10-20");
  assert.equal(p.individualMonthlyIncome, "1234.56");
  assert.equal(p.householdMonthlyIncome, null);
  assert.equal(p.declaredNetWorth, "0.00");
  assert.equal(p.effectiveFrom, "2020-01-01");
  assert.throws(
    () =>
      financialRegistrationPayload(
        { currencyCode: "USD" },
        draft,
        "2026-10-20",
      ),
    /outra moeda/,
  );
});
test("professional save preserves metadata and does not invent an occupation", () => {
  assert.equal(
    professionalRegistrationPayload(null, { occupation: null }, "2026-10-20"),
    null,
  );
  assert.deepEqual(
    professionalRegistrationPayload(
      {
        employerName: "Existing",
        validFrom: "2020-01-01",
        validTo: null,
        isCurrent: true,
      },
      { occupation: "Existing activity" },
      "2026-10-20",
    ),
    {
      occupation: "Existing activity",
      employerName: "Existing",
      validFrom: "2020-01-01",
      validTo: null,
      isCurrent: true,
    },
  );
});
test("contacts retain real relationship for edits and reject a missing relationship without guessing", () => {
  assert.throws(
    () =>
      contactRegistrationPayload(null, { name: "Teste", phoneNumber: "123" }),
    /parentesco/,
  );
  assert.deepEqual(
    contactRegistrationPayload(
      { relationship: "Sibling", email: null },
      { name: " Teste ", phoneNumber: " +55110000 " },
    ),
    {
      name: "Teste",
      phoneNumber: "+55110000",
      relationship: "Sibling",
      email: null,
    },
  );
});
test("document payload uses the returned schema, real country/type and explicit evidence IDs", () => {
  const draft = newRegistrationDocuments("br");
  draft.values.taxNumber = "12345678900";
  const def = {
    documentTypeId: "cpf",
    countryId: "BR-id",
    code: "CPF",
    dateRules: { issuedOn: "Forbidden", expiresOn: "Forbidden" },
    fields: [
      { code: "documentNumber", required: true, label: "Número do CPF" },
    ],
  };
  const p = documentRegistrationPayload(def, draft, "br", ["evidence"]);
  assert.deepEqual(p.data, { documentNumber: "12345678900" });
  assert.deepEqual(p.evidenceDocumentIds, ["evidence"]);
  assert.equal(p.issuedOn, null);
  assert.throws(
    () =>
      documentRegistrationPayload(
        {
          ...def,
          fields: [
            { code: "unmapped", required: true, label: "Campo indisponível" },
          ],
        },
        draft,
        "br",
      ),
    /Campo indisponível/,
  );
});
test("catalog uses real countries and existing server values without fake choices", () => {
  const c = registrationCatalog(
    { countries: [{ id: "BR-id", isoCode: "BR", name: "Brazil" }] },
    profile(),
    null,
  );
  assert.deepEqual(c.genders, []);
  assert.deepEqual(c.occupations, []);
  assert.equal(c.countries[0].value, "BR-id");
});

import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { createIdempotentWriter } from "../src/services/financeIdempotency.js";
async function transportHarness(api) {
  let count = 0;
  const context = vm.createContext({
    crypto: { randomUUID: () => `key-${++count}` },
    FormData: class {
      constructor() {
        this.entries = [];
      }
      append(...entry) {
        this.entries.push(entry);
      }
    },
  });
  const source = await readFile(
    new URL("../src/services/registrationTransport.js", import.meta.url),
    "utf8",
  );
  const mod = new vm.SourceTextModule(source, { context });
  await mod.link(async (name) => {
    const exports = name.includes("clientApi")
      ? { clientApi: api }
      : { createIdempotentWriter };
    return new vm.SyntheticModule(
      Object.keys(exports),
      function () {
        for (const [k, v] of Object.entries(exports)) this.setExport(k, v);
      },
      { context },
    );
  });
  await mod.evaluate();
  return mod.namespace;
}
test("registration write retries an ambiguous failure with the same idempotency key", async () => {
  const calls = [];
  const t = await transportHarness({
    request: async (config) => {
      calls.push(config);
      if (calls.length === 1) throw new Error("network");
      return { data: { data: { saved: true } } };
    },
  });
  await assert.rejects(
    t.registrationWrite("patch", "/profile", { name: "Test" }),
  );
  assert.equal(
    (await t.registrationWrite("patch", "/profile", { name: "Test" })).saved,
    true,
  );
  assert.equal(
    calls[0].headers["Idempotency-Key"],
    calls[1].headers["Idempotency-Key"],
  );
});
test("file retries reuse success and isolate evidence by customer without sending an invented customerId", async () => {
  const calls = [];
  const t = await transportHarness({
    post: async (url, body, config) => {
      calls.push({ url, body, config });
      return { data: { data: { id: `file-${calls.length}` } } };
    },
  });
  const file = { name: "test.pdf" },
    metadata = { documentTypeId: "type", countryId: "country" };
  assert.equal((await t.registrationUpload(file, metadata, "A")).id, "file-1");
  assert.equal((await t.registrationUpload(file, metadata, "A")).id, "file-1");
  assert.equal((await t.registrationUpload(file, metadata, "B")).id, "file-2");
  assert.equal(calls.length, 2);
  assert.ok(!calls[0].body.entries.some(([key]) => key === "customerId"));
  t.resetRegistrationUploads();
  assert.equal((await t.registrationUpload(file, metadata, "A")).id, "file-3");
});

test("an address variant without filiation fields preserves existing parents", () => {
  const original = profile(),
    draft = newRegistrationDocuments("us-ca");
  Object.assign(draft.values, { street: "Street", city: "City" });
  const p = addressRegistrationPatch(original, draft, "US-id", "us-ca");
  assert.equal(p.personalDetails.motherName, "Preservar");
});

test("clearing a personal string uses empty text because the API preserves existing values on null", () => {
  const original = profile();
  original.birthDate = null;
  original.personalDetails.birthCity = "Previous";
  const p = personalRegistrationPatch(original, {
    birthDate: "",
    birthCity: "",
    nationalities: [],
  });
  assert.equal(p.personalDetails.birthCity, "");
});
