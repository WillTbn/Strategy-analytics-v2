<template>
  <section
    class="loan-status-card"
    :class="{ expanded: isActive, settled: mode === 'settled' }"
  >
    <div class="loan-status-card__header">
      <div class="loan-status-card__left">
        <div class="loan-status-card__title">
          <img
            :src="asset(mode === 'settled' ? 'settled.svg' : 'active.svg')"
            alt=""
          />
          <h3>{{ title }}</h3>
          <span v-if="typeDescription" class="loan-type"
            ><img v-if="kind" :src="asset(kind.icon)" alt="" />{{
              typeDescription
            }}</span
          >
        </div>
        <dl class="loan-status-card__stats">
          <div>
            <dt>
              {{ mode === "settled" ? "Valor da Parcela" : "Próxima Parcela" }}
            </dt>
            <dd>
              <strong :class="{ accent: mode !== 'settled' }">{{
                nextInstallment ?? "—"
              }}</strong
              ><template v-if="mode !== 'settled'"
                ><i class="loan-divider" />Ven.: {{ dueDate || "—" }}</template
              >
            </dd>
          </div>
          <div>
            <dt>
              {{
                type === "consorcio" ? "Status do Prazo" : "Status das Parcelas"
              }}
            </dt>
            <dd>
              <strong :class="{ accent: mode !== 'settled' }">{{
                installmentsPaidOff == null
                  ? "—"
                  : `${installmentsPaidOff} ${type === "consorcio" ? "meses" : "pagas"}`
              }}</strong>
              de {{ totalInstallments ?? "—" }}
            </dd>
          </div>
          <div v-if="type !== 'consorcio'">
            <dt>Juros</dt>
            <dd>{{ interest || "—" }}</dd>
          </div>
          <div v-if="type === 'consorcio' || administrativeFee">
            <dt>Taxa Admin.:</dt>
            <dd>{{ administrativeFee || "—" }}</dd>
          </div>
          <div v-if="type === 'consorcio' || embeddedBid">
            <dt>Lance Embutido:</dt>
            <dd>{{ embeddedBid || "—" }}</dd>
          </div>
          <div v-if="type === 'colateral' || profDistribution">
            <dt>Distribuição de Lucros</dt>
            <dd class="accent">{{ profDistribution || "—" }}</dd>
          </div>
          <div v-else>
            <dt>Administradora</dt>
            <dd>
              <img
                v-if="administrationImage[adminstration]"
                :src="administrationImage[adminstration]"
                :alt="adminstration"
                class="loan-bank"
              /><span v-else>{{ adminstration || "—" }}</span>
            </dd>
          </div>
          <div v-if="mode === 'settled'">
            <dt>Quitado em</dt>
            <dd class="accent">{{ paidOff || "—" }}</dd>
          </div>
        </dl>
      </div>
      <q-circular-progress
        show-value
        :value="progress ?? 0"
        size="115px"
        :thickness="0.1"
        :color="mode === 'settled' ? 'positive' : 'primary'"
        track-color="grey-9"
        :aria-label="
          progress == null
            ? 'Quitação indisponível'
            : `${progress}% de quitação`
        "
        ><span class="loan-progress"
          ><b>{{ progress == null ? "—" : progress + "%" }}</b
          ><small>Quitação</small></span
        ></q-circular-progress
      >
      <button
        v-if="!isActive"
        type="button"
        class="loan-toggle"
        :aria-label="`Expandir ${title}`"
        :aria-expanded="false"
        @click="$emit('select')"
      >
        <img :src="asset('expand.svg')" alt="" /></button
      ><span v-else />
    </div>
    <q-slide-transition
      ><div v-show="isActive" class="loan-status-card__expanded">
        <slot />
        <footer>
          <router-link
            v-if="!detail && hash"
            :to="{ name: 'Empréstimos', query: { hash } }"
            >Ver Empréstimo<img :src="asset('next.svg')" alt="" /></router-link
          ><span v-else /><button
            type="button"
            class="loan-toggle"
            :aria-label="`Recolher ${title}`"
            :aria-expanded="true"
            @click="$emit('closed')"
          >
            <img class="loan-collapse" :src="asset('collapse.svg')" alt="" />
          </button>
        </footer></div
    ></q-slide-transition>
  </section>
