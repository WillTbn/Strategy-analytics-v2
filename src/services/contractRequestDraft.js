export const requestSendUnavailable =
  "Não foi possível enviar sua solicitação. Suas respostas foram mantidas. Tente novamente.";
export function emptyContractRequestDraft() {
  return {
    objective: null,
    time: null,
    modality: null,
    amount: null,
    amount_mensal: null,
    types: [],
    regions: [],
  };
}
function positive(value) {
  const raw = String(value ?? "")
    .trim()
    .replace(/\s/g, "");
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(raw)) return false;
  const n = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 && n <= 9999999999999.99;
}
export function requestStepReady(step, draft) {
  if (step === 1) return !!draft.objective;
  if (step === 2) return !!draft.time;
  if (step === 3)
    return (
      [
        "Aplicação Única",
        "Com Aportes Recorrentes",
        "Aplicação Híbrida",
      ].includes(draft.modality) &&
      positive(draft.amount) &&
      (draft.modality !== "Aplicação Híbrida" || positive(draft.amount_mensal))
    );
  if (step === 4)
    return (
      Array.isArray(draft.types) &&
      draft.types.length > 0 &&
      draft.types.every(
        (value) => Number.isInteger(value) && value >= 1 && value <= 11,
      )
    );
  if (step === 5)
    return Array.isArray(draft.regions) && draft.regions.length > 0;
  return false;
}
export function contractRequestComplete(draft) {
  return [1, 2, 3, 4, 5].every((step) => requestStepReady(step, draft));
}
// Amount fields in the approved form are explicitly denominated in BRL.
export const contractRequestAssetLabels = Object.freeze([
  "Ações",
  "ETFs",
  "Títulos (renda fixa, bonds, debêntures, treasuries)",
  "Opções",
  "Criptoativos",
  "Fundos Imobiliários",
  "Commodities (ouro, petróleo, agrícolas, metais)",
  "Derivativos (futuros, swaps, CFDs)",
  "Venture Capital",
  "Forex",
  "Hedge Funds",
]);
export function contractRequestPayload(draft, currencyId) {
  if (
    !contractRequestComplete(draft) ||
    typeof currencyId !== "string" ||
    !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(currencyId)
  )
    throw Error(requestSendUnavailable);
  const amount = (value) =>
    Number(
      String(value).replace(/\s/g, "").replace(/\./g, "").replace(",", "."),
    );
  const recurring = draft.modality === "Com Aportes Recorrentes";
  return {
    objective: draft.objective,
    period: draft.time,
    modality: {
      "Aplicação Única": "SinglePayment",
      "Com Aportes Recorrentes": "Recurring",
      "Aplicação Híbrida": "Hybrid",
    }[draft.modality],
    initialAmount: recurring ? null : amount(draft.amount),
    monthlyAmount: recurring
      ? amount(draft.amount)
      : draft.modality === "Aplicação Híbrida"
        ? amount(draft.amount_mensal)
        : null,
    currencyId,
    assetTypes: [...new Set(draft.types)].map(
      (id) => contractRequestAssetLabels[id - 1],
    ),
    regions: [...new Set(draft.regions)],
  };
}
export async function submitContractRequest(draft, options) {
  if (!contractRequestComplete(draft)) throw Error(requestSendUnavailable);
  const { sendContractRequest } = await import("./contractRequestService.js");
  return sendContractRequest(draft, options);
}
