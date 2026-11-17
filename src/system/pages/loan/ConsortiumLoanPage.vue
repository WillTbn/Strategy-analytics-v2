<template>
  <q-page class="consortium-loan-page">
    <template v-if="selected === 'home'">
      <div class="q-pa-lg"><route-back /></div>
      <secured-consortium-home-layout @simular="selected = $event" />
    </template>
    <secured-request-wizard
      v-else
      :key="selected"
      consortium
      :type="selected"
      :draft="drafts[selected]"
      @back="selected = 'home'"
    />
  </q-page>
</template>
<script setup>
import { reactive, ref } from "vue";
import RouteBack from "src/system/components/btn/RouterBack.vue";
import SecuredConsortiumHomeLayout from "src/system/layouts/loans/consortium/SecuredConsortiumHomeLayout.vue";
import SecuredRequestWizard from "src/system/components/loan/SecuredRequestWizard.vue";
import { newSecuredDraft } from "src/services/loanRequestDraft";
const selected = ref("home");
const drafts = reactive({
  imovel: newSecuredDraft(),
  automovel: newSecuredDraft(),
});
</script>
