// Home amounts are already converted and consolidated by the backend.
// Keep this separate from native-currency balances used by movement forms.
const numeric = (value) =>
  (typeof value === "number" || typeof value === "string") &&
  String(value).trim() !== "" &&
  Number.isFinite(Number(value))
    ? Number(value)
    : null;
export function homeWalletCardAmounts(home) {
  const section = home?.wallets;
  const result = { deposit: [], strategy: [], assets: [], total: [] };
  if (
    home?.access?.financialStatus !== "Available" ||
    section?.status !== "Available" ||
    typeof section.currencyIsoCode !== "string" ||
    !/^[A-Z]{3}$/.test(section.currencyIsoCode)
  )
    return result;
  for (const [card, field] of Object.entries({
    deposit: "deposit",
    strategy: "strategy",
    assets: "patrimony",
    total: "total",
  })) {
    const metric = section[field];
    result[card] = [
      {
        currency: section.currencyIsoCode,
        value: metric?.status === "Available" ? numeric(metric.value) : null,
      },
    ];
  }
  return result;
}
