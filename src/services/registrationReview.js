import {
  documentVariants,
  validateRegistrationDocuments,
} from "./registrationDocuments.js";
import {
  parseRegistrationAmount,
  validateRegistrationEmployment,
} from "./registrationEmployment.js";
import { validateRegistrationPersonal } from "./registrationPersonal.js";
import { validateRegistrationTrustedContacts } from "./registrationTrustedContacts.js";
const text = (value) => (typeof value === "string" ? value.trim() : "");
const join = (values) => values.filter(Boolean).join(" · ");
const choice = (value, options = []) =>
  value == null || value === ""
    ? ""
    : options.find((option) => option.value === value)?.label ||
      "Descrição indisponível";
export function maskRegistrationIdentifier(value) {
  const raw = text(value).replace(/\s/g, "");
  if (!raw) return "";
  return raw.length > 4 ? `••••${raw.slice(-4)}` : "••••";
}
export function reviewMoney(value) {
  const result = parseRegistrationAmount(value);
  if (result.kind === "empty") return "";
  if (result.kind !== "valid") return "Valor a revisar";
  const [units, cents] = result.decimal.split(".");
  return `R$ ${units.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${cents}`;
}
export function registrationReviewSections(snapshot) {
  const {
    personal = {},
    document = null,
    employment = {},
    contacts = { contacts: [] },
    variant = null,
    catalog = {},
  } = snapshot;
  const config = Object.hasOwn(documentVariants, variant)
    ? documentVariants[variant]
    : null;
  const values = document?.values || {},
    details = document?.details?.[document?.type] || {};
  const personalText = join([
    text(personal.birthDate),
    choice(personal.gender, catalog.genders),
    choice(personal.maritalStatus, catalog.maritalStatuses),
    ...(personal.nationalities || []).map((value) =>
      choice(value, catalog.nationalities),
    ),
    join([
      text(personal.birthCity),
      choice(personal.birthCountry, catalog.countries),
    ]),
  ]);
  const addressText = join([
    text(values.street),
    text(values.number),
    text(values.complement),
    text(values.district),
    text(values.city),
    choice(values.region, catalog.regions),
    text(values.postalCode),
  ]);
  const files = document?.files || {};
  const fileText =
    document?.type === "Passaporte"
      ? files[`${document.type}:passport`]
        ? document.savedDocuments?.[document.type]?.files?.[`${document.type}:passport`] === files[`${document.type}:passport`]
          ? "Página de dados enviada"
          : "Página de dados aguardando envio"
        : ""
      : join([
          files[`${document?.type}:front`]
            ? document.savedDocuments?.[document.type]?.files?.[`${document.type}:front`] === files[`${document.type}:front`]
              ? "Frente enviada"
              : "Frente aguardando envio"
            : "",
          files[`${document?.type}:back`]
            ? document.savedDocuments?.[document.type]?.files?.[`${document.type}:back`] === files[`${document.type}:back`]
              ? "Verso enviado"
              : "Verso aguardando envio"
            : "",
        ]);
  const documentText = join([
    maskRegistrationIdentifier(values.taxNumber),
    maskRegistrationIdentifier(values.identityNumber),
    maskRegistrationIdentifier(details.taxNumber),
    details.documentNumber
      ? `${document?.type}: ${maskRegistrationIdentifier(details.documentNumber)}`
      : "",
    fileText,
    ...(!fileText
      ? (snapshot.documentSummary || []).map((d) =>
          join([
            d.documentCode,
            d.numberMasked ? maskRegistrationIdentifier(d.numberMasked) : "",
            d.status,
          ]),
        )
      : []),
  ]);
  const employmentText = join([
    text(employment.occupation),
    text(employment.employerName),
    ...[
      ["individualMonthlyIncome", "renda"],
      ["householdMonthlyIncome", "família"],
      ["declaredNetWorth", "bens"],
    ].map(([key, label]) => {
      const value = reviewMoney(employment[key]);
      return value ? `${label} ${value}` : "";
    }),
    employment.primaryCurrencyCode
      ? `moeda principal ${choice(employment.primaryCurrencyCode, catalog.currencies)}`
      : "",
    employment.secondaryCurrencyCode
      ? `moeda secundária ${choice(employment.secondaryCurrencyCode, catalog.currencies)}`
      : "",
  ]);
  const contactsText =
    contacts.noContact === true
      ? "Não possuo contato de confiança"
      : join(
          (contacts.contacts || [])
            .filter(
              (contact) => text(contact.name) || text(contact.phoneNumber),
            )
            .map((contact) =>
              join([
                text(contact.name),
                maskRegistrationIdentifier(contact.phoneNumber),
              ]),
            ),
        );
  const documentPath = config
    ? `/cadastro/etapa-5/${variant}`
    : "/cadastro/etapa-5";
  return [
    ["personal", "Dados pessoais", personalText, "/cadastro/etapa-3"],
    ["address", "Endereço", addressText, documentPath],
    ["document", "Documento", documentText, documentPath],
    [
      "employment",
      "Atividade trabalhista",
      employmentText,
      "/cadastro/etapa-4",
    ],
    ["contacts", "Contatos de confiança", contactsText, "/cadastro/etapa-6"],
  ].map(([key, title, value, path]) => {
    const unavailable =
      (key === "employment" &&
        (snapshot.readErrors?.professional ||
          snapshot.readErrors?.financial)) ||
      (key === "contacts" && snapshot.readErrors?.contacts);
    return {
      key,
      title,
      text: unavailable
        ? join([
            value,
            "Consulta indisponível; recarregue para tentar novamente",
          ])
        : value || "Não informado",
      path,
      missing: unavailable || !value,
    };
  });
}
export function registrationReviewIssues(snapshot) {
  const issues = registrationReviewSections(snapshot)
    .filter((section) => section.missing)
    .map((section) => section.title);
  if (
    Object.keys(
      validateRegistrationPersonal(
        snapshot.personal || {},
        snapshot.catalog || {},
      ),
    ).length
  )
    issues.push("Dados pessoais");
  if (
    snapshot.document &&
    snapshot.variant &&
    Object.keys(
      validateRegistrationDocuments(snapshot.variant, snapshot.document),
    ).length
  )
    issues.push("Documento");
  if (
    Object.keys(
      validateRegistrationEmployment(
        snapshot.employment || {},
        snapshot.catalog?.currencies || [],
      ),
    ).length
  )
    issues.push("Atividade trabalhista");
  if (
    Object.keys(
      validateRegistrationTrustedContacts(
        snapshot.contacts || { noContact: false, contacts: [] },
      ),
    ).length
  )
    issues.push("Contatos de confiança");
  if (snapshot.document) {
    const type = snapshot.document.type,
      files = snapshot.document.files || {};
    const selected =
      type === "Passaporte"
        ? !!files[`${type}:passport`]
        : !!files[`${type}:front`] && !!files[`${type}:back`];
    if (!selected) issues.push("Documento");
  }
  return [...new Set(issues)];
}
