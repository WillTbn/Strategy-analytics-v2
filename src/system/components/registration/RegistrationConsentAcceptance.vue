<template>
  <div class="consent">
    <p v-if="error" class="notice" role="alert">{{ error }}</p>
    <template v-else-if="pending">
      <div>
        <input
          id="review-accept"
          :checked="modelValue.accepted"
          type="checkbox"
          :disabled="disabled"
          aria-label="Li e aceito os Termos de Uso e a Política de Privacidade"
          @change="accept($event.target.checked)"
        />
        <label for="review-accept">Li e aceito os </label>
        <button
          type="button"
          :disabled="disabled"
          @click="selected = agreements[0]"
        >
          Termos de Uso
        </button>
        <span> e a </span>
        <button
          type="button"
          :disabled="disabled"
          @click="selected = agreements[1]"
        >
          Política de Privacidade</button
        ><span>.</span>
      </div>
    </template>
    <q-dialog :model-value="!!selected" @update:model-value="selected = null">
      <q-card class="tool consent-reader">
        <q-card-section class="row items-center justify-between no-wrap">
          <div>
            <h2>{{ selected?.content.title }}</h2>
            <p>Versão {{ selected?.version }}</p>
          </div>
          <q-btn
            flat
            round
            icon="close"
            aria-label="Fechar documento"
            v-close-popup
          />
        </q-card-section>
        <q-separator dark />
        <q-card-section class="consent-body">{{
          selected?.content.body
        }}</q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>
<script setup>
import { computed, ref, watch } from "vue";
import { onboardingAgreements } from "src/services/registrationConsentRules";
const props = defineProps({
  requirements: { type: Object, default: null },
  disabled: Boolean,
  modelValue: {
    type: Object,
    default: () => ({ accepted: false, versionIds: [] }),
  },
});
const emit = defineEmits(["update:modelValue"]);
const selected = ref(null);
const error = computed(() => {
  try {
    onboardingAgreements(props.requirements);
    return "";
  } catch (e) {
    return e.message;
  }
});
const agreements = computed(() =>
  error.value ? [] : onboardingAgreements(props.requirements),
);
const pending = computed(() =>
  agreements.value.some((item) => item.status !== "Accepted"),
);
const signature = computed(() =>
  agreements.value.map((item) => item.versionId).join("|"),
);
const accept = (accepted) =>
  emit("update:modelValue", {
    accepted,
    versionIds: agreements.value.map((item) => item.versionId),
  });
watch(signature, () => {
  accept(false);
  selected.value = null;
});
</script>
<style scoped>
.consent {
  font-size: 14px;
  line-height: 20px;
  color: rgba(255, 255, 255, 0.8);
}
input {
  width: 16px;
  height: 16px;
  margin: 0 8px 0 0;
  vertical-align: middle;
  accent-color: #00a3ff;
}
button {
  padding: 0;
  border: 0;
  background: none;
  color: #00a3ff;
  font: inherit;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
button:focus-visible,
input:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 3px;
}
.notice {
  color: #ffb4bd;
  margin: 0;
}
.consent-reader {
  width: 680px;
  max-width: calc(100vw - 32px);
  max-height: 85vh;
  color: white;
  background: #141b29;
}
h2 {
  font-size: 20px;
  line-height: 1.4;
  margin: 0;
}
p {
  margin: 4px 0 0;
  color: #ffffffb8;
}
.consent-body {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 15px;
  line-height: 1.6;
}
</style>
