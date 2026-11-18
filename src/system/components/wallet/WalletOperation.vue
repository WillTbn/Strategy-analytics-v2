<template>
  <wallet-withdrawal
    v-if="mode === 'withdrawal'"
    :model="model"
    :submit-operation="submitOperation"
    @close="emit('close')"
    @completed="emit('completed')"
    @busy="emit('busy', $event)"
    @state="emit('state', $event)"
  />
  <client-transfer-operation
    v-else-if="mode === 'transfer' && otherClient"
    @own="otherClient = false"
    @close="emit('close')"
    @completed="emit('completed')"
  />
  <q-card v-else class="wallet-operation">
    <q-form @submit="confirm" :inert="busy || undefined">
      <header>
        <q-icon
          v-if="mode === 'deposit'"
          name="south"
          size="28px"
          class="operation-icon"
        />
        <h2>{{ titles[mode] }}</h2>
        <p>{{ descriptions[mode] }}</p>
      </header>
      <template v-if="mode === 'transfer'">
        <label>Enviar para</label>
        <div class="target-toggle" role="group" aria-label="Enviar para">
          <q-btn
            flat
            no-caps
            label="Minhas carteiras"
            class="selected"
            aria-pressed="true"
          />
          <q-btn
            flat
            no-caps
            label="Outro cliente"
            @click="otherClient = true"
          />
        </div>
        <div class="operation-columns">
          <label
            >Carteira de origem<q-select
              v-model="from"
              :options="walletOptions"
              emit-value
              map-options
              outlined
              dense
              aria-label="Carteira de origem"
          /></label>
          <label
            >Carteira de destino<q-select
              :model-value="to"
              :options="walletOptions"
              emit-value
              map-options
              outlined
              dense
              aria-label="Carteira de destino"
              @update:model-value="
                from = $event === 'deposit' ? 'strategy' : 'deposit'
              "
          /></label>
        </div>
      </template>
      <div>
        <label
          >{{
            mode === "deposit"
              ? "Valor depositado"
              : mode === "transfer"
                ? "Valor da transferência"
                : "Valor do saque"
          }}
          ({{ currency }})
          <money-input
            v-model="amount"
            :currency="currency"
            outlined
            dense
            aria-label="Valor da operação"
            lazy-rules="ondemand"
            :rules="[(v) => Number(v) > 0 || 'Informe um valor positivo']"
          />
        </label>
      </div>
      <p v-if="mode === 'deposit'" class="field-help">
        Mínimo: {{ walletMoney(instructions?.minimum, currency)
        }}<span v-if="instructions?.minimum == null">
          · aguardando informação para esta moeda</span
        >
      </p>
      <p v-else class="field-help">
        Disponível na {{ fromLabel }} ({{ currency }}):
        {{ walletMoney(available, currency) }}
      </p>
      <section v-if="mode === 'deposit'" class="deposit-instructions">
        <template v-if="currency === 'BRL'">
          <div class="pix-code">
            <qrcode-vue
              v-if="instructions?.pixPayload"
              :value="instructions.pixPayload"
              :size="160"
              level="M"
            />
            <p v-else>
              O QR Code Pix será exibido quando as instruções de depósito
              estiverem disponíveis.
            </p>
          </div>
          <p class="bank-value">
            {{ instructions?.pixKey || "Chave Pix ainda indisponível" }}
          </p>
          <q-btn
            outline
            color="primary"
            no-caps
            label="Copiar chave Pix"
            :disable="!instructions?.pixKey"
            @click="copy(instructions.pixKey)"
          />
        </template>
        <template v-else>
          <dl>
            <template v-for="field in bankFields" :key="field.key"
              ><dt>{{ field.label }}</dt>
              <dd>
                {{ instructions?.[field.key] || "Ainda indisponível" }}
              </dd></template
            >
          </dl>
          <q-btn
            outline
            color="primary"
            no-caps
            label="Copiar dados bancários"
            :disable="!bankInstructionsReady"
            @click="
              copy(
                bankFields
                  .map((field) => field.label + ': ' + instructions[field.key])
                  .join('\n'),
              )
            "
          />
        </template>
      </section>
      <div
        v-if="mode !== 'withdrawal'"
        class="currency-pills"
        aria-label="Moeda da operação"
      >
        <button
          v-for="item in WALLET_CURRENCIES"
          :key="item.code"
          type="button"
          :aria-label="item.code + ' · ' + item.name"
          :aria-pressed="currency === item.code"
          :class="{ selected: currency === item.code }"
          @click="currency = item.code"
        >
          <strong>{{ item.symbol }}</strong
          ><small>{{ item.code }}</small>
        </button>
      </div>
      <section
        v-if="mode !== 'deposit'"
        class="operation-summary"
        aria-label="Resumo da Operação"
      >
        <h3>Resumo da Operação</h3>
        <dl>
          <dt>Carteira de origem</dt>
          <dd>{{ fromLabel }} ({{ currency }})</dd>
          <dt>Carteira de destino</dt>
          <dd>{{ toLabel }}</dd>
          <dt>Moeda</dt>
          <dd>{{ currency }}</dd>
          <dt>Valor</dt>
          <dd>{{ walletMoney(amount, currency) }}</dd>
          <dt>Saldo após a operação</dt>
          <dd>{{ walletMoney(balanceAfter(available, amount), currency) }}</dd>
          <template v-if="mode === 'transfer'"
            ><dt>Rendimento no destino</dt>
            <dd>
              {{
                to === "strategy"
                  ? "A partir do próximo dia útil"
                  : "Sem rendimento"
              }}
            </dd></template
          >
          <dt>Prazo</dt>
          <dd>
            {{ transferDeadline(from) }}
          </dd>
          <dt>Data da solicitação</dt>
          <dd>{{ requestDate }}</dd>
        </dl>
        <q-btn
          v-if="mode === 'transfer' && to === 'strategy'"
          flat
          dense
          no-caps
          label="Como funciona o rendimento?"
          class="field-help"
          ><q-tooltip style="max-width: 320px">{{
            YIELD_DESCRIPTION
          }}</q-tooltip></q-btn
        >
      </section>
      <p v-if="!submitOperation" class="integration-note" role="status">
        A confirmação desta operação ainda não está disponível. Você pode
        conferir os campos e o resumo antes da liberação.
      </p>
      <p v-if="error" role="alert">{{ error }}</p>
      <footer>
        <q-btn
          flat
          no-caps
          icon="west"
          label="Voltar"
          @click="emit('close')"
        /><q-btn
          color="primary"
          no-caps
          :label="confirmLabels[mode]"
          type="submit"
          :loading="busy"
          :disable="!submitOperation || !!validation"
        />
      </footer>
    </q-form>
  </q-card>
