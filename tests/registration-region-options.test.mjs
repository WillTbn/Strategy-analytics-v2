import test from "node:test";
import assert from "node:assert/strict";
import {
  registrationRegionOptions,
  documentRegistrationPayload,
  registrationDocumentCountryId,
} from "../src/services/registrationIntegration.js";
import { newRegistrationDocuments } from "../src/services/registrationDocuments.js";
test("new international accounts have real state/province choices before an address has been saved", () => {
  for (const variant of [
    "us-ca",
    "south-america",
    "jp",
    "cn",
    "africa",
    "au",
  ]) {
    const options = registrationRegionOptions(variant, null);
    assert.ok(options.length > 1, variant);
    assert.equal(new Set(options.map((o) => o.value)).size, options.length);
    assert.ok(options.every((o) => o.value && o.label));
  }
  assert.ok(
    registrationRegionOptions("us-ca", null).some((o) => o.value === "CA"),
  );
  assert.ok(
    registrationRegionOptions("us-ca", null, "CA").some(
      (o) => o.value === "ON",
    ),
  );
  assert.ok(
    registrationRegionOptions("jp", null).some((o) => o.value === "13"),
  );
});
test("existing regions are preserved and no neighbouring country catalogue is substituted", () => {
  assert.ok(
    registrationRegionOptions("jp", "Tóquio").some((o) => o.value === "Tóquio"),
  );
  assert.deepEqual(registrationRegionOptions("south-america", null, "CL"), []);
  assert.equal(registrationRegionOptions("br", null).length, 27);
});
test("passport issuing country uses the existing countryId contract independently of residence", () => {
  const draft = newRegistrationDocuments("europe");
  draft.type = "Passaporte";
  draft.details.Passaporte = { documentNumber: "QA-FICTICIO" };
  assert.throws(
    () => registrationDocumentCountryId(draft, "residence", "PASSPORT"),
    /país emissor/,
  );
  draft.details.Passaporte.issuerCountry = "issuing-country";
  const countryId = registrationDocumentCountryId(
    draft,
    "residence",
    "PASSPORT",
  );
  assert.equal(countryId, "issuing-country");
  assert.equal(
    registrationDocumentCountryId(draft, "residence", "CPF"),
    "residence",
  );
  const payload = documentRegistrationPayload(
    {
      documentTypeId: "passport",
      countryId,
      fields: [{ code: "documentNumber", required: true }],
      dateRules: {},
    },
    draft,
    "europe",
  );
  assert.equal(payload.countryId, "issuing-country");
  assert.deepEqual(payload.data, { documentNumber: "QA-FICTICIO" });
});
