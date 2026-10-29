<template>
  <q-header class="portal-header bg-transparent">
    <q-toolbar :class="nav" class="portal-navbar">
      <q-btn flat :to="{ name: 'inicio' }">
        <svg-logo />
      </q-btn>
      <q-space class="gt-sm" />
      <q-item
        v-for="list in clientNavList"
        :key="list"
        :disable="list.inative"
        v-ripple
        :to="list.toName"
        class="portal-nav-item"
        active-class="portal-nav-item--active"
        exact
        :aria-label="list.name"
      >
        <!-- :active-class="dark ? 'bg-dark' : 'bg-primary'" -->
        <component :is="list.icon" class="q-mr-lg-sm" />
        <!-- :class="{ 'text-white': !list.inative, 'text-grey-4': list.inative }" -->
        <q-item-section class="gt-md"> {{ list.name }}</q-item-section>
      </q-item>
      <q-space class="gt-sm" />
      <div class="portal-navbar-actions">
        <hours-banner
          v-if="navbar.clock"
          :compact="['config', 'profile'].includes($route.name)"
        />
        <options-icons :theme="navbar.theme" :adm="data.role_id !== 3" />
        <avatar-menu v-if="data.account" :avatar="data.account.avatar" />
      </div>
      <!-- {{ navbar.clock }} -->
    </q-toolbar>
    <drawer-theme />
  </q-header>
</template>

<script>
import { computed, defineComponent, ref } from "vue";
import { useUserStore } from "../../stores/user";
import { storeToRefs } from "pinia";
import { useStoreLayout } from "src/stores/layoutStore";

import SvgLogo from "../components/svgs/SvgLogo.vue";
// import SvgSign from "../components/svgs/SvgSign.vue";
import useCookies from "src/composables/useCookies";
import useMode from "../../composables/system/useMode";
import OptionsIcons from "../components/navbar/OptionsIcons.vue";
import HoursBanner from "../components/navbar/HoursBanner.vue";
import AvatarMenu from "../components/navbar/AvatarMenu.vue";
import DrawerTheme from "src/system/components/navbar/DrawerTheme.vue";
export default defineComponent({
  props: { dark: { type: Boolean, default: true } },
  name: "NavbarLayout",
  components: {
    SvgLogo,
    OptionsIcons,
    HoursBanner,
    AvatarMenu,
    DrawerTheme,
  },
  setup() {
    // const {setDarkMode} = useCookies()

    const { clientNavList } = useMode();
    const barState = computed(() =>
      drawer.value ? "fixed-top-right" : "fixed-top-left",
    );
    const jsonState = computed(() =>
      drawer.value
        ? {
            barstate: "fixed-top-right bar-xmark",
            icon: "fa-solid fa-xmark",
          }
        : { barstate: "fixed-top-left barstate", icon: "fa-solid fa-bars" },
    );
    const leftDrawerOpen = ref(true);
    const drawer = ref(true);
    const miniState = ref(true);
    const storeLayout = useStoreLayout();
    const userStore = useUserStore();
    const { data, canAccess, menuAccess } = storeToRefs(userStore);
    const { navbar, system } = storeToRefs(storeLayout);
    const nav = computed(() => {
      return `${system.value.theme}-navbar`;
    });
    return {
      menuAccess,
      canAccess,
      clientNavList,
      navbar,
      jsonState,
      barState,
      miniState,
      drawer,
      leftDrawerOpen,
      data,
      activeMode: useCookies().toggleMod,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
      nav,
    };
  },
  // Outras configurações do componente aqui
});
</script>

<style scoped>
.portal-header {
  padding: 24px 24px 0;
}
.portal-nav-item {
  color: #666666;
  font-size: 20px;
  font-weight: 500;
  border-radius: 4px;
  border-bottom: 3px solid transparent;
}
.portal-nav-item > :deep(svg) {
  color: #fff;
}
.portal-nav-item--active {
  color: #fff;
  border-bottom-color: #00a3ff;
  background: linear-gradient(
    190.35deg,
    rgba(255, 255, 255, 0.16),
    rgba(255, 255, 255, 0.04) 50%,
    rgba(255, 255, 255, 0.01)
  );
}
.portal-navbar {
  height: 80px;
  min-height: 80px;
  padding: 16px 24px;
  gap: 16px;
  border-radius: 8px;
  overflow: visible;
}
.portal-navbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}
.portal-navbar-actions :deep(.OptionsIcons) {
  margin: 0;
}
.control-text {
  text-overflow: ellipsis;
  overflow: hidden;
}
.bg-personal {
  background: linear-gradient(#00000033, #0038584d, #0077ba6b, #00a3ff80);
}
.move-position {
  transform: translateX(480%) !important;
}
.control-area {
  height: calc(100% - 150px);
  margin-top: 150px;
  border-right: 1px solid #ddd;
  overflow: hidden !important;
}
.fit {
  overflow: hidden !important;
}

.rounded {
  border-radius: 13px;
}
@media (max-width: 599px) {
  .portal-header {
    padding: 16px 16px 0;
  }
  .portal-navbar {
    height: 80px;
    min-height: 80px;
    padding: 16px 24px;
    gap: 16px;
    border-radius: 8px;
    flex-wrap: wrap;
    justify-content: center;
    height: auto;
    gap: 8px;
    padding: 12px 8px;
  }
  .portal-navbar > .q-btn:first-child {
    flex-basis: 100%;
  }
}
</style>

<!-- width: 179;
height: 51;
gap: 8px;
angle: 0 deg;
opacity: 1;
border-radius: 4px;
padding: 12px;
border-width: 1px; -->
