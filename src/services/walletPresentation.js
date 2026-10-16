// Keep monetary values in their original currency. Missing data is never zero.
export const numericValue = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value))
    ? Number(value)
    : null;
export function summaryAmounts(home, key) {
  return (home?.summaries || []).map((summary) => ({
    currency: summary.currencyIsoCode,
    value:
      summary[key]?.status === "Available"
        ? numericValue(summary[key].value)
        : null,
  }));
}
export function freeWalletAmounts(wallets) {
  const groups = new Map();
  for (const wallet of wallets || []) {
    if (wallet.type !== "Free" || !wallet.currencyIsoCode) continue;
    const value = numericValue(wallet.available);
    const previous = groups.get(wallet.currencyIsoCode);
    groups.set(
      wallet.currencyIsoCode,
      value === null || previous === null ? null : (previous || 0) + value,
    );
  }
  return Array.from(groups, ([currency, value]) => ({ currency, value }));
}
export function amountLabel(amount) {
  if (!amount?.currency || numericValue(amount.value) === null) return "—";
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: amount.currency,
    }).format(Number(amount.value));
  } catch {
    return "—";
  }
}
