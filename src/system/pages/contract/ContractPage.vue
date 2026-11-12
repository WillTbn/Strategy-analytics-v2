<template>
  <q-page class="q-pa-md"
    ><title-page title="Meu contrato" to-back />
    <section class="tool q-pa-lg q-mb-lg">
      <resource-state :state="detail.state" @retry="loadDetail"
        ><template v-if="detail.state.data"
          ><h2 class="text-h6">
            {{ detail.state.data.name || detail.state.data.publicCode }}
          </h2>
          <p>
            {{ detail.state.data.publicCode }} ·
            {{ detail.state.data.businessStatus?.name }}
          </p>
          <dl class="contract-facts">
            <dt>Início</dt>
            <dd>{{ dateLabel(detail.state.data.startDate) }}</dd>
            <dt>Término previsto</dt>
            <dd>{{ dateLabel(detail.state.data.expectedEndDate) }}</dd>
            <dt>Minha participação</dt>
            <dd>
              {{
                money(
                  detail.state.data.myParticipation?.allocatedAmount,
                  detail.state.data.currency?.isoCode,
                )
              }}
            </dd>
            <dt>Posição atual</dt>
            <dd>{{ metric(detail.state.data.currentPosition) }}</dd>
            <dt>Resultado</dt>
            <dd>{{ metric(detail.state.data.result) }}</dd>
          </dl></template
        ></resource-state
      >
    </section>
    <section class="tool q-pa-lg q-mb-lg">
      <h2 class="text-h6">Documentos liberados</h2>
      <q-banner v-if="error" role="alert">{{ error }}</q-banner
      ><resource-state :state="documents.state" @retry="loadDocuments"
        ><q-list separator
          ><q-item v-for="d in documents.state.data || []" :key="d.documentId"
            ><q-item-section
              >{{ d.fileName
              }}<q-item-label caption>{{
                d.documentTypeName
              }}</q-item-label></q-item-section
            ><q-item-section side
              ><q-btn
                flat
                no-caps
                label="Abrir"
                :loading="opening === d.documentId"
                :disable="!!opening"
                @click="openDocument(d.documentId)" /></q-item-section></q-item
          ><q-item v-if="!documents.state.data?.length"
            ><q-item-section>Nenhum documento liberado.</q-item-section></q-item
          ></q-list
        ></resource-state
      >
    </section>
    <section class="tool q-pa-lg">
      <h2 class="text-h6">Histórico</h2>
      <resource-state :state="history.state" @retry="loadHistory"
        ><q-table
          flat
          class="bg-transparent"
          :rows="history.state.data || []"
          :columns="historyColumns"
          row-key="id"
          no-data-label="Nenhum evento disponível"
          rows-per-page-label="Itens por página:"
          :pagination-label="
            (first, last, total) => first + '–' + last + ' de ' + total
          "
      /></resource-state>
    </section>
  </q-page>
</template>
<script setup>
import { onScopeDispose, ref, watch } from "vue";
import { useRoute } from "vue-router";
import TitlePage from "../../components/TitlePage.vue";
import ResourceState from "../../components/finance/ResourceState.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import {
  financeGet,
  financeLabel,
  money,
  columns,
  dateLabel,
} from "src/services/financeService";
import {
  captureClientSession,
  isClientSessionCurrent,
} from "src/services/clientApi";
const route = useRoute(),
  detail = useFinanceResource(),
  documents = useFinanceResource(),
  history = useFinanceResource(),
  opening = ref(null),
  error = ref("");
const metric = (value) =>
  value?.calculationStatus === "Available"
    ? money(value.value, detail.state.data?.currency?.isoCode)
    : "Indisponível";
let active = true,
  viewRevision = 0,
  openingRevision = 0,
  pendingTab = null;
const viewIsCurrent = (revision, session, contractId) =>
  active &&
  route.name === "contract" &&
  revision === viewRevision &&
  contractId === route.params.id &&
  isClientSessionCurrent(session);
const loadSection = (resource, suffix = "") => {
  if (!active || route.name !== "contract" || !route.params.id)
    return Promise.resolve(null);
  const contractId = route.params.id,
    revision = viewRevision,
    session = captureClientSession();
  return resource.load(async () => {
    try {
      const result = await financeGet(
        "client/contracts/" + contractId + suffix,
      );
      return viewIsCurrent(revision, session, contractId) ? result.data : null;
    } catch (error) {
      if (viewIsCurrent(revision, session, contractId)) throw error;
      return null;
    }
  });
};
const loadDetail = () => loadSection(detail);
const loadDocuments = () => loadSection(documents, "/documents");
const loadHistory = () => loadSection(history, "/history");
const resetView = () => {
  viewRevision++;
  openingRevision++;
  pendingTab?.close();
  pendingTab = null;
  opening.value = null;
  error.value = "";
  for (const resource of [detail, documents, history]) resource.reset();
};
onScopeDispose(() => {
  active = false;
  resetView();
});
const historyColumns = columns([
  ["occurredAtUtc", "Data", (r) => dateLabel(r.occurredAtUtc)],
  ["eventType", "Evento", (row) => financeLabel(row.eventType)],
  ["statusName", "Status", (row) => financeLabel(row.statusName)],
]);
async function openDocument(id) {
  if (
    !active ||
    opening.value ||
    !documents.state.data?.some((document) => document.documentId === id)
  )
    return;
  const contractId = route.params.id,
    revision = viewRevision,
    session = captureClientSession(),
    attempt = ++openingRevision;
  const current = () =>
    attempt === openingRevision && viewIsCurrent(revision, session, contractId);
  opening.value = id;
  error.value = "";
  const tab = window.open("", "_blank");
  if (!tab) {
    error.value = "Permita a abertura de novas abas e tente novamente.";
    opening.value = null;
    return;
  }
  tab.opener = null;
  pendingTab = tab;
  try {
    const result = await financeGet(
      "client/contracts/" + contractId + "/documents/" + id + "/temporary-url",
    );
    if (!current()) {
      tab.close();
      return;
    }
    const url = new URL(result.data.url);
    if (url.protocol !== "https:" || tab.closed)
      throw new Error("URL indisponível");
    tab.location.replace(url.href);
    // Leave successfully opened documents with the user; close only pending tabs.
    if (pendingTab === tab) pendingTab = null;
  } catch {
    tab.close();
    if (current())
      error.value = "Não foi possível abrir o documento. Tente novamente.";
  } finally {
    if (pendingTab === tab) pendingTab = null;
    if (attempt === openingRevision) opening.value = null;
  }
}
watch(
  () => [route.name, route.params.id],
  ([name, id]) => {
    resetView();
    if (name !== "contract" || !id) return;
    loadDetail();
    loadDocuments();
    loadHistory();
  },
  { immediate: true, flush: "sync" },
);
</script>
<style scoped>
.contract-facts {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) 2fr;
  gap: 16px;
}
.contract-facts dd {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
