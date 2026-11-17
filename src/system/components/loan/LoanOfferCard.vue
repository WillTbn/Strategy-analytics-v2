<template>
  <article
    @click="selectFromBody"
    class="loan-offer-card"
    :class="[offer.status, { selected, consortium, compact }]"
  >
    <div class="offer-bank">
      <img
        v-if="offer.logoUrl"
        :src="offer.logoUrl"
        :alt="offer.bankName || ''"
      /><span v-else>{{ offer.bankName || "Instituição não informada" }}</span>
    </div>
    <div class="offer-main">
      <div class="offer-heading">
        <button
          v-if="!consortium"
          type="button"
          class="offer-choice"
          :aria-pressed="selected"
          :disabled="!selectable || !selectionEnabled"
          @click="$emit('select', offer)"
        >
          {{
            offer.status === "Rejected"
              ? "Solicitação de Crédito não aceita"
              : offer.status === "UnderReview"
                ? "Aguarde a Análise"
                : `Crédito Ofertado: ${money(offer.amount, offer.currency)}`
          }}</button
        ><strong v-else>Valor: {{ money(offer.amount, offer.currency) }}</strong
        ><span
          v-if="offer.badge || !consortium"
          class="offer-badge"
          :class="[
            offer.status,
            { highlighted: consortium && offer.highlighted === true },
          ]"
          >{{
            consortium
              ? offer.badge
              : knownOfferStatuses[offer.status] || "Indisponível"
          }}</span
        >
      </div>
      <p v-if="offer.status === 'Rejected'" class="offer-reason">
        {{ offer.rejectionReason || "Motivo indisponível." }}
      </p>
      <template v-else-if="offer.status !== 'UnderReview'">
        <template v-if="consortium"
          ><p class="offer-description">{{ offer.description }}</p>
          <dl>
            <div>
              <dt>Parcela:</dt>
              <dd>{{ money(offer.installmentAmount, offer.currency) }}</dd>
            </div>
            <div>
              <dt>Prazo:</dt>
              <dd>{{ installments(offer) }} meses</dd>
            </div>
            <div>
              <dt>Taxa Adm.:</dt>
              <dd>{{ percent(offer.adminRate) }} ao mês</dd>
            </div>
            <div>
              <dt>Lance Embutido:</dt>
              <dd>{{ percent(offer.embeddedBidPercent) }} do Crédito</dd>
            </div>
          </dl></template
        >
        <p v-else class="offer-terms">
          <strong
            >{{ installments(offer) }}x de
            {{ money(offer.installmentAmount, offer.currency)
            }}<template v-if="offer.installmentMax != null">
              à {{ money(offer.installmentMax, offer.currency) }}</template
            ></strong
          ><span class="terms-divider">▪</span
          ><span
            >Juros: {{ percent(offer.interestRate)
            }}<template v-if="offer.interestMax != null">
              até {{ percent(offer.interestMax) }}</template
            >
            ao mês</span
          >
        </p>
      </template>
      <div
        v-if="
          (final || consortium) &&
          !['Rejected', 'UnderReview'].includes(offer.status)
        "
        class="offer-actions"
      >
        <button
          type="button"
          class="offer-open"
          :disabled="!canOpen"
          @click="$emit('open', offer)"
        >
          <img src="/figma/loan-request/offer.svg" alt="" />{{
            consortium ? "Ver Detalhes" : "Ver Oferta"
          }}</button
        ><q-btn
          v-if="consortium"
          no-caps
          color="primary"
          :disable="!selectable || !canRequest"
          @click="$emit('request', offer)"
          >Solicitar Contrato</q-btn
        >
      </div>
    </div>
  </article>
