<template>
  <div class="personal-setting-layout">
    <profile-resource-state :resource="profile.progress" />
    <profile-resource-state :resource="profile.catalog" />
    <div
      v-if="saveError && !editing"
      class="text-negative q-mb-md"
      role="alert"
    >
      {{ saveError }}
    </div>
    <div
      v-if="profile.progress.state.value && !profile.approved.value"
      class="pending-notice q-mb-md"
      role="status"
    >
      <q-icon name="schedule" size="20px" />
      <span
        >Seus dados estão em análise. Você poderá editar o perfil depois que o
        documento de identificação ou o passaporte for validado.</span
      >
    </div>
    <q-card
      v-for="section in sections"
      :key="section.key"
      class="tool profile-section q-mb-lg"
    >
      <div class="row items-center q-gutter-sm">
        <span class="text-weight-bold">{{ section.title }}</span>
        <q-badge
          v-if="profile.progress.state.value && !profile.approved.value"
          color="grey-4"
          text-color="grey-9"
          >Pendente</q-badge
        >
        <template v-if="editing === section.key">
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            label="Salvar"
            :loading="saving"
            :disable="!changed"
            @click="save(section)"
          />
          <q-btn
            flat
            dense
            no-caps
            label="Descartar"
            :disable="saving"
            @click="discard"
          />
        </template>
        <span v-else>
          <q-btn
            flat
            dense
            no-caps
            icon="edit"
            label="Editar"
            size="sm"
            :disable="!editable(section)"
            @click="edit(section)"
          />
          <q-tooltip v-if="!editable(section)">{{
            editHint(section)
          }}</q-tooltip>
        </span>
      </div>
      <profile-resource-state
        v-for="(resource, index) in section.resources"
        :key="index"
        :resource="resource"
      />
      <div
        v-if="saveError && editing === section.key"
        class="text-negative q-mt-sm"
        role="alert"
      >
        {{ saveError }}
      </div>
      <div v-if="editing === 'trusted' && section.key === 'trusted'">
        <div
          v-for="(contact, index) in draft.contacts"
          :key="contact.id || index"
          class="row q-col-gutter-md q-mt-sm"
        >
          <label-form
            v-for="field in section.editFields"
            :key="field.key"
            :class-name="fieldClass(section.key, field.key)"
            :text-label="field.title"
          >
            <q-input
              v-model="contact[field.key]"
              outlined
              dense
              dark
              :type="field.key === 'phoneNumber' ? 'tel' : 'text'"
              :aria-label="
                draft.contacts.length > 1
                  ? field.title + ' ' + (index + 1)
                  : field.title
              "
              :disable="saving"
            />
          </label-form>
        </div>
      </div>
      <div
        v-else-if="editing === section.key"
        class="row q-col-gutter-md q-mt-sm"
      >
        <label-form
          v-for="field in section.editFields"
          :key="field.key"
          :class-name="fieldClass(section.key, field.key)"
          :text-label="field.title"
        >
          <q-select
            v-if="selectFields.has(field.key)"
            v-model="draft[field.key]"
            :options="fieldOptions(field.key)"
            emit-value
            map-options
            :multiple="field.key === 'nationality'"
            :max-values="field.key === 'nationality' ? 3 : undefined"
            outlined
            dense
            dark
            :disable="saving || !fieldOptions(field.key).length"
          >
            <q-tooltip v-if="!fieldOptions(field.key).length"
              >As opções deste campo ainda não foram disponibilizadas pela
              API.</q-tooltip
            >
          </q-select>
          <q-input
            v-else
            v-model="draft[field.key]"
            outlined
            dense
            dark
            :type="field.type || 'text'"
            :disable="saving || field.readonly"
            :min="field.type === 'number' ? 0 : undefined"
            :maxlength="field.key === 'neighborhood' ? 120 : undefined"
          />
        </label-form>
      </div>
      <template
        v-else-if="
          section.resources.every(
            (resource) => !resource.state.loading && !resource.state.error,
          )
        "
      >
        <profile-fields
          v-for="(fields, index) in section.groups"
          :key="index"
          :fields="fields"
          :columns="section.columns || 5"
        />
      </template>
    </q-card>
  </div>
