<template>
  <div class="communication-layout">
    <q-tabs
      v-model="tabModel"
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
            Number(state.data?.unreadCount) > 0
          "
          rounded
          class="q-ml-xs"
          color="grey-7"
          >{{ state.data.unreadCount }}</q-badge
        >
        <q-tooltip v-if="category.unavailable"
          >Este conteúdo ainda não está disponível.</q-tooltip
        >
      </q-tab>
    </q-tabs>
    <div class="communication-columns" :class="{ preview }">
      <div class="communication-main">
        <div v-if="state.loading" class="loading-state" role="status">
          <q-spinner color="primary" size="32px" /><span
            >Carregando comunicações</span
          >
        </div>
        <div v-else-if="state.error" class="tool q-pa-lg" role="alert">
          <p>{{ state.error }}</p>
          <q-btn
            flat
            color="primary"
            no-caps
            label="Tentar novamente"
            @click="$emit('retry')"
          />
        </div>
        <template v-else>
          <p v-if="!validList" class="communication-unavailable" role="status">
            Consulta de comunicações indisponível.
          </p>
          <communication-empty v-else-if="!items.length" :preview="preview" />
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
              :type-new="item.typeLabel || 'Comunicados S.A'"
              :type-color="item.typeColor || '#e7ffa4'"
              :create_at="communicationDate(item.publishedAtUtc)"
              :unread="!item.isRead"
              class-card=""
              :image="item.image"
              :author="item.author"
              @go="$emit('open', item.id)"
            />
          </div>
          <q-pagination
            v-if="validList && !preview && pages > 1"
            v-model="pageModel"
            :max="pages"
            :max-pages="5"
            direction-links
            :icon-prev="'img:' + assets.previous"
            :icon-next="'img:' + assets.next"
            active-color="primary"
            active-text-color="white"
            color="grey-6"
            class="justify-center q-my-lg"
            aria-label="Página dos comunicados"
          />
        </template>
      </div>
      <aside v-if="!preview" class="tool communication-filters">
        <label>Visualização</label>
        <q-btn-toggle
          v-model="layoutModel"
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
                  ? 'img:' + assets.list
                  : 'img:/icons/communication/layout-list-inactive.svg',
            },
            {
              label: 'Card',
              value: 'grid',
              icon:
                layout === 'grid'
                  ? 'img:/icons/communication/layout-grid-active.svg'
                  : 'img:' + assets.grid,
            },
          ]"
          class="q-mt-sm"
        />
        <q-separator class="q-my-lg" />
        <label
          >Categorias<q-select
            v-model="categoryModel"
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
            :dropdown-icon="'img:' + assets.down"
        /></label>
        <label
          >Publicado por<q-select
            outlined
            dense
            bg-color="white"
            disable
            aria-label="Publicado por"
            display-value="Indisponível"
            :dropdown-icon="'img:' + assets.down"
        /></label>
        <label
          >Publicado em<q-select
            v-model="periodModel"
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
            :dropdown-icon="'img:' + assets.down"
        /></label>
        <q-toggle v-model="unreadModel" label="Exibir somente Novos" />
        <div class="filter-actions">
          <q-btn
            flat
            dense
            no-caps
            label="Limpar Filtro"
            :disable="state.loading"
            @click="$emit('clear')"
          /><q-btn
            flat
            dense
            no-caps
            color="primary"
            label="Aplicar Filtro"
            :disable="state.loading"
            @click="$emit('apply')"
          />
        </div>
      </aside>
    </div>
  </div>
</template>
<script setup>
import { computed } from "vue";
import {
  announcementCategories,
  announcementCategory,
  announcementPeriods,
  announcementApiCategories,
} from "src/services/clientAnnouncements";
import {
  communicationDirectoryAssets as assets,
  communicationDate,
} from "src/services/communicationDirectoryAssets";
import CommunicationEmpty from "src/system/components/Communication/CommunicationEmpty.vue";
import CommunicationResumeLayout from "./CommunicationResumeLayout.vue";
const props = defineProps({
  state: { type: Object, required: true },
  preview: Boolean,
  tab: { type: String, default: "" },
  page: { type: Number, default: 1 },
  layout: { type: String, default: "list" },
  draft: { type: Object, required: true },
});
const emit = defineEmits([
  "update:tab",
  "update:page",
  "update:layout",
  "update:draft",
  "retry",
  "clear",
  "apply",
  "open",
]);
const model = (key) =>
  computed({
    get: () => props[key],
    set: (value) => emit("update:" + key, value),
  });
const draftModel = (key) =>
  computed({
    get: () => props.draft[key],
    set: (value) => emit("update:draft", { ...props.draft, [key]: value }),
  });
