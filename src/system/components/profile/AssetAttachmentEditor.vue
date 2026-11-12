<template>
  <section class="attachment-editor" :aria-busy="loading || disabled">
    <q-linear-progress
      v-if="loading"
      indeterminate
      aria-label="Carregando anexos do imóvel"
    />
    <p v-if="error" role="alert" class="text-negative">
      {{ error
      }}<q-btn
        v-if="loadFailed"
        flat
        dense
        label="Tentar novamente"
        @click="load"
      />
    </p>
    <div v-for="slot in slots" :key="slot.code" class="attachment-group">
      <h4>{{ slot.label }}</h4>
      <div class="attachment-strip">
        <q-btn
          flat
          no-caps
          class="attachment-upload"
          :disable="disabled || loading || loadFailed || !typeFor(slot.code)"
          :aria-label="`Enviar ${slot.label}`"
          @click="choose(slot)"
          ><q-icon name="add" size="24px" /><span>Upload</span
          ><q-tooltip v-if="!typeFor(slot.code)"
            >Tipo indisponível no catálogo.</q-tooltip
          ></q-btn
        >
        <article
          v-for="item in itemsFor(slot.code)"
          :key="item.key"
          class="attachment-thumb"
        >
          <q-img
            v-if="item.preview"
            :src="item.preview"
            fit="contain"
            :alt="item.fileName"
            @error="item.preview = ''"
          />
          <span
            v-else
            class="attachment-format"
            :class="`attachment-format--${fileFormat(item)}`"
            >{{ fileFormat(item) }}</span
          >
          <div class="attachment-actions">
            <q-btn
              flat
              round
              dense
              icon="visibility"
              :aria-label="`Visualizar ${item.fileName}`"
              :disable="disabled || viewing === item.key"
              @click="view(item)"
            /><q-btn
              flat
              round
              dense
              icon="delete_outline"
              :aria-label="`Remover ${item.fileName}`"
              :disable="disabled"
              @click="remove(item)"
            />
          </div>
          <q-tooltip
            >{{ item.fileName
            }}{{ item.file ? " — Aguardando salvar" : "" }}</q-tooltip
          >
        </article>
      </div>
    </div>
    <input
      ref="picker"
      type="file"
      hidden
      multiple
      accept=".pdf,.png,.jpg,.jpeg"
      @change="selectedFiles"
    />
  </section>
</template>
<script setup>
import { ref, onScopeDispose } from "vue";
import { createDocumentWindow } from "src/services/documentWindow";
import { getApiErrorMessage } from "src/services/clientAuthService";
import {
  listClientDocumentTypes,
  uploadClientDocument,
} from "src/services/clientProfileService";
import {
  getClientAssetDocuments,
  getClientAssetDocumentUrl,
  linkClientAssetDocument,
  unlinkClientAssetDocument,
} from "src/services/clientAssetsService";
import {
  captureClientSession,
  assertClientSessionCurrent,
  isClientSessionCurrent,
} from "src/services/clientApi";
import { fileFormat } from "src/services/profileDocumentation";
const props = defineProps({
  assetId: { type: String, default: null },
  disabled: Boolean,
});
const slots = [
  { code: "MATRICULA_IMOVEL", label: "Fotos da Matrícula" },
  { code: "IPTU", label: "Foto do IPTU" },
  {
    code: "FOTOS_IMOVEL",
    label: "Fotos do Imóvel (Adicione quantas fotos quiser)",
  },
];
const types = ref([]),
  items = ref([]),
  removed = ref([]),
  loading = ref(false),
  loadFailed = ref(false),
  error = ref(""),
  picker = ref(null),
  viewing = ref(null);
let active = true,
  revision = 0,
  sequence = 0,
  chosen = null;
const typeFor = (code) =>
  types.value.find(
    (type) => type.code === code && type.allowsFileUpload !== false,
  );
const itemsFor = (code) =>
  items.value.filter(
    (item) => item.code === code && !removed.value.includes(item.documentId),
  );