</template>
<script setup>
import { computed, reactive, ref } from "vue";
import { saveProfileJob, profileJobChanges } from "src/services/profileJobEdit";
import useClientProfile from "src/composables/system/useClientProfile";
import ProfileFields from "src/system/components/setting/ProfileFields.vue";
import ProfileResourceState from "src/system/components/setting/ProfileResourceState.vue";
import LabelForm from "src/system/components/form/LabelForm.vue";
import {
  getClientProfile,
  updateClientProfile,
  updateClientProfessionalProfile,
  updateClientFinancialProfile,
  updateClientTrustedContact,
  createClientTrustedContact,
  getClientTrustedContacts,
} from "src/services/clientProfileService";
import { getApiErrorMessage } from "src/services/clientAuthService";
import {
  captureClientSession,
  isClientSessionCurrent,
  assertClientSessionCurrent,
} from "src/services/clientApi";
import {
  basicProfilePatch,
  basicProfileDraft,
  locationProfilePatch,
} from "src/services/profileEdit";
import {
  trustedContactsDraft,
  saveTrustedContacts,
} from "src/services/profileTrustedEdit";
const profile = useClientProfile({ full: true });
const selectFields = new Set(["gender", "maritalStatus", "nationality"]);
const fieldOptions = (key) => {
  const catalog = profile.catalog.state.value || {};
  if (key === "nationality")
    return (catalog.countries || []).map((c) => ({
      value: c.id,
      label: c.name,
    }));
  return (
    catalog[
      {
        gender: "genders",
        maritalStatus: "maritalStatuses",
      }[key]
    ] || []
  );
};
const fieldClass = (section, key) => {
  const basic = {
    name: 6,
    gender: 3,
    maritalStatus: 3,
    nationality: 4,
    birthPlace: 4,
    birthDate: 4,
    email: 6,
    phone: 6,
    motherName: 6,
    fatherName: 6,
  };
  const location = {
    postalCode: 3,
    stateOrProvince: 1,
    city: 2,
    line1: 6,
    neighborhood: 6,
    line2: 6,
  };
  const width =
    section === "basic"
      ? basic[key]
      : section === "location"
        ? location[key]
        : section === "job"
          ? 3
          : 6;
  return "col-12 col-sm-6 col-md-" + width;
};
const editing = ref(null),
  saving = ref(false),
  saveError = ref(""),
  draft = reactive({});
let original = "",
  fullProfile = null,
  jobBaseline = null,
  trustedBaseline = null;
const changed = computed(() => JSON.stringify(draft) !== original);
const discard = () => {
  if (saving.value) return;
  editing.value = null;
  saveError.value = "";
};
const f = (key, title, type) => ({ key, title, type });
const sections = computed(() => [
  {
    key: "basic",
    title: "Dados Básicos",
    resources: [profile.summary],
    groups: [profile.fields.value.basic],
    editFields: [
      f("name", "Nome Completo"),
      f("gender", "Gênero"),
      f("maritalStatus", "Estado Civil"),
      f("nationality", "Nacionalidade"),
      f("birthPlace", "Naturalidade (Cidade, UF)"),
      f("birthDate", "Data de Nascimento", "date"),
      f("email", "Email", "email"),
      f("phone", "Celular"),
      f("motherName", "Nome Completo da Mãe"),
      f("fatherName", "Nome Completo do Pai"),
    ],
  },
  {
    key: "document",
    title: "Documentos",
    resources: [profile.summary],
    groups: [profile.fields.value.document],
  },
  {
    key: "location",
    title: "Localização",
    resources: [profile.summary],
    groups: [profile.fields.value.location],
    columns: 6,
    editFields: [
      f("postalCode", "CEP"),
      f("stateOrProvince", "Estado"),
      f("city", "Cidade"),
      f("line1", "Logradouro"),
      f("neighborhood", "Bairro"),
      f("line2", "Complemento"),
    ],
  },
  {
    key: "job",
    title: "Atividade Trabalhista",
    resources: [profile.professional, profile.financial],
    groups: [profile.fields.value.job],
    columns: 5,
    editFields: [
      f("occupation", "Atividade Trabalhista Atual"),
      f("individualMonthlyIncome", "Renda Média Mensal", "number"),
      f("householdMonthlyIncome", "Renda Média Mensal da Família", "number"),
      f("declaredNetWorth", "Valor Aproximado Dos Seus Bens", "number"),
    ],
  },
  {
    key: "trusted",
    title: "Contatos de Confiança",
    resources: [profile.trusted],
    groups: profile.fields.value.trusted,
    editFields: [
      f("name", "Nome Completo do Contato"),
      f("phoneNumber", "Telefone do Contato"),
    ],
  },
]);
const editable = (section) =>
  profile.approved.value &&
  !editing.value &&
  !saving.value &&
  section.resources.every(
    (r) => r.state.value && !r.state.loading && !r.state.error,
  ) &&
  section.key !== "document" &&
  (section.key !== "job" ||
    Boolean(
      profile.professional.state.value?.id && profile.financial.state.value?.id,
    ));
