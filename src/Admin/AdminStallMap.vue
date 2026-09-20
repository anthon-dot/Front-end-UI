<template>
  <div class="admin-stall-map-wrapper">
    <!-- Quick Statistics Banner -->
    <div class="map-stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrap stat-blue">
          <i class="pi pi-building"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Stalls</span>
          <strong class="stat-value">{{ totalCount }}</strong>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap stat-green">
          <i class="pi pi-check-circle"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Occupied</span>
          <strong class="stat-value text-emerald-600">{{ occupiedCount }}</strong>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap stat-sky">
          <i class="pi pi-circle"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Vacant / Available</span>
          <strong class="stat-value text-blue-600">{{ vacantCount }}</strong>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap stat-amber">
          <i class="pi pi-clock"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Reserved</span>
          <strong class="stat-value text-amber-600">{{ reservedCount }}</strong>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap stat-purple">
          <i class="pi pi-chart-pie"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Occupancy Rate</span>
          <strong class="stat-value">{{ occupancyRate }}%</strong>
        </div>
      </div>
    </div>

    <!-- Filter and Control Bar -->
    <div class="map-controls-bar">
      <div class="controls-left">
        <!-- Status Filter Pills -->
        <div class="status-filter-pills">
          <button
            type="button"
            class="filter-pill"
            :class="{ active: statusFilter === 'ALL' }"
            @click="statusFilter = 'ALL'"
          >
            All ({{ totalCount }})
          </button>
          <button
            type="button"
            class="filter-pill pill-occupied"
            :class="{ active: statusFilter === 'OCCUPIED' }"
            @click="statusFilter = 'OCCUPIED'"
          >
            <span class="pill-dot dot-green"></span>
            Occupied ({{ occupiedCount }})
          </button>
          <button
            type="button"
            class="filter-pill pill-vacant"
            :class="{ active: statusFilter === 'VACANT' }"
            @click="statusFilter = 'VACANT'"
          >
            <span class="pill-dot dot-blue"></span>
            Vacant ({{ vacantCount }})
          </button>
          <button
            type="button"
            class="filter-pill pill-reserved"
            :class="{ active: statusFilter === 'RESERVED' }"
            @click="statusFilter = 'RESERVED'"
          >
            <span class="pill-dot dot-amber"></span>
            Reserved ({{ reservedCount }})
          </button>
        </div>

        <!-- Search Input -->
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search stall #, section, occupant..."
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <div class="controls-right">
        <!-- Admin Add Stall Button (triggers draggable pin placement on map) -->
        <button
          type="button"
          class="ctrl-btn btn-add-stall"
          title="Drag and place a new stall on the map"
          @click="startAddStallFlow"
        >
          <i class="pi pi-plus"></i>
          Add Stall
        </button>

        <button
          v-if="viewMode === 'map'"
          type="button"
          class="ctrl-btn"
          title="Recenter Map on Market"
          @click="recenterMap"
        >
          <i class="pi pi-compass"></i>
          Recenter
        </button>

        <div class="view-mode-toggle">
          <button
            type="button"
            class="view-btn"
            :class="{ active: viewMode === 'map' }"
            @click="switchViewMode('map')"
          >
            <i class="pi pi-map"></i>
            Map View
          </button>
          <button
            type="button"
            class="view-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="switchViewMode('grid')"
          >
            <i class="pi pi-th-large"></i>
            Grid View
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Layout -->
    <div class="stall-map-layout">
      <!-- Left Column: Map or Grid -->
      <div class="map-primary-column">
        <!-- MAP VIEW -->
        <div v-show="viewMode === 'map'" class="map-viewport-container">
          <div id="admin-map" class="admin-map-element"></div>

          <!-- Market Badge Overlay -->
          <div v-if="!isPickingLocation && !isAddingStall" class="market-badge-overlay">
            <div class="market-badge-dot"></div>
            <div class="market-badge-text">
              <strong>Manticao Public Market</strong>
              <small>Interactive Stall Occupancy Map</small>
            </div>
          </div>

          <!-- Adding New Stall Drag Banner Overlay -->
          <div v-if="isAddingStall" class="picker-mode-banner adding-mode-banner">
            <div class="picker-mode-info">
              <span class="picker-pulse-dot adding-pulse"></span>
              <div>
                <strong>📍 Placing New Stall: Drag the orange pin to the stall position</strong>
                <p>Coordinates: {{ newStallCoords?.lat ?? '—' }}, {{ newStallCoords?.lng ?? '—' }} (Drag pin or click map)</p>
              </div>
            </div>
            <div class="picker-mode-actions">
              <button type="button" class="btn-picker-cancel" @click="cancelAddStall">
                Cancel
              </button>
              <button type="button" class="btn-picker-proceed" @click="proceedNewStall">
                Enter Stall Details &rarr;
              </button>
            </div>
          </div>

          <!-- Location Picker Banner Overlay (for existing stall relocation) -->
          <div v-if="isPickingLocation" class="picker-mode-banner">
            <div class="picker-mode-info">
              <span class="picker-pulse-dot"></span>
              <div>
                <strong>Assigning Location: {{ selectedStall?.stallNo || 'Stall' }}</strong>
                <p>Click on the map or drag the orange pin. Lat: {{ pickerCoords?.lat ?? '—' }}, Lng: {{ pickerCoords?.lng ?? '—' }}</p>
              </div>
            </div>
            <div class="picker-mode-actions">
              <button type="button" class="btn-picker-cancel" @click="cancelPickingLocation">
                Cancel
              </button>
              <button type="button" class="btn-picker-save" :disabled="!pickerCoords" @click="saveLocation">
                ✓ Save Location
              </button>
            </div>
          </div>

          <!-- Map Legend -->
          <div v-if="!isPickingLocation && !isAddingStall" class="map-legend-overlay">
            <div class="legend-item">
              <img src="/icons/stall-pin-green.svg" alt="Occupied" class="legend-icon" />
              <span>Occupied</span>
            </div>
            <div class="legend-item">
              <img src="/icons/stall-pin-blue.svg" alt="Vacant" class="legend-icon" />
              <span>Vacant / Available</span>
            </div>
            <div class="legend-item">
              <img src="/icons/stall-pin-yellow.svg" alt="Reserved" class="legend-icon" />
              <span>Reserved</span>
            </div>
          </div>
        </div>

        <!-- GRID VIEW (Alternative) -->
        <div v-show="viewMode === 'grid'" class="stall-grid-container">
          <div v-if="filteredStalls.length" class="stall-cards-grid">
            <div
              v-for="stall in filteredStalls"
              :key="stall.id"
              class="stall-grid-card"
              :class="[
                `status-${normalizeStatus(stall.status)}`,
                { selected: selectedStall?.id === stall.id }
              ]"
              @click="selectStall(stall)"
            >
              <div class="grid-card-top">
                <span class="grid-stall-no">{{ stall.stallNo || 'Stall' }}</span>
                <span :class="`grid-status-pill status-${normalizeStatus(stall.status)}`">
                  {{ (stall.status || 'VACANT').toUpperCase() }}
                </span>
              </div>
              <div class="grid-card-section">{{ stall.section || 'Public Market' }}</div>
              <div class="grid-card-type">{{ stall.stallType || 'Standard Stall' }}</div>
              <div class="grid-card-rent">{{ formatCurrency(stall.monthlyRent) }} / mo</div>
              <div class="grid-card-occupant">
                <i class="pi pi-user"></i>
                <span>{{ stall.currentOccupant || 'No occupant' }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <i class="pi pi-inbox"></i>
            <p>No stalls match the current filter.</p>
          </div>
        </div>
      </div>

      <!-- Right Column: Selected Stall Details -->
      <div class="map-sidebar-column">
        <div v-if="selectedStall" class="selected-stall-card">
          <div class="sidebar-header">
            <div>
              <div class="sidebar-title">{{ selectedStall.stallNo || 'Stall' }}</div>
              <div class="sidebar-subtitle">{{ selectedStall.section || 'Public Market' }}</div>
            </div>
            <span :class="`sidebar-status-tag status-${normalizeStatus(selectedStall.status)}`">
              {{ (selectedStall.status || 'VACANT').toUpperCase() }}
            </span>
          </div>

          <!-- Stall Image if available -->
          <div v-if="selectedStall.imageUrl || selectedStall.image_url" class="sidebar-image-wrap">
            <img
              :src="selectedStall.imageUrl || selectedStall.image_url"
              alt="Stall photo"
              class="sidebar-stall-img"
            />
          </div>

          <div class="sidebar-details-list">
            <div class="sidebar-detail-row">
              <span class="detail-label">Stall Number</span>
              <strong class="detail-val">{{ selectedStall.stallNo }}</strong>
            </div>
            <div class="sidebar-detail-row">
              <span class="detail-label">Section</span>
              <strong class="detail-val">{{ selectedStall.section }}</strong>
            </div>
            <div class="sidebar-detail-row">
              <span class="detail-label">Stall Type</span>
              <strong class="detail-val">{{ selectedStall.stallType || 'Standard' }}</strong>
            </div>
            <div class="sidebar-detail-row">
              <span class="detail-label">Dimensions</span>
              <strong class="detail-val">{{ selectedStall.dimensions || 'N/A' }}</strong>
            </div>
            <div class="sidebar-detail-row">
              <span class="detail-label">Monthly Rate</span>
              <strong class="detail-val text-emerald-600">
                {{ formatCurrency(selectedStall.monthlyRent) }}
              </strong>
            </div>
            <div class="sidebar-detail-row">
              <span class="detail-label">Occupant</span>
              <strong class="detail-val">{{ selectedStall.currentOccupant || 'Vacant' }}</strong>
            </div>
            <div class="sidebar-detail-row">
              <span class="detail-label">Contract</span>
              <strong class="detail-val">{{ selectedStall.contractNo || 'None' }}</strong>
            </div>
            <div class="sidebar-detail-row">
              <span class="detail-label">Coordinates</span>
              <span class="detail-val font-mono text-xs">
                {{ formatCoords(selectedStall) }}
              </span>
            </div>
          </div>

          <div class="sidebar-actions">
            <!-- Locate Button -->
            <button
              v-if="hasCoordinates(selectedStall)"
              type="button"
              class="btn-action-side btn-locate"
              @click="focusStall(selectedStall)"
            >
              <i class="pi pi-crosshairs"></i>
              Locate on Map
            </button>

            <!-- Assign / Move Location Button -->
            <button
              type="button"
              class="btn-action-side btn-assign-loc"
              :class="{ 'btn-picking-active': isPickingLocation }"
              @click="togglePickingLocation(selectedStall)"
            >
              <i class="pi pi-map-marker"></i>
              {{ isPickingLocation ? 'Cancel Reposition' : '📍 Set Location on Map' }}
            </button>

            <!-- Edit Stall Button -->
            <button
              type="button"
              class="btn-action-side btn-edit-stall"
              @click="$emit('edit', selectedStall)"
            >
              <i class="pi pi-pencil"></i>
              Edit Stall
            </button>

            <!-- Delete Stall Button -->
            <button
              type="button"
              class="btn-action-side btn-delete-stall"
              @click="$emit('delete', selectedStall)"
            >
              <i class="pi pi-trash"></i>
              Delete Stall
            </button>
          </div>
        </div>

        <div v-else class="empty-selection-card">
          <div class="empty-icon-circle">
            <i class="pi pi-map-marker"></i>
          </div>
          <h4>No Stall Selected</h4>
          <p>Click any stall pin on the map or tile in the grid to view full details and manage.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  rows: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['edit', 'add', 'add-with-location', 'delete', 'update-location'])

