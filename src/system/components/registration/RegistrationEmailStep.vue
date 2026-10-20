<template>
  <q-form class="registration-email" novalidate @submit="confirm">
    <p v-if="maskedEmail" class="registration-email__intro">
      Enviamos um código para {{ maskedEmail }}. Confira também a caixa de spam.
    </p>
    <p v-else class="registration-email__message" role="alert">
      E-mail do cadastro indisponível. Volte à etapa anterior.
    </p>
    <p v-if="error" class="registration-email__message" role="alert">
      {{ error }}
    </p>
    <p v-if="notice" class="registration-email__intro" role="status">
      {{ notice }}
    </p>
    <p v-if="confirmed" class="registration-email__intro" role="status">
      E-mail confirmado.
    </p>
    <label-field class="registration-email__code" label-input="Código recebido">
      <q-input
        ref="codeInput"
        v-model.trim="code"
        v-bind="fieldStyle"
        aria-label="Código recebido"
        autocomplete="one-time-code"
        autocapitalize="off"
        spellcheck="false"
        placeholder="000000"
        :disable="busy || confirmed || !maskedEmail"
        :error="!!codeError"
        :error-message="codeError"
      />
    </label-field>
    <div>
      <q-btn
        flat
        no-caps
        class="registration-email__link"
        :label="
          remaining ? `Reenviar em ${remaining}s` : 'Solicitar novo código'
        "
        :loading="sending"
        :disable="busy || confirmed || !maskedEmail || remaining > 0"
        @click="resend"
      />
    </div>
    <footer>
      <q-btn
        flat
        no-caps
        class="registration-email__link"
        label="Voltar"
        :disable="busy"
        @click="back"
      />
      <q-btn
        type="submit"
        no-caps
        unelevated
        class="registration-email__submit"
        :loading="confirming"
        :disable="
          busy || confirmed || !maskedEmail || (blocked && remaining > 0)
        "
        ><span class="registration-email__icon"
          ><img src="/system/icons/auth/enter.svg" alt="" /></span
        ><span>Confirmar e-mail</span></q-btn
      >
    </footer>
  </q-form>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import LabelField from "src/system/components/form/LabelField.vue";
import { inputWhite } from "src/Utils/ViewInput";
import {
  confirmEmail,
  requestEmailConfirmation,
} from "src/services/clientAccountService";
import {
  createEmailConfirmation,
  maskedConfirmationEmail,
} from "src/services/emailConfirmation";
const props = defineProps({
  email: { type: String, default: "" },
  transport: { type: Object, default: undefined },
});
const emit = defineEmits(["back", "confirmed"]);
const confirmation = createEmailConfirmation({
  initialEmail: props.email,
  ...(props.transport || { confirmEmail, requestEmailConfirmation }),
});
const {
  email: confirmationAddress,
  code,
  confirming,
  sending,
  confirmed,
  error,
  codeError,
  notice,
  remaining,
  blocked,
  busy,
  resend,
} = confirmation;
watch(
  () => props.email,
  (value) => {
    confirmationAddress.value = value;
  },
);
const maskedEmail = computed(() =>
  maskedConfirmationEmail(confirmationAddress.value),
);
const codeInput = ref(null);
const fieldStyle = {
  ...inputWhite,
  dense: true,
  "item-aligned": false,
  "hide-bottom-space": true,
  "no-error-icon": true,
};
const confirm = async () => {
  if (await confirmation.confirm()) emit("confirmed");
  else if (codeError.value) {
    await nextTick();
    codeInput.value?.focus();
  }
};
const back = () => {
  code.value = "";
  emit("back");
};
onBeforeUnmount(confirmation.dispose);
</script>
<style scoped>
.registration-email {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}
.registration-email__intro {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font:
    400 16px/19px Inter,
    sans-serif;
  overflow-wrap: anywhere;
}
.registration-email__message {
  margin: 0;
  color: #ffb4bd;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.registration-email__code {
  width: min(332px, 100%);
}
.registration-email :deep(.text-label) {
  display: block;
  margin-bottom: 8px;
  color: white;
  font:
    500 14px/19px Inter,
    sans-serif;
}
.registration-email :deep(.q-field__control) {
  height: 40px;
  min-height: 40px;
  background: white;
  border-radius: 4px;
}
.registration-email :deep(.q-field__native) {
  min-height: 40px;
  padding: 7px 0;
  color: #1d1d1d !important;
  -webkit-text-fill-color: #1d1d1d;
  font:
    400 14px/22px Roboto,
    sans-serif;
}
.registration-email :deep(.q-field__native::placeholder) {
  color: #989898;
  -webkit-text-fill-color: #989898;
  opacity: 1;
}
.registration-email :deep(.q-field__bottom) {
  color: #ffb4bd;
}
.registration-email__link {
  min-height: 32px;
  padding: 0;
  border-radius: 6px;
  font:
    500 14px/1.35 Inter,
    sans-serif;
}
footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
footer > .registration-email__link {
  min-height: 40px;
}
.registration-email__submit {
  padding: 7px 12px;
  min-height: 48px;
  border: 1px solid #98989829;
  border-radius: 8px;
  background: linear-gradient(185.6728deg, #ffffff29, #ffffff0a 50%, #ffffff03);
  box-shadow: 4px 4px 12px #0000003d;
  font:
    500 17px/1.35 Inter,
    sans-serif;
}
.registration-email__submit :deep(.q-btn__content) {
  gap: 12px;
  flex-wrap: nowrap;
}
.registration-email__icon {
  padding: 4px;
  display: flex;
  border-radius: 4px;
  background: linear-gradient(202.9887deg, #0000003d, #0000000a);
}
.registration-email__icon img {
  width: 24px;
  height: 24px;
}
.q-btn:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 3px;
}
@media (max-width: 600px) {
  .registration-email__intro {
    line-height: 1.5;
  }
  .registration-email :deep(.q-field__native) {
    font-size: 16px;
  }
  .registration-email__submit {
    font-size: 15px;
  }
}
</style>
