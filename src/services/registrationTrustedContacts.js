// Presentation memory only: no relationship, email or HTTP payload is fabricated.
export function newRegistrationTrustedContacts(value = {}) {
  return {
    noContact: value.noContact === true,
    contacts: value.contacts?.length
      ? value.contacts.map((contact) => ({
          ...(contact.id ? { id: contact.id } : {}),
          name: String(contact.name ?? ""),
          phoneNumber: String(contact.phoneNumber ?? ""),
        }))
      : [{ name: "", phoneNumber: "" }],
  };
}
const text = (value) => String(value ?? "").trim();
export function validateRegistrationTrustedContacts(draft) {
  if (draft.noContact === true) return {};
  const errors = {};
  const active = draft.contacts
    .map((contact, index) => ({ contact, index }))
    .filter(({ contact }) => text(contact.name) || text(contact.phoneNumber));
  if (!active.length)
    return {
      "0.name": "Informe um contato ou marque que não possui.",
      "0.phoneNumber": "Informe o telefone do contato.",
    };
  for (const { contact, index } of active) {
    if (!text(contact.name))
      errors[`${index}.name`] = "Informe o nome do contato.";
    const phone = text(contact.phoneNumber);
    if (!phone)
      errors[`${index}.phoneNumber`] = "Informe o telefone do contato.";
    else if (!/^\+?[\d\s().-]+$/.test(phone) || !/\d/.test(phone))
      errors[`${index}.phoneNumber`] =
        "Informe um telefone usando números e, se necessário, o código do país.";
  }
  // Length, country-specific rules and normalization await the onboarding contract.
  return errors;
}
export function appendRegistrationTrustedContact(draft) {
  if (
    draft.noContact === true ||
    Object.keys(validateRegistrationTrustedContacts(draft)).length ||
    draft.contacts.some(
      (contact) => !text(contact.name) || !text(contact.phoneNumber),
    )
  )
    return false;
  draft.contacts.push({ name: "", phoneNumber: "" });
  return true;
}
