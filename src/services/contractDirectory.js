export const finiteContractValue = (value) =>
  (typeof value === "number" || (typeof value === "string" && value.trim())) &&
  Number.isFinite(Number(value))
    ? Number(value)
    : null;
export const availableContractValue = (metric) =>
  metric?.status === "Available" ? finiteContractValue(metric.value) : null;
export const contractCurrency = (row) =>
  typeof row?.currencyCode === "string" && /^[A-Z]{3}$/.test(row.currencyCode)
    ? row.currencyCode
    : null;
export function contractMoney(value, currency) {
  const number = finiteContractValue(value);
  if (number === null || !currency) return "—";
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(number);
  } catch {
    return "—";
  }
}
export function contractOverview(rows, home) {
  const complete = Array.isArray(rows),
    statusKnown =
      complete &&
      rows.every((r) => typeof r?.businessStatus?.code === "string");
  const active = statusKnown
    ? rows.filter((r) => r.businessStatus.code.toUpperCase() === "ACTIVE")
        .length
    : null;
  const summaries =
    home?.access?.financialStatus === "Available" &&
    Array.isArray(home.summaries)
      ? home.summaries
      : null;
  return {
    active,
    applied: (summaries || []).map((s) => ({
      currency: s.currencyIsoCode,
      value: availableContractValue(s.contractedCapital),
    })),
  };
}
export function contractDirectoryRow(row) {
  const code = contractCurrency(row);
  return {
    id: row.id,
    name: row.name || row.publicCode || "Contrato",
    currency: code,
    tags: [row.term?.name, row.category?.name].filter(
      (v) => typeof v === "string" && v.trim(),
    ),
    initial: availableContractValue(row.entryValue),
    base: finiteContractValue(row.myParticipation?.baseAmount),
    current: availableContractValue(row.currentPosition),
    next: availableContractValue(row.nextProfitDistribution),
    nextDate: row.nextProfitDistribution?.date || null,
  };
}
export async function readContractDirectory(read, active = () => true) {
  const rows = [],
    seen = new Set();
  let page = 1,
    total = 1;
  do {
    if (!active()) return null;
    const result = await read("client/contracts", { page, pageSize: 100 });
    if (!active()) return null;
    if (!Array.isArray(result?.data)) throw Error("Contratos indisponíveis.");
    total = Number(result.pagination?.totalPages ?? 1);
    if (!Number.isInteger(total) || total < 0 || total > 10000)
      throw Error("Paginação indisponível.");
    for (const row of result.data) {
      if (!row?.id || seen.has(row.id))
        throw Error("Lista de contratos inconsistente.");
      seen.add(row.id);
      rows.push(row);
    }
    page++;
  } while (page <= total);
  return rows;
}
export function validContractSeries(series) {
  return (
    Array.isArray(series) &&
    series.length > 0 &&
    series.every(
      (s) =>
        typeof s.name === "string" &&
        Array.isArray(s.data) &&
        s.data.length > 0 &&
        s.data.every(
          (p) =>
            typeof p?.x === "number" &&
            Number.isFinite(p.x) &&
            finiteContractValue(p.y) !== null,
        ),
    )
  );
}
export function contractSeriesPeriod(series, period) {
  if (!validContractSeries(series)) return [];
  if (period === "Máximo") return series;
  const latest = Math.max(...series.flatMap((s) => s.data.map((p) => p.x))),
    months = { "1M": 1, "6M": 6, "12M": 12 }[period];
  const cutoff = new Date(latest);
  if (months) {
    const day = cutoff.getUTCDate();
    cutoff.setUTCDate(1);
    cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
    const last = new Date(
      Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0),
    ).getUTCDate();
    cutoff.setUTCDate(Math.min(day, last));
  } else cutoff.setUTCMonth(0, 1);
  return series.map((s) => ({
    ...s,
    data: s.data.filter((p) => p.x >= cutoff.getTime()),
  }));
}
