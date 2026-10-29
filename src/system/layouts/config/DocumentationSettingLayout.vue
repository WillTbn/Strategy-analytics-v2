<template>
  <div class="documentation-setting-layout">
    <q-banner v-if="guardBlocked" rounded class="bg-blue-9 text-white q-mb-md">
      {{ guardBlocked }}
      <template #action
        ><q-btn flat color="white" label="Verificar novamente" @click="load"
      /></template>
    </q-banner>
    <q-banner v-else-if="error" rounded class="bg-red-9 text-white q-mb-md">
      {{ error }}
      <template #action
        ><q-btn flat color="white" label="Tentar novamente" @click="load"
      /></template>
    </q-banner>

    <div v-if="loading" class="tool row justify-center q-pa-xl">
      <q-spinner color="primary" size="36px" />
    </div>
    <template v-else-if="!error && !guardBlocked">
      <q-card class="tool documentation-progress q-mb-lg">
        <div class="documentation-progress-icon">
          <img src="/system/icons/profile/progress.png" alt="" />
        </div>
        <div class="documentation-progress-copy">
          <div class="text-subtitle1 text-weight-bold">
            Acompanhe seu nível documental
          </div>
          <div class="text-caption q-mt-xs">
            {{
              progress.nextLevel?.name
                ? `Próximo nível: ${progress.nextLevel.name}`
                : "Progresso dos requisitos documentais"
            }}
          </div>
          <div class="row items-center q-gutter-sm q-mt-xs">
            <q-linear-progress
              rounded
              size="6px"
              color="primary"
              :value="progressValue / 100"
              class="col"
              aria-label="Progresso documental"
            />
            <span>{{ progressValue }}%</span>
          </div>
        </div>
        <div class="document-levels" aria-label="Níveis documentais">
          <div
            v-for="level in [1, 2, 3]"
            :key="level"
            class="document-level"
            :class="{ 'document-level--current': currentLevelNumber === level }"
          >
            <img :src="`/system/icons/profile/level-${level}.svg`" alt="" />
            <span
              >Nível {{ level }}
              <span v-if="currentLevelNumber === level" class="text-primary"
                >(atual)</span
              ></span
            >
          </div>
        </div>
      </q-card>
      <p v-if="!documentGroups.length" class="text-grey">
        Nenhum documento ou requisito disponível.
      </p>
      <q-card
        v-for="group in documentGroups"
        :key="group.key"
        class="tool q-mb-lg"
      >
        <div class="text-subtitle1 text-weight-bold q-mb-lg">
          {{ group.name }}
        </div>
        <q-markup-table flat class="document-table" wrap-cells>
          <thead>
            <tr>
              <th class="text-left">Documento requisitado</th>
              <th class="text-left">Arquivo anexado</th>
              <th class="text-left">Status</th>
              <th class="text-left">Última atualização</th>
              <th><span class="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in group.rows" :key="row.key">
              <tr
                v-for="(attachment, fileIndex) in row.documents.length
                  ? row.documents
                  : [null]"
                :key="attachment?.id || row.key"
              >
                <td
                  v-if="fileIndex === 0"
                  :rowspan="Math.max(row.documents.length, 1)"
                >
                  {{ row.name }}
                  <div
                    v-if="row.isIndividuallyRequired"
                    class="text-caption text-grey-5"
                  >
                    Obrigatório
                  </div>
                </td>
                <td>
                  <span class="document-filename">{{
                    attachment?.fileName ||
                    attachment?.originalFileName ||
                    attachment?.file?.originalFileName ||
                    attachment?.file?.fileName ||
                    (attachment
                      ? "Arquivo protegido"
                      : "Nenhum arquivo anexado")
                  }}</span>
                  <div v-if="attachment?.rejectionReason" class="text-negative">
                    {{ attachment.rejectionReason }}
                  </div>
                </td>
                <td>
                  <q-badge
                    outline
                    :color="statusColor(attachment?.status || row.status)"
                    :label="statusLabel(attachment?.status || row.status)"
                  />
                </td>
                <td>
                  {{
                    formatUpdatedAt(attachment?.updatedAtUtc || row.updatedAt)
                  }}
                </td>
                <td>
                  <div class="row no-wrap items-center q-gutter-xs">
                    <template v-if="attachment">
                      <q-btn
                        flat
                        round
                        dense
                        color="primary"
                        icon="download"
                        :aria-label="`Baixar ${row.name}`"
                        @click="download(attachment)"
                      />
                      <q-btn
                        flat
                        round
                        dense
                        color="primary"
                        icon="link"
                        :aria-label="`Abrir ${row.name}`"
                        @click="temporaryUrl(attachment)"
                      />
                      <q-btn
                        v-if="isRejected(attachment?.status || row.status)"
                        flat
                        dense
                        no-caps
                        color="primary"
                        label="Upload de arquivo"
                        :disable="saving"
                        @click="openReplace(attachment)"
                      />
                    </template>
                    <q-btn
                      v-else-if="canUploadRow(row)"
                      flat
                      dense
                      no-caps
                      color="primary"
                      label="Upload de arquivo"
                      :disable="saving"
                      @click="openRequirementUpload(row)"
                    />
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="!group.rows.length">
              <td colspan="5" class="text-grey">
                Nenhum requisito neste grupo.
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card>
      <q-btn
        flat
        no-caps
        color="primary"
        icon="upload_file"
        label="Enviar outro documento"
        :disable="saving || !typeOptions.length"
        @click="openUpload"
      />
    </template>

    <q-dialog v-model="dialog" persistent
      ><q-card class="tool form-card"
        ><q-card-section class="row items-center justify-between"
          ><div class="text-subtitle1 text-weight-bold">
            {{ replacing ? "Substituir documento" : "Enviar documento" }}
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            aria-label="Fechar"
            :disable="saving"
            @click="closeDialog" /></q-card-section
        ><q-separator dark /><q-form ref="formRef" @submit.prevent="save"
          ><q-card-section
            ><div class="row q-col-gutter-md">
              <label-form
                v-if="!replacing"
                class-name="col-12"
                text-label="Tipo de documento"
                ><q-select
                  :disable="saving"
                  v-model="form.documentTypeId"
                  :readonly="Boolean(form.requirementId)"
                  :options="typeOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  dark
                  :rules="requiredRules"
                  @update:model-value="typeChanged"
              /></label-form>
              <label-form
                v-if="!replacing && countryOptions.length"
                class-name="col-12"
                text-label="País"
                ><q-select
                  :disable="saving"
                  v-model="form.countryId"
                  :options="countryOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  dark
                  @update:model-value="loadDefinition"
              /></label-form>
              <div
                v-if="definitionHint"
                class="col-12 text-caption text-grey-5"
              >
                {{ definitionHint }}
              </div>
              <label-form class-name="col-12" text-label="Arquivo"
                ><q-file
                  :disable="saving"
                  v-model="form.file"
                  outlined
                  dense
                  dark
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  max-file-size="26214400"
                  :rules="fileRules"
                  @rejected="fileRejected"
                  ><template #prepend
                    ><q-icon name="attach_file" /></template></q-file
              ></label-form>
              <label-form
                class-name="col-12 col-md-6"
                text-label="Data de emissão"
                ><q-input
                  :disable="saving"
                  v-model="form.issuedOn"
                  type="date"
                  outlined
                  dense
                  dark
              /></label-form>
              <label-form
                class-name="col-12 col-md-6"
                text-label="Data de validade"
                ><q-input
                  :disable="saving"
                  v-model="form.expiresOn"
                  type="date"
                  outlined
                  dense
                  dark
              /></label-form></div></q-card-section
          ><q-card-actions align="right"
            ><q-btn
              flat
              label="Cancelar"
              no-caps
              :disable="saving"
              @click="closeDialog" /><q-btn
              type="submit"
              flat
              color="primary"
              icon="upload"
              label="Enviar"
              no-caps
              :loading="saving" /></q-card-actions></q-form></q-card
    ></q-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onScopeDispose } from "vue";
