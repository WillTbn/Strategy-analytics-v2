<template>
  <q-header
    class="portal-header bg-transparent"
    :class="{ 'portal-header--designed': presentation }"
  >
    <q-toolbar :class="nav" class="portal-navbar">
      <q-btn flat :to="{ name: 'inicio' }" aria-label="Página inicial">
        <span v-if="presentation?.brand" class="portal-brand"
          ><span
            class="portal-brand-art"
            :style="{
              maskImage: presentation.brandMask
                ? 'url(' + presentation.brandMask + ')'
                : undefined,
            }"
            ><img
              :src="presentation.brand"
              alt="Strategy Analytics" /></span></span
        ><svg-logo v-else />
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
        <img
          v-if="presentation?.icons?.[list.icon]"
          :src="presentation.icons[list.icon]"
          class="portal-native-icon"
          alt=""
        /><component v-else :is="list.icon" class="q-mr-lg-sm" />
        <!-- :class="{ 'text-white': !list.inative, 'text-grey-4': list.inative }" -->
        <q-item-section class="gt-md"> {{ list.name }}</q-item-section>
      </q-item>
      <q-space class="gt-sm" />
      <div class="portal-navbar-actions">
        <hours-banner v-if="navbar.clock" />
        <span
          v-if="presentation?.bell"
          class="portal-native-bell"
          aria-hidden="true"
          ><img :src="presentation.bell" alt="" /></span
        ><options-icons
          v-else
          :theme="navbar.theme"
          :adm="data.role_id !== 3"
        />
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
  props: {
    dark: { type: Boolean, default: true },
    presentation: { type: Object, default: null },
  },
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
  padding: 24px 48px 0;
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
.portal-navbar.bg-theme-3-navbar {
  background: linear-gradient(
    181.1deg,
    rgba(255, 255, 255, 0.16),
    rgba(255, 255, 255, 0.04) 50%,
    rgba(255, 255, 255, 0.01)
  );
  backdrop-filter: blur(32px);
  box-shadow: 4px 4px 48px 16px rgba(0, 0, 0, 0.24);
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
.portal-header--designed {
  padding-bottom: 16px;
}
.portal-header--designed .portal-navbar {
  height: auto;
  min-height: 91px;
  gap: 16px;
  background: linear-gradient(181.21deg, #ffffff29, #ffffff0a 50%, #ffffff03);
  backdrop-filter: blur(16px);
  box-shadow: 4px 4px 48px 16px #0000003d;
}
.portal-header--designed .portal-navbar > .q-btn:first-child {
  width: 234px;
  flex: none;
  padding: 0;
}
.portal-header--designed
  .portal-navbar
  > .q-btn:first-child
  :deep(.q-btn__content) {
  justify-content: flex-start;
}
.portal-brand {
  width: 152px;
  height: 48px;
  display: block;
  position: relative;
  overflow: hidden;
}
.portal-brand-art {
  position: absolute;
  top: 15.86%;
  left: 0.01%;
  width: 152px;
  height: 32.7728px;
  mask-size: 152px 32.7728px;
  mask-repeat: no-repeat;
}
.portal-brand-art img {
  display: block;
  width: auto;
  height: auto;
  max-width: none;
}
.portal-native-bell {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.portal-native-bell img {
  width: auto;
  height: auto;
  max-width: none;
  align-self: center;
}
.portal-native-icon {
  align-self: center;
  width: auto;
  height: auto;
  max-width: none;
  flex: none;
  margin-right: 8px;
}
.portal-header--designed .portal-nav-item {
  height: 51px;
  min-height: 51px;
  padding: 12px;
  line-height: 27px;
  border: 0;
  color: #989898;
}
.portal-header--designed .portal-nav-item--active {
  height: 59px;
  min-height: 59px;
  padding: 16px 12px;
  color: white;
  box-shadow: inset 0 -3px #00a3ff;
}
@media (max-width: 599px) {
  .portal-header--designed .portal-navbar > .q-btn:first-child {
    width: 100%;
    flex-basis: 100%;
  }
  .portal-header--designed
    .portal-navbar
    > .q-btn:first-child
    :deep(.q-btn__content) {
    justify-content: center;
  }

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
