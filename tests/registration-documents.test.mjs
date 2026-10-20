import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calendarDate,
  copyRegistrationDocuments,
  documentFields,
  documentRows,
  documentVariants,
  newRegistrationDocuments,
  validateDocumentSelection,
  validateRegistrationDocuments,
} from "../src/services/registrationDocuments.js";
const today = new Date(2026, 9, 20);
test("eight Figma variants keep representative countries explicit without inventing a Canada layout", () => {
  assert.equal(Object.keys(documentVariants).length, 8);
  assert.equal(documentVariants["us-ca"].label, "🇺🇸 Estados Unidos");
  assert.equal(documentVariants.europe.label, "🇵🇹 Portugal");
  assert.equal(documentVariants["south-america"].label, "🇦🇷 Argentina");
  assert.equal(documentVariants.africa.label, "🇿🇦 África do Sul");
  assert.deepEqual(
    documentVariants.br.address.flat().map((f) => f.label),
    [
      "CEP",
      "Logradouro",
      "Número",
      "Complemento",
      "Bairro",
      "Cidade",
      "Estado",
    ],
  );
  for (const [variant, config] of Object.entries(documentVariants)) {
    assert.equal(Boolean(config.parents), variant === "br");
    assert.ok(config.choices.includes("Passaporte"));
    assert.ok(
      !documentFields(variant, config.choices[0]).some(
        (f) => f.label === "CPF",
      ) || variant === "br",
    );
  }
});
test("passport uses exactly number, issuing country, issue date and expiry for every variant", () => {
  for (const variant of Object.keys(documentVariants))
    assert.deepEqual(
      documentRows(variant, "Passaporte")
        .flat()
        .map((f) => f.key),
      ["documentNumber", "issuerCountry", "issuedDate", "expiryDate"],
    );
});
test("calendar formats distinguish US month/day from day/month and Japanese year/month/day", () => {
  assert.equal(calendarDate("12/31/2026", "mm/dd/aaaa").getMonth(), 11);
  assert.equal(calendarDate("2026/12/31", "aaaa/mm/dd").getDate(), 31);
  assert.equal(calendarDate("31/12/2026").getFullYear(), 2026);
  for (const [value, format] of [
    ["31/12/2026", "mm/dd/aaaa"],
    ["29/02/1900", "dd/mm/aaaa"],
    ["2026/02/30", "aaaa/mm/dd"],
    ["01/01/0000", "dd/mm/aaaa"],
    ["1/1/2026", "dd/mm/aaaa"],
  ])
    assert.equal(calendarDate(value, format), null);
  assert.ok(calendarDate("29/02/2000"));
});
test("dates cannot have future issue or expiry earlier than issue; absent required rules are not invented", () => {
  const draft = newRegistrationDocuments("br");
  assert.deepEqual(validateRegistrationDocuments("br", draft, today), {});
  draft.type = "Passaporte";
  draft.details.Passaporte = {
    issuedDate: "21/10/2026",
    expiryDate: "19/10/2026",
  };
  const errors = validateRegistrationDocuments("br", draft, today);
  assert.ok(errors.issuedDate);
  assert.ok(errors.expiryDate);
  draft.details.Passaporte = {
    issuedDate: "20/10/2026",
    expiryDate: "20/10/2026",
  };
  assert.deepEqual(validateRegistrationDocuments("br", draft, today), {});
});
test("changing type ignores inactive dates and does not reuse identity values as passport values", () => {
  const draft = newRegistrationDocuments("br"),
    identity = draft.type;
  draft.details[identity] = {
    documentNumber: "identity-only",
    issuedDate: "31/02/2000",
  };
  draft.details.Passaporte = { documentNumber: "passport-only" };
  draft.type = "Passaporte";
  assert.deepEqual(validateRegistrationDocuments("br", draft, today), {});
  assert.equal(draft.details.Passaporte.documentNumber, "passport-only");
  draft.type = identity;
  assert.ok(validateRegistrationDocuments("br", draft, today).issuedDate);
});
test("variant/type lookup rejects unknown and inherited keys gracefully", () => {
  for (const variant of ["unknown", "constructor", "__proto__"]) {
    assert.deepEqual(documentRows(variant, "Passaporte"), []);
    assert.deepEqual(documentFields(variant, "Passaporte"), []);
    assert.ok(
      validateRegistrationDocuments(variant, newRegistrationDocuments(variant))
        .type,
    );
  }
  assert.deepEqual(documentRows("br", "invented"), []);
});
test("file selection preserves one nonempty file and only applies supplied backend limits", () => {
  const file = { name: "qa-document.pdf", type: "application/pdf", size: 500 };
  assert.equal(validateDocumentSelection([file]), "");
  assert.ok(validateDocumentSelection([]));
  assert.ok(validateDocumentSelection([file, file]));
  assert.ok(validateDocumentSelection([{ ...file, size: 0 }]));
  assert.ok(validateDocumentSelection([file], { maxBytes: 499 }));
  assert.equal(
    validateDocumentSelection([file], {
      maxBytes: 500,
      mimeTypes: ["application/pdf"],
    }),
    "",
  );
  assert.ok(validateDocumentSelection([file], { mimeTypes: ["image/png"] }));
});
test("draft copies isolate variants and parent edits while retaining File references only in memory", () => {
  const draft = newRegistrationDocuments("br");
  const file = { name: "qa-document.pdf", size: 500 };
  draft.files[`${draft.type}:front`] = file;
  draft.parents[0] = { name: "Local name", absent: true };
  const copy = copyRegistrationDocuments(draft);
  copy.parents[0].name = "Changed";
  copy.values.street = "Changed";
  copy.details[copy.type].documentNumber = "Changed";
  assert.equal(draft.parents[0].name, "Local name");
  assert.equal(draft.values.street, undefined);
  assert.equal(draft.details[draft.type].documentNumber, undefined);
  assert.equal(copy.files[`${copy.type}:front`], file);
  assert.equal(
    newRegistrationDocuments("jp").files[`${copy.type}:front`],
    undefined,
  );
});