import {
  profileDocumentRows,
  profileDocumentGroups,
  documentReplacementValues,
} from "src/services/documentPresentation";
import { onboardingBlockMessage } from "src/services/onboardingBlock";
import LabelForm from "src/system/components/form/LabelForm.vue";
import {
  captureClientSession,
  isClientSessionCurrent,
} from "src/services/clientApi";
import useNotify from "src/composables/useNotify";
import { getApiErrorMessage } from "src/services/clientAuthService";
import {
  getClientProfile,
  downloadClientDocument,
  getClientDocumentDataDefinition,
  getClientDocumentOverview,
  getClientDocumentProgress,
  getClientDocumentTemporaryUrl,
  listClientDocuments,
  listClientDocumentTypes,
  replaceClientDocument,
  uploadClientDocument,
} from "src/services/clientProfileService";

const { successNotify, errorNotify } = useNotify();
const loading = ref(true),
  saving = ref(false),
  error = ref(""),
  guardBlocked = ref(""),
  dialog = ref(false),
  replacing = ref(null),
  formRef = ref(null),
  documents = ref([]),
  types = ref([]),
  overview = ref({}),
  progress = ref({}),
  profile = ref(null),
  definition = ref(null);
const blank = () => ({
    documentTypeId: null,
    requirementId: null,
    countryId: null,
    file: null,
    issuedOn: "",
    expiresOn: "",
  }),
  form = reactive(blank());
