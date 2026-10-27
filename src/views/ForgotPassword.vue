<template>
  <div class="login-wrap">
    <div class="login-box">
      <div class="login-top-bar">
        <router-link to="/login" class="back-link">
          <i class="pi pi-arrow-left"></i>
          <span>Back to Login</span>
        </router-link>
        <span class="secure-tag">
          <i class="pi pi-shield"></i>
          <span>Official Portal</span>
        </span>
      </div>

      <div class="brand-badge-wrap">
        <div class="brand-logo-lg">RM</div>
        <div class="brand-meta">
          <span class="muni-title">Manticao Public Market</span>
          <span class="system-sub">Account Recovery</span>
        </div>
      </div>

      <h1 class="title">Reset Password</h1>
      <p class="subtitle">Enter your registered email address or username to receive password reset instructions.</p>

      <div v-if="successMessage" class="success-banner" style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">
        <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
          <i class="pi pi-check-circle" style="color: #16a34a; font-size: 1.3rem; margin-top: 2px;"></i>
          <div>
            <h3 style="margin: 0 0 0.25rem; color: #166534; font-size: 1rem; font-weight: 700;">Request Sent</h3>
            <p style="margin: 0; color: #15803d; font-size: 0.88rem; line-height: 1.5;">
              {{ successMessage }}
            </p>
          </div>
        </div>
        <div style="margin-top: 1rem;">
          <router-link to="/login" class="signin" style="text-decoration: none; text-align: center; display: block; width: 100%;">
            Return to Login
          </router-link>
        </div>
      </div>

      <form v-else @submit.prevent="handleReset" class="login-form">
        <label class="label" for="resetIdentifier">
          <i class="pi pi-user"></i>
          <span>Username or Email Address</span>
        </label>
        <div class="pill">
          <input
            id="resetIdentifier"
            v-model="identifier"
            type="text"
            placeholder="Enter your username or email"
            required
          />
        </div>

        <div v-if="errorMessage" class="error-banner">
          <i class="pi pi-exclamation-circle"></i>
          <span>{{ errorMessage }}</span>
        </div>

        <button
          type="submit"
          class="signin"
          :class="{ 'is-loading': isLoading }"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="spinner" aria-hidden="true"></span>
          <i v-else class="pi pi-send"></i>
          <span>{{ isLoading ? 'Sending...' : 'Send Reset Instructions' }}</span>
        </button>

        <div style="margin-top: 1.5rem; text-align: center; font-size: 0.85rem; color: #64748b;">
          Remembered your password?
          <router-link to="/login" style="color: #2563eb; font-weight: 600; text-decoration: none; margin-left: 4px;">
            Sign in here
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../config/supabase'

const identifier = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function handleReset() {
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    const input = identifier.value.trim()
    let emailToReset = input

    if (!input.includes('@')) {
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('email')
        .ilike('username', input)
        .maybeSingle()

      if (prof?.email) {
        emailToReset = prof.email.trim()
      } else {
        emailToReset = `${input.toLowerCase().replace(/[^a-z0-9_.-]/g, '')}@manticao.market`
      }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
      redirectTo: `${window.location.origin}/login`
    })

    if (error) {
      console.warn('[RESET] Supabase reset notice:', error.message)
    }

    successMessage.value = `If an account matches "${input}", instructions have been dispatched. For temporary accounts or office assistance, contact the Market Supervisor office.`
  } catch (err) {
    errorMessage.value = err.message || 'Could not process password reset request.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped src="../styles/views/Login.css"></style>
