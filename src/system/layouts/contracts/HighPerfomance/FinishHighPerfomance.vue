<template>
  <div
    class="finish-high-perfomance row bg-transparent text-center justify-center"
    :class="{ 'finish-high-perfomance--offer': offer }"
  >
    <div v-if="offer" class="finish-high-perfomance__picture">
      <img src="/system/icons/contracts/offer/success.png" alt="" />
    </div>
    <q-icon
      v-else
      name="img:/system/icons/finnaly-cash.png"
      width="407"
      height="400"
      class="col-12"
    />
    <div class="col-12">
      <p class="text-h6">Solicitação de Contrato enviada!</p>
      <p class="text-grey">
        Sua solicitação será analisada e logo um dos nossos Consultores entrará
        em contato.
      </p>
    </div>
  </div>
</template>

<script setup>
import { defineComponent } from "vue";
defineProps({ offer: Boolean });

defineComponent({
  name: "FinishHighPerfomance",
});
// Seu código aqui
</script>

<style scoped>
.finish-high-perfomance__picture {
  width: 407px;
  max-width: 100%;
  aspect-ratio: 407 / 400;
  position: relative;
  overflow: hidden;
  margin-bottom: 32px;
}
.finish-high-perfomance__picture img {
  position: absolute;
  width: 196.08%;
  height: 108.87%;
  max-width: none;
  left: -48.04%;
  top: -4.44%;
}
.finish-high-perfomance--offer .text-h6 {
  font-size: 24px;
  line-height: 36px;
  font-weight: 700;
  margin: 0 0 12px;
}
.finish-high-perfomance--offer .text-grey {
  font-size: 17px;
  line-height: 23px;
  margin: 0;
}
</style>