const collection = (v) => (Array.isArray(v) ? v : v?.items || v?.data || []);
const documentGroups = computed(() =>
  profileDocumentGroups(
    documents.value,
    overview.value,
    progress.value,
    profile.value,
    types.value,
  ),
);
const currentLevelNumber = computed(() => {
  const level = progress.value.currentLevel;
  return (
    Number(String(level?.name || level?.code || "").match(/[1-3]/)?.[0]) || null
  );
});
const formatUpdatedAt = (value) => {
  if (!value) return "Não informada";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Não informada"
    : date.toLocaleDateString("pt-BR");
};
const progressValue = computed(() =>
  Math.max(
    0,
    Math.min(
      100,
      Number(
        progress.value.percentage ??
          progress.value.progressPercentage ??
          progress.value.progress ??
          0,
      ),
    ),
  ),
);
const typeOptions = computed(() =>
  types.value
    .filter((t) => t.allowsFileUpload !== false)
    .map((t) => ({
      label: t.name || t.displayName || t.code || "Documento",
      value: t.id,
      source: t,
    })),
);
const selectedType = computed(
  () => typeOptions.value.find((t) => t.value === form.documentTypeId)?.source,
);
const countryOptions = computed(() =>
  collection(
    selectedType.value?.countries || selectedType.value?.supportedCountries,
  ).map((c) => ({
    label: c.name || c.displayName || c.code,
    value: c.id || c.countryId,
  })),
);
const definitionHint = computed(
  () =>
    definition.value?.description ||
    definition.value?.instructions ||
    selectedType.value?.description ||
    "",
);
const requiredRules = [(v) => Boolean(v) || "Campo obrigatório"];
const fileRules = [
  (v) => Boolean(v) || "Selecione um arquivo",
  (v) =>
    !v ||
    ["application/pdf", "image/jpeg", "image/png"].includes(v.type) ||
    "Use PDF, JPEG ou PNG",
  (v) => !v || v.size <= 26214400 || "O arquivo deve ter no máximo 25 MB",
];
const statusLabel = (s) =>
  ({
    Uploaded: "Enviado",
    Pending: "Pendente",
    Missing: "Pendente",
    Waived: "Dispensado",
    InReview: "Em análise",
    UnderReview: "Em análise",
    Approved: "Aprovado",
    Rejected: "Rejeitado",
  })[s] ||
  s ||
  "Enviado";
const statusColor = (s) =>
  ({
    Approved: "positive",
    Rejected: "negative",
    UnderReview: "warning",
    Pending: "grey",
  })[s] || "grey";
const isRejected = (s) => String(s).toLowerCase() === "rejected";

let active = true,
  loadRevision = 0,
  definitionRevision = 0;
