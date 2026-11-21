<template>
  <div class="withdrawal-shell">
    <aside
      v-if="step === 'form' || step === 'review'"
      class="withdrawal-notice"
    >
      <img :src="assets.imgIconJamIconsOutlineLogosInfo" alt="" />
      <p>
        O saque sai da Carteira de Depósito e cai na sua conta em até 1 dia
        útil. Valores na Carteira Strategy precisam ser transferidos antes (até
        30 dias).
      </p>
    </aside>
    <q-card
      class="tool withdrawal-card"
      :class="{ 'withdrawal-card--success': step === 'success' }"
    >
      <q-form
        v-if="step !== 'success'"
        @submit="next"
        :inert="busy || undefined"
      >
        <div class="withdrawal-content">
          <header>
            <span class="withdrawal-icon"
              ><img :src="assets.imgArrowUp" alt=""
            /></span>
            <h2>Saque</h2>
          </header>
          <div v-if="step === 'form'" class="withdrawal-fields">
            <label-form text-label="Moeda"
              ><q-select
                v-model="currency"
                outlined
                dense
                :options="currencies"
                emit-value
                map-options
                aria-label="Moeda do saque"
                :dropdown-icon="'img:' + assets.imgChevronDown"
                @update:model-value="changeCurrency"
            /></label-form>
            <label-form text-label="Conta bancária de destino">
              <q-select
                v-model="bankId"
                :options="bankOptions"
                outlined
                dense
                emit-value
                map-options
                aria-label="Conta bancária de destino"
                :display-value="selectedOption?.label || 'Selecione uma conta'"
                :loading="bankState.loading"
                :disable="bankState.loading"
                :dropdown-icon="'img:' + assets.imgChevronDown"
                popup-content-class="withdrawal-bank-menu"
                @popup-show="bankOpen = true"
                @popup-hide="bankOpen = false"
                @update:model-value="selectBank"
              >
                <template #selected
                  ><span
                    class="withdrawal-bank-selected"
                    :title="selectedOption?.label"
                    >{{ selectedOption?.label || "Selecione uma conta" }}</span
                  ><span
                    v-if="selectedOption"
                    class="withdrawal-bank-currency"
                    >{{ currencyBadge(selectedOption.currency) }}</span
                  ></template
                >
                <template #option="scope"
                  ><q-item
                    v-bind="scope.itemProps"
                    class="withdrawal-bank-option"
                    :class="{ selected: scope.selected }"
                    ><q-item-section>{{ scope.opt.label }}</q-item-section
                    ><q-item-section side
                      ><span class="withdrawal-bank-currency">{{
                        currencyBadge(scope.opt.currency)
                      }}</span></q-item-section
                    ><q-item-section v-if="scope.selected" side
                      ><span class="withdrawal-bank-check" aria-hidden="true"
                        >✓</span
                      ></q-item-section
                    ></q-item
                  ></template
                >
                <template #after-options
                  ><q-item
                    clickable
                    class="withdrawal-add-bank"
                    @click="$emit('add-bank')"
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
                  ><q-item
                    clickable
                    class="withdrawal-add-bank"
                    @click="$emit('add-bank')"
                    ><q-item-section
                      >+ Adicionar conta bancária</q-item-section
                    ></q-item
                  ></template
                >
              </q-select>
            </label-form>
            <p v-if="bankState.error" class="withdrawal-error" role="alert">
              {{ bankState.error }}
              <q-btn
                flat
                dense
                no-caps
                label="Tentar novamente"
                @click="$emit('retry-banks')"
              />
            </p>
            <label-form
              :text-label="'Valor do saque (' + currencyDefinition.symbol + ')'"
              ><money-input
                v-model="amount"
                :currency="currency"
                outlined
                dense
                aria-label="Valor do saque"
                :rules="[(v) => Number(v) > 0 || 'Informe um valor positivo']"
                lazy-rules="ondemand"
              /><small class="withdrawal-available"
                >Disponível na Carteira de Depósito ({{ currency }}):
                {{ walletMoney(available, currency) }}</small
              ></label-form
            >
          </div>
          <section
            v-else-if="step === 'review'"
            class="withdrawal-review"
            aria-label="Resumo da Operação"
          >
            <h3>Resumo da Operação</h3>
            <dl>
              <dt>Carteira de origem</dt>
              <dd>Carteira de Depósito ({{ snapshot.currency }})</dd>
              <dt>Valor do Saque</dt>
              <dd>{{ walletMoney(snapshot.amount, snapshot.currency) }}</dd>
              <dt>Saldo da Carteira de Depósito após a operação</dt>
              <dd>{{ walletMoney(snapshot.after, snapshot.currency) }}</dd>
              <dt>Data de Solicitação</dt>
              <dd>{{ snapshot.requestedDate }}</dd>
              <dt>Conta Bancária de Destino</dt>
              <dd>{{ snapshot.bank.name }}</dd>
              <dt>Agência</dt>
              <dd>{{ snapshot.bank.branch }}</dd>
              <dt>Conta</dt>
              <dd>{{ snapshot.bank.account }}</dd>
              <dt>Prazo para a Operação</dt>
              <dd class="withdrawal-deadline">1 dia útil</dd>
            </dl>
          </section>
          <div v-else class="withdrawal-fields">
            <p class="withdrawal-password-intro">
              Forneça sua Senha de Saque para prosseguir
            </p>
            <div class="withdrawal-password-group">
              <label-form text-label="Senha de Saque"
                ><q-input
                  v-model="password"
                  outlined
                  dense
                  :type="passwordVisible ? 'text' : 'password'"
                  autocomplete="off"
                  placeholder="Digite sua Senha de Saque"
                  aria-label="Senha de Saque"
                  ><template #append
                    ><button
                      type="button"
                      class="withdrawal-password-eye"
                      :aria-label="
                        passwordVisible
                          ? 'Ocultar Senha de Saque'
                          : 'Mostrar Senha de Saque'
                      "
                      :aria-pressed="passwordVisible"
                      @click="passwordVisible = !passwordVisible"
                    >
                      <img
                        :src="assets.imgEye"
                        alt=""
                      /></button></template></q-input
              ></label-form>
              <q-btn
                flat
                dense
                no-caps
                label="Esqueci minha Senha de Saque"
                class="withdrawal-recovery"
                @click="$emit('recover')"
              />
            </div>
          </div>
          <p v-if="error" role="alert" class="withdrawal-error">{{ error }}</p>
        </div>
        <footer :class="{ 'withdrawal-footer--first': step === 'form' }">
          <q-btn
            v-if="step !== 'form'"
            flat
            no-caps
            class="withdrawal-back"
            label="Voltar"
            :disable="busy"
            @click="back"
            ><img :src="assets.imgArrowLeft1" alt=""
          /></q-btn>
          <q-btn
            no-caps
            type="submit"
            class="withdrawal-next"
            label="Continuar"
            :disable="!canContinue"
            :loading="busy"
            ><img :src="assets.imgIconJamIconsOutlineLogosArrowRight" alt=""
          /></q-btn>
        </footer>
      </q-form>
      <template v-else>
        <div class="withdrawal-success-content">
          <div class="withdrawal-success-art">
            <img :src="assets.imgWhisk916E26874C" alt="" />
          </div>
          <div class="withdrawal-success-copy">
            <h2>Saque solicitado com sucesso!</h2>
            <p>
              Em até 1 dia útil o valor cai na sua conta bancária.<br />Você
              será notificado de quaisquer atualizações.
            </p>
          </div>
        </div>
        <footer class="withdrawal-success-footer">
          <q-btn
            no-caps
            class="withdrawal-next"
            label="Ir para a Home"
            @click="$emit('completed')"
            ><img :src="assets.imgIconJamIconsOutlineLogosArrowRight" alt=""
          /></q-btn>
        </footer>
      </template>
    </q-card>
  </div>