const DEFAULT_CENTER = { lat: 8.399991, lng: 124.291353 }
const DEFAULT_MAP_ZOOM = 19
const MIN_MAP_ZOOM = 15

// State
const viewMode = ref('map')
const statusFilter = ref('ALL')
const searchQuery = ref('')
const selectedStall = ref(null)

// Location Picker State (for existing stalls)
const isPickingLocation = ref(false)
const pickerCoords = ref(null)
let pickerMarkerLayer = null

// New Stall Placement State (draggable pin first)
const isAddingStall = ref(false)
const newStallCoords = ref(null)
let newStallMarker = null

// Leaflet variables
let mapInstance = null
let markerLayers = []

// Statistics
const totalCount = computed(() => props.rows.length)

const occupiedCount = computed(() => {
  return props.rows.filter((s) => normalizeStatus(s.status) === 'occupied').length
})

const vacantCount = computed(() => {
  return props.rows.filter((s) => {
    const st = normalizeStatus(s.status)
    return st === 'vacant' || st === 'available'
  }).length
})

const reservedCount = computed(() => {
  return props.rows.filter((s) => normalizeStatus(s.status) === 'reserved').length
})

const occupancyRate = computed(() => {
  if (!totalCount.value) return 0
  return Math.round((occupiedCount.value / totalCount.value) * 100)
})

