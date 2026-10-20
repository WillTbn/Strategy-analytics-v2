const nullable = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const pick = (value, keys) =>
  Object.fromEntries(keys.map((key) => [key, value[key] ?? null]));
export const currentProfilePatch = (profile) => ({
  birthDate: profile.birthDate,
  names: (profile.names || []).map((value) =>
    pick(value, [
      "id",
      "kind",
      "displayName",
      "validFrom",
      "validTo",
      "isPrimary",
    ]),
  ),
  contacts: (profile.contacts || []).map((value) =>
    pick(value, ["id", "kind", "value", "isPrimary"]),
  ),
  addresses: (profile.addresses || []).map((value) =>
    pick(value, [
      "id",
      "kind",
      "line1",
      "line2",
      "city",
      "stateOrProvince",
      "postalCode",
      "countryId",
      "isPrimary",
    ]),
  ),
  personalDetails: profile.personalDetails
    ? pick(profile.personalDetails, [
        "gender",
        "maritalStatus",
        "nationality",
        "birthCity",
        "birthState",
        "motherName",
        "fatherName",
      ])
    : null,
});
export function basicProfileDraft(profile, summary = {}) {
  const primary = (kind) => {
    const contacts = (profile.contacts || []).filter(
      (c) => c.kind === kind && c.isPrimary,
    );
    if (
      contacts.length > 1 ||
      (contacts[0]?.value != null && typeof contacts[0].value !== "string")
    )
      throw new Error(
        "Não foi possível identificar o contato principal para edição. Os dados foram preservados.",
      );
    return contacts[0]?.value ?? "";
  };
  const p = profile.personalDetails || {};
  return {
    name:
      summary.displayName ||
      profile.names?.find((n) => n.isPrimary)?.displayName ||
      "",
    gender: p.gender || "",
    maritalStatus: p.maritalStatus || "",
    nationality: p.nationality || "",
    birthPlace: [p.birthCity, p.birthState].filter(Boolean).join(", "),
    birthDate: profile.birthDate || "",
    email: primary("Email"),
    phone: primary("MobilePhone"),
    motherName: p.motherName || "",
    fatherName: p.fatherName || "",
  };
}
export function basicProfilePatch(profile, draft) {
  const primaryNames = profile.names?.filter((name) => name.isPrimary) || [];
  const primaryName = primaryNames.length === 1 ? primaryNames[0] : null;
  if (!primaryName || !nullable(draft.name))
    throw new Error(
      "O cadastro não possui um nome principal válido para atualização.",
    );
  const contacts = (profile.contacts || []).map(
    ({ id, kind, value, isPrimary }) => ({ id, kind, value, isPrimary }),
  );
  const changeContact = (kind, value) => {
    if (value != null && typeof value !== "string")
      throw new Error(
        "Confira os contatos antes de salvar. Os dados foram preservados.",
      );
    const current = contacts.find(
      (contact) => contact.kind === kind && contact.isPrimary,
    );
    if (current) current.value = nullable(value);
    else if (nullable(value))
      throw new Error(
        "Este contato ainda não está cadastrado. A inclusão depende do tipo definido pela API.",
      );
  };
  changeContact("Email", draft.email);
  changeContact("MobilePhone", draft.phone);
  // Preserve existing secondary names, contacts and fields outside the edited section.
  const names = profile.names.map(
    ({ id, kind, displayName, validFrom, validTo, isPrimary }) => ({
      id,
      kind,
      displayName: isPrimary ? draft.name.trim() : displayName,
      validFrom,
      validTo,
      isPrimary,
    }),
  );
  const birthPlace = String(draft.birthPlace || "")
    .split(",")
    .map((value) => value.trim());
  const personalDetails = Object.fromEntries(
    ["gender", "maritalStatus", "nationality", "motherName", "fatherName"].map(
      (key) => [key, nullable(draft[key])],
    ),
  );
  personalDetails.birthCity = nullable(birthPlace[0]);
  personalDetails.birthState = nullable(birthPlace.slice(1).join(", "));
  return {
    ...currentProfilePatch(profile),
    birthDate: nullable(draft.birthDate),
    names,
    contacts,
    personalDetails,
  };
}
export function locationProfilePatch(profile, draft) {
  if (
    !profile.addresses?.some(
      (address) => address.kind === "Residential" && address.isPrimary,
    )
  )
    throw new Error(
      "O cadastro não possui endereço residencial principal para atualização.",
    );
  const addresses = profile.addresses.map(
    ({
      id,
      kind,
      line1,
      line2,
      city,
      stateOrProvince,
      postalCode,
      countryId,
      isPrimary,
    }) => {
      const address = {
        id,
        kind,
        line1,
        line2,
        city,
        stateOrProvince,
        postalCode,
        countryId,
        isPrimary,
      };
      if (kind === "Residential" && isPrimary)
        for (const key of [
          "line1",
          "line2",
          "city",
          "stateOrProvince",
          "postalCode",
        ])
          address[key] = nullable(draft[key]);
      return address;
    },
  );
  return { ...currentProfilePatch(profile), addresses };
}
