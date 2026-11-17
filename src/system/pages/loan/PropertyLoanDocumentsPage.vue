<template>
  <q-page><property-loan-documents @back="router.back()" /></q-page>
</template>
<script setup>
import { useRouter } from "vue-router";
import PropertyLoanDocuments from "src/system/components/loan/PropertyLoanDocuments.vue";
const router = useRouter();
</script>
