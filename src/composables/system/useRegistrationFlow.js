import {
  hydrateRegistrationDocuments,
  canReuseRegistrationDocument,
  assertRegistrationDocumentNumber,
  rememberRegistrationDocument,
} from "src/services/registrationDocumentResume";
import { reactive, ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  getClientProfile,
  getPreferenceCatalog,
  getClientProfessionalProfile,
  getClientFinancialProfile,
  getClientTrustedContacts,
  listClientDocumentTypes,
  getClientDocumentDataDefinition,
} from "src/services/clientProfileService";
import { getOnboardingStatus } from "src/services/clientAccountService";
import {
  captureClientSession,
  isClientSessionCurrent,
  assertClientSessionCurrent,
} from "src/services/clientApi";
import {
  registrationWrite,
  registrationUpload,
  resetRegistrationUploads,
} from "src/services/registrationTransport";
import {
  personalRegistrationPatch,
  addressRegistrationPatch,
  registrationAddressValues,
  professionalRegistrationPayload,
  registrationPreferencesPayload,
  financialRegistrationPayload,
  contactRegistrationPayload,
  registrationCatalog,
  documentRegistrationPayload,
  displayRegistrationDate,
  displayRegistrationAmount,
} from "src/services/registrationIntegration";
import { personalPreviewDraft } from "src/system/pages/registration/registrationPersonalPreviewState";
import {
  documentDrafts,
  activeDocumentVariant,
} from "src/system/pages/registration/registrationDocumentState";
import { employmentDraft } from "src/system/pages/registration/registrationEmploymentState";
import { trustedContactsDraft } from "src/system/pages/registration/registrationTrustedContactsState";
import { newRegistrationPersonal } from "src/services/registrationPersonal";
import { newRegistrationEmployment } from "src/services/registrationEmployment";
import { newRegistrationTrustedContacts } from "src/services/registrationTrustedContacts";
import { newRegistrationDocuments } from "src/services/registrationDocuments";
export const registrationContext = reactive({
  email: "",
  residence: "",
  accountEmail: "",
  catalog: {},
  profile: null,
  status: null,
  notices: {},
  readErrors: {},
});
export const registrationCredentials = { password: "" };
let owner = null;
let ownerSession = null;
const hydrated = new Set();
const optionsFor = (value) => (value ? [{ value, label: value }] : []);
const optionalProfile = async (read) => {
  try {
    return await read();
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};
const message = (error) => {
  const status = error?.response?.status;
  if (status === 401) return "Entre na sua conta para continuar o cadastro.";
  if (status === 403)
    return "A API ainda não liberou esta operação para sua conta. Os dados digitados foram mantidos.";
  if (status === 409)
    return "Os dados ou requisitos mudaram. Confira a etapa e tente novamente.";
  if (status === 429)
    return "Muitas tentativas. Aguarde antes de tentar novamente.";
  if (status)
    return "Não foi possível salvar esta parte do cadastro. Os dados digitados foram mantidos; tente Continuar novamente.";
  return (
    error?.message || "Não foi possível carregar o cadastro. Tente novamente."
  );
};
export function useRegistrationFlow(step) {
  const router = useRouter(),
    route = useRoute(),
    busy = ref(false),
    ready = ref(false),
    revision = ref(0),
    catalog = ref({}),
    documentCatalog = ref({});
  let active = true;
  const completedProfessionalWrites = new Map();
  onBeforeUnmount(() => {
    active = false;
  });
  const notify = (text) => {
    if (active) registrationContext.notices[step] = text;
  };
  const variantFor = (iso) =>
    ({
      BR: "br",
      US: "us-ca",
      CA: "us-ca",
      PT: "europe",
      JP: "jp",
      CN: "cn",
      AU: "au",
    })[iso] || null;
  const load = async () => {
    const session = captureClientSession();
    const profile = await getClientProfile();
    if (!profile?.customerId)
      throw new Error(
        "Seu perfil de cliente ainda não está disponível. Entre novamente ou tente mais tarde.",
      );
    assertClientSessionCurrent(session);
    if (!active) return;
    if (owner !== profile.customerId || !isClientSessionCurrent(ownerSession)) {
      owner = profile.customerId;
      ownerSession = session;
      hydrated.clear();
      resetRegistrationUploads();
      personalPreviewDraft.value = newRegistrationPersonal();
      employmentDraft.value = newRegistrationEmployment();
      trustedContactsDraft.value = newRegistrationTrustedContacts();
      for (const key of Object.keys(documentDrafts)) delete documentDrafts[key];
      activeDocumentVariant.value = null;
      registrationContext.notices = {};
      registrationContext.readErrors = {};
    }
    registrationContext.profile = profile;
    const email = profile.contacts?.find(
      (c) => c.kind === "Email" && c.isPrimary,
    )?.value;
    if (email) registrationContext.email = email;
    const requests = [getPreferenceCatalog(), getOnboardingStatus()];
    if (step === 4 || step === 5 || step === 7)
      requests.push(
        optionalProfile(getClientProfessionalProfile),
        optionalProfile(getClientFinancialProfile),
      );
    if (step === 6 || step === 7) requests.push(getClientTrustedContacts());
    const results = await Promise.allSettled(requests);
    assertClientSessionCurrent(session);
    if (!active) return;
    const base =
      results[0].status === "fulfilled" ? results[0].value || {} : {};
    registrationContext.status =
      results[1].status === "fulfilled" ? results[1].value : null;
    const professional =
      (step === 4 || step === 5 || step === 7) &&
      results[2]?.status === "fulfilled"
        ? results[2].value
        : null;
    catalog.value = registrationCatalog(base, profile, professional);
    registrationContext.catalog = catalog.value;
    if (!hydrated.has(3)) {
      personalPreviewDraft.value = newRegistrationPersonal({
        birthDate: displayRegistrationDate(profile.birthDate),
        ...profile.personalDetails,
        nationalities: profile.personalDetails?.nationalityCountryIds?.length
          ? [...profile.personalDetails.nationalityCountryIds]
          : [null],
        birthCountry: profile.personalDetails?.birthCountryId ?? null,
      });
      hydrated.add(3);
    }
    const variant =
      route.params.variant ||
      variantFor(profile.preferences?.countryIsoCode) ||
      activeDocumentVariant.value;
    if (variant) {
      activeDocumentVariant.value = variant;
      if (!documentDrafts[variant]) {
        const draft = newRegistrationDocuments(variant),
          address = profile.addresses?.find(
            (a) => a.kind === "Residential" && a.isPrimary,
          );
        if (address)
          Object.assign(
            draft.values,
            registrationAddressValues(address, variant),
          );
        draft.parents = [
          { name: profile.personalDetails?.motherName || "", absent: false },
          { name: profile.personalDetails?.fatherName || "", absent: false },
        ];
        documentDrafts[variant] = draft;
      }
      if (!hydrated.has(`documents:${variant}`)) {
        hydrateRegistrationDocuments(documentDrafts[variant], profile, variant);
        hydrated.add(`documents:${variant}`);
      }
      documentCatalog.value = {
        region: optionsFor(documentDrafts[variant].values.region),
        issuerRegion: optionsFor(
          documentDrafts[variant].details[documentDrafts[variant].type]
            ?.issuerRegion,
        ),
      };
      catalog.value.regions = documentCatalog.value.region;
    }
    if (!hydrated.has("registration-preferences")) {
      for (const key of ["primaryCurrencyCode", "secondaryCurrencyCode"])
        employmentDraft.value[key] = profile.preferences?.[key] ?? null;
      hydrated.add("registration-preferences");
    }
    const readErrors = {};
    if (step === 4 || step === 5 || step === 7) {
      const professionalResult = results[2],
        financialResult = results[3];
      // Hydrate independent reads only on success. A failed read must never
      // erase a draft or turn unavailable server data into an empty profile.
      if (professionalResult.status === "fulfilled") {
        if (!hydrated.has("professional")) {
          employmentDraft.value.occupation = professional?.occupation ?? "";
          employmentDraft.value.employerName = professional?.employerName ?? "";
          hydrated.add("professional");
        }
      } else readErrors.professional = true;
      if (financialResult.status === "fulfilled") {
        if (!hydrated.has("financial")) {
          const f = financialResult.value;
          for (const key of [
            "individualMonthlyIncome",
            "householdMonthlyIncome",
            "declaredNetWorth",
          ])
            employmentDraft.value[key] = displayRegistrationAmount(f?.[key]);
          hydrated.add("financial");
        }
      } else readErrors.financial = true;
    }
    if (step === 6 || step === 7) {
      const result = results.at(-1);
      if (result.status === "fulfilled") {
        if (!hydrated.has(6)) {
          const contacts = result.value || [];
          trustedContactsDraft.value = {
            noContact: false,
            contacts: contacts.length
              ? contacts.map((c) => ({
                  id: c.id,
                  name: c.name,
                  phoneNumber: c.phoneNumber,
                }))
              : [{ name: "", phoneNumber: "" }],
          };
          hydrated.add(6);
        }
      } else readErrors.contacts = true;
    }
    const hadReadErrors =
      Object.keys(registrationContext.readErrors).length > 0;
    registrationContext.readErrors = readErrors;
    const failures = [
      readErrors.professional && "atividade trabalhista",
      readErrors.financial && "dados financeiros",
      readErrors.contacts && "contatos de confiança",
    ].filter(Boolean);
    if (failures.length) {
      const text = `Não foi possível consultar: ${failures.join(", ")}. Os rascunhos foram mantidos. Recarregue para tentar novamente.`;
      if (step !== 7) throw new Error(text);
      notify(text);
    } else if (hadReadErrors) notify("");
    if (
      step === 5 &&
      (!professional ||
        !results[3]?.value ||
        !profile.preferences?.primaryCurrencyCode ||
        !profile.preferences?.secondaryCurrencyCode)
    ) {
      await router.replace("/cadastro/etapa-4");
      return;
    }
    ready.value = true;
    revision.value++;
  };
  const save = async () => {
    if (busy.value) return;
    busy.value = true;
    notify("");
    try {
      if (!ready.value) await load();
      const session = captureClientSession(),
        profile = await getClientProfile();
      assertClientSessionCurrent(session);
      if (profile.customerId !== owner || !isClientSessionCurrent(ownerSession))
        throw new Error(
          "A sessão mudou. Recarregue para continuar com os dados salvos da sua conta.",
        );
      const write = async (...args) => {
        assertClientSessionCurrent(session);
        return registrationWrite(...args);
      };
      if (step === 3) {
        const iso = {
          br: "BR",
          us: "US",
          ca: "CA",
          jp: "JP",
          cn: "CN",
          au: "AU",
        }[registrationContext.residence];
        const email = profile.contacts?.find(
          (c) => c.kind === "Email" && c.isPrimary,
        )?.value;
        if (
          registrationContext.accountEmail === email &&
          iso &&
          !profile.preferences?.countryId
        ) {
          const country = catalog.value.countries?.find(
              (c) => c.isoCode === iso,
            ),
            preferences = profile.preferences;
          if (country && preferences)
            await write("patch", "/api/v1/client/profile/preferences", {
              ...Object.fromEntries(
                [
                  "primaryCurrencyCode",
                  "secondaryCurrencyCode",
                  "languageCode",
                  "timeZoneId",
                  "theme",
                ].map((k) => [k, preferences[k]]),
              ),
              countryId: country.value,
            });
        }
        await write(
          "patch",
          "/api/v1/client/profile",
          personalRegistrationPatch(profile, personalPreviewDraft.value),
        );
        if (
          personalPreviewDraft.value.birthCountry ||
          personalPreviewDraft.value.nationalities.filter(Boolean).length > 1
        )
          registrationContext.notices[7] =
            "País de nascimento e nacionalidades adicionais ainda não têm campos de gravação no contrato do perfil. Permanecem somente neste rascunho.";
      }
      if (step === 5) {
        const variant = activeDocumentVariant.value,
          draft = documentDrafts[variant];
        const iso = profile.preferences?.countryIsoCode,
          expected = variantFor(iso);
        if (expected && variant !== expected)
          throw new Error(
            "Esta variação não corresponde ao país da sua conta. Abra a etapa Documento e endereço sem a variação na URL.",
          );
        await write(
          "patch",
          "/api/v1/client/profile",
          addressRegistrationPatch(
            profile,
            draft,
            profile.preferences?.countryId,
            variant,
          ),
        );
        notify("Endereço e filiação salvos. Conferindo os documentos.");
        const types = await listClientDocumentTypes();
        const code =
          draft.type === "Passaporte"
            ? "PASSPORT"
            : variant === "br"
              ? "RG"
              : null;
        const type = types.find(
          (t) =>
            t.code === code ||
            (draft.type === "Passaporte" && t.code === "PASSAPORTE"),
        );
        const saveDocument = async (documentType, attachments = []) => {
          assertRegistrationDocumentNumber(draft);
          const definition = await getClientDocumentDataDefinition(
            documentType.id,
            profile.preferences.countryId,
          );
          const payload = documentRegistrationPayload(
            definition,
            draft,
            variant,
          );
          for (const file of attachments) {
            assertClientSessionCurrent(session);
            const upload = await registrationUpload(
              file,
              {
                documentTypeId: documentType.id,
                countryId: profile.preferences.countryId,
                issuedOn: payload.issuedOn,
                expiresOn: payload.expiresOn,
                metadata: payload.data,
              },
              profile.customerId,
            );
            if (!upload?.id)
              throw new Error(
                "O envio do arquivo não retornou identificação. Tente novamente.",
              );
            payload.evidenceDocumentIds.push(upload.id);
          }
          const existing = profile.identificationDocuments?.documents?.find(
            (d) =>
              d.documentTypeId === documentType.id &&
              d.countryIsoCode === profile.preferences.countryIsoCode,
          );
          let result;
          if (existing?.documentId) {
            const update = {
              issuedOn: payload.issuedOn,
              expiresOn: payload.expiresOn,
              data: payload.data,
              evidenceDocumentIds: payload.evidenceDocumentIds,
            };
            result = await write(
              "put",
              `/api/v1/client/profile/provided-documents/${existing.documentId}`,
              update,
            );
          } else
            result = await write(
              "post",
              "/api/v1/client/profile/provided-documents",
              payload,
            );
          if (attachments.length)
            rememberRegistrationDocument(
              draft,
              existing?.documentId || result?.id,
              documentType.id,
              attachments.length,
            );
        };
        if (variant === "br" && draft.values.taxNumber) {
          const cpf = types.find((t) => t.code === "CPF");
          if (cpf) await saveDocument(cpf);
        }
        if (!type)
          throw new Error(
            "Endereço salvo. O tipo documental desta variante ainda precisa de correspondência no catálogo da API.",
          );
        const sides =
            draft.type === "Passaporte" ? ["passport"] : ["front", "back"],
          attachments = sides.map(
            (side) => draft.files[`${draft.type}:${side}`],
          );
        const reuse = canReuseRegistrationDocument(draft, profile, variant);
        if (!reuse && attachments.some((f) => !f))
          throw new Error(
            "Endereço salvo. Selecione os arquivos do documento para concluir esta etapa.",
          );
        if (!reuse) await saveDocument(type, attachments);
        if (draft.values.district)
          registrationContext.notices[7] =
            "Endereço/documentos salvos; o bairro não possui campo separado no contrato e permanece no rascunho.";
      }
      if (step === 4) {
        const [professional, financial] = await Promise.all([
          optionalProfile(getClientProfessionalProfile),
          optionalProfile(getClientFinancialProfile),
        ]);
        const today = new Date().toISOString().slice(0, 10),
          draft = employmentDraft.value;
        const p = professionalRegistrationPayload(professional, draft, today),
          f = financialRegistrationPayload(financial, draft, today),
          preferences = registrationPreferencesPayload(
            profile,
            draft,
            catalog.value,
          );
        const savePart = async (method, path, body) => {
          const signature = JSON.stringify([
            session.version,
            profile.customerId,
            body,
          ]);
          if (completedProfessionalWrites.get(path) === signature) return;
          await write(method, path, body);
          completedProfessionalWrites.set(path, signature);
        };
        await savePart("put", "/api/v1/client/profile/professional-profile", p);
        await savePart("put", "/api/v1/client/profile/financial-profile", f);
        await savePart(
          "patch",
          "/api/v1/client/profile/preferences",
          preferences,
        );
      }

      if (step === 6) {
        const current = await getClientTrustedContacts(),
          draft = trustedContactsDraft.value;
        if (draft.noContact) {
          if (current.length)
            throw new Error(
              "Seus contatos existentes foram preservados. A API não oferece registro da declaração de ausência.",
            );
          registrationContext.notices[7] =
            "A declaração de ausência de contato ainda não possui gravação na API; permanece somente neste rascunho.";
        } else {
          const contacts = draft.contacts.filter(
            (c) => c.name?.trim() || c.phoneNumber?.trim(),
          );
          // Validate all writes first; never save the first contact and then discover a missing relationship.
          const writes = contacts.map((c) => ({
            draft: c,
            payload: contactRegistrationPayload(
              current.find((old) => old.id === c.id),
              c,
            ),
          }));
          for (const { draft: c, payload } of writes)
            await write(
              "put",
              `/api/v1/client/profile/trusted-contacts/${c.id}`,
              payload,
            );
        }
      }
      if (step === 7) {
        registrationContext.status = await getOnboardingStatus();
        throw new Error(
          "Os dados disponíveis foram consultados. O envio final para análise e o registro desta confirmação ainda não possuem operação de onboarding identificada na API. Nenhum sucesso de envio foi simulado.",
        );
      }
      assertClientSessionCurrent(session);
      if (!active) return;
      await router.push(
        route.query.review === "1"
          ? "/cadastro/etapa-7"
          : `/cadastro/etapa-${step + 1}`,
      );
    } catch (error) {
      notify(message(error));
    } finally {
      busy.value = false;
    }
  };
  onMounted(async () => {
    busy.value = true;
    try {
      await load();
    } catch (error) {
      notify(message(error));
    } finally {
      busy.value = false;
    }
  });
  return { busy, ready, revision, catalog, documentCatalog, save };
}
