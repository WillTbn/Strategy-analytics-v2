<template>
  <div class="communication-page">
    <title-page title="Comunicação" subtitle="Comunicação" />
    <div class="communication-page-content"><slot /></div>
  </div>
</template>
<script setup>
import TitlePage from "src/system/components/TitlePage.vue";
</script>
<style scoped>
.communication-page-content {
  min-width: 0;
  padding: 64px 48px 24px;
}
.communication-page :deep(.title-page) {
  margin: 0;
}
.communication-page :deep(.title-page-main) {
  padding: 24px 48px 0;
  flex: 1;
  max-width: 100%;
  min-width: 0;
}
.communication-page :deep(.title-page-heading) {
  font:
    700 41px/1.5 Inter,
    sans-serif;
}
.communication-page :deep(.title-page-main > .text-caption) {
  font:
    400 14px/1.35 Inter,
    sans-serif;
  margin-bottom: 24px;
}
@media (max-width: 700px) {
  .communication-page-content {
    padding: 32px 16px 24px;
  }
  .communication-page :deep(.title-page-main) {
    padding: 24px 16px 0;
  }
  .communication-page :deep(.title-page-heading) {
    font-size: 32px;
  }
}
</style>
