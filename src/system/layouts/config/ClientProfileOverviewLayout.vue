<template>
  <div class="client-profile-overview">
    <q-banner v-if="loadError" rounded class="bg-red-9 text-white q-mb-md">
      {{ loadError }}
      <template #action><q-btn flat color="white" label="Tentar novamente" @click="load" /></template>
    </q-banner>
    <div v-if="loading" class="row justify-center q-pa-xl"><q-spinner color="primary" size="38px" /></div>
    <template v-else-if="!loadError">
      <q-card class="tool profile-summary">
        <q-card-section class="row items-center q-col-gutter-md">
          <div class="col-auto"><q-avatar color="primary" text-color="white" size="56px" icon="person" /></div>
          <div class="col">
            <div class="text-h6 text-weight-bold">{{ displayName }}</div>
            <div class="text-caption text-grey-5">{{ primaryContact }}</div>
          </div>
          <div class="col-auto"><q-badge outline color="primary" :label="summary?.status || 'Status não informado'" /></div>
        </q-card-section>
      </q-card>

      <q-card class="tool q-mt-lg">
        <q-card-section class="row items-center justify-between">
          <div><div class="text-subtitle1 text-weight-bold">Dados pessoais</div><div class="text-caption text-grey-5">Informações cadastrais que você pode manter atualizadas.</div></div>
          <q-btn v-if="!editing" flat dense color="primary" icon="edit" label="Editar" no-caps @click="editing = true" />
        </q-card-section>
        <q-separator dark />
        <q-card-section>
          <q-form ref="profileForm" @submit.prevent="saveProfile">
            <div class="row q-col-gutter-md">
              <label-form class-name="col-12 col-md-4" text-label="Data de nascimento"><q-input v-model="profileFields.birthDate" type="date" outlined dense dark :readonly="!editing" /></label-form>
              <label-form v-for="field in personalFields" :key="field.key" class-name="col-12 col-md-4" :text-label="field.label"><q-input v-model.trim="profileFields.personalDetails[field.key]" outlined dense dark :readonly="!editing" /></label-form>
            </div>
            <div v-if="editing" class="row justify-end q-gutter-sm q-mt-md">
              <q-btn flat dense label="Descartar" no-caps @click="resetProfile" />
              <q-btn type="submit" flat dense color="primary" icon="save" label="Salvar dados" no-caps :loading="savingProfile" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>

      <q-card class="tool q-mt-lg">
        <q-card-section><div class="text-subtitle1 text-weight-bold">Preferências</div><div class="text-caption text-grey-5">Idioma, moeda, fuso horário e aparência do portal.</div></q-card-section>
        <q-separator dark />
        <q-card-section>
          <div class="row q-col-gutter-md">
            <label-form class-name="col-12 col-md-4" text-label="Moeda principal"><q-select v-model="preferences.primaryCurrencyCode" :options="currencyOptions" emit-value map-options outlined dense dark /></label-form>
            <label-form class-name="col-12 col-md-4" text-label="Moeda secundária"><q-select v-model="preferences.secondaryCurrencyCode" :options="currencyOptions" emit-value map-options clearable outlined dense dark /></label-form>
            <label-form class-name="col-12 col-md-4" text-label="Idioma"><q-select v-model="preferences.languageCode" :options="languageOptions" emit-value map-options outlined dense dark /></label-form>
            <label-form class-name="col-12 col-md-4" text-label="Fuso horário"><q-select v-model="preferences.timeZoneId" :options="timeZoneOptions" emit-value map-options outlined dense dark /></label-form>
            <label-form class-name="col-12 col-md-4" text-label="Tema"><q-select v-model="preferences.theme" :options="themeOptions" emit-value map-options outlined dense dark /></label-form>
          </div>
          <div class="row justify-end q-mt-md"><q-btn flat dense color="primary" icon="save" label="Salvar preferências" no-caps :loading="savingPreferences" @click="savePreferences" /></div>
        </q-card-section>
      </q-card>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import LabelForm from "src/system/components/form/LabelForm.vue";
import useNotify from "src/composables/useNotify";
import { getApiErrorMessage } from "src/services/clientAuthService";
import { getClientPreferences, getClientProfile, getClientProfileSummary, getPreferenceCatalog, updateClientPreferences, updateClientProfile } from "src/services/clientProfileService";

