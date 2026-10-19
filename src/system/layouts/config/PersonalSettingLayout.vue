<template>
  <div class="personal-setting-layout">
    <profile-resource-state :resource="profile.progress" />
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
            @click="editing = null"
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
      <div v-if="editing === section.key" class="row q-col-gutter-md q-mt-sm">
        <label-form
          v-for="field in section.editFields"
          :key="field.key"
          :class-name="fieldClass(section.key, field.key)"
          :text-label="field.title"
        >
          <q-select
            v-if="selectFields.has(field.key)"
            :model-value="draft[field.key] || null"
            :options="draft[field.key] ? [draft[field.key]] : []"
            outlined
            dense
            dark
            disable
          >
            <q-tooltip
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
} from "src/services/clientProfileService";
import { getApiErrorMessage } from "src/services/clientAuthService";
import {
  captureClientSession,
  isClientSessionCurrent,
  assertClientSessionCurrent,
} from "src/services/clientApi";
import {
  basicProfilePatch,
  locationProfilePatch,
} from "src/services/profileEdit";
const profile = useClientProfile({ full: true });
const selectFields = new Set([
  "gender",
  "maritalStatus",
  "nationality",
  "occupation",
]);
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
  fullProfile = null;
const changed = computed(() => JSON.stringify(draft) !== original);
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
      { ...f("neighborhood", "Bairro"), readonly: true },
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
  (section.key !== "trusted" || profile.trusted.state.value?.length === 1) &&
  (section.key !== "job" ||
    Boolean(
      profile.professional.state.value?.id && profile.financial.state.value?.id,
    ));
const editHint = (section) =>
  !profile.approved.value
    ? "A edição depende da validação do documento de identificação."
    : section.key === "document"
      ? "Os dados documentais são consultados na API. Atualizações ficam na aba Documentação."
      : section.key === "trusted" && profile.trusted.state.value?.length !== 1
        ? "A edição de múltiplos contatos e o cadastro sem vínculo definido aguardam o contrato do fluxo."
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
      const s = profile.summary.state.value,
        p = fullProfile.personalDetails || {};
      values =
        section.key === "basic"
          ? {
              name: s.displayName || "",
              gender: p.gender || "",
              maritalStatus: p.maritalStatus || "",
              nationality: p.nationality || "",
              birthPlace: [p.birthCity, p.birthState]
                .filter(Boolean)
                .join(", "),
              birthDate: fullProfile.birthDate || "",
              email: s.primaryEmail || "",
              phone: s.mobilePhone || "",
              motherName: p.motherName || "",
              fatherName: p.fatherName || "",
            }
          : {
              ...(fullProfile.addresses || []).find(
                (a) => a.kind === "Residential" && a.isPrimary,
              ),
              neighborhood: "",
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
    else
      values = {
        name: profile.trusted.state.value[0].name,
        phoneNumber: profile.trusted.state.value[0].phoneNumber,
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
      const p = profile.professional.state.value,
        fin = profile.financial.state.value;
      if (!draft.occupation?.trim())
        throw new Error("Informe a atividade trabalhista.");
      const amounts = Object.fromEntries(
        [
          "individualMonthlyIncome",
          "householdMonthlyIncome",
          "declaredNetWorth",
        ].map((key) => {
          if (
            draft[key] === null ||
            draft[key] === "" ||
            !Number.isFinite(Number(draft[key])) ||
            Number(draft[key]) < 0
          )
            throw new Error("Informe valores financeiros válidos.");
          return [key, Number(draft[key])];
        }),
      );
      await updateClientProfessionalProfile({
        occupation: draft.occupation.trim(),
        employerName: p.employerName,
        validFrom: p.validFrom,
        validTo: p.validTo,
        isCurrent: p.isCurrent,
      });
      assertClientSessionCurrent(session);
      await profile.professional.load();
      assertClientSessionCurrent(session);
      await updateClientFinancialProfile({
        ...amounts,
        currencyCode: fin.currencyCode,
        effectiveFrom: fin.effectiveFrom,
        effectiveTo: fin.effectiveTo,
      });
    }
    if (section.key === "trusted") {
      const contact = profile.trusted.state.value[0];
      if (!draft.name?.trim() || !draft.phoneNumber?.trim())
        throw new Error("Informe o nome e o telefone do contato.");
      await updateClientTrustedContact(contact.id, {
        name: draft.name.trim(),
        phoneNumber: draft.phoneNumber.trim(),
        relationship: contact.relationship,
        email: contact.email,
      });
    }
    if (!isClientSessionCurrent(session)) return;
    editing.value = null;
    await Promise.all(section.resources.map((resource) => resource.load()));
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
