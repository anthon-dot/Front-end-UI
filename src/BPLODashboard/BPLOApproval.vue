<template>
  <section class="approval-surface">
    <div v-if="toast.text" :class="['toast', toast.type]">{{ toast.text }}</div>

    <div class="toolbar">
      <div style="flex: 1; max-width: 320px;">
        <SearchField v-model="search" placeholder="Search applicant or business..." />
      </div>
      <select v-model="filter" class="control">
        <option value="READY">Ready for BPLO review</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
        <option value="ALL">All</option>
      </select>
    </div>

    <div class="table-card">
      <div v-if="loading" class="loading"><span class="spinner"></span>Loading applications</div>
      <table v-else class="approval-table">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Business</th>
            <th>Hazard-Free</th>
            <th>Endorsing</th>
            <th>BPLO</th>
            <th>Final</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in paginated" :key="app.id">
            <td><strong>{{ fullName(app) }}</strong><small>{{ app.email || 'No email' }}</small></td>
            <td>{{ app.businessName }}</td>
            <td>
              <span v-if="app.hazardFreeConfirmed || app.hazardFreeDocumentUrl" class="badge approved" title="Hazard-Free Confirmation verified">
                <a v-if="app.hazardFreeDocumentUrl" :href="app.hazardFreeDocumentUrl" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">Verified ↗</a>
                <span v-else>Verified</span>
              </span>
              <span v-else class="badge pending" title="Stakeholder has not uploaded confirmation yet">Pending</span>
            </td>
            <td><span :class="badge(app.endorsingStatus || app.endorsementStatus)">{{ app.endorsingStatus || app.endorsementStatus || 'PENDING' }}</span></td>
            <td><span :class="badge(app.bploStatus)">{{ app.bploStatus || 'PENDING' }}</span></td>
            <td><span :class="badge(app.finalStatus)">{{ app.finalStatus || 'PENDING' }}</span></td>
            <td class="row-actions">
              <button class="btn ghost" type="button" @click="selected = app">View</button>
              <button
                v-if="!app.bploStatus || app.bploStatus === 'PENDING' || app.applicationStatus === 'PENDING_BPLO_ASSESSMENT'"
                class="btn primary"
                type="button"
                @click="openAssess(app)"
              >
                Assess Fee
              </button>
              <button
                v-else-if="!app.businessPermitFeePaid && !app.business_permit_fee_paid"
                class="btn ghost"
                type="button"
                disabled
                title="Waiting for Treasurer payment confirmation"
                style="font-size:0.78rem;opacity:0.75"
              >
                Awaiting Payment
              </button>
              <button
                v-else-if="app.bploStatus !== 'RELEASED'"
                class="btn primary"
                type="button"
                style="background:#059669;border-color:#059669;color:#fff"
                @click="releasePermit(app)"
              >
                Release Permit
              </button>
              <span v-else class="badge approved">Released</span>
              <button class="btn danger" type="button" :disabled="app.bploStatus === 'RELEASED'" @click="openReject(app)">Reject</button>
            </td>
          </tr>
          <tr v-if="paginated.length === 0">
            <td class="empty" colspan="7">No applications match this view.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button class="btn ghost" type="button" :disabled="page === 1" @click="page--">Prev</button>
      <span>Page {{ page }} of {{ pageCount }}</span>
      <button class="btn ghost" type="button" :disabled="page === pageCount" @click="page++">Next</button>
    </div>

    <!-- Details Modal -->
    <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
      <div class="modal">
        <header><h3>{{ fullName(selected) }}</h3><button class="x" @click="selected = null">x</button></header>
        <dl>
          <div><dt>Business</dt><dd>{{ selected.businessName }}</dd></div>
          <div><dt>Type</dt><dd>{{ selected.businessType }}</dd></div>
          <div><dt>Assessed Fee</dt><dd>₱{{ Number(selected.businessPermitFeeAssessed || selected.business_permit_fee_assessed || 0).toLocaleString() }}</dd></div>
          <div><dt>Fee Payment</dt><dd>{{ (selected.businessPermitFeePaid || selected.business_permit_fee_paid) ? 'Confirmed Paid (Treasury)' : 'Pending Payment' }}</dd></div>
          <div><dt>Address</dt><dd>{{ selected.address }}</dd></div>
          <div class="documents-section">
            <dt style="font-size:0.95rem;font-weight:700;color:#0f172a;margin-bottom:8px">Uploaded Documents</dt>
            <dd style="margin:0">
              <div style="display:grid;gap:8px">
                <!-- Valid ID -->
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
                  <div>
                    <strong style="display:block;font-size:0.88rem;color:#1e293b">Valid Government ID</strong>
                    <small style="color:#64748b">{{ selected.idDocumentName || 'Valid ID Document' }}</small>
                  </div>
                  <a
                    v-if="selected.idDocumentUrl"
                    :href="selected.idDocumentUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="color:#2563eb;font-weight:700;font-size:0.85rem;text-decoration:underline;display:inline-flex;align-items:center;gap:4px"
                  >
                    View ID ↗
                  </a>
                  <span v-else style="color:#94a3b8;font-size:0.8rem;font-style:italic">Not provided</span>
                </div>

                <!-- Letter of Intent -->
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
                  <div>
                    <strong style="display:block;font-size:0.88rem;color:#1e293b">Letter of Intent</strong>
                    <small style="color:#64748b">{{ selected.letterDocumentName || 'Application Letter' }}</small>
                  </div>
                  <a
                    v-if="selected.letterDocumentUrl"
                    :href="selected.letterDocumentUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="color:#2563eb;font-weight:700;font-size:0.85rem;text-decoration:underline;display:inline-flex;align-items:center;gap:4px"
                  >
                    View Letter ↗
                  </a>
                  <span v-else style="color:#94a3b8;font-size:0.8rem;font-style:italic">Not provided</span>
                </div>

                <!-- Hazard-Free Stall Confirmation -->
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
                  <div>
                    <strong style="display:block;font-size:0.88rem;color:#1e293b">Hazard-Free Stall Setup Inspection</strong>
                    <small style="color:#64748b">{{ selected.hazardFreeFileName || 'Inspection Certificate' }}</small>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span v-if="selected.hazardFreeConfirmed || selected.hazardFreeDocumentUrl" class="badge approved">Verified</span>
                    <span v-else class="badge pending">Pending</span>
                  </div>
                </div>
              </div>
            </dd>
          </div>
          <div><dt>Remarks</dt><dd>{{ selected.remarks || selected.bploRemarks || selected.bplo_remarks || '-' }}</dd></div>
        </dl>
      </div>
    </div>

    <!-- Fee Assessment Modal -->
    <div v-if="assessing" class="modal-backdrop" @click.self="assessing = null">
      <form class="modal" @submit.prevent="submitAssessment">
        <header>
          <h3>Assess Business Permit Fee</h3>
          <button class="x" type="button" @click="assessing = null">x</button>
        </header>
        <p style="font-size:0.88rem;color:#64748b;margin-bottom:12px">
          Applicant: <strong>{{ fullName(assessing) }}</strong> — Business: <strong>{{ assessing.businessName }}</strong> ({{ assessing.businessType }})
        </p>
        <div style="display:grid;gap:12px;margin-bottom:16px">
          <div>
            <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:4px">Assessed Business Permit Fee (₱)</label>
            <input v-model.number="feeAmount" type="number" min="0" step="50" class="control" required style="width:100%" />
          </div>
          <div>
            <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:4px">Assessment Remarks</label>
            <textarea v-model="remarks" class="remarks" rows="3" placeholder="Enter line of business inspection remarks..."></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn ghost" type="button" @click="assessing = null">Cancel</button>
          <button class="btn primary" type="submit">Save Assessment & Forward to Treasury</button>
        </div>
      </form>
    </div>

    <!-- Rejection Modal -->
    <div v-if="rejecting" class="modal-backdrop" @click.self="rejecting = null">
      <form class="modal" @submit.prevent="reject">
        <header><h3>Reject application</h3><button class="x" type="button" @click="rejecting = null">x</button></header>
        <textarea v-model="remarks" class="remarks" rows="4" placeholder="Remarks for rejection"></textarea>
        <div class="modal-actions">
          <button class="btn ghost" type="button" @click="rejecting = null">Cancel</button>
          <button class="btn danger" type="submit">Reject</button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { bploAssessFee, bploReleasePermit, getApplications, rejectByBPLO } from '../services/applicationService'
