<template>
  <div
    class="opportunity-investment"
    :class="{
      'opportunity-investment--offer': offer,
      'opportunity-investment--offer-finish': offer && stepHighPerfomance > 5,
    }"
  >
    <loading-step
      :step-number="stepHighPerfomance"
      v-if="stepHighPerfomance <= 5"
    />
    <form @submit.prevent="increment">
      <component
        class="opportunity-investment__step"
        :is="currentComponent"
        :key="stepHighPerfomance"
        :offer="offer"
      />
      <p v-if="error" role="alert" class="opportunity-investment__error">
        {{ error }}
      </p>
      <div
        class="opportunity-investment__footer"
        v-if="stepHighPerfomance <= 5"
      >
        <q-btn flat no-caps :disable="busy" @click="decrement"
          ><img :src="backIcon" alt="" />Voltar</q-btn
        ><q-btn
          color="primary"
          no-caps
          type="submit"
          :disable="!ready || busy"
          :loading="busy"
          >{{ stepHighPerfomance === 5 ? "Enviar solicitação" : "Prosseguir"
          }}<img
            v-if="offer && stepHighPerfomance < 5"
            class="opportunity-investment__next"
            src="/system/icons/contracts/offer/imgIconJamIconsOutlineLogosArrowRight.svg"
            alt=""
        /></q-btn>
      </div>
      <div v-else class="text-center">
        <q-btn color="primary" no-caps @click="goContract"
          >Ir para Contratos<img
            v-if="offer"
            class="opportunity-investment__next"
            src="/system/icons/contracts/offer/imgIconJamIconsOutlineLogosArrowRight.svg"
            alt=""
        /></q-btn>
      </div>
    </form>
  </div>
</template>
<script setup>
import { defineComponent, ref, computed, onScopeDispose } from "vue";
import { useInvestmentStore } from "src/stores/investments";
import { storeToRefs } from "pinia";
import {
  emptyContractRequestDraft,
  requestStepReady,
  contractRequestComplete,
  submitContractRequest,
  requestSendUnavailable,
} from "src/services/contractRequestDraft";
import LoadingStep from "src/system/components/LoadingStep.vue";
import StepROneHighPerfomance from "src/system/layouts/contracts/HighPerfomance/StepROneHighPerfomance.vue";
import StepTwoHighPerfomance from "./HighPerfomance/StepTwoHighPerfomance.vue";
import StepThreeHighPerfomance from "./HighPerfomance/StepThreeHighPerfomance.vue";
import StepFourHighPerfomance from "./HighPerfomance/StepFourHighPerfomance.vue";
import StepFiveHighPerfomance from "./HighPerfomance/StepFiveHighPerfomance.vue";
import FinishHighPerfomance from "./HighPerfomance/FinishHighPerfomance.vue";
import { useRouter } from "vue-router";
const router = useRouter();
const props = defineProps({
  offer: Boolean,
  submit: { type: Function, default: submitContractRequest },
});
const busy = ref(false),
  error = ref("");
