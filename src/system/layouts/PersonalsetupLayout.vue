<template>
  <div class="personal-setup-layout text-white column">
    <change-photo :resource="profile.summary" :theme-system="system.theme" />
    <div class="tool q-mt-md">
      <q-tabs
        v-model="tab"
        active-color="white"
        class="q-my-sm"
        align="left"
        no-caps
      >
        <q-tab name="personal" label="Dados Pessoais" />
        <q-tab name="bank" label="Contas Bancárias" />
      </q-tabs>
      <q-tab-panels v-model="tab" class="bg-transparent">
        <q-tab-panel name="personal"
          ><personal-setting :profile="profile"
        /></q-tab-panel>
        <q-tab-panel name="bank"><banks-setting /></q-tab-panel>
      </q-tab-panels>
      <q-btn
        class="q-mt-md"
        color="primary"
        label="Ver Perfil Completo"
        no-caps
        style="border-radius: 8px; font-weight: 400"
        :to="{ name: 'profile' }"
      />
    </div>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useStoreLayout } from "src/stores/layoutStore";
import useClientProfile from "src/composables/system/useClientProfile";
import ChangePhoto from "src/system/components/setting/ChangePhoto.vue";
import PersonalSetting from "src/system/components/setting/PersonalSetting.vue";
import BanksSetting from "src/system/components/setting/BanksSetting.vue";
const { system } = storeToRefs(useStoreLayout());
const profile = useClientProfile();
const tab = ref("personal");
</script>
<style scoped>
.personal-setup-layout {
  min-width: 0;
}
</style>
