<template>
  <div>
    <resource-state :state="resource.state" @retry="load">
      <table-installments
        :parcelas="resource.state.data || []"
        :currency="loan.currencyIsoCode"
        :empty-label="
          adapter?.listInstallments
            ? 'Nenhuma parcela disponível.'
            : 'Consulta de parcelas indisponível.'
        "
        :pay-selected="canPay ? beginPayment : null"
        :pay-one="canPay ? (row) => beginPayment([row]) : null"
        :upload-receipt="
          adapter?.uploadReceipt
            ? (row) => adapter.uploadReceipt(loan, row)
            : null
        "
        :download-statement="
          adapter?.downloadStatement
            ? () => adapter.downloadStatement(loan)
            : null
        "
        :anticipate="
          canPay ? (row) => beginPayment([row]) : null
        " /></resource-state
    ><q-dialog v-model="paymentOpen" persistent
      ><loan-installment-payment
        v-if="session"
        :title="loanSummaryTitle(loan)"
        :type="loan.kind"
        :type-description="
          loanKindPresentation(loan.kind)?.label?.replace(/^Com /, '')
        "
        :session="session"
        :submit-receipt="uploadPaymentReceipt"
        @close="close"
        @completed="completed"
    /></q-dialog>
  </div>
</template>
<script setup>
import { computed, ref, watch, onScopeDispose } from "vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import {
  installmentSelection,
  loanPaymentSession,
} from "src/services/loanPaymentPresentation";
import {
  loanSummaryTitle,
  loanKindPresentation,
} from "src/services/loanSummaryPresentation";
import TableInstallments from "./TableInstallments.vue";
import ResourceState from "../finance/ResourceState.vue";
import LoanInstallmentPayment from "../loan/LoanInstallmentPayment.vue";
const props = defineProps({
  loan: { type: Object, required: true },
  adapter: { type: Object, default: null },
});
const resource = useFinanceResource(),
  session = ref(null),
  paymentOpen = ref(false),
  canPay = computed(
    () => !!props.adapter?.preparePayment && !!props.adapter?.submitReceipt,
  );
let active = true,
  version = 0,
  preparing = null;
function close() {
  paymentOpen.value = false;
  session.value = null;
}
function load() {
  const current = ++version,
    loan = props.loan;
  close();
  preparing = null;
  if (!props.adapter?.listInstallments) {
    resource.reset();
    return;
  }
  return resource.load(async () => {
    const rows = await props.adapter.listInstallments(loan);
    if (!active || current !== version) return null;
    if (!Array.isArray(rows)) throw Error("Parcelas indisponíveis.");
    return rows;
  });
}
async function beginPayment(selection) {
  if (preparing || !canPay.value) return;
  const current = version,
    loan = props.loan,
    chosen = installmentSelection(resource.state.data, selection);
  const operation = Symbol("payment-preparation");
  preparing = operation;
  try {
    const result = await props.adapter.preparePayment(loan, chosen);
    if (!active || current !== version || loan.id !== props.loan.id) return;
    installmentSelection(resource.state.data, chosen);
    session.value = loanPaymentSession(loan, chosen, result);
    paymentOpen.value = true;
  } finally {
    if (preparing === operation) preparing = null;
  }
}
async function uploadPaymentReceipt(file) {
  const current = version,
    prepared = session.value;
  if (
    !active ||
    !prepared ||
    prepared.loanId !== props.loan.id ||
    !props.adapter?.submitReceipt
  )
    throw Error("Pagamento indisponível.");
  const result = await props.adapter.submitReceipt(props.loan, prepared, file);
  if (!active || current !== version || session.value !== prepared)
    throw Error("Pagamento alterado.");
  return result;
}
function completed() {
  close();
  load();
}
watch([() => props.loan, () => props.adapter], load, {
  immediate: true,
  deep: true,
});
onScopeDispose(() => {
  active = false;
  version++;
  close();
  resource.reset();
});
</script>
