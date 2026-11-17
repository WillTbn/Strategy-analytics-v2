<template>
  <loan-status-card
    v-bind="$props"
    mode="settled"
    @select="$emit('select')"
    @closed="$emit('closed')"
    ><slot
  /></loan-status-card>
</template>
<script setup>
import LoanStatusCard from "./LoanStatusCard.vue";
defineProps({
  detail: Boolean,
  title: String,
  type: String,
  typeDescription: String,
  hash: String,
  nextInstallment: [Number, String],
  dueDate: String,
  interest: String,
  totalInstallments: Number,
  installmentsPaidOff: Number,
  administrativeFee: String,
  profDistribution: String,
  embeddedBid: String,
  adminstration: String,
  paidOff: String,
  isActive: { type: Boolean, default: true },
  confirmedSettled: Boolean,
  status: String,
  icon: String,
});
defineEmits(["select", "closed", "edit"]);
</script>
