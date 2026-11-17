<template>
  <loan-product-options @simular="$emit('simular', $event)" />
</template>
<script setup>
import LoanProductOptions from "src/system/components/loan/LoanProductOptions.vue";
defineEmits(["simular"]);
</script>
