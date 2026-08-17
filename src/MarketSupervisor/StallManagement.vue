<template>
  <div class="stall-management">
    <MarketSupervisorMenu />

    <!-- HEADER -->
    <header class="sm-header">
      <div class="title-wrap">
        <h1>Stall Management</h1>
        <div class="meta">Manage stalls, map locations, and occupancy</div>
      </div>

      <div class="controls">
        <SearchField v-model="search" placeholder="Search stalls..." />

        <select v-model="filterStatus" class="filter">
          <option value="All">All Status</option>
          <option value="VACANT">Vacant</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="RESERVED">Reserved</option>
        </select>

      </div>
    </header>

    <!-- MAP -->
    <div id="map"></div>

    <!-- TABLE -->
    <section class="table-wrap">
      <table class="stalls">
        <thead>
          <tr>
            <th>Stall</th>
            <th>Type</th>
            <th>Information</th>
            <th>Rent</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="stall in filteredStalls" :key="stall.id">
            <td>
              <span class="stall-badge">{{ stall.number }}</span>
            </td>
            <td>{{ stall.type }}</td>
            <td>{{ stall.info || 'No information' }}</td>
            <td>
              <span class="rent-text">{{ formatCurrency(stall.rent) }}</span>
            </td>
            <td>
              <span :class="['status', stall.status.toLowerCase()]">
                {{ stall.status }}
              </span>
            </td>
          </tr>

          <tr v-if="filteredStalls.length === 0">
            <td colspan="5">
              <div class="empty-state">No stalls found.</div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- SIDE PANEL MODAL -->
    <div v-if="showModal" class="gm-backdrop" @click.self="closeModal">
      <div class="gm-modal">
        <div class="gm-header">
          <h2>{{ editing ? 'Edit Stall' : 'Add Stall' }}</h2>
          <button class="gm-close" @click="closeModal">✕</button>
        </div>

        <div class="gm-body">
          <form @submit.prevent="saveStall">
            <label>
              Stall Number
              <input v-model="form.number" required />
            </label>

            <label>
              Stall Type
              <input v-model="form.type" required />
            </label>

            <label>
              Information
              <textarea v-model="form.info"></textarea>
            </label>

            <label>
              Monthly Rent
              <input v-model.number="form.rent" type="number" />
            </label>

           <label>
  Status
  <select v-model="form.status">
    <option value="VACANT">VACANT</option>
    <option value="OCCUPIED">OCCUPIED</option>
    <option value="RESERVED">RESERVED</option>
  </select>
</label>

<!-- SEARCH OCCUPANT -->
<div
  v-if="
    form.status === 'OCCUPIED' ||
    form.status === 'RESERVED'
  "
>
  <label>
    Search Occupant

    <input
      v-model="stakeholderSearch"
      type="text"
      placeholder="Search stakeholder..."
    />
  </label>

  <!-- RESULTS -->
<div
  v-if="
    stakeholderSearch &&
    filteredStakeholders.length
  "
  class="stakeholder-results"
>
  <div
    v-for="person in filteredStakeholders"
    :key="person.id"
    class="stakeholder-item"
    @click="selectStakeholder(person)"
  >
    {{ person.firstName }}
    {{ person.lastName }}
  </div>
</div>

  <!-- SELECTED -->
  <div
    v-if="selectedStakeholder"
    class="selected-occupant"
  >
    Selected:
    {{ selectedStakeholder.firstName }}
    {{ selectedStakeholder.lastName }}
  </div>
</div>

            <label>
              Latitude
              <input v-model.number="form.lat" type="number" step="any" />
            </label>

            <label>
              Longitude
              <input v-model.number="form.lng" type="number" step="any" />
            </label>

            <label>
              Stall Image
              <input type="file" @change="handleImageUpload" />
            </label>

            <img v-if="imagePreview" :src="imagePreview" class="gm-preview" />

            <div class="gm-actions">
              <button type="button" class="btn-secondary" @click="closeModal">
                Cancel
              </button>
              <button type="submit" class="btn-primary">Save Stall</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

