<template>
  <div class="dashboard">

    <MarketSupervisorMenu />

    <!-- PAGE TITLE -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold">
        Dashboard
      </h1>

      <span class="text-sm text-gray-500">
        Pending Applications
      </span>
    </div>

    <!-- SUMMARY -->
    <div class="summary-card summary-overview">

      <div class="metrics">

        <div class="metric">
          <p class="metric-label">
            Total Applications
          </p>

          <div class="metric-value">
            {{ totalCount }}
          </div>
        </div>

        <div class="metric">
          <p class="metric-label">
            Pending
          </p>

          <div class="metric-value">
            {{ pendingCount }}
          </div>
        </div>

        <div class="metric">
          <p class="metric-label">
            Approved
          </p>

          <div class="metric-value">
            {{ approvedCount }}
          </div>
        </div>

      </div>
    </div>

    <!-- TABLE -->
    <div class="bg-white rounded-2xl shadow overflow-auto">

      <div class="p-6 border-b">
        <h2 class="text-lg font-medium">
          Applications for Approval
        </h2>
      </div>

      <div class="table-scroll">

        <table
          class="app-table w-full text-sm"
          style="border-collapse:collapse"
        >

          <thead>
            <tr
              style="
                text-align:left;
                border-bottom:1px solid #eef2f7
              "
            >
              <th style="padding:12px">
                Applicant
              </th>

              <th>
                Business
              </th>

              <th>
                Status
              </th>

              <th>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>

            <tr
              v-for="app in pendingApplicants"
              :key="app.id"
              style="
                border-bottom:1px solid #f3f6f9
              "
            >

              <td class="cell-wrap" style="padding:12px">

                <div class="name-cell">

                  <div class="name-main">
                    {{ app.firstName }}
                    {{ app.lastName }}
                  </div>

                  <div class="name-sub">
                    {{ app.contact }}
                  </div>

                </div>
              </td>

              <td class="cell-wrap">
                {{ app.businessName }}
              </td>

              <td>
                <span :class="['status-badge', statusClass(app.marketApprovalStatus)]">
                  {{ app.marketApprovalStatus || 'PENDING' }}
                </span>
              </td>

              <td>

                <div style="display:flex;gap:8px;">

                  <!-- IF advancePayment = true -->
                  <template v-if="app.advancePayment === true">

                    <button
                      class="btn-outline"
                      @click="open(app)"
                    >
                      View
                    </button>

                    <button
                      class="btn-approve"
                      :disabled="!app.selectedStall?.id"
                      @click="approveMarketSupervisor(app)"
                    >
                      Assign Stall
                    </button>

                    <button
                      class="btn-reject"
                      @click="rejectMarketSupervisor(app)"
                    >
                      Reject
                    </button>

                  </template>

                  <!-- IF advancePayment = false -->
                  <template v-else>

                    <button
                      class="btn-outline"
                      @click="open(app)"
                    >
                      View
                    </button>

                  </template>

                </div>

              </td>

            </tr>

            <tr v-if="pendingApplicants.length === 0">

              <td
                colspan="4"
                class="
                  p-6
                  text-center
                  text-gray-500
                "
              >
                No pending applications
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>

    <!-- VIEW MODAL -->
    <div
      v-if="showModal"
      class="modal-backdrop"
    >

      <div class="modal">

        <h3 class="text-xl font-semibold mb-4">
          Application Details
        </h3>

        <div class="info-box">

          <p>
            <strong>Name:</strong>
            {{ selected.firstName }}
            {{ selected.lastName }}
          </p>

          <p>
            <strong>Business:</strong>
            {{ selected.businessName }}
          </p>

          <p>
            <strong>Business Type:</strong>
            {{ selected.businessType }}
          </p>

          <p>
            <strong>Contact:</strong>
            {{ selected.contact }}
          </p>

          <p>
            <strong>Email:</strong>
            {{ selected.email }}
          </p>

          <p>
            <strong>Address:</strong>
            {{ selected.address }}
          </p>

          <p>
            <strong>Market Approval:</strong>
            <span :class="['status-badge', statusClass(selected.marketApprovalStatus)]">
              {{ selected.marketApprovalStatus || 'PENDING' }}
            </span>
          </p>

          <p>
            <strong>Selected Stall:</strong>
            <span v-if="selected.selectedStall">
              {{ selected.selectedStall.stallNo }} - {{ selected.selectedStall.stallType }}
            </span>
            <span v-else>
              No selected stall
            </span>
          </p>

        </div>

        <!-- DOCUMENTS -->
        <div class="mb-4">

          <h4 class="font-medium mb-2">
            Documents
          </h4>

          <div
            v-if="
              selected.documents &&
              selected.documents.length
            "
          >

            <div
              v-for="doc in selected.documents"
              :key="doc.id"
              class="mb-2"
            >

              <a
                :href="getFileUrl(doc.fileName)"
                target="_blank"
                class="text-blue-600 underline"
              >
                {{ doc.documentType }}
              </a>

            </div>

          </div>

          <div v-else>
            No documents uploaded
          </div>

        </div>

        <div class="flex justify-end gap-2">

          <button
            class="btn-outline"
            @click="close"
          >
            Close
          </button>

        </div>

      </div>

    </div>

  </div>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { API_ORIGIN } from '../config/apiConfig'

