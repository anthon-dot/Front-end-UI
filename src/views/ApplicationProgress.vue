<template>
  <main class="progress-wrapper">
    <Toast />

    <div class="page-header">
      <div>
        <h1>Application Progress</h1>
        <p>Track your public market rental approval across each office.</p>
      </div>
      <div class="header-actions">
        <Tag
          v-if="stakeholder"
          :value="stakeholder.applicationStatus || stakeholder.application_status || 'PENDING'"
          :severity="overallSeverity"
        />
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          size="small"
          :loading="isRefreshing"
          @click="loadProgress(false)"
        />
        <Button
          label="Log Out"
          icon="pi pi-sign-out"
          severity="danger"
          outlined
          size="small"
          class="logout-btn"
          @click="logout"
        />
      </div>
    </div>

    <!-- Application & Document Tracking Overview Card -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 mb-6 shadow-md border border-indigo-900/50">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 text-xs font-mono font-bold rounded border border-indigo-400/30">
              <i class="pi pi-file mr-1"></i> Tracking No: {{ applicationTrackingNo }}
            </span>
            <Tag :value="currentHoldingOffice" severity="info" rounded class="!text-[11px] font-bold" />
          </div>
          <h2 class="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>Current Office:</span>
            <span class="text-amber-400">{{ currentHoldingOffice }}</span>
          </h2>
          <p class="text-xs text-slate-300 mt-1 max-w-2xl">
            {{ currentOfficeAction }}
          </p>
        </div>

        <div class="flex items-center gap-3 bg-white/10 backdrop-blur px-4 py-3 rounded-xl border border-white/10 self-start md:self-auto">
          <div class="text-right">
            <span class="text-[10px] uppercase tracking-wider text-slate-300 block font-semibold">Workflow Status</span>
            <strong class="text-sm font-extrabold text-emerald-300">
              {{ stakeholder?.applicationStatus || stakeholder?.application_status || 'PENDING' }}
            </strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Dedicated Market Stall Selection & Advance Payment Baseline Card -->
    <div class="stall-selection-hero-card" :class="{ 'has-stall': Boolean(stallInfo) }">
      <div class="stall-hero-header">
        <div class="stall-hero-title-wrap">
          <div class="stall-hero-icon" :class="{ 'is-reserved': Boolean(stallInfo) && !isStallAssigned, 'is-active': isStallAssigned }">
            <i class="pi pi-shop"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="stall-hero-title">
                {{ stallInfo ? `Target Stall: Stall #${stallInfo.stallNo || stallInfo.number}` : 'Select Your Market Stall' }}
              </h2>
              <Tag
                v-if="stallInfo"
                :value="isStallAssigned ? 'STALL ASSIGNED (ACTIVE)' : 'RESERVED (PENDING APPROVAL)'"
                :severity="isStallAssigned ? 'success' : 'warn'"
                rounded
              />
            </div>
            <p class="stall-hero-subtitle">
              {{ stallInfo 
                  ? 'Your selected stall is reserved with occupant status PENDING. Baseline is set to 2 months advance payment.' 
                  : 'Choose an available vacant stall in Manticao Public Market to calculate your 2-month advance payment requirement.' }}
            </p>
          </div>
        </div>

        <div v-if="stallInfo && !isStallAssigned" class="stall-hero-actions">
          <Button
            label="Change Stall"
            icon="pi pi-pencil"
            severity="secondary"
            outlined
            size="small"
            @click="openSelectStallModal"
          />
        </div>
      </div>

      <!-- If stall is selected: Full Breakdown Display -->
      <div v-if="stallInfo" class="stall-details-grid">
        <div class="stall-detail-item">
          <span class="detail-label">Stall Number</span>
          <strong class="detail-val">#{{ stallInfo.stallNo || stallInfo.number }}</strong>
        </div>
        <div class="stall-detail-item">
          <span class="detail-label">Section / Classification</span>
          <strong class="detail-val">{{ stallInfo.stallType || stallInfo.section || 'Standard Stall' }}</strong>
        </div>
        <div class="stall-detail-item">
          <span class="detail-label">Monthly Rental Rate</span>
          <strong class="detail-val text-emerald-600">₱{{ Number(stallInfo.monthlyRent || stallInfo.monthly_rent || 0).toLocaleString() }}/month</strong>
        </div>
        <div class="stall-detail-item highlight-advance">
          <span class="detail-label">Required 2-Month Advance Payment</span>
          <strong class="detail-val text-amber-800">
            ₱{{ (Number(stallInfo.monthlyRent || stallInfo.monthly_rent || 0) * 2).toLocaleString() }}
            <small class="text-xs font-normal text-amber-700 block">(₱{{ Number(stallInfo.monthlyRent || stallInfo.monthly_rent || 0).toLocaleString() }}/mo × 2 months)</small>
          </strong>
        </div>
      </div>

      <!-- If NO stall is selected: Inline Stall Selector with live preview and confirm -->
      <div v-else class="stall-inline-picker">
        <div class="picker-row">
          <div class="picker-input-wrap">
            <label class="picker-label">Available Market Stalls <span class="text-rose-500">*</span></label>
            <div class="relative">
              <select
                v-model="inlineSelectedStallId"
                class="inline-stall-select"
                aria-label="Select market stall"
              >
                <option :value="null" disabled>-- Choose a vacant market stall from registry --</option>
                <option v-for="st in availableStalls" :key="st.id" :value="st.id">
                  Stall #{{ st.stallNo }} &bull; {{ st.stallType }} &bull; ₱{{ Number(st.monthlyRent || 0).toLocaleString() }}/mo
                </option>
              </select>
            </div>
          </div>

          <Button
            label="Confirm & Reserve Stall"
            icon="pi pi-check"
            severity="primary"
            class="btn-confirm-inline-stall"
            :disabled="!inlineSelectedStallId || isSavingStallSelection"
            :loading="isSavingStallSelection"
            @click="confirmInlineStallSelection"
          />
        </div>

        <!-- Live Preview of Advance Payment -->
        <div v-if="inlineStallPreview" class="inline-calc-preview">
          <div class="preview-badge-row">
            <span class="text-xs font-bold text-amber-900">
              <i class="pi pi-calculator mr-1"></i> 2-Month Advance Payment Calculation:
            </span>
            <span class="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-[11px] rounded-full">
              Baseline Calculated
            </span>
          </div>
          <div class="preview-numbers-grid">
            <div>
              <span class="preview-lbl">Selected Stall</span>
              <strong class="preview-num">Stall #{{ inlineStallPreview.stallNo }} ({{ inlineStallPreview.stallType }})</strong>
            </div>
            <div>
              <span class="preview-lbl">Monthly Rent</span>
              <strong class="preview-num">₱{{ Number(inlineStallPreview.monthlyRent || 0).toLocaleString() }}/mo</strong>
            </div>
            <div class="preview-total-box">
              <span class="preview-lbl text-amber-800">Total 2-Month Advance Required:</span>
              <strong class="preview-total-amt">₱{{ (Number(inlineStallPreview.monthlyRent || 0) * 2).toLocaleString() }}</strong>
            </div>
          </div>
          <p class="text-[11px] text-amber-800 mt-2">
            <i class="pi pi-info-circle mr-1"></i> Reserving this stall sets occupant status to <strong>PENDING</strong> and stall status to <strong>RESERVED</strong> until Mayor's approval, Treasurer advance payment recording, and Market Supervisor contract approval.
          </p>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="state-box">Loading application status...</div>
    <div v-else-if="errorMessage" class="state-box error">{{ errorMessage }}</div>

    <section v-else class="panel">
      <!-- Hazard-Free Stall Confirmation Callout when Steps 1-5 are Green -->
      <div v-if="isSteps1To5Green" class="hazard-callout-card" :class="{ 'is-confirmed': hasHazardFreeDoc }">
        <div class="hazard-callout-icon">
          <i :class="hasHazardFreeDoc ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'"></i>
        </div>
        <div class="hazard-callout-text">
          <div class="hazard-callout-title">
            <strong>{{ hasHazardFreeDoc ? 'Stall Hazard-Free Confirmation Submitted' : 'Action Required: Hazard-Free Stall Confirmation' }}</strong>
            <Tag
              :value="hasHazardFreeDoc ? 'VERIFIED' : 'UPLOAD REQUIRED'"
              :severity="hasHazardFreeDoc ? 'success' : 'warn'"
              rounded
            />
          </div>
          <p>
            {{
              hasHazardFreeDoc
                ? 'Your Hazard-Free Stall Confirmation has been recorded and submitted for BPLO and Endorsing Office validation.'
                : 'Steps 1–5 have been approved! Please upload your Hazard-Free Stall Confirmation so BPLO and Endorsing Office can proceed with final business permit verification.'
            }}
          </p>
          <small v-if="hazardDocInfo" class="hazard-doc-filename">
            📄 {{ hazardDocInfo.name }}
          </small>
        </div>
        <div class="hazard-callout-actions">
          <a
            v-if="hasHazardFreeDoc && hazardDocInfo?.url"
            :href="hazardDocInfo.url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-view-doc"
          >
            <i class="pi pi-file"></i> View Document
          </a>
          <Button
            :label="hasHazardFreeDoc ? 'Re-upload' : 'Upload Confirmation'"
            :icon="hasHazardFreeDoc ? 'pi pi-sync' : 'pi pi-upload'"
            :severity="hasHazardFreeDoc ? 'secondary' : 'primary'"
            size="small"
            @click="openHazardModal"
          />
        </div>
      </div>

      <Timeline :value="steps" align="alternate" class="workflow-timeline">
        <template #marker="{ item }">
          <span :class="['circle', item.status]">{{ item.id }}</span>
        </template>

        <template #content="{ item }">
          <div class="step-card">
            <div>
              <h2>{{ item.title }}</h2>
              <p>{{ item.description }}</p>

              <!-- Step 1 Designated Stall Context -->
              <div v-if="item.id === 1" class="timeline-step-stall-box">
                <div v-if="stallInfo" class="flex items-center justify-between">
                  <span class="text-xs text-slate-700 font-medium">
                    <i class="pi pi-shop text-amber-600 mr-1"></i>
                    Target Stall: <strong>Stall #{{ stallInfo.stallNo || stallInfo.number }}</strong> ({{ stallInfo.stallType || stallInfo.section || 'Market Stall' }})
                  </span>
                  <button
                    v-if="!isStallAssigned"
                    type="button"
                    class="btn-text-change-stall"
                    @click="openSelectStallModal"
                  >
                    <i class="pi pi-pencil"></i> Change Stall
                  </button>
                </div>
                <div v-else class="flex items-center justify-between">
                  <span class="text-xs text-amber-700 font-semibold">
                    <i class="pi pi-exclamation-circle mr-1"></i> No market stall chosen yet
                  </span>
                  <button
                    type="button"
                    class="btn-text-select-stall"
                    @click="openSelectStallModal"
                  >
                    <i class="pi pi-plus-circle"></i> Select Stall
                  </button>
                </div>
              </div>

              <!-- Step 2 Mayor's Office Approval Context -->
              <div v-if="item.id === 2" class="timeline-step-stall-box">
                <span class="text-xs text-slate-600 block">
                  <i class="pi pi-shield text-indigo-600 mr-1"></i>
                  Office of the Municipal Mayor: Review of Letter of Intent & Valid Identification.
                </span>
              </div>

              <!-- Step 3 Advance Payment Calculation Breakdown -->
              <div v-if="item.id === 3" class="timeline-step-stall-box">
                <div v-if="stallInfo">
                  <span class="text-xs text-slate-500 block">2-Month Required Advance Baseline:</span>
                  <strong class="text-xs text-emerald-600 block mt-0.5">
                    ₱{{ (Number(stallInfo.monthlyRent || stallInfo.monthly_rent || 0) * 2).toLocaleString() }}
                    <span class="text-slate-400 font-normal"> (₱{{ Number(stallInfo.monthlyRent || stallInfo.monthly_rent || 0).toLocaleString() }}/mo × 2 months)</span>
                  </strong>
                </div>
                <div v-else>
                  <span class="text-xs text-slate-400 italic">Select a stall to compute your 2-month required advance payment.</span>
                </div>
              </div>
            </div>
            <Tag :value="statusLabel(item.status)" :severity="statusSeverity(item.status)" />
          </div>
        </template>
      </Timeline>

      <div v-if="requirements?.complete === false" class="requirements-callout">
        <div>
          <strong>Requirements need action</strong>
          <p>Upload the missing documents before dashboard access is enabled.</p>
        </div>
        <Button label="Upload Requirements" icon="pi pi-upload" @click="router.push('/requirements')" />
      </div>

      <div v-if="applicantFeeRequired" class="fee-callout">
        <div>
          <strong>Business permit payment required.</strong>
          <p>Dashboard access opens after the Treasurer records your business permit payment.</p>
        </div>
        <Button label="View Payment Status" icon="pi pi-wallet" @click="router.push('/applicant-fee')" />
      </div>
    </section>

    <!-- Dedicated Hazard-Free Stall Upload Modal -->
    <div v-if="showHazardModal" class="hazard-modal-backdrop" @click.self="closeHazardModal">
      <div class="hazard-modal-card">
        <div class="hazard-modal-header">
          <div class="hazard-header-title">
            <div class="hazard-icon-circle">
              <i class="pi pi-shield"></i>
            </div>
            <div>
              <h3>Confirmation of Hazard-Free Stall</h3>
              <p>Upload verification for your occupied stall</p>
            </div>
          </div>
          <button class="hazard-btn-close" @click="closeHazardModal">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="hazard-modal-body">
          <div v-if="stallInfo" class="hazard-stall-pill">
            <div class="pill-item">
              <span class="lbl">Occupied Stall</span>
              <strong>Stall {{ stallInfo.stallNo || stallInfo.number }}</strong>
            </div>
            <div class="pill-item">
              <span class="lbl">Section / Type</span>
              <strong>{{ stallInfo.section || stallInfo.stallType || 'Market' }}</strong>
            </div>
            <div class="pill-item">
              <span class="lbl">Status</span>
              <strong class="text-emerald-600">Assigned & Active</strong>
            </div>
          </div>

          <div class="hazard-instructions">
            <p>
              Please upload the official document confirming that your occupied stall is free from electrical, structural, fire, and health hazards. This confirmation is reviewed by the <strong>BPLO</strong> and <strong>Endorsing Office</strong>.
            </p>
          </div>

          <div
            class="hazard-dropzone"
            :class="{ 'has-file': Boolean(selectedHazardFile) }"
            @dragover.prevent
            @drop.prevent="onHazardDrop"
          >
            <input
              ref="hazardFileInput"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              class="hazard-hidden-input"
              @change="onHazardFileSelect"
            />
            <input
              ref="hazardCameraInput"
              type="file"
              accept="image/*"
              capture="environment"
              class="hazard-hidden-input"
              @change="onHazardFileSelect"
            />
            <div v-if="!selectedHazardFile" class="dropzone-prompt">
              <i class="pi pi-cloud-upload dropzone-icon"></i>
              <span>Choose how to attach your Hazard-Free confirmation:</span>
              <div style="display:flex;gap:10px;justify-content:center;margin-top:12px;flex-wrap:wrap">
                <button type="button" @click.stop="triggerHazardCamera" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;border:1px solid #0284c7;background:#f0f9ff;color:#0284c7;font-weight:600;font-size:0.85rem;cursor:pointer">
                  <i class="pi pi-camera"></i> Take Photo
                </button>
                <button type="button" @click.stop="triggerHazardFileInput" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;color:#334155;font-weight:600;font-size:0.85rem;cursor:pointer">
                  <i class="pi pi-folder-open"></i> Upload File / PDF
                </button>
              </div>
              <small style="margin-top:10px;display:block">Supported formats: PDF, PNG, JPG (Max: 10MB)</small>
            </div>
            <div v-else class="dropzone-selected-preview">
              <div class="file-info-row">
                <i class="pi pi-file-pdf file-type-icon"></i>
                <div class="file-details">
                  <span class="file-name">{{ selectedHazardFile.name }}</span>
                  <span class="file-size">{{ (selectedHazardFile.size / 1024).toFixed(1) }} KB</span>
                </div>
              </div>
              <button type="button" class="btn-remove-hazard-file" @click="selectedHazardFile = null">
                <i class="pi pi-trash"></i> Remove
              </button>
            </div>
          </div>

          <div v-if="hazardError" class="hazard-error-notice">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ hazardError }}</span>
          </div>
        </div>

        <div class="hazard-modal-footer">
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            size="small"
            @click="closeHazardModal"
          />
          <Button
            :label="isUploadingHazard ? 'Uploading...' : 'Upload & Submit Confirmation'"
            icon="pi pi-check"
            severity="primary"
            size="small"
            :disabled="!selectedHazardFile || isUploadingHazard"
            :loading="isUploadingHazard"
            @click="submitHazardFreeFile"
          />
        </div>
      </div>
    </div>

    <!-- Dedicated Select Stall Modal -->
    <div v-if="showSelectStallModal" class="hazard-modal-backdrop" @click.self="closeSelectStallModal">
      <div class="hazard-modal-card" style="max-width: 520px;">
        <div class="hazard-modal-header">
          <div class="hazard-header-title">
            <div class="hazard-icon-circle" style="background: #f59e0b; color: #fff;">
              <i class="pi pi-shop"></i>
            </div>
            <div>
              <h3>Select Market Stall</h3>
              <p>Choose an available stall to establish your 2-month advance payment baseline</p>
            </div>
          </div>
          <button class="hazard-btn-close" @click="closeSelectStallModal">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="hazard-modal-body">
          <div class="field mb-4">
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Available Market Stalls</label>
            <select v-model="selectedModalStallId" class="stall-select-input w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none" style="padding: 10px; border-radius: 10px; width: 100%;">
              <option :value="null" disabled>-- Choose a vacant market stall --</option>
              <option v-for="st in availableStalls" :key="st.id" :value="st.id">
                Stall #{{ st.stallNo }} &bull; {{ st.stallType }} &bull; ₱{{ Number(st.monthlyRent || 0).toLocaleString() }}/month
              </option>
            </select>
          </div>

          <!-- Calculation Preview Box -->
          <div v-if="modalStallInfo" class="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl mb-3" style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 12px; padding: 14px;">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-amber-900">Stall #{{ modalStallInfo.stallNo }} ({{ modalStallInfo.stallType }})</span>
              <Tag value="2-MONTH BASELINE" severity="warn" rounded class="text-[10px]" />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
              <div>
                <span class="text-slate-500 block text-xs">Monthly Rental Rate</span>
                <strong class="text-slate-900 text-sm">₱{{ Number(modalStallInfo.monthlyRent || 0).toLocaleString() }}/mo</strong>
              </div>
              <div>
                <span class="text-slate-500 block text-xs">Required Advance Payment (2 Mos)</span>
                <strong class="text-amber-800 text-sm" style="color: #b45309; font-size: 1.05rem;">₱{{ (Number(modalStallInfo.monthlyRent || 0) * 2).toLocaleString() }}</strong>
              </div>
            </div>
            <p class="text-[11px] text-amber-900/80 mt-2" style="margin-top: 10px; font-size: 0.8rem; color: #92400e;">
              <i class="pi pi-info-circle mr-1"></i>
              Upon confirmation, this stall will be <strong>Reserved</strong> for you (Occupant status: <strong>PENDING</strong>) until Mayor's approval, Treasurer advance payment recording, and Market Supervisor verification.
            </p>
          </div>

          <div v-if="stallSelectionError" class="hazard-error-notice">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ stallSelectionError }}</span>
          </div>
        </div>

        <div class="hazard-modal-footer">
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            size="small"
            @click="closeSelectStallModal"
          />
          <Button
            :label="isSavingStallSelection ? 'Saving Selection...' : 'Confirm Stall Selection'"
            icon="pi pi-check"
            severity="primary"
            size="small"
            :disabled="!selectedModalStallId || isSavingStallSelection"
            :loading="isSavingStallSelection"
            @click="confirmStallSelection"
          />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../config/supabase'
