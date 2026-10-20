<template>
  <q-form
    ref="formRef"
    class="registration-account"
    novalidate
    @submit="submit"
  >
    <label-field label-input="Nome completo"
      ><q-input
        v-model="form.name"
        v-bind="fieldStyle"
        aria-label="Nome completo"
        placeholder="Como está no seu documento"
        autocomplete="name"
        :disable="busy"
        :error="!!errors.name"
        :error-message="errors.name"
    /></label-field>
    <label-field label-input="E-mail"
      ><q-input
        v-model="form.email"
        v-bind="fieldStyle"
        aria-label="E-mail"
        placeholder="seu@email.com"
        type="email"
        autocomplete="email"
        :disable="busy"
        :error="!!errors.email"
        :error-message="errors.email"
    /></label-field>
    <div class="registration-account__residence">
      <p id="residence-label">País de residência</p>
      <p class="registration-account__help">
        Escolha onde você mora. Isso define os campos da etapa 4.
      </p>
      <div
        class="registration-account__countries"
        role="group"
        aria-labelledby="residence-label"
        :aria-invalid="!!errors.residence"
        :aria-describedby="errors.residence ? 'residence-error' : undefined"
      >
        <div
          v-for="choice in residenceChoices"
          :key="choice.key"
          class="registration-account__country"
        >
          <button
            type="button"
            role="switch"
            :aria-label="choice.label"
            :aria-checked="form.residence === choice.key"
            :disabled="busy"
            @click="
              form.residence = form.residence === choice.key ? '' : choice.key
            "
          >
            <span />
          </button>
          <div>
            <p>{{ choice.label }}</p>
            <p
              v-if="choice.description"
              class="registration-account__description"
            >
              {{ choice.description }}
            </p>
          </div>
        </div>
      </div>
      <p
        v-if="errors.residence"
        id="residence-error"
        class="registration-account__error"
        role="alert"
      >
        {{ errors.residence }}
      </p>
    </div>
    <div class="registration-account__passwords">
      <label-field label-input="Senha"
        ><q-input
          v-model="form.password"
          v-bind="fieldStyle"
          aria-label="Senha"
          placeholder="Use pelo menos 8 caracteres"
          type="password"
          autocomplete="new-password"
          :disable="busy"
          :error="!!errors.password"
          :error-message="errors.password"
      /></label-field>
      <label-field label-input="Confirmar senha"
        ><q-input
          v-model="form.confirmation"
          v-bind="fieldStyle"
          aria-label="Confirmar senha"
          placeholder="Repita a senha"
          type="password"
          autocomplete="new-password"
          :disable="busy"
          :error="!!errors.confirmation"
          :error-message="errors.confirmation"
      /></label-field>
    </div>
    <label-field label-input="Código de indicação (opcional)"
      ><q-input
        v-model="form.referralCode"
        v-bind="fieldStyle"
        aria-label="Código de indicação (opcional)"
        placeholder="Se alguém indicou você"
        :disable="busy"
    /></label-field>
    <div>
      <div class="registration-account__consent">
        <input
          id="registration-accept"
          :aria-invalid="!!errors.accepted"
          aria-label="Li e aceito os Termos de Uso e a Política de Privacidade"
          v-model="form.accepted"
          type="checkbox"
          :disabled="busy"
          :aria-describedby="errors.accepted ? 'consent-error' : undefined"
        /><label for="registration-accept">Li e aceito os </label
        ><button type="button" :disabled="busy" @click="emit('review-terms')">
          Termos de Uso</button
        ><span> e a </span
        ><button type="button" :disabled="busy" @click="emit('review-privacy')">
          Política de Privacidade</button
        ><span>.</span>
      </div>
      <p
        v-if="errors.accepted"
        id="consent-error"
        class="registration-account__error"
        role="alert"
      >
        {{ errors.accepted }}
      </p>
    </div>
    <footer>
      <q-btn
        flat
        no-caps
        label="Já tenho conta"
        :to="{ name: 'login' }"
        :disable="busy"
      /><q-btn
        type="submit"
        no-caps
        unelevated
        class="registration-account__submit"
        :loading="busy"
        :disable="busy"
        ><span class="registration-account__icon"
          ><img src="/system/icons/auth/enter.svg" alt="" /></span
        ><span>Criar conta</span></q-btn
      >
    </footer>
  </q-form>
