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
          <option value="All">All Active ({{ activeStallsCount }})</option>
          <option value="VACANT">Vacant ({{ vacantCount }})</option>
          <option value="OCCUPIED">Occupied ({{ occupiedCount }})</option>
          <option value="UNAVAILABLE">Unavailable ({{ unavailableCount }})</option>
          <option value="ARCHIVED">Archived ({{ archivedCount }})</option>
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
        <div class="stat-icon vacant-icon">
          <i class="pi pi-inbox"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Vacant</span>
          <span class="stat-value">{{ vacantCount }}</span>
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
        <div class="stat-icon unavailable-icon">
          <i class="pi pi-ban"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Unavailable</span>
          <span class="stat-value">{{ unavailableCount }}</span>
        </div>
      </div>
    </section>

    <!-- MAP CONTAINER -->
    <section class="map-card modern-map-card">
      <div class="map-card-header">
        <div class="map-title-wrap">
          <div class="map-title-icon">
            <i class="pi pi-map"></i>
          </div>
          <div>
            <div class="map-title-heading">
              <strong>Manticao Public Market GPS Map</strong>
              <span class="modern-live-badge">
                <span class="live-pulse-dot"></span>
                Interactive GPS
              </span>
            </div>
            <div class="map-title-sub">
              Live market stall layout &bull; Select a pin to inspect stall details or assign occupants
            </div>
          </div>
        </div>

        <!-- Map Controls & Toolbar -->
        <div class="map-toolbar">
          <!-- Road vs Satellite Toggle -->
          <div class="modern-segmented-control">
            <button
              type="button"
              class="seg-btn"
              :class="{ active: mapType === 'roadmap' }"
              @click="setMapType('roadmap')"
            >
              <i class="pi pi-map"></i>
              <span>Street</span>
            </button>
            <button
              type="button"
              class="seg-btn"
              :class="{ active: mapType === 'satellite' }"
              @click="setMapType('satellite')"
            >
              <i class="pi pi-image"></i>
              <span>Satellite</span>
            </button>
          </div>

          <!-- Recenter Map -->
          <button
            type="button"
            class="btn-modern-recenter"
            title="Recenter map on Manticao Public Market"
            @click="recenterMap"
          >
            <i class="pi pi-compass"></i>
            <span>Recenter</span>
          </button>
        </div>
      </div>

      <!-- Map Viewport Container -->
      <div class="map-viewport-wrapper">
        <div id="map" class="map-viewport"></div>

        <!-- Floating Legend Chips Overlay -->
        <div class="map-floating-legend">
          <div class="legend-chip chip-vacant" title="Vacant / Available Stalls (Green)">
            <span class="chip-dot dot-vacant"></span>
            <span class="chip-text">Vacant</span>
            <span class="chip-count">{{ vacantCount }}</span>
          </div>
          <div class="legend-chip chip-occupied" title="Occupied Stalls (Blue)">
            <span class="chip-dot dot-occupied"></span>
            <span class="chip-text">Occupied</span>
            <span class="chip-count">{{ occupiedCount }}</span>
          </div>
          <div class="legend-chip chip-unavailable" title="Unavailable Stalls (Orange)">
            <span class="chip-dot dot-unavailable"></span>
            <span class="chip-text">Unavailable</span>
            <span class="chip-count">{{ unavailableCount }}</span>
          </div>
        </div>
      </div>

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
                {{ getStatusLabel(stall.status) }}
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

                <!-- Archive / Restore Stall -->
                <button
                  v-if="String(stall.status).toUpperCase() !== 'ARCHIVED'"
                  type="button"
                  class="btn-action btn-archive"
                  title="Archive this stall (moves to Archive Records)"
                  @click="archiveStallAction(stall)"
                >
                  <i class="pi pi-inbox"></i>
                  Archive
                </button>
                <button
                  v-else
                  type="button"
                  class="btn-action btn-restore"
                  title="Restore this stall to active registry"
                  @click="restoreStallAction(stall)"
                >
                  <i class="pi pi-replay"></i>
                  Restore
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
              <option value="UNAVAILABLE">UNAVAILABLE</option>
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
                {{ getStatusLabel(form.status) }}
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

          <div class="modal-footer-actions flex justify-between items-center gap-3 mt-6 pt-4 border-t border-slate-200">
            <div class="flex gap-2">
              <button
                type="button"
                class="btn-secondary"
                @click="openEditFromDetails"
              >
                <i class="pi pi-file-edit"></i>
                Edit Master Data
              </button>
              <button
                v-if="String(form.status).toUpperCase() !== 'ARCHIVED'"
                type="button"
                class="btn-archive-danger"
                style="padding: 7px 14px; border-radius: 9px; background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; font-weight: 700; font-size: 13px; cursor: pointer;"
                @click="archiveCurrentStall"
              >
                <i class="pi pi-inbox"></i>
                Archive Stall
              </button>
              <button
                v-else
                type="button"
                class="btn-restore-success"
                style="padding: 7px 14px; border-radius: 9px; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; font-weight: 700; font-size: 13px; cursor: pointer;"
                @click="restoreCurrentStall"
              >
                <i class="pi pi-replay"></i>
                Restore Stall
              </button>
            </div>
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
  unassignOccupant,
  archiveStall,
  restoreStall
} from '../services/stallService'
import { systemMessage } from '../utils/systemMessage'

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

