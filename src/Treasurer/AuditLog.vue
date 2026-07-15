<template>
  <div class="layout min-h-screen bg-slate-50">
    <TreasurerMenu />

    <main class="page-container">
      
      <!-- HEADER -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span class="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <i class="pi pi-list text-2xl"></i>
            </span>
            System Audit Log
          </h1>
          <p class="text-sm text-slate-500 mt-1">Track system activity, approvals, and records</p>
        </div>
      </div>

      <!-- FILTERS -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <div class="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <i class="pi pi-filter text-slate-400"></i>
          <h3 class="font-bold text-slate-800">Filters</h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Action</label>
            <Select v-model="filterAction" :options="['All', ...actions]" class="w-full bg-slate-50" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Entity</label>
            <Select v-model="filterEntity" :options="['All', ...entities]" class="w-full bg-slate-50" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Date From</label>
            <DatePicker v-model="dateFrom" dateFormat="yy-mm-dd" placeholder="Select start date" class="w-full bg-slate-50" showIcon />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Date To</label>
            <DatePicker v-model="dateTo" dateFormat="yy-mm-dd" placeholder="Select end date" class="w-full bg-slate-50" showIcon />
          </div>

          <div class="lg:col-span-4 mt-2 flex justify-end">
            <Button label="Clear Filters" icon="pi pi-times" text severity="secondary" @click="clearFilters" class="text-slate-500" />
          </div>
        </div>
      </div>

      <!-- TABLE -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-2">
        <div class="flex items-center justify-between p-4 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <i class="pi pi-book text-indigo-500"></i>
            <h3 class="font-bold text-slate-800">Activity Log</h3>
          </div>
          <span class="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{{ filtered.length }} records</span>
        </div>

        <DataTable 
          :value="filtered" 
          paginator 
          :rows="10" 
          :rowsPerPageOptions="[10, 20, 50]"
          responsiveLayout="scroll"
          class="p-datatable-sm modern-table mt-2"
        >
          <template #empty>
            <div class="text-center py-12 text-slate-400">
              <i class="pi pi-history text-4xl mb-3 text-slate-300"></i>
              <p>No activity logs found for the selected filters.</p>
            </div>
          </template>

          <Column header="Date & Time" sortable sortField="date">
            <template #body="{ data }">
              <div>
                <div class="font-bold text-slate-800">{{ formatDate(data.date) }}</div>
                <div class="text-xs text-slate-500">{{ formatTime(data.date) }}</div>
              </div>
            </template>
          </Column>

          <Column field="user" header="User" sortable class="font-semibold text-slate-700"></Column>
          
          <Column field="action" header="Action" sortable>
            <template #body="{ data }">
              <Tag :value="data.action" :class="actionClass(data.action)" rounded class="font-bold px-3 py-1 border" />
            </template>
          </Column>

          <Column field="entity" header="Entity Affected" sortable class="text-slate-600 font-medium"></Column>
          
          <Column field="details" header="Details">
            <template #body="{ data }">
              <span class="text-slate-600 text-sm">{{ data.details }}</span>
            </template>
          </Column>
        </DataTable>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import TreasurerMenu from '../components/TreasurerMenu.vue'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

const actions = ['APPROVED', 'CREATED', 'RECORDED', 'UPLOADED']
const entities = ['Stakeholder Application', 'Contract', 'Payment', 'Contract Document']

const filterAction = ref('All')
const filterEntity = ref('All')
const dateFrom = ref(null)
const dateTo = ref(null)

const logs = ref([
  { id: 1, date: '2024-11-16T14:20:00', user: 'Juan Dela Cruz', action: 'APPROVED', entity: 'Stakeholder Application', details: 'Approved application for Ana Garcia' },
  { id: 2, date: '2024-11-20T11:00:00', user: 'Juan Dela Cruz', action: 'CREATED', entity: 'Contract', details: 'Created contract C-001 for Ana Garcia - Stall A-001' },
  { id: 3, date: '2024-11-28T09:15:00', user: 'Juan Dela Cruz', action: 'RECORDED', entity: 'Payment', details: 'Recorded payment of ₱1,500.00 for billing B-2024-11-002' },
  { id: 4, date: '2024-11-19T16:45:00', user: 'Maria Santos', action: 'UPLOADED', entity: 'Contract Document', details: 'Uploaded contract document for Ana Garcia' }
])

const filtered = computed(() => {
  return logs.value.filter(l => {
    if (filterAction.value !== 'All' && l.action !== filterAction.value) return false
    if (filterEntity.value !== 'All' && l.entity !== filterEntity.value) return false
    if (dateFrom.value) {
      const from = new Date(dateFrom.value)
      from.setHours(0,0,0,0)
      if (new Date(l.date) < from) return false
    }
    if (dateTo.value) {
      const to = new Date(dateTo.value)
      to.setHours(23,59,59,999)
      if (new Date(l.date) > to) return false
    }
    return true
  })
})

function clearFilters() { 
  filterAction.value = 'All'
  filterEntity.value = 'All'
  dateFrom.value = null
  dateTo.value = null
}

function formatDate(d) {
  const dt = new Date(d)
  return dt.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: 'numeric' })
}

function formatTime(d) {
  const dt = new Date(d)
  return dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function actionClass(action) {
  switch(action) {
    case 'APPROVED': return '!bg-blue-50 !text-blue-700 !border-blue-200'
    case 'CREATED': return '!bg-emerald-50 !text-emerald-700 !border-emerald-200'
    case 'RECORDED': return '!bg-amber-50 !text-amber-700 !border-amber-200'
    case 'UPLOADED': return '!bg-fuchsia-50 !text-fuchsia-700 !border-fuchsia-200'
    default: return '!bg-slate-50 !text-slate-700 !border-slate-200'
  }
}

onMounted(() => {
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

<style scoped>
.page-container {
  padding-top: calc(var(--header-height, 64px) + 24px);
  padding-bottom: 40px;
  max-width: 1400px;
  margin: 0 auto;
  padding-left: calc(var(--sidebar-width, 260px) + 24px);
  padding-right: 24px;
  transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.p-datatable-thead > tr > th) {
  background-color: #f8fafc !important;
  color: #475569 !important;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #edf2f7;
  padding: 12px 16px;
}

:deep(.p-datatable-tbody > tr > td) {
  padding: 14px 16px;
  border-bottom: 1px solid #edf2f7;
  font-size: 0.875rem;
}

:deep(.p-paginator) {
  background-color: #ffffff;
  border-top: 1px solid #edf2f7;
  padding: 12px;
}

@media (max-width: 900px) {
  .page-container {
    padding-left: 24px;
  }
}
</style>
