<template>
  <main class="progress-wrapper">
    <Toast />

    <div class="page-header">
      <div>
        <h1>Application Progress</h1>
        <p>Track your public market rental approval across each office.</p>
      </div>
      <Tag
        v-if="stakeholder"
        :value="stakeholder.applicationStatus || 'PENDING'"
        :severity="overallSeverity"
      />
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
const userId = localStorage.getItem('userId')

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

  if (data.treasurerApproved || data.advancePaymentPaid || data.advancePaymentCompleted || data.advancePayment) steps.value[1].status = 'approved'
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

<style scoped>
.progress-wrapper {
  min-height: 100vh;
  padding: 96px 24px 40px;
  background: #f6f8fb;
}

.page-header,
.panel {
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 30px;
  color: #111827;
}

.page-header p {
  margin: 6px 0 0;
  color: #64748b;
}

.panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
}

.state-box {
  max-width: 1100px;
  margin: 0 auto;
  padding: 18px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  color: #334155;
}

.state-box.error {
  border-color: #fecdd3;
  background: #fff1f2;
  color: #be123c;
}

.circle {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 2px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-weight: 800;
}

.circle.approved {
  background: #16a34a;
  border-color: #16a34a;
  color: #ffffff;
}

.circle.rejected {
  background: #dc2626;
  border-color: #dc2626;
  color: #ffffff;
}

.circle.needs-action {
  background: #f59e0b;
  border-color: #f59e0b;
  color: #ffffff;
}

.step-card {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.step-card h2 {
  margin: 0;
  font-size: 16px;
  color: #1f2937;
}

.step-card p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.requirements-callout {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  background: #fffbeb;
}

.fee-callout {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  background: #fffbeb;
  color: #92400e;
}

.fee-callout p {
  margin: 4px 0 0;
}

.requirements-callout p {
  margin: 4px 0 0;
  color: #92400e;
}

@media (max-width: 760px) {
  .page-header,
  .step-card,
  .requirements-callout,
  .fee-callout {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
