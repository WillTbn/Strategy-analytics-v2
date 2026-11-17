<template>
  <div
    class="amount-panel"
    :id="panelId"
    :role="panelId ? 'tabpanel' : undefined"
    :aria-labelledby="labelledby"
  >
    <money-input
      v-if="editingAmount"
      ref="amountInput"
      v-model="model"
      aria-label="Valor do empréstimo"
      outlined
      dense
      show-currency
      class="request-input"
      @blur="editingAmount = false"
      @keydown.enter.prevent="editingAmount = false"
    />
    <div v-else class="amount-display">
      <strong>{{ model == null ? "—" : profileMoney(model, "BRL") }}</strong
      ><button
        type="button"
        aria-label="Editar valor do empréstimo"
        @click="editAmount"
      >
        <img :src="asset('pencil.svg')" alt="" />
      </button>
    </div>
    <div class="amount-slider">
      <div class="amount-range">
        <q-slider
          v-model="model"
          :min="min"
          :max="max"
          :step="increment"
          thumb-size="14.5px"
          color="primary"
          aria-label="Valor do empréstimo"
        />
        <div class="slider-marks" aria-hidden="true">
          <img :src="asset('mark-active.svg')" alt="" /><img
            :src="asset('mark.svg')"
            alt=""
          /><img :src="asset('mark.svg')" alt="" />
        </div>
      </div>
      <div class="slider-limits">
        <span>{{ minLabel }}</span
        ><span>{{ maxLabel }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { nextTick, ref } from "vue";
import MoneyInput from "src/system/components/form/MoneyInput.vue";
import { profileMoney } from "src/services/profilePresentation";
defineProps({
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  increment: { type: Number, default: 1000 },
  minLabel: String,
  maxLabel: String,
  panelId: String,
  labelledby: String,
});
const model = defineModel({ type: Number, default: null });
const asset = (name) => `/figma/loan-request/${name}`;
const editingAmount = ref(false),
  amountInput = ref(null);
async function editAmount() {
  editingAmount.value = true;
  await nextTick();
  amountInput.value?.focus();
}
</script>
<style scoped src="./loanRequest.scss"></style>
