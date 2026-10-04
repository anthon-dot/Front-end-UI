<!-- ============================= -->
<!-- BusinessApplication.vue -->
<!-- ============================= -->

<template>
  <div class="create-page">
    <div class="container">
      <div class="form-header">
        <div>
          <h2>Stakeholder Application</h2>
          <p class="form-subtitle">Complete the application details below for market stall review.</p>
        </div>
        <button type="button" class="logout-btn" @click="logout">
          <i class="pi pi-sign-out"></i>
          <span>Log Out</span>
        </button>
      </div>

      <!-- Active Application Banner -->
      <div v-if="existingApplication" class="existing-application-banner">
        <div class="banner-content">
          <i class="pi pi-info-circle banner-icon"></i>
          <div>
            <strong>Active Application in Progress</strong>
            <p>
              You already have a submitted application (Status: 
              <span class="status-badge">{{ existingApplication.applicationStatus || existingApplication.application_status || 'PENDING' }}</span>).
            </p>
          </div>
        </div>
        <button type="button" class="btn-view-progress" @click="router.push('/application-progress')">
          View Application Progress →
        </button>
      </div>

      <form @submit.prevent="submitApplication">
        <p v-if="errorMessage" class="error">
          {{ errorMessage }}
        </p>

        <!-- ========================= -->
        <!-- STALL SELECTION -->
        <!-- ========================= -->
        <h3>Market Stall Selection</h3>
        <div class="row">
          <div class="field">
            <label>Target Stall</label>
            <select v-model="selectedStallId" class="stall-select">
              <option :value="null">-- Select a Vacant Stall (Optional) --</option>
              <option v-for="stall in availableStalls" :key="stall.id" :value="stall.id">
                Stall {{ stall.stallNo || stall.number }} - {{ stall.section || stall.stallType || 'Standard' }} (₱{{ Number(stall.monthlyRent || 0).toLocaleString() }}/mo)
              </option>
            </select>
            <small v-if="selectedStallDetails" class="stall-details-hint">
              Selected: <strong>Stall {{ selectedStallDetails.stallNo }}</strong> ({{ selectedStallDetails.section || selectedStallDetails.stallType }}) - ₱{{ Number(selectedStallDetails.monthlyRent || 0).toLocaleString() }}/month
            </small>
          </div>
        </div>

        <!-- ========================= -->
        <!-- BUSINESS -->
        <!-- ========================= -->
        <h3>Business Information</h3>

        <div class="row two">
          <div class="field">
            <label>Business Name</label>
            <input v-model="businessName" type="text" required />
          </div>

          <div class="field">
            <label>Business Type</label>
            <input v-model="businessType" type="text" required />
          </div>
        </div>

        <!-- ========================= -->
        <!-- PERSONAL -->
        <!-- ========================= -->
        <h3>Personal Information</h3>

        <div class="row three">
          <div class="field">
            <label>First Name</label>
            <input v-model="firstName" type="text" required />
          </div>

          <div class="field">
            <label>Middle Name</label>
            <input v-model="middleName" type="text" />
          </div>

          <div class="field">
            <label>Last Name</label>
            <input v-model="lastName" type="text" required />
          </div>
        </div>

        <div class="row two">
          <div class="field">
            <label>Contact</label>
            <input v-model="contact" type="text" required />
          </div>

          <div class="field">
            <label>Email</label>
            <input v-model="email" type="email" required />
          </div>
        </div>

        <div class="row">
          <div class="field">
            <label>Address</label>
            <input v-model="address" type="text" required />
          </div>
        </div>

        <!-- ========================= -->
        <!-- FILES -->
        <!-- ========================= -->
        <h3>Documents</h3>

        <div class="field">
          <label>Valid ID</label>
          <input type="file" @change="onFileChange($event, 'id')" required />
        </div>

        <div class="field">
          <label>Letter of Intent</label>
          <input type="file" @change="onFileChange($event, 'letter')" required />
        </div>

        <!-- ========================= -->
        <!-- BUTTON -->
        <!-- ========================= -->
        <div class="actions">
          <button
            class="btn submit"
            type="submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Submitting...' : (existingApplication ? 'Update & Re-Submit Application' : 'Submit Application') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'
import { supabase } from '../config/supabase'
import { useAuthStore } from '../stores/auth'
import { useStakeholderStore } from '../stores/stakeholder'
import { getStakeholderByUserId } from '../services/applicationService'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const stakeholderStore = useStakeholderStore()