const { successNotify, errorNotify } = useNotify();
const loading = ref(true), loadError = ref(""), editing = ref(false), savingProfile = ref(false), savingPreferences = ref(false);
const summary = ref(null), profile = ref(null), catalog = ref({}), profileForm = ref(null);
const profileFields = reactive({ birthDate: null, personalDetails: {} });
const preferences = reactive({ primaryCurrencyCode: null, secondaryCurrencyCode: null, languageCode: "", timeZoneId: "", theme: "" });
const personalFields = [
  { key: "gender", label: "Gênero" }, { key: "maritalStatus", label: "Estado civil" }, { key: "nationality", label: "Nacionalidade" },
  { key: "birthCity", label: "Cidade natal" }, { key: "birthState", label: "Estado natal" }, { key: "motherName", label: "Nome da mãe" }, { key: "fatherName", label: "Nome do pai" },
];
const displayName = computed(() => summary.value?.displayName || summary.value?.primaryName || profile.value?.names?.find((item) => item.isPrimary)?.displayName || "Meu perfil");
const primaryContact = computed(() => summary.value?.primaryContact || profile.value?.contacts?.find((item) => item.isPrimary)?.value || "Contato não informado");
const toOptions = (items = [], valueKeys = ["code", "id", "value"], labelKeys = ["displayName", "name", "label"]) => items.map((item) => typeof item === "string" ? { label: item, value: item } : ({ value: valueKeys.map((key) => item?.[key]).find(Boolean), label: labelKeys.map((key) => item?.[key]).find(Boolean) || valueKeys.map((key) => item?.[key]).find(Boolean) })).filter((item) => item.value);
const currencyOptions = computed(() => toOptions(catalog.value.currencies));
const languageOptions = computed(() => toOptions(catalog.value.languages, ["code", "languageCode", "value"]));
const timeZoneOptions = computed(() => toOptions(catalog.value.timeZones || catalog.value.timezones, ["id", "timeZoneId", "value"]));
const themeOptions = computed(() => toOptions(catalog.value.themes, ["value", "code", "id"]));
const fillProfile = () => { profileFields.birthDate = profile.value?.birthDate?.slice(0, 10) || null; profileFields.personalDetails = { ...profile.value?.personalDetails }; };
const resetProfile = () => { fillProfile(); editing.value = false; profileForm.value?.resetValidation(); };
const load = async () => {
  loading.value = true; loadError.value = "";
  try {
    const [summaryData, profileData, preferenceData, catalogData] = await Promise.all([getClientProfileSummary(), getClientProfile(), getClientPreferences(), getPreferenceCatalog()]);
    summary.value = summaryData || {}; profile.value = profileData || {}; catalog.value = catalogData || {}; fillProfile();
    Object.assign(preferences, { primaryCurrencyCode: preferenceData?.primaryCurrencyCode ?? null, secondaryCurrencyCode: preferenceData?.secondaryCurrencyCode ?? null, languageCode: preferenceData?.languageCode ?? "", timeZoneId: preferenceData?.timeZoneId ?? "", theme: preferenceData?.theme ?? "" });
  } catch (error) { loadError.value = getApiErrorMessage(error, "Não foi possível carregar seu perfil."); }
  finally { loading.value = false; }
};
const saveProfile = async () => {
  try {
    savingProfile.value = true;
    await updateClientProfile({ birthDate: profileFields.birthDate || null, names: profile.value?.names ?? [], contacts: profile.value?.contacts ?? [], addresses: profile.value?.addresses ?? [], personalDetails: { ...profileFields.personalDetails } });
    profile.value = await getClientProfile();
    fillProfile(); editing.value = false; successNotify("Dados pessoais atualizados.");
  } catch (error) { errorNotify(getApiErrorMessage(error, "Não foi possível salvar seus dados.")); }
  finally { savingProfile.value = false; }
};
const savePreferences = async () => {
  try { savingPreferences.value = true; await updateClientPreferences({ ...preferences }); successNotify("Preferências atualizadas."); }
  catch (error) { errorNotify(getApiErrorMessage(error, "Não foi possível salvar suas preferências.")); }
  finally { savingPreferences.value = false; }
};

load();
</script>

<style scoped>
.client-profile-overview { max-width: 1180px; margin: 0 auto; }
.profile-summary { border-left: 3px solid var(--q-primary); }
</style>