// Basemap Tile Configurations (Authorized high-performance tiles via Leaflet)
const BASEMAP_TILES = {
  roadmap: {
    url: 'https://{s}.google.com/vt/lyrs=m&apistyle=s.t:33|p.v:off,s.t:37|p.v:off,s.e:l.i|p.v:off&x={x}&y={y}&z={z}',
    options: {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }
  },
  satellite: {
    url: 'https://{s}.google.com/vt/lyrs=y&apistyle=s.t:33|p.v:off,s.t:37|p.v:off,s.e:l.i|p.v:off&x={x}&y={y}&z={z}',
    options: {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps Satellite'
    }
  }
}

// Map Engine State
const mapType = ref('roadmap') // 'roadmap' | 'satellite'
let leafletMap = null
let leafletMarkers = []
let leafletPickerMarker = null
let leafletTileLayer = null

// Expose global callback handlers for Leaflet HTML popups
window.__smOpenStallDetails = (stallId) => {
  const stall = stalls.value.find((s) => s.id === stallId)
  if (stall) openStallDetailsModal(stall)
}
window.__smAssignStall = (stallId) => {
  const stall = stalls.value.find((s) => s.id === stallId)
  if (stall) openAssignForStall(stall)
}
window.__smRelocateStall = (stallId) => {
  const stall = stalls.value.find((s) => s.id === stallId)
  if (stall) startLocationPickerForStall(stall)
}

function initModernLeafletMap() {
  const container = document.getElementById('map')
  if (!container) return

  if (leafletMap) {
    try { leafletMap.remove() } catch (_) {}
    leafletMap = null
  }

  container.innerHTML = ''
  delete container._leaflet_id

  leafletMap = L.map('map', {
    center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
    zoom: DEFAULT_MAP_ZOOM,
    minZoom: MIN_MAP_ZOOM,
    maxZoom: 20,
    zoomControl: false
  })

  // Position modern zoom control in bottom-right
  L.control.zoom({ position: 'bottomright' }).addTo(leafletMap)

  updateTileLayer()

  leafletMap.on('click', (e) => {
    if (isPickingCoordinates.value && e.latlng) {
      updatePickerPosition(e.latlng.lat, e.latlng.lng)
    }
  })

  renderMarkers()

  setTimeout(() => {
    if (leafletMap) leafletMap.invalidateSize()
  }, 200)
}

function updateTileLayer() {
  if (!leafletMap) return
  if (leafletTileLayer) {
    leafletMap.removeLayer(leafletTileLayer)
    leafletTileLayer = null
  }

  const isSat = mapType.value === 'satellite'
  const config = isSat ? BASEMAP_TILES.satellite : BASEMAP_TILES.roadmap

  leafletTileLayer = L.tileLayer(config.url, config.options).addTo(leafletMap)
}

