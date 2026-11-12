<template>
  <q-card class="client-transfer">
    <q-form @submit="confirm" :inert="busy || undefined">
      <header>
        <h2>Transferência para outro cliente</h2>
        <p>
          Envie da sua Carteira Strategy ou da sua Carteira de Depósito para a
          Carteira Strategy ou para a Carteira de Depósito de outro cliente,
          pelo ID Strategy dele. É imediata, exceto da sua Carteira Strategy
          para a Carteira de Depósito do outro cliente, que leva até 30 dias.
          Pede a Senha de Saque.
        </p>
      </header>
      <label>Enviar para</label>
      <div class="target-toggle" role="group" aria-label="Enviar para">
        <q-btn flat no-caps label="Minhas carteiras" @click="emit('own')" />
        <q-btn
          flat
          no-caps
          label="Outro cliente"
          class="selected"
          aria-pressed="true"
        />
      </div>
      <label
        >ID Strategy do destinatário
        <q-input
          v-model="form.recipientStrategyId"
          outlined
          dense
          bg-color="white"
          color="primary"
          aria-label="ID Strategy do destinatário"
          maxlength="64"
          :loading="recipientLoading"
        />
      </label>
      <p class="help" role="status">
        {{
          recipientError ||
          (recipient
            ? `Destinatário: ${recipient.displayName.replace(/\.+$/, "")}. Confira o nome antes de confirmar.`
            : "Informe o ID Strategy para conferir o destinatário.")
        }}
      </p>
      <div class="columns">
        <label
          >De<q-select
            v-model="form.sourceWallet"
            :options="transferWallets"
            emit-value
            map-options
            outlined
            dense
            bg-color="white"
            aria-label="Carteira de origem"
            dropdown-icon="img:/icons/wallet-transfer/chevron-down.svg"
        /></label>
        <label
          >Para (carteira do destinatário)<q-select
            v-model="form.destinationWallet"
            :options="transferWallets"
            emit-value
            map-options
            outlined
            dense
            bg-color="white"
            aria-label="Carteira do destinatário"
            dropdown-icon="img:/icons/wallet-transfer/chevron-down.svg"
        /></label>
      </div>
      <label
        >Valor ({{ symbol }})<money-input
          v-model="form.amount"
          :currency="currency"
          outlined
          dense
          bg-color="white"
          aria-label="Valor da transferência"
      /></label>
      <p class="help">
        Disponível na {{ walletName(form.sourceWallet) }} ({{ currency }}):
        {{ money(available, currency) }}
      </p>
      <label>Moeda</label>
      <div class="currencies" role="group" aria-label="Moeda da transferência">
        <q-btn
          v-for="item in currencies"
          :key="item.code"
          flat
          no-caps
          :aria-label="item.code"
          :aria-pressed="!!item.id && form.currencyId === item.id"
          :disable="!item.id"
          :class="{ selected: form.currencyId === item.id }"
          @click="form.currencyId = item.id"
          ><span
            >{{ item.symbol }}<small>{{ item.code }}</small></span
          ></q-btn
        >
      </div>
      <p class="help">
        Toque na moeda para trocar. O símbolo do valor e o saldo disponível
        acompanham a moeda.
      </p>
      <label
        >Senha de Saque<q-input
          v-model="form.withdrawalPassword"
          type="password"
          outlined
          dense
          bg-color="white"
          autocomplete="off"
          aria-label="Senha de Saque"
      /></label>
      <q-btn
        flat
        dense
        no-caps
        class="help recovery"
        label="Esqueci minha Senha de Saque"
        @click="recovery = true"
      />
      <p v-if="wallets.state.error" role="alert">
        {{ wallets.state.error }}
        <q-btn
          flat
          dense
          no-caps
          label="Tentar novamente"
          @click="loadWallets"
        />
      </p>
      <section class="summary">
        <h3>Resumo da Operação</h3>
        <dl>
          <dt>Origem</dt>
          <dd>Sua {{ walletName(form.sourceWallet) }}</dd>
          <dt>Destino</dt>
          <dd>{{ walletName(form.destinationWallet) }} do destinatário</dd>
          <dt>Destinatário</dt>
          <dd>
            {{
              recipient
                ? `${recipient.displayName} · ${recipient.strategyId}`
                : "—"
            }}
          </dd>
          <dt>Moeda</dt>
          <dd>{{ currency }}</dd>
          <dt>Valor</dt>
          <dd>{{ money(form.amount, currency) }}</dd>
          <dt>Saldo da origem após a operação</dt>
          <dd>{{ money(balanceAfter(available, form.amount), currency) }}</dd>
          <dt>Prazo</dt>
          <dd>
            {{
              clientTransferDeadline(form.sourceWallet, form.destinationWallet)
            }}
          </dd>
          <dt>Data de solicitação</dt>
          <dd>{{ requestDate }}</dd>
        </dl>
      </section>
      <p v-if="error" role="alert">{{ error }}</p>
      <footer>
        <q-btn
          flat
          no-caps
          icon="img:/icons/wallet-transfer/arrow-left.svg"
          label="Voltar"
          @click="emit('close')"
        /><q-btn
          type="submit"
          color="primary"
          no-caps
          label="Confirmar transferência"
          :loading="busy"
          :disable="!canSubmit"
        />
      </footer>
    </q-form>
    <q-dialog v-model="recovery"
      ><q-card class="tool q-pa-lg"
        ><h3>Recuperar Senha de Saque</h3>
        <p>
          Entre em contato com o atendimento para verificar o acesso à sua
          conta.
        </p>
        <q-btn flat no-caps label="Fechar" v-close-popup /></q-card
    ></q-dialog>
  </q-card>
