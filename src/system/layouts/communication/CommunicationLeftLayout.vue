<template>
  <communication-layout :preview="preview" />
</template>
<script setup>
import CommunicationLayout from "./CommunicationLayout.vue";
defineProps({ preview: { type: Boolean, default: true } });
</script>
