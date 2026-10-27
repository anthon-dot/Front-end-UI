<template>
  <div class="landing-market-map-section">
    <div class="map-section-header">
      <div class="header-content">
        <span class="eyebrow-badge">
          <i class="pi pi-map-marker"></i> Interactive Stall Discovery
        </span>
        <h2 class="section-title">Explore Manticao Public Market Stalls</h2>
        <p class="section-subtitle">
          Browse real-time stall vacancies, review computed monthly rates and dimensions, and apply online directly from the visual map.
        </p>
      </div>

      <!-- Live Quick Stats -->
      <div class="map-stats-strip">
        <button
          type="button"
          class="stat-pill"
          :class="{ active: statusFilter === 'ALL' }"
          @click="statusFilter = 'ALL'"
        >
          <span class="pill-count">{{ totalCount }}</span>
          <span class="pill-label">Total Stalls</span>
        </button>

        <button
          type="button"
          class="stat-pill pill-available"
          :class="{ active: statusFilter === 'AVAILABLE' }"
          @click="statusFilter = 'AVAILABLE'"
        >
          <span class="pill-dot dot-available"></span>
          <span class="pill-count text-emerald-600">{{ availableCount }}</span>
          <span class="pill-label">Available to Lease</span>
        </button>

        <button
          type="button"
          class="stat-pill pill-pending"
          :class="{ active: statusFilter === 'PENDING' }"
          @click="statusFilter = 'PENDING'"
        >
          <span class="pill-dot dot-pending"></span>
          <span class="pill-count text-amber-600">{{ pendingCount }}</span>
          <span class="pill-label">Pending Approval</span>
        </button>

        <button
          type="button"
          class="stat-pill pill-occupied"
          :class="{ active: statusFilter === 'OCCUPIED' }"
          @click="statusFilter = 'OCCUPIED'"
        >
          <span class="pill-dot dot-occupied"></span>
          <span class="pill-count text-blue-600">{{ occupiedCount }}</span>
          <span class="pill-label">Occupied</span>
        </button>
      </div>
    </div>

    <!-- Main Map & Control Shell -->
    <div class="map-card-shell">
      <!-- Toolbar -->
      <div class="map-toolbar">
        <div class="toolbar-left">
          <!-- Search Input -->
          <div class="search-input-wrap">
            <i class="pi pi-search search-icon"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search stall #, section, or type..."
              class="toolbar-search"
            />
            <button v-if="searchQuery" class="clear-btn" type="button" @click="searchQuery = ''">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Section Filter -->
          <div class="section-select-wrap">
            <select v-model="sectionFilter" class="toolbar-select">
              <option value="ALL">All Market Sections</option>
              <option v-for="sec in availableSections" :key="sec" :value="sec">
                {{ sec }}
              </option>
            </select>
          </div>
        </div>

        <div class="toolbar-right">
          <!-- Map Style Toggle -->
          <div class="layer-toggle-group">
            <button
              type="button"
              class="layer-btn"
              :class="{ active: mapType === 'roadmap' }"
              @click="setMapType('roadmap')"
              title="Clean Street Map"
            >
              <i class="pi pi-map"></i>
              <span>Street</span>
            </button>
            <button
              type="button"
              class="layer-btn"
              :class="{ active: mapType === 'satellite' }"
              @click="setMapType('satellite')"
              title="Satellite View"
            >
              <i class="pi pi-globe"></i>
              <span>Satellite</span>
            </button>
          </div>

          <!-- Recenter Button -->
          <button
            type="button"
            class="recenter-btn"
            @click="recenterMap"
            title="Recenter Map on Market"
          >
            <i class="pi pi-compass"></i>
            <span>Center Market</span>
          </button>
        </div>
      </div>

      <!-- Map + Sidebar Split View -->
      <div class="map-workspace">
        <!-- Interactive Leaflet Map Container -->
        <div class="map-container-relative">
          <div id="landing-interactive-map" class="leaflet-map-canvas"></div>

          <!-- Map Floating Legend Overlay -->
          <div class="map-floating-legend">
            <div class="legend-header">
              <i class="pi pi-info-circle"></i>
              <span>Stall Status</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot bg-emerald"></span>
              <span>Vacant / Available</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot bg-amber"></span>
              <span>Pending Review</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot bg-blue"></span>
              <span>Currently Leased</span>
            </div>
          </div>

          <!-- Quick Navigation Tip -->
          <div class="map-floating-hint">
            <i class="pi pi-hand"></i> Click on any stall pin to inspect lease rates & apply
          </div>
        </div>

        <!-- Selected Stall Details Drawer / Sidebar -->
        <aside class="stall-inspector-panel" :class="{ 'has-selection': Boolean(selectedStall) }">
          <div v-if="selectedStall" class="inspector-content">
            <div class="inspector-header">
              <div class="stall-id-badge">
                <span class="stall-number">Stall {{ selectedStall.stallNo }}</span>
                <span class="badge-status" :class="getStatusBadgeClass(selectedStall.status)">
                  {{ normalizeStatusLabel(selectedStall.status) }}
                </span>
              </div>
              <button
                type="button"
                class="close-inspector-btn"
                aria-label="Close"
                @click="selectedStall = null"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>

            <!-- Stall Image preview or banner -->
            <div class="inspector-image-wrap">
              <img
                :src="selectedStall.imageUrl || '/market-stall.webp'"
                :alt="'Stall ' + selectedStall.stallNo"
                class="inspector-image"
                @error="$event.target.src = '/market-stall.webp'"
              />
              <div class="image-gradient-overlay">
                <span class="section-tag">
                  <i class="pi pi-tag"></i> {{ selectedStall.sectionName }}
                </span>
              </div>
            </div>

            <!-- Key Specs Grid -->
            <div class="specs-grid">
              <div class="spec-cell">
                <span class="spec-label">Monthly Rental</span>
                <strong class="spec-value text-primary">
                  ₱{{ formatNumber(selectedStall.monthlyRent) }}<small>/mo</small>
                </strong>
              </div>

              <div class="spec-cell">
                <span class="spec-label">Stall Dimensions</span>
                <strong class="spec-value">
                  {{ selectedStall.dimensions || '3m x 3m' }}
                </strong>
              </div>

              <div class="spec-cell">
                <span class="spec-label">Floor Area</span>
                <strong class="spec-value">
                  {{ selectedStall.areaSqm ? selectedStall.areaSqm + ' sqm' : '9.00 sqm' }}
                </strong>
              </div>

              <div class="spec-cell">
                <span class="spec-label">Rate Category</span>
                <strong class="spec-value">
                  {{ selectedStall.rateCategory === 'OLD' ? 'Old Category' : 'New Standard' }}
                </strong>
              </div>
            </div>

            <!-- Estimated Initial Payment Breakdown -->
            <div class="breakdown-box">
              <div class="breakdown-title">
                <i class="pi pi-calculator"></i>
                <span>Initial Lease Breakdown (Blueprint Formula)</span>
              </div>
              <div class="breakdown-row">
                <span>Stall Rights Fee (One-time)</span>
                <strong>₱{{ formatNumber(selectedStall.stallRightsFee || 5000) }}</strong>
              </div>
              <div class="breakdown-row">
                <span>Mandatory Advance Rent (2 Mos.)</span>
                <strong>₱{{ formatNumber((selectedStall.monthlyRent || 1500) * 2) }}</strong>
              </div>
              <div class="breakdown-divider"></div>
              <div class="breakdown-row total-row">
                <span>Total Initial Amount Due</span>
                <strong class="total-price">
                  ₱{{ formatNumber((selectedStall.stallRightsFee || 5000) + ((selectedStall.monthlyRent || 1500) * 2)) }}
                </strong>
              </div>
              <p class="penalty-note">
                <i class="pi pi-shield"></i> Standard LGU policy applies; no automatic penalty surcharges.
              </p>
            </div>

            <!-- Actions -->
            <div class="inspector-actions">
              <button
                v-if="isStallAvailable(selectedStall.status)"
                type="button"
                class="btn-apply-primary"
                @click="onApplyForStall(selectedStall)"
              >
                <i class="pi pi-file-edit"></i>
                <span>Apply for Stall {{ selectedStall.stallNo }}</span>
              </button>

              <div v-else class="unavailable-notice">
                <i class="pi pi-lock"></i>
                <span>This stall is currently {{ normalizeStatusLabel(selectedStall.status).toLowerCase() }}. Applications are only open for vacant stalls.</span>
              </div>

              <router-link to="/stalls" class="btn-view-list">
                <span>View Full Stall Directory</span>
                <i class="pi pi-arrow-right"></i>
              </router-link>
            </div>
          </div>

          <!-- Empty State when no stall is selected -->
          <div v-else class="empty-inspector-placeholder">
            <div class="empty-icon-ring">
              <i class="pi pi-map-marker"></i>
            </div>
            <h3>Select a Market Stall</h3>
            <p>Click on any stall marker on the interactive map to view exact dimensions, monthly rent, and start your lease application.</p>
            <div class="quick-pick-stalls" v-if="vacantStallsList.length">
              <span class="quick-pick-title">Available for immediate lease:</span>
              <div class="quick-pick-buttons">
                <button
                  v-for="s in vacantStallsList.slice(0, 4)"
                  :key="s.id"
                  type="button"
                  class="quick-stall-btn"
                  @click="selectStall(s)"
                >
                  <span class="qs-badge">#{{ s.stallNo }}</span>
                  <span class="qs-rent">₱{{ formatNumber(s.monthlyRent) }}</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../config/supabase'
