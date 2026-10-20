<template>
  <div class="LoanPage">
    teste
    <!-- 
    old page
    <div class="row text-center justify-center q-pt-lg">
      <div class="col-12">
        <titleinter-medium text="Emprestimo" />
      </div>
    </div>
    <q-tab-panels v-model="loanSteps" animated class="bg-transparent">
      <q-tab-panel name="home"> <loanmain-layout /> </q-tab-panel>

      <q-tab-panel name="details"> <loandetails-layout /> </q-tab-panel>
      <q-tab-panel name="finally"> <request-analysis /></q-tab-panel>
    </q-tab-panels> 
    -->
  </div>
</template>

<script>
import { defineComponent } from "vue";

import { useLayoutStore } from "src/stores/layout";
import { storeToRefs } from "pinia";

export default defineComponent({
  name: "LoanPage",
  setup() {
    const layout = useLayoutStore();
    const { loanSteps } = storeToRefs(layout);
    return { loanSteps };
  },
  // Outras configurações do componente aqui
});
</script>

<style scoped>
/* Estilos específicos do componente aqui */
</style>
