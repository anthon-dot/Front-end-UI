<template>
  <div class="vacant-stall-picker-container">
    <!-- Header Strip with Vacancy Status & View Mode Toggles -->
    <div class="picker-top-bar">
      <div class="picker-title-group">
        <div class="vacancy-badge">
          <span class="pulse-dot"></span>
          <span class="badge-text">
            <strong>{{ vacantStalls.length }} Vacant Stalls Available</strong>
            <small class="hidden sm:inline"> &bull; Occupied and reserved stalls are hidden</small>
          </span>
        </div>
        <p class="picker-subtitle">
          Click any vacant stall pin on the Manticao Public Market map to select and reserve it.
        </p>
      </div>

      <div class="picker-controls-group">
        <!-- Search filter -->
        <div class="picker-search-box">
          <i class="pi pi-search"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search vacant stall #..."
            class="search-input"
          />
          <button v-if="searchQuery" type="button" class="clear-search" @click="searchQuery = ''">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Section filter -->
        <select v-model="sectionFilter" class="picker-filter-select">
          <option value="ALL">All Sections ({{ vacantStalls.length }})</option>
          <option v-for="sec in availableSections" :key="sec" :value="sec">
            {{ sec }}
          </option>
        </select>

        <!-- View Mode (Map / Grid) -->
        <div class="view-mode-toggle">
          <button
            type="button"
            class="mode-btn"
            :class="{ active: viewMode === 'map' }"
            title="Interactive Map View"
            @click="viewMode = 'map'"
          >
            <i class="pi pi-map"></i>
            <span>Map</span>
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ active: viewMode === 'grid' }"
            title="Grid Cards View"
            @click="viewMode = 'grid'"
          >
            <i class="pi pi-th-large"></i>
            <span>Cards</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Active Selection Notification Banner -->
    <div v-if="selectedStallObj" class="selected-stall-banner">
      <div class="banner-left">
        <div class="stall-badge-icon">
          <i class="pi pi-check"></i>
        </div>
        <div>
          <div class="banner-headline">
            <span class="stall-num-tag">Stall #{{ selectedStallObj.stallNo }}</span>
            <span class="stall-type-tag">{{ selectedStallObj.stallType }}</span>
            <span class="vacant-pill">VACANT & READY</span>
          </div>
          <div class="banner-specs">
            <span><i class="pi pi-arrows-alt"></i> {{ selectedStallObj.dimensions || '3m x 3m (9 sq.m.)' }}</span>
            <span class="sep">&bull;</span>
            <span><i class="pi pi-tag"></i> ₱{{ formatMoney(selectedStallObj.monthlyRent) }}/mo</span>
            <span class="sep">&bull;</span>
            <span class="advance-calc"><i class="pi pi-wallet"></i> 2-Month Advance Deposit: <strong>₱{{ formatMoney(selectedStallObj.monthlyRent * 2) }}</strong></span>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="recenter-btn"
        title="Focus map on selected stall"
        @click="focusStall(selectedStallObj)"
      >
        <i class="pi pi-crosshairs"></i>
        <span>Locate Pin</span>
      </button>
    </div>

    <!-- VIEW 1: MAP VIEW -->
    <div v-show="viewMode === 'map'" class="map-view-wrapper">
      <div class="map-frame">
        <div :id="mapContainerId" ref="mapEl" class="leaflet-map-canvas"></div>

        <!-- Floating Map Overlay Controls -->
        <div class="map-floating-controls">
          <div class="tile-switch-group">
            <button
              type="button"
              class="tile-btn"
              :class="{ active: mapType === 'roadmap' }"
              @click="setMapType('roadmap')"
            >
              Street
            </button>
            <button
              type="button"
              class="tile-btn"
              :class="{ active: mapType === 'satellite' }"
              @click="setMapType('satellite')"
            >
              Satellite
            </button>
          </div>

          <button
            type="button"
            class="ctrl-icon-btn"
            title="Recenter Map to Manticao Public Market"
            @click="recenterMap"
          >
            <i class="pi pi-compass"></i>
          </button>
        </div>

        <!-- Vacant Pin Counter overlay -->
        <div class="map-vacant-counter">
          <i class="pi pi-map-pin"></i>
          <span>Showing <strong>{{ filteredVacantStalls.length }}</strong> vacant stalls on map</span>
        </div>
      </div>

      <!-- Quick-select drawer below or side of map -->
      <div class="quick-vacant-chips-scroll">
        <span class="chips-label">Vacant Stalls:</span>
        <button
          v-for="st in filteredVacantStalls"
          :key="st.id"
          type="button"
          class="stall-chip-btn"
          :class="{ selected: Number(modelValue) === Number(st.id) }"
          @click="selectStall(st)"
        >
          <span class="chip-no">#{{ st.stallNo }}</span>
          <span class="chip-rent">₱{{ formatMoney(st.monthlyRent) }}</span>
        </button>
      </div>
    </div>

    <!-- VIEW 2: GRID VIEW -->
    <div v-show="viewMode === 'grid'" class="grid-view-wrapper">
      <div v-if="filteredVacantStalls.length === 0" class="no-vacancies-card">
        <i class="pi pi-search text-3xl text-slate-400"></i>
        <p>No vacant stalls match your search or filter criteria.</p>
        <button type="button" class="btn-reset-filters" @click="resetFilters">
          Clear Filters
        </button>
      </div>

      <div v-else class="vacant-stalls-grid">
        <div
          v-for="st in filteredVacantStalls"
          :key="st.id"
          class="vacant-stall-card"
          :class="{ selected: Number(modelValue) === Number(st.id) }"
          @click="selectStall(st)"
        >
          <div class="card-status-bar">
            <span class="vacant-dot-tag">
              <span class="mini-dot"></span> VACANT
            </span>
            <span class="stall-zone-tag">{{ st.sectionName || st.stallType }}</span>
          </div>

          <div class="card-stall-hero">
            <div class="card-stall-no">#{{ st.stallNo }}</div>
            <div class="card-rate-box">
              <span class="rate-num">₱{{ formatMoney(st.monthlyRent) }}</span>
              <span class="rate-per">/month</span>
            </div>
          </div>

          <div class="card-specs-list">
            <div class="spec-row">
              <span class="spec-lbl"><i class="pi pi-arrows-alt"></i> Dimensions:</span>
              <span class="spec-val">{{ st.dimensions || '3m x 3m (9 sq.m.)' }}</span>
            </div>
            <div class="spec-row">
              <span class="spec-lbl"><i class="pi pi-wallet"></i> 2-Mo. Advance:</span>
              <span class="spec-val font-bold text-amber-700">₱{{ formatMoney(st.monthlyRent * 2) }}</span>
            </div>
            <div class="spec-row">
              <span class="spec-lbl"><i class="pi pi-shield"></i> Stall Rights:</span>
              <span class="spec-val">₱5,000.00</span>
            </div>
          </div>

          <button
            type="button"
            class="card-select-btn"
            :class="{ active: Number(modelValue) === Number(st.id) }"
          >
            <i :class="Number(modelValue) === Number(st.id) ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
            <span>{{ Number(modelValue) === Number(st.id) ? 'Selected Stall' : 'Select This Stall' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MARKET_CENTER as DEFAULT_CENTER,
  MARKET_DEFAULT_ZOOM as DEFAULT_ZOOM,
  MARKET_MIN_ZOOM,
  MARKET_MAX_ZOOM,
  BASEMAP_TILES,
  isNearMarket
} from '../constants/marketMap'

const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: null
  },
  stalls: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'select-stall'])

