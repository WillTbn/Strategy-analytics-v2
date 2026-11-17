<template>
  <q-page class="secured-loan-page">
    <template v-if="selected === 'home'">
      <div class="q-pa-lg"><route-back /></div>
      <secured-home-layout @simular="selected = $event" />
    </template>
    <secured-request-wizard
      v-else
      :key="selected"
      :type="selected"
      :draft="drafts[selected]"
      v-model:step="steps[selected]"
      @back="selected = 'home'"
    />
  </q-page>
</template>
<script setup>
import { reactive, ref } from "vue";
import RouteBack from "src/system/components/btn/RouterBack.vue";
import SecuredHomeLayout from "src/system/layouts/loans/SecuredHomeLayout.vue";
import SecuredRequestWizard from "src/system/components/loan/SecuredRequestWizard.vue";
import { newSecuredDraft } from "src/services/loanRequestDraft";
const selected = ref("home");
const steps = reactive({ imovel: 0, automovel: 0 });
const drafts = reactive({
  imovel: newSecuredDraft(),
  automovel: newSecuredDraft(),
});
</script>
