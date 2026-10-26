<template>
  <div>
    <aside v-if="notice" class="preview-note" role="status">{{ notice }}</aside>
    <registration-shell :step="1" title="Criar conta"
      ><registration-account-step
        :busy="busy"
        :email-confirmed="emailConfirmed"
        @email-change="emailConfirmed = false"
        @validated="submit"
        @review-terms="
          notice =
            'O backend ainda não disponibilizou o texto e a versão dos Termos de Uso para este cadastro.'
        "
        @review-privacy="
          notice =
            'O backend ainda não disponibilizou o texto e a versão da Política de Privacidade para este cadastro.'
        "
    /></registration-shell>
  </div>
</template>
<script setup>
import { ref, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import RegistrationShell from "src/system/components/registration/RegistrationShell.vue";
import RegistrationAccountStep from "src/system/components/registration/RegistrationAccountStep.vue";
import { register } from "src/services/clientAuthService";
import {
  registrationPayload,
  identityErrorMessage,
} from "src/services/publicAuth";
import {
  registrationContext,
  registrationCredentials,
} from "src/composables/system/useRegistrationFlow";
import { pendingEmail } from "src/composables/system/usePendingEmail";
const router = useRouter(),
  busy = ref(false),
  emailConfirmed = ref(false),
  notice = ref("");
let attempt = null,
  active = true;
const submit = async (form) => {
  if (busy.value) return;
  busy.value = true;
  notice.value = "";
  emailConfirmed.value = false;
  const payload = registrationPayload(form),
    signature = JSON.stringify(payload);
  if (!attempt || attempt.signature !== signature)
    attempt = { signature, key: crypto.randomUUID() };
  try {
    const result = await register(payload, attempt.key);
    if (!active) return;
    if (!result?.accepted) throw new Error("Cadastro não aceito.");
    registrationContext.email = payload.email;
    registrationContext.accountEmail = payload.email;
    registrationContext.residence = form.residence;
    pendingEmail.value = payload.email;
    registrationCredentials.password = form.password;
    attempt = null;
    await router.push("/cadastro/etapa-2");
  } catch (error) {
    if (!active) return;
    if (error.response?.status >= 400 && error.response.status < 500)
      attempt = null;
    if (
      error.response?.data?.errors?.some(
        (item) => item.code === "email_already_confirmed",
      )
    ) {
      emailConfirmed.value = true;
      return;
    }
    notice.value = identityErrorMessage(
      error,
      "Não foi possível criar a conta. Confira os dados e tente novamente.",
    );
  } finally {
    busy.value = false;
  }
};
onBeforeUnmount(() => {
  active = false;
  attempt = null;
});
</script>
<style scoped>
.preview-note {
  padding: 12px 16px;
  background: #1d1d1d;
  color: white;
  font-size: 14px;
}
</style>