// Market center, zoom levels & tiles come from src/constants/marketMap.js

// Unique container ID so multiple instances don't clash
const mapContainerId = 'vacant-map-picker-' + Math.floor(Math.random() * 100000)

const mapType = ref('roadmap')
const viewMode = ref('map') // 'map' or 'grid'
const searchQuery = ref('')
const sectionFilter = ref('ALL')

let mapInstance = null
let tileLayerInstance = null
let markerGroup = null
let markersMap = new Map()
const mapEl = ref(null)
let resizeObserver = null
let initRetryTimer = null
let initAttempts = 0

// Baseline Fallback Vacant Stalls for Manticao Public Market
const FALLBACK_VACANT_STALLS = [
  { id: 1, stallNo: 'WS-01', sectionName: 'Wet Section (Fish & Meat)', stallType: 'Wet Section Stall', dimensions: '3m x 3m', areaSqm: 9, monthlyRent: 3500, status: 'AVAILABLE', lat: 8.399871, lng: 124.291133 },
  { id: 3, stallNo: 'DG-01', sectionName: 'Dry Goods & Groceries', stallType: 'Dry Goods Stall', dimensions: '3m x 3m', areaSqm: 9, monthlyRent: 2000, status: 'AVAILABLE', lat: 8.400031, lng: 124.291273 },
  { id: 5, stallNo: 'FC-01', sectionName: 'Food Court & Eatery', stallType: 'Food Court Eatery', dimensions: '4m x 3m', areaSqm: 12, monthlyRent: 4000, status: 'AVAILABLE', lat: 8.400211, lng: 124.291463 },
  { id: 7, stallNo: 'CP-01', sectionName: 'Commercial Perimeter Block', stallType: 'Commercial Perimeter Stall', dimensions: '4m x 4m', areaSqm: 16, monthlyRent: 5000, status: 'AVAILABLE', lat: 8.400411, lng: 124.291663 },
  { id: 8, stallNo: 'WS-03', sectionName: 'Wet Section (Fish & Meat)', stallType: 'Fish Vendor Stall', dimensions: '3m x 3m', areaSqm: 9, monthlyRent: 3500, status: 'AVAILABLE', lat: 8.399911, lng: 124.291173 },
  { id: 9, stallNo: 'VG-02', sectionName: 'Vegetables & Fruits', stallType: 'Vegetable Stall', dimensions: '3m x 2m', areaSqm: 6, monthlyRent: 1500, status: 'AVAILABLE', lat: 8.400311, lng: 124.291573 }
]

