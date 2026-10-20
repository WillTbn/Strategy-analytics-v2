<template>
  <q-form class="registration-document" novalidate @submit="submit">
    <p class="residence">País de residência: {{ config.label }}</p>
    <h2>Endereço</h2>
    <div
      v-for="(row, index) in config.address"
      :key="`address-${index}`"
      class="fields"
      :class="rowClass(row)"
    >
      <registration-document-field
        v-for="field in row"
        :key="field.key"
        :ref="(el) => (controls[field.key] = el)"
        v-model="form.values[field.key]"
        @lookup="lookupPostalCode"
        :field="field"
        :options="optionsFor(field.key)"
        :error="
          errors[field.key] ||
          (field.key === 'postalCode' ? postalState.error : '')
        "
        :loading="field.key === 'postalCode' && postalState.loading"
        :disabled="busy"
      />
    </div>
    <div class="divider" />
    <h2>Documento</h2>
    <div
      v-for="(row, index) in config.before || []"
      :key="`before-${index}`"
      class="fields"
      :class="rowClass(row)"
    >
      <registration-document-field
        v-for="field in row"
        :key="field.key"
        :ref="(el) => (controls[field.key] = el)"
        v-model="form.values[field.key]"
        @lookup="lookupPostalCode"
        :field="field"
        :error="
          errors[field.key] ||
          (field.key === 'postalCode' ? postalState.error : '')
        "
        :loading="field.key === 'postalCode' && postalState.loading"
        :disabled="busy"
      />
    </div>
    <div class="type">
      <p>Tipo de documento</p>
      <div role="group" aria-label="Tipo de documento" class="choices">
        <button
          v-for="choice in config.choices"
          :key="choice"
          type="button"
          :aria-pressed="form.type === choice"
          :disabled="busy"
          @click="changeType(choice)"
        >
          {{ choice }}
        </button>
      </div>
    </div>
    <div
      v-for="(row, index) in rows"
      :key="`${form.type}-${index}`"
      class="fields"
      :class="rowClass(row)"
    >
      <registration-document-field
        v-for="field in row"
        :key="field.key"
        :ref="(el) => (controls[field.key] = el)"
        v-model="form.details[form.type][field.key]"
        :field="field"
        :options="optionsFor(field.key)"
        :error="
          errors[field.key] ||
          (field.key === 'postalCode' ? postalState.error : '')
        "
        :loading="field.key === 'postalCode' && postalState.loading"
        :disabled="busy"
      />
    </div>
    <section
      v-if="config.parents && form.type !== 'Passaporte'"
      class="parents"
    >
      <h3>Filiação</h3>
      <p class="muted">Como está no seu documento.</p>
      <div class="fields two">
        <div
          v-for="(parent, index) in form.parents"
          :key="index"
          class="parent"
        >
          <registration-document-field
            v-model="parent.name"
            :field="{
              key: `parent${index}`,
              label: `Filiação ${index + 1}`,
              placeholder: 'Nome completo',
            }"
            :disabled="busy || parent.absent"
          /><label class="absent"
            ><input
              v-model="parent.absent"
              type="checkbox"
              :aria-label="`Filiação ${index + 1}: Não consta no meu documento`"
              :disabled="busy"
            /><span>Não consta no meu documento</span></label
          >
        </div>
      </div>
    </section>
    <section class="files">
      <h3>Foto ou arquivo do documento</h3>
      <div class="fields" :class="{ two: form.type !== 'Passaporte' }">
        <registration-document-file
          v-for="side in sides"
          :key="`${form.type}-${side.key}`"
          v-model="form.files[`${form.type}:${side.key}`]"
          :label="side.label"
          :status="registrationFileState(form, side.key)"
          :rules="fileRules"
          :disabled="busy"
        />
      </div>
      <p class="muted">
        Foto nítida, sem reflexo e com todas as bordas aparecendo.{{
          variant === "br" ? " Só este documento é pedido no cadastro." : ""
        }}
      </p>
    </section>
    <p class="muted">
      Se escolher Passaporte: número, país emissor, data de expedição, validade
      e a foto da página com seus dados.
    </p>
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
        class="continue"
        :disable="busy || postalState.loading"
        ><span class="icon"
          ><img src="/system/icons/auth/enter.svg" alt="" /></span
        ><span>Continuar</span></q-btn
      >
    </footer>
  </q-form>
</template>
<script setup>
import { computed, reactive, ref, watch, nextTick, onBeforeUnmount } from "vue";
import RegistrationDocumentField from "./RegistrationDocumentField.vue";
import RegistrationDocumentFile from "./RegistrationDocumentFile.vue";
import {
  copyRegistrationDocuments,
  documentRows,
  documentVariants,
  validateRegistrationDocuments,
} from "src/services/registrationDocuments";
import { registrationFileState } from "src/services/registrationDocumentResume";
import { lookupBrazilianPostalCode } from "src/services/postalCodeService";
import { createRegistrationPostalLookup } from "src/services/registrationPostalCode";
const props = defineProps({
  variant: { type: String, required: true },
  modelValue: { type: Object, required: true },
  catalog: { type: Object, default: () => ({}) },
  fileRules: { type: Object, default: () => ({}) },
  busy: Boolean,
});
const emit = defineEmits(["update:modelValue", "back", "validated"]);
const config = computed(() => documentVariants[props.variant]);
const form = reactive(copyRegistrationDocuments(props.modelValue));
const controls = ref({});
const errors = ref({}),
  notice = ref("");
