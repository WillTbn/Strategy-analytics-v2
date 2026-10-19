<template>
  <div v-if="resource.state.loading" class="q-py-md" role="status">
    <q-spinner color="primary" size="24px" /><span class="q-ml-sm"
      >Carregando...</span
    >
  </div>
  <div
    v-else-if="resource.state.error"
    class="q-py-sm text-negative"
    role="alert"
  >
    {{ resource.state.error }}
    <q-btn
      flat
      dense
      no-caps
      color="primary"
      label="Tentar novamente"
      @click="resource.load"
    />
  </div>
</template>
<script setup>
defineProps({ resource: { type: Object, required: true } });
</script>