import api, { normalizeRecord } from '../services/api'
import { fetchStalls } from '../services/stallService'
import {
  getApplicationByUserId,
  getStakeholderByUserId,
  getStakeholderRequirements,
  isDashboardReady,
  uploadHazardFreeDocument
} from '../services/applicationService'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Timeline from 'primevue/timeline'
import Toast from 'primevue/toast'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

async function logout() {
  if (pollTimer) clearInterval(pollTimer)
  await authStore.clearSession()
  localStorage.removeItem('currentStakeholder')
  localStorage.removeItem('stakeholderId')
  router.push('/login')
}

const isLoading = ref(false)
const isRefreshing = ref(false)
const errorMessage = ref('')
const stakeholder = ref(null)
const requirements = ref(null)
let pollTimer = null

// Stall Selection State (Inline & Modal)
const showSelectStallModal = ref(false)
const stallsList = ref([])
const selectedModalStallId = ref(null)
const inlineSelectedStallId = ref(null)
const isSavingStallSelection = ref(false)
const stallSelectionError = ref('')

const availableStalls = computed(() => {
  return stallsList.value.filter(s => {
    const isAvail = s.status === 'AVAILABLE' || s.status === 'VACANT'
    const curStallId = stakeholder.value?.selectedStallId || stakeholder.value?.selected_stall_id || stakeholder.value?.stall?.id
    const isCurrent = curStallId && Number(s.id) === Number(curStallId)
    return isAvail || isCurrent
  })
})

