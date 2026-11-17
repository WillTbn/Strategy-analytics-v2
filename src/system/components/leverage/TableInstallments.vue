<template>
  <div class="loan-installments">
    <p v-if="error" class="loan-installments-error" role="alert">{{ error }}</p>
    <!-- Botões de ação abaixo da tabela -->
    <div class="row justify-between" v-if="!paidOff">
      <div class="col-auto">
        <q-toggle v-model="pending" label="Exibir somente parcelas pendentes" />
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          no-caps
          label="Pagar parcelas selecionadas"
          :disable="!paySelected || busy || !payableSelected.length"
          @click="pagarParcelasSelecionadas"
          flat
        />
        <q-btn
          outline
          color="grey-7"
          no-caps
          flat
          label="Baixar Extrato de Parcelas"
          :disable="!downloadStatement || busy"
          @click="baixarExtrato"
        />
      </div>
    </div>
    <div class="row justify-end" v-else>
      <div class="col-auto">
        <q-btn
          outline
          color="grey-7"
          no-caps
          flat
          label="Baixar Extrato de Parcelas"
          :disable="!downloadStatement || busy"
          @click="baixarExtrato"
        />
      </div>
    </div>
    <div class="text-inter-17-500 q-mb-sm">Tabela de Parcelas</div>
    <q-table
      :rows="visibleRows"
      :columns="columns"
      row-key="numero"
      dark
      :pagination="{ rowsPerPage: 0 }"
      :rows-per-page-options="[0]"
      flat
      dense
      hide-pagination
      class="bg-transparent"
      selection="multiple"
      v-model:selected="selected"
      options-dense
    >
      <!-- Slot personalizado para a coluna Comprovante -->
      <template v-slot:body-cell-comprovante="props">
        <q-td :props="props">
          <div v-if="props.row.comprovante">
            <span class="loan-pdf"
              ><img src="/figma/my-leverage/pdf.png" alt=""
            /></span>
            <span class="text-neutral">{{ props.row.comprovante }}</span>
          </div>
          <div v-else>
            <q-btn
              flat
              class="text-neutral"
              no-caps
              @click="fazerUpload(props.row)"
              :disable="!uploadReceipt || busy"
            >
              <img src="/figma/my-leverage/plus.svg" alt="" class="q-mr-sm" />
              <span class=""> Fazer Upload </span>
            </q-btn>
          </div>
        </q-td>
      </template>

      <!-- Slot personalizado para ações -->
      <template v-slot:body-cell-acoes="props">
        <q-td :props="props">
          <q-btn
            v-if="props.row.pagar_agora"
            color="primary"
            @click="pagarParcela(props.row)"
            :disable="!payOne || busy"
            style="border-radius: 6px"
            no-caps
          >
            <img src="/figma/my-leverage/pay.svg" alt="" class="q-mr-sm" />
            <span>Pagar agora</span>
          </q-btn>
          <q-btn
            v-if="!props.row.pagar_agora && !props.row.comprovante"
            class="bg-btn-neutral text-grey"
            disabled
            @click="pagarParcela(props.row)"
            style="border-radius: 6px"
            no-caps
          >
            <img
              src="/figma/my-leverage/pay-disabled.svg"
              alt=""
              class="q-mr-sm"
            />
            <span>Pagar agora</span>
          </q-btn>
          <q-btn
            flat
            no-caps
            label="Antecipar"
            :disable="!anticipate || busy"
            @click="run(() => anticipate(props.row))"
            color="primary"
            v-if="!props.row.pagar_agora && !props.row.comprovante"
          />
        </q-td>
      </template>

      <!-- Slot personalizado para status -->
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :class="getStatusColor(props.row.status)"
            :label="props.row.status"
          />
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { ref, computed, watch, onScopeDispose } from "vue";
const props = defineProps({
  parcelas: { type: Array, default: () => [] },
  paidOff: Boolean,
  paySelected: Function,
  payOne: Function,
  uploadReceipt: Function,
  downloadStatement: Function,
  anticipate: Function,
});
const selected = ref([]),
  pending = ref(false),
  busy = ref(false),
  error = ref("");
