<template>
  <q-page class="WalletPage q-ma-lg">
    <div class="row q-gutter-md justify-around">
      <div :class="dashboard.communication_left ? 'col-12 col-lg-9' : 'col-12'">
        <balancecurrent-layout
          :home="home.state"
          :wallets="wallets.state"
          :deposits="deposits.state"
          :profile="profile.state"
          @retry-home="loadHome"
          @retry-wallets="loadWallets"
        />
        <resume-contracts-layout :state="home.state" @retry="loadHome" />
        <communication-preview-layout
          v-if="!dashboard.communication_left"
          @left="dashboard.communication_left = true"
        />
        <!-- O resumo de empréstimos aguarda uma fonte de dívida na API do cliente. -->
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
import CommunicationPreviewLayout from "../layouts/communication/CommunicationPreviewLayout.vue";
import CommunicationPreviewLeftLayout from "../layouts/communication/CommunicationPreviewLeftLayout.vue";
import { storeToRefs } from "pinia";
import { useStoreLayout } from "src/stores/layoutStore";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { financeGet } from "src/services/financeService";
import { onScopeDispose } from "vue";
import { getClientProfileSummary } from "src/services/clientProfileService";
import { readHomeDepositHistory } from "src/services/homeDepositHistory";
import {
  captureClientSession,
  assertClientSessionCurrent,
} from "src/services/clientApi";
const storeLayout = useStoreLayout();
const { dashboard } = storeToRefs(storeLayout);
const home = useFinanceResource();
const wallets = useFinanceResource();
const deposits = useFinanceResource();
const profile = useFinanceResource();
let active = true;
const loadHome = () => {
  const session = captureClientSession();
  const homeRead = home.load(
    async () => (await financeGet("client/home")).data,
  );
  return Promise.all([
    homeRead,
    profile.load(getClientProfileSummary),
    deposits.load(async () => {
      const snapshot = await homeRead;
      assertClientSessionCurrent(session);
      if (!active || !snapshot) return null;
      return readHomeDepositHistory({
        executionDatesNeeded: snapshot.chart?.status === "Available",
        list: (params) => financeGet("client/transactions", params),
        detail: async (id) =>
          (await financeGet("client/transactions/" + encodeURIComponent(id)))
            .data,
        assertCurrent: () => {
          assertClientSessionCurrent(session);
          if (!active) throw new Error("A consulta foi encerrada.");
        },
      });
    }),
  ]);
};
const loadWallets = () =>
  wallets.load(async () => (await financeGet("client/wallets")).data);
loadHome();
loadWallets();
onScopeDispose(() => {
  active = false;
  [home, wallets, deposits, profile].forEach((resource) => resource.reset());
});
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
