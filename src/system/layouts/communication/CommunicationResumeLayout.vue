<template>
  <q-card
    flat
    class="communication-resume-layout bg-transparent"
    :class="[
      horizontal ? 'communication-row' : 'communication-grid-card',
      classCard,
    ]"
    role="link"
    tabindex="0"
    :aria-label="title"
    @click="emit('go')"
    @keydown.enter="emit('go')"
  >
    <img
      v-if="image && !imageFailed"
      class="communication-thumbnail"
      :src="image"
      alt=""
      @error="imageFailed = true"
    />
    <div class="communication-copy">
      <div class="communication-meta">
        <q-badge
          class="communication-category"
          :style="{ backgroundColor: typeColor }"
          rounded
          >{{ typeNew }}</q-badge
        >
        <div class="communication-publisher">
          <q-chip v-if="author" class="communication-author" text-color="white"
            ><q-avatar>{{ author.charAt(0) }}</q-avatar
            ><span>{{ author }}</span
            ><q-tooltip>{{ author }}</q-tooltip></q-chip
          >
          <span class="communication-date">{{ create_at }}</span>
        </div>
      </div>
      <div class="communication-text">
        <p class="communication-title" :class="{ 'is-unread': unread }">
          {{ title }}
        </p>
        <p class="communication-summary">{{ content }}</p>
      </div>
    </div>
  </q-card>
  <q-separator v-if="horizontal" class="communication-divider" />
</template>
<script setup>
import { ref, watch } from "vue";
const emit = defineEmits(["go"]);
const props = defineProps({
  unread: { type: Boolean, default: true },
  horizontal: { type: Boolean, default: true },
  title: String,
  content: String,
  image: String,
  create_at: String,
  typeNew: String,
  typeColor: String,
  author: String,
  classCard: { type: String, default: "q-ma-md" },
});
const imageFailed = ref(false);
watch(
  () => props.image,
  () => (imageFailed.value = false),
);
</script>
<style scoped>
.communication-resume-layout {
  color: white;
  cursor: pointer;
  min-width: 0;
  width: 100%;
  font-family: Roboto, Inter, sans-serif;
}
.communication-resume-layout:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 4px;
}
.communication-row {
  display: flex;
  align-items: flex-start;
  min-height: 108px;
  margin: 0;
}
.communication-thumbnail {
  width: 240px;
  height: 108px;
  object-fit: cover;
  flex: none;
}
.communication-copy {
  min-width: 0;
  flex: 1;
  padding: 16px;
}
.communication-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  flex-wrap: wrap;
}
.communication-category {
  color: #21272a;
  font:
    400 14px/1.4 Roboto,
    sans-serif;
  padding: 2px 12px;
  border-radius: 12px;
  min-height: 24px;
  white-space: normal;
}
.communication-publisher {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
  flex-wrap: wrap;
  font:
    400 12px/1.35 Inter,
    sans-serif;
}
.communication-author {
  margin: 0;
  padding: 2px 6px;
  height: auto;
  min-height: 28px;
  max-width: 100%;
  background: linear-gradient(184.78deg, #ffffff29, #ffffff0a 50%, #ffffff03);
}
.communication-author :deep(.q-avatar) {
  width: 24px;
  height: 24px;
  font:
    400 12px/1.35 Inter,
    sans-serif;
  background: #fafafa;
  color: #464646;
  margin-right: 4px;
}
.communication-author span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.communication-date {
  color: #989898;
  white-space: nowrap;
}
.communication-text {
  margin-top: 12px;
  min-width: 0;
}
.communication-title {
  font:
    400 14px/1.1 Roboto,
    sans-serif;
  margin: 0 0 4px;
  overflow-wrap: anywhere;
}
.communication-title.is-unread {
  font-weight: 700;
}
.communication-summary {
  font:
    400 14px/1.4 Roboto,
    sans-serif;
  color: #989898;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}
.communication-divider {
  background: #98989852;
  margin: 24px 0;
}
.communication-grid-card .communication-thumbnail {
  display: block;
  width: 100%;
  height: 180px;
}
@media (max-width: 599px) {
  .communication-row {
    flex-direction: column;
  }
  .communication-thumbnail {
    width: 100%;
    height: 140px;
  }
  .communication-copy {
    width: 100%;
    padding: 12px 0;
  }
  .communication-publisher {
    width: 100%;
  }
  .communication-author {
    max-width: 100%;
  }
}
</style>
