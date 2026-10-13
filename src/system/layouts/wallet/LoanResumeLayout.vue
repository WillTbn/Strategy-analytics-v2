<template>
  <div class="q-my-md card-wallet">
    <q-card
      class="loan-resume-layout bg-transparent row q-px-md q-mt-md q-pb-md"
    >
      <div class="col-12">
        <h2 class="text-h7">
          Empréstimos
          <q-btn color="primary" flat no-caps :to="{ name: 'Alavancagem' }">
            Ver mais
            <IconArrowRight class="q-ml-xs" />
          </q-btn>
        </h2>
      </div>
      <resume-loans
        v-for="(item, index) in loans"
        :key="index"
        :title="item.title"
        :icon="item.icon"
        :balance="item.balance"
        :cipher="item.cipher"
        :br-coin="item.brCoin"
        :description="item.description"
        :viewValues="dashboard.view_wallet_value"
      />
    </q-card>
  </div>
</template>

<script setup>
import { defineComponent } from "vue";
import ResumeLoans from "src/system/components/loan/ResumeLoans.vue";
import { storeToRefs } from "pinia";
import { useStoreLayout } from "src/stores/layoutStore";
defineComponent({
  name: "LoanResumeLayout",
});
const storeLayout = useStoreLayout();
const { dashboard } = storeToRefs(storeLayout);
const loans = [
  {
    title: "Empréstimos Vigentes",
    balance: "—",
    cipher: false,
    description: "Indisponível",
  },
  {
    title: "Valor Total Vigente",
    icon: "IconReceipt",
    balance: "—",
    cipher: false,
    description: "Indisponível",
  },
  {
    title: "Próxima Parcela",
    icon: "IconCalendarDollar",
    balance: "—",
    cipher: false,
    description: "Indisponível",
  },
  {
    title: "Quitação",
    icon: "IconChartPie",
    balance: "—",
    cipher: false,
    description: "Indisponível",
  },
];
</script>

<style scoped>
/* Estilos específicos do componente aqui */
</style>
