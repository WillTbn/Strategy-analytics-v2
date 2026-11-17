<template>
  <q-page
    ><collateral-request-wizard @back="router.push('/system/leverage')"
  /></q-page>
</template>
<script setup>
import { useRouter } from "vue-router";
import CollateralRequestWizard from "src/system/components/loan/CollateralRequestWizard.vue";
const router = useRouter();
</script>
