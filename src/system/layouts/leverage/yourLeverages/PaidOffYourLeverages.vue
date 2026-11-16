<template>
  <div class="active-your-leverages max-height-28em">
    <p v-if="!rows.length" class="q-pa-md text-grey">
      Nenhum empréstimo neste status.
    </p>
    <paid-off-loans-section
      v-for="loan in rows"
      :key="loan.id"
      :title="loan.publicCode"
      :is-active="selected === loan.id"
      :interest="
        loan.interestRatePercent == null
          ? ''
          : String(loan.interestRatePercent) + '%'
      "
      :type-description="financeLabel(loan.kind)"
      :hash="loan.id"
      :status="financeLabel(loan.status)"
      @select="selected = loan.id"
      @closed="selected = null"
      ><p class="text-grey">
        Parcelas e pagamentos indisponíveis para consulta.
      </p></paid-off-loans-section
    >
  </div>
</template>
<script setup>
import { computed, ref } from "vue";
import PaidOffLoansSection from "src/system/components/leverage/PaidOffLoansSection.vue";
import { useClientLoans } from "src/composables/system/useClientLoans";
import { loansByStatus } from "src/services/clientLoans";
import { financeLabel } from "src/services/financeService";
const { resource } = useClientLoans(),
  selected = ref(null);
const rows = computed(() => loansByStatus(resource.state.data, "quitada"));
</script>