watch(form, () => emit("update:modelValue", copyRegistrationDocuments(form)), {
  deep: true,
  flush: "sync",
});
const postalState = reactive({ loading: false, error: "" });
const postalRegions = ref([]);
const postal = createRegistrationPostalLookup({
  values: form.values,
  read: lookupBrazilianPostalCode,
  state: postalState,
  region: (value, name) => {
    postalRegions.value = [
      { value, label: typeof name === "string" && name.trim() ? name : value },
    ];
  },
});
watch(() => form.values.postalCode, postal.invalidate, { flush: "sync" });
onBeforeUnmount(postal.invalidate);
const lookupPostalCode = () => {
  if (props.variant === "br" && !props.busy) return postal.lookup();
};
const optionsFor = (key) => {
  const options = props.catalog[key] || [];
  return key === "region" && props.variant === "br"
    ? [
        ...postalRegions.value,
        ...options.filter(
          (o) => !postalRegions.value.some((p) => p.value === o.value),
        ),
      ]
    : options;
};
const rows = computed(() => documentRows(props.variant, form.type));
const sides = computed(() =>
  form.type === "Passaporte"
    ? [{ key: "passport", label: "Página com seus dados" }]
    : [
        { key: "front", label: "Frente do documento" },
        { key: "back", label: "Verso do documento" },
      ],
);
const rowClass = (row) => ({
  two: row.length === 2,
  half:
    row.length === 1 &&
    (row[0].half || ["region", "expiryDate"].includes(row[0].key)),
});
const changeType = (type) => {
  if (props.busy) return;
  form.details[type] ||= {};
  form.type = type;
  errors.value = {};
  notice.value = "";
};
const submit = async () => {
  if (props.busy || postalState.loading) return;
  errors.value = validateRegistrationDocuments(props.variant, form);
  if (Object.keys(errors.value).length) {
    notice.value = "Confira as datas indicadas antes de continuar.";
    await nextTick();
    controls.value[Object.keys(errors.value)[0]]?.focus();
    return;
  }
  notice.value = "";
  emit("validated");
};
</script>
<style scoped>
@font-face {
  font-family: "Registration Emoji";
  src: url("/system/fonts/registration/noto-color-emoji.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+1f1e6-1f1ff;
}
.registration-document {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}
p,
h2,
h3 {
  margin: 0;
}
h2 {
  font:
    500 14px/17px Inter,
    sans-serif;
  color: #00a3ff;
}
h3,
.type > p {
  font:
    500 14px/17px Inter,
    sans-serif;
}
.residence {
  color: #ffffff99;
  font:
    400 13px/16px Inter,
    "Registration Emoji",
    sans-serif;
}
.fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  min-width: 0;
}
.fields.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.fields.half {
  width: min(332px, 100%);
}
.fields > * {
  min-width: 0;
}
.divider {
  height: 1px;
  background: #ffffff1a;
}
.type,
.files,
.parents {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.choices button {
  padding: 10px 20px;
  border: 1px solid #ffffff33;
  border-radius: 8px;
  background: #ffffff0a;
  color: white;
  font:
    500 14px/17px Inter,
    sans-serif;
  cursor: pointer;
  max-width: 100%;
  overflow-wrap: anywhere;
}
.choices button[aria-pressed="true"] {
  background: #00a3ff24;
  border-color: #00a3ffe6;
}
.muted {
  color: #ffffff99;
  font:
    400 13px/16px Inter,
    sans-serif;
  overflow-wrap: anywhere;
}
.parent {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.absent {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffffcc;
  font:
    400 14px/17px Inter,
    sans-serif;
  cursor: pointer;
}
.absent input {
  appearance: none;
  margin: 0;
  width: 18px;
  height: 18px;
  flex: none;
  border: 1.5px solid #ffffff66;
  border-radius: 4px;
  background: transparent;
}
.absent input:checked {
  appearance: auto;
  accent-color: #00a3ff;
}
.notice {
  color: #ffb4bd;
  font-size: 14px;
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
.continue {
  min-height: 50px;
  padding: 8px 12px;
  border: 1px solid #98989829;
  border-radius: 8px;
  background: linear-gradient(187.8342deg, #ffffff29, #ffffff0a 50%, #ffffff03);
  box-shadow: 4px 4px 12px #0000003d;
  font:
    500 17px/1.35 Inter,
    sans-serif;
}
.continue :deep(.q-btn__content) {
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
button:focus-visible,
.absent input:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 3px;
}
@media (max-width: 600px) {
  .fields.two {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
