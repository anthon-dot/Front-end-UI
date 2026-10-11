<template>
  <div class="stall-management">
    <MarketSupervisorMenu />

    <!-- HEADER & CONTROLS -->
    <header class="sm-header">
      <div class="title-wrap">
        <h1>Stall Management</h1>
        <div class="meta">Public Market of Manticao &bull; Interactive GPS Stall Map & Registry</div>
      </div>

      <div class="controls">
        <SearchField v-model="search" placeholder="Search stall #, occupant, business..." />

        <!-- Status Filter -->
        <select v-model="filterStatus" class="filter" aria-label="Filter by status">
          <option value="All">All Status ({{ stalls.length }})</option>
          <option value="VACANT">Vacant ({{ vacantCount }})</option>
          <option value="OCCUPIED">Occupied ({{ occupiedCount }})</option>
          <option value="RESERVED">Reserved ({{ reservedCount }})</option>
        </select>

        <!-- Stall Type / Section Filter -->
        <select v-model="filterType" class="filter" aria-label="Filter by section or type">
          <option value="All">All Sections ({{ stallTypes.length }})</option>
          <option v-for="t in stallTypes" :key="t" :value="t">{{ t }}</option>
        </select>

        <!-- Create Stall Button -->
        <button
          type="button"
          class="add-stall-btn"
          title="Create a new stall and place marker on map"
          @click="openCreateStallModal"
        >
          <i class="pi pi-plus"></i>
          <span>Add Stall</span>
        </button>
      </div>
    </header>

    <!-- STATS OVERVIEW CHIPS -->
    <section class="stats-overview" aria-label="Stall Occupancy Statistics">
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
      <!-- Fallback / Configuration Warning Banner if Google Maps is unavailable -->
      <div v-if="mapNotice" class="map-notice-banner">
        <i class="pi pi-info-circle text-amber-600 text-lg"></i>
        <span>{{ mapNotice }}</span>
      </div>

      <div class="map-card-header">
        <div class="map-title">
          <i class="pi pi-map-marker text-indigo-600"></i>
          <strong>Manticao Public Market Interactive Map</strong>
          <span :class="['map-provider-badge', isGoogleMapsActive ? 'provider-google' : 'provider-fallback']">
            <i :class="isGoogleMapsActive ? 'pi pi-google' : 'pi pi-map'"></i>
            {{ isGoogleMapsActive ? 'Official Google Maps JS API' : 'Authorized OpenStreetMap' }}
          </span>
          <button
            type="button"
            class="btn-switch-provider"
            :title="isGoogleMapsActive ? 'Switch to authorized OpenStreetMap tiles' : 'Attempt loading Google Maps JS API'"
            @click="toggleMapProvider"
          >
            <i class="pi pi-sync"></i>
            {{ isGoogleMapsActive ? 'Use OpenStreetMap' : 'Use Google Maps' }}
          </button>
        </div>

        <!-- Map Controls & Toolbar -->
        <div class="map-toolbar">
          <!-- Road vs Satellite Toggle -->
          <div class="map-type-toggle">
            <button
              type="button"
              class="map-toggle-btn"
              :class="{ active: mapType === 'roadmap' }"
              @click="setMapType('roadmap')"
            >
              <i class="pi pi-map"></i>
              Road
            </button>
            <button
              type="button"
              class="map-toggle-btn"
              :class="{ active: mapType === 'satellite' }"
              @click="setMapType('satellite')"
            >
              <i class="pi pi-image"></i>
              Satellite
            </button>
          </div>

          <!-- Recenter Map -->
          <button
            type="button"
            class="btn-map-ctrl"
            title="Recenter map on Manticao Public Market"
            @click="recenterMap"
          >
            <i class="pi pi-compass"></i>
            Recenter
          </button>

          <!-- Map Legend -->
          <div class="map-legend">
            <span class="legend-item"><span class="dot dot-occupied"></span> Occupied ({{ occupiedCount }})</span>
            <span class="legend-item"><span class="dot dot-vacant"></span> Vacant ({{ vacantCount }})</span>
            <span class="legend-item"><span class="dot dot-reserved"></span> Reserved ({{ reservedCount }})</span>
          </div>
        </div>
      </div>

      <!-- Map Viewport Container -->
      <div id="map" class="map-viewport"></div>

      <!-- Interactive Map-Position Picker Overlay Banner -->
      <div v-if="isPickingCoordinates" class="picker-mode-banner">
        <div class="picker-mode-info">
          <span class="picker-pulse-dot"></span>
          <div>
            <strong>📍 Positioning Stall {{ pickingStallNumber ? '#' + pickingStallNumber : '' }}: Click on the map or drag the orange pin</strong>
            <p class="text-xs text-orange-900 mt-0.5">
              Current GPS Coordinates: <strong>Lat: {{ pickerCoords?.lat ? Number(pickerCoords.lat).toFixed(6) : '—' }}, Lng: {{ pickerCoords?.lng ? Number(pickerCoords.lng).toFixed(6) : '—' }}</strong>
            </p>
          </div>
        </div>
        <div class="picker-mode-actions">
          <button type="button" class="btn-picker-cancel" @click="cancelCoordinatePicker">
            Cancel
          </button>
          <button type="button" class="btn-picker-save" @click="confirmCoordinatePicker">
            ✓ Use These Coordinates
          </button>
        </div>
      </div>
    </section>

    <!-- STALL REGISTRY TABLE -->
    <section class="table-wrap">
      <div class="table-header-bar">
        <h2>Stall Registry ({{ filteredStalls.length }})</h2>
        <span class="table-hint">
          Click 📍 Focus to locate on the map, 👤 Assign to assign an approved stakeholder, or 📋 Details to manage details & contracts
        </span>
      </div>

      <table class="stalls">
        <thead>
          <tr>
            <th>Stall</th>
            <th>Type / Section</th>
            <th>Occupant / Business</th>
            <th>Monthly Rent</th>
            <th>Status</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="stall in filteredStalls" :key="stall.id">
            <!-- Stall Badge & GPS Status -->
            <td>
              <div class="flex flex-col items-start gap-1">
                <span class="stall-badge">Stall {{ stall.number }}</span>
                <span v-if="stall.lat == null || stall.lng == null" class="badge-no-coords" title="Missing GPS coordinates">
                  <i class="pi pi-exclamation-triangle"></i>
                  No Coordinates
                </span>
              </div>
            </td>

            <!-- Section / Type -->
            <td>
              <div class="stall-type-name">{{ stall.type || 'Standard Stall' }}</div>
              <div v-if="stall.info" class="stall-info-sub text-xs text-slate-500">{{ stall.info }}</div>
            </td>

            <!-- Occupant & Business -->
            <td>
              <div v-if="getOccupantName(stall)" class="occupant-badge">
                <i class="pi pi-user occupant-icon"></i>
                <div class="flex flex-col">
                  <span class="font-bold text-slate-800">{{ getOccupantName(stall) }}</span>
                  <span v-if="getOccupantBusiness(stall)" class="text-[11px] text-slate-500">
                    <i class="pi pi-briefcase text-[10px] mr-0.5"></i>{{ getOccupantBusiness(stall) }}
                  </span>
                </div>
              </div>
              <span v-else class="text-muted text-xs italic">— Vacant —</span>
            </td>

            <!-- Rent -->
            <td>
              <span class="rent-text">{{ formatCurrency(stall.rent) }}</span>
            </td>

            <!-- Status Badge -->
            <td>
              <span :class="['status', getNormalizedStatus(stall.status)]">
                {{ stall.status }}
              </span>
            </td>

            <!-- Row Actions -->
            <td style="text-align: right;">
              <div class="actions" style="justify-content: flex-end;">
                <!-- Focus on Map (if coordinates exist) -->
                <button
                  v-if="stall.lat != null && stall.lng != null"
                  type="button"
                  class="btn-action btn-focus"
                  title="Locate Stall on Map"
                  @click="focusStallOnMap(stall)"
                >
                  📍 Focus
                </button>

                <!-- Assign Location on Map (if coordinates missing) -->
                <button
                  v-else
                  type="button"
                  class="btn-action btn-assign-coords"
                  title="Place this stall on the market map"
                  @click="startLocationPickerForStall(stall)"
                >
                  📍 Assign Location
                </button>

                <!-- Assign Stakeholder -->
                <button
                  type="button"
                  class="btn-action btn-assign-row"
                  title="Assign an approved stakeholder to this stall"
                  @click="openAssignForStall(stall)"
                >
                  👤 Assign
                </button>

                <!-- Details / Manage Modal -->
                <button
                  type="button"
                  class="btn-action btn-edit"
                  title="View Stall Details, Manage Occupant & Contracts"
                  @click="openStallDetailsModal(stall)"
                >
                  📋 Details
                </button>
              </div>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="filteredStalls.length === 0">
            <td colspan="6">
              <div class="empty-state">
                <i class="pi pi-search empty-icon text-3xl text-slate-300 mb-2 block"></i>
                <div class="text-slate-600 font-medium">No stalls matching your criteria.</div>
                <p class="text-xs text-slate-400 mt-1">Try resetting your status, section filter, or search keywords.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- CREATE / EDIT STALL DIALOG (WITH MAP-POSITION PICKER) -->
    <Dialog
      v-model:visible="showCreateEditModal"
      modal
      :header="isEditingStall ? `Edit Stall #${stallForm.number || ''}` : 'Create New Stall'"
      :style="{ width: '50vw', maxWidth: '700px' }"
      :breakpoints="{ '960px': '75vw', '641px': '95vw' }"
      class="modern-dialog"
    >
      <form @submit.prevent="submitStallForm" class="p-2">
        <div class="form-grid-2">
          <!-- Stall Number -->
          <div class="field-group">
            <label for="stallNoInput">Stall Number <span class="text-rose-500">*</span></label>
            <input
              id="stallNoInput"
              v-model="stallForm.number"
              type="text"
              placeholder="e.g. 101, B-12"
              required
            />
            <span class="field-hint">Unique identifier for this stall</span>
          </div>

          <!-- Stall Type / Section -->
          <div class="field-group">
            <label for="stallTypeInput">Type / Section <span class="text-rose-500">*</span></label>
            <input
              id="stallTypeInput"
              v-model="stallForm.type"
              type="text"
              placeholder="e.g. Standard Stall, Wet Market"
              required
            />
            <span class="field-hint">Designated retail section</span>
          </div>
        </div>

        <div class="form-grid-2">
          <!-- Monthly Rent -->
          <div class="field-group">
            <label for="monthlyRentInput">Monthly Rent (₱) <span class="text-rose-500">*</span></label>
            <input
              id="monthlyRentInput"
              v-model.number="stallForm.rent"
              type="number"
              min="0"
              step="50"
              placeholder="1500"
              required
            />
            <span class="field-hint">Official monthly rental rate</span>
          </div>

          <!-- Status -->
          <div class="field-group">
            <label for="stallStatusSelect">Stall Status</label>
            <select id="stallStatusSelect" v-model="stallForm.status">
              <option value="AVAILABLE">AVAILABLE / VACANT</option>
              <option value="OCCUPIED">OCCUPIED</option>
              <option value="RESERVED">RESERVED</option>
            </select>
            <span class="field-hint">Current rental availability</span>
          </div>
        </div>

        <!-- Description / Info -->
        <div class="field-group">
          <label for="stallInfoInput">Description / Location Notes</label>
          <textarea
            id="stallInfoInput"
            v-model="stallForm.info"
            rows="2"
            placeholder="e.g. Near West Entrance, Ground Level, Corner booth"
          ></textarea>
        </div>

        <!-- MAP-POSITION PICKER INTEGRATION -->
        <div class="field-group">
          <label>GPS Coordinates & Map Marker Placement</label>
          <div class="coords-picker-box">
            <div>
              <div class="coords-display">
                Lat: {{ stallForm.lat ? Number(stallForm.lat).toFixed(6) : 'Not assigned' }},
                Lng: {{ stallForm.lng ? Number(stallForm.lng).toFixed(6) : 'Not assigned' }}
              </div>
              <p class="text-xs text-slate-500 mt-1">
                {{ stallForm.lat ? 'Adjust position anytime by picking location on map.' : 'Pick location on the market map to place an interactive pin.' }}
              </p>
            </div>

            <button
              type="button"
              class="btn-pick-map"
              @click="launchPickerForForm"
            >
              <i class="pi pi-map-marker"></i>
              <span>Pick on Map</span>
            </button>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
          <button type="button" class="btn-cancel" @click="showCreateEditModal = false">
            Cancel
          </button>
          <button type="submit" class="btn-confirm-assign" :disabled="isSavingStall">
            <i class="pi pi-check" :class="{ 'pi-spin': isSavingStall }"></i>
            <span>{{ isSavingStall ? 'Saving...' : (isEditingStall ? 'Save Changes' : 'Create Stall') }}</span>
          </button>
        </div>
      </form>
    </Dialog>

    <!-- STALL DETAILS & CONTRACTS MODAL -->
    <div v-if="showModal" class="gm-backdrop" @click.self="closeModal">
      <div class="gm-modal">
        <div class="gm-header">
          <h2>📋 Stall Details &bull; Stall {{ form.number ? '#' + form.number : '' }}</h2>
          <button type="button" class="gm-close" @click="closeModal">✕</button>
        </div>

        <div class="gm-body">
          <!-- 1. Stall Info Summary Card -->
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
              <div class="summary-item full">
                <span class="summary-lbl">Coordinates:</span>
                <span class="font-mono text-xs text-slate-600">
                  {{ form.lat ? `${Number(form.lat).toFixed(6)}, ${Number(form.lng).toFixed(6)}` : 'No coordinates recorded' }}
                </span>
                <button
                  type="button"
                  class="text-xs text-indigo-600 font-bold ml-2 hover:underline cursor-pointer"
                  @click="startLocationPickerForFormStall"
                >
                  📍 Reposition Pin
                </button>
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
              <i class="pi pi-user text-indigo-600"></i>
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
              <div class="occupant-card-action mt-2">
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

          <!-- 3. CONTRACT INFORMATION SECTION -->
          <div v-if="isOccupiedStall" class="contract-section">
            <div class="section-title">
              <i class="pi pi-file-edit text-teal-600"></i>
              <span>Associated Lease Contract</span>
            </div>

            <!-- Active Contract Display -->
            <div v-if="currentStallContract" class="contract-active-card">
              <div class="contract-card-header">
                <div class="contract-ref-badge">
                  <i class="pi pi-file"></i>
                  <span>{{ currentStallContract.contractNo || currentStallContract.contract_no || 'Registered Contract' }}</span>
                </div>
                <span class="status-chip active">{{ currentStallContract.status || 'ACTIVE' }}</span>
              </div>

              <div class="contract-details-grid">
                <div class="contract-detail-item">
                  <span class="lbl">Lessee:</span>
                  <strong>{{ currentStallContract.stakeholderName || currentOccupantName || 'Occupant' }}</strong>
                </div>
                <div class="contract-detail-item">
                  <span class="lbl">Monthly Rent:</span>
                  <strong class="text-teal-700">{{ formatCurrency(currentStallContract.monthlyRent || form.rent) }}</strong>
                </div>
                <div class="contract-detail-item">
                  <span class="lbl">Duration:</span>
                  <span>{{ formatDate(currentStallContract.startDate) }} - {{ formatDate(currentStallContract.endDate) }}</span>
                </div>
                <div class="contract-detail-item">
                  <span class="lbl">Billing:</span>
                  <span>{{ currentStallContract.billingFrequency || 'MONTHLY' }}</span>
                </div>
              </div>

              <div class="contract-card-actions mt-3">
                <button
                  type="button"
                  class="btn-contract-view"
                  title="View this contract in Contracts directory"
                  @click="viewContractInContracts(form.number)"
                >
                  <i class="pi pi-external-link"></i>
                  View Contract Details
                </button>
              </div>
            </div>

            <!-- No Contract Yet Notice -->
            <div v-else class="no-contract-card">
              <div class="no-contract-info">
                <i class="pi pi-info-circle text-amber-500"></i>
                <div>
                  <strong>No Active Contract Recorded:</strong> This stall is occupied, but no contract is registered.
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer-actions flex justify-between gap-3 mt-6 pt-4 border-t border-slate-200">
            <button
              type="button"
              class="btn-secondary"
              @click="openEditFromDetails"
            >
              <i class="pi pi-file-edit"></i>
              Edit Stall Master Data
            </button>
            <button type="button" class="btn-secondary" @click="closeModal">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- DEDICATED ASSIGN STAKEHOLDER MODAL -->
    <div v-if="showAssignModal" class="assign-backdrop" @click.self="closeAssignModal">
      <div class="assign-dialog-card">
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
          <!-- Reassignment Warning if already occupied -->
          <div v-if="currentOccupantName" class="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-xs text-amber-800 flex items-center gap-2">
            <i class="pi pi-exclamation-triangle text-amber-600 text-base"></i>
            <span>
              <strong>Warning:</strong> This stall is currently assigned to <strong>{{ currentOccupantName }}</strong>. Confirming reassignment will replace the current occupant.
            </span>
          </div>

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
              <span>Select Eligible Approved Stakeholder</span>
              <small>Stakeholders who are approved by Market Supervisor and have advance payment verified</small>
            </label>
            <div class="search-input-wrap">
              <input
                v-model="stakeholderSearch"
                type="text"
                placeholder="Search approved stakeholder by name, business, contact..."
              />
              <button
                v-if="stakeholderSearch"
                type="button"
                class="btn-clear-search"
                title="Clear search"
                @click="clearStakeholderSearch"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Selected Stakeholder Card -->
          <div v-if="selectedStakeholder" class="selected-occupant-card">
            <div class="selected-badge-row">
              <span class="selected-tag"><i class="pi pi-check-circle"></i> Eligible & Approved</span>
              <span class="badge-approved">Advance Paid</span>
            </div>
            <div class="selected-occupant-name">
              <i class="pi pi-user"></i> {{ getPersonName(selectedStakeholder) }}
            </div>
            <div class="selected-occupant-biz">
              <i class="pi pi-briefcase"></i> {{ selectedStakeholder.businessName || 'Business Applicant' }}
              <span v-if="selectedStakeholder.contact">&bull; {{ selectedStakeholder.contact }}</span>
            </div>
            <button type="button" class="btn-change-selection" @click="clearStakeholderSearch">
              Change Selection
            </button>
          </div>

          <!-- Stakeholders Selection List -->
          <div v-else class="assign-stakeholders-container">
            <div class="stakeholder-list-title">
              Eligible Approved Stakeholders ({{ filteredEligibleStakeholders.length }})
            </div>

            <div v-if="eligibleStakeholders.length === 0" class="stakeholder-empty-notice">
              <i class="pi pi-info-circle text-amber-500"></i>
              <span>No eligible approved stakeholders found. Stakeholders become eligible once advance payment is paid and approved by the Market Supervisor.</span>
            </div>

            <div v-else-if="filteredEligibleStakeholders.length === 0" class="stakeholder-empty-notice">
              <i class="pi pi-search"></i>
              <span>No approved stakeholder matching "{{ stakeholderSearch }}"</span>
            </div>

            <div v-else class="stakeholders-pick-list">
              <div
                v-for="person in filteredEligibleStakeholders"
                :key="person.id"
                class="stakeholder-pick-item"
                @click="selectStakeholder(person)"
              >
                <div class="pick-item-top">
                  <span class="pick-name">{{ getPersonName(person) }}</span>
                  <span class="badge-approved">Eligible</span>
                </div>
                <div v-if="person.businessName" class="pick-biz">
                  <i class="pi pi-briefcase"></i> {{ person.businessName }}
                </div>
                <div class="pick-meta">
                  <span v-if="person.contact">
                    <i class="pi pi-id-card"></i> {{ person.contact }}
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
            <span>{{ isSaving ? 'Assigning...' : 'Confirm & Assign to Stall' }}</span>
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
import Dialog from 'primevue/dialog'
import { API_ORIGIN } from '../config/apiConfig'
import api from '../services/api'
import {
  fetchStalls,
  createStall,
  updateStall,
  allocateOccupant,
  unassignOccupant
} from '../services/stallService'