// Filtered stalls
const filteredStalls = computed(() => {
  return props.rows.filter((stall) => {
    const norm = normalizeStatus(stall.status)

    // Status filter
    if (statusFilter.value === 'OCCUPIED' && norm !== 'occupied') return false
    if (statusFilter.value === 'VACANT' && norm !== 'vacant' && norm !== 'available') return false
    if (statusFilter.value === 'RESERVED' && norm !== 'reserved') return false

    // Search query
    if (searchQuery.value) {
      const q = searchQuery.value.trim().toLowerCase()
      const no = String(stall.stallNo || '').toLowerCase()
      const sec = String(stall.section || '').toLowerCase()
      const type = String(stall.stallType || '').toLowerCase()
      const occ = String(stall.currentOccupant || '').toLowerCase()
      if (!no.includes(q) && !sec.includes(q) && !type.includes(q) && !occ.includes(q)) {
        return false
      }
    }

    return true
  })
})

function normalizeStatus(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'occupied') return 'occupied'
  if (s === 'reserved') return 'reserved'
  if (s === 'vacant' || s === 'available') return 'vacant'
  return 'vacant'
}

function formatCurrency(val) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(Number(val || 0))
}

function hasCoordinates(stall) {
  const lat = stall?.lat ?? stall?.latitude
  const lng = stall?.lng ?? stall?.longitude
  return lat !== null && lat !== undefined && lng !== null && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng))
}

