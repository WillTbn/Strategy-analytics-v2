<template>
  <div>
    <aside class="preview-note" role="status">
      Homologação da Etapa 4 — variante do Figma para conferência; dados e
      arquivos ficam somente em memória, sem envio ou gravação.
    </aside>
    <registration-shell :step="4" title="Documento e endereço" :style="angles"
      ><registration-document-step
        v-if="config"
        :key="variant"
        v-model="draft"
        :variant="variant"
        @back="router.push('/cadastro/etapa-3')"
      />
      <p v-else role="alert">
        Variação de residência indisponível.
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
import { documentDrafts } from "./registrationDocumentState";
const route = useRoute(),
  router = useRouter();
const variant = computed(() => route.params.variant || "br");
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