import MarketSupervisorMenu from '../components/MarketSupervisorMenu.vue'
import SearchField from '../components/SearchField.vue'
import { API_ORIGIN } from '../config/apiConfig'
import api from '../services/api'

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  window.GOOGLE_MAPS_API_KEY ||
  'AIzaSyAzA90gDwhL18nqRNIEBklwXp_GFzCmjs4'
const DEFAULT_CENTER = { lat: 8.399991, lng: 124.291353 }
const MIN_MAP_ZOOM = 15
const MAX_MAP_ZOOM = 20
const DEFAULT_MAP_ZOOM = MIN_MAP_ZOOM + 3
const MAP_STYLES = [
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  }
]

const search = ref('')
const filterStatus = ref('All')
const stalls = ref([])
const showModal = ref(false)
const editing = ref(null)
const selectedImage = ref(null)
const imagePreview = ref('')

const form = ref({
  id: null,
  number: '',
  type: '',
  info: '',
  rent: 0,
  status: 'VACANT',
  lat: 8.399991,
  lng: 124.291353,
  imageUrl: ''
})

const filteredStalls = computed(() => {
  return stalls.value.filter((stall) => {
    const matchesSearch = stall.number
      .toLowerCase()
      .includes(search.value.toLowerCase())

    const matchesStatus =
      filterStatus.value === 'All' || stall.status === filterStatus.value

    return matchesSearch && matchesStatus
  })
})
const stakeholders = ref([])
const stakeholderSearch = ref('')
const selectedStakeholder = ref(null)
async function loadStakeholders() {
  const response = await api.get('/stakeholders')
  const data = response.data

  stakeholders.value = data
}

let googleMapsPromise = null
let map = null
let infoWindow = null
let markers = []
let mapClickListener = null

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps)

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        'script[data-google-maps-loader="true"]'
      )

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.google.maps))
        existingScript.addEventListener('error', reject)
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`
      script.async = true
      script.defer = true
      script.dataset.googleMapsLoader = 'true'
      script.onload = () => resolve(window.google.maps)
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  return googleMapsPromise
}

async function initializeMap() {
  const googleMaps = await loadGoogleMaps()

  map = new googleMaps.Map(document.getElementById('map'), {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
    minZoom: MIN_MAP_ZOOM,
    maxZoom: MAX_MAP_ZOOM,
    clickableIcons: false,
    disableDefaultUI: true,
    disableDoubleClickZoom: false,
    draggable: false,
    fullscreenControl: false,
    gestureHandling: 'cooperative',
    mapTypeControl: false,
    scrollwheel: true,
    styles: MAP_STYLES,
    streetViewControl: false,
    zoomControl: true
  })

  infoWindow = new googleMaps.InfoWindow()

  mapClickListener = map.addListener('click', (e) => {
    form.value.lat = e.latLng.lat()
    form.value.lng = e.latLng.lng()
  })
}

async function loadStalls() {
  const response = await api.get('/stalls')
  const data = response.data

  stalls.value = data.map((stall) => ({
    id: stall.id,
    number: stall.stallNo,
    type: stall.stallType,
    info: stall.info,
    rent: stall.monthlyRent,
    status: stall.status,
    lat: stall.latitude,
    lng: stall.longitude,
    imageUrl: stall.imageUrl
  }))

  loadMarkers()
}

function loadMarkers() {
  if (!map || !window.google?.maps) return

  markers.forEach((marker) => marker.setMap(null))
  markers = []

  const validStalls = stalls.value.filter(
    (s) => s.lat != null && s.lng != null
  )

  validStalls.forEach((stall, index) => {
    const marker = new window.google.maps.Marker({
      position: { lat: Number(stall.lat), lng: Number(stall.lng) },
      map,
      title: stall.number
    })

    marker.addListener('click', () => {
      openStallInfoWindow(marker, stall, index)
    })

    markers.push(marker)
  })

  window.previousStall = function (currentIndex) {
    if (!validStalls.length) return

    const previousIndex =
      (currentIndex - 1 + validStalls.length) % validStalls.length

    openStallByIndex(validStalls, previousIndex)
  }

  window.nextStall = function (currentIndex) {
    if (!validStalls.length) return

    const nextIndex = (currentIndex + 1) % validStalls.length

    openStallByIndex(validStalls, nextIndex)
  }
}

function getStallInfoContent(stall, index) {
  return `
  <div style="width:200px">
    ${
      stall.imageUrl
        ? `<img src="${API_ORIGIN}${stall.imageUrl}"
             style="width:100%;height:100px;object-fit:cover;border-radius:10px;margin-bottom:8px;" />`
        : ''
    }

    <strong>${stall.number}</strong><br>
    <div>${stall.type}</div>
    <div>${formatCurrency(stall.rent)}</div>

    <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px;">
      
      <button
        onclick="window.previousStall(${index})"
        style="width:100%;padding:8px;border:none;border-radius:8px;background:#1a73e8;color:white;cursor:pointer;"
      >
        ← Previous
      </button>

      <button
        onclick="window.nextStall(${index})"
        style="width:100%;padding:8px;border:none;border-radius:8px;background:#1a73e8;color:white;cursor:pointer;"
      >
        Next →
      </button>

    </div>
  </div>
