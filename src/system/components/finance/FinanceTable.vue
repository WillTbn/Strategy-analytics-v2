<template>
  <resource-state :state="resource.state" @retry="reload">
    <q-table
      v-if="resource.state.data"
      flat
      :rows="rows"
      :columns="columns"
      :row-key="rowKey"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
      no-data-label="Nenhum registro encontrado"
      class="bg-transparent"
    >
      <template v-for="(_, name) in $slots" #[name]="scope"
        ><slot :name="name" v-bind="scope"
      /></template>
    </q-table>
    <div
      v-if="resource.state.data"
      class="row justify-between items-center q-mt-md"
    >
      <span>{{ total }} registros</span
      ><q-pagination
        v-if="pages > 1"
        v-model="page"
        :max="pages"
        :max-pages="5"
        direction-links
      />
    </div>
  </resource-state>
</template>
<script setup>
import { computed, onScopeDispose, ref, watch } from "vue";
import ResourceState from "./ResourceState.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { financeGet } from "src/services/financeService";
import {
  captureClientSession,
  isClientSessionCurrent,
} from "src/services/clientApi";
const props = defineProps({
  path: { type: String, required: true },
  params: { type: Object, default: () => ({}) },
  columns: { type: Array, required: true },
  rowKey: { type: String, default: "id" },
});
const resource = useFinanceResource(),
  page = ref(1);
const rows = computed(() => resource.state.data?.data || []);
const total = computed(() =>
  Number(resource.state.data?.pagination?.totalItems ?? rows.value.length),
);
const pages = computed(() =>
  Number(
    resource.state.data?.pagination?.totalPages ?? (rows.value.length ? 1 : 0),
  ),
);
let active = true,
  revision = 0,
  lastScopeKey = "";
onScopeDispose(() => {
  active = false;
  revision++;
  resource.reset();
});
const reload = async () => {
  if (!active) return;
  const scopeKey = JSON.stringify([props.path, props.params]),
    scopeChanged = scopeKey !== lastScopeKey,
    requestRevision = ++revision,
    session = captureClientSession();
  lastScopeKey = scopeKey;
  resource.reset();
  if (scopeChanged && page.value !== 1) {
    // The single watcher will perform the page-one request; do not fetch twice.
    resource.state.loading = true;
    page.value = 1;
    return;
  }
  const [path, params] = JSON.parse(scopeKey),
    currentPage = page.value;
  const current = () =>
    active && requestRevision === revision && isClientSessionCurrent(session);
  return resource.load(async () => {
    try {
      const result = await financeGet(path, {
        ...params,
        page: currentPage,
        pageSize: 10,
      });
      if (!current()) return null;
      const lastPage = Math.max(1, Number(result.pagination?.totalPages ?? 1));
      if (currentPage > lastPage) {
        page.value = lastPage;
        return null;
      }
      return result;
    } catch (error) {
      if (current()) throw error;
      return null;
    }
  });
};
watch([() => props.path, () => props.params, page], reload, {
  deep: true,
  immediate: true,
});

defineExpose({ reload });
</script>