import api from '../services/api'
import {
  MARKET_CENTER as DEFAULT_CENTER,
  MARKET_DEFAULT_ZOOM as DEFAULT_ZOOM,
  MARKET_MIN_ZOOM as MIN_ZOOM,
  MARKET_MAX_ZOOM,
  BASEMAP_TILES,
  isNearMarket,
  offsetFromMarket
} from '../constants/marketMap'

const router = useRouter()

// Market center, zoom levels & tiles come from src/constants/marketMap.js

// Reactive State
const stalls = ref([])
const isLoading = ref(true)
const statusFilter = ref('ALL')
const sectionFilter = ref('ALL')
const searchQuery = ref('')
const mapType = ref('roadmap')
const selectedStall = ref(null)

// Leaflet Instances
let mapInstance = null
let tileLayerInstance = null
let markerGroup = null

// Fallback seed stalls for smooth presentation if offline
const SEED_FALLBACK_STALLS = [
  { id: 1, stallNo: 'WS-01', sectionName: 'Wet Section (Fish & Meat)', stallType: 'Wet Section Stall', rateCategory: 'NEW', dimensions: '3m x 3m', areaSqm: 9, monthlyRent: 3500, stallRightsFee: 5000, status: 'AVAILABLE', ...offsetFromMarket(-0.00015, -0.00025) },
  { id: 2, stallNo: 'WS-02', sectionName: 'Wet Section (Fish & Meat)', stallType: 'Wet Section Stall', rateCategory: 'NEW', dimensions: '3m x 3m', areaSqm: 9, monthlyRent: 3500, stallRightsFee: 5000, status: 'OCCUPIED', ...offsetFromMarket(-0.00005, -0.00015) },
  { id: 3, stallNo: 'DG-01', sectionName: 'Dry Goods & Groceries', stallType: 'Dry Goods Stall', rateCategory: 'OLD', dimensions: '3m x 3m', areaSqm: 9, monthlyRent: 2000, stallRightsFee: 3000, status: 'AVAILABLE', ...offsetFromMarket(0.00005, -0.00005) },
  { id: 4, stallNo: 'DG-02', sectionName: 'Dry Goods & Groceries', stallType: 'Dry Goods Stall', rateCategory: 'OLD', dimensions: '3m x 3m', areaSqm: 9, monthlyRent: 2000, stallRightsFee: 3000, status: 'OCCUPIED', ...offsetFromMarket(0.00015, 0.00005) },
  { id: 5, stallNo: 'FC-01', sectionName: 'Food Court & Eatery', stallType: 'Food Court Eatery', rateCategory: 'NEW', dimensions: '4m x 3m', areaSqm: 12, monthlyRent: 4000, stallRightsFee: 5000, status: 'AVAILABLE', ...offsetFromMarket(0.00025, 0.00015) },
  { id: 6, stallNo: 'VG-01', sectionName: 'Vegetables & Fruits', stallType: 'Vegetable & Fruit Stall', rateCategory: 'OLD', dimensions: '3m x 2m', areaSqm: 6, monthlyRent: 1500, stallRightsFee: 3000, status: 'PENDING', ...offsetFromMarket(0.00035, 0.00025) },
  { id: 7, stallNo: 'CP-01', sectionName: 'Commercial Perimeter Block', stallType: 'Commercial Perimeter Stall', rateCategory: 'NEW', dimensions: '4m x 4m', areaSqm: 16, monthlyRent: 5000, stallRightsFee: 6000, status: 'AVAILABLE', ...offsetFromMarket(0.00045, 0.00035) }
]

