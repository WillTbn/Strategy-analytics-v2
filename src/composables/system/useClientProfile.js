import { computed, onScopeDispose, reactive } from "vue";
import {
  getClientProfileSummary,
  getClientProfessionalProfile,
  getClientFinancialProfile,
  getClientTrustedContacts,
  getClientDocumentProgress,
  getPreferenceCatalog,
  getClientPreferences,
} from "src/services/clientProfileService";
import { localizedCountryCatalog } from "src/services/countryNames";
import { getOnboardingStatus } from "src/services/clientAccountService";
import { getApiErrorMessage } from "src/services/clientAuthService";
import {
  captureClientSession,
  isClientSessionCurrent,
} from "src/services/clientApi";
import {
  identityApproved,
  profileEditingAllowed,
  profileFields,
} from "src/services/profilePresentation";

export default function useClientProfile({ full = false } = {}) {
  let active = true;
  onScopeDispose(() => {
    active = false;
  });
  const resource = (read, label) => {
    const state = reactive({ value: null, loading: false, error: "" });
    let operation = 0;
    const load = async () => {
      const session = captureClientSession(),
        version = ++operation;
      state.loading = true;
      state.error = "";
      state.value = null;
      try {
        const value = await read();
        if (active && version === operation && isClientSessionCurrent(session))
          state.value = value;
      } catch (error) {
        if (active && version === operation && isClientSessionCurrent(session))
          state.error = getApiErrorMessage(
            error,
            `Não foi possível carregar ${label}.`,
          );
      } finally {
        if (active && version === operation) state.loading = false;
      }
    };
    load();
    return { state, load };
  };
  const catalog = resource(async () => {
    const [catalog, preferences] = await Promise.all([
      getPreferenceCatalog(),
      getClientPreferences(),
    ]);
    return localizedCountryCatalog(catalog, preferences.languageCode);
  }, "as opções do perfil");
  const summary = resource(async () => {
    if (!full) return getClientProfileSummary();
    const [data, status] = await Promise.all([
      getClientProfileSummary(),
      getOnboardingStatus(),
    ]);
    return { ...data, submission: status.submission };
  }, "os dados pessoais");
  const professional = resource(
    getClientProfessionalProfile,
    "a atividade trabalhista",
  );
  const financial = resource(getClientFinancialProfile, "os dados financeiros");
  const trusted = full
    ? resource(getClientTrustedContacts, "os contatos de confiança")
    : null;
  const progress = full
    ? resource(getClientDocumentProgress, "a situação documental")
    : null;
  const fields = computed(() =>
    profileFields(
      summary.state.value || {},
      professional.state.value || {},
      financial.state.value || {},
      trusted?.state.value || [],
      catalog.state.value || {},
    ),
  );
  const approved = computed(() => {
    if (full) return profileEditingAllowed(summary.state.value);
    return identityApproved(
      summary.state.value || {},
      progress?.state.value || {},
    );
  });
  return {
    summary,
    catalog,
    professional,
    financial,
    trusted,
    progress,
    fields,
    approved,
  };
}
