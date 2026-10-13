<template>
  <q-page class="WalletPage q-ma-lg">
    <div class="row q-gutter-md justify-around">
      <div :class="dashboard.communication_left ? 'col-12 col-lg-9' : 'col-12'">
        <balancecurrent-layout
          :home="home.state"
          :wallets="wallets.state"
          @retry-home="loadHome"
          @retry-wallets="loadWallets"
        />
        <resume-contracts-layout :state="home.state" @retry="loadHome" />
        <communication-preview-layout
          v-if="!dashboard.communication_left"
          @left="dashboard.communication_left = true"
        />
        <loan-resume-layout />
      </div>
      <div :class="dashboard.communication_left ? 'col-12 col-lg' : 'hidden'">
        <communication-preview-left-layout
          @fadeLeft="dashboard.communication_left = false"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import BalancecurrentLayout from "../layouts/wallet/BalancecurrentLayout.vue";
import ResumeContractsLayout from "../layouts/wallet/ResumeContractsLayout.vue";
import LoanResumeLayout from "../layouts/wallet/LoanResumeLayout.vue";
import CommunicationPreviewLayout from "../layouts/communication/CommunicationPreviewLayout.vue";
import CommunicationPreviewLeftLayout from "../layouts/communication/CommunicationPreviewLeftLayout.vue";
import { storeToRefs } from "pinia";
import { useStoreLayout } from "src/stores/layoutStore";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { financeGet } from "src/services/financeService";
const storeLayout = useStoreLayout();
const { dashboard } = storeToRefs(storeLayout);
const home = useFinanceResource();
const wallets = useFinanceResource();
const loadHome = () =>
  home.load(async () => (await financeGet("client/home")).data);
const loadWallets = () =>
  wallets.load(async () => (await financeGet("client/wallets")).data);
loadHome();
loadWallets();
</script>

<style scoped lang="sass">
.WalletPage
  margin-top: -80px
  min-width: 0
@media (max-width: 599px)
  .WalletPage
    margin-top: 0
    margin-left: 16px
    margin-right: 16px
  .WalletPage :deep(.tool)
    min-width: 0
  .WalletPage :deep(.text-roboto-32-700)
    overflow-wrap: anywhere
</style>
