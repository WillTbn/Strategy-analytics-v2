<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="detail-assets-dialog">
      <header>
        <h2>Ativos do Contrato</h2>
        <q-btn
          flat
          round
          dense
          aria-label="Fechar ativos do contrato"
          @click="$emit('update:modelValue', false)"
          ><img :src="assets.close" alt=""
        /></q-btn>
      </header>
      <div class="detail-assets-content">
        <div class="detail-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Bolsa</th>
                <th>Nome</th>
                <th>Tag</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in validRows" :key="row.id || index">
                <td>
                  <img
                    v-if="image(row.flag)"
                    :src="image(row.flag)"
                    alt=""
                    class="detail-exchange-flag"
                  />{{ row.exchange || "—" }}
                </td>
                <td>{{ row.name || "—" }}</td>
                <td>{{ row.symbol || "—" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p
          v-if="!Array.isArray(rows)"
          role="status"
          class="detail-query-status"
        >
          Ativos do contrato indisponíveis
        </p>
        <p
          v-else-if="!validRows.length"
          role="status"
          class="detail-query-status"
        >
          Nenhum ativo vinculado
        </p>
      </div>
      <p v-if="error" class="detail-error" role="alert">{{ error }}</p>
      <footer>
        <q-btn flat no-caps @click="$emit('update:modelValue', false)"
          ><img :src="assets.back" alt="" />Voltar</q-btn
        ><q-btn
          color="primary"
          no-caps
          label="Exportar em PDF"
          :loading="exporting"
          :disable="!canExport || !validRows.length"
          @click="exportPdf"
        />
      </footer>
    </q-card>
  </q-dialog>
</template>
<script setup>
import { computed, onScopeDispose, ref, watch } from "vue";
import {
  detailAssets as assets,
  safeDetailImage as image,
} from "src/services/contractDetailPresentation";
const props = defineProps({
  modelValue: Boolean,
  rows: Array,
  exportDocument: Function,
  contractId: String,
});
defineEmits(["update:modelValue"]);
const exporting = ref(false),
  error = ref("");
let active = true,
  revision = 0;
onScopeDispose(() => {
  active = false;
  revision++;
});
watch(
  () => props.contractId,
  () => {
    revision++;
    exporting.value = false;
    error.value = "";
  },
);
watch(
  () => props.modelValue,
  (value) => {
    if (!value) error.value = "";
  },
);
const validRows = computed(() =>
  Array.isArray(props.rows)
    ? props.rows.filter((r) => r && typeof r === "object")
    : [],
);
const canExport = computed(() => typeof props.exportDocument === "function");
async function exportPdf() {
  if (!active || exporting.value || !canExport.value || !validRows.value.length)
    return;
  const attempt = ++revision;
  exporting.value = true;
  error.value = "";
  try {
    await props.exportDocument(props.contractId);
  } catch {
    if (active && revision === attempt)
      error.value = "Não foi possível exportar os ativos. Tente novamente.";
  } finally {
    if (active && revision === attempt) exporting.value = false;
  }
}
</script>