const router = useRouter()

// Default Manticao Public Market Center
const DEFAULT_CENTER = { lat: 8.399991, lng: 124.291353 }
const DEFAULT_MAP_ZOOM = 18
const MIN_MAP_ZOOM = 14

// State
const search = ref('')
const filterStatus = ref('All')
const filterType = ref('All')
const stalls = ref([])
const stakeholders = ref([])
const contracts = ref([])

// Modals
const showModal = ref(false)
const showAssignModal = ref(false)
const showCreateEditModal = ref(false)
const isEditingStall = ref(false)
const isSaving = ref(false)
const isSavingStall = ref(false)

// Occupant selection
const stakeholderSearch = ref('')
const selectedStakeholder = ref(null)
const currentOccupantName = ref('')
const initialOccupantName = ref('')

// Interactive Map Position Picker State
const isPickingCoordinates = ref(false)
const pickingStallNumber = ref('')
const pickerCoords = ref({ lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng })
let pickerTargetCallback = null

// Form State for Create / Edit
const stallForm = ref({
  id: null,
  number: '',
  type: 'Standard Stall',
  rent: 1500,
  status: 'AVAILABLE',
  info: '',
  lat: DEFAULT_CENTER.lat,
  lng: DEFAULT_CENTER.lng,
  imageUrl: ''
})

