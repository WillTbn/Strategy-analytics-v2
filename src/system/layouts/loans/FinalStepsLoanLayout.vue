<template>
  <section v-if="confirmed" class="loan-confirmation">
    <div class="confirmation-art">
      <img src="/figma/loan-request/success.png" alt="" />
    </div>
    <div>
      <h2>{{ title }}</h2>
      <p>{{ subTitle }}</p>
    </div>
    <q-btn no-caps color="primary" :to="{ name: nameRouter }"
      >{{ textRouter }}<img src="/figma/loan-request/next.svg" alt=""
    /></q-btn>
  </section>
</template>
<script setup>
defineProps({
  confirmed: Boolean,
  title: String,
  subTitle: String,
  nameRouter: String,
  textRouter: String,
});
</script>
<style scoped>
.loan-confirmation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: 570px;
  max-width: 100%;
  padding: 24px 32px;
  margin: 0 auto;
  border: 1px solid #00a3ff;
  border-radius: 8px;
  background: linear-gradient(194deg, #0000003d, #00000014 51%, #0000000a);
  box-shadow: 0 0 40px #00a3ff66;
  color: white;
}
.confirmation-art {
  width: 407px;
  height: 400px;
  max-width: 100%;
  position: relative;
  overflow: hidden;
  flex: none;
}
.confirmation-art img {
  position: absolute;
  width: 196.08%;
  height: 108.87%;
  max-width: none;
  left: -48.04%;
  top: -4.44%;
}
.loan-confirmation h2 {
  font-size: 24px;
  line-height: 1.5;
  font-weight: 700;
  letter-spacing: normal;
  text-align: center;
  margin: 0 0 12px;
}
.loan-confirmation p {
  font-size: 17px;
  line-height: 1.35;
  text-align: center;
  color: #989898;
  margin: 0;
}
.loan-confirmation :deep(.q-btn__content) {
  gap: 8px;
}
@media (max-width: 600px) {
  .loan-confirmation {
    padding: 24px 16px;
  }
  .confirmation-art {
    width: 100%;
    height: auto;
    aspect-ratio: 407/400;
  }
}
</style>

<style scoped>
.loan-confirmation {
  font-family: Inter, sans-serif;
}
</style>