</template>
<script setup>
import { computed } from "vue";
import {
  installmentProgress,
  loanKindPresentation,
} from "src/services/loanSummaryPresentation";
const props = defineProps({
  mode: { type: String, default: "active" },
  detail: Boolean,
  title: String,
  type: String,
  typeDescription: String,
  hash: String,
  nextInstallment: [Number, String],
  dueDate: String,
  interest: String,
  totalInstallments: Number,
  installmentsPaidOff: Number,
  administrativeFee: String,
  profDistribution: String,
  embeddedBid: String,
  adminstration: String,
  paidOff: String,
  isActive: Boolean,
  confirmedSettled: Boolean,
});
defineEmits(["select", "closed"]);
const asset = (name) => "/figma/my-leverage/" + name;
const progress = computed(() =>
  props.confirmedSettled && props.mode === "settled"
    ? 100
    : installmentProgress(props.installmentsPaidOff, props.totalInstallments),
);
const kind = computed(() => loanKindPresentation(props.type));
const administrationImage = {
  Sicredi: "/icons/banks/sicredi.png",
  Porto: "/icons/banks/porto.png",
  Itau: "/icons/banks/itau.png",
  Inter: "/icons/banks/inter.png",
};
</script>
<style scoped>
.loan-status-card {
  font-family: Inter, sans-serif;
  color: white;
  padding: 16px;
  margin-bottom: 24px;
  border-radius: 8px;
  background: linear-gradient(
    182deg,
    #0000003d 0.52%,
    #00000014 51.12%,
    #0000000a 99.48%
  );
  backdrop-filter: blur(20px);
  box-shadow: 4px 4px 12px #0000003d;
}
.loan-status-card__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 115px 32px;
  align-items: center;
  gap: 48px;
}
.loan-status-card__left {
  min-width: 0;
}
.loan-status-card__title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.loan-status-card__title h3 {
  font:
    700 20px/1.5 Inter,
    sans-serif;
  margin: 0;
  overflow-wrap: anywhere;
}
.loan-type {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  padding: 2px 8px;
  min-height: 24px;
  border: 1px solid #656565;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.35;
  background: linear-gradient(183deg, #ffffff29, #ffffff0a 50%, #ffffff03);
}
.loan-status-card__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 24px 48px;
  margin: 24px 0 0;
  color: #dcdcdc;
  font-size: 17px;
  line-height: 1.35;
}
.loan-status-card__stats > div {
  min-width: 0;
}
.loan-status-card__stats dt {
  margin-bottom: 8px;
}
.loan-status-card__stats dd {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  overflow-wrap: anywhere;
}
.loan-status-card__stats strong {
  font-weight: 400;
}
.loan-status-card__stats .accent {
  color: #00a3ff;
  font-weight: 700;
}
.loan-divider {
  width: 6px;
  height: 6px;
  background: #989898;
}
.loan-bank {
  max-width: 150px;
  height: 23px;
  object-fit: contain;
  object-position: left;
}
.loan-progress {
  display: flex;
  flex-direction: column;
  text-align: center;
  gap: 8px;
}
.loan-progress b {
  font:
    700 14px/1.35 Inter,
    sans-serif;
}
.loan-progress small {
  font:
    400 12px/1.35 Inter,
    sans-serif;
  color: #989898;
}
.loan-toggle {
  display: flex;
  align-items: center;
  padding: 3px;
  width: 32px;
  height: 32px;
  border: 1px solid #00a3ff;
  border-radius: 4px;
  background: none;
  cursor: pointer;
}
.loan-collapse {
  transform: rotate(180deg);
}
.loan-status-card__expanded {
  padding-top: 24px;
}
footer {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
footer a {
  color: #00a3ff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  font:
    500 20px/1 Roboto,
    sans-serif;
}
button:focus-visible,
a:focus-visible {
  outline: 2px solid #75cfff;
  outline-offset: 4px;
}
@media (max-width: 1100px) {
  .loan-status-card__header {
    gap: 24px;
  }
  .loan-status-card__stats {
    gap: 16px 24px;
  }
}
@media (max-width: 700px) {
  .loan-status-card__header {
    grid-template-columns: minmax(0, 1fr) 32px;
    gap: 16px;
  }
  .loan-status-card__header > .q-circular-progress {
    grid-row: 2;
    grid-column: 1;
  }
  .loan-status-card__header > .loan-toggle {
    grid-column: 2;
    grid-row: 1;
  }
  .loan-status-card__title {
    align-items: flex-start;
  }
  .loan-type {
    margin-left: 0;
  }
  .loan-status-card__stats {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  .loan-status-card__title h3 {
    font-size: 18px;
  }
  footer a {
    font-size: 17px;
  }
}
</style>