// Available Sections for Dropdown
const availableSections = computed(() => {
  const set = new Set()
  stalls.value.forEach((s) => {
    if (s.sectionName) set.add(s.sectionName)
  })
  return Array.from(set).sort()
})

// Counts
const totalCount = computed(() => stalls.value.length)
const availableCount = computed(() => stalls.value.filter((s) => isStallAvailable(s.status)).length)
const pendingCount = computed(() => stalls.value.filter((s) => normalizeStatus(s.status) === 'pending').length)
const occupiedCount = computed(() => stalls.value.filter((s) => normalizeStatus(s.status) === 'occupied').length)

const vacantStallsList = computed(() => stalls.value.filter((s) => isStallAvailable(s.status)))

// Filtered Stalls for Display
const filteredStalls = computed(() => {
  return stalls.value.filter((s) => {
    // Status filter
    const normStatus = normalizeStatus(s.status)
    if (statusFilter.value === 'AVAILABLE' && !isStallAvailable(s.status)) return false
    if (statusFilter.value === 'OCCUPIED' && normStatus !== 'occupied') return false
    if (statusFilter.value === 'PENDING' && normStatus !== 'pending') return false

    // Section filter
    if (sectionFilter.value !== 'ALL' && s.sectionName !== sectionFilter.value) return false

    // Search query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const matchesNo = String(s.stallNo || '').toLowerCase().includes(q)
      const matchesSec = String(s.sectionName || '').toLowerCase().includes(q)
      const matchesType = String(s.stallType || '').toLowerCase().includes(q)
      if (!matchesNo && !matchesSec && !matchesType) return false
    }

    return true
  })
})