</template>
<script setup>
import { computed, ref, watch, onScopeDispose } from "vue";
import LabelForm from "src/system/components/form/LabelForm.vue";
import MoneyInput from "src/system/components/form/MoneyInput.vue";
import {
  WALLET_CURRENCIES,
  bankCurrency,
  walletBalance,
  walletMoney,
} from "src/services/walletModel";
import {
  withdrawalFormError,
  withdrawalSnapshot,
  currentWithdrawal,
  protectedAccount,
} from "src/services/withdrawalFlow";
import { withdrawalAssets } from "src/services/withdrawalAssets";
const props = defineProps({
  model: { type: Object, default: null },
  banks: { type: Array, default: () => [] },
  bankState: { type: Object, default: () => ({ loading: false, error: "" }) },
  submitOperation: { type: Function, default: null },
});
const emit = defineEmits([
  "completed",
  "busy",
  "state",
  "add-bank",
  "recover",
  "retry-banks",
]);
const step = ref("form"),
  currency = ref(
    WALLET_CURRENCIES.some((c) => c.code === props.model?.lastDepositCurrency)
      ? props.model.lastDepositCurrency
      : "BRL",
  ),
  amount = ref(0),
  bankId = ref(null),
  password = ref(""),
  passwordVisible = ref(false),
  bankOpen = ref(false),
  error = ref(""),
  busy = ref(false),
  snapshot = ref(null);
