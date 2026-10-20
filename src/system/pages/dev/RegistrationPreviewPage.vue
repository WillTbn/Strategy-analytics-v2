<template>
  <div>
    <aside class="preview-note" role="status">
      Prévia local da Etapa 1 — sem gravação, criação de conta ou aceite
      enviado. {{ notice }}
    </aside>
    <registration-shell :step="1" title="Criar conta"
      ><registration-account-step
        @validated="
          notice = 'Validações locais concluídas; integração pendente.'
        "
        @review-terms="
          notice = 'Texto e versão dos Termos de Uso ainda pendentes.'
        "
        @review-privacy="
          notice = 'Texto e versão da Política de Privacidade ainda pendentes.'
        "
    /></registration-shell>
  </div>
</template>
<script setup>
import { ref } from "vue";
import RegistrationShell from "src/system/components/registration/RegistrationShell.vue";
import RegistrationAccountStep from "src/system/components/registration/RegistrationAccountStep.vue";
const notice = ref("");
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