function formatCoords(stall) {
  if (!hasCoordinates(stall)) return 'Not mapped'
  const lat = Number(stall.lat ?? stall.latitude).toFixed(6)
  const lng = Number(stall.lng ?? stall.longitude).toFixed(6)
  return `${lat}, ${lng}`
}

// Marker Icons
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
  const norm = normalizeStatus(status)
  return markerIcons[norm] || markerIcons.vacant
}

// Initialize Leaflet Map with clean Google tiles (No watermark, No POIs)
function initMap() {
  const container = document.getElementById('admin-map')
  if (!container || mapInstance) return

  mapInstance = L.map('admin-map', {
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
  ).addTo(mapInstance)

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
  }, null, { position: 'topright' }).addTo(mapInstance)

  // Map Click handler (for new stall placement or relocating)
  mapInstance.on('click', (e) => {
    if (isAddingStall.value && newStallMarker) {
      const lat = Number(e.latlng.lat.toFixed(6))
      const lng = Number(e.latlng.lng.toFixed(6))
      newStallCoords.value = { lat, lng }
      newStallMarker.setLatLng([lat, lng])
      newStallMarker.openPopup()
    } else if (isPickingLocation.value && pickerMarkerLayer) {
      const lat = Number(e.latlng.lat.toFixed(6))
      const lng = Number(e.latlng.lng.toFixed(6))
      pickerCoords.value = { lat, lng }
      pickerMarkerLayer.setLatLng([lat, lng])
    }
  })

  // Global popup handlers
  window.__adminSelectStall = (id) => {
    const stall = props.rows.find((s) => s.id === id)
    if (stall) {
      selectedStall.value = stall
    }
  }

  window.__adminEditStall = (id) => {
    const stall = props.rows.find((s) => s.id === id)
    if (stall) {
      selectedStall.value = stall
      emit('edit', stall)
    }
  }

  window.__adminRelocateStall = (id) => {
    const stall = props.rows.find((s) => s.id === id)
    if (stall) {
      startPickingLocation(stall)
    }
  }

  window.__adminDeleteStall = (id) => {
    const stall = props.rows.find((s) => s.id === id)
    if (stall) {
      emit('delete', stall)
    }
  }

  window.__adminProceedNewStall = () => {
    proceedNewStall()
  }

  renderMarkers()
}

