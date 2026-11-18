<template>
  <div class="contract-directory">
    <section class="contract-directory-section">
      <h2>Visão Geral</h2>
      <div class="contract-directory-stats">
        <article
          v-for="(item, index) in overviewCards"
          :key="item.label"
          class="contract-stat"
        >
          <header>
            <img :src="summaryIcons[index]" alt="" /><span>{{
              item.label
            }}</span>
          </header>
          <div class="contract-stat-values">
            <strong
              >{{ item.value
              }}<span
                v-if="item.change"
                :class="{ 'contract-yield-negative': item.negative }"
                class="contract-yield-change"
              >
                {{ item.change }}</span
              ></strong
            ><span v-if="item.detail" class="contract-stat-detail">{{
              item.detail
            }}</span>
          </div>
        </article>
      </div>
      <p
        v-if="overviewState.error"
        role="alert"
        class="contract-directory-error"
      >
        {{ overviewState.error }}
        <q-btn
          flat
          dense
          no-caps
          label="Tentar novamente"
          @click="$emit('retry-overview')"
        />
      </p>
    </section>
    <contract-performance-panel
      :evolution="performance?.evolution"
      :composition="performance?.composition"
      :dividends="performance?.dividends"
    />
    <section
      ref="listSection"
      class="contract-directory-section contract-directory-list"
    >
      <h2>Seus Contratos</h2>
      <contract-opportunity @open="openRequest" />
      <resource-state :state="listState" @retry="$emit('retry-list')"
        ><div
          v-if="rows.length"
          class="contract-directory-scroll"
          aria-label="Seus contratos"
          tabindex="0"
        >
          <article
            v-for="row in rows"
            :key="row.id"
            class="contract-directory-row"
          >
            <div class="contract-directory-row-main">
              <header>
                <img :src="rowAssets.imgFileDollar" alt="" />
                <h3>{{ row.name }}</h3>
                <span
                  v-for="tag in row.tags"
                  :key="tag"
                  class="contract-directory-tag"
                  >{{ tag }}</span
                >
              </header>
              <dl>
                <div>
                  <dt>Valor de Contrato Inicial</dt>
                  <dd>{{ contractMoney(row.initial, row.currency) }}</dd>
                </div>
                <div>
                  <dt>Valor Base</dt>
                  <dd>{{ contractMoney(row.base, row.currency) }}</dd>
                </div>
                <div>
                  <dt>Valor de Contrato Atual</dt>
                  <dd>{{ contractMoney(row.current, row.currency) }}</dd>
                </div>
                <div>
                  <dt>Próxima Distrib. de Lucros</dt>
                  <dd>
                    {{ contractMoney(row.next, row.currency)
                    }}<span v-if="row.nextDate">
                      · {{ dateLabel(row.nextDate) }}</span
                    >
                  </dd>
                </div>
                <div>
                  <dt>Moeda Firmada</dt>
                  <dd class="contract-currency">
                    {{ currencyName(row.currency) }}
                  </dd>
                </div>
              </dl>
            </div>
            <div class="contract-row-chart">
              <apexchart
                v-if="validContractSeries(performance?.contracts?.[row.id])"
                type="area"
                height="118"
                width="100%"
                :options="miniOptions"
                :series="performance.contracts[row.id]"
              /><span v-else role="status">Evolução indisponível</span>
            </div>
            <q-btn
              outline
              no-caps
              :to="{ name: 'contract', params: { id: row.id } }"
              >Ver Contrato<img :src="rowAssets.imgExternalLink" alt=""
            /></q-btn>
          </article>
        </div>
        <p v-else class="contract-directory-empty" role="status">
          Nenhum contrato disponível.
        </p></resource-state
      >
    </section>
  </div>
</template>
<script setup>
import { computed, ref } from "vue";
import {
  contractDirectoryRow,
  contractOverview,
  contractMoney,
  finiteContractValue,
  validContractSeries,
} from "src/services/contractDirectory";
import { dateLabel } from "src/services/financeService";
import { contractDirectoryAssets } from "src/services/contractDirectoryAssets";
import ContractOpportunity from "./ContractOpportunity.vue";
import ContractPerformancePanel from "./ContractPerformancePanel.vue";
import Apexchart from "vue3-apexcharts";
import ResourceState from "../finance/ResourceState.vue";
const props = defineProps({
  listState: { type: Object, required: true },
  overviewState: { type: Object, required: true },
  performance: { type: Object, default: null },
  summary: { type: Object, default: null },
});
const emit = defineEmits(["request", "retry-list", "retry-overview"]),
  listSection = ref(null);
const rowAssets = contractDirectoryAssets["1:32971"],
  icons = contractDirectoryAssets["1:32537"],
  summaryIcons = [
    icons.imgFileInvoice,
    icons.imgReceipt2,
    icons.imgChartPie,
    icons.imgCalendarDollar,
  ];
const miniOptions = {
  theme: { mode: "dark" },
  colors: ["#00a3ff"],
  chart: {
    background: "transparent",
    animations: { enabled: false },
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  dataLabels: { enabled: false },
  stroke: { width: 2, curve: "straight" },
  fill: { type: "gradient", gradient: { opacityFrom: 0.2, opacityTo: 0 } },
  grid: { show: false },
  legend: { show: false },
  xaxis: {
    type: "datetime",
    labels: { style: { colors: "#989898", fontSize: "10px" } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    opposite: true,
    labels: { style: { colors: "#989898", fontSize: "10px" } },
  },
  tooltip: { theme: "dark" },
};
const rows = computed(() =>
  (props.listState.data || []).map(contractDirectoryRow),
);
const overview = computed(
  () =>
    props.summary ||
    contractOverview(
      props.listState.loading || props.listState.error
        ? null
        : props.listState.data,
      props.overviewState.data,
    ),
);
const overviewCards = computed(() => {
  const values = (
    Array.isArray(overview.value.applied) ? overview.value.applied : []
  ).map((v) => contractMoney(v.value, v.currency));
  return [
    {
      label: "Contratos Vigentes",
      value: props.listState.loading
        ? "…"
        : finiteContractValue(overview.value.active) === null
          ? "—"
          : overview.value.active + " ativos",
    },
    {
      label: "Saldo Aplicado em Contratos",
      value: props.overviewState.loading ? "…" : values[0] || "—",
      detail: values.slice(1).join(" · "),
    },
    {
      label: "Próxima Distribuição de Lucros",
      value: contractMoney(
        overview.value.nextDistribution?.value,
        overview.value.nextDistribution?.currency,
      ),
      detail: overview.value.nextDistribution?.date
        ? "Previsão: " + dateLabel(overview.value.nextDistribution.date)
        : "Previsão indisponível",
    },
    {
      label: "Rendimento dos últimos 12 meses",
      value: contractMoney(
        overview.value.yearYield?.value,
        overview.value.yearYield?.currency,
      ),
      change:
        finiteContractValue(overview.value.yearYield?.percentage) === null
          ? null
          : "(" +
            (Number(overview.value.yearYield.percentage) > 0 ? "+" : "") +
            new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(
              overview.value.yearYield.percentage,
            ) +
            "%)",
      negative: Number(overview.value.yearYield?.percentage) < 0,
    },
  ];
});
function currencyName(code) {
  if (!code) return "—";
  try {
    return (
      new Intl.DisplayNames(["pt-BR"], { type: "currency" }).of(code) +
      " (" +
      code +
      ")"
    );
  } catch {
    return code;
  }
}
function openRequest() {
  listSection.value?.scrollIntoView({ block: "start", behavior: "instant" });
  emit("request");
}
</script>
<style lang="scss" src="./contractDirectory.scss"></style>