const modalStallInfo = computed(() => {
  if (!selectedModalStallId.value) return null
  return stallsList.value.find(s => Number(s.id) === Number(selectedModalStallId.value)) || null
})

const inlineStallPreview = computed(() => {
  if (!inlineSelectedStallId.value) return null
  return stallsList.value.find(s => Number(s.id) === Number(inlineSelectedStallId.value)) || null
})

function openSelectStallModal() {
  stallSelectionError.value = ''
  const curStallId = stakeholder.value?.selectedStallId || stakeholder.value?.selected_stall_id || stakeholder.value?.stall?.id
  selectedModalStallId.value = curStallId ? Number(curStallId) : null
  showSelectStallModal.value = true
}

function closeSelectStallModal() {
  showSelectStallModal.value = false
  stallSelectionError.value = ''
}

async function confirmInlineStallSelection() {
  if (!inlineSelectedStallId.value) {
    toast.add({
      severity: 'warn',
      summary: 'Selection Required',
      detail: 'Please choose a vacant market stall.',
      life: 3000
    })
    return
  }
  isSavingStallSelection.value = true
  try {
    let sid = stakeholder.value?.stakeholderId || stakeholder.value?.id
    if (!sid) {
      const uid = localStorage.getItem('userId')
      if (uid) {
        const res = await api.get(`/stakeholders/user/${uid}`)
        if (res?.data?.id) sid = res.data.id
      }
    }
    if (!sid) throw new Error('Stakeholder ID is missing.')

    await api.put(`/stakeholders/${sid}/select-stall`, {
      stallId: inlineSelectedStallId.value
    })

    toast.add({
      severity: 'success',
      summary: 'Stall Reserved',
      detail: 'Target market stall selected! 3-month advance payment baseline calculated and occupant status set to PENDING.',
      life: 4500
    })

    await loadProgress(true)
  } catch (err) {
    console.error('[ApplicationProgress] inline stall selection error:', err)
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: err.message || 'Failed to update stall selection.',
      life: 4000
    })
  } finally {
    isSavingStallSelection.value = false
  }
}