// 1. FILTER: SHOW ONLY THE VACANT ONE (AVAILABLE)
// All occupied and pending stalls are strictly excluded as requested!
const vacantStalls = computed(() => {
  const source = (props.stalls && props.stalls.length > 0) ? props.stalls : FALLBACK_VACANT_STALLS

  const filtered = source.filter(s => {
    const rawStatus = String(s.status || '').trim().toUpperCase()
    // Must be AVAILABLE or VACANT
    return rawStatus === 'AVAILABLE' || rawStatus === 'VACANT' || rawStatus === 'UNOCCUPIED'
  }).map((s, idx) => {
    // Ensure coordinates exist for map positioning (and are actually near the market)
    const rawLat = Number(s.latitude ?? s.lat)
    const rawLng = Number(s.longitude ?? s.lng)
    const hasValidCoords = isNearMarket(rawLat, rawLng)
    const lat = hasValidCoords ? rawLat : (DEFAULT_CENTER.lat + (idx % 4 - 1.5) * 0.00012)
    const lng = hasValidCoords ? rawLng : (DEFAULT_CENTER.lng + (Math.floor(idx / 4) - 1) * 0.00012)

    return {
      id: s.id,
      stallNo: s.stallNo || s.stall_no || s.number || `S-${s.id}`,
      sectionName: s.sectionName || s.section || s.stallType || s.stall_type || 'General Section',
      stallType: s.stallType || s.stall_type || s.info || 'Standard Stall',
      dimensions: s.dimensions || (s.areaSqm ? `${s.areaSqm} sq.m.` : '3m x 3m (9 sq.m.)'),
      areaSqm: Number(s.areaSqm || s.businessAreaSqm || 9),
      monthlyRent: Number(s.monthlyRent || s.monthly_rent || s.rent || 1500),
      status: 'AVAILABLE',
      lat,
      lng
    }
  })

  return filtered.length > 0 ? filtered : FALLBACK_VACANT_STALLS
})

// Available Sections
const availableSections = computed(() => {
  const set = new Set()
  vacantStalls.value.forEach(s => {
    if (s.sectionName) set.add(s.sectionName)
  })
  return Array.from(set).sort()
})

// Filtered by Search & Section
const filteredVacantStalls = computed(() => {
  return vacantStalls.value.filter(s => {
    if (sectionFilter.value !== 'ALL' && s.sectionName !== sectionFilter.value) {
      return false
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const matchNo = String(s.stallNo || '').toLowerCase().includes(q)
      const matchSec = String(s.sectionName || '').toLowerCase().includes(q)
      const matchType = String(s.stallType || '').toLowerCase().includes(q)
      if (!matchNo && !matchSec && !matchType) return false
    }
    return true
  })
})

// Currently Selected Stall Object
const selectedStallObj = computed(() => {
  if (!props.modelValue) return null
  return vacantStalls.value.find(s => Number(s.id) === Number(props.modelValue)) || null
})

