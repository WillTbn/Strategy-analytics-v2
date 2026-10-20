<template>
  <div>
    <aside
      v-if="registrationContext.notices[7]"
      class="preview-note"
      role="status"
    >
      {{ registrationContext.notices[7] }}
    </aside>
    <registration-shell
      :step="7"
      title="Revisão e envio"
      style="
        --registration-background-angle: 209.1858deg;
        --registration-card-angle: 223.4485deg;
      "
      ><registration-review-step
        :snapshot="snapshot"
        :busy="busy"
        integrated
        @validated="save"
        v-if="ready"
        @back="router.push('/cadastro/etapa-6')"
        @edit="
          (section) =>
            router.push({ path: section.path, query: { review: '1' } })
        "
    /></registration-shell>
  </div>
</template>
<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import RegistrationShell from "src/system/components/registration/RegistrationShell.vue";
import RegistrationReviewStep from "src/system/components/registration/RegistrationReviewStep.vue";
import { personalPreviewDraft } from "./registrationPersonalPreviewState";
import {
  documentDrafts,
  activeDocumentVariant,
} from "./registrationDocumentState";
import { employmentDraft } from "./registrationEmploymentState";
import { trustedContactsDraft } from "./registrationTrustedContactsState";
import {
  useRegistrationFlow,
  registrationContext,
} from "src/composables/system/useRegistrationFlow";
const { busy, ready, save } = useRegistrationFlow(7);
const router = useRouter();
const snapshot = computed(() => ({
  personal: personalPreviewDraft.value,
  catalog: registrationContext.catalog,
  documentSummary:
    registrationContext.profile?.identificationDocuments?.documents,
  variant: activeDocumentVariant.value,
  document: documentDrafts[activeDocumentVariant.value] || null,
  employment: employmentDraft.value,
  contacts: trustedContactsDraft.value,
}));
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
