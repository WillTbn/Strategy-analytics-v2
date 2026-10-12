<template>
  <q-page class="finance-home q-pa-md">
    <title-page title="Minha carteira" subtitle="Resumo financeiro"
      ><template #append
        ><q-btn
          flat
          no-caps
          label="Solicitar saque"
          :to="{ name: 'Saque' }" /><q-btn
          flat
          round
          :icon="hidden ? 'visibility' : 'visibility_off'"
          :aria-label="hidden ? 'Mostrar valores' : 'Ocultar valores'"
          @click="hidden = !hidden" /></template
    ></title-page>
    <section class="tool q-pa-lg q-mb-lg">
      <h2 class="text-h6 q-mt-none">Resumo financeiro</h2>
      <resource-state :state="home.state" @retry="loadHome">
        <q-banner
          v-if="home.state.data?.access?.financialStatus !== 'Available'"
          class="bg-transparent"
          >Alguns recursos financeiros ainda não estão disponíveis para seu
          cadastro.</q-banner
        >
        <div
          v-for="summary in home.state.data?.summaries || []"
          :key="summary.currencyIsoCode"
          class="q-mb-md"
        >
          <div class="text-weight-medium q-mb-md">
            {{ summary.currencyIsoCode }}
          </div>
          <dl class="summary-grid">
            <div v-for="metric in metrics" :key="metric.key">
              <dt>{{ metric.label }}</dt>
              <dd>
                {{ valueLabel(summary[metric.key], summary.currencyIsoCode) }}
              </dd>
            </div>
          </dl>
        </div>
        <p v-if="!home.state.data?.summaries?.length">
          Nenhum resumo financeiro disponível.
        </p>
        <p class="text-caption q-mb-none">
          Posição e resultado dependem da atualização dos investimentos. Valores
          indisponíveis não representam saldo zero.
        </p>
      </resource-state>
    </section>
    <section class="tool q-pa-lg q-mb-lg">
      <h2 class="text-h6 q-mt-none">Saldos por carteira</h2>
      <resource-state :state="wallets.state" @retry="loadWallets"
        ><q-table
          flat
          class="bg-transparent"
          hide-pagination
          :pagination="{ rowsPerPage: 0 }"
          :rows="wallets.state.data || []"
          :columns="walletColumns"
          row-key="id"
          no-data-label="Nenhuma carteira disponível"
          ><template #body-cell-actions="p"
            ><q-td :props="p"
              ><q-btn
                flat
                dense
                no-caps
                label="Ver extrato"
                :disable="!p.row.id"
                @click="selectedWallet = p.row" /></q-td></template></q-table
      ></resource-state>
    </section>
    <section class="tool q-pa-lg q-mb-lg">
      <div class="row justify-between items-center">
        <h2 class="text-h6 q-mt-none">Contratos</h2>
        <q-btn flat no-caps label="Ver todos" :to="{ name: 'Contratos' }" />
      </div>
      <resource-state :state="home.state" @retry="loadHome"
        ><p v-if="home.state.data?.contracts?.status !== 'Available'">
          Contratos indisponíveis no momento.
        </p>
        <q-list v-else separator
          ><q-item
            v-for="contract in home.state.data?.contracts?.items || []"
            :key="contract.id"
            clickable
            :to="{ name: 'contract', params: { id: contract.id } }"
            ><q-item-section
              >{{ contract.name || contract.publicCode
              }}<q-item-label caption>{{
                contract.businessStatus?.name
              }}</q-item-label></q-item-section
            ><q-item-section side>{{
              displayMoney(
                contract.myParticipation?.allocatedAmount,
                contract.currencyCode,
              )
            }}</q-item-section></q-item
          ><q-item v-if="!home.state.data?.contracts?.items?.length"
            ><q-item-section
              >Nenhum contrato disponível.</q-item-section
            ></q-item
          ></q-list
        ></resource-state
      >
    </section>
    <section class="tool q-pa-lg q-mb-lg">
      <h2 class="text-h6 q-mt-none">Movimentações</h2>
      <finance-table path="client/transactions" :columns="transactionColumns"
        ><template #body-cell-actions="p"
          ><q-td :props="p"
            ><q-btn
              flat
              dense
              no-caps
              label="Detalhes"
              @click="openTransaction(p.row.id)" /></q-td></template
      ></finance-table>
    </section>
    <section class="tool q-pa-lg q-mb-lg">
      <h2 class="text-h6 q-mt-none">Composição da carteira</h2>
      <resource-state :state="home.state" @retry="loadHome"
        ><p v-if="home.state.data?.composition?.status !== 'Available'">
          Composição indisponível no momento.
        </p>
        <template v-else
          ><div
            v-for="currency in home.state.data?.composition?.currencies || []"
            :key="currency.currencyIsoCode"
          >
            <p class="text-weight-medium">{{ currency.currencyIsoCode }}</p>
            <q-list separator
              ><q-item v-for="(item, index) in currency.items" :key="index"
                ><q-item-section
                  >{{ item.className
                  }}<q-item-label caption>{{
                    financeLabel(item.origin)
                  }}</q-item-label></q-item-section
                ><q-item-section side
                  >{{ displayMoney(item.value, currency.currencyIsoCode) }} ·
                  {{
                    hidden ? "••••" : `${item.sharePercentage ?? "—"}%`
                  }}</q-item-section
                ></q-item
              ></q-list
            >
          </div>
          <p v-if="!home.state.data?.composition?.currencies?.length">
            Nenhuma composição disponível.
          </p></template
        ></resource-state
      >
    </section>
    <section class="tool q-pa-lg">
      <h2 class="text-h6 q-mt-none">Evolução da carteira</h2>
      <resource-state :state="home.state" @retry="loadHome"
        ><p v-if="home.state.data?.chart?.status !== 'Available'">
          O histórico de evolução ainda não está disponível.
        </p>
        <q-table
          v-else
          flat
          class="bg-transparent"
          :rows="home.state.data?.chart?.points || []"
          :columns="chartColumns"
          row-key="atUtc"
          no-data-label="Sem pontos de evolução disponíveis"
      /></resource-state>
    </section>
    <q-dialog
      :model-value="!!selectedWallet"
      @update:model-value="!$event && (selectedWallet = null)"
      ><q-card class="statement-panel q-pa-lg"
        ><div class="row justify-between items-center">
          <h2 class="text-h6">
            Extrato · {{ financeLabel(selectedWallet?.type) }}
          </h2>
          <q-btn
            flat
            round
            icon="close"
            aria-label="Fechar extrato"
            v-close-popup
          />
        </div>
        <finance-table
          v-if="selectedWallet"
          :key="selectedWallet.id"
          :path="`client/wallets/${selectedWallet.id}/statement`"
          :columns="statementColumns"
          row-key="transactionId" /></q-card
    ></q-dialog>
    <q-dialog v-model="transactionOpen"
      ><q-card class="statement-panel q-pa-lg"
        ><div class="row justify-between items-center">
          <h2 class="text-h6">Detalhes da movimentação</h2>
          <q-btn
            flat
            round
            icon="close"
            aria-label="Fechar detalhes"
            v-close-popup
          />
        </div>
        <resource-state :state="transaction.state" @retry="loadTransaction"
          ><template v-if="transaction.state.data"
            ><p>
              {{ transaction.state.data.requestNumber }} ·
              {{ financeLabel(transaction.state.data.status) }}
            </p>
            <p>
              {{
                displayMoney(
                  transaction.state.data.amount,
                  transaction.state.data.currencyIsoCode,
                )
              }}
            </p>
            <p>Origem: {{ endpointLabel(transaction.state.data.source) }}</p>
            <p>
              Destino: {{ endpointLabel(transaction.state.data.destination) }}
            </p>
            <q-list
              ><q-item
                v-for="(event, index) in transaction.state.data.timeline"
                :key="index"
                ><q-item-section
                  >{{ financeLabel(event.status) }} ·
                  {{ dateLabel(event.occurredAtUtc) }}</q-item-section
                ></q-item
              ></q-list
            ></template
          ></resource-state
        ></q-card
      ></q-dialog
    >
  </q-page>
