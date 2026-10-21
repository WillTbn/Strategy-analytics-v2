<template>
  <div class="bg-simulator text-white row justify-center q-pa-xl public-page">
    <q-card class="tool public-profile"
      ><q-card-section
        ><div class="text-h5 text-weight-bold">Perfil compartilhado</div>
        <div class="text-caption text-grey-5">
          Somente informações autorizadas pelo titular.
        </div></q-card-section
      ><q-separator dark /><q-card-section
        v-if="loading"
        class="row justify-center q-pa-xl"
        ><q-spinner color="primary" size="38px" /></q-card-section
      ><q-banner v-else-if="error" class="bg-red-9 text-white">{{
        error
      }}</q-banner
      ><q-card-section v-else
        ><q-avatar
          v-if="profile.avatarUrl && !avatarFailed"
          size="64px"
          class="q-mb-md"
          ><img
            :src="profile.avatarUrl"
            alt="Foto do perfil"
            @error="avatarFailed = true"
        /></q-avatar>
        <div class="text-h6">
          {{ profile.displayName || profile.primaryName || "Perfil" }}
        </div>
        <q-list v-if="fields.length" dark separator class="q-mt-md"
          ><q-item v-for="item in fields" :key="item.label"
            ><q-item-section
              ><q-item-label caption class="text-grey-5">{{
                item.label
              }}</q-item-label
              ><q-item-label>{{ item.value }}</q-item-label></q-item-section
            ></q-item
          ></q-list
        >
        <div v-else class="text-caption text-grey-5 q-mt-md">
          Nenhuma informação adicional foi compartilhada.
        </div></q-card-section
      ></q-card
    >
  </div>
</template>
<script setup>
import { publicProfileFields } from "src/services/profileShare";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { getPublicProfile } from "src/services/clientMediaService";
import { getApiErrorMessage } from "src/services/clientAuthService";
const route = useRoute(),
  loading = ref(true),
  error = ref(""),
  profile = ref({}),
  avatarFailed = ref(false);
const fields = computed(() => publicProfileFields(profile.value));
let revision = 0;
const load = async (token) => {
  const current = ++revision;
  loading.value = true;
  error.value = "";
  profile.value = {};
  avatarFailed.value = false;
  try {
    const result = await getPublicProfile(token);
    if (current === revision) profile.value = result;
  } catch (e) {
    if (current !== revision) return;
    error.value =
      e?.response?.status === 404
        ? "Este link é inválido, expirou ou foi revogado."
        : getApiErrorMessage(
            e,
            "Não foi possível abrir o perfil compartilhado.",
          );
  } finally {
    if (current === revision) loading.value = false;
  }
};
watch(() => route.params.token, load, { immediate: true });
</script>
<style scoped>
.public-page {
  min-height: 100vh;
}
.public-profile {
  width: min(720px, 100%);
  align-self: flex-start;
}
</style>
