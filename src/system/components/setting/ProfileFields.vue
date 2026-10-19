<template>
  <dl class="profile-fields" :style="{ '--profile-columns': columns }">
    <div
      v-for="(field, index) in fields"
      :key="field.title + index"
      class="profile-field"
    >
      <dt class="text-grey">{{ field.title }}</dt>
      <dd class="text-weight-bold">{{ field.value }}</dd>
    </div>
  </dl>
</template>
<script setup>
defineProps({
  fields: { type: Array, default: () => [] },
  columns: { type: Number, default: 5 },
});
</script>
<style scoped>
.profile-fields {
  display: grid;
  grid-template-columns: repeat(var(--profile-columns), minmax(0, 1fr));
  gap: 20px 24px;
  margin: 24px 0 0;
  font-size: 14px;
}
.profile-field {
  min-width: 0;
}
dt {
  margin-bottom: 6px;
  font-weight: 400;
}
dd {
  margin: 0;
  overflow-wrap: anywhere;
}
@media (max-width: 1100px) {
  .profile-fields {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .profile-fields {
    grid-template-columns: 1fr;
  }
}
</style>
