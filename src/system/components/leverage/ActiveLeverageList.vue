<template>
  <div class="active-your-leverages max-height-28em">
    <p v-if="!loans.length" class="q-pa-md text-grey">
      Nenhum empréstimo neste status.
    </p>
    <active-loans-section
      v-for="loan in loans"
      :key="loan.id"
      :title="loanTitle(loan)"
      :type="loan.kind"
      :is-active="selected === loan.id"
      :interest="loanInterestText(loan.interestRatePercent)"
      :type-description="
        loanKindPresentation(loan.kind)?.label || financeLabel(loan.kind)
      "
      :hash="loan.id"
      :status="financeLabel(loan.status)"
      @select="selected = loan.id"
      @closed="selected = null"
      ><leverage-installments
        v-if="selected === loan.id"
        :loan="loan"
        :adapter="paymentAdapter"
    /></active-loans-section>
  </div>
</template>
<script setup>
import { ref, watch } from "vue";
import ActiveLoansSection from "./ActiveLoansSection.vue";
import LeverageInstallments from "./LeverageInstallments.vue";
import {
  loanKindPresentation,
  loanInterestText,
  loanSummaryTitle as loanTitle,
} from "src/services/loanSummaryPresentation";
import { financeLabel } from "src/services/financeService";
const props = defineProps({
    loans: { type: Array, default: () => [] },
    paymentAdapter: { type: Object, default: null },
  }),
  selected = ref(null);
watch(
  () => props.loans,
  () => {
    if (!props.loans.some((l) => l.id === selected.value))
      selected.value = null;
  },
);
</script>
