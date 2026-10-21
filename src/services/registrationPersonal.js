// Presentation draft only; these keys are not an HTTP payload.
export const personalCatalogKeys = [
  "genders",
  "maritalStatuses",
  "nationalities",
  "countries",
];
export function newRegistrationPersonal(value = {}) {
  return {
    birthDate: value.birthDate || "",
    gender: value.gender ?? null,
    maritalStatus: value.maritalStatus ?? null,
    nationalities: value.nationalities?.length
      ? [...value.nationalities]
      : [null],
    birthCountry: value.birthCountry ?? null,
    birthCity: value.birthCity || "",
  };
}
export function personalCatalogReady(catalog = {}) {
  return personalCatalogKeys.every(
    (key) => Array.isArray(catalog[key]) && catalog[key].length > 0,
  );
}
export function validBirthDate(value, today = new Date()) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const [, day, month, year] = match.map(Number);
  if (year < 1) return false;
  const parsed = new Date(0);
  parsed.setFullYear(year, month - 1, day);
  parsed.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day &&
    parsed <= end
  );
}
export function validateRegistrationPersonal(
  value,
  catalog = {},
  { today = new Date(), required = [] } = {},
) {
  const errors = {};
  const present = (value) =>
    value !== null && value !== undefined && String(value).trim() !== "";
  // Requiredness must come from the confirmed onboarding rules, not nullable profile fields.
  for (const field of required) {
    if (field === "nationalities") {
      if (!value.nationalities?.some(present))
        errors.nationalities = "Selecione uma nacionalidade.";
    } else if (Object.hasOwn(value, field) && !present(value[field]))
      errors[field] = "Preencha este campo.";
  }
  if (present(value.birthDate) && !validBirthDate(value.birthDate, today))
    errors.birthDate = "Informe uma data válida, sem ser no futuro.";
  for (const [field, key] of [
    ["gender", "genders"],
    ["maritalStatus", "maritalStatuses"],
    ["birthCountry", "countries"],
  ]) {
    if (
      present(value[field]) &&
      !catalog[key]?.some((option) => option.value === value[field])
    )
      errors[field] = "Selecione uma opção disponível.";
  }
  const selected = (value.nationalities || []).filter(present);
  if (selected.length > 3)
    errors.nationalities = "Selecione no máximo três nacionalidades.";
  else if (new Set(selected).size !== selected.length)
    errors.nationalities = "Não repita a mesma nacionalidade.";
  else if (
    selected.some(
      (value) =>
        !catalog.nationalities?.some((option) => option.value === value),
    )
  )
    errors.nationalities = "Selecione uma nacionalidade disponível.";
  return errors;
}
export function appendRegistrationNationality(value) {
  const nationalities = value.nationalities || [];
  if (nationalities.length >= 3) return false;
  if (
    !nationalities.length ||
    nationalities.every(
      (item) => item !== null && item !== undefined && String(item).trim(),
    )
  ) {
    nationalities.push(null);
    value.nationalities = nationalities;
    return true;
  }
  return false;
}
