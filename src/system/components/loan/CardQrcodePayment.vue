<template>
  <q-card class="loan-payment-card card-qrcode-payment"
    ><h2>Pagamento de Parcelas</h2>
    <p>
      Escaneie o QR Code ou copie a Chave PIX abaixo. Salve o comprovante para
      anexá-lo em seguida.
    </p>
    <div class="payment-qr">
      <qrcode-vue
        v-if="pixCode"
        :value="pixCode"
        :size="180"
        render-as="svg"
        background="transparent"
        foreground="#dcdcdc"
      /><span v-else>Código Pix indisponível</span>
    </div>
    <div class="payment-pix-key">
      <span>{{ pixKey || "—" }}</span
      ><q-btn
        outline
        no-caps
        color="primary"
        label="Copiar Chave PIX"
        :disable="!pixKey || busy"
        @click="copy"
      />
    </div>
    <div class="payment-receipt">
      <label for="loan-payment-receipt">Comprovante de Pagamento</label
      ><label
        class="payment-dropzone"
        for="loan-payment-receipt"
        @dragover.prevent
        @drop.prevent="choose($event.dataTransfer.files)"
        ><img src="/figma/my-leverage/payment-upload.svg" alt="" /><span
          >Clique aqui ou arraste arquivos para fazer o upload</span
        ></label
      ><input
        id="loan-payment-receipt"
        type="file"
        :disabled="!submitReceipt || busy"
        @change="
          choose($event.target.files);
          $event.target.value = '';
        "
      />
      <p v-if="file" class="payment-selected">{{ file.name }}</p>
    </div>
    <p v-if="error" role="alert" class="loan-payment-error">{{ error }}</p>
    <div class="loan-payment-footer">
      <q-btn flat no-caps color="white" :disable="busy" @click="$emit('back')"
        ><img src="/figma/my-leverage/payment-back.svg" alt="" />Voltar</q-btn
      ><q-btn
        no-caps
        color="primary"
        label="Finalizar Pagamento"
        :disable="!file || !pixCode || !pixKey || !submitReceipt || busy"
        @click="submit"
      /></div
  ></q-card>
</template>
<script setup>
import { ref, watch, onScopeDispose } from "vue";
import QrcodeVue from "qrcode.vue";
import { copyToClipboard } from "quasar";
const props = defineProps({
  pixCode: String,
  pixKey: String,
  submitReceipt: Function,
});
const emit = defineEmits(["back", "next"]);
const file = ref(null),
  error = ref(""),
  busy = ref(false);
let active = true,
  generation = 0;
watch(
  () => [props.pixCode, props.pixKey, props.submitReceipt],
  () => {
    generation++;
    file.value = null;
    error.value = "";
    busy.value = false;
  },
  { flush: "sync" },
);
function choose(files) {
  if (busy.value || !props.submitReceipt) return;
  error.value = "";
  if (
    files.length !== 1 ||
    !files[0] ||
    !Number.isFinite(files[0].size) ||
    files[0].size <= 0
  ) {
    error.value = "Selecione um comprovante válido.";
    return;
  }
  file.value = files[0];
}
async function copy() {
  if (!props.pixKey || busy.value) return;
  try {
    await copyToClipboard(props.pixKey);
  } catch {
    if (active)
      error.value = "Não foi possível copiar a chave. Tente novamente.";
  }
}
async function submit() {
  if (
    !file.value ||
    !props.pixCode ||
    !props.pixKey ||
    !props.submitReceipt ||
    busy.value
  )
    return;
  const version = generation;
  busy.value = true;
  error.value = "";
  try {
    const result = await props.submitReceipt(file.value);
    if (result?.submitted !== true) throw Error("unconfirmed");
    if (active && version === generation) emit("next", result);
  } catch {
    if (active && version === generation)
      error.value = "Não foi possível enviar o comprovante. Tente novamente.";
  } finally {
    if (active && version === generation) busy.value = false;
  }
}
onScopeDispose(() => {
  active = false;
});
</script>
<style scoped lang="scss">
@import "./loanPaymentCard.scss";
.payment-qr {
  width: 180px;
  height: 180px;
  margin: 40px auto 21px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #989898;
  text-align: center;
}
.payment-pix-key {
  min-height: 56px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.payment-pix-key > span {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 14px;
}
.payment-receipt {
  border-top: 1px solid #efefef29;
  margin-top: 40px;
  padding-top: 32px;
}
.payment-receipt > label:first-child {
  display: block;
  font:
    500 17px/1.35 Inter,
    sans-serif;
  margin-bottom: 4px;
}
.payment-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  border: 1px dashed #00a3ff;
  border-radius: 4px;
  background: linear-gradient(184deg, #ffffff29, #ffffff0a 50%, #ffffff03);
  font-size: 14px;
  text-align: center;
  cursor: pointer;
}
.payment-receipt input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
}
.payment-receipt:has(input:focus-visible) .payment-dropzone {
  outline: 2px solid #75cfff;
  outline-offset: 4px;
}
.payment-selected {
  font-size: 14px;
  overflow-wrap: anywhere;
  color: #dcdcdc;
  margin: 8px 0 0;
}
@media (max-width: 600px) {
  .payment-pix-key {
    flex-wrap: wrap;
  }
}
</style>
