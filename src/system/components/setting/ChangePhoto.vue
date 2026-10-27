<template>
  <div class="change-photo tool">
    <div class="profile-heading">
      <h1>Perfil Resumido</h1>
      <q-btn
        outline
        no-caps
        class="profile-signout"
        :loading="loading"
        @click="setLogout"
      >
        <img src="/system/profile-edit/log-out.svg" alt="" />Sair da conta
      </q-btn>
    </div>
    <profile-resource-state :resource="resource" />
    <q-card
      v-if="resource.state.value"
      class="change-photo-card"
      :class="`${themeSystem}-photo-card`"
      flat
    >
      <div class="profile-bio">
        <client-avatar
          size="132px"
          icon-size="72px"
          @loaded="avatarUrl = $event"
        />
        <div class="bio-info">
          <div class="profile-identity">
            <span class="strategy-id"
              >ID Strategy:
              {{
                resource.state.value.customerId
                  ? "#" +
                    String(resource.state.value.customerId).replace(/^#/, "")
                  : "Não informado"
              }}</span
            >
            <q-badge
              v-if="resource.state.value.documentLevel != null"
              outline
              color="primary"
              class="profile-level"
              >Nível {{ resource.state.value.documentLevel }}</q-badge
            >
          </div>
          <div class="profile-name text-weight-bold">
            {{ resource.state.value.displayName || "Não informado" }}
          </div>
          <div class="row items-center">
            <IconCalendar class="q-mr-sm text-grey" :size="24" />
            <span class="text-grey q-mr-sm">Cliente desde:</span>
            <b>{{ profileDate(resource.state.value.customerSinceUtc) }}</b>
          </div>
        </div>
        <span class="share-control">
          <q-btn no-caps outline @click="shareOpen = true"
            ><IconShare :size="20" class="q-mr-xs" />Compartilhar Perfil</q-btn
          >
        </span>
      </div>
    </q-card>
    <profile-share-dialog
      v-if="resource.state.value"
      v-model="shareOpen"
      :profile="resource.state.value"
      :share-data="shareData"
      :avatar-url="avatarUrl"
    />
  </div>
</template>
<script setup>
import { IconCalendar, IconShare } from "@tabler/icons-vue";
import { ref } from "vue";
import useAuth from "src/composables/system/useAuth";
const { setLogout, loading } = useAuth();
import ProfileShareDialog from "./ProfileShareDialog.vue";
const shareOpen = ref(false);
const avatarUrl = ref("");
import { profileDate } from "src/services/profilePresentation";
import ProfileResourceState from "./ProfileResourceState.vue";
import ClientAvatar from "./ClientAvatar.vue";
defineProps({
  resource: { type: Object, required: true },
  themeSystem: { type: String, default: "" },
  shareData: { type: Object, default: null },
});
</script>
<style scoped>
.profile-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}
.profile-heading h1 {
  font-size: 24px;
  line-height: 1.5;
  font-weight: 700;
  margin: 0;
}
.profile-signout {
  height: 40px;
  min-height: 40px;
  flex-shrink: 0;
  border-radius: 4px;
  color: #dcdcdc;
  padding: 8px 12px;
  font-size: 14px;
}
.profile-signout :deep(.q-btn__content) {
  gap: 8px;
}
.profile-signout img {
  display: block;
}
@media (max-width: 400px) {
  .profile-heading {
    gap: 8px;
  }
  .profile-heading h1 {
    font-size: 18px;
  }
  .profile-signout {
    padding: 8px;
  }
}

.change-photo-card {
  border: 1px solid rgba(240, 240, 240, 0.16);
  backdrop-filter: blur(40px);
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.13);
}
.change-photo-card.bg-simulator-photo-card {
  background: linear-gradient(
    190.38deg,
    rgba(121, 24, 35, 0.4) 0.17%,
    rgba(51, 10, 15, 0.4) 9.09%,
    rgba(9, 12, 21, 0.4) 39.13%,
    rgba(9, 41, 62, 0.4) 73.45%,
    rgba(17, 77, 118, 0.4) 99.83%
  );
}
.change-photo-card.bg-theme-2-photo-card {
  background: linear-gradient(
    198.7deg,
    rgba(70, 70, 70, 0.4) 2.68%,
    rgba(51, 51, 51, 0.4) 40.11%,
    rgba(0, 0, 0, 0.4) 99.45%
  );
}
.change-photo-card.bg-theme-3-photo-card {
  background: linear-gradient(
    198.7deg,
    rgba(12, 7, 18, 0.4) 3.51%,
    rgba(29, 36, 63, 0.4) 50.48%,
    rgba(57, 80, 109, 0.4) 69.5%,
    rgba(117, 83, 100, 0.4) 82.81%,
    rgba(57, 80, 109, 0.4) 99.45%
  );
}
.profile-level {
  width: 62px;
  flex: 0 0 62px;
  height: 27px;
  justify-content: center;
  border: 1px solid #00a3ff;
  border-radius: 4px;
  color: #fff !important;
  font-size: 14px;
  font-weight: 500;
  background: linear-gradient(
    190deg,
    rgba(255, 255, 255, 0.16),
    rgba(255, 255, 255, 0.04) 50%,
    rgba(255, 255, 255, 0.01)
  );
}
.profile-bio {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  flex-wrap: wrap;
}
.bio-info {
  flex: 1 1 230px;
  min-width: 0;
}
.profile-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}
.strategy-id {
  color: #989898;
  font-weight: 400;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.profile-name {
  font-size: 29px;
  line-height: 1.5;
  margin: 12px 0 24px;
  overflow-wrap: anywhere;
}
.share-control {
  align-self: flex-end;
  margin-left: auto;
}
@media (max-width: 600px) {
  .profile-bio {
    padding: 16px;
  }
  .bio-info {
    flex-basis: 100%;
  }
  .profile-name {
    font-size: 24px;
  }
}
</style>
