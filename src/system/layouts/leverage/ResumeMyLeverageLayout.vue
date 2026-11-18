<template>
  <div class="resume-my-leverage-layout">
    <resource-state :state="resource.state" @retry="load"
      ><card-overview-layout
        title="Suas Alavancagens"
        :btnLink="false"
        class="loan-section"
        classAdd=""
      >
        <q-tabs
          v-model="leverage"
          class="col-12"
          active-color="white"
          inline-label
          align="left"
        >
          <q-tab
            v-for="(item, index) in alavaragensTypes"
            :key="index"
            no-caps
            :name="item.value"
          >
            {{ item.title }}
          </q-tab>
        </q-tabs>

        <q-tab-panels v-model="leverage" class="bg-transparent col-12">
          <q-tab-panel
            v-for="(item, index) in alavaragensTypes"
            :key="index"
            :name="item.value"
          >
            <component :is="componentsMaps[item.component]" />
          </q-tab-panel>
        </q-tab-panels> </card-overview-layout
    ></resource-state>
  </div>
</template>

<script setup>
import ResourceState from "src/system/components/finance/ResourceState.vue";
import { useClientLoans } from "src/composables/system/useClientLoans";
import { defineComponent, ref } from "vue";
import CardOverviewLayout from "../CardOverviewLayout.vue";
import SimulationYourLeverages from "src/system/layouts/leverage/yourLeverages/SimulationYourLeverages.vue";
import ActiveYourLeverages from "src/system/layouts/leverage/yourLeverages/ActiveYourLeverages.vue";
import PaidOffYourLeverages from "src/system/layouts/leverage/yourLeverages/PaidOffYourLeverages.vue";
defineComponent({
  name: "ResumeMyLeverageLayout",
});
const { resource, load } = useClientLoans();
const componentsMaps = {
  SimulationYourLeverages,
  ActiveYourLeverages,
  PaidOffYourLeverages,
};

const leverage = ref("actives");
const alavaragensTypes = [
  { title: "Ativas", value: "actives", component: "ActiveYourLeverages" },
  {
    title: "Em Simulação",
    value: "simulation",
    component: "SimulationYourLeverages",
  },
  { title: "Quitadas", value: "quitada", component: "PaidOffYourLeverages" },
];
</script>

<style scoped>
.loan-section {
  padding: 24px;
  border: 1px solid #efefef29;
  border-radius: 4px;
  box-shadow: 4px 4px 12px #0000003d;
  background: linear-gradient(183deg, #0000003d, #00000014 51%, #0000000a);
  backdrop-filter: blur(20px);
}
.loan-section :deep(h2) {
  margin: 0 0 24px;
  font:
    700 24px/1.5 Inter,
    sans-serif;
}
.loan-section :deep(.q-tab__focus-helper) {
  display: none;
}
.loan-section :deep(.q-tab:focus-visible) {
  outline: 2px solid #75cfff;
  outline-offset: -4px;
}
.loan-section :deep(.q-tabs) {
  margin-bottom: 24px;
}
.loan-section :deep(.q-tab) {
  text-transform: none;
  min-height: 48px;
  color: #989898;
  padding: 12px 24px;
}
.loan-section :deep(.q-tab--active) {
  color: white;
}
.loan-section :deep(.q-tab-panels) {
  width: 100%;
}
@media (max-width: 600px) {
  .loan-section {
    padding: 16px;
  }
  .loan-section :deep(.q-tab) {
    padding: 12px;
  }
}

.q-tab-panel {
  padding: 0 !important;
}
</style>
