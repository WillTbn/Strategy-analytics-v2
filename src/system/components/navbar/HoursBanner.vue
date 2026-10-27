<template>
  <div class="hours-banner" role="timer" :aria-label="`${day} ${timeLabel}`">
    <span>{{ day }}</span>
    <span class="hours-banner__divider" aria-hidden="true" />
    <div class="hours-banner__time">
      <span
        ><template v-for="(part, index) in timeParts" :key="index"
          ><span v-if="index" class="hours-banner__colon">:</span
          >{{ part }}</template
        ></span
      >
    </div>
  </div>
</template>
<script setup>
import { computed, onScopeDispose, ref } from "vue";
import { storeToRefs } from "pinia";
import { useStoreLayout } from "src/stores/layoutStore";
const { system, optionsTimeZone } = storeToRefs(useStoreLayout());
const now = ref(new Date());
const timer = setInterval(() => {
  now.value = new Date();
}, 1000);
onScopeDispose(() => clearInterval(timer));
const zone = computed(
  () =>
    optionsTimeZone.value.find(
      (item) =>
        item.label === system.value.time_zone ||
        item.value === system.value.time_zone,
    )?.value || "America/Sao_Paulo",
);
const timeLabel = computed(() =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: zone.value,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(now.value),
);
const timeParts = computed(() => timeLabel.value.split(":"));
const day = computed(() =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: zone.value, weekday: "short" })
    .format(now.value)
    .replace(".", "")
    .toUpperCase(),
);
</script>
<style scoped>
.hours-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 179px;
  width: 179px;
  height: 51px;
  gap: 8px;
  padding: 4px 12px;
  border: 1px solid rgba(240, 240, 240, 0.16);
  border-radius: 4px;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(40px);
  font-size: 20px;
  white-space: nowrap;
}
.hours-banner__divider {
  width: 1px;
  height: 12px;
  background: rgba(152, 152, 152, 0.32);
}
.hours-banner__time {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 23px;
  font-variant-numeric: tabular-nums;
}
.hours-banner__colon {
  color: #989898;
  margin: 0 4px;
}
</style>