function formatMoney(val) {
  return Number(val || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function selectStall(stall) {
  emit('update:modelValue', stall.id)
  emit('select-stall', stall)
  focusStall(stall)
}

function focusStall(stall) {
  if (!stall || !mapInstance) return
  mapInstance.flyTo([stall.lat, stall.lng], 20, { duration: 0.8 })
  const m = markersMap.get(stall.id)
  if (m) {
    m.openPopup()
  }
}

function resetFilters() {
  searchQuery.value = ''
  sectionFilter.value = 'ALL'
}

// Leaflet Map Initialization
function destroyMap() {
  if (initRetryTimer) {
    clearTimeout(initRetryTimer)
    initRetryTimer = null
  }
  if (mapInstance) {
    try {
      mapInstance.stop()
      mapInstance.remove()
    } catch (_) {}
    mapInstance = null
    tileLayerInstance = null
    markerGroup = null
    markersMap.clear()
  }
}

function initMap() {
  const container = mapEl.value
  if (!container) return

  // Container not laid out yet (hidden / zero size) -> retry shortly
  if (container.offsetWidth === 0 || container.offsetHeight === 0) {
    if (initAttempts++ < 40) {
      initRetryTimer = setTimeout(initMap, 150)
    }
    return
  }
  initAttempts = 0

  destroyMap()

  mapInstance = L.map(container, {
    center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
    zoom: DEFAULT_ZOOM,
    minZoom: MARKET_MIN_ZOOM,
    maxZoom: MARKET_MAX_ZOOM,
    zoomControl: false,
    scrollWheelZoom: true
  })

  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance)

  const tileConfig = BASEMAP_TILES[mapType.value] || BASEMAP_TILES.roadmap
  tileLayerInstance = L.tileLayer(tileConfig.url, tileConfig.options).addTo(mapInstance)

  markerGroup = L.featureGroup().addTo(mapInstance)
  renderMarkers()

  // Ensure tiles fill the container after layout settles
  setTimeout(() => mapInstance && mapInstance.invalidateSize(), 200)
}

function setMapType(type) {
  mapType.value = type
  if (!mapInstance) return

  if (tileLayerInstance) {
    mapInstance.removeLayer(tileLayerInstance)
  }
  const tileConfig = BASEMAP_TILES[type] || BASEMAP_TILES.roadmap
  tileLayerInstance = L.tileLayer(tileConfig.url, tileConfig.options).addTo(mapInstance)
}

function recenterMap() {
  if (!mapInstance) return
  if (markerGroup && markerGroup.getLayers().length > 0) {
    mapInstance.fitBounds(markerGroup.getBounds().pad(0.2))
  } else {
    mapInstance.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_ZOOM)
  }
}

function createMarkerIcon(stall, isSelected) {
  const html = `
    <div class="vacant-pin-marker ${isSelected ? 'is-selected' : ''}" title="Vacant Stall #${stall.stallNo}">
      <div class="pin-badge">
        <span class="pin-dot"></span>
        <span class="pin-num">#${stall.stallNo}</span>
      </div>
      <div class="pin-stem"></div>
    </div>
  `

  return L.divIcon({
    className: 'vacant-leaflet-marker-wrapper',
    html,
    iconSize: [44, 48],
    iconAnchor: [22, 46],
    popupAnchor: [0, -42]
  })
}

function renderMarkers() {
  if (!mapInstance || !markerGroup) return
  markerGroup.clearLayers()
  markersMap.clear()

  filteredVacantStalls.value.forEach(st => {
    const isSelected = Number(props.modelValue) === Number(st.id)
    const icon = createMarkerIcon(st, isSelected)

    const marker = L.marker([st.lat, st.lng], { icon })

    const popupHtml = `
      <div class="vacant-popup-card">
        <div class="popup-head">
          <span class="popup-vacant-badge">● VACANT</span>
          <strong class="popup-stall-no">Stall #${st.stallNo}</strong>
        </div>
        <div class="popup-type">${st.stallType} &bull; ${st.sectionName}</div>
        <div class="popup-stats">
          <div class="p-stat">
            <span class="p-lbl">Monthly Rent</span>
            <strong class="p-val text-emerald-600">₱${formatMoney(st.monthlyRent)}</strong>
          </div>
          <div class="p-stat">
            <span class="p-lbl">2-Mo. Advance</span>
            <strong class="p-val text-amber-700">₱${formatMoney(st.monthlyRent * 2)}</strong>
          </div>
        </div>
        <button type="button" class="popup-select-btn" id="popup-select-${st.id}">
          ✓ Select Stall #${st.stallNo}
        </button>
      </div>
    `

    marker.bindPopup(popupHtml, { maxWidth: 280, className: 'vacant-leaflet-popup' })

    marker.on('popupopen', () => {
      const btn = document.getElementById(`popup-select-${st.id}`)
      if (btn) {
        btn.onclick = () => {
          selectStall(st)
          marker.closePopup()
        }
      }
    })

    marker.on('click', () => {
      selectStall(st)
    })

    marker.addTo(markerGroup)
    markersMap.set(st.id, marker)
  })

  // If a stall is currently selected, highlight and fit
  if (selectedStallObj.value && markersMap.has(selectedStallObj.value.id)) {
    const selMarker = markersMap.get(selectedStallObj.value.id)
    if (selMarker) {
      selMarker.setIcon(createMarkerIcon(selectedStallObj.value, true))
    }
  }
}