async function confirmStallSelection() {
  if (!selectedModalStallId.value) {
    stallSelectionError.value = 'Please choose a vacant stall.'
    return
  }
  isSavingStallSelection.value = true
  stallSelectionError.value = ''

  try {
    let sid = stakeholder.value?.stakeholderId || stakeholder.value?.id
    if (!sid) {
      const uid = localStorage.getItem('userId')
      if (uid) {
        const res = await api.get(`/stakeholders/user/${uid}`)
        if (res?.data?.id) sid = res.data.id
      }
    }
    if (!sid) throw new Error('Stakeholder ID is missing.')

    await api.put(`/stakeholders/${sid}/select-stall`, {
      stallId: selectedModalStallId.value
    })

    inlineSelectedStallId.value = selectedModalStallId.value

    toast.add({
      severity: 'success',
      summary: 'Stall Reserved',
      detail: 'Target market stall selected! 3-month advance payment baseline updated.',
      life: 4000
    })

    showSelectStallModal.value = false
    await loadProgress(true)
  } catch (err) {
    console.error('[ApplicationProgress] stall selection error:', err)
    stallSelectionError.value = err.message || 'Failed to update stall selection.'
  } finally {
    isSavingStallSelection.value = false
  }
}

// Hazard-Free Modal & Upload State
const showHazardModal = ref(false)
const selectedHazardFile = ref(null)
const isUploadingHazard = ref(false)
const hazardError = ref('')
const hazardFileInput = ref(null)
const hazardCameraInput = ref(null)
function triggerHazardCamera() {
  hazardCameraInput.value?.click()
}
const hasDismissedAutoPop = ref(false)

