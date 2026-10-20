<template>
  <div>
    <aside class="preview-note" role="status">
      Homologação da Etapa 5 — sem gravação ou avanço integrado. Catálogo de
      atividades e regras do cadastro aguardam confirmação.
    </aside>
    <registration-shell
      :step="5"
      title="Atividade trabalhista"
      style="
        --registration-background-angle: 209.1858deg;
        --registration-card-angle: 215.3045deg;
      "
      ><registration-employment-step
        v-model="employmentDraft"
        @back="
          router.push(
            route.query.review === '1'
              ? '/cadastro/etapa-7'
              : '/cadastro/etapa-4',
          )
        "
    /></registration-shell>
  </div>
</template>
<script setup>
import { useRouter, useRoute } from "vue-router";
import RegistrationShell from "src/system/components/registration/RegistrationShell.vue";
import RegistrationEmploymentStep from "src/system/components/registration/RegistrationEmploymentStep.vue";
import { employmentDraft } from "./registrationEmploymentState";
const route = useRoute();
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
