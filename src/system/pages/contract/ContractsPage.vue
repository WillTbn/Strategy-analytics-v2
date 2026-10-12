<template>
  <q-page class="q-pa-md"
    ><title-page title="Meus contratos" />
    <section class="tool q-pa-lg">
      <finance-table path="client/contracts" :columns="contractColumns"
        ><template #body-cell-actions="p"
          ><q-td :props="p"
            ><q-btn
              flat
              no-caps
              label="Ver contrato"
              :to="{
                name: 'contract',
                params: { id: p.row.id },
              }" /></q-td></template
      ></finance-table></section
  ></q-page>
</template>
<script setup>
import TitlePage from "../../components/TitlePage.vue";
import FinanceTable from "../../components/finance/FinanceTable.vue";
import { columns, money, dateLabel } from "src/services/financeService";
const contractColumns = columns([
  ["publicCode", "Contrato"],
  ["name", "Nome"],
  ["status", "Status", (r) => r.businessStatus?.name || "—"],
  [
    "participation",
    "Minha participação",
    (r) => money(r.myParticipation?.allocatedAmount, r.currencyCode),
  ],
  ["startDate", "Início", (r) => dateLabel(r.startDate)],
  ["endDate", "Término", (r) => dateLabel(r.endDate)],
  ["actions", "Detalhes"],
]);
</script>
