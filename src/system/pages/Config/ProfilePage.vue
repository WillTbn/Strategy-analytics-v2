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
import { defineComponent, ref, watch } from "vue";
import { useRoute } from "vue-router";
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
watch(
  () => route.query.tab,
  (value) => {
    if (options.some((option) => option.value === value)) tab.value = value;
  },
  { immediate: true },
);
</script>

<style scoped>
.profile-page :deep(.title-page .text-h3) {
  font-size: 29px;
  line-height: 1.5;
}
</style>