// Details Modal Read-Only State
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

// Map Engine State
const mapType = ref('roadmap') // 'roadmap' | 'satellite'
const isGoogleMapsActive = ref(false)
const mapNotice = ref('')
let googleMapsAuthFailed = false
let googleMap = null
let googleMarkers = []
let googlePickerMarker = null
let googleInfoWindow = null

// Leaflet fallback instances
let leafletMap = null
let leafletMarkers = []
let leafletPickerMarker = null
let leafletTileLayer = null

function toggleMapProvider() {
  if (isGoogleMapsActive.value) {
    initLeafletFallback('Operating with authorized OpenStreetMap standard tiles.')
  } else {
    googleMapsAuthFailed = false
    loadGoogleMapsApi()
  }
}

/**
 * Loads the official Google Maps JavaScript API via dynamic script injection.
 * If key is missing or load fails, falls back gracefully to Leaflet OpenStreetMap.
 */
function loadGoogleMapsApi() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY' || googleMapsAuthFailed) {
    initLeafletFallback('Notice: Google Maps API key is unavailable or unauthorized. Operating with authorized OpenStreetMap standard tiles.')
    return
  }

  // Define error handler for auth failure
  window.gm_authFailure = () => {
    console.warn('[Google Maps] Authentication failure: invalid API key, restrictions, or quota exceeded.')
    googleMapsAuthFailed = true
    initLeafletFallback('Notice: Google Maps API key is not authorized for Maps JavaScript API. Operating with authorized OpenStreetMap standard tiles.')
  }

  if (window.google && window.google.maps) {
    initGoogleMap()
    return
  }

  const existingScript = document.getElementById('google-maps-script')
  if (existingScript) {
    existingScript.addEventListener('load', () => initGoogleMap())
    existingScript.addEventListener('error', () => {
      initLeafletFallback('Notice: Failed to load Google Maps script. Operating with authorized OpenStreetMap standard tiles.')
    })
    return
  }

  const script = document.createElement('script')
  script.id = 'google-maps-script'
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=weekly`
  script.async = true
  script.defer = true
  script.onload = () => {
    initGoogleMap()
  }
  script.onerror = () => {
    console.warn('[Google Maps] Script network error. Falling back to OpenStreetMap.')
    initLeafletFallback('Notice: Google Maps API unavailable. Operating with authorized OpenStreetMap standard tiles.')
  }
  document.head.appendChild(script)
}

function initGoogleMap() {
  if (googleMapsAuthFailed) {
    initLeafletFallback('Notice: Operating with authorized OpenStreetMap standard tiles.')
    return
  }

  const container = document.getElementById('map')
  if (!container || !window.google || !window.google.maps) {
    initLeafletFallback('Notice: Google Maps library unavailable. Operating with authorized OpenStreetMap standard tiles.')
    return
  }

  try {
    // If a leaflet map was present, clean it up first
    if (leafletMap) {
      try { leafletMap.remove() } catch (_) {}
      leafletMap = null
    }
    container.innerHTML = ''
    delete container._leaflet_id

    googleMap = new window.google.maps.Map(container, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      minZoom: MIN_MAP_ZOOM,
      maxZoom: 21,
      mapTypeId: mapType.value === 'satellite' ? window.google.maps.MapTypeId.HYBRID : window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true
    })

    googleInfoWindow = new window.google.maps.InfoWindow()

    // Map click listener for coordinate picking
    googleMap.addListener('click', (e) => {
      if (isPickingCoordinates.value && e.latLng) {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        updatePickerPosition(lat, lng)
      }
    })

    isGoogleMapsActive.value = true
    mapNotice.value = ''
    renderMarkers()
  } catch (err) {
    console.warn('[Google Maps] Initialization error, falling back to Leaflet:', err)
    initLeafletFallback('Notice: Google Maps error. Operating with authorized OpenStreetMap standard tiles.')
  }
}

function initLeafletFallback(reasonMessage = '') {
  isGoogleMapsActive.value = false
  if (reasonMessage) {
    mapNotice.value = reasonMessage
  }

  // 1. Clean up Google Map markers & state
  if (googleMarkers.length) {
    googleMarkers.forEach((m) => {
      try { m.setMap(null) } catch (_) {}
    })
    googleMarkers = []
  }
  if (googlePickerMarker) {
    try { googlePickerMarker.setMap(null) } catch (_) {}
    googlePickerMarker = null
  }
  googleMap = null

  // 2. Remove existing Leaflet map if present
  if (leafletMap) {
    try {
      leafletMap.remove()
    } catch (_) {}
    leafletMap = null
  }

  const container = document.getElementById('map')
  if (!container) return

  // 3. Clear container DOM to erase any Google Maps error overlays or elements
  container.innerHTML = ''
  delete container._leaflet_id

  // Remove any detached Google error alerts
  try {
    document.querySelectorAll('.gm-err-container, .gm-err-autocomplete').forEach((el) => el.remove())
  } catch (_) {}

  try {
    leafletMap = L.map('map', {
      center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      zoom: DEFAULT_MAP_ZOOM,
      minZoom: MIN_MAP_ZOOM,
      maxZoom: 19,
      zoomControl: true
    })

    // Attach tile layer based on active mapType
    if (mapType.value === 'satellite') {
      leafletTileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA', maxZoom: 19 }
      ).addTo(leafletMap)
    } else {
      leafletTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMap)
    }

    leafletMap.on('click', (e) => {
      if (isPickingCoordinates.value && e.latlng) {
        updatePickerPosition(e.latlng.lat, e.latlng.lng)
      }
    })

    renderMarkers()

    // Recalculate dimensions to avoid gray/unrendered tiles
    setTimeout(() => {
      if (leafletMap) {
        leafletMap.invalidateSize()
      }
    }, 200)
  } catch (err) {
    console.error('[Leaflet Fallback] Map init failed:', err)
  }
}

function setMapType(type) {
  mapType.value = type
  if (isGoogleMapsActive.value && googleMap && window.google) {
    const targetType = type === 'satellite' ? window.google.maps.MapTypeId.HYBRID : window.google.maps.MapTypeId.ROADMAP
    googleMap.setMapTypeId(targetType)
  } else if (leafletMap) {
    if (leafletTileLayer) leafletMap.removeLayer(leafletTileLayer)
    if (type === 'satellite') {
      // Authorized Esri World Imagery
      leafletTileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community', maxZoom: 19 }
      ).addTo(leafletMap)
    } else {
      leafletTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(leafletMap)
    }
  }
}

function recenterMap() {
  if (isGoogleMapsActive.value && googleMap) {
    googleMap.panTo(DEFAULT_CENTER)
    googleMap.setZoom(DEFAULT_MAP_ZOOM)
  } else if (leafletMap) {
    leafletMap.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_MAP_ZOOM)
  }
}

// ===================================
// MARKER RENDERING & DETAILS HOOKS
// ===================================
function clearAllMarkers() {
  if (googleMarkers.length) {
    googleMarkers.forEach((m) => m.setMap(null))
    googleMarkers = []
  }
  if (leafletMarkers.length && leafletMap) {
    leafletMarkers.forEach((m) => leafletMap.removeLayer(m))
    leafletMarkers = []
  }
}

function renderMarkers() {
  clearAllMarkers()

  const validStalls = stalls.value.filter((s) => s.lat != null && s.lng != null && !isNaN(Number(s.lat)) && !isNaN(Number(s.lng)))

  if (isGoogleMapsActive.value && googleMap && window.google) {
    validStalls.forEach((stall) => {
      const norm = getNormalizedStatus(stall.status)
      const iconUrl = norm === 'occupied' ? '/icons/stall-pin-green.svg' : norm === 'reserved' ? '/icons/stall-pin-yellow.svg' : '/icons/stall-pin-blue.svg'

      const marker = new window.google.maps.Marker({
        position: { lat: Number(stall.lat), lng: Number(stall.lng) },
        map: googleMap,
        title: `Stall ${stall.number}`,
        icon: {
          url: iconUrl,
          scaledSize: new window.google.maps.Size(42, 42),
          origin: new window.google.maps.Point(0, 0),
          anchor: new window.google.maps.Point(21, 40)
        }
      })

      marker.addListener('click', () => {
        openStallDetailsModal(stall)
      })

      marker.stallId = stall.id
      googleMarkers.push(marker)
    })
  } else if (leafletMap) {
    validStalls.forEach((stall) => {
      const norm = getNormalizedStatus(stall.status)
      const iconUrl = norm === 'occupied' ? '/icons/stall-pin-green.svg' : norm === 'reserved' ? '/icons/stall-pin-yellow.svg' : '/icons/stall-pin-blue.svg'

      const customIcon = L.icon({
        iconUrl,
        iconSize: [42, 42],
        iconAnchor: [21, 40],
        popupAnchor: [0, -36]
      })

      const marker = L.marker([Number(stall.lat), Number(stall.lng)], {
        icon: customIcon,
        title: `Stall ${stall.number}`
      }).addTo(leafletMap)

      marker.on('click', () => {
        openStallDetailsModal(stall)
      })

      marker.stallId = stall.id
      leafletMarkers.push(marker)
    })
  }
}

function focusStallOnMap(stall) {
  if (stall.lat == null || stall.lng == null) {
    alert(`Stall ${stall.number} does not have GPS coordinates assigned.`)
    return
  }

  const lat = Number(stall.lat)
  const lng = Number(stall.lng)

  if (isGoogleMapsActive.value && googleMap) {
    googleMap.panTo({ lat, lng })
    googleMap.setZoom(19)
  } else if (leafletMap) {
    leafletMap.setView([lat, lng], 19)
  }

  const mapElem = document.getElementById('map')
  if (mapElem) {
    mapElem.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// ===================================
// INTERACTIVE POSITION PICKER
// ===================================
function updatePickerPosition(lat, lng) {
  pickerCoords.value = { lat, lng }

  if (isGoogleMapsActive.value && googleMap && window.google) {
    if (!googlePickerMarker) {
      googlePickerMarker = new window.google.maps.Marker({
        position: { lat, lng },
        map: googleMap,
        draggable: true,
        title: 'Adjust stall location',
        icon: {
          url: '/icons/stall-pin-orange.svg',
          scaledSize: new window.google.maps.Size(46, 46),
          origin: new window.google.maps.Point(0, 0),
          anchor: new window.google.maps.Point(23, 44)
        }
      })

      googlePickerMarker.addListener('dragend', (e) => {
        if (e.latLng) {
          pickerCoords.value = { lat: e.latLng.lat(), lng: e.latLng.lng() }
        }
      })
    } else {
      googlePickerMarker.setPosition({ lat, lng })
    }
  } else if (leafletMap) {
    if (!leafletPickerMarker) {
      const pickerIcon = L.icon({
        iconUrl: '/icons/stall-pin-orange.svg',
        iconSize: [46, 46],
        iconAnchor: [23, 44]
      })

      leafletPickerMarker = L.marker([lat, lng], {
        icon: pickerIcon,
        draggable: true
      }).addTo(leafletMap)

      leafletPickerMarker.on('dragend', (e) => {
        const pos = e.target.getLatLng()
        pickerCoords.value = { lat: pos.lat, lng: pos.lng }
      })
    } else {
      leafletPickerMarker.setLatLng([lat, lng])
    }
  }
}

function clearPickerMarker() {
  if (googlePickerMarker) {
    googlePickerMarker.setMap(null)
    googlePickerMarker = null
  }
  if (leafletPickerMarker && leafletMap) {
    leafletMap.removeLayer(leafletPickerMarker)
    leafletPickerMarker = null
  }
}

function startLocationPickerForStall(stall) {
  pickingStallNumber.value = stall.number
  const initialLat = stall.lat ? Number(stall.lat) : DEFAULT_CENTER.lat
  const initialLng = stall.lng ? Number(stall.lng) : DEFAULT_CENTER.lng

  isPickingCoordinates.value = true
  updatePickerPosition(initialLat, initialLng)

  pickerTargetCallback = async (coords) => {
    try {
      await updateStall(stall.id, { latitude: coords.lat, longitude: coords.lng })
      await loadStalls()
      renderMarkers()
      alert(`GPS location for Stall ${stall.number} saved successfully!`)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to update stall location')
    }
  }

  const mapElem = document.getElementById('map')
  if (mapElem) mapElem.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function launchPickerForForm() {
  showCreateEditModal.value = false
  pickingStallNumber.value = stallForm.value.number || 'New'
  const initialLat = stallForm.value.lat ? Number(stallForm.value.lat) : DEFAULT_CENTER.lat
  const initialLng = stallForm.value.lng ? Number(stallForm.value.lng) : DEFAULT_CENTER.lng

  isPickingCoordinates.value = true
  updatePickerPosition(initialLat, initialLng)

  pickerTargetCallback = (coords) => {
    stallForm.value.lat = coords.lat
    stallForm.value.lng = coords.lng
    showCreateEditModal.value = true
  }

  const mapElem = document.getElementById('map')
  if (mapElem) mapElem.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function startLocationPickerForFormStall() {
  closeModal()
  pickingStallNumber.value = form.value.number
  const initialLat = form.value.lat ? Number(form.value.lat) : DEFAULT_CENTER.lat
  const initialLng = form.value.lng ? Number(form.value.lng) : DEFAULT_CENTER.lng

  isPickingCoordinates.value = true
  updatePickerPosition(initialLat, initialLng)

  pickerTargetCallback = async (coords) => {
    try {
      await updateStall(form.value.id, { latitude: coords.lat, longitude: coords.lng })
      await loadStalls()
      renderMarkers()
      alert(`Stall ${form.value.number} relocated successfully!`)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to relocate stall')
    }
  }

  const mapElem = document.getElementById('map')
  if (mapElem) mapElem.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function confirmCoordinatePicker() {
  isPickingCoordinates.value = false
  clearPickerMarker()
  if (pickerTargetCallback) {
    pickerTargetCallback({ ...pickerCoords.value })
    pickerTargetCallback = null
  }
}

function cancelCoordinatePicker() {
  isPickingCoordinates.value = false
  clearPickerMarker()
  pickerTargetCallback = null
}

// ===================================
// CREATE & EDIT STALL ACTIONS
// ===================================
function openCreateStallModal() {
  isEditingStall.value = false
  stallForm.value = {
    id: null,
    number: '',
    type: 'Standard Stall',
    rent: 1500,
    status: 'AVAILABLE',
    info: '',
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
    imageUrl: ''
  }
  showCreateEditModal.value = true
}

function openEditFromDetails() {
  isEditingStall.value = true
  stallForm.value = {
    id: form.value.id,
    number: form.value.number,
    type: form.value.type || 'Standard Stall',
    rent: Number(form.value.rent || 0),
    status: form.value.status || 'AVAILABLE',
    info: form.value.info || '',
    lat: form.value.lat ?? DEFAULT_CENTER.lat,
    lng: form.value.lng ?? DEFAULT_CENTER.lng,
    imageUrl: form.value.imageUrl || ''
  }
  closeModal()
  showCreateEditModal.value = true
}

async function submitStallForm() {
  const num = String(stallForm.value.number || '').trim()
  if (!num) {
    alert('Please enter a stall number.')
    return
  }

  // Duplicate stall check
  const duplicate = stalls.value.find(
    (s) => String(s.number).trim().toLowerCase() === num.toLowerCase() && s.id !== stallForm.value.id
  )
  if (duplicate) {
    alert(`A stall with number "${num}" already exists. Please choose a unique stall number.`)
    return
  }

  isSavingStall.value = true
  try {
    const payload = {
      stallNo: num,
      stallType: stallForm.value.type || 'Standard Stall',
      monthlyRent: Number(stallForm.value.rent || 0),
      status: stallForm.value.status || 'AVAILABLE',
      info: stallForm.value.info || '',
      latitude: stallForm.value.lat,
      longitude: stallForm.value.lng,
      imageUrl: stallForm.value.imageUrl || null
    }

    if (isEditingStall.value && stallForm.value.id) {
      await updateStall(stallForm.value.id, payload)
      alert(`Stall #${num} updated successfully!`)
    } else {
      await createStall(payload)
      alert(`Stall #${num} created successfully!`)
    }

    showCreateEditModal.value = false
    await loadStalls()
    renderMarkers()
  } catch (err) {
    console.error(err)
    alert(err.message || 'Failed to save stall')
  } finally {
    isSavingStall.value = false
  }
}

