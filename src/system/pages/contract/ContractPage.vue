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
      /></resource-state>
    </section>
  </q-page>
</template>
<script setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import TitlePage from "../../components/TitlePage.vue";
import ResourceState from "../../components/finance/ResourceState.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import {
  financeGet,
  money,
  columns,
  dateLabel,
} from "src/services/financeService";
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
const loadDetail = () =>
  detail.load(
    async () => (await financeGet(`client/contracts/${route.params.id}`)).data,
  );
const loadDocuments = () =>
  documents.load(
    async () =>
      (await financeGet(`client/contracts/${route.params.id}/documents`)).data,
  );
const loadHistory = () =>
  history.load(
    async () =>
      (await financeGet(`client/contracts/${route.params.id}/history`)).data,
  );
const historyColumns = columns([
  ["occurredAtUtc", "Data", (r) => dateLabel(r.occurredAtUtc)],
  ["eventType", "Evento"],
  ["statusName", "Status"],
]);
async function openDocument(id) {
  opening.value = id;
  error.value = "";
  const tab = window.open("", "_blank");
  if (tab) tab.opener = null;
  try {
    const result = await financeGet(
      `client/contracts/${route.params.id}/documents/${id}/temporary-url`,
    );
    const url = new URL(result.data.url);
    if (url.protocol !== "https:") throw new Error("URL inválida");
    if (tab) tab.location.replace(url.href);
    else {
      error.value = "Permita a abertura de novas abas e tente novamente.";
    }
  } catch {
    tab?.close();
    error.value = "Não foi possível abrir o documento. Tente novamente.";
  } finally {
    opening.value = null;
  }
}
watch(
  () => route.params.id,
  () => {
    loadDetail();
    loadDocuments();
    loadHistory();
  },
  { immediate: true },
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
