<template>
  <div>
    <aside
      v-if="registrationContext.notices[4]"
      class="preview-note"
      role="status"
    >
      {{ registrationContext.notices[4] }}
    </aside>
    <registration-shell
      :step="4"
      title="Atividade trabalhista"
      style="
        --registration-background-angle: 209.1858deg;
        --registration-card-angle: 215.3045deg;
      "
    >
      <registration-step
        v-if="ready"
        :key="revision"
        v-model="employmentDraft"
        :currencies="catalog.currencies || []"
        :busy="busy"
        @validated="save"
        @back="
          router.push(
            route.query.review === '1'
              ? '/cadastro/etapa-7'
              : '/cadastro/etapa-3',
          )
        "
      />
      <p v-else role="status">
        {{
          busy
            ? "Carregando seus dados…"
            : "Não foi possível carregar o cadastro. Recarregue para tentar novamente."
        }}
      </p>
    </registration-shell>
  </div>
</template>
<script setup>
import { useRouter, useRoute } from "vue-router";
import RegistrationShell from "src/system/components/registration/RegistrationShell.vue";
import RegistrationStep from "src/system/components/registration/RegistrationEmploymentStep.vue";
import { employmentDraft } from "./registrationEmploymentState";
import {
  useRegistrationFlow,
  registrationContext,
} from "src/composables/system/useRegistrationFlow";
const router = useRouter(),
  route = useRoute();
const { busy, ready, revision, catalog, save } = useRegistrationFlow(4);
</script>
<style scoped>
.preview-note {
  padding: 12px 16px;
  background: #1d1d1d;
  color: white;
  font-size: 14px;
}
</style>
