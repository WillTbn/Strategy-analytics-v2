<template>
  <section aria-label="Anexos do patrimônio">
    <div class="text-weight-medium q-mb-md">
      Documentos e imagens vinculados
    </div>
    <resource-state :state="resource.state" @retry="load">
      <p v-if="!resource.state.data?.length" class="text-grey">
        Nenhum documento vinculado.
      </p>
      <div class="asset-gallery">
        <div
          v-for="doc in resource.state.data || []"
          :key="doc.documentId"
          class="asset-attachment"
        >
          <q-img
            v-if="previews[doc.documentId]"
            :src="previews[doc.documentId]"
            :alt="doc.fileName || doc.documentTypeName"
            fit="contain"
            class="asset-preview"
            @error="previewErrors[doc.documentId] = true"
          >
            <template #error
              ><div class="absolute-full flex flex-center">
                Prévia indisponível
              </div></template
            >
          </q-img>
          <div v-else class="asset-preview flex flex-center">
            <q-icon name="description" size="32px" />
          </div>
          <span class="asset-filename">{{
            doc.fileName || doc.documentTypeName
          }}</span>
          <span v-if="previewErrors[doc.documentId]" class="text-caption"
            >Não foi possível carregar a prévia.</span
          >
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            label="Visualizar"
            :loading="viewing === doc.documentId"
            @click="view(doc)"
          />
        </div>
      </div>
      <p v-if="viewError" role="alert" class="text-negative">{{ viewError }}</p>
      <q-btn
        v-if="Object.keys(previewErrors).length"
        flat
        no-caps
        label="Recarregar prévias"
        @click="load"
      />
    </resource-state>
  </section>
</template>
<script setup>
import { ref, onScopeDispose } from "vue";
import ResourceState from "src/system/components/finance/ResourceState.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import {
  getClientAssetDocuments,
  getClientAssetDocumentUrl,
} from "src/services/clientAssetsService";
import {
  captureClientSession,
  assertClientSessionCurrent,
} from "src/services/clientApi";
const props = defineProps({ assetId: { type: String, required: true } });
const resource = useFinanceResource(),
  previews = ref({}),
  previewErrors = ref({}),
  viewing = ref(null),
  viewError = ref("");
let active = true,
  revision = 0;
const safeUrl = (result) => {
  if (!/^https?:\/\//i.test(result?.url || "")) throw Error("URL indisponível");
  return result.url;
};
async function load() {
  const version = ++revision,
    session = captureClientSession();
  previews.value = {};
  previewErrors.value = {};
  const docs = await resource.load(() =>
    getClientAssetDocuments(props.assetId),
  );
  if (!active || version !== revision || !docs) return;
  await Promise.all(
    docs
      .filter((doc) =>
        /^image\/(png|jpeg|webp|gif)$/i.test(doc.contentType || ""),
      )
      .map(async (doc) => {
        try {
          const result = await getClientAssetDocumentUrl(
            props.assetId,
            doc.documentId,
          );
          assertClientSessionCurrent(session);
          if (active && version === revision)
            previews.value[doc.documentId] = safeUrl(result);
        } catch {
          if (active && version === revision)
            previewErrors.value[doc.documentId] = true;
        }
      }),
  );
}
async function view(doc) {
  if (viewing.value) return;
  const session = captureClientSession();
  viewing.value = doc.documentId;
  viewError.value = "";
  try {
    const result = await getClientAssetDocumentUrl(
      props.assetId,
      doc.documentId,
    );
    assertClientSessionCurrent(session);
    if (active) window.open(safeUrl(result), "_blank", "noopener,noreferrer");
  } catch {
    if (active)
      viewError.value = "Não foi possível abrir o documento. Tente novamente.";
  } finally {
    if (active) viewing.value = null;
  }
}
onScopeDispose(() => {
  active = false;
  revision++;
  resource.reset();
  previews.value = {};
});
load();
</script>
<style scoped>
.asset-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.asset-attachment {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 144px;
  max-width: 100%;
}
.asset-preview {
  width: 100%;
  height: 104px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
}
.asset-filename {
  overflow-wrap: anywhere;
  font-size: 12px;
}
</style>
