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
          <option value="RESERVED">Reserved ({{ reservedCount }})</option>
          <option value="OCCUPIED">Occupied ({{ occupiedCount }})</option>
          <option value="UNAVAILABLE">Unavailable ({{ unavailableCount }})</option>
          <option value="ARCHIVED">Archived ({{ archivedCount }})</option>
        </select>

        <!-- Stall Type / Section Filter -->
        <select v-model="filterType" class="filter" aria-label="Filter by section or type">
          <option value="All">All Sections ({{ stallTypes.length }})</option>
          <option v-for="t in stallTypes" :key="t" :value="t">{{ t }}</option>
        </select>

        <!-- View Mode Switcher -->
        <div class="sm-view-mode-toggle" aria-label="Display View Mode">
          <button
            type="button"
            class="sm-view-btn"
            :class="{ active: viewMode === 'split' }"
            title="Show both Map and Registry Table"
            @click="setViewMode('split')"
          >
            <i class="pi pi-th-large"></i>
            <span>Split View</span>
          </button>
          <button
            type="button"
            class="sm-view-btn"
            :class="{ active: viewMode === 'map' }"
            title="Focus on Interactive GPS Map"
            @click="setViewMode('map')"
          >
            <i class="pi pi-map"></i>
            <span>Map View</span>
          </button>
          <button
            type="button"
            class="sm-view-btn"
            :class="{ active: viewMode === 'table' }"
            title="Focus on Stall Registry Table"
            @click="setViewMode('table')"
          >
            <i class="pi pi-table"></i>
            <span>Table View</span>
          </button>
        </div>

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
        <div class="stat-icon reserved-icon">
          <i class="pi pi-bookmark"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Reserved</span>
          <span class="stat-value">{{ reservedCount }}</span>
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

    <!-- MAP CONTAINER (COLLAPSIBLE / EXPANDABLE) -->
    <section v-show="viewMode !== 'table'" class="map-card modern-map-card" :class="{ 'map-full-view': viewMode === 'map' }">
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
          <div class="legend-chip chip-reserved" title="Reserved for Pending Stakeholders (Orange)">
            <span class="chip-dot dot-reserved"></span>
            <span class="chip-text">Reserved</span>
            <span class="chip-count">{{ reservedCount }}</span>
          </div>
          <div class="legend-chip chip-occupied" title="Occupied Stalls (Blue)">
            <span class="chip-dot dot-occupied"></span>
            <span class="chip-text">Occupied</span>
            <span class="chip-count">{{ occupiedCount }}</span>
          </div>
          <div class="legend-chip chip-unavailable" title="Unavailable Stalls (Slate)">
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

    <!-- STALL REGISTRY TABLE (COLLAPSIBLE / EXPANDABLE) -->
    <section v-show="viewMode !== 'map'" class="table-wrap">
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

                <!-- Approve Stakeholder & Create Contract (Reserved Stalls) -->
                <button
                  v-if="getNormalizedStatus(stall.status, stall) === 'reserved'"
                  type="button"
                  class="btn-action btn-approve-row"
                  title="Approve stakeholder, create contract and assign stall"
                  @click="approveAndContractForStall(stall)"
                >
                  ✓ Approve & Contract
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
              <div class="flex items-center gap-2 mt-1.5">
                <span class="text-xs text-slate-500 font-medium">Occupant Status:</span>
                <span
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold"
                  :class="currentOccupantStatus === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'"
                >
                  <span
                    class="w-2 h-2 rounded-full inline-block animate-pulse"
                    :class="currentOccupantStatus === 'PENDING' ? 'bg-amber-500' : 'bg-emerald-500'"
                  ></span>
                  {{ currentOccupantStatus === 'PENDING' ? 'PENDING APPROVAL' : (currentOccupantStatus || 'ACTIVE') }}
                </span>
              </div>

              <!-- Pending Approval Banner for Reserved Stalls -->
              <div v-if="currentOccupantStatus === 'PENDING' || form.status === 'RESERVED'" class="pending-approval-banner mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <div class="text-xs font-bold text-amber-800 uppercase tracking-wide">Reserved for Stakeholder (Pending Approval)</div>
                    <p class="text-xs text-amber-700 mt-0.5">Application is pending Market Supervisor approval. Approving will activate the tenant and auto-generate the lease contract.</p>
                  </div>
                  <button
                    type="button"
                    class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    :disabled="isSaving"
                    @click="approveAndContractForCurrentStall"
                  >
                    <i class="pi pi-check" :class="{ 'pi-spin': isSaving }"></i>
                    <span>Approve & Contract</span>
                  </button>
                </div>
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

          <!-- Stakeholder Search Input & Filter Tabs -->
          <div class="assign-field-group">
            <label class="assign-input-label">
              <span>Select Stakeholder to Assign</span>
              <small>Assign a vacant stall to an awaiting or approved applicant, or reassign an existing stakeholder</small>
            </label>
            <div class="search-input-wrap">
              <input
                v-model="stakeholderSearch"
                type="text"
                placeholder="Search stakeholder by name, business, contact, or email..."
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

            <!-- Quick Filter Tabs -->
            <div class="flex items-center gap-1.5 mt-2">
              <button
                type="button"
                class="px-2.5 py-1 text-xs font-bold rounded-lg transition-colors border"
                :style="stakeholderAssignTab === 'ALL' ? 'background: #4f46e5; color: #fff; border-color: #4f46e5;' : 'background: #fff; color: #475569; border-color: #e2e8f0;'"
                @click="stakeholderAssignTab = 'ALL'"
              >
                All Stakeholders ({{ (stakeholders || []).length }})
              </button>
              <button
                type="button"
                class="px-2.5 py-1 text-xs font-bold rounded-lg transition-colors border flex items-center gap-1"
                :style="stakeholderAssignTab === 'AWAITING' ? 'background: #2563eb; color: #fff; border-color: #2563eb;' : 'background: #fff; color: #1e40af; border-color: #bfdbfe;'"
                @click="stakeholderAssignTab = 'AWAITING'"
              >
                <i class="pi pi-clock text-[10px]"></i>
                Awaiting Stall ({{ awaitingAssignmentCount }})
              </button>
              <button
                type="button"
                class="px-2.5 py-1 text-xs font-bold rounded-lg transition-colors border flex items-center gap-1"
                :style="stakeholderAssignTab === 'APPROVED' ? 'background: #059669; color: #fff; border-color: #059669;' : 'background: #fff; color: #047857; border-color: #a7f3d0;'"
                @click="stakeholderAssignTab = 'APPROVED'"
              >
                <i class="pi pi-check text-[10px]"></i>
                Approved / Paid
              </button>
            </div>
          </div>

          <!-- Selected Stakeholder Card -->
          <div v-if="selectedStakeholder" class="selected-occupant-card">
            <div class="selected-badge-row">
              <span v-if="!hasAssignedStall(selectedStakeholder)" class="selected-tag">
                <i class="pi pi-user-plus"></i> New Stall Assignment
              </span>
              <span v-else class="selected-tag" style="background: #fef3c7; color: #92400e; border-color: #fde68a;">
                <i class="pi pi-refresh"></i> Reassigning from Stall #{{ getStakeholderCurrentStallNo(selectedStakeholder) }}
              </span>
              <span v-if="isStakeholderAdvancePaid(selectedStakeholder)" class="badge-approved" style="background: #dcfce7; color: #166534; border-color: #bbf7d0;">
                <i class="pi pi-check"></i> Advance Verified
              </span>
              <span v-if="isStakeholderSupervisorApproved(selectedStakeholder)" class="badge-approved" style="background: #ede9fe; color: #5b21b6; border-color: #ddd6fe;">
                <i class="pi pi-check-circle"></i> Supervisor Approved
              </span>
            </div>
            <div class="selected-occupant-name">
              <i class="pi pi-user"></i> {{ getPersonName(selectedStakeholder) }}
            </div>
            <div class="selected-occupant-biz">
              <i class="pi pi-briefcase"></i> {{ selectedStakeholder.businessName || 'Business Applicant' }}
              <span v-if="selectedStakeholder.contact">&bull; {{ selectedStakeholder.contact }}</span>
              <span v-if="selectedStakeholder.email">&bull; {{ selectedStakeholder.email }}</span>
            </div>
            <button type="button" class="btn-change-selection" @click="clearStakeholderSearch">
              Change Selection
            </button>
          </div>

          <!-- Stakeholders Selection List -->
          <div v-else class="assign-stakeholders-container">
            <div class="stakeholder-list-title flex items-center justify-between">
              <span>Selectable Stakeholders ({{ filteredEligibleStakeholders.length }})</span>
              <span class="text-[11px] font-normal text-slate-500">Click any applicant below to select</span>
            </div>

            <div v-if="eligibleStakeholders.length === 0" class="stakeholder-empty-notice">
              <i class="pi pi-info-circle text-amber-500"></i>
              <span>No stakeholders found matching the selected filter. Applicants will appear here once registered.</span>
            </div>

            <div v-else-if="filteredEligibleStakeholders.length === 0" class="stakeholder-empty-notice">
              <i class="pi pi-search"></i>
              <span>No stakeholder matching "{{ stakeholderSearch }}"</span>
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
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span v-if="!hasAssignedStall(person)" class="badge-awaiting">
                      <i class="pi pi-clock"></i> Awaiting Stall
                    </span>
                    <span v-else class="badge-reassign">
                      <i class="pi pi-building"></i> Stall #{{ getStakeholderCurrentStallNo(person) }}
                    </span>
                    <span v-if="isStakeholderAdvancePaid(person)" class="badge-paid">
                      <i class="pi pi-check"></i> Paid
                    </span>
                    <span v-if="isStakeholderSupervisorApproved(person)" class="badge-approved">
                      <i class="pi pi-check-circle"></i> Approved
                    </span>
                  </div>
                </div>
                <div v-if="person.businessName" class="pick-biz">
                  <i class="pi pi-briefcase"></i> {{ person.businessName }}
                  <span v-if="person.businessType" class="text-slate-400">({{ person.businessType }})</span>
                </div>
                <div class="pick-meta">
                  <span v-if="person.contact">
                    <i class="pi pi-phone"></i> {{ person.contact }}
                  </span>
                  <span v-if="person.email">
                    <i class="pi pi-envelope"></i> {{ person.email }}
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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
const route = useRoute()
const stakeholderAssignTab = ref('ALL')
const viewMode = ref(route.query.view === 'map' ? 'map' : (route.query.view === 'table' ? 'table' : 'split'))

