<template>
  <q-page class="leverage-page">
    <title-page title="Alavancagem" subtitle="Alavancagem">
      <template #append>
        <q-btn
          label="Ver Minhas Alavancagens"
          no-caps
          color="primary"
          size="sm"
          :to="{ name: 'Minhas Alavacagens' }"
        />
      </template>
    </title-page>

    <q-card class="row bg-transparent tool q-ma-md justify-center">
      <div class="col-12 text-center text-inter-24-700">
        Confira Formas de Alavancagem pela Strategy Analytics
      </div>
      <leverage-resume-layout
        v-for="item in list"
        :key="item.id"
        :title="item.title"
        :subtitle="item.subtitle"
        :banks="item.banks"
        :image="item.image"
        :link="item.link"
        class="col-12"
      />
    </q-card>
  </q-page>
</template>

<script setup>
import { defineComponent } from "vue";
import TitlePage from "src/system/components/TitlePage.vue";
import LeverageResumeLayout from "src/system/layouts/leverage/LeverageResumeLayout.vue";
defineComponent({
  name: "LeveragePage",
});

// const dialog = computed(() => level.value);

const list = [
  {
    id: 1,
    title: "Empréstimo com Garantia",
    subtitle:
      "Crédito com juros menores usando um patrimônio seu como segurança",
    image: "/img/colateral.png",
    link: "/system/loan/securedLoan",
    banks: [
      "/icons/banks/c6.png",
      "/icons/banks/inter.png",
      "/icons/banks/itau.png",
      "/icons/banks/santander.png",
      "/icons/banks/trinus.png",
      "/icons/banks/bradesco.png",
      "/icons/banks/galeria-bank.png",
      "/icons/banks/sicredi.png",
      "/icons/banks/cashme.png",
    ],
  },
  {
    id: 2,
    title: "Consórcio",
    subtitle:
      "Participe de um grupo e consulte seu patrimônio no momento certo",
    image: "/img/consorcio.png",
    link: "/system/loan/consortiumLoan",
    banks: ["/icons/banks/porto.png", "/icons/banks/bradesco.png"],
  },
  {
    id: 3,
    title: "Empréstimo Colateral",
    subtitle: "Transforme seus ativos financeiros em crédito rápido e seguro!",
    image: "/img/garantia.png",
    link: "/system/loan/collateralLoan",
    banks: [
      "/icons/coins/real.png",
      "/icons/coins/dollar.png",
      "/icons/coins/euro.png",
      "/icons/coins/ChatGPt-13.png",
      "/icons/coins/bitcoin.png",
      "/icons/coins/ChatGPT-15.png",
      "/icons/coins/ChatGPT-14.png",
    ],
  },
];
</script>

<style scoped>
/* Estilos específicos do componente aqui */
.block-icon {
  width: 30rem;
  height: 15rem;
}
.control-card-block {
  gap: 32px;
  opacity: 1;
}
</style>
