<template>
  <section class="secured-request property-loan-documents">
    <button
      type="button"
      class="request-back"
      aria-label="Voltar"
      @click="$emit('back')"
    >
      <img src="/figma/loan-request/back.svg" alt="" />
    </button>
    <div class="request-columns">
      <div class="request-intro">
        <div class="request-art">
          <div class="art-crop imovel">
            <img :src="asset('house.png')" alt="" />
          </div>
        </div>
        <h1>Faça uma Simulação com seu Imóvel em Garantia</h1>
        <p>
          <strong>Preencha corretamente com seus dados</strong> para iniciarmos
          a simulação. Depois, analisaremos seu perfil e retornaremos com uma
          <strong>proposta especial para você.</strong>
        </p>
        <div class="document-note">
          <span><img :src="asset('star.svg')" alt="" /></span>
          <p v-if="reader && uploader">
            Fique tranquilo(a), mesmo que você saia da página os arquivos
            ficarão registrados aqui.<br />Retorne quando tiver os documentos
            para continuar o processo.
          </p>
          <p v-else>Envio de documentos indisponível no momento.</p>
        </div>
        <button
          type="button"
          class="document-help"
          :disabled="!helpAction || busy"
          @click="help"
        >
          Solicitar Ajuda para um Assessor<img
            :src="asset('messages.svg')"
            alt=""
          />
        </button>
        <p v-if="helpError" class="document-feedback" role="alert">
          {{ helpError }}
        </p>
      </div>
      <div class="request-main">
        <loading-step :step-number="5" :step-total="6"
          ><template #caption
            ><span class="text-inter-20-500">Passo 6</span
            ><span class="text-inter-20-500 text-grey"> / 7</span></template
          ></loading-step
        >
        <div class="request-card document-card">
          <h2>Documentações Importantes</h2>
          <resource-state
            v-if="resource.state.loading || resource.state.error"
            :state="resource.state"
            @retry="load"
          />
          <div
            v-for="group in groups"
            :key="group.id"
            class="document-field"
            :class="{ last: group.id === 'registration' }"
          >
            <label :for="`loan-document-${group.id}`">{{ group.label }}</label>
            <label
              class="document-dropzone"
              :class="{
                inactive: !uploader || !reader || resource.state.error || busy,
              }"
              :for="`loan-document-${group.id}`"
              @dragover.prevent
              @drop.prevent="upload(group.id, $event.dataTransfer.files)"
            >
              <img :src="asset('inbox.svg')" alt="" /><span
                >Clique aqui ou arraste arquivos para fazer o upload</span
              >
            </label>
            <input
              :id="`loan-document-${group.id}`"
              class="document-file-input"
              type="file"
              multiple
              :disabled="
                !uploader ||
                !reader ||
                resource.state.loading ||
                !!resource.state.error ||
                busy
              "
              @change="choose(group.id, $event)"
            />
            <ul v-if="filesFor(group.id).length" class="document-file-list">
              <li v-for="file in filesFor(group.id)" :key="file.id">
                <img :src="asset('attachment.svg')" alt="" /><span
                  :title="file.name"
                  >{{ file.name }}</span
                ><button
                  type="button"
                  :aria-label="`Remover ${file.name}`"
                  :disabled="!remover || busy"
                  @click="remove(file)"
                >
                  <img :src="asset('trash.svg')" alt="" />
                </button>
              </li>
            </ul>
            <p v-if="errors[group.id]" class="document-feedback" role="alert">
              {{ errors[group.id] }}
            </p>
          </div>
          <p v-if="submitError" class="document-feedback" role="alert">
            {{ submitError }}
          </p>
          <div class="request-actions">
            <q-btn
              type="button"
              color="primary"
              no-caps
              :disable="
                !canContinue ||
                !proceedAction ||
                busy ||
                resource.state.loading ||
                !!resource.state.error
              "
              @click="proceed"
              >Prosseguir<img src="/figma/loan-request/next.svg" alt=""
            /></q-btn>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup>
import { ref, onScopeDispose } from "vue";
import LoadingStep from "src/system/components/LoadingStep.vue";
import ResourceState from "src/system/components/finance/ResourceState.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import {
  loanDocumentGroups as groups,
  readLoanDocuments,
} from "src/services/loanDocumentation";
const props = defineProps({
  reader: { type: Function, default: null },
  uploader: { type: Function, default: null },
  remover: { type: Function, default: null },
  proceedAction: { type: Function, default: null },
  helpAction: { type: Function, default: null },
  canContinue: { type: Boolean, default: false },
});
defineEmits(["back"]);
const asset = (name) => "/figma/loan-documents/" + name;
const resource = useFinanceResource(),
  files = ref([]),
  busy = ref(false),
  errors = ref({}),
  submitError = ref(""),
  helpError = ref("");
let alive = true,
  generation = 0;
