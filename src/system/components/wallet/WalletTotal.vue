<template>
  <div class="wallet-total col-md-auto col-xs-12" :aria-busy="loading">
    <p class="text-h6 text-weight-light">Carteira Total</p>
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
        v-for="amount in amounts.slice(1).filter((item) => item.value !== null)"
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
      aria-label="Distribuição por carteira indisponível"
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
        @click="unavailable('Depósito')"
        ><IconArrowDown
          width="24"
          height="24"
          class="btn-pattern-transparent-icon"
        />Depósito</q-btn
      >
      <q-btn
        class="btn-pattern-transparent"
        no-caps
        @click="unavailable('Transferência')"
        ><IconTransfer
          width="24"
          height="24"
          class="btn-pattern-transparent-icon"
        />Transferência</q-btn
      >
      <q-btn class="btn-pattern-transparent" no-caps :to="{ name: 'Saque' }"
        ><IconArrowUp
          width="24"
          height="24"
          class="btn-pattern-transparent-icon"
        />Saque</q-btn
      >
    </div>
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
import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import useStorage from "src/composables/system/useStorage";
import { useStoreLayout } from "src/stores/layoutStore";
import { storeToRefs } from "pinia";
import { amountLabel } from "src/services/walletPresentation";
const storeLayout = useStoreLayout();
const { dashboard } = storeToRefs(storeLayout);
const { setSystemViewValues } = useStorage();
const route = useRoute(),
  router = useRouter(),
  $q = useQuasar();
defineProps({
  amounts: { type: Array, default: () => [] },
  loading: Boolean,
  error: String,
});
defineEmits(["retry"]);
const viewValues = async () => {
  storeLayout.setToggleViewWalletValues();
  await setSystemViewValues();
};
const unavailable = (action) =>
  $q.notify({
    message: `${action} ainda não está disponível pelo portal.`,
    type: "info",
  });
watch(
  () => route.query.modal,
  async (modal) => {
    if (modal !== "deposit") return;
    unavailable("Depósito");
    const query = { ...route.query };
    delete query.modal;
    await router.replace({ query });
  },
  { immediate: true },
);
</script>
<style scoped lang="sass">
/* Seus estilos aqui */
.btn-pattern-transparent-icon
  background: linear-gradient(202.99deg, rgba(0, 0, 0, 0.24) 0.52%, rgba(0, 0, 0, 0.08) 51.12%, rgba(0, 0, 0, 0.04) 99.48%);
  border-radius: 4px
  padding: 4px
  margin-right: 8px
  color:#00A3FF
</style>
