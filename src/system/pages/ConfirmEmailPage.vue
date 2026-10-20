<template>
  <q-layout class="bg-simulator">
    <q-page-container
      ><q-page class="column justify-center q-pa-md text-white">
        <div class="confirmation-form self-center">
          <header-auth
            :text="confirmed ? 'E-mail confirmado' : 'Confirme seu e-mail'"
            style-new="height: auto; margin-bottom: 24px"
          />
          <template v-if="confirmed">
            <p role="status">
              Confirmação concluída. Entre na sua conta para completar o Perfil.
            </p>
            <q-btn
              color="primary"
              no-caps
              label="Ir para login"
              :to="{ name: 'login' }"
            />
          </template>
          <template v-else>
            <p>
              Informe o e-mail do cadastro e o código recebido. Confira também a
              caixa de spam.
            </p>
            <q-banner
              v-if="error"
              rounded
              class="bg-red-9 text-white q-mb-md"
              role="alert"
              >{{ error }}</q-banner
            >
            <p v-if="notice" role="status">{{ notice }}</p>
            <q-form ref="formRef" @submit="confirm" class="q-gutter-y-md">
              <label-field label-input="E-mail">
                <q-input
                  ref="emailRef"
                  v-model.trim="email"
                  v-bind="{ ...$inputStyle }"
                  aria-label="E-mail"
                  type="email"
                  autocomplete="email"
                  :disable="busy"
                  :rules="emailRules"
                />
              </label-field>
              <label-field label-input="Código recebido">
                <q-input
                  v-model.trim="code"
                  v-bind="{ ...$inputStyle }"
                  aria-label="Código recebido"
                  autocomplete="one-time-code"
                  autocapitalize="characters"
                  :disable="busy"
                  :rules="required"
                />
              </label-field>
              <q-btn
                type="submit"
                color="primary"
                no-caps
                label="Confirmar e-mail"
                class="full-width q-pa-md"
                :loading="confirming"
                :disable="busy || (remaining > 0 && blocked)"
              />
            </q-form>
            <q-btn
              flat
              color="primary"
              no-caps
              class="q-mt-md"
              :label="
                remaining > 0
                  ? 'Reenviar em ' + remaining + 's'
                  : 'Solicitar novo código'
              "
              :loading="sending"
              :disable="busy || remaining > 0"
              @click="resend"
            />
            <q-btn
              flat
              color="primary"
              no-caps
              label="Ir para login"
              :to="{ name: 'login' }"
              :disable="busy"
            />
          </template>
        </div> </q-page
    ></q-page-container>
  </q-layout>
</template>
<script setup>
import { onBeforeUnmount, ref } from "vue";
import HeaderAuth from "src/system/components/auth/HeaderAuth.vue";
import LabelField from "src/system/components/form/LabelField.vue";
import {
  confirmEmail,
  requestEmailConfirmation,
} from "src/services/clientAccountService";
import { pendingEmail } from "src/composables/system/usePendingEmail";
import { createEmailConfirmation } from "src/services/emailConfirmation";

const confirmation = createEmailConfirmation({
  initialEmail: pendingEmail.value,
  confirmEmail,
  requestEmailConfirmation,
});
const {
  email,
  code,
  confirming,
  sending,
  confirmed,
  error,
  notice,
  remaining,
  blocked,
  busy,
  resend,
} = confirmation;
const emailRef = ref(null),
  formRef = ref(null);
const required = [
  (value) => Boolean(String(value || "").trim()) || "Campo obrigatório",
];
const emailRules = [
  ...required,
  (value) => /^\S+@\S+\.\S+$/.test(value) || "E-mail inválido",
];
const confirm = async () => {
  if (await confirmation.confirm()) pendingEmail.value = "";
};
onBeforeUnmount(() => {
  confirmation.dispose();
  pendingEmail.value = "";
});
</script>
<style scoped>
.confirmation-form {
  width: 100%;
  max-width: 460px;
}
.confirmation-form p {
  line-height: 1.6;
}
</style>
