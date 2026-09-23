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

      <!-- ERROR -->
      <div v-if="errorMessage" class="error-banner">
        <i class="pi pi-exclamation-circle"></i>
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="createAccount">
        <div class="field">
          <label>Username</label>
          <input
            v-model="username"
            type="text"
            placeholder="Choose a username"
            required
          />
        </div>

        <div class="field">
          <label>Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="Create password (min 6 characters)"
            required
          />
        </div>

        <div class="field">
          <label>Confirm Password</label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            required
          />
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
import { useRouter } from 'vue-router'
import api from '../services/api'
import { supabase } from '../config/supabase'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username        = ref('')
const password        = ref('')
const confirmPassword = ref('')
const errorMessage    = ref('')
const isLoading       = ref(false)

async function createAccount() {
  errorMessage.value = ''

  // ── Client-side validation ────────────────────────────────────────────────
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters.'
    return
  }

  isLoading.value = true

  try {
    const cleanUsername = username.value.trim()
    const isEmail = cleanUsername.includes('@')
    const fallbackEmail = isEmail
      ? cleanUsername
      : cleanUsername.toLowerCase().replace(/[^a-z0-9_.-]/g, '') + '@manticao.market'

    // 1. Register account through Edge Function (email_confirm: true, bypasses email rate limit)
    let registeredEmail = fallbackEmail
    try {
      const { data: regData, error: regError } = await supabase.functions.invoke('approval-workflow', {
        body: {
          action: 'register',
          username: cleanUsername,
          password: password.value,
          role: cleanUsername.toLowerCase() === 'admin' ? 'ADMIN' : 'STAKEHOLDER'
        }
      })

      if (regError || regData?.error) {
        const msg = regError?.message || regData?.error || ''
        if (!msg.toLowerCase().includes('already')) {
          throw new Error(msg || 'Registration failed. Please check your credentials.')
        }
      }

      if (regData?.email) {
        registeredEmail = regData.email
      }
    } catch (edgeErr) {
      console.warn('[AUTH] Edge function register error, falling back to direct sign-in:', edgeErr)
    }

    // 2. Immediately sign in to obtain authenticated session token
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: registeredEmail,
      password: password.value
    })

    if (signInError) {
      throw new Error(signInError.message || 'Account created, but could not sign in. Please log in from the Sign In page.')
    }

    const session = signInData.session
    const user = signInData.user
    const roleToSet = cleanUsername.toLowerCase() === 'admin' ? 'ADMIN' : 'STAKEHOLDER'

    authStore.setSession({
      token: session?.access_token || '',
      role: roleToSet,
      userId: user?.id || '',
      user: {
        id: user?.id,
        username: cleanUsername,
        role: roleToSet,
        email: user?.email
      }
    })

    // Route according to user role
    if (roleToSet === 'ADMIN') {
      router.push('/admin/dashboard')
    } else {
      router.push('/business-application')
    }

  } catch (error) {
    errorMessage.value =
      error.message || 'Failed to create account. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped src="../styles/views/CreateAccount.css"></style>

