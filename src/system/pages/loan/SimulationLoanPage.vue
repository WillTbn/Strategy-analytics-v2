<template>
  <q-page
    ><loan-offers-screen
      kind="preliminary"
      :secured-type="
        route.query.secured === 'automovel' ? 'automovel' : 'imovel'
      "
      @back="router.back()"
  /></q-page>
</template>
<script setup>
import { useRoute, useRouter } from "vue-router";
import LoanOffersScreen from "src/system/components/loan/LoanOffersScreen.vue";
const route = useRoute(),
  router = useRouter();
</script>
