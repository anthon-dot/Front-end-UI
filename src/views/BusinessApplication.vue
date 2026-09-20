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

      <form @submit.prevent="submitApplication">
        <p v-if="errorMessage" class="error">
          {{ errorMessage }}
        </p>

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
            {{ isSubmitting ? 'Submitting...' : 'Submit Application' }}
          </button>
        </div>

      </form>

    </div>

  </div>

</template>

<script setup>

import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { supabase } from '../config/supabase'
import { useAuthStore } from '../stores/auth'
import { useStakeholderStore } from '../stores/stakeholder'

const router = useRouter()
const stakeholderStore = useStakeholderStore()

// =========================
// FORM
// =========================

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

// =========================
// TOKEN / USER
// =========================

const userId = localStorage.getItem('userId')

// =========================
// FILE CHANGE
// =========================

function onFileChange(e, type) {
  const file = e.target.files[0]
  if (type === 'id')     idFile.value     = file
  if (type === 'letter') letterFile.value = file
}

// =========================
// SUBMIT APPLICATION
// =========================

const authStore = useAuthStore()

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
    formData.append('idFile',       idFile.value)
    formData.append('letterFile',   letterFile.value)

    const response = await api.post(
      '/applications',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    if (!response.data?.id) {
      throw new Error('Application was not saved')
    }

    alert('Application submitted successfully')
    stakeholderStore.clearCache()
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

