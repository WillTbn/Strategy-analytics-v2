<template>
  <q-form class="registration-personal" novalidate @submit="submit">
    <div class="registration-personal__row">
      <label-field label-input="Data de nascimento">
        <q-input
          ref="birthInput"
          v-model="form.birthDate"
          v-bind="fieldStyle"
          aria-label="Data de nascimento"
          placeholder="dd/mm/aaaa"
          mask="##/##/####"
          inputmode="numeric"
          autocomplete="bday"
          :disable="busy"
          :error="!!errors.birthDate"
          :error-message="errors.birthDate"
        />
      </label-field>
      <label-field label-input="Gênero">
        <q-select
          v-model="form.gender"
          :class="{ 'registration-personal__empty': form.gender == null }"
          :display-value="form.gender == null ? 'Selecione' : undefined"
          v-bind="selectStyle"
          aria-label="Gênero"
          :options="catalog.genders || []"
          :disable="busy"
          :error="!!errors.gender"
          :error-message="errors.gender"
          ><template #no-option
            ><q-item
              ><q-item-section
                >Opções ainda indisponíveis.</q-item-section
              ></q-item
            ></template
          ></q-select
        >
      </label-field>
    </div>
    <div class="registration-personal__row">
      <label-field label-input="Estado civil">
        <q-select
          v-model="form.maritalStatus"
          :class="{
            'registration-personal__empty': form.maritalStatus == null,
          }"
          :display-value="form.maritalStatus == null ? 'Selecione' : undefined"
          v-bind="selectStyle"
          aria-label="Estado civil"
          :options="catalog.maritalStatuses || []"
          :disable="busy"
          :error="!!errors.maritalStatus"
          :error-message="errors.maritalStatus"
          ><template #no-option
            ><q-item
              ><q-item-section
                >Opções ainda indisponíveis.</q-item-section
              ></q-item
            ></template
          ></q-select
        >
      </label-field>
      <div class="registration-personal__nationalities">
        <label-field
          v-for="(_, index) in form.nationalities"
          :key="index"
          label-input="Nacionalidade"
        >
          <q-select
            :ref="(el) => (nationalityInputs[index] = el)"
            v-model="form.nationalities[index]"
            :class="{
              'registration-personal__empty': form.nationalities[index] == null,
            }"
            :display-value="
              form.nationalities[index] == null ? 'Selecione' : undefined
            "
            v-bind="selectStyle"
            :aria-label="index ? `Nacionalidade ${index + 1}` : 'Nacionalidade'"
            :options="catalog.nationalities || []"
            :disable="busy"
            :error="
              !!errors.nationalities && index === form.nationalities.length - 1
            "
            :error-message="errors.nationalities"
            ><template #no-option
              ><q-item
                ><q-item-section
                  >Opções ainda indisponíveis.</q-item-section
                ></q-item
              ></template
            ></q-select
          >
        </label-field>
        <q-btn
          flat
          no-caps
          class="registration-personal__add"
          label="+ Adicionar outra nacionalidade"
          :disable="busy"
          @click="addNationality"
        />
      </div>
    </div>
    <div class="registration-personal__row">
      <label-field label-input="País de nascimento">
        <q-select
          v-model="form.birthCountry"
          :class="{ 'registration-personal__empty': form.birthCountry == null }"
          :display-value="form.birthCountry == null ? 'Selecione' : undefined"
          v-bind="selectStyle"
          aria-label="País de nascimento"
          :options="catalog.countries || []"
          :disable="busy"
          :error="!!errors.birthCountry"
          :error-message="errors.birthCountry"
          ><template #no-option
            ><q-item
              ><q-item-section
                >Opções ainda indisponíveis.</q-item-section
              ></q-item
            ></template
          ></q-select
        >
      </label-field>
      <label-field label-input="Cidade de nascimento">
        <q-input
          v-model="form.birthCity"
          v-bind="fieldStyle"
          aria-label="Cidade de nascimento"
          placeholder="Digite a cidade"
          autocomplete="off"
          :disable="busy"
          :error="!!errors.birthCity"
          :error-message="errors.birthCity"
        />
      </label-field>
    </div>
    <p v-if="notice" class="registration-personal__notice" role="status">
      {{ notice }}
    </p>
    <footer>
      <q-btn
        flat
        no-caps
        class="registration-personal__back"
        label="Voltar"
        :disable="busy"
        @click="emit('back')"
      />
      <q-btn
        type="submit"
        no-caps
        unelevated
        class="registration-personal__submit"
        :disable="busy"
        :loading="busy"
        ><span class="registration-personal__icon"
          ><img src="/system/icons/auth/enter.svg" alt="" /></span
        ><span>Continuar</span></q-btn
      >
    </footer>
  </q-form>