function setViewMode(mode) {
  viewMode.value = mode
  router.replace({ query: { ...route.query, view: mode !== 'split' ? mode : undefined } })
  if (mode !== 'table') {
    setTimeout(() => {
      if (leafletMap) leafletMap.invalidateSize()
    }, 150)
  }
}

watch(() => route.query.view, (newView) => {
  if (newView === 'map' || newView === 'table' || newView === 'split') {
    viewMode.value = newView
    if (newView !== 'table') {
      setTimeout(() => {
        if (leafletMap) leafletMap.invalidateSize()
      }, 150)
    }
  }
})

watch(() => route.query.action, (action) => {
  if (action === 'assign') {
    filterStatus.value = 'VACANT'
  } else if (action === 'add') {
    openCreateStallModal()
  }
})

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
const currentOccupantStatus = ref('')

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
  const stall = stalls.value.find((s) => String(s.id) === String(stallId))
  if (stall) openStallDetailsModal(stall)
}
window.__smAssignStall = (stallId) => {
  const stall = stalls.value.find((s) => String(s.id) === String(stallId))
  if (stall) openAssignForStall(stall)
}
window.__smRelocateStall = (stallId) => {
  const stall = stalls.value.find((s) => String(s.id) === String(stallId))
  if (stall) startLocationPickerForStall(stall)
}
window.__smApproveAndContract = (stallId) => {
  const stall = stalls.value.find((s) => String(s.id) === String(stallId))
  if (stall) approveAndContractForStall(stall)
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
  const norm = getNormalizedStatus(stall.status, stall)
  const stallNo = String(stall.number || stall.stallNo || '—')
  const isOccupied = norm === 'occupied'
  const isReserved = norm === 'reserved'
  const isUnavailable = norm === 'unavailable'

  // Blue for Occupied, Orange for Reserved or Unavailable, Green for Vacant
  const iconUrl = isOccupied
    ? '/icons/stall-pin-blue.svg'
    : (isReserved || isUnavailable)
    ? '/icons/stall-pin-orange.svg'
    : '/icons/stall-pin-green.svg'

  const statusLabel = isOccupied ? 'Occupied' : isReserved ? 'Reserved' : isUnavailable ? 'Unavailable' : 'Vacant'
  const badgeClass = isOccupied ? 'badge-occupied' : isReserved ? 'badge-reserved' : isUnavailable ? 'badge-unavailable' : 'badge-vacant'

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
  const norm = getNormalizedStatus(stall.status, stall)
  const statusLabel = getStatusLabel(stall.status, stall)
  const occupant = getOccupantName(stall)
  const business = getOccupantBusiness(stall)
  const occupantStatus = getOccupantStatus(stall)
  const rent = formatCurrency(stall.rent)
  const imgUrl = stall.imageUrl ? (stall.imageUrl.startsWith('http') ? stall.imageUrl : `${API_ORIGIN}${stall.imageUrl}`) : ''
  const stallNo = String(stall.number || stall.stallNo || '—')
  const stallType = stall.type || 'Standard Stall'
  const isVacant = norm === 'vacant'
  const isReserved = norm === 'reserved'

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
        ${occupant ? `
        <div class="sm-popup-row">
          <span class="sm-lbl">Occupant Status:</span>
          <span class="sm-val">
            <span class="sm-popup-occupant-status ${occupantStatus === 'PENDING' ? 'status-pending' : 'status-active'}">
              <span class="status-dot"></span> ${occupantStatus === 'PENDING' ? 'PENDING APPROVAL' : (occupantStatus || 'ACTIVE')}
            </span>
          </span>
        </div>` : ''}
        ${business ? `
        <div class="sm-popup-row">
          <span class="sm-lbl">Business:</span>
          <span class="sm-val text-xs text-slate-600">${business}</span>
        </div>` : ''}
      </div>

      <div class="sm-popup-actions">
        <button type="button" onclick="window.__smOpenStallDetails('${stall.id}')" class="sm-popup-btn sm-btn-details">
          <i class="pi pi-info-circle"></i> Details
        </button>
        ${isReserved ? `
        <button type="button" onclick="window.__smApproveAndContract('${stall.id}')" class="sm-popup-btn sm-btn-approve" title="Approve Stakeholder & Create Contract">
          <i class="pi pi-check-circle"></i> Approve & Contract
        </button>` : isVacant ? `
        <button type="button" onclick="window.__smAssignStall('${stall.id}')" class="sm-popup-btn sm-btn-assign">
          <i class="pi pi-user-plus"></i> Assign
        </button>` : `
        <button type="button" onclick="window.__smAssignStall('${stall.id}')" class="sm-popup-btn sm-btn-assign sm-btn-reassign" title="Reassign Occupant">
          <i class="pi pi-user-edit"></i> Reassign
        </button>`}
        <button type="button" onclick="window.__smRelocateStall('${stall.id}')" class="sm-popup-btn sm-btn-relocate" title="Adjust GPS Pin">
          <i class="pi pi-map-marker"></i> Relocate
        </button>
      </div>
    </div>
  `
}

function renderMarkers() {
  clearAllMarkers()
  if (!leafletMap) return

  const sourceStalls = (search.value || filterStatus.value !== 'All' || filterType.value !== 'All')
    ? filteredStalls.value
    : stalls.value

  const validStalls = sourceStalls.filter(
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
  if (!stall || stall.lat == null || stall.lng == null) {
    if (stall && (stall.lat == null || stall.lng == null)) {
      systemMessage.info(`Stall ${stall.number} does not have GPS coordinates assigned.`, 'No GPS Assigned')
    }
    return
  }

  // Auto-switch to split or map view if currently on table-only view
  if (viewMode.value === 'table') {
    viewMode.value = 'split'
    if (leafletMap) {
      setTimeout(() => leafletMap.invalidateSize(), 50)
    }
  }

  const lat = Number(stall.lat)
  const lng = Number(stall.lng)

  if (leafletMap) {
    leafletMap.setView([lat, lng], 19)
  }

  const targetMarker = leafletMarkers.find((m) => String(m.stallId) === String(stall.id))
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
  if (viewMode.value === 'table') {
    viewMode.value = 'split'
    if (leafletMap) {
      setTimeout(() => leafletMap.invalidateSize(), 50)
    }
  }
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
  currentOccupantStatus.value = getOccupantStatus(stall)

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
        .update({
          status: 'ACTIVE',
          stall_id: Number(targetStallId),
          occupancy_date: new Date().toISOString().split('T')[0]
        })
        .eq('stakeholder_id', Number(stakeholder.id))
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
    await loadStakeholders()
    await loadContracts()

    // Ensure immediate reactive UI state reflects ACTIVE occupant status
    const targetStall = stalls.value.find((s) => String(s.id) === String(targetStallId))
    if (targetStall) {
      targetStall.status = 'OCCUPIED'
      if (!targetStall.occupant || !targetStall.occupant.stakeholder) {
        targetStall.occupant = {
          status: 'ACTIVE',
          name: stakeholderName,
          stakeholder: {
            ...stakeholder,
            firstName: stakeholder.firstName || stakeholder.first_name,
            lastName: stakeholder.lastName || stakeholder.last_name,
            businessName: stakeholder.businessName || stakeholder.business_name
          }
        }
      } else {
        const occ = Array.isArray(targetStall.occupant) ? targetStall.occupant[0] : targetStall.occupant
        if (occ) occ.status = 'ACTIVE'
      }
    }

    renderMarkers()

    currentOccupantName.value = stakeholderName
    initialOccupantName.value = stakeholderName
    currentOccupantStatus.value = 'ACTIVE'
    form.value.status = 'OCCUPIED'

    closeAssignModal()
    closeModal()

    if (targetStall) {
      setTimeout(() => {
        focusStallOnMap(targetStall)
      }, 150)
    }

    systemMessage.success(`Stall ${form.value.number} successfully assigned to ${stakeholderName}! Occupant status is now ACTIVE.`, 'Occupant Assigned')
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

    const targetStall = stalls.value.find((s) => String(s.id) === String(targetStallId))
    if (targetStall) {
      targetStall.status = 'VACANT'
      targetStall.occupant = null
    }

    renderMarkers()

    currentOccupantName.value = ''
    initialOccupantName.value = ''
    currentOccupantStatus.value = ''
    form.value.status = 'VACANT'

    closeModal()

    if (targetStall) {
      setTimeout(() => {
        focusStallOnMap(targetStall)
      }, 150)
    }

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
    syncReservedStallsWithStakeholders()
  } catch (err) {
    console.error('[StallManagement] Load stalls error:', err)
  }
}

async function loadStakeholders() {
  try {
    const res = await api.get('/stakeholders')
    stakeholders.value = Array.isArray(res.data) ? res.data : []
    syncReservedStallsWithStakeholders()
  } catch (err) {
    console.error('[StallManagement] Load stakeholders error:', err)
  }
}

function syncReservedStallsWithStakeholders() {
  if (!stalls.value.length || !stakeholders.value.length) return
  stakeholders.value.forEach((sh) => {
    const isApproved = isStakeholderSupervisorApproved(sh)
    const targetStallId = sh.selectedStallId || sh.selected_stall_id || sh.selectedStall?.id
    if (targetStallId) {
      const st = stalls.value.find((s) => String(s.id) === String(targetStallId))
      if (st) {
        if (!isApproved) {
          if (st.status !== 'OCCUPIED') {
            st.status = 'RESERVED'
          }
          if (!st.occupant || !getOccupantName(st)) {
            st.occupant = {
              status: 'PENDING',
              stakeholder_id: sh.id,
              stakeholder: sh,
              name: getPersonName(sh)
            }
          } else {
            const occ = Array.isArray(st.occupant) ? st.occupant[0] : st.occupant
            if (occ && (!occ.status || occ.status === 'PENDING')) {
              occ.status = 'PENDING'
            }
          }
        }
      }
    }
  })
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

function getOccupantStatus(stall) {
  if (!stall || !stall.occupant) return ''
  const occ = Array.isArray(stall.occupant) ? stall.occupant[0] : stall.occupant
  if (!occ) return ''
  const rawStatus = occ.status || (occ.stakeholder ? 'ACTIVE' : '')
  return rawStatus ? String(rawStatus).toUpperCase() : 'ACTIVE'
}

function getPersonName(person) {
  if (!person) return ''
  const first = person.firstName || person.first_name || ''
  const last = person.lastName || person.last_name || ''
  return `${first} ${last}`.trim() || 'Unknown Stakeholder'
}

function getNormalizedStatus(status, stall) {
  const s = String(status || '').toUpperCase()
  if (s === 'ARCHIVED') return 'archived'
  const occStatus = stall ? getOccupantStatus(stall) : ''
  if (s === 'RESERVED' || occStatus === 'PENDING') return 'reserved'
  if (s === 'OCCUPIED') return 'occupied'
  if (s === 'UNAVAILABLE') return 'unavailable'
  return 'vacant'
}

function getStatusLabel(status, stall) {
  const norm = getNormalizedStatus(status, stall)
  if (norm === 'reserved') return 'RESERVED'
  if (norm === 'occupied') return 'OCCUPIED'
  if (norm === 'unavailable') return 'UNAVAILABLE'
  if (norm === 'archived') return 'ARCHIVED'
  return 'VACANT'
}

function getStakeholderForStall(stall) {
  if (!stall) return null
  const occ = Array.isArray(stall.occupant) ? stall.occupant[0] : stall.occupant
  if (occ?.stakeholder) return occ.stakeholder
  if (occ?.stakeholder_id || occ?.stakeholderId) {
    const sId = occ.stakeholder_id || occ.stakeholderId
    const found = stakeholders.value.find((s) => String(s.id) === String(sId))
    if (found) return found
  }
  const match = stakeholders.value.find((s) => 
    String(s.selectedStallId || s.selected_stall_id) === String(stall.id)
  )
  if (match) return match
  return null
}

async function approveAndContractForStall(stall) {
  const sh = getStakeholderForStall(stall)
  const stallNum = stall.number || stall.stallNo || ''
  const applicantName = sh ? getPersonName(sh) : `applicant for Stall #${stallNum}`

  const confirmed = await systemMessage.confirm(
    `Are you sure you want to approve ${applicantName}, assign Stall #${stallNum}, and generate their digital lease contract?`,
    {
      title: 'Approve, Assign Stall & Create Contract',
      acceptLabel: 'Approve & Create Contract',
      rejectLabel: 'Cancel',
      isDanger: false
    }
  )
  if (!confirmed) return

  isSaving.value = true
  try {
    let stakeholderId = sh?.id
    if (!stakeholderId) {
      throw new Error(`No pending stakeholder found for Stall #${stallNum}`)
    }

    await api.put(`/stakeholders/${stakeholderId}/market-approve`, { stallId: stall.id })

    await loadStalls()
    await loadStakeholders()
    await loadContracts()
    renderMarkers()

    systemMessage.success(
      `Stall #${stallNum} successfully assigned to ${applicantName}! Lease contract generated and occupant status updated to ACTIVE.`,
      'Approved & Contract Created'
    )

    const updatedStall = stalls.value.find((s) => String(s.id) === String(stall.id))
    if (updatedStall) {
      focusStallOnMap(updatedStall)
    }
    if (showModal.value) {
      closeModal()
    }
  } catch (err) {
    console.error('[StallManagement] approveAndContract error:', err)
    systemMessage.error(err.message || 'Failed to approve and create contract', 'Approval Failed')
  } finally {
    isSaving.value = false
  }
}

