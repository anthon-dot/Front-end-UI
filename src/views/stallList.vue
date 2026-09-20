<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SearchField from '../components/SearchField.vue'
import api from '../services/api'
import { API_ORIGIN } from '../config/apiConfig'

const search = ref('')
const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push({ name: 'Landing' })
  }
}

const stalls = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return stalls.value
  return stalls.value.filter((s) => {
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.section && s.section.toLowerCase().includes(q))
    )
  })
})

async function loadStalls() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get('/stalls')
    stalls.value = (response.data || []).map((stall) => ({
      id: stall.id,
      name: stall.stallNo,
      section: stall.info || stall.stallType || 'Public Market',
      size: stall.stallType || 'Standard stall',
      price: Number(stall.monthlyRent || 0),
      status: String(stall.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE' ? 'Available' : 'Occupied',
      description: stall.info || 'Existing public market stall',
      image: stall.imageUrl ? `${API_ORIGIN}${stall.imageUrl}` : '/market-stall.webp',
    }))
  } catch (error) {
    errorMessage.value = error.message || 'Failed to load stalls.'
  } finally {
    isLoading.value = false
  }
}

function applyForStall(stall) {
  if (stall.status !== 'Available') {
    return
  }

  router.push({
    name: 'BusinessApplication',
    query: { stallId: stall.id }
  })
}

onMounted(loadStalls)
</script>

<template>
  <div class="stall-list container">
    <div class="header-row">
      <div class="left-controls">
        <button class="back-btn" @click="goBack">← Back</button>
        <h3>Showing {{ filtered.length }} of {{ stalls.length }} stalls</h3>
      </div>
      <SearchField v-model="search" placeholder="Search stalls by name or section" />
    </div>

    <div v-if="isLoading" class="empty-message">Loading stalls...</div>
    <div v-else-if="errorMessage" class="empty-message error">{{ errorMessage }}</div>

    <div v-else class="grid">
      <div v-for="stall in filtered" :key="stall.id" class="card">
        <div class="card-image">
          <img :src="stall.image" :alt="stall.name" />
          <span class="badge" :class="{'occupied': stall.status==='Occupied'}">{{ stall.status.toUpperCase() }}</span>
        </div>

        <div class="card-body">
          <div class="card-top">
            <h4>{{ stall.name }}</h4>
            <div class="price-tag">₱{{ stall.price.toLocaleString() }}<small>/mo</small></div>
          </div>

          <div class="meta">
            <div class="location">📍 {{ stall.section }}</div>
            <div class="size"><strong>Size:</strong> {{ stall.size }}</div>
          </div>

          <p class="desc">{{ stall.description }}</p>

          <div class="card-action">
            <div class="status-pill" :class="{ occupied: stall.status === 'Occupied' }">
              {{ stall.status === 'Occupied' ? 'Currently Occupied' : 'Available' }}
            </div>
            <button
              v-if="stall.status === 'Available'"
              class="apply-btn"
              type="button"
              @click="applyForStall(stall)"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./stallList.css"></style>
