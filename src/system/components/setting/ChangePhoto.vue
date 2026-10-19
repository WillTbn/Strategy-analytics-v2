<template>
  <div class="change-photo tool">
    <p class="text-weight-bolder text-h6">Perfil Resumido</p>
    <profile-resource-state :resource="resource" />
    <q-card
      v-if="resource.state.value"
      class="change-photo-card"
      :class="`${themeSystem}-photo-card`"
      flat
    >
      <div class="profile-bio">
        <client-avatar size="132px" icon-size="72px" />
        <div class="bio-info">
          <div class="row items-center q-gutter-sm">
            <span class="text-grey strategy-id"
              >ID Strategy:
              {{ resource.state.value.customerId || "Não informado" }}</span
            >
            <q-badge
              v-if="resource.state.value.documentLevel != null"
              outline
              color="primary"
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
          <q-btn no-caps outline disable
            ><IconShare :size="20" class="q-mr-xs" />Compartilhar Perfil</q-btn
          >
          <q-tooltip
            >Compartilhamento do perfil aguarda a definição do fluxo.</q-tooltip
          >
        </span>
      </div>
    </q-card>
  </div>
</template>
<script setup>
import { IconCalendar, IconShare } from "@tabler/icons-vue";
import { profileDate } from "src/services/profilePresentation";
import ProfileResourceState from "./ProfileResourceState.vue";
import ClientAvatar from "./ClientAvatar.vue";
defineProps({
  resource: { type: Object, required: true },
  themeSystem: { type: String, default: "" },
});
</script>
<style scoped>
.profile-bio {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  flex-wrap: wrap;
}
.bio-info {
  flex: 1;
  min-width: 0;
}
.strategy-id {
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
