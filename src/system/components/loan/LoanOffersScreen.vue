<template>
  <section class="loan-offers-screen" :class="{'consortium-view': consortium}">
    <button
      type="button"
      class="offers-back"
      aria-label="Voltar"
      @click="$emit('back')"
    >
      <img src="/figma/loan-request/back.svg" alt="" />
    </button>
    <final-steps-loan-layout
      v-if="confirmation"
      confirmed
      :title="
        consortium ? 'Solicitação de Contrato enviada!' : 'Solicitação enviada!'
      "
      sub-title="Sua solicitação será analisada e logo um dos nossos Consultores entrará em contato."
      :name-router="consortium ? 'Alavancagem' : 'Contratos'"
      :text-router="consortium ? 'Ir para Alavancagem' : 'Ir para Contratos'"
    />
    <template v-else>
      <header>
        <h1>
          {{
            consortium
              ? "Ofertas de Consórcio"
              : preliminary
                ? "Simule com seu Crédito Pré-Aprovado"
                : "Ofertas Finais"
          }}
        </h1>
        <p>
          {{
            preliminary
              ? "Com a simulação, te retornamos algumas Ofertas Pré-Aprovadas de bancos parceiros. Para prosseguir no processo é necessário o envio de algumas documentações importantes."
              : "Estas são as Ofertas Finais após a Análise de Crédito. Aguarde receber todas para avaliar qual a melhor opção. Você pode analisar cada oferta individualmente antes de selecionar uma."
          }}
        </p>
      </header>
      <div class="offers-body" :class="{ preliminary, consortium }">
        <section v-if="preliminary" class="offers-simulation">
          <loan-amount-control
            v-model="amount"
            title="De quanto você precisa?"
            max-info
            :disabled="busy"
            :min="50000"
            :max="3000000"
            min-label="R$ 50 mil"
            max-label="R$ 3 Milhões"
          />
          <fieldset>
            <legend>Em quantas vezes?</legend>
            <div class="term-options">
              <button
                v-for="term in terms"
                :key="term"
                type="button"
                :disabled="busy"
                :aria-pressed="installments === term"
                @click="installments = term"
              >
                {{ term }}x
              </button>
            </div>
          </fieldset>
        </section>
        <div class="offers-column">
          <loading-step
            v-if="!consortium"
            :step-number="preliminary ? 5 : 7"
            :step-total="7"
          />
          <offers-template
            class="offers-panel"
            :text-header="
              consortium
                ? 'Principais Ofertas de Consórcio'
                : preliminary
                  ? 'Ofertas de Crédito Pré-Aprovado'
                  : 'Ofertas Finais de Crédito'
            "
            :text-description="
              preliminary
                ? 'Essas não são ofertas finais e podem sofrer alteração de valores e parcelas.'
                : 'Você pode analisar individualmente ao clicar em “Ver Oferta”, e depois, selecionar a Oferta que mais te agrada e prosseguir.'
            "
          >
            <template v-if="preliminary" #headingExtra
              ><button
                type="button"
                class="offers-refresh"
                :disabled="
                  !reader ||
                  resource.state.loading ||
                  busy ||
                  (preliminary && !preliminaryValid)
                "
                @click="load"
              >
                Atualizar<img
                  src="/figma/loan-request/refresh.svg"
                  alt=""
                /></button
            ></template>
            <template #itemsOffers
              ><div class="offers-content">
                <resource-state :state="resource.state" @retry="load"
                  ><p v-if="!reader" class="offers-unavailable" role="status">
                    A consulta de ofertas ainda não está disponível.
                  </p>
                  <p
                    v-else-if="quoteChanged"
                    class="offers-unavailable"
                    role="status"
                  >
                    Atualize a simulação para consultar as ofertas.
                  </p>
                  <p
                    v-else-if="!rows.length"
                    class="offers-unavailable"
                    role="status"
                  >
                    Nenhuma oferta disponível.
                  </p>
                  <div
                    v-else
                    :class="consortium ? 'featured-offers' : 'credit-offers'"
                  >
                    <loan-offer-card
                      v-for="offer in consortium ? featured : rows"
                      :key="offer.id"
                      :offer="offer"
                      :consortium="consortium"
                      :final="!preliminary"
                      :selected="
                        selected?.id === offer.id ||
                        (consortium && offer.highlighted === true)
                      "
                      :selection-enabled="!preliminary && !busy"
                      :can-open="!!openOffer && !busy"
                      :can-request="!!submitOffer && !busy"
                      @select="selectOffer"
                      @open="viewOffer"
                      @request="requestOffer"
                    /></div
                ></resource-state></div
            ></template>
            <template v-if="!consortium" #actionOffers
              ><q-btn
                no-caps
                color="primary"
                :loading="busy"
                :disable="
                  preliminary
                    ? !continueAction ||
                      !hasSelectable ||
                      !preliminaryValid ||
                      busy
                    : !selected || !submitOffer || busy
                "
                @click="
                  preliminary ? continueRequest() : requestOffer(selected)
                "
                >{{
                  preliminary
                    ? "Prosseguir para Documentações"
                    : "Prosseguir com Oferta Selecionada"
                }}<img src="/figma/loan-request/next.svg" alt="" /></q-btn
            ></template>
          </offers-template>
        </div>
        <section v-if="consortium" class="other-offers">
          <div class="other-offers-header">
            <h2>Outras Ofertas</h2>
            <div
              class="offers-view"
              role="group"
              aria-label="Visualização das ofertas"
            >
              <button
                v-for="view in ['list', 'grid']"
                :key="view"
                type="button"
                :aria-pressed="layout === view"
                @click="layout = view"
              >
                <img :src="`/figma/loan-request/${view}.svg`" alt="" />{{
                  view === "list" ? "Lista" : "Card"
                }}
              </button>
            </div>
          </div>
          <p v-if="!other.length" class="offers-unavailable">
            {{
              reader
                ? "Nenhuma outra oferta disponível."
                : "A consulta de ofertas ainda não está disponível."
            }}
          </p>
          <div v-else :class="['other-offers-items', layout]">
            <loan-offer-card
              v-for="offer in other"
              :key="offer.id"
              :offer="offer"
              consortium
              :compact="layout === 'list'"
              :selected="
                selected?.id === offer.id ||
                (consortium && offer.highlighted === true)
              "
              :can-open="!!openOffer && !busy"
              :can-request="!!submitOffer && !busy"
              @open="viewOffer"
              @request="requestOffer"
            />
          </div>
        </section>
        <p v-if="error" class="offers-error" role="alert">{{ error }}</p>
      </div>
    </template>
  </section>
