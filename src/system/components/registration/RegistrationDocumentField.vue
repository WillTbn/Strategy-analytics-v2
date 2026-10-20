<template>
  <label-field :label-input="field.label">
    <q-select
      ref="control"
      v-if="field.kind === 'select'"
      :model-value="modelValue ?? null"
      :display-value="modelValue == null ? 'Selecione' : undefined"
      v-bind="style"
      :class="{ empty: modelValue == null }"
      :aria-label="field.label"
      :options="options"
      emit-value
      map-options
      options-dense
      dropdown-icon="img:/system/icons/auth/select-down.svg"
      popup-content-class="text-dark bg-white"
      :disable="disabled"
      :error="!!error"
      :error-message="error"
      @update:model-value="emit('update:modelValue', $event)"
      ><template #no-option
        ><q-item
          ><q-item-section>Opções ainda indisponíveis.</q-item-section></q-item
        ></template
      ></q-select
    >
    <q-input
      ref="control"
      v-else
      :model-value="modelValue ?? ''"
      v-bind="style"
      :aria-label="field.label"
      :placeholder="field.placeholder"
      :mask="
        field.kind === 'date'
          ? field.format === 'aaaa/mm/dd'
            ? '####/##/##'
            : '##/##/####'
          : undefined
      "
      :inputmode="
        field.kind === 'date'
          ? 'numeric'
          : field.kind === 'money'
            ? 'decimal'
            : 'text'
      "
      autocomplete="off"
      @blur="field.hint && emit('lookup')"
      :disable="disabled"
      :error="!!error"
      :error-message="error"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <p v-if="field.hint" class="caption">{{ field.hint }}</p>
  </label-field>
</template>
<script setup>
import { ref } from "vue";
import LabelField from "src/system/components/form/LabelField.vue";
import { inputWhite } from "src/Utils/ViewInput";
defineProps({
  field: { type: Object, required: true },
  modelValue: { type: [String, Number], default: null },
  options: { type: Array, default: () => [] },
  disabled: Boolean,
  error: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue", "lookup"]);
const control = ref(null);
defineExpose({ focus: () => control.value?.focus() });
const style = {
  ...inputWhite,
  dense: true,
  "item-aligned": false,
  "hide-bottom-space": true,
  "no-error-icon": true,
};
</script>
<style scoped>
:deep(.text-label) {
  display: block;
  margin-bottom: 8px;
  color: white;
  font:
    500 14px/19px Inter,
    sans-serif;
}
:deep(.q-field__control) {
  height: 40px;
  min-height: 40px;
  background: white;
  border-radius: 4px;
}
:deep(.q-select .q-field__control) {
  border-radius: 6px;
}
:deep(.q-field__native),
:deep(.q-field__input) {
  min-height: 40px;
  padding-top: 7px;
  padding-bottom: 7px;
  color: #1d1d1d !important;
  -webkit-text-fill-color: #1d1d1d;
  font:
    400 14px/22px Roboto,
    sans-serif;
}
:deep(.q-field__native::placeholder),
:deep(.empty .q-field__native) {
  color: #989898 !important;
  -webkit-text-fill-color: #989898;
  opacity: 1;
}
:deep(.q-select .q-field__native > span) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:deep(.q-field__append) {
  height: 40px;
  padding-left: 4px;
}
:deep(.q-select__dropdown-icon) {
  width: 18px;
  height: 18px;
  font-size: 18px;
}
:deep(.q-field__bottom) {
  color: #ffb4bd;
}
.caption {
  margin: 2px 0 0;
  color: #dcdcdc;
  font:
    400 14px/1.35 Inter,
    sans-serif;
}
@media (max-width: 600px) {
  :deep(.q-field__native),
  :deep(.q-field__input) {
    font-size: 16px;
  }
}
</style>
