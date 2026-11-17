<template>
  <section class="secured-request collateral-request">
    <div class="collateral-title">
      <button
        type="button"
        class="request-back"
        aria-label="Voltar"
        :disabled="pending"
        @click="back"
      >
        <img :src="asset('back.svg')" alt="" />
      </button>
      <h1>Solicitar Empréstimo</h1>
    </div>
    <final-steps-loan-layout
      v-if="confirmed"
      confirmed
      title="Simulação de Empréstimo realizada!"
      sub-title="A simulação será analisada e retornaremos com mais detalhes"
      name-router="Alavancagem"
      text-router="Ir para Alavancagem"
      class="collateral-completed"
    />
    <div v-else class="collateral-content">
      <div class="collateral-warning">
        <img :src="asset('warning.svg')" alt="" /><span
          >Quanto melhor seu Perfil de investimento, melhor as condições de
          Empréstimo (juros, parcelas,...)</span
        >
      </div>
      <form
        class="request-card"
        :class="{ installments: step === 2 }"
        @submit.prevent="next"
      >
        <h2>
          {{
            [
              "Motivo do Empréstimo",
              "De quanto você precisa?",
              "Parcelamento",
              "Resumo",
            ][step]
          }}
        </h2>
        <div v-if="step === 0" class="request-reasons">
          <button
            v-for="reason in reasons"
            :key="reason.value"
            type="button"
            :aria-pressed="draft.reason === reason.value"
            :class="{ selected: draft.reason === reason.value }"
            @click="draft.reason = reason.value"
          >
            <span class="reason-icon"
              ><img :src="asset(reason.icon + '.svg')" alt="" /></span
            >{{ reason.label }}
          </button>
        </div>
        <loan-amount-control
          v-else-if="step === 1"
          v-model="draft.amount"
          :disabled="pending"
          :min="50000"
          :max="500000"
          min-label="R$ 50 mil"
          max-label="R$ 500 mil"
        />
        <template v-else-if="step === 2">
          <p class="collateral-value">
            Valor do Empréstimo:
            <strong>{{ profileMoney(draft.amount, "BRL") }}</strong>
          </p>
          <div class="installment-options">
            <button
              v-for="count in installments"
              :key="count"
              type="button"
              :aria-pressed="draft.installments === count"
              :class="{ selected: draft.installments === count }"
              :disabled="pending"
              @click="draft.installments = count"
            >
              {{ count }}x
            </button>
          </div>
          <div v-if="quote" class="collateral-value">
            <strong
              >{{ draft.installments }}x de
              {{
                profileMoney(quote.installmentAmount, quote.currency)
              }}</strong
            >
            <p>
              Com juros à partir de
              {{ offerPercent(quote.monthlyInterestRate) }} ao mês
            </p>
          </div>
          <p v-else class="request-unavailable" role="status">
            Valores de parcelas e juros indisponíveis.
          </p>
        </template>
        <template v-else>
          <div class="collateral-summary">
            <h3>Solicitação de Empréstimo</h3>
            <dl>
              <div v-for="row in summaryRows" :key="row[0]">
                <dt>{{ row[0] }}</dt>
                <dd>{{ row[1] }}</dd>
              </div>
            </dl>
          </div>
          <label class="choice"
            ><input
              v-model="draft.accepted"
              type="checkbox"
              :disabled="!quote || pending"
            />Eu confirmo e aceito as condições da simulação acima.</label
          >
          <p
            v-if="!quote || !submitSimulation"
            class="request-unavailable"
            role="status"
          >
            {{ loanServiceUnavailable }}
          </p>
        </template>
        <p v-if="error" role="alert" class="request-error">{{ error }}</p>
        <div class="request-actions">
          <button
            v-if="step > 0"
            type="button"
            class="collateral-previous"
            :disabled="pending"
            @click="back"
          >
            <img :src="asset('previous.svg')" alt="" />Voltar</button
          ><q-btn
            type="submit"
            color="primary"
            no-caps
            :loading="pending"
            :disable="
              pending ||
              (step === 3 && (!quote || !draft.accepted || !submitSimulation))
            "
            >Prosseguir<img :src="asset('next.svg')" alt=""
          /></q-btn>
        </div>
      </form>
    </div>
  </section>
</template>
<script setup>
import { computed, reactive, ref, watch, onScopeDispose } from "vue";
import FinalStepsLoanLayout from "src/system/layouts/loans/FinalStepsLoanLayout.vue";
import {
  matchingCollateralQuote,
  offerPercent,
  collateralQuoteSignature,
} from "src/services/loanOfferPresentation";
import LoanAmountControl from "./LoanAmountControl.vue";
import {
  loanServiceUnavailable,
  securedReasons,
  validLoanAmount,
} from "src/services/loanRequestDraft";
import { profileMoney } from "src/services/profilePresentation";
const props = defineProps({
  simulation: { type: Object, default: null },
  submitSimulation: { type: Function, default: null },
});
const emit = defineEmits(["back"]);
const asset = (name) => `/figma/loan-request/${name}`;
const step = ref(0),
  error = ref("");
const draft = reactive({
  reason: "",
  amount: null,
  installments: null,
  accepted: false,
});
const pending = ref(false),
  confirmed = ref(false);