let active = true;
onScopeDispose(() => {
  active = false;
  storeInvestment.highPerfomance = emptyContractRequestDraft();
  storeInvestment.stepHighPerfomance = 1;
});
const currentComponent = computed(() => {
  const components = {
    1: StepROneHighPerfomance,
    2: StepTwoHighPerfomance,
    3: StepThreeHighPerfomance,
    4: StepFourHighPerfomance,
    5: StepFiveHighPerfomance,
    6: FinishHighPerfomance,
  };
  return components[stepHighPerfomance.value];
});
defineComponent({
  name: "OpportunityInvestment",
});
const emit = defineEmits(["closed", "busy"]);
const storeInvestment = useInvestmentStore();
const { stepHighPerfomance } = storeToRefs(storeInvestment);
storeInvestment.stepHighPerfomance = 1;
storeInvestment.highPerfomance = emptyContractRequestDraft();
const ready = computed(() =>
  requestStepReady(stepHighPerfomance.value, storeInvestment.highPerfomance),
);
const backIcon = computed(() =>
  props.offer
    ? [
        "/system/icons/contracts/offer/imgArrowLeft.svg",
        "/system/icons/contracts/directory/1-37919-imgArrowLeft.svg",
        "/system/icons/contracts/directory/1-39765-imgArrowLeft.svg",
        "/system/icons/contracts/directory/1-41589-imgArrowLeft.svg",
        "/system/icons/contracts/request/1-45461-imgArrowLeft.svg",
      ][stepHighPerfomance.value - 1]
    : `/system/icons/contracts/request/1-${stepHighPerfomance.value === 5 ? "45461" : "41693"}-imgArrowLeft.svg`,
);
async function increment() {
  if (busy.value || !ready.value) return;
  error.value = "";
  if (stepHighPerfomance.value < 5) {
    stepHighPerfomance.value++;
    return;
  }
  if (!contractRequestComplete(storeInvestment.highPerfomance)) return;
  busy.value = true;
  emit("busy", true);
  try {
    const result = await props.submit(
      JSON.parse(JSON.stringify(storeInvestment.highPerfomance)),
    );
    if (!active) return;
    if (!result?.id) throw Error(requestSendUnavailable);
    stepHighPerfomance.value = 6;
  } catch (e) {
    if (active) error.value = e.message || requestSendUnavailable;
  } finally {
    if (active) {
      busy.value = false;
      emit("busy", false);
    }
  }
}
const decrement = () => {
  if (busy.value) return;
  error.value = "";
  if (stepHighPerfomance.value === 1) {
    emit("closed");
    return;
  }
  stepHighPerfomance.value--;
};
const goContract = () => {
  if (busy.value) return;
  emit("closed");
  router.replace({ name: "Contratos" });
};
// Seu código aqui
</script>

