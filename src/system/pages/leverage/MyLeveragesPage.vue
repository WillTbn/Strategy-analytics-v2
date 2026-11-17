<template>
  <q-page class="my-levereges-page">
    <title-page
      :toBack="true"
      title="Minhas Alavancagens"
      :breadcrumbs="[
        { label: 'Alavancagem' },
        { label: 'Minhas Alavancagens' },
      ]"
    />
    <div class="my-leverages-sections">
      <over-view-leverage-layout /><resume-my-leverage-layout />
    </div>
  </q-page>
</template>

<script setup>
import { provideClientLoans } from "src/composables/system/useClientLoans";
import { defineComponent } from "vue";
import TitlePage from "src/system/components/TitlePage.vue";
import OverViewLeverageLayout from "src/system/layouts/leverage/OverViewLeverageLayout.vue";
import ResumeMyLeverageLayout from "src/system/layouts/leverage/ResumeMyLeverageLayout.vue";
defineComponent({
  name: "MyLeveragesPage",
});
provideClientLoans();
</script>

<style scoped>
.my-leverages-sections {
  display: grid;
  gap: 48px;
  padding: 24px 48px 48px;
  min-width: 0;
}
.my-levereges-page {
  font-family: Inter, sans-serif;
  color: white;
}
@media (max-width: 700px) {
  .my-leverages-sections {
    padding: 16px;
    gap: 24px;
  }
}
</style>
