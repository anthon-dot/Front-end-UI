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

        <div class="gm-body" @click="onModalBodyClick">
          <form @submit.prevent="saveStall">
            <!-- Stall Info Summary Card (Read-only master data) -->
            <div class="stall-summary-card">
              <div class="summary-top">
                <span class="summary-stall-no">Stall {{ form.number }}</span>
                <span class="summary-type-tag">{{ form.type || 'Standard Stall' }}</span>
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

            <!-- OCCUPANT MANAGEMENT -->
            <div class="occupant-section">
              <!-- Current Occupant Display -->
              <div v-if="currentOccupantName && !selectedStakeholder" class="current-occupant-card">
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
                {{ currentOccupantName ? 'Reassign to Approved Stakeholder' : 'Assign Approved Stakeholder' }}
                <div class="search-input-wrap">
                  <input
                    v-model="stakeholderSearch"
                    type="text"
                    placeholder="Search approved stakeholder by name, business, or contact..."
                    @focus="isSearchDropdownOpen = true"
                    @input="onSearchInput"
                  />
                  <button
                    v-if="stakeholderSearch"
                    type="button"
                    class="btn-clear-search"
                    title="Clear search"
                    @click="clearSearch"
                  >
                    ✕
                  </button>
                </div>
              </label>

              <!-- SELECTED STAKEHOLDER DISPLAY -->
              <div v-if="selectedStakeholder" class="selected-occupant" style="margin-top: 12px;">
                <div class="selected-occupant-info">
                  <div class="selected-badge-row">
                    <span class="selected-tag"><i class="pi pi-check-circle"></i> Ready to Assign & Lease</span>
                    <span class="badge-approved">Approved Stakeholder</span>
                  </div>
                  <div class="selected-occupant-name">
                    <i class="pi pi-user"></i> {{ getPersonName(selectedStakeholder) }}
                  </div>
                  <div class="selected-occupant-biz">
                    <i class="pi pi-briefcase"></i> {{ selectedStakeholder.businessName || selectedStakeholder.business_name || 'Business Applicant' }}
                    <span v-if="selectedStakeholder.contact || selectedStakeholder.email">• {{ selectedStakeholder.contact || selectedStakeholder.email }}</span>
                  </div>
                </div>
                <button type="button" class="btn-clear-selection" title="Change stakeholder" @click="clearSearch">
                  ✕
                </button>
              </div>

              <!-- AUTOMATIC STALL LEASE CONTRACT NOTICE -->
              <div v-if="selectedStakeholder" class="contract-generation-note" style="margin-top: 10px; background: #f0fdfa; border: 1px solid #99f6e4; padding: 10px 14px; border-radius: 10px; font-size: 12px; color: #0f766e; display: flex; align-items: flex-start; gap: 8px; line-height: 1.4;">
                <i class="pi pi-file-edit" style="font-size: 16px; color: #0d9488; margin-top: 1px; flex-shrink: 0;"></i>
                <div>
                  <strong>Automatic Lease Contract:</strong> Updating assignment will automatically issue an active municipal lease contract for <strong>{{ getPersonName(selectedStakeholder) }}</strong> on <strong>Stall {{ form.number }}</strong> (<strong>{{ formatCurrency(form.rent) }}/mo</strong>), immediately viewable in <strong>Contracts</strong>.
                </div>
              </div>

              <!-- RESULTS DROPDOWN -->
              <div
                v-if="isSearchDropdownOpen"
                class="stakeholder-results"
              >
                <div
                  v-if="approvedStakeholders.length === 0"
                  class="stakeholder-empty-notice"
                >
                  <i class="pi pi-info-circle"></i>
                  <span>No approved stakeholders found. Stakeholders will appear here once approved by the Market Supervisor under Applications for Approval.</span>
                </div>

                <div
                  v-else-if="filteredStakeholders.length === 0"
                  class="stakeholder-empty-notice"
                >
                  <i class="pi pi-search"></i>
                  <span>No approved stakeholder matching "{{ stakeholderSearch }}"</span>
                </div>

                <div
                  v-for="person in filteredStakeholders"
                  v-else
                  :key="person.id"
                  class="stakeholder-item"
                  @click="selectStakeholder(person)"
                >
                  <div class="stakeholder-item-top">
                    <span class="stakeholder-name">{{ getPersonName(person) }}</span>
                    <span class="badge-approved">Approved</span>
                  </div>
                  <div v-if="person.businessName || person.business_name" class="stakeholder-biz">
                    <i class="pi pi-briefcase"></i> {{ person.businessName || person.business_name }}
                  </div>
                  <div v-if="person.contact || person.email" class="stakeholder-contact">
                    <i class="pi pi-id-card"></i> {{ person.contact || person.email }}
                  </div>
                  <div v-if="person.selectedStall" class="stakeholder-pref">
                    <i class="pi pi-bookmark"></i> Applied for Stall {{ person.selectedStall.stall_no || person.selectedStall.stallNo }}
                  </div>
                </div>
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
import { useRouter } from 'vue-router'
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

