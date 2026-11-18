<template>
  <q-card class="loan-payment-card loan-payment-submitted"
    ><div class="loan-payment-submitted-art">
      <img :src="assets.success" alt="" />
    </div>
    <h2>Pagamento de Parcelas em andamento!</h2>
    <p>Logo o seu pagamento será validado pelo nosso sistema.</p>
    <div class="loan-payment-footer">
      <q-btn no-caps color="primary" @click="$emit('completed')"
        >Ir para Alavancagens<img :src="assets.next" alt=""
      /></q-btn></div
  ></q-card>
</template>
<script setup>
import { leveragePaymentAssets as assets } from "src/services/leveragePaymentAssets";
defineEmits(["completed"]);
</script>
<style scoped lang="scss">
@import "./loanPaymentCard.scss";
.loan-payment-submitted {
  background: linear-gradient(204.8deg, #0000003d, #00000014 51%, #0000000a);
  text-align: center;
  padding-top: 22px;
  padding-bottom: 14px;
}
.loan-payment-submitted-art {
  width: 407px;
  max-width: 100%;
  aspect-ratio: 407/400;
  position: relative;
  overflow: hidden;
  margin: 0 auto 32px;
}
.loan-payment-submitted-art img {
  position: absolute;
  width: 196.08%;
  height: 108.87%;
  max-width: none;
  left: -48.04%;
  top: -4.44%;
}
.loan-payment-submitted h2 {
  margin-bottom: 12px;
}
.loan-payment-submitted .loan-payment-footer {
  justify-content: center;
  margin-top: 40px;
}
</style>
