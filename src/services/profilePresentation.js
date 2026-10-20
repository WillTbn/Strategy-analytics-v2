export const NOT_INFORMED = "Não informado";
export const collection = (value) =>
  Array.isArray(value)
    ? value
    : Array.isArray(value?.items)
      ? value.items
      : Array.isArray(value?.data)
        ? value.data
        : [];
const text = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : NOT_INFORMED;
export const profileContactText = (contact) =>
  text(contact && typeof contact === "object" ? contact.valueMasked : contact);
const join = (values) =>
  values
    .filter((value) => typeof value === "string" && value.trim())
    .join(", ");
const field = (title, value) => ({ title, value: value ?? NOT_INFORMED });
export function profileDate(value) {
  const match =
    typeof value === "string" &&
    /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  if (!match) return NOT_INFORMED;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
    ? `${day}/${month}/${year}`
    : NOT_INFORMED;
}
export function profileMoney(value, currency) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value)) ||
    !/^[A-Z]{3}$/.test(currency || "")
  )
    return NOT_INFORMED;
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(Number(value));
  } catch {
    return NOT_INFORMED;
  }
}
const labels = {
  Male: "Masculino",
  Female: "Feminino",
  Other: "Outro",
  NotInformed: NOT_INFORMED,
  Single: "Solteiro(a)",
  Married: "Casado(a)",
  Divorced: "Divorciado(a)",
  Widowed: "Viúvo(a)",
  Separated: "Separado(a)",
  CivilUnion: "União estável",
};
const translated = (value) => labels[value] || text(value);
const identityCodes = new Set([
  "RG",
  "CNH",
  "PASSPORT",
  "PASSAPORTE",
  "IDENTITY_CARD",
  "NATIONAL_ID",
]);
const identity = (document) =>
  identityCodes.has(
    String(
      document.documentCode || document.documentTypeCode || "",
    ).toUpperCase(),
  );
export function identityApproved(summary = {}, progress = {}) {
  const documents = collection(summary.identificationDocuments?.documents);
  const requirements = collection(progress.sections).flatMap((section) =>
    collection(section.requirements),
  );
  return [...documents, ...requirements].some(
    (document) =>
      identity(document) &&
      (document.status || document.documentStatus) === "Approved",
  );
}
export function profileFields(
  summary = {},
  professional = {},
  financial = {},
  contacts = [],
) {
  const personal = summary.personalDetails || {};
  const address = summary.residentialAddress || {};
  const documents = collection(summary.identificationDocuments?.documents);
  // Only the server's masked identifier is rendered; never fall back to a raw number.
  const cpf = documents.find((document) => document.documentCode === "CPF");
  const identification = documents.find(identity);
  const basic = [
    field("Nome Completo", text(summary.displayName)),
    field("Gênero", translated(personal.gender)),
    field("Estado Civil", translated(personal.maritalStatus)),
    field("Nacionalidade", text(personal.nationality)),
    field(
      "Naturalidade (Cidade, UF)",
      text(join([personal.birthCity, personal.birthState])),
    ),
    field("Data de Nascimento", profileDate(summary.birthDate)),
    field("Email", profileContactText(summary.primaryEmail)),
    field("Celular", profileContactText(summary.mobilePhone)),
    field("Nome Completo da Mãe", text(personal.motherName)),
    field("Nome Completo do Pai", text(personal.fatherName)),
  ];
  const document = [
    field("CPF", text(cpf?.numberMasked)),
    field("Documento de identificação", text(identification?.numberMasked)),
    field("Órgão Emissor", text(identification?.issuer)),
    field("UF de Expedição", text(identification?.issuerState)),
    field("Data de Expedição", profileDate(identification?.issuedOn)),
  ];
  const location = [
    field("CEP", text(address.postalCode)),
    field("Estado", text(address.stateOrProvince)),
    field("Cidade", text(address.city)),
    field("Logradouro", text(address.line1)),
    // The HTTP address contract has no neighborhood field; line2 is the complement.
    field("Bairro", NOT_INFORMED),
    field("Complemento", text(address.line2)),
  ];
  const job = [
    field("Atividade Trabalhista Atual", text(professional.occupation)),
    field(
      "Renda Média Mensal",
      profileMoney(financial.individualMonthlyIncome, financial.currencyCode),
    ),
    field(
      "Renda Média Mensal da Família",
      profileMoney(financial.householdMonthlyIncome, financial.currencyCode),
    ),
    field(
      "Valor Aproximado Dos Seus Bens",
      profileMoney(financial.declaredNetWorth, financial.currencyCode),
    ),
  ];
  const trusted = collection(contacts);
  return {
    basic,
    document,
    location,
    job,
    trusted: trusted.length
      ? trusted.map((contact) => [
          field("Nome Completo do Contato", text(contact.name)),
          field("Telefone do Contato", text(contact.phoneNumber)),
        ])
      : [
          [
            field("Nome Completo do Contato", NOT_INFORMED),
            field("Telefone do Contato", NOT_INFORMED),
          ],
        ],
    summaryBasic: [
      ...basic.slice(0, 6),
      document[0],
      field(
        "RG",
        text(documents.find((d) => d.documentCode === "RG")?.numberMasked),
      ),
    ],
    summaryLocation: [
      field(
        "Localização Atual",
        text(join([address.city, address.stateOrProvince])),
      ),
      location[0],
      location[3],
    ],
    summaryJob: [
      field("Atividade Trabalhista", text(professional.occupation)),
      field("Renda Mensal Aproximada", job[1].value),
      job[3],
    ],
  };
}
