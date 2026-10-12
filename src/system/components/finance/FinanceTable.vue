<template>
  <resource-state :state="resource.state" @retry="reload">
    <q-table
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
    <div class="row justify-between items-center q-mt-md">
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
import { computed, ref, watch } from "vue";
import ResourceState from "./ResourceState.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { financeGet } from "src/services/financeService";
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
  Number(resource.state.data?.pagination?.totalItems || 0),
);
const pages = computed(() =>
  Number(resource.state.data?.pagination?.totalPages || 0),
);
const reload = () =>
  resource.load(() =>
    financeGet(props.path, { ...props.params, page: page.value, pageSize: 10 }),
  );
watch(
  () => [props.path, props.params],
  () => {
    page.value = 1;
    reload();
  },
  { deep: true },
);
watch(page, reload);
reload();
defineExpose({ reload });
</script>
