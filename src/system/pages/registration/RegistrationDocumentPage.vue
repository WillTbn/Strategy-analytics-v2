<template>
  <div>
    <aside
      v-if="registrationContext.notices[4]"
      class="preview-note"
      role="status"
    >
      {{ registrationContext.notices[4] }}
    </aside>
    <registration-shell :step="4" title="Documento e endereço" :style="angles"
      ><registration-document-step
        v-if="config && ready"
        :key="`${variant}-${revision}`"
        v-model="draft"
        :variant="variant"
        :busy="busy"
        :catalog="documentCatalog"
        @validated="save"
        @back="
          router.push(
            route.query.review === '1'
              ? '/cadastro/etapa-7'
              : '/cadastro/etapa-3',
          )
        "
      />
      <p v-else role="alert">
        {{
          busy
            ? "Carregando seus dados…"
            : "Não foi possível carregar esta variação. Confira o país de residência da conta."
        }}
      </p></registration-shell
    >
  </div>
</template>
<script setup>
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import RegistrationShell from "src/system/components/registration/RegistrationShell.vue";
import RegistrationDocumentStep from "src/system/components/registration/RegistrationDocumentStep.vue";
import {
  documentVariants,
  newRegistrationDocuments,
} from "src/services/registrationDocuments";
import {
  documentDrafts,
  activeDocumentVariant,
} from "./registrationDocumentState";
import {
  useRegistrationFlow,
  registrationContext,
} from "src/composables/system/useRegistrationFlow";
const { busy, ready, revision, documentCatalog, save } = useRegistrationFlow(4);
const route = useRoute(),
  router = useRouter();
const variant = computed(
  () => route.params.variant || activeDocumentVariant.value || "br",
);
const config = computed(() =>
  Object.hasOwn(documentVariants, variant.value)
    ? documentVariants[variant.value]
    : null,
);
watch(
  variant,
  (key) => {
    if (Object.hasOwn(documentVariants, key))
      documentDrafts[key] ||= newRegistrationDocuments(key);
    if (Object.hasOwn(documentVariants, key)) activeDocumentVariant.value = key;
  },
  { immediate: true },
);
const draft = computed({
  get: () => documentDrafts[variant.value],
  set: (value) => {
    documentDrafts[variant.value] = value;
  },
});
const angles = computed(() =>
  config.value
    ? {
        "--registration-background-angle": `${config.value.angles[0]}deg`,
        "--registration-card-angle": `${config.value.angles[1]}deg`,
      }
    : {},
);
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
