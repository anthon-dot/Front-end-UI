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
import { useRouter, useRoute } from 'vue-router'
import api from '../services/api'
import { supabase } from '../config/supabase'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const stallId = route.query?.stall_id || route.query?.stallId || null
const stallNo = route.query?.stall_no || route.query?.stallNo || null

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
      ? cleanUsername.toLowerCase()
      : cleanUsername.toLowerCase().replace(/[^a-z0-9_.-]/g, '') + '@manticao.market'
    const assignedRole = cleanUsername.toLowerCase() === 'admin' ? 'ADMIN' : 'APPLICANT'

    let authenticated = false
    let sessionToken = null
    let authUserId = null
    let resolvedRole = assignedRole

    // 1. Authoritative registration via api.post (handled by smart adapter / direct backend)
    try {
      const { data: regRes } = await api.post('/auth/register', {
        username: cleanUsername,
        password: password.value,
        email: fallbackEmail,
        role: assignedRole,
        stallId,
        stallNo
      })

      if (regRes?.token && regRes?.user) {
        sessionToken = regRes.token
        authUserId = regRes.user.id
        resolvedRole = regRes.user.role || assignedRole
        authenticated = true
      } else if (regRes?.session?.access_token) {
        sessionToken = regRes.session.access_token
        authUserId = regRes.session.user?.id
        authenticated = true
      }
    } catch (apiErr) {
      console.warn('[AUTH] /auth/register note:', apiErr?.message)
      const errStr = String(apiErr?.message || '')
      if (errStr.includes('already exists') || errStr.includes('already registered')) {
        throw apiErr
      }
    }

    // 2. Direct Supabase Auth SDK fallback (for zero-latency or standalone client execution)
    if (!authenticated) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fallbackEmail,
        password: password.value,
        options: {
          data: {
            username: cleanUsername,
            role: assignedRole
          }
        }
      })

      if (signUpError) {
        const msg = String(signUpError.message || '').toLowerCase()
        if (msg.includes('already registered') || msg.includes('already exists')) {
          // Attempt sign in if account was already created with this password
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: fallbackEmail,
            password: password.value
          })
          if (signInErr) {
            throw new Error('An account with this username or email already exists. Please sign in from the Login page.')
          }
          sessionToken = signInData?.session?.access_token
          authUserId = signInData?.user?.id
          authenticated = true
        } else if (msg.includes('rate limit') || msg.includes('too many requests')) {
          throw new Error('Registration rate limit reached. Please wait a minute or sign in from the Login page.')
        } else {
          throw signUpError
        }
      } else {
        sessionToken = signUpData?.session?.access_token
        authUserId = signUpData?.user?.id
        authenticated = Boolean(sessionToken)
      }

      // If signed up but session not returned immediately, sign in now
      if (!sessionToken) {
        const { data: signData, error: signErr } = await supabase.auth.signInWithPassword({
          email: fallbackEmail,
          password: password.value
        })
        if (!signErr && signData?.session) {
          sessionToken = signData.session.access_token
          authUserId = signData.user?.id
          authenticated = true
        }
      }

      if (authUserId) {
        // Upsert user_profiles and stakeholders
        try {
          await supabase.from('user_profiles').upsert({
            id: authUserId,
            username: cleanUsername,
            full_name: cleanUsername,
            email: fallbackEmail,
            role: assignedRole,
            is_active: true
          }, { onConflict: 'id' })
        } catch (_) {}

        try {
          const { data: exSh } = await supabase.from('stakeholders').select('id').eq('user_id', authUserId).maybeSingle()
          let shId = exSh?.id
          if (!shId) {
            const { data: newSh } = await supabase.from('stakeholders').insert({
              user_id: authUserId,
              first_name: cleanUsername,
              last_name: 'Applicant',
              business_name: `${cleanUsername}'s Market Trade`,
              business_type: 'General Merchandise',
              contact: '09000000000',
              email: fallbackEmail,
              address: 'Manticao, Misamis Oriental',
              selected_stall_id: stallId ? Number(stallId) : null,
              application_status: 'NEW',
              onboarding_status: 'NEW'
            }).select('id').maybeSingle()
            shId = newSh?.id
          }
          if (shId) localStorage.setItem('stakeholderId', String(shId))
        } catch (_) {}
      }
    }

    if (!authenticated || !sessionToken) {
      throw new Error('Account created, but could not automatically sign in. Please log in from the Sign In page.')
    }

    const finalRole = resolvedRole === 'ADMIN' ? 'ADMIN' : 'STAKEHOLDER'
    authStore.setSession({
      token: sessionToken,
      role: finalRole,
      userId: authUserId,
      user: {
        id: authUserId,
        username: cleanUsername,
        role: finalRole,
        email: fallbackEmail
      }
    })

    // Preserving stall parameters for seamless application continuity
    const targetQuery = {}
    if (stallId) targetQuery.stall_id = stallId
    if (stallNo) targetQuery.stall_no = stallNo

    if (finalRole === 'ADMIN' || resolvedRole === 'MARKET_SUPERVISOR') {
      router.push('/supervisor')
    } else {
      router.push({ path: '/business-application', query: targetQuery })
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