// ===================================
// STALL DETAILS & ALLOCATION
// ===================================
function openStallDetailsModal(stall) {
  form.value = {
    id: stall.id,
    number: stall.number,
    type: stall.type || 'Standard Stall',
    info: stall.info || '',
    rent: Number(stall.rent || 0),
    status: stall.status || 'VACANT',
    lat: stall.lat,
    lng: stall.lng,
    imageUrl: stall.imageUrl || ''
  }

  const occupant = getOccupantName(stall)
  currentOccupantName.value = occupant
  initialOccupantName.value = occupant

  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function openAssignForStall(stall) {
  openStallDetailsModal(stall)
  openAssignModal()
}

function openAssignModal() {
  selectedStakeholder.value = null
  stakeholderSearch.value = ''
  loadStakeholders()
  showAssignModal.value = true
}

function closeAssignModal() {
  showAssignModal.value = false
  selectedStakeholder.value = null
  stakeholderSearch.value = ''
}

function clearStakeholderSearch() {
  selectedStakeholder.value = null
  stakeholderSearch.value = ''
}

function selectStakeholder(person) {
  selectedStakeholder.value = person
  stakeholderSearch.value = getPersonName(person)
}

async function confirmAssignOccupant() {
  if (!selectedStakeholder.value) {
    alert('Please select an eligible approved stakeholder to assign.')
    return
  }

  isSaving.value = true
  try {
    const targetStallId = form.value.id
    const stakeholder = selectedStakeholder.value
    const stakeholderName = getPersonName(stakeholder)

    await allocateOccupant(targetStallId, stakeholder.id)

    await loadStalls()
    await loadContracts()
    renderMarkers()

    currentOccupantName.value = stakeholderName
    initialOccupantName.value = stakeholderName
    form.value.status = 'OCCUPIED'

    closeAssignModal()
    alert(`Stall ${form.value.number} successfully assigned to ${stakeholderName}!`)
  } catch (err) {
    console.error(err)
    alert(err.message || 'Failed to assign occupant to stall')
  } finally {
    isSaving.value = false
  }
}

async function vacateOccupant() {
  if (!confirm(`Are you sure you want to remove occupant "${currentOccupantName.value}" from Stall ${form.value.number}? The stall will be set to VACANT.`)) {
    return
  }

  isSaving.value = true
  try {
    const targetStallId = form.value.id
    await unassignOccupant(targetStallId)

    await loadStalls()
    await loadContracts()
    renderMarkers()

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

function viewContractInContracts(stallNo) {
  closeModal()
  router.push({ name: 'MSContracts', query: { q: stallNo || form.value.number } })
}

// ===================================
// DATA LOADERS & COMPUTEDS
// ===================================
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
      lat: stall.latitude ?? stall.lat ?? null,
      lng: stall.longitude ?? stall.lng ?? null,
      imageUrl: stall.image_url || stall.imageUrl || '',
      occupant: stall.occupant
    }))
  } catch (err) {
    console.error('[StallManagement] Load stalls error:', err)
  }
}

