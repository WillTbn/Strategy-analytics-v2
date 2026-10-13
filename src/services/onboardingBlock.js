// Translate structured access requirements; never infer a deposit from generic text.
export function onboardingBlockMessage(error) {
  if (error?.response?.status !== 403) return "";
  const body = error.response.data;
  const code = body?.data?.blockingCode || body?.errors?.[0]?.code;
  if (code === "DocumentLevelInsufficient") {
    const current = body?.data?.current?.documentLevel;
    const required = body?.data?.required?.documentLevel;
    return Number.isInteger(current) && Number.isInteger(required)
      ? `Seu cadastro consta no nível documental ${current}. Esta consulta exige nível ${required}. Se você já foi aprovado, solicite a revisão do nível ao atendimento.`
      : "Seu nível documental ainda não atende ao exigido para esta consulta. Solicite a revisão do cadastro ao atendimento.";
  }
  if (code === "PreferencesRequired") return "Complete suas preferências de cadastro para acessar esta seção.";
  return "";
}
