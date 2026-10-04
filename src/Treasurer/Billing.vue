<template>
  <div class="layout min-h-screen bg-slate-50">
    <!-- Sidebar -->
    <TreasurerMenu />

    <!-- Main -->
    <main class="page-container">
      
      <!-- Title -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
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
          <div class="w-full md:w-80">
            <SearchField v-model="search" placeholder="Search stakeholder, stall, or ID..." />
          </div>
        </div>
      </div>

      <!-- Quick Summary Cards (Single Row: Rectangle 1 | Rectangle 2 | Rectangle 3) -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          <!-- Rectangle 1: Total Invoiced -->
          <div class="p-5 flex items-center justify-between">
            <div>
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</p>
              <p class="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">₱{{ totalInvoiced.toLocaleString() }}</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-xs">
              <i class="pi pi-receipt"></i>
            </div>
          </div>

          <!-- Rectangle 2: Total Collected -->
          <div class="p-5 flex items-center justify-between">
            <div>
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Collected</p>
              <p class="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">₱{{ totalPaid.toLocaleString() }}</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-xs">
              <i class="pi pi-check-circle"></i>
            </div>
          </div>

          <!-- Rectangle 3: Outstanding Balance -->
          <div class="p-5 flex items-center justify-between">
            <div>
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</p>
              <p class="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">₱{{ totalBalance.toLocaleString() }}</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shadow-xs">
              <i class="pi pi-exclamation-circle"></i>
            </div>
          </div>

        </div>
      </div>

      <!-- Schedule Color Legend -->
      <div class="flex items-center gap-2 sm:gap-4 flex-wrap bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-xs mb-4 text-xs font-semibold">
        <span class="text-slate-400 font-bold uppercase tracking-wider text-[11px] mr-1">Billing Schedule:</span>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <span class="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs"></span> Past Due Date (Red)
        </span>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs"></span> This Month (Yellow)
        </span>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span> Next 2 Months Advance (Green)
        </span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[300px] mb-6">
        <i class="pi pi-spin pi-spinner text-4xl text-indigo-600 mb-4"></i>
        <p class="text-slate-500 font-medium">Fetching real-time billing records...</p>
      </div>

      <!-- Grouped Table (Sakai PrimeVue Grouping Style) -->
      <div v-else class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-2">
        <DataTable 
          :value="sortedFilteredRows" 
          rowGroupMode="subheader" 
          groupRowsBy="stakeholder" 
          sortMode="single" 
          sortField="stakeholder" 
          :sortOrder="1"
          :rowClass="getRowClass"
          paginator 
          :rows="10" 
          :rowsPerPageOptions="[10, 20, 50]"
          responsiveLayout="scroll"
          class="p-datatable-sm modern-table"
        >
          <template #empty>
            <div class="text-center py-12 text-slate-400">
              <i class="pi pi-inbox text-4xl mb-3 text-slate-300"></i>
              <p>No billing records found.</p>
            </div>
          </template>

          <!-- Sakai Group Header Box: Profile, Stakeholder, Stall Occupied -->
          <template #groupheader="slotProps">
            <div class="flex items-center justify-between gap-4 py-1.5 px-1 flex-wrap">
              <div class="flex items-center gap-3 flex-wrap">
                <!-- Profile Avatar -->
                <div class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-xs shadow-xs border border-indigo-200 flex-shrink-0">
                  {{ initials(slotProps.data.stakeholder) }}
                </div>
                
                <!-- Stakeholder Name -->
                <span class="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                  {{ slotProps.data.stakeholder }}
                </span>

                <!-- Stall Occupied Badge -->
                <span v-if="slotProps.data.stallNo" class="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg shadow-xs">
                  <i class="pi pi-shop text-[11px]"></i>
                  Stall {{ slotProps.data.stallNo }}
                </span>

                <!-- Business Name -->
                <span v-if="slotProps.data.businessName && slotProps.data.businessName !== slotProps.data.stakeholder" class="text-xs text-slate-500 font-medium">
                  ({{ slotProps.data.businessName }})
                </span>

                <!-- Verified Badge -->
                <Tag value="VERIFIED TENANT" severity="success" rounded class="!text-[10px] !py-0.5 !px-2 font-bold" />
              </div>

              <!-- Stakeholder Financial Summary in Group Header -->
              <div class="flex items-center gap-4 text-xs font-semibold">
                <span class="text-slate-500">Total: <strong class="text-slate-800">₱{{ getGroupTotal(slotProps.data.stakeholder, 'total').toLocaleString() }}</strong></span>
                <span class="text-slate-500">Paid: <strong class="text-emerald-600">₱{{ getGroupTotal(slotProps.data.stakeholder, 'paid').toLocaleString() }}</strong></span>
                <span class="text-slate-500">Balance: <strong class="text-rose-600">₱{{ getGroupTotal(slotProps.data.stakeholder, 'balance').toLocaleString() }}</strong></span>
              </div>
            </div>
          </template>

          <!-- 1. Billing ID Column -->
          <Column field="id" header="Billing ID" class="font-mono text-sm font-bold text-slate-600" style="min-width: 140px;"></Column>

          <!-- 2. Period Column -->
          <Column field="period" header="Period" class="text-slate-600 text-sm font-medium" style="min-width: 160px;">
            <template #body="{ data }">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-semibold">{{ formatPeriod(data.period) }}</span>
                <span v-if="isPastDue(data)" class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                  PAST DUE
                </span>
                <span v-else-if="isThisMonth(data)" class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  THIS MONTH
                </span>
                <span v-else-if="isNextTwoMonths(data)" class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ADVANCE
                </span>
              </div>
            </template>
          </Column>
          
          <!-- 3. Total Column -->
          <Column field="total" header="Total" style="min-width: 100px;">
            <template #body="{ data }">
              <span class="font-semibold text-slate-700">₱{{ Number(data.total || 0).toLocaleString() }}</span>
            </template>
          </Column>

          <!-- 4. Paid Column -->
          <Column field="paid" header="Paid" style="min-width: 100px;">
            <template #body="{ data }">
              <span class="font-bold text-emerald-600">₱{{ Number(data.paid || 0).toLocaleString() }}</span>
            </template>
          </Column>

          <!-- 5. Balance Column -->
          <Column field="balance" header="Balance" style="min-width: 100px;">
            <template #body="{ data }">
              <span class="font-bold text-rose-600">₱{{ Number(data.balance || 0).toLocaleString() }}</span>
            </template>
          </Column>

          <!-- 6. Due Date Column -->
          <Column field="due" header="Due Date" class="text-slate-600 text-sm" style="min-width: 110px;">
            <template #body="{ data }">
              <span>{{ formatDate(data.due) }}</span>
            </template>
          </Column>

          <!-- 7. Status Column -->
          <Column field="status" header="Status" style="min-width: 110px;">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="getStatusSeverity(data.status)" rounded class="font-bold px-3 py-1" />
            </template>
          </Column>

          <!-- 8. Action Column -->
          <Column header="Action" alignFrozen="right" :frozen="true" class="text-right" style="min-width: 100px;">
            <template #body="{ data }">
              <Button 
                label="Send" 
                icon="pi pi-send" 
                size="small" 
                :disabled="data.status === 'PAID'" 
                @click="sendNotification(data)"
                :outlined="data.status !== 'PAID'"
                :severity="data.status === 'PAID' ? 'secondary' : 'info'"
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
import SearchField from '../components/SearchField.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const search = ref('')
const rows = ref([])
const loading = ref(false)

