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
                Receipt #
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

              <td class="cell-wrap">
                <span v-if="getApplicantReceipt(app)" class="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                  <i class="pi pi-receipt text-indigo-500 text-xs"></i>
                  {{ getApplicantReceipt(app) }}
                </span>
                <span v-else class="text-xs text-slate-400 italic">No receipt</span>
              </td>

              <td>
                <span :class="['status-badge', statusClass(app.marketApprovalStatus)]">
                  {{ app.marketApprovalStatus || 'PENDING' }}
                </span>
              </td>

              <td>

                <div style="display:flex;gap:8px;align-items:center;">

                  <Button
                    icon="pi pi-eye"
                    text
                    rounded
                    severity="secondary"
                    @click="open(app)"
                    v-tooltip="'View Details'"
                  />

                  <!-- IF advancePayment = true -->
                  <template v-if="app.advancePayment === true">

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

                </div>

              </td>

            </tr>

            <tr v-if="pendingApplicants.length === 0">

              <td
                colspan="5"
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
    <Dialog
      v-model:visible="showModal"
      modal
      header="Stakeholder Details"
      :style="{ width: '50vw' }"
      :breakpoints="{ '960px': '75vw', '641px': '95vw' }"
      class="modern-dialog"
    >
      <div v-if="selected.id" class="p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div class="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200">
          <div class="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-sm">
            {{ selected.firstName?.charAt(0) }}{{ selected.lastName?.charAt(0) }}
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-800">{{ selected.lastName }}, {{ selected.firstName }} {{ selected.middleName || '' }}</h3>
            <p class="text-slate-500">{{ selected.businessName }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <div>
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact</span>
            <p class="text-slate-800 font-medium">{{ selected.contact }}</p>
          </div>
          <div>
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</span>
            <p class="text-slate-800 font-medium">{{ selected.email }}</p>
          </div>
          <div>
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Business Type</span>
            <p class="text-slate-800 font-medium">{{ selected.businessType }}</p>
          </div>
          <div class="sm:col-span-2">
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Address</span>
            <p class="text-slate-800 font-medium">{{ selected.address }}</p>
          </div>
        </div>

        <div class="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Selected Stall</span>
            <p class="text-base font-bold text-indigo-600 truncate">
              <span v-if="selected.selectedStall">
                {{ selected.selectedStall.stallNo }} - {{ selected.selectedStall.stallType }}
              </span>
              <span v-else class="text-slate-400 font-normal text-sm">
                No selected stall
              </span>
            </p>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Receipt Number</span>
            <p v-if="getApplicantReceipt(selected)" class="text-sm font-bold font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 mt-0.5">
              <i class="pi pi-receipt text-indigo-500"></i>
              {{ getApplicantReceipt(selected) }}
            </p>
            <p v-else class="text-slate-400 font-normal text-xs italic mt-1">
              No receipt issued
            </p>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Market Approval</span>
            <span :class="['status-badge', statusClass(selected.marketApprovalStatus)]">
              {{ selected.marketApprovalStatus || 'PENDING' }}
            </span>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Advance Payment</span>
              <p class="text-sm font-semibold text-slate-700">
                {{ selected.advanceBalance ? '₱' + Number(selected.advanceBalance || 0).toLocaleString() : (selected.advancePayment ? 'Paid' : 'Unpaid') }}
              </p>
            </div>
            <div>
              <Tag v-if="selected.advancePayment || selected.advancePaymentPaid || selected.advancePaymentCompleted" 
                 value="PAID" severity="success" rounded class="!bg-emerald-100 !text-emerald-700 !font-bold" />
              <Tag v-else 
                 value="UNPAID" severity="danger" rounded class="!bg-rose-100 !text-rose-700 !font-bold" />
            </div>
          </div>
        </div>

        <!-- SUBMITTED DOCUMENTS / IMAGES -->
        <div class="mt-6 pt-6 border-t border-slate-200">
          <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Submitted Documents</h4>
          <div v-if="selected.documents && selected.documents.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              v-for="doc in selected.documents"
              :key="doc.id || doc.filePath || doc.fileName"
              class="group relative bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all"
              @click="openImagePreview(doc)"
            >
              <div class="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden relative">
                <!-- Loading spinner -->
                <div v-if="loadingImages[getDocKey(doc)]" class="flex flex-col items-center justify-center gap-1.5 text-indigo-500">
                  <i class="pi pi-spin pi-spinner text-2xl"></i>
                  <span class="text-[10px] text-slate-400">Loading...</span>
                </div>

                <!-- Image loaded via blob -->
                <img
                  v-else-if="isImageFile(doc) && loadedImageUrls[getDocKey(doc)]"
                  :src="loadedImageUrls[getDocKey(doc)]"
                  :alt="doc.documentType"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  @error="handleImageError($event, doc)"
                />

                <!-- Image fallback using direct URL -->
                <img
                  v-else-if="isImageFile(doc) && !imageFailed[getDocKey(doc)]"
                  :src="getDocUrl(doc)"
                  :alt="doc.documentType"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  @error="handleImageError($event, doc)"
                />

                <!-- Image failed (missing or error) -->
                <div
                  v-else-if="isImageFile(doc) && imageFailed[getDocKey(doc)]"
                  class="flex flex-col items-center justify-center gap-1 text-slate-400 p-2 text-center w-full h-full"
                >
                  <i class="pi pi-exclamation-triangle text-2xl text-amber-400"></i>
                  <span class="text-xs font-semibold text-slate-600">File Not Found</span>
                  <span class="text-[9px] text-slate-400 leading-tight">Image load error</span>
                </div>

                <!-- PDF / other document type -->
                <div v-else class="flex flex-col items-center gap-2 text-slate-400">
                  <i class="pi pi-file text-3xl"></i>
                  <span class="text-xs">{{ getFileExtension(doc) }}</span>
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
        <Button label="Close" icon="pi pi-times" text @click="close" class="text-slate-600" />
      </template>
    </Dialog>

    <!-- IMAGE PREVIEW DIALOG -->
    <Dialog
      v-model:visible="showImagePreview"
      modal
      :header="previewDoc?.documentType || 'Document Preview'"
      :style="{ width: '80vw', maxWidth: '900px' }"
      :breakpoints="{ '960px': '90vw', '641px': '98vw' }"
      class="modern-dialog"
    >
      <div v-if="previewDoc" class="flex flex-col items-center">
        <div class="w-full bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center min-h-[300px] max-h-[70vh]">
          <img
            v-if="isImageFile(previewDoc.fileName)"
            :src="loadedImageUrls[getDocKey(previewDoc)] || getDocUrl(previewDoc)"
            :alt="previewDoc.documentType"
            class="max-w-full max-h-[70vh] object-contain"
            @error="handleImageError($event, previewDoc)"
          />
          <iframe
            v-else-if="isPdfFile(previewDoc.fileName)"
            :src="loadedImageUrls[getDocKey(previewDoc)] || getDocUrl(previewDoc)"
            class="w-full h-[70vh] border-0"
          ></iframe>
          <div v-else class="flex flex-col items-center gap-3 p-8 text-slate-400">
            <i class="pi pi-file text-5xl"></i>
            <p class="text-sm">This file type cannot be previewed inline.</p>
          </div>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <a
            :href="getDocUrl(previewDoc)"
            target="_blank"
            class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
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

  </div>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import api from '../services/api'
import { API_ORIGIN } from '../config/apiConfig'
import { AUTH_TOKEN_KEY } from '../stores/auth'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'

import MarketSupervisorMenu
from '../components/MarketSupervisorMenu.vue'

const confirm = useConfirm()
const applications = ref([])
const showModal = ref(false)
const selected = ref({})

// IMAGE PREVIEW
const showImagePreview = ref(false)
const previewDoc = ref(null)
const loadedImageUrls = ref({})
const loadingImages = ref({})
const imageFailed = ref({})

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
// OPEN / CLOSE MODAL
// =========================
function extractFileName(val) {
  if (!val) return 'document'
  const clean = String(val).split('?')[0]
  const slashParts = clean.split('/')
  const lastPart = slashParts[slashParts.length - 1]
  const backslashParts = lastPart.split('\\\\')
  return backslashParts[backslashParts.length - 1] || 'document'
}

function open(app) {
  let docs = Array.isArray(app.documents) ? [...app.documents] : []

  const fieldMap = [
    { key: 'letterOfIntent', label: 'Letter of Intent' },
    { key: 'validID', label: 'Valid ID' },
    { key: 'postUpload1', label: 'Post-Contract Upload 1' },
    { key: 'postUpload2', label: 'Post-Contract Upload 2' },
    { key: 'applicationForm', label: 'Application Form' },
    { key: 'avatar', label: 'Profile Photo' },
  ]
  for (const { key, label } of fieldMap) {
    const rawVal = app[key + 'FileName'] || app[key + 'File'] || app[key + 'Url'] || app[key + '_url']
    if (rawVal && typeof rawVal === 'string' && rawVal.trim() !== '') {
      if (!docs.some(d => (d.documentType || d.document_type) === label)) {
        docs.push({ id: key, documentType: label, fileName: extractFileName(rawVal), filePath: app[key + 'Url'] || app[key + '_url'] || rawVal })
      }
    }
  }

  const idUrl = app.idDocumentUrl || app.id_document_url || app.idUrl
  if (idUrl && !docs.some(d => (d.documentType || d.document_type) === 'VALID_ID' || (d.documentType || d.document_type) === 'Valid ID')) {
    docs.push({
      id: 'valid_id',
      documentType: 'Valid ID',
      fileName: app.idFileName || app.id_file_name || extractFileName(idUrl),
      filePath: idUrl
    })
  }

  const letterUrl = app.letterDocumentUrl || app.letter_document_url || app.letterUrl
  if (letterUrl && !docs.some(d => (d.documentType || d.document_type) === 'APPLICATION_LETTER' || (d.documentType || d.document_type) === 'Letter of Intent')) {
    docs.push({
      id: 'letter_of_intent',
      documentType: 'Letter of Intent',
      fileName: app.letterFileName || app.letter_file_name || extractFileName(letterUrl),
      filePath: letterUrl
    })
  }

  docs = docs.map((doc, idx) => {
    const filePath = doc.filePath || doc.file_path || doc.url || ''
    const fileName = doc.fileName || doc.file_name || (filePath ? extractFileName(filePath) : 'document_' + (idx + 1))
    const documentType = doc.documentType || doc.document_type || 'Document'
    return {
      ...doc,
      id: doc.id || fileName,
      fileName,
      filePath: filePath || fileName,
      documentType
    }
  })

  app.documents = docs

  for (const doc of docs) {
    if (isImageFile(doc) || isPdfFile(doc)) {
      fetchImageBlob(doc)
    }
  }

  selected.value = app
  showModal.value = true
}

function close() {
  showModal.value = false
  selected.value = {}
}

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
  confirm.require({
    header: 'Reject Application',
    message: 'Are you sure you want to reject this market approval? This action cannot be undone.',
    acceptLabel: 'Reject',
    rejectLabel: 'Cancel',
    severity: 'danger',
    accept: async () => {
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
  })
}

function getApplicantReceipt(app) {
  if (!app) return ''
  if (app.receiptNo || app.receipt_no) return app.receiptNo || app.receipt_no
  if (app.advanceReceiptNo || app.advance_receipt_no) return app.advanceReceiptNo || app.advance_receipt_no
  if (Array.isArray(app.payments) && app.payments.length > 0) {
    const adv = app.payments.find(p => p.paymentType === 'ADVANCE_PAYMENT' || p.payment_type === 'ADVANCE_PAYMENT')
    if (adv?.receiptNo || adv?.receipt_no) return adv.receiptNo || adv.receipt_no
    const latest = app.payments[0]
    if (latest?.receiptNo || latest?.receipt_no) return latest.receiptNo || latest.receipt_no
  }
  if (app.referenceNo || app.reference_no) return app.referenceNo || app.reference_no
  return ''
}

function statusClass(status) {
  return String(status || 'PENDING').toLowerCase()
}

// =========================
// IMAGE / DOCUMENT HELPERS
// =========================
function getDocKey(doc) {
  if (!doc) return ''
  if (typeof doc === 'string') return doc
  return String(doc.filePath || doc.file_path || doc.fileName || doc.file_name || doc.id || '')
}

function getDocUrl(doc) {
  if (!doc) return ''
  let target = (typeof doc === 'object') ? (doc.filePath || doc.file_path || doc.url || doc.fileName || doc.file_name || '') : String(doc || '')
  if (!target) return ''

  if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('data:') || target.startsWith('blob:')) {
    return target
  }

  if (target.includes('applications/') || target.includes('stalls/') || target.includes('documents/') || target.startsWith('uploads/')) {
    const clean = target.replace(/^\/?(uploads\/)?/, '')
    return 'https://uzykxxphunglcwojoqtf.supabase.co/storage/v1/object/public/uploads/' + clean
  }

  const cleaned = target.replace(/^\/?(uploads\/)?/, '')
  return API_ORIGIN + '/uploads/' + cleaned
}

