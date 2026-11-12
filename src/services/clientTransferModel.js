export const transferWallets = [
  { label: "Carteira de Depósito", value: "Free" },
  { label: "Carteira Strategy", value: "Applied" },
];
export const normalizeStrategyId = (value) =>
  String(value || "")
    .trim()
    .replace(/^#/, "")
    .toUpperCase();
export const recipientMatches = (recipient, id) =>
  Boolean(
    recipient?.displayName &&
      normalizeStrategyId(recipient.strategyId) === normalizeStrategyId(id),
  );
export function transferAvailable(wallets, currencyId, sourceWallet) {
  const rows = (wallets || []).filter(
    (w) => w.currencyId === currencyId && w.type === sourceWallet,
  );
  if (!rows.length) return 0;
  if (
    rows.some(
      (w) => w.available == null || !Number.isFinite(Number(w.available)),
    )
  )
    return null;
  return (
    rows.reduce((sum, w) => sum + Math.round(Number(w.available) * 100), 0) /
    100
  );
}
export const clientTransferDeadline = (from, to) =>
  from === "Applied" && to === "Free" ? "Até 30 dias" : "Imediato";
export function clientTransferPayload(form, recipient, wallets) {
  if (!recipientMatches(recipient, form.recipientStrategyId))
    throw new Error("Aguarde a consulta e confira o nome do destinatário.");
  if (
    !transferWallets.some((w) => w.value === form.sourceWallet) ||
    !transferWallets.some((w) => w.value === form.destinationWallet)
  )
    throw new Error("Selecione as carteiras de origem e destino.");
  if (!(wallets || []).some((w) => w.currencyId === form.currencyId))
    throw new Error("Selecione uma moeda disponível.");
  const amount = Number(form.amount),
    available = transferAvailable(wallets, form.currencyId, form.sourceWallet);
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001
  )
    throw new Error("Informe um valor positivo com até duas casas decimais.");
  if (available === null)
    throw new Error("Aguarde a confirmação do saldo disponível.");
  if (amount > available) throw new Error("O valor excede o saldo disponível.");
  if (!form.withdrawalPassword) throw new Error("Informe sua Senha de Saque.");
  return {
    recipientStrategyId: recipient.strategyId,
    currencyId: form.currencyId,
    sourceWallet: form.sourceWallet,
    destinationWallet: form.destinationWallet,
    amount,
    withdrawalPassword: form.withdrawalPassword,
  };
}
export function clientTransferError(error) {
  const codes = (error?.response?.data?.errors || [])
    .map((e) => e.code)
    .filter((code) => typeof code === "string");
  const messages = {
    "transaction.withdrawal_password_required": "Informe sua Senha de Saque.",
    "transaction.withdrawal_password_not_set":
      "A confirmação da senha ainda não está disponível para esta conta. Entre em contato com o atendimento.",
    "transaction.withdrawal_password_invalid":
      "Senha de Saque incorreta. Confira e tente novamente.",
  };
  for (const code of codes) {
    const match = Object.keys(messages).find(
      (key) => key === code || key.split(".").at(-1) === code.split(".").at(-1),
    );
    if (match) return messages[match];
  }
  if (!error?.response && error?.message && !error?.config)
    return error.message;
  return "Não foi possível concluir a transferência. Confira os dados e tente novamente.";
}

export function recipientLookupError(error) {
  const codes = (error?.response?.data?.errors || []).map((e) => e.code);
  if (codes.includes("transaction.same_client"))
    return "Informe o ID Strategy de outro cliente.";
  if (
    codes.includes("transaction.recipient_not_found") ||
    error?.response?.status === 404
  )
    return "Destinatário não encontrado. Confira o ID Strategy.";
  return "Não foi possível consultar o destinatário. Confira o ID e tente novamente.";
}

// One intent owns one key, including concurrent double clicks and ambiguous network retries.
// No password is used as a cache key or persisted to browser storage.
export function createTransferIntent(send, uuid = () => crypto.randomUUID()) {
  let key = null,
    signature = null,
    pending = null;
  return {
    async submit(payload) {
      if (pending) return pending;
      const { withdrawalPassword: _secret, ...publicFields } = payload;
      const nextSignature = JSON.stringify(publicFields);
      if (!key || signature !== nextSignature) {
        key = uuid();
        signature = nextSignature;
      }
      pending = Promise.resolve().then(() => send(payload, key));
      try {
        const result = await pending;
        key = null;
        signature = null;
        return result;
      } catch (error) {
        const status = error?.response?.status;
        if (status && status < 500 && status !== 408 && status !== 429) {
          key = null;
          signature = null;
        }
        throw error;
      } finally {
        pending = null;
      }
    },
  };
}
