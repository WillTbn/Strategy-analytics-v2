<template>
  <div>
    <aside v-if="notice" class="preview-note" role="status">{{ notice }}</aside>
    <registration-shell :step="2" title="Confirmar e-mail"
      ><registration-email-step
        :email="registrationContext.email || pendingEmail"
        @back="back"
        @confirmed="confirmed"
    /></registration-shell>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import RegistrationShell from "src/system/components/registration/RegistrationShell.vue";
import RegistrationEmailStep from "src/system/components/registration/RegistrationEmailStep.vue";
import {
  registrationContext,
  registrationCredentials,
} from "src/composables/system/useRegistrationFlow";
import { pendingEmail } from "src/composables/system/usePendingEmail";
import useAuth from "src/composables/system/useAuth";
const router = useRouter(),
  notice = ref(""),
  { auth } = useAuth();
const back = () => {
  registrationCredentials.password = "";
  router.push("/cadastro/etapa-1");
};
const confirmed = async () => {
  const password = registrationCredentials.password;
  registrationCredentials.password = "";
  if (password) {
    const success = await auth(
      { person: registrationContext.email || pendingEmail.value, password },
      { path: "/cadastro/etapa-3" },
    );
    if (!success)
      await router.push({
        name: "login",
        query: { next: "/cadastro/etapa-3" },
      });
  } else {
    notice.value = "E-mail confirmado. Entre na sua conta para continuar.";
    await router.push({ name: "login", query: { next: "/cadastro/etapa-3" } });
  }
};
</script>
<style scoped>
.preview-note {
  padding: 12px 16px;
  background: #1d1d1d;
  color: white;
  font-size: 14px;
}
</style>