</template>
<script setup>
import { computed, ref } from "vue";
import TitlePage from "../components/TitlePage.vue";
import ResourceState from "../components/finance/ResourceState.vue";
import FinanceTable from "../components/finance/FinanceTable.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import {
  financeGet,
  money,
  financeLabel,
  columns,
  dateLabel,
  endpointLabel,
} from "src/services/financeService";
const home = useFinanceResource(),
  wallets = useFinanceResource(),
  transaction = useFinanceResource(),
  hidden = ref(false),
  selectedWallet = ref(null),
  transactionOpen = ref(false),
  transactionId = ref(null);
const metrics = [
  { key: "availableBalance", label: "Saldo disponível" },
  { key: "contractedCapital", label: "Capital contratado" },
  { key: "currentPosition", label: "Posição atual" },
  { key: "result", label: "Resultado" },
];
const displayMoney = (value, currency) =>
  hidden.value ? "••••" : money(value, currency);
const valueLabel = (value, currency) =>
  value?.status === "Available"
    ? displayMoney(value.value, currency)
    : "Indisponível";
const loadHome = () =>
  home.load(async () => (await financeGet("client/home")).data);
const loadWallets = () =>
  wallets.load(async () => (await financeGet("client/wallets")).data);
const loadTransaction = () =>
  transaction.load(
    async () =>
      (await financeGet(`client/transactions/${transactionId.value}`)).data,
  );
