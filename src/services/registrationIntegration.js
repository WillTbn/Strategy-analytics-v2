import { currentProfilePatch } from "./profileEdit.js";
import { parseRegistrationAmount } from "./registrationEmployment.js";
import { calendarDate, documentVariants } from "./registrationDocuments.js";
const nullable = (value) => String(value ?? "").trim() || null;
export const registrationDate = (value, format = "dd/mm/aaaa") => {
  if (!value) return null;
  const date = calendarDate(value, format);
  if (!date) throw new Error("Confira a data informada.");
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
export const displayRegistrationDate = (value) =>
  value ? String(value).slice(0, 10).split("-").reverse().join("/") : "";
export const displayRegistrationAmount = (value) =>
  value == null ? "" : String(value).replace(".", ",");
export function personalRegistrationPatch(profile, draft) {
  const patch = currentProfilePatch(profile);
  patch.birthDate = registrationDate(draft.birthDate);
  patch.personalDetails = {
    gender: null,
    maritalStatus: null,
    nationality: null,
    birthCity: null,
    birthState: null,
    motherName: null,
    fatherName: null,
    ...patch.personalDetails,
    gender: nullable(draft.gender),
    maritalStatus: nullable(draft.maritalStatus),
    nationality: nullable(draft.nationalities?.[0]),
    birthCity: nullable(draft.birthCity),
  };
  return patch;
}
export function addressRegistrationPatch(
  profile,
  draft,
  countryId,
  variant = "br",
) {
  const patch = currentProfilePatch(profile),
    values = draft.values;
  if (!countryId)
    throw new Error(
      "O país de residência precisa estar definido na sua conta.",
    );
  if (!nullable(values.street) || !nullable(values.city))
    throw new Error("Informe o logradouro e a cidade para salvar o endereço.");
  const existing = patch.addresses.find(
    (a) => a.kind === "Residential" && a.isPrimary,
  );
  const address = {
    id: existing?.id ?? null,
    kind: "Residential",
    line1: [nullable(values.street), nullable(values.number)]
      .filter(Boolean)
      .join(", "),
    line2: nullable(values.complement),
    city: values.city.trim(),
    stateOrProvince: nullable(values.region),
    postalCode: nullable(values.postalCode),
    countryId,
    isPrimary: true,
  };
  patch.addresses = existing
    ? patch.addresses.map((a) => (a === existing ? address : a))
    : [...patch.addresses, address];
  if (draft.parents && documentVariants[variant]?.parents)
    patch.personalDetails = {
      gender: null,
      maritalStatus: null,
      nationality: null,
      birthCity: null,
      birthState: null,
      motherName: null,
      fatherName: null,
      ...patch.personalDetails,
      motherName: draft.parents[0]?.absent
        ? null
        : nullable(draft.parents[0]?.name),
      fatherName: draft.parents[1]?.absent
        ? null
        : nullable(draft.parents[1]?.name),
    };
  return patch;
}
export function professionalRegistrationPayload(current, draft, today) {
  if (!nullable(draft.occupation)) return null;
  return {
    occupation: draft.occupation,
    employerName: current?.employerName ?? null,
    validFrom: current?.validFrom ?? today,
    validTo: current?.validTo ?? null,
    isCurrent: current?.isCurrent ?? true,
  };
}
export function financialRegistrationPayload(current, draft, today) {
  if (current?.currencyCode && current.currencyCode !== "BRL")
    throw new Error(
      "O perfil financeiro está em outra moeda. A gravação em reais precisa ser alinhada para evitar conversão indevida.",
    );
  const amounts = Object.fromEntries(
    [
      "individualMonthlyIncome",
      "householdMonthlyIncome",
      "declaredNetWorth",
    ].map((key) => {
      const amount = parseRegistrationAmount(draft[key]);
      if (amount.kind === "invalid")
        throw new Error("Confira os valores financeiros.");
      return [key, amount.decimal];
    }),
  );
  return {
    ...amounts,
    currencyCode: "BRL",
    effectiveFrom: current?.effectiveFrom ?? today,
    effectiveTo: current?.effectiveTo ?? null,
  };
}
export function contactRegistrationPayload(current, draft) {
  if (!current?.relationship)
    throw new Error(
      "A API exige parentesco para cadastrar um contato novo, mas o Figma solicita somente nome e telefone. Este contato ainda não foi salvo.",
    );
  return {
    name: draft.name.trim(),
    phoneNumber: draft.phoneNumber.trim(),
    relationship: current.relationship,
    email: current.email ?? null,
  };
}
export function registrationCatalog(catalog, profile, professional) {
  const existing = (options, value) =>
    options?.length ? options : value ? [{ value, label: value }] : [];
  return {
    genders: existing(catalog.genders, profile.personalDetails?.gender),
    maritalStatuses: existing(
      catalog.maritalStatuses,
      profile.personalDetails?.maritalStatus,
    ),
    nationalities: existing(
      catalog.nationalities,
      profile.personalDetails?.nationality,
    ),
    countries: (catalog.countries || []).map((c) => ({
      value: c.id,
      label: c.name,
      isoCode: c.isoCode,
    })),
    occupations: existing(catalog.occupations, professional?.occupation),
  };
}
export function documentRegistrationPayload(
  definition,
  draft,
  variant,
  evidenceDocumentIds = [],
) {
  const details = draft.details[draft.type] || {},
    values = { ...draft.values, ...details };
  const mapped = {
    documentNumber:
      definition.code === "CPF"
        ? draft.values.taxNumber
        : values.documentNumber,
    issuer: values.issuer,
    issuerState: values.issuerRegion,
  };
  const data = {};
  for (const field of definition.fields || []) {
    const value = nullable(mapped[field.code]);
    if (field.required && !value)
      throw new Error(`O documento exige ${field.label}.`);
    if (value) data[field.code] = value;
  }
  if (!(definition.fields || []).length)
    throw new Error(
      "A definição dos dados deste documento ainda não está disponível.",
    );
  const format = documentVariants[variant]?.dateFormat || "dd/mm/aaaa";
  const dates = {};
  for (const [key, input] of [
    ["issuedOn", values.issuedDate],
    ["expiresOn", values.expiryDate],
  ]) {
    const rule = definition.dateRules?.[key];
    if (rule === "Forbidden" && input)
      throw new Error(
        "A API não aceita uma das datas previstas para este documento. Revise antes de enviar.",
      );
    dates[key] = rule === "Forbidden" ? null : registrationDate(input, format);
    if (rule === "Required" && !dates[key])
      throw new Error("Preencha a data exigida para este documento.");
  }
  return {
    documentTypeId: definition.documentTypeId,
    countryId: definition.countryId,
    ...dates,
    data,
    evidenceDocumentIds,
  };
}