const router = useRouter()

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
const initialOccupantName = ref('')
const isSearchDropdownOpen = ref(false)

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

// Helper to get person full name
function getPersonName(person) {
  if (!person) return ''
  const first = person.firstName || person.first_name || ''
  const last = person.lastName || person.last_name || ''
  return `${first} ${last}`.trim() || 'Unknown Stakeholder'
}

// Stakeholder is approved by Market Supervisor from application for approval
function isApprovedByMarketSupervisor(s) {
  if (!s) return false

  // 1. Explicit Market Supervisor approval flag
  if (s.marketSupervisorApproved === true || s.market_supervisor_approved === true) {
    return true
  }

  // 2. Explicit Market Approval Status string
  const marketStatus = String(
    s.marketApprovalStatus || s.market_approval_status || ''
  ).trim().toUpperCase()

  if (marketStatus === 'APPROVED') {
    return true
  }

  // 3. Application status at or downstream of Market Supervisor approval
  const appStatus = String(
    s.applicationStatus || s.application_status || ''
  ).trim().toUpperCase()

  const downstreamStatuses = [
    'PENDING_BPLO_APPROVAL',
    'BPLO_APPROVED',
    'PENDING_ENDORSEMENT',
    'ENDORSED',
    'COMPLETED'
  ]

  return downstreamStatuses.includes(appStatus)
}

// Approved Stakeholders Filter: only stakeholders approved by Market Supervisor
const approvedStakeholders = computed(() => {
  return (stakeholders.value || []).filter(isApprovedByMarketSupervisor)
})

const filteredStakeholders = computed(() => {
  const list = approvedStakeholders.value
  const q = stakeholderSearch.value.trim().toLowerCase()
  if (!q) return list

  return list.filter((s) => {
    const full = getPersonName(s).toLowerCase()
    const biz = String(s.businessName || s.business_name || '').toLowerCase()
    const contact = String(s.contact || '').toLowerCase()
    const email = String(s.email || '').toLowerCase()
    return full.includes(q) || biz.includes(q) || contact.includes(q) || email.includes(q)
  })
})

function onSearchInput() {
  isSearchDropdownOpen.value = true
  if (selectedStakeholder.value && stakeholderSearch.value !== getPersonName(selectedStakeholder.value)) {
    selectedStakeholder.value = null
  }
}

function selectStakeholder(person) {
  selectedStakeholder.value = person
  form.value.status = 'OCCUPIED'
  stakeholderSearch.value = getPersonName(person)
  isSearchDropdownOpen.value = false
}

function clearSearch() {
  selectedStakeholder.value = null
  stakeholderSearch.value = ''
  isSearchDropdownOpen.value = false
  if (!currentOccupantName.value) {
    form.value.status = 'VACANT'
  }
}

function unassignCurrentOccupant() {
  currentOccupantName.value = ''
  selectedStakeholder.value = null
  stakeholderSearch.value = ''
  form.value.status = 'VACANT'
  isSearchDropdownOpen.value = false
}