function openTransaction(id) {
  transactionId.value = id;
  transactionOpen.value = true;
  loadTransaction();
}
const walletColumns = computed(() =>
  columns([
    ["type", "Carteira", (r) => financeLabel(r.type)],
    ["balance", "Saldo", (r) => displayMoney(r.balance, r.currencyIsoCode)],
    [
      "reserved",
      "Reservado",
      (r) => displayMoney(r.reserved, r.currencyIsoCode),
    ],
    [
      "available",
      "Disponível",
      (r) => displayMoney(r.available, r.currencyIsoCode),
    ],
    ["actions", "Extrato"],
  ]),
);
const transactionColumns = computed(() =>
  columns([
    ["requestNumber", "Solicitação"],
    ["type", "Tipo", (r) => financeLabel(r.type)],
    ["amount", "Valor", (r) => displayMoney(r.amount, r.currencyIsoCode)],
    ["status", "Status", (r) => financeLabel(r.status)],
    ["requestedAtUtc", "Data", (r) => dateLabel(r.requestedAtUtc)],
    ["actions", "Detalhes"],
  ]),
);
const statementColumns = computed(() =>
  columns([
    ["occurredAtUtc", "Data", (r) => dateLabel(r.occurredAtUtc)],
    ["requestNumber", "Solicitação"],
    ["direction", "Direção", (r) => financeLabel(r.direction)],
    [
      "amount",
      "Valor",
      (r) => displayMoney(r.amount, selectedWallet.value?.currencyIsoCode),
    ],
    [
      "balanceAfter",
      "Saldo após lançamento",
      (r) =>
        displayMoney(r.balanceAfter, selectedWallet.value?.currencyIsoCode),
    ],
  ]),
);
const chartColumns = computed(() =>
  columns([
    ["atUtc", "Data", (r) => dateLabel(r.atUtc)],
    ["value", "Posição", (r) => (hidden.value ? "••••" : r.value)],
  ]),
);
loadHome();
loadWallets();
</script>
<style scoped>
.finance-home {
  max-width: 1440px;
  margin: 0 auto;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
}
.summary-grid dt {
  font-size: 14px;
}
.summary-grid dd {
  margin: 8px 0 0;
  font-size: 16px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.statement-panel {
  width: 900px;
  max-width: 96vw;
}
@media (max-width: 700px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 400px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
