<template>
  <div>
    <div v-if="loading" role="status">
      <q-spinner color="primary" /> Carregando contas...
    </div>
    <div v-else-if="error" class="text-negative" role="alert">
      {{ error }}
      <q-btn
        flat
        dense
        no-caps
        label="Tentar novamente"
        color="primary"
        @click="load"
      />
    </div>
    <template v-else>
      <div v-if="!accounts.length" class="text-grey">
        Nenhuma conta bancária cadastrada.
      </div>
      <div
        v-for="account in accounts"
        :key="account.id"
        class="bank-summary q-py-sm"
      >
        <q-badge
          v-if="account.isPrimary"
          outline
          color="primary"
          class="q-mb-sm"
          >Principal</q-badge
        >
        <p class="text-weight-bold">{{ bankName(account.bankId) }}</p>
        <p class="text-grey">
          Agência {{ account.branch || "Não informado" }} · Conta
          {{ account.accountNumberMasked || "Não informado" }}
        </p>
      </div>
    </template>
  </div>
</template>
<script setup>
import { onScopeDispose, ref } from "vue";
import {
  listClientBankAccounts,
  listClientBanks,
} from "src/services/clientProfileService";
import { collection } from "src/services/profilePresentation";
import { getApiErrorMessage } from "src/services/clientAuthService";
const accounts = ref([]),
  banks = ref([]),
  loading = ref(false),
  error = ref("");
let active = true;
onScopeDispose(() => {
  active = false;
});
const bankName = (id) =>
  banks.value.find((bank) => bank.id === id)?.name || "Banco não informado";
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [a, b] = await Promise.all([
      listClientBankAccounts({ page: 1, pageSize: 100 }),
      listClientBanks({ page: 1, pageSize: 200 }),
    ]);
    if (active) {
      accounts.value = collection(a);
      banks.value = collection(b);
    }
  } catch (e) {
    if (active)
      error.value = getApiErrorMessage(
        e,
        "Não foi possível carregar suas contas bancárias.",
      );
  } finally {
    if (active) loading.value = false;
  }
}
load();
</script>
<style scoped>
.bank-summary {
  overflow-wrap: anywhere;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