const tabModel = model("tab"),
  pageModel = model("page"),
  layoutModel = model("layout"),
  categoryModel = draftModel("category"),
  periodModel = draftModel("periodDays"),
  unreadModel = draftModel("unread");
const validList = computed(() => Array.isArray(props.state.data?.data));
const items = computed(() => (validList.value ? props.state.data.data : []));
const pages = computed(() => {
  const n = Number(props.state.data?.pagination?.totalPages);
  return Number.isInteger(n) && n > 0 ? n : 1;
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
  min-height: 48px;
}
.communication-filters :deep(.q-btn__content .q-icon) {
  width: 16px;
  height: 16px;
  font-size: 16px;
}
.communication-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 352px;
  gap: 40px;
  align-items: start;
}
.communication-columns.preview {
  grid-template-columns: 1fr;
}
.communication-items {
  padding: 24px;
  border: 1px solid #efefef29;
  background: linear-gradient(198.77deg, #0000003d, #00000014 51%, #0000000a);
  backdrop-filter: blur(20px);
  box-shadow: 4px 4px 12px #0000003d;
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
  padding: 15px;
  border: 1px solid #efefef14;
  border-radius: 4px;
  background: linear-gradient(208.42deg, #0000003d, #00000014 51%, #0000000a);
  backdrop-filter: blur(20px);
  box-shadow: 4px 4px 12px #0000003d;
  min-width: 0;
}
label {
  display: block;
  font:
    500 14px/1.35 Inter,
    sans-serif;
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
.communication-tabs :deep(.q-tabs__content) {
  gap: 24px;
}
.communication-tabs :deep(.q-tab) {
  padding: 0;
  min-width: 0;
  min-height: 48px;
  flex: 0 0 auto;
}
.communication-tabs :deep(.q-tab__label) {
  font:
    500 17px/1.35 Inter,
    sans-serif;
}
.communication-filters :deep(.q-field__native) {
  font:
    400 14px/1.35 Inter,
    sans-serif;
}
.communication-filters :deep(.q-toggle) {
  min-height: 28px;
}
.communication-filters :deep(.q-toggle__label) {
  font-size: 14px;
}
.communication-filters :deep(.q-btn) {
  font-size: 14px;
}
.communication-main :deep(.q-pagination .q-btn) {
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  font-size: 14px;
}
.communication-main :deep(.q-pagination .q-icon) {
  font-size: 14px;
  width: 14px;
  height: 14px;
}
.communication-filters :deep(.q-btn-toggle) {
  border: 1px solid #989898;
  border-radius: 4px;
}
.communication-filters :deep(.q-btn-toggle .q-btn) {
  min-height: 32px;
  padding: 0 12px;
}
.communication-items :deep(.communication-divider:last-child) {
  margin-bottom: 0;
}
.communication-main :deep(.q-pagination) {
  margin: 32px 0 0;
}
.communication-filters :deep(.q-field__control),
.communication-filters :deep(.q-field__marginal) {
  min-height: 32px;
  height: 32px;
}
.communication-filters :deep(.q-field__native) {
  min-height: 32px;
  padding-top: 4px;
  padding-bottom: 4px;
}
.communication-filters :deep(.q-separator) {
  margin: 32px 0;
}
.communication-filters :deep(.q-btn-toggle .q-btn) {
  min-height: 30px;
  height: 30px;
}
.communication-filters :deep(.q-toggle) {
  min-height: 22px;
  height: 22px;
  padding: 0;
}
.communication-filters :deep(.q-toggle__inner) {
  width: 44px;
  min-width: 44px;
  height: 22px;
  padding: 0;
}
.communication-filters :deep(.q-toggle__track) {
  height: 22px;
  border-radius: 11px;
  opacity: 0.25;
}
.communication-filters :deep(.q-toggle__thumb) {
  width: 18px;
  height: 18px;
  top: 2px;
  left: 2px;
}
.communication-filters :deep(.q-toggle__inner--truthy .q-toggle__thumb) {
  left: 24px;
}
.communication-filters :deep(.q-toggle__inner--truthy .q-toggle__track) {
  opacity: 1;
}
.communication-filters :deep(.q-toggle__thumb:after) {
  background: white;
}
.communication-filters :deep(.q-toggle__label) {
  padding-left: 8px;
  font:
    500 14px/1.35 Inter,
    sans-serif;
}
.filter-actions {
  margin-top: 32px;
}
.filter-actions :deep(.q-btn) {
  min-height: 14px;
  height: 14px;
  padding: 0;
  font:
    500 14px/1 Roboto,
    sans-serif;
  letter-spacing: 0.5px;
}
.filter-actions :deep(.q-btn:first-child) {
  color: #656565;
}
@media (max-width: 599px) {
  .filter-actions :deep(.q-btn) {
    min-height: 32px;
    height: 32px;
  }
}
</style>
