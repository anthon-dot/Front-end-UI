<template>
  <div class="collector-dashboard p-4">
    <!-- HEADER -->
    <header class="flex flex-wrap justify-between items-center mb-6 pb-4 border-b border-gray-200">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
            <i class="pi pi-qrcode text-2xl"></i>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-800 tracking-tight m-0">Field Market Operations & Inspection</h1>
            <p class="text-sm text-gray-500 m-0">Field Collections, Remittance Batches, Physical Stall Setup Inspections & QR Permit Scans</p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 mt-3 md:mt-0">
        <button
          type="button"
          class="p-button p-button-outlined p-button-sm flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer text-gray-700 font-medium"
          @click="fetchData"
          :disabled="isLoading"
        >
          <i class="pi pi-refresh" :class="{ 'pi-spin': isLoading }"></i>
          <span>{{ isLoading ? 'Refreshing...' : 'Refresh' }}</span>
        </button>
      </div>
    </header>

    <!-- METRIC CARDS -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs uppercase tracking-wider text-gray-500 font-semibold">Today's Collections</span>
          <div class="text-2xl font-bold text-teal-600 mt-1">₱{{ Number(todayTotalAmount).toLocaleString() }}</div>
          <span class="text-xs text-gray-400">{{ todayCollections.length }} micro-payments recorded</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
          <i class="pi pi-wallet text-lg"></i>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs uppercase tracking-wider text-gray-500 font-semibold">Unremitted Collections</span>
          <div class="text-2xl font-bold text-amber-600 mt-1">₱{{ Number(unremittedTotal).toLocaleString() }}</div>
          <span class="text-xs text-amber-600 font-medium">{{ unremittedCollections.length }} pending batch</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <i class="pi pi-inbox text-lg"></i>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs uppercase tracking-wider text-gray-500 font-semibold">Stalls Awaiting Inspection</span>
          <div class="text-2xl font-bold text-blue-600 mt-1">{{ pendingInspections.length }}</div>
          <span class="text-xs text-gray-400">Physical verification required</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <i class="pi pi-check-square text-lg"></i>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs uppercase tracking-wider text-gray-500 font-semibold">Remittance Batches</span>
          <div class="text-2xl font-bold text-emerald-600 mt-1">{{ remittances.length }}</div>
          <span class="text-xs text-gray-400">Total submitted</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <i class="pi pi-send text-lg"></i>
        </div>
      </div>
    </section>

    <!-- TABS -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      <div class="flex border-b border-gray-200 px-4 pt-2 gap-4">
        <button
          class="py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2"
          :class="activeTab === 'collections' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'collections'"
        >
          <i class="pi pi-wallet"></i>
          <span>Field Collections</span>
        </button>

        <button
          class="py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2"
          :class="activeTab === 'remittance' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'remittance'"
        >
          <i class="pi pi-send"></i>
          <span>Treasury Remittance</span>
          <span v-if="unremittedCollections.length > 0" class="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
            {{ unremittedCollections.length }}
          </span>
        </button>

        <button
          class="py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2"
          :class="activeTab === 'inspections' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'inspections'"
        >
          <i class="pi pi-check-square"></i>
          <span>Stall Setup Inspections</span>
          <span v-if="pendingInspections.length > 0" class="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-bold">
            {{ pendingInspections.length }}
          </span>
        </button>

        <button
          class="py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2"
          :class="activeTab === 'scanner' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'scanner'"
        >
          <i class="pi pi-qrcode"></i>
          <span>QR Permit Inspector</span>
        </button>
      </div>

      <!-- TAB 1: FIELD COLLECTIONS -->
      <div v-if="activeTab === 'collections'" class="p-4">
        <div class="flex flex-wrap justify-between items-center mb-4 gap-2">
          <div>
            <h2 class="text-lg font-bold text-gray-800 m-0">Daily Micro-Collections (₱100/day)</h2>
            <p class="text-xs text-gray-500 m-0">Record cash collections directly in the field. Updates balance atomically.</p>
          </div>
          <button
            type="button"
            class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer flex items-center gap-1.5"
            @click="showCollectionModal = true"
          >
            <i class="pi pi-plus"></i> Record Field Collection
          </button>
        </div>

        <div v-if="collections.length === 0" class="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <i class="pi pi-inbox text-4xl text-gray-400 mb-2"></i>
          <p class="text-gray-700 font-semibold m-0">No field collections recorded yet</p>
          <p class="text-gray-400 text-sm mt-1">Click "Record Field Collection" to log daily market vendor collections.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-b border-gray-200">
                <th class="py-3 px-4">Receipt No</th>
                <th class="py-3 px-4">Stall / Vendor</th>
                <th class="py-3 px-4">Amount</th>
                <th class="py-3 px-4">Date & Time</th>
                <th class="py-3 px-4">Remittance Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="c in collections" :key="c.id" class="hover:bg-teal-50/30 transition-colors">
                <td class="py-3 px-4 font-mono font-medium text-gray-800">{{ c.receipt_no }}</td>
                <td class="py-3 px-4">
                  <div class="font-semibold text-gray-900">{{ c.vendor_name || c.stakeholder?.business_name || 'Vendor' }}</div>
                  <div class="text-xs text-gray-500">Stall #{{ c.stall_no || c.stakeholder?.selected_stall_id }}</div>
                </td>
                <td class="py-3 px-4 font-mono font-bold text-teal-700">₱{{ Number(c.amount).toLocaleString() }}</td>
                <td class="py-3 px-4 text-xs text-gray-500">{{ formatDateTime(c.payment_date || c.created_at) }}</td>
                <td class="py-3 px-4">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-bold"
                    :class="c.remittance_id ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                  >
                    {{ c.remittance_id ? 'REMITTED' : 'UNREMITTED' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: TREASURY REMITTANCE -->
      <div v-if="activeTab === 'remittance'" class="p-4">
        <div class="flex flex-wrap justify-between items-center mb-4 gap-2">
          <div>
            <h2 class="text-lg font-bold text-gray-800 m-0">Treasury Remittance Batches</h2>
            <p class="text-xs text-gray-500 m-0">Batch unremitted field collections and reconcile with the Municipal Treasury.</p>
          </div>
          <button
            v-if="unremittedCollections.length > 0"
            type="button"
            class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer flex items-center gap-1.5"
            @click="submitRemittanceBatch"
            :disabled="isSubmitting"
          >
            <i class="pi pi-send"></i> Submit Batch of {{ unremittedCollections.length }} (₱{{ Number(unremittedTotal).toLocaleString() }})
          </button>
        </div>

        <div v-if="remittances.length === 0" class="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <i class="pi pi-send text-4xl text-gray-400 mb-2"></i>
          <p class="text-gray-700 font-semibold m-0">No remittances submitted yet</p>
          <p class="text-gray-400 text-sm mt-1">Collections will appear here once submitted for Treasury reconciliation.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-b border-gray-200">
                <th class="py-3 px-4">Remittance No</th>
                <th class="py-3 px-4">Collector</th>
                <th class="py-3 px-4">Total Amount</th>
                <th class="py-3 px-4">Collections Count</th>
                <th class="py-3 px-4">Submitted Date</th>
                <th class="py-3 px-4">Treasury Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="rem in remittances" :key="rem.id">
                <td class="py-3 px-4 font-mono font-medium text-gray-800">{{ rem.remittance_no }}</td>
                <td class="py-3 px-4">{{ rem.collector_name }}</td>
                <td class="py-3 px-4 font-mono font-bold text-gray-900">₱{{ Number(rem.total_amount).toLocaleString() }}</td>
                <td class="py-3 px-4 text-xs text-gray-600">{{ rem.collection_count }} receipts</td>
                <td class="py-3 px-4 text-xs text-gray-500">{{ formatDateTime(rem.created_at) }}</td>
                <td class="py-3 px-4">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-bold"
                    :class="rem.status === 'RECONCILED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                  >
                    {{ rem.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: STALL SETUP INSPECTIONS -->
      <div v-if="activeTab === 'inspections'" class="p-4">
        <div class="mb-4">
          <h2 class="text-lg font-bold text-gray-800 m-0">Physical Stall Setup Inspections (Step 14)</h2>
          <p class="text-xs text-gray-500 m-0">Verify physical stall condition (electrical, structural, fire safety, sanitation) before commercial clearance.</p>
        </div>

        <div v-if="pendingInspections.length === 0" class="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <i class="pi pi-check-circle text-4xl text-emerald-500 mb-2"></i>
          <p class="text-gray-700 font-semibold m-0">No stalls currently pending inspection</p>
          <p class="text-gray-400 text-sm mt-1">All executed leases have completed physical stall verification.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-b border-gray-200">
                <th class="py-3 px-4">Application</th>
                <th class="py-3 px-4">Stall Allocated</th>
                <th class="py-3 px-4">Applicant & Business</th>
                <th class="py-3 px-4">Contract Status</th>
                <th class="py-3 px-4 text-right">Inspect Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="app in pendingInspections" :key="app.id" class="hover:bg-blue-50/30 transition-colors">
                <td class="py-3 px-4 font-mono font-medium">{{ app.application_no || `APP-${app.id}` }}</td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                    Stall #{{ app.stall?.stall_no || app.stall_id }}
                  </span>
                  <div class="text-xs text-gray-500 mt-0.5">{{ app.stall?.dimensions || '3x3m' }} &bull; {{ app.stall?.section?.name || 'Main' }}</div>
                </td>
                <td class="py-3 px-4">
                  <div class="font-semibold text-gray-900">{{ app.stakeholder?.first_name }} {{ app.stakeholder?.last_name }}</div>
                  <div class="text-xs text-gray-500">{{ app.stakeholder?.business_name }}</div>
                </td>
                <td class="py-3 px-4">
                  <span class="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                    3-Year Lease Executed
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <button
                    type="button"
                    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
                    @click="openInspectionModal(app)"
                  >
                    <i class="pi pi-check-square mr-1"></i> Conduct Inspection
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 4: QR PERMIT INSPECTOR -->
      <div v-if="activeTab === 'scanner'" class="p-4">
        <h2 class="text-lg font-bold text-gray-800 mb-2">Authenticated Inspector Permit Scanner</h2>
        <p class="text-xs text-gray-500 mb-4">
          Enter Permit Number or SHA-256 Hash to verify permit validity, inspect safety clearance, and review delinquency flags.
        </p>

        <div class="flex gap-2 max-w-xl mb-6">
          <input
            v-model="scanIdentifier"
            type="text"
            class="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. MNT-PERMIT-2026-0001 or SHA-256 hash..."
            @keyup.enter="performInspectorScan"
          />
          <button
            type="button"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold cursor-pointer"
            :disabled="isScanning || !scanIdentifier.trim()"
            @click="performInspectorScan"
          >
            <i class="pi pi-search mr-1"></i> Verify Permit
          </button>
        </div>

        <!-- SCAN RESULT DISPLAY -->
        <div v-if="scanResult" class="bg-gray-50 rounded-xl border border-gray-200 p-6 max-w-2xl">
          <div class="flex justify-between items-start border-b border-gray-200 pb-4 mb-4">
            <div>
              <span class="text-xs uppercase font-bold text-gray-500">Municipal Occupancy Permit</span>
              <h3 class="text-xl font-bold text-gray-800 m-0">{{ scanResult.permit_no }}</h3>
            </div>
            <span
              class="px-3 py-1 rounded-full text-xs font-bold"
              :class="scanResult.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'"
            >
              {{ scanResult.status }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span class="text-xs text-gray-400">Tenant / Vendor:</span>
              <div class="font-semibold text-gray-800">{{ scanResult.vendor_name }}</div>
            </div>
            <div>
              <span class="text-xs text-gray-400">Assigned Stall:</span>
              <div class="font-semibold text-gray-800">Stall #{{ scanResult.stall_no }}</div>
            </div>
            <div>
              <span class="text-xs text-gray-400">Contract Ref:</span>
              <div class="font-mono text-gray-700">{{ scanResult.contract_no }}</div>
            </div>
            <div>
              <span class="text-xs text-gray-400">Valid Horizon:</span>
              <div class="text-gray-700">{{ formatDate(scanResult.issue_date) }} &ndash; {{ formatDate(scanResult.expiration_date) }}</div>
            </div>
          </div>

          <!-- DELINQUENCY ALERT -->
          <div v-if="scanResult.delinquent" class="p-3 bg-red-100 border border-red-200 rounded-lg text-xs text-red-800 font-semibold mb-4">
            <i class="pi pi-exclamation-triangle mr-1"></i>
            OVERDUE ARREARS: Vendor has an outstanding balance of ₱{{ Number(scanResult.overdue_amount).toLocaleString() }}!
          </div>

          <div class="text-xs font-mono text-gray-400 break-all">
            SHA-256 Digest: {{ scanResult.integrity_hash }}
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: RECORD FIELD COLLECTION -->
    <div v-if="showCollectionModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <i class="pi pi-wallet text-teal-600"></i>
          Record Field Micro-Collection
        </h3>
        <p class="text-xs text-gray-500 mb-4">Record ₱100/day daily micro-collection directly from the stallholder.</p>

        <div class="space-y-3 mb-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Stall *</label>
            <select
              v-model="collectionForm.stallId"
              class="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              @change="onStallSelected"
            >
              <option value="" disabled>-- Select occupied stall --</option>
              <option v-for="s in occupiedStalls" :key="s.id" :value="s.id">
                Stall #{{ s.stall_no }} &bull; {{ s.occupant?.stakeholder?.business_name || 'Vendor' }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-1">Amount (₱) *</label>
            <input
              v-model.number="collectionForm.amount"
              type="number"
              step="10"
              class="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
              placeholder="100.00"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-1">Notes / Remarks</label>
            <input
              v-model="collectionForm.notes"
              type="text"
              class="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Daily rental collection..."
            />
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            @click="showCollectionModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer"
            :disabled="isSubmitting || !collectionForm.stallId || !collectionForm.amount"
            @click="submitFieldCollection"
          >
            {{ isSubmitting ? 'Recording...' : 'Record Payment' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: CONDUCT STALL SETUP INSPECTION -->
    <div v-if="showInspectionModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <i class="pi pi-check-square text-blue-600"></i>
          Conduct Stall Setup Physical Inspection
        </h3>
        <p class="text-xs text-gray-500 mb-4">
          Inspecting Stall #{{ selectedInspectionApp?.stall?.stall_no }} for {{ selectedInspectionApp?.stakeholder?.business_name }}. Verify each physical setup safety condition.
        </p>

        <div class="space-y-3 mb-4">
          <label class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
            <input type="checkbox" v-model="inspectionForm.electricalClearance" class="w-4 h-4 text-blue-600" />
            <div>
              <div class="text-sm font-semibold text-gray-800">Electrical Clearance</div>
              <div class="text-xs text-gray-500">Wiring compliant, circuit breaker installed, no exposed wires.</div>
            </div>
          </label>

          <label class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
            <input type="checkbox" v-model="inspectionForm.structuralClearance" class="w-4 h-4 text-blue-600" />
            <div>
              <div class="text-sm font-semibold text-gray-800">Structural Clearance</div>
              <div class="text-xs text-gray-500">Within 3x3m boundary, no unauthorized physical extensions.</div>
            </div>
          </label>

          <label class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
            <input type="checkbox" v-model="inspectionForm.fireSafetyClearance" class="w-4 h-4 text-blue-600" />
            <div>
              <div class="text-sm font-semibold text-gray-800">Fire Safety Clearance</div>
              <div class="text-xs text-gray-500">Fire extinguisher accessible, no flammables blocking pathway.</div>
            </div>
          </label>

          <label class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
            <input type="checkbox" v-model="inspectionForm.sanitationClearance" class="w-4 h-4 text-blue-600" />
            <div>
              <div class="text-sm font-semibold text-gray-800">Sanitation & Drainage Clearance</div>
              <div class="text-xs text-gray-500">Clean drainage connectivity, proper trash segregation bin.</div>
            </div>
          </label>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-1">Inspector Remarks</label>
            <textarea
              v-model="inspectionForm.remarks"
              rows="2"
              class="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Physical stall setup observations..."
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            @click="showInspectionModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer"
            :disabled="isSubmitting"
            @click="submitInspectionDecision"
          >
            {{ isSubmitting ? 'Recording...' : 'Submit Clearance (PASSED)' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const activeTab = ref('collections');
const isLoading = ref(false);
const isSubmitting = ref(false);
const isScanning = ref(false);

const collections = ref([]);
const remittances = ref([]);
const applications = ref([]);
const occupiedStalls = ref([]);

const showCollectionModal = ref(false);
const showInspectionModal = ref(false);

const scanIdentifier = ref('');
const scanResult = ref(null);

const selectedInspectionApp = ref(null);

const collectionForm = ref({
  stallId: '',
  stakeholderId: null,
  amount: 100,
  notes: 'Daily field market collection'
});

const inspectionForm = ref({
  electricalClearance: true,
  structuralClearance: true,
  fireSafetyClearance: true,
  sanitationClearance: true,
  remarks: 'Physical stall setup inspected and verified safe.'
});

const todayStr = new Date().toISOString().split('T')[0];

const todayCollections = computed(() => {
  return collections.value.filter((c) => {
    const d = (c.payment_date || c.created_at || '').split('T')[0];
    return d === todayStr;
  });
});

const todayTotalAmount = computed(() => {
  return todayCollections.value.reduce((sum, c) => sum + Number(c.amount || 0), 0);
});

const unremittedCollections = computed(() => {
  return collections.value.filter((c) => !c.remittance_id);
});

const unremittedTotal = computed(() => {
  return unremittedCollections.value.reduce((sum, c) => sum + Number(c.amount || 0), 0);
});

const pendingInspections = computed(() => {
  return applications.value.filter(
    (app) => app.status === 'PENDING_INSPECTION' || (app.contract_executed_at && !app.hazard_free_confirmed && app.status !== 'COMPLETED')
  );
});

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function fetchData() {
  isLoading.value = true;
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };

    // 1. Fetch remittances
    try {
      const remRes = await axios.get('/api/collections/remittances', { headers });
      remittances.value = remRes.data?.remittances || [];
    } catch (e) {
      remittances.value = [];
    }

    // 2. Fetch applications
    try {
      const appRes = await axios.get('/api/applications', { headers });
      applications.value = appRes.data?.applications || [];
    } catch (e) {
      applications.value = [];
    }

    // 3. Fetch occupied stalls
    try {
      const stallRes = await axios.get('/api/stalls', { headers });
      const stalls = stallRes.data?.stalls || [];
      occupiedStalls.value = stalls.filter((s) => s.status === 'OCCUPIED' || s.occupant_id);
    } catch (e) {
      occupiedStalls.value = [];
    }

    // 4. Fetch payments / field collections
    try {
      const payRes = await axios.get('/api/payments', { headers });
      const allPayments = payRes.data?.payments || [];
      collections.value = allPayments.filter((p) => p.payment_channel === 'FIELD_COLLECTOR' || p.payment_type === 'FIELD_COLLECTION');
    } catch (e) {
      collections.value = [];
    }
  } catch (err) {
    console.error('[COLLECTOR] Fetch error:', err);
  } finally {
    isLoading.value = false;
  }
}

function onStallSelected() {
  const stall = occupiedStalls.value.find((s) => s.id === Number(collectionForm.value.stallId));
  if (stall?.occupant?.stakeholder_id) {
    collectionForm.value.stakeholderId = stall.occupant.stakeholder_id;
  }
}

async function submitFieldCollection() {
  isSubmitting.value = true;
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };
    await axios.post(
      '/api/collections/field',
      {
        stallId: collectionForm.value.stallId,
        stakeholderId: collectionForm.value.stakeholderId,
        amount: collectionForm.value.amount,
        notes: collectionForm.value.notes
      },
      { headers }
    );

    showCollectionModal.value = false;
    collectionForm.value.stallId = '';
    collectionForm.value.amount = 100;
    await fetchData();
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to record field collection.');
  } finally {
    isSubmitting.value = false;
  }
}

async function submitRemittanceBatch() {
  if (unremittedCollections.value.length === 0) return;
  if (!confirm(`Submit ${unremittedCollections.value.length} field collections totaling ₱${unremittedTotal.value.toLocaleString()} to Municipal Treasury?`)) return;

  isSubmitting.value = true;
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };
    await axios.post(
      '/api/collections/remittances',
      {
        collectionIds: unremittedCollections.value.map((c) => c.id),
        remarks: 'Daily field market collection batch remittance'
      },
      { headers }
    );

    await fetchData();
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to submit remittance batch.');
  } finally {
    isSubmitting.value = false;
  }
}

function openInspectionModal(app) {
  selectedInspectionApp.value = app;
  inspectionForm.value.electricalClearance = true;
  inspectionForm.value.structuralClearance = true;
  inspectionForm.value.fireSafetyClearance = true;
  inspectionForm.value.sanitationClearance = true;
  inspectionForm.value.remarks = 'Physical stall setup inspected and verified compliant with municipal standards.';
  showInspectionModal.value = true;
}

async function submitInspectionDecision() {
  if (!selectedInspectionApp.value) return;
  isSubmitting.value = true;
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };
    await axios.put(
      `/api/applications/${selectedInspectionApp.value.id}/inspector-verify`,
      {
        electricalClearance: inspectionForm.value.electricalClearance,
        structuralClearance: inspectionForm.value.structuralClearance,
        fireSafetyClearance: inspectionForm.value.fireSafetyClearance,
        sanitationClearance: inspectionForm.value.sanitationClearance,
        status: 'PASSED',
        remarks: inspectionForm.value.remarks
      },
      { headers }
    );

    showInspectionModal.value = false;
    selectedInspectionApp.value = null;
    await fetchData();
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to record stall setup inspection.');
  } finally {
    isSubmitting.value = false;
  }
}

async function performInspectorScan() {
  if (!scanIdentifier.value.trim()) return;
  isScanning.value = true;
  scanResult.value = null;
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };
    const res = await axios.get(`/api/permits/inspect/${encodeURIComponent(scanIdentifier.value.trim())}`, { headers });
    scanResult.value = res.data?.permit || res.data;
  } catch (err) {
    alert(err.response?.data?.error || 'Permit not found or invalid.');
  } finally {
    isScanning.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.collector-dashboard {
  min-height: 100vh;
  background-color: #f8fafc;
}
</style>