let active = true;
const isPaid = (row) => /^Pago\b/i.test(row.status || "");
const visibleRows = computed(() =>
  pending.value && !props.paidOff
    ? props.parcelas.filter((row) => !isPaid(row))
    : props.parcelas,
);
const payableSelected = computed(() =>
  selected.value.filter((row) => props.parcelas.includes(row) && !isPaid(row)),
);
watch(
  () => props.parcelas,
  () => {
    selected.value = [];
    error.value = "";
  },
);
async function run(action) {
  if (!action || busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    await action();
  } catch {
    if (active)
      error.value = "Não foi possível concluir esta ação. Tente novamente.";
  } finally {
    if (active) busy.value = false;
  }
}
const fazerUpload = (row) =>
  props.uploadReceipt && !isPaid(row) && run(() => props.uploadReceipt(row));
const pagarParcela = (row) =>
  props.payOne &&
  props.parcelas.includes(row) &&
  !isPaid(row) &&
  row.pagar_agora === true &&
  run(() => props.payOne(row));
const pagarParcelasSelecionadas = () =>
  props.paySelected &&
  payableSelected.value.length &&
  run(() => props.paySelected([...payableSelected.value]));
const baixarExtrato = () =>
  props.downloadStatement && run(props.downloadStatement);
onScopeDispose(() => {
  active = false;
});
const columns = ref([
  {
    name: "numero",
    required: true,
    label: "N° da Parcela",
    align: "left",
    field: "numero",
    sortable: true,
  },
  {
    name: "vencimento",
    align: "left",
    label: "Vencimento",
    field: "vencimento",
    sortable: true,
    classes: (row) => {
      if (String(row.status || "").includes("Atrasado")) return "text-error";
    },
  },
  {
    name: "valor",
    align: "right",
    label: "Valor da Parcela (R$)",
    field: "valor",
    sortable: true,
    format: (val) =>
      val == null || !Number.isFinite(Number(val))
        ? "—"
        : Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
  },
  {
    name: "status",
    align: "left",
    label: "Status",
    field: "status",
    sortable: true,
  },
  {
    name: "comprovante",
    align: "left",
    label: "Comprovante do Pagamento",
    field: "comprovante",
  },
  {
    name: "acoes",
    align: "left",
    label: "",
    field: "pagar_agora",
  },
]);
const getStatusColor = (status) =>
  /^Pago\b/i.test(status || "")
    ? "bg-btn-success"
    : /Atrasado/i.test(status || "")
      ? "bg-btn-error"
      : "bg-btn-neutral";
</script>
<style scoped>
.loan-installments {
  font-family: Inter, sans-serif;
  color: white;
  min-width: 0;
}
.loan-installments :deep(.q-table__container) {
  color: white;
  background: transparent;
}
.loan-installments :deep(.q-table__middle) {
  max-height: 315px;
  overflow: auto;
}
.loan-installments :deep(th),
.loan-installments :deep(td) {
  color: #efefef;
  border-color: #efefef29;
}
.loan-installments :deep(th) {
  font-size: 14px;
  font-weight: 400;
}
.loan-installments :deep(.q-toggle__label) {
  font-size: 14px;
}
.loan-installments :deep(.q-btn) {
  font-size: 14px;
}
.loan-pdf {
  display: inline-block;
  position: relative;
  width: 32px;
  height: 32px;
  overflow: hidden;
  vertical-align: middle;
  margin-right: 8px;
}
.loan-pdf img {
  position: absolute;
  width: 177.34%;
  height: 100.26%;
  left: -38.67%;
  top: -0.13%;
  max-width: none;
}
.loan-installments-error {
  color: #ffb4ab;
}
.icon-png {
  max-width: 32px;
  height: 32px;
  object-fit: contain;
}
@media (max-width: 700px) {
  .loan-installments > .row {
    gap: 12px;
  }
  .loan-installments :deep(.q-table) {
    min-width: 800px;
  }
}
</style>
