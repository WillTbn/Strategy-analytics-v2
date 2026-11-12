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
          <h2>
            Suba de Nível e Desbloqueie Funcionalidades e Recursos Especiais!
          </h2>
          <div class="documentation-progress-line">
            <span>{{ levelProgress.text }}</span>
            <q-linear-progress
              rounded
              size="6px"
              color="primary"
              :value="levelProgress.value ?? 0"
              :indeterminate="levelProgress.value == null"
              aria-label="Progresso documental"
            />
            <span class="documentation-counter">{{
              levelProgress.counter
            }}</span>
          </div>
        </div>
        <div class="document-levels" aria-label="Níveis documentais">
          <div
            v-for="(description, index) in [
              'Cadastro concluído',
              '5 documentos enviados',
              '3 patrimônios registrados',
            ]"
            :key="index"
            class="document-level"
            :class="{
              'document-level--current': currentLevelNumber === index + 1,
            }"
          >
            <span class="document-level-icon"
              ><img
                :src="`/system/icons/profile/level-${index + 1}.svg`"
                alt=""
            /></span>
            <div>
              <span
                >Nível {{ index + 1 }}
                <span
                  v-if="currentLevelNumber === index + 1"
                  class="text-primary"
                  >(atual)</span
                ></span
              ><small>{{ description }}</small>
            </div>
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
        <div class="document-group-heading">
          <h3>{{ group.name }}</h3>
          <span class="document-group-tag">Conta para o Nível 2</span>
          <div
            v-if="dialog && activeGroupKey === group.key"
            class="document-group-actions"
          >
            <q-btn
              flat
              no-caps
              color="primary"
              icon="check"
              label="Salvar"
              type="submit"
              form="profile-document-upload"
              :loading="saving"
            /><q-btn
              flat
              no-caps
              color="grey-6"
              label="Descartar"
              :disable="saving"
              @click="closeDialog"
            />
          </div>
        </div>
        <div :id="`document-editor-${group.key}`"></div>
        <q-markup-table
          v-if="!dialog || activeGroupKey !== group.key"
          flat
          class="document-table"
          wrap-cells
        >
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
                  <span class="document-file"
                    ><span
                      v-if="attachment"
                      class="document-format"
                      :class="`document-format--${fileFormat(attachment)}`"
                      ><img
                        v-if="['PDF', 'IMG'].includes(fileFormat(attachment))"
                        :src="`/system/icons/profile/file-${fileFormat(attachment).toLowerCase()}.png`"
                        alt=""
                      /><span v-else>{{ fileFormat(attachment) }}</span></span
                    ><span class="document-filename">{{
                      attachment?.fileName ||
                      attachment?.originalFileName ||
                      attachment?.file?.originalFileName ||
                      attachment?.file?.fileName ||
                      (attachment
                        ? "Arquivo protegido"
                        : "Nenhum arquivo anexado")
                    }}</span></span
                  >
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
                  {{ formatUpdatedAt(documentUpdatedAt(attachment, row)) }}
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
                        class="document-upload-button"
                        icon="upload"
                        label="Upload de arquivo"
                        :disable="saving"
                        @click="openReplace(attachment, group.key)"
                      />
                    </template>
                    <q-btn
                      v-else
                      flat
                      dense
                      no-caps
                      color="primary"
                      class="document-upload-button"
                      icon="upload"
                      label="Upload de arquivo"
                      :disable="saving || !canUploadRow(row)"
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
    </template>

    <Teleport v-if="dialog" :to="`#document-editor-${activeGroupKey}`"
      ><q-card class="tool form-card"
        ><q-form
          id="profile-document-upload"
          ref="formRef"
          @submit.prevent="save"
          ><q-card-section
            ><div class="row q-col-gutter-md">
              <label-form
                v-if="
                  !replacing &&
                  activeGroupKey === 'identity' &&
                  editingRows.some((row) => row.side)
                "
                class-name="col-12 col-md-6"
                text-label="Tipo de documento"
                ><q-select
                  :disable="
                    saving ||
                    editingRows.some((row) => row.side && row.documents.length)
                  "
                  v-model="identityTypeId"
                  :options="identityTypeOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  dark
                  :rules="requiredRules"
                  @update:model-value="
                    (value) => {
                      form.documentTypeId = value;
                      typeChanged();
                    }
                  "
              /></label-form>
              <div
                v-if="definitionHint"
                class="col-12 text-caption text-grey-5"
              >
                {{ definitionHint }}
              </div>
              <label-form
                v-for="entry in editingRows"
                :key="entry.key"
                class-name="col-12 col-md-6"
                :text-label="entry.name"
              >
                <q-file
                  :model-value="groupDrafts[entry.key]?.files || null"
                  @update:model-value="queueRow(entry, $event)"
                  :multiple="
                    entry.maxFiles > 1 &&
                    !entry.documents.some((file) => isRejected(file.status))
                  "
                  :max-files="
                    entry.documents.some((file) => isRejected(file.status))
                      ? 1
                      : entry.maxFiles
                  "
                  :disable="
                    saving ||
                    !entry.catalogAvailable ||
                    (entry.documents.length > 0 &&
                      !entry.documents.some((file) => isRejected(file.status)))
                  "
                  outlined
                  dense
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  max-file-size="26214400"
                  :display-value="
                    groupDrafts[entry.key]?.files
                      ? undefined
                      : entry.documents.length
                        ? entry.documents
                            .map(
                              (file) =>
                                file.fileName ||
                                file.originalFileName ||
                                'Arquivo enviado',
                            )
                            .join(', ')
                        : 'Importe o arquivo'
                  "
                  :aria-label="entry.name"
                  :class="{
                    'document-import--empty':
                      !groupDrafts[entry.key]?.files && !entry.documents.length,
                  }"
                  @rejected="fileRejected"
                  ><template #prepend><q-icon name="description" /></template
                ></q-file>
              </label-form>
              <p
                v-if="groupSaveError"
                class="col-12 text-negative"
                role="alert"
              >
                {{ groupSaveError }}
              </p>
            </div></q-card-section
          ></q-form
        ></q-card
      ></Teleport
    >
  </div>
