<template>
  <section class="secured-request">
    <button
      type="button"
      class="request-back"
      aria-label="Voltar"
      @click="back"
    >
      <img :src="asset('back.svg')" alt="" />
    </button>
    <div class="request-columns">
      <div class="request-intro">
        <div class="request-art">
          <div class="art-crop" :class="type">
            <img
              :src="asset(type === 'imovel' ? 'house.png' : 'car.png')"
              alt=""
            />
          </div>
        </div>
        <h1>
          {{
            consortium
              ? "Selecione o Valor do Crédito ou da Parcela que deseja"
              : `Faça uma Simulação com seu ${type === "imovel" ? "Imóvel" : "Carro"} em Garantia`
          }}
        </h1>
        <p v-if="consortium">
          Os valores apresentados podem sofrer alterações, e a disponibilidade
          está condicionada às vagas nos grupos.
        </p>
        <p v-else>
          Preencha corretamente com seus dados para iniciarmos a simulação.
          Depois, analisaremos seu perfil e retornaremos com uma proposta
          especial para você.
        </p>
      </div>
      <div class="request-main">
        <loading-step
          v-if="!consortium"
          :step-number="securedDisplayStep(step)"
          :step-total="7"
        />
        <form
          class="request-card"
          :class="{ consortium }"
          @submit.prevent="next"
        >
          <h2>{{ heading }}</h2>
          <template v-if="step === 0">
            <div
              v-if="consortium"
              class="consortium-tabs"
              role="tablist"
              aria-label="Simular por"
            >
              <button
                v-for="mode in ['credit', 'installment']"
                :id="`mode-${mode}`"
                :key="mode"
                type="button"
                role="tab"
                :aria-selected="draft.consortiumMode === mode"
                aria-controls="consortium-amount"
                :tabindex="draft.consortiumMode === mode ? 0 : -1"
                @click="draft.consortiumMode = mode"
                @keydown.left.prevent="switchMode"
                @keydown.right.prevent="switchMode"
              >
                {{
                  mode === "credit" ? "Valor do Crédito" : "Valor da Parcela"
                }}
              </button>
            </div>
            <loan-amount-control
              v-model="amount"
              :min="amountMin"
              :max="amountMax"
              :increment="
                consortium && draft.consortiumMode === 'installment' ? 10 : 1000
              "
              :panel-id="consortium ? 'consortium-amount' : undefined"
              :labelledby="
                consortium ? `mode-${draft.consortiumMode}` : undefined
              "
              :min-label="
                consortium
                  ? draft.consortiumMode === 'credit'
                    ? 'R$ 80 mil'
                    : 'R$ 300,00'
                  : 'R$ 50 mil'
              "
              :max-label="
                consortium
                  ? draft.consortiumMode === 'credit'
                    ? 'R$ 800 mil'
                    : 'R$ 6.000,00'
                  : 'R$ 3 Milhões'
              "
            />
          </template>
          <div v-else-if="step === 1" class="request-reasons">
            <button
              v-for="reason in reasons"
              :key="reason.value"
              type="button"
              :aria-pressed="draft.reason === reason.value"
              :class="{ selected: draft.reason === reason.value }"
              @click="draft.reason = reason.value"
            >
              <span class="reason-icon"
                ><img :src="asset(reason.icon + '.svg')" alt="" /></span
              >{{ reason.label }}
            </button>
          </div>
          <template v-else-if="step === 2">
            <label-form text-label="Em quanto tempo você precisa?"
              ><select
                v-model="draft.neededBy"
                aria-label="Em quanto tempo você precisa?"
              >
                <option disabled value="">Selecione uma opção</option>
                <option v-for="option in timeOptions" :key="option">
                  {{ option }}
                </option>
              </select></label-form
            >
            <profile-resource-state
              :resource="{ state: summary.state, load: loadSummary }"
            />
            <div
              v-for="field in initialFields"
              :key="field.title"
              class="request-readonly"
            >
              <span>{{ field.title }}</span>
              <p>{{ field.value }}</p>
            </div>
          </template>
          <template v-else-if="step === 3">
            <profile-resource-state
              :resource="{ state: summary.state, load: loadSummary }"
            />
            <div class="request-readonly">
              <span>Data de Nascimento</span>
              <p>{{ basicValue("Data de Nascimento") }}</p>
            </div>
            <div class="request-readonly">
              <span>{{ type === "imovel" ? "Estado Civil" : "CEP" }}</span>
              <p>
                {{
                  type === "imovel"
                    ? basicValue("Estado Civil")
                    : fields.location[0].value
                }}
              </p>
            </div>
            <template v-if="type === 'imovel'">
              <fieldset>
                <legend>Deseja envolver o Cônjuge no Empréstimo?</legend>
                <label v-for="choice in yesNo" :key="String(choice.value)"
                  ><input
                    v-model="draft.spouse"
                    type="radio"
                    name="spouse"
                    :value="choice.value"
                  />{{ choice.label }}</label
                >
              </fieldset>
              <label-form text-label="CPF do Cônjuge"
                ><input
                  v-model="draft.spouseCpf"
                  aria-label="CPF do Cônjuge"
                  inputmode="numeric"
                  maxlength="14"
                  placeholder="000000000-00"
                  :disabled="draft.spouse !== true"
              /></label-form>
              <label-form text-label="RG do Cônjuge"
                ><input
                  v-model="draft.spouseRg"
                  aria-label="RG do Cônjuge"
                  maxlength="30"
                  placeholder="00000000-0"
                  :disabled="draft.spouse !== true"
              /></label-form>
            </template>
            <profile-resource-state
              :resource="{ state: professional.state, load: loadProfessional }"
            />
            <div class="request-readonly">
              <span>Atuação Trabalhista</span>
              <p>{{ fields.job[0].value }}</p>
            </div>
            <profile-resource-state
              :resource="{ state: financial.state, load: loadFinancial }"
            />
            <div class="request-readonly">
              <span
                >Renda Mensal ({{
                  financial.state.data?.currencyCode || "—"
                }})</span
              >
              <p>{{ fields.job[1].value }}</p>
            </div>
            <div v-if="type === 'imovel'" class="request-readonly">
              <span
                >Renda Mensal da Família ({{
                  financial.state.data?.currencyCode || "—"
                }})</span
              >
              <p>{{ fields.job[2].value }}</p>
            </div>
          </template>
          <template v-else-if="step === 4 && type === 'imovel'">
            <label-form text-label="Qual é o Tipo do Imóvel?"
              ><select
                v-model="draft.propertyType"
                aria-label="Qual é o Tipo do Imóvel?"
              >
                <option disabled value="">Selecione uma opção</option>
                <option v-for="option in propertyTypes" :key="option">
                  {{ option }}
                </option>
              </select></label-form
            >
            <label-form text-label="Valor Estimado do Imóvel? (R$)"
              ><money-input
                v-model="draft.propertyValue"
                class="request-input"
                aria-label="Valor Estimado do Imóvel"
                outlined
                dense
                show-currency
            /></label-form>
            <label-form text-label="CEP do Imóvel"
              ><input
                v-model="draft.postalCode"
                aria-label="CEP do Imóvel"
                maxlength="9"
                inputmode="numeric"
                placeholder="00000-000"
                :disabled="draft.unknownPostalCode"
              /><button
                type="button"
                class="help-link"
                :aria-pressed="draft.unknownPostalCode"
                @click="draft.unknownPostalCode = !draft.unknownPostalCode"
              >
                Não sei meu CEP
              </button></label-form
            >
            <label-form text-label="Número do Imóvel"
              ><input
                v-model="draft.number"
                aria-label="Número do Imóvel"
                maxlength="20"
                :disabled="draft.noNumber"
            /></label-form>
            <label class="choice"
              ><input v-model="draft.noNumber" type="checkbox" />Imóvel sem
              Número</label
            >
            <label-form text-label="Complemento (opcional)"
              ><input
                v-model="draft.complement"
                aria-label="Complemento (opcional)"
                maxlength="120"
                placeholder="Ex: sala, andar, bloco, referência..."
            /></label-form>
            <label-form text-label="Metragem do Imóvel (m²)"
              ><input
                v-model="draft.area"
                aria-label="Metragem do Imóvel (m²)"
                type="number"
                min="0.01"
                step="any"
            /></label-form>
          </template>
          <template v-else-if="step === 5 && type === 'imovel'">
            <fieldset>
              <legend>O Imóvel está no Nome de Quem?</legend>
              <label v-for="owner in ownerOptions" :key="owner"
                ><input
                  v-model="draft.owners"
                  type="checkbox"
                  :value="owner"
                />{{ owner }}</label
              >
            </fieldset>
            <div class="payment-row">
              <fieldset>
                <legend>O Imóvel ainda está sendo pago?</legend>
                <label v-for="choice in yesNo" :key="String(choice.value)"
                  ><input
                    v-model="draft.paying"
                    type="radio"
                    name="paying"
                    :value="choice.value"
                  />{{ choice.label }}</label
                >
              </fieldset>
              <label-form text-label="Quanto falta para pagar? (R$)"
                ><money-input
                  v-model="draft.outstanding"
                  class="request-input"
                  aria-label="Quanto falta para pagar?"
                  outlined
                  dense
                  show-currency
                  :disable="draft.paying !== true"
              /></label-form>
            </div>
            <fieldset>
              <legend>Você tem a Matrícula do Imóvel?</legend>
              <label v-for="choice in threeChoices" :key="choice.value"
                ><input
                  v-model="draft.registration"
                  type="radio"
                  name="registration"
                  :value="choice.value"
                />{{ choice.label }}</label
              >
              <p
                class="help-link"
                title="Registro do imóvel no Cartório de Registro de Imóveis."
              >
                O que é matrícula?
              </p>
            </fieldset>
            <fieldset>
              <legend>Imóvel possui Habite-se?</legend>
              <label v-for="choice in threeChoices" :key="choice.value"
                ><input
                  v-model="draft.occupancy"
                  type="radio"
                  name="occupancy"
                  :value="choice.value"
                />{{
                  choice.value === "yes"
                    ? "Tem"
                    : choice.value === "no"
                      ? "Não tem"
                      : choice.label
                }}</label
              >
              <p
                class="help-link"
                title="Documento municipal que autoriza a ocupação do imóvel."
              >
                O que é Habite-se?
              </p>
            </fieldset>
            <fieldset>
              <legend>
                Contratação de crédito seria feita por você ou sua empresa?
              </legend>
              <label
                ><input
                  v-model="draft.contracting"
                  type="radio"
                  name="contracting"
                  value="self"
                />Por mim</label
              ><label
                ><input
                  v-model="draft.contracting"
                  type="radio"
                  name="contracting"
                  value="company"
                />Pela empresa</label
              >
            </fieldset>
            <p class="request-unavailable" role="status">
              {{ loanServiceUnavailable }}
            </p>
          </template>
          <template v-else>
            <label-form text-label="Carro usado está no nome de quem?"
              ><select
                v-model="draft.vehicleOwner"
                aria-label="Carro usado está no nome de quem?"
              >
                <option disabled value="">Selecione uma opção</option>
                <option v-for="option in ownerOptions" :key="option">
                  {{ option }}
                </option>
              </select></label-form
            >
            <label-form text-label="Qual a placa?"
              ><input
                v-model="draft.plate"
                aria-label="Qual a placa?"
                maxlength="8"
                placeholder="AAA-0000"
            /></label-form>
            <label-form
              text-label="Qual o modelo do veículo? Clique para Selecionar"
            >
              <div v-if="models.length" class="vehicle-models">
                <button
                  v-for="model in models"
                  :key="model.id"
                  type="button"
                  :aria-pressed="draft.model === model.id"
                  :class="{ selected: draft.model === model.id }"
                  @click="draft.model = model.id"
                >
                  {{ model.label }}
                </button>
              </div>
              <p v-else class="request-unavailable" role="status">
                Consulta de modelos indisponível.
              </p>
            </label-form>
            <div class="fipe-unavailable">
              <img :src="asset('info.svg')" alt="" />
              <div>
                <strong>{{
                  selectedModel
                    ? profileMoney(
                        selectedModel.fipeValue,
                        selectedModel.currency,
                      )
                    : "Valor FIPE indisponível."
                }}</strong>
                <p v-if="selectedModel" class="fipe-reference">
                  Preço Médio com Base em Consulta pela FIPE ·
                  {{ selectedModel.fipeReference || "Referência indisponível" }}
                </p>
              </div>
            </div>
            <div class="payment-row">
              <fieldset>
                <legend>Você está pagando o carro?</legend>
                <label v-for="choice in yesNo" :key="String(choice.value)"
                  ><input
                    v-model="draft.paying"
                    type="radio"
                    name="paying"
                    :value="choice.value"
                  />{{ choice.label }}</label
                >
              </fieldset>
              <label-form text-label="Quanto falta para pagar? (R$)"
                ><money-input
                  v-model="draft.outstanding"
                  class="request-input"
                  aria-label="Quanto falta para pagar?"
                  outlined
                  dense
                  show-currency
                  :disable="draft.paying !== true"
              /></label-form>
            </div>
          </template>
          <p v-if="error" role="alert" class="request-error">{{ error }}</p>
          <div class="request-actions">
            <q-btn type="submit" color="primary" no-caps :disable="lastStep"
              >Prosseguir<img :src="asset('next.svg')" alt=""
            /></q-btn>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