async function loadStakeholders() {
  try {
    const res = await api.get('/stakeholders')
    stakeholders.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error('[StallManagement] Load stakeholders error:', err)
  }
}

async function loadContracts() {
  try {
    const res = await api.get('/contracts')
    contracts.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error('[StallManagement] Load contracts error:', err)
  }
}

// Helper functions
function getOccupantName(stall) {
  if (!stall || !stall.occupant) return ''
  const occ = Array.isArray(stall.occupant) ? stall.occupant[0] : stall.occupant
  if (!occ) return ''
  const sh = occ.stakeholder
  if (sh) return `${sh.firstName || sh.first_name || ''} ${sh.lastName || sh.last_name || ''}`.trim()
  return occ.name || ''
}

function getOccupantBusiness(stall) {
  if (!stall || !stall.occupant) return ''
  const occ = Array.isArray(stall.occupant) ? stall.occupant[0] : stall.occupant
  if (!occ) return ''
  const sh = occ.stakeholder
  if (sh) return sh.businessName || sh.business_name || ''
  return ''
}

function getPersonName(person) {
  if (!person) return ''
  const first = person.firstName || person.first_name || ''
  const last = person.lastName || person.last_name || ''
  return `${first} ${last}`.trim() || 'Unknown Stakeholder'
}