const now = new Date()
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
const currentMonth = now.getMonth() + 1
const currentYear = now.getFullYear()

/* =========================
   FETCH BACKEND DATA
========================= */
async function fetchBillings() {
  loading.value = true

  try {
    const data = await getBillingsApi()

    rows.value = (data || []).map(b => {
      const st = b.occupant?.stakeholder || b.stakeholder || {}
      const stFirstName = st.firstName || st.first_name || ''
      const stLastName = st.lastName || st.last_name || ''
      const stFullName = `${stFirstName} ${stLastName}`.trim()
      const businessName = st.businessName || st.business_name || ''
      const stakeholderLabel = stFullName || businessName || b.occupantName || b.occupant_name || 'Verified Tenant'
      const stallNo = b.contract?.stall?.stallNo || b.contract?.stall?.stall_no || b.stallNo || ''

      const totalVal = Number(b.totalAmount ?? b.total_amount ?? 0)
      const paidVal = Number(b.paidAmount ?? b.paid_amount ?? 0)
      const balanceVal = Number(b.balance ?? Math.max(totalVal - paidVal, 0))

      return {
        ...b,
        rawId: b.id,
        id: b.billingNo || b.billing_no || (b.id ? `BILL-${b.id}` : 'N/A'),
        billingNo: b.billingNo || b.billing_no || '',
        stakeholder: stakeholderLabel,
        businessName,
        stallNo,
        period: b.billingPeriod || b.billing_period || 'N/A',
        total: totalVal,
        paid: paidVal,
        balance: balanceVal,
        due: b.dueDate || b.due_date || 'N/A',
        status: (b.status || (balanceVal <= 0 ? 'PAID' : 'UNPAID')).toUpperCase()
      }
    })
  } catch (err) {
    console.error('Error loading billings', err)
  } finally {
    loading.value = false
  }
}

