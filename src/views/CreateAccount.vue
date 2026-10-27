<template>
  <div class="create-page">
    <div class="container">
      <div class="create-top-bar">
        <router-link to="/login" class="back-link">
          <i class="pi pi-arrow-left"></i>
          <span>Back to Login</span>
        </router-link>
      </div>

      <div class="brand-badge-wrap">
        <div class="brand-logo-lg">RM</div>
        <div class="brand-meta">
          <span class="muni-title">Manticao Public Market</span>
          <span class="system-sub">Tenant & Applicant Registration</span>
        </div>
      </div>

      <h2>Create Account</h2>
      <p class="subtitle">Enter your credentials to register a new applicant account.</p>

      <!-- SELECTED STALL FROM INTERACTIVE MAP -->
      <div v-if="stallNo" class="selected-stall-banner">
        <i class="pi pi-map-marker"></i>
        <span>Applying for Stall: <strong>{{ stallNo }}</strong></span>
      </div>

      <!-- ERROR -->
      <div v-if="errorMessage" class="error-banner">
        <i class="pi pi-exclamation-circle"></i>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- SUCCESS BANNER -->
      <div v-if="accountCreated" class="success-banner" style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
          <i class="pi pi-check-circle" style="color: #16a34a; font-size: 1.5rem; margin-top: 2px;"></i>
          <div>
            <h3 style="margin: 0 0 0.5rem; color: #166534; font-size: 1.1rem; font-weight: 700;">Temporary Account Created Successfully</h3>
            <p style="margin: 0 0 0.5rem; color: #15803d; font-size: 0.95rem; line-height: 1.5;">
              Your temporary account is ready. Please log in using your username and password to start and submit your Business Application.
            </p>
            <p style="margin: 0; color: #475569; font-size: 0.85rem; line-height: 1.4;">
              <em>Note:</em> Your official email address, contact numbers, and verification documents will be provided in your Business Application upon logging in.
            </p>
          </div>
        </div>
        <div class="actions" style="margin-top: 1.25rem;">
          <router-link to="/login" class="btn submit" style="text-decoration: none; text-align: center; display: block; width: 100%;">
            Proceed to Login
          </router-link>
        </div>
      </div>

      <form v-else @submit.prevent="createAccount">
        <div class="field">
          <label for="reg-username">Username <span style="color: #ef4444;">*</span></label>
          <input
            id="reg-username"
            name="username"
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="Choose a username"
            required
          />
        </div>

        <div class="field">
          <label for="reg-password">Password <span style="color: #ef4444;">*</span></label>
          <div class="password-input-wrap">
            <input
              id="reg-password"
              name="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Enter your password (min 6 characters)"
              required
            />
            <button
              type="button"
              class="toggle-password-btn"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>
        </div>

        <div class="field">
          <label for="reg-confirm-password">Confirm Password <span style="color: #ef4444;">*</span></label>
          <div class="password-input-wrap">
            <input
              id="reg-confirm-password"
              name="confirm-password"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Re-enter your password"
              required
            />
            <button
              type="button"
              class="toggle-password-btn"
              @click="showConfirmPassword = !showConfirmPassword"
              :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
            >
              <i :class="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.82rem; color: #64748b; line-height: 1.4;">
          <i class="pi pi-info-circle" style="color: #3b82f6; margin-right: 4px;"></i>
          <strong>Temporary Account:</strong> Only username and password credentials are required. Your official email address, contact info, and documents will be entered on your Business Application.
        </div>

        <div class="actions">
          <router-link to="/login" class="btn cancel">
            Cancel
          </router-link>

          <button
            class="btn submit"
            type="submit"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Creating...' : 'Create Account' }}
          </button>
        </div>

        <div class="login-footer">
          <p>Already have an account? <router-link to="/login" class="login-link">Sign in here</router-link></p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../services/api'
import { supabase } from '../config/supabase'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const stallId = route.query?.stall_id || route.query?.stallId || null
const stallNo = route.query?.stall_no || route.query?.stallNo || null

const username            = ref('')
const password            = ref('')
const confirmPassword     = ref('')
const showPassword        = ref(false)
const showConfirmPassword = ref(false)
const errorMessage        = ref('')
const isLoading           = ref(false)
const accountCreated      = ref(false)

async function createAccount() {
  errorMessage.value = ''

  const cleanUsername = username.value.trim()
  if (!cleanUsername) {
    errorMessage.value = 'Please enter a username.'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isLoading.value = true

  try {
    const assignedRole = cleanUsername.toLowerCase() === 'admin' ? 'ADMIN' : 'APPLICANT'

    // Save preferred stall if selected from map
    if (stallId) {
      localStorage.setItem('preferred_stall_id', String(stallId))
    }
    if (stallNo) {
      localStorage.setItem('preferred_stall_no', String(stallNo))
    }

    // 1. Register temporary account via authoritative API handler
    const regRes = await api.post('/auth/register', {
      username: cleanUsername,
      password: password.value,
      role: assignedRole,
      stallId,
      stallNo
    })

    if (regRes?.data?.success) {
      accountCreated.value = true
      return
    }

    throw new Error(regRes?.data?.message || 'Failed to create account. Please try again.')
  } catch (error) {
    const rawMsg = String(error?.message || error || '')
    if (rawMsg.includes('429') || rawMsg.toLowerCase().includes('rate limit') || rawMsg.toLowerCase().includes('too many requests')) {
      errorMessage.value = 'Too many requests. Please wait 60 seconds before trying again, or proceed to the Sign In page if your account was already created.'
    } else {
      errorMessage.value = error.message || 'Failed to create account. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped src="../styles/views/CreateAccount.css"></style>