async function approveAndContractForCurrentStall() {
  const stall = stalls.value.find((s) => String(s.id) === String(form.value.id)) || form.value
  await approveAndContractForStall(stall)
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

// ===================================
// STAKEHOLDER ELIGIBILITY & SELECTION
// ===================================
function isStakeholderAdvancePaid(s) {
  if (!s) return false
  if (s.advancePaymentPaid === true || s.advance_payment_paid === true) return true
  if (s.advancePaymentCompleted === true || s.advance_payment_completed === true) return true
  if (s.advancePayment === true) return true
  if (s.treasurerApproved === true || s.treasurer_approved === true) return true
  if (Number(s.advanceBalance || s.advance_balance || 0) > 0) return true
  if (Number(s.totalAdvanceAmount || s.total_advance_amount || 0) > 0) return true
  if (s.advancePaymentDate || s.advance_payment_date) return true
  if (Array.isArray(s.payments) && s.payments.some((p) => {
    const pType = String(p.paymentType || p.payment_type || '').toUpperCase()
    const pStat = String(p.status || 'PAID').toUpperCase()
    return (pType === 'ADVANCE_PAYMENT' || pType === 'APPLICATION_FEE') && pStat !== 'FAILED'
  })) return true
  return false
}

function isStakeholderSupervisorApproved(s) {
  if (!s) return false
  if (s.marketSupervisorApproved === true || s.market_supervisor_approved === true) return true
  const appStatus = String(s.applicationStatus || s.application_status || '').toUpperCase()
  if (['APPROVED', 'FULLY_APPROVED', 'COMPLETED', 'PENDING_BPLO_APPROVAL'].includes(appStatus)) return true
  const mStatus = String(s.marketApprovalStatus || s.market_approval_status || '').toUpperCase()
  return mStatus === 'APPROVED'
}

function getStakeholderCurrentStallNo(s) {
  if (!s) return ''
  if (s.occupant) {
    const occ = Array.isArray(s.occupant) ? s.occupant[0] : s.occupant
    const stNo = occ?.stall?.stallNo || occ?.stall?.stall_no || occ?.stall?.number || occ?.stall_no
    if (stNo) return stNo
  }
  if (Array.isArray(s.occupants) && s.occupants[0]) {
    const occ = s.occupants[0]
    const stNo = occ?.stall?.stallNo || occ?.stall?.stall_no || occ?.stall?.number || occ?.stall_no
    if (stNo) return stNo
  }
  const sStall = s.selectedStall || s.selected_stall
  if (sStall) return sStall.stallNo || sStall.stall_no || sStall.number || ''
  if (s.selectedStallId || s.selected_stall_id) {
    const matched = stalls.value.find(st => String(st.id) === String(s.selectedStallId || s.selected_stall_id))
    if (matched) return matched.number || matched.stallNo || matched.stall_no
  }
  return ''
}

function hasAssignedStall(s) {
  return Boolean(getStakeholderCurrentStallNo(s))
}

const awaitingAssignmentCount = computed(() => {
  return (stakeholders.value || []).filter(s => {
    const st = String(s.applicationStatus || s.application_status || '').toUpperCase()
    return !['REJECTED', 'CANCELLED'].includes(st) && !hasAssignedStall(s)
  }).length
})

// Comprehensive eligibility: prioritize applicants awaiting a stall, approved, or advance paid
const eligibleStakeholders = computed(() => {
  return (stakeholders.value || []).filter((s) => {
    const appStatus = String(s.applicationStatus || s.application_status || '').toUpperCase()
    if (['REJECTED', 'CANCELLED'].includes(appStatus)) return false

    if (stakeholderAssignTab.value === 'AWAITING') {
      return !hasAssignedStall(s)
    }
    if (stakeholderAssignTab.value === 'APPROVED') {
      return isStakeholderSupervisorApproved(s) || isStakeholderAdvancePaid(s)
    }

    return true
  }).sort((a, b) => {
    // 1. Those who DO NOT have a stall yet (awaiting assignment) first
    const aHas = hasAssignedStall(a) ? 1 : 0
    const bHas = hasAssignedStall(b) ? 1 : 0
    if (aHas !== bHas) return aHas - bHas

    // 2. Those who are advance paid / approved next
    const aPaid = (isStakeholderAdvancePaid(a) || isStakeholderSupervisorApproved(a)) ? 0 : 1
    const bPaid = (isStakeholderAdvancePaid(b) || isStakeholderSupervisorApproved(b)) ? 0 : 1
    if (aPaid !== bPaid) return aPaid - bPaid

    return Number(b.id || 0) - Number(a.id || 0)
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
    const email = String(s.email || '').toLowerCase()
    const curStall = String(getStakeholderCurrentStallNo(s)).toLowerCase()
    return name.includes(q) || biz.includes(q) || contact.includes(q) || email.includes(q) || curStall.includes(q)
  })
})

const stallTypes = computed(() => {
  const set = new Set()
  stalls.value.forEach((s) => {
    if (s.type) set.add(s.type)
  })
  return Array.from(set)
})

const reservedCount = computed(() => stalls.value.filter((s) => getNormalizedStatus(s.status, s) === 'reserved').length)
const occupiedCount = computed(() => stalls.value.filter((s) => getNormalizedStatus(s.status, s) === 'occupied').length)
const vacantCount = computed(() => stalls.value.filter((s) => getNormalizedStatus(s.status, s) === 'vacant').length)
const unavailableCount = computed(() => stalls.value.filter((s) => getNormalizedStatus(s.status, s) === 'unavailable').length)
const archivedCount = computed(() => stalls.value.filter((s) => getNormalizedStatus(s.status, s) === 'archived').length)
const activeStallsCount = computed(() => stalls.value.filter((s) => getNormalizedStatus(s.status, s) !== 'archived').length)
const occupancyRate = computed(() => activeStallsCount.value ? Math.round((occupiedCount.value / activeStallsCount.value) * 100) : 0)

const filteredStalls = computed(() => {
  return stalls.value.filter((stall) => {
    const stallNo = String(stall.number || '').toLowerCase()
    const stallType = String(stall.type || '').toLowerCase()
    const occupant = String(getOccupantName(stall) || '').toLowerCase()
    const business = String(getOccupantBusiness(stall) || '').toLowerCase()
    const q = search.value.trim().toLowerCase()

    const matchesSearch = !q || stallNo.includes(q) || stallType.includes(q) || occupant.includes(q) || business.includes(q)

    const normStatus = getNormalizedStatus(stall.status, stall).toUpperCase()
    const filterNorm = getNormalizedStatus(filterStatus.value).toUpperCase()

    let matchesStatus = false
    if (filterStatus.value === 'All') {
      matchesStatus = normStatus !== 'ARCHIVED'
    } else if (filterStatus.value === 'ARCHIVED') {
      matchesStatus = normStatus === 'ARCHIVED'
    } else if (filterStatus.value === 'RESERVED') {
      matchesStatus = normStatus === 'RESERVED'
    } else {
      matchesStatus =
        normStatus === filterNorm ||
        String(stall.status).toUpperCase() === filterStatus.value ||
        (filterStatus.value === 'UNAVAILABLE' && normStatus === 'UNAVAILABLE')
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

// Synchronize search and filters with map pins
watch([search, filterStatus, filterType], () => {
  renderMarkers()
})

// ===================================
// LIFECYCLE HOOKS
// ===================================
onMounted(async () => {
  await Promise.all([loadStalls(), loadStakeholders(), loadContracts()])
  initModernLeafletMap()

  if (route.query.q) {
    search.value = String(route.query.q)
  }
  if (route.query.action === 'assign') {
    filterStatus.value = 'VACANT'
  }
  if (route.query.action === 'add') {
    openCreateStallModal()
  }
  if (route.query.assignStallId) {
    const targetStall = stalls.value.find((s) => String(s.id) === String(route.query.assignStallId))
    if (targetStall) {
      openAssignForStall(targetStall)
    }
  }
  if (route.query.assignStakeholderId) {
    const shId = String(route.query.assignStakeholderId)
    const targetSh = (stakeholders.value || []).find((s) => String(s.id) === shId)
    if (targetSh) {
      selectedStakeholder.value = targetSh
      stakeholderSearch.value = getPersonName(targetSh)
    }
  }
})

onBeforeUnmount(() => {
  delete window.__smOpenStallDetails
  delete window.__smAssignStall
  delete window.__smRelocateStall
  delete window.__smApproveAndContract
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

.badge-reserved,
.pill-reserved {
  background: #ea580c; /* Orange for Reserved */
}

.badge-unavailable,
.pill-unavailable {
  background: #64748b; /* Slate for Unavailable */
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

.sm-btn-approve {
  background: #ea580c;
  color: #ffffff;
}

.sm-btn-approve:hover {
  background: #c2410c;
}

.sm-popup-occupant-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 750;
  padding: 1.5px 6px;
  border-radius: 999px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.sm-popup-occupant-status.status-active {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.sm-popup-occupant-status.status-pending {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
}

.sm-popup-occupant-status .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  display: inline-block;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.sm-popup-occupant-status.status-pending .status-dot {
  background: #ea580c;
  box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.25);
}

.sm-btn-assign.sm-btn-reassign {
  background: #3b82f6;
  color: #ffffff;
}

.sm-btn-assign.sm-btn-reassign:hover {
  background: #2563eb;
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