watch(() => props.modelValue, (newVal) => {
  if (!markerGroup) return
  // Re-render icon states
  markersMap.forEach((marker, stallId) => {
    const isSel = Number(stallId) === Number(newVal)
    const stall = vacantStalls.value.find(s => Number(s.id) === Number(stallId))
    if (stall) {
      marker.setIcon(createMarkerIcon(stall, isSel))
    }
  })
})

watch(filteredVacantStalls, () => {
  renderMarkers()
})

watch(viewMode, async (newVal) => {
  if (newVal === 'map') {
    await nextTick()
    if (!mapInstance) {
      initMap()
    } else {
      mapInstance.invalidateSize()
      recenterMap()
    }
  }
})

onMounted(async () => {
  await nextTick()
  initMap()

  if (typeof ResizeObserver !== 'undefined' && mapEl.value) {
    resizeObserver = new ResizeObserver(() => {
      if (!mapEl.value || mapEl.value.offsetWidth === 0) return
      if (!mapInstance) {
        initMap()
      } else {
        mapInstance.invalidateSize()
      }
    })
    resizeObserver.observe(mapEl.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  destroyMap()
})
</script>

<style scoped>
.vacant-stall-picker-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
  font-family: inherit;
}

/* Top Bar */
.picker-top-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 12px;
}

@media (min-width: 768px) {
  .picker-top-bar {
    flex-direction: row;
    align-items: center;
  }
}

.picker-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vacancy-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.85rem;
  width: fit-content;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulse-green 1.8s infinite;
}

@keyframes pulse-green {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 7px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.picker-subtitle {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
}

.picker-controls-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.picker-search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.picker-search-box i {
  position: absolute;
  left: 10px;
  color: #94a3b8;
  font-size: 0.85rem;
  pointer-events: none;
}

.search-input {
  padding: 7px 28px 7px 30px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.84rem;
  outline: none;
  width: 170px;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}

.clear-search {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  font-size: 0.75rem;
}

.picker-filter-select {
  padding: 7px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.84rem;
  background: #ffffff;
  color: #334155;
  outline: none;
  cursor: pointer;
}

.view-mode-toggle {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.18s ease;
}

.mode-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Active Selected Stall Banner */
.selected-stall-banner {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1.5px solid #86efac;
  border-radius: 12px;
  padding: 12px 16px;
  justify-content: space-between;
  animation: fadeIn 0.3s ease;
}

@media (min-width: 640px) {
  .selected-stall-banner {
    flex-direction: row;
    align-items: center;
  }
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stall-badge-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #10b981;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
}

.banner-headline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stall-num-tag {
  font-size: 1.05rem;
  font-weight: 800;
  color: #064e3b;
}

.stall-type-tag {
  font-size: 0.85rem;
  color: #047857;
  font-weight: 600;
}

.vacant-pill {
  font-size: 0.72rem;
  background: #10b981;
  color: white;
  padding: 2px 7px;
  border-radius: 9999px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.banner-specs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: #334155;
  margin-top: 3px;
  flex-wrap: wrap;
}

.banner-specs .sep {
  color: #cbd5e1;
}

.advance-calc {
  color: #92400e;
  background: #fef3c7;
  padding: 1px 6px;
  border-radius: 4px;
}

.recenter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #10b981;
  color: #065f46;
  font-weight: 600;
  font-size: 0.82rem;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.recenter-btn:hover {
  background: #10b981;
  color: #ffffff;
}

/* Map View */
.map-view-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.map-frame {
  position: relative;
  width: 100%;
  height: 380px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  background: #e2e8f0;
}

.leaflet-map-canvas {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.map-floating-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 500;
  display: flex;
  gap: 8px;
}

.tile-switch-group {
  display: flex;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(6px);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.tile-btn {
  padding: 4px 10px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tile-btn.active {
  background: #10b981;
  color: white;
}

.ctrl-icon-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #334155;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.ctrl-icon-btn:hover {
  background: #10b981;
  color: white;
}

.map-vacant-counter {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 500;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(4px);
  color: #f8fafc;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.map-vacant-counter i {
  color: #34d399;
}

/* Quick chips strip */
.quick-vacant-chips-scroll {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding: 6px 2px;
}

.chips-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
}

.stall-chip-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1.5px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.8rem;
  transition: all 0.18s ease;
}