</template>
<script setup>
import { computed, onScopeDispose, ref, watch } from "vue";
import LoanAmountControl from "./LoanAmountControl.vue";
import LoanOfferCard from "./LoanOfferCard.vue";
import LoadingStep from "src/system/components/LoadingStep.vue";
import OffersTemplate from "src/system/templates/loan/OffersTemplate.vue";
import ResourceState from "src/system/components/finance/ResourceState.vue";
import FinalStepsLoanLayout from "src/system/layouts/loans/FinalStepsLoanLayout.vue";
import { validLoanAmount } from "src/services/loanRequestDraft";
import { useFinanceResource } from "src/composables/useFinanceResource";
import {
  readOfferRows,
  offerSignature,
  resolveSelectedOffer,
  selectableLoanOffer,
} from "src/services/loanOfferPresentation";
const props = defineProps({
  kind: { type: String, default: "final" },
  securedType: { type: String, default: "imovel" },
  reader: { type: Function, default: null },
  openOffer: { type: Function, default: null },
  submitOffer: { type: Function, default: null },
  continueAction: { type: Function, default: null },
  initialAmount: { type: Number, default: null },
  initialInstallments: { type: Number, default: null },
});
defineEmits(["back"]);
const preliminary = computed(() => props.kind === "preliminary"),
  consortium = computed(() => props.kind === "consortium");
const amount = ref(props.initialAmount),
  installments = ref(props.initialInstallments),
  selection = ref(null),
  layout = ref("list"),
  busy = ref(false),
  error = ref(""),
  confirmation = ref(null),
  quoteChanged = ref(false),
  resource = useFinanceResource();
let alive = true,
  context = 0;
const terms = computed(() =>
  props.securedType === "automovel"
    ? [20, 30, 40, 50, 60, 70, 80]
    : [60, 90, 120, 150, 180, 210, 240],
);
const rows = computed(() => resource.state.data || []),
  featured = computed(() => rows.value.filter((o) => o.featured === true)),
  other = computed(() => rows.value.filter((o) => o.featured !== true));
