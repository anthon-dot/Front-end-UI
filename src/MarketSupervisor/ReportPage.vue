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

<style scoped src="./ReportPage.css"></style>