const safeUrl = (result) => {
  if (!/^https?:\/\//i.test(result?.url || ""))
    throw Error("Prévia indisponível.");
  return result.url;
};
async function load() {
  const version = ++revision,
    session = captureClientSession();
  loading.value = true;
  loadFailed.value = false;
  error.value = "";
  try {
    const [catalog, docs] = await Promise.all([
      listClientDocumentTypes(),
      props.assetId ? getClientAssetDocuments(props.assetId) : [],
    ]);
    assertClientSessionCurrent(session);
    if (!active || version !== revision) return;
    types.value = Array.isArray(catalog) ? catalog : catalog?.items || [];
    items.value = (docs || []).map((doc) => ({
      ...doc,
      key: doc.documentId,
      code:
        doc.documentTypeCode ||
        types.value.find((t) => t.id === doc.documentTypeId)?.code,
      fileName: doc.fileName || doc.documentTypeName,
      preview: "",
    }));
    await Promise.all(
      items.value
        .filter((doc) => /^image\//.test(doc.contentType || ""))
        .map(async (doc) => {
          try {
            const url = await getClientAssetDocumentUrl(
              props.assetId,
              doc.documentId,
            );
            assertClientSessionCurrent(session);
            if (active && version === revision) doc.preview = safeUrl(url);
          } catch {
            /* The file remains accessible through View. */
          }
        }),
    );
  } catch {
    if (active && version === revision) {
      loadFailed.value = true;
      error.value = "Não foi possível carregar os anexos. Tente novamente.";
    }
  } finally {
    if (active && version === revision) loading.value = false;
  }
}
function choose(slot) {
  if (
    props.disabled ||
    loading.value ||
    loadFailed.value ||
    !typeFor(slot.code)
  )
    return;
  chosen = slot;
  picker.value?.click();
}
function selectedFiles(event) {
  const files = [...(event.target.files || [])];
  event.target.value = "";
  if (props.disabled || !chosen) return;
  for (const file of files) {
    if (
      !file.size ||
      file.size > 26214400 ||
      !["application/pdf", "image/png", "image/jpeg"].includes(file.type)
    ) {
      error.value = "Use PDF, PNG ou JPEG com até 25 MB.";
      return;
    }
  }
  for (const file of files)
    items.value.push({
      key: `queued-${++sequence}`,
      code: chosen.code,
      documentTypeId: typeFor(chosen.code).id,
      file,
      fileName: file.name,
      contentType: file.type,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    });
  error.value = "";
}
function remove(item) {
  if (props.disabled) return;
  if (item.documentId && (!item.file || item.linked)) {
    if (!removed.value.includes(item.documentId))
      removed.value.push(item.documentId);
  } else {
    if (item.preview) URL.revokeObjectURL(item.preview);
    items.value = items.value.filter((row) => row !== item);
  }
}
const documentWindow = createDocumentWindow();
async function view(item) {
  if (!active || props.disabled || viewing.value) return;
  const session = captureClientSession();
  viewing.value = item.key;
  error.value = "";
  let localUrl = null,
    opened = false;
  try {
    opened = await documentWindow.open(
      async () => {
        if (item.file) {
          localUrl = URL.createObjectURL(item.file);
          return localUrl;
        }
        const result = await getClientAssetDocumentUrl(
          props.assetId,
          item.documentId,
        );
        assertClientSessionCurrent(session);
        return result?.url;
      },
      {
        current: () => active && isClientSessionCurrent(session),
        allowBlob: Boolean(item.file),
      },
    );
  } catch (e) {
    if (active && isClientSessionCurrent(session))
      error.value = getApiErrorMessage(e, "Não foi possível abrir o arquivo.");
  } finally {
    if (localUrl) {
      if (opened) setTimeout(() => URL.revokeObjectURL(localUrl), 60000);
      else URL.revokeObjectURL(localUrl);
    }
    if (active) viewing.value = null;
  }
}
async function save(assetId) {
  if (loadFailed.value || loading.value)
    throw Error("Aguarde ou recarregue os anexos antes de salvar.");
  const version = revision,
    session = captureClientSession(),
    id = assetId || props.assetId;
  const current = () => {
    assertClientSessionCurrent(session);
    if (!active || version !== revision)
      throw Error("Edição encerrada. Reabra o patrimônio.");
  };
  for (const item of items.value.filter((item) => item.file && !item.linked)) {
    current();
    if (!item.documentId) {
      const body = new FormData();
      body.append("file", item.file);
      body.append("documentTypeId", item.documentTypeId);
      const result = await uploadClientDocument(body);
      current();
      if (!result?.id) throw Error("O envio não confirmou o arquivo.");
      item.documentId = result.id;
    }
    current();
    await linkClientAssetDocument(id, item.documentId);
    current();
    item.linked = true;
  }
  for (const documentId of [...removed.value]) {
    current();
    await unlinkClientAssetDocument(id, documentId);
    current();
    removed.value = removed.value.filter((value) => value !== documentId);
  }
}
onScopeDispose(() => {
  active = false;
  documentWindow.dispose();
  viewing.value = null;
  revision++;
  for (const item of items.value)
    if (item.file && item.preview) URL.revokeObjectURL(item.preview);
});
defineExpose({ save });
load();
</script>
<style scoped>
.attachment-editor {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}
.attachment-group {
  flex: 1;
  min-width: min(220px, 100%);
}
.attachment-group h4 {
  font-size: 14px;
  line-height: 1.4;
  font-weight: 500;
  margin: 0 0 8px;
}
.attachment-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.attachment-upload,
.attachment-thumb {
  width: 104px;
  height: 104px;
  flex: none;
  border-radius: 8px;
}
.attachment-upload {
  background: #fff !important;
  color: #00a3ff !important;
  border: 2px dashed #00a3ff;
  padding: 0;
  font-size: 14px;
}
.attachment-upload :deep(.q-btn__content) {
  flex-direction: column;
  gap: 8px;
}
.attachment-thumb {
  position: relative;
  display: grid;
  place-items: center;
  border: 1px solid #dcdcdc;
  padding: 8px;
  overflow: hidden;
}
.attachment-thumb .q-img {
  height: 100%;
  width: 100%;
}
.attachment-format {
  font-weight: 700;
  color: #fff;
  background: #b92626;
  border-radius: 4px;
  padding: 8px;
}
.attachment-format--IMG {
  background: #4b5563;
}
.attachment-format--XLS {
  background: #167c42;
}
.attachment-actions {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0009;
  opacity: 0;
  transition: opacity 0.15s;
}
.attachment-thumb:hover .attachment-actions,
.attachment-thumb:focus-within .attachment-actions {
  opacity: 1;
}
@media (hover: none) {
  .attachment-actions {
    opacity: 1;
    background: linear-gradient(transparent, #0009);
    align-items: flex-end;
  }
}
</style>
