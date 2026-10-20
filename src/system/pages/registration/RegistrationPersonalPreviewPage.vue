<template>
  <div>
    <aside
      v-if="registrationContext.notices[3]"
      class="preview-note"
      role="status"
    >
      {{ registrationContext.notices[3] }}
    </aside>
    <registration-shell :step="3" title="Dados pessoais" style="">
      <registration-step
        v-if="ready"
        :key="revision"
        v-model="personalPreviewDraft"
        :catalog="catalog"
        integrated
        :busy="busy"
        @validated="save"
        @back="
          router.push(
            route.query.review === '1'
              ? '/cadastro/etapa-7'
              : '/cadastro/etapa-2',
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
import RegistrationStep from "src/system/components/registration/RegistrationPersonalStep.vue";
import { personalPreviewDraft } from "./registrationPersonalPreviewState";
import {
  useRegistrationFlow,
  registrationContext,
} from "src/composables/system/useRegistrationFlow";
const router = useRouter(),
  route = useRoute();
const { busy, ready, revision, catalog, save } = useRegistrationFlow(3);
</script>
<style scoped>
.preview-note {
  padding: 12px 16px;
  background: #1d1d1d;
  color: white;
  font-size: 14px;
}
</style>
