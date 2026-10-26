<template>
  <q-avatar :size="size" class="client-avatar">
    <img
      v-if="url && !failed"
      :src="url"
      alt="Foto do perfil"
      @error="failed = true"
    />
    <q-icon v-else name="person" :size="iconSize" color="grey-5" />
  </q-avatar>
</template>
<script setup>
import { onScopeDispose, ref } from "vue";
import { getAvatarUrl } from "src/services/clientMediaService";
defineProps({
  size: { type: String, default: "40px" },
  iconSize: { type: String, default: "24px" },
});
const url = ref(""),
  failed = ref(false);
const emit = defineEmits(["loaded"]);
let active = true;
onScopeDispose(() => {
  active = false;
});
getAvatarUrl()
  .then((value) => {
    if (active) {
      url.value = value?.url || "";
      emit("loaded", url.value);
    }
  })
  .catch(() => {
    /* No avatar is a valid empty state. */
  });
</script>
<style scoped>
.client-avatar {
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}
.client-avatar img {
  object-fit: cover;
}
</style>