</template>

<script setup>
import { computed, reactive, ref, onScopeDispose } from "vue";
import { createDocumentWindow } from "src/services/documentWindow";
import {
  profileDocumentRows,
  profileDocumentGroups,
  documentReplacementValues,
} from "src/services/documentPresentation";
import { onboardingBlockMessage } from "src/services/onboardingBlock";
import {
  documentationGroups,
  documentationProgress,
  fileFormat,
  documentUpdatedAt,
} from "src/services/profileDocumentation";
import LabelForm from "src/system/components/form/LabelForm.vue";
import {
  captureClientSession,
  isClientSessionCurrent,
} from "src/services/clientApi";
import useNotify from "src/composables/useNotify";
import { getApiErrorMessage } from "src/services/clientAuthService";
import {
  getClientProfile,
  getClientProfileSummary,
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
const identityTypeId = ref(null);
const identityTypeOptions = computed(() =>
  types.value
    .filter((type) =>
      ["RG", "CNH", "PASSPORT", "PASSAPORTE"].includes(type.code),
    )
    .map((type) => ({ label: type.name, value: type.id })),
);
const activeGroupKey = ref("identity"),
  groupDrafts = reactive({}),
  groupSaveError = ref("");
let acceptedFiles = new Set();
const editingRows = computed(
  () =>
    documentGroups.value.find((group) => group.key === activeGroupKey.value)
      ?.rows || [],
);
const queueRow = (row, value) => {
  const files = Array.isArray(value) ? value : value ? [value] : [];
  if (files.length > row.maxFiles) {
    groupSaveError.value = `Selecione até ${row.maxFiles} arquivos.`;
    return;
  }
  for (const file of files) {
    const result = fileRules
      .map((rule) => rule(file))
      .find((result) => result !== true);
    if (result) {
      groupSaveError.value = result;
      return;
    }
  }
  groupDrafts[row.key] = { row, files: value };
  groupSaveError.value = "";
};
const blank = () => ({
    documentTypeId: null,
    requirementId: null,
    countryId: null,
    file: null,
    side: null,
    issuedOn: "",
    expiresOn: "",
  }),
  form = reactive(blank());
const collection = (v) => (Array.isArray(v) ? v : v?.items || v?.data || []);
const documentGroups = computed(() =>
  documentationGroups(
    profileDocumentGroups(
      documents.value,
      overview.value,
      progress.value,
      profile.value,
      types.value,
    ),
    types.value,
  ),
);
const accountLevelProgress = ref(null);
const levelProgress = computed(() =>
  documentationProgress(accountLevelProgress.value),
);
const currentLevelNumber = computed(() => levelProgress.value.level);
const formatUpdatedAt = (value) => {
  if (!value) return "Não informada";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Não informada"
    : date.toLocaleDateString("pt-BR");
};
const selectedType = computed(() =>
  types.value.find((t) => t.id === form.documentTypeId),
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
    Missing: "Upload Pendente",
    Waived: "Dispensado",
    InReview: "Em análise",
    UnderReview: "Em análise",
    Approved: "Aprovado",
    Rejected: "Negado",
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
  accountLevelProgress.value = null;
  documents.value = [];
  types.value = [];
  try {
    const [o, p, d, t, customerProfile, summary] = await Promise.all([
      getClientDocumentOverview(),
      getClientDocumentProgress(),
      listClientDocuments({ page: 1, pageSize: 100 }),
      listClientDocumentTypes(),
      getClientProfile(),
      getClientProfileSummary().catch(() => null),
    ]);
    if (!latest()) return;
    overview.value = o || {};
    progress.value = p || {};
    documents.value = profileDocumentRows(collection(d), o);
    types.value = collection(t);
    profile.value = customerProfile;
    accountLevelProgress.value = summary?.levelProgress || null;
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
  for (const key of Object.keys(groupDrafts)) delete groupDrafts[key];
  acceptedFiles = new Set();
  groupSaveError.value = "";
  definitionRevision++;
  Object.assign(form, blank());
  replacing.value = null;
  definition.value = null;
  dialog.value = false;
  formRef.value?.resetValidation?.();
};
const closeDialog = () => {
  if (saving.value) return;
  const reload = acceptedFiles.size > 0;
  resetDialog();
  if (reload) load();
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
      row.catalogAvailable &&
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
  activeGroupKey.value =
    documentGroups.value.find((group) =>
      group.rows.some((item) => item.key === row.key),
    )?.key || "identity";
  openUpload();
  form.documentTypeId = row.documentTypeId;
  identityTypeId.value =
    (row.side
      ? row.documentTypeId
      : editingRows.value.find((item) => item.side)?.documentTypeId) ||
    identityTypeOptions.value[0]?.value ||
    null;
  form.requirementId = row.requirementId || null;
  form.side = row.side || null;
  typeChanged();
};
const openReplace = (d, groupKey = "identity") => {
  activeGroupKey.value = groupKey;
  if (!canOpen()) return;
  resetDialog();
  replacing.value = d;
  identityTypeId.value = d.documentTypeId;
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

const writeSelectedFile = async (values, replacement, session) => {
  if (
    !replacement &&
    types.value.find((type) => type.id === values.documentTypeId)
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
        item.files?.length ? item.files : item.document ? [item.document] : [],
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
  data.append("file", values.file);
  if (values.side) data.append("side", values.side);
  if (values.issuedOn) data.append("issuedOn", values.issuedOn);
  if (values.expiresOn) data.append("expiresOn", values.expiresOn);
  if (replacement) await replaceClientDocument(replacement.id, data);
  else {
    data.append("documentTypeId", values.documentTypeId);
    if (values.requirementId)
      data.append("requirementId", values.requirementId);
    if (values.countryId) data.append("countryId", values.countryId);
    await uploadClientDocument(data);
  }
};
const save = async () => {
  if (saving.value || !dialog.value || !formRef.value) return;
  const session = captureClientSession();
  saving.value = true;
  try {
    if (!(await formRef.value.validate()) || !current(session)) return;
    const pending = Object.values(groupDrafts).flatMap(({ row, files }) =>
      (Array.isArray(files) ? files : files ? [files] : []).map((file) => ({
        row,
        file,
      })),
    );
    if (!pending.length && form.file)
      pending.push({ row: null, file: form.file });
    if (!pending.length) {
      groupSaveError.value = "Selecione pelo menos um arquivo.";
      return;
    }
    for (const { row, file } of pending) {
      if (acceptedFiles.has(file)) continue;
      const replacement = row
        ? row.documents.find(
            (candidate) =>
              isRejected(candidate.status) &&
              (!row.side ||
                candidate.side === row.side ||
                (!candidate.side && row.side === "Front")) &&
              (candidate.id === replacing.value?.id ||
                !candidate.documentTypeId ||
                candidate.documentTypeId === row.documentTypeId),
          ) || null
        : replacing.value;
      const values = {
        ...form,
        ...(replacement ? documentReplacementValues(replacement) : {}),
        file,
        ...(row
          ? {
              documentTypeId:
                row.side && !row.documents.length
                  ? identityTypeId.value || row.documentTypeId
                  : row.documentTypeId,
              requirementId:
                replacement?.requirementId || row.requirementId || null,
              side: row.side || null,
            }
          : {}),
      };
      await writeSelectedFile(values, replacement, session);
      if (!current(session)) return;
      acceptedFiles.add(file);
    }
    if (!current(session)) return;
    successNotify(
      pending.some(({ row }) =>
        row?.documents.some((file) => isRejected(file.status)),
      ) || replacing.value
        ? "Documento substituído."
        : "Documento enviado.",
    );
    resetDialog();
    await load();
  } catch (e) {
    if (current(session)) {
      groupSaveError.value = getApiErrorMessage(
        e,
        "Não foi possível enviar o documento.",
      );
      errorNotify(groupSaveError.value);
    }
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
const documentWindow = createDocumentWindow();
const temporaryUrl = async (d) => {
  const session = captureClientSession();
  try {
    const opened = await documentWindow.open(
      async () => {
        const result = await getClientDocumentTemporaryUrl(d.id);
        return result?.url || result?.temporaryUrl;
      },
      { current: () => current(session) },
    );
    if (opened) successNotify("Link temporário aberto em uma nova aba.");
  } catch (e) {
    if (current(session))
      errorNotify(
        getApiErrorMessage(e, "Não foi possível gerar o link temporário."),
      );
  }
};
onScopeDispose(() => {
  active = false;
  documentWindow.dispose();
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
  width: 100%;
  background: transparent;
  box-shadow: none;
  border: 0;
  padding: 0;
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

.documentation-progress {
  min-height: 104px;
  padding: 12px 16px;
  border: 0;
  border-left: 2px solid #00a3ff;
  border-radius: 8px;
  background: linear-gradient(181.4deg, #ffffff29, #ffffff0a 50%, #ffffff03);
  gap: 12px;
}
.documentation-progress h2 {
  font-size: 17px;
  line-height: 1.35;
  margin: 0;
  font-weight: 700;
}
.documentation-progress-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  color: #bdbdbd;
  font-size: 12px;
  font-weight: 500;
}
.documentation-progress-line .q-linear-progress {
  width: 186px;
  flex: none;
  background: #656565;
  border-radius: 4px;
}
.documentation-counter {
  font-size: 14px;
  font-weight: 400;
}
.documentation-progress-icon {
  width: 80px;
  height: 80px;
  flex: none;
  padding: 8px;
  background: linear-gradient(#ffffff0f, #ffffff03);
}
.documentation-progress-icon img {
  height: 87px;
  width: 159px;
  left: -40px;
  top: -1px;
}
.document-levels {
  border-left: 1px solid #464646;
  padding-left: 48px;
}
.document-level {
  width: 216px;
  min-width: 216px;
  height: 67px;
  min-height: 67px;
  flex: none;
  padding: 10px;
  gap: 8px;
  line-height: 1.35;
  background: linear-gradient(#ffffff0f, #ffffff03);
}
.document-level-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex: none;
  background: linear-gradient(#ffffff0f, #ffffff03);
}
.document-level > div > span {
  font-weight: 500;
}
.document-level small {
  display: block;
  line-height: 1.35;
  font-size: 12px;
  color: #989898;
  margin-top: 8px;
}
.document-group-heading {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.document-group-heading h3 {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.35;
  margin: 0;
}
.document-group-tag {
  font-size: 12px;
  font-weight: 400;
  color: #989898;
  border: 1px solid #656565;
  border-radius: 4px;
  padding: 2px 8px;
  line-height: 14px;
  background: linear-gradient(#ffffff29, #ffffff03);
}
.document-table :deep(th) {
  font-size: 14px;
  font-weight: 500;
  color: #fafafa;
}
.document-table :deep(td) {
  height: 48px;
  font-size: 14px;
  color: #dcdcdc;
}
.document-table :deep(td),
.document-table :deep(th) {
  border-color: #3d3d3d;
}
.document-file {
  display: flex;
  align-items: center;
  gap: 8px;
}
.document-format {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  background: #40444c;
}
.document-format--XLS {
  background: #167c42;
  color: #fff;
}
.document-format img {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 6px;
}
.document-upload-button {
  width: 162px;
  min-height: 32px;
  background: #00a3ff !important;
  color: #fff !important;
  border-radius: 6px;
  font-size: 14px;
}
@media (max-width: 1500px) {
  .document-levels {
    width: 100%;
    padding: 16px 0 0;
    border-left: 0;
    border-top: 1px solid #464646;
  }
  .document-level {
    flex: 1;
    min-width: 0;
  }
}
@media (max-width: 599px) {
  .document-levels {
    flex-direction: column;
  }
  .document-level {
    width: 100%;
  }
  .documentation-progress-copy {
    min-width: 0;
    flex-basis: calc(100% - 104px);
  }
}

.form-card :deep(.q-field__native),
.form-card :deep(.q-field__input),
.form-card :deep(.q-field__marginal) {
  color: #1d1d1d;
  font-size: 14px;
}
.form-card :deep(.q-field__marginal) {
  height: 40px;
}
.form-card :deep(.q-field--outlined .q-field__control:before) {
  border: 1px solid #dcdcdc;
}

.document-group-actions {
  display: flex;
  gap: 8px;
}

.document-import--empty :deep(.q-field__native) {
  color: #989898;
}
.documentation-setting-layout {
  font-family: Inter, sans-serif;
}
</style>
