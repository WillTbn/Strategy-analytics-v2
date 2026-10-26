<template>
  <q-dialog
    :model-value="modelValue"
    aria-labelledby="share-title"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="profile-share-dialog" :dark="false">
      <div class="share-heading">
        <div>
          <h2 id="share-title">Compartilhe o seu perfil</h2>
          <p>
            Escolha o formato, baixe a imagem e poste ou envie para quem quiser
          </p>
        </div>
        <q-btn
          v-close-popup
          flat
          round
          icon="close"
          aria-label="Fechar compartilhamento"
        />
      </div>
      <fieldset class="share-options">
        <legend class="sr-only">Formato da imagem</legend>
        <q-radio
          :dark="false"
          v-model="format"
          val="feed"
          label="Feed (4:5)"
          :disable="exporting"
        />
        <q-radio
          :dark="false"
          v-model="format"
          val="story"
          label="Story (9:16)"
          :disable="exporting"
        />
      </fieldset>
      <q-toggle
        :dark="false"
        v-model="privateMode"
        :disable="exporting"
        label="Ocultar informações mais pessoais (só o primeiro nome, sem foto)"
      />
      <p v-if="!model.ready" class="share-notice" role="status">
        Os indicadores e o convite ainda não estão disponíveis. Você pode
        conferir os formatos; o download será liberado quando os dados estiverem
        completos.
      </p>
      <div v-if="loading" class="share-loading" role="status">
        <q-spinner color="primary" size="32px" /> Carregando pré-visualização…
      </div>
      <div v-else-if="loadError" class="share-error" role="alert">
        {{ loadError }}
        <q-btn flat no-caps label="Tentar novamente" @click="loadAssets" />
      </div>
      <section v-else aria-label="Pré-visualização" class="share-preview">
        <h3>Pré-visualização</h3>
        <div class="share-artwork">
          <profile-share-artwork
            ref="artwork"
            :model="model"
            :format="format"
            :logo="logo"
            :calendar="calendar"
            :avatar="avatar"
            :font="font"
          />
        </div>
        <p v-if="photoUnavailable" class="share-notice">
          Foto indisponível. A imagem usará suas iniciais.
        </p>
      </section>
      <p v-if="actionError" role="alert" class="share-error">
        {{ actionError }}
      </p>
      <p v-if="copied" role="status">Link do convite copiado.</p>
      <div class="share-actions">
        <q-btn
          outline
          no-caps
          color="primary"
          label="Copiar link do convite"
          :disable="!model.invitationUrl || exporting"
          @click="copyInvite"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Baixar imagem (PNG)"
          :loading="exporting"
          :disable="!model.ready || loading || photoLoading || !!loadError"
          @click="download"
        />
      </div>
    </q-card>
  </q-dialog>
</template>
<script setup>
import { computed, onScopeDispose, ref, watch } from "vue";
import { copyToClipboard } from "quasar";
import {
  imageDataUrl,
  profileSharePng,
  shareImageModel,
} from "src/services/profileShareImage";
import ProfileShareArtwork from "./ProfileShareArtwork.vue";
import interFontUrl from "src/css/Inter-Regular.ttf?url";
const props = defineProps({
  modelValue: Boolean,
  profile: { type: Object, required: true },
  shareData: { type: Object, default: null },
  avatarUrl: { type: String, default: "" },
});
defineEmits(["update:modelValue"]);
const format = ref("feed"),
  privateMode = ref(false),
  artwork = ref(null);
const logo = ref(""),
  font = ref(""),
  calendar = ref(""),
  avatar = ref("");
const loading = ref(false),
  photoLoading = ref(false),
  loadError = ref(""),
  exporting = ref(false),
  actionError = ref(""),
  copied = ref(false),
  photoUnavailable = ref(false);
const now = ref(new Date());
const model = computed(() =>
  shareImageModel(props.profile, props.shareData, privateMode.value, now.value),
);
let controller;
async function loadAssets() {
  controller?.abort();
  const request = new AbortController();
  controller = request;
  loading.value = true;
  photoLoading.value = true;
  loadError.value = "";
  avatar.value = "";
  photoUnavailable.value = false;
  try {
    const assets = await Promise.all([
      imageDataUrl("/system/profile-share/logo.svg", request.signal),
      imageDataUrl("/system/profile-share/calendar.svg", request.signal),
      imageDataUrl(interFontUrl, request.signal, ""),
    ]);
    if (request.signal.aborted) return;
    [logo.value, calendar.value, font.value] = assets;
  } catch {
    if (!request.signal.aborted)
      loadError.value = "Não foi possível carregar a pré-visualização.";
  } finally {
    if (!request.signal.aborted) loading.value = false;
  }
  try {
    if (request.signal.aborted || !props.avatarUrl) return;
    const data = await imageDataUrl(props.avatarUrl, request.signal);
    if (!request.signal.aborted) avatar.value = data;
  } catch {
    if (!request.signal.aborted) photoUnavailable.value = true;
  } finally {
    if (!request.signal.aborted) photoLoading.value = false;
  }
}
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      now.value = new Date();
      actionError.value = "";
      copied.value = false;
      loadAssets();
    } else controller?.abort();
  },
  { immediate: true },
);
watch([format, privateMode], () => {
  actionError.value = "";
  copied.value = false;
});
onScopeDispose(() => controller?.abort());
watch(
  () => props.avatarUrl,
  () => {
    if (props.modelValue) loadAssets();
  },
);
async function copyInvite() {
  if (!model.value.invitationUrl) return;
  actionError.value = "";
  copied.value = false;
  try {
    await copyToClipboard(model.value.invitationUrl);
    copied.value = true;
  } catch {
    actionError.value = "Não foi possível copiar o convite. Tente novamente.";
  }
}
async function download() {
  if (
    !model.value.ready ||
    loading.value ||
    photoLoading.value ||
    loadError.value ||
    exporting.value
  )
    return;
  exporting.value = true;
  actionError.value = "";
  try {
    const blob = await profileSharePng(artwork.value.element(), format.value);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `strategy-perfil-${format.value}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    actionError.value = "Não foi possível gerar a imagem. Tente novamente.";
  } finally {
    exporting.value = false;
  }
}
</script>
<style scoped>
.profile-share-dialog {
  width: 620px;
  max-width: calc(100vw - 24px);
  padding: 24px;
  color: #21272a;
  background: #fff;
}
.share-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
}
.share-heading h2 {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
  margin: 0 0 8px;
}
.share-heading p {
  color: #858585;
  font-size: 14px;
  margin: 0;
}
.share-options {
  border: 0;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 12px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.share-preview {
  margin-top: 24px;
}
.share-preview h3 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
}
.share-artwork {
  border: 1px solid #efefef;
  padding: 12px 0;
}
.share-artwork :deep(> svg) {
  width: 100%;
  height: auto;
  display: block;
}
.share-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
}
.share-actions :deep(.q-btn) {
  min-height: 40px;
}
.share-notice {
  font-size: 13px;
  color: #5c6470;
  margin: 16px 0 0;
  line-height: 1.5;
}
.share-loading {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.share-error {
  color: #a51d28;
  margin-top: 16px;
}
@media (max-width: 600px) {
  .profile-share-dialog {
    padding: 16px;
  }
  .share-actions {
    flex-direction: column;
  }
}
</style>