</template>
<script setup>
import { computed, onScopeDispose, reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import MoneyInput from "src/system/components/form/MoneyInput.vue";
import {
  clientApi,
  captureClientSession,
  assertClientSessionCurrent,
} from "src/services/clientApi";
import { financeGet, money } from "src/services/financeService";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { WALLET_CURRENCIES, balanceAfter } from "src/services/walletModel";
import {
  transferWallets,
  normalizeStrategyId,
  transferAvailable,
  clientTransferDeadline,
  clientTransferPayload,
  clientTransferError,
  recipientLookupError,
  createTransferIntent,
} from "src/services/clientTransferModel";
import { onboardingBlockMessage } from "src/services/onboardingBlock";
const emit = defineEmits(["own", "close", "completed"]);
const form = reactive({
  recipientStrategyId: "",
  sourceWallet: "Free",
  destinationWallet: "Free",
  currencyId: null,
  amount: 0,
  withdrawalPassword: "",
});
const wallets = useFinanceResource(),
  recipient = ref(null),
  recipientLoading = ref(false),
  recipientError = ref(""),
  error = ref(""),
  busy = ref(false),
  recovery = ref(false);
const session = captureClientSession();
let active = true,
  lookupVersion = 0,
  timer;
const currencies = computed(() =>
  WALLET_CURRENCIES.map((definition) => {
    const wallet = (wallets.state.data || []).find(
      (w) => w.currencyIsoCode === definition.code && w.currencyId,
    );
    return {
      id: wallet?.currencyId || null,
      code: definition.code,
      symbol: definition.symbol,
    };
  }),
);
const currency = computed(
  () => currencies.value.find((c) => c.id === form.currencyId)?.code || "BRL",
);
const symbol = computed(
  () =>
    currencies.value.find((c) => c.id === form.currencyId)?.symbol ||
    currency.value,
);
const available = computed(() =>
  wallets.state.data
    ? transferAvailable(wallets.state.data, form.currencyId, form.sourceWallet)
    : null,
);
const walletName = (type) =>
  transferWallets.find((w) => w.value === type)?.label || "—";
const requestDate = new Intl.DateTimeFormat("pt-BR").format(new Date());
const canSubmit = computed(() => {
  if (
    busy.value ||
    recipientLoading.value ||
    wallets.state.loading ||
    wallets.state.error
  )
    return false;
  try {
    clientTransferPayload(form, recipient.value, wallets.state.data);
    return true;
  } catch {
    return false;
  }
});
async function loadWallets() {
  await wallets.load(async () => {
    const result = await financeGet("client/wallets");
    assertClientSessionCurrent(session);
    if (!Array.isArray(result.data))
      throw new Error("Carteiras indisponíveis.");
    return result.data;
  });
  if (
    active &&
    (!form.currencyId ||
      !currencies.value.some((c) => c.id === form.currencyId))
  )
    form.currencyId = currencies.value.find((c) => c.id)?.id || null;
}
watch(
  () => form.recipientStrategyId,
  (id) => {
    clearTimeout(timer);
    const version = ++lookupVersion;
    recipient.value = null;
    recipientError.value = "";
    recipientLoading.value = Boolean(normalizeStrategyId(id));
    if (!recipientLoading.value) return;
    timer = setTimeout(async () => {
      try {
        const result = await financeGet(
          "client/transfer-recipients/" +
            encodeURIComponent(normalizeStrategyId(id)),
        );
        assertClientSessionCurrent(session);
        if (active && version === lookupVersion) recipient.value = result.data;
      } catch (e) {
        if (active && version === lookupVersion)
          recipientError.value =
            onboardingBlockMessage(e) || recipientLookupError(e);
      } finally {
        if (active && version === lookupVersion) recipientLoading.value = false;
      }
    }, 450);
  },
);
const intent = createTransferIntent(async (payload, key) => {
  assertClientSessionCurrent(session);
  const { data } = await clientApi.post(
    "/api/v1/client/transactions/transfers",
    payload,
    { headers: { "Idempotency-Key": key } },
  );
  assertClientSessionCurrent(session);
  if (data?.success === false)
    throw Object.assign(new Error(), { response: { data, status: 400 } });
  return data.data;
});
const $q = useQuasar();
async function confirm() {
  if (busy.value) return;
  error.value = "";
  try {
    const payload = clientTransferPayload(
      form,
      recipient.value,
      wallets.state.data,
    );
    busy.value = true;
    await intent.submit(payload);
    if (active) {
      $q.notify({ type: "positive", message: "Transferência solicitada." });
      emit("completed");
    }
  } catch (e) {
    if (active)
      error.value = onboardingBlockMessage(e) || clientTransferError(e);
  } finally {
    form.withdrawalPassword = "";
    busy.value = false;
  }
}
loadWallets();
onScopeDispose(() => {
  active = false;
  lookupVersion++;
  clearTimeout(timer);
  form.withdrawalPassword = "";
  wallets.reset();
});
</script>
<style scoped>
.client-transfer {
  width: 572px;
  max-width: calc(100vw - 32px);
  color: white;
  border: 2px solid #2cb7ff;
  border-radius: 8px;
  background: linear-gradient(224deg, #0000003d, #00000014, #0000000a);
  box-shadow: 0 0 48px 12px #00a3ff3d;
  backdrop-filter: blur(16px);
  padding: 24px 30px 16px;
}
h2 {
  font:
    700 24px/1.5 Inter,
    sans-serif;
  margin: 0 0 8px;
}
header p {
  color: #bdbdbd;
  font:
    400 17px/1.35 Inter,
    sans-serif;
  margin: 0 0 32px;
}
label {
  display: block;
  font:
    500 14px/1.35 Inter,
    sans-serif;
  margin-top: 24px;
}
label :deep(.q-field) {
  margin-top: 8px;
}
.columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.client-transfer :deep(.q-field--dense .q-field__control),
.client-transfer :deep(.q-field--dense .q-field__marginal) {
  height: 32px;
  min-height: 32px;
}
.client-transfer :deep(.q-field--dense .q-field__native) {
  min-height: 32px;
}
.columns label {
  min-width: 0;
}
.client-transfer :deep(.q-select__dropdown-icon) {
  width: 16px;
  height: 16px;
  font-size: 16px;
}
.client-transfer :deep(.q-field__native),
.client-transfer :deep(.q-field__input) {
  color: #1a1a1a;
}
.help {
  font:
    400 13px/1.35 Inter,
    sans-serif;
  color: #dcdcdc;
  margin: 4px 0 0;
  overflow-wrap: anywhere;
}
.recovery {
  padding-left: 0;
}
.target-toggle,
.currencies {
  display: flex;
  gap: 4px;
  width: fit-content;
  max-width: 100%;
  background: #ffffff0f;
  border: 1px solid #ffffff1f;
  padding: 4px;
  border-radius: 999px;
  margin-top: 8px;
}
.target-toggle .q-btn {
  border-radius: 999px;
  background: #ffffff14;
  font-size: 13px;
}
.selected {
  background: #00a3ff !important;
  outline: 1.5px solid #ffffffe6;
  outline-offset: -1.5px;
}
.currencies {
  flex-wrap: wrap;
}
.currencies .q-btn {
  min-width: 44px;
  min-height: 44px;
  border-radius: 50%;
  padding: 0;
  background: #ffffff14;
}
small {
  display: block;
  font-size: 8px;
}
.summary {
  margin-top: 32px;
  padding: 12px;
  border-top: 1px solid #ffffff14;
  background: #ffffff0a;
  border-radius: 8px;
}
h3 {
  font:
    500 17px/1.35 Inter,
    sans-serif;
  margin: 0 0 24px;
}
dl {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  font-size: 14px;
}
dt {
  color: #bdbdbd;
}
dd {
  text-align: right;
  margin: 0;
  overflow-wrap: anywhere;
}
footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
}
@media (max-width: 599px) {
  .client-transfer {
    padding: 24px 16px 16px;
  }
  .columns {
    grid-template-columns: 1fr;
    gap: 0;
  }
  footer {
    flex-wrap: wrap;
  }
}
</style>
