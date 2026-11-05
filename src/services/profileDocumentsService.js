import { clientApi } from "./clientApi";
import { getOnboardingConsents } from "./registrationConsents";
const unwrap = (response) => response.data?.data ?? response.data;
export const listProfileContracts = async (page = 1) =>
  unwrap(
    await clientApi.get("/api/v1/client/contracts", {
      params: { page, pageSize: 100 },
    }),
  );
export const listProfileContractDocuments = async (id) =>
  unwrap(await clientApi.get(`/api/v1/client/contracts/${id}/documents`));
export const getProfileContractDocumentUrl = async (contractId, documentId) =>
  unwrap(
    await clientApi.get(
      `/api/v1/client/contracts/${contractId}/documents/${documentId}/temporary-url`,
    ),
  );
export const downloadProfileTermDocument = (id) =>
  clientApi.get(
    `/api/v1/client/profile/documents/${encodeURIComponent(id)}/download`,
    {
      responseType: "blob",
    },
  );
export async function listProfileTerms() {
  const results = await Promise.allSettled([
    getOnboardingConsents(),
    clientApi.get("/api/v1/client/profile/documents/overview").then(unwrap),
  ]);
  if (results.every((result) => result.status === "rejected"))
    throw results[0].reason;
  const items =
    results[0].status === "fulfilled"
      ? (results[0].value?.items || []).filter(
          (item) => item.kind !== "Consent",
        )
      : [];
  const overview = results[1].status === "fulfilled" ? results[1].value : null;
  const seen = new Set();
  for (const row of (overview?.sections || [])
    .filter((section) => section.code === "PLATFORM")
    .flatMap((section) => section.items || [])) {
    const files = row.files?.length
      ? row.files
      : row.document
        ? [row.document]
        : row.documentId
          ? [{ id: row.documentId }]
          : [];
    for (const file of files) {
      if (!file.id || seen.has(file.id)) continue;
      seen.add(file.id);
      items.push({
        versionId: `document:${file.id}`,
        documentId: file.id,
        content: {
          title: row.documentTypeName || file.fileName || "Termo da plataforma",
        },
      });
    }
  }
  return {
    items,
    partialError: results.some((result) => result.status === "rejected")
      ? "Alguns termos não puderam ser carregados. Tente novamente."
      : "",
  };
}
