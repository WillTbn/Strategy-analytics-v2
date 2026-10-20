<template>
  <q-form class="registration-employment" novalidate @submit="submit">
    <div class="income-row">
      <registration-field
        v-for="field in employmentFields.slice(0, 2)"
        :key="field.key"
        :ref="(el) => (controls[field.key] = el)"
        v-model="form[field.key]"
        :field="field"
        :disabled="busy"
        :error="errors[field.key]"
      />
    </div>
    <div class="income-row">
      <registration-field
        v-for="field in employmentFields.slice(2, 4)"
        :key="field.key"
        :ref="(el) => (controls[field.key] = el)"
        v-model="form[field.key]"
        :field="field"
        :disabled="busy"
        :error="errors[field.key]"
      />
    </div>
    <registration-field
      :ref="(el) => (controls.declaredNetWorth = el)"
      v-model="form.declaredNetWorth"
      class="assets"
      :field="employmentFields[4]"
      :disabled="busy"
      :error="errors.declaredNetWorth"
    />
    <div class="income-row">
      <registration-field
        v-for="field in employmentFields.slice(5)"
        :key="field.key"
        :ref="(el) => (controls[field.key] = el)"
        v-model="form[field.key]"
        :field="field"
        :options="currencies"
        :disabled="busy"
        :error="errors[field.key]"
      />
    </div>
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <footer>
      <q-btn
        flat
        no-caps
        class="back"
        label="Voltar"
        :disable="busy"
        @click="emit('back')"
      /><q-btn
        type="submit"
        no-caps
        unelevated
        class="continue"
        :disable="busy"
        :loading="busy"
        ><span class="icon"
          ><img src="/system/icons/auth/enter.svg" alt="" /></span
        ><span>Continuar</span></q-btn
      >
    </footer>
  </q-form>
</template>
<script setup>
import { nextTick, reactive, ref, watch } from "vue";
import RegistrationField from "./RegistrationDocumentField.vue";
import {
  employmentFields,
  newRegistrationEmployment,
  validateRegistrationEmployment,
} from "src/services/registrationEmployment";
const props = defineProps({
  modelValue: { type: Object, default: () => newRegistrationEmployment() },
  currencies: { type: Array, default: () => [] },
  requiredFields: {
    type: Array,
    default: () => [
      "occupation",
      "primaryCurrencyCode",
      "secondaryCurrencyCode",
    ],
  },
  busy: Boolean,
});
const emit = defineEmits(["update:modelValue", "back", "validated"]);
const form = reactive(newRegistrationEmployment(props.modelValue));
const controls = ref({}),
  errors = ref({}),
  notice = ref("");
watch(form, () => emit("update:modelValue", newRegistrationEmployment(form)), {
  deep: true,
  flush: "sync",
});
const submit = async () => {
  if (props.busy) return;
  errors.value = validateRegistrationEmployment(
    form,
    props.currencies,
    props.requiredFields,
  );
  if (Object.keys(errors.value).length) {
    notice.value = "Confira os campos indicados antes de continuar.";
    await nextTick();
    controls.value[Object.keys(errors.value)[0]]?.focus();
    return;
  }
  notice.value = "";
  emit("validated");
};
</script>
<style scoped>
.registration-employment {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}
.income-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 16px;
}
.income-row > * {
  min-width: 0;
}
.assets {
  width: min(332px, 100%);
}
.notice {
  margin: 0;
  color: #ffb4bd;
  font-size: 14px;
  overflow-wrap: anywhere;
}
footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.back {
  min-height: 40px;
  padding: 0;
  font:
    500 14px/19px Inter,
    sans-serif;
}
.continue {
  min-height: 50px;
  padding: 8px 12px;
  border: 1px solid #98989829;
  border-radius: 8px;
  background: linear-gradient(187.8342deg, #ffffff29, #ffffff0a 50%, #ffffff03);
  box-shadow: 4px 4px 12px #0000003d;
  font:
    500 17px/1.35 Inter,
    sans-serif;
}
.continue :deep(.q-btn__content) {
  gap: 12px;
  flex-wrap: nowrap;
}
.icon {
  display: flex;
  padding: 4px;
  border-radius: 4px;
  background: linear-gradient(
    202.9887deg,
    #0000003d,
    #00000014 51.124%,
    #0000000a
  );
}
.icon img {
  width: 24px;
  height: 24px;
}
.q-btn:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 3px;
}
@media (max-width: 600px) {
  .income-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
}
</style>
