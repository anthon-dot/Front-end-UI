<template>
  <main class="requirements-page">
    <Toast />

    <section class="panel">
      <div class="header">
        <div>
          <h1>Requirements</h1>
          <p>Complete the required documents before dashboard access is enabled.</p>
        </div>
        <Tag
          :value="status?.complete ? 'COMPLETE' : 'NEEDS ACTION'"
          :severity="status?.complete ? 'success' : 'warn'"
        />
      </div>

      <div v-if="isLoading" class="state">Loading requirements...</div>
      <div v-else-if="errorMessage" class="state error">{{ errorMessage }}</div>

      <div v-else class="requirements-list">
        <div
          v-for="item in requiredDocuments"
          :key="item.value"
          class="requirement-row"
        >
          <div>
            <h2>{{ item.label }}</h2>
            <Tag
              :value="isSubmitted(item.value) ? 'SUBMITTED' : 'MISSING'"
              :severity="isSubmitted(item.value) ? 'success' : 'danger'"
            />
          </div>

          <FileUpload
            v-if="!isSubmitted(item.value)"
            mode="basic"
            :auto="true"
            chooseLabel="Upload"
            :customUpload="true"
            @uploader="uploadRequirement($event, item)"
          />
        </div>
      </div>

      <div class="actions">
        <Button
          label="Back to Progress"
          icon="pi pi-arrow-left"
          text
          @click="router.push('/application-progress')"
        />
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          :loading="isLoading"
          @click="loadRequirements"
        />
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import api from '../services/api'
import { getStakeholderByUserId, getStakeholderRequirements } from '../services/applicationService'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'

const router = useRouter()
const toast = useToast()
const isLoading = ref(false)
const errorMessage = ref('')
const stakeholder = ref(null)
const status = ref(null)

const userId = localStorage.getItem('userId')

const requiredDocuments = [
  { label: 'DTI Permit', value: 'DTI_PERMIT', uploadType: 'dtiPermit' },
  { label: 'Cedula', value: 'CEDULA', uploadType: 'cedula' },
  { label: 'Barangay Clearance', value: 'BARANGAY_CLEARANCE', uploadType: 'barangayClearance' },
  { label: 'Valid ID', value: 'VALID_ID', uploadType: 'validId' }
]

const submittedDocuments = computed(() => status.value?.submittedDocuments || [])

function isSubmitted(type) {
  return submittedDocuments.value.includes(type)
}

async function loadRequirements() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    stakeholder.value = await getStakeholderByUserId(userId)

    if (!stakeholder.value?.id) {
      router.replace('/business-application')
      return
    }

    status.value = await getStakeholderRequirements(stakeholder.value.id)
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load requirements.'
  } finally {
    isLoading.value = false
  }
}

async function uploadRequirement(event, item) {
  const file = event.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    await api.put(`/stakeholders/${userId}/upload/${item.uploadType}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    toast.add({
      severity: 'success',
      summary: 'Uploaded',
      detail: `${item.label} uploaded successfully.`,
      life: 2500
    })

    await loadRequirements()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Upload failed',
      detail: error.message || `Unable to upload ${item.label}.`,
      life: 3500
    })
  }
}

onMounted(loadRequirements)
</script>

<style scoped src="../styles/views/Requirements.css"></style>

