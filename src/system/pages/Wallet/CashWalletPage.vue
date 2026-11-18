<template>
  <q-page class="wallet-operation-page">
    <title-page
      title="Solicitar Saque"
      to-back
      :back-to="{ name: 'inicio' }"
      :back-icon="withdrawalAssets[frameId].imgArrowLeft"
      :back-disabled="busy" />
    <div class="wallet-operation-content">
      <resource-state
        :state="wallets.state"
        @retry="
          wallets.load(async () => (await financeGet('client/wallets')).data)
        "
        ><wallet-operation
          mode="withdrawal"
          :model="model"
          :submit-operation="submitClientWalletOperation"
          @busy="busy = $event"
          @state="frameId = $event"
          @completed="router.push({ name: 'inicio' })"
          @close="router.push({ name: 'inicio' })"
      /></resource-state></div
  ></q-page>
</template>
<script setup>
import { computed, ref, onScopeDispose } from "vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { financeGet } from "src/services/financeService";
import { projectClientWallets } from "src/services/portfolioProjection";
import { submitClientWalletOperation } from "src/services/clientWalletOperations";
import { withdrawalAssets } from "src/services/withdrawalAssets";
import TitlePage from "src/system/components/TitlePage.vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import ResourceState from "src/system/components/finance/ResourceState.vue";
import WalletOperation from "src/system/components/wallet/WalletOperation.vue";
const router = useRouter(),
  wallets = useFinanceResource();
const busy = ref(false),
  frameId = ref("1:28279");
onBeforeRouteLeave(() => !busy.value);
const model = computed(() => projectClientWallets(null, wallets.state.data));
wallets.load(async () => (await financeGet("client/wallets")).data);
onScopeDispose(wallets.reset);
</script>
<style scoped>
.wallet-operation-page {
  padding-bottom: 40px;
}
.wallet-operation-content {
  display: flex;
  justify-content: center;
  padding: 24px 16px;
  min-width: 0;
}
.wallet-operation-content > :deep(*) {
  max-width: 100%;
}
.wallet-operation-page :deep(.title-page-heading) {
  font-size: 41px;
  line-height: 1.2;
}
</style>
