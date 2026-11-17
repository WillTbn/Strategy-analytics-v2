<template>
  <div class="simulation-section bg-transparent q-mb-lg">
    <div class="row justify-between">
      <div
        class="col-8 row justify-between"
        style="align-content: space-between"
      >
        <div class="col-12 row items-center">
          <q-avatar size="32px" flat>
            <img src="/figma/my-leverage/review.svg" alt="" />
          </q-avatar>
          <span class="text-h6 q-ml-xs" style="vertical-align: middle">
            {{ title }}
          </span>
          <div class="simulation-status text-inter-14-400 q-ml-sm">
            <img
              v-if="kind"
              :src="'/figma/my-leverage/' + kind.icon"
              alt=""
            />{{ typeDescription }}
          </div>
        </div>
        <div
          class="simulation-status-description text-inter-17-400"
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
        <q-btn :to="link" outline no-caps color="primary">
          <span class="text-white">Ver Empréstimo</span>
          <img src="/figma/my-leverage/external.svg" alt="" class="q-ml-sm" />
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineComponent, computed } from "vue";
import { loanKindPresentation } from "src/services/loanSummaryPresentation";

defineComponent({
  name: "SimulationSection",
});
const props = defineProps({
  type: String,
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
defineEmits(["select"]);
const kind = computed(() => loanKindPresentation(props.type));
</script>

<style scoped lang="sass">
.simulation-section
  width: 100%
  min-width: 0
  min-height: 140px
  gap: 24px
  border-radius: 8px
  padding: 16px
  background: linear-gradient(202.99deg, rgba(0, 0, 0, 0.24) 0.52%, rgba(0, 0, 0, 0.08) 51.12%, rgba(0, 0, 0, 0.04) 99.48%)
  backdrop-filter: blur(40px)
  box-shadow: 4px 4px 12px 0px #0000003D
</style>

<style scoped>
.simulation-section {
  font-family: Inter, sans-serif;
  color: white;
}
.simulation-section > .row {
  gap: 24px;
  align-items: center;
}
.simulation-section .col-8 {
  flex: 1;
  min-width: 0;
}
.simulation-section .col-12.row {
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.simulation-section .text-h6 {
  font:
    700 20px/1.5 Inter,
    sans-serif;
  margin-left: 0;
  overflow-wrap: anywhere;
}
.simulation-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  min-height: 24px;
  border: 1px solid #656565;
  border-radius: 4px;
  background: linear-gradient(183deg, #ffffff29, #ffffff0a 50%, #ffffff03);
}
.simulation-status-description {
  width: 100%;
  margin-top: 24px;
  padding-left: 0;
  font-size: 17px;
  color: #dcdcdc;
}
.simulation-status-description p {
  margin: 8px 0 0;
}
@media (max-width: 700px) {
  .simulation-section > .row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .simulation-section .col-8 {
    width: 100%;
  }
  .simulation-section .text-h6 {
    font-size: 18px;
  }
}
</style>