const frameId = computed(() =>
  step.value === "form" && bankOpen.value
    ? "251:28194"
    : {
        form: "1:28279",
        review: "1:28491",
        password: "1:28349",
        success: "1:28421",
      }[step.value],
);
const assets = computed(() => withdrawalAssets[frameId.value]);
watch(frameId, (value) => emit("state", value), { immediate: true });
const currencies = WALLET_CURRENCIES.map((c) => ({
  label: c.code + " · " + c.name,
  value: c.code,
}));
const currencyDefinition = computed(
  () =>
    WALLET_CURRENCIES.find((c) => c.code === currency.value) ||
    WALLET_CURRENCIES[0],
);
const currencyBadge = (code) => {
  const c = WALLET_CURRENCIES.find((c) => c.code === code);
  return c ? c.symbol + " · " + code : "Moeda não informada";
};
const bankOptions = computed(() =>
  props.banks.map((b) => ({
    value: b.id,
    currency: bankCurrency(b),
    label:
      (b.displayName || b.bankName || "Banco não informado") +
      (b.branch ? " · Ag " + b.branch : "") +
      " · " +
      protectedAccount(b.accountNumberMasked),
    disable:
      b.status !== "Active" ||
      (!!bankCurrency(b) && bankCurrency(b) !== currency.value),
  })),
);
const selectedOption = computed(() =>
  bankOptions.value.find((b) => b.value === bankId.value),
);
const bank = computed(() => props.banks.find((b) => b.id === bankId.value));
const available = computed(() =>
  walletBalance(props.model, "deposit", currency.value),
);
const form = () => ({
  amount: amount.value,
  currency: currency.value,
  bankId: bankId.value,
  password: password.value,
});
const canContinue = computed(
  () =>
    !busy.value &&
    (step.value === "password"
      ? !!props.submitOperation && /^\d{6}$/.test(password.value)
      : step.value === "review"
        ? !!snapshot.value
        : !props.bankState.loading &&
          !props.bankState.error &&
          !withdrawalFormError(form(), props.model, bank.value)),
);
watch(
  [currency, amount, bankId],
  () => {
    error.value = "";
    password.value = "";
    passwordVisible.value = false;
    snapshot.value = null;
  },
  { flush: "sync" },
);
function changeCurrency() {
  amount.value = 0;
  if (bankCurrency(bank.value) && bankCurrency(bank.value) !== currency.value)
    bankId.value = null;
}
function selectBank() {
  const code = bankCurrency(bank.value);
  if (code && code !== currency.value) {
    currency.value = code;
    amount.value = 0;
  }
}
function back() {
  password.value = "";
  passwordVisible.value = false;
  error.value = "";
  step.value = step.value === "password" ? "review" : "form";
}
let active = true;
onScopeDispose(() => {
  active = false;
  password.value = "";
  passwordVisible.value = false;
});
async function next() {
  if (busy.value || step.value === "success") return;
  if (props.bankState.loading || props.bankState.error) {
    password.value = "";
    passwordVisible.value = false;
    step.value = "form";
    error.value = "Aguarde a consulta das contas bancárias antes de continuar.";
    return;
  }
  error.value = "";
  if (step.value === "form") {
    try {
      snapshot.value = withdrawalSnapshot(form(), props.model, bank.value);
      step.value = "review";
    } catch (e) {
      error.value = e.message;
    }
    return;
  }
  if (!currentWithdrawal(snapshot.value, form(), props.model, bank.value)) {
    password.value = "";
    passwordVisible.value = false;
    step.value = "form";
    error.value =
      "Os dados do saque mudaram. Confira o valor, o saldo e a conta novamente.";
    return;
  }
  if (step.value === "review") {
    step.value = "password";
    return;
  }
  const problem = withdrawalFormError(form(), props.model, bank.value, true);
  if (problem) {
    error.value = problem;
    return;
  }
  if (!props.submitOperation) {
    error.value = "A confirmação do saque ainda não está disponível.";
    return;
  }
  busy.value = true;
  emit("busy", true);
  try {
    await props.submitOperation({
      mode: "withdrawal",
      currency: snapshot.value.currency,
      amount: snapshot.value.amount,
      from: "deposit",
      bankId: snapshot.value.bankId,
      withdrawalPassword: password.value,
    });
    if (active) step.value = "success";
  } catch (e) {
    if (active)
      error.value =
        !e?.response && !e?.config
          ? e?.message || "Não foi possível solicitar o saque. Tente novamente."
          : "Não foi possível solicitar o saque. Confira os dados e tente novamente.";
  } finally {
    password.value = "";
    passwordVisible.value = false;
    if (active) {
      busy.value = false;
      emit("busy", false);
    }
  }
}
</script>
<style lang="scss" src="./withdrawalFlow.scss"></style>
