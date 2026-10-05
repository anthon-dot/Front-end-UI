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
                  class="btn-action btn-assign-row"
                  title="Assign Occupant to this Stall"
                  @click="openAssignForStall(stall)"
                >
                  👤 Assign
                </button>
                <button
                  type="button"
                  class="btn-action btn-edit"
                  title="View Stall Details, Manage Occupant & Contracts"
                  @click="editStall(stall)"
                >
                  📋 Stall Details
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

    <!-- SIDE PANEL STALL DETAILS & ASSIGNMENT MODAL -->
    <div v-if="showModal" class="gm-backdrop" @click.self="closeModal">
      <div class="gm-modal">
        <div class="gm-header">
          <h2>📋 Stall Details — Stall {{ form.number ? '#' + form.number : '' }}</h2>
          <button type="button" class="gm-close" @click="closeModal">✕</button>
        </div>

        <div class="gm-body" @click="onModalBodyClick">
          <!-- 1. Stall Info Summary Card (Read-only master data) -->
          <div class="stall-summary-card">
            <div class="summary-top">
              <span class="summary-stall-no">Stall {{ form.number }}</span>
              <span :class="['status-chip', getNormalizedStatus(form.status)]">
                {{ form.status || 'VACANT' }}
              </span>
            </div>
            <div class="summary-details">
              <div class="summary-item">
                <span class="summary-lbl">Section / Type:</span>
                <strong>{{ form.type || 'Standard Stall' }}</strong>
              </div>
              <div class="summary-item">
                <span class="summary-lbl">Monthly Rent:</span>
                <strong class="text-emerald-600">{{ formatCurrency(form.rent) }}</strong>
              </div>
              <div v-if="form.info" class="summary-item full">
                <span class="summary-lbl">Description / Notes:</span>
                <span>{{ form.info }}</span>
              </div>
            </div>
          </div>

          <!-- 2. OCCUPANT INFORMATION SECTION -->
          <div class="occupant-section">
            <div class="section-title">
              <i class="pi pi-user" style="color: #2563eb;"></i>
              <span>Occupant Information</span>
            </div>

            <!-- Current Occupant Display -->
            <div v-if="currentOccupantName" class="current-occupant-card">
              <div class="current-occupant-header">
                <span class="occupant-tag-label"><i class="pi pi-check-circle"></i> Assigned Occupant</span>
                <button type="button" class="btn-unassign" @click="vacateOccupant">
                  ✕ Remove Occupant
                </button>
              </div>
              <div class="current-occupant-name">
                <i class="pi pi-user"></i>
                {{ currentOccupantName }}
              </div>
              <div class="occupant-card-action">
                <button
                  type="button"
                  class="btn-open-assign-secondary"
                  @click="openAssignModal"
                >
                  <i class="pi pi-user-edit"></i>
                  Reassign Occupant
                </button>
              </div>
            </div>

            <!-- Vacant Display with Assign Occupant Button -->
            <div v-else class="vacant-occupant-card">
              <div class="vacant-status-info">
                <i class="pi pi-info-circle text-blue-500"></i>
                <div>
                  <strong>No Occupant Assigned</strong>
                  <p>This stall is currently vacant. You can assign an approved stakeholder to occupy it.</p>
                </div>
              </div>
              <button
                type="button"
                class="btn-open-assign-primary"
                @click="openAssignModal"
              >
                <i class="pi pi-user-plus"></i>
                Assign Occupant
              </button>
            </div>
          </div>

          <!-- 3. CONTRACT MANAGEMENT SECTION (IF OCCUPIED) -->
          <div v-if="isOccupiedStall" class="contract-section">
            <div class="section-title">
              <i class="pi pi-file-edit" style="color: #0d9488;"></i>
              <span>Stall Lease Contract</span>
            </div>

            <!-- Active Contract Display -->
            <div v-if="currentStallContract && !isCreatingContract" class="contract-active-card">
              <div class="contract-card-header">
                <div class="contract-ref-badge">
                  <i class="pi pi-file"></i>
                  <span>{{ currentStallContract.contractNo || currentStallContract.contract_no || 'Active Contract' }}</span>
                </div>
                <span class="status-chip active">ACTIVE</span>
              </div>

              <div class="contract-details-grid">
                <div class="contract-detail-item">
                  <span class="lbl">Lessee / Occupant:</span>
                  <strong>{{ currentStallContract.stakeholderName || currentOccupantName || 'Occupant' }}</strong>
                </div>
                <div class="contract-detail-item">
                  <span class="lbl">Monthly Rent:</span>
                  <strong class="text-teal-700">{{ formatCurrency(currentStallContract.monthlyRent || currentStallContract.monthly_rent || form.rent) }}</strong>
                </div>
                <div class="contract-detail-item">
                  <span class="lbl">Contract Period:</span>
                  <span>{{ formatDate(currentStallContract.startDate || currentStallContract.start_date) }} - {{ formatDate(currentStallContract.endDate || currentStallContract.end_date) }}</span>
                </div>
                <div class="contract-detail-item">
                  <span class="lbl">Billing Frequency:</span>
                  <span>{{ currentStallContract.billingFrequency || currentStallContract.billing_frequency || 'MONTHLY' }}</span>
                </div>
              </div>

              <div class="contract-card-actions">
                <button
                  type="button"
                  class="btn-contract-view"
                  title="Open Contracts Directory for this stall"
                  @click="viewContractInContracts(form.number)"
                >
                  <i class="pi pi-external-link"></i>
                  View in Contracts
                </button>
                <button
                  type="button"
                  class="btn-contract-edit"
                  title="Edit current lease contract details"
                  @click="openEditContractForm(currentStallContract)"
                >
                  <i class="pi pi-file-edit"></i>
                  Edit Contract
                </button>
                <button
                  type="button"
                  class="btn-contract-renew"
                  title="Issue a new or renewed contract for this stall"
                  @click="openRenewContractForm(currentStallContract)"
                >
                  <i class="pi pi-refresh"></i>
                  Renew Contract
                </button>
              </div>
            </div>

            <!-- No Contract Yet Notice & Create Contract Button -->
            <div v-else-if="!currentStallContract && !isCreatingContract" class="no-contract-card">
              <div class="no-contract-info">
                <i class="pi pi-info-circle"></i>
                <div>
                  <strong>No Active Contract:</strong> This stall is occupied, but no municipal contract is registered yet.
                </div>
              </div>
              <button
                type="button"
                class="btn-create-contract"
                @click="openContractForm"
              >
                <i class="pi pi-plus-circle"></i>
                📄 Create Contract
              </button>
            </div>

            <!-- Inline Contract Creation / Edit Form -->
            <div v-if="isCreatingContract" class="contract-form-card">
              <div class="contract-form-header">
                <strong>📄 {{ isEditingExistingContract ? 'Edit Lease Contract' : 'Create / Renew Lease Contract' }}</strong>
                <button type="button" class="btn-cancel-contract" @click="isCreatingContract = false">✕</button>
              </div>

              <div class="contract-form-fields">
                <label>
                  Contract Reference #
                  <input
                    v-model="contractForm.contractNo"
                    type="text"
                    placeholder="CTR-XXXX-XXXX"
                    required
                  />
                </label>

                <div class="form-row-2">
                  <label>
                    Start Date
                    <input
                      v-model="contractForm.startDate"
                      type="date"
                      required
                    />
                  </label>
                  <label>
                    End Date
                    <input
                      v-model="contractForm.endDate"
                      type="date"
                      required
                    />
                  </label>
                </div>

                <div class="form-row-2">
                  <label>
                    Monthly Rent (₱)
                    <input
                      v-model.number="contractForm.monthlyRent"
                      type="number"
                      min="0"
                      step="50"
                      required
                    />
                  </label>
                  <label>
                    Billing Frequency
                    <select v-model="contractForm.billingFrequency">
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="SEMI-ANNUALLY">Semi-Annually</option>
                      <option value="ANNUALLY">Annually</option>
                    </select>
                  </label>
                </div>

                <label>
                  Terms & Conditions
                  <textarea
                    v-model="contractForm.terms"
                    rows="4"
                    placeholder="Enter terms and conditions of lease..."
                  ></textarea>
                </label>

                <div class="contract-form-actions">
                  <button
                    type="button"
                    class="btn-secondary"
                    @click="isCreatingContract = false"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="btn-primary"
                    style="background: #0d9488;"
                    :disabled="isSavingContract"
                    @click="saveContractForStall"
                  >
                    <i class="pi pi-check" :class="{ 'pi-spin': isSavingContract }"></i>
                    {{ isSavingContract ? 'Issuing...' : 'Save & Issue Contract' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn-secondary" style="width: 100%;" @click="closeModal">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- DEDICATED ASSIGN STAKEHOLDER MODAL -->
    <div v-if="showAssignModal" class="assign-backdrop" @click.self="closeAssignModal">
      <div class="assign-dialog-card" @click="onAssignModalClick">
        <div class="assign-dialog-header">
          <div class="assign-header-title">
            <div class="assign-header-icon">
              <i class="pi pi-user-plus"></i>
            </div>
            <div>
              <h3>Assign Stakeholder to Stall</h3>
              <p>Stall {{ form.number ? '#' + form.number : '' }} &bull; {{ form.type || 'Standard Stall' }}</p>
            </div>
          </div>
          <button type="button" class="gm-close" @click="closeAssignModal">✕</button>
        </div>

        <div class="assign-dialog-body">
          <!-- Stall Quick Summary Banner -->
          <div class="assign-stall-banner">
            <div class="banner-pill">
              <span class="lbl">Stall Number</span>
              <strong>#{{ form.number }}</strong>
            </div>
            <div class="banner-pill">
              <span class="lbl">Section / Type</span>
              <strong>{{ form.type || 'Standard Stall' }}</strong>
            </div>
            <div class="banner-pill">
              <span class="lbl">Monthly Rent</span>
              <strong class="text-emerald-600">{{ formatCurrency(form.rent) }}</strong>
            </div>
          </div>

          <!-- Stakeholder Search Input -->
          <div class="assign-field-group">
            <label class="assign-input-label">
              <span>Select Approved Stakeholder</span>
              <small>Stakeholders approved by the Market Supervisor</small>
            </label>
            <div class="search-input-wrap">
              <input
                v-model="stakeholderSearch"
                type="text"
                placeholder="Search approved stakeholder by name, business, contact or stall..."
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
          </div>

          <!-- Selected Stakeholder Card (if chosen) -->
          <div v-if="selectedStakeholder" class="selected-occupant-card">
            <div class="selected-badge-row">
              <span class="selected-tag"><i class="pi pi-check-circle"></i> Ready to Assign</span>
              <span class="badge-approved">Approved Stakeholder</span>
            </div>
            <div class="selected-occupant-name">
              <i class="pi pi-user"></i> {{ getPersonName(selectedStakeholder) }}
            </div>
            <div class="selected-occupant-biz">
              <i class="pi pi-briefcase"></i> {{ selectedStakeholder.businessName || selectedStakeholder.business_name || 'Business Applicant' }}
              <span v-if="selectedStakeholder.contact || selectedStakeholder.email">&bull; {{ selectedStakeholder.contact || selectedStakeholder.email }}</span>
            </div>
            <div v-if="selectedStakeholder.selectedStall" class="selected-occupant-pref">
              <i class="pi pi-bookmark"></i> Applied for Stall {{ selectedStakeholder.selectedStall.stall_no || selectedStakeholder.selectedStall.stallNo }}
            </div>
            <button type="button" class="btn-change-selection" @click="clearSearch">
              Change Stakeholder Selection
            </button>
          </div>

          <!-- Stakeholders List to Pick From (when not selected yet) -->
          <div v-else class="assign-stakeholders-container">
            <div class="stakeholder-list-title">
              Approved Stakeholders ({{ filteredStakeholders.length }})
            </div>

            <div v-if="approvedStakeholders.length === 0" class="stakeholder-empty-notice">
              <i class="pi pi-info-circle"></i>
              <span>No approved stakeholders found. Stakeholders will appear here once approved under Applications for Approval.</span>
            </div>

            <div v-else-if="filteredStakeholders.length === 0" class="stakeholder-empty-notice">
              <i class="pi pi-search"></i>
              <span>No approved stakeholder matching "{{ stakeholderSearch }}"</span>
            </div>

            <div v-else class="stakeholders-pick-list">
              <div
                v-for="person in filteredStakeholders"
                :key="person.id"
                class="stakeholder-pick-item"
                @click="selectStakeholder(person)"
              >
                <div class="pick-item-top">
                  <span class="pick-name">{{ getPersonName(person) }}</span>
                  <span class="badge-approved">Approved</span>
                </div>
                <div v-if="person.businessName || person.business_name" class="pick-biz">
                  <i class="pi pi-briefcase"></i> {{ person.businessName || person.business_name }}
                </div>
                <div class="pick-meta">
                  <span v-if="person.contact || person.email">
                    <i class="pi pi-id-card"></i> {{ person.contact || person.email }}
                  </span>
                  <span v-if="person.selectedStall" class="pick-pref">
                    <i class="pi pi-bookmark"></i> Stall {{ person.selectedStall.stall_no || person.selectedStall.stallNo }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="assign-dialog-footer">
          <button type="button" class="btn-cancel" @click="closeAssignModal">
            Cancel
          </button>
          <button
            type="button"
            class="btn-confirm-assign"
            :disabled="!selectedStakeholder || isSaving"
            @click="confirmAssignOccupant"
          >
            <i class="pi pi-check" :class="{ 'pi-spin': isSaving }"></i>
            {{ isSaving ? 'Assigning...' : 'Confirm & Assign to Stall' }}
          </button>
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
const showAssignModal = ref(false)
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

// Contracts state in Stall Management
const existingContracts = ref([])
const isCreatingContract = ref(false)
const isEditingExistingContract = ref(false)
const editingContractId = ref(null)
const isSavingContract = ref(false)

const contractForm = ref({
  contractNo: '',
  startDate: '',
  endDate: '',
  monthlyRent: 0,
  billingFrequency: 'MONTHLY',
  terms: ''
})

const isOccupiedStall = computed(() => {
  return (
    !!currentOccupantName.value ||
    !!selectedStakeholder.value ||
    String(form.value.status).toUpperCase() === 'OCCUPIED'
  )
})

const currentStallContract = computed(() => {
  if (!form.value.number && !form.value.id) return null
  const sId = String(form.value.id)
  const sNo = String(form.value.number).trim().toLowerCase()
  return (
    (existingContracts.value || []).find((c) => {
      const matchId =
        (c.stallId && String(c.stallId) === sId) ||
        (c.stall_id && String(c.stall_id) === sId)
      const matchNo =
        (c.stallNo && String(c.stallNo).trim().toLowerCase() === sNo) ||
        (c.stall_no && String(c.stall_no).trim().toLowerCase() === sNo)
      return (matchId || matchNo) && String(c.status).toUpperCase() !== 'TERMINATED'
    }) || null
  )
})

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

function openAssignModal() {
  selectedStakeholder.value = null
  stakeholderSearch.value = ''
  isSearchDropdownOpen.value = false
  loadStakeholders()
  showAssignModal.value = true
}

function openAssignForStall(stall) {
  editStall(stall)
  openAssignModal()
}

function closeAssignModal() {
  showAssignModal.value = false
  selectedStakeholder.value = null
  stakeholderSearch.value = ''
  isSearchDropdownOpen.value = false
}

function onAssignModalClick(e) {
  if (e && e.target && !e.target.closest('.search-input-wrap') && !e.target.closest('.stakeholders-pick-list')) {
    isSearchDropdownOpen.value = false
  }
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
        title="View Stall Details, Manage Occupant & Contracts"
      >
        📋 Stall Details
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

async function loadContracts() {
  try {
    const response = await api.get('/contracts')
    if (response && response.data) {
      existingContracts.value = Array.isArray(response.data) ? response.data : []
    }
  } catch (err) {
    console.warn('[StallManagement] Failed to fetch contracts from backend:', err)
  }

  // Also read from localStorage to ensure newly issued local contracts are included
  try {
    const raw = localStorage.getItem('contracts')
    if (raw) {
      const localList = JSON.parse(raw)
      if (Array.isArray(localList)) {
        const ids = new Set(
          existingContracts.value.map((c) => String(c.id || c.contract_no || c.contractNo))
        )
        localList.forEach((c) => {
          const key = String(c.id || c.contract_no || c.contractNo)
          if (!ids.has(key)) {
            existingContracts.value.unshift(c)
          }
        })
      }
    }
  } catch (_) {}
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
  isCreatingContract.value = false

  imagePreview.value = resolveImageUrl(stall.imageUrl)
  showModal.value = true

  // Ensure latest approvals from Market Supervisor and contracts are loaded
  loadStakeholders()
  loadContracts()
}

function closeModal() {
  showModal.value = false
  stakeholderSearch.value = ''
  selectedStakeholder.value = null
  currentOccupantName.value = ''
  initialOccupantName.value = ''
  isSearchDropdownOpen.value = false
  isCreatingContract.value = false
}

function openContractForm() {
  isEditingExistingContract.value = false
  editingContractId.value = null
  const today = new Date()
  const nextYear = new Date()
  nextYear.setFullYear(today.getFullYear() + 1)
  const dateSuffix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`
  const randSuffix = String(Math.floor(1000 + Math.random() * 9000))
  const stallNo = form.value.number || '00'
  const rentVal = Number(form.value.rent || 0)

  contractForm.value = {
    contractNo: `CTR-${stallNo}-${dateSuffix}-${randSuffix}`,
    startDate: today.toISOString().split('T')[0],
    endDate: nextYear.toISOString().split('T')[0],
    monthlyRent: rentVal,
    billingFrequency: 'MONTHLY',
    terms: `1. USE OF PREMISES: The LESSEE shall use Stall ${stallNo} exclusively for designated municipal market retail and commercial trade.\n2. RENTAL PAYMENTS: The monthly rental of ₱${rentVal.toLocaleString()} shall be paid on or before the due date specified by the Municipal Treasurer.\n3. SANITATION & MAINTENANCE: The LESSEE shall maintain the stall and surrounding premises clean, sanitary, and compliant with municipal health ordinances.\n4. NON-TRANSFERABILITY: Subleasing, selling, or unauthorized transfer of lease rights is strictly prohibited.\n5. COMPLIANCE: The LESSEE agrees to abide by all market rules, municipal ordinances, and LGU policies.`
  }
  isCreatingContract.value = true
}

function openEditContractForm(contract) {
  if (!contract) return openContractForm()
  isEditingExistingContract.value = true
  editingContractId.value = contract.id || null
  contractForm.value = {
    contractNo: contract.contractNo || contract.contract_no || contract.ref || '',
    startDate: contract.startDate || contract.start_date || contract.start || '',
    endDate: contract.endDate || contract.end_date || contract.end || '',
    monthlyRent: Number(contract.monthlyRent ?? contract.monthly_rent ?? form.value.rent ?? 0),
    billingFrequency: contract.billingFrequency || contract.billing_frequency || 'MONTHLY',
    terms: contract.terms || ''
  }
  isCreatingContract.value = true
}

function openRenewContractForm(contract) {
  isEditingExistingContract.value = false
  editingContractId.value = null
  const stallNo = form.value.number || '00'
  const rentVal = Number(contract?.monthlyRent ?? contract?.monthly_rent ?? form.value.rent ?? 0)

  let startDateStr = ''
  let endDateStr = ''
  if (contract?.endDate || contract?.end_date) {
    const prevEnd = new Date(contract.endDate || contract.end_date)
    prevEnd.setDate(prevEnd.getDate() + 1)
    startDateStr = prevEnd.toISOString().split('T')[0]
    const nextEnd = new Date(prevEnd)
    nextEnd.setFullYear(nextEnd.getFullYear() + 1)
    endDateStr = nextEnd.toISOString().split('T')[0]
  } else {
    const today = new Date()
    const nextYear = new Date()
    nextYear.setFullYear(today.getFullYear() + 1)
    startDateStr = today.toISOString().split('T')[0]
    endDateStr = nextYear.toISOString().split('T')[0]
  }

  const dateSuffix = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const randSuffix = String(Math.floor(1000 + Math.random() * 9000))

  contractForm.value = {
    contractNo: `CTR-${stallNo}-${dateSuffix}-${randSuffix}`,
    startDate: startDateStr,
    endDate: endDateStr,
    monthlyRent: rentVal,
    billingFrequency: contract?.billingFrequency || contract?.billing_frequency || 'MONTHLY',
    terms: contract?.terms || ''
  }
  isCreatingContract.value = true
}

async function saveContractForStall() {
  if (!contractForm.value.contractNo || !contractForm.value.contractNo.trim()) {
    alert('Please enter a valid contract reference number.')
    return
  }
  if (!contractForm.value.startDate || !contractForm.value.endDate) {
    alert('Please select both contract start and end dates.')
    return
  }
  if (new Date(contractForm.value.endDate) <= new Date(contractForm.value.startDate)) {
    alert('Contract end date must be strictly after the start date.')
    return
  }
  if (isNaN(contractForm.value.monthlyRent) || Number(contractForm.value.monthlyRent) < 0) {
    alert('Monthly rent must be a valid non-negative amount.')
    return
  }

  isSavingContract.value = true
  try {
    const currentContract = currentStallContract.value
    const occupantName =
      currentOccupantName.value ||
      (selectedStakeholder.value ? getPersonName(selectedStakeholder.value) : (currentContract?.stakeholderName || 'Occupant'))
    const stakeholderId = selectedStakeholder.value
      ? selectedStakeholder.value.id
      : (currentContract?.stakeholderId || currentContract?.occupant?.stakeholderId || null)
    const businessName = selectedStakeholder.value
      ? (selectedStakeholder.value.businessName || selectedStakeholder.value.business_name || '')
      : (currentContract?.businessName || '')
    const occupantId = currentContract?.occupantId || currentContract?.occupant_id || (currentContract?.occupant && currentContract.occupant.id) || null

    const payload = {
      contractNo: contractForm.value.contractNo.trim(),
      ref: contractForm.value.contractNo.trim(),
      startDate: contractForm.value.startDate,
      endDate: contractForm.value.endDate,
      monthlyRent: Number(contractForm.value.monthlyRent || 0),
      billingFrequency: contractForm.value.billingFrequency || 'MONTHLY',
      terms: contractForm.value.terms,
      status: 'ACTIVE',
      stallId: form.value.id,
      stallNo: form.value.number,
      stallType: form.value.type || 'Standard Stall',
      stakeholderId: stakeholderId,
      stakeholderName: occupantName,
      businessName: businessName,
      occupantId: occupantId
    }

    let savedContract = null
    if (isEditingExistingContract.value && editingContractId.value) {
      try {
        const res = await api.put(`/contracts/${editingContractId.value}`, payload)
        savedContract = res?.data
      } catch (putErr) {
        console.warn('[StallManagement] Backend contract update warning:', putErr)
      }
    } else {
      try {
        const res = await api.post('/contracts', payload)
        savedContract = res?.data
      } catch (postErr) {
        console.warn('[StallManagement] Backend contract post notice:', postErr)
      }
    }

    // Synchronize local storage & in-memory contracts
    const contractToStore = {
      id: editingContractId.value || savedContract?.id || Date.now(),
      ...payload,
      ...(savedContract || {}),
      updatedAt: new Date().toISOString()
    }

    try {
      const raw = localStorage.getItem('contracts')
      let contractList = raw ? JSON.parse(raw) : []
      if (!Array.isArray(contractList)) contractList = []

      contractList = contractList.filter(
        (c) =>
          String(c.id) !== String(contractToStore.id) &&
          !(
            (c.stallId && String(c.stallId) === String(form.value.id)) ||
            (c.stallNo && String(c.stallNo) === String(form.value.number))
          )
      )
      contractList.unshift(contractToStore)
      localStorage.setItem('contracts', JSON.stringify(contractList))

      existingContracts.value = [
        contractToStore,
        ...existingContracts.value.filter(
          (c) =>
            String(c.id) !== String(contractToStore.id) &&
            !(
              (c.stallId && String(c.stallId) === String(form.value.id)) ||
              (c.stallNo && String(c.stallNo) === String(form.value.number))
            )
        )
      ]
    } catch (e) {
      console.warn('[StallManagement] Local storage contract sync note:', e)
    }

    isCreatingContract.value = false
    const actionLabel = isEditingExistingContract.value ? 'updated' : 'created and issued'
    alert(`Lease Contract ${payload.contractNo} has been successfully ${actionLabel} for Stall ${form.value.number}!`)
  } catch (err) {
    console.error(err)
    alert(err.message || 'Failed to create lease contract')
  } finally {
    isSavingContract.value = false
  }
}

function viewContractInContracts(stallNo) {
  closeModal()
  router.push({ name: 'MSContracts', query: { q: stallNo || form.value.number } })
}

function formatDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (_) {
    return d
  }
}

async function vacateOccupant() {
  if (!confirm(`Are you sure you want to remove occupant "${currentOccupantName.value}" from Stall ${form.value.number}? The stall will be set to VACANT.`)) {
    return
  }

  isSaving.value = true
  try {
    const targetStallId = form.value.id || editing.value
    await unassignOccupant(targetStallId)
    await updateStall(targetStallId, { status: 'VACANT' })

    try {
      const raw = localStorage.getItem('contracts')
      if (raw) {
        const list = JSON.parse(raw)
        list.forEach((c) => {
          if (
            (c.stallId && String(c.stallId) === String(targetStallId)) ||
            (c.stallNo && String(c.stallNo) === String(form.value.number))
          ) {
            c.status = 'TERMINATED'
          }
        })
        localStorage.setItem('contracts', JSON.stringify(list))
      }
    } catch (_) {}

    await loadStalls()
    await loadContracts()

    currentOccupantName.value = ''
    initialOccupantName.value = ''
    form.value.status = 'VACANT'

    alert(`Occupant removed from Stall ${form.value.number}. Stall is now VACANT.`)
  } catch (err) {
    console.error(err)
    alert(err.message || 'Failed to remove occupant')
  } finally {
    isSaving.value = false
  }
}

async function confirmAssignOccupant() {
  if (!selectedStakeholder.value) {
    alert('Please select an approved stakeholder to assign to this stall.')
    return
  }

  isSaving.value = true
  try {
    const targetStallId = form.value.id || editing.value
    const stallNo = form.value.number
    const stallType = form.value.type || 'Standard Stall'
    const stallRent = Number(form.value.rent || 0)

    const stakeholder = selectedStakeholder.value
    const stakeholderId = stakeholder.id
    const stakeholderName = getPersonName(stakeholder)
    const businessName = stakeholder.businessName || stakeholder.business_name || ''

    // 1. Assign occupant and set stall status as OCCUPIED
    await allocateOccupant(targetStallId, stakeholderId)
    await updateStall(targetStallId, { status: 'OCCUPIED' })

    // 2. Automatically generate baseline stall lease contract if none exists
    if (!currentStallContract.value) {
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

      try {
        const raw = localStorage.getItem('contracts')
        let contractList = raw ? JSON.parse(raw) : []
        if (!Array.isArray(contractList)) contractList = []

        contractList = contractList.filter(
          (c) =>
            !(
              (c.stallId && String(c.stallId) === String(targetStallId)) ||
              (c.stallNo && String(c.stallNo) === String(stallNo))
            )
        )

        contractList.unshift({
          id: Date.now(),
          ...contractPayload,
          createdAt: new Date().toISOString()
        })
        localStorage.setItem('contracts', JSON.stringify(contractList))
      } catch (e) {
        console.warn('[StallManagement] Local storage contract sync note:', e)
      }
    }

    await loadStalls()
    await loadContracts()
    currentOccupantName.value = stakeholderName
    initialOccupantName.value = stakeholderName
    form.value.status = 'OCCUPIED'

    closeAssignModal()
    alert(`Stall ${stallNo} successfully assigned to ${stakeholderName}!`)
  } catch (error) {
    console.error(error)
    alert(error.message || 'Failed to assign stakeholder')
  } finally {
    isSaving.value = false
  }
}

async function saveStall() {
  await confirmAssignOccupant()
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
  await Promise.allSettled([loadStalls(), loadStakeholders(), loadContracts()])
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
