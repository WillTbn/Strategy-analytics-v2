<template>
  <q-banner
    class="contract-section bg-transparent q-my-lg"
    rounded
    :class="{ 'active-section': isActive }"
  >
    <div class="row justify-between" style="align-items: center">
      <div class="col-12 col-md-8 row justify-between">
        <div class="col-12">
          <q-avatar size="32px" flat>
            <component :is="icon" color="#00a3ff" />
          </q-avatar>
          <span class="text-h6 q-ml-xs" style="vertical-align: middle">{{
            name
          }}</span>
        </div>
        <div class="col-12 col-md-5 q-pa-md">
          <span class="text-grey"> Saldo Atual/entrada: </span>
          <span class="text-primary q-mx-xs">
            {{ display(currentBalance) }}
          </span>
          |
          <span class="q-mx-xs text-grey">
            {{ display(currentEntry) }}
          </span>
        </div>
        <div class="col-auto q-pa-md">
          <span class="text-grey"> Próxima distribuição de lucros: </span>
          <span class="text-primary q-mx-xs">
            {{ display(profitDistributionBalance) }}
          </span>
          |
          <span class="text-gray">
            {{
              dashboard.view_wallet_value ? "••••" : dateLabel(distributionDate)
            }}
          </span>
        </div>
      </div>
      <div class="col-auto">
        <div class="row items-center text-caption" style="min-height: 140px">
          Evolução indisponível
        </div>
      </div>
      <div class="col-auto" style="align-self: flex-end" v-show="!isActive">
        <q-btn
          @click="emit('select')"
          class="border-primary border-radius-pattern"
          dense
        >
          <IconChevronDown
            width="24"
            height="24"
            class="btn-pattern-transparent-icon"
          />
        </q-btn>
      </div>
    </div>
    <q-slide-transition>
      <div class="q-pa-md" v-show="isActive">
        <slot></slot>

        <div class="row justify-between">
          <div class="col">
            <q-btn
              flat
              no-caps
              class="text-primary text-bold"
              size="lg"
              :to="id ? { name: 'contract', params: { id } } : undefined"
            >
              Ver Contrato
              <IconArrowRight class="q-ml-xs" />
            </q-btn>
          </div>
          <div class="col-auto">
            <q-btn
              @click="emit('closed')"
              class="border-primary border-radius-pattern"
              dense
            >
              <IconChevronUp
                width="24"
                height="24"
                class="btn-pattern-transparent-icon"
              />
            </q-btn>
          </div>
        </div>
      </div>
    </q-slide-transition>
    <!-- Seu template aqui -->
  </q-banner>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useStoreLayout } from "src/stores/layoutStore";
import { amountLabel } from "src/services/walletPresentation";
import { dateLabel } from "src/services/financeService";
const props = defineProps({
  id: String,
  name: String,
  currency: String,
  currentBalance: Number,
  currentEntry: Number,
  profitDistributionBalance: Number,
  distributionDate: String,
  icon: String,
  isActive: Boolean,
});
const { dashboard } = storeToRefs(useStoreLayout());
const display = (value) =>
  dashboard.value.view_wallet_value
    ? "••••"
    : amountLabel({ value, currency: props.currency });
const emit = defineEmits(["select", "edit", "closed"]);
</script>

<style scoped lang="sass">
.contract-section
  padding:16px
  border-radius: 8px
  background: linear-gradient(202.99deg, rgba(0, 0, 0, 0.24) 0.52%, rgba(0, 0, 0, 0.08) 51.12%, rgba(0, 0, 0, 0.04) 99.48%)
  backdrop-filter: blur(32px)
  box-shadow: 4px 4px 12px 0px #0000003D
</style>
