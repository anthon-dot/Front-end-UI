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

    <!-- Stall Overview Pill Card -->
    <div v-if="stallInfo" class="stall-progress-summary">
      <div class="stall-summary-left">
        <div class="stall-badge-icon">
          <i class="pi pi-shop"></i>
        </div>
        <div>
          <span class="stall-summary-title">Target Stall: <strong>Stall {{ stallInfo.stallNo || stallInfo.number }}</strong></span>
          <span class="stall-summary-sub">{{ stallInfo.section || stallInfo.stallType || 'Public Market' }} &bull; ₱{{ Number(stallInfo.monthlyRent || 0).toLocaleString() }}/month</span>
        </div>
      </div>
      <div class="stall-summary-right">
        <Tag
          :value="isStallAssigned ? 'STALL ASSIGNED' : 'SELECTION RECORDED'"
          :severity="isStallAssigned ? 'success' : 'info'"
          rounded
        />
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
            <div v-if="!selectedHazardFile" class="dropzone-prompt" @click="triggerHazardFileInput">
              <i class="pi pi-cloud-upload dropzone-icon"></i>
              <span>Click to select or drag and drop confirmation file</span>
              <small>Supported formats: PDF, PNG, JPG (Max: 10MB)</small>
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
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../config/supabase'
import { normalizeRecord } from '../services/api'
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

// Hazard-Free Modal & Upload State
const showHazardModal = ref(false)
const selectedHazardFile = ref(null)
const isUploadingHazard = ref(false)
const hazardError = ref('')
const hazardFileInput = ref(null)
const hasDismissedAutoPop = ref(false)

const steps = ref([
  { id: 1, title: 'Application Submitted', description: 'Letter of Intent, Valid ID, and selected vacant stall were submitted.', status: 'pending' },
  { id: 2, title: 'Advance Payment Recorded', description: 'Treasurer records the advance payment and official receipt.', status: 'pending' },
  { id: 3, title: 'Market Supervisor Approval', description: 'Supervisor verifies the receipt and selected stall.', status: 'pending' },
  { id: 4, title: 'Stall Assigned', description: 'The selected existing vacant stall is assigned.', status: 'pending' },
  { id: 5, title: 'Rental Contract Stored', description: 'The rental contract is created and stored digitally.', status: 'pending' },
  { id: 6, title: 'BPLO Approval', description: 'BPLO reviews business permit requirements.', status: 'pending' },
  { id: 7, title: 'Endorsing Office Approval', description: 'Endorsing office reviews the application.', status: 'pending' },
  { id: 8, title: 'Business Permit Payment', description: 'Treasurer records business permit payment and official receipt.', status: 'pending' },
  { id: 9, title: 'Completed', description: 'Stakeholder account is active and linked to the assigned stall.', status: 'pending' }
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
  return data.stall || data.occupant?.stall || (Array.isArray(data.occupants) && data.occupants[0]?.stall) || null
})

