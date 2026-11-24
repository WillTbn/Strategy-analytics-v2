<template>
  <section class="detail-panel detail-charts">
    <h2>Análise Gráfica</h2>
    <div class="detail-chart-wrapper">
      <h3>Performance do Contrato</h3>
      <div class="detail-chart-surface">
        <div class="detail-chart-controls">
          <q-toggle
            v-model="absolute"
            label="Absoluto"
            dense
            :disable="!canChangeUnit"
          />
          <div
            class="detail-periods"
            role="group"
            aria-label="Período do contrato"
          >
            <q-btn
              v-for="p in periods"
              :key="p"
              flat
              dense
              no-caps
              :label="p"
              :aria-pressed="period === p"
              :class="{ selected: period === p }"
              :disable="!hasSeries"
              @click="period = p"
            />
          </div>
          <q-toggle
            v-model="compare"
            label="Comparar Contrato"
            dense
            :disable="!canCompare"
          />
        </div>
        <apexchart
          v-if="hasSeries"
          type="area"
          height="243"
          :options="lineOptions"
          :series="visibleSeries"
        />
        <p v-else class="detail-unavailable" role="status">
          Performance do contrato indisponível
        </p>
      </div>
    </div>
    <div class="detail-chart-wrapper">
      <h3>{{ mode === "bars" ? "Distribuição" : "Distribuição Atual" }}</h3>
      <div v-if="mode === 'bars'" class="detail-chart-surface">
        <apexchart
          v-if="barsReady"
          type="bar"
          height="232"
          :options="barOptions"
          :series="distribution.bars.series"
        />
        <p v-else class="detail-unavailable" role="status">
          Distribuição indisponível
        </p>
      </div>
      <div v-else class="detail-compositions">
        <article
          v-for="(card, index) in compositionCards"
          :key="card.key"
          class="detail-composition"
        >
          <header>
            <h3>{{ card.title }}</h3>
            <div
              v-if="card.options"
              class="detail-segments"
              :aria-label="card.title + ' ' + (index + 1)"
              role="group"
            >
              <q-btn
                v-for="(option, j) in card.options"
                :key="option"
                flat
                dense
                no-caps
                :aria-pressed="selection[card.key] === j"
                :class="{ selected: selection[card.key] === j }"
                @click="selection[card.key] = j"
                ><img :src="segmentIcon(card, j)" alt="" />{{ option }}</q-btn
              >
            </div>
          </header>
          <div v-if="compositionReady(card)" class="detail-donut-content">
            <apexchart
              type="donut"
              width="178"
              height="178"
              :options="donutOptions(card)"
              :series="compositionRows(card).map((r) => Number(r.value))"
            />
            <ul class="detail-composition-legend">
              <li v-for="(row, i) in compositionRows(card)" :key="row.label">
                <span
                  ><i :style="{ background: colors[i % colors.length] }" />{{
                    row.label
                  }}</span
                ><strong>{{ percent(row.value) }}</strong>
              </li>
            </ul>
          </div>
          <p v-else class="detail-unavailable" role="status">
            {{ card.title }} indisponível
          </p>
        </article>
      </div>
    </div>
    <slot />
  </section>
</template>
<script setup>
import { computed, reactive, ref, watch } from "vue";
import Apexchart from "vue3-apexcharts";
import chartLocale from "apexcharts/dist/locales/pt-br.json";
import { contractSeriesPeriod } from "src/services/contractDirectory";
import {
  detailAssets as assets,
  detailColors as colors,
  detailSeriesReady,
  validDetailComposition,
  detailPercent as percent,
  detailNumber,
} from "src/services/contractDetailPresentation";
const props = defineProps({
  performance: Object,
  distribution: Object,
  mode: { type: String, default: "donuts" },
});
const period = ref("Máximo"),
  absolute = ref(true),
  compare = ref(false);