// Helpers
function normalizeStatus(st) {
  const upper = String(st || '').toUpperCase()
  if (upper === 'AVAILABLE' || upper === 'VACANT' || upper === 'UNASSIGNED') return 'available'
  if (upper === 'PENDING' || upper === 'RESERVED' || upper === 'OCCUPIED_PENDING_VERIFICATION') return 'pending'
  return 'occupied'
}

function normalizeStatusLabel(st) {
  const n = normalizeStatus(st)
  if (n === 'available') return 'AVAILABLE'
  if (n === 'pending') return 'PENDING RESERVATION'
  return 'OCCUPIED'
}

function isStallAvailable(st) {
  return normalizeStatus(st) === 'available'
}

function getStatusBadgeClass(st) {
  const n = normalizeStatus(st)
  if (n === 'available') return 'badge-available'
  if (n === 'pending') return 'badge-pending'
  return 'badge-occupied'
}

function formatNumber(val) {
  return Number(val || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Data Fetching
async function loadStallsData() {
  isLoading.value = true
  try {
    let rawList = []

    // 1. Try Express backend API
    try {
      const res = await api.get('/stalls')
      if (res.data?.stalls && Array.isArray(res.data.stalls)) {
        rawList = res.data.stalls
      } else if (Array.isArray(res.data)) {
        rawList = res.data
      }
    } catch (e) {
      // Fallback directly to Supabase client
      const { data, error } = await supabase
        .from('stalls')
        .select('*')
        .order('stall_no')
      if (!error && Array.isArray(data) && data.length) {
        rawList = data
      }
    }

    if (!rawList || !rawList.length) {
      rawList = SEED_FALLBACK_STALLS
    }

    // Map each stall and ensure geocoordinates
    stalls.value = rawList.map((item, index) => {
      const stallNo = item.stall_no || item.stallNo || `ST-${item.id}`
      const monthlyRent = Number(item.monthly_rent || item.monthlyRent || item.price || 1500)
      const stallRightsFee = Number(item.stall_rights_fee || item.stallRightsFee || 5000)
      const sectionName = item.section?.name || item.section_name || item.sectionName || item.info || 'Main Market Floor'
      const stallType = item.stall_type || item.stallType || 'Standard Retail Stall'
      const dimensions = item.dimensions || '3m x 3m'
      const areaSqm = Number(item.area_sqm || item.areaSqm || 9.0)
      const rateCategory = item.rate_category || item.rateCategory || 'NEW'
      const status = item.status || 'AVAILABLE'

      // Extract coordinates from coordinates JSON or lat/lng fields
      let lat = item.latitude ?? item.lat
      let lng = item.longitude ?? item.lng

      if (item.map_coordinates && typeof item.map_coordinates === 'object') {
        if (item.map_coordinates.lat) lat = item.map_coordinates.lat
        if (item.map_coordinates.lng) lng = item.map_coordinates.lng
      }

      // If coordinates missing, assign deterministic spot inside Manticao Public Market perimeter
      if (!isNearMarket(lat, lng)) {
        const col = index % 5
        const row = Math.floor(index / 5)
        lat = Number((DEFAULT_CENTER.lat + (row * 0.00018) - 0.00035).toFixed(6))
        lng = Number((DEFAULT_CENTER.lng + (col * 0.00018) - 0.00035).toFixed(6))
      }

      return {
        id: item.id,
        stallNo,
        sectionName,
        stallType,
        dimensions,
        areaSqm,
        monthlyRent,
        stallRightsFee,
        rateCategory,
        status,
        lat: Number(lat),
        lng: Number(lng),
        imageUrl: item.image_url || item.imageUrl || null
      }
    })

    // If no stall selected yet, select first available stall
    const firstAvail = stalls.value.find((s) => isStallAvailable(s.status))
    if (firstAvail && !selectedStall.value) {
      selectedStall.value = firstAvail
    }
  } catch (err) {
    console.warn('[LandingMarketMap] Error loading stalls:', err)
    stalls.value = SEED_FALLBACK_STALLS
  } finally {
    isLoading.value = false
    await nextTick()
    initOrUpdateMap()
  }
}

// Leaflet Map Setup
function initOrUpdateMap() {
  const container = document.getElementById('landing-interactive-map')
  if (!container) return

  if (!mapInstance) {
    mapInstance = L.map('landing-interactive-map', {
      center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      zoom: DEFAULT_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MARKET_MAX_ZOOM,
      zoomControl: false,
      scrollWheelZoom: true
    })

    // Position Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance)

    // Base Tile Layer
    const tileConfig = BASEMAP_TILES[mapType.value] || BASEMAP_TILES.roadmap
    tileLayerInstance = L.tileLayer(tileConfig.url, tileConfig.options).addTo(mapInstance)

    markerGroup = L.featureGroup().addTo(mapInstance)
  }

  renderMarkers()
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
    mapInstance.fitBounds(markerGroup.getBounds().pad(0.18))
  } else {
    mapInstance.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_ZOOM)
  }
}

