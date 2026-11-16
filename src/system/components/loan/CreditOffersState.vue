<template>
  <resource-state :state="resource.state" @retry="load"
    ><slot
  /></resource-state>
</template>
<script setup>
import { onScopeDispose } from "vue";
import ResourceState from "src/system/components/finance/ResourceState.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
const resource = useFinanceResource();
const load = () =>
  resource.load(async () => {
    throw Error("Consulta de ofertas ainda indisponível.");
  });
load();
onScopeDispose(resource.reset);
</script>
