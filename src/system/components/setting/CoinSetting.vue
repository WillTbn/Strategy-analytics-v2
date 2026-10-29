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
            :class="{ 'preference-select--open': openField === field.key }"
            popup-content-class="portal-preference-menu"
            :popup-content-style="{ '--preference-menu-bg': menuBackground }"
            :options-cover="false"
            :menu-offset="[0, 4]"
            behavior="menu"
            @popup-show="openField = field.key"
            @popup-hide="openField = null"
            outlined
            dense
            dark
            emit-value
            map-options
            hide-dropdown-icon
            options-dense
            @update:model-value="emit('change', field.key, $event)"
          >
            <template #option="scope">
              <q-item
                v-bind="scope.itemProps"
                class="portal-preference-option"
                :class="{
                  'portal-preference-option--selected': scope.selected,
                }"
              >
                <q-item-section>{{ scope.opt.label }}</q-item-section>
                <q-item-section v-if="scope.selected" side
                  ><q-icon name="check" size="16px"
                /></q-item-section>
              </q-item>
            </template>
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
import { computed, ref } from "vue";
import { useStoreLayout } from "src/stores/layoutStore";
const layout = useStoreLayout();
const openField = ref(null);
const menuBackground = computed(() =>
  layout.system.theme === "bg-theme-2" ? "#171717f5" : "#0e1420f5",
);
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
.preference-select :deep(.q-field__control:after) {
  display: none;
}
.preference-select :deep(.q-field__control:before) {
  border: 1px solid #efefef29;
}
.preference-select :deep(.q-field__native),
.preference-select :deep(.q-field__input) {
  font-weight: 400;
  color: #989898;
}
.preference-select--open :deep(.q-field__control:before) {
  border-color: #efefef66;
}
.preference-select--open :deep(.q-field__native) {
  color: white;
}
.preference-select :deep(.q-field__control) {
  box-shadow: none;
}
</style>
<style>
.portal-preference-menu {
  padding: 4px;
  border: 1px solid #efefef29;
  border-radius: 8px;
  background:
    linear-gradient(150deg, #ffffff29, #ffffff0a 50%, #ffffff03),
    var(--preference-menu-bg, #0e1420f5);
  backdrop-filter: blur(40px);
  box-shadow: 0 8px 24px #00000052;
}
.portal-preference-menu .portal-preference-option {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 6px;
  font:
    400 14px Inter,
    sans-serif;
  color: #ffffffd9;
}
.portal-preference-menu .portal-preference-option--selected {
  background: #ffffff1f;
  color: white;
  font-weight: 500;
}
.portal-preference-menu .portal-preference-option:hover {
  background: #ffffff14;
}
.portal-preference-menu .portal-preference-option {
  border-bottom: 0;
}
.portal-preference-menu .q-item__section--side .q-icon {
  color: #00a3ff;
}
.portal-preference-menu .q-item__section--side {
  color: #00a3ff;
}
</style>
