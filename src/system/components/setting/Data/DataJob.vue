<template>
  <div class="data-job row">
    <div
      class="col-2-7 text-align q-mt-md"
      v-for="(item, index) in dataJob"
      :key="index"
    >
      <p class="text-grey">{{ item.title }}</p>
      <p>{{ item.value }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from 'src/stores/user'
import { storeToRefs } from 'pinia'
import filters from 'src/boot/helpFilter'
const store = useUserStore()
const { data } = storeToRefs(store)

defineProps({
  classDiv: { type: String, default: 'col-3 text-align q-mt-md' }
})

const dataJob = computed(() => {
  const dv = data.value || {}

  const patrimonio = () =>{
    if(dv.patrimonio_valor){
      return filters.currentValueBR(dv.patrimonio_valor)
    }
    return ""

  }

  return [
    { title: 'Atividade Trabalhista', value: dv.profissao?.label ?? 'Empresário' },
    { title: 'Renda Média Mensal (R$)', value: dv.rendaAnual?.label ?? 'R$ 20.000,00' },
    { title: 'Renda Média Mensal da Família (R$)', value: dv.rendaAnualFamilia?.label ?? 'R$ 31.000,00' },
    { title: 'Valor Aproximado Dos Seus Bens (R$)', value: patrimonio() }
  ]
})
</script>

<style scoped>
/* Seus estilos aqui */
</style>
