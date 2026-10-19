<template>
  <q-card class="BalancecurrentLayout bg-transparent row q-mt-sm card-wallet">
    <q-card-section class="col-12 row q-mb-sm justify-between">
      <wallet-total
        :amounts="totals"
        :empty="empty"
        :loading="
          home.loading ||
          (deposits.loading && totals.every((amount) => amount.value === null))
        "
        :error="home.error || deposits.error"
        @retry="$emit('retry-home')"
      />
      <chart-wallet
        :loading="home.loading || deposits.loading"
        :chart="home.data?.chart"
        :hidden="dashboard.view_wallet_value"
        :empty="empty"
        :customer-since="profile.data?.customerSinceUtc"
        :has-completed-deposit="deposits.data?.hasCompletedDeposit"
        :first-deposit-at-utc="deposits.data?.firstDepositAtUtc"
        :time-zone="
          profile.data?.preferences?.timeZoneId || 'America/Sao_Paulo'
        "
      />
    </q-card-section>
  </q-card>
  <div class="row justify-center">
    <div
      class="col-12 col-lg-10 row q-gutter-md justify-center q-mt-xs-lg q-mt-md-none"
    >
      <balance-items
        title="Saldo Investido"
        color-item="invested-color"
        :empty="empty"
        :show-comparison="showComparison"
        :amounts="investments"
        :loading="home.loading"
        :error="home.error"
        @retry="$emit('retry-home')"
        description="Capital alocado em contratos, separado por moeda. A posição atual ainda não está disponível."
        :view-values="dashboard.view_wallet_value"
      />
      <balance-items
        title="Saldo Investível"
        color-item="investable-color"
        :empty="empty"
        :show-comparison="showComparison"
        :amounts="investable"
        :loading="home.loading"
        :error="home.error"
        @retry="$emit('retry-home')"
        description="Saldo disponível das carteiras Livre e Aplicada, separado por moeda."
        :view-values="dashboard.view_wallet_value"
      />
      <balance-items
        title="Saldo Base"
        color-item="base-color"
        :empty="empty"
        :show-comparison="showComparison"
        :amounts="banking"
        :loading="wallets.loading"
        :error="wallets.error"
        @retry="$emit('retry-wallets')"
        description="Saldo disponível da carteira Livre, descontados os valores reservados."
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
import {
  portfolioIsEmpty,
  emptyAmounts,
  comparisonIsVisible,
} from "src/services/homePresentation";
const props = defineProps({
  home: { type: Object, required: true },
  wallets: { type: Object, required: true },
  deposits: {
    type: Object,
    default: () => ({ data: null, loading: false, error: "" }),
  },
  profile: {
    type: Object,
    default: () => ({ data: null, loading: false, error: "" }),
  },
});
defineEmits(["retry-home", "retry-wallets"]);
const { dashboard } = storeToRefs(useStoreLayout());
const empty = computed(() =>
  portfolioIsEmpty(props.home, props.wallets, props.deposits),
);
const showComparison = computed(
  () =>
    !empty.value &&
    !props.profile.loading &&
    comparisonIsVisible(
      props.profile.data?.customerSinceUtc,
      undefined,
      props.profile.data?.preferences?.timeZoneId,
    ),
);
const totals = computed(() =>
  empty.value
    ? emptyAmounts()
    : summaryAmounts(props.home.data, "currentPosition"),
);
const investments = computed(() =>
  empty.value
    ? emptyAmounts()
    : summaryAmounts(props.home.data, "contractedCapital"),
);
const banking = computed(() =>
  empty.value ? emptyAmounts() : freeWalletAmounts(props.wallets.data),
);
const investable = computed(() =>
  empty.value
    ? emptyAmounts()
    : summaryAmounts(props.home.data, "availableBalance"),
);
</script>
<style scoped lang="sass">
.span-trans:hover
  transform: scale(1.05)
:deep(.invested-color)
  background: #00f5d9
:deep(.investable-color)
  background: #4ca8ff
:deep(.base-color)
  background: #7438ff
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
