<template>
  <q-page class="leverage-page">
    <title-page title="Alavancagem" subtitle="Alavancagem">
      <template #append>
        <q-btn
          label="Ver Minhas Alavancagens"
          no-caps
          color="primary"
          size="sm"
          :to="{ name: 'Minhas Alavacagens' }"
        />
      </template>
    </title-page>

    <leverage-catalogue />
  </q-page>
</template>

<script setup>
import TitlePage from "src/system/components/TitlePage.vue";
import LeverageCatalogue from "src/system/components/leverage/LeverageCatalogue.vue";
</script>

<style scoped>
/* Estilos específicos do componente aqui */
.block-icon {
  width: 30rem;
  height: 15rem;
}
.control-card-block {
  gap: 32px;
  opacity: 1;
}
</style>

<style scoped>
.leverage-page :deep(.title-page-heading) {
  font-family: Inter, sans-serif;
  font-size: 41px;
  line-height: 1.5;
}
</style>
