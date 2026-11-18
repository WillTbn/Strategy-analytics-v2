export const paymentNumber = (value) =>
  (typeof value === "number" || (typeof value === "string" && value.trim())) &&
  Number.isFinite(Number(value))
    ? Number(value)
    : null;
export function validLoanPaymentQuote(quote) {
  if (
    !quote ||
    typeof quote.currency !== "string" ||
    typeof quote.paymentDate !== "string" ||
    !/^[A-Z]{3}$/.test(quote.currency || "") ||
    !/^\d{4}-\d{2}-\d{2}$/.test(quote.paymentDate || "")
  )
    return false;
  const date = new Date(quote.paymentDate + "T12:00:00Z");
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== quote.paymentDate
  )
    return false;
  const values = [
    quote.grossAmount,
    quote.discountAmount,
    quote.totalAmount,
  ].map(paymentNumber);
  return (
    values.every((v) => v !== null && v >= 0) &&
    values[1] <= values[0] &&
    Math.abs(values[0] - values[1] - values[2]) < 0.005
  );
}
export function installmentSelection(rows, selected) {
  if (!Array.isArray(rows) || !Array.isArray(selected) || !selected.length)
    throw Error("Selecione parcelas disponíveis.");
  const numbers = new Set();
  return selected.map((item) => {
    const found = rows.find(
      (row) => row === item || row.numero === item.numero,
    );
    if (
      !found ||
      /^Pago\b/i.test(found.status || "") ||
      !Number.isInteger(paymentNumber(found.numero)) ||
      Number(found.numero) <= 0 ||
      numbers.has(Number(found.numero))
    )
      throw Error("Confira as parcelas selecionadas.");
    numbers.add(Number(found.numero));
    return found;
  });
}
export function loanPaymentSession(loan, rows, result) {
  if (
    !loan?.id ||
    !validLoanPaymentQuote(result?.quote) ||
    result.quote.currency !== loan.currencyIsoCode ||
    typeof result.pixCode !== "string" ||
    !result.pixCode.trim() ||
    typeof result.pixKey !== "string" ||
    !result.pixKey.trim()
  )
    throw Error("As informações de pagamento ainda não estão disponíveis.");
  const numbers = installmentSelection(rows, rows).map((row) => row.numero);
  return Object.freeze({
    loanId: loan.id,
    installments: Object.freeze(numbers),
    quote: Object.freeze({ ...result.quote }),
    pixCode: result.pixCode,
    pixKey: result.pixKey,
  });
}

export function validLoanPaymentSession(session) {
  return (
    typeof session?.loanId === "string" &&
    !!session.loanId.trim() &&
    validLoanPaymentQuote(session.quote) &&
    typeof session.pixCode === "string" &&
    !!session.pixCode.trim() &&
    typeof session.pixKey === "string" &&
    !!session.pixKey.trim() &&
    Array.isArray(session.installments) &&
    session.installments.length > 0 &&
    session.installments.every(
      (n) => Number.isInteger(paymentNumber(n)) && Number(n) > 0,
    ) &&
    new Set(session.installments.map(Number)).size ===
      session.installments.length
  );
}
