<template>
  <section class="secured-request product-options">
    <div class="request-columns">
      <div class="request-intro">
        <h1>
          {{
            consortium
              ? "Consórcio Inteligente para Realizar Seus Planos"
              : "Crédito Inteligente e Eficiente para Quem Precisa"
          }}
        </h1>
        <p v-if="consortium">
          Planeje sua compra com parcelas ideais para você e conte com uma carta
          de crédito flexível para usar no momento certo. Simule agora e
          descubra como é simples!
        </p>
        <p v-else>
          Seu imóvel ou seu veículo são garantias para você ter um crédito com
          melhores condições. Simule agora para conferir!
        </p>
        <div class="product-note">
          <img
            :src="`/figma/loan-request/${consortium ? 'pig' : 'star'}.svg`"
            alt=""
          /><span v-if="consortium"
            >Participe de um grupo e conquiste seu imóvel ou automóvel sem
            juros!</span
          ><span v-else
            >Rápido, Fácil, Seguro e Personalizado!<br />Os empréstimos da
            Strategy Analytics são os melhores do mercado.</span
          >
        </div>
      </div>
      <section class="request-card">
        <h2>
          {{ consortium ? "Opções de Consórcio" : "Crédito com Garantia" }}
        </h2>
        <div class="product-cards">
          <card-garantia
            v-for="kind in ['imovel', 'automovel']"
            :key="kind"
            :kind="kind"
            :image="`/figma/loan-request/${kind === 'imovel' ? 'house' : 'car'}.png`"
            :title="kind === 'imovel' ? 'De Imóvel' : 'De Automóvel'"
            :description="descriptions[kind][0]"
            :sub-description="descriptions[kind][1]"
            @simular="$emit('simular', kind)"
          />
        </div>
      </section>
    </div>
  </section>
</template>
<script setup>
import { computed } from "vue";
import CardGarantia from "src/system/components/card/CardGarantia.vue";
const props = defineProps({ consortium: Boolean });
defineEmits(["simular"]);
const descriptions = computed(() =>
  props.consortium
    ? {
        imovel: ["Taxa Adm: 0,09% ao mês", "Lance Embutido de 30% do Crédito"],
        automovel: [
          "Taxa Adm: 0,25% ao mês",
          "Lance Embutido de 15% do Crédito",
        ],
      }
    : {
        imovel: ["De R$ 5 mil à 150 mil", "Juros a partir de 1,49% a.m"],
        automovel: [
          "De R$ 50 mil à 3 milhões",
          "Juros a partir de 1,09% a.m + IPCA",
        ],
      },
);
</script>
<style scoped src="./loanRequest.scss"></style>
<style scoped>
.product-options {
  padding-top: 56px;
}
.request-intro h1 {
  margin: 8px 0 12px;
}
.request-card {
  margin-top: 8px;
  padding: 24px 32px;
  gap: 32px;
}
.request-card h2 {
  margin: 0;
}
.product-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}
.product-note {
  display: flex;
  align-items: center;
  gap: 8px;
  border-left: 2px solid #00a3ff;
  padding: 12px 16px;
  border-radius: 4px;
  background: linear-gradient(182deg, #ffffff29, #ffffff03);
  font-size: 14px;
  color: #989898;
  margin-top: 40px;
  width: fit-content;
}
.product-note img {
  flex: none;
}
@media (max-width: 700px) {
  .product-options {
    padding-top: 16px;
  }
  .request-card {
    padding: 24px 16px;
  }
  .product-cards {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
