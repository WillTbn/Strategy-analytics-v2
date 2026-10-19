<template>
  <q-page class="communication-page">
    <title-page title="Comunicação" subtitle="Comunicação" />
    <div class="communication-page-content">
      <communication-layout />
    </div>
  </q-page>
</template>
<script setup>
import TitlePage from "src/system/components/TitlePage.vue";
import CommunicationLayout from "../layouts/communication/CommunicationLayout.vue";
</script>
<style scoped>
.communication-page-content {
  min-width: 0;
  padding: 0 16px;
}
</style>
