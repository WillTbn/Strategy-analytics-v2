<template>
  <section class="detail-panel detail-contributions">
    <header class="detail-section-heading">
      <h2>Aportes</h2>
      <q-toggle v-model="historyOpen" dense label="Ver Histórico de Aportes" />
    </header>
    <div class="detail-chart-surface">
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
    <div v-if="participants?.length" class="detail-participants">
      <q-btn
        v-for="person in participants"
        :key="person.id"
        flat
        no-caps
        class="detail-participant"
        :aria-label="'Ver participante ' + person.name"
      >
        <q-avatar size="40px"
          ><img
            v-if="person.avatar"
            :src="person.avatar"
            :alt="person.name" /><q-icon v-else name="person"
        /></q-avatar>
        <span class="detail-participant-summary"
          ><span>{{ person.name }}</span
          ><strong
            >{{ money(person.total, currency) }}
            <small
              v-if="number(person.returnPercent) !== null"
              :class="{ 'detail-negative': Number(person.returnPercent) < 0 }"
              >{{ Number(person.returnPercent) > 0 ? "+ " : ""
              }}{{ percent(person.returnPercent) }}</small
            ></strong
          ></span
        >
        <q-menu
          class="detail-participant-popover"
          anchor="bottom left"
          self="top left"
          :offset="[0, 12]"
        >
          <article>
            <header>
              <q-avatar size="64px"
                ><img
                  v-if="person.avatar"
                  :src="person.avatar"
                  :alt="person.name" /><q-icon v-else name="person"
              /></q-avatar>
              <div>
                <p v-if="person.strategyId">
                  ID Strategy: {{ person.strategyId }}
                </p>
                <p v-if="Number.isInteger(person.level) && person.level >= 0">
                  Nível {{ person.level }}
                </p>
                <h3>{{ person.name }}</h3>
              </div>
            </header>
            <dl>
              <dt>Cliente desde</dt>
              <dd>{{ date(person.customerSince) }}</dd>
              <dt>Valor Aportado Total</dt>
              <dd>{{ money(person.total, currency) }}</dd>
              <dt>Último Aporte</dt>
              <dd>
                {{ money(person.lastAmount, currency)
                }}<small>{{ date(person.lastDate) }}</small>
              </dd>
              <dt>Entrada no Contrato</dt>
              <dd>{{ date(person.entryDate) }}</dd>
            </dl>
          </article>
        </q-menu>
      </q-btn>
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
import {
  detailSeriesReady,
  participantRows,
  detailMoney as money,
  detailDate as date,
  detailNumber as number,
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
    background: "transparent",
    toolbar: { show: false },
    animations: { enabled: false },
  },
  colors: ["#00a3ff", "#10bcf1", "#187aff"],
  plotOptions: { bar: { columnWidth: "24px", borderRadius: 2 } },
  dataLabels: { enabled: false },
  legend: { show: false },
  grid: { borderColor: "#ffffff1f" },
  xaxis: { type: "datetime" },
  tooltip: { theme: "dark", y: { formatter: (v) => money(v, props.currency) } },
};
</script>
