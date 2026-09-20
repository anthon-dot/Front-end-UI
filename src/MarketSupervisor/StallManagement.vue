<template>
  <div class="stall-management">
    <MarketSupervisorMenu />

    <!-- HEADER -->
    <header class="sm-header">
      <div class="title-wrap">
        <h1>Stall Management</h1>
        <div class="meta">View stalls, track occupancy, and assign stalls to stakeholders</div>
      </div>

      <div class="controls">
        <SearchField v-model="search" placeholder="Search stalls by number or tenant..." />

        <select v-model="filterStatus" class="filter" aria-label="Filter by status">
          <option value="All">All Status ({{ stalls.length }})</option>
          <option value="VACANT">Vacant ({{ vacantCount }})</option>
          <option value="OCCUPIED">Occupied ({{ occupiedCount }})</option>
          <option value="RESERVED">Reserved ({{ reservedCount }})</option>
        </select>
      </div>
    </header>

    <!-- STATS OVERVIEW CHIPS -->
    <section class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon total-icon">
          <i class="pi pi-th-large"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Stalls</span>
          <span class="stat-value">{{ stalls.length }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon occupied-icon">
          <i class="pi pi-check-circle"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Occupied</span>
          <span class="stat-value">{{ occupiedCount }} <small>({{ occupancyRate }}%)</small></span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon vacant-icon">
          <i class="pi pi-inbox"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Vacant</span>
          <span class="stat-value">{{ vacantCount }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon reserved-icon">
          <i class="pi pi-clock"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Reserved</span>
          <span class="stat-value">{{ reservedCount }}</span>
        </div>
      </div>
    </section>

    <!-- MAP CONTAINER -->
    <section class="map-card">
      <div class="map-card-header">
        <div class="map-title">
          <i class="pi pi-map-marker"></i>
          <strong>Interactive Market Map</strong>
        </div>
        <div class="map-legend">
          <span class="legend-item"><span class="dot dot-occupied"></span> Occupied</span>
          <span class="legend-item"><span class="dot dot-vacant"></span> Vacant</span>
          <span class="legend-item"><span class="dot dot-reserved"></span> Reserved</span>
        </div>
      </div>

      <!-- Map Element -->
      <div id="map" class="map-viewport"></div>
    </section>

    <!-- TABLE -->
    <section class="table-wrap">
      <div class="table-header-bar">
        <h2>Stall Registry ({{ filteredStalls.length }})</h2>
        <span class="table-hint">Click 📍 to locate on the map, or Assign to manage stall occupancy</span>
      </div>

      <table class="stalls">
        <thead>
          <tr>
            <th>Stall</th>
            <th>Type / Section</th>
            <th>Occupant / Tenant</th>
            <th>Monthly Rent</th>
            <th>Status</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="stall in filteredStalls" :key="stall.id">
            <td>
              <span class="stall-badge">{{ stall.number }}</span>
            </td>
            <td>
              <div class="stall-type-name">{{ stall.type || 'Standard' }}</div>
              <div v-if="stall.info" class="stall-info-sub">{{ stall.info }}</div>
            </td>
            <td>
              <div v-if="getOccupantName(stall)" class="occupant-badge">
                <i class="pi pi-user occupant-icon"></i>
                <span>{{ getOccupantName(stall) }}</span>
              </div>
              <span v-else class="text-muted">— Vacant —</span>
            </td>
            <td>
              <span class="rent-text">{{ formatCurrency(stall.rent) }}</span>
            </td>
            <td>
              <span :class="['status', getNormalizedStatus(stall.status)]">
                {{ stall.status }}
              </span>
            </td>
            <td style="text-align: right;">
              <div class="actions" style="justify-content: flex-end;">
                <button
                  type="button"
                  class="btn-action btn-focus"
                  title="Locate on Map"
                  @click="focusStallOnMap(stall)"
                >
                  📍 Focus
                </button>
                <button
                  type="button"
                  class="btn-action btn-edit"
                  title="Assign Stall / Manage Occupant"
                  @click="editStall(stall)"
                >
                  👤 Assign
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="filteredStalls.length === 0">
            <td colspan="6">
              <div class="empty-state">
                <i class="pi pi-search empty-icon"></i>
                <div>No stalls matching your criteria.</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- SIDE PANEL ASSIGNMENT MODAL -->
    <div v-if="showModal" class="gm-backdrop" @click.self="closeModal">
      <div class="gm-modal">
        <div class="gm-header">
          <h2>Assign Stall {{ form.number ? '#' + form.number : '' }}</h2>
          <button type="button" class="gm-close" @click="closeModal">✕</button>
        </div>

        <div class="gm-body">
          <form @submit.prevent="saveStall">
            <!-- Stall Info Summary Card (Read-only master data) -->
            <div class="stall-summary-card">
              <div class="summary-top">
                <span class="summary-stall-no">Stall {{ form.number }}</span>
                <span :class="['summary-status', getNormalizedStatus(form.status)]">
                  {{ form.status }}
                </span>
              </div>
              <div class="summary-details">
                <div class="summary-item">
                  <span class="summary-lbl">Section / Type:</span>
                  <strong>{{ form.type || 'Standard' }}</strong>
                </div>
                <div class="summary-item">
                  <span class="summary-lbl">Monthly Rent:</span>
                  <strong class="text-emerald-600">{{ formatCurrency(form.rent) }}</strong>
                </div>
                <div v-if="form.info" class="summary-item full">
                  <span class="summary-lbl">Description:</span>
                  <span>{{ form.info }}</span>
                </div>
              </div>
            </div>

            <!-- OCCUPANCY CONFIGURATION -->
            <label>
              Occupancy Status
              <select v-model="form.status" @change="onStatusChange">
                <option value="VACANT">VACANT (Available)</option>
                <option value="OCCUPIED">OCCUPIED</option>
                <option value="RESERVED">RESERVED</option>
              </select>
            </label>

            <!-- OCCUPANT MANAGEMENT -->
            <div class="occupant-section">
              <!-- Current Occupant Display -->
              <div v-if="currentOccupantName" class="current-occupant-card">
                <div class="current-occupant-header">
                  <strong>Current Occupant:</strong>
                  <button type="button" class="btn-unassign" @click="unassignCurrentOccupant">
                    ✕ Remove Occupant
                  </button>
                </div>
                <div class="current-occupant-name">
                  <i class="pi pi-user"></i>
                  {{ currentOccupantName }}
                </div>
              </div>

              <!-- Search/Assign Stakeholder -->
              <label>
                {{ currentOccupantName ? 'Reassign to Stakeholder' : 'Assign Stakeholder / Tenant' }}
                <input
                  v-model="stakeholderSearch"
                  type="text"
                  placeholder="Search stakeholder by name or business..."
                />
              </label>

              <!-- RESULTS DROPDOWN -->
              <div
                v-if="stakeholderSearch && filteredStakeholders.length"
                class="stakeholder-results"
              >
                <div
                  v-for="person in filteredStakeholders"
                  :key="person.id"
                  class="stakeholder-item"
                  @click="selectStakeholder(person)"
                >
                  <div class="stakeholder-name">
                    {{ person.firstName }} {{ person.lastName }}
                  </div>
                  <div v-if="person.businessName" class="stakeholder-biz">
                    {{ person.businessName }}
                  </div>
                </div>
              </div>

              <!-- SELECTED PREVIEW -->
              <div v-if="selectedStakeholder" class="selected-occupant">
                <i class="pi pi-check"></i>
                <span>Selected: {{ selectedStakeholder.firstName }} {{ selectedStakeholder.lastName }}</span>
                <button type="button" class="btn-clear-selection" @click="selectedStakeholder = null">✕</button>
              </div>
            </div>

            <div class="gm-actions">
              <button type="button" class="btn-secondary" @click="closeModal">
                Cancel
              </button>
              <button type="submit" class="btn-primary" :disabled="isSaving">
                {{ isSaving ? 'Saving...' : 'Update Assignment' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import MarketSupervisorMenu from '../components/MarketSupervisorMenu.vue'
import SearchField from '../components/SearchField.vue'
import { API_ORIGIN } from '../config/apiConfig'
import api from '../services/api'
import {
  fetchStalls,
  updateStall,
  allocateOccupant,
  unassignOccupant
} from '../services/stallService'

const DEFAULT_CENTER = { lat: 8.399991, lng: 124.291353 }
const MIN_MAP_ZOOM = 14
const DEFAULT_MAP_ZOOM = 18

// State
const search = ref('')
const filterStatus = ref('All')
const stalls = ref([])
const showModal = ref(false)
const editing = ref(null)
const selectedImage = ref(null)
const imagePreview = ref('')
const isSaving = ref(false)

const stakeholders = ref([])
const stakeholderSearch = ref('')
const selectedStakeholder = ref(null)
const currentOccupantName = ref('')

const form = ref({
  id: null,
  number: '',
  type: '',
  info: '',
  rent: 0,
  status: 'VACANT',
  lat: DEFAULT_CENTER.lat,
  lng: DEFAULT_CENTER.lng,
  imageUrl: ''
})

// Leaflet instance & markers
let map = null
let markers = []
let pickerMarker = null

// Helper to normalize image URLs
function resolveImageUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  const origin = (API_ORIGIN || '').replace(/\/+$/, '')
  const path = url.startsWith('/') ? url : `/${url}`
  return `${origin}${path}`
}

// Occupant Name Extraction
function getOccupantName(stall) {
  if (!stall) return ''
  const occupant = stall.occupant
  if (!occupant) return ''

  if (Array.isArray(occupant) && occupant.length > 0) {
    const occ = occupant[0]
    const sh = occ.stakeholder
    if (sh) {
      return `${sh.first_name || sh.firstName || ''} ${sh.last_name || sh.lastName || ''}`.trim()
    }
  } else if (typeof occupant === 'object') {
    const sh = occupant.stakeholder
    if (sh) {
      return `${sh.first_name || sh.firstName || ''} ${sh.last_name || sh.lastName || ''}`.trim()
    }
    if (occupant.name) return occupant.name
  }
  return ''
}

// Normalized status for badge CSS
function getNormalizedStatus(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'OCCUPIED') return 'occupied'
  if (s === 'RESERVED') return 'reserved'
  return 'vacant'
}

// Summary Statistics
const occupiedCount = computed(() => {
  return stalls.value.filter((s) => String(s.status).toUpperCase() === 'OCCUPIED').length
})

const vacantCount = computed(() => {
  return stalls.value.filter((s) => {
    const st = String(s.status).toUpperCase()
    return st === 'VACANT' || st === 'AVAILABLE'
  }).length
})

const reservedCount = computed(() => {
  return stalls.value.filter((s) => String(s.status).toUpperCase() === 'RESERVED').length
})

const occupancyRate = computed(() => {
  if (!stalls.value.length) return 0
  return Math.round((occupiedCount.value / stalls.value.length) * 100)
})

// Filtered Stalls List
const filteredStalls = computed(() => {
  return stalls.value.filter((stall) => {
    const stallNo = String(stall.number || '').toLowerCase()
    const stallType = String(stall.type || '').toLowerCase()
    const occupant = String(getOccupantName(stall) || '').toLowerCase()
    const q = search.value.trim().toLowerCase()

    const matchesSearch = !q || stallNo.includes(q) || stallType.includes(q) || occupant.includes(q)

    const normStatus = getNormalizedStatus(stall.status).toUpperCase()
    const filterNorm = getNormalizedStatus(filterStatus.value).toUpperCase()

    const matchesStatus =
      filterStatus.value === 'All' ||
      normStatus === filterNorm ||
      String(stall.status).toUpperCase() === filterStatus.value

    return matchesSearch && matchesStatus
  })
})

// Stakeholder Filter
const filteredStakeholders = computed(() => {
  if (!stakeholderSearch.value) return []
  const q = stakeholderSearch.value.toLowerCase()

  return stakeholders.value.filter((s) => {
    const full = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase()
    const biz = `${s.businessName || ''}`.toLowerCase()
    return full.includes(q) || biz.includes(q)
  })
})

function selectStakeholder(person) {
  selectedStakeholder.value = person
  stakeholderSearch.value = `${person.firstName || ''} ${person.lastName || ''}`.trim()
}

function unassignCurrentOccupant() {
  currentOccupantName.value = ''
  selectedStakeholder.value = null
  form.value.status = 'VACANT'
}

function onStatusChange() {
  if (form.value.status === 'VACANT') {
    selectedStakeholder.value = null
    currentOccupantName.value = ''
  }
}

// Custom Stall Shop Pin Icons for Leaflet
const markerIcons = {
  occupied: L.icon({
    iconUrl: '/icons/stall-pin-green.svg',
    iconSize: [44, 44],
    iconAnchor: [22, 42],
    popupAnchor: [0, -38]
  }),
  reserved: L.icon({
    iconUrl: '/icons/stall-pin-yellow.svg',
    iconSize: [44, 44],
    iconAnchor: [22, 42],
    popupAnchor: [0, -38]
  }),
  vacant: L.icon({
    iconUrl: '/icons/stall-pin-blue.svg',
    iconSize: [44, 44],
    iconAnchor: [22, 42],
    popupAnchor: [0, -38]
  }),
  picker: L.icon({
    iconUrl: '/icons/stall-pin-orange.svg',
    iconSize: [48, 48],
    iconAnchor: [24, 46],
    popupAnchor: [0, -42]
  })
}

function getMarkerIcon(status) {
  const norm = getNormalizedStatus(status)
  return markerIcons[norm] || markerIcons.vacant
}

function initializeMap() {
  const mapContainer = document.getElementById('map')
  if (!mapContainer || map) return

  map = L.map('map', {
    center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
    zoom: DEFAULT_MAP_ZOOM,
    minZoom: MIN_MAP_ZOOM,
    maxZoom: 20,
    zoomControl: true
  })

  // Google Maps Clean Road Layer (No Watermark, No POIs)
  const googleStreets = L.tileLayer(
    'https://{s}.google.com/vt/lyrs=m&apistyle=s.t:33|p.v:off,s.t:37|p.v:off,s.e:l.i|p.v:off&x={x}&y={y}&z={z}',
    {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }
  ).addTo(map)

  // Google Maps Hybrid Satellite Layer (No POIs)
  const googleSatellite = L.tileLayer(
    'https://{s}.google.com/vt/lyrs=y&apistyle=s.t:33|p.v:off,s.t:37|p.v:off,s.e:l.i|p.v:off&x={x}&y={y}&z={z}',
    {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps Satellite'
    }
  )

  L.control.layers({
    'Google Streets': googleStreets,
    'Google Satellite': googleSatellite
  }, null, { position: 'topright' }).addTo(map)



  // Global hooks for popup buttons
  window.__editStallById = (stallId) => {
    const target = stalls.value.find((s) => s.id === stallId)
    if (target) editStall(target)
  }

  window.__navStallIndex = (index) => {
    const validStalls = stalls.value.filter((s) => s.lat != null && s.lng != null)
    if (!validStalls.length) return
    const wrappedIndex = (index + validStalls.length) % validStalls.length
    const nextStall = validStalls[wrappedIndex]
    const nextMarker = markers[wrappedIndex]
    if (nextStall && nextMarker) {
      map.setView([Number(nextStall.lat), Number(nextStall.lng)], 19)
      nextMarker.openPopup()
    }
  }
}

// Marker Loading
function loadMarkers() {
  if (!map) return

  markers.forEach((m) => map.removeLayer(m))
  markers = []

  const validStalls = stalls.value.filter((s) => s.lat != null && s.lng != null)

  validStalls.forEach((stall, index) => {
    const marker = L.marker([Number(stall.lat), Number(stall.lng)], {
      icon: getMarkerIcon(stall.status),
      title: `Stall ${stall.number}`
    }).addTo(map)

    marker.bindPopup(getStallInfoContent(stall, index, validStalls))
    marker.stallId = stall.id
    markers.push(marker)
  })
}

function getStallInfoContent(stall, index, validStalls) {
  const normStatus = getNormalizedStatus(stall.status)
  const tenant = getOccupantName(stall)
  const resolvedImg = resolveImageUrl(stall.imageUrl)

  const statusLabel =
    normStatus === 'occupied'
      ? 'OCCUPIED'
      : normStatus === 'reserved'
      ? 'RESERVED'
      : 'VACANT'

  return `
  <div class="gm-popup-card">
    ${
      resolvedImg
        ? `<img src="${resolvedImg}" class="gm-popup-img" alt="Stall ${stall.number}" />`
        : ''
    }

    <div class="gm-popup-header">
      <span class="gm-popup-stall">Stall ${stall.number}</span>
      <span class="gm-popup-status gm-status-${normStatus}">${statusLabel}</span>
    </div>

    <div class="gm-popup-type">${stall.type || 'Standard Stall'}</div>

    <div class="gm-popup-row">
      <span class="gm-popup-label">Rent:</span>
      <strong class="gm-popup-rent">${formatCurrency(stall.rent)} / mo</strong>
    </div>

    <div class="gm-popup-row">
      <span class="gm-popup-label">Occupant:</span>
      <span>${tenant ? `<strong>${tenant}</strong>` : '<em style="color:#94a3b8">Vacant</em>'}</span>
    </div>

    <div class="gm-popup-actions">
      <button
        onclick="window.__editStallById(${stall.id})"
        class="gm-btn-manage"
      >
        👤 Assign Occupant
      </button>

      <div class="gm-nav-arrows">
        <button
          onclick="window.__navStallIndex(${index - 1})"
          class="gm-nav-btn"
          title="Previous Stall"
        >
          ←
        </button>
        <button
          onclick="window.__navStallIndex(${index + 1})"
          class="gm-nav-btn"
          title="Next Stall"
        >
          →
        </button>
      </div>
    </div>
  </div>
  `
}

function focusStallOnMap(stall) {
  if (!map || stall.lat == null || stall.lng == null) {
    alert(`No coordinates recorded for Stall ${stall.number}`)
    return
  }

  const lat = Number(stall.lat)
  const lng = Number(stall.lng)
  map.setView([lat, lng], 19)

  const marker = markers.find((m) => m.stallId === stall.id)
  if (marker) {
    marker.openPopup()
  }

  const mapElem = document.getElementById('map')
  if (mapElem) {
    mapElem.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}



// Data Fetching
async function loadStalls() {
  try {
    const data = await fetchStalls()

    stalls.value = (data || []).map((stall) => ({
      id: stall.id,
      number: stall.stall_no || stall.stallNo || '',
      type: stall.stall_type || stall.stallType || '',
      info: stall.info || '',
      rent: Number(stall.monthly_rent ?? stall.monthlyRent ?? 0),
      status: stall.status || 'VACANT',
      lat: stall.latitude,
      lng: stall.longitude,
      imageUrl: stall.image_url || stall.imageUrl || '',
      occupant: stall.occupant || null
    }))

    loadMarkers()
  } catch (error) {
    console.error('[StallManagement] Failed to load stalls:', error)
  }
}

async function loadStakeholders() {
  try {
    const response = await api.get('/stakeholders')
    stakeholders.value = response.data || []
  } catch (error) {
    console.warn('[StallManagement] Failed to load stakeholders:', error)
  }
}

function resetForm() {
  form.value = {
    id: null,
    number: '',
    type: '',
    info: '',
    rent: 0,
    status: 'VACANT',
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
    imageUrl: ''
  }
  stakeholderSearch.value = ''
  selectedStakeholder.value = null
  currentOccupantName.value = ''
}



function editStall(stall) {
  editing.value = stall.id
  selectedImage.value = null

  form.value = {
    id: stall.id,
    number: stall.number,
    type: stall.type,
    info: stall.info,
    rent: stall.rent,
    status: stall.status || 'VACANT',
    lat: stall.lat ?? DEFAULT_CENTER.lat,
    lng: stall.lng ?? DEFAULT_CENTER.lng,
    imageUrl: stall.imageUrl || ''
  }

  currentOccupantName.value = getOccupantName(stall)
  stakeholderSearch.value = ''
  selectedStakeholder.value = null

  imagePreview.value = resolveImageUrl(stall.imageUrl)
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  stakeholderSearch.value = ''
  selectedStakeholder.value = null
  currentOccupantName.value = ''
}

async function saveStall() {
  if (!editing.value) return
  isSaving.value = true
  try {
    const targetStallId = editing.value

    // Handle Occupant allocation or unassign
    if (selectedStakeholder.value && (form.value.status === 'OCCUPIED' || form.value.status === 'RESERVED')) {
      await allocateOccupant(targetStallId, selectedStakeholder.value.id)
    } else if (form.value.status === 'VACANT' || !currentOccupantName.value) {
      await unassignOccupant(targetStallId)
    }

    // Update stall status
    await updateStall(targetStallId, { status: form.value.status })

    await loadStalls()
    closeModal()
    alert('Stall assignment updated successfully!')
  } catch (error) {
    console.error(error)
    alert(error.message || 'Failed to update stall assignment')
  } finally {
    isSaving.value = false
  }
}

function formatCurrency(n) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(n || 0)
}

onMounted(async () => {
  // 1. Initialize map
  initializeMap()

  // 2. Fetch data
  await Promise.allSettled([loadStalls(), loadStakeholders()])
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
  markers = []
  pickerMarker = null
  delete window.__editStallById
  delete window.__navStallIndex
})
</script>

<style scoped src="../styles/MarketSupervisor/StallManagement.css"></style>
