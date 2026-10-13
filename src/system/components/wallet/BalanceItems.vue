<template>
  <div class="balance-items col-12 col-sm q-mt-md-lg q-mt-xs-md">
    <div class="tool" :aria-busy="loading">
      <div class="q-mb-sm row items-center">
        <div
          style="width: 12px; height: 12px; border-radius: 1px"
          class="q-mr-sm"
          :class="colorItem"
        ></div>
        <span class="text-roboto-15-500 text-weight-bolder">{{ title }}</span>
        <q-btn flat :aria-label="`Sobre ${title}`"
          ><IconInfoCircle /><q-tooltip style="max-width: 280px">{{
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
            <p
              v-for="amount in amounts.slice(1)"
              :key="amount.currency"
              class="text-weight-light"
            >
              {{ viewValues ? "••••" : amountLabel(amount) }} · saldo em
              {{ amount.currency }}
            </p>
            <p v-if="amounts.length < 2" class="text-weight-light">
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
        <p class="text-roboto-16-400 text-muted col-lg-auto col-12">
          Variação indisponível
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
defineProps({
  title: String,
  colorItem: String,
  description: String,
  amounts: { type: Array, default: () => [] },
  viewValues: Boolean,
  loading: Boolean,
  error: String,
});
defineEmits(["retry"]);
</script>
