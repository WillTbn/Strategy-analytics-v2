export const shareScopeOptions = [
  { label: "Básico", value: "Basic" },
  { label: "Completo", value: "Full" },
];
export function profileShareScope(value) {
  const scope = value === "Profile" ? "Basic" : value;
  if (!shareScopeOptions.some((option) => option.value === scope))
    throw new Error("Selecione um escopo válido.");
  return scope;
}
export function publicProfileFields(profile = {}) {
  if (profile.scope !== "Full") return [];
  return [
    { label: "Atividade trabalhista", value: profile.occupation },
    {
      label: "Nível documental",
      value:
        profile.documentLevel == null ? null : `Nível ${profile.documentLevel}`,
    },
  ].filter((field) => field.value != null && field.value !== "");
}