</template>
<script setup>
import { nextTick, reactive, ref, watch } from "vue";
import LabelField from "src/system/components/form/LabelField.vue";
import { inputWhite } from "src/Utils/ViewInput";
import {
  appendRegistrationNationality,
  newRegistrationPersonal,
  personalCatalogReady,
  validateRegistrationPersonal,
} from "src/services/registrationPersonal";
const props = defineProps({
  modelValue: { type: Object, default: () => newRegistrationPersonal() },
  catalog: { type: Object, default: () => ({}) },
  requiredFields: { type: Array, default: () => [] },
  busy: Boolean,
  integrated: Boolean,
});
const emit = defineEmits(["update:modelValue", "back", "validated"]);
const form = reactive(newRegistrationPersonal(props.modelValue));
const errors = ref({}),
  notice = ref("");
const birthInput = ref(null),
  nationalityInputs = ref([]);
watch(form, () => emit("update:modelValue", newRegistrationPersonal(form)), {
  deep: true,
  flush: "sync",
});
const fieldStyle = {
  ...inputWhite,
  dense: true,
  "item-aligned": false,
  "hide-bottom-space": true,
  "no-error-icon": true,
};
const selectStyle = {
  ...fieldStyle,
  "emit-value": true,
  "map-options": true,
  "dropdown-icon": "img:/system/icons/auth/select-down.svg",
  "popup-content-class": "registration-personal-options text-dark bg-white",
  optionsDense: true,
};
const addNationality = async () => {
  if (props.busy) return;
  errors.value.nationalities = "";
  if (!appendRegistrationNationality(form))
    errors.value.nationalities =
      form.nationalities.length >= 3
        ? "Selecione no máximo três nacionalidades."
        : "Selecione uma nacionalidade antes de adicionar outra.";
  await nextTick();
  nationalityInputs.value.at(-1)?.focus();
};
const submit = async () => {
  if (props.busy) return;
  notice.value = "";
  errors.value = validateRegistrationPersonal(form, props.catalog, {
    required: props.requiredFields,
  });
  if (Object.keys(errors.value).length) {
    await nextTick();
    if (errors.value.birthDate) birthInput.value?.focus();
    return;
  }
  if (!props.integrated && !personalCatalogReady(props.catalog)) {
    notice.value =
      "As opções de cadastro ainda estão indisponíveis. Seus dados permanecem nesta etapa.";
    return;
  }
  emit("validated", newRegistrationPersonal(form));
};
</script>
<style scoped>
.registration-personal {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}
.registration-personal__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 16px;
}
.registration-personal__row > * {
  min-width: 0;
}
.registration-personal__nationalities {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 100px;
}
.registration-personal :deep(.text-label) {
  display: block;
  margin-bottom: 8px;
  color: white;
  font:
    500 14px/19px Inter,
    sans-serif;
}
.registration-personal :deep(.q-field__control) {
  height: 40px;
  min-height: 40px;
  background: white;
  border-radius: 4px;
}
.registration-personal :deep(.q-select .q-field__control) {
  border-radius: 6px;
}
.registration-personal :deep(.q-field__native),
.registration-personal :deep(.q-field__input) {
  min-height: 40px;
  padding-top: 7px;
  padding-bottom: 7px;
  color: #1d1d1d !important;
  -webkit-text-fill-color: #1d1d1d;
  font:
    400 14px/22px Roboto,
    sans-serif;
}
.registration-personal :deep(.q-field__native::placeholder) {
  color: #989898;
  -webkit-text-fill-color: #989898;
  opacity: 1;
}
.registration-personal :deep(.registration-personal__empty .q-field__native) {
  color: #989898 !important;
  -webkit-text-fill-color: #989898;
}
.registration-personal :deep(.q-select .q-field__native > span) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.registration-personal :deep(.q-field__append) {
  height: 40px;
  padding-left: 4px;
}
.registration-personal :deep(.q-select__dropdown-icon) {
  width: 18px;
  height: 18px;
  font-size: 18px;
}
.registration-personal :deep(.q-field__bottom),
.registration-personal__notice {
  color: #ffb4bd;
}
.registration-personal__notice {
  margin: 0;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.registration-personal__add {
  align-self: flex-start;
  min-height: 24px;
  padding: 0 7px;
  font:
    500 14px/19px Inter,
    sans-serif;
}
footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.registration-personal__back {
  min-height: 40px;
  padding: 0;
  font:
    500 14px/19px Inter,
    sans-serif;
}
.registration-personal__submit {
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
.registration-personal__submit :deep(.q-btn__content) {
  gap: 12px;
  flex-wrap: nowrap;
}
.registration-personal__icon {
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
.registration-personal__icon img {
  width: 24px;
  height: 24px;
}
.q-btn:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 3px;
}
@media (max-width: 600px) {
  .registration-personal__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
  .registration-personal :deep(.q-field__native),
  .registration-personal :deep(.q-field__input) {
    font-size: 16px;
  }
}
</style>