const current = (session) => active && isClientSessionCurrent(session);
const load = async () => {
  const session = captureClientSession(),
    revision = ++loadRevision;
  const latest = () => current(session) && revision === loadRevision;
  loading.value = true;
  error.value = "";
  guardBlocked.value = "";
  overview.value = {};
  progress.value = {};
  profile.value = null;
  documents.value = [];
  types.value = [];
  try {
    const [o, p, d, t, customerProfile] = await Promise.all([
      getClientDocumentOverview(),
      getClientDocumentProgress(),
      listClientDocuments({ page: 1, pageSize: 100 }),
      listClientDocumentTypes(),
      getClientProfile(),
    ]);
    if (!latest()) return;
    overview.value = o || {};
    progress.value = p || {};
    documents.value = profileDocumentRows(collection(d), o);
    types.value = collection(t);
    profile.value = customerProfile;
  } catch (e) {
    if (!latest()) return;
    const block = onboardingBlockMessage(e);
    if (block) guardBlocked.value = block;
    else
      error.value = getApiErrorMessage(
        e,
        "Não foi possível carregar seus documentos.",
      );
  } finally {
    if (latest()) loading.value = false;
  }
};
const resetDialog = () => {
  definitionRevision++;
  Object.assign(form, blank());
  replacing.value = null;
  definition.value = null;
  dialog.value = false;
  formRef.value?.resetValidation?.();
};
const closeDialog = () => {
  if (saving.value) return;
  resetDialog();
};
const canOpen = () =>
  !saving.value &&
  !loading.value &&
  !error.value &&
  !guardBlocked.value &&
  !dialog.value;
const openUpload = () => {
  if (!canOpen()) return;
  resetDialog();
  dialog.value = true;
};
const canUploadRow = (row) =>
  Boolean(
    row.documentTypeId &&
      !row.isWaived &&
      types.value.find((type) => type.id === row.documentTypeId)
        ?.allowsFileUpload !== false &&
      (!Array.isArray(row.allowedActions) ||
        row.allowedActions.some(
          (action) => String(action).toLowerCase() === "upload",
        )),
  );
const openRequirementUpload = (row) => {
  if (!canOpen() || !canUploadRow(row)) return;
  openUpload();
  form.documentTypeId = row.documentTypeId;
  form.requirementId = row.requirementId || null;
  typeChanged();
};
const openReplace = (d) => {
  if (!canOpen()) return;
  resetDialog();
  replacing.value = d;
  Object.assign(form, documentReplacementValues(d));
  dialog.value = true;
};
const typeChanged = () => {
  if (saving.value) return;
  definitionRevision++;
  form.countryId = null;
  definition.value = null;
  if (countryOptions.value.length === 1) {
    form.countryId = countryOptions.value[0].value;
    loadDefinition();
  }
};
const loadDefinition = async () => {
  if (saving.value) return;
  const revision = ++definitionRevision;
  definition.value = null;
  const typeId = form.documentTypeId,
    countryId = form.countryId;
  if (!dialog.value || !typeId || !countryId) return;
  const session = captureClientSession();
  const latest = () =>
    current(session) &&
    revision === definitionRevision &&
    dialog.value &&
    form.documentTypeId === typeId &&
    form.countryId === countryId;
  try {
    const result = await getClientDocumentDataDefinition(typeId, countryId);
    if (latest()) definition.value = result;
  } catch (e) {
    if (latest())
      errorNotify(
        getApiErrorMessage(
          e,
          "Não foi possível carregar as orientações deste documento.",
        ),
      );
  }
};
const fileRejected = () =>
  errorNotify("Use um arquivo PDF, JPEG ou PNG com até 25 MB.");

