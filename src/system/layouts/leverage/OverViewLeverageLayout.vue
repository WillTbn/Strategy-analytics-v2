<template>
  <div class="over-view-leverage-layout q-mb-lg">
    <card-overview-layout
      title="Visão Geral"
      :btnLink="false"
      classAdd="q-px-md q-mt-md q-pb-md q-gutter-sm"
    >
      <resource-state
        :state="resource.state"
        @retry="load"
        class="full-width row q-gutter-md"
      >
        <card-resume-leverage
          v-for="(item, index) in contracts"
          :key="index"
          :title="item.title"
          :description="item.description"
          :icon="item.icon"
          :text="item.text"
          :loading="item.loading"
          :plusValue="item.plusValue"
        />
      </resource-state>
    </card-overview-layout>
  </div>
</template>

<script setup>
import { computed } from "vue";
import ResourceState from "src/system/components/finance/ResourceState.vue";
import { useClientLoans } from "src/composables/system/useClientLoans";
import { loansByStatus, loanDebtAmounts } from "src/services/clientLoans";
import { amountLabel } from "src/services/walletPresentation";
import { defineComponent } from "vue";
import CardOverviewLayout from "../CardOverviewLayout.vue";
import CardResumeLeverage from "src/system/components/cardResume/CardResumeLeverage.vue";

defineComponent({
  name: "OverViewLeverageLayout",
});

const { resource, load } = useClientLoans();
const contracts = computed(() => [
  {
    title: "Total Empréstimos",
    text:
      String(loansByStatus(resource.state.data, "actives").length) +
      " vigentes",
    icon: "IconFileInvoice",
  },
  {
    title: "Dívida Total",
    text:
      loanDebtAmounts(resource.state.data)
        .map((row) =>
          row.value == null ? row.currency + " —" : amountLabel(row),
        )
        .join(" · ") || "—",
    icon: "IconReceipt2",
  },
  {
    title: "Próxima Parcela",
    text: "—",
    description: "Indisponível",
    icon: "IconCalendarDollar",
  },
  {
    title: "Empréstimos em Análise",
    text: String(loansByStatus(resource.state.data, "simulation").length),
    icon: "IconClockHour4",
  },
]);
// Seu código aqui
</script>

<style scoped>
/* Seus estilos aqui */
</style>
