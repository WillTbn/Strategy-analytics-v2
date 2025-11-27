<template>
  <div class="AvatarMenu row items-center">
    <div class="col">
      <!-- Avatar que leva às configurações -->
      <q-btn round :to="{ name: 'config' }">
        <q-avatar class="q-my-sm avatar-custom">
          <template v-if="avatar && avatar.length">
            <img :src="$filters.resolveStorageUrl(avatar)" />
          </template>
          <template v-else>
            <div class="avatar-initials">{{ initials }}</div>
          </template>
        </q-avatar>
      </q-btn>
    </div>
    <div class="col">
      <!-- Botão de logout visível -->
      <q-btn
        flat
        dense
        color="white"
        class="q-ml-lg"
        @click.prevent="handleLogout"
        title="Sair do sistema"
        size="sm"
      >
        <IconLogout />
      </q-btn>
    </div>
  </div>
</template>
<script>
import { defineComponent, computed } from "vue";
import useClientAuth from "src/composables/system/useClientAuth";
import { useUserStore } from "src/stores/user";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "AvatarMenu",
  props: {
    avatar: { type: String, default: '' },
  },
  setup(props) {
    const { logout } = useClientAuth();

    const userStore = useUserStore();
    const initials = computed(() => {
      // if avatar provided, no initials needed
      if (props.avatar) return "";
      try {
        const name =
          userStore.data?.name || userStore.data?.cliente?.name || "";
        if (!name) return "";
        const parts = name.trim().split(/\s+/);
        const first = parts[0] ? parts[0].charAt(0) : "";
        const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
        return (first + last).toUpperCase();
      } catch (e) {
        return "";
      }
    });

    const router = useRouter();
    const handleLogout = () => {
      // chama logout do composable de cliente e retorna à página inicial
      console.log("AvatarMenu.handleLogout - clicado");
      try {
        logout();
        console.log("AvatarMenu.handleLogout - logout() chamado");
      } catch (e) {
        console.error("AvatarMenu.handleLogout - Erro no logout:", e);
        // fallback simples: redirecionar para home
        try {
          router.replace({ path: "/" });
        } catch (err) {
          try {
            window.location.replace("/");
          } catch (err2) {
            window.location.href = "/";
          }
        }
      }
    };

    return {
      handleLogout,
      initials,
    };
  },
});
</script>
<style lang="sass">
.avatar-custom>.q-avatar__content>img
  border: 2px solid #ddd

.avatar-initials
  width: 100%
  height: 100%
  display: flex
  align-items: center
  justify-content: center
  font-weight: 700
  color: #ffffff
  background: #2a9df4
  border-radius: 50%
  font-size: 1rem
</style>
