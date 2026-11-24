<template>
  <section class="detail-panel detail-dividends">
    <header class="detail-section-heading">
      <h2>Dividend Yield</h2>
      <div class="detail-destination">
        <span>Receber dividendos em:</span>
        <div
          class="detail-segments"
          role="group"
          aria-label="Destino dos dividendos"
        >
          <q-btn
            v-for="option in destinations"
            :key="option.value"
            flat
            dense
            no-caps
            :label="option.label"
            :aria-pressed="destination === option.value"
            :class="{ selected: destination === option.value }"
            :disable="!canSave || saving"
            @click="setDestination(option.value)"
          />
        </div>
      </div>
    </header>
    <p class="detail-dividend-note">
      O dividendo é pago só em mês com lucro suficiente e nunca passa do lucro
      do mês.
    </p>
    <p v-if="error" role="alert" class="detail-error">{{ error }}</p>
    <div class="detail-chart-surface">
      <div class="detail-chart-controls">
        <q-toggle
          v-model="absolute"
          dense
          label="Absoluto"
          :disable="!bothUnits"
        /><span
          v-if="number(data?.average?.[unit]) !== null"
          class="detail-average"
          ><i />Média</span
        >
      </div>
      <apexchart
        v-if="ready"
        type="bar"
        height="269"
        :options="options"
        :series="series"
      />
      <p v-else class="detail-unavailable" role="status">
        Dividend Yield indisponível
      </p>
    </div>
  </section>
</template>
<script setup>
import { computed, onScopeDispose, ref, watch } from "vue";
import Apexchart from "vue3-apexcharts";
import chartLocale from "apexcharts/dist/locales/pt-br.json";
import {
  detailSeriesReady,
  detailNumber as number,
  detailPercent as percent,
  detailMoney as money,
  detailAssets as assets,
  escapeDetailText as escapeText,
} from "src/services/contractDetailPresentation";
const props = defineProps({
  data: Object,
  currency: String,
  contractId: String,
  saveDestination: Function,
});
const absolute = ref(true),
  destination = ref(null),
  saving = ref(false),
  error = ref("");
const destinations = [
  { value: "Strategy", label: "Carteira Strategy" },
  { value: "Deposit", label: "Carteira de Depósito" },
];
let active = true,
  revision = 0;
onScopeDispose(() => {
  active = false;
  revision++;
});
watch(
  () => [props.contractId, props.data],
  () => {
    revision++;
    saving.value = false;
    error.value = "";
    destination.value = destinations.some(
      (d) => d.value === props.data?.destination,
    )
      ? props.data.destination
      : null;
    absolute.value =
      detailSeriesReady(props.data?.absolute) ||
      !detailSeriesReady(props.data?.percent);
  },
  { immediate: true },
);
const canSave = computed(
  () =>
    typeof props.saveDestination === "function" && destination.value !== null,
);
const unit = computed(() => (absolute.value ? "absolute" : "percent")),
  series = computed(() => props.data?.[unit.value]);
const ready = computed(() => detailSeriesReady(series.value)),
  bothUnits = computed(
    () =>
      detailSeriesReady(props.data?.absolute) &&
      detailSeriesReady(props.data?.percent),
  );
async function setDestination(value) {
  if (
    !active ||
    saving.value ||
    !canSave.value ||
    destination.value === value ||
    !destinations.some((d) => d.value === value)
  )
    return;
  const attempt = ++revision;
  saving.value = true;
  error.value = "";
  try {
    const result = await props.saveDestination(props.contractId, value);
    if (active && attempt === revision) {
      if (result?.destination !== value) throw Error("Destino não confirmado");
      destination.value = value;
    }
  } catch {
    if (active && attempt === revision)
      error.value =
        "Não foi possível alterar o destino dos dividendos. Tente novamente.";
  } finally {
    if (active && attempt === revision) saving.value = false;
  }
}
const options = computed(() => ({
  theme: { mode: "dark" },
  chart: {
    locales: [chartLocale],
    defaultLocale: "pt-br",
    background: "transparent",
    toolbar: { show: false },
    animations: { enabled: false },
  },
  colors: ["#00a3ff"],
  plotOptions: { bar: { columnWidth: "24px", borderRadius: 2 } },
  dataLabels: { enabled: false },
  legend: { show: false },
  grid: { borderColor: "#ffffff1f" },
  xaxis: { type: "datetime" },
  yaxis: {
    opposite: true,
    labels: {
      formatter: (v) =>
        absolute.value ? money(v, props.currency) : percent(v),
    },
  },
  annotations: {
    yaxis:
      number(props.data?.average?.[unit.value]) === null
        ? []
        : [
            {
              y: Number(props.data.average[unit.value]),
              borderColor: "#ff991f",
              strokeDashArray: 4,
            },
          ],
  },
  tooltip: {
    custom: ({ seriesIndex, dataPointIndex }) => {
      const point = series.value?.[seriesIndex]?.data?.[dataPointIndex];
      if (!point) return "";
      const info = props.data?.months?.find((m) => m.date === point.x);
      return (
        '<div class="detail-dividend-tooltip"><img src="' +
        assets.dividend +
        '" alt="" /><div><strong>' +
        escapeText(
          info?.label ||
            new Intl.DateTimeFormat("pt-BR", {
              month: "short",
              year: "2-digit",
              timeZone: "UTC",
            }).format(new Date(point.x)),
        ) +
        "</strong><p>" +
        escapeText(
          absolute.value ? money(point.y, props.currency) : percent(point.y),
        ) +
        "</p>" +
        (info?.reason ? "<small>" + escapeText(info.reason) + "</small>" : "") +
        "</div></div>"
      );
    },
  },
}));
</script>
