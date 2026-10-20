<template>
  <q-layout class="registration-shell">
    <q-page-container
      ><main class="registration-shell__main">
        <div class="registration-shell__logo">
          <img src="/system/icons/auth/logo.svg" alt="Strategy Analytics" />
        </div>
        <section class="registration-shell__card">
          <header class="registration-shell__header">
            <p>Etapa {{ step }} de 7</p>
            <h1>{{ title }}</h1>
            <div
              class="registration-shell__progress"
              role="progressbar"
              aria-label="Progresso do cadastro"
              :aria-valuenow="step"
              aria-valuemin="1"
              aria-valuemax="7"
            >
              <span :style="{ width: `${(step / 7) * 100}%` }" />
            </div>
          </header>
          <slot />
        </section></main
    ></q-page-container>
  </q-layout>
</template>
<script setup>
defineProps({
  step: { type: Number, required: true },
  title: { type: String, required: true },
});
</script>
<style scoped>
.registration-shell {
  color: white;
  background: linear-gradient(
    215.1213deg,
    #791823 0.17422%,
    #330a0f 9.0927%,
    #090c15 39.128%,
    #09293e 73.446%,
    #114d76 99.826%
  );
  font-family: Inter, sans-serif;
}
.registration-shell__main {
  min-height: 100vh;
  padding: 48px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
}
.registration-shell__logo {
  width: 152px;
  height: 48px;
  display: flex;
  align-items: center;
  flex: none;
}
.registration-shell__logo img {
  width: 152px;
  height: 32.7729px;
  mask-image: url("/system/icons/auth/logo-mask.svg");
  mask-size: 152px 32.7728px;
  mask-repeat: no-repeat;
}
.registration-shell__card {
  width: min(760px, 100%);
  min-width: 0;
  padding: 40px;
  border: 1px solid rgba(239, 239, 239, 0.16);
  border-radius: 16px;
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(20px);
  background: linear-gradient(
    234.1691deg,
    rgba(121, 24, 35, 0.4) 0.17422%,
    rgba(51, 10, 15, 0.4) 9.0927%,
    rgba(9, 12, 21, 0.4) 39.128%,
    rgba(9, 41, 62, 0.4) 73.446%,
    rgba(17, 77, 118, 0.4) 99.826%
  );
}
.registration-shell__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}
.registration-shell__header p {
  margin: 0;
  color: #00a3ff;
  font-size: 14px;
  line-height: 17px;
  font-weight: 500;
}
h1 {
  margin: 0;
  font-size: 24px;
  line-height: 32px;
  font-weight: 500;
}
.registration-shell__progress {
  height: 6px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
  overflow: hidden;
}
.registration-shell__progress span {
  display: block;
  height: 100%;
  background: #00a3ff;
  border-radius: 3px;
}
@media (max-width: 600px) {
  .registration-shell__card {
    padding: 24px;
  }
}
</style>
