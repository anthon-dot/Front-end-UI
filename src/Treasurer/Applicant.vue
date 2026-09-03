<template>
  <div class="layout min-h-screen bg-slate-50">
    <!-- SIDEBAR -->
    <TreasurerMenu />

    <!-- MAIN CONTENT -->
    <main class="page-container">
      
      <!-- HEADER -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span class="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <i class="pi pi-users text-2xl"></i>
            </span>
            Stakeholders
          </h2>
        <p class="text-sm text-slate-500 mt-1">Applicants awaiting advance payment or business permit payment.</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="p-input-icon-left w-full md:w-80 shadow-sm rounded-lg overflow-hidden border border-slate-200">
            <i class="pi pi-search text-slate-400 pl-3"></i>
            <InputText v-model="filters['global'].value" placeholder="Search stakeholders..." class="w-full border-none pl-10 bg-white" />
          </span>
        </div>
      </div>

      <!-- TABLE CARD -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-2">
        <DataTable 
          :value="stakeholders" 
          v-model:filters="filters"
          :loading="isLoading"
          paginator 
          :rows="10" 
          :rowsPerPageOptions="[10, 20, 50]"
          responsiveLayout="scroll"
          class="p-datatable-sm modern-table"
          :globalFilterFields="['businessName', 'firstName', 'lastName', 'email', 'contact']"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} stakeholders"
        >
          <template #empty>
            <div class="text-center py-12 text-slate-400">
              <i class="pi pi-inbox text-4xl mb-3 text-slate-300"></i>
              <p>{{ errorMessage || 'No applicants are waiting for approval.' }}</p>
            </div>
          </template>

          <Column field="businessName" header="Business Name" sortable class="font-bold text-slate-800"></Column>
          
          <Column header="Applicant" sortable sortField="lastName">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  {{ data.firstName?.charAt(0) }}{{ data.lastName?.charAt(0) }}
                </div>
                <div>
                  <div class="font-semibold text-slate-700">{{ data.lastName }}, {{ data.firstName }}</div>
                  <div class="text-xs text-slate-500">{{ data.email }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="contact" header="Contact" class="text-slate-600"></Column>
          <Column field="businessType" header="Business Type" sortable>
            <template #body="{ data }">
              <Tag :value="data.businessType" severity="info" rounded class="!bg-blue-50 !text-blue-600 !font-semibold border border-blue-100" />
            </template>
          </Column>

          <Column header="Advance Payment" sortable sortField="advanceBalance">
            <template #body="{ data }">
              <Tag v-if="isAdvancePaid(data)" 
                   value="PAID" severity="success" rounded icon="pi pi-check" 
                   class="!bg-emerald-50 !text-emerald-600 !font-bold border border-emerald-100 px-3 py-1" />
              <Tag v-else 
                   value="UNPAID" severity="danger" rounded icon="pi pi-exclamation-circle" 
                   class="!bg-rose-50 !text-rose-600 !font-bold border border-rose-100 px-3 py-1" />
            </template>
          </Column>

          <Column field="onboardingStatus" header="Workflow" sortable>
            <template #body="{ data }">
              <Tag :value="data.onboardingStatus || 'FOR_APPROVAL'" severity="warn" rounded />
            </template>
          </Column>

          <Column header="Actions" alignFrozen="right" :frozen="true">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <Button icon="pi pi-eye" text rounded severity="secondary" @click="openModal(data)" v-tooltip="'View Details'" />
                <Button
                  v-if="canRecordPayment(data)"
                  icon="pi pi-check"
                  rounded
                  severity="success"
                  :loading="approvingId === data.id"
                  @click="openPaymentModal(data)"
                  v-tooltip="paymentTooltip(data)"
                  class="!p-2"
                />
                <Button
                  icon="pi pi-times"
                  rounded
                  outlined
                  severity="danger"
                  :disabled="approvingId === data.id"
                  @click="rejectApplicant(data)"
                  v-tooltip="'Reject Applicant'"
                  class="!p-2"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- VIEW MODAL -->
      <Dialog v-model:visible="showModal" modal header="Stakeholder Details" :style="{ width: '50vw' }" :breakpoints="{ '960px': '75vw', '641px': '95vw' }" class="modern-dialog">
        <div v-if="selectedApplicant.id" class="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div class="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200">
            <div class="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-sm">
              {{ selectedApplicant.firstName?.charAt(0) }}{{ selectedApplicant.lastName?.charAt(0) }}
            </div>
            <div>
              <h3 class="text-xl font-bold text-slate-800">{{ selectedApplicant.lastName }}, {{ selectedApplicant.firstName }} {{ selectedApplicant.middleName }}</h3>
              <p class="text-slate-500">{{ selectedApplicant.businessName }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact</span>
              <p class="text-slate-800 font-medium">{{ selectedApplicant.contact }}</p>
            </div>
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</span>
              <p class="text-slate-800 font-medium">{{ selectedApplicant.email }}</p>
            </div>
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Business Type</span>
              <p class="text-slate-800 font-medium">{{ selectedApplicant.businessType }}</p>
            </div>
            <div class="sm:col-span-2">
              <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Address</span>
              <p class="text-slate-800 font-medium">{{ selectedApplicant.address }}</p>
            </div>
          </div>

          <div class="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Advance Required</span>
              <p class="text-lg font-black text-slate-800">₱{{ Number(selectedApplicant.totalAdvanceAmount || 0).toLocaleString() }}</p>
            </div>
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Advance Balance</span>
                <p class="text-lg font-black text-indigo-600">₱{{ Number(selectedApplicant.advanceBalance || 0).toLocaleString() }}</p>
              </div>
              <div>
                <Tag v-if="Number(selectedApplicant.advanceBalance || 0) >= Number(selectedApplicant.totalAdvanceAmount || 0)" 
                   value="PAID" severity="success" rounded class="!bg-emerald-100 !text-emerald-700 !font-bold" />
                <Tag v-else 
                   value="UNPAID" severity="danger" rounded class="!bg-rose-100 !text-rose-700 !font-bold" />
              </div>
            </div>
          </div>

          <!-- SUBMITTED DOCUMENTS / IMAGES -->
          <div class="mt-6 pt-6 border-t border-slate-200">
            <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Submitted Documents</h4>
            <div v-if="selectedApplicant.documents && selectedApplicant.documents.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div
                v-for="doc in selectedApplicant.documents"
                :key="doc.id"
                class="group relative bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all"
                @click="openImagePreview(doc)"
              >
                <div class="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden relative">
                  <!-- Loading spinner -->
                  <div v-if="loadingImages[doc.fileName]" class="flex flex-col items-center justify-center gap-1.5 text-indigo-500">
                    <i class="pi pi-spin pi-spinner text-2xl"></i>
                    <span class="text-[10px] text-slate-400">Loading...</span>
                  </div>

                  <!-- Image loaded via blob -->
                  <img
                    v-else-if="isImageFile(doc.fileName) && loadedImageUrls[doc.fileName]"
                    :src="loadedImageUrls[doc.fileName]"
                    :alt="doc.documentType"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <!-- Image failed (missing or error) -->
                  <div
                    v-else-if="isImageFile(doc.fileName) && imageFailed[doc.fileName]"
                    class="flex flex-col items-center justify-center gap-1 text-slate-400 p-2 text-center w-full h-full"
                  >
                    <i class="pi pi-exclamation-triangle text-2xl text-amber-400"></i>
                    <span class="text-xs font-semibold text-slate-600">File Not Found</span>
                    <span class="text-[9px] text-slate-400 leading-tight">Storage reset or 404</span>
                  </div>

                  <!-- Direct URL image (for base64/external) -->
                  <img
                    v-else-if="isImageFile(doc.fileName)"
                    :src="getFileUrl(doc.fileName)"
                    :alt="doc.documentType"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    @error="handleImageError($event, doc)"
                  />

                  <!-- PDF / other document type -->
                  <div v-else class="flex flex-col items-center gap-2 text-slate-400">
                    <i class="pi pi-file text-3xl"></i>
                    <span class="text-xs">{{ getFileExtension(doc.fileName) }}</span>
                  </div>
                </div>
                <div class="p-2.5">
                  <p class="text-xs font-semibold text-slate-700 truncate">{{ doc.documentType }}</p>
                  <p class="text-[10px] text-slate-400 truncate mt-0.5">{{ doc.fileName }}</p>
                </div>
                <div class="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors flex items-center justify-center">
                  <i class="pi pi-eye text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"></i>
                </div>
              </div>
            </div>
            <div v-else class="bg-white rounded-xl border border-slate-100 p-6 text-center">
              <i class="pi pi-image text-3xl text-slate-300 mb-2"></i>
              <p class="text-sm text-slate-400">No documents uploaded by this applicant.</p>
            </div>
          </div>
        </div>
        <template #footer>
          <Button label="Close" icon="pi pi-times" text @click="closeModal" class="text-slate-600" />
        </template>
      </Dialog>

      <!-- IMAGE PREVIEW DIALOG -->
      <Dialog v-model:visible="showImagePreview" modal :header="previewDoc?.documentType || 'Document Preview'" :style="{ width: '80vw', maxWidth: '900px' }" :breakpoints="{ '960px': '90vw', '641px': '98vw' }" class="modern-dialog">
        <div v-if="previewDoc" class="flex flex-col items-center">
          <div class="w-full bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center min-h-[300px] max-h-[70vh]">
            <img
              v-if="isImageFile(previewDoc.fileName)"
              :src="loadedImageUrls[previewDoc.fileName] || getFileUrl(previewDoc.fileName)"
              :alt="previewDoc.documentType"
              class="max-w-full max-h-[70vh] object-contain"
              @error="handleImageError($event, previewDoc)"
            />
            <iframe
              v-else-if="isPdfFile(previewDoc.fileName)"
              :src="loadedImageUrls[previewDoc.fileName] || getFileUrl(previewDoc.fileName)"
              class="w-full h-[70vh] border-0"
            ></iframe>
            <div v-else class="flex flex-col items-center gap-3 p-8 text-slate-400">
              <i class="pi pi-file text-5xl"></i>
              <p class="text-sm">This file type cannot be previewed inline.</p>
            </div>
          </div>
          <div class="mt-4 flex items-center gap-3">
            <a :href="getFileUrl(previewDoc.fileName)" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
              <i class="pi pi-external-link"></i>
              Open in New Tab
            </a>
            <span class="text-xs text-slate-400">{{ previewDoc.fileName }}</span>
          </div>
        </div>
        <template #footer>
          <Button label="Close" icon="pi pi-times" text @click="showImagePreview = false" class="text-slate-600" />
        </template>
      </Dialog>

      <!-- PAYMENT MODAL -->
      <Dialog v-model:visible="showPaymentModal" modal :header="paymentModalTitle" :style="{ width: '400px' }" class="modern-dialog">
        <div v-if="selectedPaymentStakeholder.id" class="pt-2">
          
          <div class="mb-5 flex justify-between items-center text-sm">
            <span class="text-slate-500 font-medium">Receipt No:</span>
            <span class="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">{{ receiptPreview }}</span>
          </div>

          <div class="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 mb-6">
            <h4 class="font-bold text-indigo-900 mb-1">{{ selectedPaymentStakeholder.lastName }}, {{ selectedPaymentStakeholder.firstName }}</h4>
            <p class="text-indigo-600/80 text-sm font-medium">{{ selectedPaymentStakeholder.businessName }}</p>
          </div>

          <div class="space-y-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-bold text-slate-700">{{ totalAmountLabel }}</label>
              <InputNumber v-model="totalAdvanceAmount" inputId="total" mode="currency" currency="PHP" locale="en-PH" class="w-full" />
            </div>

            <div v-if="!isBusinessPermitMode" class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Current Balance</span>
                <strong class="text-slate-800">₱{{ Number(selectedPaymentStakeholder.advanceBalance || 0).toLocaleString() }}</strong>
              </div>
              <div class="flex justify-between text-sm border-t border-slate-200 pt-3">
                <span class="text-slate-500 font-medium">Remaining Needed</span>
                <strong :class="remainingRequiredBalance > 0 ? 'text-rose-600' : 'text-emerald-600'">
                  ₱{{ remainingRequiredBalance.toLocaleString() }}
                </strong>
              </div>
              <div v-if="excessPayment > 0" class="flex justify-between text-sm border-t border-emerald-100 pt-3">
                <span class="text-emerald-600 font-medium">Excess Payment</span>
                <strong class="text-emerald-600">₱{{ excessPayment.toLocaleString() }}</strong>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-bold text-slate-700">Payment Amount</label>
              <InputNumber v-model="paymentAmount" inputId="payment" mode="currency" currency="PHP" locale="en-PH" class="w-full font-bold" />
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2 pt-4">
            <Button label="Cancel" icon="pi pi-times" text @click="closePaymentModal" class="text-slate-600" />
            <Button :label="confirmPaymentLabel" icon="pi pi-check" @click="recordPayment" :loading="isRecordingPayment" severity="success" class="shadow-sm" />
          </div>
        </template>
      </Dialog>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import api from '../services/api'
import { API_ORIGIN } from '../config/apiConfig'
import { AUTH_TOKEN_KEY } from '../stores/auth'
import { FilterMatchMode } from '@primevue/core/api'
import TreasurerMenu from '../components/TreasurerMenu.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import { useToast } from "primevue/usetoast"

const toast = useToast()

// =========================
// DATA
// =========================
const stakeholders = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

const showModal = ref(false)
const selectedApplicant = ref({})

const totalAdvanceAmount = ref(null)
const paymentAmount = ref(null)

// PAYMENT MODAL
const showPaymentModal = ref(false)
const selectedPaymentStakeholder = ref({})
const receiptPreview = ref('')
const isRecordingPayment = ref(false)
const approvingId = ref(null)

// IMAGE PREVIEW
const showImagePreview = ref(false)
const previewDoc = ref(null)
const loadedImageUrls = ref({})
const loadingImages = ref({})
const imageFailed = ref({})

// =========================
// COMPUTED
// =========================
const remainingRequiredBalance = computed(() => {
  const currentBalance = Number(selectedPaymentStakeholder.value.advanceBalance || 0)
  const requiredAmount = Number(totalAdvanceAmount.value || 0)
  return Math.max(requiredAmount - currentBalance, 0)
})

const excessPayment = computed(() => {
  const currentBalance = Number(selectedPaymentStakeholder.value.advanceBalance || 0)
  const payment = Number(paymentAmount.value || 0)
  const requiredAmount = Number(totalAdvanceAmount.value || 0)
  const totalAfterPayment = currentBalance + payment
  return totalAfterPayment > requiredAmount ? totalAfterPayment - requiredAmount : 0
})

const isBusinessPermitMode = computed(() => {
  return selectedPaymentStakeholder.value.applicationStatus === 'PENDING_BUSINESS_PERMIT_PAYMENT'
})

const paymentModalTitle = computed(() => {
  return isBusinessPermitMode.value ? 'Record Business Permit Payment' : 'Record Advance Payment'
})

const totalAmountLabel = computed(() => {
  return isBusinessPermitMode.value ? 'Business Permit Amount' : 'Total Advance Amount Required'
})

const confirmPaymentLabel = computed(() => {
  return isBusinessPermitMode.value ? 'Confirm Business Permit Payment' : 'Confirm Advance Payment'
})

// =========================
// LIFECYCLE
// =========================
onMounted(() => {
  fetchStakeholders()
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

async function fetchStakeholders() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get('/stakeholders/for-approval')
    stakeholders.value = response.data
  } catch (error) {
    console.error('Failed to fetch stakeholders', error)
    errorMessage.value = error.message || 'Failed to load applicants for approval.'
    stakeholders.value = []
  } finally {
    isLoading.value = false
  }
}

function isAdvancePaid(item) {
  return Boolean(item.advancePaymentPaid || item.advancePaymentCompleted || item.advancePayment) ||
    (
      Number(item.totalAdvanceAmount || 0) > 0 &&
      Number(item.advanceBalance || 0) >= Number(item.totalAdvanceAmount || 0)
    )
}

function isAwaitingBusinessPermitPayment(item) {
  return item.applicationStatus === 'PENDING_BUSINESS_PERMIT_PAYMENT'
}

function canRecordPayment(item) {
  return !isAdvancePaid(item) || isAwaitingBusinessPermitPayment(item)
}

function paymentTooltip(item) {
  return isAwaitingBusinessPermitPayment(item)
    ? 'Record Business Permit Payment'
    : 'Approve and Record Advance Payment'
}

// =========================
// VIEW MODAL
// =========================
function openModal(item) {
  console.log('Applicant data:', JSON.parse(JSON.stringify(item)))

  // If item already has a documents array, use it.
  // Otherwise, build one from flat fileName fields the backend may return.
  if (!item.documents || !item.documents.length) {
    const docs = []
    const fieldMap = [
      { key: 'letterOfIntent', label: 'Letter of Intent' },
      { key: 'validID', label: 'Valid ID' },
      { key: 'postUpload1', label: 'Post-Contract Upload 1' },
      { key: 'postUpload2', label: 'Post-Contract Upload 2' },
      { key: 'applicationForm', label: 'Application Form' },
      { key: 'avatar', label: 'Profile Photo' },
    ]
    for (const { key, label } of fieldMap) {
      const fileName = item[key + 'FileName'] || item[key + 'File'] || item[key + 'Url']
      if (fileName && typeof fileName === 'string' && fileName.trim() !== '') {
        docs.push({ id: key, documentType: label, fileName })
      }
    }
    // Also check for idFileName / letterFileName (from /applications endpoint)
    if (item.idFileName && typeof item.idFileName === 'string') {
      docs.push({ id: 'id', documentType: 'Valid ID', fileName: item.idFileName })
    }
    if (item.letterFileName && typeof item.letterFileName === 'string') {
      docs.push({ id: 'letter', documentType: 'Letter of Intent', fileName: item.letterFileName })
    }
    if (docs.length) {
      item.documents = docs
    }
  }

  // Ensure documents have valid fileName and proactively fetch image blobs with authentication
  if (item.documents && item.documents.length) {
    for (const doc of item.documents) {
      if (!doc.fileName && doc.filePath) {
        doc.fileName = doc.filePath.split(/[/\\]/).pop()
      }
      if (doc.fileName && (isImageFile(doc.fileName) || isPdfFile(doc.fileName))) {
        fetchImageBlob(doc.fileName)
      }
    }
  }

  selectedApplicant.value = item
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedApplicant.value = {}
}

// =========================
// IMAGE / DOCUMENT HELPERS
// =========================
function getFileUrl(fileName) {
  if (!fileName) return ''
  if (fileName.startsWith('data:') || fileName.startsWith('blob:')) return fileName
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) return fileName
  const cleaned = fileName.replace(/^\/?(uploads\/)?/, '')
  return `${API_ORIGIN}/uploads/${cleaned}`
}

async function fetchImageBlob(fileName) {
  if (!fileName || loadedImageUrls.value[fileName]) return
  const url = getFileUrl(fileName)
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    loadedImageUrls.value[fileName] = url
    return
  }

  loadingImages.value[fileName] = true
  imageFailed.value[fileName] = false

  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    let res = await fetch(url, { headers })
    if (!res.ok && !url.includes('/api/uploads/')) {
      const altUrl = url.replace('/uploads/', '/api/uploads/')
      try {
        const altRes = await fetch(altUrl, { headers })
        if (altRes.ok) res = altRes
      } catch (ignored) {}
    }

    if (res.ok) {
      const blob = await res.blob()
      loadedImageUrls.value[fileName] = URL.createObjectURL(blob)
    } else {
      console.warn(`[ImageLoad] Server returned ${res.status} for ${url}`)
      imageFailed.value[fileName] = true
    }
  } catch (err) {
    console.warn(`[ImageLoad] Error fetching ${url}:`, err)
    imageFailed.value[fileName] = true
  } finally {
    loadingImages.value[fileName] = false
  }
}

