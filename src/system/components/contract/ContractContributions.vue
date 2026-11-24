<template>
  <section class="detail-panel detail-contributions">
    <header class="detail-section-heading">
      <h2>Aportes</h2>
      <div v-if="participants?.length" class="detail-participants">
        <q-btn
          v-for="person in participants"
          :key="person.id"
          flat
          no-caps
          class="detail-participant"
          :aria-label="'Ver participante ' + person.name"
        >
          <q-avatar size="48px"
            ><img
              v-if="person.avatar"
              :src="person.avatar"
              :alt="person.name" /><q-icon v-else name="person"
          /></q-avatar>
          <q-menu
            class="detail-participant-popover"
            anchor="bottom left"
            self="top left"
            :offset="[0, 12]"
          >
            <article>
              <header>
                <q-avatar size="48px"
                  ><img
                    v-if="person.avatar"
                    :src="person.avatar"
                    :alt="person.name" /><q-icon v-else name="person"
                /></q-avatar>
                <div class="detail-participant-identity">
                  <div class="detail-participant-id">
                    <p v-if="person.strategyId">
                      ID Strategy: {{ person.strategyId }}
                    </p>
                    <span
                      v-if="Number.isInteger(person.level) && person.level >= 0"
                      class="detail-participant-level"
                      >Nível {{ person.level }}</span
                    >
                  </div>
                  <h3>{{ person.name }}</h3>
                </div>
                <div class="detail-participant-since">
                  <p>Cliente desde</p>
                  <strong>{{ date(person.customerSince) }}</strong>
                </div>
              </header>
              <q-separator dark class="detail-participant-divider" />
              <dl>
                <div>
                  <dt>Valor Aportado Total</dt>
                  <dd>{{ money(person.total, currency) }}</dd>
                </div>
                <div>
                  <dt>Último Aporte</dt>
                  <dd>
                    {{ money(person.lastAmount, currency)
                    }}<span class="detail-participant-last-date">{{
                      date(person.lastDate)
                    }}</span>
                  </dd>
                </div>
                <div>
                  <dt>Entrada no Contrato</dt>
                  <dd class="detail-participant-entry">
                    {{ date(person.entryDate) }}
                  </dd>
                </div>
              </dl>
            </article>
          </q-menu>
        </q-btn>
      </div>
      <q-toggle v-model="historyOpen" dense label="Ver Histórico de Aportes" />
    </header>
    <div class="detail-chart-surface detail-contribution-chart">
      <div class="detail-contribution-plot">
        <apexchart
          v-if="seriesReady"
          type="bar"
          height="269"
          :options="chartOptions"
          :series="data.series"
        />
        <p v-else class="detail-unavailable" role="status">
          Evolução dos aportes indisponível
        </p>
      </div>
      <ul v-if="participants?.length" class="detail-contribution-legend">
        <li v-for="(person, index) in participants" :key="person.id">
          <span
            ><i
              :style="{
                background:
                  chartOptions.colors[index % chartOptions.colors.length],
              }"
            />{{ person.name }}</span
          >
          <strong
            >{{ money(person.total, currency)
            }}<small
              v-if="number(person.returnPercent) !== null"
              :class="{ 'detail-negative': Number(person.returnPercent) < 0 }"
              >{{ percent(person.returnPercent) }}</small
            ></strong
          >
        </li>
      </ul>
    </div>
    <div v-if="historyOpen" class="detail-contribution-history">
      <h3>Histórico de Aportes</h3>
      <div class="detail-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Valor do Aporte ({{ currency || "—" }})</th>
              <th>Origem (moeda e cotação)</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in historyRows" :key="row.id || i">
              <td>{{ row.name || "—" }}</td>
              <td>{{ money(row.amount, currency) }}</td>
              <td>{{ row.originLabel || "—" }}</td>
              <td>{{ date(row.date) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-if="!Array.isArray(data?.history)"
        class="detail-query-status"
        role="status"
      >
        Histórico de aportes indisponível
      </p>
      <p
        v-else-if="!historyRows.length"
        class="detail-query-status"
        role="status"
      >
        Nenhum aporte registrado
      </p>
    </div>
  </section>
</template>
<script setup>
import { computed, ref, watch } from "vue";
import Apexchart from "vue3-apexcharts";
import chartLocale from "apexcharts/dist/locales/pt-br.json";
import {
  detailSeriesReady,
  participantRows,
  detailMoney as money,
  detailDate as date,
  detailNumber as number,
  escapeDetailText as escapeText,
  detailPercent as percent,
} from "src/services/contractDetailPresentation";
const props = defineProps({
  data: Object,
  currency: String,
  contractId: String,
});
const historyOpen = ref(true);
watch(
  () => props.contractId,
  () => {
    historyOpen.value = true;
  },
);
const participants = computed(() => participantRows(props.data?.participants));
const seriesReady = computed(() => detailSeriesReady(props.data?.series));
const historyRows = computed(() =>
  Array.isArray(props.data?.history)
    ? props.data.history.filter((r) => r && typeof r === "object")
    : [],
);
const chartOptions = {
  theme: { mode: "dark" },
  chart: {
    locales: [chartLocale],
    defaultLocale: "pt-br",
    background: "transparent",
    toolbar: { show: false },
    animations: { enabled: false },
    stacked: true,
  },
  colors: ["#00a3ff", "#00f5d9", "#7438ff"],
  plotOptions: { bar: { columnWidth: "24px", borderRadius: 2 } },
  dataLabels: { enabled: false },
  legend: { show: false },
  grid: { borderColor: "#ffffff1f" },
  xaxis: { type: "datetime" },
  tooltip: {
    custom: ({ seriesIndex, dataPointIndex }) => {
      const point = props.data?.series?.[seriesIndex]?.data?.[dataPointIndex];
      if (!point) return "";
      const person = participants.value?.find(
        (p) => p.id === point.participantId,
      );
      return (
        '<div class="detail-contribution-tooltip">' +
        (person?.avatar
          ? '<img src="' +
            escapeText(person.avatar) +
            '" alt="" referrerpolicy="no-referrer" />'
          : "") +
        "<div><span>Aporte:</span><p><strong>" +
        escapeText(money(point.y, props.currency)) +
        "</strong><span>" +
        escapeText(date(new Date(point.x).toISOString())) +
        "</span></p></div></div>"
      );
    },
  },
};
</script>