</template>
<script setup>
import { nextTick, onBeforeUnmount, reactive, ref } from "vue";
import LabelField from "src/system/components/form/LabelField.vue";
import { inputWhite } from "src/Utils/ViewInput";
import {
  newRegistrationAccount,
  residenceChoices,
  validateRegistrationAccount,
} from "src/services/registrationSteps";
const props = defineProps({ busy: Boolean });
const emit = defineEmits(["validated", "review-terms", "review-privacy"]);
const form = reactive(newRegistrationAccount());
const errors = ref({});
const formRef = ref(null);
const fieldStyle = {
  ...inputWhite,
  dense: true,
  "item-aligned": false,
  "hide-bottom-space": true,
  "no-error-icon": true,
};
const submit = async () => {
  if (props.busy) return;
  errors.value = validateRegistrationAccount(form);
  if (!Object.keys(errors.value).length) emit("validated");
  else {
    await nextTick();
    const invalid = formRef.value?.$el.querySelector(
      ' .q-field--error input, input[aria-invalid="true"], [role="group"][aria-invalid="true"] button, input#registration-accept[aria-invalid="true"]',
    );
    invalid?.focus();
  }
};
onBeforeUnmount(() => {
  form.password = "";
  form.confirmation = "";
});
</script>
<style scoped>
@font-face {
  font-family: "Registration Emoji";
  src: url("/system/fonts/registration/noto-color-emoji.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range:
    U+1f1e6-1f1ec, U+1f1ee-1f1ef, U+1f1f1-1f1f5, U+1f1f7-1f1fa, U+1f1fe-1f1ff,
    U+1f30d-1f30e;
}
.registration-account {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}
.registration-account :deep(.text-label) {
  display: block;
  margin-bottom: 8px;
  color: white;
  font:
    500 14px/19px Inter,
    sans-serif;
}
.registration-account :deep(.q-field__control) {
  height: 40px;
  min-height: 40px;
  background: white;
  border-radius: 4px;
}
.registration-account :deep(.q-field__native) {
  min-height: 40px;
  padding: 7px 0;
  color: #1d1d1d !important;
  -webkit-text-fill-color: #1d1d1d;
  font:
    400 14px/22px Roboto,
    sans-serif;
}
.registration-account :deep(.q-field__native::placeholder) {
  color: #989898;
  -webkit-text-fill-color: #989898;
  opacity: 1;
}
.registration-account :deep(.q-field__bottom),
.registration-account__error {
  color: #ffb4bd;
  font-size: 12px;
}
.registration-account__error {
  margin: 8px 0 0;
}
.registration-account__residence > p {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 17px;
}
.registration-account__residence > .registration-account__help {
  font-size: 13px;
  line-height: 16px;
  color: rgba(255, 255, 255, 0.6);
}
.registration-account__countries {
  height: 352px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 16px;
  scrollbar-color: #bdbdbd transparent;
  scrollbar-width: thin;
}
.registration-account__country {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  flex: none;
  min-width: 0;
  border: 1px solid rgba(239, 239, 239, 0.08);
  border-radius: 8px;
  background: linear-gradient(
    181.741deg,
    rgba(255, 255, 255, 0.16),
    rgba(255, 255, 255, 0.04) 50%,
    rgba(255, 255, 255, 0.01)
  );
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.24);
}
.registration-account__country > div {
  min-width: 0;
}
.registration-account__country p {
  margin: 0;
  font-size: 17px;
  line-height: 23px;
  font-weight: 500;
  overflow-wrap: anywhere;
  font-family: "Registration Emoji", Inter, sans-serif;
}
.registration-account__country .registration-account__description {
  margin-top: 8px;
  font-size: 14px;
  line-height: 19px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
}
.registration-account__country > button {
  flex: none;
  width: 44px;
  height: 22px;
  border: 0;
  padding: 2px;
  border-radius: 16px;
  background: #bdbdbd;
  cursor: pointer;
}
.registration-account__country > button[aria-checked="true"] {
  background: #00a3ff;
}
.registration-account__country > button span {
  display: block;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px #00230b33;
}
.registration-account__country > button[aria-checked="true"] span {
  margin-left: 22px;
}
.registration-account__passwords {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}
.registration-account__consent {
  font-size: 14px;
  line-height: 20px;
  color: rgba(255, 255, 255, 0.8);
}
.registration-account__consent input {
  width: 16px;
  height: 16px;
  margin: 0 8px 0 0;
  vertical-align: middle;
  accent-color: #00a3ff;
}
.registration-account__consent button {
  padding: 0;
  border: 0;
  background: none;
  color: #00a3ff;
  font: inherit;
  cursor: pointer;
}
footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}
footer > .q-btn:first-child {
  padding: 0;
  font-size: 14px;
  min-height: 40px;
}
.registration-account__submit {
  padding: 7px 12px;
  min-height: 48px;
  border: 1px solid #98989829;
  border-radius: 8px;
  background: linear-gradient(187.2983deg, #ffffff29, #ffffff0a 50%, #ffffff03);
  box-shadow: 4px 4px 12px #0000003d;
  font-size: 17px;
}
.registration-account__submit :deep(.q-btn__content) {
  gap: 12px;
}
.registration-account__icon {
  padding: 4px;
  display: flex;
  border-radius: 4px;
  background: linear-gradient(202.9887deg, #0000003d, #0000000a);
}
.registration-account__icon img {
  width: 24px;
  height: 24px;
}
button:focus-visible,
input:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 3px;
}
button:disabled {
  cursor: default;
  opacity: 0.6;
}
@media (max-width: 600px) {
  .registration-account__passwords {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
  .registration-account :deep(.q-field__native) {
    font-size: 16px;
  }
}
</style>