const applicationTrackingNo = computed(() => {
  const data = stakeholder.value
  if (!data) return 'APP-PENDING'
  return data.applicationNo || (data.id ? `APP-${data.id}` : 'APP-PENDING')
})

const currentHoldingOffice = computed(() => {
  const data = stakeholder.value
  if (!data) return "Market Supervisor"
  const s = String(data.applicationStatus || data.application_status || '').toUpperCase()
  if (s.includes('REJECTED')) return 'Disapproved'
  if (['COMPLETED', 'ACTIVE_VENDOR', 'FULLY_APPROVED'].includes(s) || data.verifiedTenant || data.verified_tenant) return 'Active Market Tenancy'
  if (s === 'BUSINESS_PERMIT_ELIGIBLE') return 'Market Administration'
  if (s === 'PENDING_INSPECTION' || (data.contractId && !data.hazardFreeConfirmed)) return 'Field Inspector'
  if (s === 'PAID_READY_FOR_CONTRACT' || (data.advancePaymentPaid && !data.contractId)) return 'Market Supervisor'
  if (s === 'PENDING_TREASURER_PAYMENT' || (data.mayorApproved && !data.advancePaymentPaid)) return "Treasurer's Office"
  if (s === 'PENDING_MAYOR_APPROVAL' || data.marketSupervisorApproved) return "Mayor's Office"
  return 'Market Supervisor'
})

const currentOfficeAction = computed(() => {
  const office = currentHoldingOffice.value
  if (office === 'Market Supervisor') {
    if (stakeholder.value?.advancePaymentPaid) return 'Awaiting Market Supervisor preparation and execution of 3-Year Contract of Lease.'
    return 'Awaiting Market Supervisor initial review and endorsement of application and Letter of Intent.'
  }
  if (office === "Mayor's Office") return 'Awaiting Municipal Mayor review and approval of endorsed Letter of Intent.'
  if (office === "Treasurer's Office") return 'Awaiting Treasurer validation and receipting of Stall Rights fee and 2-Month Advance Rental payment.'
  if (office === 'Field Inspector') return 'Awaiting Field Market Inspector physical stall setup verification (electrical, structural, fire safety, sanitation).'
  if (office === 'Market Administration') return 'Stall setup verified. Business permit processing step is now eligible.'
  if (office === 'Active Market Tenancy') return 'Onboarding complete! Your market stall occupancy, permit, and 3-Year lease contract are active.'
  return 'Processing commercial stall rental application.'
})

const steps = ref([
  { id: 1, title: 'Application & LOI Submitted', description: 'Letter of Intent, Valid ID, and stall selection submitted. Stall reserved as PENDING.', status: 'pending' },
  { id: 2, title: 'Market Supervisor Endorsement', description: 'Market Supervisor reviews application documents and endorses to Municipal Mayor.', status: 'pending' },
  { id: 3, title: "Mayor's Office LOI Approval", description: 'Municipal Mayor evaluates endorsed Letter of Intent and authorizes stall allocation.', status: 'pending' },
  { id: 4, title: 'Initial Fees Payment (Stall Rights + Advance)', description: 'Treasurer validates and records Stall Rights fee + 2 Months Advance Rent with Official Receipt.', status: 'pending' },
  { id: 5, title: '3-Year Contract of Lease Execution', description: 'Market Supervisor executes official 3-Year Contract of Lease and generates digital Occupancy Permit.', status: 'pending' },
  { id: 6, title: 'Physical Stall Setup Inspection', description: 'Field Market Inspector verifies electrical, structural, fire safety, and sanitation compliance.', status: 'pending' },
  { id: 7, title: 'Business Permit Eligibility', description: 'Business permit processing step becomes eligible according to approved workflow.', status: 'pending' },
  { id: 8, title: 'Active Vendor Activation & Permit Issuance', description: 'Occupancy permit issued with QR code & SHA-256 integrity hash; recurring billing initiated.', status: 'pending' }
])

