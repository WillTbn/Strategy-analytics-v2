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
      <div class="documentation-summary">
        <div>
          <q-card class="tool full-height"
            ><q-card-section
              ><div class="text-subtitle1 text-weight-bold">
                Visão documental
              </div>
              <div class="text-caption text-grey-5 q-mb-md">
                Situação atual dos documentos enviados.
              </div>
              <div class="text-h4 text-primary">{{ overviewValue }}</div>
              <div class="text-caption">
                documentos cadastrados
              </div></q-card-section
            ></q-card
          >
        </div>
        <div>
          <q-card class="tool full-height"
            ><q-card-section
              ><div class="text-subtitle1 text-weight-bold">Progresso</div>
              <div class="text-caption text-grey-5 q-mb-md">
                Evolução do seu cadastro documental.
              </div>
              <q-linear-progress
                rounded
                size="12px"
                color="primary"
                :value="progressValue / 100"
              />
              <div class="q-mt-sm">
                {{ progressValue }}% concluído
              </div></q-card-section
            ></q-card
          >
        </div>
      </div>

      <q-card class="tool">
        <q-card-section class="row items-center justify-between"
          ><div>
            <div class="text-subtitle1 text-weight-bold">Meus documentos</div>
            <div class="text-caption text-grey-5">
              PDF, JPEG ou PNG, com até 25 MB.
            </div>
          </div>
          <q-btn
            flat
            color="primary"
            icon="upload_file"
            label="Enviar documento"
            no-caps
            :disable="loading || saving"
            @click="openUpload"
        /></q-card-section>
        <q-separator dark />
        <q-card-section
          v-if="!documents.length"
          class="empty-state q-pa-xl text-center text-grey-5"
          ><q-icon name="description" size="36px" />
          <div class="q-mt-sm">Nenhum documento enviado.</div></q-card-section
        >
        <q-list v-else separator>
          <q-item
            v-for="document in documents"
            :key="document.id"
            class="document-row"
          >
            <q-item-section avatar
              ><q-avatar color="primary" text-color="white" icon="description"
            /></q-item-section>
            <q-item-section
              ><q-item-label>{{ documentName(document) }}</q-item-label
              ><q-item-label caption>{{
                document.fileName ||
                document.originalFileName ||
                "Arquivo protegido"
              }}</q-item-label
              ><q-item-label
                v-if="document.rejectionReason"
                caption
                class="text-negative"
                >{{ document.rejectionReason }}</q-item-label
              ></q-item-section
            >
            <q-item-section side class="document-row__actions"
              ><div class="row items-center q-gutter-xs">
                <q-badge
                  outline
                  :color="statusColor(document.status)"
                  :label="statusLabel(document.status)"
                /><q-btn
                  flat
                  round
                  dense
                  icon="download"
                  color="primary"
                  aria-label="Baixar documento"
                  @click="download(document)"
                /><q-btn
                  flat
                  round
                  dense
                  icon="link"
                  color="primary"
                  aria-label="Gerar link temporário"
                  @click="temporaryUrl(document)"
                /><q-btn
                  v-if="isRejected(document.status)"
                  flat
                  round
                  dense
                  icon="published_with_changes"
                  color="warning"
                  aria-label="Substituir documento"
                  :disable="saving"
                  @click="openReplace(document)"
                /></div
            ></q-item-section>
          </q-item>
        </q-list>
      </q-card>
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
  definition = ref(null);
const blank = () => ({
    documentTypeId: null,
    countryId: null,
    file: null,
    issuedOn: "",
    expiresOn: "",
  }),
  form = reactive(blank());
const collection = (v) => (Array.isArray(v) ? v : v?.items || v?.data || []);
const overviewValue = computed(
  () =>
    overview.value.totalDocuments ??
    overview.value.total ??
    documents.value.length,
);
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
  types.value.map((t) => ({
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
const documentName = (d) =>
  d.documentTypeName || d.typeName || d.name || "Documento";
const statusLabel = (s) =>
  ({
    Uploaded: "Enviado",
    Pending: "Pendente",
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
  documents.value = [];
  types.value = [];
  try {
    const [o, p, d, t] = await Promise.all([
      getClientDocumentOverview(),
      getClientDocumentProgress(),
      listClientDocuments({ page: 1, pageSize: 100 }),
      listClientDocumentTypes(),
    ]);
    if (!latest()) return;
    overview.value = o || {};
    progress.value = p || {};
    documents.value = profileDocumentRows(collection(d), o);
    types.value = collection(t);
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
    const data = new FormData();
    data.append("file", form.file);
    if (form.issuedOn) data.append("issuedOn", form.issuedOn);
    if (form.expiresOn) data.append("expiresOn", form.expiresOn);
    if (replacement) await replaceClientDocument(replacement.id, data);
    else {
      data.append("documentTypeId", form.documentTypeId);
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
</style>
