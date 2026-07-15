<template>
  <div class="office-layout modern">
    <EndorsingMenu />
    <main class="office-main">
      <header class="page-header">
        <div>
          <h2>Endorsing Office</h2>
          <p class="muted">Review uploaded application files and endorse.</p>
        </div>
        <div class="header-actions">
          <input class="search" v-model="q" placeholder="Search applicants..." />
        </div>
      </header>

      <div v-if="message.text" :class="['status-message', message.type]">
        {{ message.text }}
      </div>

      <div class="grid-cards">
        <div class="summary-card summary-overview">
          <div class="metrics">
            <div class="metric">
              <p class="metric-label">Total Uploaded</p>
              <div class="metric-value">{{ totalCount }}</div>
            </div>
            <div class="metric">
              <p class="metric-label">Pending</p>
              <div class="metric-value">{{ pendingCount }}</div>
            </div>
            <div class="metric">
              <p class="metric-label">Endorsed</p>
              <div class="metric-value">{{ endorsedCount }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card table-card">
        <table class="apps">
          <thead><tr><th>Applicant Name</th><th>Business Name</th><th>Stall Number</th><th>Endorsement Status</th><th>Action</th></tr></thead>
          <tbody>
            <tr v-for="a in filteredApplicants" :key="a.id">
              <td>{{ fullName(a) }}</td>
              <td>{{ a.businessName }}</td>
              <td>{{ stallNumber(a) }}</td>
              <td>
                <span :class="['status-badge', statusClass(a.endorsementStatus)]">
                  {{ a.endorsementStatus || 'PENDING' }}
                </span>
              </td>
              <td class="actions-col">
                <button
                  class="btn-primary"
                  :disabled="isApproved(a)"
                  @click="approveEndorsement(a)"
                >
                  Approve
                </button>
                <button
                  class="btn-danger"
                  :disabled="isRejected(a)"
                  @click="rejectEndorsement(a)"
                >
                  Reject
                </button>
              </td>
            </tr>
            <tr v-if="filteredApplicants.length===0"><td colspan="5" class="empty">No applications ready for endorsement.</td></tr>
          </tbody>
        </table>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import EndorsingMenu from './EndorsingMenu.vue'
import api from '../services/api'

const applications = ref([])
const message = ref({
  text: '',
  type: 'success'
})

async function loadApplications(){
  try {
    const response = await api.get('/stakeholders')
    applications.value = response.data
  } catch (error) {
    console.error('Failed to load applications', error)
  }
}
onMounted(()=>{ loadApplications() })

const endorsableStakeholders = computed(()=> applications.value.filter(a =>
  (a.bploStatus || 'PENDING') === 'APPROVED'
))

const totalCount = computed(()=> endorsableStakeholders.value.length)
const pendingCount = computed(()=> endorsableStakeholders.value.filter(a=>(a.endorsementStatus || 'PENDING')==='PENDING').length)
const endorsedCount = computed(()=> endorsableStakeholders.value.filter(a=>a.endorsementStatus==='APPROVED').length)

const q = ref('')

const filteredApplicants = computed(()=>{
  const term = (q.value||'').toLowerCase().trim()
  const list = endorsableStakeholders.value || []
  if(!term) return list
  return list.filter(a => fullName(a).toLowerCase().includes(term) || (a.businessName||'').toLowerCase().includes(term))
})

async function approveEndorsement(a){
  try {
    await api.put(`/stakeholders/${a.id}/endorse`)
    showMessage('Stakeholder endorsed successfully.', 'success')
    await loadApplications()
  } catch (error) {
    console.error(error)
    showMessage(error.message || 'Endorsement failed.', 'error')
  }
}

async function rejectEndorsement(a){
  const remarks = prompt('Enter rejection remarks:')

  if (remarks === null) return

  try {
    await api.put(
      `/stakeholders/${a.id}/endorse-reject`,
      null,
      {
        params: {
          remarks
        }
      }
    )
    showMessage('Stakeholder endorsement rejected.', 'success')
    await loadApplications()
  } catch (error) {
    console.error(error)
    showMessage(error.message || 'Rejection failed.', 'error')
  }
}

function fullName(a){
  return `${a.firstName || ''} ${a.lastName || ''}`.trim()
}

function stallNumber(a){
  return a.occupant?.stall?.stallNo || '-'
}

function statusClass(status) {
  return String(status || 'PENDING').toLowerCase()
}

function isApproved(a) {
  return a.endorsementStatus === 'APPROVED'
}

function isRejected(a) {
  return a.endorsementStatus === 'REJECTED'
}

function showMessage(text, type = 'success') {
  message.value = {
    text,
    type
  }

  window.setTimeout(() => {
    message.value = {
      text: '',
      type: 'success'
    }
  }, 3000)
}

</script>

<style scoped>
.office-layout.modern{ display:flex; gap:18px }
.office-main{ padding:28px; padding-left: calc(var(--sidebar-width,220px) + 18px); flex:1 }
.page-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:18px }
.muted{ color:#6b7280 }
.grid-cards{ display:flex; gap:12px; margin-bottom:14px }
.card{ background:#fff; padding:16px; border-radius:12px; box-shadow:0 8px 24px rgba(2,6,23,0.04) }
.card.small{ width:160px }
.card-title{ color:#6b7280; font-size:13px }
.card-value{ font-weight:700; font-size:20px; margin-top:6px }
.table-card{ overflow:auto }
.apps{ width:100%; border-collapse:collapse }
.apps th,.apps td{ padding:12px; border-bottom:1px solid #f1f5f9; text-align:left }
.actions-col{ display:flex; gap:8px }
.search{ padding:8px 12px; border-radius:10px; border:1px solid #eef2f7 }
.empty{ text-align:center; color:#6b7280 }
.btn-primary{ background:#0ea5a4; color:white; border-radius:8px; padding:8px 12px; border:none }
.btn-secondary{ background:#f3f4f6; padding:8px 12px; border-radius:8px; border:none }
.btn-danger{ background:#dc2626; color:white; border-radius:8px; padding:8px 12px; border:none }
.btn-primary:disabled,
.btn-danger:disabled{ opacity:.55; cursor:not-allowed }
.status-message{ margin-bottom:14px; padding:10px 12px; border-radius:8px; font-weight:600 }
.status-message.success{ background:#dcfce7; color:#166534 }
.status-message.error{ background:#fee2e2; color:#991b1b }
.status-badge{ display:inline-flex; min-width:86px; justify-content:center; padding:4px 8px; border-radius:999px; font-size:12px; font-weight:700 }
.status-badge.pending{ background:#fef3c7; color:#92400e }
.status-badge.approved{ background:#dcfce7; color:#166534 }
.status-badge.rejected{ background:#fee2e2; color:#991b1b }
</style>
<style scoped>
.summary-card { background: #fff; border-radius:12px; box-shadow:0 8px 24px rgba(2,6,23,0.04); padding:14px; margin-bottom:14px }
.metrics{ display:flex; gap:18px }
.metric{ padding:10px }
.metric-label{ color:#6b7280; font-size:13px }
.metric-value{ font-weight:700; font-size:20px; margin-top:6px }
</style>
<style scoped></style>
