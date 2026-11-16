<template>
  <div>
    <resource-state :state="status.state" @retry="load"
      ><router-view v-if="level != null && level >= 3"
    /></resource-state>
    <q-dialog
      :model-value="level != null && level < 3"
      persistent
      backdrop-filter="blur(4px) saturate(150%)"
      ><q-card class="tool border-primary lending-access"
        ><q-card-section class="text-center"
          ><img
            src="/img/level-block.png"
            alt="bloqueio"
            class="block-icon" /></q-card-section
        ><q-card-section class="text-center"
          ><p class="text-inter-24-700">
            Desbloqueie essa Área ao atingir o Nível 3!
          </p>
          <p class="text-grey text-inter-14-400">
            Você pode subir de níveis ao acessar a Área Perfil e preencher
            documentos e informações patrimoniais. Faça isso agora e aproveite o
            máximo da plataforma!
          </p></q-card-section
        ><q-card-actions align="between"
          ><q-btn no-caps flat color="grey" :to="{ name: 'inicio' }"
            ><IconArrowLeft class="q-mr-sm" />Voltar</q-btn
          ><q-btn no-caps color="primary" :to="{ name: 'profile' }"
            >Quero Desbloquear a Área<IconArrowRight
              class="q-ml-sm" /></q-btn></q-card-actions></q-card
    ></q-dialog>
  </div>
</template>
<script setup>
import { computed, onScopeDispose } from "vue";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-vue";
import ResourceState from "src/system/components/finance/ResourceState.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { getOnboardingStatus } from "src/services/clientAccountService";
import { lendingLevel } from "src/services/clientLoans";
const props = defineProps({
  readStatus: { type: Function, default: getOnboardingStatus },
});
const status = useFinanceResource(),
  level = computed(() => lendingLevel(status.state.data));
const load = () =>
  status.load(async () => {
    const data = await props.readStatus();
    if (lendingLevel(data) == null) throw Error("Nível indisponível.");
    return data;
  });
load();
onScopeDispose(status.reset);
</script>
<style scoped>
.lending-access {
  width: 600px;
  max-width: calc(100vw - 32px);
  color: #fff;
}
.block-icon {
  width: 100%;
  max-width: 480px;
  height: auto;
}
</style>
