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
        <SearchField v-model="search" placeholder="Search stalls by number or tenant..." />

        <select v-model="filterStatus" class="filter" aria-label="Filter by status">
          <option value="All">All Status ({{ stalls.length }})</option>
          <option value="VACANT">Vacant ({{ vacantCount }})</option>
          <option value="OCCUPIED">Occupied ({{ occupiedCount }})</option>
          <option value="RESERVED">Reserved ({{ reservedCount }})</option>
        </select>

        <button type="button" class="btn-primary add-stall-btn" @click="openAdd">
          <i class="pi pi-plus"></i>
          <span>Add Stall</span>
        </button>
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

      <!-- Helper Notice when picking coordinates -->
      <div v-if="isPickingLocation" class="location-picker-banner">
        <div class="picker-text">
          <i class="pi pi-info-circle"></i>
          <span>Click anywhere on the map or drag the orange pin to set the stall coordinates.</span>
        </div>
        <button type="button" class="btn-picker-done" @click="stopPickingLocation">
          Done Picking
        </button>
      </div>
    </section>

    <!-- TABLE -->
    <section class="table-wrap">
      <div class="table-header-bar">
        <h2>Stall Registry ({{ filteredStalls.length }})</h2>
        <span class="table-hint">Click 📍 to locate on the map, or Edit to manage occupancy</span>
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
                  title="Edit Stall"
                  @click="editStall(stall)"
                >
                  ✏️ Edit
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

    <!-- SIDE PANEL MODAL -->
    <div v-if="showModal && !isPickingLocation" class="gm-backdrop" @click.self="closeModal">
      <div class="gm-modal">
        <div class="gm-header">
          <h2>{{ editing ? 'Edit Stall ' + (form.number ? '#' + form.number : '') : 'Add New Stall' }}</h2>
          <button type="button" class="gm-close" @click="closeModal">✕</button>
        </div>

        <div class="gm-body">
          <form @submit.prevent="saveStall">
            <label>
              Stall Number
              <input v-model="form.number" placeholder="e.g. A-12 or Stall 05" required />
            </label>

            <label>
              Stall Type / Section
              <input v-model="form.type" placeholder="e.g. Meat Section, Dry Goods, Fruit Stand" required />
            </label>

            <label>
              Information / Description
              <textarea v-model="form.info" rows="2" placeholder="Details about location, size, or utilities"></textarea>
            </label>

            <label>
              Monthly Rent (PHP)
              <input v-model.number="form.rent" type="number" min="0" step="any" placeholder="e.g. 3500" required />
            </label>

            <label>
              Occupancy Status
              <select v-model="form.status" @change="onStatusChange">
                <option value="VACANT">VACANT (Available)</option>
                <option value="OCCUPIED">OCCUPIED</option>
                <option value="RESERVED">RESERVED</option>
              </select>
            </label>

            <!-- OCCUPANT MANAGEMENT -->
            <div v-if="form.status === 'OCCUPIED' || form.status === 'RESERVED'" class="occupant-section">
              <!-- Current Occupant Display -->
              <div v-if="currentOccupantName" class="current-occupant-card">
                <div class="current-occupant-header">
                  <strong>Current Occupant:</strong>
                  <button type="button" class="btn-unassign" @click="unassignCurrentOccupant">
                    ✕ Remove
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
                  placeholder="Search stakeholder by name..."
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
              </div>
            </div>

            <!-- MAP COORDINATES WITH VISUAL PICKER -->
            <div class="coordinates-box">
              <div class="coordinates-title">
                <span>Map Coordinates</span>
                <button
                  type="button"
                  class="btn-pick-map"
                  @click="startPickingLocation"
                >
                  📍 Pick on Map
                </button>
              </div>

              <div class="coordinates-grid">
                <label>
                  Lat
                  <input v-model.number="form.lat" type="number" step="any" required />
                </label>
                <label>
                  Lng
                  <input v-model.number="form.lng" type="number" step="any" required />
                </label>
              </div>
            </div>

            <!-- STALL IMAGE -->
            <label>
              Stall Photo
              <input type="file" accept="image/*" @change="handleImageUpload" />
            </label>

            <div v-if="imagePreview" class="preview-container">
              <img :src="imagePreview" alt="Stall preview" class="gm-preview" />
            </div>

            <div class="gm-actions">
              <button type="button" class="btn-secondary" @click="closeModal">
                Cancel
              </button>
              <button type="submit" class="btn-primary" :disabled="isSaving">
                {{ isSaving ? 'Saving...' : 'Save Stall' }}
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