function setMapType(type) {
  mapType.value = type
  updateTileLayer()
}

function recenterMap() {
  if (leafletMap) {
    leafletMap.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_MAP_ZOOM)
  }
}

// ===================================
// MARKER RENDERING & DETAILS HOOKS
// ===================================
function clearAllMarkers() {
  if (leafletMarkers.length && leafletMap) {
    leafletMarkers.forEach((m) => leafletMap.removeLayer(m))
    leafletMarkers = []
  }
}

function createModernMarkerIcon(stall) {
  const norm = getNormalizedStatus(stall.status)
  const stallNo = String(stall.number || stall.stallNo || '—')
  const isOccupied = norm === 'occupied'
  const isUnavailable = norm === 'unavailable'

  // Blue for Occupied, Green for Vacant, Orange for Unavailable
  const iconUrl = isOccupied
    ? '/icons/stall-pin-blue.svg'
    : isUnavailable
    ? '/icons/stall-pin-orange.svg'
    : '/icons/stall-pin-green.svg'

  const statusLabel = isOccupied ? 'Occupied' : isUnavailable ? 'Unavailable' : 'Vacant'
  const badgeClass = isOccupied ? 'badge-occupied' : isUnavailable ? 'badge-unavailable' : 'badge-vacant'

  const html = `
    <div class="stall-svg-pin pin-${norm}" title="Stall #${stallNo} (${statusLabel})">
      <span class="stall-pin-pill ${badgeClass}">#${stallNo}</span>
      <img src="${iconUrl}" class="stall-pin-svg-icon" alt="Stall #${stallNo} (${statusLabel})" />
    </div>
  `

  return L.divIcon({
    className: 'stall-leaflet-divicon',
    html,
    iconSize: [44, 58],
    iconAnchor: [22, 58],
    popupAnchor: [0, -54]
  })
}

function buildLeafletPopupContent(stall) {
  const norm = getNormalizedStatus(stall.status)
  const statusLabel = getStatusLabel(stall.status)
  const occupant = getOccupantName(stall)
  const business = getOccupantBusiness(stall)
  const rent = formatCurrency(stall.rent)
  const imgUrl = stall.imageUrl ? (stall.imageUrl.startsWith('http') ? stall.imageUrl : `${API_ORIGIN}${stall.imageUrl}`) : ''
  const stallNo = String(stall.number || stall.stallNo || '—')
  const stallType = stall.type || 'Standard Stall'

  return `
    <div class="sm-leaflet-popup">
      ${imgUrl ? `<img src="${imgUrl}" class="sm-popup-img" alt="Stall ${stallNo}" />` : ''}
      <div class="sm-popup-top">
        <div class="sm-popup-stall">Stall #${stallNo}</div>
        <span class="sm-popup-badge status-${norm}">${statusLabel}</span>
      </div>
      <div class="sm-popup-type">${stallType}</div>

      <div class="sm-popup-meta">
        <div class="sm-popup-row">
          <span class="sm-lbl">Monthly Rent:</span>
          <span class="sm-val font-bold" style="color: #10b981;">${rent}</span>
        </div>
        <div class="sm-popup-row">
          <span class="sm-lbl">Occupant:</span>
          <span class="sm-val">${occupant ? `<strong>${occupant}</strong>` : '<em style="color:#94a3b8">Vacant</em>'}</span>
        </div>
        ${business ? `
        <div class="sm-popup-row">
          <span class="sm-lbl">Business:</span>
          <span class="sm-val text-xs text-slate-600">${business}</span>
        </div>` : ''}
      </div>

      <div class="sm-popup-actions">
        <button type="button" onclick="window.__smOpenStallDetails(${stall.id})" class="sm-popup-btn sm-btn-details">
          <i class="pi pi-info-circle"></i> Details
        </button>
        ${norm === 'vacant' ? `
        <button type="button" onclick="window.__smAssignStall(${stall.id})" class="sm-popup-btn sm-btn-assign">
          <i class="pi pi-user-plus"></i> Assign
        </button>` : ''}
        <button type="button" onclick="window.__smRelocateStall(${stall.id})" class="sm-popup-btn sm-btn-relocate" title="Adjust GPS Pin">
          <i class="pi pi-map-marker"></i> Relocate
        </button>
      </div>
    </div>
  `
}