function isImageFile(fileName) {
  if (!fileName) return false
  if (fileName.startsWith('data:image/')) return true
  const ext = fileName.split(/[#?]/)[0].split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
}

function isPdfFile(fileName) {
  if (!fileName) return false
  if (fileName.startsWith('data:application/pdf')) return true
  const ext = fileName.split(/[#?]/)[0].split('.').pop().toLowerCase()
  return ext === 'pdf'
}

function getFileExtension(fileName) {
  if (!fileName) return ''
  if (fileName.startsWith('data:image/')) return '.IMG'
  if (fileName.startsWith('data:application/pdf')) return '.PDF'
  return '.' + fileName.split(/[#?]/)[0].split('.').pop().toUpperCase()
}

function openImagePreview(doc) {
  previewDoc.value = doc
  if (doc?.fileName && !loadedImageUrls.value[doc.fileName]) {
    fetchImageBlob(doc.fileName)
  }
  showImagePreview.value = true
}

function handleImageError(event, doc) {
  event.target.style.display = 'none'
  const parent = event.target.parentElement
  if (parent && !parent.querySelector('.img-fallback-box')) {
    const fallback = document.createElement('div')
    fallback.className = 'img-fallback-box flex flex-col items-center justify-center gap-1.5 text-slate-400 p-3 text-center w-full h-full'
    fallback.innerHTML = `
      <i class="pi pi-exclamation-triangle text-2xl text-amber-400"></i>
      <span class="text-xs font-semibold text-slate-600">File Not Found</span>
      <span class="text-[10px] text-slate-400 leading-tight">Server file is missing (404) or was wiped during server restart</span>
    `
    parent.appendChild(fallback)
  }
}

// =========================
// PAYMENT MODAL
// =========================
function openPaymentModal(item) {
  selectedPaymentStakeholder.value = item
  paymentAmount.value = null
  totalAdvanceAmount.value = isAwaitingBusinessPermitPayment(item)
    ? null
    : item.totalAdvanceAmount ? Number(item.totalAdvanceAmount) : null
  receiptPreview.value = (isAwaitingBusinessPermitPayment(item) ? 'BPL-' : 'ADV-') + Date.now()
  showPaymentModal.value = true
}

function closePaymentModal() {
  showPaymentModal.value = false
  selectedPaymentStakeholder.value = {}
  paymentAmount.value = null
  totalAdvanceAmount.value = null
}

// =========================
// RECORD PAYMENT
// =========================
async function recordPayment() {
  isRecordingPayment.value = true

  try {
    if (!paymentAmount.value || Number(paymentAmount.value) <= 0) {
      alert('Please enter valid payment amount')
      return
    }

    if (!isBusinessPermitMode.value && (!totalAdvanceAmount.value || Number(totalAdvanceAmount.value) <= 0)) {
      alert('Please enter total advance amount')
      return
    }

    const paymentData = {
      amount: Number(paymentAmount.value),
      referenceNo: receiptPreview.value
    }

    if (isBusinessPermitMode.value) {
      await api.post(`/stakeholders/${selectedPaymentStakeholder.value.id}/applicant-fee`, paymentData)
      alert('Business permit payment recorded successfully')
    } else {
      paymentData.totalAdvanceAmount = Number(totalAdvanceAmount.value)
      await api.post(`/stakeholders/${selectedPaymentStakeholder.value.id}/treasurer-approve`, paymentData)
      alert('Treasurer approval and advance payment recorded successfully')
    }

    closePaymentModal()
    await fetchStakeholders()
  } catch (error) {
    console.error(error)
    alert(error.message || 'Failed to record payment')
  } finally {
    isRecordingPayment.value = false
  }
}

async function approveApplicant(item) {
  approvingId.value = item.id

  try {
    await api.put(`/stakeholders/${item.id}/approve`)
    await fetchStakeholders()
    alert('Applicant approved successfully.')
  } catch (error) {
    console.error(error)
    alert(error.message || 'Approval failed')
  } finally {
    approvingId.value = null
  }
}

async function rejectApplicant(item) {
  const reason = prompt('Reject this applicant? Enter rejection reason:')

  if (reason === null) return

  approvingId.value = item.id

  try {
    await api.put(`/stakeholders/${item.id}/reject`, null, {
      params: { remarks: reason }
    })
    await fetchStakeholders()
    alert('Applicant rejected.')
  } catch (error) {
    console.error(error)
    alert(error.message || 'Rejection failed')
  } finally {
    approvingId.value = null
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