function createMarkerIcon(stall, isSelected = false) {
  const norm = normalizeStatus(stall.status)
  const isAvail = norm === 'available'
  const isPending = norm === 'pending'

  const pinColorClass = isAvail ? 'pin-avail' : isPending ? 'pin-pend' : 'pin-occ'
  const iconSvg = isAvail
    ? '/icons/stall-pin-green.svg'
    : isPending
    ? '/icons/stall-pin-yellow.svg'
    : '/icons/stall-pin-blue.svg'

  const html = `
    <div class="landing-stall-marker ${pinColorClass} ${isSelected ? 'is-selected' : ''}" title="Stall #${stall.stallNo}">
      <span class="marker-pill">#${stall.stallNo}</span>
      <img src="${iconSvg}" class="marker-icon-img" alt="Stall #${stall.stallNo}" />
    </div>
  `

  return L.divIcon({
    className: 'landing-leaflet-icon-wrapper',
    html,
    iconSize: [44, 54],
    iconAnchor: [22, 54],
    popupAnchor: [0, -50]
  })
}

function renderMarkers() {
  if (!mapInstance || !markerGroup) return
  markerGroup.clearLayers()

  const listToRender = filteredStalls.value

  listToRender.forEach((stall) => {
    if (!stall.lat || !stall.lng) return

    const isSelected = selectedStall.value && selectedStall.value.id === stall.id
    const icon = createMarkerIcon(stall, isSelected)

    const marker = L.marker([stall.lat, stall.lng], { icon })

    // Popup with public information
    const popupHtml = `
      <div class="landing-map-popup">
        <div class="popup-head">
          <strong>Stall ${stall.stallNo}</strong>
          <span class="popup-badge ${getStatusBadgeClass(stall.status)}">${normalizeStatusLabel(stall.status)}</span>
        </div>
        <p class="popup-sec"><i class="pi pi-tag"></i> ${stall.sectionName}</p>
        <p class="popup-price"><strong>₱${formatNumber(stall.monthlyRent)}</strong> <small>/month</small></p>
        <div class="popup-meta">
          <span>${stall.dimensions}</span> &bull; <span>${stall.areaSqm} sqm</span>
        </div>
      </div>
    `
    marker.bindPopup(popupHtml, { closeButton: false, offset: [0, -10] })

    // Click handler selects the stall in inspector
    marker.on('click', () => {
      selectStall(stall)
    })

    markerGroup.addLayer(marker)
  })

  // Fit bounds if markers are present
  if (markerGroup.getLayers().length > 0) {
    try {
      mapInstance.fitBounds(markerGroup.getBounds().pad(0.18))
    } catch (_) {
      mapInstance.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_ZOOM)
    }
  }
}

