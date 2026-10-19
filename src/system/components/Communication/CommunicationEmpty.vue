<template>
  <div
    class="communication-empty"
    :class="{ 'communication-empty--preview': preview }"
  >
    <img
      :src="
        preview
          ? '/img/communication/empty-preview.svg'
          : '/img/communication/empty.svg'
      "
      alt=""
    />
    <p class="communication-empty-title">Ainda não há comunicações</p>
    <p class="communication-empty-description">
      Quando a Strategy publicar comunicados, insights e relatórios econômicos,
      eles aparecem aqui.
    </p>
  </div>
</template>
<script setup>
defineProps({ preview: Boolean });
</script>
<style scoped>
.communication-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 520px;
  padding: 24px;
  text-align: center;
  min-width: 0;
}
.communication-empty--preview {
  min-height: 452px;
}
.communication-empty-title {
  font:
    500 24px/1.35 Inter,
    sans-serif;
  margin: 0;
  color: #fff;
}
.communication-empty--preview .communication-empty-title {
  font-size: 20px;
}
.communication-empty-description {
  font:
    400 16px / normal Inter,
    sans-serif;
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  max-width: 100%;
  overflow-wrap: anywhere;
}
@media (max-width: 599px) {
  .communication-empty {
    padding: 24px 8px;
  }
}
</style>
