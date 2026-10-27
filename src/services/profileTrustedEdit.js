import { contactRegistrationPayload } from "./registrationIntegration.js";
import { validateRegistrationTrustedContacts } from "./registrationTrustedContacts.js";

export function trustedContactsDraft(contacts) {
  return contacts.length
    ? contacts.map(({ id, name, phoneNumber }) => ({
        id,
        name: name ?? "",
        phoneNumber: phoneNumber ?? "",
      }))
    : [{ name: "", phoneNumber: "" }];
}

export function trustedContactChanges(baseline, draft) {
  const ids = baseline.map((contact) => contact.id);
  if (
    ids.some((id) => !id) ||
    new Set(ids).size !== ids.length ||
    draft.length < (baseline.length || 1) ||
    draft.some((contact, index) => contact.id !== baseline[index]?.id)
  )
    throw new Error("Os contatos mudaram. Descarte a edição e abra novamente.");
  if (
    draft.some(
      (contact) =>
        !String(contact.name ?? "").trim() ||
        !String(contact.phoneNumber ?? "").trim(),
    )
  )
    throw new Error("Informe o nome e o telefone de cada contato.");
  const errors = validateRegistrationTrustedContacts({ contacts: draft });
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return draft.flatMap((contact, index) => {
    const current = baseline[index];
    const payload = contactRegistrationPayload(current, contact);
    return current &&
      payload.name === current.name?.trim() &&
      payload.phoneNumber === current.phoneNumber?.trim()
      ? []
      : [{ index, id: current?.id, payload }];
  });
}

// Validate the whole section first; confirmed writes advance this editor's
// baseline so retrying a partial save does not repeat completed updates.
export async function saveTrustedContacts(baseline, draft, operations) {
  const changes = trustedContactChanges(baseline, draft);
  for (const change of changes) {
    operations.assertSession();
    const result = change.id
      ? await operations.update(change.id, change.payload)
      : await operations.create(change.payload);
    operations.assertSession();
    draft[change.index].id = change.id || result?.id;
    baseline[change.index] = {
      ...baseline[change.index],
      ...change.payload,
      id: change.id || result?.id,
    };
  }
}
