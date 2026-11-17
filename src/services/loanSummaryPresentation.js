import { profileMoney } from "./profilePresentation.js";
export function installmentProgress(paid, total) {
  if (paid == null || total == null || paid === "" || total === "") return null;
  const count = Number(paid),
    size = Number(total);
  if (
    !Number.isInteger(count) ||
    !Number.isInteger(size) ||
    count < 0 ||
    size <= 0 ||
    count > size
  )
    return null;
  return Math.round((count / size) * 100);
}
export const loanKindPresentation = (kind) =>
  ({
    secured_automovel: { label: "Com Garantia de Automóvel", icon: "car.svg" },
    secured_imovel: { label: "Com Garantia de Imóvel", icon: "property.svg" },
    consorcio: { label: "Consórcio", icon: "consortium.svg" },
    colateral: { label: "Colateral", icon: "collateral.svg" },
  })[kind] || null;

export function loanSummaryTitle(loan) {
  const value = loan?.principalAmount;
  return value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value)) &&
    /^[A-Z]{3}$/.test(loan?.currencyIsoCode || "")
    ? `Empréstimo de ${profileMoney(value, loan.currencyIsoCode)}`
    : loan?.publicCode || "Empréstimo";
}

export function loanInterestText(value) {
  if (value == null || value === "" || !Number.isFinite(Number(value)))
    return "";
  return (
    new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 8 }).format(
      Number(value),
    ) + "%"
  );
}

export const loanProcessLabel = (status) =>
  ({
    Draft: "Rascunho",
    UnderReview: "Em análise",
    Requested: "Solicitado",
    Pending: "Pendente",
    Approved: "Aprovado",
    Active: "Ativo",
    PaidOff: "Quitado",
    Cancelled: "Cancelado",
  })[status] || "Situação não informada";
