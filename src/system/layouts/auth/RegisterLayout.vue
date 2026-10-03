<template>
  <div class="RegisterLayout column justify-center q-pa-md text-white">
    <div class="registration-form self-center">
      <header-auth text="Cadastre-se" style-new="height: auto; margin-bottom: 24px" />
      <p>Crie sua conta e confirme seu e-mail. Os dados complementares serão preenchidos no Perfil após o login.</p>
      <q-banner v-if="error" rounded class="bg-red-9 text-white q-mb-md" role="alert">{{ error }}</q-banner>
      <q-form @submit="submit" class="q-gutter-y-md">
        <label-field label-input="Nome completo">
          <q-input v-model.trim="form.name" v-bind="{ ...$inputStyle }" aria-label="Nome completo" autocomplete="name" :disable="loading" :rules="required" />
        </label-field>
        <label-field label-input="E-mail">
          <q-input v-model.trim="form.email" v-bind="{ ...$inputStyle }" aria-label="E-mail" type="email" autocomplete="email" :disable="loading" :rules="emailRules" />
        </label-field>
        <label-field label-input="Senha">
          <q-input v-model="form.password" v-bind="{ ...$inputStyle }" aria-label="Senha" type="password" autocomplete="new-password" :disable="loading" :rules="passwordRules" />
        </label-field>
        <label-field label-input="Confirmar senha">
          <q-input v-model="confirmation" v-bind="{ ...$inputStyle }" aria-label="Confirmar senha" type="password" autocomplete="new-password" :disable="loading" :rules="[...required, value => value === form.password || 'As senhas não conferem']" />
        </label-field>
        <label-field label-input="Código de indicação (opcional)">
          <q-input v-model.trim="form.referralCode" v-bind="{ ...$inputStyle }" aria-label="Código de indicação (opcional)" :disable="loading" />
        </label-field>
        <q-btn type="submit" label="Criar conta" color="primary" no-caps class="full-width q-pa-md" :loading="loading" :disable="loading" />
      </q-form>
      <div class="row justify-between q-mt-md">
        <q-btn flat no-caps color="primary" label="Já tenho conta" :to="{ name: 'login' }" :disable="loading" />
        <q-btn flat no-caps color="primary" label="Confirmar e-mail" :to="{ name: 'confirm-email' }" :disable="loading" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { reactive, ref, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import HeaderAuth from "src/system/components/auth/HeaderAuth.vue";
import LabelField from "src/system/components/form/LabelField.vue";
import { register } from "src/services/clientAuthService";
import { identityErrorMessage, registrationPayload } from "src/services/publicAuth";
const router = useRouter();
const form = reactive({ name: "", email: "", password: "", referralCode: "" });
const confirmation = ref(""), loading = ref(false), error = ref("");
const required = [value => Boolean(String(value || "").trim()) || "Campo obrigatório"];
const emailRules = [...required, value => /^\S+@\S+\.\S+$/.test(value) || "E-mail inválido"];
const passwordRules = [...required, value => value.length >= 8 || "Use pelo menos 8 caracteres"];
// Retain the key for an ambiguous network/server failure, but not after a rejected request.
let attempt = null;
const submit = async () => {
  if (loading.value) return;
  loading.value = true; error.value = "";
  const payload = registrationPayload(form);
  const signature = JSON.stringify(payload);
  if (!attempt || attempt.signature !== signature) attempt = { signature, key: crypto.randomUUID() };
  try {
    const result = await register(payload, attempt.key);
    if (!result?.accepted) { error.value = "O cadastro não foi aceito. Revise os dados e tente novamente."; attempt = null; return; }
    // Keep only the address in memory, never the password or verification code in storage/URL.
    const { pendingEmail } = await import("src/composables/system/usePendingEmail");
    pendingEmail.value = form.email;
    form.password = ""; confirmation.value = ""; attempt = null;
    await router.push({ name: "confirm-email" });
  } catch (err) {
    if (err.response?.status >= 400 && err.response.status < 500) attempt = null;
    error.value = identityErrorMessage(err, "Não foi possível criar a conta. Revise os dados ou tente novamente. Se já possui cadastro, use Confirmar e-mail ou entre na conta.");
  } finally { loading.value = false; }
};
onBeforeUnmount(() => { form.password = ""; confirmation.value = ""; attempt = null; });
</script>
<style scoped>
.registration-form { width: 100%; max-width: 460px; }
.registration-form p { line-height: 1.6; }
</style>
