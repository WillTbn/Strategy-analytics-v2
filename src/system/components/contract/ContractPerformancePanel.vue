<template>
  <section class="contract-directory-section contract-directory-performance">
    <h2>Performance Geral</h2>
    <div class="contract-performance-chart">
      <div
        class="contract-periods"
        role="group"
        aria-label="Período da performance"
      >
        <q-btn
          v-for="option in periods"
          :key="option"
          flat
          dense
          no-caps
          :label="option"
          :disable="!hasEvolution"
          :aria-pressed="period === option"
          :class="{ selected: period === option }"
          @click="period = option"
        />
      </div>
      <div v-if="hasEvolution" class="contract-evolution">
        <apexchart
          type="area"
          height="240"
          :options="evolutionOptions"
          :series="periodSeries"
        />
        <div class="contract-series-legend">
          <article v-for="(s, index) in evolution" :key="s.name">
            <p><i :style="{ background: colors[index % 3] }" />{{ s.name }}</p>
            <div>
              <strong>{{ percent(s.periodReturn) }}</strong
              ><span>{{ percent(s.totalReturn) }}</span>
            </div>
          </article>
        </div>
      </div>
      <p v-else class="contract-chart-unavailable" role="status">
        Performance indisponível
      </p>
    </div>
    <div class="contract-performance-chart">
      <apexchart
        v-if="hasComposition"
        type="bar"
        height="260"
        :options="compositionOptions"
        :series="composition.series"
      />
      <p v-else class="contract-chart-unavailable" role="status">
        Composição por prazo indisponível
      </p>
    </div>
    <div class="contract-performance-chart">
      <div
        class="contract-periods"
        role="group"
        aria-label="Unidade do rendimento"
      >
        <q-btn
          v-for="option in ['Percentual', 'Absoluto']"
          :key="option"
          flat
          dense
          no-caps
          :label="option"
          :aria-pressed="unit === option"
          :class="{ selected: unit === option }"
          :disable="!validContractSeries(dividends?.[option])"
          @click="unit = option"
        />
      </div>
      <div v-if="hasDividends" class="contract-dividend-legend">
        <span
          ><i
            v-for="color in colors"
            :key="color"
            :style="{ background: color }"
          />Dividend Yield mensal</span
        ><span v-if="average !== null"
          ><i style="background: #ff991f" />Média</span
        >
      </div>
      <apexchart
        v-if="hasDividends"
        type="bar"
        height="240"
        :options="dividendOptions"
        :series="dividends[unit]"
      />
      <p v-else class="contract-chart-unavailable" role="status">
        Dividend Yield mensal indisponível
      </p>
    </div>
  </section>
</template>
<script setup>
import { computed, ref, watch } from "vue";
import Apexchart from "vue3-apexcharts";
import {
  validContractSeries,
  contractSeriesPeriod,
  finiteContractValue,
} from "src/services/contractDirectory";
const props = defineProps({
  evolution: { type: Array, default: null },
  composition: { type: Object, default: null },
  dividends: { type: Object, default: null },
});
const period = ref("Máximo"),
  unit = ref("Percentual"),
  colors = ["#00a3ff", "#00f5d9", "#7438ff"];
const hasEvolution = computed(() => validContractSeries(props.evolution));
const periods = computed(() => [
  hasEvolution.value
    ? String(
        new Date(
          Math.max(...props.evolution.flatMap((s) => s.data.map((p) => p.x))),
        ).getUTCFullYear(),
      )
    : String(new Date().getFullYear()),
  "1M",
  "6M",
  "12M",
  "Máximo",
]);
const periodSeries = computed(() =>
  contractSeriesPeriod(props.evolution, period.value),
);
const percent = (value) =>
  finiteContractValue(value) === null
    ? "—"
    : (Number(value) > 0 ? "+" : "") +
      new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(
        value,
      ) +
      "%";
const compact = (value) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(
    Math.abs(value) >= 1e6
      ? value / 1e6
      : Math.abs(value) >= 1e3
        ? value / 1e3
        : value,
  ) + (Math.abs(value) >= 1e6 ? "M" : Math.abs(value) >= 1e3 ? "k" : "");
const average = computed(() =>
  finiteContractValue(props.dividends?.averages?.[unit.value]),
);
const base = {
  theme: { mode: "dark" },
  colors,
  chart: {
    background: "transparent",
    toolbar: { show: false },
    animations: { enabled: false },
    zoom: { enabled: false },
  },
  dataLabels: { enabled: false },
  grid: { borderColor: "#ffffff22" },
  legend: {
    labels: { colors: "#989898" },
    markers: { size: 4, strokeWidth: 0 },
  },
  tooltip: { theme: "dark" },
  noData: { text: "Sem dados no período" },
};
const evolutionOptions = {
  ...base,
  stroke: { width: 3, curve: "straight" },
  fill: { type: "gradient", gradient: { opacityFrom: 0.25, opacityTo: 0 } },
  xaxis: { type: "datetime", labels: { style: { colors: "#989898" } } },
  yaxis: {
    opposite: true,
    labels: { formatter: compact, style: { colors: "#989898" } },
  },
  legend: { show: false },
};
const hasComposition = computed(
  () =>
    Array.isArray(props.composition?.categories) &&
    props.composition.categories.length > 0 &&
    Array.isArray(props.composition.series) &&
    props.composition.series.length > 0 &&
    props.composition.series.every(
      (s) =>
        typeof s.name === "string" &&
        Array.isArray(s.data) &&
        s.data.length === props.composition.categories.length &&
        s.data.every((v) => finiteContractValue(v) !== null && Number(v) >= 0),
    ),
);
const compositionOptions = computed(() => ({
  ...base,
  chart: { ...base.chart, stacked: true, stackType: "100%" },
  plotOptions: { bar: { horizontal: true, barHeight: "32%" } },
  xaxis: {
    categories: props.composition?.categories || [],
    labels: {
      formatter: (v) => Math.round(v) + "%",
      style: { colors: "#989898" },
    },
  },
  yaxis: { opposite: true, labels: { style: { colors: "#989898" } } },
  legend: { position: "top", horizontalAlign: "right" },
}));
const hasDividends = computed(() =>
  validContractSeries(props.dividends?.[unit.value]),
);
const dividendOptions = computed(() => ({
  ...base,
  chart: { ...base.chart, stacked: true },
  plotOptions: { bar: { columnWidth: "30%" } },
  xaxis: { type: "datetime", labels: { style: { colors: "#989898" } } },
  yaxis: {
    opposite: true,
    labels: {
      formatter: (v) =>
        new Intl.NumberFormat("pt-BR").format(v) +
        (unit.value === "Percentual" ? "%" : ""),
      style: { colors: "#989898" },
    },
  },
  annotations: {
    yaxis:
      average.value === null
        ? []
        : [{ y: average.value, borderColor: "#ff991f", strokeDashArray: 0 }],
  },
  legend: { show: false },
}));
watch(
  () => props.dividends,
  () => {
    if (!validContractSeries(props.dividends?.[unit.value]))
      unit.value = validContractSeries(props.dividends?.Percentual)
        ? "Percentual"
        : validContractSeries(props.dividends?.Absoluto)
          ? "Absoluto"
          : "Percentual";
  },
  { immediate: true },
);
</script>