function getNormalizedStatus(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'OCCUPIED') return 'occupied'
  if (s === 'RESERVED') return 'reserved'
  return 'vacant'
}

function formatCurrency(val) {
  return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch (_) {
    return d
  }
}

// Eligibility Rule: Market supervisor approved + advance payment paid
const eligibleStakeholders = computed(() => {
  return (stakeholders.value || []).filter((s) => {
    const isApproved =
      s.marketSupervisorApproved === true ||
      s.market_supervisor_approved === true ||
      String(s.marketApprovalStatus || s.market_approval_status || '').toUpperCase() === 'APPROVED'

    const hasPaid =
      s.advancePaymentPaid === true ||
      s.advance_payment_paid === true ||
      s.advancePaymentCompleted === true ||
      s.advance_payment_completed === true

    return isApproved && hasPaid
  })
})

const filteredEligibleStakeholders = computed(() => {
  const list = eligibleStakeholders.value
  const q = stakeholderSearch.value.trim().toLowerCase()
  if (!q) return list
  return list.filter((s) => {
    const name = getPersonName(s).toLowerCase()
    const biz = String(s.businessName || s.business_name || '').toLowerCase()
    const contact = String(s.contact || '').toLowerCase()
    return name.includes(q) || biz.includes(q) || contact.includes(q)
  })
})