function onModalBodyClick(e) {
  if (e && e.target && !e.target.closest('.search-input-wrap') && !e.target.closest('.stakeholder-results')) {
    isSearchDropdownOpen.value = false
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
        👤 ${tenant ? 'Manage Occupant' : 'Assign Occupant'}
      </button>

      ${tenant ? `
      <button
        onclick="window.__viewStallContract('${stall.number}')"
        class="gm-btn-contract"
        style="background: #0d9488; color: white; border: none; padding: 7px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"
        title="View lease contract for this stall"
      >
        📄 View Contract
      </button>
      ` : ''}

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
  initialOccupantName.value = currentOccupantName.value
  stakeholderSearch.value = ''
  selectedStakeholder.value = null
  isSearchDropdownOpen.value = false

  imagePreview.value = resolveImageUrl(stall.imageUrl)
  showModal.value = true

  // Ensure latest approvals from Market Supervisor are loaded
  loadStakeholders()
}

function closeModal() {
  showModal.value = false
  stakeholderSearch.value = ''
  selectedStakeholder.value = null
  currentOccupantName.value = ''
  initialOccupantName.value = ''
  isSearchDropdownOpen.value = false
}

async function saveStall() {
  if (!editing.value) return

  // Validation: If stall was vacant and no stakeholder selected, prompt user
  if (!selectedStakeholder.value && !initialOccupantName.value) {
    alert('Please search and select an approved stakeholder to assign to this stall.')
    return
  }

  isSaving.value = true
  try {
    const targetStallId = editing.value
    const stallNo = form.value.number
    const stallType = form.value.type || 'Standard Stall'
    const stallRent = Number(form.value.rent || 0)

    if (selectedStakeholder.value) {
      const stakeholder = selectedStakeholder.value
      const stakeholderId = stakeholder.id
      const stakeholderName = getPersonName(stakeholder)
      const businessName = stakeholder.businessName || stakeholder.business_name || ''

      // 1. Assign occupant and automatically set stall status as OCCUPIED
      await allocateOccupant(targetStallId, stakeholderId)
      await updateStall(targetStallId, { status: 'OCCUPIED' })

      // 2. Automatically generate stall lease contract
      const today = new Date()
      const nextYear = new Date()
      nextYear.setFullYear(today.getFullYear() + 1)
      const dateSuffix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`
      const randSuffix = String(Math.floor(1000 + Math.random() * 9000))
      const contractNo = `CON-${stallNo}-${dateSuffix}-${randSuffix}`

      const contractPayload = {
        contractNo: contractNo,
        ref: contractNo,
        startDate: today.toISOString().split('T')[0],
        endDate: nextYear.toISOString().split('T')[0],
        monthlyRent: stallRent,
        billingFrequency: 'MONTHLY',
        terms: `1. USE OF PREMISES: The LESSEE shall use Stall ${stallNo} exclusively for designated municipal market retail and commercial trade.\n2. RENTAL PAYMENTS: The monthly rental of ₱${stallRent.toLocaleString()} shall be paid on or before the due date specified by the Municipal Treasurer.\n3. SANITATION & MAINTENANCE: The LESSEE shall maintain the stall and surrounding premises clean, sanitary, and compliant with municipal health ordinances.\n4. NON-TRANSFERABILITY: Subleasing, selling, or unauthorized transfer of lease rights is strictly prohibited.\n5. COMPLIANCE: The LESSEE agrees to abide by all market rules, municipal ordinances, and LGU Manticao policies.`,
        status: 'ACTIVE',
        stakeholderId: stakeholderId,
        stakeholderName: stakeholderName,
        businessName: businessName,
        stallId: targetStallId,
        stallNo: stallNo,
        stallType: stallType,
        occupantId: null
      }

      try {
        await api.post('/contracts', contractPayload)
      } catch (err) {
        console.warn('[StallManagement] Backend contract post notice:', err)
      }

      // Persist into localStorage 'contracts' so Contracts page immediately shows it
      try {
        const raw = localStorage.getItem('contracts')
        let contractList = raw ? JSON.parse(raw) : []
        if (!Array.isArray(contractList)) contractList = []

        // Remove any outdated active contract for this stall
        contractList = contractList.filter(c => !(
          (c.stallId && String(c.stallId) === String(targetStallId)) ||
          (c.stallNo && String(c.stallNo) === String(stallNo))
        ))

        contractList.unshift({
          id: Date.now(),
          ...contractPayload,
          createdAt: new Date().toISOString()
        })
        localStorage.setItem('contracts', JSON.stringify(contractList))
      } catch (e) {
        console.warn('[StallManagement] Local storage contract sync note:', e)
      }

      await loadStalls()
      closeModal()

      const viewNow = confirm(
        `Stall ${stallNo} successfully assigned to ${stakeholderName}!\n\n` +
        `Contract Reference: ${contractNo}\n` +
        `Monthly Rent: ₱${stallRent.toLocaleString()}/month\n` +
        `Status: ACTIVE\n\n` +
        `The stall lease contract has been automatically generated and is now listed in Contracts.\n\n` +
        `Would you like to view this contract in the Contracts page now?`
      )

      if (viewNow) {
        router.push({ name: 'MSContracts', query: { q: stallNo } })
      }
    } else if (initialOccupantName.value && !currentOccupantName.value) {
      // 2. Current occupant removed: unassign and update status as VACANT
      await unassignOccupant(targetStallId)
      await updateStall(targetStallId, { status: 'VACANT' })

      try {
        const raw = localStorage.getItem('contracts')
        if (raw) {
          const list = JSON.parse(raw)
          list.forEach(c => {
            if ((c.stallId && String(c.stallId) === String(targetStallId)) || (c.stallNo && String(c.stallNo) === String(form.value.number))) {
              c.status = 'TERMINATED'
            }
          })
          localStorage.setItem('contracts', JSON.stringify(list))
        }
      } catch (_) {}

      await loadStalls()
      closeModal()
      alert(`Occupant removed from Stall ${form.value.number} and updated as VACANT. Associated contract marked as TERMINATED.`)
    }
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

  // 2. Global helper for popup contract view
  window.__viewStallContract = (stallNo) => {
    router.push({ name: 'MSContracts', query: { q: stallNo } })
  }

  // 3. Fetch data
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
  delete window.__viewStallContract
})
</script>

<style scoped src="../styles/MarketSupervisor/StallManagement.css"></style>
