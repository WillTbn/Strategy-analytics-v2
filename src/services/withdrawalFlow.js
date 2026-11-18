import {
  validateWalletOperation,
  walletBalance,
  balanceAfter,
  bankCurrency,
} from "./walletModel.js";
export function protectedAccount(value) {
  if (typeof value !== "string" || !value.trim()) return "Conta protegida";
  return /[*•·]/.test(value) ? value : "****" + value.slice(-4);
}
export function withdrawalFormError(
  form,
  model,
  bank,
  requirePassword = false,
) {
  const error = validateWalletOperation({
    mode: "withdrawal",
    amount: form.amount,
    currency: form.currency,
    bank,
    password: form.password,
    model,
    requirePassword,
  });
  return (
    error ||
    (!bank?.id || form.bankId !== bank.id
      ? "Selecione uma conta ativa na mesma moeda."
      : "")
  );
}
export function bankFingerprint(bank) {
  return JSON.stringify([
    bank?.id,
    bank?.bankId,
    bank?.status,
    bankCurrency(bank),
    bank?.branch,
    protectedAccount(bank?.accountNumberMasked),
  ]);
}
export function withdrawalSnapshot(form, model, bank, date = new Date()) {
  const error = withdrawalFormError(form, model, bank);
  if (error) throw Error(error);
  const available = walletBalance(model, "deposit", form.currency);
  return Object.freeze({
    amount: Number(form.amount),
    currency: form.currency,
    bankId: bank.id,
    available,
    after: balanceAfter(available, form.amount),
    requestedDate: new Intl.DateTimeFormat("pt-BR").format(date),
    bank: Object.freeze({
      name: bank.displayName || bank.bankName || "Banco não informado",
      branch: bank.branch || "—",
      account: protectedAccount(bank.accountNumberMasked),
    }),
    bankFingerprint: bankFingerprint(bank),
  });
}
export function currentWithdrawal(snapshot, form, model, bank) {
  return (
    !!snapshot &&
    snapshot.amount === Number(form.amount) &&
    snapshot.currency === form.currency &&
    snapshot.bankId === bank?.id &&
    snapshot.available === walletBalance(model, "deposit", form.currency) &&
    snapshot.bankFingerprint === bankFingerprint(bank) &&
    !withdrawalFormError(form, model, bank)
  );
}
