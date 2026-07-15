<template>
  <div class="reports-page">
    <MarketSupervisorMenu :forceOpen="true" />

    <main class="content">
      <section class="page-header">
        <div>
          <h1 class="title">
            Reports
          </h1>

          <p class="subtitle">
            Create, track, and update your supervisor reports
          </p>
        </div>

        <div v-if="isMarketSupervisor" class="controls">
          <SearchField
            v-model="search"
            placeholder="Search reports..."
          />

          <button class="btn-primary" @click="openCreate">
            <i class="pi pi-plus" />
            Add Report
          </button>
        </div>
      </section>

      <section v-if="!isMarketSupervisor" class="access-panel">
        <i class="pi pi-lock" />
        <h2>Access restricted</h2>
        <p>Only Market Supervisors can manage reports.</p>
      </section>

      <template v-else>
        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Reports</div>
            <div class="stat-value">{{ reports.length }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Submitted</div>
            <div class="stat-value">{{ submittedCount }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Visible Records</div>
            <div class="stat-value">{{ filteredReports.length }}</div>
          </div>
        </section>

        <section class="table-card">
          <div class="table-header">
            <div>
              <h2>Report List</h2>
              <p>{{ filteredReports.length }} records</p>
            </div>

            <button class="btn-outline" @click="loadReports">
              <i class="pi pi-refresh" />
              Refresh
            </button>
          </div>

          <div class="table-wrapper">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Supervisor</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="report in filteredReports" :key="report.id">
                  <td>
                    <div class="report-title">
                      {{ report.title }}
                    </div>
                  </td>

                  <td class="description-cell">
                    {{ report.description || 'No description' }}
                  </td>

                  <td>
                    <span
                      class="status-badge"
                      :class="statusClass(report.status)"
                    >
                      {{ report.status }}
                    </span>
                  </td>

                  <td>{{ formatDate(report.createdDate) }}</td>

                  <td>{{ report.supervisorName }}</td>

                  <td>
                    <div class="actions">
                      <button
                        class="icon-btn"
                        title="Edit report"
                        @click="openEdit(report)"
                      >
                        <i class="pi pi-pencil" />
                      </button>

                      <button
                        class="icon-btn danger"
                        title="Delete report"
                        @click="confirmDelete(report)"
                      >
                        <i class="pi pi-trash" />
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="filteredReports.length === 0">
                  <td colspan="6" class="empty-cell">
                    No reports found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </main>

    <div
      v-if="showForm"
      class="modal-backdrop"
      @click.self="closeForm"
    >
      <div class="modal">
        <div class="modal-header">
          <div>
            <h2>
              {{ selectedReport ? 'Edit Report' : 'Add Report' }}
            </h2>

            <p>
              {{ selectedReport ? 'Update report details' : 'Create a new supervisor report' }}
            </p>
          </div>

          <button class="close-btn" @click="closeForm">
            <i class="pi pi-times" />
          </button>
        </div>

        <ReportForm
          :report="selectedReport"
          @submit="saveReport"
          @cancel="closeForm"
        />
      </div>
    </div>

    <div
      v-if="deleteTarget"
      class="modal-backdrop"
      @click.self="deleteTarget = null"
    >
      <div class="confirm-modal">
        <h2>Delete report?</h2>
        <p>
          This will permanently remove
          <strong>{{ deleteTarget.title }}</strong>.
        </p>

        <div class="confirm-actions">
          <button class="btn-secondary" @click="deleteTarget = null">
            Cancel
          </button>

          <button class="btn-danger" @click="removeReport">
            <i class="pi pi-trash" />
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted
} from 'vue'

import MarketSupervisorMenu from '../components/MarketSupervisorMenu.vue'
import SearchField from '../components/SearchField.vue'
import ReportForm from './ReportForm.vue'

import {
  getReports,
  createReport,
  updateReport,
  deleteReport
} from '../services/reportService'

const reports = ref([])
const search = ref('')
const showForm = ref(false)
const selectedReport = ref(null)
const deleteTarget = ref(null)

const isMarketSupervisor = computed(() => {
  return localStorage.getItem('role') === 'MARKETSUPERVISOR'
})

const filteredReports = computed(() => {
  const term = search.value.toLowerCase().trim()

  if (!term) {
    return reports.value
  }

  return reports.value.filter((report) => {
    const haystack = [
      report.title,
      report.description,
      report.status,
      report.supervisorName
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(term)
  })
})

const submittedCount = computed(() => {
  return reports.value.filter((report) => {
    return report.status === 'SUBMITTED'
  }).length
})

async function loadReports() {
  try {
    const response = await getReports()
    reports.value = response.data
  } catch (error) {
    console.error(error)
    alert(
      error.response?.data?.message ||
      'Failed to load reports'
    )
  }
}

function openCreate() {
  selectedReport.value = null
  showForm.value = true
}

function openEdit(report) {
  selectedReport.value = { ...report }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  selectedReport.value = null
}

async function saveReport(payload) {
  try {
    if (selectedReport.value?.id) {
      await updateReport(
        selectedReport.value.id,
        payload
      )
    } else {
      await createReport(payload)
    }

    closeForm()
    await loadReports()
  } catch (error) {
    console.error(error)
    alert(
      error.response?.data?.message ||
      'Failed to save report'
    )
  }
}

function confirmDelete(report) {
  deleteTarget.value = report
}

async function removeReport() {
  try {
    await deleteReport(deleteTarget.value.id)
    deleteTarget.value = null
    await loadReports()
  } catch (error) {
    console.error(error)
    alert(
      error.response?.data?.message ||
      'Failed to delete report'
    )
  }
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function statusClass(status) {
  return String(status || '')
    .toLowerCase()
    .replaceAll('_', '-')
}

onMounted(async () => {
  if (isMarketSupervisor.value) {
    await loadReports()
  }
})
</script>

<style scoped>
.reports-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0fdfa, #f8fafc);
}

.content {
  min-height: 100vh;
  margin-left: var(--sidebar-width, 280px);
  padding: 24px;
  transition: margin-left 0.25s ease;
}

.page-header,
.table-card,
.access-panel {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 24px;
  margin-bottom: 18px;
}

.title {
  margin: 0;
  color: #0f172a;
  font-size: 32px;
  font-weight: 800;
}

.subtitle {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05);
}

.stat-label {
  color: #64748b;
  font-size: 14px;
}

.stat-value {
  margin-top: 8px;
  color: #0f172a;
  font-size: 30px;
  font-weight: 800;
}

.table-card {
  padding: 20px;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.table-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
}

.table-header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.table-wrapper {
  overflow-x: auto;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
}

.report-table th,
.report-table td {
  padding: 14px;
  border-bottom: 1px solid #eef2f7;
  text-align: left;
  vertical-align: middle;
}

.report-table th {
  color: #64748b;
  font-size: 13px;
  text-transform: uppercase;
}

.report-table tbody tr:hover {
  background: #f8fafc;
}

.report-title {
  color: #0f172a;
  font-weight: 800;
}

.description-cell {
  max-width: 340px;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 12px;
  font-weight: 800;
}

.status-badge.draft {
  background: #f1f5f9;
  color: #475569;
}

.status-badge.submitted {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.in-review {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.resolved {
  background: #dcfce7;
  color: #166534;
}

.actions,
.confirm-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: inline-grid;
  place-items: center;
  border: none;
  border-radius: 9px;
  color: #0f766e;
  background: #ecfdf5;
  cursor: pointer;
}

.icon-btn.danger {
  color: #dc2626;
  background: #fef2f2;
}

.btn-primary,
.btn-outline,
.btn-secondary,
.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 800;
  cursor: pointer;
}

.btn-primary {
  color: white;
  background: linear-gradient(135deg, #14b8a6, #0d9488);
}

.btn-outline,
.btn-secondary {
  color: #475569;
  background: white;
  border: 1px solid #dbe4ee;
}

.btn-danger {
  color: white;
  background: #dc2626;
}

.empty-cell {
  padding: 28px;
  color: #94a3b8;
  text-align: center;
}

.access-panel {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 44px 20px;
  color: #64748b;
  text-align: center;
}

.access-panel i {
  color: #0f766e;
  font-size: 28px;
}

.access-panel h2 {
  margin: 0;
  color: #0f172a;
}

.access-panel p {
  margin: 0;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
}

.modal,
.confirm-modal {
  width: min(100%, 620px);
  border-radius: 20px;
  background: white;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.14);
}

.confirm-modal {
  max-width: 440px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.modal-header h2,
.confirm-modal h2 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  font-weight: 800;
}

.modal-header p,
.confirm-modal p {
  margin: 5px 0 0;
  color: #64748b;
}

.close-btn {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #475569;
  background: #f1f5f9;
  cursor: pointer;
}

.confirm-actions {
  justify-content: flex-end;
  margin-top: 20px;
}

@media (max-width: 900px) {
  .content {
    margin-left: 90px;
    padding: 16px;
  }
}

@media (max-width: 720px) {
  .content {
    margin-left: 0;
  }

  .page-header,
  .table-header,
  .controls {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
