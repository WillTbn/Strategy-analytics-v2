import { clientApi } from "./clientApi";
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
export const listProfileTerms = async (
  context = process.env.CLIENT_PROFILE_CONSENT_CONTEXT,
) => {
  if (!context) throw new Error("Consulta de termos indisponível.");
  return unwrap(
    await clientApi.get("/api/v1/client/consents", { params: { context } }),
  );
};
