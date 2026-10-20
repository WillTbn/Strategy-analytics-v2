<template>
  <div>
    <aside class="preview-note" role="status">
      Prévia local da Etapa 2 — e-mail demonstrativo, sem envio ou validação no
      servidor. {{ notice }}
    </aside>
    <registration-shell :step="2" title="Confirmar e-mail"
      ><registration-email-step
        email="preview@example.invalid"
        :transport="transport"
        @back="router.push('/dev/cadastro/etapa-1')"
    /></registration-shell>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import RegistrationShell from "src/system/components/registration/RegistrationShell.vue";
import RegistrationEmailStep from "src/system/components/registration/RegistrationEmailStep.vue";
const router = useRouter();
const notice = ref("");
const unavailable = async () => {
  notice.value =
    "A chamada foi bloqueada nesta prévia; nenhuma mensagem foi enviada e nenhum código foi confirmado.";
  throw new Error("Preview transport disabled");
};
const transport = {
  confirmEmail: unavailable,
  requestEmailConfirmation: unavailable,
};
</script>
<style scoped>
.preview-note {
  position: relative;
  z-index: 1;
  padding: 12px 16px;
  background: #1d1d1d;
  color: white;
  font-size: 14px;
}
</style>
