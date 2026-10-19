import { numericValue } from "./walletPresentation.js";
const ready = (state) =>
  Boolean(
    state &&
      !state.loading &&
      !state.error &&
      state.data !== null &&
      state.data !== undefined,
  );
const zero = (value) =>
  ["number", "string"].includes(typeof value) && numericValue(value) === 0;
export function contractsAreEmpty(state) {
  const contracts = ready(state) && state.data.contracts;
  return (
    contracts?.status === "Available" &&
    Array.isArray(contracts.items) &&
    contracts.items.length === 0 &&
    zero(contracts.totalItems)
  );
}
export function portfolioIsEmpty(home, wallets, deposits) {
  if (
    !ready(home) ||
    !ready(wallets) ||
    !ready(deposits) ||
    deposits.data.hasCompletedDeposit !== false
  )
    return false;
  const data = home.data;
  if (
    data.access?.financialStatus !== "Available" ||
    !Array.isArray(data.summaries) ||
    !Array.isArray(wallets.data) ||
    !contractsAreEmpty(home)
  )
    return false;
  if (
    !data.summaries.every(
      (summary) =>
        ["availableBalance", "contractedCapital"].every(
          (key) =>
            summary[key]?.status === "Available" && zero(summary[key].value),
        ) &&
        ["currentPosition", "result"].every(
          (key) =>
            summary[key]?.status === "NotAvailable" ||
            (summary[key]?.status === "Available" && zero(summary[key].value)),
        ),
    )
  )
    return false;
  if (
    !wallets.data.every((wallet) =>
      ["balance", "reserved", "available"].every((key) => zero(wallet[key])),
    )
  )
    return false;
  const composition = data.composition;
  if (
    composition?.status !== "Available" ||
    !Array.isArray(composition.currencies) ||
    !composition.currencies.every(
      (currency) =>
        zero(currency.total) &&
        Array.isArray(currency.items) &&
        currency.items.every((item) => zero(item.value)),
    )
  )
    return false;
  if (
    data.chart?.status === "Available" &&
    data.chart.points?.some((point) => numericValue(point.value) !== 0)
  )
    return false;
  return true;
}
export const emptyAmounts = () => [
  { currency: "BRL", value: 0 },
  { currency: "USD", value: 0 },
];
const timestamp = (value) =>
  typeof value === "string" && value.trim() ? Date.parse(value) : NaN;
const DEFAULT_TIME_ZONE = "America/Sao_Paulo";
function localParts(at, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    return Object.fromEntries(
      formatter
        .formatToParts(new Date(at))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)]),
    );
  } catch {
    if (timeZone !== DEFAULT_TIME_ZONE)
      return localParts(at, DEFAULT_TIME_ZONE);
    return null;
  }
}
function localInstant(parts, timeZone) {
  const target = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour || 0,
    parts.minute || 0,
    parts.second || 0,
  );
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const observed = localParts(guess, timeZone);
    if (!observed) return NaN;
    const offset =
      Date.UTC(
        observed.year,
        observed.month - 1,
        observed.day,
        observed.hour,
        observed.minute,
        observed.second,
      ) - guess;
    guess = target - offset;
  }
  return guess;
}
function anniversary(value, months, timeZone) {
  const at = timestamp(value);
  if (!Number.isFinite(at)) return NaN;
  const parts = localParts(at, timeZone);
  if (!parts) return NaN;
  const date = new Date(Date.UTC(parts.year, parts.month - 1, 1)),
    day = parts.day;
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return localInstant(
    {
      ...parts,
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: Math.min(day, last),
    },
    timeZone,
  );
}
export function comparisonIsVisible(
  customerSince,
  now = new Date().toISOString(),
  timeZone = DEFAULT_TIME_ZONE,
) {
  const firstMonth = anniversary(customerSince, 1, timeZone);
  return !Number.isFinite(firstMonth) || timestamp(now) >= firstMonth;
}
export function homePeriods(
  customerSince,
  hasDeposit,
  now = new Date().toISOString(),
  timeZone = DEFAULT_TIME_ZONE,
) {
  if (hasDeposit !== true) return [];
  const options = [];
  const at = timestamp(now),
    since = timestamp(customerSince),
    year = localParts(at, timeZone)?.year;
  if (
    Number.isFinite(since) &&
    since < localInstant({ year, month: 1, day: 1 }, timeZone)
  )
    options.push({ label: String(year), value: String(year) });
  for (const months of [1, 6, 12])
    if (
      Number.isFinite(since) &&
      at >= anniversary(customerSince, months, timeZone)
    )
      options.push({ label: months + "M", value: months + "M" });
  options.push({ label: "Máximo", value: "max" });
  return options;
}
export function chartWindow(
  period,
  firstDepositAtUtc,
  now = new Date().toISOString(),
  timeZone = DEFAULT_TIME_ZONE,
) {
  const first = timestamp(firstDepositAtUtc),
    end = timestamp(now);
  if (!Number.isFinite(first) || !Number.isFinite(end) || first > end)
    return null;
  let from = first;
  if (/^\d{4}$/.test(period || ""))
    from = Math.max(
      first,
      localInstant({ year: Number(period), month: 1, day: 1 }, timeZone),
    );
  else if (/^(1|6|12)M$/.test(period || ""))
    from = Math.max(
      first,
      anniversary(now, -Number.parseInt(period), timeZone),
    );
  return { from, to: end };
}
export function homeChartPoints(
  chart,
  firstDepositAtUtc,
  period = "max",
  now = new Date().toISOString(),
  timeZone = DEFAULT_TIME_ZONE,
) {
  const window = chartWindow(period, firstDepositAtUtc, now, timeZone);
  if (!window || chart?.status !== "Available" || !Array.isArray(chart.points))
    return [];
  return chart.points
    .filter(
      (point) =>
        numericValue(point.value) !== null &&
        Number.isFinite(timestamp(point.atUtc)),
    )
    .map((point) => [timestamp(point.atUtc), Number(point.value)])
    .filter(([at]) => at >= window.from && at <= window.to)
    .sort((a, b) => a[0] - b[0]);
}
export function homeChartBounds(points) {
  if (!points.length) return { min: undefined, max: undefined };
  const round = (value) => {
    if (!value) return 0;
    const magnitude = 10 ** Math.floor(Math.log10(value));
    return [1, 2, 5, 10].find((step) => step * magnitude >= value) * magnitude;
  };
  const values = points.map((point) => point[1]);
  const min = -round(Math.max(0, -Math.min(...values)) * 1.2);
  const max = round(Math.max(0, Math.max(...values)) * 1.2);
  return { min: min || 0, max: max || (min ? 0 : 1) };
}
