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
          :value="stakeholder.applicationStatus || 'PENDING'"
          :severity="overallSeverity"
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

    <div v-if="isLoading" class="state-box">Loading application status...</div>
    <div v-else-if="errorMessage" class="state-box error">{{ errorMessage }}</div>

    <section v-else class="panel">
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
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../stores/auth'
import {
  getStakeholderByUserId,
  getStakeholderRequirements,
  isDashboardReady
} from '../services/applicationService'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Timeline from 'primevue/timeline'
import Toast from 'primevue/toast'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const userId = localStorage.getItem('userId')

async function logout() {
  await authStore.clearSession()
  localStorage.removeItem('currentStakeholder')
  localStorage.removeItem('stakeholderId')
  router.push('/login')
}

const isLoading = ref(false)
const errorMessage = ref('')
const stakeholder = ref(null)
const requirements = ref(null)

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

const overallSeverity = computed(() => {
  if (stakeholder.value?.applicationStatus === 'COMPLETED') return 'success'
  if (stakeholder.value?.applicationStatus === 'REJECTED') return 'danger'
  return 'warn'
})

const applicantFeeRequired = computed(() => {
  const data = stakeholder.value

  if (!data || data.applicantFeePaid) {
    return false
  }

  return data.applicationStatus === 'PENDING_BUSINESS_PERMIT_PAYMENT' ||
    data.finalEndorsed === true
})

async function loadProgress() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    stakeholder.value = await getStakeholderByUserId(userId)

    if (!stakeholder.value?.id) {
      router.replace('/business-application')
      return
    }

    localStorage.setItem('stakeholderId', String(stakeholder.value.id))
    requirements.value = await getStakeholderRequirements(stakeholder.value.id)
    applyStepStatuses(stakeholder.value)

    if (isDashboardReady(stakeholder.value, requirements.value)) {
      router.replace('/stakeholder')
    }
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load application progress.'
    toast.add({
      severity: 'error',
      summary: 'Progress unavailable',
      detail: errorMessage.value,
      life: 3500
    })
  } finally {
    isLoading.value = false
  }
}

function applyStepStatuses(data) {
  steps.value.forEach(step => {
    step.status = 'pending'
  })

  steps.value[0].status = 'approved'

  const hasAdvancePaid = Boolean(
    data.treasurerApproved ||
    data.advancePaymentPaid ||
    data.advancePaymentCompleted ||
    data.advancePayment ||
    (Number(data.advanceBalance || 0) > 0 && Number(data.totalAdvanceAmount || 0) > 0 && Number(data.advanceBalance || 0) >= Number(data.totalAdvanceAmount || 0)) ||
    [
      'PENDING_MARKET_SUPERVISOR_APPROVAL',
      'PENDING_BPLO_APPROVAL',
      'PENDING_ENDORSING_OFFICE_APPROVAL',
      'PENDING_BUSINESS_PERMIT_PAYMENT',
      'COMPLETED',
      'FULLY_APPROVED',
      'APPROVED'
    ].includes(data.applicationStatus) ||
    Boolean(data.marketSupervisorApproved || data.bploApproved || data.finalEndorsed)
  )

  if (hasAdvancePaid) {
    steps.value[1].status = 'approved'
    const amt = Number(data.advanceBalance || data.advancePaymentAmount || 0)
    steps.value[1].description = amt > 0 
      ? `Advance payment of ₱${amt.toLocaleString()} recorded.${data.advancePaymentDate ? ' Paid on ' + new Date(data.advancePaymentDate).toLocaleDateString() + '.' : ''}`
      : 'Advance payment recorded by Treasurer.'
  } else if (Number(data.advanceBalance || 0) > 0) {
    steps.value[1].status = 'needs-action'
    steps.value[1].description = `Partial payment of ₱${Number(data.advanceBalance).toLocaleString()} received (Total required: ₱${Number(data.totalAdvanceAmount || 0).toLocaleString()}).`
  }

  if (data.marketSupervisorApproved || data.marketApprovalStatus === 'APPROVED') steps.value[2].status = 'approved'
  if (data.occupant?.stall) steps.value[3].status = 'approved'
  if (data.occupant?.contractId || contractCreated(data)) steps.value[4].status = 'approved'
  if (data.bploApproved || data.bploStatus === 'APPROVED') steps.value[5].status = 'approved'
  if (data.finalEndorsed || data.endorsementStatus === 'APPROVED') steps.value[6].status = 'approved'
  if (data.applicantFeePaid) steps.value[7].status = 'approved'

  if (data.applicationStatus === 'COMPLETED') {
    steps.value[8].status = requirements.value?.complete ? 'approved' : 'needs-action'
  }

  if (data.applicationStatus === 'REJECTED') {
    const firstPending = steps.value.find(step => step.status === 'pending')
    if (firstPending) firstPending.status = 'rejected'
  }
}

function contractCreated(data) {
  return [
    'CONTRACT_CREATED',
    'BPLO_APPROVED',
    'FOR_APPROVAL',
    'APPROVED',
    'FULLY_APPROVED',
    'COMPLETED',
    'MARKET_APPROVED'
  ].includes(data.onboardingStatus)
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

onMounted(loadProgress)
</script>

<style scoped src="./ApplicationProgress.css"></style>

