<template>
  <div class="mayor-dashboard p-4">
    <!-- EXECUTIVE HEADER -->
    <header class="mayor-header flex flex-wrap justify-between items-center mb-6 pb-4 border-b border-gray-200">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md">
            <i class="pi pi-crown text-2xl"></i>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-800 tracking-tight m-0">Office of the Municipal Mayor</h1>
            <p class="text-sm text-gray-500 m-0">Executive Review &bull; Letter of Intent Approvals & Lease Revocations</p>
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

    <!-- METRICS OVERVIEW -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs uppercase tracking-wider text-gray-500 font-semibold">LOIs Awaiting Approval</span>
          <div class="text-2xl font-bold text-amber-600 mt-1">{{ pendingCount }}</div>
          <span class="text-xs text-gray-400">Supervisor Endorsed</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <i class="pi pi-file-edit text-lg"></i>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs uppercase tracking-wider text-gray-500 font-semibold">Flagged for Revocation</span>
          <div class="text-2xl font-bold text-red-600 mt-1">{{ flaggedRevocations.length }}</div>
          <span class="text-xs text-red-500">90+ Days Arrears</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
          <i class="pi pi-exclamation-triangle text-lg"></i>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Mayoral Approvals</span>
          <div class="text-2xl font-bold text-emerald-600 mt-1">{{ approvedCount }}</div>
          <span class="text-xs text-gray-400">Approved LOIs</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <i class="pi pi-check-circle text-lg"></i>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs uppercase tracking-wider text-gray-500 font-semibold">Active Market Leases</span>
          <div class="text-2xl font-bold text-blue-600 mt-1">{{ activeContractsCount }}</div>
          <span class="text-xs text-gray-400">Executed Contracts</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <i class="pi pi-id-card text-lg"></i>
        </div>
      </div>
    </section>

    <!-- TOP NAV BAR FUNCTIONS (EXECUTIVE MAYOR) -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      <div class="flex border-b border-gray-200 px-4 pt-2 gap-2 overflow-x-auto">
        <button
          class="py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap"
          :class="activeTab === 'summary' ? 'border-amber-600 text-amber-700 bg-amber-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'summary'"
        >
          <i class="pi pi-chart-line"></i>
          <span>Executive Summary</span>
        </button>

        <button
          class="py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap"
          :class="activeTab === 'loi' ? 'border-amber-600 text-amber-700 bg-amber-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'loi'"
        >
          <i class="pi pi-file-edit"></i>
          <span>Pending Approvals</span>
          <span v-if="pendingCount > 0" class="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
            {{ pendingCount }}
          </span>
        </button>

        <button
          class="py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap"
          :class="activeTab === 'revocations' ? 'border-red-600 text-red-700 bg-red-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'revocations'"
        >
          <i class="pi pi-shield"></i>
          <span>Revocation Requests</span>
          <span v-if="flaggedRevocations.length > 0" class="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 font-bold">
            {{ flaggedRevocations.length }}
          </span>
        </button>

        <button
          class="py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap"
          :class="activeTab === 'reports' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'reports'"
        >
          <i class="pi pi-chart-bar"></i>
          <span>Reports</span>
        </button>

        <button
          class="py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap"
          :class="activeTab === 'history' ? 'border-slate-600 text-slate-700 bg-slate-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'history'"
        >
          <i class="pi pi-history"></i>
          <span>Decision History</span>
        </button>
      </div>

      <!-- TAB 0: EXECUTIVE SUMMARY -->
      <div v-if="activeTab === 'summary'" class="p-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 inline-block mb-1">
              EXECUTIVE BRIEFING & LGU METRICS
            </span>
            <h2 class="text-xl font-bold text-gray-900 m-0">Public Market Operational & Financial Health</h2>
            <p class="text-xs text-gray-500 m-0 mt-0.5">High-level strategic indicators for the Municipal Mayor & Executive Council</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
              @click="activeTab = 'loi'"
            >
              <i class="pi pi-file-edit"></i> Review Pending LOIs ({{ pendingCount }})
            </button>
            <button
              type="button"
              class="px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
              @click="activeTab = 'reports'"
            >
              <i class="pi pi-download"></i> Executive Report
            </button>
          </div>
        </div>

        <!-- 3 CORE PILLARS: TOTAL REVENUE, OCCUPANCY RATE, DELINQUENCY STATS -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <!-- Pillar 1: Total Revenue -->
          <div class="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-xl border border-emerald-200/80 shadow-xs">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Market Collections</span>
              <div class="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <i class="pi pi-wallet text-base"></i>
              </div>
            </div>
            <div class="text-3xl font-extrabold text-emerald-700">₱{{ Number(totalRevenueCollected).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</div>
            <p class="text-xs text-emerald-800 font-medium mt-1">Aggregated collections across all rental & rights channels</p>
            <div class="mt-4 pt-3 border-t border-emerald-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span class="text-gray-400 block">Stall Rights:</span>
                <span class="font-bold text-gray-800">₱{{ (approvedCount * 5000).toLocaleString() }}</span>
              </div>
              <div>
                <span class="text-gray-400 block">Advance Rent:</span>
                <span class="font-bold text-gray-800">₱{{ (approvedCount * 3000).toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <!-- Pillar 2: Market Occupancy Rate -->
          <div class="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-200/80 shadow-xs">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-blue-800 uppercase tracking-wider">Market Occupancy Rate</span>
              <div class="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <i class="pi pi-building text-base"></i>
              </div>
            </div>
            <div class="text-3xl font-extrabold text-blue-700">{{ occupancyPercentage }}%</div>
            <p class="text-xs text-blue-800 font-medium mt-1">{{ occupiedStallsCount }} of {{ totalMarketStalls }} physical stalls active</p>
            <div class="w-full bg-blue-100 rounded-full h-2.5 mt-4 overflow-hidden">
              <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: `${occupancyPercentage}%` }"></div>
            </div>
            <div class="mt-3 flex justify-between text-xs text-gray-500">
              <span>{{ availableStallsCount }} Stalls Available</span>
              <span>{{ activeContractsCount }} Active Leases</span>
            </div>
          </div>

          <!-- Pillar 3: Delinquency Stats -->
          <div class="bg-gradient-to-br from-rose-50 to-white p-5 rounded-xl border border-rose-200/80 shadow-xs">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-rose-800 uppercase tracking-wider">Delinquency Stats</span>
              <div class="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <i class="pi pi-exclamation-triangle text-base"></i>
              </div>
            </div>
            <div class="text-3xl font-extrabold text-rose-600">₱{{ Number(totalArrearsAmount).toLocaleString() }}</div>
            <p class="text-xs text-rose-700 font-medium mt-1">{{ flaggedRevocations.length }} accounts at 90+ days final stage</p>
            <div class="mt-4 pt-3 border-t border-rose-100 flex justify-between items-center text-xs">
              <span class="text-gray-500">Revocation Threshold:</span>
              <span class="font-bold text-rose-700">{{ flaggedRevocations.length }} Accounts Eviction-Ready</span>
            </div>
          </div>
        </div>

        <!-- Section Occupancy Matrix -->
        <div class="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <i class="pi pi-map-marker text-indigo-600"></i> Section Distribution & Physical Capacity
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div class="bg-white p-3 rounded-lg border border-gray-200">
              <span class="text-xs text-gray-500 font-medium">Wet Market (Fish & Meat)</span>
              <div class="text-lg font-bold text-gray-900 mt-1">12 / 14 Stalls</div>
              <span class="text-[11px] text-emerald-600 font-semibold">85% Occupied</span>
            </div>
            <div class="bg-white p-3 rounded-lg border border-gray-200">
              <span class="text-xs text-gray-500 font-medium">Dry Goods & Grains</span>
              <div class="text-lg font-bold text-gray-900 mt-1">10 / 12 Stalls</div>
              <span class="text-[11px] text-emerald-600 font-semibold">83% Occupied</span>
            </div>
            <div class="bg-white p-3 rounded-lg border border-gray-200">
              <span class="text-xs text-gray-500 font-medium">Fruits & Vegetables</span>
              <div class="text-lg font-bold text-gray-900 mt-1">8 / 10 Stalls</div>
              <span class="text-[11px] text-emerald-600 font-semibold">80% Occupied</span>
            </div>
            <div class="bg-white p-3 rounded-lg border border-gray-200">
              <span class="text-xs text-gray-500 font-medium">Commercial & Eatery</span>
              <div class="text-lg font-bold text-gray-900 mt-1">6 / 8 Stalls</div>
              <span class="text-[11px] text-emerald-600 font-semibold">75% Occupied</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 1: PENDING APPROVALS -->
      <div v-if="activeTab === 'loi'" class="p-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-gray-800 m-0">Endorsed Applications Awaiting Mayoral Decision</h2>
          <span class="text-xs text-gray-500">Step 5 & 6 of Application Workflow</span>
        </div>

        <div v-if="isLoading" class="text-center py-12 text-gray-400">
          <i class="pi pi-spin pi-spinner text-3xl"></i>
          <p class="mt-2 text-sm">Loading applications...</p>
        </div>

        <div v-else-if="pendingApplications.length === 0" class="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <i class="pi pi-check-circle text-4xl text-emerald-500 mb-2"></i>
          <p class="text-gray-700 font-semibold m-0">No pending LOIs awaiting Mayoral decision</p>
          <p class="text-gray-400 text-sm mt-1">All endorsed applications have been processed.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-b border-gray-200">
                <th class="py-3 px-4">Application</th>
                <th class="py-3 px-4">Applicant & Business</th>
                <th class="py-3 px-4">Stall Allocated</th>
                <th class="py-3 px-4">Calculated Fees</th>
                <th class="py-3 px-4">Endorsement Remarks</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="app in pendingApplications" :key="app.id" class="hover:bg-amber-50/40 transition-colors">
                <td class="py-3 px-4 font-mono font-medium text-gray-800">
                  {{ app.application_no || `APP-${app.id}` }}
                  <div class="text-xs text-gray-400">{{ formatDate(app.submitted_at) }}</div>
                </td>
                <td class="py-3 px-4">
                  <div class="font-semibold text-gray-900">
                    {{ app.stakeholder?.first_name }} {{ app.stakeholder?.last_name }}
                  </div>
                  <div class="text-xs text-gray-500">{{ app.stakeholder?.business_name }} &bull; {{ app.stakeholder?.business_type }}</div>
                </td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                    Stall #{{ app.stall?.stall_no || app.stall_id }}
                  </span>
                  <div class="text-xs text-gray-500 mt-0.5">{{ app.stall?.dimensions || '3x3m' }} ({{ app.stall?.rate_category || 'NEW' }})</div>
                </td>
                <td class="py-3 px-4 font-mono">
                  <div class="text-xs text-gray-500">Stall Rights: ₱{{ Number(app.calculated_stall_rights_fee || 5000).toLocaleString() }}</div>
                  <div class="text-xs text-gray-500">2 Mos Advance: ₱{{ Number(app.calculated_advance_rent || 3000).toLocaleString() }}</div>
                  <div class="font-bold text-gray-800">Total: ₱{{ Number(app.total_initial_amount_due || 8000).toLocaleString() }}</div>
                </td>
                <td class="py-3 px-4 text-xs text-gray-600 max-w-xs">
                  <p class="italic m-0">{{ app.supervisor_remarks || 'Endorsed for Mayoral Approval.' }}</p>
                  <div class="text-gray-400 mt-1">Endorsed on {{ formatDate(app.supervisor_endorsed_at) }}</div>
                </td>
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                      @click="openApprovalDialog(app)"
                    >
                      <i class="pi pi-check mr-1"></i> Approve LOI
                    </button>
                    <button
                      type="button"
                      class="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      @click="openRejectDialog(app)"
                    >
                      <i class="pi pi-times mr-1"></i> Reject
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: 90-DAY LEASE REVOCATIONS -->
      <div v-if="activeTab === 'revocations'" class="p-4">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-lg font-bold text-gray-800 m-0">Cases Flagged for Mayoral Lease Revocation</h2>
            <p class="text-xs text-gray-500 m-0">Vendors with 90+ days arrears who have received 1st, 2nd, and Final Demand Notices.</p>
          </div>
          <button
            type="button"
            class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            @click="triggerDelinquencyScan"
          >
            <i class="pi pi-search mr-1"></i> Scan Delinquency Arrears
          </button>
        </div>

        <div v-if="flaggedRevocations.length === 0" class="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <i class="pi pi-shield text-4xl text-emerald-500 mb-2"></i>
          <p class="text-gray-700 font-semibold m-0">No active leases currently flagged for revocation</p>
          <p class="text-gray-400 text-sm mt-1">All vendor accounts are within permissible payment horizons.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-b border-gray-200">
                <th class="py-3 px-4">Contract / Stall</th>
                <th class="py-3 px-4">Vendor Name</th>
                <th class="py-3 px-4">Overdue Balance</th>
                <th class="py-3 px-4">Due Date</th>
                <th class="py-3 px-4">Final Notice Sent</th>
                <th class="py-3 px-4 text-right">Mayoral Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in flaggedRevocations" :key="item.contractId" class="hover:bg-red-50/30 transition-colors">
                <td class="py-3 px-4">
                  <div class="font-mono font-bold text-gray-800">{{ item.contractNo }}</div>
                  <span class="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs mt-1">
                    Stall #{{ item.stallNo }}
                  </span>
                </td>
                <td class="py-3 px-4 font-semibold text-gray-800">
                  {{ item.vendorName }}
                </td>
                <td class="py-3 px-4 font-mono font-bold text-red-600">
                  ₱{{ Number(item.overdueBalance).toLocaleString() }}
                </td>
                <td class="py-3 px-4 text-xs text-gray-600">
                  {{ formatDate(item.dueDate) }}
                </td>
                <td class="py-3 px-4 text-xs text-gray-600">
                  {{ formatDate(item.finalNoticeSentAt) }}
                </td>
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                      @click="openRevokeDialog(item)"
                    >
                      <i class="pi pi-ban mr-1"></i> Authorize Revocation
                    </button>
                    <button
                      type="button"
                      class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      @click="grantGracePeriod(item)"
                    >
                      <i class="pi pi-clock mr-1"></i> Grant Grace Period
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 4: HIGH-LEVEL REPORTS FOR LGU PLANNING -->
      <div v-if="activeTab === 'reports'" class="p-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 inline-block mb-1">
              MUNICIPAL PLANNING & REVENUE AUDIT
            </span>
            <h2 class="text-xl font-bold text-gray-900 m-0">Executive Market Performance & Revenue Planning Report</h2>
            <p class="text-xs text-gray-500 m-0 mt-0.5">Comprehensive financial and occupancy statistics for the Sangguniang Bayan & Local Chief Executive</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
              @click="printReport"
            >
              <i class="pi pi-print"></i> Print Executive Report
            </button>
          </div>
        </div>

        <div class="printable-report bg-white p-6 rounded-xl border border-gray-200 space-y-6">
          <!-- Document Header -->
          <div class="text-center pb-6 border-b border-gray-200">
            <p class="text-xs uppercase tracking-widest text-gray-500 m-0">Republic of the Philippines</p>
            <p class="text-sm font-semibold text-gray-700 m-0">PROVINCE OF MISAMIS ORIENTAL &bull; MUNICIPALITY OF MANTICAO</p>
            <h3 class="text-lg font-bold text-gray-900 mt-1 m-0">OFFICE OF THE MUNICIPAL MAYOR</h3>
            <p class="text-xs text-indigo-600 font-semibold mt-1">MANTICAO PUBLIC MARKET RENTAL OPERATIONS REPORT</p>
            <p class="text-[11px] text-gray-400 mt-1">Generated: {{ new Date().toLocaleDateString('en-PH', { dateStyle: 'full' }) }}</p>
          </div>

          <!-- Section 1: Financial Snapshot -->
          <div>
            <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">1. Financial Collection Summary</h4>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
              <div class="p-4 bg-emerald-50/60 rounded-lg border border-emerald-100">
                <span class="text-xs text-emerald-800 font-semibold block">Total Collected Revenue</span>
                <span class="text-2xl font-black text-emerald-700">₱{{ Number(totalRevenueCollected).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                <span class="text-[11px] text-gray-500 block mt-1">Stall rights, rent & fees</span>
              </div>
              <div class="p-4 bg-blue-50/60 rounded-lg border border-blue-100">
                <span class="text-xs text-blue-800 font-semibold block">Active Lease Contracts</span>
                <span class="text-2xl font-black text-blue-700">{{ activeContractsCount }}</span>
                <span class="text-[11px] text-gray-500 block mt-1">3-Year Triennial Leases</span>
              </div>
              <div class="p-4 bg-amber-50/60 rounded-lg border border-amber-100">
                <span class="text-xs text-amber-800 font-semibold block">Mayoral Approved LOIs</span>
                <span class="text-2xl font-black text-amber-600">{{ approvedCount }}</span>
                <span class="text-[11px] text-gray-500 block mt-1">Stall Rights confirmed</span>
              </div>
              <div class="p-4 bg-rose-50/60 rounded-lg border border-rose-100">
                <span class="text-xs text-rose-800 font-semibold block">Arrears at Risk (90+ Days)</span>
                <span class="text-2xl font-black text-rose-600">₱{{ Number(totalArrearsAmount).toLocaleString() }}</span>
                <span class="text-[11px] text-gray-500 block mt-1">{{ flaggedRevocations.length }} Revocation Cases</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Stall Inventory & Occupancy -->
          <div>
            <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">2. Physical Stall Occupancy Matrix</h4>
            <table class="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead class="bg-gray-50 text-gray-700 uppercase font-bold">
                <tr>
                  <th class="py-2.5 px-3 border-b">Market Section</th>
                  <th class="py-2.5 px-3 border-b">Total Stalls</th>
                  <th class="py-2.5 px-3 border-b">Occupied</th>
                  <th class="py-2.5 px-3 border-b">Available</th>
                  <th class="py-2.5 px-3 border-b">Occupancy Rate</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr>
                  <td class="py-2 px-3 font-semibold text-gray-800">Wet Market (Fish, Meat, Poultry)</td>
                  <td class="py-2 px-3">14</td>
                  <td class="py-2 px-3 text-emerald-700 font-bold">12</td>
                  <td class="py-2 px-3 text-blue-700">2</td>
                  <td class="py-2 px-3 font-bold">85.7%</td>
                </tr>
                <tr>
                  <td class="py-2 px-3 font-semibold text-gray-800">Dry Goods, Grains & Groceries</td>
                  <td class="py-2 px-3">12</td>
                  <td class="py-2 px-3 text-emerald-700 font-bold">10</td>
                  <td class="py-2 px-3 text-blue-700">2</td>
                  <td class="py-2 px-3 font-bold">83.3%</td>
                </tr>
                <tr>
                  <td class="py-2 px-3 font-semibold text-gray-800">Fruits & Vegetables Section</td>
                  <td class="py-2 px-3">10</td>
                  <td class="py-2 px-3 text-emerald-700 font-bold">8</td>
                  <td class="py-2 px-3 text-blue-700">2</td>
                  <td class="py-2 px-3 font-bold">80.0%</td>
                </tr>
                <tr>
                  <td class="py-2 px-3 font-semibold text-gray-800">Commercial Eateries & Fast Food</td>
                  <td class="py-2 px-3">8</td>
                  <td class="py-2 px-3 text-emerald-700 font-bold">6</td>
                  <td class="py-2 px-3 text-blue-700">2</td>
                  <td class="py-2 px-3 font-bold">75.0%</td>
                </tr>
                <tr class="bg-gray-50 font-bold">
                  <td class="py-2.5 px-3">TOTAL MARKET OVERVIEW</td>
                  <td class="py-2.5 px-3">{{ totalMarketStalls }}</td>
                  <td class="py-2.5 px-3 text-emerald-700">{{ occupiedStallsCount }}</td>
                  <td class="py-2.5 px-3 text-blue-700">{{ availableStallsCount }}</td>
                  <td class="py-2.5 px-3 text-indigo-700">{{ occupancyPercentage }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 5: DECISION HISTORY -->
      <div v-if="activeTab === 'history'" class="p-4">
        <h2 class="text-lg font-bold text-gray-800 mb-4">Historical Mayoral Decisions</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-b border-gray-200">
                <th class="py-3 px-4">Application</th>
                <th class="py-3 px-4">Applicant</th>
                <th class="py-3 px-4">Stall</th>
                <th class="py-3 px-4">Decision</th>
                <th class="py-3 px-4">Date</th>
                <th class="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="app in decidedApplications" :key="app.id">
                <td class="py-3 px-4 font-mono font-medium">{{ app.application_no || `APP-${app.id}` }}</td>
                <td class="py-3 px-4">{{ app.stakeholder?.first_name }} {{ app.stakeholder?.last_name }}</td>
                <td class="py-3 px-4">Stall #{{ app.stall?.stall_no }}</td>
                <td class="py-3 px-4">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-bold"
                    :class="app.status === 'SUPERVISOR_REJECTED' || app.status === 'MAYOR_REJECTED' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'"
                  >
                    {{ app.status === 'MAYOR_REJECTED' ? 'REJECTED' : 'APPROVED' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-xs text-gray-500">{{ formatDate(app.mayor_approved_at || app.updated_at) }}</td>
                <td class="py-3 px-4 text-xs text-gray-600 italic">{{ app.mayor_remarks || 'None' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL: APPROVE LOI -->
    <div v-if="showApprovalModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <i class="pi pi-check-circle text-emerald-600"></i>
          Approve Letter of Intent
        </h3>
        <p class="text-sm text-gray-600 mb-4">
          Approving this Letter of Intent for <strong>{{ selectedApp?.stakeholder?.first_name }} {{ selectedApp?.stakeholder?.last_name }}</strong> will advance the application to <strong>PENDING_TREASURER_PAYMENT</strong> for recording of Stall Rights fee and 2-month advance rental.
        </p>

        <div class="mb-4">
          <label class="block text-xs font-semibold text-gray-700 uppercase mb-1">Mayoral Remarks / Executive Directive</label>
          <textarea
            v-model="decisionRemarks"
            rows="3"
            class="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Official executive approval note or instructions for Treasury..."
          ></textarea>
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            @click="showApprovalModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer"
            :disabled="isSubmitting"
            @click="submitMayorDecision(true)"
          >
            {{ isSubmitting ? 'Processing...' : 'Confirm Approval' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: REJECT LOI -->
    <div v-if="showRejectModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <h3 class="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
          <i class="pi pi-times-circle"></i>
          Reject Letter of Intent
        </h3>
        <p class="text-sm text-gray-600 mb-4">
          Rejecting this application will release Stall #{{ selectedApp?.stall?.stall_no }} back to <strong>AVAILABLE</strong> status.
        </p>

        <div class="mb-4">
          <label class="block text-xs font-semibold text-gray-700 uppercase mb-1">Reason for Rejection *</label>
          <textarea
            v-model="decisionRemarks"
            rows="3"
            class="w-full border border-red-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Specify reason for Mayoral rejection..."
            required
          ></textarea>
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            @click="showRejectModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer"
            :disabled="isSubmitting || !decisionRemarks.trim()"
            @click="submitMayorDecision(false)"
          >
            {{ isSubmitting ? 'Processing...' : 'Confirm Rejection' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: AUTHORIZE REVOCATION -->
    <div v-if="showRevokeModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <h3 class="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
          <i class="pi pi-ban"></i>
          Authorize Municipal Lease Revocation
        </h3>
        <p class="text-sm text-gray-600 mb-4">
          Contract <strong>{{ selectedRevocation?.contractNo }}</strong> for vendor <strong>{{ selectedRevocation?.vendorName }}</strong> has exceeded 90 days in arrears (Balance: ₱{{ Number(selectedRevocation?.overdueBalance).toLocaleString() }}).
          Authorizing revocation will cancel the contract, revoke the occupancy permit, archive the vendor record, and release Stall #{{ selectedRevocation?.stallNo }}.
        </p>

        <div class="mb-4">
          <label class="block text-xs font-semibold text-gray-700 uppercase mb-1">Revocation Order & Legal Basis *</label>
          <textarea
            v-model="revocationReason"
            rows="3"
            class="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Official executive revocation order statement..."
          ></textarea>
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            @click="showRevokeModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer"
            :disabled="isSubmitting"
            @click="executeRevocation"
          >
            {{ isSubmitting ? 'Revoking...' : 'Execute Revocation' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const activeTab = ref('summary');
const isLoading = ref(false);
const isSubmitting = ref(false);

const applications = ref([]);
const flaggedRevocations = ref([]);
const activeContractsCount = ref(0);
const totalRevenueCollected = ref(0);
const totalMarketStalls = ref(44);
const occupiedStallsCount = ref(36);

const availableStallsCount = computed(() => Math.max(0, totalMarketStalls.value - occupiedStallsCount.value));
const occupancyPercentage = computed(() => totalMarketStalls.value ? Math.round((occupiedStallsCount.value / totalMarketStalls.value) * 100) : 0);
const totalArrearsAmount = computed(() => flaggedRevocations.value.reduce((sum, r) => sum + Number(r.overdueBalance || 0), 0));

function printReport() {
  window.print();
}

const showApprovalModal = ref(false);
const showRejectModal = ref(false);
const showRevokeModal = ref(false);

const selectedApp = ref(null);
const selectedRevocation = ref(null);
const decisionRemarks = ref('');
const revocationReason = ref('');

const pendingApplications = computed(() => {
  return applications.value.filter(
    (app) => app.status === 'PENDING_MAYOR_APPROVAL' || (app.market_supervisor_approved && !app.mayor_decision)
  );
});

const decidedApplications = computed(() => {
  return applications.value.filter(
    (app) => app.mayor_decision || app.status === 'PENDING_TREASURER_PAYMENT' || app.status === 'PAID_READY_FOR_CONTRACT' || app.status === 'COMPLETED' || app.status === 'MAYOR_REJECTED'
  );
});

const pendingCount = computed(() => pendingApplications.value.length);
const approvedCount = computed(() => applications.value.filter((a) => a.mayor_decision === 'APPROVED' || a.mayor_approved_at).length);

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

async function fetchData() {
  isLoading.value = true;
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };

    // 1. Fetch applications
    try {
      const appRes = await api.get('/applications', { headers });
      applications.value = appRes.data?.applications || (Array.isArray(appRes.data) ? appRes.data : []);
    } catch (e) {
      applications.value = [];
    }

    // 2. Fetch flagged revocations
    try {
      const delinqRes = await api.get('/delinquency/flagged', { headers });
      flaggedRevocations.value = delinqRes.data?.flaggedContracts || (Array.isArray(delinqRes.data) ? delinqRes.data : []);
    } catch (e) {
      flaggedRevocations.value = [];
    }

    // 3. Fetch active contracts count
    try {
      const conRes = await api.get('/contracts', { headers });
      const contracts = conRes.data?.contracts || (Array.isArray(conRes.data) ? conRes.data : []);
      activeContractsCount.value = contracts.filter((c) => c.status === 'ACTIVE').length;
    } catch (e) {
      activeContractsCount.value = 0;
    }

    // 4. Fetch stalls for occupancy rate
    try {
      const stallRes = await api.get('/stalls', { headers });
      const stalls = stallRes.data?.stalls || (Array.isArray(stallRes.data) ? stallRes.data : []);
      if (stalls.length > 0) {
        totalMarketStalls.value = stalls.length;
        occupiedStallsCount.value = stalls.filter(s => s.status === 'OCCUPIED' || s.occupant_id).length;
      }
    } catch (e) {}

    // 5. Fetch payments for Total Revenue
    try {
      const payRes = await api.get('/payments', { headers });
      const payments = payRes.data?.payments || (Array.isArray(payRes.data) ? payRes.data : []);
      totalRevenueCollected.value = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    } catch (e) {}
  } catch (err) {
    console.error('[MAYOR] Fetch error:', err);
  } finally {
    isLoading.value = false;
  }
}

function openApprovalDialog(app) {
  selectedApp.value = app;
  decisionRemarks.value = 'Approved for municipal stall rights and 2-month advance rental payment.';
  showApprovalModal.value = true;
}

function openRejectDialog(app) {
  selectedApp.value = app;
  decisionRemarks.value = '';
  showRejectModal.value = true;
}

async function submitMayorDecision(approved) {
  if (!selectedApp.value) return;
  isSubmitting.value = true;
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };
    await api.put(
      `/applications/${selectedApp.value.id}/mayor-review`,
      {
        approved,
        remarks: decisionRemarks.value
      },
      { headers }
    );

    showApprovalModal.value = false;
    showRejectModal.value = false;
    selectedApp.value = null;
    await fetchData();
  } catch (err) {
    alert(err.response?.data?.error || err.message || 'Failed to submit Mayoral decision.');
  } finally {
    isSubmitting.value = false;
  }
}

function openRevokeDialog(item) {
  selectedRevocation.value = item;
  revocationReason.value = 'Authorized lease cancellation and stall repossession due to 90+ days continuous delinquency.';
  showRevokeModal.value = true;
}

async function executeRevocation() {
  if (!selectedRevocation.value) return;
  isSubmitting.value = true;
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };
    await api.post(
      '/delinquency/mayor-revocation',
      {
        contractId: selectedRevocation.value.contractId,
        approved: true,
        reason: revocationReason.value
      },
      { headers }
    );

    showRevokeModal.value = false;
    selectedRevocation.value = null;
    await fetchData();
  } catch (err) {
    alert(err.response?.data?.error || err.message || 'Failed to authorize lease revocation.');
  } finally {
    isSubmitting.value = false;
  }
}

async function grantGracePeriod(item) {
  if (!confirm(`Grant 30-day grace period for ${item.vendorName}? Revocation flag will be deferred.`)) return;
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };
    await api.post(
      '/delinquency/mayor-revocation',
      {
        contractId: item.contractId,
        approved: false,
        reason: 'Mayoral 30-day grace period granted upon vendor appeal.'
      },
      { headers }
    );
    await fetchData();
  } catch (err) {
    alert(err.response?.data?.error || err.message || 'Failed to update case.');
  }
}

async function triggerDelinquencyScan() {
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };
    await api.post('/delinquency/scan', {}, { headers });
    await fetchData();
  } catch (err) {
    alert('Scan error: ' + (err.response?.data?.error || err.message));
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.mayor-dashboard {
  min-height: 100vh;
  background-color: #f8fafc;
}
</style>
