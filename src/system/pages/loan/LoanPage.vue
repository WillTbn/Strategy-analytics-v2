<template>
  <q-page class="q-pa-lg">
    <title-page title="Empréstimo" :to-back="true" />
    <resource-state :state="detail.state" @retry="loadDetail">
      <active-loans-section
        v-if="detail.state.data"
        :title="detail.state.data.publicCode"
        :interest="
          detail.state.data.interestRatePercent == null
            ? ''
            : String(detail.state.data.interestRatePercent) + '%'
        "
        :type-description="financeLabel(detail.state.data.kind)"
        :is-active="true"
        detail
      >
        <p>Status: {{ loanProcessLabel(detail.state.data.status) }}</p>
        <p class="text-grey">
          Parcelas e pagamentos indisponíveis para consulta.
        </p>
      </active-loans-section>
      <p v-else class="text-grey">Empréstimo indisponível.</p>
    </resource-state>
    <section class="tool q-pa-lg q-mb-lg">
      <h2 class="text-h6">Documentos liberados</h2>
      <q-banner v-if="error" role="alert">{{ error }}</q-banner>
      <resource-state :state="documents.state" @retry="loadDocuments">
        <q-list separator>
          <q-item v-for="d in documents.state.data || []" :key="d.documentId">
            <q-item-section
              >{{ d.fileName
              }}<q-item-label caption>{{
                d.documentTypeName
              }}</q-item-label></q-item-section
            >
            <q-item-section side
              ><q-btn
                flat
                no-caps
                label="Abrir"
                :loading="opening === d.documentId"
                :disable="!!opening"
                @click="openDocument(d.documentId)"
            /></q-item-section>
          </q-item>
          <q-item v-if="!documents.state.data?.length"
            ><q-item-section>Nenhum documento liberado.</q-item-section></q-item
          >
        </q-list>
      </resource-state>
    </section>
    <section class="tool q-pa-lg">
      <h2 class="text-h6">Histórico</h2>
      <resource-state :state="history.state" @retry="loadHistory">
        <q-table
          flat
          class="bg-transparent"
          :rows="historyRows"
          :columns="historyColumns"
          row-key="rowKey"
          no-data-label="Nenhum evento disponível"
          rows-per-page-label="Itens por página:"
          :pagination-label="
            (first, last, total) => first + '–' + last + ' de ' + total
          "
        />
      </resource-state>
    </section>
  </q-page>
</template>
<script setup>
import { computed, onScopeDispose, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { loanProcessLabel } from "src/services/loanSummaryPresentation";
import TitlePage from "../../components/TitlePage.vue";
import ActiveLoansSection from "src/system/components/leverage/ActiveLoansSection.vue";
import ResourceState from "../../components/finance/ResourceState.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import {
  financeGet,
  financeLabel,
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
let active = true,
  viewRevision = 0,
  openingRevision = 0,
  pendingTab = null;
const viewIsCurrent = (revision, session, loanId) =>
  active &&
  route.name === "Empréstimos" &&
  revision === viewRevision &&
  loanId === route.query.hash &&
  isClientSessionCurrent(session);
const loadSection = (resource, suffix = "") => {
  if (!active || route.name !== "Empréstimos" || !route.query.hash)
    return Promise.resolve(null);
  const loanId = route.query.hash,
    revision = viewRevision,
    session = captureClientSession();
  return resource.load(async () => {
    try {
      const result = await financeGet("client/loans/" + loanId + suffix);
      return viewIsCurrent(revision, session, loanId) ? result.data : null;
    } catch (error) {
      if (viewIsCurrent(revision, session, loanId)) throw error;
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
  ["event", "Evento", (row) => financeLabel(row.event)],
  [
    "fromStatus",
    "Status anterior",
    (row) => (row.fromStatus ? loanProcessLabel(row.fromStatus) : "—"),
  ],
  [
    "toStatus",
    "Status atual",
    (row) => (row.toStatus ? loanProcessLabel(row.toStatus) : "—"),
  ],
]);
async function openDocument(id) {
  if (
    !active ||
    opening.value ||
    !documents.state.data?.some((document) => document.documentId === id)
  )
    return;
  const loanId = route.query.hash,
    revision = viewRevision,
    session = captureClientSession(),
    attempt = ++openingRevision;
  const current = () =>
    attempt === openingRevision && viewIsCurrent(revision, session, loanId);
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
      "client/loans/" + loanId + "/documents/" + id + "/temporary-url",
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
  () => [route.name, route.query.hash],
  ([name, id]) => {
    resetView();
    if (
      name !== "Empréstimos" ||
      typeof id !== "string" ||
      !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)
    )
      return;
    loadDetail();
    loadDocuments();
    loadHistory();
  },
  { immediate: true, flush: "sync" },
);

const historyRows = computed(() =>
  (history.state.data || []).map((row, index) => ({ ...row, rowKey: index })),
);
</script>
