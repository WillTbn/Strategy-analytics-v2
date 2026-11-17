// View-model primitives, not a new HTTP contract. No quote or eligibility is inferred.
export const knownOfferStatuses = {
  Accepted: "Aceito",
  Received: "Recebido",
  Rejected: "Recusado",
  UnderReview: "Em Análise",
};
export function readOfferRows(value) {
  const rows = Array.isArray(value) ? value : value?.items;
  if (
    !Array.isArray(rows) ||
    rows.some((row) => !row || typeof row.id !== "string" || !row.id.trim()) ||
    new Set(rows.map((row) => row.id)).size !== rows.length
  )
    throw Error("Ofertas indisponíveis.");
  return rows;
}
export const offerNumber = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value))
    ? Number(value)
    : null;
export function offerPercent(value) {
  const number = offerNumber(value);
  return number === null
    ? "Indisponível"
    : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(
        number,
      ) + "%";
}
export const offerSignature = (offer) =>
  JSON.stringify([
    offer.id,
    offer.status,
    offer.amount,
    offer.currency,
    offer.installments,
    offer.installmentAmount,
    offer.interestRate,
    offer.adminRate,
    offer.embeddedBidPercent,
    offer.canSelect,
  ]);
export function selectableLoanOffer(offer) {
  return (
    !!offer &&
    offer.canSelect === true &&
    ["Accepted", "Received"].includes(offer.status) &&
    typeof offer.id === "string" &&
    !!offer.id.trim() &&
    /^[A-Z]{3}$/.test(offer.currency || "") &&
    offerNumber(offer.amount) > 0 &&
    Number.isInteger(offerNumber(offer.installments)) &&
    offerNumber(offer.installments) > 0 &&
    offerNumber(offer.installmentAmount) > 0 &&
    [offer.interestRate, offer.adminRate].some(
      (rate) => offerNumber(rate) !== null && offerNumber(rate) >= 0,
    )
  );
}
export function resolveSelectedOffer(rows, selection) {
  const offer = rows.find(
    (row) =>
      row.id === selection?.id && offerSignature(row) === selection.signature,
  );
  return selectableLoanOffer(offer) ? offer : null;
}
export function offerInstallments(offer) {
  return Number.isInteger(offerNumber(offer.installments)) &&
    offerNumber(offer.installments) > 0
    ? `${offer.installments}`
    : "Indisponível";
}

export function matchingCollateralQuote(quote, draft) {
  if (
    !quote ||
    typeof quote.id !== "string" ||
    !quote.id.trim() ||
    offerNumber(quote.amount) <= 0 ||
    quote.currency !== "BRL" ||
    offerNumber(quote.amount) !== draft.amount ||
    quote.installments !== draft.installments
  )
    return null;
  return ["totalAmount", "installmentAmount", "monthlyInterestRate"].every(
    (key) => offerNumber(quote[key]) !== null && offerNumber(quote[key]) >= 0,
  )
    ? quote
    : null;
}

export const collateralQuoteSignature = (quote) =>
  JSON.stringify([
    quote.id,
    quote.amount,
    quote.currency,
    quote.installments,
    quote.totalAmount,
    quote.installmentAmount,
    quote.monthlyInterestRate,
    quote.profitDistributionPercent,
    quote.profitDistributionAmount,
  ]);
