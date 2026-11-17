<template>
  <article class="card-resume-leverage">
    <div class="resume-title">
      <img v-if="iconSrc" :src="iconSrc" alt="" /><component
        v-else
        :is="icon"
        color="#00a3ff"
        width="24"
        height="24"
      /><span>{{ title }}</span>
    </div>
    <div class="resume-value">
      <strong>{{ text }}</strong
      ><small v-if="description">{{ description }}</small>
    </div>
    <q-inner-loading :showing="loading" color="primary" />
  </article>
</template>
<script setup>
defineProps({
  title: String,
  description: String,
  text: String,
  iconSrc: String,
  icon: { type: String, default: "IconFileInvoice" },
  loading: Boolean,
  plusValue: String,
});
</script>
<style scoped>
.card-resume-leverage {
  position: relative;
  min-width: 0;
  padding: 24px;
  border: 1px solid #efefef14;
  border-radius: 8px;
  background: linear-gradient(
    190deg,
    #0000003d 0.52%,
    #00000014 51%,
    #0000000a 99.48%
  );
  backdrop-filter: blur(16px);
  font-family: Inter, sans-serif;
  color: white;
}
.resume-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #dcdcdc;
  font-size: 20px;
  line-height: 1.35;
}
.resume-value {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 24px;
}
.resume-value strong {
  font-size: 32px;
  line-height: 1.1;
  overflow-wrap: anywhere;
}
.resume-value small {
  font-size: 14px;
  color: #989898;
  overflow-wrap: anywhere;
}
@media (max-width: 700px) {
  .card-resume-leverage {
    padding: 16px;
  }
  .resume-title {
    font-size: 17px;
  }
  .resume-value strong {
    font-size: 26px;
  }
}
</style>