function renderMarkers() {
  if (!mapInstance) return

  // Clear existing markers
  markerLayers.forEach((m) => mapInstance.removeLayer(m))
  markerLayers = []

  const stallsToRender = filteredStalls.value.filter(hasCoordinates)

  stallsToRender.forEach((stall) => {
    const lat = Number(stall.lat ?? stall.latitude)
    const lng = Number(stall.lng ?? stall.longitude)

    const marker = L.marker([lat, lng], {
      icon: getMarkerIcon(stall.status),
      title: `Stall ${stall.stallNo}`
    }).addTo(mapInstance)

    marker.bindPopup(buildPopupContent(stall))
    marker.stallId = stall.id

    marker.on('click', () => {
      selectedStall.value = stall
    })

    markerLayers.push(marker)
  })
}

function buildPopupContent(stall) {
  const norm = normalizeStatus(stall.status)
  const statusLabel = norm.toUpperCase()
  const occupant = stall.currentOccupant || 'Vacant'
  const rent = formatCurrency(stall.monthlyRent)
  const imgUrl = stall.imageUrl || stall.image_url

  return `
    <div class="gm-popup-card">
      ${imgUrl ? `<img src="${imgUrl}" class="gm-popup-img" alt="Stall ${stall.stallNo}" />` : ''}
      <div class="gm-popup-header">
        <span class="gm-popup-stall">${stall.stallNo || 'Stall'}</span>
        <span class="gm-popup-status gm-status-${norm}">${statusLabel}</span>
      </div>
      <div class="gm-popup-type">${stall.section || 'Public Market'} &bull; ${stall.stallType || 'Standard'}</div>
      <div class="gm-popup-row">
        <span class="gm-popup-label">Rent:</span>
        <strong class="gm-popup-rent">${rent} / mo</strong>
      </div>
      <div class="gm-popup-row">
        <span class="gm-popup-label">Occupant:</span>
        <span>${stall.currentOccupant ? `<strong>${occupant}</strong>` : '<em style="color:#94a3b8">None</em>'}</span>
      </div>
      <div class="gm-popup-actions">
        <button onclick="window.__adminSelectStall(${stall.id})" class="gm-btn-view" title="View details">
          Details
        </button>
        <button onclick="window.__adminRelocateStall(${stall.id})" class="gm-btn-loc" title="Move pin location on map">
          📍 Relocate
        </button>
        <button onclick="window.__adminEditStall(${stall.id})" class="gm-btn-manage" title="Edit stall record">
          ✏️ Edit
        </button>
        <button onclick="window.__adminDeleteStall(${stall.id})" class="gm-btn-del" title="Delete stall">
          🗑️
        </button>
      </div>
    </div>
  `
}

function selectStall(stall) {
  selectedStall.value = stall
  if (viewMode.value === 'grid') {
    switchViewMode('map')
  }
  focusStall(stall)
}

function focusStall(stall) {
  if (!mapInstance || !hasCoordinates(stall)) return

  const lat = Number(stall.lat ?? stall.latitude)
  const lng = Number(stall.lng ?? stall.longitude)

  mapInstance.setView([lat, lng], 20, { animate: true })

  const marker = markerLayers.find((m) => m.stallId === stall.id)
  if (marker) {
    marker.openPopup()
  }
}

// ================= NEW STALL DRAGGABLE PLACEMENT WORKFLOW =================
function startAddStallFlow() {
  cancelPickingLocation()
  if (viewMode.value !== 'map') {
    switchViewMode('map')
  }

  isAddingStall.value = true

  nextTick(() => {
    if (!mapInstance) return

    const center = mapInstance.getCenter()
    const lat = Number(center.lat.toFixed(6))
    const lng = Number(center.lng.toFixed(6))
    newStallCoords.value = { lat, lng }

    if (newStallMarker) {
      mapInstance.removeLayer(newStallMarker)
    }

    newStallMarker = L.marker([lat, lng], {
      draggable: true,
      icon: markerIcons.picker,
      title: 'New Stall - Drag to set location'
    }).addTo(mapInstance)

    newStallMarker.bindPopup(`
      <div class="new-stall-popup">
        <strong style="color:#0f172a;font-size:13px;display:block;">📍 New Stall Position</strong>
        <p style="margin:4px 0 8px;font-size:11px;color:#64748b;">Drag pin to desired spot, then proceed to enter details.</p>
        <button onclick="window.__adminProceedNewStall()" class="btn-proceed-popup">
          Enter Stall Details &rarr;
        </button>
      </div>
    `)

    newStallMarker.on('drag', (e) => {
      const pos = e.target.getLatLng()
      newStallCoords.value = {
        lat: Number(pos.lat.toFixed(6)),
        lng: Number(pos.lng.toFixed(6))
      }
    })

    newStallMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng()
      newStallCoords.value = {
        lat: Number(pos.lat.toFixed(6)),
        lng: Number(pos.lng.toFixed(6))
      }
      newStallMarker.openPopup()
    })

    mapInstance.setView([lat, lng], 19, { animate: true })
    newStallMarker.openPopup()
  })
}

