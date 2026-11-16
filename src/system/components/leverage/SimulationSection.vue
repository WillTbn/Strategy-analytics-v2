<template>
  <div class="simulation-section bg-transparent q-mb-lg">
    <div class="row justify-between">
      <div
        class="col-8 row justify-between"
        style="align-content: space-between"
      >
        <div class="col-12 row items-center">
          <q-avatar size="32px" flat>
            <component :is="icon" />
          </q-avatar>
          <span class="text-h6 q-ml-xs" style="vertical-align: middle">
            {{ title }}
          </span>
          <div class="simulation-status text-inter-14-400 q-ml-sm">
            {{ typeDescription }}
          </div>
        </div>
        <div
          class="col-5 q-pl-sm simulation-status-description text-inter-17-400"
        >
          <span style="color: #dcdcdc" class="">Status do Processo</span>
          <p>
            <span class="text-primary text-inter-17-700">
              {{ status }}
            </span>
            <template v-if="totalSteps">de {{ totalSteps }} etapas</template>
          </p>
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          :to="link"
          outline
          no-caps
          style="border-color: red !important"
          color="primary"
        >
          <span class="text-white">Ver Empréstimo</span>
          <IconExternalLink width="24" height="24" class="q-ml-sm text-white" />
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { is } from "quasar";
import { defineComponent } from "vue";

defineComponent({
  name: "SimulationSection",
});
defineProps({
  title: { type: String },
  currentBalance: { type: Number, default: null },
  currentEntry: { type: Number, default: null },
  profitDistributionBalance: { type: Number, default: null },
  distributionDate: { type: String },
  icon: { type: String, default: "IconFileDollar" },
  status: { type: String },
  totalSteps: Number,
  typeDescription: String,
  link: { type: [String, Object] },
  isActive: Boolean,
});
const emit = defineEmits(["select"]);
// Seu código aqui
</script>

<style scoped lang="sass">
.simulation-section
  width: 1754
  gap: 24px
  angle: 0 deg
  border-radius: 8px
  padding: 16px
  background: linear-gradient(202.99deg, rgba(0, 0, 0, 0.24) 0.52%, rgba(0, 0, 0, 0.08) 51.12%, rgba(0, 0, 0, 0.04) 99.48%)
  backdrop-filter: blur(40px)
  box-shadow: 4px 4px 12px 0px #0000003D
</style>
