<template>
  <div
    class="amount-panel"
    :id="panelId"
    :role="panelId ? 'tabpanel' : undefined"
    :aria-labelledby="labelledby"
  >
    <p v-if="title" class="amount-caption">{{ title }}</p>
    <money-input
      v-if="editingAmount"
      :disable="disabled"
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
        :disabled="disabled"
        @click="editAmount"
      >
        <img :src="asset('pencil.svg')" alt="" />
      </button>
    </div>
    <div class="amount-slider">
      <div class="amount-range">
        <q-slider
          v-model="model"
          :disable="disabled"
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
        ><span class="amount-max"
          >{{ maxLabel
          }}<img v-if="maxInfo" src="/figma/loan-request/info-limit.svg" alt=""
        /></span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { nextTick, ref } from "vue";
import MoneyInput from "src/system/components/form/MoneyInput.vue";
import { profileMoney } from "src/services/profilePresentation";
defineProps({
  disabled: Boolean,
  title: String,
  maxInfo: Boolean,
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

<style scoped>
.amount-caption {
  font-size: 17px;
  color: #989898;
  margin: 0;
  text-align: center;
  line-height: 1.35;
}
</style>

<style scoped>
.amount-max {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
