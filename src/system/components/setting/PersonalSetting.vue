<template>
  <div class="personal-setting">
    <p class="text-weight-bold">Dados Básicos e Documentos</p>
    <profile-resource-state :resource="profile.summary" />
    <profile-fields
      v-if="profile.summary.state.value"
      :fields="profile.fields.value.summaryBasic"
      :columns="4"
    />
    <q-separator class="q-my-lg" />
    <p class="text-weight-bold">Localização</p>
    <profile-fields
      v-if="profile.summary.state.value"
      :fields="profile.fields.value.summaryLocation"
      :columns="3"
    />
    <q-separator class="q-my-lg" />
    <p class="text-weight-bold">Atividade Trabalhista</p>
    <profile-resource-state :resource="profile.professional" />
    <profile-resource-state :resource="profile.financial" />
    <profile-fields
      v-if="
        !profile.professional.state.loading &&
        !profile.financial.state.loading &&
        !profile.professional.state.error &&
        !profile.financial.state.error
      "
      :fields="profile.fields.value.summaryJob"
      :columns="3"
    />
  </div>
</template>
<script setup>
import ProfileFields from "./ProfileFields.vue";
import ProfileResourceState from "./ProfileResourceState.vue";
defineProps({ profile: { type: Object, required: true } });
</script>
