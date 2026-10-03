<template>
  <q-layout class="bg-simulator">
    <q-page-container><q-page class="column justify-center q-pa-md text-white">
      <div class="confirmation-form self-center">
        <header-auth :text="confirmed ? 'E-mail confirmado' : 'Confirme seu e-mail'" style-new="height: auto; margin-bottom: 24px" />
        <template v-if="confirmed">
          <p role="status">Confirmação concluída. Entre na sua conta para completar o Perfil.</p>
          <q-btn color="primary" no-caps label="Ir para login" :to="{ name: 'login' }" />
        </template>
        <template v-else>
          <p>Informe o e-mail do cadastro e o código recebido. Confira também a caixa de spam.</p>
          <q-banner v-if="error" rounded class="bg-red-9 text-white q-mb-md" role="alert">{{ error }}</q-banner>
          <p v-if="notice" role="status">{{ notice }}</p>
          <q-form ref="formRef" @submit="confirm" class="q-gutter-y-md">
            <label-field label-input="E-mail">
              <q-input ref="emailRef" v-model.trim="email" v-bind="{ ...$inputStyle }" aria-label="E-mail" type="email" autocomplete="email" :disable="busy" :rules="emailRules" />
            </label-field>
            <label-field label-input="Código recebido">
              <q-input v-model.trim="code" v-bind="{ ...$inputStyle }" aria-label="Código recebido" autocomplete="one-time-code" autocapitalize="characters" :disable="busy" :rules="required" />
            </label-field>
            <q-btn type="submit" color="primary" no-caps label="Confirmar e-mail" class="full-width q-pa-md" :loading="confirming" :disable="busy || remaining > 0 && blocked" />
          </q-form>
          <q-btn flat color="primary" no-caps class="q-mt-md" :label="remaining > 0 ? 'Reenviar em ' + remaining + 's' : 'Solicitar novo código'" :loading="sending" :disable="busy || remaining > 0" @click="resend" />
          <q-btn flat color="primary" no-caps label="Ir para login" :to="{ name: 'login' }" :disable="busy" />
        </template>
      </div>
    </q-page></q-page-container>
  </q-layout>
</template>
<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import HeaderAuth from "src/system/components/auth/HeaderAuth.vue";
import LabelField from "src/system/components/form/LabelField.vue";
import { confirmEmail, requestEmailConfirmation } from "src/services/clientAccountService";
import { pendingEmail } from "src/composables/system/usePendingEmail";
import { identityErrorMessage, retrySeconds } from "src/services/publicAuth";
const email = ref(pendingEmail.value), code = ref(""), emailRef = ref(null), formRef = ref(null);
const confirming = ref(false), sending = ref(false), confirmed = ref(false), error = ref(""), notice = ref("");
const remaining = ref(0), blocked = ref(false), busy = computed(() => confirming.value || sending.value);
const required = [value => Boolean(String(value || "").trim()) || "Campo obrigatório"];
const emailRules = [...required, value => /^\S+@\S+\.\S+$/.test(value) || "E-mail inválido"];
let timer;
const cooldown = seconds => {
  clearInterval(timer); remaining.value = seconds;
  timer = setInterval(() => { remaining.value = Math.max(0, remaining.value - 1); if (!remaining.value) { clearInterval(timer); blocked.value = false; } }, 1000);
};
const handleError = (err, fallback) => {
  error.value = identityErrorMessage(err, fallback);
  if (err.response?.status === 429) {
    blocked.value = err.response?.data?.errors?.[0]?.code === "verification_code_attempts_exceeded";
    cooldown(retrySeconds(err));
  }
};
const confirm = async () => {
  if (busy.value || (blocked.value && remaining.value)) return;
  confirming.value = true; error.value = ""; notice.value = "";
  try {
    const result = await confirmEmail(email.value, code.value);
    if (result?.succeeded) { confirmed.value = true; code.value = ""; pendingEmail.value = ""; }
    else error.value = "Não foi possível confirmar. Confira o código ou solicite outro.";
  } catch (err) { handleError(err, "Não foi possível confirmar o e-mail. Confira os dados e tente novamente."); }
  finally { confirming.value = false; }
};
const resend = async () => {
  if (busy.value || remaining.value || !await emailRef.value.validate()) return;
  sending.value = true; error.value = ""; notice.value = "";
  try {
    const result = await requestEmailConfirmation(email.value);
    if (result?.accepted) { notice.value = "Solicitação aceita. Verifique sua caixa de entrada e o spam."; cooldown(60); }
    else error.value = "O envio não foi aceito. Tente novamente mais tarde.";
  } catch (err) { handleError(err, "Não foi possível solicitar o código. Confira o e-mail e tente novamente."); }
  finally { sending.value = false; }
};
onBeforeUnmount(() => { clearInterval(timer); code.value = ""; pendingEmail.value = ""; });
</script>
<style scoped>
.confirmation-form { width: 100%; max-width: 460px; }
.confirmation-form p { line-height: 1.6; }
</style>
