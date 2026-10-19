<template>
  <div class="communication-layout">
    <q-tabs
      v-model="tab"
      active-color="white"
      inline-label
      align="left"
      no-caps
      class="communication-tabs"
    >
      <q-tab
        v-for="category in categories"
        :key="category"
        :name="category"
        :label="category"
        no-caps
      />
    </q-tabs>
    <communication-empty :preview="preview" />
  </div>
</template>
<script setup>
import { ref } from "vue";
import CommunicationEmpty from "src/system/components/Communication/CommunicationEmpty.vue";
defineProps({ preview: Boolean });
const tab = ref("Todos");
const categories = [
  "Todos",
  "Comunicados S.A",
  "Insights Relevantes",
  "Relatórios Econômicos",
];
// No publication endpoint is available in the current contract. Do not seed the portal with demo posts.
</script>
<style scoped>
.communication-layout {
  width: 100%;
  min-width: 0;
}
.communication-tabs {
  margin-bottom: 24px;
}
</style>
