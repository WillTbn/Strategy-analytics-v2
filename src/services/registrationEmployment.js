// Presentation draft; not an HTTP payload. Amounts never pass through binary floats.
export const employmentFields = [
  { key: "occupation", label: "Ocupação", placeholder: "Informe sua ocupação" },
  {
    key: "employerName",
    label: "Empregador (opcional)",
    placeholder: "Nome da empresa ou organização",
  },
  {
    key: "individualMonthlyIncome",
    label: "Renda média mensal (R$)",
    kind: "money",
    placeholder: "R$ 0,00",
  },
  {
    key: "householdMonthlyIncome",
    label: "Renda média mensal da família (R$)",
    kind: "money",
    placeholder: "R$ 0,00",
    hint: "Sua renda somada à de mais uma pessoa (cônjuge, pai ou mãe)",
  },
  {
    key: "declaredNetWorth",
    label: "Valor aproximado dos seus bens (R$)",
    kind: "money",
    placeholder: "R$ 0,00",
  },
  { key: "primaryCurrencyCode", label: "Moeda principal", kind: "select" },
  { key: "secondaryCurrencyCode", label: "Moeda secundária", kind: "select" },
];
export function newRegistrationEmployment(value = {}) {
  return {
    occupation: value.occupation ?? "",
    employerName: value.employerName ?? "",
    individualMonthlyIncome: String(value.individualMonthlyIncome ?? ""),
    householdMonthlyIncome: String(value.householdMonthlyIncome ?? ""),
    declaredNetWorth: String(value.declaredNetWorth ?? ""),
    primaryCurrencyCode: value.primaryCurrencyCode ?? null,
    secondaryCurrencyCode: value.secondaryCurrencyCode ?? null,
  };
}
export function parseRegistrationAmount(value) {
  const text = String(value ?? "").trim();
  if (!text) return { kind: "empty", decimal: null };
  const amount = text.replace(/^R\$\s*/, "");
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(amount))
    return { kind: "invalid", decimal: null };
  const [integer, fraction = ""] = amount.split(",");
  const units = integer.replaceAll(".", "").replace(/^0+(?=\d)/, "");
  return { kind: "valid", decimal: `${units}.${fraction.padEnd(2, "0")}` };
}
export function validateRegistrationEmployment(
  draft,
  currencies = [],
  required = ["occupation", "primaryCurrencyCode", "secondaryCurrencyCode"],
) {
  const errors = {};
  if (required.includes("occupation") && !String(draft.occupation ?? "").trim())
    errors.occupation = "Informe sua ocupação.";
  for (const key of ["primaryCurrencyCode", "secondaryCurrencyCode"]) {
    if (!draft[key] && required.includes(key))
      errors[key] = "Selecione a moeda.";
    else if (
      draft[key] &&
      !currencies.some((option) => option.value === draft[key])
    )
      errors[key] = "Selecione uma moeda disponível.";
  }
  for (const field of employmentFields) {
    if (field.kind !== "money") continue;
    const amount = parseRegistrationAmount(draft[field.key]);
    if (amount.kind === "invalid")
      errors[field.key] = "Informe um valor não negativo, como R$ 1.234,56.";
    else if (amount.kind === "empty" && required.includes(field.key))
      errors[field.key] = "Informe o valor deste campo.";
  }
  return errors;
}
