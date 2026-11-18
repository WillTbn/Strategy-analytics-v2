<template>
  <div class="operation-table">
    <q-linear-progress
      v-if="loading"
      indeterminate
      aria-label="Carregando operações"
    />
    <div v-if="error" class="operation-error" role="alert">
      <p>{{ error }}</p>
      <q-btn
        v-if="canRetry"
        flat
        no-caps
        color="primary"
        label="Tentar novamente"
        @click="$emit('retry')"
      />
    </div>
    <q-table
      :rows="rows || []"
      :columns="columns"
      row-key="id"
      dark
      flat
      dense
      hide-pagination
      :rows-per-page-options="[0]"
      :pagination="{ rowsPerPage: 0 }"
      class="bg-transparent"
    >
      <template #body-cell-paridade="slot"
        ><q-td :props="slot"
          >{{ parity(slot.row.paridade).name }}
          <q-badge
            v-if="parity(slot.row.paridade).side"
            outline
            :color="parity(slot.row.paridade).side === 'Long' ? 'green' : 'red'"
            :label="parity(slot.row.paridade).side" /></q-td
      ></template>
      <template #body-cell-relacao_pl="slot"
        ><q-td :props="slot"
          ><span :class="profitClass(slot.row.relacao_pl)">{{
            display(slot.row.relacao_pl)
          }}</span></q-td
        ></template
      >
      <template #no-data
        ><div v-if="!loading && !error" class="operation-empty" role="status">
          <template v-if="rows === null"
            ><p>Consulta de operações indisponível.</p></template
          ><template v-else
            ><p>Nenhuma operação registrada</p>
            <p>
              As operações deste contrato aparecem aqui assim que forem
              registradas, com a Relação P/L de cada uma.
            </p></template
          >
        </div></template
      >
    </q-table>
  </div>
</template>
<script setup>
defineProps({
  rows: { type: Array, default: null },
  loading: Boolean,
  error: String,
  canRetry: Boolean,
});
defineEmits(["retry"]);
const fields = [
  ["paridade", "Paridade"],
  ["instrumento", "Instrumento"],
  ["preco_entrada", "Preço de Entrada"],
  ["preco_saida", "Preço de Saída"],
  ["quantidade", "Quantidade"],
  ["tipo_operacao", "Tipo de Operação"],
  ["relacao_pl", "Relação P/L"],
  ["custos_operacao", "Custos de Operação"],
  ["data_hora_operacao", "Data e Hora da Operação"],
];
const display = (value) =>
  (typeof value === "string" && value.trim()) ||
  (typeof value === "number" && Number.isFinite(value))
    ? String(value)
    : "—";
const columns = fields.map(([name, label]) => ({
  name,
  label,
  field: name,
  align: "left",
  format: display,
}));
const parity = (value) => {
  const text = display(value),
    match = text.match(/^(.*)\s+(Long|Short)$/i);
  return match
    ? { name: match[1], side: /long/i.test(match[2]) ? "Long" : "Short" }
    : { name: text, side: null };
};
const profitClass = (value) => {
  const text = display(value);
  return text.startsWith("+")
    ? "operation-profit"
    : text.startsWith("-")
      ? "operation-loss"
      : "";
};
</script>
<style scoped>
.operation-table {
  min-width: 0;
  width: 100%;
  color: #fafafa;
  font-family: Inter, sans-serif;
}
.operation-table :deep(.q-table__container) {
  color: #fafafa;
  box-shadow: none;
  width: calc(100% - 64px);
  margin-left: auto;
}
.operation-table :deep(.q-table__middle) {
  max-height: 340px;
  overflow: auto;
}
.operation-table :deep(table) {
  table-layout: fixed;
  min-width: 1712px;
}
.operation-table :deep(th) {
  height: 40px;
  font:
    500 14px/1.35 Inter,
    sans-serif;
  border-bottom: 1px solid #3d3d3d;
  padding: 8px;
  white-space: nowrap;
}
.operation-table :deep(th + th) {
  border-left: 0;
  position: relative;
}
.operation-table :deep(td) {
  font:
    400 14px/1.35 Inter,
    sans-serif;
  padding: 8px;
  color: #fafafa;
  border-color: #efefef29;
  overflow-wrap: anywhere;
  white-space: normal;
}
.operation-table :deep(.q-table__bottom) {
  padding: 0;
  border: 0;
  min-height: 0;
}
.operation-empty {
  width: 100%;
  padding: 40px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}
.operation-empty p {
  font:
    500 14px / normal Inter,
    sans-serif;
  margin: 0;
}
.operation-empty p + p {
  font:
    400 13px / normal Inter,
    sans-serif;
  color: #ffffff99;
}
.operation-error {
  padding: 12px 0;
  color: #ffb4ab;
}
.operation-error p {
  margin: 0;
}
.operation-profit {
  color: #52c41a;
}
.operation-loss {
  color: #ff4d4f;
}
@media (max-width: 700px) {
  .operation-table :deep(.q-table__container) {
    width: 100%;
  }
}
.operation-table :deep(.q-table th:first-child),
.operation-table :deep(.q-table th:last-child) {
  padding: 8px;
}
.operation-table :deep(th + th:before) {
  content: "";
  position: absolute;
  left: 0;
  top: 10px;
  height: 19px;
  border-left: 1px solid #3d3d3d;
}
</style>
