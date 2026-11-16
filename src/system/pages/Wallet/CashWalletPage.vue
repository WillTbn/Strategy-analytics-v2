<template>
  <q-page class="wallet-operation-page"
    ><resource-state
      :state="wallets.state"
      @retry="
        wallets.load(async () => (await financeGet('client/wallets')).data)
      "
      ><wallet-operation
        mode="withdrawal"
        :model="model"
        :submit-operation="submitClientWalletOperation"
        @completed="router.push({ name: 'inicio' })"
        @close="router.push({ name: 'inicio' })" /></resource-state
  ></q-page>
</template>
<script setup>
import { computed, onScopeDispose } from "vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { financeGet } from "src/services/financeService";
import { projectClientWallets } from "src/services/portfolioProjection";
import { submitClientWalletOperation } from "src/services/clientWalletOperations";
import { useRouter } from "vue-router";
import ResourceState from "src/system/components/finance/ResourceState.vue";
import WalletOperation from "src/system/components/wallet/WalletOperation.vue";
const router = useRouter(),
  wallets = useFinanceResource();
const model = computed(() => projectClientWallets(null, wallets.state.data));
wallets.load(async () => (await financeGet("client/wallets")).data);
onScopeDispose(wallets.reset);
</script>
<style scoped>
.wallet-operation-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 16px;
}
</style>
