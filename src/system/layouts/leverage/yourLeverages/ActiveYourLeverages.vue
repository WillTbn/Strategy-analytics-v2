<template><active-leverage-list :loans="rows" :payment-adapter="paymentAdapter"/></template><script setup>
import {computed} from "vue";
import ActiveLeverageList from "src/system/components/leverage/ActiveLeverageList.vue";
import {useClientLoans} from "src/composables/system/useClientLoans";
import {loansByStatus} from "src/services/clientLoans";
const {resource,paymentAdapter}=useClientLoans();
const rows=computed(()=>loansByStatus(resource.state.data,"actives"));
</script>