/* =========================
   FILTER & SORTED ROWS (FOR SAKAI GROUPING)
========================= */
const filteredRows = computed(() =>
  rows.value.filter(r =>
    (r.stakeholder || '').toLowerCase().includes(search.value.toLowerCase()) ||
    (r.businessName || '').toLowerCase().includes(search.value.toLowerCase()) ||
    (r.stallNo || '').toLowerCase().includes(search.value.toLowerCase()) ||
    (r.id || '').toLowerCase().includes(search.value.toLowerCase()) ||
    (r.period || '').toLowerCase().includes(search.value.toLowerCase())
  )
)

const sortedFilteredRows = computed(() => {
  return [...filteredRows.value].sort((a, b) => {
    const sComp = (a.stakeholder || '').localeCompare(b.stakeholder || '')
    if (sComp !== 0) return sComp
    return (a.due || '').localeCompare(b.due || '')
  })
})

const totalInvoiced = computed(() => filteredRows.value.reduce((sum, r) => sum + r.total, 0))
const totalPaid = computed(() => filteredRows.value.reduce((sum, r) => sum + r.paid, 0))
const totalBalance = computed(() => filteredRows.value.reduce((sum, r) => sum + r.balance, 0))

function getGroupTotal(stakeholder, field) {
  return filteredRows.value
    .filter(r => r.stakeholder === stakeholder)
    .reduce((sum, r) => sum + (Number(r[field]) || 0), 0)
}

/* =========================
   SCHEDULE & COLOR CLASSIFIER
========================= */
function parsePeriod(periodStr) {
  if (!periodStr || typeof periodStr !== 'string') return null
  const match = periodStr.match(/MONTHLY-(\d+)-(\d+)/i)
  if (match) {
    return { month: parseInt(match[1], 10), year: parseInt(match[2], 10) }
  }
  return null
}

function isPastDue(row) {
  if (row.status === 'PAID') return false
  if (!row.due || row.due === 'N/A') return false
  const due = new Date(row.due)
  if (isNaN(due.getTime())) return false
  return due < todayStart
}

function isThisMonth(row) {
  if (isPastDue(row)) return false
  const p = parsePeriod(row.period)
  if (p) {
    return p.month === currentMonth && p.year === currentYear
  }
  if (row.due && row.due !== 'N/A') {
    const d = new Date(row.due)
    if (!isNaN(d.getTime())) {
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear
    }
  }
  return false
}

function isNextTwoMonths(row) {
  if (isPastDue(row) || isThisMonth(row)) return false
  const p = parsePeriod(row.period)
  let m, y
  if (p) {
    m = p.month
    y = p.year
  } else if (row.due && row.due !== 'N/A') {
    const d = new Date(row.due)
    if (!isNaN(d.getTime())) {
      m = d.getMonth() + 1
      y = d.getFullYear()
    }
  }
  if (m && y) {
    const diff = (y - currentYear) * 12 + (m - currentMonth)
    return diff >= 1 && diff <= 2
  }
  return false
}

function getRowClass(data) {
  if (isPastDue(data)) return 'row-past-due'
  if (isThisMonth(data)) return 'row-this-month'
  if (isNextTwoMonths(data)) return 'row-advance-month'
  return ''
}

/* =========================
   FORMATTERS & HELPERS
========================= */
function formatPeriod(period) {
  if (!period || period === 'N/A') return '—'
  if (typeof period === 'string' && period.startsWith('MONTHLY-')) {
    const parts = period.split('-')
    if (parts.length === 3) {
      const monthNum = parseInt(parts[1], 10)
      const year = parts[2]
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      if (monthNum >= 1 && monthNum <= 12) {
        return `${monthNames[monthNum - 1]} ${year}`
      }
    }
  }
  return period
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === 'N/A') return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return dateStr
  } catch (e) {
    return dateStr
  }
}

function getStatusSeverity(status) {
  switch (status) {
    case 'PAID': return 'success'
    case 'UNPAID': return 'warning'
    case 'PARTIAL':
    case 'PARTIALLY_PAID': return 'info'
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
    await sendBillingNotification(row.rawId || row.billingNo || row.id)
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

<style scoped src="../styles/Treasurer/Billing.css"></style>
