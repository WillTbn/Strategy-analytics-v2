const keys = [
  "individualMonthlyIncome",
  "householdMonthlyIncome",
  "declaredNetWorth",
];
// Number inputs use dot decimals; retain strings to avoid rounding API amounts.
export function profileAmount(value) {
  if (value == null || (typeof value === "string" && !value.trim()))
    return null;
  if (!["string", "number"].includes(typeof value))
    throw new Error("Informe valores financeiros válidos.");
  const text = String(value).trim();
  if (!/^\d+(?:\.\d+)?$/.test(text) || !Number.isFinite(Number(text)))
    throw new Error("Informe valores financeiros válidos e não negativos.");
  const [integer, fraction = ""] = text.split(".");
  const units = integer.replace(/^0+(?=\d)/, "");
  const decimals = fraction.replace(/0+$/, "");
  return decimals ? `${units}.${decimals}` : units;
}
export function profileJobChanges(professional, financial, draft) {
  if (typeof draft.occupation !== "string" || !draft.occupation.trim())
    throw new Error("Informe a atividade trabalhista.");
  const occupation = draft.occupation.trim();
  // Validate all inputs before starting either write.
  const amounts = Object.fromEntries(
    keys.map((key) => [key, profileAmount(draft[key])]),
  );
  return {
    professional:
      occupation === professional.occupation?.trim()
        ? null
        : {
            occupation,
            employerName: professional.employerName,
            validFrom: professional.validFrom,
            validTo: professional.validTo,
            isCurrent: professional.isCurrent,
          },
    financial: keys.every(
      (key) => amounts[key] === profileAmount(financial[key]),
    )
      ? null
      : {
          ...amounts,
          currencyCode: financial.currencyCode,
          effectiveFrom: financial.effectiveFrom,
        },
  };
}

// Keep the editor baseline separate from refreshes. Advance only after a
// confirmed write, so a retry sends just the changes still pending.
export async function saveProfileJob(baseline, draft, operations) {
  const changes = profileJobChanges(
    baseline.professional,
    baseline.financial,
    draft,
  );
  for (const key of ["professional", "financial"]) {
    if (!changes[key]) continue;
    operations.assertSession();
    await operations[key](changes[key]);
    operations.assertSession();
    baseline[key] = { ...baseline[key], ...changes[key] };
  }
}
