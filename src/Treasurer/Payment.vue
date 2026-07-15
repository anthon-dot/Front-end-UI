<template>
  <div class="layout min-h-screen bg-slate-50">
    <TreasurerMenu />

    <main class="page-container">
      
      <!-- HEADER -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span class="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <i class="pi pi-wallet text-2xl"></i>
            </span>
            Payments
          </h1>
          <p class="text-sm text-slate-500 mt-1">Manage and record stakeholder payments</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="p-input-icon-left w-full md:w-80 shadow-sm rounded-lg overflow-hidden border border-slate-200">
            <i class="pi pi-search text-slate-400 pl-3"></i>
            <InputText v-model="tableSearch" placeholder="Search stakeholder or payment id..." class="w-full border-none pl-10 bg-white" />
          </span>
          <Button label="Record Payment" icon="pi pi-plus" @click="openModal" class="shadow-sm" />
        </div>
      </div>

      <!-- TABLE -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-2">
        <DataTable 
          :value="filteredPayments" 
          paginator 
          :rows="10" 
          :rowsPerPageOptions="[10, 20, 50]"
          responsiveLayout="scroll"
          class="p-datatable-sm modern-table"
        >
          <template #empty>
            <div class="text-center py-12 text-slate-400">
              <i class="pi pi-wallet text-4xl mb-3 text-slate-300"></i>
              <p>No payments found matching the criteria.</p>
            </div>
          </template>

          <Column header="Stakeholder" sortable sortField="stakeholder.lastName">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  {{ initials(data.stakeholder?.firstName, data.stakeholder?.lastName) }}
                </div>
                <div>
                  <div class="font-semibold text-slate-800">{{ data.stakeholder?.firstName }} {{ data.stakeholder?.lastName }}</div>
                  <div class="text-xs text-slate-500">{{ data.stakeholder?.businessName }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="id" header="Payment ID" sortable>
            <template #body="{ data }">
              <span class="font-mono text-sm font-bold text-slate-600">#{{ data.id }}</span>
            </template>
          </Column>

          <Column field="paymentType" header="Type" sortable>
            <template #body="{ data }">
              <Tag :value="formatType(data.paymentType)" severity="info" rounded class="!bg-blue-50 !text-blue-600 !font-semibold border border-blue-100" />
            </template>
          </Column>

          <Column field="rentCycle" header="Rent Cycle" sortable>
            <template #body="{ data }">
              <span v-if="data.rentCycle">{{ formatType(data.rentCycle) }}</span>
              <span v-else class="text-slate-400">—</span>
            </template>
          </Column>

          <Column field="amount" header="Amount" sortable>
            <template #body="{ data }">
              <span class="font-bold text-emerald-600">₱{{ Number(data.amount || 0).toLocaleString() }}</span>
            </template>
          </Column>

          <Column field="receiptNo" header="Receipt" sortable></Column>
          
          <Column field="referenceNo" header="Reference">
            <template #body="{ data }">
              <span v-if="data.referenceNo">{{ data.referenceNo }}</span>
              <span v-else class="text-slate-400">—</span>
            </template>
          </Column>

          <Column field="paymentDate" header="Date" sortable>
            <template #body="{ data }">
              {{ formatDate(data.paymentDate) }}
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- RECORD PAYMENT MODAL -->
      <Dialog v-model:visible="showModal" modal header="Record Payment" :style="{ width: '50vw' }" :breakpoints="{ '960px': '75vw', '641px': '95vw' }" class="modern-dialog">
        <p class="text-slate-500 mb-6 text-sm">Search and select a stakeholder, then enter payment details.</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- LEFT SIDE: Stakeholder Selection -->
          <div class="space-y-4 relative">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Search Stakeholder</label>
              <span class="p-input-icon-left w-full">
                <i class="pi pi-search text-slate-400"></i>
                <InputText v-model="searchStakeholder" placeholder="Enter name or business..." class="w-full pl-10 bg-slate-50" />
              </span>
            </div>

            <!-- Search Results Dropdown -->
            <div v-if="searchStakeholder.trim().length && !selectedStakeholder" class="absolute z-10 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto mt-1">
              <div v-for="s in filteredStakeholders" :key="s.id" 
                   class="flex items-center gap-3 p-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0"
                   @click="selectStakeholder(s)">
                <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {{ initials(s.firstName, s.lastName) }}
                </div>
                <div>
                  <div class="font-bold text-slate-800 text-sm">{{ s.firstName }} {{ s.lastName }}</div>
                  <div class="text-xs text-slate-500 truncate">{{ s.businessName }}</div>
                </div>
              </div>
              <div v-if="filteredStakeholders.length === 0" class="p-4 text-center text-slate-500 text-sm">
                No matching stakeholders found.
              </div>
            </div>

            <!-- Selected Stakeholder Card -->
            <div v-if="selectedStakeholder" class="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
              <div class="flex items-center gap-3 mb-4 pb-4 border-b border-indigo-100/50">
                <div class="w-12 h-12 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-black shadow-sm">
                  {{ initials(selectedStakeholder.firstName, selectedStakeholder.lastName) }}
                </div>
                <div>
                  <h3 class="font-bold text-slate-800">{{ selectedStakeholder.firstName }} {{ selectedStakeholder.lastName }}</h3>
                  <p class="text-sm text-slate-600">{{ selectedStakeholder.businessName }}</p>
                </div>
                <Button icon="pi pi-times" text rounded severity="secondary" size="small" @click="resetStakeholder" class="ml-auto !p-1 w-8 h-8 text-slate-400" v-tooltip="'Clear Selection'" />
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="block text-xs font-semibold text-indigo-400 uppercase">Stall</span>
                  <strong class="text-sm text-indigo-900">{{ selectedStakeholder?.occupant?.stall?.stallNo || 'No Stall' }}</strong>
                </div>
                <div>
                  <span class="block text-xs font-semibold text-indigo-400 uppercase">Advance Bal</span>
                  <strong class="text-sm text-indigo-900">₱{{ Number(selectedStakeholder?.advanceBalance || 0).toLocaleString() }}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT SIDE: Payment Details -->
          <div class="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
            
            <div class="flex flex-col gap-1">
              <label class="text-sm font-bold text-slate-700">Payment Type</label>
              <Select v-model="form.paymentType" :options="paymentTypeOptions" optionLabel="label" optionValue="value" placeholder="Select payment type" class="w-full bg-slate-50" />
            </div>

            <!-- Rent Payment: Billings List -->
            <div v-if="form.paymentType === 'RENT_PAYMENT'" class="mt-4">
              <label class="block text-sm font-bold text-slate-700 mb-2">Select Billing Reference</label>
              <div v-if="stakeholderBillings.length" class="space-y-2 max-h-48 overflow-y-auto pr-1">
                <div v-for="b in stakeholderBillings" :key="b.id"
                     class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors"
                     :class="selectedBillingId === b.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-blue-300'"
                     @click="selectedBillingId = b.id">
                  <div>
                    <div class="font-bold text-sm text-slate-800">{{ b.billingNo }}</div>
                    <div class="text-xs text-slate-500">Due: {{ formatDate(b.dueDate) }}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-rose-600">₱{{ Number(b.balance || 0).toLocaleString() }}</div>
                    <div class="text-[10px] uppercase font-bold text-slate-400">{{ b.status }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="bg-slate-50 p-4 rounded-lg text-center text-slate-500 text-sm border border-slate-200">
                No unpaid billing found.
              </div>

              <!-- Billing Frequency -->
              <div v-if="selectedBillingId" class="mt-3 flex flex-col gap-1">
                <label class="text-sm font-bold text-slate-700">Billing Frequency</label>
                <div class="bg-slate-100 px-3 py-2 rounded-lg text-slate-600 text-sm font-medium">
                  {{ formatType(stakeholderBillings.find(b => b.id === selectedBillingId)?.billingFrequency) || 'N/A' }}
                </div>
              </div>
            </div>

            <!-- Advance Payment -->
            <div v-if="form.paymentType === 'ADVANCE_PAYMENT'" class="flex flex-col gap-1">
              <label class="text-sm font-bold text-slate-700">Total Required Advance</label>
              <InputNumber v-model="form.totalAdvanceAmount" inputId="totalAdvance" mode="currency" currency="PHP" locale="en-PH" class="w-full" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-bold text-slate-700">Payment Amount</label>
              <InputNumber v-model="form.amount" inputId="amount" mode="currency" currency="PHP" locale="en-PH" class="w-full font-bold" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-bold text-slate-700">Reference No (Optional)</label>
              <InputText v-model="form.referenceNo" class="w-full bg-slate-50" />
            </div>

          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
            <Button label="Cancel" icon="pi pi-times" text @click="closeModal" class="text-slate-600" />
            <Button label="Record Payment" icon="pi pi-check" @click="recordPayment" :disabled="!canRecord" severity="success" class="shadow-sm" />
          </div>
        </template>
      </Dialog>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import api from '../services/api'
import TreasurerMenu from '../components/TreasurerMenu.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'

// =========================
// STATE
// =========================
const payments = ref([])
const stakeholders = ref([])
const billings = ref([])

const tableSearch = ref('')
const searchStakeholder = ref('')

const showModal = ref(false)
const selectedStakeholder = ref(null)
const selectedBillingId = ref(null)

const form = ref({
  paymentType: '',
  totalAdvanceAmount: null,
  amount: null,
  referenceNo: ''
})

const paymentTypeOptions = [
  { label: 'Advance Payment', value: 'ADVANCE_PAYMENT' },
  { label: 'Application Form', value: 'APPLICATION_FORM' },
  { label: 'Rent Payment', value: 'RENT_PAYMENT' }
]

// =========================
// LIFECYCLE
// =========================
onMounted(async () => {
  await Promise.all([
    loadPayments(),
    loadStakeholders(),
    loadBillings()
  ])
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

// =========================
// LOADERS
// =========================
async function loadPayments() {
  try {
    const response = await api.get('/payments')
    payments.value = response.data
  } catch (error) { console.error(error) }
}

async function loadStakeholders() {
  try {
    const response = await api.get('/stakeholders')
    stakeholders.value = response.data.filter(s => !s.isArchived)
  } catch (error) { console.error(error) }
}

async function loadBillings() {
  try {
    const response = await api.get('/billings')
    billings.value = response.data
  } catch (error) { console.error(error) }
}

// =========================
// COMPUTED FILTERS
// =========================
const filteredPayments = computed(() => {
  const search = tableSearch.value.toLowerCase()
  return payments.value.filter(p => {
    const name = `${p.stakeholder?.firstName || ''} ${p.stakeholder?.lastName || ''}`.toLowerCase()
    return name.includes(search) || 
           String(p.id).includes(search) || 
           (p.receiptNo || '').toLowerCase().includes(search)
  })
})

const filteredStakeholders = computed(() => {
  return stakeholders.value.filter(s => {
    // Requirements for rent payment
    if (form.value.paymentType === 'RENT_PAYMENT') {
      if (!s.occupant || !s.occupant.stall) return false
    }
    
    const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase()
    const search = searchStakeholder.value.toLowerCase()
    return name.includes(search) || (s.businessName || '').toLowerCase().includes(search)
  })
})

const stakeholderBillings = computed(() => {
  if (!selectedStakeholder.value) return []
  return billings.value.filter(b => {
    const bid = b.stakeholderId || b.stakeholder?.id
    return b.status !== 'PAID' && Number(bid) === Number(selectedStakeholder.value.id)
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
})

// =========================
// WATCHERS
// =========================
watch(stakeholderBillings, (newBillings) => {
  if (form.value.paymentType === 'RENT_PAYMENT') {
    selectedBillingId.value = newBillings.length ? newBillings[0].id : null
  }
}, { immediate: true })

watch(() => form.value.paymentType, async (type) => {
  if (type === 'RENT_PAYMENT') {
    await loadBillings()
    if (stakeholderBillings.value.length) {
      selectedBillingId.value = stakeholderBillings.value[0].id
    }
  } else {
    selectedBillingId.value = null
  }
})

// =========================
// METHODS
// =========================
function selectStakeholder(s) {
  selectedStakeholder.value = s
  searchStakeholder.value = `${s.firstName} ${s.lastName}`
  if (stakeholderBillings.value.length) {
    selectedBillingId.value = stakeholderBillings.value[0].id
  }
}

function resetStakeholder() {
  selectedStakeholder.value = null
  searchStakeholder.value = ''
  selectedBillingId.value = null
}

function initials(first, last) {
  return ((first?.charAt(0) || '') + (last?.charAt(0) || '')).toUpperCase()
}

function formatType(type) {
  if (!type) return ''
  return type.replaceAll('_', ' ')
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

function openModal() {
  resetForm()
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function resetForm() {
  form.value = { paymentType: '', totalAdvanceAmount: null, amount: null, referenceNo: '' }
  resetStakeholder()
}

const canRecord = computed(() => {
  if (!selectedStakeholder.value) return false
  if (!form.value.paymentType) return false
  if (Number(form.value.amount) <= 0) return false
  if (form.value.paymentType === 'RENT_PAYMENT') return !!selectedBillingId.value
  if (form.value.paymentType === 'ADVANCE_PAYMENT') return Number(form.value.totalAdvanceAmount) > 0
  return true
})

async function recordPayment() {
  try {
    if (!selectedStakeholder.value) return alert('Select stakeholder first.')

    if (form.value.paymentType === 'RENT_PAYMENT') {
      if (!selectedStakeholder.value?.occupant) return alert('Stakeholder has no occupant record.')
      if (!selectedStakeholder.value?.occupant?.stall) return alert('Stakeholder has no occupied stall.')
      if (!selectedBillingId.value) return alert('No billing selected.')
    }

    const payload = {
      stakeholder: { id: selectedStakeholder.value.id },
      amount: Number(form.value.amount),
      referenceNo: form.value.referenceNo,
      paymentType: form.value.paymentType
    }

    if (form.value.paymentType === 'RENT_PAYMENT') {
      const selectedBilling = stakeholderBillings.value.find(b => b.id === selectedBillingId.value)
      payload.rentCycle = selectedBilling?.billingFrequency || 'MONTHLY'
      payload.billing = { id: selectedBillingId.value }
    }

    if (form.value.paymentType === 'ADVANCE_PAYMENT') {
      payload.totalAdvanceAmount = Number(form.value.totalAdvanceAmount)
    }

    const response = await api.post('/payments', payload)
    console.log('[Payment] payment saved', {
      paymentId: response.data?.id,
      stakeholderId: selectedStakeholder.value.id,
      paymentType: response.data?.paymentType,
      amount: response.data?.amount
    })
    
    await Promise.all([loadPayments(), loadBillings(), loadStakeholders()])

    const refreshedStakeholder = stakeholders.value.find(
      stakeholder => String(stakeholder.id) === String(selectedStakeholder.value.id)
    )
    console.log('[Payment] refreshed stakeholder after payment', {
      stakeholderId: refreshedStakeholder?.id,
      applicantFeePaid: refreshedStakeholder?.applicantFeePaid,
      verified: refreshedStakeholder?.verified,
      verifiedStakeholder: refreshedStakeholder?.verifiedStakeholder,
      verifiedTenant: refreshedStakeholder?.verifiedTenant
    })
    
    closeModal()
    alert('Payment recorded successfully.')
  } catch (error) {
    console.error(error)
    alert(error.response?.data?.message || 'Failed to record payment.')
  }
}
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
