<!-- ============================= -->
<!-- BusinessApplication.vue -->
<!-- ============================= -->

<template>

  <div class="create-page">

    <div class="container">

      <h2>
        Stakeholder Application
      </h2>

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

const router = useRouter()

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

async function submitApplication() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {

    const formData = new FormData()

    formData.append('userId',       userId)
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
    router.push('/application-progress')

  } catch (error) {
    console.error(error)
    errorMessage.value = error.message || 'Application submission failed'
  } finally {
    isSubmitting.value = false
  }
}

</script>

<style scoped>

.create-page {
  padding: 40px;
  background: #f5f7fb;
  min-height: 100vh;
}

.container {
  max-width: 1000px;
  margin: auto;
  background: white;
  padding: 40px;
  border-radius: 12px;
}

h3 {
  margin: 24px 0 12px;
  font-size: 1.05rem;
  color: #334155;
}

.row {
  display: flex;
  gap: 20px;
}

.row.two  { display: flex; gap: 20px; }
.row.three{ display: flex; gap: 20px; }

.field {
  flex: 1;
  margin-bottom: 16px;
}

.field label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

.field input {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  box-sizing: border-box;
}

.actions {
  margin-top: 24px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.submit {
  background: #2563eb;
  color: white;
}

.submit:hover    { background: #1d4ed8; }
.submit:disabled { cursor: not-allowed; opacity: 0.65; }

.error {
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 18px;
  background: #fff1f2;
  color: #be123c;
  font-weight: 700;
}

</style>