function selectStall(stall) {
  selectedStall.value = stall
  if (mapInstance && stall.lat && stall.lng) {
    mapInstance.panTo([stall.lat, stall.lng], { animate: true, duration: 0.5 })
  }
  renderMarkers()
}

function onApplyForStall(stall) {
  if (!isStallAvailable(stall.status)) return
  router.push({
    name: 'CreateAccount',
    query: { stall_id: stall.id, stall_no: stall.stallNo }
  })
}

// Watch filters to update markers
watch([statusFilter, sectionFilter, searchQuery], () => {
  renderMarkers()
})

onMounted(() => {
  loadStallsData()
})

onBeforeUnmount(() => {
  if (mapInstance) {
    try {
      mapInstance.remove()
    } catch (_) {}
    mapInstance = null
  }
})
</script>

<style scoped>
.landing-market-map-section {
  width: 100%;
  padding: 40px 0 20px;
}

.map-section-header {
  margin-bottom: 24px;
}

.header-content {
  text-align: center;
  max-width: 780px;
  margin: 0 auto 24px;
}

.eyebrow-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1d4ed8;
  letter-spacing: 0.02em;
  margin-bottom: 12px;
}

.section-title {
  font-size: clamp(1.8rem, 3.2vw, 2.5rem);
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 12px;
}

.section-subtitle {
  font-size: 1.05rem;
  color: #475569;
  line-height: 1.6;
}

/* Stats Strip */
.map-stats-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 10px;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.stat-pill:hover {
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
}

.stat-pill.active {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.15);
}

.pill-count {
  font-weight: 800;
  font-size: 1.1rem;
  color: #0f172a;
}

.pill-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.pill-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-available {
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.dot-pending {
  background: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
}

.dot-occupied {
  background: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* Card Shell */
.map-card-shell {
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

/* Toolbar */
.map-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  font-size: 0.875rem;
}

.toolbar-search {
  padding: 8px 32px 8px 34px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.875rem;
  width: 240px;
  background: #ffffff;
  outline: none;
  transition: all 0.2s ease;
}

.toolbar-search:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  width: 280px;
}

.clear-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
}

.toolbar-select {
  padding: 8px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.875rem;
  background: #ffffff;
  color: #334155;
  font-weight: 500;
  outline: none;
  cursor: pointer;
}

.layer-toggle-group {
  display: flex;
  background: #e2e8f0;
  padding: 3px;
  border-radius: 12px;
  gap: 2px;
}

.layer-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.layer-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.recenter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: #ffffff;
  color: #334155;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.recenter-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

/* Workspace Split */
.map-workspace {
  display: grid;
  grid-template-columns: 1fr 380px;
  min-height: 580px;
  height: 640px;
}

@media (max-width: 960px) {
  .map-workspace {
    grid-template-columns: 1fr;
    height: auto;
  }
}

.map-container-relative {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 480px;
  background: #e2e8f0;
}

.leaflet-map-canvas {
  width: 100%;
  height: 100%;
  min-height: 480px;
  z-index: 10;
}