// =========================
// FORM STATE
// =========================
const selectedStallId = ref(null)
const availableStalls = ref([])
const existingApplication = ref(null)

const businessName = ref('')
const businessType = ref('')

const firstName  = ref('')
const middleName = ref('')
const lastName   = ref('')

const contact = ref('')
const email   = ref('')
const address = ref('')

// =========================
// FILES
// =========================
const idFile      = ref(null)
const letterFile  = ref(null)
const isSubmitting = ref(false)
const errorMessage = ref('')

const selectedStallDetails = computed(() => {
  if (!selectedStallId.value) return null
  return availableStalls.value.find(s => String(s.id) === String(selectedStallId.value)) || null
})

function onFileChange(e, type) {
  const file = e.target.files[0]
  if (type === 'id')     idFile.value     = file
  if (type === 'letter') letterFile.value = file
}

// =========================
// INIT / MOUNTED
// =========================
onMounted(async () => {
  try {
    let currentUserId = authStore.resolvedUserId || localStorage.getItem('userId')
    if (!currentUserId || currentUserId === 'null' || currentUserId === 'undefined') {
      const { data: { session } } = await supabase.auth.getSession()
      currentUserId = session?.user?.id
    }

    // 1. Load vacant / available stalls
    try {
      const { data: stalls } = await supabase
        .from('stalls')
        .select('*')
        .order('stall_no', { ascending: true })

      if (stalls && stalls.length > 0) {
        availableStalls.value = stalls.filter(s => String(s.status || '').toUpperCase() !== 'OCCUPIED')
      }
    } catch (_) {}

    // Check query stallId
    if (route.query.stallId) {
      selectedStallId.value = Number(route.query.stallId)
    }

    // 2. Check if user already submitted an application
    if (currentUserId) {
      const existing = await getStakeholderByUserId(currentUserId)
      if (existing) {
        existingApplication.value = existing
        // Pre-fill existing details if available
        if (existing.businessName) businessName.value = existing.businessName
        if (existing.businessType) businessType.value = existing.businessType
        if (existing.firstName) firstName.value = existing.firstName
        if (existing.middleName) middleName.value = existing.middleName
        if (existing.lastName) lastName.value = existing.lastName
        if (existing.contact) contact.value = existing.contact
        if (existing.email) email.value = existing.email
        if (existing.address) address.value = existing.address
        if (existing.selectedStallId && !selectedStallId.value) {
          selectedStallId.value = Number(existing.selectedStallId)
        }
      }
    }
  } catch (err) {
    console.warn('[BusinessApplication] init warning:', err.message)
  }
})

// =========================
// SUBMIT APPLICATION
// =========================
async function submitApplication() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    let currentUserId = authStore.resolvedUserId || localStorage.getItem('userId')
    if (!currentUserId || currentUserId === 'null' || currentUserId === 'undefined') {
      const { data: { session } } = await supabase.auth.getSession()
      currentUserId = session?.user?.id
    }

    if (!currentUserId) {
      throw new Error('Please sign in or create an account before submitting.')
    }

    localStorage.setItem('userId', currentUserId)

    const formData = new FormData()

    formData.append('userId',       currentUserId)
    formData.append('businessName', businessName.value)
    formData.append('businessType', businessType.value)
    formData.append('firstName',    firstName.value)
    formData.append('middleName',   middleName.value)
    formData.append('lastName',     lastName.value)
    formData.append('contact',      contact.value)
    formData.append('email',        email.value)
    formData.append('address',      address.value)
    if (selectedStallId.value) {
      formData.append('stallId', String(selectedStallId.value))
    }
    formData.append('idFile',       idFile.value)
    formData.append('letterFile',   letterFile.value)

    const response = await api.post(
      '/applications',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    if (!response.data?.id && !response.data?.user_id) {
      throw new Error('Application was not saved')
    }

    stakeholderStore.clearCache()
    alert('Application submitted successfully!')
    router.push('/application-progress')

  } catch (error) {
    console.error(error)
    errorMessage.value = error.message || 'Application submission failed'
  } finally {
    isSubmitting.value = false
  }
}

async function logout() {
  await authStore.clearSession()
  localStorage.removeItem('currentStakeholder')
  localStorage.removeItem('stakeholderId')
  router.push('/login')
}
</script>

<style scoped src="../styles/views/BusinessApplication.css"></style>