import SearchField from '../components/SearchField.vue'

const applications = ref([])
const loading = ref(true)
const search = ref('')
const filter = ref('READY')
const page = ref(1)
const perPage = 8
const selected = ref(null)
const assessing = ref(null)
const rejecting = ref(null)
const feeAmount = ref(1500)
const remarks = ref('')
const toast = ref({ text: '', type: 'success' })

onMounted(load)
watch([search, filter], () => { page.value = 1 })

async function load() {
  loading.value = true
  try {
    applications.value = await getApplications()
  } catch (error) {
    showToast(error.message || 'Unable to load applications', 'error')
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return applications.value.filter((app) => {
    const ready = (app.bploStatus || 'PENDING') === 'PENDING' || (app.businessPermitFeePaid && app.bploStatus !== 'RELEASED')
    const statusMatch = filter.value === 'ALL' || (filter.value === 'READY' ? ready : (app.bploStatus || 'PENDING') === filter.value)
    const textMatch = !term || fullName(app).toLowerCase().includes(term) || String(app.businessName || '').toLowerCase().includes(term)
    return statusMatch && textMatch
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage))

function openAssess(app) {
  assessing.value = app
  feeAmount.value = Number(app.businessPermitFeeAssessed || app.business_permit_fee_assessed || 1500)
  remarks.value = ''
}

async function submitAssessment() {
  try {
    await bploAssessFee(assessing.value.id, feeAmount.value, remarks.value, assessing.value.stakeholderId || assessing.value.id)
    showToast(`Business Permit Fee of ₱${feeAmount.value.toLocaleString()} assessed. Forwarded to Treasury.`)
    assessing.value = null
    await load()
  } catch (error) {
    showToast(error.message || 'Fee assessment failed', 'error')
  }
}

async function releasePermit(app) {
  try {
    await bploReleasePermit(app.id, null, 'Business permit released by BPLO', app.stakeholderId || app.id)
    showToast('Business Permit successfully released!')
    await load()
  } catch (error) {
    showToast(error.message || 'Permit release failed', 'error')
  }
}

function openReject(app) {
  rejecting.value = app
  remarks.value = ''
}

async function reject() {
  try {
    await rejectByBPLO(rejecting.value.id, remarks.value, rejecting.value.stakeholderId || rejecting.value.id)
    rejecting.value = null
    showToast('Application rejected.')
    await load()
  } catch (error) {
    showToast(error.message || 'Rejection failed', 'error')
  }
}

function fullName(app) { return `${app.firstName || ''} ${app.lastName || ''}`.trim() || app.username || 'Applicant' }
function badge(status) { return ['badge', String(status || 'PENDING').toLowerCase()] }
function showToast(text, type = 'success') {
  toast.value = { text, type }
  setTimeout(() => { toast.value = { text: '', type: 'success' } }, 2800)
}
</script>

<style scoped src="../styles/BPLODashboard/BPLOApproval.css"></style>
