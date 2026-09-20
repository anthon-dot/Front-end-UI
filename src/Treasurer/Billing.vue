<template>
  <div class="layout min-h-screen bg-slate-50">
    <!-- Sidebar -->
    <TreasurerMenu />

    <!-- Main -->
    <main class="page-container">
      
      <!-- Title -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span class="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <i class="pi pi-receipt text-2xl"></i>
            </span>
            Billing Records
          </h2>
          <p class="text-sm text-slate-500 mt-1">Stakeholder billing records and payment status</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="p-input-icon-left w-full md:w-80 shadow-sm rounded-lg overflow-hidden border border-slate-200">
            <i class="pi pi-search text-slate-400 pl-3"></i>
            <InputText v-model="search" placeholder="Search stakeholder or billing ID..." class="w-full border-none pl-10 bg-white" />
          </span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[300px] mb-6">
        <i class="pi pi-spin pi-spinner text-4xl text-indigo-600 mb-4"></i>
        <p class="text-slate-500 font-medium">Fetching real-time billing records...</p>
      </div>

      <!-- Table -->
      <div v-else class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-2">
        <DataTable 
          :value="sortedFilteredRows" 
          rowGroupMode="subheader" 
          groupRowsBy="stakeholder" 
          sortMode="single" 
          sortField="stakeholder" 
          :sortOrder="1"
          responsiveLayout="scroll"
          class="p-datatable-sm modern-table"
        >
          <template #empty>
            <div class="text-center py-12 text-slate-400">
              <i class="pi pi-inbox text-4xl mb-3 text-slate-300"></i>
              <p>No billing records found.</p>
            </div>
          </template>

          <template #groupheader="slotProps">
            <div class="flex items-center gap-4 py-2">
              <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm">
                {{ initials(slotProps.data.stakeholder) }}
              </div>
              <div class="flex-1">
                <div class="font-bold text-slate-800 text-base">
                  {{ slotProps.data.stakeholder }}
                </div>
                <div class="text-xs font-semibold text-slate-500 flex gap-4 mt-0.5">
                  <span>Total: <span class="text-slate-700">₱{{ getGroupTotal(slotProps.data.stakeholder, 'total').toLocaleString() }}</span></span>
                  <span>Paid: <span class="text-emerald-600">₱{{ getGroupTotal(slotProps.data.stakeholder, 'paid').toLocaleString() }}</span></span>
                  <span>Balance: <span class="text-rose-600">₱{{ getGroupTotal(slotProps.data.stakeholder, 'balance').toLocaleString() }}</span></span>
                </div>
              </div>
            </div>
          </template>

          <Column field="id" header="Billing ID" class="font-mono text-sm font-bold text-slate-600"></Column>
          <Column field="period" header="Period" class="text-slate-600 text-sm font-medium"></Column>
          
          <Column field="total" header="Total">
            <template #body="slotProps">
              <span class="font-semibold text-slate-700">₱{{ slotProps.data.total.toLocaleString() }}</span>
            </template>
          </Column>

          <Column field="paid" header="Paid">
            <template #body="slotProps">
              <span class="font-bold text-emerald-600">₱{{ slotProps.data.paid.toLocaleString() }}</span>
            </template>
          </Column>

          <Column field="balance" header="Balance">
            <template #body="slotProps">
              <span class="font-bold text-rose-600">₱{{ slotProps.data.balance.toLocaleString() }}</span>
            </template>
          </Column>

          <Column field="due" header="Due Date" class="text-slate-600 text-sm"></Column>

          <Column field="status" header="Status">
            <template #body="slotProps">
              <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" rounded class="font-bold px-3 py-1" />
            </template>
          </Column>

          <Column header="Action" alignFrozen="right" :frozen="true" class="text-right">
            <template #body="slotProps">
              <Button 
                label="Send" 
                icon="pi pi-send" 
                size="small" 
                :disabled="slotProps.data.status === 'PAID'" 
                @click="sendNotification(slotProps.data)"
                :outlined="slotProps.data.status !== 'PAID'"
                :severity="slotProps.data.status === 'PAID' ? 'secondary' : 'info'"
                class="!py-1.5"
              />
            </template>
          </Column>
        </DataTable>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { fetchBillings as getBillingsApi, sendBillingNotification } from '../services/billingService'
import TreasurerMenu from '../components/TreasurerMenu.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const search = ref('')
const rows = ref([])
const loading = ref(false)

/* =========================
   FETCH BACKEND DATA
========================= */
async function fetchBillings() {
  loading.value = true

  try {
    const data = await getBillingsApi()

    rows.value = data.map(b => ({
      id: b.billingNo || 'N/A',
      stakeholder: b.occupantName || 'Unknown',
      period: b.billingPeriod || 'N/A',
      total: Number(b.totalAmount ?? 0),
      paid: Number(b.paidAmount ?? 0),
      balance: Number(b.balance ?? 0),
      due: b.dueDate || 'N/A',
      status: b.status || 'UNKNOWN'
    }))
  } catch (err) {
    console.error('Error loading billings', err)
  } finally {
    loading.value = false
  }
}

/* =========================
   FILTER & SORT
========================= */
const filteredRows = computed(() =>
  rows.value.filter(r =>
    (r.stakeholder || '').toLowerCase().includes(search.value.toLowerCase()) ||
    (r.id || '').toLowerCase().includes(search.value.toLowerCase())
  )
)

// DataTable with rowGroupMode="subheader" expects sorted data by the group field
const sortedFilteredRows = computed(() => {
  return [...filteredRows.value].sort((a, b) => {
    return a.stakeholder.localeCompare(b.stakeholder);
  });
})

/* =========================
   HELPERS
========================= */
function getGroupTotal(stakeholder, field) {
  return filteredRows.value
    .filter(r => r.stakeholder === stakeholder)
    .reduce((sum, r) => sum + r[field], 0);
}

function getStatusSeverity(status) {
  switch (status) {
    case 'PAID': return 'success'
    case 'UNPAID': return 'warning'
    case 'PARTIAL': return 'info'
    case 'OVERDUE': return 'danger'
    default: return 'secondary'
  }
}

function initials(name) {
  if (!name || name === 'Unknown') return 'UK'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

async function sendNotification(row) {
  try {
    await sendBillingNotification(row.id)
    alert(`Notification sent to ${row.stakeholder}`)
  } catch (err) {
    console.error('Failed to send notification', err)
    alert('Failed to send notification')
  }
}

/* =========================
   LIFECYCLE
========================= */
onMounted(() => {
  fetchBillings()
  try {
    const app = document.getElementById('app')
    if (app) app.classList.add('full-bleed')
  } catch (e) {}
})

onUnmounted(() => {
  try {
    const app = document.getElementById('app')
    if (app) app.classList.remove('full-bleed')
  } catch (e) {}
})
</script>

<style scoped src="./Billing.css"></style>
