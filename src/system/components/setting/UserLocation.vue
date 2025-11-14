<template>
  <div class="col-12 row">
    <button @click="getUserLocation" :disabled="loading" v-if="!location.place_id">
      {{ loading ? 'Obtendo localização...' : 'Obter Minha Localização' }}
    </button>
    
    <div v-else class="row col-12">
      <div class="col-3 text-align q-mt-md">
        <p class="text-grey">Localização Atual</p>
        <p>{{ location.address.suburb }}, {{ location.address.state }} </p>
      </div>
      <div class="col-3 text-align q-mt-md">
        <p class="text-grey">CEP</p>
        <p>{{ location.address.postcode }}</p>
      </div>
      <div class="col-3 text-align q-mt-md">
        <p class="text-grey">Logradouro</p>
        <p>{{ location.address.city }}</p>
      </div>
      <!-- <p>📍 Latitude: {{ userLocation.latitude }}</p>
      <p>📍 Longitude: {{ userLocation.longitude }}</p>
      <p v-if="userLocation.address">📍 Endereço: {{ userLocation.address }}</p> -->
    </div>
    
    <div v-if="locationError" class="error">
      ❌ {{ locationError }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from 'src/stores/user'
import {storeToRefs} from "pinia"
const userLocation = ref(null)
const locationError = ref(null)
const loading = ref(false)
const storeUser = useUserStore()
const {location} = storeToRefs(storeUser)

const getUserLocation = async () => {
  loading.value = true
  locationError.value = null

  if (!navigator.geolocation) {
    locationError.value = 'Geolocalização não é suportada pelo seu navegador'
    loading.value = false
    return
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })
    })

    userLocation.value = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    }

    console.log(userLocation.value)

    // Opcional: obter endereço a partir das coordenadas
    await getAddressFromCoords()

  } catch (error) {
    handleLocationError(error)
  } finally {
    loading.value = false
  }
}

const handleLocationError = (error) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      locationError.value = 'Usuário negou a solicitação de geolocalização'
      break
    case error.POSITION_UNAVAILABLE:
      locationError.value = 'Localização indisponível'
      break
    case error.TIMEOUT:
      locationError.value = 'Tempo limite para obter localização'
      break
    default:
      locationError.value = 'Erro desconhecido ao obter localização'
  }
}

const getAddressFromCoords = async () => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.value.latitude}&lon=${userLocation.value.longitude}`
    )
    const data = await response.json()

    if (data.display_name) {
      userLocation.value.address = data.display_name
      userLocation.value.postcode = data.address?.postcode
    }
    storeUser.setLocation(data)


  } catch (error) {
    console.log('Não foi possível obter o endereço')
  }
}
</script>


<style scoped>
.error {
  color: #ff4444;
  margin-top: 10px;
}

button {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}
</style>
