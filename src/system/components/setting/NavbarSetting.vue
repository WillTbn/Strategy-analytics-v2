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
</style>
