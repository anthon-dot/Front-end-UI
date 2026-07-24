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
      image: stall.imageUrl ? `${API_ORIGIN}${stall.imageUrl}` : '/market-stall.png',
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

<style scoped>
.container{
  padding:24px;
  --bg: #f8fafc;
  --card-bg: #ffffff;
  --muted: #6b7280;
  --accent: #0b5cff;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}
.header-row{
  display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px
}
.left-controls{display:flex;align-items:center;gap:14px}
.back-btn{background:transparent;border:1px solid rgba(15,23,42,0.06);padding:8px 12px;border-radius:10px;cursor:pointer;font-weight:600}
.back-btn:hover{background:rgba(15,23,42,0.03);transform:translateY(-1px)}
.grid{display:grid;grid-template-columns:repeat(1,1fr);gap:20px}
.card{background:var(--card-bg);border-radius:14px;box-shadow:0 6px 18px rgba(15,23,42,0.06);overflow:hidden;display:flex;flex-direction:column;transition:transform .18s ease,box-shadow .18s ease}
.card:hover{transform:translateY(-8px);box-shadow:0 18px 40px rgba(15,23,42,0.12)}
.card-image{position:relative;height:180px;overflow:hidden;border-bottom-left-radius:0;border-bottom-right-radius:0}
.card-image img{width:100%;height:100%;object-fit:cover;display:block}
.badge{position:absolute;top:12px;right:12px;padding:6px 10px;border-radius:999px;font-weight:700;font-size:12px;background:rgba(15,92,255,0.08);color:var(--accent);backdrop-filter:blur(4px)}
.badge.occupied{background:rgba(194,58,58,0.08);color:#c23a3a}
.card-body{padding:16px 18px;display:flex;flex-direction:column;gap:10px;flex:1}
.card-top{display:flex;justify-content:space-between;align-items:center;gap:12px}
.card-top h4{margin:0;font-size:18px}
.price-tag{background:linear-gradient(180deg,#ffffff,#f8fbff);padding:6px 10px;border-radius:10px;color:var(--accent);font-weight:700;border:1px solid rgba(11,92,255,0.08)}
.price-tag small{font-size:11px;color:var(--muted);margin-left:6px}
.meta{color:var(--muted);font-size:13px;display:flex;gap:10px;flex-wrap:wrap}
.desc{color:#374151;margin:0 0 6px 0;font-size:14px}
.card-action{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:10px}
.status-pill{display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;background:rgba(11,92,255,0.06);color:var(--accent);font-weight:700;border:1px solid rgba(11,92,255,0.06)}
.status-pill.occupied{background:rgba(194,58,58,0.06);color:#c23a3a;border-color:rgba(194,58,58,0.08)}
.apply-btn{border:0;border-radius:8px;background:#0b5cff;color:#fff;font-weight:700;padding:8px 12px;cursor:pointer}
.empty-message{padding:28px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#475569;text-align:center}
.empty-message.error{border-color:#fecdd3;background:#fff1f2;color:#be123c}

/* SearchField sizing */
:deep(.search-field){max-width:420px;width:100%}

@media(min-width:700px){.grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1100px){.grid{grid-template-columns:repeat(3,1fr)}}

</style>
