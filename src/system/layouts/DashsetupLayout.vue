<template>
  <section
    class="dashsetup-layout tool"
    aria-labelledby="preferences-title"
    :aria-busy="state.loading || state.saving"
  >
    <h2 id="preferences-title">Preferências</h2>
    <navbar-setting />
    <theme-setting />
    <coin-setting
      :values="state.values"
      :catalog="state.catalog"
      :disabled="!state.ready || state.loading || state.saving"
      @change="changePreference"
    />
    <div class="preferences-feedback" aria-live="polite">
      <span v-if="state.loading">Carregando preferências…</span>
      <span v-else-if="state.saving">Salvando preferências…</span>
      <p
        v-if="state.loadError || state.saveError"
        role="alert"
        class="preferences-error"
      >
        {{ state.loadError || state.saveError }}
      </p>
    </div>
  </section>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive } from "vue";
import NavbarSetting from "src/system/components/setting/NavbarSetting.vue";
import ThemeSetting from "src/system/components/setting/ThemeSetting.vue";
import CoinSetting from "src/system/components/setting/CoinSetting.vue";
import {
  getClientPreferences,
  getClientProfile,
  getPreferenceCatalog,
  updateClientPreferences,
} from "src/services/clientProfileService";
import { getApiErrorMessage } from "src/services/clientAuthService";
import { createPreferenceEditor } from "src/services/preferenceEditor";
import useNotify from "src/composables/useNotify";

const { successNotify } = useNotify();
const state = reactive({
  values: {},
  catalog: {},
  ready: false,
  loading: true,
  saving: false,
  loadError: "",
  saveError: "",
});
const editor = createPreferenceEditor({
  state,
  read: getClientPreferences,
  readCatalog: getPreferenceCatalog,
  readProfile: getClientProfile,
  write: updateClientPreferences,
  errorMessage: getApiErrorMessage,
});
const changePreference = async (field, value) => {
  if (await editor.select(field, value))
    successNotify("Preferências atualizadas.");
};
onMounted(editor.load);
onBeforeUnmount(editor.dispose);
</script>

<style scoped>
.dashsetup-layout {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px;
  border: 1px solid rgba(239, 239, 239, 0.16);
  border-radius: 8px;
  min-width: 0;
}
h2 {
  font-family: Inter, sans-serif;
  font-size: 24px;
  line-height: 1.5;
  font-weight: 700;
  margin: 0 0 -8px;
}
.preferences-feedback {
  font-size: 14px;
  line-height: 1.5;
}
.preferences-feedback:empty {
  display: none;
}
.preferences-error {
  margin: 0;
  color: #ffb4b4;
  overflow-wrap: anywhere;
}
@media (max-width: 599px) {
  .dashsetup-layout {
    padding: 20px;
  }
}
</style>
