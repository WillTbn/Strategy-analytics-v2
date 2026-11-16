<template>
  <div class="resume-my-leverage-layout">
    <resource-state :state="resource.state" @retry="load"
      ><card-overview-layout
        title="Suas Alavancagens"
        :btnLink="false"
        classAdd="q-px-md q-mt-md q-pb-md q-gutter-sm"
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

        <q-tab-panels v-model="leverage" animated class="bg-transparent col-12">
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
  {
    title: "Em análise",
    value: "simulation",
    component: "SimulationYourLeverages",
  },
  { title: "Ativas", value: "actives", component: "ActiveYourLeverages" },
  { title: "Quitados", value: "quitada", component: "PaidOffYourLeverages" },
];
</script>

<style scoped>
.q-tab-panel {
  padding: 0 !important;
}
</style>