const editHint = (section) =>
  !profile.approved.value
    ? "A edição depende da validação do documento de identificação."
    : section.key === "document"
      ? "Os dados documentais são consultados na API. Atualizações ficam na aba Documentação."
      : "Aguarde o carregamento ou conclua a edição atual.";
const edit = async (section) => {
  if (!editable(section)) return;
  saving.value = true;
  saveError.value = "";
  const session = captureClientSession();
  try {
    let values = {};
    if (["basic", "location"].includes(section.key)) {
      fullProfile = await getClientProfile();
      if (!isClientSessionCurrent(session)) return;
      const s = profile.summary.state.value;
      values =
        section.key === "basic"
          ? basicProfileDraft(fullProfile, s)
          : {
              ...(fullProfile.addresses || []).find(
                (a) => a.kind === "Residential" && a.isPrimary,
              ),
            };
    } else if (section.key === "job")
      values = {
        occupation: profile.professional.state.value.occupation,
        ...Object.fromEntries(
          [
            "individualMonthlyIncome",
            "householdMonthlyIncome",
            "declaredNetWorth",
          ].map((k) => [k, profile.financial.state.value[k]]),
        ),
      };
    else {
      const contacts = await getClientTrustedContacts();
      assertClientSessionCurrent(session);
      trustedBaseline = contacts.map((contact) => ({ ...contact }));
      values = { contacts: trustedContactsDraft(contacts) };
    }
    if (section.key === "job")
      jobBaseline = {
        professional: { ...profile.professional.state.value },
        financial: { ...profile.financial.state.value },
      };
    Object.keys(draft).forEach((key) => delete draft[key]);
    Object.assign(draft, values);
    original = JSON.stringify(draft);
    editing.value = section.key;
  } catch (error) {
    saveError.value = getApiErrorMessage(
      error,
      "Não foi possível abrir a edição.",
    );
  } finally {
    saving.value = false;
  }
};
const save = async (section) => {
  if (!profile.approved.value || !changed.value || saving.value) return;
  saving.value = true;
  saveError.value = "";
  const session = captureClientSession();
  try {
    if (section.key === "basic")
      await updateClientProfile(basicProfilePatch(fullProfile, draft));
    if (section.key === "location")
      await updateClientProfile(locationProfilePatch(fullProfile, draft));
    if (section.key === "job") {
      await saveProfileJob(jobBaseline, draft, {
        professional: updateClientProfessionalProfile,
        financial: updateClientFinancialProfile,
        assertSession: () => assertClientSessionCurrent(session),
      });
    }
    if (section.key === "trusted") {
      await saveTrustedContacts(trustedBaseline, draft.contacts, {
        create: createClientTrustedContact,
        update: updateClientTrustedContact,
        assertSession: () => assertClientSessionCurrent(session),
      });
    }
    if (!isClientSessionCurrent(session)) return;
    editing.value = null;
    await Promise.all(section.resources.map((resource) => resource.load()));
    if (!isClientSessionCurrent(session)) return;
    if (
      section.key === "job" &&
      section.resources.every(
        (resource) => resource.state.value && !resource.state.error,
      )
    ) {
      const pending = profileJobChanges(
        profile.professional.state.value,
        profile.financial.state.value,
        draft,
      );
      if (pending.professional || pending.financial)
        saveError.value =
          "Os dados foram enviados, mas a consulta ainda retorna valores diferentes. Confira os valores antes de editar novamente.";
    }
  } catch (error) {
    if (isClientSessionCurrent(session))
      saveError.value = getApiErrorMessage(
        error,
        error.message ||
          "Não foi possível salvar. Seus dados foram preservados para tentar novamente.",
      );
  } finally {
    saving.value = false;
  }
};
</script>
<style scoped>
.profile-section {
  padding: 24px;
}
.pending-notice {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid rgba(254, 230, 133, 0.45);
  border-radius: 8px;
  background: rgba(254, 230, 133, 0.1);
}
.pending-notice .q-icon {
  color: #fee685;
  flex-shrink: 0;
}
@media (max-width: 600px) {
  .profile-section {
    padding: 16px;
  }
}
</style>