import MarketSupervisorMenu from '../components/MarketSupervisorMenu.vue'
import SearchField from '../components/SearchField.vue'
import { API_ORIGIN } from '../config/apiConfig'
import api from '../services/api'
import {
  fetchStalls,
  createStall,
  updateStall,
  uploadStallImage,
  allocateOccupant,
  unassignOccupant
} from '../services/stallService'

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  window.GOOGLE_MAPS_API_KEY ||
  ''

const DEFAULT_CENTER = { lat: 8.399991, lng: 124.291353 }
const MIN_MAP_ZOOM = 15
const MAX_MAP_ZOOM = 21
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
const isPickingLocation = ref(false)

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

// Map instance & markers
let googleMapsPromise = null
let map = null
let infoWindow = null
let markers = []
let pickerMarker = null
let mapClickListener = null

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

// Google Maps Loader
function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps)

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-google-maps-loader="true"]')

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

const MAP_STYLES = [
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  }
]

// Get official Google Maps colored pin icon based on status
function getMarkerIcon(status) {
  const norm = getNormalizedStatus(status)
  if (norm === 'occupied') {
    return 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
  }
  if (norm === 'reserved') {
    return 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
  }
  return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
}

async function initializeMap() {
  try {
    const googleMaps = await loadGoogleMaps()

    map = new googleMaps.Map(document.getElementById('map'), {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      minZoom: MIN_MAP_ZOOM,
      maxZoom: MAX_MAP_ZOOM,
      clickableIcons: false,
      disableDefaultUI: false,
      disableDoubleClickZoom: false,
      draggable: true,
      fullscreenControl: true,
      gestureHandling: 'cooperative',
      mapTypeControl: false,
      scrollwheel: true,
      styles: MAP_STYLES,
      streetViewControl: false,
      zoomControl: true
    })

    infoWindow = new googleMaps.InfoWindow()

    mapClickListener = map.addListener('click', (e) => {
      if (isPickingLocation.value) {
        form.value.lat = Number(e.latLng.lat().toFixed(6))
        form.value.lng = Number(e.latLng.lng().toFixed(6))
        updatePickerMarkerPosition()
      }
    })

    // Clean up "For development purposes only" overlays and dismiss warning dialogs
    const mapContainer = document.getElementById('map')
    if (mapContainer) {
      const cleanupWatermark = () => {
        const dismissBtn = mapContainer.querySelector('.dismissButton')
        if (dismissBtn) dismissBtn.click()

        const overlays = mapContainer.querySelectorAll(
          'div[style*="z-index: 100000"], div[style*="rgba(0, 0, 0"]'
        )
        overlays.forEach((el) => {
          el.style.display = 'none'
          el.style.backgroundColor = 'transparent'
        })

        const allDivs = mapContainer.querySelectorAll('div')
        allDivs.forEach((el) => {
          if (el.innerText && el.innerText.includes('For development purposes only')) {
            el.style.display = 'none'
          }
        })
      }

      const observer = new MutationObserver(cleanupWatermark)
      observer.observe(mapContainer, { childList: true, subtree: true })
      setInterval(cleanupWatermark, 1000)
    }
  } catch (err) {
    console.warn('[StallManagement] Map failed to initialize:', err.message)
  }
}