<script setup>
import { useRouter } from "vue-router";
import { computed, nextTick, onScopeDispose, ref, watch } from "vue";
import LabelForm from "src/system/components/form/LabelForm.vue";
import MoneyInput from "src/system/components/form/MoneyInput.vue";
import LoanAmountControl from "./LoanAmountControl.vue";
import LoadingStep from "src/system/components/LoadingStep.vue";
import ProfileResourceState from "src/system/components/setting/ProfileResourceState.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import {
  getClientProfileSummary,
  getClientProfessionalProfile,
  getClientFinancialProfile,
  getPreferenceCatalog,
} from "src/services/clientProfileService";
import { profileFields, profileMoney } from "src/services/profilePresentation";
import {
  availableVehicleModels,
  clearInapplicableLoanFields,
  loanServiceUnavailable,
  ownerOptions,
  propertyTypes,
  securedDisplayStep,
  securedReasons,
  securedStepError,
  validLoanAmount,
  timeOptions,
} from "src/services/loanRequestDraft";
const props = defineProps({
  consortium: Boolean,
  modelOptions: { type: Array, default: () => [] },
  type: { type: String, required: true },
  draft: { type: Object, required: true },
  step: { type: Number, default: 0 },
  profileLoader: { type: Object, default: null },
});
const emit = defineEmits(["update:step", "back"]);
const asset = (name) => `/figma/loan-request/${name}`;
// The parent owns these ephemeral, product-specific drafts; they are never written to the profile.
const draft = computed(() => props.draft);
const router = useRouter();
const error = ref("");
const models = computed(() => availableVehicleModels(props.modelOptions));
const selectedModel = computed(() =>
  models.value.find((model) => model.id === draft.value.model),
);
watch(models, () => {
  if (!selectedModel.value) draft.value.model = "";
});
const amount = computed({
  get: () =>
    props.consortium
      ? draft.value[
          draft.value.consortiumMode === "credit"
            ? "creditAmount"
            : "installmentAmount"
        ]
      : draft.value.amount,
  set: (value) => {
    draft.value[
      props.consortium
        ? draft.value.consortiumMode === "credit"
          ? "creditAmount"
          : "installmentAmount"
        : "amount"
    ] = value;
  },
});
const amountMin = computed(() =>
  props.consortium
    ? draft.value.consortiumMode === "credit"
      ? 80000
      : 300
    : 50000,
);
const amountMax = computed(() =>
  props.consortium
    ? draft.value.consortiumMode === "credit"
      ? 800000
      : 6000
    : 3000000,
);
async function switchMode() {
  draft.value.consortiumMode =
    draft.value.consortiumMode === "credit" ? "installment" : "credit";
  await nextTick();
  document.getElementById(`mode-${draft.value.consortiumMode}`)?.focus();
}