function cancelAddStall() {
  isAddingStall.value = false
  newStallCoords.value = null
  if (newStallMarker && mapInstance) {
    mapInstance.removeLayer(newStallMarker)
    newStallMarker = null
  }
}

function proceedNewStall() {
  if (!newStallCoords.value) return
  const coords = { ...newStallCoords.value }
  cancelAddStall()
  emit('add-with-location', {
    latitude: coords.lat,
    longitude: coords.lng
  })
}

// Location Relocation functions (for existing stalls)
function togglePickingLocation(stall) {
  if (isPickingLocation.value) {
    cancelPickingLocation()
  } else {
    startPickingLocation(stall)
  }
}

function startPickingLocation(stall) {
  if (!stall) return
  cancelAddStall()
  selectedStall.value = stall
  isPickingLocation.value = true

  const lat = Number(stall.lat ?? stall.latitude) || DEFAULT_CENTER.lat
  const lng = Number(stall.lng ?? stall.longitude) || DEFAULT_CENTER.lng
  pickerCoords.value = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }

  if (!pickerMarkerLayer) {
    pickerMarkerLayer = L.marker([lat, lng], {
      draggable: true,
      icon: markerIcons.picker,
      title: `Set location for Stall ${stall.stallNo}`
    }).addTo(mapInstance)

    pickerMarkerLayer.on('dragend', (e) => {
      const pos = e.target.getLatLng()
      pickerCoords.value = { lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) }
    })
  } else {
    pickerMarkerLayer.setLatLng([lat, lng])
    pickerMarkerLayer.addTo(mapInstance)
  }

  mapInstance.setView([lat, lng], 20, { animate: true })
}

function cancelPickingLocation() {
  isPickingLocation.value = false
  pickerCoords.value = null
  if (pickerMarkerLayer && mapInstance) {
    mapInstance.removeLayer(pickerMarkerLayer)
    pickerMarkerLayer = null
  }
}

function saveLocation() {
  if (!selectedStall.value || !pickerCoords.value) return

  emit('update-location', {
    stallId: selectedStall.value.id,
    latitude: pickerCoords.value.lat,
    longitude: pickerCoords.value.lng
  })

  // Update local coordinates
  selectedStall.value.latitude = pickerCoords.value.lat
  selectedStall.value.longitude = pickerCoords.value.lng
  selectedStall.value.lat = pickerCoords.value.lat
  selectedStall.value.lng = pickerCoords.value.lng

  cancelPickingLocation()
  renderMarkers()
}

function recenterMap() {
  if (!mapInstance) return
  mapInstance.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_MAP_ZOOM, { animate: true })
}

function switchViewMode(mode) {
  viewMode.value = mode
  if (mode === 'map') {
    nextTick(() => {
      if (!mapInstance) {
        initMap()
      } else {
        mapInstance.invalidateSize()
      }
    })
  }
}

// Expose methods for parent components
defineExpose({
  startAddStallFlow
})

// Watchers
watch(
  () => [filteredStalls.value, statusFilter.value],
  () => {
    renderMarkers()
  },
  { deep: true }
)

watch(
  () => props.rows,
  (newRows) => {
    if (newRows.length && !selectedStall.value) {
      selectedStall.value = newRows[0]
    }
    renderMarkers()
  },
  { immediate: true }
)

onMounted(() => {
  nextTick(() => {
    initMap()
    if (props.rows.length && !selectedStall.value) {
      selectedStall.value = props.rows[0]
    }
    setTimeout(() => {
      if (mapInstance) mapInstance.invalidateSize()
    }, 250)
  })
})

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
  markerLayers = []
  if (pickerMarkerLayer) {
    pickerMarkerLayer = null
  }
  if (newStallMarker) {
    newStallMarker = null
  }
  delete window.__adminSelectStall
  delete window.__adminEditStall
  delete window.__adminRelocateStall
  delete window.__adminDeleteStall
  delete window.__adminProceedNewStall
})
</script>

