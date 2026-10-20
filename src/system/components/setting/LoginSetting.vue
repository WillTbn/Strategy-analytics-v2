<template>
  <q-card class="login-setting tool q-mt-md">
    <textarea-title text="Gerenciamento de Status de Login" />
    <div v-if="error" class="text-negative q-my-sm" role="alert">
      {{ error }}
      <q-btn
        flat
        dense
        no-caps
        color="primary"
        label="Tentar novamente"
        @click="load"
      />
    </div>
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="sessionId"
      :loading="loading"
      :hide-bottom="loading || (Boolean(error) && rows.length === 0)"
      :rows-per-page-options="[5, 10, 20]"
      class="q-mt-md bg-transparent"
      flat
      no-data-label="Nenhuma sessão disponível."
    >
      <template #no-data>
        <span v-if="!loading && !error">Nenhuma sessão disponível.</span>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props"
          ><q-btn
            no-caps
            flat
            color="primary"
            label="Deslogar"
            size="sm"
            :disable="Boolean(revoking)"
            :loading="revoking === props.row.sessionId"
            @click="handleLogout(props.row)"
        /></q-td>
      </template>
    </q-table>
  </q-card>
</template>
<script setup>
import { onScopeDispose, ref } from "vue";
import TextareaTitle from "src/system/components/TextareaTitle.vue";
import { listSessions, revokeSession } from "src/services/clientAccountService";
import { getApiErrorMessage } from "src/services/clientAuthService";
import {
  captureClientSession,
  isClientSessionCurrent,
} from "src/services/clientApi";
import useAuth from "src/composables/system/useAuth";
import { collection } from "src/services/profilePresentation";
import { sessionRows } from "src/services/profileSessions";
const { setLogout } = useAuth();
const rows = ref([]),
  loading = ref(false),
  error = ref(""),
  revoking = ref(null);
let active = true,
  operation = 0;
onScopeDispose(() => {
  active = false;
});
const columns = [
  { name: "date", label: "Data e Hora", field: "date", align: "left" },
  { name: "ip", label: "IP", field: "ip", align: "left" },
  { name: "local", label: "Local", field: "local", align: "left" },
  {
    name: "equipment",
    label: "Equipamento",
    field: "equipment",
    align: "left",
    classes: "equipment-cell",
  },
  { name: "actions", label: "", field: "actions", align: "left" },
];
async function load() {
  const session = captureClientSession(),
    version = ++operation;
  loading.value = true;
  error.value = "";
  rows.value = [];
  try {
    const result = await listSessions();
    if (active && version === operation && isClientSessionCurrent(session))
      rows.value = sessionRows(collection(result));
  } catch (e) {
    if (active && version === operation && isClientSessionCurrent(session))
      error.value = getApiErrorMessage(
        e,
        "Não foi possível consultar as sessões.",
      );
  } finally {
    if (active && version === operation) loading.value = false;
  }
}
async function handleLogout(row) {
  if (revoking.value || !row.sessionId) return;
  const session = captureClientSession();
  revoking.value = row.sessionId;
  error.value = "";
  try {
    await revokeSession(row.sessionId);
    if (!active || !isClientSessionCurrent(session)) return;
    if (row.isCurrent) await setLogout();
    else await load();
  } catch (e) {
    if (active && isClientSessionCurrent(session))
      error.value = getApiErrorMessage(
        e,
        "Não foi possível encerrar esta sessão.",
      );
  } finally {
    revoking.value = null;
  }
}
load();
</script>
<style scoped>
.login-setting {
  min-width: 0;
}
:deep(.equipment-cell) {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
