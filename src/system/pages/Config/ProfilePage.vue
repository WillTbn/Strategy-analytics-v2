<template>
  <q-page class="profile-page">
    <title-page title="Perfil Completo" subtitle="Área Perfil" :toBack="true">
    </title-page>
    <q-tabs
      v-model="tab"
      active-color="white"
      class="q-ma-md tool"
      align="left"
      no-caps
    >
      <q-tab
        :name="item.value"
        :label="item.label"
        v-for="(item, index) in options"
        :key="index"
      ></q-tab>
    </q-tabs>
    <q-tab-panels
      v-model="tab"
      animated
      swipeable
      vertical
      transition-prev="scale"
      transition-next="scale"
      class="bg-transparent"
    >
      <q-tab-panel
        :name="item.value"
        v-for="(item, index) in options"
        :key="index"
      >
        <component
          :is="componentsMap[item.component]"
          v-bind="
            item.value === 'bank'
              ? { startWithCreate: route.query.action === 'add' }
              : {}
          "
        />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup>
import { defineComponent, onScopeDispose, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import TitlePage from "src/system/components/TitlePage.vue";
import PersonalSettingLayout from "src/system/layouts/config/PersonalSettingLayout.vue";
import DocumentationSettingLayout from "src/system/layouts/config/DocumentationSettingLayout.vue";
import AccountBankSettingLayout from "src/system/layouts/config/AccountBankSettingLayout.vue";
import RegisterAssetsLayout from "src/system/layouts/config/RegisterAssetsLayout.vue";
import TermsContractLayouts from "src/system/layouts/config/TermsContractLayouts.vue";

const componentsMap = {
  PersonalSettingLayout,
  DocumentationSettingLayout,
  AccountBankSettingLayout,
  RegisterAssetsLayout,
  TermsContractLayouts,
};
defineComponent({
  name: "ProfilePage",
});

const route = useRoute();
const router = useRouter();
const tab = ref("personal");

const options = [
  {
    label: "Dados Pessoais",
    value: "personal",
    component: "PersonalSettingLayout",
  },
  {
    label: "Documentação",
    value: "documentation",
    component: "DocumentationSettingLayout",
  },
  {
    label: "Contas Bancárias",
    value: "bank",
    component: "AccountBankSettingLayout",
  },
  {
    label: "Registro de Patrimônios",
    value: "patrimonio",
    component: "RegisterAssetsLayout",
  },
  {
    label: "Contratos e Termos",
    value: "contracts",
    component: "TermsContractLayouts",
  },
];
const normalizedTab = (value) =>
  options.some((option) => option.value === value) ? value : "personal";
let active = true,
  pendingNavigations = 0,
  selectionRevision = 0;
onScopeDispose(() => {
  active = false;
});
watch(tab, (value) => {
  if (!active || route.name !== "profile") return;
  const revision = ++selectionRevision;
  if (!pendingNavigations && normalizedTab(route.query.tab) === value) return;
  const query = { ...route.query, tab: value };
  if (value !== "bank") delete query.action;
  pendingNavigations++;
  // Force is needed when the latest click returns to the current URL while
  // another tab's guarded navigation is still pending. It cancels that intent.
  const restoreCommittedTab = () => {
    if (active && route.name === "profile" && revision === selectionRevision)
      tab.value = normalizedTab(route.query.tab);
  };
  router
    .replace({ query, force: true })
    .finally(() => {
      pendingNavigations--;
    })
    .then((failure) => {
      if (failure) restoreCommittedTab();
    })
    .catch(restoreCommittedTab);
});
watch(
  () => route.query.tab,
  (value) => {
    if (active && route.name === "profile") tab.value = normalizedTab(value);
  },
  { immediate: true },
);
</script>

<style scoped>
.profile-page :deep(.title-page .text-h3) {
  font-size: 29px;
  line-height: 1.5;
}

.profile-page :deep(.asset-editor .label-form),
.profile-page :deep(.bank-accounts-layout .form-card .label-form),
.profile-page :deep(.documentation-setting-layout .label-form) {
  gap: 8px !important;
  color: #fff;
}
.profile-page :deep(.asset-editor .q-field__control),
.profile-page :deep(.bank-accounts-layout .form-card .q-field__control),
.profile-page
  :deep(.documentation-setting-layout .form-card .q-field__control) {
  background: #fff;
  color: #1d1d1d;
  border-radius: 4px;
  min-height: 40px;
  height: 40px;
  padding: 0 12px;
}
.profile-page :deep(.asset-editor .q-field__native),
.profile-page :deep(.asset-editor .q-field__input),
.profile-page :deep(.asset-editor .q-field__marginal),
.profile-page :deep(.bank-accounts-layout .form-card .q-field__native),
.profile-page :deep(.bank-accounts-layout .form-card .q-field__input),
.profile-page :deep(.bank-accounts-layout .form-card .q-field__marginal) {
  color: #1d1d1d;
  font-size: 14px;
}
.profile-page :deep(.asset-editor .q-field__marginal),
.profile-page :deep(.bank-accounts-layout .form-card .q-field__marginal) {
  height: 40px;
}
.profile-page :deep(.asset-editor .q-field--outlined .q-field__control:before),
.profile-page
  :deep(
    .bank-accounts-layout .form-card .q-field--outlined .q-field__control:before
  ) {
  border: 1px solid #dcdcdc;
}
.profile-page :deep(.asset-editor input::placeholder),
.profile-page :deep(.bank-accounts-layout .form-card input::placeholder) {
  color: #989898;
  opacity: 1;
}

.profile-page :deep(.asset-editor .q-field__prefix) {
  color: #1d1d1d;
}

@media (max-width: 599px) {
  .profile-page :deep(.title-page-main) {
    width: 100%;
    padding: 16px;
  }
  .profile-page :deep(.title-page-heading) {
    white-space: nowrap;
  }
}
</style>
