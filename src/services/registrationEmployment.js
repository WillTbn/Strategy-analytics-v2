// Presentation draft; not an HTTP payload. Amounts never pass through binary floats.
export const employmentFields = [
  { key: "occupation", label: "Atividade trabalhista", kind: "select" },
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
];
export function newRegistrationEmployment(value = {}) {
  return {
    occupation: value.occupation ?? null,
    individualMonthlyIncome: String(value.individualMonthlyIncome ?? ""),
    householdMonthlyIncome: String(value.householdMonthlyIncome ?? ""),
    declaredNetWorth: String(value.declaredNetWorth ?? ""),
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
  occupations = [],
  required = [],
) {
  const errors = {};
  if (
    draft.occupation !== null &&
    draft.occupation !== "" &&
    !occupations.some((option) => option.value === draft.occupation)
  )
    errors.occupation = "Selecione uma atividade disponível.";
  for (const field of employmentFields) {
    if (field.kind !== "money") continue;
    const amount = parseRegistrationAmount(draft[field.key]);
    if (amount.kind === "invalid")
      errors[field.key] = "Informe um valor não negativo, como R$ 1.234,56.";
    else if (amount.kind === "empty" && required.includes(field.key))
      errors[field.key] = "Informe o valor deste campo.";
  }
  if (
    required.includes("occupation") &&
    (draft.occupation === null || draft.occupation === "")
  )
    errors.occupation = "Selecione sua atividade trabalhista.";
  return errors;
}
