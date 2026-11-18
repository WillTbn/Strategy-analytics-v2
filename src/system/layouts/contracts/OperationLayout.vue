<template>
  <section class="operation-layout">
    <h2>Operações</h2>
    <div>
      <h3>Histórico de Operações</h3>
      <operation-table v-bind="$props" @retry="$emit('retry')" />
    </div>
  </section>
</template>
<script setup>
import OperationTable from "./OperationTable.vue";
defineProps({
  rows: { type: Array, default: null },
  loading: Boolean,
  error: String,
  canRetry: Boolean,
});
defineEmits(["retry"]);
</script>
<style scoped>
.operation-layout {
  min-width: 0;
  border: 1px solid #efefef29;
  border-radius: 8px;
  padding: 23px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: white;
  font-family: Inter, sans-serif;
  background: linear-gradient(184.02deg, #0000003d, #00000014 51%, #0000000a);
  backdrop-filter: blur(20px);
  box-shadow: 4px 4px 12px #0000003d;
}
.operation-layout h2 {
  font:
    700 24px/1.5 Inter,
    sans-serif;
  margin: 0;
}
.operation-layout h3 {
  font:
    500 17px/1.35 Inter,
    sans-serif;
  margin: 0 0 12px;
}
@media (max-width: 599px) {
  .operation-layout {
    padding: 16px;
  }
}
</style>
