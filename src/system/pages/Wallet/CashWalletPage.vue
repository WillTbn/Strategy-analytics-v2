<template>
  <q-page class="q-pa-md"
    ><title-page title="Solicitar saque" to-back />
    <section class="tool q-pa-lg withdrawal-form" :inert="busy || undefined">
      <resource-state :state="wallets.state" @retry="loadWallets"
        ><p v-if="!wallets.state.data?.length">
          Nenhuma carteira disponível. Entre em contato com seu assessor para
          verificar sua conta.
        </p>
        <label class="text-weight-medium">Carteira de origem</label
        ><q-select
          v-model="wallet"
          :options="wallets.state.data || []"
          :option-label="
            (w) => `${financeLabel(w.type)} · ${w.currencyIsoCode}`
          "
          outlined
          dense
          aria-label="Carteira de origem"
          class="q-mt-sm"
        />
        <p v-if="wallet" class="q-mt-md">
          Disponível: {{ money(wallet.available, wallet.currencyIsoCode) }}
        </p>
        <q-banner v-if="wallet && !wallet.currencyId" class="bg-transparent"
          >A solicitação de saque está temporariamente indisponível para esta
          moeda. Entre em contato com seu assessor.</q-banner
        ></resource-state
      >
      <resource-state :state="accounts.state" @retry="loadAccounts"
        ><p v-if="!accounts.state.data?.length">
          Nenhuma conta bancária ativa cadastrada. Confira seus dados bancários
          no perfil ou entre em contato com seu assessor.
        </p>
        <label class="text-weight-medium">Conta de destino</label
        ><q-select
          v-model="bankId"
          :options="accounts.state.data || []"
          option-value="id"
          :option-label="(a) => `Conta ${a.accountNumberMasked || 'mascarada'}`"
          emit-value
          map-options
          outlined
          dense
          aria-label="Conta de destino"
          class="q-mt-sm"
      /></resource-state>
      <q-form class="q-mt-md" @submit="confirm"
        ><label class="text-weight-medium">Valor do saque</label
        ><q-input
          v-model.number="amount"
          outlined
          dense
          type="number"
          min="0.01"
          step="0.01"
          aria-label="Valor do saque"
          class="q-mt-sm"
          :rules="[
            (v) => Number(v) > 0 || 'Informe um valor positivo',
            (v) =>
              Number(v) <= Number(wallet?.available) ||
              'O valor excede o saldo disponível',
          ]" /><q-banner v-if="error" role="alert">{{ error }}</q-banner
        ><q-banner v-if="success" role="status"
          >Solicitação registrada. Acompanhe a aprovação nas movimentações da
          carteira.</q-banner
        ><q-btn
          type="submit"
          color="primary"
          no-caps
          label="Solicitar saque"
          :disable="!wallet?.currencyId || !bankId || success"
          :loading="busy"
          class="q-mt-md"
      /></q-form></section
  ></q-page>
</template>
<script setup>
import { ref } from "vue";
import { useQuasar } from "quasar";
import TitlePage from "../../components/TitlePage.vue";
import ResourceState from "../../components/finance/ResourceState.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import {
  financeGet,
  financeWrite,
  money,
  financeLabel,
} from "src/services/financeService";
const $q = useQuasar(),
  wallets = useFinanceResource(),
  accounts = useFinanceResource(),
  wallet = ref(null),
  bankId = ref(null),
  amount = ref(null),
  error = ref(""),
  busy = ref(false),
  success = ref(false);
const loadWallets = () =>
  wallets.load(async () => (await financeGet("client/wallets")).data);
const loadAccounts = () =>
  accounts.load(
    async () =>
      (
        await financeGet("client/profile/bank-accounts", { pageSize: 100 })
      ).data?.filter((a) => a.status === "Active") || [],
  );
function confirm() {
  if (!wallet.value?.currencyId || !bankId.value || busy.value) return;
  $q.dialog({
    title: "Confirmar saque",
    message: `Solicitar ${money(amount.value, wallet.value.currencyIsoCode)} para a conta selecionada?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    busy.value = true;
    error.value = "";
    try {
      await financeWrite("post", "client/transactions/withdrawals", {
        currencyId: wallet.value.currencyId,
        destinationBankAccountId: bankId.value,
        amount: Number(amount.value),
      });
      success.value = true;
      await loadWallets();
    } catch {
      error.value =
        "Não foi possível solicitar o saque. Confira sua conta e o saldo disponível.";
    } finally {
      busy.value = false;
    }
  });
}
loadWallets();
loadAccounts();
</script>
<style scoped>
.withdrawal-form {
  max-width: 760px;
  margin: 0 auto;
}
</style>
