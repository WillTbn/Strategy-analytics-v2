<template>
  <div class="theme-setting">
    <p>Tema</p>
    <theme-options />
  </div>
</template>
<script setup>
import ThemeOptions from "./ThemeOptions.vue";
</script>
<style scoped>
.theme-setting {
  min-width: 0;
}
p {
  margin: 0 0 12px;
  font:
    700 14px/1.35 Inter,
    sans-serif;
}
</style>
