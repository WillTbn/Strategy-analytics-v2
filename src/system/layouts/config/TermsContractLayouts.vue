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
  downloadProfileTermDocument,
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
let active = true,
  contractsRevision = 0,
  termsRevision = 0,
  pendingTab = null;
onScopeDispose(() => {
  active = false;
  contractsRevision++;
  termsRevision++;
  pendingTab?.close();
  pendingTab = null;
  downloading.value = null;
});
async function loadContracts() {
  const session = captureClientSession(),
    revision = ++contractsRevision;
  const current = () =>
    active && revision === contractsRevision && isClientSessionCurrent(session);
  contracts.loading = true;
  contracts.error = "";
  contracts.items = [];
  try {
    let page = 1,
      all = [];
    while (true) {
      const result = collection(await listProfileContracts(page));
      assertClientSessionCurrent(session);
      if (!current()) return;
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
    if (!current()) return;
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
    if (current())
      contracts.error = getApiErrorMessage(
        e,
        "Não foi possível carregar os documentos dos contratos.",
      );
  } finally {
    if (current()) contracts.loading = false;
  }
}
async function loadTerms() {
  const session = captureClientSession(),
    revision = ++termsRevision;
  const current = () =>
    active && revision === termsRevision && isClientSessionCurrent(session);
  terms.loading = true;
  terms.error = "";
  terms.items = [];
  try {
    const result = await listProfileTerms();
    if (!current()) return;
    terms.error = result?.partialError || "";
    terms.items = collection(result?.items).map((t) => ({
      key: t.versionId || t.code,
      name: t.content?.title || t.code,
      content: t.content,
      profileDocumentId: t.documentId,
      downloadable: Boolean(
        t.documentId || t.content?.documentUri || t.content?.body,
      ),
    }));
  } catch (e) {
    if (current())
      terms.error = getApiErrorMessage(
        e,
        "Não foi possível carregar os termos.",
      );
  } finally {
    if (current()) terms.loading = false;
  }
}
async function download(item) {
  if (!active || downloading.value || !item.downloadable) return;
  const session = captureClientSession();
  downloading.value = item.key;
  let tab = null;
  try {
    if (item.profileDocumentId) {
      const response = await downloadProfileTermDocument(
        item.profileDocumentId,
      );
      assertClientSessionCurrent(session);
      if (!active) return;
      const url = URL.createObjectURL(response.data),
        link = document.createElement("a");
      link.href = url;
      link.download = item.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else if (item.contractId || item.content?.documentUri) {
      // Reserve the tab during the click, while the browser still permits it.
      tab = window.open("", "_blank");
      if (!tab)
        throw new Error("Permita a abertura de novas abas e tente novamente.");
      tab.opener = null;
      const referrer = tab.document.createElement("meta");
      referrer.name = "referrer";
      referrer.content = "no-referrer";
      tab.document.head.appendChild(referrer);
      pendingTab = tab;
      const value = item.contractId
        ? await getProfileContractDocumentUrl(item.contractId, item.documentId)
        : { url: item.content.documentUri };
      assertClientSessionCurrent(session);
      if (!active) {
        tab.close();
        return;
      }
      const url = new URL(value.url);
      if (
        url.protocol !== "https:" &&
        !(url.protocol === "http:" && url.origin === window.location.origin)
      )
        throw new Error("O documento não possui um endereço válido.");
      if (tab.closed) throw new Error("Não foi possível baixar o documento.");
      // Navigate from the reserved tab so its no-referrer policy is honored.
      const link = tab.document.createElement("a");
      link.href = url.href;
      link.rel = "noopener noreferrer";
      link.referrerPolicy = "no-referrer";
      link.hidden = true;
      tab.document.body.appendChild(link);
      link.click();
      // An opened file belongs to the user; leaving closes only pending tabs.
      if (pendingTab === tab) pendingTab = null;
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
    tab?.close();
    if (active && isClientSessionCurrent(session))
      errorNotify(
        getApiErrorMessage(e, "Não foi possível baixar o documento."),
      );
  } finally {
    if (pendingTab === tab) pendingTab = null;
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
