<template>
  <div class="balance-items col-12 col-sm q-mt-md-lg q-mt-xs-md">
    <div class="tool" :aria-busy="loading">
      <div class="q-mb-sm row items-center">
        <div
          style="width: 12px; height: 12px; border-radius: 1px"
          class="q-mr-sm"
          :class="colorItem"
        ></div>
        <span class="balance-title">{{ title }}</span>
        <q-btn flat padding="0" class="q-ml-sm" :aria-label="`Sobre ${title}`"
          ><IconInfoCircle :size="20" /><q-tooltip style="max-width: 280px">{{
            description
          }}</q-tooltip></q-btn
        >
      </div>
      <div class="row justify-between items-center q-mt-lg">
        <div class="col-lg-auto col-12" style="display: flex; align-items: end">
          <div style="line-height: 1rem">
            <p class="text-roboto-32-700">
              {{
                loading ? "…" : viewValues ? "••••" : amountLabel(amounts[0])
              }}
            </p>
            <p v-if="empty" class="empty-usd">
              {{ viewValues ? "••••" : "(USD 0.00)" }}
            </p>
            <p
              v-for="amount in empty ? [] : amounts.slice(1)"
              :key="amount.currency"
              class="text-weight-light"
            >
              {{ viewValues ? "••••" : amountLabel(amount) }} · saldo em
              {{ amount.currency }}
            </p>
            <p v-if="!empty && amounts.length < 2" class="text-weight-light">
              {{
                loading
                  ? "Carregando"
                  : error
                    ? "Consulta indisponível"
                    : "Conversão indisponível"
              }}
            </p>
          </div>
        </div>
        <p
          v-if="showComparison"
          class="text-roboto-16-400 text-muted col-lg-auto col-12"
        >
          {{ comparisonLabel }}
        </p>
      </div>
      <div v-if="error" role="alert" class="text-caption">
        {{ error }}
        <q-btn
          flat
          dense
          no-caps
          label="Tentar novamente"
          @click="$emit('retry')"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { IconInfoCircle } from "@tabler/icons-vue";
import { amountLabel } from "src/services/walletPresentation";
import { numericValue } from "src/services/walletPresentation";
import { computed } from "vue";
const props = defineProps({
  title: String,
  colorItem: String,
  description: String,
  amounts: { type: Array, default: () => [] },
  viewValues: Boolean,
  loading: Boolean,
  error: String,
  empty: Boolean,
  showComparison: { type: Boolean, default: true },
  comparisonPercentage: { type: Number, default: null },
});
const comparisonLabel = computed(() =>
  numericValue(props.comparisonPercentage) === null
    ? "Variação indisponível"
    : new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(props.comparisonPercentage) + "% vs. período anterior",
);
defineEmits(["retry"]);
</script>
<style scoped>
.balance-title {
  font:
    400 20px/1.35 Inter,
    sans-serif;
  color: #dcdcdc;
}
.empty-usd {
  font:
    500 16px/1.1 Roboto,
    sans-serif;
  color: #dcdcdc;
}
</style>
