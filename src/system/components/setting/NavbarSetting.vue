<template>
  <q-toggle
    v-model="navbar.clock"
    dense
    color="primary"
    label="Exibir Relógio no Cabeçalho do Sistema"
    class="clock-preference"
    @update:model-value="setClock"
  />
</template>
<script setup>
import { storeToRefs } from "pinia";
import { useStoreLayout } from "src/stores/layoutStore";
import useStorage from "src/composables/system/useStorage";
const { navbar } = storeToRefs(useStoreLayout());
const { setClock } = useStorage();
</script>
<style scoped>
.clock-preference {
  min-height: 40px;
  font:
    500 14px/1.35 Inter,
    sans-serif;
}
.clock-preference {
  color: white;
}
.clock-preference :deep(.q-toggle__inner) {
  width: 44px;
  height: 22px;
  min-width: 44px;
  padding: 0;
  margin-right: 12px;
}
.clock-preference :deep(.q-toggle__track) {
  width: 44px;
  height: 22px;
  border-radius: 16px;
  background: #ffffff33;
  opacity: 1;
}
.clock-preference :deep(.q-toggle__inner--truthy .q-toggle__track) {
  background: #00a3ff;
}
.clock-preference :deep(.q-toggle__thumb) {
  width: 18px;
  height: 18px;
  top: 2px;
  left: 2px;
}
.clock-preference :deep(.q-toggle__inner--truthy .q-toggle__thumb) {
  left: 24px;
}
.clock-preference :deep(.q-toggle__thumb:after) {
  background: white;
  box-shadow: none;
}
.clock-preference :deep(.q-toggle__thumb:before) {
  display: none;
}
</style>
