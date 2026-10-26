<template>
  <div class="wallet-total col-md-auto col-xs-12" :aria-busy="loading">
    <p class="wallet-total-title">
      Carteira Total<q-icon
        name="info_outline"
        size="20px"
        class="q-ml-sm"
        tabindex="0"
        aria-label="Sobre a Carteira Total"
        ><q-tooltip
          >Depósito + Strategy + Patrimônio, convertidos pela cotação diária
          para exibição na moeda principal.</q-tooltip
        ></q-icon
      >
    </p>
    <div
      class="text-h3 text-weight-bolder"
      style="line-height: 2rem; margin-top: 1.5rem"
    >
      {{
        loading
          ? "…"
          : dashboard.view_wallet_value
            ? "••••"
            : amountLabel(amounts[0])
      }}
      <q-btn
        flat
        :aria-label="
          dashboard.view_wallet_value ? 'Mostrar valores' : 'Ocultar valores'
        "
        @click="viewValues"
      >
        <IconEye v-if="dashboard.view_wallet_value" /><IconEyeOff v-else />
      </q-btn>
      <br />
      <b
        v-for="amount in empty
          ? []
          : amounts.slice(1).filter((item) => item.value !== null)"
        :key="amount.currency"
        class="text-h6 text-weight-light"
        >{{ dashboard.view_wallet_value ? "••••" : amountLabel(amount) }}<br
      /></b>
      <b
        v-if="!amounts.some((item) => item.value !== null)"
        class="text-h6 text-weight-light"
        >{{ loading ? "Carregando" : "Posição atual indisponível" }}</b
      >
    </div>
    <div
      style="width: 84%; height: 0.4rem; display: flex; border-radius: 8px"
      class="q-my-sm bg-grey-8"
      :aria-label="
        empty ? 'Carteira sem saldo' : 'Distribuição por carteira indisponível'
      "
    ></div>
    <div v-if="error" role="alert" class="text-caption">
      {{ error }}
      <q-btn
        flat
        dense
        no-caps
        label="Tentar novamente"
        @click="$emit('retry')"
      />
    </div>
    <div class="actions row q-gutter-md q-mt-sm">
      <q-btn
        class="btn-pattern-transparent"
        no-caps
        @click="operation = 'deposit'"
        ><IconArrowDown
          width="24"
          height="24"
          class="btn-pattern-transparent-icon"
        />Depósito</q-btn
      >
      <q-btn
        class="btn-pattern-transparent"
        no-caps
        @click="operation = 'transfer'"
        ><IconTransfer
          width="24"
          height="24"
          class="btn-pattern-transparent-icon"
        />Transferência</q-btn
      >
      <q-btn
        class="btn-pattern-transparent"
        no-caps
        @click="operation = 'withdrawal'"
        ><IconArrowUp
          width="24"
          height="24"
          class="btn-pattern-transparent-icon"
        />Saque</q-btn
      >
    </div>
    <q-dialog
      :model-value="!!operation"
      @update:model-value="!$event && (operation = null)"
    >
      <wallet-operation
        v-if="operation"
        :key="operation"
        :mode="operation"
        :model="walletModel"
        @close="operation = null"
        @completed="
          operation = null;
          $emit('retry');
        "
      />
    </q-dialog>
  </div>
</template>
<script setup>
import {
  IconArrowDown,
  IconArrowUp,
  IconTransfer,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-vue";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import WalletOperation from "./WalletOperation.vue";
import useStorage from "src/composables/system/useStorage";
import { useStoreLayout } from "src/stores/layoutStore";
import { storeToRefs } from "pinia";
import { amountLabel } from "src/services/walletPresentation";
const storeLayout = useStoreLayout();
const { dashboard } = storeToRefs(storeLayout);
const { setSystemViewValues } = useStorage();
const route = useRoute(),
  router = useRouter();
const operation = ref(null);
defineProps({
  walletModel: { type: Object, default: null },
  amounts: { type: Array, default: () => [] },
  loading: Boolean,
  error: String,
  empty: Boolean,
});
defineEmits(["retry"]);
const viewValues = async () => {
  storeLayout.setToggleViewWalletValues();
  await setSystemViewValues();
};
watch(
  () => route.query.modal,
  async (modal) => {
    if (modal !== "deposit") return;
    operation.value = "deposit";
    const query = { ...route.query };
    delete query.modal;
    await router.replace({ query });
  },
  { immediate: true },
);
</script>
<style scoped lang="sass">
.wallet-total-title
  font: 400 32px/1.4 Roboto, sans-serif
  color: #dcdcdc
.empty-usd
  font: 500 24px/1.1 Roboto, sans-serif
/* Seus estilos aqui */
.btn-pattern-transparent-icon
  background: linear-gradient(202.99deg, rgba(0, 0, 0, 0.24) 0.52%, rgba(0, 0, 0, 0.08) 51.12%, rgba(0, 0, 0, 0.04) 99.48%);
  border-radius: 4px
  padding: 4px
  margin-right: 8px
  color:#00A3FF
</style>
