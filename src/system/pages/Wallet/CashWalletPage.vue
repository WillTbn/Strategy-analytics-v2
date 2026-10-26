<template>
  <q-page class="wallet-operation-page"
    ><wallet-operation
      mode="withdrawal"
      @close="router.push({ name: 'inicio' })"
  /></q-page>
</template>
<script setup>
import { useRouter } from "vue-router";
import WalletOperation from "src/system/components/wallet/WalletOperation.vue";
const router = useRouter();
</script>
<style scoped>
.wallet-operation-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 16px;
}
</style>
