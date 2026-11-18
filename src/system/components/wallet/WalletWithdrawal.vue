<template>
  <withdrawal-flow
    :model="model"
    :banks="accounts"
    :bank-state="bankState"
    :submit-operation="submitOperation"
    @completed="$emit('completed')"
    @busy="$emit('busy', $event)"
    @state="$emit('state', $event)"
    @recover="recoveryOpen = true"
    @retry-banks="loadAccounts"
    @add-bank="addBank"
  />
  <q-dialog v-model="recoveryOpen"
    ><q-card class="tool q-pa-lg withdrawal-recovery-dialog"
      ><forgotpassword-layout @status-login="recoveryOpen = false" /></q-card
  ></q-dialog>
</template>
<script setup>
import { computed, onScopeDispose, ref } from "vue";
import { useRouter } from "vue-router";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { financeGet } from "src/services/financeService";
import { listAllClientBanks } from "src/services/clientProfileService";
import { readWalletBankAccounts } from "src/services/walletModel";
import WithdrawalFlow from "./WithdrawalFlow.vue";
import ForgotpasswordLayout from "src/system/layouts/auth/ForgotpasswordLayout.vue";
defineProps({
  model: { type: Object, default: null },
  submitOperation: { type: Function, default: null },
});
const emit = defineEmits(["completed", "busy", "state", "close"]),
  router = useRouter(),
  banks = useFinanceResource(),
  catalog = useFinanceResource(),
  recoveryOpen = ref(false);
let revision = 0,
  active = true;
const loadAccounts = () => {
  const current = ++revision;
  banks.load(() =>
    readWalletBankAccounts(
      (page) =>
        financeGet("client/profile/bank-accounts", { page, pageSize: 100 }),
      () => active && current === revision,
    ),
  );
  catalog.load(listAllClientBanks);
};
const accounts = computed(() =>
  (banks.state.data || []).map((bank) => {
    const entry = catalog.state.data?.find((b) => b.id === bank.bankId);
    const name = bank.bankName || entry?.name;
    const code = bank.bankCode || entry?.code;
    return {
      ...bank,
      displayName: name
        ? (code ? code + " - " : "") + name
        : "Banco não informado",
    };
  }),
);
const bankState = computed(() => ({
  loading: banks.state.loading,
  error:
    banks.state.error ||
    (!banks.state.loading &&
    catalog.state.error &&
    accounts.value.some((b) => b.displayName === "Banco não informado")
      ? catalog.state.error
      : ""),
}));
function addBank() {
  router.push({ name: "profile", query: { tab: "bank", action: "add" } });
}
loadAccounts();
onScopeDispose(() => {
  active = false;
  revision++;
  banks.reset();
  catalog.reset();
});
</script>
<style scoped>
.withdrawal-recovery-dialog {
  width: 512px;
  max-width: calc(100vw - 32px);
}
.withdrawal-recovery-dialog :deep(.col-md-3) {
  width: 100%;
}
</style>
