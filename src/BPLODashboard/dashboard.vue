<template>
  <div class="office-layout modern">
    <BPLOMenu />
    <main class="office-main">
      <header class="page-header">
        <div>
          <h2>BPLO Dashboard</h2>
          <p class="muted">Applications ready for BPLO review (uploaded application forms).</p>
        </div>
        <div class="header-actions">
          <input class="search" v-model="q" placeholder="Search applicants..." />
        </div>
      </header>

      <div class="card table-card">
        <table class="apps">
          <thead><tr><th>Applicant</th><th>Business</th><th>Uploaded</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            <tr v-for="a in filteredUploaded" :key="a.id">
              <td>{{ fullName(a) }}</td>
              <td>{{ a.businessName }}</td>
              <td>{{ getAppFileName(a) || '-' }}</td>
              <td>
                <span :class="['status-badge', statusClass(a.bploStatus)]">
                  {{ a.bploStatus || 'PENDING' }}
                </span>
              </td>
              <td class="actions-col">
                <button class="btn-secondary" @click="viewFile(a)">View</button>
                <button class="btn-primary" @click="approveBPLO(a)">Approve</button>
                <button class="btn-danger" @click="rejectBPLO(a)">Reject</button>
              </td>
            </tr>
            <tr v-if="filteredUploaded.length===0"><td colspan="5" class="empty">No applications ready for BPLO review.</td></tr>
          </tbody>
        </table>
      </div>

      <div class="grid-cards">
        <div class="summary-card summary-overview">
          <div class="metrics">
            <div class="metric">
              <p class="metric-label">Total Uploaded</p>
              <div class="metric-value">{{ totalUploaded }}</div>
            </div>
            <div class="metric">
              <p class="metric-label">BPLO Approved</p>
              <div class="metric-value">{{ bploApproved }}</div>
            </div>
            <div class="metric">
              <p class="metric-label">Pending</p>
              <div class="metric-value">{{ pendingBPLO }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showFileModal" class="modal-backdrop" @click.self="closeFile">
        <div class="modal modal-large">
          <h3>Uploaded Application</h3>
          <div v-if="selectedFileUrl" class="file-viewer"><iframe :src="selectedFileUrl" frameborder="0"></iframe></div>
          <div v-else class="no-file">No file to display</div>
          <div class="modal-actions"><button @click="closeFile">Close</button></div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BPLOMenu from './BPLOMenu.vue'
import api from '../services/api'

const applications = ref([])
const API_ORIGIN = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
async function loadApplications(){
  try {
    const response = await api.get('/stakeholders')
    applications.value = response.data
  } catch (error) {
    console.error('Failed to load applications', error)
  }
}
onMounted(()=>{ loadApplications() })

const q = ref('')
const uploadedApplicants = computed(()=> applications.value.filter(a =>
  (a.marketApprovalStatus || 'PENDING') === 'APPROVED' &&
  a.occupant?.stall &&
  (a.bploStatus || 'PENDING') !== 'APPROVED'
))
const filteredUploaded = computed(()=>{
  const term = (q.value||'').toLowerCase().trim()
  if(!term) return uploadedApplicants.value
  return uploadedApplicants.value.filter(a => fullName(a).toLowerCase().includes(term) || (a.businessName||'').toLowerCase().includes(term))
})

const totalUploaded = computed(()=> uploadedApplicants.value.length)
const bploApproved = computed(()=> applications.value.filter(a=>a.bploStatus==='APPROVED').length)
const pendingBPLO = computed(()=> applications.value.filter(a=>(a.bploStatus || 'PENDING')==='PENDING').length)

function getAppFileName(a){
  const doc = (a.documents || []).find(d => d.documentType === 'LETTER' || d.documentType === 'ID')
  return doc?.fileName || null
}

const showFileModal = ref(false)
const selectedFileUrl = ref('')
const selectedApplicant = ref(null)

function viewFile(a){
  selectedApplicant.value = a
  const doc = (a.documents || []).find(d => d.documentType === 'LETTER' || d.documentType === 'ID')
  selectedFileUrl.value = doc?.fileName ? `${API_ORIGIN}/uploads/${doc.fileName}` : ''
  showFileModal.value = true
}
function closeFile(){ selectedApplicant.value = null; selectedFileUrl.value = ''; showFileModal.value = false }

async function approveBPLO(a){
  try {
    const response = await api.put(`/stakeholders/${a.id}/bplo-approve`)
    updateApplication(response.data)
    alert('Application approved by BPLO')
  } catch (error) {
    console.error(error)
    alert(error.message || 'BPLO approval failed')
  }
}

async function rejectBPLO(a){
  if (!confirm('Reject this BPLO approval?')) return
  try {
    const response = await api.put(`/stakeholders/${a.id}/bplo-reject`)
    updateApplication(response.data)
    alert('BPLO approval rejected')
  } catch (error) {
    console.error(error)
    alert(error.message || 'BPLO rejection failed')
  }
}

function updateApplication(updated){
  const idx = applications.value.findIndex(x=>String(x.id)===String(updated.id))
  if (idx !== -1) applications.value[idx] = updated
}

function fullName(a){
  return `${a.firstName || ''} ${a.lastName || ''}`.trim()
}

function statusClass(status) {
  return String(status || 'PENDING').toLowerCase()
}

</script>

<style scoped>
.office-layout.modern{ display:flex; gap:18px }
.office-main{ padding:28px; padding-left: calc(var(--sidebar-width,220px) + 18px); flex:1 }
.page-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:18px }
.muted{ color:#6b7280 }
.card{ background:#fff; padding:16px; border-radius:12px; box-shadow:0 8px 24px rgba(2,6,23,0.04) }
.table-card{ overflow:auto }
.apps{ width:100%; border-collapse:collapse }
.apps th,.apps td{ padding:12px; border-bottom:1px solid #f1f5f9; text-align:left }
.actions-col{ display:flex; gap:8px }
.search{ padding:8px 12px; border-radius:10px; border:1px solid #eef2f7 }
.empty{ text-align:center; color:#6b7280 }
.btn-primary{ background:#0ea5a4; color:white; border-radius:8px; padding:8px 12px; border:none }
.btn-secondary{ background:#f3f4f6; padding:8px 12px; border-radius:8px; border:none }
.btn-danger{ background:#dc2626; color:white; border-radius:8px; padding:8px 12px; border:none }
.status-badge{ display:inline-flex; min-width:86px; justify-content:center; padding:4px 8px; border-radius:999px; font-size:12px; font-weight:700 }
.status-badge.pending{ background:#fef3c7; color:#92400e }
.status-badge.approved{ background:#dcfce7; color:#166534 }
.status-badge.rejected{ background:#fee2e2; color:#991b1b }
.modal-backdrop{ position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center }
.modal{ background:white; padding:18px; border-radius:10px; width:100%; max-width:640px }
.modal-large{ max-width:900px }
.file-viewer iframe{ width:100%; height:60vh; border:0 }
.no-file{ padding:18px; color:#374151 }
</style>
<style scoped>
.summary-card { background: #fff; border-radius:12px; box-shadow:0 8px 24px rgba(2,6,23,0.04); padding:14px; margin-bottom:14px }
.metrics{ display:flex; gap:18px }
.metric{ padding:10px }
.metric-label{ color:#6b7280; font-size:13px }
.metric-value{ font-weight:700; font-size:20px; margin-top:6px }
</style>
