<template>
  <div class="simulation-your-leverages max-height-28em">
    <p v-if="!rows.length" class="q-pa-md text-grey">
      Nenhum empréstimo neste status.
    </p>
    <simulation-section
      v-for="loan in rows"
      :key="loan.id"
      :title="loanTitle(loan)"
      :type="loan.kind"
      :status="loanProcessLabel(loan.status)"
      :type-description="
        loanKindPresentation(loan.kind)?.label || financeLabel(loan.kind)
      "
      :link="{ name: 'Empréstimos', query: { hash: loan.id } }"
    />
  </div>
</template>
<script setup>
import { computed } from "vue";
import SimulationSection from "src/system/components/leverage/SimulationSection.vue";
import { useClientLoans } from "src/composables/system/useClientLoans";
import {
  loanProcessLabel,
  loanKindPresentation,
  loanInterestText,
  loanSummaryTitle as loanTitle,
} from "src/services/loanSummaryPresentation";
import { loansByStatus } from "src/services/clientLoans";
import { financeLabel } from "src/services/financeService";
const { resource } = useClientLoans(),
  rows = computed(() => loansByStatus(resource.state.data, "simulation"));
</script>
