import test from "node:test";
import assert from "node:assert/strict";
import { profileFields } from "../src/services/profilePresentation.js";
const ids = [
  "a1111111-1111-4111-8111-111111111111",
  "b2222222-2222-4222-8222-222222222222",
];
const summary = {
  personalDetails: { nationalityCountryIds: ids, gender: "PreferNotToSay" },
};
const field = (result, title) =>
  result.basic.find((f) => f.title === title).value;
test("saved nationality without its catalog description never claims missing personal data", () => {
  const value = field(profileFields(summary), "Nacionalidade");
  assert.equal(value, "Descrição indisponível");
  assert.doesNotMatch(value, /Não informado|a1111111|b2222222/);
});
test("an incomplete catalog keeps known countries and marks unresolved descriptions", () => {
  const catalog = { countries: [{ id: ids[0], name: "Brasil" }] };
  assert.equal(
    field(profileFields(summary, {}, {}, [], catalog), "Nacionalidade"),
    "Brasil, Descrição indisponível",
  );
});
test("catalog recovery restores labels without editing the saved profile", () => {
  const original = structuredClone(summary);
  const catalog = {
    countries: [
      { id: ids[0], name: "Brasil" },
      { id: ids[1], name: "Portugal" },
    ],
  };
  const result = profileFields(summary, {}, {}, [], catalog);
  assert.equal(field(result, "Nacionalidade"), "Brasil, Portugal");
  assert.deepEqual(summary, original);
});
test("prefer-not-to-say remains translated without catalog and actual catalog labels take precedence", () => {
  assert.equal(field(profileFields(summary), "Gênero"), "Prefiro não informar");
  const result = profileFields(summary, {}, {}, [], {
    genders: [{ value: "PreferNotToSay", label: "Prefiro não responder" }],
  });
  assert.equal(field(result, "Gênero"), "Prefiro não responder");
});
test("genuine missing nationality and legacy text keep the existing presentation", () => {
  assert.equal(field(profileFields({}), "Nacionalidade"), "Não informado");
  assert.equal(
    field(
      profileFields({ personalDetails: { nationality: "Brasileira" } }),
      "Nacionalidade",
    ),
    "Brasileira",
  );
});
