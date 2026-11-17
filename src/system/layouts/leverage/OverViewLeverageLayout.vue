<template>
  <div class="over-view-leverage-layout q-mb-lg">
    <card-overview-layout
      title="Visão Geral"
      :btnLink="false"
      class="loan-overview"
      classAdd=""
    >
      <resource-state
        :state="resource.state"
        @retry="load"
        class="loan-overview__content"
      >
        <card-resume-leverage
          v-for="(item, index) in contracts"
          :key="index"
          :title="item.title"
          :description="item.description"
          :icon="item.icon"
          :icon-src="item.iconSrc"
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
    title: "Total de Empréstimos",
    text:
      String(loansByStatus(resource.state.data, "actives").length) +
      " vigentes",
    icon: "IconFileInvoice",
    iconSrc: "/figma/my-leverage/overview-loans.svg",
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
    iconSrc: "/figma/my-leverage/overview-debt.svg",
  },
  {
    title: "Próxima Parcela",
    text: "—",
    description: "Indisponível",
    icon: "IconCalendarDollar",
    iconSrc: "/figma/my-leverage/overview-installment.svg",
  },
  {
    title: "Empréstimos em Análise",
    text: String(loansByStatus(resource.state.data, "simulation").length),
    icon: "IconClockHour4",
    iconSrc: "/figma/my-leverage/overview-review.svg",
  },
]);
// Seu código aqui
</script>

<style scoped>
.over-view-leverage-layout {
  margin-bottom: 0;
}
.loan-overview {
  padding: 24px;
  border: 1px solid #efefef29;
  border-radius: 4px;
  box-shadow: 4px 4px 12px #0000003d;
  background: linear-gradient(183deg, #0000003d, #00000014 51%, #0000000a);
  backdrop-filter: blur(20px);
}
.loan-overview :deep(h2) {
  margin: 0 0 24px;
  font:
    700 24px/1.5 Inter,
    sans-serif;
}
.loan-overview__content {
  width: 100%;
}
.loan-overview__content :deep(> div:not(.q-linear-progress):not(.q-banner)) {
  display: contents;
}
.loan-overview__content {
  display: grid;
  grid-template-columns: minmax(0, 320px) minmax(0, 400px) minmax(
      0,
      400px
    ) minmax(0, 320px);
  gap: 48px;
  align-items: stretch;
}
@media (max-width: 1500px) {
  .loan-overview__content {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }
}
@media (max-width: 700px) {
  .loan-overview {
    padding: 16px;
  }
  .loan-overview__content {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
}
</style>