const isStallAssigned = computed(() => {
  const data = stakeholder.value
  if (!data) return false
  return Boolean(
    data.occupant?.stall ||
    (Array.isArray(data.occupants) && data.occupants[0]?.stall) ||
    data.occupantId ||
    data.occupant_id
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
  if (!data || data.applicantFeePaid || data.applicant_fee_paid) {
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

  // 1. Application Submitted is always approved once record exists
  steps.value[0].status = 'approved'
  const stallName = data.stall?.stallNo || data.stall?.number || data.selectedStallId
  if (stallName) {
    steps.value[0].description = `Application submitted for Stall ${stallName}. Letter of Intent & Valid ID recorded.`
  }

  // 2. Advance Payment Recorded
  const hasAdvancePaid = Boolean(
    data.treasurerApproved ||
    data.treasurer_approved ||
    data.advancePaymentPaid ||
    data.advance_payment_paid ||
    data.advancePaymentCompleted ||
    data.advance_payment_completed ||
    data.advancePayment ||
    (Number(data.advanceBalance || data.advance_balance || 0) > 0 &&
     Number(data.totalAdvanceAmount || data.total_advance_amount || 0) > 0 &&
     Number(data.advanceBalance || data.advance_balance || 0) >= Number(data.totalAdvanceAmount || data.total_advance_amount || 0)) ||
    [
      'PENDING_MARKET_SUPERVISOR_APPROVAL',
      'PENDING_BPLO_APPROVAL',
      'PENDING_ENDORSING_OFFICE_APPROVAL',
      'PENDING_BUSINESS_PERMIT_PAYMENT',
      'COMPLETED',
      'FULLY_APPROVED',
      'APPROVED'
    ].includes(data.applicationStatus || data.application_status) ||
    Boolean(
      data.marketSupervisorApproved || data.market_supervisor_approved ||
      data.bploApproved || data.bplo_approved ||
      data.finalEndorsed || data.final_endorsed
    )
  )

  if (hasAdvancePaid) {
    steps.value[1].status = 'approved'
    const amt = Number(data.advanceBalance || data.advance_balance || data.advancePaymentAmount || data.advance_payment_amount || 0)
    const dt = data.advancePaymentDate || data.advance_payment_date
    steps.value[1].description = amt > 0
      ? `Advance payment of ₱${amt.toLocaleString()} recorded.${dt ? ' Paid on ' + new Date(dt).toLocaleDateString() + '.' : ''}`
      : 'Advance payment recorded by Treasurer.'
  } else if (Number(data.advanceBalance || data.advance_balance || 0) > 0) {
    steps.value[1].status = 'needs-action'
    steps.value[1].description = `Partial payment of ₱${Number(data.advanceBalance || data.advance_balance).toLocaleString()} received.`
  }

  // 3. Market Supervisor Approval
  const hasMarketApproved = Boolean(
    data.marketSupervisorApproved ||
    data.market_supervisor_approved ||
    data.marketApprovalStatus === 'APPROVED' ||
    data.market_approval_status === 'APPROVED' ||
    [
      'PENDING_BPLO_APPROVAL',
      'PENDING_ENDORSING_OFFICE_APPROVAL',
      'PENDING_BUSINESS_PERMIT_PAYMENT',
      'COMPLETED',
      'FULLY_APPROVED'
    ].includes(data.applicationStatus || data.application_status) ||
    Boolean(data.bploApproved || data.bplo_approved || data.finalEndorsed || data.final_endorsed)
  )
  if (hasMarketApproved) {
    steps.value[2].status = 'approved'
  }

  // 4. Stall Assigned
  const hasStall = Boolean(
    data.occupant?.stall ||
    (Array.isArray(data.occupants) && data.occupants[0]?.stall) ||
    data.stall ||
    data.selectedStallId ||
    data.selected_stall_id
  )
  if (hasStall && (hasMarketApproved || data.occupant?.stall)) {
    steps.value[3].status = 'approved'
  }

  // 5. Rental Contract Stored
  const hasContract = Boolean(
    data.contractId ||
    data.contract_id ||
    data.occupant?.contractId ||
    data.occupant?.contract_id ||
    (Array.isArray(data.occupants) && (data.occupants[0]?.contractId || data.occupants[0]?.contract_id)) ||
    [
      'CONTRACT_CREATED',
      'BPLO_APPROVED',
      'APPROVED',
      'FULLY_APPROVED',
      'COMPLETED',
      'MARKET_APPROVED'
    ].includes(data.onboardingStatus || data.onboarding_status) ||
    Boolean(data.bploApproved || data.bplo_approved || data.finalEndorsed || data.final_endorsed)
  )
  if (hasContract && hasMarketApproved) {
    steps.value[4].status = 'approved'
  }

  // 6. BPLO Approval
  const hasBplo = Boolean(
    data.bploApproved ||
    data.bplo_approved ||
    data.bploStatus === 'APPROVED' ||
    data.bplo_status === 'APPROVED' ||
    [
      'PENDING_ENDORSING_OFFICE_APPROVAL',
      'PENDING_BUSINESS_PERMIT_PAYMENT',
      'COMPLETED',
      'FULLY_APPROVED'
    ].includes(data.applicationStatus || data.application_status) ||
    Boolean(data.finalEndorsed || data.final_endorsed)
  )
  if (hasBplo) {
    steps.value[5].status = 'approved'
  }

  // 7. Endorsing Office Approval
  const hasEndorsed = Boolean(
    data.finalEndorsed ||
    data.final_endorsed ||
    data.endorsingApproved ||
    data.endorsing_approved ||
    data.endorsementStatus === 'APPROVED' ||
    data.endorsement_status === 'APPROVED' ||
    data.endorsingStatus === 'ENDORSED' ||
    data.endorsing_status === 'ENDORSED' ||
    [
      'PENDING_BUSINESS_PERMIT_PAYMENT',
      'COMPLETED',
      'FULLY_APPROVED'
    ].includes(data.applicationStatus || data.application_status)
  )
  if (hasEndorsed) {
    steps.value[6].status = 'approved'
  }

  // 8. Business Permit Payment
  const hasPermitFee = Boolean(
    data.applicantFeePaid ||
    data.applicant_fee_paid ||
    data.treasurerPaid ||
    data.treasurer_paid ||
    (data.applicationStatus === 'COMPLETED' || data.application_status === 'COMPLETED')
  )
  if (hasPermitFee) {
    steps.value[7].status = 'approved'
  }

  // 9. Completed
  const isCompleted = (data.applicationStatus === 'COMPLETED' || data.application_status === 'COMPLETED' || data.applicationStatus === 'FULLY_APPROVED')
  if (isCompleted) {
    steps.value[8].status = requirements.value?.complete !== false ? 'approved' : 'needs-action'
  }

  // Rejection check
  const isRejected = (
    data.applicationStatus === 'REJECTED' ||
    data.application_status === 'REJECTED' ||
    data.marketApprovalStatus === 'REJECTED' ||
    data.bploStatus === 'REJECTED' ||
    data.endorsementStatus === 'REJECTED'
  )

  if (isRejected) {
    if (data.endorsementStatus === 'REJECTED' || data.endorsingStatus === 'REJECTED') {
      steps.value[6].status = 'rejected'
    } else if (data.bploStatus === 'REJECTED') {
      steps.value[5].status = 'rejected'
    } else if (data.marketApprovalStatus === 'REJECTED') {
      steps.value[2].status = 'rejected'
    } else {
      const firstPending = steps.value.find(step => step.status === 'pending')
      if (firstPending) firstPending.status = 'rejected'
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

