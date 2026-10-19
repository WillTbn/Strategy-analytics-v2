<template>
  <div class="terms-layouts">
    <q-card v-for="section in sections" :key="section.key" class="tool q-mb-lg">
      <p class="text-weight-bold">{{ section.title }}</p>
      <div v-if="section.loading" class="q-py-md" role="status">
        <q-spinner color="primary" /> Carregando...
      </div>
      <div v-if="section.error" role="alert" class="text-negative q-my-sm">
        {{ section.error }}
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          label="Tentar novamente"
          @click="section.load"
        />
      </div>
      <p
        v-if="!section.loading && !section.error && !section.items.length"
        class="text-grey"
      >
        Nenhum documento disponível.
      </p>
      <div class="documents-grid">
        <div
          v-for="item in section.items"
          :key="item.key"
          class="document-item"
        >
          <q-icon name="description" color="primary" size="24px" />
          <span class="document-name">{{ item.name }}</span>
          <q-btn
            flat
            round
            dense
            icon="download"
            :aria-label="'Baixar ' + item.name"
            :loading="downloading === item.key"
            :disable="Boolean(downloading) || !item.downloadable"
            @click="download(item)"
          />
        </div>
      </div>
    </q-card>
  </div>
</template>
<script setup>
import { computed, onScopeDispose, reactive, ref } from "vue";
import {
  listProfileContracts,
  listProfileContractDocuments,
  getProfileContractDocumentUrl,
  listProfileTerms,
} from "src/services/profileDocumentsService";
import { collection } from "src/services/profilePresentation";
import { getApiErrorMessage } from "src/services/clientAuthService";
import {
  captureClientSession,
  isClientSessionCurrent,
  assertClientSessionCurrent,
} from "src/services/clientApi";
import useNotify from "src/composables/useNotify";
const contracts = reactive({
  key: "contracts",
  title: "Contratos",
  loading: false,
  error: "",
  items: [],
  load: loadContracts,
});
const terms = reactive({
  key: "terms",
  title: "Termos",
  loading: false,
  error: "",
  items: [],
  load: loadTerms,
});
const sections = computed(() => [contracts, terms]),
  downloading = ref(null);
const { errorNotify } = useNotify();
let active = true;
onScopeDispose(() => {
  active = false;
});
async function loadContracts() {
  const session = captureClientSession();
  contracts.loading = true;
  contracts.error = "";
  contracts.items = [];
  try {
    let page = 1,
      all = [];
    while (true) {
      const result = collection(await listProfileContracts(page));
      assertClientSessionCurrent(session);
      if (!active) return;
      all.push(...result);
      if (result.length < 100) break;
      page++;
    }
    const results = await Promise.allSettled(
      all.map(async (contract) => ({
        contract,
        documents: collection(await listProfileContractDocuments(contract.id)),
      })),
    );
    if (!active || !isClientSessionCurrent(session)) return;
    contracts.items = results
      .filter((r) => r.status === "fulfilled")
      .flatMap(({ value: { contract, documents } }) =>
        documents.map((d) => ({
          key: contract.id + ":" + d.documentId,
          name: [contract.name, d.documentTypeName || d.fileName]
            .filter(Boolean)
            .join(" · "),
          contractId: contract.id,
          documentId: d.documentId,
          downloadable: true,
        })),
      );
    if (results.some((r) => r.status === "rejected"))
      contracts.error =
        "Não foi possível carregar os documentos de todos os contratos.";
  } catch (e) {
    if (active && isClientSessionCurrent(session))
      contracts.error = getApiErrorMessage(
        e,
        "Não foi possível carregar os documentos dos contratos.",
      );
  } finally {
    if (active) contracts.loading = false;
  }
}
async function loadTerms() {
  const session = captureClientSession();
  terms.loading = true;
  terms.error = "";
  terms.items = [];
  try {
    const result = await listProfileTerms();
    if (!active || !isClientSessionCurrent(session)) return;
    terms.items = collection(result?.items).map((t) => ({
      key: t.versionId || t.code,
      name: t.content?.title || t.code,
      content: t.content,
      downloadable: Boolean(t.content?.documentUri || t.content?.body),
    }));
  } catch (e) {
    if (active && isClientSessionCurrent(session))
      terms.error = getApiErrorMessage(
        e,
        "Não foi possível carregar os termos.",
      );
  } finally {
    if (active) terms.loading = false;
  }
}
async function download(item) {
  if (downloading.value) return;
  const session = captureClientSession();
  downloading.value = item.key;
  try {
    if (item.contractId || item.content?.documentUri) {
      const value = item.contractId
        ? await getProfileContractDocumentUrl(item.contractId, item.documentId)
        : { url: item.content.documentUri };
      assertClientSessionCurrent(session);
      if (!active) return;
      const url = new URL(value.url);
      if (
        url.protocol !== "https:" &&
        !(url.protocol === "http:" && url.origin === window.location.origin)
      )
        throw new Error("O documento não possui um endereço válido.");
      window.open(url.href, "_blank", "noopener,noreferrer");
    } else if (item.content?.body) {
      const blob = new Blob([item.content.body], {
          type: "text/plain;charset=utf-8",
        }),
        url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = item.name + ".txt";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } catch (e) {
    if (active && isClientSessionCurrent(session))
      errorNotify(
        getApiErrorMessage(e, "Não foi possível baixar o documento."),
      );
  } finally {
    downloading.value = null;
  }
}
loadContracts();
loadTerms();
</script>
<style scoped>
.documents-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 24px;
}
.document-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(239, 239, 239, 0.08);
  border-radius: 8px;
  min-width: 0;
}
.document-name {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
@media (max-width: 1000px) {
  .documents-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .documents-grid {
    grid-template-columns: 1fr;
  }
}
</style>
