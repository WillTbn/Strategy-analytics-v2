import {
  finiteContractValue,
  contractMoney,
  validContractSeries,
} from "./contractDirectory.js";

export const detailAssets = Object.freeze(
  Object.fromEntries(
    [
      ["balance", "imgWhiskA02F73Df51.png"],
      ["distribution", "imgWhiskE88B8Da488.png"],
      ["income", "imgWhiskEa8D61A4C51.png"],
      ["documents", "imgWhisk93C52372B3.png"],
      ["open", "imgArrowUpRight.svg"],
      ["upload", "imgFileUpload.svg"],
      ["close", "imgX.svg"],
      ["back", "imgArrowLeft.svg"],
      ["dividend", "imgChartPie.svg"],
      ["package", "imgPackage.svg"],
      ["invoice", "imgFileInvoice.svg"],
      ["networksPackage", "1-47251-imgPackage.svg"],
      ["networksInvoice", "1-47251-imgFileInvoice.svg"],
      ["fiatPackage", "1-47098-imgPackage.svg"],
      ["fiatInvoice", "1-47098-imgFileInvoice.svg"],
      ["cryptoPackage", "1-47350-imgPackage.svg"],
      ["cryptoInvoice", "1-47350-imgFileInvoice.svg"],
      ["appBackground", "imgContent.png"],
      ["verified", "imgRosetteDiscountCheck.svg"],
    ].map(([key, file]) => [key, "/figma/contract-detail/" + file]),
  ),
);
export const detailColors = [
  "#9875ff",
  "#d582e3",
  "#ee77a2",
  "#fc6c6c",
  "#ffc15c",
  "#00a3ff",
];
export const detailNumber = finiteContractValue;
export const detailMoney = contractMoney;
export function detailMetric(metric) {
  return metric?.status === "Available" ||
    metric?.calculationStatus === "Available"
    ? finiteContractValue(metric.value)
    : null;
}
export function detailDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value))
    return "—";
  const part = value.slice(0, 10),
    date = new Date(part + "T00:00:00Z");
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === part
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date)
    : "—";
}
export function detailPercent(value) {
  const n = finiteContractValue(value);
  return n === null
    ? "—"
    : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(n) +
        "%";
}
export function contractDetailModel(dto) {
  const iso = dto?.currency?.isoCode;
  const currency =
    typeof iso === "string" && /^[A-Z]{3}$/.test(iso) ? iso : null;
  return {
    id: dto?.id || null,
    name: dto?.name || dto?.publicCode || "Detalhes do Contrato",
    currency,
    currencyName: dto?.currency?.name || currency || "—",
    applied: finiteContractValue(dto?.myParticipation?.baseAmount),
    acquisition: detailMetric(dto?.entryValue),
    current: detailMetric(dto?.currentPosition),
    acquisitionDate: dto?.myParticipation?.linkedAtUtc || null,
    startDate: dto?.startDate || null,
    endDate: dto?.expectedEndDate || null,
  };
}
export function validDetailComposition(rows) {
  return (
    Array.isArray(rows) &&
    rows.length > 0 &&
    new Set(rows.map((r) => r?.label)).size === rows.length &&
    rows.every(
      (r) =>
        typeof r?.label === "string" &&
        r.label.trim() &&
        finiteContractValue(r.value) !== null &&
        Number(r.value) >= 0,
    ) &&
    Math.abs(rows.reduce((sum, r) => sum + Number(r.value), 0) - 100) < 0.02
  );
}
export const detailSeriesReady = (series) =>
  validContractSeries(series) &&
  series.every((s) =>
    s.data.every((p) => Number.isFinite(new Date(p.x).getTime())),
  );
export function safeDetailImage(value) {
  if (typeof value !== "string") return null;
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\x00-\x1f]/.test(value)
  )
    return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function approvedAppUrl(value, origins) {
  if (!Array.isArray(origins) || !origins.length) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      origins.includes(url.origin)
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function participantRows(rows) {
  if (!Array.isArray(rows)) return null;
  return rows
    .filter((r) => r && typeof r.id === "string" && typeof r.name === "string")
    .map((r) => ({
      ...r,
      avatar: safeDetailImage(r.avatar),
      strategyId: typeof r.strategyId === "string" ? r.strategyId : null,
    }));
}

export function escapeDetailText(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
export function detailRemainingTerm(value, now = new Date()) {
  if (detailDate(value) === "—" || !Number.isFinite(now.getTime())) return "—";
  const end = new Date(value.slice(0, 10) + "T00:00:00Z");
  if (
    end.getTime() <
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
    return "Encerrado";
  let months =
    (end.getUTCFullYear() - now.getUTCFullYear()) * 12 +
    end.getUTCMonth() -
    now.getUTCMonth();
  if (end.getUTCDate() < now.getUTCDate()) months--;
  if (months < 1) return "Menos de um mês";
  const years = Math.floor(months / 12),
    rest = months % 12;
  return [
    years ? years + (years === 1 ? " ano" : " anos") : null,
    rest ? rest + (rest === 1 ? " mês" : " meses") : null,
  ]
    .filter(Boolean)
    .join(" e ");
}
