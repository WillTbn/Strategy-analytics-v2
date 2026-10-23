const agreementCodes = ["terms-of-use", "privacy-policy"];
export function onboardingAgreements(requirements) {
  if (
    requirements?.context !== "Onboarding" ||
    !Array.isArray(requirements.items)
  )
    throw new Error(
      "Não foi possível consultar os termos. Recarregue esta etapa.",
    );
  return agreementCodes.map((code) => {
    const item = requirements.items.find((entry) => entry.code === code);
    if (!item?.versionId || !item.content?.body || item.kind !== "Agreement")
      throw new Error(
        "Não foi possível carregar os termos. Recarregue esta etapa.",
      );
    return item;
  });
}
export function onboardingConsentPayload(requirements, acceptance) {
  const agreements = onboardingAgreements(requirements);
  const pending = agreements.filter((item) => item.status !== "Accepted");
  if (!pending.length) return null;
  if (
    acceptance?.accepted !== true ||
    agreements.some((item) => !acceptance.versionIds?.includes(item.versionId))
  )
    throw new Error(
      "Leia e aceite os termos atuais antes de enviar o cadastro.",
    );
  return {
    context: "Onboarding",
    locale:
      agreements[0].content.requestedLocale || agreements[0].content.locale,
    source: "Web",
    decisions: pending.map((item) => ({
      versionId: item.versionId,
      decision: "Accepted",
    })),
  };
}
export function confirmedOnboardingSubmission(submission) {
  return (
    !!submission?.submittedAtUtc &&
    typeof submission.status === "string" &&
    submission.status !== "NotSubmitted" &&
    typeof submission.profileEditingLocked === "boolean"
  );
}
