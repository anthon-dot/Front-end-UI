<template>
  <div class="layout min-h-screen bg-slate-50">
    <Toast position="top-right" />

    <!-- Sidebar -->
    <TreasurerMenu />

    <!-- Main -->
    <main class="page-container">
      
      <!-- Title & Search & Refresh Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span class="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-xs">
              <i class="pi pi-receipt text-2xl"></i>
            </span>
            Billing Records
          </h2>
          <p class="text-sm text-slate-500 mt-1">Tenant rental billing statements, payment schedules, and balances</p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <div class="w-full sm:w-72">
            <SearchField v-model="search" placeholder="Search tenant, stall, or billing ID..." />
          </div>
          <Button 
            icon="pi pi-refresh" 
            label="Refresh" 
            outlined 
            size="small" 
            :loading="loading" 
            @click="fetchBillings"
            class="!py-2 !px-3 font-semibold"
          />
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <!-- Total Invoiced -->
        <div class="summary-card">
          <div class="summary-icon blue">
            <i class="pi pi-receipt"></i>
          </div>
          <div>
            <p class="summary-label">Total Invoiced</p>
            <h3 class="summary-value">₱ {{ totalInvoiced.toLocaleString() }}</h3>
          </div>
        </div>

        <!-- Total Collected -->
        <div class="summary-card">
          <div class="summary-icon green">
            <i class="pi pi-check-circle"></i>
          </div>
          <div>
            <p class="summary-label">Total Collected</p>
            <h3 class="summary-value text-emerald-600">₱ {{ totalPaid.toLocaleString() }}</h3>
          </div>
        </div>

        <!-- Outstanding Balance -->
        <div class="summary-card">
          <div class="summary-icon red">
            <i class="pi pi-exclamation-circle"></i>
          </div>
          <div>
            <p class="summary-label">Outstanding Balance</p>
            <h3 class="summary-value text-rose-600">₱ {{ totalBalance.toLocaleString() }}</h3>
          </div>
        </div>
      </div>

      <!-- Schedule Color Legend & Filter Tabs Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <!-- Quick Filter Chips -->
        <div class="flex items-center gap-2 flex-wrap text-xs">
          <span class="text-slate-400 font-bold uppercase tracking-wider text-[11px] mr-1">Filter:</span>
          <button 
            type="button"
            class="filter-chip"
            :class="{ active: activeFilter === 'ALL' }"
            @click="activeFilter = 'ALL'"
          >
            All Bills ({{ rows.length }})
          </button>
          <button 
            type="button"
            class="filter-chip danger"
            :class="{ active: activeFilter === 'PAST_DUE' }"
            @click="activeFilter = 'PAST_DUE'"
          >
            Past Due ({{ pastDueCount }})
          </button>
          <button 
            type="button"
            class="filter-chip warning"
            :class="{ active: activeFilter === 'THIS_MONTH' }"
            @click="activeFilter = 'THIS_MONTH'"
          >
            This Month ({{ thisMonthCount }})
          </button>
          <button 
            type="button"
            class="filter-chip success"
            :class="{ active: activeFilter === 'ADVANCE' }"
            @click="activeFilter = 'ADVANCE'"
          >
            Advance ({{ advanceCount }})
          </button>
          <button 
            type="button"
            class="filter-chip"
            :class="{ active: activeFilter === 'UNPAID' }"
            @click="activeFilter = 'UNPAID'"
          >
            Unpaid Only ({{ unpaidCount }})
          </button>
          <button 
            type="button"
            class="filter-chip"
            :class="{ active: activeFilter === 'PAID' }"
            @click="activeFilter = 'PAID'"
          >
            Paid ({{ paidCount }})
          </button>
        </div>

        <!-- Schedule Color Legend -->
        <div class="flex items-center gap-2 sm:gap-3 flex-wrap text-xs font-semibold text-slate-500 border-t lg:border-t-0 pt-3 lg:pt-0">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px]">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span> Past Due
          </span>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span> This Month
          </span>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px]">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Advance
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[300px] mb-6">
        <i class="pi pi-spin pi-spinner text-4xl text-indigo-600 mb-4"></i>
        <p class="text-slate-500 font-medium">Fetching billing records and checking statements...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="stakeholderGroups.length === 0" class="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400">
        <i class="pi pi-inbox text-5xl mb-3 text-slate-300"></i>
        <p class="text-base font-semibold text-slate-600">No billing records match your filters.</p>
        <p class="text-xs text-slate-400 mt-1" v-if="activeFilter !== 'ALL' || search">Try clearing your search query or switching to All Bills.</p>
        <Button 
          v-if="activeFilter !== 'ALL' || search"
          label="Clear Filters" 
          icon="pi pi-filter-slash" 
          size="small" 
          outlined 
          class="mt-4"
          @click="clearFilters"
        />
      </div>

      <!-- Stakeholder Cards -->
      <div v-else class="space-y-6">
        <div 
          v-for="group in stakeholderGroups" 
          :key="group.stakeholder"
          class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
        >
          <!-- Box Header -->
          <div class="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-slate-50/80 to-white border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-3.5">
              <!-- Profile Avatar -->
              <div class="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-sm shadow-xs border border-indigo-200 flex-shrink-0">
                {{ initials(group.stakeholder) }}
              </div>
              
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                    {{ group.stakeholder }}
                  </h3>
                  
                  <!-- Stall Badge -->
                  <span v-if="group.stallNo" class="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg shadow-xs">
                    <i class="pi pi-shop text-[11px]"></i>
                    Stall {{ group.stallNo }}
                  </span>

                  <!-- Status Tag -->
                  <Tag v-if="group.stallNo" value="VERIFIED TENANT" severity="success" rounded class="!text-[10px] !py-0.5 !px-2 font-bold" />
                  <Tag v-else value="APPLICANT" severity="info" rounded class="!text-[10px] !py-0.5 !px-2 font-bold" />
                </div>

                <p v-if="group.businessName && group.businessName !== group.stakeholder" class="text-xs text-slate-500 font-medium mt-0.5">
                  {{ group.businessName }}
                </p>
              </div>
            </div>

            <!-- Group Financial Summary in Header -->
            <div class="flex items-center gap-4 text-xs font-semibold bg-white px-4 py-2 rounded-xl border border-slate-200/80 shadow-xs self-start md:self-auto">
              <span>Total: <strong class="text-slate-800">₱{{ group.totalInvoiced.toLocaleString() }}</strong></span>
              <span class="text-slate-200">|</span>
              <span>Paid: <strong class="text-emerald-600">₱{{ group.totalPaid.toLocaleString() }}</strong></span>
              <span class="text-slate-200">|</span>
              <span>Balance: <strong class="text-rose-600">₱{{ group.totalBalance.toLocaleString() }}</strong></span>
            </div>
          </div>

          <!-- Bills Table inside the Stakeholder Box -->
          <div class="overflow-x-auto">
            <DataTable 
              :value="group.bills" 
              :rowClass="getRowClass"
              responsiveLayout="scroll"
              class="p-datatable-sm modern-table"
            >
              <!-- 1. Billing ID -->
              <Column field="id" header="Billing ID" class="font-mono text-sm font-bold text-slate-600" style="min-width: 140px;">
                <template #body="{ data }">
                  <span class="cursor-pointer hover:text-indigo-600 underline-offset-2 hover:underline" @click="openBillDetails(data)">
                    {{ data.id }}
                  </span>
                </template>
              </Column>

              <!-- 2. Period -->
              <Column field="period" header="Period" class="text-slate-600 text-sm font-medium" style="min-width: 160px;">
                <template #body="{ data }">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-slate-800">{{ formatPeriod(data.period) }}</span>
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
              
              <!-- 3. Total -->
              <Column field="total" header="Total" style="min-width: 100px;">
                <template #body="{ data }">
                  <span class="font-semibold text-slate-700">₱{{ Number(data.total || 0).toLocaleString() }}</span>
                </template>
              </Column>

              <!-- 4. Paid -->
              <Column field="paid" header="Paid" style="min-width: 100px;">
                <template #body="{ data }">
                  <span class="font-bold text-emerald-600">₱{{ Number(data.paid || 0).toLocaleString() }}</span>
                </template>
              </Column>

              <!-- 5. Balance -->
              <Column field="balance" header="Balance" style="min-width: 100px;">
                <template #body="{ data }">
                  <span class="font-bold text-rose-600">₱{{ Number(data.balance || 0).toLocaleString() }}</span>
                </template>
              </Column>

              <!-- 6. Due Date -->
              <Column field="due" header="Due Date" class="text-slate-600 text-sm" style="min-width: 110px;">
                <template #body="{ data }">
                  <span>{{ formatDate(data.due) }}</span>
                </template>
              </Column>

              <!-- 7. Status -->
              <Column field="status" header="Status" style="min-width: 110px;">
                <template #body="{ data }">
                  <Tag :value="data.status" :severity="getStatusSeverity(data.status)" rounded class="font-bold px-3 py-1" />
                </template>
              </Column>

              <!-- 8. Actions -->
              <Column header="Actions" alignFrozen="right" :frozen="true" class="text-right" style="min-width: 190px;">
                <template #body="{ data }">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- Collect Payment Button (if unpaid or partial) -->
                    <Button 
                      v-if="data.status !== 'PAID'"
                      label="Pay" 
                      icon="pi pi-credit-card" 
                      size="small" 
                      severity="success"
                      class="!py-1 !px-2.5 !text-xs font-bold"
                      @click="collectPayment(data)"
                    />

                    <!-- Send Reminder Notification Button -->
                    <Button 
                      icon="pi pi-send" 
                      size="small" 
                      :disabled="data.status === 'PAID'" 
                      @click="sendNotification(data)"
                      :outlined="data.status !== 'PAID'"
                      :severity="data.status === 'PAID' ? 'secondary' : 'info'"
                      class="!py-1 !px-2 text-xs"
                      title="Send billing reminder"
                    />

                    <!-- View Details Button -->
                    <Button 
                      icon="pi pi-eye" 
                      size="small" 
                      outlined 
                      severity="secondary" 
                      class="!py-1 !px-2 text-slate-500"
                      title="View statement details"
                      @click="openBillDetails(data)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </div>

      <!-- Bill Details Dialog -->
      <Dialog 
        v-model:visible="detailsDialogVisible" 
        modal 
        header="Billing Statement Details" 
        :style="{ width: '520px', maxWidth: '95vw' }"
        :dismissableMask="true"
      >
        <div v-if="selectedBill" class="space-y-4 pt-2">
          <!-- Top Invoice Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span class="text-xs text-slate-400 font-semibold uppercase">Invoice Number</span>
              <h4 class="text-lg font-mono font-bold text-slate-800">{{ selectedBill.id }}</h4>
            </div>
            <Tag :value="selectedBill.status" :severity="getStatusSeverity(selectedBill.status)" rounded class="font-bold px-3 py-1" />
          </div>

          <!-- Tenant & Stall Info -->
          <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-slate-500 font-medium">Tenant Name:</span>
              <span class="font-bold text-slate-800">{{ selectedBill.stakeholder }}</span>
            </div>
            <div v-if="selectedBill.businessName" class="flex justify-between text-xs">
              <span class="text-slate-500 font-medium">Business:</span>
              <span class="font-semibold text-slate-700">{{ selectedBill.businessName }}</span>
            </div>
            <div v-if="selectedBill.stallNo" class="flex justify-between text-xs">
              <span class="text-slate-500 font-medium">Stall Assigned:</span>
              <span class="font-bold text-indigo-700">Stall {{ selectedBill.stallNo }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500 font-medium">Billing Period:</span>
              <span class="font-semibold text-slate-700">{{ formatPeriod(selectedBill.period) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500 font-medium">Payment Due Date:</span>
              <span class="font-bold text-slate-800">{{ formatDate(selectedBill.due) }}</span>
            </div>
          </div>

          <!-- Financial Breakdown -->
          <div class="space-y-2 pt-1">
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Total Billed:</span>
              <span class="font-bold text-slate-800">₱{{ Number(selectedBill.total || 0).toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Amount Paid:</span>
              <span class="font-bold text-emerald-600">₱{{ Number(selectedBill.paid || 0).toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-base font-extrabold pt-2 border-t border-slate-100">
              <span class="text-slate-700">Balance Due:</span>
              <span class="text-rose-600">₱{{ Number(selectedBill.balance || 0).toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between gap-2 w-full pt-3">
            <Button 
              label="Close" 
              severity="secondary" 
              outlined 
              size="small" 
              @click="detailsDialogVisible = false" 
            />
            <div class="flex items-center gap-2">
              <Button 
                v-if="selectedBill && selectedBill.status !== 'PAID'"
                icon="pi pi-send" 
                label="Send Reminder" 
                severity="info" 
                outlined
                size="small" 
                @click="sendNotification(selectedBill)" 
              />
              <Button 
                v-if="selectedBill && selectedBill.status !== 'PAID'"
                icon="pi pi-credit-card" 
                label="Collect Payment" 
                severity="success" 
                size="small" 
                @click="collectPayment(selectedBill)" 
              />
            </div>
          </div>
        </template>
      </Dialog>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { fetchBillings as getBillingsApi, sendBillingNotification } from '../services/billingService'
import TreasurerMenu from '../components/TreasurerMenu.vue'
import SearchField from '../components/SearchField.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'

const router = useRouter()
const toast = useToast()

const search = ref('')
const rows = ref([])
const loading = ref(false)
const activeFilter = ref('ALL') // ALL, PAST_DUE, THIS_MONTH, ADVANCE, UNPAID, PAID

// Dialog state
const detailsDialogVisible = ref(false)
const selectedBill = ref(null)

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
      const stallNo = b.stallNo || b.stall_no || b.contract?.stall?.stallNo || b.contract?.stall?.stall_no || ''
      const stakeholderId = b.stakeholderId || st.id || b.occupant?.stakeholderId || b.occupant?.stakeholder_id

      const totalVal = Number(b.totalAmount ?? b.total_amount ?? 0)
      const paidVal = Number(b.paidAmount ?? b.paid_amount ?? 0)
      const balanceVal = Number(b.balance ?? Math.max(totalVal - paidVal, 0))

      return {
        ...b,
        rawId: b.id,
        id: b.billingNo || b.billing_no || (b.id ? `BILL-${b.id}` : 'N/A'),
        billingNo: b.billingNo || b.billing_no || '',
        stakeholder: stakeholderLabel,
        stakeholderId,
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
    toast.add({
      severity: 'error',
      summary: 'Load Error',
      detail: 'Failed to fetch billing records. Please check your connection.',
      life: 4000
    })
  } finally {
    loading.value = false
  }
}

/* =========================
   FILTER & GROUP BY STAKEHOLDER
========================= */
const pastDueCount = computed(() => rows.value.filter(isPastDue).length)
const thisMonthCount = computed(() => rows.value.filter(isThisMonth).length)
const advanceCount = computed(() => rows.value.filter(isNextTwoMonths).length)
const unpaidCount = computed(() => rows.value.filter(r => r.status !== 'PAID').length)
const paidCount = computed(() => rows.value.filter(r => r.status === 'PAID').length)

const filteredRows = computed(() => {
  const query = search.value.toLowerCase().trim()

  return rows.value.filter(r => {
    // 1. Filter by category
    if (activeFilter.value === 'PAST_DUE' && !isPastDue(r)) return false
    if (activeFilter.value === 'THIS_MONTH' && !isThisMonth(r)) return false
    if (activeFilter.value === 'ADVANCE' && !isNextTwoMonths(r)) return false
    if (activeFilter.value === 'UNPAID' && r.status === 'PAID') return false
    if (activeFilter.value === 'PAID' && r.status !== 'PAID') return false

    // 2. Filter by search text
    if (!query) return true
    return (
      (r.stakeholder || '').toLowerCase().includes(query) ||
      (r.businessName || '').toLowerCase().includes(query) ||
      (r.stallNo || '').toLowerCase().includes(query) ||
      (r.id || '').toLowerCase().includes(query) ||
      (r.period || '').toLowerCase().includes(query)
    )
  })
})

const totalInvoiced = computed(() => rows.value.reduce((sum, r) => sum + r.total, 0))
const totalPaid = computed(() => rows.value.reduce((sum, r) => sum + r.paid, 0))
const totalBalance = computed(() => rows.value.reduce((sum, r) => sum + r.balance, 0))

const stakeholderGroups = computed(() => {
  const groupsMap = new Map()

  for (const r of filteredRows.value) {
    const key = r.stakeholder || 'Verified Tenant'
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        stakeholder: key,
        stakeholderId: r.stakeholderId,
        businessName: r.businessName || '',
        stallNo: r.stallNo || '',
        bills: []
      })
    }
    const group = groupsMap.get(key)
    if (!group.stallNo && r.stallNo) group.stallNo = r.stallNo
    if (!group.businessName && r.businessName) group.businessName = r.businessName
    if (!group.stakeholderId && r.stakeholderId) group.stakeholderId = r.stakeholderId
    group.bills.push(r)
  }

  const groups = Array.from(groupsMap.values()).map(g => {
    // Sort bills: past due first, then this month, then future advance months
    g.bills.sort((a, b) => (a.due || '').localeCompare(b.due || ''))
    g.totalInvoiced = g.bills.reduce((sum, b) => sum + (Number(b.total) || 0), 0)
    g.totalPaid = g.bills.reduce((sum, b) => sum + (Number(b.paid) || 0), 0)
    g.totalBalance = g.bills.reduce((sum, b) => sum + (Number(b.balance) || 0), 0)
    return g
  })

  // Sort groups alphabetically by stakeholder name
  groups.sort((a, b) => a.stakeholder.localeCompare(b.stakeholder))
  return groups
})

function clearFilters() {
  activeFilter.value = 'ALL'
  search.value = ''
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
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
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
  if (!name || name === 'Unknown') return 'TN'
  const clean = name.replace(/[^a-zA-Z\s]/g, '').trim()
  if (!clean) return 'TN'
  return clean.split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

/* =========================
   ACTIONS
========================= */
async function sendNotification(row) {
  try {
    await sendBillingNotification(row.rawId || row.billingNo || row.id)
    toast.add({
      severity: 'success',
      summary: 'Reminder Sent',
      detail: `Billing reminder sent successfully to ${row.stakeholder}.`,
      life: 4500
    })
  } catch (err) {
    console.error('Failed to send notification', err)
    toast.add({
      severity: 'error',
      summary: 'Notification Failed',
      detail: 'Could not send reminder notification.',
      life: 4000
    })
  }
}

function collectPayment(row) {
  detailsDialogVisible.value = false
  const sId = row.stakeholderId || row.occupant?.stakeholder_id || row.occupant?.stakeholderId
  router.push({
    name: 'Payment',
    query: {
      stakeholderId: sId || '',
      billingId: row.rawId || row.id || '',
      category: 'RENT_PAYMENT'
    }
  })
}

function openBillDetails(row) {
  selectedBill.value = row
  detailsDialogVisible.value = true
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
