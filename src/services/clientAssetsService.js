import {
  clientApi,
  captureClientSession,
  assertClientSessionCurrent,
} from "./clientApi";
import { financeGet, financeWrite } from "./financeService";
const base = "client/profile/assets";
export async function listClientAssets() {
  const session = captureClientSession(),
    rows = [],
    ids = new Set();
  let page = 1,
    totalPages = 1,
    totalItems;
  do {
    assertClientSessionCurrent(session);
    const response = await financeGet(base, { page, pageSize: 100 });
    assertClientSessionCurrent(session);
    if (!Array.isArray(response.data))
      throw Error("Não foi possível consultar o patrimônio.");
    const pages = Number(response.pagination?.totalPages),
      total = Number(response.pagination?.totalItems);
    if (
      !Number.isSafeInteger(pages) ||
      pages < 0 ||
      !Number.isSafeInteger(total) ||
      total < 0 ||
      (total > 0 && pages === 0)
    )
      throw Error("Consulta de patrimônio incompleta.");
    if (
      totalItems !== undefined &&
      (pages !== totalPages || total !== totalItems)
    )
      throw Error("Consulta de patrimônio incompleta.");
    totalPages = pages;
    totalItems = total;
    for (const row of response.data) {
      if (!row.id || ids.has(row.id))
        throw Error("Consulta de patrimônio inconsistente.");
      ids.add(row.id);
      rows.push(row);
    }
    if (page < totalPages && !response.data.length)
      throw Error("Consulta de patrimônio incompleta.");
    page++;
  } while (page <= totalPages);
  if (rows.length !== totalItems)
    throw Error("Consulta de patrimônio incompleta.");
  return rows;
}
export const getClientAsset = async (id) =>
  (await financeGet(`${base}/${encodeURIComponent(id)}`)).data;
export const createClientAsset = (payload) =>
  financeWrite("post", base, payload);
export const updateClientAsset = (id, payload) =>
  financeWrite("patch", `${base}/${encodeURIComponent(id)}`, payload);
export const getClientAssetDocuments = async (id) =>
  (await financeGet(`${base}/${encodeURIComponent(id)}/documents`)).data;
export const getClientAssetDocumentUrl = async (id, documentId) =>
  (
    await financeGet(
      `${base}/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}/temporary-url`,
    )
  ).data;
export const getClientAssetCurrencies = async () => {
  const response = await clientApi.get("/api/v1/client/wallets");
  const rows = response.data?.data;
  if (!Array.isArray(rows))
    throw Error("Não foi possível consultar as moedas desta conta.");
  return [
    ...new Map(
      rows
        .filter((row) => row.currencyId && row.currencyIsoCode)
        .map((row) => [
          row.currencyId,
          { value: row.currencyId, label: row.currencyIsoCode },
        ]),
    ).values(),
  ];
};
