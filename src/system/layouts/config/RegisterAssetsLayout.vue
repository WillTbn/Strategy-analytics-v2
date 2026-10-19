<template>
  <div class="register-assets-layout">
    <q-card
      v-for="section in sections"
      :key="section.name"
      class="tool q-mb-lg"
    >
      <div class="row items-center q-gutter-sm text-weight-bold">
        <q-icon :name="section.icon" color="primary" size="24px" /><span>{{
          section.name
        }}</span>
      </div>
      <p class="text-grey q-mt-lg">Consulta de patrimônio indisponível.</p>
      <span
        ><q-btn flat no-caps icon="add" label="Adicionar" disable /><q-tooltip
          >O cadastro e a consulta de patrimônio do cliente ainda não estão
          disponíveis na API.</q-tooltip
        ></span
      >
    </q-card>
  </div>
</template>
<script setup>
const sections = [
  { name: "Imóveis", icon: "home" },
  { name: "Veículos", icon: "directions_car" },
  { name: "Investimentos", icon: "description" },
  { name: "Consórcio", icon: "savings" },
];
</script>