const filesFor = (group) => files.value.filter((file) => file.group === group);
async function load() {
  if (busy.value) return;
  const version = ++generation;
  files.value = [];
  await resource.load(async () =>
    props.reader ? readLoanDocuments(await props.reader()) : [],
  );
  if (alive && version === generation && !resource.state.error)
    files.value = resource.state.data || [];
}
async function choose(group, event) {
  const selected = [...event.target.files];
  event.target.value = "";
  await upload(group, selected);
}
async function upload(group, selected) {
  if (
    !props.uploader ||
    !props.reader ||
    busy.value ||
    resource.state.loading ||
    resource.state.error ||
    !groups.some((g) => g.id === group)
  )
    return;
  const selection = [...selected];
  if (!selection.length) return;
  const version = generation;
  errors.value[group] = "";
  busy.value = true;
  try {
    for (const file of selection) {
      if (!file || !Number.isFinite(file.size) || file.size <= 0)
        throw Error("empty");
      const row = readLoanDocuments([await props.uploader(group, file)])[0];
      if (!alive || generation !== version) return;
      if (row.group !== group) throw Error("wrong group");
      files.value = readLoanDocuments([...files.value, row]);
    }
  } catch {
    if (alive && generation === version)
      errors.value[group] =
        "Não foi possível enviar o arquivo. Tente novamente.";
  } finally {
    if (alive && generation === version) busy.value = false;
  }
}
async function remove(file) {
  if (
    !props.remover ||
    busy.value ||
    !files.value.some((row) => row.id === file.id)
  )
    return;
  const version = generation;
  busy.value = true;
  errors.value[file.group] = "";
  try {
    const response = await props.remover(file);
    if (response !== true && response?.removed !== true)
      throw Error("unconfirmed");
    if (alive && version === generation)
      files.value = files.value.filter((row) => row.id !== file.id);
  } catch {
    if (alive && version === generation)
      errors.value[file.group] =
        "Não foi possível remover o arquivo. Tente novamente.";
  } finally {
    if (alive && version === generation) busy.value = false;
  }
}
async function proceed() {
  if (
    !props.canContinue ||
    !props.proceedAction ||
    busy.value ||
    resource.state.loading ||
    resource.state.error
  )
    return;
  busy.value = true;
  submitError.value = "";
  try {
    await props.proceedAction([...files.value]);
  } catch {
    if (alive)
      submitError.value = "Não foi possível prosseguir. Tente novamente.";
  } finally {
    if (alive) busy.value = false;
  }
}
async function help() {
  if (!props.helpAction || busy.value) return;
  busy.value = true;
  helpError.value = "";
  try {
    await props.helpAction();
  } catch {
    if (alive)
      helpError.value = "Não foi possível solicitar ajuda. Tente novamente.";
  } finally {
    if (alive) busy.value = false;
  }
}
load();
onScopeDispose(() => {
  alive = false;
  generation++;
  resource.reset();
});
</script>
<style scoped lang="scss">
@import "./loanRequest.scss";
.property-loan-documents .request-card {
  gap: 24px;
}
.document-card h2 {
  font:
    700 24px/1.5 Inter,
    sans-serif;
  margin: 0 0 8px;
}
.request-intro strong {
  font-weight: 400;
  color: #dcdcdc;
}
.document-note {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-top: 40px;
  border-left: 2px solid #00a3ff;
  border-radius: 4px;
  background: linear-gradient(182deg, #ffffff29, #ffffff0a 50%, #ffffff03);
}
.document-note > span {
  padding: 4px;
  display: flex;
  border-radius: 4px;
  background: linear-gradient(203deg, #0000003d, #00000014 51%, #0000000a);
}
.document-note p {
  font:
    400 14px/1.35 Inter,
    sans-serif;
  color: #bdbdbd;
  margin: 0;
}
.document-help {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid white;
  background: white;
  color: #00a3ff;
  border-radius: 4px;
  padding: 8px 12px;
  font:
    500 14px/1 Roboto,
    sans-serif;
  letter-spacing: 0.5px;
  margin-top: 40px;
  cursor: pointer;
}
.document-help:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.document-field {
  min-width: 0;
  border-bottom: 1px solid #efefef14;
  padding-bottom: 24px;
}
.document-field.last {
  border-bottom: none;
}
.document-field > label:first-child {
  display: block;
  font:
    500 14px/1.35 Inter,
    sans-serif;
  padding-bottom: 8px;
}
.document-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  border: 1px dashed #00a3ff;
  border-radius: 4px;
  background: linear-gradient(184deg, #ffffff29, #ffffff0a 50%, #ffffff03);
  cursor: pointer;
  text-align: center;
  font:
    500 14px/1.35 Inter,
    sans-serif;
}
.document-field.last .document-dropzone {
  border-color: #989898;
}
.document-dropzone.inactive {
  cursor: not-allowed;
}
.document-dropzone:focus-within {
  outline: 2px solid #75cfff;
  outline-offset: 3px;
}
.document-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
}
.document-field:has(input:focus-visible) .document-dropzone {
  outline: 2px solid #75cfff;
  outline-offset: 3px;
}
.document-file-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: grid;
  gap: 8px;
}
.document-file-list li {
  display: flex;
  align-items: start;
  gap: 8px;
  min-width: 0;
  color: #dcdcdc;
  font-size: 14px;
}
.document-file-list li > span {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.document-file-list button {
  background: none;
  border: 0;
  padding: 0;
  display: flex;
  cursor: pointer;
}
.document-file-list button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.document-feedback {
  color: #ffb4ab;
  font-size: 14px;
  margin: 8px 0 0;
  overflow-wrap: anywhere;
}
.document-actions {
  display: flex;
  justify-content: end;
  padding: 16px 0 0;
}
</style>