</template>
<script setup>
import { computed, ref, watch } from "vue";
import QrcodeVue from "qrcode.vue";
import { copyToClipboard, useQuasar } from "quasar";
import MoneyInput from "src/system/components/form/MoneyInput.vue";
import WalletWithdrawal from "./WalletWithdrawal.vue";
import ClientTransferOperation from "./ClientTransferOperation.vue";
import {
  WALLET_CURRENCIES,
  YIELD_DESCRIPTION,
  walletBalance,
  walletMoney,
  balanceAfter,
  transferDeadline,
  validateWalletOperation,
} from "src/services/walletModel";
const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ["deposit", "transfer", "withdrawal"].includes(value),
  },
  model: { type: Object, default: null },
  submitOperation: { type: Function, default: null },
});
const emit = defineEmits(["close", "completed", "busy", "state"]);
const otherClient = ref(false);
const titles = {
  deposit: "Depósito",
  transfer: "Transferência entre carteiras",
  withdrawal: "Saque",
};
const descriptions = {
  deposit:
    "Deposite de uma conta de sua titularidade para a Carteira de Depósito. O crédito aguarda confirmação administrativa.",
  transfer:
    "Transfira entre suas carteiras na mesma moeda. Depósito → Strategy é imediato; o retorno leva até 30 dias corridos.",
  withdrawal:
    "Sai da Carteira de Depósito e cai na sua conta bancária (mesmo titular, mesma moeda) em até 1 dia útil. Valores na Carteira Strategy precisam ser transferidos antes (até 30 dias).",
};
const confirmLabels = {
  deposit: "Concluir Depósito",
  transfer: "Confirmar transferência",
  withdrawal: "Solicitar saque",
};
const currency = ref(
  WALLET_CURRENCIES.some(
    (item) => item.code === props.model?.lastDepositCurrency,
  )
    ? props.model.lastDepositCurrency
    : "BRL",
);
const from = ref("deposit"),
  amount = ref(0),
  error = ref(""),
  busy = ref(false);
const requestDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
}).format(new Date());
const walletOptions = [
  { label: "Carteira de Depósito", value: "deposit" },
  { label: "Carteira Strategy", value: "strategy" },
];
const to = computed(() => (from.value === "deposit" ? "strategy" : "deposit"));
const fromLabel = computed(
  () =>
    walletOptions.find(
      (item) =>
        item.value === (props.mode === "withdrawal" ? "deposit" : from.value),
    ).label,
);
const toLabel = computed(
  () => walletOptions.find((item) => item.value === to.value).label,
);
const available = computed(() =>
  walletBalance(
    props.model,
    props.mode === "withdrawal" ? "deposit" : from.value,
    currency.value,
  ),
);
const instructions = computed(
  () => props.model?.instructions?.[currency.value],
);
watch(currency, () => {
  error.value = "";
});
const bankFields = [
  { key: "beneficiary", label: "Beneficiário" },
  { key: "bank", label: "Banco" },
  { key: "swift", label: "SWIFT / BIC" },
  { key: "account", label: "Conta / IBAN" },
  { key: "reference", label: "Referência" },
  { key: "clearingTime", label: "Prazo de compensação" },
];
const bankInstructionsReady = computed(() =>
  bankFields.every((field) => instructions.value?.[field.key]),
);
const validation = computed(() =>
  validateWalletOperation({
    mode: props.mode,
    amount: amount.value,
    currency: currency.value,
    from: from.value,
    model: props.model,
  }),
);
const $q = useQuasar();
async function copy(text) {
  try {
    await copyToClipboard(text);
    $q.notify({ message: "Copiado", type: "positive" });
  } catch {
    error.value = "Não foi possível copiar. Tente novamente.";
  }
}
async function confirm() {
  if (busy.value || !props.submitOperation) return;
  if (validation.value) {
    error.value = validation.value;
    return;
  }
  busy.value = true;
  error.value = "";
  try {
    await props.submitOperation({
      mode: props.mode,
      currency: currency.value,
      amount: amount.value,
      from: props.mode === "withdrawal" ? "deposit" : from.value,
      to: to.value,
    });
    emit("completed");
  } catch (e) {
    error.value =
      !e.response && !e.config
        ? e.message
        : "Não foi possível concluir a operação. Confira os dados e tente novamente.";
  } finally {
    busy.value = false;
  }
}
</script>
<style scoped>
.target-toggle {
  display: flex;
  gap: 4px;
  width: fit-content;
  border: 1px solid #ffffff1f;
  background: #ffffff0f;
  padding: 4px;
  border-radius: 999px;
  margin: 8px 0 24px;
}
.target-toggle .q-btn {
  border-radius: 999px;
  font-size: 13px;
  background: #ffffff14;
}
.target-toggle .selected {
  background: #00a3ff;
  outline: 1.5px solid #ffffffe6;
  outline-offset: -1.5px;
}
.wallet-operation {
  width: 572px;
  max-width: calc(100vw - 32px);
  color: #fafafa;
  border: 2px solid #2cb7ff;
  border-radius: 8px;
  background: linear-gradient(215deg, rgba(0, 0, 0, 0.24), rgba(0, 0, 0, 0.08));
  box-shadow: 0 0 48px 12px #00a3ff25;
  backdrop-filter: blur(16px);
  padding: 28px 30px 16px;
}
h2 {
  font:
    700 24px/1.3 Roboto,
    sans-serif;
  margin: 0 0 10px;
}
header p {
  font:
    400 17px/1.4 Roboto,
    sans-serif;
  color: #bdbdbd;
  margin: 0 0 28px;
}
.operation-icon {
  padding: 10px;
  box-sizing: content-box;
  background: #ffffff10;
  border-radius: 4px;
  margin-bottom: 16px;
}
label {
  display: block;
  font-size: 14px;
  font-weight: 400;
  margin-top: 20px;
}
label :deep(.q-field) {
  margin-top: 8px;
}
.operation-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.field-help {
  color: #bdbdbd;
  font-size: 13px;
  margin-top: 4px;
}
.currency-pills {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 6px;
  margin: 28px auto;
  width: fit-content;
  max-width: 100%;
  flex-wrap: wrap;
  border: 1px solid #ffffff20;
  border-radius: 32px;
  background: #ffffff08;
}
.currency-pills button {
  cursor: pointer;
  width: 44px;
  height: 44px;
  border: 1px solid transparent;
  border-radius: 50%;
  color: #dcdcdc;
  background: #ffffff12;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.currency-pills button.selected {
  background: #00a3ff;
  border-color: white;
  color: white;
  box-shadow: 0 0 16px #00a3ff80;
}
.currency-pills button:focus-visible {
  outline: 2px solid white;
  outline-offset: 3px;
}
.currency-pills small {
  font-size: 9px;
}
.operation-summary {
  background: #ffffff0f;
  border-radius: 8px;
  padding: 12px;
  margin-top: 30px;
}
h3 {
  margin: 0 0 16px;
  font:
    500 17px/1.4 Roboto,
    sans-serif;
}
dl {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  margin: 0;
  font-size: 14px;
}
dt {
  color: #a9a9a9;
}
dd {
  margin: 0;
  text-align: right;
  overflow-wrap: anywhere;
}
.deposit-instructions {
  margin-top: 32px;
  text-align: center;
}
.deposit-instructions dl {
  margin-bottom: 24px;
  text-align: left;
}
.pix-code {
  margin: 0 auto 16px;
  max-width: 240px;
}
.bank-value {
  overflow-wrap: anywhere;
  color: #bdbdbd;
}
.integration-note {
  color: #bdbdbd;
  font-size: 13px;
  margin: 24px 0 12px;
}
.forgot-password {
  color: #bdbdbd;
}
footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
}
footer :deep(.q-btn) {
  min-height: 40px;
}
@media (max-width: 480px) {
  .wallet-operation {
    padding: 22px 16px 16px;
  }
  .operation-columns {
    grid-template-columns: 1fr;
    gap: 0;
  }
  dl {
    gap: 12px;
    font-size: 12px;
  }
}
.wallet-operation :deep(.q-field__control) {
  background: #fff;
  color: #333;
  border-radius: 4px;
  min-height: 32px;
  height: 32px;
}
.wallet-operation :deep(.q-field__native),
.wallet-operation :deep(.q-field__input),
.wallet-operation :deep(.q-field__marginal) {
  color: #666;
  font-weight: 400;
  min-height: 32px;
}
.wallet-operation :deep(.q-field__marginal) {
  height: 32px;
}
.wallet-operation :deep(.q-field__bottom) {
  padding-top: 4px;
}
</style>

<style scoped>
.wallet-password-recovery {
  width: 512px;
  max-width: calc(100vw - 32px);
}
.wallet-password-recovery :deep(.col-md-3) {
  width: 100%;
}
</style>
