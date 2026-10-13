<template>
  <div class="resume-contracts-layout row justify-between q-my-md">
    <q-card
      class="bg-transparent q-pa-md"
      :class="dashboard.publicity_contract ? 'col-12 col-md-9' : 'col-12'"
    >
      <div class="col-12">
        <h2 class="text-h7">
          Contratos
          <q-btn color="primary" flat no-caps :to="{ name: 'Contratos' }">
            Ver mais
            <IconArrowRight class="q-ml-xs" />
          </q-btn>
        </h2>
      </div>
      <div class="col-12 card-wallet">
        <resource-state :state="state" @retry="$emit('retry')">
          <p
            v-if="state.data?.contracts?.status !== 'Available'"
            class="q-pa-md"
          >
            Contratos indisponíveis no momento.
          </p>
          <p v-else-if="!state.data?.contracts?.items?.length" class="q-pa-md">
            Nenhum contrato disponível.
          </p>
          <contract-section
            v-for="contract in state.data?.contracts?.status === 'Available'
              ? state.data.contracts.items || []
              : []"
            :key="contract.id"
            :name="contract.name || contract.publicCode"
            :id="contract.id"
            :currency="contract.currencyCode"
            :currentEntry="
              contract.myParticipation?.allocatedAmount == null
                ? null
                : Number(contract.myParticipation.allocatedAmount)
            "
            icon="IconFileDollar"
            :isActive="contract.id === contractSection"
            @select="contractSelect(contract.id)"
            @closed="contractSection = null"
          >
            <div class="row justify-between q-gutter-sm">
              <div class="col-6 styleTool q-pa-md">
                <p class="q-ma-none">Evolução do contrato indisponível.</p>
              </div>
              <div class="col styleTool row justify-center items-center">
                <p class="q-pa-md q-ma-none">
                  Composição do contrato indisponível.
                </p>
              </div>
            </div>
          </contract-section>
        </resource-state>
      </div>
    </q-card>
    <publicity-card
      v-if="dashboard.publicity_contract"
      @closed="dashboard.publicity_contract = false"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import ContractSection from "src/system/components/wallet/ContractSection.vue";
import PublicityCard from "src/system/components/PublicityCard.vue";
import ResourceState from "src/system/components/finance/ResourceState.vue";
import { useStoreLayout } from "src/stores/layoutStore";
import { storeToRefs } from "pinia";
defineProps({ state: { type: Object, required: true } });
defineEmits(["retry"]);
const { dashboard } = storeToRefs(useStoreLayout());
const contractSection = ref(null);
const contractSelect = (id) => {
  contractSection.value = id;
};
</script>

<style scoped>
.card-wallet {
  max-height: 680px;
  overflow-y: auto;
}
@media (max-width: 1023px) {
  .resume-contracts-layout > .publicity-card {
    width: 100%;
    max-width: 100%;
    height: auto;
    flex-wrap: nowrap;
    margin-top: 16px;
  }
  .resume-contracts-layout :deep(.publicity-card .q-img) {
    min-height: 180px;
    flex: 0 0 180px;
  }
}
</style>
