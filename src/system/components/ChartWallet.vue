<template>
  <div class="ChartWallet col-md-7 col-xs-12" id="chart">
    <home-empty-state v-if="empty" kind="deposit" />
    <template v-else>
      <apexchart
        v-if="points.length && !hidden && !loading"
        type="area"
        height="186"
        :options="chartOptions"
        :series="[{ name: 'Saldo da Carteira', data: points }]"
      />
      <div
        v-else
        class="row items-center justify-center text-weight-light chart-status"
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
      <div v-if="optionsTime.length" class="row items-center justify-end">
        <div class="col-auto text-muted q-mr-sm">Período:</div>
        <div class="col-auto period-controls">
          <q-btn-group class="row q-gutter-sm" flat>
            <q-btn
              v-for="item in optionsTime"
              :key="item.value"
              :color="timeSelect === item.value ? 'primary' : undefined"
              :label="item.label"
              :aria-pressed="timeSelect === item.value"
              :disable="!pointsAvailable || hidden || loading"
              no-caps
              @click="selectPeriod(item.value)"
            />
          </q-btn-group>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup>
import { computed, ref, watch } from "vue";
import useCharts from "src/composables/useCharts";
import HomeEmptyState from "./wallet/HomeEmptyState.vue";
import {
  homePeriods,
  homeChartPoints,
  chartWindow,
  homeChartBounds,
} from "src/services/homePresentation";
const props = defineProps({
  loading: Boolean,
  chart: Object,
  hidden: Boolean,
  empty: Boolean,
  customerSince: String,
  hasCompletedDeposit: { type: Boolean, default: undefined },
  firstDepositAtUtc: String,
  now: { type: String, default: () => new Date().toISOString() },
  timeZone: { type: String, default: "America/Sao_Paulo" },
});
const { walletOption } = useCharts();
const timeSelect = ref(null),
  selectionMade = ref(false);
const optionsTime = computed(() =>
  homePeriods(
    props.customerSince,
    props.hasCompletedDeposit,
    props.now,
    props.timeZone,
  ),
);
watch(
  optionsTime,
  (options) => {
    const preferred =
      options.find((item) => /^\d{4}$/.test(item.value))?.value || "max";
    if (
      !selectionMade.value ||
      !options.some((item) => item.value === timeSelect.value)
    )
      timeSelect.value = preferred;
  },
  { immediate: true },
);
const selectPeriod = (value) => {
  selectionMade.value = true;
  timeSelect.value = value;
};
const points = computed(() =>
  homeChartPoints(
    props.chart,
    props.firstDepositAtUtc,
    timeSelect.value,
    props.now,
    props.timeZone,
  ),
);
const pointsAvailable = computed(
  () =>
    homeChartPoints(
      props.chart,
      props.firstDepositAtUtc,
      "max",
      props.now,
      props.timeZone,
    ).length > 0,
);
const chartOptions = computed(() => {
  const xaxis = { ...walletOption.value.xaxis };
  delete xaxis.categories;
  const window = chartWindow(
    timeSelect.value,
    props.firstDepositAtUtc,
    props.now,
    props.timeZone,
  );
  return {
    ...walletOption.value,
    chart: {
      ...walletOption.value.chart,
      height: 186,
      animations: { enabled: false },
    },
    markers: {
      size: 0,
      discrete: points.value.length
        ? [
            {
              seriesIndex: 0,
              dataPointIndex: 0,
              fillColor: "#00A3FF",
              strokeColor: "#00A3FF",
              size: 4,
            },
          ]
        : [],
    },
    xaxis: {
      ...xaxis,
      type: "datetime",
      min: window?.from,
      max: window?.to,
      labels: { ...xaxis.labels, format: "dd/MM" },
    },
    yaxis: {
      ...walletOption.value.yaxis,
      ...homeChartBounds(points.value),
      tickAmount: 4,
    },
  };
});
</script>
<style scoped>
.chart-status {
  min-height: 186px;
  text-align: center;
}
.period-controls {
  max-width: 100%;
}
.period-controls .q-btn-group {
  flex-wrap: wrap;
  justify-content: flex-end;
  box-shadow: none;
}
.period-controls .q-btn {
  border-radius: 8px;
}
</style>
