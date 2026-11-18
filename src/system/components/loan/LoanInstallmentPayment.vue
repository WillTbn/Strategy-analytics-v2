<template>
  <card-pay-installments
    v-if="step === 'review'"
    :title="title"
    :type="type"
    :type-description="typeDescription"
    :installments="session?.installments || []"
    :quote="session?.quote"
    :can-continue="ready"
    @back="$emit('close')"
    @next="continuePayment"
  /><card-qrcode-payment
    v-else-if="step === 'payment'"
    :pix-code="session.pixCode"
    :pix-key="session.pixKey"
    :submit-receipt="submitReceipt"
    @back="step = 'review'"
    @next="submitted"
  /><card-payment-submitted v-else @completed="$emit('completed')" />
</template>
<script setup>
import { computed, ref, watch } from "vue";
import { validLoanPaymentSession } from "src/services/loanPaymentPresentation";
import CardPayInstallments from "./CardPayInstallments.vue";
import CardQrcodePayment from "./CardQrcodePayment.vue";
import CardPaymentSubmitted from "./CardPaymentSubmitted.vue";
const props = defineProps({
  title: String,
  type: String,
  typeDescription: String,
  session: { type: Object, default: null },
  submitReceipt: { type: Function, default: null },
});
defineEmits(["close", "completed"]);
const step = ref("review"),
  ready = computed(
    () => validLoanPaymentSession(props.session) && !!props.submitReceipt,
  );
function continuePayment() {
  if (ready.value) step.value = "payment";
}
function submitted(result) {
  if (ready.value && result?.submitted === true) step.value = "submitted";
}
watch(
  () => props.session,
  () => (step.value = "review"),
  { deep: true, flush: "sync" },
);
</script>