function getFileUrl(fileName, doc = null) {
  return getDocUrl(doc || fileName)
}

async function fetchImageBlob(docOrFileName) {
  const key = getDocKey(docOrFileName)
  if (!key || loadedImageUrls.value[key]) return

  const url = getDocUrl(docOrFileName)
  if (!url) return

  if (url.startsWith('data:') || url.startsWith('blob:')) {
    loadedImageUrls.value[key] = url
    return
  }

  loadingImages.value[key] = true
  imageFailed.value[key] = false

  try {
    const isSupabase = url.includes('supabase.co')
    const headers = isSupabase ? {} : {
      Authorization: 'Bearer ' + (localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('token') || '')
    }

    let res = await fetch(url, { headers })
    if (!res.ok && !url.includes('/api/uploads/') && !isSupabase) {
      const altUrl = url.replace('/uploads/', '/api/uploads/')
      try {
        const altRes = await fetch(altUrl, { headers })
        if (altRes.ok) res = altRes
      } catch (ignored) {}
    }

    if (res.ok) {
      const blob = await res.blob()
      loadedImageUrls.value[key] = URL.createObjectURL(blob)
    } else {
      console.warn('[ImageLoad] Server returned ' + res.status + ' for ' + url)
      if (url.startsWith('http')) {
        loadedImageUrls.value[key] = url
      } else {
        imageFailed.value[key] = true
      }
    }
  } catch (err) {
    console.warn('[ImageLoad] Error fetching ' + url + ':', err)
    if (url.startsWith('http')) {
      loadedImageUrls.value[key] = url
    } else {
      imageFailed.value[key] = true
    }
  } finally {
    loadingImages.value[key] = false
  }
}