// Marker Loading
function loadMarkers() {
  if (!map || !window.google?.maps) return

  markers.forEach((m) => m.setMap(null))
  markers = []

  const validStalls = stalls.value.filter((s) => s.lat != null && s.lng != null)

  validStalls.forEach((stall, index) => {
    const marker = new window.google.maps.Marker({
      position: { lat: Number(stall.lat), lng: Number(stall.lng) },
      map,
      title: `Stall ${stall.number}`,
      icon: getMarkerIcon(stall.status),
      stallId: stall.id
    })

    marker.addListener('click', () => {
      openStallInfoWindow(marker, stall, index, validStalls)
    })

    markers.push(marker)
  })

  // Global hooks for InfoWindow buttons
  window.__editStallById = (stallId) => {
    const target = stalls.value.find((s) => s.id === stallId)
    if (target) editStall(target)
  }

  window.__navStallIndex = (index) => {
    if (!validStalls.length) return
    const wrappedIndex = (index + validStalls.length) % validStalls.length
    const nextStall = validStalls[wrappedIndex]
    const nextMarker = markers[wrappedIndex]
    if (nextStall && nextMarker) {
      map.panTo({ lat: Number(nextStall.lat), lng: Number(nextStall.lng) })
      openStallInfoWindow(nextMarker, nextStall, wrappedIndex, validStalls)
    }
  }
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
        ✏️ Manage Stall
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

function openStallInfoWindow(marker, stall, index, validStalls) {
  if (!infoWindow || !map) return
  infoWindow.setContent(getStallInfoContent(stall, index, validStalls))
  infoWindow.open(map, marker)
}

function focusStallOnMap(stall) {
  if (!map || stall.lat == null || stall.lng == null) {
    alert(`No coordinates recorded for Stall ${stall.number}`)
    return
  }

  const lat = Number(stall.lat)
  const lng = Number(stall.lng)
  map.panTo({ lat, lng })
  map.setZoom(19)

  const marker = markers.find((m) => m.stallId === stall.id)
  const validStalls = stalls.value.filter((s) => s.lat != null && s.lng != null)
  const index = validStalls.findIndex((s) => s.id === stall.id)

  if (marker && index >= 0) {
    openStallInfoWindow(marker, stall, index, validStalls)
  }

  // Smooth scroll to map
  const mapElem = document.getElementById('map')
  if (mapElem) {
    mapElem.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// Location Picker on Map
function startPickingLocation() {
  isPickingLocation.value = true
  if (infoWindow) infoWindow.close()

  if (map && window.google?.maps) {
    if (!pickerMarker) {
      pickerMarker = new window.google.maps.Marker({
        position: { lat: Number(form.value.lat), lng: Number(form.value.lng) },
        map,
        draggable: true,
        title: 'Drag to set stall location',
        icon: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
      })

      pickerMarker.addListener('dragend', (e) => {
        form.value.lat = Number(e.latLng.lat().toFixed(6))
        form.value.lng = Number(e.latLng.lng().toFixed(6))
      })
    } else {
      pickerMarker.setPosition({ lat: Number(form.value.lat), lng: Number(form.value.lng) })
      pickerMarker.setMap(map)
    }

    map.panTo({ lat: Number(form.value.lat), lng: Number(form.value.lng) })
  }

  const mapElem = document.getElementById('map')
  if (mapElem) {
    mapElem.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function updatePickerMarkerPosition() {
  if (pickerMarker && window.google?.maps) {
    pickerMarker.setPosition({ lat: Number(form.value.lat), lng: Number(form.value.lng) })
  }
}

function stopPickingLocation() {
  isPickingLocation.value = false
  if (pickerMarker) {
    pickerMarker.setMap(null)
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
  isPickingLocation.value = false
  selectedImage.value = null
  imagePreview.value = ''
  stakeholderSearch.value = ''
  selectedStakeholder.value = null
  currentOccupantName.value = ''
  if (pickerMarker) pickerMarker.setMap(null)
}

function handleImageUpload(event) {
  const file = event.target.files[0]
  if (file) {
    selectedImage.value = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

async function saveStall() {
  isSaving.value = true
  try {
    let imageUrl = form.value.imageUrl || ''

    if (selectedImage.value) {
      const fd = new FormData()
      fd.append('file', selectedImage.value)
      imageUrl = await uploadStallImage(fd)
    }

    const payload = {
      stallNo: form.value.number,
      stallType: form.value.type,
      monthlyRent: form.value.rent,
      status: form.value.status,
      info: form.value.info,
      latitude: form.value.lat,
      longitude: form.value.lng,
      imageUrl
    }

    const savedStall = editing.value
      ? await updateStall(editing.value, payload)
      : await createStall(payload)

    // Handle Occupant allocation or unassign
    const targetStallId = savedStall.id || editing.value

    if (selectedStakeholder.value && (form.value.status === 'OCCUPIED' || form.value.status === 'RESERVED')) {
      await allocateOccupant(targetStallId, selectedStakeholder.value.id)
    } else if (form.value.status === 'VACANT' && editing.value) {
      await unassignOccupant(targetStallId)
    }

    await loadStalls()
    closeModal()
    alert('Stall saved successfully!')
  } catch (error) {
    console.error(error)
    alert(error.message || 'Failed to save stall')
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
  // 1. Fetch data first so supervisors always see stall records
  await Promise.allSettled([loadStalls(), loadStakeholders()])

  // 2. Initialize map gracefully
  await initializeMap()
  loadMarkers()
})

onBeforeUnmount(() => {
  mapClickListener?.remove()
  markers.forEach((m) => m.setMap(null))
  markers = []
  if (pickerMarker) pickerMarker.setMap(null)
  infoWindow?.close()
  delete window.__editStallById
  delete window.__navStallIndex
})
</script>

<style scoped src="../styles/MarketSupervisor/StallManagement.css"></style>