const preliminaryValid = computed(
  () =>
    validLoanAmount(amount.value) && terms.value.includes(installments.value),
);
const hasSelectable = computed(() => rows.value.some(selectableLoanOffer));
const selected = computed(() =>
  resolveSelectedOffer(rows.value, selection.value),
);
async function load() {
  if (busy.value) return;
  selection.value = null;
  error.value = "";
  quoteChanged.value = false;
  await resource.load(async () =>
    props.reader
      ? readOfferRows(
          await props.reader({
            amount: amount.value,
            installments: installments.value,
          }),
        )
      : [],
  );
}
function selectOffer(offer) {
  if (selectableLoanOffer(offer) && !busy.value)
    selection.value = { id: offer.id, signature: offerSignature(offer) };
}
async function run(action, allowConfirmation = false) {
  if (busy.value) return;
  const version = context;
  busy.value = true;
  error.value = "";
  try {
    const result = await action();
    if (
      alive &&
      version === context &&
      allowConfirmation &&
      result?.submitted === true
    )
      confirmation.value = result;
  } catch {
    if (alive && version === context)
      error.value = "Não foi possível concluir esta ação. Tente novamente.";
  } finally {
    if (alive && version === context) busy.value = false;
  }
}
function viewOffer(offer) {
  if (
    props.openOffer &&
    !busy.value &&
    rows.value.some((row) => row.id === offer.id)
  )
    run(() => props.openOffer(rows.value.find((row) => row.id === offer.id)));
}
function requestOffer(offer) {
  if (!props.submitOffer || busy.value || !selectableLoanOffer(offer)) return;
  const current = rows.value.find(
    (row) =>
      row.id === offer.id && offerSignature(row) === offerSignature(offer),
  );
  if (current) run(() => props.submitOffer(current), true);
}
function continueRequest() {
  if (
    props.continueAction &&
    hasSelectable.value &&
    preliminaryValid.value &&
    !busy.value
  )
    run(() =>
      props.continueAction({
        amount: amount.value,
        installments: installments.value,
      }),
    );
}
watch(
  () => [props.kind, props.securedType],
  () => {
    context++;
    resource.reset();
    confirmation.value = null;
    selection.value = null;
    amount.value = null;
    installments.value = null;
    busy.value = false;
    load();
  },
);
watch([amount, installments], () => {
  if (props.reader) {
    context++;
    resource.reset();
    selection.value = null;
    confirmation.value = null;
    quoteChanged.value = true;
  }
});
load();
onScopeDispose(() => {
  alive = false;
  context++;
  resource.reset();
});
</script>
<style scoped>
.loan-offers-screen {
  padding: 32px 48px 48px;
  color: white;
}
.offers-back {
  display: flex;
  background: none;
  padding: 0;
  border: 0;
  cursor: pointer;
  margin-bottom: 72px;
}
.loan-offers-screen header {
  max-width: 1480px;
  margin: 0 auto;
}
.loan-offers-screen h1 {
  font-size: 41px;
  line-height: 1.5;
  letter-spacing: normal;
  font-weight: 700;
  margin: 0 0 12px;
}
.loan-offers-screen header p {
  font-size: 24px;
  line-height: 1.35;
  color: #989898;
  margin: 0;
}
.offers-body {
  max-width: 1480px;
  margin: 40px auto 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 64px;
}
.offers-body:not(.preliminary):not(.consortium) {
  max-width: 720px;
}
.offers-body.preliminary {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 120px;
}
.offers-column {
  min-width: 0;
}
.offers-column :deep(.loading-step) {
  font-size: 20px;
  line-height: 1.35;
}
.offers-column :deep(.q-linear-progress__track) {
  background: #292929;
  opacity: 1;
}
.offers-panel {
  margin-top: 72px;
  padding: 24px 32px !important;
  min-width: 0;
  border: 1px solid #00a3ff;
  border-radius: 8px;
  box-shadow: 0 0 40px #00a3ff66;
  background: linear-gradient(194deg, #0000003d, #00000014 51%, #0000000a);
}
.offers-panel :deep(.text-inter-24-700) {
  font-size: 24px;
  line-height: 1.5;
  font-weight: 700;
  min-width: 0;
}
.offers-panel :deep(.textDescription) {
  font-size: 17px;
}
.offers-content {
  width: 100%;
  min-width: 0;
  margin-top: 16px;
}
.credit-offers {
  display: grid;
  gap: 24px;
}
.offers-refresh {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: none;
  color: #989898;
  font-size: 14px;
  cursor: pointer;
}
.offers-refresh:disabled {
  opacity: 0.5;
  cursor: default;
}
.offers-unavailable {
  color: #989898;
  margin: 16px 0;
  font-size: 17px;
}
.offers-simulation {
  align-self: start;
  margin-top: 120px;
  border: 1px solid #efefef29;
  border-radius: 8px;
  padding: 24px 32px;
  display: grid;
  gap: 32px;
  background: linear-gradient(194deg, #0000003d, #0000000a);
  min-width: 0;
}
.offers-simulation fieldset {
  border: 0;
  margin: 0;
  padding: 24px 16px;
  background: #ffffff08;
  min-width: 0;
}
.offers-simulation legend {
  font-size: 17px;
  color: #989898;
  text-align: center;
  float: left;
  width: 100%;
  margin-bottom: 24px;
}
.term-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  clear: both;
}
.term-options button {
  padding: 12px;
  border: 1px solid #efefef14;
  border-radius: 8px;
  background: linear-gradient(182deg, #ffffff29, #ffffff03);
  color: white;
  cursor: pointer;
  font-size: 17px;
  font-weight: 700;
}
.term-options button[aria-pressed="true"] {
  border-color: #00a3ff;
}
.offers-panel :deep(.q-btn__content) {
  gap: 8px;
}
.offers-error {
  grid-column: 1/-1;
  color: #ffb0b0;
}
.consortium .offers-panel {
  margin: 32px 0 0;
}
.featured-offers {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 40px;
  padding: 24px 48px 0;
}
.other-offers {
  min-width: 0;
  padding: 16px 32px;
}
.other-offers-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 32px;
}
.other-offers-header h2 {
  font-size: 24px;
  line-height: 1.5;
  letter-spacing: normal;
  font-weight: 700;
  margin: 0;
}
.offers-view {
  display: flex;
  border: 1px solid #efefef29;
  border-radius: 4px;
  overflow: hidden;
}
.offers-view button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: 0;
  color: #989898;
  cursor: pointer;
}
.offers-view button[aria-pressed="true"] {
  background: white;
  color: #00a3ff;
}
.other-offers-items {
  display: grid;
  gap: 24px;
}
.other-offers-items.grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 40px;
}
button:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 3px;
}
@media (max-width: 1100px) {
  .offers-body.preliminary {
    gap: 40px;
  }
  .featured-offers {
    padding: 0;
    gap: 24px;
  }
  .other-offers-items.grid {
    gap: 24px;
  }
}
@media (max-width: 800px) {
  .loan-offers-screen {
    padding: 16px;
  }
  .offers-back {
    margin-bottom: 32px;
  }
  .loan-offers-screen h1 {
    font-size: 28px;
  }
  .loan-offers-screen header p {
    font-size: 17px;
  }
  .offers-body.preliminary {
    grid-template-columns: minmax(0, 1fr);
  }
  .offers-simulation {
    margin-top: 0;
  }
  .offers-panel {
    padding: 24px 16px !important;
    margin-top: 32px;
  }
  .featured-offers,
  .other-offers-items.grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .other-offers {
    padding: 0;
  }
  .other-offers-header {
    flex-wrap: wrap;
  }
  .offers-body {
    gap: 32px;
  }
}
</style>

<style scoped>
.offers-panel {
  border: 2px solid #75cfff;
  box-shadow: 0 0 48px 12px #00a3ff3d;
}
.offers-body.consortium {
  max-width: 1400px;
  margin-top: 80px;
  gap: 80px;
}
.consortium .offers-panel {
  margin-top: 8px;
}
.featured-offers {
  grid-template-columns: repeat(3, minmax(0, 380px));
  justify-content: center;
  gap: 48px;
  padding: 0;
}
.other-offers {
  padding: 24px 32px;
}
@media (max-width: 1100px) {
  .featured-offers {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }
}
@media (max-width: 800px) {
  .offers-body.consortium {
    margin-top: 40px;
    gap: 32px;
  }
  .featured-offers {
    grid-template-columns: minmax(0, 1fr);
  }
  .other-offers {
    padding: 0;
  }
}
</style>

<style scoped>
.loan-offers-screen {
  font-family: Inter, sans-serif;
}
</style>

<style scoped>.consortium-view header{max-width:1544px}</style>