let alive = true;
const quote = computed(() => matchingCollateralQuote(props.simulation, draft));
watch(
  () => props.simulation,
  () => {
    draft.accepted = false;
  },
  { deep: true },
);
watch(
  () => [draft.amount, draft.installments],
  () => {
    draft.accepted = false;
  },
);
onScopeDispose(() => {
  alive = false;
});
const reasons = ["goods", "investment", "debts", "refinance", "other"].map(
  (value) => securedReasons.find((r) => r.value === value),
);
const installments = [60, 90, 120, 150, 180, 210, 240];
const summaryRows = computed(() => [
  ["Valor do Empréstimo", profileMoney(draft.amount, "BRL")],
  [
    "Total a Pagar",
    quote.value
      ? profileMoney(quote.value.totalAmount, quote.value.currency)
      : "Indisponível",
  ],
  [
    "Taxa de Juros",
    quote.value
      ? offerPercent(quote.value.monthlyInterestRate)
      : "Indisponível",
  ],
  [
    "Parcelamento",
    `${draft.installments}x · ${quote.value ? profileMoney(quote.value.installmentAmount, quote.value.currency) : "Valor indisponível"}`,
  ],
  [
    "Pagamento por Distrib. de Lucros",
    quote.value
      ? `${offerPercent(quote.value.profitDistributionPercent)} (${profileMoney(quote.value.profitDistributionAmount, quote.value.currency)})/mês`
      : "Indisponível",
  ],
]);
async function next() {
  if (pending.value) return;
  if (step.value === 3) {
    if (!quote.value || !draft.accepted || !props.submitSimulation) return;
    const current = quote.value,
      signature = collateralQuoteSignature(current);
    pending.value = true;
    error.value = "";
    try {
      const result = await props.submitSimulation({ ...draft }, current);
      if (
        alive &&
        quote.value &&
        collateralQuoteSignature(quote.value) === signature &&
        result?.submitted === true
      )
        confirmed.value = true;
    } catch {
      if (alive)
        error.value = "Não foi possível enviar a simulação. Tente novamente.";
    } finally {
      if (alive) pending.value = false;
    }
    return;
  }
  error.value =
    step.value === 0 && !reasons.some((r) => r.value === draft.reason)
      ? "Selecione o motivo do empréstimo."
      : step.value === 1 && !validLoanAmount(draft.amount, 50000, 500000)
        ? "Informe um valor entre R$ 50 mil e R$ 500 mil."
        : step.value === 2 && !installments.includes(draft.installments)
          ? "Selecione o parcelamento."
          : "";
  if (!error.value && step.value < 3) step.value++;
}
function back() {
  if (pending.value) return;
  error.value = "";
  if (step.value > 0) step.value--;
  else emit("back");
}
</script>
<style scoped src="./loanRequest.scss"></style>
<style scoped>
.collateral-completed {
  margin-top: 64px;
}
.collateral-title {
  display: flex;
  align-items: center;
  gap: 16px;
}
.collateral-title h1 {
  min-width: 0;
  margin: 0;
  font-size: 41px;
  line-height: 1.5;
  font-weight: 700;
  letter-spacing: normal;
}
.collateral-title .request-back {
  margin: 0;
}
.collateral-content {
  margin-top: 64px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
  justify-items: center;
  gap: 24px;
}
.collateral-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-left: 2px solid #ff991f;
  border-radius: 4px;
  background: linear-gradient(182deg, #ffffff29, #ffffff03);
  font-size: 14px;
  max-width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
}
.collateral-warning img {
  flex: none;
}
.request-card {
  margin: 0;
  width: 480px;
  max-width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
}
.request-card.installments {
  width: 620px;
}
.collateral-value {
  text-align: center;
  color: #989898;
  font-size: 17px;
  margin: 0;
}
.installment-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  padding: 24px 16px;
  background: #ffffff08;
}
.installment-options button {
  cursor: pointer;
  color: white;
  border: 1px solid #efefef14;
  border-radius: 8px;
  padding: 12px;
  background: linear-gradient(182deg, #ffffff29, #ffffff03);
  font-weight: 700;
}
.installment-options .selected {
  border-color: #00a3ff;
}
.request-actions {
  justify-content: space-between;
  gap: 16px;
}
.request-actions > .q-btn:only-child {
  margin-left: auto;
}
.collateral-previous {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 0;
  color: #989898;
  padding: 0;
  cursor: pointer;
}
.collateral-summary {
  padding: 12px;
  background: #ffffff08;
  border-radius: 4px;
}
.collateral-summary h3 {
  font-size: 17px;
  line-height: 1.35;
  margin: 0 0 12px;
}
.collateral-summary dl {
  margin: 0;
}
.collateral-summary dl div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 8px 0;
  font-size: 14px;
}
.collateral-summary dt {
  font-weight: 400;
  color: #989898;
}
.collateral-summary dd {
  margin: 0;
  text-align: right;
  overflow-wrap: anywhere;
}
@media (max-width: 700px) {
  .collateral-title h1 {
    min-width: 0;
    font-size: 26px;
  }
  .collateral-content {
    margin-top: 32px;
  }
}
</style>
