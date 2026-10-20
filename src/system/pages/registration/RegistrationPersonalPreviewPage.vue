<template>
  <div>
    <aside class="preview-note" role="status">
      Homologação da Etapa 3 — sem gravação ou avanço integrado. Catálogos e
      regras de obrigatoriedade aguardam confirmação. {{ notice }}
    </aside>
    <registration-shell :step="3" title="Dados pessoais"
      ><registration-personal-step
        v-model="personalPreviewDraft"
        @back="
          router.push(
            route.query.review === '1'
              ? '/cadastro/etapa-7'
              : '/cadastro/etapa-2',
          )
        "
        @validated="
          notice = 'Validações locais concluídas; integração pendente.'
        "
    /></registration-shell>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import RegistrationShell from "src/system/components/registration/RegistrationShell.vue";
import RegistrationPersonalStep from "src/system/components/registration/RegistrationPersonalStep.vue";
import { personalPreviewDraft } from "./registrationPersonalPreviewState";
const route = useRoute();
const router = useRouter(),
  notice = ref("");
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
