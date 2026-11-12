<template>
  <q-page class="insight-page">
    <title-page
      :title="resource.state.data?.title || 'Comunicação'"
      subtitle="Comunicação / Comunicados S.A"
      :to-back="true"
    />
    <div
      v-if="resource.state.loading"
      class="q-pa-xl text-center"
      role="status"
    >
      <q-spinner color="primary" size="32px" /> Carregando comunicado
    </div>
    <div
      v-else-if="resource.state.error"
      class="tool q-ma-lg q-pa-lg"
      role="alert"
    >
      <p>{{ resource.state.error }}</p>
      <q-btn
        flat
        color="primary"
        no-caps
        label="Tentar novamente"
        @click="load"
      />
    </div>
    <template v-else-if="resource.state.data">
      <p class="published">
        {{ announcementDate(resource.state.data.publishedAtUtc) }}
      </p>
      <div class="announcement-detail">
        <article>
          <h2 v-if="resource.state.data.summary">
            {{ resource.state.data.summary }}
          </h2>
          <p class="body">{{ resource.state.data.body }}</p>
        </article>
        <aside class="tool q-pa-lg">
          <dl>
            <dt>Código</dt>
            <dd>{{ resource.state.data.publicCode }}</dd>
            <dt>Publicação</dt>
            <dd>{{ announcementDate(resource.state.data.publishedAtUtc) }}</dd>
          </dl>
        </aside>
      </div>
      <p v-if="resource.state.data.readError" role="alert" class="q-ma-lg">
        O comunicado abriu, mas não foi possível registrar a leitura.
        <q-btn flat dense no-caps label="Tentar novamente" @click="load" />
      </p>
    </template>
  </q-page>
</template>
<script setup>
import { watch, onScopeDispose } from "vue";
import { useRoute } from "vue-router";
import TitlePage from "src/system/components/TitlePage.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { financeGet, financeWrite } from "src/services/financeService";
import {
  captureClientSession,
  assertClientSessionCurrent,
} from "src/services/clientApi";
import {
  announcementDate,
  createAnnouncementsService,
} from "src/services/clientAnnouncements";
const route = useRoute(),
  resource = useFinanceResource(),
  session = captureClientSession();
const service = createAnnouncementsService({
  read: financeGet,
  write: financeWrite,
  assertCurrent: () => assertClientSessionCurrent(session),
});
let revision = 0,
  active = true;
function load() {
  const current = ++revision;
  const id = String(route.params.hash || "");
  return resource.load(() =>
    service.open(id, () => active && revision === current),
  );
}
watch(() => route.params.hash, load, { immediate: true });
onScopeDispose(() => {
  active = false;
  revision++;
  resource.reset();
});
</script>
<style scoped>
.published {
  margin: 0 48px 48px;
  color: #bdbdbd;
  font-size: 14px;
}
.announcement-detail {
  display: grid;
  grid-template-columns: minmax(0, 850px) 320px;
  gap: 64px;
  justify-content: center;
  margin: 24px 48px;
}
article {
  min-width: 0;
  overflow-wrap: anywhere;
}
h2 {
  font:
    700 20px/1.5 Inter,
    sans-serif;
  margin: 0 0 16px;
}
.body {
  white-space: pre-wrap;
  font:
    400 17px/1.5 Inter,
    sans-serif;
  color: #dcdcdc;
}
aside {
  align-self: start;
}
dl {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 16px;
  font-size: 14px;
  margin: 0;
}
dt {
  color: #bdbdbd;
}
dd {
  text-align: right;
  margin: 0;
  overflow-wrap: anywhere;
}
@media (max-width: 1023px) {
  .announcement-detail {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    margin: 24px 16px;
  }
  .published {
    margin: 0 16px 24px;
  }
}
</style>