const selection = reactive({
  markets: 0,
  currencies: 0,
  networks: 1,
  crypto: 1,
});
const compositionCards = [
  {
    key: "markets",
    source: "markets",
    title: "Mercados",
    options: ["Bolsas", "Redes"],
  },
  {
    key: "currencies",
    source: "currencies",
    title: "Moedas",
    options: ["Fiduciárias", "Criptoativos"],
  },
  { key: "allocation", source: "allocation", title: "Alocação" },
  {
    key: "networks",
    source: "markets",
    title: "Mercados",
    options: ["Bolsas", "Redes"],
  },
  {
    key: "crypto",
    source: "currencies",
    title: "Moedas",
    options: ["Fiduciárias", "Criptoativos"],
  },
  { key: "allocation2", source: "allocation", title: "Alocação" },
];
const unit = computed(() => (absolute.value ? "absolute" : "percent"));
const series = computed(() => props.performance?.[unit.value]);
const hasSeries = computed(() => detailSeriesReady(series.value));
const canChangeUnit = computed(
  () =>
    detailSeriesReady(props.performance?.absolute) &&
    detailSeriesReady(props.performance?.percent),
);
const comparison = computed(() => props.performance?.comparison?.[unit.value]);
const canCompare = computed(
  () => hasSeries.value && detailSeriesReady(comparison.value),
);
const visibleSeries = computed(() =>
  contractSeriesPeriod(
    compare.value && canCompare.value
      ? [...series.value, ...comparison.value]
      : series.value,
    period.value,
  ),
);
const periods = computed(() => [
  hasSeries.value
    ? String(
        new Date(
          Math.max(...series.value.flatMap((s) => s.data.map((p) => p.x))),
        ).getUTCFullYear(),
      )
    : String(new Date().getFullYear()),
  "1M",
  "6M",
  "12M",
  "Máximo",
]);
watch(
  () => props.performance,
  () => {
    period.value = "Máximo";
    compare.value = false;
    absolute.value =
      detailSeriesReady(props.performance?.absolute) ||
      !detailSeriesReady(props.performance?.percent);
  },
  { immediate: true },
);
const base = {
  theme: { mode: "dark" },
  colors: ["#00a3ff", "#00f5d9", "#7438ff"],
  chart: {
    locales: [chartLocale],
    defaultLocale: "pt-br",
    background: "transparent",
    toolbar: { show: false },
    animations: { enabled: false },
    zoom: { enabled: false },
  },
  dataLabels: { enabled: false },
  legend: { show: false },
  grid: { borderColor: "#ffffff1f" },
  stroke: { width: 2 },
  tooltip: { theme: "dark" },
};
const lineOptions = computed(() => ({
  ...base,
  chart: { ...base.chart, id: "contract-detail-performance" },
  xaxis: { type: "datetime" },
  yaxis: {
    opposite: true,
    labels: {
      formatter: (v) =>
        absolute.value
          ? new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v)
          : percent(v),
    },
  },
  fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0 } },
}));
function segmentIcon(card, index) {
  const keys =
    card.source === "currencies"
      ? selection[card.key] === 0
        ? ["fiatPackage", "fiatInvoice"]
        : ["cryptoPackage", "cryptoInvoice"]
      : selection[card.key] === 0
        ? ["package", "invoice"]
        : ["networksPackage", "networksInvoice"];
  return assets[keys[index]];
}
function compositionRows(card) {
  const data = props.distribution?.[card.source];
  return card.options ? data?.[selection[card.key]] : data;
}
function compositionReady(card) {
  return validDetailComposition(compositionRows(card));
}
function donutOptions(card) {
  return {
    ...base,
    colors,
    labels: compositionRows(card).map((r) => r.label),
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: card.options?.[selection[card.key]] || card.title,
              formatter: () => "",
            },
          },
        },
      },
    },
    grid: { padding: { top: 0, right: 0, bottom: 0, left: 0 } },
    tooltip: { y: { formatter: percent } },
  };
}
const barsReady = computed(
  () =>
    Array.isArray(props.distribution?.bars?.categories) &&
    props.distribution.bars.categories.length > 0 &&
    Array.isArray(props.distribution.bars.series) &&
    props.distribution.bars.series.length > 0 &&
    props.distribution.bars.series.every(
      (s) =>
        typeof s.name === "string" &&
        s.data?.length === props.distribution.bars.categories.length &&
        s.data.every((v) => detailNumber(v) !== null && Number(v) >= 0),
    ) &&
    props.distribution.bars.categories.every(
      (_, i) =>
        Math.abs(
          props.distribution.bars.series.reduce(
            (a, s) => a + Number(s.data[i]),
            0,
          ) - 100,
        ) < 0.02,
    ),
);
const barOptions = computed(() => ({
  ...base,
  chart: { ...base.chart, stacked: true, stackType: "100%" },
  plotOptions: { bar: { horizontal: true, barHeight: "18px" } },
  xaxis: {
    categories: props.distribution?.bars?.categories || [],
    min: 0,
    max: 100,
    labels: { formatter: percent },
  },
  legend: {
    show: true,
    position: "top",
    horizontalAlign: "right",
    labels: { colors: "#989898" },
  },
  stroke: { width: 0 },
}));
</script>
