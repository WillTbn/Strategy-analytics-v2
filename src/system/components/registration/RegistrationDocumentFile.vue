<template>
  <div>
    <div
      role="button"
      tabindex="0"
      :aria-label="label"
      :aria-disabled="disabled"
      class="document-file"
      :class="{ dragging, disabled }"
      @click="pick"
      @keydown.enter.prevent="pick"
      @keydown.space.prevent="pick"
      @dragover.prevent="dragging = !disabled"
      @dragleave.prevent="dragging = false"
      @drop.prevent="drop"
    >
      <input
        ref="input"
        type="file"
        :aria-label="label"
        tabindex="-1"
        :accept="rules.mimeTypes?.join(',')"
        :disabled="disabled"
        @click.stop
        @change="change"
      />
      <img src="/system/icons/auth/upload.svg" alt="" />
      <strong>{{ label }}</strong>
      <span v-if="!modelValue && !status"
        >Clique ou arraste a foto ou o arquivo</span
      >
      <span v-if="modelValue" class="filename" :title="modelValue.name">{{
        modelValue.name
      }}</span>
      <span v-if="status">{{ status }}</span>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { validateDocumentSelection } from "src/services/registrationDocuments";
const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: Object, default: null },
  rules: { type: Object, default: () => ({}) },
  status: { type: String, default: "" },
  disabled: Boolean,
});
const emit = defineEmits(["update:modelValue"]);
const input = ref(null),
  error = ref(""),
  dragging = ref(false);
const pick = () => {
  if (!props.disabled) input.value?.click();
};
const select = (files) => {
  if (props.disabled || !files.length) return;
  error.value = validateDocumentSelection(files, props.rules);
  if (!error.value) emit("update:modelValue", files[0]);
};
const change = (event) => {
  select(Array.from(event.target.files || []));
  event.target.value = "";
};
const drop = (event) => {
  dragging.value = false;
  select(Array.from(event.dataTransfer?.files || []));
};
</script>
<style scoped>
.document-file {
  min-width: 0;
  cursor: pointer;
  border: 1px dashed #ffffff4d;
  border-radius: 8px;
  background: #ffffff08;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  min-height: 118px;
}
.document-file img {
  width: 28px;
  height: 28px;
}
.document-file strong {
  font:
    500 14px/17px Inter,
    sans-serif;
}
.document-file span {
  color: #ffffff99;
  font:
    400 13px/16px Inter,
    sans-serif;
  max-width: 100%;
  overflow-wrap: anywhere;
}
.document-file input {
  display: none;
}
.document-file .filename {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.document-file:focus-visible,
.document-file.dragging {
  outline: 2px solid #00a3ff;
  outline-offset: 3px;
}
.document-file.disabled {
  opacity: 0.5;
  cursor: default;
}
.error {
  margin: 8px 0 0;
  color: #ffb4bd;
  font-size: 14px;
}
</style>
