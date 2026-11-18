<template>
  <q-page class="contract-directory-page"
    ><title-page subtitle="Contratos" title="Contratos" /><contract-directory
      :list-state="contracts.state"
      :overview-state="home.state"
      @retry-list="loadContracts"
      @retry-overview="loadHome"
      @request="requestOpen = true" /><q-dialog
      v-model="requestOpen"
      :persistent="requestBusy"
      ><opportunity-investment
        offer
        @closed="requestOpen = false"
        @busy="requestBusy = $event" /></q-dialog
  ></q-page>
</template>
<script setup>
import { ref, onScopeDispose } from "vue";
import TitlePage from "../../components/TitlePage.vue";
import ContractDirectory from "../../components/contract/ContractDirectory.vue";
import OpportunityInvestment from "../../layouts/contracts/OpportunityInvestment.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { financeGet } from "src/services/financeService";
import {
  captureClientSession,
  isClientSessionCurrent,
} from "src/services/clientApi";
import { readContractDirectory } from "src/services/contractDirectory";
const contracts = useFinanceResource(),
  home = useFinanceResource(),
  requestOpen = ref(false),
  requestBusy = ref(false);
let active = true,
  revision = 0;
function loadContracts() {
  const current = ++revision,
    session = captureClientSession();
  return contracts.load(() =>
    readContractDirectory(
      financeGet,
      () => active && current === revision && isClientSessionCurrent(session),
    ),
  );
}
function loadHome() {
  const session = captureClientSession();
  return home.load(async () => {
    const result = await financeGet("client/home");
    return active && isClientSessionCurrent(session) ? result.data : null;
  });
}
loadContracts();
loadHome();
onScopeDispose(() => {
  active = false;
  revision++;
  contracts.reset();
  home.reset();
});
</script>