import MarketSupervisorMenu
from '../components/MarketSupervisorMenu.vue'

const applications = ref([])
const showModal = ref(false)
const selected = ref({})
// =========================
// LOAD STAKEHOLDERS
// =========================

async function loadApplications() {

  try {

    const response = await api.get('/stakeholders')

    applications.value = response.data

  } catch (error) {

    console.error(error)

  }
}

// =========================
// FILTER PENDING
// advancePayment = true
// =========================

const pendingApplicants = computed(() => {

  return applications.value.filter(app => {
    return (
      (app.advancePayment === true || app.advancePaymentPaid === true || app.advancePaymentCompleted === true) &&
      (app.marketApprovalStatus || 'PENDING') === 'PENDING'
    )
  })

})

// =========================
// COUNTS
// =========================

const totalCount = computed(() => {

  return applications.value.length

})

const pendingCount = computed(() => {

  return applications.value.filter(app => {

    return (app.marketApprovalStatus || 'PENDING') === 'PENDING'

  }).length

})

const approvedCount = computed(() => {

  return applications.value.filter(app => {

    return (app.marketApprovalStatus || 'PENDING') === 'APPROVED'

  }).length

})

// =========================
// OPEN MODAL
// =========================

function open(app) {

  selected.value = app

  showModal.value = true
}

// =========================
// CLOSE MODAL
// =========================

function close() {

  showModal.value = false
}

// =========================
// APPROVE MARKET SUPERVISOR
// =========================

async function approveMarketSupervisor(app) {

  try {

    if (!app.selectedStall?.id) {
      alert('Applicant has no selected vacant stall.')
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 1)

    const response = await api.post(
      `/stakeholders/${app.id}/assign-stall`,
      {
        stallId: app.selectedStall.id,
        startDate: today,
        endDate: endDate.toISOString().slice(0, 10),
        terms: 'Rental contract created after advance payment receipt verification.'
      }
    )

    const updated = response.data

    // update local data
    const index =
      applications.value.findIndex(
        a => a.id === app.id
      )

    if (index !== -1) {

      applications.value[index] = updated
    }

    alert(
      'Selected stall assigned and contract created successfully'
    )

  } catch (error) {

    console.error(error)

    alert('Approval failed')

  }
}

async function rejectMarketSupervisor(app) {

  if (!confirm('Reject this market approval?')) return

  try {

    const response = await api.put(
      `/stakeholders/${app.id}/market-reject`
    )

    const updated = response.data

    const index =
      applications.value.findIndex(
        a => a.id === app.id
      )

    if (index !== -1) {

      applications.value[index] = updated
    }

    alert('Market approval rejected')

  } catch (error) {

    console.error(error)

    alert(error.message || 'Rejection failed')
  }
}

function statusClass(status) {
  return String(status || 'PENDING').toLowerCase()
}

// =========================
// FILE URL
// =========================

function getFileUrl(fileName) {

  return `${API_ORIGIN}/uploads/${fileName}`
}

// =========================
// ON MOUNT
// =========================

onMounted(() => {

  loadApplications()

})
</script>

<style scoped>
.summary-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
}

.summary-overview {
  padding: 16px 20px;
}

.summary-overview .metrics {
  display:flex;
  gap:18px;
  align-items:center;
}

.summary-overview .metric {
  background:#ffffff;
  padding:12px 16px;
  border-radius:10px;
  box-shadow:0 2px 8px rgba(0,0,0,0.04);
  min-width:140px;
}

.summary-overview .metric-label {
  margin:0;
  font-size:13px;
  color:#6b7280;
}

.summary-overview .metric-value {
  font-size:22px;
  font-weight:700;
  margin-top:6px;
}

.btn-outline {
  padding:8px 14px;
  border:1px solid #d1d5db;
  border-radius:8px;
  background:white;
}

.btn-approve {
  padding:8px 14px;
  border-radius:8px;
  background:#16a34a;
  color:white;
}

.btn-reject {
  padding:8px 14px;
  border-radius:8px;
  background:#dc2626;
  color:white;
}

.status-badge {
  display:inline-flex;
  align-items:center;
  min-width:86px;
  justify-content:center;
  padding:4px 8px;
  border-radius:999px;
  font-size:12px;
  font-weight:700;
}

.status-badge.pending {
  background:#fef3c7;
  color:#92400e;
}

.status-badge.approved {
  background:#dcfce7;
  color:#166534;
}

.status-badge.rejected {
  background:#fee2e2;
  color:#991b1b;
}

.modal-backdrop {
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.4);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:3000;
}

.modal {
  background:white;
  border-radius:16px;
  padding:24px;
  width:100%;
  max-width:560px;
}

.info-box {
  background:#f9fafb;
  padding:16px;
  border-radius:12px;
  margin-bottom:16px;
}

.dashboard {
  margin-left:220px;
  padding:20px;
}

.table-scroll {
  max-height:480px;
  overflow:auto;
}

.app-table {
  table-layout:fixed;
  width:100%;
}

.app-table th,
.app-table td {
  padding:12px;
  vertical-align:middle;
}

.app-table tbody tr:hover {
  background:#fbfdff;
}

.name-cell {
  display:flex;
  flex-direction:column;
  gap:4px;
}

.name-main {
  font-weight:600;
  font-size:14px;
}

.name-sub {
  font-size:12px;
  color:#6b7280;
}
</style>