function renderMarkers() {
  clearAllMarkers()
  if (!leafletMap) return

  const validStalls = stalls.value.filter(
    (s) => s.lat != null && s.lng != null && !isNaN(Number(s.lat)) && !isNaN(Number(s.lng))
  )

  validStalls.forEach((stall) => {
    const customIcon = createModernMarkerIcon(stall)
    const norm = getNormalizedStatus(stall.status)
    const statusLabel = getStatusLabel(stall.status)
    const stallNo = String(stall.number || stall.stallNo || '—')

    const marker = L.marker([Number(stall.lat), Number(stall.lng)], {
      icon: customIcon,
      title: `Stall #${stallNo} (${statusLabel})`
    }).addTo(leafletMap)

    marker.bindTooltip(`Stall #${stallNo} &bull; ${statusLabel}`, {
      direction: 'top',
      offset: [0, -48],
      className: 'sm-leaflet-tooltip'
    })

    marker.bindPopup(buildLeafletPopupContent(stall), {
      className: 'sm-leaflet-popup-wrapper',
      maxWidth: 290,
      minWidth: 260
    })

    marker.stallId = stall.id
    leafletMarkers.push(marker)
  })
}

function focusStallOnMap(stall) {
  if (stall.lat == null || stall.lng == null) {
    systemMessage.info(`Stall ${stall.number} does not have GPS coordinates assigned.`, 'No GPS Assigned')
    return
  }

  const lat = Number(stall.lat)
  const lng = Number(stall.lng)

  if (leafletMap) {
    leafletMap.setView([lat, lng], 19)
  }

  const targetMarker = leafletMarkers.find((m) => m.stallId === stall.id)
  if (targetMarker) {
    targetMarker.openPopup()
  }

  const mapElem = document.getElementById('map')
  if (mapElem) {
    mapElem.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// ===================================
// INTERACTIVE POSITION PICKER
// ===================================
function createPickerIcon() {
  const html = `
    <div class="picker-svg-pin">
      <span class="picker-pin-pill">Target Pin</span>
      <img src="/icons/stall-pin-orange.svg" class="picker-pin-svg-icon" alt="Target Location" />
      <div class="picker-pulse-wave"></div>
    </div>
  `
  return L.divIcon({
    className: 'picker-leaflet-divicon',
    html,
    iconSize: [48, 64],
    iconAnchor: [24, 64]
  })
}

function updatePickerPosition(lat, lng) {
  pickerCoords.value = { lat, lng }
  if (!leafletMap) return

  if (!leafletPickerMarker) {
    const pickerIcon = createPickerIcon()
    leafletPickerMarker = L.marker([lat, lng], {
      icon: pickerIcon,
      draggable: true,
      zIndexOffset: 3000
    }).addTo(leafletMap)

    leafletPickerMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng()
      pickerCoords.value = { lat: pos.lat, lng: pos.lng }
    })
  } else {
    leafletPickerMarker.setLatLng([lat, lng])
  }
}

