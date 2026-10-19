<template>
  <div class="coin-setting">
    <div v-for="group in groups" :key="group.title" class="preference-group">
      <p class="preference-group-title">{{ group.title }}</p>
      <div class="preference-fields">
        <label-form
          v-for="field in group.fields"
          :key="field.key"
          :text-label="field.label"
        >
          <q-select
            :model-value="values[field.key] ?? null"
            :options="preferenceOptions(catalog, field.key)"
            :aria-label="field.label"
            :disable="disabled"
            class="preference-select"
            outlined
            dense
            dark
            emit-value
            map-options
            hide-dropdown-icon
            options-dense
            @update:model-value="emit('change', field.key, $event)"
          >
            <template #append
              ><img src="/img/preferences/chevron-down.svg" alt=""
            /></template>
          </q-select>
        </label-form>
      </div>
    </div>
  </div>
</template>
<script setup>
import LabelForm from "src/system/components/form/LabelForm.vue";
import { preferenceOptions } from "src/services/preferenceEditor";
defineProps({
  values: { type: Object, required: true },
  catalog: { type: Object, required: true },
  disabled: Boolean,
});
const emit = defineEmits(["change"]);
const groups = [
  {
    title: "Moedas de Exibição no Sistema",
    fields: [
      { key: "primaryCurrencyCode", label: "Moeda Primária" },
      { key: "secondaryCurrencyCode", label: "Moeda Secundária" },
    ],
  },
  {
    title: "Idioma e Fuso Horário",
    fields: [
      { key: "languageCode", label: "Idioma do Sistema" },
      { key: "timeZoneId", label: "Fuso Horário do Sistema" },
    ],
  },
];
</script>
<style scoped>
.coin-setting {
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-width: 0;
}
.preference-group {
  min-width: 0;
}
.preference-group-title {
  margin: 0 0 12px;
  font:
    700 14px/1.35 Inter,
    sans-serif;
}
.preference-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.preference-fields > * {
  min-width: 0;
}
.preference-select {
  min-width: 0;
}
.preference-select :deep(.q-field__control) {
  min-height: 32px;
  height: 32px;
  border-radius: 4px;
  background: linear-gradient(
    182deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.01)
  );
}
.preference-select :deep(.q-field__native),
.preference-select :deep(.q-field__marginal) {
  min-height: 32px;
  height: 32px;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 14px;
}
.preference-select :deep(.q-field__native) {
  min-width: 0;
  flex-wrap: nowrap;
  color: #989898;
}
.preference-select :deep(.q-field__control:before) {
  border-color: rgba(239, 239, 239, 0.16);
}
.preference-select :deep(.q-field__native > span) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
@media (max-width: 599px) {
  .preference-fields {
    grid-template-columns: 1fr;
  }
}
</style>
