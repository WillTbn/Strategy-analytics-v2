import { financeGet } from "./financeService";
export function clientWithdrawalPayload(form, wallets) {
  const row = (wallets || []).find(
    (row) => row.type === "Free" && row.currencyIsoCode === form.currency,
  );
  const amount = Number(form.amount);
  if (
    !row?.currencyId ||
    row.available == null ||
    !Number.isFinite(Number(row.available))
  )
    throw Error("Aguarde a confirmação do saldo e da moeda.");
  if (!Number.isFinite(amount) || amount <= 0 || amount > Number(row.available))
    throw Error("Confira o valor e o saldo disponível.");
  if (!form.bankId) throw Error("Selecione a conta de destino.");
  return {
    currencyId: row.currencyId,
    destinationBankAccountId: form.bankId,
    amount,
  };
}
export async function submitClientWalletOperation(form, read = financeGet) {
  if (form.mode !== "withdrawal")
    throw Error("A confirmação desta operação ainda não está disponível.");
  const wallets = (await read("client/wallets")).data;
  clientWithdrawalPayload(form, wallets);
  // The approved flow requires password confirmation. The current withdrawal DTO
  // rejects additional fields and offers no password-verification endpoint.
  // Never silently discard the password and present the withdrawal as confirmed.
  if (form.withdrawalPassword)
    throw Error(
      "A confirmação da senha para este saque ainda não está disponível. Os dados foram mantidos.",
    );
  throw Error("Confirme sua senha antes de solicitar o saque.");
}