const isSteps1To5Green = computed(() => {
  return steps.value[0]?.status === 'approved' &&
         steps.value[1]?.status === 'approved' &&
         steps.value[2]?.status === 'approved' &&
         steps.value[3]?.status === 'approved' &&
         steps.value[4]?.status === 'approved'
})

const hasHazardFreeDoc = computed(() => {
  const data = stakeholder.value
  if (!data) return false
  return Boolean(
    data.hazardFreeConfirmed ||
    data.hazard_free_confirmed ||
    data.hazardFreeDocumentUrl ||
    data.hazard_free_document_url ||
    requirements.value?.some(d =>
      d.document_type === 'HAZARD_FREE_CONFIRMATION' ||
      d.document_type === 'HAZARD_FREE_CERTIFICATE' ||
      d.documentType === 'HAZARD_FREE_CONFIRMATION' ||
      d.documentType === 'HAZARD_FREE_CERTIFICATE'
    )
  )
})

const hazardDocInfo = computed(() => {
  const data = stakeholder.value
  if (!data) return null
  const reqDoc = requirements.value?.find(d =>
    d.document_type === 'HAZARD_FREE_CONFIRMATION' ||
    d.document_type === 'HAZARD_FREE_CERTIFICATE' ||
    d.documentType === 'HAZARD_FREE_CONFIRMATION' ||
    d.documentType === 'HAZARD_FREE_CERTIFICATE'
  )
  const url = reqDoc?.file_path || reqDoc?.filePath || data.hazardFreeDocumentUrl || data.hazard_free_document_url || null
  const name = reqDoc?.file_name || reqDoc?.fileName || data.hazardFreeFileName || 'Hazard_Free_Stall_Confirmation.pdf'
  if (!url && !hasHazardFreeDoc.value) return null
  return { url, name }
})

function openHazardModal() {
  hazardError.value = ''
  selectedHazardFile.value = null
  showHazardModal.value = true
}

function closeHazardModal() {
  showHazardModal.value = false
  selectedHazardFile.value = null
  hazardError.value = ''
  hasDismissedAutoPop.value = true
}

function triggerHazardFileInput() {
  hazardFileInput.value?.click()
}

function onHazardFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) {
    selectedHazardFile.value = file
    hazardError.value = ''
  }
}

function onHazardDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    selectedHazardFile.value = file
    hazardError.value = ''
  }
}

async function submitHazardFreeFile() {
  if (!selectedHazardFile.value) {
    hazardError.value = 'Please select a file to upload.'
    return
  }
  isUploadingHazard.value = true
  hazardError.value = ''

  try {
    const sid = stakeholder.value?.stakeholderId || stakeholder.value?.id
    const appId = stakeholder.value?.businessApplicationId || stakeholder.value?.id
    const result = await uploadHazardFreeDocument(selectedHazardFile.value, sid, appId)

    if (stakeholder.value) {
      stakeholder.value.hazardFreeConfirmed = true
      stakeholder.value.hazardFreeDocumentUrl = result.publicUrl
      stakeholder.value.hazardFreeFileName = result.fileName
    }

    toast.add({
      severity: 'success',
      summary: 'Hazard-Free Confirmation Uploaded',
      detail: 'Document has been recorded and submitted to BPLO & Endorsing Office.',
      life: 4500
    })

    showHazardModal.value = false
    selectedHazardFile.value = null
    await loadProgress(true)
  } catch (err) {
    console.error('[ApplicationProgress] hazard upload error:', err)
    hazardError.value = err.message || 'Failed to upload document. Please try again.'
  } finally {
    isUploadingHazard.value = false
  }
}

const stallInfo = computed(() => {
  const data = stakeholder.value
  if (!data) return null
  const fromData = data.stall || data.occupant?.stall || (Array.isArray(data.occupants) && data.occupants[0]?.stall)
  if (fromData) return fromData
  const sId = data.selectedStallId || data.selected_stall_id
  if (sId && stallsList.value.length > 0) {
    return stallsList.value.find(s => String(s.id) === String(sId)) || null
  }
  return null
})

const isStallAssigned = computed(() => {
  const data = stakeholder.value
  if (!data) return false
  const occ = data.occupant || (Array.isArray(data.occupants) && data.occupants[0])
  const occStatus = String(occ?.status || '').toUpperCase()
  const isSupApproved = Boolean(data.marketSupervisorApproved || data.market_supervisor_approved || data.marketApprovalStatus === 'APPROVED')
  return Boolean(
    (occ?.stall || data.stall) &&
    (occStatus === 'ACTIVE' || isSupApproved)
  )
})

const overallSeverity = computed(() => {
  const st = stakeholder.value?.applicationStatus || stakeholder.value?.application_status
  if (st === 'COMPLETED' || st === 'FULLY_APPROVED') return 'success'
  if (st === 'REJECTED') return 'danger'
  return 'warn'
})

const applicantFeeRequired = computed(() => {
  const data = stakeholder.value
  if (!data || data.applicantFeePaid || data.applicant_fee_paid || data.applicationFormPaid || data.application_form_paid || data.treasurerPaid || data.treasurer_paid) {
    return false
  }

  const status = data.applicationStatus || data.application_status
  return status === 'PENDING_BUSINESS_PERMIT_PAYMENT' ||
    data.finalEndorsed === true ||
    data.final_endorsed === true
})

