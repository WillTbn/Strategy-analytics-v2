<template>
  <div class="title-page row justify-between q-mx-sm">
    <div class="col-10 q-pa-lg title-page-main">
      <div class="text-subtitle2 text-caption text-grey q-mb-md">
        {{ subtitle }}
        <slot name="subtitleAppend"></slot>
      </div>
      <q-breadcrumbs
        v-if="breadcrumbs.length > 0"
        class="primary q-mb-md"
        active-color="grey"
      >
        <q-breadcrumbs-el
          v-for="(item, index) in breadcrumbs"
          :key="index"
          :label="item.label"
          :icon="item.icon"
        />
      </q-breadcrumbs>
      <div class="text-h3 text-bold title-page-heading">
        <q-btn
          v-if="toBack"
          flat
          round
          dense
          class="title-page-back"
          aria-label="Voltar à página anterior"
          @click="$router.back()"
          ><img src="/system/icons/profile/back.svg" alt=""
        /></q-btn>
        {{ title }}
      </div>
      <slot></slot>
    </div>
    <div class="col-auto self-center q-px-md">
      <slot name="append"></slot>
    </div>
  </div>
</template>
<script>
import { defineComponent } from "vue";
export default defineComponent({
  name: "TitlePage",
  props: {
    title: {
      type: String,
    },
    subtitle: {
      type: String,
    },
    breadcrumbs: {
      type: Array,
      default: () => [],
    },
    toBack: { type: Boolean, default: false },
  },
});
</script>

<style scoped>
.title-page-heading {
  display: flex;
  align-items: center;
  gap: 16px;
}
.title-page-back {
  width: 40px;
  height: 40px;
  flex: none;
}
.title-page-back img {
  width: 40px;
  height: 40px;
}
</style>
