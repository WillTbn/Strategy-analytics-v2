import { computed, onScopeDispose, reactive } from "vue";
import {
  getClientProfileSummary,
  getClientProfessionalProfile,
  getClientFinancialProfile,
  getClientTrustedContacts,
  getClientDocumentProgress,
  getPreferenceCatalog,
} from "src/services/clientProfileService";
import { getApiErrorMessage } from "src/services/clientAuthService";
import {
  captureClientSession,
  isClientSessionCurrent,
} from "src/services/clientApi";
import {
  identityApproved,
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
  const catalog = resource(getPreferenceCatalog, "as opções do perfil");
  const summary = resource(getClientProfileSummary, "os dados pessoais");
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
  const approved = computed(() =>
    identityApproved(summary.state.value || {}, progress?.state.value || {}),
  );
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
