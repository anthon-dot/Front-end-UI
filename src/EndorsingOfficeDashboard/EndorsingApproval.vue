<template>
  <section class="approval-surface">
    <div v-if="toast.text" :class="['toast', toast.type]">{{ toast.text }}</div>

    <div class="toolbar">
      <input v-model="search" class="control" type="search" placeholder="Search applicant or business" />
      <select v-model="filter" class="control">
        <option value="READY">Ready for review</option>
        <option value="PENDING">Pending</option>
        <option value="ENDORSED">Endorsed</option>
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
            <th>BPLO</th>
            <th>Endorsing</th>
            <th>Final</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in paginated" :key="app.id">
            <td><strong>{{ fullName(app) }}</strong><small>{{ app.email || 'No email' }}</small></td>
            <td>{{ app.businessName }}</td>
            <td><span :class="badge(app.bploStatus)">{{ app.bploStatus || 'PENDING' }}</span></td>
            <td><span :class="badge(app.endorsingStatus || app.endorsementStatus)">{{ app.endorsingStatus || app.endorsementStatus || 'PENDING' }}</span></td>
            <td><span :class="badge(app.finalStatus)">{{ app.finalStatus || 'PENDING' }}</span></td>
            <td class="row-actions">
              <button class="btn ghost" type="button" @click="openDetails(app)">View</button>
              <button class="btn primary" type="button" :disabled="!canEndorse(app)" @click="endorse(app)">Approve</button>
              <button class="btn danger" type="button" :disabled="!canReject(app)" @click="openReject(app)">Reject</button>
            </td>
          </tr>
          <tr v-if="paginated.length === 0">
            <td class="empty" colspan="6">No applications match this view.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button class="btn ghost" type="button" :disabled="page === 1" @click="page--">Prev</button>
      <span>Page {{ page }} of {{ pageCount }}</span>
      <button class="btn ghost" type="button" :disabled="page === pageCount" @click="page++">Next</button>
    </div>

    <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
      <div class="modal">
        <header><h3>{{ fullName(selected) }}</h3><button class="x" @click="selected = null">x</button></header>
        <dl>
          <div><dt>Business</dt><dd>{{ selected.businessName }}</dd></div>
          <div><dt>Type</dt><dd>{{ selected.businessType }}</dd></div>
          <div><dt>Contact</dt><dd>{{ selected.contact }}</dd></div>
          <div><dt>Address</dt><dd>{{ selected.address }}</dd></div>
          <div><dt>Remarks</dt><dd>{{ selected.remarks || selected.endorsementRemarks || '-' }}</dd></div>
        </dl>
      </div>
    </div>

    <div v-if="rejecting" class="modal-backdrop" @click.self="rejecting = null">
      <form class="modal" @submit.prevent="reject">
        <header><h3>Reject endorsement</h3><button class="x" type="button" @click="rejecting = null">x</button></header>
        <textarea v-model="remarks" class="remarks" rows="4" placeholder="Remarks"></textarea>
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
import { endorseApplication, getApplications, rejectEndorsement } from '../services/applicationService'

const applications = ref([])
const loading = ref(true)
const search = ref('')
const filter = ref('READY')
const page = ref(1)
const perPage = 8
const selected = ref(null)
const rejecting = ref(null)
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
    const endorsing = app.endorsingStatus || app.endorsementStatus || 'PENDING'
    const ready = app.bploStatus === 'APPROVED' && endorsing === 'PENDING'
    const statusMatch = filter.value === 'ALL' || (filter.value === 'READY' ? ready : endorsing === filter.value)
    const textMatch = !term || fullName(app).toLowerCase().includes(term) || String(app.businessName || '').toLowerCase().includes(term)
    return statusMatch && textMatch
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage))

function canEndorse(app) {
  return app.bploStatus === 'APPROVED' && (app.endorsingStatus || app.endorsementStatus || 'PENDING') === 'PENDING'
}

function canReject(app) {
  return app.bploStatus === 'APPROVED' && (app.endorsingStatus || app.endorsementStatus || 'PENDING') === 'PENDING'
}

async function endorse(app) {
  try {
    await endorseApplication(app.id)
    showToast('Application endorsed for business permit payment.')
    await load()
  } catch (error) {
    showToast(error.message || 'Endorsement failed', 'error')
  }
}

function openReject(app) {
  rejecting.value = app
  remarks.value = ''
}

async function reject() {
  try {
    await rejectEndorsement(rejecting.value.id, remarks.value)
    rejecting.value = null
    showToast('Endorsement rejected.')
    await load()
  } catch (error) {
    showToast(error.message || 'Rejection failed', 'error')
  }
}

function openDetails(app) { selected.value = app }
function fullName(app) { return `${app.firstName || ''} ${app.lastName || ''}`.trim() || app.username || 'Applicant' }
function badge(status) { return ['badge', String(status || 'PENDING').toLowerCase()] }
function showToast(text, type = 'success') {
  toast.value = { text, type }
  setTimeout(() => { toast.value = { text: '', type: 'success' } }, 2800)
}
</script>

<style scoped>
.approval-surface{display:grid;gap:16px}.toolbar{display:flex;gap:10px;flex-wrap:wrap}.control{height:42px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:0 12px;min-width:220px}.table-card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:auto;box-shadow:0 14px 34px rgba(15,23,42,.06)}.approval-table{width:100%;border-collapse:collapse;min-width:840px}.approval-table th,.approval-table td{padding:14px 16px;border-bottom:1px solid #edf2f7;text-align:left}.approval-table th{font-size:12px;text-transform:uppercase;color:#64748b;background:#f8fafc}.approval-table small{display:block;color:#64748b;margin-top:4px}.row-actions{display:flex;gap:8px;justify-content:flex-end}.btn{border:0;border-radius:8px;padding:9px 12px;font-weight:800;cursor:pointer}.btn:disabled{opacity:.45;cursor:not-allowed}.primary{background:#2563eb;color:#fff}.danger{background:#e11d48;color:#fff}.ghost{background:#f1f5f9;color:#334155}.badge{display:inline-flex;min-width:88px;justify-content:center;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:800}.pending{background:#fef3c7;color:#92400e}.approved,.endorsed{background:#dcfce7;color:#166534}.rejected{background:#fee2e2;color:#991b1b}.pagination{display:flex;align-items:center;justify-content:flex-end;gap:12px}.loading,.empty{padding:28px;text-align:center;color:#64748b}.spinner{display:inline-block;width:18px;height:18px;border:3px solid #bfdbfe;border-top-color:#2563eb;border-radius:50%;animation:spin .8s linear infinite;margin-right:8px;vertical-align:middle}.toast{position:fixed;right:22px;top:18px;z-index:50;padding:12px 14px;border-radius:8px;font-weight:800;box-shadow:0 18px 45px rgba(15,23,42,.16)}.toast.success{background:#dcfce7;color:#166534}.toast.error{background:#fee2e2;color:#991b1b}.modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.45);display:grid;place-items:center;z-index:40;padding:20px}.modal{width:min(620px,100%);background:#fff;border-radius:8px;padding:18px}.modal header{display:flex;align-items:center;justify-content:space-between}.x{border:0;background:#f1f5f9;border-radius:8px;width:32px;height:32px}.modal dl{display:grid;gap:12px}.modal dt{font-weight:800;color:#334155}.modal dd{margin:4px 0 0;color:#475569}.remarks{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:10px;resize:vertical}.modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:14px}@keyframes spin{to{transform:rotate(360deg)}}@media (max-width:760px){.toolbar{display:grid}.control{min-width:0;width:100%}.pagination{justify-content:center}}
</style>
