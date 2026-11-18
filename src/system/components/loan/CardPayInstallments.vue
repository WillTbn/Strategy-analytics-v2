<template>
  <q-card class="loan-payment-card card-pay-installments"
    ><h2>Pagamento de Parcelas</h2>
    <p>
      Verifique todas as informações antes de prosseguir para o pagamento da
      parcela.
    </p>
    <div class="payment-loan">
      <div class="payment-loan-title">
        <img :src="assets.file" alt="" /><strong>{{
          title || "Empréstimo"
        }}</strong
        ><span v-if="typeDescription" class="payment-loan-type"
          ><img
            v-if="kind"
            :src="
              type === 'secured_automovel'
                ? assets.car
                : '/figma/my-leverage/' + kind.icon
            "
            alt=""
          />{{ typeDescription }}</span
        >
      </div>
      <p>
        Parcela(s) à pagar :
        <strong>{{
          installments.length
            ? installments.map((value) => "#" + value).join(" e ")
            : "—"
        }}</strong>
      </p>
    </div>
    <div class="payment-summary">
      <h3>Resumo</h3>
      <dl>
        <div>
          <dt>Data de Pagamento</dt>
          <dd>
            {{ quote?.paymentDate ? profileDate(quote.paymentDate) : "—" }}
          </dd>
        </div>
        <div>
          <dt>Valor à ser Pago</dt>
          <dd>{{ money(quote?.grossAmount) }}</dd>
        </div>
        <div>
          <dt>Desconto por Antecipação</dt>
          <dd class="payment-discount">
            {{
              quote?.discountAmount == null
                ? "—"
                : "- " + money(quote.discountAmount)
            }}
          </dd>
        </div>
        <div>
          <dt>Total à ser Pago</dt>
          <dd class="payment-total">{{ money(quote?.totalAmount) }}</dd>
        </div>
      </dl>
    </div>
    <div class="loan-payment-footer">
      <q-btn flat no-caps color="white" @click="$emit('back')"
        ><img :src="assets.back" alt="" />Voltar</q-btn
      ><q-btn
        no-caps
        color="primary"
        label="Ir para Pagamento"
        :disable="!canContinue || !validQuote"
        @click="$emit('next')"
      /></div
  ></q-card>
</template>
<script setup>
import { computed } from "vue";
import { validLoanPaymentQuote } from "src/services/loanPaymentPresentation";
import { leveragePaymentAssets as assets } from "src/services/leveragePaymentAssets";
import { loanKindPresentation } from "src/services/loanSummaryPresentation";
import { profileDate, profileMoney } from "src/services/profilePresentation";
const props = defineProps({
  title: String,
  type: String,
  typeDescription: String,
  installments: { type: Array, default: () => [] },
  quote: { type: Object, default: null },
  canContinue: Boolean,
});
defineEmits(["back", "next"]);
const kind = computed(() => loanKindPresentation(props.type));
const money = (value) =>
  value == null ? "—" : profileMoney(value, props.quote?.currency);
const validQuote = computed(() => validLoanPaymentQuote(props.quote));
</script>
<style scoped lang="scss">
@import "./loanPaymentCard.scss";
.payment-loan {
  padding: 12px;
  margin-top: 32px;
  border-radius: 8px;
  backdrop-filter: blur(20px);
  background: linear-gradient(184.16deg, #0000003d, #00000014 51%, #0000000a);
  box-shadow: 4px 4px 12px #0000003d;
}
.payment-loan-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 17px;
  line-height: 1.35;
}
.payment-loan-title strong {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.payment-loan-type {
  min-height: 24px;
  line-height: 1.35;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  border: 1px solid #656565;
  border-radius: 4px;
  padding: 2px 8px;
  background: #ffffff0a;
}
.payment-loan p {
  font-size: 17px;
  line-height: 1.35;
  margin: 16px 0 0;
  color: #dcdcdc;
}
.payment-loan p strong {
  color: #00a3ff;
}
.payment-summary {
  margin-top: 32px;
  padding: 8px 12px;
  border-radius: 8px;
  background: linear-gradient(203deg, #ffffff0f, #ffffff03 80%);
}
.payment-summary h3 {
  font:
    500 17px/1.35 Inter,
    sans-serif;
  margin: 0 0 12px;
}
.payment-summary dl {
  margin: 0;
}
.payment-summary dl > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 35px;
  font-size: 14px;
}
.payment-summary dt {
  color: #989898;
}
.payment-summary dd {
  margin: 0;
  text-align: right;
  overflow-wrap: anywhere;
}
.payment-discount {
  color: #52c41a;
}
.payment-total {
  color: #00a3ff;
  font-weight: 700;
}
</style>
