<template>
  <div class="theme-options" role="group" aria-label="Tema">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="theme-option"
      :class="[
        option.value,
        { 'border-active': system.theme === option.value },
      ]"
      :aria-label="option.label"
      :aria-pressed="system.theme === option.value"
      @click="selectTheme(option.value)"
    >
      <img
        v-if="system.theme === option.value"
        src="/img/preferences/check.svg"
        alt=""
      />
    </button>
  </div>
</template>
<script setup>
import { storeToRefs } from "pinia";
import { useStoreLayout } from "src/stores/layoutStore";
import useStorage from "src/composables/system/useStorage";
const { system } = storeToRefs(useStoreLayout());
const { setSystemTheme } = useStorage();
const options = [
  { value: "bg-simulator", label: "Azul e vermelho" },
  { value: "bg-theme-2", label: "Cinza e preto" },
  { value: "bg-theme-3", label: "Aurora" },
];
const selectTheme = (value) => {
  system.value.theme = value;
  setSystemTheme();
};
</script>
<style scoped>
.theme-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.theme-option {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  min-width: 0;
  border: 1px solid #464646;
  border-radius: 4px;
  padding: 0;
  cursor: pointer;
}
.theme-option.border-active {
  border: 2px solid var(--active, #00a3ff);
}
.theme-option:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}
@media (max-width: 599px) {
  .theme-options {
    gap: 12px;
  }
}
</style>