function clearPickerMarker() {
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
      systemMessage.success(`GPS location for Stall ${stall.number} saved successfully!`, 'Location Updated')
    } catch (err) {
      console.error(err)
      systemMessage.error(err.message || 'Failed to update stall location', 'Update Failed')
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
      systemMessage.success(`Stall ${form.value.number} relocated successfully!`, 'Stall Relocated')
    } catch (err) {
      console.error(err)
      systemMessage.error(err.message || 'Failed to relocate stall', 'Relocation Failed')
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
    systemMessage.warn('Please enter a stall number.', 'Validation Error')
    return
  }

  // Duplicate stall check
  const duplicate = stalls.value.find(
    (s) => String(s.number).trim().toLowerCase() === num.toLowerCase() && s.id !== stallForm.value.id
  )
  if (duplicate) {
    systemMessage.warn(`A stall with number "${num}" already exists. Please choose a unique stall number.`, 'Duplicate Stall')
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
      systemMessage.success(`Stall #${num} updated successfully!`, 'Stall Updated')
    } else {
      await createStall(payload)
      systemMessage.success(`Stall #${num} created successfully!`, 'Stall Created')
    }

    showCreateEditModal.value = false
    await loadStalls()
    renderMarkers()
  } catch (err) {
    console.error(err)
    systemMessage.error(err.message || 'Failed to save stall', 'Operation Failed')
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
    systemMessage.warn('Please select an eligible approved stakeholder to assign.', 'Selection Required')
    return
  }

  isSaving.value = true
  try {
    const targetStallId = form.value.id
    const stakeholder = selectedStakeholder.value
    const stakeholderName = getPersonName(stakeholder)

    await allocateOccupant(targetStallId, stakeholder.id)

    // Ensure occupant status is ACTIVE and tenant billing cycle is initiated
    try {
      const { supabase } = await import('../config/supabase')
      await supabase
        .from('occupants')
        .update({ status: 'ACTIVE', occupancy_date: new Date().toISOString().split('T')[0] })
        .eq('stakeholder_id', stakeholder.id)
    } catch (_) {}

    // Non-blocking billing check and notification dispatch
    void (async () => {
      try {
        const { ensureBillingsForVerifiedTenants } = await import('../services/billingService')
        await ensureBillingsForVerifiedTenants()
      } catch (_) {}

      try {
        const { sendApplicationProgressNotification } = await import('../services/emailNotificationService')
        await sendApplicationProgressNotification({
          stakeholderId: stakeholder.id,
          userId: stakeholder.userId || stakeholder.user_id,
          email: stakeholder.email,
          stage: 'STALL_ASSIGNMENT',
          status: 'ASSIGNED',
          title: `Market Stall Assigned: Stall No. ${form.value.number}`,
          message: `Congratulations! Stall No. ${form.value.number} (${form.value.type || 'Commercial Stall'}) has been officially assigned to you. Your application has now proceeded to BPLO validation.`,
          remarks: `Assigned Stall: Stall No. ${form.value.number}. Monthly rental: ₱${Number(form.value.rent || 0).toLocaleString()}/month.`,
          stallNo: form.value.number
        })
      } catch (eErr) {
        console.warn('[StallManagement] Stall assignment email dispatch warning:', eErr)
      }
    })()

    await loadStalls()
    await loadContracts()
    renderMarkers()

    currentOccupantName.value = stakeholderName
    initialOccupantName.value = stakeholderName
    form.value.status = 'OCCUPIED'

    closeAssignModal()
    systemMessage.success(`Stall ${form.value.number} successfully assigned to ${stakeholderName} and notified via email!`, 'Occupant Assigned')
  } catch (err) {
    console.error(err)
    systemMessage.error(err.message || 'Failed to assign occupant to stall', 'Assignment Failed')
  } finally {
    isSaving.value = false
  }
}

