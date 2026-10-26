<template>
  <div class="AvatarMenu row items-center no-wrap">
    <!-- <q-item clickable v-ripple :to="{ name: 'config' }"> -->
    <q-btn
      round
      :to="{ name: 'config' }"
      class="profile-avatar-button"
      aria-label="Abrir Perfil Resumido"
      unelevated
    >
      <client-avatar class="avatar-custom" />
    </q-btn>
    <q-btn
      round
      flat
      dense
      size="14px"
      color="white"
      icon="fa-solid fa-right-from-bracket"
      class="q-ml-sm"
      :loading="loading"
      @click.prevent="setLogout"
    >
      <q-tooltip>Sair</q-tooltip>
    </q-btn>
    <!-- </q-item> -->
    <!-- <q-menu
      fit
      anchor="bottom left"
      self="top middle"
      transition-show="scale"
      transition-hide="scale"
      class="tool text-weight-bold"
    >
      <q-item clickable v-ripple :to="{ name: 'config' }">
        <q-item-section class="text-white">Configurações</q-item-section>
        <q-item-section avatar>
          <q-icon color="white" name="fa-solid fa-gear" />
        </q-item-section>
      </q-item>
      <q-item clickable @click.prevent="setLogout">
        <q-item-section>Logout</q-item-section>
        <q-item-section avatar>
          <q-icon color="red" name="fa-solid fa-right-from-bracket" />
        </q-item-section>
      </q-item>
    </q-menu> -->
  </div>
</template>
<script>
import { defineComponent } from "vue";
import useAuth from "src/composables/system/useAuth";
import ClientAvatar from "src/system/components/setting/ClientAvatar.vue";

export default defineComponent({
  name: "AvatarMenu",
  components: { ClientAvatar },
  props: {
    avatar: { type: String },
  },
  setup() {
    const { setLogout, loading } = useAuth();

    return {
      setLogout,
      loading,
    };
  },
});
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
