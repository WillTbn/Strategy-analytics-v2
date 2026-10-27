<template>
  <div class="AvatarMenu row items-center no-wrap">
    <q-btn
      round
      :to="{ name: 'config' }"
      class="profile-avatar-button"
      aria-label="Abrir Perfil Resumido"
      unelevated
    >
      <client-avatar class="avatar-custom" />
    </q-btn>
  </div>
</template>
<script setup>
import ClientAvatar from "src/system/components/setting/ClientAvatar.vue";
</script>
<style scoped>
.profile-avatar-button {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  padding: 0;
  border: 1px solid #00a3ff;
  border-radius: 50%;
  overflow: hidden;
}
.profile-avatar-button :deep(.client-avatar) {
  width: 38px;
  height: 38px;
}
.profile-avatar-button :deep(.q-focus-helper) {
  border-radius: 50%;
}
</style>