async function vacateOccupant() {
  const confirmed = await systemMessage.confirm(`Are you sure you want to remove occupant "${currentOccupantName.value}" from Stall ${form.value.number}? The stall will be set to VACANT.`, {
    title: 'Remove Occupant',
    isDanger: true,
    acceptLabel: 'Remove Occupant',
    rejectLabel: 'Cancel'
  })
  if (!confirmed) {
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

    systemMessage.warn(`Occupant removed from Stall ${form.value.number}. Stall is now VACANT.`, 'Stall Vacated')
  } catch (err) {
    console.error(err)
    systemMessage.error(err.message || 'Failed to remove occupant', 'Operation Failed')
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
  if (s === 'UNAVAILABLE' || s === 'RESERVED') return 'unavailable'
  if (s === 'ARCHIVED') return 'archived'
  return 'vacant'
}

function getStatusLabel(status) {
  const norm = getNormalizedStatus(status)
  if (norm === 'occupied') return 'OCCUPIED'
  if (norm === 'unavailable') return 'UNAVAILABLE'
  if (norm === 'archived') return 'ARCHIVED'
  return 'VACANT'
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

async function archiveStallAction(stall) {
  const stallNum = stall.number || stall.stallNo || 'this stall'
  const confirmed = await systemMessage.confirm(`Are you sure you want to ARCHIVE Stall ${stallNum}? It will be moved to Archive Records.`, {
    title: 'Archive Stall',
    isDanger: true,
    acceptLabel: 'Archive Stall',
    rejectLabel: 'Cancel'
  })
  if (!confirmed) {
    return
  }

  try {
    await archiveStall(stall.id)
    await loadStalls()
    renderMarkers()
    systemMessage.success(`Stall ${stallNum} has been archived successfully.`, 'Stall Archived')
  } catch (err) {
    console.error(err)
    systemMessage.error(`Failed to archive stall: ${err.message || err}`, 'Archive Failed')
  }
}

async function restoreStallAction(stall) {
  const stallNum = stall.number || stall.stallNo || 'this stall'
  try {
    await restoreStall(stall.id)
    await loadStalls()
    renderMarkers()
    systemMessage.success(`Stall ${stallNum} has been restored to active registry!`, 'Stall Restored')
  } catch (err) {
    console.error(err)
    systemMessage.error(`Failed to restore stall: ${err.message || err}`, 'Restore Failed')
  }
}

async function archiveCurrentStall() {
  if (!form.value.id) return
  await archiveStallAction(form.value)
  closeModal()
}

async function restoreCurrentStall() {
  if (!form.value.id) return
  await restoreStallAction(form.value)
  closeModal()
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
const unavailableCount = computed(() => stalls.value.filter((s) => {
  const st = String(s.status).toUpperCase()
  return st === 'UNAVAILABLE' || st === 'RESERVED'
}).length)
const archivedCount = computed(() => stalls.value.filter((s) => String(s.status).toUpperCase() === 'ARCHIVED' || s.isArchived).length)
const activeStallsCount = computed(() => stalls.value.filter((s) => String(s.status).toUpperCase() !== 'ARCHIVED' && !s.isArchived).length)
const occupancyRate = computed(() => activeStallsCount.value ? Math.round((occupiedCount.value / activeStallsCount.value) * 100) : 0)

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

    let matchesStatus = false
    if (filterStatus.value === 'All') {
      matchesStatus = normStatus !== 'ARCHIVED'
    } else if (filterStatus.value === 'ARCHIVED') {
      matchesStatus = normStatus === 'ARCHIVED'
    } else {
      matchesStatus =
        normStatus === filterNorm ||
        String(stall.status).toUpperCase() === filterStatus.value ||
        (filterStatus.value === 'UNAVAILABLE' && String(stall.status).toUpperCase() === 'RESERVED')
    }

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
  initModernLeafletMap()
})

onBeforeUnmount(() => {
  delete window.__smOpenStallDetails
  delete window.__smAssignStall
  delete window.__smRelocateStall
  clearAllMarkers()
  clearPickerMarker()
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }
})
</script>

<style scoped src="../styles/MarketSupervisor/StallManagement.css"></style>

<!-- Global Styles for Leaflet Dynamically Injected DOM Elements (divIcon, Popups, Tooltips) -->
<style>
/* DivIcon Containers */
.stall-leaflet-divicon,
.picker-leaflet-divicon,
.modern-stall-divicon,
.modern-picker-divicon {
  background: transparent !important;
  border: none !important;
}

