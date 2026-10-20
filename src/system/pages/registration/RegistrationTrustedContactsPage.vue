<template>
  <div>
    <aside class="preview-note" role="status">
      Homologação da Etapa 6 — contatos e opção de ausência somente em memória,
      sem gravação ou avanço integrado.
    </aside>
    <registration-shell
      :step="6"
      title="Contatos de confiança"
      style="
        --registration-background-angle: 209.1858deg;
        --registration-card-angle: 211.0616deg;
      "
      ><registration-trusted-contacts-step
        v-model="trustedContactsDraft"
        @back="router.push('/cadastro/etapa-5')"
    /></registration-shell>
  </div>
</template>
<script setup>
import { useRouter } from "vue-router";
import RegistrationShell from "src/system/components/registration/RegistrationShell.vue";
import RegistrationTrustedContactsStep from "src/system/components/registration/RegistrationTrustedContactsStep.vue";
import { trustedContactsDraft } from "./registrationTrustedContactsState";
const router = useRouter();
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
