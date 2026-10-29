<template>
  <q-card class="BalancecurrentLayout bg-transparent row q-mt-sm card-wallet">
    <q-card-section class="col-12 row q-mb-sm justify-between">
      <wallet-total
        :amounts="totals"
        :wallet-model="walletModel"
        :empty="empty"
        :loading="
          home.loading ||
          wallets.loading ||
          (deposits.loading && totals.every((amount) => amount.value === null))
        "
        :error="home.error || wallets.error || deposits.error"
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
        title="Carteira de Depósito"
        subtitle="Saldo disponível e reservado"
        color-item="invested-color"
        :empty="empty"
        :show-comparison="false"
        :amounts="depositAmounts"
        :details="depositDetails"
        :loading="wallets.loading"
        :error="wallets.error"
        @retry="$emit('retry-wallets')"
        description="Entrada e saída de dinheiro, sem rendimento. Saque para conta do mesmo titular e na mesma moeda, em até 1 dia útil."
        :view-values="dashboard.view_wallet_value"
      />
      <balance-items
        title="Carteira Strategy"
        :subtitle="strategySubtitle"
        color-item="investable-color"
        :empty="empty"
        :show-comparison="false"
        :amounts="strategyAmounts"
        :details="strategyDetails"
        :loading="home.loading || wallets.loading"
        :error="home.error || wallets.error"
        @retry="$emit('retry-home')"
        :description="YIELD_DESCRIPTION"
        :view-values="dashboard.view_wallet_value"
      />
      <balance-items
        title="Patrimônio"
        subtitle="Patrimônio declarado"
        color-item="base-color"
        :empty="empty"
        :show-comparison="false"
        :amounts="assetAmounts"
        :loading="wallets.loading"
        :error="wallets.error"
        @retry="$emit('retry-wallets')"
        description="Bens declarados: imóveis, veículos, consórcios e investimentos externos. Compõe a Carteira Total, mas não é saldo disponível para saque."
        :view-values="dashboard.view_wallet_value"
      />
    </div>
  </div>
</template>
<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useStoreLayout } from "src/stores/layoutStore";
import { YIELD_DESCRIPTION } from "src/services/walletModel";
import { walletDisplayAmounts } from "src/services/portfolioProjection";
import BalanceItems from "src/system/components/wallet/BalanceItems.vue";
import WalletTotal from "src/system/components/wallet/WalletTotal.vue";
import ChartWallet from "src/system/components/ChartWallet.vue";
import { emptyAmounts } from "src/services/homePresentation";
const props = defineProps({
  walletModel: { type: Object, default: null },
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
const empty = computed(() => props.walletModel?.empty === true);
// This view model is supplied only by an explicitly validated API adapter.
function amountsFor(type) {
  const wallet = props.walletModel?.[type];
  if (wallet?.total != null && props.walletModel?.principalCurrency)
    return [
      { currency: props.walletModel.principalCurrency, value: wallet.total },
    ];
  return (wallet?.currencies || []).map((row) => ({
    currency: row.currency,
    value: row.balance,
  }));
}
function detailsFor(type, fields) {
  return (props.walletModel?.[type]?.currencies || []).flatMap((row) =>
    fields.map(([key, label]) => ({
      currency: row.currency,
      value: row[key],
      label,
    })),
  );
}
const depositDetails = computed(() =>
  detailsFor("deposit", [
    ["available", "Disponível"],
    ["reserved", "Reservado"],
  ]),
);
const strategyDetails = computed(() =>
  detailsFor("strategy", [
    ["contracted", "Em contratos"],
    ["idle", "Parado"],
  ]),
);
const totals = computed(() =>
  walletDisplayAmounts(props.walletModel, "total").map((row) => ({
    currency: row.currency,
    value: row.balance,
  })),
);
const depositAmounts = computed(() =>
  props.walletModel ? amountsFor("deposit") : empty.value ? emptyAmounts() : [],
);
const strategyAmounts = computed(() =>
  props.walletModel
    ? amountsFor("strategy")
    : empty.value
      ? emptyAmounts()
      : [],
);
const assetAmounts = computed(() => amountsFor("assets"));
const strategySubtitle = computed(() => {
  const contracts = props.home.data?.contracts;
  if (contracts?.status !== "Available" || !Array.isArray(contracts.items))
    return "Saldo parado e contratos";
  if (
    contracts.items.length < Number(contracts.totalItems) ||
    contracts.items.some((item) => !item.businessStatus?.code)
  )
    return "Saldo parado e contratos";
  const count = contracts.items.filter(
    (item) => item.businessStatus?.code === "ACTIVE",
  ).length;
  return (
    "Saldo parado · " +
    count +
    (count === 1 ? " contrato ativo" : " contratos ativos")
  );
});
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
