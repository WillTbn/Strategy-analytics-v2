import { validRegistrationCpf } from "./registrationDocuments.js";

export const securedReasons = [
  { value: "debts", label: "Pagar Dívidas", icon: "receipt" },
  { value: "renovation", label: "Reformar a Casa", icon: "home" },
  { value: "investment", label: "Investir", icon: "chart" },
  { value: "vehicle", label: "Financiar Veículo", icon: "suv", autoOnly: true },
  { value: "goods", label: "Adquirir Bens", icon: "shopping" },
  { value: "refinance", label: "Refinanciar Dívidas", icon: "refund" },
  {
    value: "simulation",
    label: "Só estou Simulando",
    icon: "dots",
    autoOnly: true,
  },
  { value: "other", label: "Outros", icon: "dots" },
];
export const propertyTypes = [
  "Casa residencial",
  "Apartamento residencial",
  "Comercial",
  "Terreno",
];
export const ownerOptions = [
  "Meu Nome",
  "Cônjuge",
  "Pai/Mãe",
  "Filho(a)",
  "Outro",
];
export const timeOptions = [
  "Em até 7 dias",
  "Em até 30 dias",
  "Em até 60 dias",
  "Em até 90 dias",
];
export const loanServiceUnavailable =
  "A simulação e o envio desta solicitação ainda não estão disponíveis.";
export function newSecuredDraft() {
  return {
    consortiumMode: "credit",
    creditAmount: null,
    installmentAmount: null,
    amount: null,
    reason: "",
    neededBy: "",
    spouse: null,
    spouseCpf: "",
    spouseRg: "",
    propertyType: "",
    propertyValue: null,
    postalCode: "",
    unknownPostalCode: false,
    number: "",
    noNumber: false,
    complement: "",
    area: "",
    owners: [],
    paying: null,
    outstanding: null,
    registration: "",
    occupancy: "",
    contracting: "",
    vehicleOwner: "",
    plate: "",
    model: "",
  };
}
export function clearInapplicableLoanFields(draft) {
  if (draft.spouse !== true) {
    draft.spouseCpf = "";
    draft.spouseRg = "";
  }
  if (draft.noNumber) draft.number = "";
  if (draft.unknownPostalCode) draft.postalCode = "";
  if (draft.paying !== true) draft.outstanding = null;
}
export const validLoanAmount = (value, min = 50000, max = 3000000) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;
export const securedDisplayStep = (index) => [1, 2, 3, 3, 4, 4][index] || 1;
export function securedStepError(draft, index, type) {
  if (index === 0 && !validLoanAmount(draft.amount))
    return "Informe um valor entre R$ 50 mil e R$ 3 milhões.";
  if (
    index === 1 &&
    !securedReasons.some(
      (r) => r.value === draft.reason && (type === "automovel" || !r.autoOnly),
    )
  )
    return "Selecione o motivo do empréstimo.";
  if (index === 2 && !timeOptions.includes(draft.neededBy))
    return "Selecione em quanto tempo você precisa.";
  if (index === 3 && type === "imovel") {
    if (typeof draft.spouse !== "boolean")
      return "Informe se deseja envolver o cônjuge.";
    if (
      draft.spouse &&
      (!validRegistrationCpf(draft.spouseCpf) || !draft.spouseRg.trim())
    )
      return "Informe CPF válido e RG do cônjuge.";
  }
  if (index === 4 && type === "imovel") {
    if (
      !propertyTypes.includes(draft.propertyType) ||
      !validLoanAmount(draft.propertyValue, 0.01, Number.MAX_SAFE_INTEGER / 100)
    )
      return "Informe o tipo e o valor estimado do imóvel.";
    if (
      !draft.unknownPostalCode &&
      !/^\d{8}$/.test(draft.postalCode.replace(/\D/g, ""))
    )
      return "Informe um CEP com 8 dígitos.";
    if (!draft.noNumber && !draft.number.trim())
      return "Informe o número do imóvel ou marque Imóvel sem Número.";
    if (!Number.isFinite(Number(draft.area)) || Number(draft.area) <= 0)
      return "Informe uma metragem maior que zero.";
  }
  if (index === 5 && type === "imovel") {
    if (
      !draft.owners.length ||
      draft.owners.some((o) => !ownerOptions.includes(o))
    )
      return "Informe em nome de quem está o imóvel.";
    if (typeof draft.paying !== "boolean")
      return "Informe se o imóvel ainda está sendo pago.";
    if (
      !["yes", "no", "unknown"].includes(draft.registration) ||
      !["yes", "no", "unknown"].includes(draft.occupancy) ||
      !["self", "company"].includes(draft.contracting)
    )
      return "Preencha as informações do imóvel.";
  }
  if (index === 4 && type === "automovel") {
    if (
      !ownerOptions.includes(draft.vehicleOwner) ||
      !/^[A-Z]{3}\d[A-Z\d]\d{2}$/i.test(draft.plate.replace(/[-\s]/g, ""))
    )
      return "Informe o proprietário e uma placa válida.";
    return "A consulta de modelos e valores FIPE ainda não está disponível.";
  }
  if (
    (index === 5 || (index === 4 && type === "automovel")) &&
    draft.paying === true &&
    !validLoanAmount(draft.outstanding, 0.01, Number.MAX_SAFE_INTEGER / 100)
  )
    return "Informe quanto falta para pagar.";
  return "";
}

// Model cards receive a neutral catalogue view-model; no local FIPE table or invented price.
export function availableVehicleModels(value) {
  if (
    !Array.isArray(value) ||
    value.some(
      (item) =>
        !item ||
        typeof item.id !== "string" ||
        !item.id.trim() ||
        typeof item.label !== "string" ||
        !item.label.trim(),
    ) ||
    new Set(value.map((item) => item.id)).size !== value.length
  )
    return [];
  return value;
}
