<template>
  <div class="data-contact row">
    <div
      class="col-2-7 text-align q-mt-md"
      v-for="(item, index) in dataContact"
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

const store = useUserStore()
const { data } = storeToRefs(store)

defineProps({
  classDiv: { type: String, default: 'col-3 text-align q-mt-md' }
})

const dataContact = computed(() => {
 const dv = data.value || {}
  return [
    { title: 'Nome Completo do Contato', value: dv.contato_nome ?? 'Maria Alice da Silva' },
    { title: 'Renda Média Mensal (R$)', value: dv.contato_telefone ?? '(18) 91502-2191' }
  ]
})
</script>

<style scoped>
/* Seus estilos aqui */
</style>