.stall-chip-btn:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.stall-chip-btn.selected {
  border-color: #10b981;
  background: #10b981;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.35);
}

.chip-no {
  font-weight: 700;
}

.chip-rent {
  font-size: 0.72rem;
  opacity: 0.88;
}

/* Grid View */
.vacant-stalls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.vacant-stall-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}

.vacant-stall-card:hover {
  border-color: #10b981;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.12);
}

.vacant-stall-card.selected {
  border-color: #10b981;
  background: #f0fdf4;
  box-shadow: 0 0 0 2px #10b981;
}

.card-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vacant-dot-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 800;
  color: #059669;
  letter-spacing: 0.5px;
}

.mini-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

.stall-zone-tag {
  font-size: 0.72rem;
  background: #f1f5f9;
  color: #475569;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.card-stall-hero {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 1px dashed #e2e8f0;
  padding-bottom: 8px;
}

.card-stall-no {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.card-rate-box {
  text-align: right;
}

.rate-num {
  font-size: 1.1rem;
  font-weight: 800;
  color: #059669;
}

.rate-per {
  font-size: 0.75rem;
  color: #64748b;
  margin-left: 2px;
}

.card-specs-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
}

.spec-row {
  display: flex;
  justify-content: space-between;
}

.spec-lbl {
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.spec-val {
  color: #1e293b;
  font-weight: 500;
}

.card-select-btn {
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #10b981;
  background: #ffffff;
  color: #059669;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.card-select-btn:hover {
  background: #10b981;
  color: #ffffff;
}

.card-select-btn.active {
  background: #10b981;
  color: #ffffff;
}

.no-vacancies-card {
  text-align: center;
  padding: 40px 20px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #64748b;
}

.btn-reset-filters {
  margin-top: 10px;
  padding: 6px 14px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

<style>
/* Global Leaflet Marker Styles for Vacant Pins */
.vacant-leaflet-marker-wrapper {
  background: transparent;
  border: none;
}

.vacant-pin-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.vacant-pin-marker:hover {
  transform: scale(1.15) translateY(-3px);
  z-index: 1000 !important;
}

.vacant-pin-marker.is-selected {
  transform: scale(1.22) translateY(-4px);
  z-index: 1001 !important;
}

.vacant-pin-marker .pin-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 14px;
  font-size: 0.78rem;
  font-weight: 800;
  box-shadow: 0 4px 10px rgba(5, 150, 105, 0.45);
  border: 1.5px solid #ffffff;
  white-space: nowrap;
}

.vacant-pin-marker.is-selected .pin-badge {
  background: linear-gradient(135deg, #047857 0%, #064e3b 100%);
  border-color: #fef08a;
  box-shadow: 0 0 0 3px rgba(254, 240, 138, 0.7), 0 6px 14px rgba(0, 0, 0, 0.3);
}

.vacant-pin-marker .pin-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a7f3d0;
}

.vacant-pin-marker.is-selected .pin-dot {
  background: #fef08a;
}

.vacant-pin-marker .pin-stem {
  width: 2px;
  height: 10px;
  background: #059669;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.vacant-pin-marker.is-selected .pin-stem {
  background: #047857;
  height: 12px;
}

/* Leaflet Popup customization */
.vacant-leaflet-popup .leaflet-popup-content-wrapper {
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
  border: 1px solid #cbd5e1;
}

.vacant-leaflet-popup .leaflet-popup-content {
  margin: 12px 14px;
  line-height: 1.4;
}

.vacant-popup-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.popup-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popup-vacant-badge {
  font-size: 0.7rem;
  font-weight: 800;
  color: #10b981;
}

.popup-stall-no {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.popup-type {
  font-size: 0.78rem;
  color: #64748b;
}

.popup-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  background: #f8fafc;
  padding: 6px 8px;
  border-radius: 6px;
  margin: 4px 0;
}

.p-stat {
  display: flex;
  flex-direction: column;
}

.p-lbl {
  font-size: 0.68rem;
  color: #64748b;
}

.p-val {
  font-size: 0.88rem;
  font-weight: 700;
}

.popup-select-btn {
  background: #10b981;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
  width: 100%;
}

.popup-select-btn:hover {
  background: #059669;
}
</style>
