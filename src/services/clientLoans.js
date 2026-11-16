import { financeGet } from "./financeService";
export async function listClientLoans(read = financeGet, active = () => true) {
  const rows = [];
  let page = 1,
    totalPages = 1;
  do {
    if (!active()) return [];
    const result = await read("client/loans", { page, pageSize: 100 });
    if (!Array.isArray(result?.data)) throw Error("Empréstimos indisponíveis.");
    if (!active()) return [];
    rows.push(...result.data);
    totalPages = Number(result.pagination?.totalPages ?? 1);
    if (!Number.isInteger(totalPages) || totalPages < 0 || totalPages > 10000)
      throw Error("Paginação indisponível.");
    page++;
  } while (page <= totalPages);
  return rows;
}
export function loansByStatus(rows, group) {
  const statuses = {
    actives: ["Active"],
    quitada: ["PaidOff"],
    simulation: ["Draft", "UnderReview", "Requested", "Pending", "Approved"],
  };
  return (rows || []).filter((row) => statuses[group]?.includes(row.status));
}
export function loanDebtAmounts(rows) {
  const grouped = new Map();
  for (const row of rows || []) {
    if (row.status !== "Active") continue;
    const value =
      row.outstandingAmount == null ||
      !Number.isFinite(Number(row.outstandingAmount))
        ? null
        : Number(row.outstandingAmount);
    const previous = grouped.get(row.currencyIsoCode);
    grouped.set(
      row.currencyIsoCode,
      value == null || previous === null ? null : (previous || 0) + value,
    );
  }
  return [...grouped].map(([currency, value]) => ({ currency, value }));
}
export const loanDisplay = (row) => ({
  id: row.id,
  title: row.publicCode,
  status: row.status,
  interest:
    row.interestRatePercent == null
      ? ""
      : String(row.interestRatePercent) + "%",
  kind: row.kind,
});
export function lendingLevel(status) {
  const value = Number(status?.documentLevel);
  return status?.documentLevel != null && Number.isInteger(value) && value >= 0
    ? value
    : null;
}
