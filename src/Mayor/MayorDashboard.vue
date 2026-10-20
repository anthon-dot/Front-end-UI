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

    <!-- TABS NAVIGATION -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      <div class="flex border-b border-gray-200 px-4 pt-2 gap-4">
        <button
          class="py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2"
          :class="activeTab === 'loi' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'loi'"
        >
          <i class="pi pi-file-edit"></i>
          <span>LOI Approvals</span>
          <span v-if="pendingCount > 0" class="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
            {{ pendingCount }}
          </span>
        </button>

        <button
          class="py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2"
          :class="activeTab === 'revocations' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'revocations'"
        >
          <i class="pi pi-shield"></i>
          <span>Lease Revocations (90 Days Arrears)</span>
          <span v-if="flaggedRevocations.length > 0" class="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 font-bold">
            {{ flaggedRevocations.length }}
          </span>
        </button>

        <button
          class="py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2"
          :class="activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'history'"
        >
          <i class="pi pi-history"></i>
          <span>Decision History</span>
        </button>
      </div>

      <!-- TAB 1: LOI APPROVALS -->
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

      <!-- TAB 3: DECISION HISTORY -->
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
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const activeTab = ref('loi');
const isLoading = ref(false);
const isSubmitting = ref(false);

const applications = ref([]);
const flaggedRevocations = ref([]);
const activeContractsCount = ref(0);

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
    const appRes = await axios.get('/api/applications', { headers });
    applications.value = appRes.data?.applications || [];

    // 2. Fetch flagged revocations
    try {
      const delinqRes = await axios.get('/api/delinquency/flagged', { headers });
      flaggedRevocations.value = delinqRes.data?.flaggedContracts || [];
    } catch (e) {
      flaggedRevocations.value = [];
    }

    // 3. Fetch active contracts count
    try {
      const conRes = await axios.get('/api/contracts', { headers });
      const contracts = conRes.data?.contracts || [];
      activeContractsCount.value = contracts.filter((c) => c.status === 'ACTIVE').length;
    } catch (e) {
      activeContractsCount.value = 0;
    }
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
    await axios.put(
      `/api/applications/${selectedApp.value.id}/mayor-review`,
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
    alert(err.response?.data?.error || 'Failed to submit Mayoral decision.');
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
    await axios.post(
      '/api/delinquency/mayor-revocation',
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
    alert(err.response?.data?.error || 'Failed to authorize lease revocation.');
  } finally {
    isSubmitting.value = false;
  }
}

async function grantGracePeriod(item) {
  if (!confirm(`Grant 30-day grace period for ${item.vendorName}? Revocation flag will be deferred.`)) return;
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };
    await axios.post(
      '/api/delinquency/mayor-revocation',
      {
        contractId: item.contractId,
        approved: false,
        reason: 'Mayoral 30-day grace period granted upon vendor appeal.'
      },
      { headers }
    );
    await fetchData();
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to update case.');
  }
}

async function triggerDelinquencyScan() {
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };
    await axios.post('/api/delinquency/scan', {}, { headers });
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