const summary = useFinanceResource(),
  professional = useFinanceResource(),
  financial = useFinanceResource(),
  catalog = useFinanceResource();
const loadSummary = () =>
  summary.load(props.profileLoader?.summary || getClientProfileSummary);
const loadProfessional = () =>
  professional.load(
    props.profileLoader?.professional || getClientProfessionalProfile,
  );
const loadFinancial = () =>
  financial.load(props.profileLoader?.financial || getClientFinancialProfile);
const loadCatalog = () =>
  catalog.load(props.profileLoader?.catalog || getPreferenceCatalog);
if (!props.consortium) {
  loadSummary();
  loadProfessional();
  loadFinancial();
  loadCatalog();
}
onScopeDispose(() => {
  summary.reset();
  professional.reset();
  financial.reset();
  catalog.reset();
});
const fields = computed(() =>
  profileFields(
    summary.state.data || {},
    professional.state.data || {},
    financial.state.data || {},
    [],
    catalog.state.data || {},
  ),
);
const basicValue = (title) =>
  fields.value.basic.find((f) => f.title === title)?.value || "Não informado";
const initialFields = computed(() => [
  { title: "Nome Completo", value: basicValue("Nome Completo") },
  { title: "Email", value: basicValue("Email") },
  { title: "Telefone Celular", value: basicValue("Celular") },
  fields.value.document[0],
]);
const reasons = computed(() =>
  securedReasons.filter((r) => props.type === "automovel" || !r.autoOnly),
);
const yesNo = [
  { label: "Sim", value: true },
  { label: "Não", value: false },
];
const threeChoices = [
  { label: "Sim", value: "yes" },
  { label: "Não", value: "no" },
  { label: "Não sei", value: "unknown" },
];
const lastStep = computed(
  () => props.step >= (props.type === "imovel" ? 5 : 4),
);
const heading = computed(() =>
  props.consortium
    ? "Simular por"
    : props.step === 0
      ? "De quanto você precisa?"
      : props.step === 1
        ? "Motivo do Empréstimo"
        : props.step < 4
          ? "Informações Iniciais"
          : props.type === "imovel"
            ? "Informações do Imóvel"
            : "Informações do Veículo",
);
watch(
  () => [
    draft.value.spouse,
    draft.value.noNumber,
    draft.value.unknownPostalCode,
    draft.value.paying,
  ],
  () => clearInapplicableLoanFields(draft.value),
  { flush: "sync" },
);
watch(
  () => props.draft,
  () => {
    error.value = "";
  },
  { deep: true },
);
watch(
  () => props.step,
  () => {
    error.value = "";
  },
);
function next() {
  if (props.consortium) {
    error.value = validLoanAmount(
      amount.value,
      amountMin.value,
      amountMax.value,
    )
      ? ""
      : "Informe um valor dentro dos limites indicados.";
    if (!error.value)
      router.push({
        name: "Orfetas Finais Consórcio",
        query: { secured: props.type },
      });
    return;
  }
  if (
    (props.step === 2 && (summary.state.loading || summary.state.error)) ||
    (props.step === 3 &&
      [summary, professional, financial].some(
        (resource) => resource.state.loading || resource.state.error,
      ))
  ) {
    error.value =
      "Aguarde o carregamento ou tente consultar novamente os dados do perfil.";
    return;
  }
  error.value = securedStepError(draft.value, props.step, props.type);
  if (!error.value && !lastStep.value) emit("update:step", props.step + 1);
}
function back() {
  if (props.step > 0) emit("update:step", props.step - 1);
  else emit("back");
}
</script>
<style scoped src="./loanRequest.scss"></style>

<style scoped>
.vehicle-models {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.vehicle-models button {
  background: linear-gradient(182deg, #ffffff29, #ffffff03);
  border: 1px solid #efefef14;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  padding: 8px;
  text-align: left;
  cursor: pointer;
  overflow-wrap: anywhere;
}
.vehicle-models .selected {
  border-color: #00a3ff;
}
.fipe-reference {
  font-size: 14px;
  color: #989898;
  line-height: 1.35;
  margin: 4px 0 0;
}
.vehicle-models button:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 3px;
}
</style>
