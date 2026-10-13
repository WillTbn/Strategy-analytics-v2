<template>
  <div class="ChartWallet col-md-7 col-xs-12" id="chart">
    <apexchart
      v-if="points.length && !hidden"
      type="area"
      height="170"
      :options="chartOptions"
      :series="[{ name: 'Saldo da Carteira', data: filteredPoints }]"
    />
    <div
      v-else
      class="row items-center justify-center text-weight-light"
      style="height: 170px"
      role="status"
    >
      {{
        loading
          ? "Carregando evolução…"
          : hidden
            ? "Valores ocultos"
            : "Evolução da carteira indisponível"
      }}
    </div>
    <div class="row text-end align-center self-center justify-end">
      <div class="col-9 col-md-8 col-xs-12 row items-center justify-end">
        <div class="col-auto text-muted q-mr-sm">Período:</div>
        <div class="col-auto period-controls">
          <q-btn-group
            class="row q-gutter-sm"
            style="box-shadow: none !important"
          >
            <q-btn
              v-for="(item, index) in optionsTime"
              :key="index"
              :color="timeSelect == item.value ? 'primary' : ''"
              :label="item.label"
              :value="item.value"
              :disable="!points.length || hidden"
              @click="timeSelect = item.value"
              style="border-radius: 8px"
            />
          </q-btn-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import useCharts from "src/composables/useCharts";
import { numericValue } from "src/services/walletPresentation";
const props = defineProps({ loading: Boolean, chart: Object, hidden: Boolean });
const { walletOption } = useCharts();
const year = new Date().getFullYear().toString();
const timeSelect = ref(year);
const optionsTime = [
  { label: year, value: year },
  { label: "1M", value: "1M" },
  { label: "6M", value: "6M" },
  { label: "12M", value: "12M" },
  { label: "Máximo", value: "Máximo" },
];
const points = computed(() =>
  props.chart?.status === "Available"
    ? (props.chart.points || [])
        .filter(
          (p) =>
            numericValue(p.value) !== null &&
            Number.isFinite(Date.parse(p.atUtc)),
        )
        .map((p) => [Date.parse(p.atUtc), Number(p.value)])
        .sort((a, b) => a[0] - b[0])
    : [],
);
const filteredPoints = computed(() => {
  if (timeSelect.value === "Máximo") return points.value;
  const from = new Date(points.value.at(-1)?.[0] || Date.now());
  if (timeSelect.value === year) from.setFullYear(Number(year), 0, 1);
  else from.setMonth(from.getMonth() - Number.parseInt(timeSelect.value));
  return points.value.filter((p) => p[0] >= from.getTime());
});
const chartOptions = computed(() => ({
  ...walletOption.value,
  chart: { ...walletOption.value.chart, animations: { enabled: false } },
  xaxis: {
    ...walletOption.value.xaxis,
    type: "datetime",
    categories: undefined,
  },
  yaxis: { ...walletOption.value.yaxis, min: undefined, max: undefined },
}));
</script>

<style scoped>
.period-controls {
  max-width: 100%;
}
.period-controls .q-btn-group {
  flex-wrap: wrap;
  justify-content: flex-end;
}
</style>
