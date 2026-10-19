<template>
  <div class="home-empty-state" :class="'home-empty-state--' + kind">
    <img
      :src="deposit ? '/img/home/journey.svg' : '/img/home/empty-contract.svg'"
      alt=""
      class="home-empty-icon"
    />
    <p class="home-empty-title">
      {{ deposit ? "Sua jornada começa aqui" : "Você ainda não tem contratos" }}
    </p>
    <p class="home-empty-description">
      {{
        deposit
          ? "Faça seu primeiro depósito para acompanhar a evolução do seu patrimônio."
          : "Conheça as opções e solicite o seu primeiro contrato. Um consultor analisa o pedido e entra em contato."
      }}
    </p>
    <q-btn
      class="home-empty-action btn-pattern-transparent"
      no-caps
      :to="
        deposit
          ? { name: 'inicio', query: { modal: 'deposit' } }
          : { name: 'Contratos' }
      "
    >
      <span class="home-empty-action-icon"
        ><img
          :src="
            deposit
              ? '/img/home/deposit-arrow.svg'
              : '/img/home/contract-arrow.svg'
          "
          alt=""
      /></span>
      {{ deposit ? "Fazer primeiro depósito" : "Solicitar contrato" }}
    </q-btn>
  </div>
</template>
<script setup>
import { computed } from "vue";
const props = defineProps({
  kind: {
    type: String,
    required: true,
    validator: (value) => ["deposit", "contracts"].includes(value),
  },
});
const deposit = computed(() => props.kind === "deposit");
</script>
<style scoped>
.home-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  min-width: 0;
}
.home-empty-state--deposit {
  gap: 10px;
  min-height: 199px;
}
.home-empty-state--contracts {
  min-height: 560px;
  padding: 24px;
}
.home-empty-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
}
.home-empty-title {
  font:
    700 20px/1.5 Inter,
    sans-serif;
  margin: 0;
  overflow-wrap: anywhere;
}
.home-empty-state--deposit .home-empty-title {
  font-size: 24px;
}
.home-empty-description {
  font:
    400 17px/1.35 Inter,
    sans-serif;
  color: #dcdcdc;
  margin: 0;
  max-width: 560px;
}
.home-empty-action {
  border: 1px solid rgba(152, 152, 152, 0.16);
  border-radius: 8px;
  padding: 8px 12px;
  font:
    500 17px/1.35 Inter,
    sans-serif;
}
.home-empty-action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  margin-right: 12px;
  border-radius: 4px;
  background: linear-gradient(203deg, rgba(0, 0, 0, 0.24), rgba(0, 0, 0, 0.04));
}
@media (max-width: 599px) {
  .home-empty-state--contracts {
    min-height: 360px;
    padding: 24px 8px;
  }
  .home-empty-state--deposit {
    padding: 16px 0;
  }
}
</style>
