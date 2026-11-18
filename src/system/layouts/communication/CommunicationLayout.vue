<template>
  <communication-directory
    :state="resource.state"
    :preview="preview"
    v-model:tab="tab"
    v-model:page="page"
    v-model:layout="layout"
    :draft="draft"
    @update:draft="Object.assign(draft, $event)"
    @retry="load"
    @clear="clear"
    @apply="apply"
    @open="
      router.push({ name: 'Comunicação Insight', params: { hash: $event } })
    "
  />
</template>
<script setup>
import { onScopeDispose, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { financeGet, financeWrite } from "src/services/financeService";
import {
  captureClientSession,
  assertClientSessionCurrent,
} from "src/services/clientApi";
import { createAnnouncementsService } from "src/services/clientAnnouncements";
import CommunicationDirectory from "./CommunicationDirectory.vue";
const props = defineProps({ preview: Boolean });
const router = useRouter(),
  tab = ref(""),
  page = ref(1),
  layout = ref("list"),
  resource = useFinanceResource();
const draft = reactive({ category: null, unread: false, periodDays: null }),
  filters = ref({});
const session = captureClientSession();
let active = true;
const service = createAnnouncementsService({
  read: financeGet,
  write: financeWrite,
  assertCurrent: () => {
    assertClientSessionCurrent(session);
    if (!active) throw new Error("Consulta encerrada.");
  },
});
const load = () =>
  resource.load(() =>
    service.list({
      page: page.value,
      pageSize: props.preview ? 3 : 7,
      ...filters.value,
    }),
  );
function apply() {
  filters.value = {
    ...(draft.category ? { category: draft.category } : {}),
    ...(draft.unread ? { unread: true } : {}),
    ...(draft.periodDays ? { periodDays: draft.periodDays } : {}),
  };
  if (page.value !== 1) page.value = 1;
  else load();
}
function clear() {
  draft.category = null;
  draft.unread = false;
  draft.periodDays = null;
  apply();
}
watch(page, load);
watch(tab, () => {
  if (page.value !== 1) page.value = 1;
  else load();
});
load();
onScopeDispose(() => {
  active = false;
  resource.reset();
});
</script>
