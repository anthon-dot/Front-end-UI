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

    // 1. Authoritative backend registration (creates auth user, user_profiles, and stakeholder records)
    let authenticated = false
    let registeredEmail = fallbackEmail

    try {
      const { data: regRes } = await api.post('/auth/register', {
        username: cleanUsername,
        password: password.value,
        email: fallbackEmail,
        role: cleanUsername.toLowerCase() === 'admin' ? 'ADMIN' : 'APPLICANT'
      })

      if (regRes?.token && regRes?.user) {
        const roleToSet = cleanUsername.toLowerCase() === 'admin' ? 'ADMIN' : 'STAKEHOLDER'
        authStore.setSession({
          token: regRes.token,
          role: roleToSet,
          userId: regRes.user.id || '',
          user: {
            id: regRes.user.id,
            username: cleanUsername,
            role: roleToSet,
            email: regRes.user.email || fallbackEmail
          }
        })
        authenticated = true
      } else if (regRes?.user?.email) {
        registeredEmail = regRes.user.email
      }
    } catch (apiErr) {
      console.warn('[AUTH] Backend /auth/register notice:', apiErr?.message)
      // If backend returned a specific error like user already exists
      if (apiErr?.response?.data?.error) {
        throw new Error(apiErr.response.data.error)
      }
    }

    // 2. If not already authenticated, log in via backend or Supabase
    if (!authenticated) {
      try {
        const { data: loginRes } = await api.post('/auth/login', {
          username: cleanUsername,
          password: password.value
        })

        if (loginRes?.token && loginRes?.user) {
          const roleToSet = cleanUsername.toLowerCase() === 'admin' ? 'ADMIN' : 'STAKEHOLDER'
          authStore.setSession({
            token: loginRes.token,
            role: roleToSet,
            userId: loginRes.user.id || '',
            user: {
              id: loginRes.user.id,
              username: cleanUsername,
              role: roleToSet,
              email: loginRes.user.email
            }
          })
          authenticated = true
        }
      } catch (loginErr) {
        // Fallback to Supabase direct sign-in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: registeredEmail,
          password: password.value
        })

        if (signInError) {
          if (String(signInError?.message || '').toLowerCase().includes('rate limit')) {
            throw new Error('Supabase registration rate limit reached. Please wait a minute before trying again or sign in with an existing account.')
          }
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
        authenticated = true
      }
    }

    const currentRole = authStore.normalizedRole || 'STAKEHOLDER'
    if (currentRole === 'ADMIN' || currentRole === 'MARKET_SUPERVISOR') {
      router.push('/supervisor')
    } else {
      router.push('/business-application')
    }

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

