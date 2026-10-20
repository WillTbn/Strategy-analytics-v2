// Figma presentation keys only: never use these as backend document/country IDs.
const field = (key, label, placeholder = "", extra = {}) => ({
  key,
  label,
  placeholder,
  ...extra,
});
const select = (key, label) =>
  field(key, label, "Selecione", { kind: "select" });
const date = (key, label, format = "dd/mm/aaaa") =>
  field(key, label, format, { kind: "date", format });
const number = () =>
  field("documentNumber", "Número do documento", "Digite o número");
const expiry = (format) => date("expiryDate", "Data de validade", format);
export const documentVariants = {
  br: {
    label: "🇧🇷 Brasil",
    node: "6:25690",
    angles: [224.9324, 244.8341],
    address: [
      [
        field("postalCode", "CEP", "00000-000", {
          hint: "Preenchemos o endereço a partir do CEP",
          mask: "#####-###",
          inputmode: "numeric",
          half: true,
        }),
      ],
      [field("street", "Logradouro", "Rua, avenida...")],
      [
        field("number", "Número", "000"),
        field("complement", "Complemento", "Apartamento, bloco, sala..."),
      ],
      [field("district", "Bairro"), field("city", "Cidade")],
      [select("region", "Estado")],
    ],
    before: [[field("taxNumber", "CPF", "000.000.000-00", { half: true })]],
    choices: ["Documento de identificação", "Passaporte"],
    document: [
      [number(), field("issuer", "Órgão emissor", "ex: SSP")],
      [
        select("issuerRegion", "UF de expedição"),
        date("issuedDate", "Data de expedição"),
      ],
    ],
    parents: true,
  },
  "us-ca": {
    label: "🇺🇸 Estados Unidos",
    node: "37:27142",
    angles: [220.4586, 240.4312],
    dateFormat: "mm/dd/aaaa",
    address: [
      [field("street", "Endereço", "Número e rua")],
      [field("complement", "Apto, suíte ou unidade (opcional)")],
      [field("city", "Cidade"), select("region", "Estado")],
      [field("postalCode", "ZIP code", "00000", { half: true })],
    ],
    before: [
      [
        field("taxNumber", "Número fiscal (SSN ou ITIN)", "000-00-0000", {
          half: true,
        }),
      ],
    ],
    choices: ["Carteira de motorista", "State ID", "Passaporte"],
    document: [
      [number(), select("issuerRegion", "Estado emissor")],
      [expiry("mm/dd/aaaa")],
    ],
  },
  "south-america": {
    label: "🇦🇷 Argentina",
    node: "37:27262",
    angles: [218.8608, 238.6837],
    address: [
      [field("street", "Rua"), field("number", "Número", "000")],
      [field("complement", "Andar e apartamento (opcional)")],
      [field("city", "Cidade"), select("region", "Província")],
      [field("postalCode", "Código postal", "Ex.: C1425DKF", { half: true })],
    ],
    choices: ["DNI", "Passaporte"],
    document: [
      [
        field("documentNumber", "Número do DNI", "00.000.000"),
        field("taxNumber", "CUIL ou CUIT", "00-00000000-0"),
      ],
      [date("issuedDate", "Data de emissão"), expiry()],
    ],
  },
  jp: {
    label: "🇯🇵 Japão",
    node: "37:27382",
    angles: [220.8169, 240.8096],
    dateFormat: "aaaa/mm/dd",
    address: [
      [
        field("postalCode", "Código postal", "000-0000", {
          hint: "Preenchemos província e cidade pelo código",
          half: true,
        }),
      ],
      [select("region", "Província"), field("city", "Cidade ou distrito")],
      [field("street", "Endereço (chōme, banchi, gō)", "0-0-0")],
      [field("complement", "Prédio e apartamento (opcional)")],
    ],
    before: [
      [
        field("taxNumber", "My Number (マイナンバー)", "0000 0000 0000", {
          half: true,
        }),
      ],
    ],
    choices: [
      "Cartão My Number",
      "Carteira de motorista",
      "Cartão de residente",
      "Passaporte",
    ],
    document: [
      [number(), expiry("aaaa/mm/dd")],
      [field("localName", "Nome em katakana (フリガナ)", "ヤマダ タロウ")],
    ],
  },
  cn: {
    label: "🇨🇳 China",
    node: "37:27502",
    angles: [218.8608, 238.6837],
    dateFormat: "aaaa/mm/dd",
    address: [
      [select("region", "Província"), field("city", "Cidade")],
      [
        field("district", "Distrito"),
        field("postalCode", "Código postal", "000000"),
      ],
      [field("street", "Endereço", "Rua, número, prédio e apartamento")],
    ],
    choices: ["Carteira de identidade de residente", "Passaporte"],
    document: [
      [
        field("documentNumber", "Número do documento", "18 dígitos"),
        expiry("aaaa/mm/dd"),
      ],
      [field("taxNumber", "Número fiscal (se for diferente do documento)")],
      [field("localName", "Nome em chinês (opcional)", "张伟")],
    ],
  },
  europe: {
    label: "🇵🇹 Portugal",
    node: "37:27622",
    angles: [217.1878, 236.7415],
    address: [
      [field("street", "Morada", "Rua e número")],
      [field("complement", "Complemento (opcional)", "Andar, porta...")],
      [
        field("postalCode", "Código postal", "0000-000"),
        field("city", "Localidade"),
      ],
    ],
    before: [
      [
        field("taxNumber", "Número fiscal (NIF)", "000 000 000", {
          half: true,
        }),
      ],
    ],
    choices: ["Cartão de Cidadão", "Autorização de residência", "Passaporte"],
    document: [[number(), expiry()]],
  },
  africa: {
    label: "🇿🇦 África do Sul",
    node: "37:27742",
    angles: [215.4372, 234.5755],
    address: [
      [field("street", "Endereço", "Número e rua")],
      [field("district", "Bairro ou subúrbio"), field("city", "Cidade")],
      [
        select("region", "Província"),
        field("postalCode", "Código postal (se houver)", "0000"),
      ],
    ],
    before: [
      [
        field("identityNumber", "Número de identidade", "13 dígitos"),
        field("taxNumber", "Número fiscal", "10 dígitos"),
      ],
    ],
    choices: ["Smart ID card", "ID book", "Passaporte"],
    document: [],
  },
  au: {
    label: "🇦🇺 Austrália",
    node: "37:27862",
    angles: [218.8608, 238.6837],
    address: [
      [field("street", "Endereço", "Unidade, número e rua")],
      [field("district", "Subúrbio"), select("region", "Estado ou território")],
      [field("postalCode", "Código postal", "0000", { half: true })],
    ],
    before: [
      [
        field("taxNumber", "Número fiscal (TFN, opcional)", "000 000 000", {
          half: true,
        }),
      ],
    ],
    choices: ["Carteira de motorista", "Passaporte", "Cartão Medicare"],
    document: [
      [
        field("documentNumber", "Número da carteira", "Digite o número"),
        field("cardNumber", "Número do cartão", "Digite o número"),
      ],
      [select("issuerRegion", "Estado emissor"), expiry()],
    ],
  },
};
export function documentRows(variant, type) {
  const config = Object.hasOwn(documentVariants, variant)
    ? documentVariants[variant]
    : null;
  if (!config || !config.choices.includes(type)) return [];
  if (type !== "Passaporte") return config.document;
  const format = config.dateFormat || "dd/mm/aaaa";
  return [
    [number(), select("issuerCountry", "País emissor")],
    [date("issuedDate", "Data de expedição", format), expiry(format)],
  ];
}
export function documentFields(variant, type) {
  const config = Object.hasOwn(documentVariants, variant)
    ? documentVariants[variant]
    : null;
  return config
    ? [
        ...config.address,
        ...(config.before || []),
        ...documentRows(variant, type),
      ].flat()
    : [];
}
export function newRegistrationDocuments(variant) {
  return {
    type:
      (Object.hasOwn(documentVariants, variant)
        ? documentVariants[variant].choices[0]
        : "") || "",
    values: {},
    details: {
      [(Object.hasOwn(documentVariants, variant)
        ? documentVariants[variant].choices[0]
        : "") || ""]: {},
    },
    parents: [
      { name: "", absent: false },
      { name: "", absent: false },
    ],
    files: {},
  };
}
export function calendarDate(value, format = "dd/mm/aaaa") {
  const parts = /^(\d{2}|\d{4})\/(\d{2})\/(\d{2}|\d{4})$/.exec(value);
  if (!parts) return null;
  const [first, middle, last] = parts.slice(1).map(Number);
  const [year, month, day] =
    format === "aaaa/mm/dd"
      ? [first, middle, last]
      : format === "mm/dd/aaaa"
        ? [last, first, middle]
        : [last, middle, first];
  if (
    !new RegExp(
      format === "aaaa/mm/dd"
        ? "^\\d{4}/\\d{2}/\\d{2}$"
        : "^\\d{2}/\\d{2}/\\d{4}$",
    ).test(value) ||
    year < 1
  )
    return null;
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}
export function validateRegistrationDocuments(
  variant,
  draft,
  today = new Date(),
) {
  const errors = {};
  if (
    !Object.hasOwn(documentVariants, variant) ||
    !documentVariants[variant].choices.includes(draft.type)
  )
    return { type: "Selecione um tipo de documento disponível." };
  const fields = documentFields(variant, draft.type),
    dates = {};
  const values = { ...draft.values, ...draft.details?.[draft.type] };
  for (const field of fields) {
    const value = String(values[field.key] || "").trim();
    if (field.kind === "date" && value) {
      dates[field.key] = calendarDate(value, field.format);
      if (!dates[field.key])
        errors[field.key] = "Informe uma data válida no formato indicado.";
    }
  }
  const issued = dates.issuedDate,
    expires = dates.expiryDate;
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);
  if (issued && issued > end)
    errors.issuedDate = "A expedição não pode estar no futuro.";
  if (issued && expires && expires < issued)
    errors.expiryDate = "A validade não pode ser anterior à expedição.";
  // Requiredness, fiscal formats/check digits and expiry policy await the onboarding contract.
  return errors;
}
export function validateDocumentSelection(files, rules = {}) {
  if (files.length !== 1)
    return "Selecione um único arquivo para este lado do documento.";
  const file = files[0];
  if (!file || !Number.isFinite(file.size) || file.size <= 0)
    return "O arquivo está vazio ou indisponível.";
  if (rules.maxBytes && file.size > rules.maxBytes)
    return "O arquivo excede o tamanho permitido.";
  if (rules.mimeTypes?.length && !rules.mimeTypes.includes(file.type))
    return "O tipo do arquivo não é permitido.";
  return "";
}

export function copyRegistrationDocuments(draft) {
  return {
    type: draft.type,
    values: { ...draft.values },
    details: Object.fromEntries(
      Object.entries(draft.details || {}).map(([type, values]) => [
        type,
        { ...values },
      ]),
    ),
    parents: draft.parents.map((parent) => ({ ...parent })),
    files: { ...draft.files },
  };
}