/* Floating Elements */
.map-floating-legend {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  background: rgba(255, 255, 255, 0.94);
  padding: 10px 14px;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  font-size: 0.8125rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #0f172a;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 4px;
  margin-bottom: 2px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-weight: 500;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.bg-emerald {
  background: #10b981;
}

.bg-amber {
  background: #f59e0b;
}

.bg-blue {
  background: #3b82f6;
}

.map-floating-hint {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 20;
  background: rgba(15, 23, 42, 0.85);
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(6px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
}

/* Sidebar Inspector */
.stall-inspector-panel {
  background: #ffffff;
  border-left: 1px solid #e2e8f0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 24px 20px;
}

.inspector-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.inspector-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.stall-id-badge {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stall-number {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.badge-status {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  width: fit-content;
}

.badge-available {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.badge-pending {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.badge-occupied {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.close-inspector-btn {
  background: #f1f5f9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-inspector-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.inspector-image-wrap {
  position: relative;
  width: 100%;
  height: 140px;
  border-radius: 14px;
  overflow: hidden;
  background: #f1f5f9;
}

.inspector-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(15, 23, 42, 0.75) 100%);
  display: flex;
  align-items: flex-end;
  padding: 10px 12px;
}

.section-tag {
  color: #ffffff;
  font-size: 0.8125rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Specs Grid */
.specs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.spec-cell {
  background: #f8fafc;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spec-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.spec-value {
  font-size: 0.9375rem;
  color: #1e293b;
  font-weight: 700;
}

.text-primary {
  color: #2563eb;
}

/* Breakdown Box */
.breakdown-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.breakdown-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 2px;
}

.breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: #475569;
}

.breakdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

.total-row {
  font-weight: 700;
  color: #0f172a;
}

.total-price {
  font-size: 1.05rem;
  color: #047857;
}

.penalty-note {
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 4px;
  line-height: 1.3;
}

/* Actions */
.inspector-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.btn-apply-primary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #047857;
  color: #ffffff;
  padding: 12px;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(4, 120, 87, 0.25);
}

.btn-apply-primary:hover {
  background: #065f46;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(4, 120, 87, 0.35);
}

.unavailable-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #f1f5f9;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.8125rem;
  color: #64748b;
  line-height: 1.4;
}

.btn-view-list {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
  border-radius: 10px;
  transition: background 0.2s ease;
}

.btn-view-list:hover {
  background: #eff6ff;
}

/* Empty State */
.empty-inspector-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: auto 0;
  padding: 20px 0;
}

.empty-icon-ring {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #eff6ff;
  color: #2563eb;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  margin-bottom: 16px;
}

.empty-inspector-placeholder h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px;
}

.empty-inspector-placeholder p {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 20px;
}

.quick-pick-stalls {
  width: 100%;
  text-align: left;
}

.quick-pick-title {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.quick-pick-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.quick-stall-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.quick-stall-btn:hover {
  border-color: #10b981;
  background: #ecfdf5;
}

.qs-badge {
  font-weight: 700;
  font-size: 0.8125rem;
  color: #0f172a;
}

.qs-rent {
  font-size: 0.75rem;
  color: #047857;
  font-weight: 600;
}
</style>

<style>
/* Global Leaflet Marker Styles for Landing Page */
.landing-leaflet-icon-wrapper {
  background: transparent !important;
  border: none !important;
}

.landing-stall-marker {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.landing-stall-marker:hover {
  transform: scale(1.18) translateY(-4px);
  z-index: 1000 !important;
}

.landing-stall-marker.is-selected {
  transform: scale(1.24) translateY(-6px);
  z-index: 1100 !important;
}

.marker-pill {
  background: #ffffff;
  color: #0f172a;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 999px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.22);
  white-space: nowrap;
  border: 1.5px solid currentColor;
  margin-bottom: 1px;
  letter-spacing: -0.01em;
}

.pin-avail .marker-pill {
  color: #047857;
  border-color: #10b981;
  background: #ecfdf5;
}

.pin-pend .marker-pill {
  color: #b45309;
  border-color: #f59e0b;
  background: #fffbeb;
}

.pin-occ .marker-pill {
  color: #1d4ed8;
  border-color: #3b82f6;
  background: #eff6ff;
}

.marker-icon-img {
  width: 38px;
  height: 38px;
  filter: drop-shadow(0 6px 12px rgba(15, 23, 42, 0.35));
}

/* Custom Leaflet Popup */
.landing-map-popup {
  padding: 6px;
  min-width: 170px;
}

.popup-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.popup-head strong {
  font-size: 0.9375rem;
  color: #0f172a;
}

.popup-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.popup-sec {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0 0 4px;
}

.popup-price {
  font-size: 0.9375rem;
  color: #2563eb;
  margin: 0 0 4px;
}

.popup-meta {
  font-size: 0.75rem;
  color: #94a3b8;
}
</style>
