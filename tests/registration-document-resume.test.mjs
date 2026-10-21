import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newRegistrationDocuments,
  copyRegistrationDocuments,
} from "../src/services/registrationDocuments.js";
import {
  hydrateRegistrationDocuments,
  canReuseRegistrationDocument,
  assertRegistrationDocumentNumber,
  rememberRegistrationDocument,
  registrationFileState,
} from "../src/services/registrationDocumentResume.js";
const fixture = () => {
  const draft = newRegistrationDocuments("br");
  const doc = {
    documentCode: "RG",
    documentId: "typed",
    documentTypeId: "rg",
    source: "ProvidedDocument",
    status: "Active",
    countryIsoCode: "BR",
    numberMasked: "***0001",
    issuer: "ORGAO QA",
    issuerState: "SP",
    issuedOn: "2025-01-01",
    evidenceSummary: { count: 2, latestStatus: "Uploaded" },
  };
  const profile = {
    preferences: { countryIsoCode: "BR" },
    identificationDocuments: { documents: [doc] },
  };
  hydrateRegistrationDocuments(draft, profile, "br");
  return { draft, profile, doc };
};
test("CPF resume preserves only the server mask and never submits it as a new CPF", () => {
  const { profile } = fixture();
  profile.identificationDocuments.documents.push({
    ...profile.identificationDocuments.documents[0],
    documentCode: "CPF", documentId: "cpf", numberMasked: "******4725",
  });
  const draft = newRegistrationDocuments("br");
  hydrateRegistrationDocuments(draft, profile, "br");
  assert.equal(draft.savedTaxNumber, "******4725");
  assert.ok(!draft.values.taxNumber);
  assert.equal(copyRegistrationDocuments(draft).savedTaxNumber, "******4725");
  draft.values.taxNumber = "123";
  hydrateRegistrationDocuments(draft, profile, "br");
  assert.equal(draft.values.taxNumber, "123");
  profile.identificationDocuments.documents[1].status = "Inactive";
  hydrateRegistrationDocuments(draft, profile, "br");
  assert.equal(draft.savedTaxNumber, "");
});
test("resume displays server mask, issuer, region and dates and only reuses unchanged current evidence", () => {
  const { draft, profile, doc } = fixture();
  assert.equal(draft.details[draft.type].documentNumber, "***0001");
  assert.equal(draft.details[draft.type].issuerRegion, "SP");
  assert.equal(draft.details[draft.type].issuedDate, "01/01/2025");
  assert.equal(canReuseRegistrationDocument(draft, profile, "br"), true);
  assert.throws(
    () => assertRegistrationDocumentNumber(draft),
    /número completo/,
  );
  doc.evidenceSummary.latestStatus = "Rejected";
  assert.equal(canReuseRegistrationDocument(draft, profile, "br"), false);
});
test("edits or replacement files require a real number and cannot reuse old metadata", () => {
  const { draft, profile } = fixture();
  draft.details[draft.type].issuer = "ALTERADO";
  assert.equal(canReuseRegistrationDocument(draft, profile, "br"), false);
  assert.throws(() => assertRegistrationDocumentNumber(draft));
  draft.details[draft.type].documentNumber = "QA-0001";
  assert.doesNotThrow(() => assertRegistrationDocumentNumber(draft));
});
test("file copy preserves receipt identity; a new file is selected, never labeled as sent", () => {
  const { draft } = fixture();
  assert.equal(
    registrationFileState(draft, "front"),
    "Há arquivos enviados para este documento.",
  );
  const file = { name: "qa.png", size: 20 };
  draft.files[`${draft.type}:front`] = file;
  assert.equal(
    registrationFileState(draft, "front"),
    "Arquivo selecionado para envio.",
  );
  rememberRegistrationDocument(draft, "typed", "rg", 2);
  const copy = copyRegistrationDocuments(draft);
  assert.equal(registrationFileState(copy, "front"), "Arquivo enviado.");
  copy.files[`${copy.type}:front`] = { name: "replacement.png", size: 21 };
  assert.equal(
    registrationFileState(copy, "front"),
    "Arquivo selecionado para envio.",
  );
  assert.equal(registrationFileState(draft, "front"), "Arquivo enviado.");
});
test("other countries, archived records and ambiguous active documents never hydrate", () => {
  for (const change of [
    (d) => (d.countryIsoCode = "PT"),
    (d) => (d.status = "Archived"),
    (d, p) =>
      p.identificationDocuments.documents.push({ ...d, documentId: "another" }),
  ]) {
    const { profile, doc } = fixture();
    change(doc, profile);
    const draft = newRegistrationDocuments("br");
    hydrateRegistrationDocuments(draft, profile, "br");
    assert.equal(draft.details[draft.type].documentNumber, undefined);
    assert.equal(canReuseRegistrationDocument(draft, profile, "br"), false);
  }
});
test("passport selection and date format follow saved server type, never invent front/back mapping", () => {
  const { profile, doc } = fixture();
  doc.documentCode = "PASSPORT";
  doc.countryIsoCode = "US";
  doc.expiresOn = "2030-04-03";
  profile.preferences.countryIsoCode = "US";
  const draft = newRegistrationDocuments("us-ca");
  hydrateRegistrationDocuments(draft, profile, "us-ca");
  assert.equal(draft.type, "Passaporte");
  assert.equal(draft.details.Passaporte.issuedDate, "01/01/2025");
  assert.equal(draft.details.Passaporte.expiryDate, "04/03/2030");
});