</template>
<script setup>
import { computed } from "vue";
import { profileMoney as money } from "src/services/profilePresentation";
import {
  knownOfferStatuses,
  offerPercent as percent,
  offerInstallments as installments,
  selectableLoanOffer,
} from "src/services/loanOfferPresentation";
const props = defineProps({
  offer: { type: Object, required: true },
  selected: Boolean,
  consortium: Boolean,
  compact: Boolean,
  final: Boolean,
  selectionEnabled: Boolean,
  canOpen: Boolean,
  canRequest: Boolean,
});
const emit = defineEmits(["select", "open", "request"]);
function selectFromBody(event) {
  if (
    props.selectionEnabled &&
    !props.consortium &&
    selectable.value &&
    !event.target.closest("button,a,input,select")
  )
    emit("select", props.offer);
}
const selectable = computed(() => selectableLoanOffer(props.offer));
</script>
<style scoped>
.loan-offer-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid #efefef14;
  border-radius: 8px;
  background: linear-gradient(182deg, #ffffff29, #ffffff0a 50%, #ffffff03);
  box-shadow: 4px 4px 12px #0000003d;
  color: white;
  width: 100%;
  min-width: 0;
}
.loan-offer-card.selected {
  border-color: #00a3ff;
}
.offer-bank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  min-height: 64px;
  flex: none;
  border-radius: 4px;
  background: #00000014;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.offer-bank img {
  max-width: 100%;
  max-height: 64px;
  object-fit: contain;
}
.offer-main {
  flex: 1;
  min-width: 0;
}
.offer-heading {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: flex-start;
  min-width: 0;
  font-size: 17px;
  line-height: 1.35;
}
.offer-choice {
  font: inherit;
  font-weight: 700;
  background: none;
  padding: 0;
  border: 0;
  color: white;
  cursor: pointer;
  text-align: left;
  overflow-wrap: anywhere;
}
.offer-choice[aria-pressed="true"],
.Accepted .offer-choice {
  color: #00a3ff;
}
.offer-choice:disabled {
  cursor: default;
}
.offer-badge {
  border: 1px solid #dcdcdc66;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
  font-weight: 400;
  color: #dcdcdc;
}
.offer-badge.Accepted {
  border-color: #52c41a;
  color: #dcdcdc;
}
.offer-terms {
  font-size: 14px;
  line-height: 1.35;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 12px 0 0;
}
.offer-terms > span {
  color: #dcdcdc;
}
.offer-reason,
.offer-description {
  font-size: 14px;
  color: #dcdcdc;
  margin: 12px 0 0;
  overflow-wrap: anywhere;
}
.offer-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
}
.offer-open {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: 0;
  color: #00a3ff;
  padding: 0;
  font-size: 14px;
  cursor: pointer;
}
.offer-open:disabled {
  opacity: 0.5;
  cursor: default;
}
.offer-open img {
  flex: none;
}
.consortium {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 24px;
  padding: 24px;
}
.consortium .offer-bank {
  min-height: 64px;
  align-self: flex-start;
}
.consortium .offer-heading {
  flex-wrap: wrap;
}
.consortium .offer-description {
  margin: 8px 0 24px;
}
.consortium dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  border-top: 1px solid #efefef14;
  padding-top: 24px;
  margin: 0 0 24px;
}
.consortium dt {
  font-size: 14px;
  font-weight: 400;
  color: #dcdcdc;
}
.consortium dd {
  font-size: 14px;
  margin: 4px 0 0;
}
.consortium.compact {
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
}
.consortium.compact .offer-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}
.consortium.compact dl {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 0;
  border: 0;
  gap: 16px;
  margin: 0;
}
.consortium.compact .offer-description {
  margin-bottom: 16px;
}
.offer-choice:focus-visible,
.offer-open:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 3px;
}
@media (max-width: 700px) {
  .offer-heading {
    flex-wrap: wrap;
  }
  .consortium.compact dl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .loan-offer-card:not(.consortium) {
    align-items: flex-start;
  }
  .offer-actions {
    flex-wrap: wrap;
  }
  .offer-bank {
    width: 48px;
    min-height: 48px;
  }
  .consortium {
    padding: 16px;
  }
  .offer-terms {
    gap: 8px;
  }
  .terms-divider {
    display: none;
  }
}
</style>

<style scoped>
.loan-offer-card:not(.consortium) .offer-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px 16px;
}
.loan-offer-card:not(.consortium) .offer-heading {
  grid-column: 1/-1;
}
.loan-offer-card:not(.consortium) .offer-terms {
  margin: 0;
}
.loan-offer-card:not(.consortium) .offer-reason {
  grid-column: 1/-1;
  margin: 0;
}
.loan-offer-card:not(.consortium) .offer-actions {
  grid-column: 2;
  grid-row: 2;
  align-self: center;
  margin: 0;
}
.consortium {
  position: relative;
}
.consortium .offer-badge {
  position: absolute;
  top: 48px;
  right: 24px;
}
.consortium .offer-badge.Accepted {
  border-color: #dcdcdc66;
}
.consortium .offer-badge.highlighted {
  border-color: #52c41a;
}
@media (max-width: 700px) {
  .loan-offer-card:not(.consortium) .offer-terms {
    grid-column: 1/-1;
  }
  .loan-offer-card:not(.consortium) .offer-actions {
    grid-column: 1/-1;
    grid-row: auto;
  }
}
</style>

<style scoped>
.consortium {
  gap: 8px;
}
.consortium .offer-bank {
  width: 80px;
  min-height: 80px;
  height: 80px;
  padding: 8px;
}
.loan-offer-card.selected {
  border-width: 2px;
}
</style>

<style scoped>.consortium{background:linear-gradient(204.6deg,#ffffff29,#ffffff0a 50%,#ffffff03)}</style>
