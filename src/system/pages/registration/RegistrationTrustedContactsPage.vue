<template>
  <div>
    <aside
      v-if="registrationContext.notices[6]"
      class="preview-note"
      role="status"
    >
      {{ registrationContext.notices[6] }}
    </aside>
    <registration-shell
      :step="6"
      title="Contatos de confiança"
      style="
        --registration-background-angle: 209.1858deg;
        --registration-card-angle: 211.0616deg;
      "
    >
      <registration-step
        v-if="ready"
        :key="revision"
        v-model="trustedContactsDraft"
        :busy="busy"
        @validated="save"
        @back="
          router.push(
            route.query.review === '1'
              ? '/cadastro/etapa-7'
              : '/cadastro/etapa-5',
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
import RegistrationStep from "src/system/components/registration/RegistrationTrustedContactsStep.vue";
import { trustedContactsDraft } from "./registrationTrustedContactsState";
import {
  useRegistrationFlow,
  registrationContext,
} from "src/composables/system/useRegistrationFlow";
const router = useRouter(),
  route = useRoute();
const { busy, ready, revision, save } = useRegistrationFlow(6);
</script>
<style scoped>
.preview-note {
  padding: 12px 16px;
  background: #1d1d1d;
  color: white;
  font-size: 14px;
}
</style>
