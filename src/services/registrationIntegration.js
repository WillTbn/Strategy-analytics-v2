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
  const nationalities = (draft.nationalities || []).filter(Boolean);
  if (
    nationalities.length > 3 ||
    new Set(nationalities).size !== nationalities.length
  )
    throw new Error("Selecione até três nacionalidades sem repetir.");
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
    birthCountryId: nullable(draft.birthCountry),
    nationalityCountryIds: nationalities,
    birthCity: String(draft.birthCity ?? "").trim(),
  };
  return patch;
}
// Only variants with a separate number field split the portal's "street, number"
// representation. Keep ambiguous/legacy lines intact instead of inventing a number.
export function registrationAddressValues(address, variant) {
  const line = String(address.line1 ?? "");
  let street = line,
    number = "";
  const separateNumber = documentVariants[variant]?.address
    .flat()
    .some((field) => field.key === "number");
  if (separateNumber) {
    const separator = line.lastIndexOf(",");
    const suffix = line.slice(separator + 1).trim();
    if (
      separator > 0 &&
      /^(?:\d[\p{L}\p{N}\s./-]*|s\/?n|sem n[uú]mero)$/iu.test(suffix)
    ) {
      street = line.slice(0, separator).trimEnd();
      number = suffix;
    }
  }
  return {
    street,
    number,
    complement: address.line2 || "",
    district: address.neighborhood || "",
    city: address.city || "",
    region: address.stateOrProvince ?? null,
    postalCode: address.postalCode || "",
  };
}
export function addressRegistrationPatch(
  profile,
  draft,
  countryId,
  variant = "br",
) {
  const patch = currentProfilePatch(profile),
    values = draft.values;
  if (String(values.district ?? "").trim().length > 120)
    throw new Error("O bairro deve ter até 120 caracteres.");
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
    neighborhood: nullable(values.district),
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
        ? ""
        : nullable(draft.parents[0]?.name),
      fatherName: draft.parents[1]?.absent
        ? ""
        : nullable(draft.parents[1]?.name),
    };
  return patch;
}
export function professionalRegistrationPayload(current, draft, today) {
  if (!nullable(draft.occupation))
    throw new Error(
      "Informe sua ocupação antes de continuar para os documentos.",
    );
  return {
    occupation: draft.occupation.trim(),
    employerName: Object.hasOwn(draft, "employerName")
      ? nullable(draft.employerName)
      : (current?.employerName ?? null),
    validFrom: current?.validFrom ?? today,
    validTo: current?.validTo ?? null,
    isCurrent: current?.isCurrent ?? true,
  };
}
export function registrationPreferencesPayload(profile, draft, catalog) {
  const current = profile.preferences || {};
  const payload = {
    ...Object.fromEntries(
      ["languageCode", "timeZoneId", "theme", "countryId"].map((key) => [
        key,
        current[key],
      ]),
    ),
  };
  for (const key of ["primaryCurrencyCode", "secondaryCurrencyCode"]) {
    const value = draft[key];
    if (
      !value ||
      !(catalog.currencies || []).some((option) => option.value === value)
    )
      throw new Error(
        "Selecione as duas moedas disponíveis antes de continuar.",
      );
    payload[key] = value;
  }
  if (["languageCode", "timeZoneId", "theme"].some((key) => !payload[key]))
    throw new Error(
      "As preferências de idioma, fuso ou tema da conta estão incompletas. Confira os Ajustes antes de continuar.",
    );
  return payload;
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
  };
}
export function contactRegistrationPayload(current, draft) {
  return {
    name: draft.name.trim(),
    phoneNumber: draft.phoneNumber.trim(),
    relationship: current?.relationship ?? null,
    email: current?.email ?? null,
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
    nationalities: (catalog.countries || []).map((c) => ({
      value: c.id,
      label: c.name,
      isoCode: c.isoCode,
    })),
    countries: (catalog.countries || []).map((c) => ({
      value: c.id,
      label: c.name,
      isoCode: c.isoCode,
    })),
    occupations: existing(catalog.occupations, professional?.occupation),
    currencies: catalog.currencies || [],
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
