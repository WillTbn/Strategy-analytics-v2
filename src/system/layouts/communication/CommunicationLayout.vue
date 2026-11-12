<template>
  <div class="communication-layout">
    <q-tabs
      v-model="tab"
      active-color="white"
      inline-label
      align="left"
      no-caps
      class="communication-tabs"
    >
      <q-tab
        v-for="category in announcementCategories"
        :key="category.value"
        :name="category.value"
        :label="category.label"
        :disable="category.unavailable"
        no-caps
      >
        <q-badge
          v-if="
            category.value === 'announcements' &&
            Number(resource.state.data?.unreadCount) > 0
          "
          rounded
          class="q-ml-xs"
          color="grey-7"
          >{{ resource.state.data.unreadCount }}</q-badge
        >
        <q-tooltip v-if="category.unavailable"
          >Este conteúdo ainda não está disponível.</q-tooltip
        >
      </q-tab>
    </q-tabs>
    <div v-if="resource.state.loading" class="loading-state" role="status">
      <q-spinner color="primary" size="32px" /><span
        >Carregando comunicações</span
      >
    </div>
    <div v-else-if="resource.state.error" class="tool q-pa-lg" role="alert">
      <p>{{ resource.state.error }}</p>
      <q-btn
        flat
        color="primary"
        no-caps
        label="Tentar novamente"
        @click="load"
      />
    </div>
    <div v-else class="communication-columns" :class="{ preview }">
      <div class="communication-main">
        <communication-empty v-if="!items.length" :preview="preview" />
        <div
          v-else
          class="tool communication-items"
          :class="{ grid: layout === 'grid' }"
        >
          <communication-resume-layout
            v-for="item in items"
            :key="item.id"
            :horizontal="layout === 'list'"
            :title="item.title"
            :content="item.summary || ''"
            type-new="Comunicados S.A"
            type-color="#e5ffad"
            :create_at="announcementDate(item.publishedAtUtc)"
            :unread="!item.isRead"
            class-card=""
            @go="
              router.push({
                name: 'Comunicação Insight',
                params: { hash: item.id },
              })
            "
          />
        </div>
        <q-pagination
          v-if="!preview && pages > 1"
          v-model="page"
          :max="pages"
          :max-pages="5"
          direction-links
          active-color="primary"
          active-text-color="white"
          color="grey-6"
          class="justify-center q-my-lg"
          aria-label="Página dos comunicados"
        />
      </div>
      <aside v-if="!preview" class="tool communication-filters">
        <label>Visualização</label>
        <q-btn-toggle
          v-model="layout"
          no-caps
          unelevated
          toggle-color="white"
          toggle-text-color="primary"
          :options="[
            {
              label: 'Lista',
              value: 'list',
              icon:
                layout === 'list'
                  ? 'img:/icons/communication/layout-list.svg'
                  : 'img:/icons/communication/layout-list-inactive.svg',
            },
            {
              label: 'Card',
              value: 'grid',
              icon:
                layout === 'grid'
                  ? 'img:/icons/communication/layout-grid-active.svg'
                  : 'img:/icons/communication/layout-grid.svg',
            },
          ]"
          class="q-mt-sm"
        />
        <q-separator class="q-my-lg" />
        <label
          >Categorias<q-select
            v-model="draft.category"
            :options="announcementApiCategories"
            emit-value
            map-options
            clearable
            outlined
            dense
            bg-color="white"
            aria-label="Categoria do comunicado"
            :display-value="
              draft.category
                ? announcementCategory(draft.category).label
                : 'Selecione uma opção'
            "
            dropdown-icon="img:/icons/communication/chevron-down.svg"
        /></label>
        <label
          >Publicado por<q-select
            outlined
            dense
            bg-color="white"
            disable
            aria-label="Publicado por"
            display-value="Indisponível"
            dropdown-icon="img:/icons/communication/chevron-down.svg"
        /></label>
        <label
          >Publicado em<q-select
            v-model="draft.periodDays"
            :options="announcementPeriods"
            emit-value
            map-options
            clearable
            outlined
            dense
            bg-color="white"
            aria-label="Publicado em"
            :display-value="
              draft.periodDays
                ? announcementPeriods.find((p) => p.value === draft.periodDays)
                    ?.label
                : 'Selecione uma opção'
            "
            dropdown-icon="img:/icons/communication/chevron-down.svg"
        /></label>
        <q-toggle v-model="draft.unread" label="Exibir somente Novos" />
        <div class="filter-actions">
          <q-btn
            flat
            dense
            no-caps
            label="Limpar Filtro"
            @click="clear"
          /><q-btn
            flat
            dense
            no-caps
            color="primary"
            label="Aplicar Filtro"
            @click="apply"
          />
        </div>
      </aside>
    </div>
  </div>
</template>
<script setup>
import { computed, onScopeDispose, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { financeGet, financeWrite } from "src/services/financeService";
import {
  captureClientSession,
  assertClientSessionCurrent,
} from "src/services/clientApi";
import {
  announcementCategories,
  announcementCategory,
  announcementPeriods,
  announcementApiCategories,
  announcementDate,
  createAnnouncementsService,
} from "src/services/clientAnnouncements";
import CommunicationEmpty from "src/system/components/Communication/CommunicationEmpty.vue";
import CommunicationResumeLayout from "./CommunicationResumeLayout.vue";
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
const items = computed(() => resource.state.data?.data || []);
const pages = computed(
  () => Number(resource.state.data?.pagination?.totalPages) || 1,
);
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
<style scoped>
.communication-layout,
.communication-main {
  width: 100%;
  min-width: 0;
}
.communication-tabs {
  margin-bottom: 24px;
}
.communication-filters :deep(.q-btn__content .q-icon) {
  width: 16px;
  height: 16px;
  font-size: 16px;
}
.communication-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 336px;
  gap: 40px;
  align-items: start;
}
.communication-columns.preview {
  grid-template-columns: 1fr;
}
.communication-items {
  padding: 24px;
}
.communication-items.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}
.communication-items.grid :deep(.q-card__section) {
  padding: 0;
}
@media (max-width: 1279px) {
  .communication-items.grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.communication-items.grid :deep(.q-separator) {
  display: none;
}
.communication-filters {
  padding: 16px;
  min-width: 0;
}
label {
  display: block;
  font-size: 14px;
}
label :deep(.q-field) {
  margin-top: 8px;
  margin-bottom: 16px;
}
.filter-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.loading-state {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
  min-height: 180px;
}
.unread :deep(.text-weight-bold),
.unread :deep(.text-subtitle2) {
  font-weight: 700;
}
.communication-filters :deep(.q-select__dropdown-icon) {
  width: 16px;
  height: 16px;
  font-size: 16px;
}
.communication-filters :deep(.q-field__native) {
  color: #1a1a1a;
}
@media (max-width: 1023px) {
  .communication-columns {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
  .communication-filters {
    grid-row: 1;
  }
}
@media (max-width: 599px) {
  .communication-items {
    padding: 12px;
  }
  .communication-items.grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
