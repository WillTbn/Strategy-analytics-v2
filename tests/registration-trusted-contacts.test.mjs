import { test } from "node:test";
import assert from "node:assert/strict";
import {
  appendRegistrationTrustedContact,
  newRegistrationTrustedContacts,
  validateRegistrationTrustedContacts,
} from "../src/services/registrationTrustedContacts.js";
const contact = () => ({
  name: "Contato de teste",
  phoneNumber: "+1 (202) 555-0100",
});
test("draft contains only name, phone and explicit absence without relationship or email", () => {
  const draft = newRegistrationTrustedContacts();
  assert.equal(draft.noContact, false);
  assert.deepEqual(draft.contacts, [{ name: "", phoneNumber: "" }]);
  assert.deepEqual(Object.keys(draft), ["noContact", "contacts"]);
});
test("an empty step requires a contact or explicit absence", () => {
  const draft = newRegistrationTrustedContacts();
  assert.deepEqual(Object.keys(validateRegistrationTrustedContacts(draft)), [
    "0.name",
    "0.phoneNumber",
  ]);
  draft.noContact = true;
  assert.deepEqual(validateRegistrationTrustedContacts(draft), {});
});
test("partially entered contacts get independent field errors, including additional rows", () => {
  const draft = newRegistrationTrustedContacts({
    contacts: [
      { name: "Nome", phoneNumber: "" },
      { name: "", phoneNumber: "+1 (202) 555-0100" },
    ],
  });
  assert.deepEqual(Object.keys(validateRegistrationTrustedContacts(draft)), [
    "0.phoneNumber",
    "1.name",
  ]);
});
test("absence ignores but preserves edits and restores validation when unchecked", () => {
  const draft = newRegistrationTrustedContacts({
    noContact: true,
    contacts: [{ name: "Nome", phoneNumber: "invalid" }],
  });
  const copy = structuredClone(draft);
  assert.deepEqual(validateRegistrationTrustedContacts(draft), {});
  assert.deepEqual(draft, copy);
  draft.noContact = false;
  assert.ok(validateRegistrationTrustedContacts(draft)["0.phoneNumber"]);
});
test("add requires complete rows and never appends repeated empty rows or when absence is selected", () => {
  const draft = newRegistrationTrustedContacts();
  assert.equal(appendRegistrationTrustedContact(draft), false);
  draft.contacts[0] = contact();
  assert.equal(appendRegistrationTrustedContact(draft), true);
  assert.equal(draft.contacts.length, 2);
  assert.equal(appendRegistrationTrustedContact(draft), false);
  assert.deepEqual(validateRegistrationTrustedContacts(draft), {});
  draft.noContact = true;
  assert.equal(appendRegistrationTrustedContact(draft), false);
});
test("international punctuation is preserved without assuming DDI, length, surname count or uniqueness", () => {
  const draft = newRegistrationTrustedContacts({
    contacts: [contact(), { name: "Ana", phoneNumber: "(11) 5555-0100" }],
  });
  assert.deepEqual(validateRegistrationTrustedContacts(draft), {});
  assert.equal(draft.contacts[0].phoneNumber, "+1 (202) 555-0100");
  draft.contacts[1].phoneNumber = "telefone@example.test";
  assert.ok(validateRegistrationTrustedContacts(draft)["1.phoneNumber"]);
});
test("copies isolate navigation drafts and errors do not echo names or phones", () => {
  const draft = newRegistrationTrustedContacts({ contacts: [contact()] });
  const copy = newRegistrationTrustedContacts(draft);
  copy.contacts[0].name = "Outro nome";
  assert.equal(draft.contacts[0].name, "Contato de teste");
  assert.equal(newRegistrationTrustedContacts().contacts[0].name, "");
  draft.contacts[0].phoneNumber = "private-value";
  assert.ok(
    !JSON.stringify(validateRegistrationTrustedContacts(draft)).includes(
      "private-value",
    ),
  );
});
