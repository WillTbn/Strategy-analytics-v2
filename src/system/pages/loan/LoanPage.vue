<template>
  <q-page class="q-pa-lg"
    ><title-page title="Empréstimo" :to-back="true" /><resource-state
      :state="resource.state"
      @retry="load"
      ><active-loans-section
        v-if="resource.state.data"
        :title="resource.state.data.publicCode"
        :interest="
          resource.state.data.interestRatePercent == null
            ? ''
            : String(resource.state.data.interestRatePercent) + '%'
        "
        :type-description="financeLabel(resource.state.data.kind)"
        :status="financeLabel(resource.state.data.status)"
        :is-active="true"
        detail
        ><p class="text-grey">
          Parcelas e pagamentos indisponíveis para consulta.
        </p></active-loans-section
      >
      <p v-else class="text-grey">Empréstimo indisponível.</p></resource-state
    ></q-page
  >
</template>
<script setup>
import { watch, onScopeDispose } from "vue";
import { useRoute } from "vue-router";
import TitlePage from "src/system/components/TitlePage.vue";
import ResourceState from "src/system/components/finance/ResourceState.vue";
import ActiveLoansSection from "src/system/components/leverage/ActiveLoansSection.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { financeGet, financeLabel } from "src/services/financeService";
const route = useRoute(),
  resource = useFinanceResource();
const load = () =>
  resource.load(async () => {
    const id = route.query.hash;
    if (
      typeof id !== "string" ||
      !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)
    )
      return null;
    return (await financeGet(`client/loans/${id}`)).data;
  });
watch(() => route.query.hash, load, { immediate: true });
onScopeDispose(resource.reset);
</script>
