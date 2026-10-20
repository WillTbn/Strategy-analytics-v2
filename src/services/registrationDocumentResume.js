import { documentVariants } from "./registrationDocuments.js";

const fields = [
  "documentNumber",
  "issuer",
  "issuerRegion",
  "issuedDate",
  "expiryDate",
];
const snapshot = (details = {}) =>
  JSON.stringify(fields.map((key) => details[key] || ""));
const isoDate = (value, format) => {
  if (!value) return "";
  const [year, month, day] = value.slice(0, 10).split("-");
  return format === "aaaa/mm/dd"
    ? `${year}/${month}/${day}`
    : format === "mm/dd/aaaa"
      ? `${month}/${day}/${year}`
      : `${day}/${month}/${year}`;
};
export function currentRegistrationDocument(profile, code) {
  const matches = (profile.identificationDocuments?.documents || []).filter(
    (d) =>
      d.documentCode === code &&
      d.countryIsoCode === profile.preferences?.countryIsoCode &&
      d.source === "ProvidedDocument" &&
      d.status === "Active" &&
      d.documentId,
  );
  return matches.length === 1 ? matches[0] : null;
}
export const registrationDocumentCode = (type, variant) =>
  type === "Passaporte" ? "PASSPORT" : variant === "br" ? "RG" : null;
export function hydrateRegistrationDocuments(draft, profile, variant) {
  const config = documentVariants[variant];
  if (!config) return;
  draft.savedDocuments ||= {};
  const format = config.dateFormat;
  for (const type of config.choices) {
    const code = registrationDocumentCode(type, variant);
    const doc =
      code &&
      (currentRegistrationDocument(profile, code) ||
        (code === "PASSPORT" &&
          currentRegistrationDocument(profile, "PASSAPORTE")));
    if (!doc) continue;
    const details = {
      documentNumber: doc.numberMasked || "",
      issuer: doc.issuer || "",
      issuerRegion: doc.issuerState || null,
      issuedDate: isoDate(doc.issuedOn, format),
      expiryDate: isoDate(doc.expiresOn, format),
    };
    draft.details[type] = { ...details, ...draft.details[type] };
    draft.savedDocuments[type] = {
      id: doc.documentId,
      documentTypeId: doc.documentTypeId,
      snapshot: snapshot(draft.details[type]),
      maskedNumber: doc.numberMasked || "",
      count: Number(doc.evidenceSummary?.count || 0),
      status: doc.evidenceSummary?.latestStatus,
      files: {},
      serverSnapshot: JSON.stringify(doc),
    };
  }
  if (!draft.savedDocuments[draft.type]) {
    const available = Object.keys(draft.savedDocuments);
    if (available.length === 1) draft.type = available[0];
  }
}
export function canReuseRegistrationDocument(draft, profile, variant) {
  const saved = draft.savedDocuments?.[draft.type];
  const code = registrationDocumentCode(draft.type, variant);
  const current =
    code &&
    (currentRegistrationDocument(profile, code) ||
      (code === "PASSPORT" &&
        currentRegistrationDocument(profile, "PASSAPORTE")));
  const sides = draft.type === "Passaporte" ? ["passport"] : ["front", "back"];
  return !!(
    saved &&
    current &&
    current.documentId === saved.id &&
    (!saved.serverSnapshot ||
      JSON.stringify(current) === saved.serverSnapshot) &&
    Number(current.evidenceSummary?.count) >= sides.length &&
    ["Uploaded", "Approved", "UnderReview", "PendingReview"].includes(
      current.evidenceSummary?.latestStatus,
    ) &&
    saved.snapshot === snapshot(draft.details[draft.type]) &&
    sides.every(
      (side) =>
        !draft.files[`${draft.type}:${side}`] ||
        draft.files[`${draft.type}:${side}`] ===
          saved.files?.[`${draft.type}:${side}`],
    )
  );
}
export function assertRegistrationDocumentNumber(draft) {
  const saved = draft.savedDocuments?.[draft.type];
  const number = draft.details[draft.type]?.documentNumber || "";
  if (
    (saved?.maskedNumber && number === saved.maskedNumber) ||
    /[*•…]/u.test(number)
  )
    throw new Error(
      "Para alterar ou reenviar este documento, informe o número completo no campo existente. O número salvo é exibido com proteção.",
    );
}
export function rememberRegistrationDocument(
  draft,
  id,
  documentTypeId,
  evidenceCount,
) {
  draft.savedDocuments ||= {};
  draft.savedDocuments[draft.type] = {
    id,
    documentTypeId,
    snapshot: snapshot(draft.details[draft.type]),
    count: evidenceCount,
    status: "Uploaded",
    files: { ...draft.files },
    maskedNumber: "",
  };
}
export function registrationFileState(draft, side) {
  const key = `${draft.type}:${side}`;
  const saved = draft.savedDocuments?.[draft.type];
  const file = draft.files[key];
  if (file)
    return saved?.files?.[key] === file
      ? "Arquivo enviado."
      : "Arquivo selecionado para envio.";
  return saved?.count ? "Há arquivos enviados para este documento." : "";
}