/* SVG Stall Marker Pin with Public Icons */
.stall-svg-pin {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stall-svg-pin:hover {
  transform: translateY(-5px) scale(1.12);
  z-index: 1000 !important;
}

.stall-pin-pill {
  font-size: 11px;
  font-weight: 800;
  padding: 1px 7px;
  border-radius: 9999px;
  color: #ffffff;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  margin-bottom: -6px;
  z-index: 2;
  position: relative;
  border: 1.5px solid #ffffff;
  white-space: nowrap;
}

.badge-occupied,
.pill-occupied {
  background: #2563eb; /* Blue for Occupied */
}

.badge-vacant,
.pill-vacant {
  background: #16a34a; /* Green for Vacant */
}

.badge-unavailable,
.pill-unavailable {
  background: #ea580c; /* Orange for Unavailable */
}

.stall-pin-svg-icon {
  width: 44px;
  height: 44px;
  display: block;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.28));
}

/* Position Picker Pin with Orange SVG Icon */
.picker-svg-pin {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: grab;
  user-select: none;
}

.picker-svg-pin:active {
  cursor: grabbing;
}

.picker-pin-pill {
  background: #ea580c;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 800;
  border: 1.5px solid #ffffff;
  box-shadow: 0 3px 8px rgba(234, 88, 12, 0.45);
  margin-bottom: -5px;
  z-index: 2;
  white-space: nowrap;
}

.picker-pin-svg-icon {
  width: 48px;
  height: 48px;
  display: block;
  filter: drop-shadow(0 4px 10px rgba(234, 88, 12, 0.5));
}

.picker-pulse-wave {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #ea580c;
  animation: pickerRadar 1.8s ease-out infinite;
  pointer-events: none;
}

@keyframes pickerRadar {
  0% {
    width: 24px;
    height: 24px;
    opacity: 1;
    transform: translateX(-50%) scale(0.6);
  }
  100% {
    width: 60px;
    height: 60px;
    opacity: 0;
    transform: translateX(-50%) scale(1.6);
  }
}

/* Leaflet Popup Styling */
.sm-leaflet-popup-wrapper .leaflet-popup-content-wrapper {
  padding: 0;
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.sm-leaflet-popup-wrapper .leaflet-popup-content {
  margin: 0;
  padding: 12px 14px;
  font-family: inherit;
  color: #0f172a;
  line-height: 1.4;
}

.sm-leaflet-popup-wrapper .leaflet-popup-tip {
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
}

.sm-popup-img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #f1f5f9;
}

.sm-popup-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sm-popup-stall {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
}

.sm-popup-badge {
  font-size: 10px;
  font-weight: 750;
  padding: 2px 7px;
  border-radius: 999px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.sm-popup-badge.status-occupied {
  background: #dbeafe;
  color: #1d4ed8; /* Blue for Occupied */
}

.sm-popup-badge.status-vacant {
  background: #dcfce7;
  color: #15803d; /* Green for Vacant */
}

.sm-popup-badge.status-unavailable,
.sm-popup-badge.status-reserved {
  background: #ffedd5;
  color: #c2410c; /* Orange for Unavailable */
}

.sm-popup-type {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
  margin-bottom: 8px;
  font-weight: 500;
}

.sm-popup-meta {
  background: #f8fafc;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  margin-bottom: 10px;
}

.sm-popup-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.sm-lbl {
  color: #64748b;
  font-size: 11px;
}

.sm-val {
  color: #1e293b;
}

.sm-popup-actions {
  display: flex;
  gap: 6px;
}

.sm-popup-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.sm-btn-details {
  background: #4f46e5;
  color: #ffffff;
}

.sm-btn-details:hover {
  background: #4338ca;
}

.sm-btn-assign {
  background: #10b981;
  color: #ffffff;
}

.sm-btn-assign:hover {
  background: #059669;
}

.sm-btn-relocate {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.sm-btn-relocate:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* Tooltip */
.sm-leaflet-tooltip {
  background: rgba(15, 23, 42, 0.9) !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 6px !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  padding: 4px 8px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
}

.sm-leaflet-tooltip::before {
  border-top-color: rgba(15, 23, 42, 0.9) !important;
}
</style>