function isImageFile(doc) {
  const target = (typeof doc === 'object') ? (doc?.filePath || doc?.file_path || doc?.fileName || doc?.file_name || '') : String(doc || '')
  if (!target) return false
  if (target.startsWith('data:image/')) return true
  const clean = target.split('?')[0].split('#')[0]
  const ext = clean.split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
}

function isPdfFile(doc) {
  const target = (typeof doc === 'object') ? (doc?.filePath || doc?.file_path || doc?.fileName || doc?.file_name || '') : String(doc || '')
  if (!target) return false
  if (target.startsWith('data:application/pdf')) return true
  const clean = target.split('?')[0].split('#')[0]
  const ext = clean.split('.').pop().toLowerCase()
  return ext === 'pdf'
}

function getFileExtension(doc) {
  const target = (typeof doc === 'object') ? (doc?.filePath || doc?.file_path || doc?.fileName || doc?.file_name || '') : String(doc || '')
  if (!target) return ''
  if (target.startsWith('data:image/')) return '.IMG'
  if (target.startsWith('data:application/pdf')) return '.PDF'
  const clean = target.split('?')[0].split('#')[0]
  return '.' + clean.split('.').pop().toUpperCase()
}

function openImagePreview(doc) {
  previewDoc.value = doc
  const key = getDocKey(doc)
  if (key && !loadedImageUrls.value[key]) {
    fetchImageBlob(doc)
  }
  showImagePreview.value = true
}

function handleImageError(event, doc) {
  const key = getDocKey(doc)
  if (key) imageFailed.value[key] = true
  event.target.style.display = 'none'
  const parent = event.target.parentElement
  if (parent && !parent.querySelector('.img-fallback-box')) {
    const fallback = document.createElement('div')
    fallback.className = 'img-fallback-box flex flex-col items-center justify-center gap-1.5 text-slate-400 p-3 text-center w-full h-full'
    fallback.innerHTML = '<i class="pi pi-exclamation-triangle text-2xl text-amber-400"></i><span class="text-xs font-semibold text-slate-600">File Not Found</span><span class="text-[10px] text-slate-400 leading-tight">Image could not be loaded</span>'
    parent.appendChild(fallback)
  }
}

// =========================
// ON MOUNT
// =========================

onMounted(() => {
  loadApplications()
})
</script>

<style scoped src="./dashboard.css"></style>