<style scoped>
.admin-stall-map-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

/* Quick Statistics Banner */
.map-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.85rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.15rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.stat-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 1.25rem;
}

.stat-blue {
  background: #eff6ff;
  color: #2563eb;
}

.stat-green {
  background: #ecfdf5;
  color: #10b981;
}

.stat-sky {
  background: #f0f9ff;
  color: #0284c7;
}

.stat-amber {
  background: #fffbeb;
  color: #d97706;
}

.stat-purple {
  background: #faf5ff;
  color: #9333ea;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-value {
  font-size: 1.45rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

/* Filter and Controls Bar */
.map-controls-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 0.85rem 1.15rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.controls-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.85rem;
}

.status-filter-pills {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.filter-pill.active {
  background: #1e293b;
  color: #ffffff;
  border-color: #1e293b;
}

.pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot-green {
  background: #10b981;
}

.dot-blue {
  background: #3b82f6;
}

.dot-amber {
  background: #f59e0b;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  min-width: 260px;
}

.search-box i {
  color: #94a3b8;
  font-size: 0.85rem;
}

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.84rem;
  color: #1e293b;
  width: 100%;
}

.clear-search {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  font-size: 0.75rem;
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.ctrl-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ctrl-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-add-stall {
  background: #2563eb !important;
  color: #ffffff !important;
  border-color: #1d4ed8 !important;
}

.btn-add-stall:hover {
  background: #1d4ed8 !important;
}

.view-mode-toggle {
  display: flex;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.view-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.view-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

/* Layout Grid */
.stall-map-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 1024px) {
  .stall-map-layout {
    grid-template-columns: 1fr;
  }
}

/* Map Primary Column */
.map-primary-column {
  min-height: 580px;
}

.map-viewport-container {
  position: relative;
  width: 100%;
  height: 600px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.admin-map-element {
  width: 100%;
  height: 100%;
}

/* Overlays */
.market-badge-overlay {
  position: absolute;
  top: 14px;
  left: 54px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(6px);
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 10px;
}

.market-badge-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
  70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.market-badge-text {
  display: flex;
  flex-direction: column;
}

.market-badge-text strong {
  font-size: 0.88rem;
  color: #0f172a;
}

.market-badge-text small {
  font-size: 0.72rem;
  color: #64748b;
}

/* Location Picker Mode Banner */
.picker-mode-banner {
  position: absolute;
  top: 14px;
  left: 54px;
  right: 14px;
  z-index: 1000;
  background: #1e293b;
  color: #ffffff;
  padding: 10px 16px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  animation: fadeIn 0.2s ease;
}

.adding-mode-banner {
  background: #0f172a;
  border: 1.5px solid #3b82f6;
}

.picker-mode-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.picker-pulse-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #f97316;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.3);
  animation: pulse 1.5s infinite;
}

.adding-pulse {
  background: #3b82f6 !important;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.4) !important;
}

.picker-mode-info strong {
  font-size: 0.88rem;
  display: block;
}

.picker-mode-info p {
  font-size: 0.75rem;
  color: #cbd5e1;
  margin: 0;
}

.picker-mode-actions {
  display: flex;
  gap: 8px;
}

.btn-picker-cancel {
  background: #334155;
  color: #ffffff;
  border: 1px solid #475569;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-picker-cancel:hover {
  background: #475569;
}

.btn-picker-save {
  background: #10b981;
  color: #ffffff;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-picker-save:hover {
  background: #059669;
}

.btn-picker-proceed {
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-picker-proceed:hover {
  background: #1d4ed8;
}

.map-legend-overlay {
  position: absolute;
  bottom: 14px;
  left: 14px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(6px);
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 14px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 600;
  color: #334155;
}

.legend-icon {
  width: 20px;
  height: 20px;
}

/* Grid View alternative */
.stall-grid-container {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  min-height: 580px;
}

.stall-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.85rem;
}

.stall-grid-card {
  padding: 1rem;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.stall-grid-card:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.stall-grid-card.selected {
  border-color: #2563eb;
  background: #f0f7ff;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.grid-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.grid-stall-no {
  font-weight: 700;
  font-size: 0.95rem;
  color: #0f172a;
}

.grid-status-pill {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  letter-spacing: 0.3px;
}

.grid-card-section {
  font-size: 0.76rem;
  color: #64748b;
}

.grid-card-type {
  font-size: 0.74rem;
  color: #475569;
}

.grid-card-rent {
  font-size: 0.85rem;
  font-weight: 700;
  color: #059669;
  margin-top: 0.2rem;
}

.grid-card-occupant {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: #475569;
  padding-top: 0.3rem;
  border-top: 1px dashed #e2e8f0;
}

/* Sidebar Details */
.map-sidebar-column {
  position: sticky;
  top: 1rem;
}

.selected-stall-card,
.empty-selection-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid #f1f5f9;
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.sidebar-subtitle {
  font-size: 0.82rem;
  color: #64748b;
}

.sidebar-status-tag {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  letter-spacing: 0.4px;
}

.status-occupied {
  background: #dcfce7;
  color: #166534;
}

.status-vacant {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-reserved {
  background: #fef3c7;
  color: #92400e;
}

.sidebar-image-wrap {
  width: 100%;
  height: 140px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
}

.sidebar-stall-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar-details-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-bottom: 1.25rem;
}

.sidebar-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.84rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f8fafc;
}

.detail-label {
  color: #64748b;
}

.detail-val {
  color: #0f172a;
}

.sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.btn-action-side {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.65rem 1rem;
  font-size: 0.84rem;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-locate {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.btn-locate:hover {
  background: #dbeafe;
}

.btn-assign-loc {
  background: #fff7ed;
  color: #ea580c;
  border: 1px solid #fed7aa;
}

.btn-assign-loc:hover,
.btn-picking-active {
  background: #ffedd5;
  border-color: #f97316;
  color: #c2410c;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
}

.btn-edit-stall {
  background: #2563eb;
  color: #ffffff;
  border: none;
}

.btn-edit-stall:hover {
  background: #1d4ed8;
}

.btn-delete-stall {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-delete-stall:hover {
  background: #fee2e2;
}

.empty-selection-card {
  text-align: center;
  padding: 3rem 1.5rem;
  color: #64748b;
}

.empty-icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
  color: #94a3b8;
}

.empty-selection-card h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.35rem;
}

.empty-selection-card p {
  font-size: 0.82rem;
  line-height: 1.5;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
</style>

<!-- Global Popup Card Styles (Not Scoped, for Leaflet DOM injection) -->
<style>
.gm-popup-card {
  width: 245px;
  padding: 4px;
  font-family: Inter, system-ui, -apple-system, sans-serif;
  color: #0f172a;
}

.gm-popup-img {
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #e2e8f0;
}

.gm-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.gm-popup-stall {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.gm-popup-status {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  letter-spacing: 0.4px;
}

.gm-status-occupied {
  background: #dcfce7;
  color: #166534;
}

.gm-status-vacant {
  background: #dbeafe;
  color: #1d4ed8;
}

.gm-status-reserved {
  background: #fef3c7;
  color: #92400e;
}

.gm-popup-type {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}

.gm-popup-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}

.gm-popup-label {
  color: #64748b;
}

.gm-popup-rent {
  color: #059669;
}

.gm-popup-actions {
  margin-top: 10px;
  display: flex;
  gap: 4px;
}

.gm-btn-view {
  flex: 1.2;
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.gm-btn-view:hover {
  background: #e2e8f0;
}

.gm-btn-loc {
  flex: 1.3;
  background: #fff7ed;
  color: #ea580c;
  border: 1px solid #fed7aa;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.gm-btn-loc:hover {
  background: #ffedd5;
}

.gm-btn-manage {
  flex: 1;
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.gm-btn-manage:hover {
  background: #1d4ed8;
}

.gm-btn-del {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.gm-btn-del:hover {
  background: #fee2e2;
}

/* New Stall Draggable Pin Popup */
.new-stall-popup {
  padding: 4px;
  font-family: Inter, system-ui, -apple-system, sans-serif;
  text-align: center;
}

.btn-proceed-popup {
  width: 100%;
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-proceed-popup:hover {
  background: #1d4ed8;
}
</style>