const save = async () => {
  if (saving.value || !dialog.value || !formRef.value) return;
  const session = captureClientSession();
  saving.value = true;
  try {
    if (!(await formRef.value.validate()) || !current(session)) return;
    const replacement = replacing.value;
    if (
      !replacement &&
      types.value.find((type) => type.id === form.documentTypeId)
        ?.allowsFileUpload === false
    )
      throw new Error("Este tipo de documento não permite envio de arquivo.");
    if (replacement?.providedDocumentId) {
      const [latestProfile, latestOverview] = await Promise.all([
        getClientProfile(),
        getClientDocumentOverview(),
      ]);
      if (!current(session)) return;
      const identity = latestProfile?.identificationDocuments?.documents?.find(
        (item) =>
          item.documentTypeId === replacement.documentTypeId &&
          item.source === "ProvidedDocument",
      );
      const files = (latestOverview?.sections || [])
        .flatMap((section) => section.items || [])
        .flatMap((item) =>
          item.files?.length
            ? item.files
            : item.document
              ? [item.document]
              : [],
        );
      if (
        identity?.documentId !== replacement.providedDocumentId ||
        !files.some(
          (file) => file.id === replacement.id && file.status === "Rejected",
        )
      )
        throw new Error(
          "Este documento mudou. Feche o envio e recarregue a seção antes de tentar novamente.",
        );
    }
    const data = new FormData();
    data.append("file", form.file);
    if (form.issuedOn) data.append("issuedOn", form.issuedOn);
    if (form.expiresOn) data.append("expiresOn", form.expiresOn);
    if (replacement) await replaceClientDocument(replacement.id, data);
    else {
      data.append("documentTypeId", form.documentTypeId);
      if (form.requirementId) data.append("requirementId", form.requirementId);
      if (form.countryId) data.append("countryId", form.countryId);
      await uploadClientDocument(data);
    }
    if (!current(session)) return;
    successNotify(
      replacement ? "Documento substituído." : "Documento enviado.",
    );
    resetDialog();
    await load();
  } catch (e) {
    if (current(session))
      errorNotify(
        getApiErrorMessage(e, "Não foi possível enviar o documento."),
      );
  } finally {
    if (current(session)) saving.value = false;
  }
};
const download = async (d) => {
  const session = captureClientSession();
  try {
    const response = await downloadClientDocument(d.id);
    if (!current(session)) return;
    const url = URL.createObjectURL(response.data),
      a = document.createElement("a");
    a.href = url;
    a.download = d.fileName || d.originalFileName || "documento";
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    if (current(session))
      errorNotify(
        getApiErrorMessage(e, "Não foi possível baixar o documento."),
      );
  }
};
const temporaryUrl = async (d) => {
  const session = captureClientSession();
  try {
    const result = await getClientDocumentTemporaryUrl(d.id);
    if (!current(session)) return;
    const url = result.url || result.temporaryUrl;
    if (!url) throw new Error("URL ausente");
    window.open(url, "_blank", "noopener");
    successNotify("Link temporário aberto em uma nova aba.");
  } catch (e) {
    if (current(session))
      errorNotify(
        getApiErrorMessage(e, "Não foi possível gerar o link temporário."),
      );
  }
};
onScopeDispose(() => {
  active = false;
  loadRevision++;
  resetDialog();
  documents.value = [];
  types.value = [];
  overview.value = {};
  progress.value = {};
  profile.value = null;
});
load();
</script>

<style scoped>
.documentation-setting-layout {
  width: 100%;
}
.documentation-summary {
  display: grid;
  gap: 24px;
  margin-bottom: 24px;
}
.documentation-setting-layout > .tool > .q-card__section,
.documentation-summary .q-card__section {
  padding: 0;
}
.documentation-setting-layout > .tool > .q-card__section:first-child {
  gap: 16px;
}
.documentation-setting-layout > .tool > .q-separator {
  margin: 24px 0;
}
.documentation-setting-layout > .tool > .q-card__section.empty-state {
  padding: 24px 0;
}
.document-row {
  padding: 16px 0;
  min-width: 0;
}
.document-row :deep(.q-item__label) {
  overflow-wrap: anywhere;
}
.form-card {
  width: min(720px, calc(100vw - 32px));
}
@media (max-width: 599px) {
  .documentation-setting-layout > .tool,
  .documentation-summary .tool {
    padding: 16px;
  }
  .document-row {
    flex-wrap: wrap;
  }
  .document-row__actions {
    flex-basis: 100%;
    margin-top: 8px;
    padding-left: 56px;
    align-items: flex-start;
  }
  .document-row :deep(.q-item__label) {
    overflow-wrap: anywhere;
  }
}
.documentation-progress {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}
.documentation-progress-copy {
  flex: 1;
  min-width: min(260px, 100%);
}
.documentation-progress-icon {
  width: 64px;
  height: 64px;
  overflow: hidden;
  position: relative;
}
.documentation-progress-icon img {
  position: absolute;
  height: 135.93%;
  width: 248.76%;
  max-width: none;
  left: -74.38%;
  top: -13.81%;
}
.document-levels {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.document-level {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
}
.document-level img {
  flex: none;
}
.document-level--current {
  border-color: var(--q-primary);
}
.document-table {
  background: transparent;
  color: inherit;
}
.document-table :deep(td),
.document-table :deep(th) {
  border-color: rgba(255, 255, 255, 0.16);
}
.document-table :deep(td) {
  min-width: 130px;
}
.document-filename {
  display: block;
  overflow-wrap: anywhere;
  max-width: 320px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
@media (max-width: 599px) {
  .document-levels {
    width: 100%;
    gap: 8px;
  }
  .document-level {
    padding: 8px;
    flex: 1;
  }
}
</style>
