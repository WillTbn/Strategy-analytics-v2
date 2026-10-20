import { test } from "node:test";
import assert from "node:assert/strict";
import {
  maskRegistrationIdentifier,
  registrationReviewIssues,
  registrationReviewSections,
  reviewMoney,
} from "../src/services/registrationReview.js";
import { newRegistrationPersonal } from "../src/services/registrationPersonal.js";
import { newRegistrationDocuments } from "../src/services/registrationDocuments.js";
import { newRegistrationEmployment } from "../src/services/registrationEmployment.js";
import { newRegistrationTrustedContacts } from "../src/services/registrationTrustedContacts.js";
const empty = () => ({
  personal: newRegistrationPersonal(),
  document: null,
  variant: null,
  employment: newRegistrationEmployment(),
  contacts: newRegistrationTrustedContacts(),
});
test("review has exactly the five Figma sections without sample data or invented initial values", () => {
  const sections = registrationReviewSections(empty());
  assert.deepEqual(
    sections.map((s) => s.title),
    [
      "Dados pessoais",
      "Endereço",
      "Documento",
      "Atividade trabalhista",
      "Contatos de confiança",
    ],
  );
  assert.ok(sections.every((s) => s.text === "Não informado" && s.missing));
  assert.equal(registrationReviewIssues(empty()).length, 5);
});
test("review explicitly selects fields and never serializes password, codes, tokens or file names", () => {
  const snapshot = empty();
  snapshot.password = "private-password";
  snapshot.accessToken = "private-token";
  snapshot.personal.confirmation = "private-code";
  snapshot.variant = "br";
  snapshot.document = newRegistrationDocuments("br");
  snapshot.document.values.taxNumber = "12345678900";
  snapshot.document.details[snapshot.document.type].documentNumber =
    "98765432100";
  snapshot.document.files[`${snapshot.document.type}:front`] = {
    name: "private-file.pdf",
    size: 100,
  };
  const result = JSON.stringify(registrationReviewSections(snapshot));
  for (const secret of [
    snapshot.password,
    snapshot.accessToken,
    snapshot.personal.confirmation,
    "12345678900",
    "98765432100",
    "private-file.pdf",
  ])
    assert.ok(!result.includes(secret));
  assert.ok(result.includes("selecionada localmente"));
});
test("identifier masking never reveals short values in full", () => {
  assert.equal(maskRegistrationIdentifier(""), "");
  assert.equal(maskRegistrationIdentifier("123"), "••••");
  assert.equal(maskRegistrationIdentifier("1234"), "••••");
  assert.equal(maskRegistrationIdentifier("12345678"), "••••5678");
});
test("review money distinguishes absence from zero and preserves large decimal amounts", () => {
  assert.equal(reviewMoney(""), "");
  assert.equal(reviewMoney("0"), "R$ 0,00");
  assert.equal(
    reviewMoney("999.999.999.999.999.999,99"),
    "R$ 999.999.999.999.999.999,99",
  );
  assert.equal(reviewMoney("1.23"), "Valor a revisar");
});
test("opaque catalogue values are replaced by labels or unavailable descriptions", () => {
  const snapshot = empty();
  snapshot.personal.gender = "private-gender-id";
  assert.ok(
    !registrationReviewSections(snapshot)[0].text.includes("private-gender-id"),
  );
  snapshot.catalog = {
    genders: [{ value: "private-gender-id", label: "Descrição confirmada" }],
  };
  assert.equal(
    registrationReviewSections(snapshot)[0].text,
    "Descrição confirmada",
  );
});
test("editing a document preserves its selected variant and review does not mutate drafts", () => {
  const snapshot = empty();
  snapshot.variant = "jp";
  snapshot.document = newRegistrationDocuments("jp");
  snapshot.document.values.street = "Endereço de teste";
  snapshot.personal.birthCity = "Cidade de teste";
  const before = structuredClone(snapshot),
    sections = registrationReviewSections(snapshot);
  assert.equal(sections[1].path, "/cadastro/etapa-4/jp");
  assert.equal(sections[2].path, "/cadastro/etapa-4/jp");
  assert.deepEqual(snapshot, before);
});
test("absence summarizes the explicit choice and ignores inactive contact drafts", () => {
  const snapshot = empty();
  snapshot.contacts = {
    noContact: true,
    contacts: [{ name: "inactive-name", phoneNumber: "inactive-phone" }],
  };
  const section = registrationReviewSections(snapshot)[4];
  assert.equal(section.text, "Não possuo contato de confiança");
  assert.equal(section.missing, false);
  assert.ok(
    !registrationReviewIssues(snapshot).includes("Contatos de confiança"),
  );
});
test("local issue aggregation catches invalid dates, money and missing document sides", () => {
  const snapshot = empty();
  snapshot.personal.birthDate = "31/02/2000";
  snapshot.employment.individualMonthlyIncome = "-1";
  snapshot.variant = "br";
  snapshot.document = newRegistrationDocuments("br");
  snapshot.document.values.taxNumber = "12345678900";
  snapshot.document.files[`${snapshot.document.type}:front`] = { size: 100 };
  const issues = registrationReviewIssues(snapshot);
  assert.ok(issues.includes("Dados pessoais"));
  assert.ok(issues.includes("Documento"));
  assert.ok(issues.includes("Atividade trabalhista"));
  assert.equal(new Set(issues).size, issues.length);
});

test("failed reads are unavailable rather than not informed, while preserving draft values and Figma sections", () => {
  const snapshot = empty();
  snapshot.readErrors = { financial: true, contacts: true };
  snapshot.employment.declaredNetWorth = "0";
  const sections = registrationReviewSections(snapshot);
  assert.equal(sections.length, 5);
  assert.match(sections[3].text, /bens R\$ 0,00.*Consulta indisponível/);
  assert.equal(sections[3].missing, true);
  assert.match(sections[4].text, /Consulta indisponível/);
  assert.notEqual(sections[4].text, "Não informado");
  assert.equal(sections[0].text, "Não informado");
});
