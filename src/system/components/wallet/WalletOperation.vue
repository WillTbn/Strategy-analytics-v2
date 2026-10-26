<template>
  <q-card class="wallet-operation">
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
      <div :class="{ 'operation-columns': mode === 'withdrawal' }">
        <label v-if="mode === 'withdrawal'"
          >Moeda<q-select
            v-model="currency"
            :options="currencyOptions"
            emit-value
            map-options
            outlined
            dense
            aria-label="Moeda do saque"
        /></label>
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
      <template v-if="mode === 'withdrawal'">
        <label
          >Conta bancária de destino
          <q-select
            v-model="bankId"
            :options="bankOptions"
            emit-value
            map-options
            outlined
            dense
            :loading="banks.state.loading"
            aria-label="Conta bancária de destino"
          >
            <template #option="scope"
              ><q-item v-bind="scope.itemProps"
                ><q-item-section>{{ scope.opt.label }}</q-item-section
                ><q-item-section side
                  ><q-badge>{{
                    scope.opt.currency || "Moeda não informada"
                  }}</q-badge></q-item-section
                ></q-item
              ></template
            >
            <template #after-options
              ><q-item
                clickable
                :to="{ name: 'profile', query: { tab: 'bank', action: 'add' } }"
                @click="emit('close')"
                ><q-item-section
                  >+ Adicionar conta bancária</q-item-section
                ></q-item
              ></template
            >
            <template #no-option
              ><q-item
                ><q-item-section
                  >Nenhuma conta disponível</q-item-section
                ></q-item
              ></template
            >
          </q-select>
        </label>
        <p v-if="banks.state.error" role="alert">
          {{ banks.state.error }}
          <q-btn
            flat
            dense
            no-caps
            label="Tentar novamente"
            @click="loadBanks"
          />
        </p>
        <label
          >Senha de Saque<q-input
            v-model="password"
            type="password"
            autocomplete="off"
            outlined
            dense
            aria-label="Senha de Saque"
        /></label>
        <q-btn
          flat
          no-caps
          dense
          class="forgot-password"
          label="Esqueci minha Senha de Saque"
          @click="recoveryOpen = true"
        />
      </template>
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
          <dt>
            {{
              mode === "transfer" ? "Carteira de destino" : "Conta de destino"
            }}
          </dt>
          <dd>
            {{
              mode === "transfer"
                ? toLabel
                : bankOptions.find((item) => item.value === bankId)?.label ||
                  "Selecione uma conta"
            }}
          </dd>
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
            {{
              mode === "withdrawal" ? "Até 1 dia útil" : transferDeadline(from)
            }}
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
    <q-dialog v-model="recoveryOpen"
      ><q-card class="tool q-pa-lg"
        ><h3>Recuperar Senha de Saque</h3>
        <p>
          A recuperação da Senha de Saque ainda não está disponível. Sua senha
          de login é independente.
        </p>
        <q-btn v-close-popup flat no-caps label="Voltar" /></q-card
    ></q-dialog>
  </q-card>
</template>
<script setup>
import { computed, onScopeDispose, ref, watch } from "vue";
import QrcodeVue from "qrcode.vue";
import { copyToClipboard, useQuasar } from "quasar";
import MoneyInput from "src/system/components/form/MoneyInput.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { listAllClientBanks } from "src/services/clientProfileService";
import { financeGet } from "src/services/financeService";
import {
  WALLET_CURRENCIES,
  readWalletBankAccounts,
  YIELD_DESCRIPTION,
  bankCurrency,
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
const emit = defineEmits(["close", "completed"]);
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
  bankId = ref(null),
  password = ref(""),
  error = ref(""),
  busy = ref(false),
  recoveryOpen = ref(false);
const requestDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
}).format(new Date());
const walletOptions = [
  { label: "Carteira de Depósito", value: "deposit" },
  { label: "Carteira Strategy", value: "strategy" },
];
const currencyBadge = (code) => {
  const item = WALLET_CURRENCIES.find((item) => item.code === code);
  return item ? item.symbol + " · " + item.code : "Moeda não informada";
};
const currencyOptions = WALLET_CURRENCIES.map((item) => ({
  label: item.code + " · " + item.name,
  value: item.code,
}));
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
const banks = useFinanceResource();
const bankCatalog = useFinanceResource();
const loadBankCatalog = () => bankCatalog.load(listAllClientBanks);
let bankRevision = 0;
const loadBanks = () => {
  const revision = ++bankRevision;
  return banks.load(() =>
    readWalletBankAccounts(
      (page) =>
        financeGet("client/profile/bank-accounts", { page, pageSize: 100 }),
      () => revision === bankRevision,
    ),
  );
};
const bankOptions = computed(() =>
  (banks.state.data || []).map((bank) => ({
    value: bank.id,
    label:
      (bank.bankName ||
        bankCatalog.state.data?.find((item) => item.id === bank.bankId)?.name ||
        "Banco não informado") +
      (bank.branch ? " · Ag. " + bank.branch : "") +
      " · " +
      (bank.accountNumberMasked || "Conta protegida"),
    currency: bankCurrency(bank),
    disable: bank.status !== "Active" || !bankCurrency(bank),
  })),
);
const bank = computed(() =>
  banks.state.data?.find((item) => item.id === bankId.value),
);
watch(bankId, () => {
  if (bankCurrency(bank.value)) currency.value = bankCurrency(bank.value);
});
watch(currency, () => {
  if (bank.value && bankCurrency(bank.value) !== currency.value)
    bankId.value = null;
  error.value = "";
});
watch(
  () => props.mode,
  (mode) => {
    password.value = "";
    if (mode === "withdrawal") {
      loadBanks();
      loadBankCatalog();
    }
  },
  { immediate: true },
);
onScopeDispose(() => {
  password.value = "";
  bankRevision++;
  banks.reset();
  bankCatalog.reset();
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
    bank: bank.value,
    password: password.value,
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
      bankId: bankId.value,
      withdrawalPassword:
        props.mode === "withdrawal" ? password.value : undefined,
    });
    emit("completed");
  } catch {
    error.value =
      "Não foi possível concluir a operação. Confira os dados e tente novamente.";
  } finally {
    password.value = "";
    busy.value = false;
  }
}
</script>
<style scoped>
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