`
}

function openStallInfoWindow(marker, stall, index) {
  infoWindow.setContent(getStallInfoContent(stall, index))
  infoWindow.open(map, marker)
}

function openStallByIndex(validStalls, index) {
  const stall = validStalls[index]
  const marker = markers[index]

  if (!stall || !marker) return

  map.panTo({ lat: Number(stall.lat), lng: Number(stall.lng) })
  map.setZoom(19)
  openStallInfoWindow(marker, stall, index)
}

function resetForm() {

  form.value = {
    id: null,
    number: '',
    type: '',
    info: '',
    rent: 0,
    status: 'VACANT',
    lat: 8.399991,
    lng: 124.291353,
    imageUrl: ''
  }

  stakeholderSearch.value = ''
  selectedStakeholder.value = null
}

function openAdd() {
  infoWindow?.close()
  editing.value = null
  selectedImage.value = null
  imagePreview.value = ''
  resetForm()
  showModal.value = true
}

function editStall(stall) {

  infoWindow?.close()

  editing.value = stall.id

  selectedImage.value = null

  form.value = { ...stall }

  stakeholderSearch.value = ''
  selectedStakeholder.value = null

  imagePreview.value =
    stall.imageUrl
      ? API_ORIGIN +
        stall.imageUrl
      : ''

  showModal.value = true
}
function closeModal() {

  showModal.value = false

  selectedImage.value = null

  imagePreview.value = ''

  stakeholderSearch.value = ''

  selectedStakeholder.value = null
}

function handleImageUpload(event) {
  selectedImage.value = event.target.files[0]
  if (selectedImage.value) {
    imagePreview.value = URL.createObjectURL(selectedImage.value)
  }
}

async function saveStall() {

  try {

    let imageUrl =
      form.value.imageUrl || ''

    // =========================
    // UPLOAD IMAGE
    // =========================
    if (selectedImage.value) {

      const fd = new FormData()

      fd.append(
        'file',
        selectedImage.value
      )

      const uploadResponse =
        await api.post('/stalls/upload', fd)

      imageUrl =
        uploadResponse.data
    }

    // =========================
    // SAVE STALL
    // =========================
    const payload = {

      stallNo:
        form.value.number,

      stallType:
        form.value.type,

      monthlyRent:
        form.value.rent,

      status:
        form.value.status,

      info:
        form.value.info,

      latitude:
        form.value.lat,

      longitude:
        form.value.lng,

      imageUrl
    }

    const url =
      editing.value
        ? `/stalls/${editing.value}`
        : '/stalls'

    const response =
      editing.value
        ? await api.put(url, payload)
        : await api.post(url, payload)

    // IMPORTANT:
    // get saved stall id
    const savedStall =
      response.data

    // =========================
    // ASSIGN OCCUPANT
    // =========================
    if (

      selectedStakeholder.value &&

      (
        form.value.status
          === 'OCCUPIED'

        ||

        form.value.status
          === 'RESERVED'
      )

    ) {

      await api.post(`/occupants/allocate/${savedStall.id}`, {
        stakeholderId:
          selectedStakeholder.value.id
      })
    }

    await loadStalls()

    closeModal()

    alert(
      'Stall saved successfully'
    )

  } catch (error) {

    console.error(error)

    alert(
      error.message ||
      'Failed to save stall'
    )
  }
}

function formatCurrency(n) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(n || 0)
}

onMounted(async () => {
  try {
    await initializeMap()

    await Promise.all([
      loadStalls(),
      loadStakeholders()
    ])
  } catch (error) {
    console.error(error)

    alert(
      error.message ||
      'Failed to load Google Maps'
    )
  }
})
const filteredStakeholders = computed(() => {
  return stakeholders.value.filter((s) => {
    const full =
      `${s.firstName || ''} ${s.lastName || ''}`
        .toLowerCase()

    return full.includes(
      stakeholderSearch.value.toLowerCase()
    )
  })
})
function selectStakeholder(person) {

  selectedStakeholder.value =
    person

  stakeholderSearch.value =
    `${person.firstName}
     ${person.lastName}`
}

onBeforeUnmount(() => {
  mapClickListener?.remove()
  markers.forEach((marker) => marker.setMap(null))
  markers = []
  infoWindow?.close()
  delete window.previousStall
  delete window.nextStall
})
</script>

<style scoped>
.stall-management {
  padding: 24px;
  margin-left: 220px;
  background: #f4f7fb;
  min-height: 100vh;
  font-family: Inter, sans-serif;
}

.sm-header,
.table-wrap {
  background: #fff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  margin-bottom: 24px;
}

.sm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-wrap h1 {
  margin: 0;
}

.meta {
  color: #64748b;
  margin-top: 4px;
}

.controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter,
input,
textarea,
select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
}

.primary,
.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
}

#map {
  height: 550px;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 24px;
}

table.stalls {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #eef2f7;
}

th {
  font-size: 13px;
  text-transform: uppercase;
  color: #64748b;
}

.stall-badge {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 700;
}

.rent-text {
  color: #059669;
  font-weight: 700;
}

.status {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status.vacant {
  background: #dbeafe;
  color: #1d4ed8;
}

.status.occupied {
  background: #dcfce7;
  color: #166534;
}

.status.reserved {
  background: #fef3c7;
  color: #92400e;
}

.actions {
  display: flex;
  gap: 8px;
}

.icon,
.btn-secondary,
.danger {
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.icon {
  background: #ecfdf5;
  color: #047857;
}

.danger {
  background: #fef2f2;
  color: #dc2626;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 24px;
}

.gm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 20000;
}

.gm-modal {
  width: 420px;
  max-width: 100%;
  height: 100vh;
  background: white;
  box-shadow: 4px 0 30px rgba(0, 0, 0, 0.15);
  animation: slideInLeft 0.25s ease;
  display: flex;
  flex-direction: column;
}

.gm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.gm-close {
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
}

.gm-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.gm-body form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gm-body label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
}

.gm-preview {
  width: 100%;
  max-height: 220px;
  object-fit: contain;
  border-radius: 12px;
}

.gm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-secondary {
  background: #f3f4f6;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .stall-management {
    margin-left: 0;
    padding: 16px;
  }

  .sm-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .controls {
    flex-wrap: wrap;
  }

  .gm-modal {
    width: 100%;
  }
}
.stakeholder-results {
  margin-top: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: white;
}

.stakeholder-item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
}

.stakeholder-item:hover {
  background: #f8fafc;
}

.selected-occupant {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #ecfdf5;
  color: #166534;
  font-weight: 600;
}
.stakeholder-results {
  margin-top: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: white;
  position: relative;
  z-index: 9999;
}

.stakeholder-item {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
}

.stakeholder-item:hover {
  background: #eff6ff;
}
</style>