const stallTypes = computed(() => {
  const set = new Set()
  stalls.value.forEach((s) => {
    if (s.type) set.add(s.type)
  })
  return Array.from(set)
})

const occupiedCount = computed(() => stalls.value.filter((s) => String(s.status).toUpperCase() === 'OCCUPIED').length)
const vacantCount = computed(() => stalls.value.filter((s) => {
  const st = String(s.status).toUpperCase()
  return st === 'VACANT' || st === 'AVAILABLE'
}).length)
const reservedCount = computed(() => stalls.value.filter((s) => String(s.status).toUpperCase() === 'RESERVED').length)
const occupancyRate = computed(() => stalls.value.length ? Math.round((occupiedCount.value / stalls.value.length) * 100) : 0)

const filteredStalls = computed(() => {
  return stalls.value.filter((stall) => {
    const stallNo = String(stall.number || '').toLowerCase()
    const stallType = String(stall.type || '').toLowerCase()
    const occupant = String(getOccupantName(stall) || '').toLowerCase()
    const business = String(getOccupantBusiness(stall) || '').toLowerCase()
    const q = search.value.trim().toLowerCase()

    const matchesSearch = !q || stallNo.includes(q) || stallType.includes(q) || occupant.includes(q) || business.includes(q)

    const normStatus = getNormalizedStatus(stall.status).toUpperCase()
    const filterNorm = getNormalizedStatus(filterStatus.value).toUpperCase()

    const matchesStatus =
      filterStatus.value === 'All' ||
      normStatus === filterNorm ||
      String(stall.status).toUpperCase() === filterStatus.value

    const matchesType = filterType.value === 'All' || stall.type === filterType.value

    return matchesSearch && matchesStatus && matchesType
  })
})

const isOccupiedStall = computed(() => {
  return !!currentOccupantName.value || String(form.value.status).toUpperCase() === 'OCCUPIED'
})

const currentStallContract = computed(() => {
  if (!form.value.number && !form.value.id) return null
  const sId = String(form.value.id)
  const sNo = String(form.value.number).trim().toLowerCase()
  return (
    (contracts.value || []).find((c) => {
      const matchId = (c.stallId && String(c.stallId) === sId) || (c.stall_id && String(c.stall_id) === sId)
      const matchNo =
        (c.stallNo && String(c.stallNo).trim().toLowerCase() === sNo) ||
        (c.stall_no && String(c.stall_no).trim().toLowerCase() === sNo)
      return (matchId || matchNo) && String(c.status).toUpperCase() !== 'TERMINATED'
    }) || null
  )
})

// ===================================
// LIFECYCLE HOOKS
// ===================================
onMounted(async () => {
  await Promise.all([loadStalls(), loadStakeholders(), loadContracts()])
  loadGoogleMapsApi()
})

onBeforeUnmount(() => {
  clearAllMarkers()
  clearPickerMarker()
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }
})
</script>

<style scoped src="../styles/MarketSupervisor/StallManagement.css"></style>