<style scoped>
.opportunity-investment {
  width: 840px;
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: 48px 32px 24px;
  border: 2px solid #2cb7ff;
  border-radius: 8px;
  background:
    linear-gradient(215deg, #0000003d, #0000000a), rgba(18, 24, 36, 0.96);
  backdrop-filter: blur(16px);
  box-shadow: 0 0 48px 12px #00a3ff3d;
  color: #fff;
  scrollbar-color: #ffffff66 transparent;
}
.opportunity-investment__step {
  margin: 40px 0;
}
.opportunity-investment__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.opportunity-investment__footer img {
  margin-right: 8px;
  flex-shrink: 0;
}
.opportunity-investment__error {
  color: #ffc9c9;
  font-size: 14px;
  line-height: 20px;
}
.opportunity-investment :deep(.q-card) {
  background: transparent;
  border: 1px solid #efefef29;
  border-radius: 8px;
  box-shadow: none;
}
.opportunity-investment :deep(.q-card__section) {
  padding: 24px 32px;
}
.opportunity-investment :deep(.badge-perfomance) {
  color: #fff;
  background: linear-gradient(203deg, #ffffff29, #ffffff03);
  border: 1px solid #efefef14;
  border-radius: 8px;
  box-shadow: 4px 4px 12px #0000003d;
  padding: 12px 16px;
  width: 100%;
  text-align: left;
  font: inherit;
}
.opportunity-investment :deep(.badge-perfomance:focus-visible) {
  outline: 2px solid #2cb7ff;
  outline-offset: 2px;
}
.opportunity-investment :deep(.q-item__label--caption) {
  color: #bdbdbd;
}
.opportunity-investment :deep(.badge-perfomance-four) {
  padding: 0 12px;
}
.opportunity-investment :deep(.q-field__native) {
  color: #fff;
}
.opportunity-investment :deep(.q-toggle__label) {
  text-align: left;
}
.opportunity-investment :deep(.text-grey) {
  color: #bdbdbd !important;
}
@media (max-width: 600px) {
  .opportunity-investment {
    padding: 24px 16px 16px;
  }
  .opportunity-investment :deep(.q-card__section) {
    padding: 20px 16px;
  }
  .opportunity-investment__step {
    margin: 24px 0;
  }
}
.opportunity-investment--offer {
  width: 720px;
  padding-bottom: 16px;
  background: linear-gradient(203deg, #0000003d, #00000014 51%, #0000000a);
}
.opportunity-investment--offer-finish {
  width: 572px;
  padding-top: 24px;
}
.opportunity-investment__next {
  margin-left: 8px;
  flex-shrink: 0;
}
.opportunity-investment--offer :deep(.badge-perfomance) {
  margin-bottom: 24px;
  padding: 12px;
  font-size: 18px;
  line-height: 23px;
}
.opportunity-investment--offer :deep(.badge-perfomance:last-child) {
  margin-bottom: 0;
}
.opportunity-investment--offer :deep(.badge-four) {
  max-height: 498px;
}
.opportunity-investment--offer :deep(.list-type-control) {
  max-height: 498px;
  padding-inline: 32px;
}
.opportunity-investment--offer :deep(.q-card__section > p:first-child) {
  margin-bottom: 12px;
}
.opportunity-investment--offer :deep(.q-card__section > p:nth-child(2)) {
  margin-bottom: 32px;
  font-size: 17px;
  line-height: 23px;
}
.opportunity-investment--offer-finish .opportunity-investment__step {
  margin: 0 0 16px;
}
@media (max-width: 600px) {
  .opportunity-investment--offer :deep(.list-type-control) {
    padding-inline: 16px;
  }
}
.opportunity-investment--offer {
  font-family: Inter, sans-serif;
}
.opportunity-investment--offer .opportunity-investment__step {
  padding: 0 !important;
}
.opportunity-investment--offer :deep(.badge-perfomance) {
  font-weight: 400;
}
.opportunity-investment--offer :deep(.loading-step span + span) {
  margin-left: 4px;
}
.opportunity-investment--offer :deep(.q-toggle__inner) {
  width: 44px;
  min-width: 44px;
  height: 22px;
  padding: 0;
}
.opportunity-investment--offer :deep(.q-toggle__track) {
  height: 22px;
  width: 44px;
  border-radius: 20px;
  opacity: 1;
  background: #c3c3c3;
}
.opportunity-investment--offer :deep(.q-toggle__thumb) {
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
}
.opportunity-investment--offer
  :deep(.q-toggle__inner--truthy .q-toggle__thumb) {
  left: 24px;
}
.opportunity-investment--offer
  :deep(.q-toggle__inner--truthy .q-toggle__track) {
  background: #00a3ff;
}
.opportunity-investment--offer :deep(.q-toggle__thumb:after) {
  background: white;
}
.opportunity-investment--offer :deep(.q-toggle__label) {
  padding-left: 12px;
}
.opportunity-investment--offer :deep(.badge-perfomance-four) {
  padding: 12px;
  margin-bottom: 24px;
  font-size: 18px;
  line-height: 23px;
}
.opportunity-investment--offer :deep(.q-item__section--avatar) {
  min-width: 44px;
  padding-right: 0;
  margin-right: 12px;
}
.opportunity-investment--offer :deep(.q-item__label .q-ml-sm) {
  margin-left: 0;
}
.opportunity-investment--offer .opportunity-investment__footer .q-btn {
  min-height: 40px;
  font:
    500 14px/1 Roboto,
    sans-serif;
  letter-spacing: 0.5px;
}
.opportunity-investment--offer :deep(.q-linear-progress__track) {
  background: #292929;
  opacity: 1;
}
.opportunity-investment--offer > form {
  margin: 0;
}
.opportunity-investment--offer :deep(.q-item__label--caption) {
  font:
    400 14px/1.35 Inter,
    sans-serif;
  margin-top: 8px;
}
.opportunity-investment--offer :deep(.q-item__label .icon-control) {
  width: 16px;
  margin-right: 8px;
}
.opportunity-investment--offer {
  padding: 46px 30px 14px;
}
.opportunity-investment--offer-finish {
  padding: 22px 30px 14px;
}
.opportunity-investment--offer-finish .opportunity-investment__step {
  margin: 0 0 40px;
}
.opportunity-investment--offer-finish > form > .text-center .q-btn {
  min-height: 40px;
  font:
    500 14px/1 Roboto,
    sans-serif;
  letter-spacing: 0.5px;
}
@media (max-width: 600px) {
  .opportunity-investment--offer,
  .opportunity-investment--offer-finish {
    padding: 24px 16px 16px;
  }
  .opportunity-investment--offer-finish .opportunity-investment__step {
    margin-bottom: 24px;
  }
}
</style>
