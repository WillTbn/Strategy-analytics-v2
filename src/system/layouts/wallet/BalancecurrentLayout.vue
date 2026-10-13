<template>
  <q-card class="BalancecurrentLayout bg-transparent row q-mt-sm card-wallet">
    <q-card-section class="col-12 row q-mb-sm justify-between">
      <wallet-total
        :amounts="totals"
        :loading="home.loading"
        :error="home.error"
        @retry="$emit('retry-home')"
      />
      <chart-wallet
        :loading="home.loading"
        :chart="home.data?.chart"
        :hidden="dashboard.view_wallet_value"
      />
    </q-card-section>
  </q-card>
  <div class="row justify-center">
    <div
      class="col-12 col-lg-10 row q-gutter-md justify-center q-mt-xs-lg q-mt-md-none"
    >
      <balance-items
        title="Investimentos"
        color-item="bg-primary"
        :amounts="investments"
        :loading="home.loading"
        :error="home.error"
        @retry="$emit('retry-home')"
        description="Capital alocado em contratos, separado por moeda. A posição atual ainda não está disponível."
        :view-values="dashboard.view_wallet_value"
      />
      <balance-items
        title="Saldo Investível"
        color-item="bg-info"
        description="A carteira de saldo investível ainda não foi identificada nos dados disponíveis."
        :view-values="dashboard.view_wallet_value"
      />
      <balance-items
        title="Banking"
        color-item="bg-accent"
        :amounts="banking"
        :loading="wallets.loading"
        :error="wallets.error"
        @retry="$emit('retry-wallets')"
        description="Saldo da carteira Livre que recebe os depósitos. Pode incluir valores reservados."
        :view-values="dashboard.view_wallet_value"
      />
    </div>
  </div>
</template>
<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useStoreLayout } from "src/stores/layoutStore";
import {
  summaryAmounts,
  freeWalletAmounts,
} from "src/services/walletPresentation";
import BalanceItems from "src/system/components/wallet/BalanceItems.vue";
import WalletTotal from "src/system/components/wallet/WalletTotal.vue";
import ChartWallet from "src/system/components/ChartWallet.vue";
const props = defineProps({
  home: { type: Object, required: true },
  wallets: { type: Object, required: true },
});
defineEmits(["retry-home", "retry-wallets"]);
const { dashboard } = storeToRefs(useStoreLayout());
const totals = computed(() =>
  summaryAmounts(props.home.data, "currentPosition"),
);
const investments = computed(() =>
  summaryAmounts(props.home.data, "contractedCapital"),
);
const banking = computed(() => freeWalletAmounts(props.wallets.data));
</script>
<style scoped lang="sass">
.span-trans:hover
  transform: scale(1.05)
.card-wallet
  opacity: 1
  border-radius: 8px
  border-width: 1px
  padding: 14px
  background: linear-gradient(224.8deg, rgba(121, 24, 35, 0.4) 0.17%, rgba(51, 10, 15, 0.4) 9.09%, rgba(9, 12, 21, 0.4) 39.13%, rgba(9, 41, 62, 0.4) 73.45%, rgba(17, 77, 118, 0.4) 99.83%);
  border: 1px solid #EFEFEF14
  backdrop-filter: blur(32px)
  box-shadow: 4px 4px 12px 0px rgba(0, 0, 0, 0.24)
</style>
