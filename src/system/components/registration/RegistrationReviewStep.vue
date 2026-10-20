<template>
  <q-form class="registration-review" novalidate @submit="submit">
    <p class="intro">
      Confira seus dados antes de enviar. Depois do envio eles ficam em análise
      e só podem ser alterados quando o documento for validado.
    </p>
    <div class="summary">
      <section
        v-for="section in sections"
        :key="section.key"
        class="summary-row"
      >
        <div>
          <h2>{{ section.title }}</h2>
          <p>{{ section.text }}</p>
        </div>
        <q-btn
          flat
          no-caps
          class="edit"
          label="Editar"
          :aria-label="`Editar ${section.title}`"
          :disable="busy"
          @click="emit('edit', section)"
        />
      </section>
    </div>
    <div>
      <label class="confirmation"
        ><input
          ref="confirmationInput"
          v-model="confirmed"
          type="checkbox"
          aria-label="Confirmo que as informações são verdadeiras."
          :aria-invalid="!!confirmationError"
          :aria-describedby="
            confirmationError ? 'review-confirmation-error' : undefined
          "
          :disabled="busy"
        /><span>Confirmo que as informações são verdadeiras.</span></label
      >
      <p
        v-if="confirmationError"
        id="review-confirmation-error"
        class="notice"
        role="alert"
      >
        {{ confirmationError }}
      </p>
    </div>
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <footer>
      <q-btn
        flat
        no-caps
        class="back"
        label="Voltar"
        :disable="busy"
        @click="emit('back')"
      /><q-btn
        type="submit"
        no-caps
        unelevated
        class="send"
        :disable="busy"
        :loading="busy"
        ><span class="icon"
          ><img src="/system/icons/auth/enter.svg" alt="" /></span
        ><span>Enviar cadastro</span></q-btn
      >
    </footer>
  </q-form>
</template>
<script setup>
import { computed, nextTick, ref, watch } from "vue";
import {
  registrationReviewIssues,
  registrationReviewSections,
} from "src/services/registrationReview";
const props = defineProps({
  snapshot: { type: Object, required: true },
  busy: Boolean,
});
const emit = defineEmits(["edit", "back"]);
const sections = computed(() => registrationReviewSections(props.snapshot));
const confirmed = ref(false),
  confirmationError = ref(""),
  notice = ref(""),
  confirmationInput = ref(null);
watch(
  () => props.snapshot,
  () => {
    confirmed.value = false;
    confirmationError.value = "";
    notice.value = "";
  },
  { deep: true },
);
const submit = async () => {
  if (props.busy) return;
  notice.value = "";
  confirmationError.value = "";
  if (!confirmed.value) {
    confirmationError.value = "Confirme as informações antes de enviar.";
    await nextTick();
    confirmationInput.value?.focus();
    return;
  }
  const issues = registrationReviewIssues(props.snapshot);
  notice.value = issues.length
    ? `Há dados pendentes ou a revisar: ${issues.join(", ")}. Use Editar para conferir.`
    : "Envio indisponível enquanto a integração do cadastro não estiver confirmada. Seus dados permanecem em memória.";
};
</script>
<style scoped>
.registration-review {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}
.intro {
  margin: 0;
  color: #ffffffb8;
  font:
    400 16px / normal Inter,
    sans-serif;
  overflow-wrap: anywhere;
}
.summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  padding: 12px 16px;
  border: 1px solid #ffffff1f;
  border-radius: 8px;
  background: #ffffff0a;
}
.summary-row > div {
  flex: 1;
  min-width: 0;
}
h2 {
  margin: 0 0 4px;
  color: white;
  font:
    500 15px/18px Inter,
    sans-serif;
}
.summary-row p {
  margin: 0;
  color: #ffffff99;
  font:
    400 13px/16px Inter,
    sans-serif;
  overflow-wrap: anywhere;
}
.edit {
  padding: 0;
  min-height: 32px;
  flex: none;
  font:
    500 14px/19px Inter,
    sans-serif;
}
.confirmation {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffffcc;
  font:
    400 14px/17px Inter,
    sans-serif;
  cursor: pointer;
}
.confirmation input {
  appearance: none;
  margin: 0;
  width: 18px;
  height: 18px;
  flex: none;
  border: 1.5px solid #ffffff66;
  border-radius: 4px;
  background: transparent;
}
.confirmation input:checked {
  appearance: auto;
  accent-color: #00a3ff;
}
.notice {
  margin: 8px 0 0;
  color: #ffb4bd;
  font-size: 14px;
  overflow-wrap: anywhere;
}
footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.back {
  min-height: 40px;
  padding: 0;
  font:
    500 14px/19px Inter,
    sans-serif;
}
.send {
  min-height: 50px;
  padding: 8px 12px;
  border: 1px solid #98989829;
  border-radius: 8px;
  background: linear-gradient(185.9617deg, #ffffff29, #ffffff0a 50%, #ffffff03);
  box-shadow: 4px 4px 12px #0000003d;
  font:
    500 17px/1.35 Inter,
    sans-serif;
}
.send :deep(.q-btn__content) {
  gap: 12px;
  flex-wrap: nowrap;
}
.icon {
  display: flex;
  padding: 4px;
  border-radius: 4px;
  background: linear-gradient(
    202.9887deg,
    #0000003d,
    #00000014 51.124%,
    #0000000a
  );
}
.icon img {
  width: 24px;
  height: 24px;
}
.q-btn:focus-visible,
.confirmation input:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 3px;
}
@media (max-width: 600px) {
  .intro {
    line-height: 1.5;
  }
  .send {
    font-size: 15px;
  }
}
</style>