async function loadProgress(isSilent = false) {
  if (isSilent) {
    isRefreshing.value = true
  } else {
    isLoading.value = true
  }
  errorMessage.value = ''

  try {
    // Also refresh available stalls
    try {
      const rawStalls = await fetchStalls()
      stallsList.value = (rawStalls || []).map(s => ({
        id: s.id,
        stallNo: s.stall_no || s.stallNo || s.number,
        stallType: s.stall_type || s.stallType || s.info || 'Standard Stall',
        monthlyRent: Number(s.monthly_rent ?? s.monthlyRent ?? 1500),
        status: String(s.status || 'AVAILABLE').toUpperCase()
      }))
    } catch (_) {}

    let resolvedUserId = authStore.resolvedUserId || localStorage.getItem('userId')
    if (!resolvedUserId || resolvedUserId === 'null' || resolvedUserId === 'undefined') {
      const { data: { session } } = await supabase.auth.getSession()
      resolvedUserId = session?.user?.id
    }

    if (!resolvedUserId) {
      router.replace('/login')
      return
    }

    localStorage.setItem('userId', resolvedUserId)

    // Load stakeholder and fallback to business_application if needed
    let data = await getStakeholderByUserId(resolvedUserId)
    if (!data) {
      data = await getApplicationByUserId(resolvedUserId)
    }

    if (!data) {
      router.replace('/business-application')
      return
    }

    const norm = normalizeRecord(data)
    stakeholder.value = norm

    const initialStallId = norm.selectedStallId || norm.selected_stall_id || norm.stall?.id || norm.occupant?.stall?.id
    if (initialStallId && !inlineSelectedStallId.value) {
      inlineSelectedStallId.value = Number(initialStallId)
    }

    if (norm.id || norm.stakeholderId) {
      const sid = norm.stakeholderId || norm.id
      localStorage.setItem('stakeholderId', String(sid))
      requirements.value = await getStakeholderRequirements(sid)
    }

    applyStepStatuses(norm)

    if (isDashboardReady(norm, requirements.value)) {
      router.replace('/stakeholder')
    }
  } catch (error) {
    console.error('[ApplicationProgress] loadProgress error:', error)
    errorMessage.value = error.message || 'Unable to load application progress.'
    if (!isSilent) {
      toast.add({
        severity: 'error',
        summary: 'Progress unavailable',
        detail: errorMessage.value,
        life: 3500
      })
    }
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

function applyStepStatuses(data) {
  steps.value.forEach(step => {
    step.status = 'pending'
  })

  // 1. Application & LOI Submitted
  steps.value[0].status = 'approved'
  const stallName = data.stall?.stallNo || data.stall?.number || data.selectedStallId
  if (stallName) {
    steps.value[0].description = `Application & Letter of Intent submitted for Stall #${stallName} (Reserved - Occupant status: PENDING).`
  }

  // 2. Market Supervisor Review & Endorsement
  const hasSupervisorEndorsed = Boolean(
    data.marketSupervisorApproved ||
    data.market_supervisor_approved ||
    data.marketApprovalStatus === 'APPROVED' ||
    data.supervisorEndorsedAt ||
    data.supervisor_endorsed_at ||
    data.mayorApproved ||
    data.advancePaymentPaid ||
    data.contractId ||
    data.verifiedTenant ||
    [
      'PENDING_MAYOR_APPROVAL',
      'PENDING_TREASURER_PAYMENT',
      'PAID_READY_FOR_CONTRACT',
      'PENDING_INSPECTION',
      'INSPECTION_PASSED',
      'BUSINESS_PERMIT_ELIGIBLE',
      'COMPLETED'
    ].includes(data.applicationStatus || data.application_status)
  )

  if (hasSupervisorEndorsed) {
    steps.value[1].status = 'approved'
    steps.value[1].description = 'Market Supervisor has reviewed documents and officially endorsed application to the Municipal Mayor.'
  } else {
    steps.value[1].status = 'pending'
    steps.value[1].description = 'Application documents and stall availability undergoing Market Supervisor review.'
  }

  // 3. Municipal Mayor LOI Approval
  const hasMayorApproved = Boolean(
    data.mayorApproved ||
    data.mayor_approved ||
    data.mayorDecision === 'APPROVED' ||
    data.mayor_decision === 'APPROVED' ||
    data.treasurerApproved ||
    data.advancePaymentPaid ||
    data.contractId ||
    data.verifiedTenant ||
    [
      'PENDING_TREASURER_PAYMENT',
      'PAID_READY_FOR_CONTRACT',
      'PENDING_INSPECTION',
      'INSPECTION_PASSED',
      'BUSINESS_PERMIT_ELIGIBLE',
      'COMPLETED'
    ].includes(data.applicationStatus || data.application_status)
  )

  if (hasMayorApproved) {
    steps.value[2].status = 'approved'
    steps.value[2].description = 'Letter of Intent (LOI) officially approved by the Municipal Mayor. Initial fee instructions generated.'
  } else if (hasSupervisorEndorsed) {
    steps.value[2].status = 'pending'
    steps.value[2].description = 'Endorsed application routed to Municipal Mayor for executive decision.'
  }

  // 4. Initial Fees Payment (Stall Rights + 2 Months Advance Rent)
  const monthlyRent = Number(data.stall?.monthlyRent || data.stall?.monthly_rent || 1500)
  const reqAdvance = Number(data.totalAdvanceAmount || data.total_advance_amount || (monthlyRent * 2))
  const stallRights = Number(data.calculatedStallRightsFee || data.calculated_stall_rights_fee || 5000)
  const totalInitial = stallRights + reqAdvance
  const paidAdvance = Number(data.advanceBalance || data.advance_balance || data.advancePaymentAmount || data.advance_payment_amount || 0)

  const hasInitialPaid = Boolean(
    data.advancePaymentPaid ||
    data.advance_payment_paid ||
    data.treasurerPaid ||
    data.treasurer_paid ||
    data.contractId ||
    data.verifiedTenant ||
    [
      'PAID_READY_FOR_CONTRACT',
      'PENDING_INSPECTION',
      'INSPECTION_PASSED',
      'BUSINESS_PERMIT_ELIGIBLE',
      'COMPLETED'
    ].includes(data.applicationStatus || data.application_status)
  )

  if (hasInitialPaid) {
    steps.value[3].status = 'approved'
    const dt = data.advancePaymentDate || data.advance_payment_date
    steps.value[3].description = `Initial fees (₱${stallRights.toLocaleString()} rights + ₱${reqAdvance.toLocaleString()} advance) confirmed and receipted by Treasurer.${dt ? ' Receipted on ' + new Date(dt).toLocaleDateString() + '.' : ''}`
  } else if (hasMayorApproved) {
    steps.value[3].status = 'needs-action'
    steps.value[3].description = `Please settle total initial fee of ₱${totalInitial.toLocaleString()} with the Municipal Treasurer to proceed with contract drafting.`
  }

  // 5. 3-Year Contract of Lease Execution
  const hasContractExecuted = Boolean(
    data.contractId ||
    data.contract_id ||
    data.contractExecutedAt ||
    data.contract_executed_at ||
    data.verifiedTenant ||
    [
      'PENDING_INSPECTION',
      'INSPECTION_PASSED',
      'BUSINESS_PERMIT_ELIGIBLE',
      'COMPLETED'
    ].includes(data.applicationStatus || data.application_status)
  )

  if (hasContractExecuted) {
    steps.value[4].status = 'approved'
    steps.value[4].description = 'Authoritative 3-Year Contract of Lease executed by Market Supervisor. Occupancy Permit generated.'
  } else if (hasInitialPaid) {
    steps.value[4].status = 'pending'
    steps.value[4].description = 'Payment confirmed. Market Supervisor preparing 3-Year Contract of Lease for execution.'
  }

  // 6. Physical Stall Setup Inspection
  const hasInspectionPassed = Boolean(
    data.hazardFreeConfirmed ||
    data.hazard_free_confirmed ||
    data.inspectionPassed ||
    data.inspection_passed ||
    data.verifiedTenant ||
    [
      'INSPECTION_PASSED',
      'BUSINESS_PERMIT_ELIGIBLE',
      'COMPLETED'
    ].includes(data.applicationStatus || data.application_status)
  )

  if (hasInspectionPassed) {
    steps.value[5].status = 'approved'
    steps.value[5].description = 'Field Market Inspector verified physical stall setup: electrical, structural, fire safety, and sanitation cleared.'
  } else if (hasContractExecuted) {
    steps.value[5].status = 'needs-action'
    steps.value[5].description = 'Stall allocated. Field Market Inspector physical setup verification pending.'
  }

  // 7. Business Permit Step Eligibility
  const isBusinessPermitEligible = Boolean(
    hasInspectionPassed ||
    data.verifiedTenant ||
    [
      'BUSINESS_PERMIT_ELIGIBLE',
      'COMPLETED'
    ].includes(data.applicationStatus || data.application_status)
  )

  if (isBusinessPermitEligible) {
    steps.value[6].status = 'approved'
    steps.value[6].description = 'Prerequisites completed. Commercial business permit step enabled for processing.'
  } else if (hasContractExecuted) {
    steps.value[6].status = 'pending'
    steps.value[6].description = 'Awaiting stall physical verification before enabling business permit processing.'
  }

  // 8. Active Vendor Activation & Municipal Occupancy Permit
  const isFullyActivated = Boolean(
    data.verifiedTenant ||
    data.verified_tenant ||
    data.verifiedStakeholder ||
    data.onboardingStatus === 'ACTIVE_VENDOR' ||
    data.onboarding_status === 'ACTIVE_VENDOR' ||
    data.applicationStatus === 'COMPLETED' ||
    data.application_status === 'COMPLETED'
  )

  if (isFullyActivated) {
    steps.value[7].status = 'approved'
    steps.value[7].description = 'Active Vendor tenancy active! Municipal Occupancy Permit issued with QR code & SHA-256 integrity verification.'
  } else if (isBusinessPermitEligible) {
    steps.value[7].status = 'pending'
    steps.value[7].description = 'Market Administration final review & activation queued.'
  }

  // Rejection check
  const isRejected = (
    data.applicationStatus === 'REJECTED' ||
    data.application_status === 'REJECTED' ||
    data.applicationStatus === 'SUPERVISOR_REJECTED' ||
    data.applicationStatus === 'MAYOR_REJECTED' ||
    data.marketApprovalStatus === 'REJECTED'
  )

  if (isRejected) {
    if (data.applicationStatus === 'MAYOR_REJECTED') {
      steps.value[2].status = 'rejected'
      steps.value[2].description = 'Letter of Intent rejected by the Municipal Mayor. Stall reservation released.'
    } else {
      steps.value[1].status = 'rejected'
      steps.value[1].description = 'Application rejected by Market Supervisor during document review.'
    }
  }

  // Auto-pop Hazard-Free Confirmation modal if steps 1-5 are green and not yet uploaded
  if (isSteps1To5Green.value && !hasHazardFreeDoc.value && !hasDismissedAutoPop.value) {
    showHazardModal.value = true
  }
}

function statusLabel(status) {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  if (status === 'needs-action') return 'Needs Action'
  return 'Pending'
}

function statusSeverity(status) {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  if (status === 'needs-action') return 'warn'
  return 'secondary'
}

onMounted(() => {
  loadProgress(false)
  pollTimer = setInterval(() => {
    loadProgress(true)
  }, 8000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped src="../styles/views/ApplicationProgress.css"></style>

