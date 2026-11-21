<template>
  <section
    class="phone-verification q-mb-lg"
    aria-label="Confirmação de celular"
  >
    <q-btn
      v-if="!opened"
      flat
      no-caps
      color="primary"
      label="Confirmar celular"
      @click="opened = true"
    />
    <q-form v-else class="tool q-pa-md" @submit.prevent="flow.confirm">
      <h3 class="text-subtitle1 q-mt-none q-mb-sm">Confirmar celular</h3>
      <p>
        Informe um celular ao qual você tem acesso para receber o código de
        confirmação.
      </p>
      <q-toggle
        v-model="international"
        label="Número de outro país"
        :disable="Boolean(state.busy)"
        @update:model-value="changeFormat"
        class="q-mb-sm"
      />
      <div class="row q-col-gutter-md">
        <label-form
          text-label="Celular com código do país"
          class-name="col-12 col-sm-6"
        >
          <q-input
            v-model="state.number"
            outlined
            dense
            type="tel"
            autocomplete="tel"
            aria-label="Celular com código do país"
            :placeholder="
              international
                ? '+ código do país e número'
                : '+55 (11) 90000-0000'
            "
            :mask="phoneInputMask(state.format)"
            :maxlength="international ? 16 : 19"
            :hint="
              international
                ? 'Até 15 dígitos, incluindo o código do país.'
                : 'Digite 55, DDD e os 9 dígitos do celular.'
            "
            :disable="Boolean(state.busy)"
            @update:model-value="flow.reset"
          />
        </label-form>
        <label-form
          v-if="state.sentTo"
          text-label="Código recebido"
          class-name="col-12 col-sm-6"
        >
          <q-input
            v-model.trim="state.code"
            outlined
            dense
            type="password"
            autocomplete="one-time-code"
            aria-label="Código de confirmação do celular"
            :disable="Boolean(state.busy)"
          />
        </label-form>
      </div>
      <p v-if="state.error" role="alert" class="text-negative q-mt-md">
        {{ state.error }}
      </p>
      <p v-if="state.message" role="status" class="q-mt-md">
        {{ state.message }}
      </p>
      <div class="row q-gutter-sm q-mt-sm">
        <q-btn
          flat
          no-caps
          color="primary"
          :label="state.sentTo ? 'Reenviar código' : 'Enviar código'"
          :loading="state.busy === 'send'"
          :disable="Boolean(state.busy)"
          @click="flow.send"
        />
        <q-btn
          v-if="state.sentTo"
          type="submit"
          flat
          no-caps
          color="primary"
          label="Confirmar código"
          :loading="state.busy === 'confirm'"
          :disable="Boolean(state.busy) || !state.code.trim()"
        />
        <q-btn
          flat
          no-caps
          label="Cancelar"
          :disable="Boolean(state.busy)"
          @click="close"
        />
      </div>
    </q-form>
  </section>
</template>
<script setup>
import { reactive, ref, onScopeDispose } from "vue";
import LabelForm from "src/system/components/form/LabelForm.vue";
import {
  requestPhoneVerification,
  confirmPhoneVerification,
} from "src/services/clientAccountService";
import {
  captureClientSession,
  isClientSessionCurrent,
} from "src/services/clientApi";
import { getApiErrorMessage } from "src/services/clientAuthService";
import {
  createPhoneVerification,
  phoneInputMask,
} from "src/services/phoneVerification";
const emit = defineEmits(["verified"]);
const opened = ref(false);
const international = ref(false);
const state = reactive({
  format: "BR",
  number: "",
  code: "",
  sentTo: "",
  busy: "",
  error: "",
  message: "",
});
const flow = createPhoneVerification(state, {
  request: requestPhoneVerification,
  confirm: confirmPhoneVerification,
  capture: captureClientSession,
  isCurrent: isClientSessionCurrent,
  errorMessage: getApiErrorMessage,
  verified: () => emit("verified"),
});
const changeFormat = () => {
  flow.reset();
  state.number = "";
  state.format = international.value ? "INTL" : "BR";
};
const close = () => {
  flow.reset();
  state.number = "";
  opened.value = false;
};
onScopeDispose(flow.dispose);
</script>
