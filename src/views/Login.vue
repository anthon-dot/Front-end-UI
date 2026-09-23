<template>
  <div class="login-wrap">
    <div class="login-box">
      <div class="login-top-bar">
        <router-link to="/" class="back-link">
          <i class="pi pi-arrow-left"></i>
          <span>Home</span>
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
          <span class="system-sub">Rental & Management System</span>
        </div>
      </div>

      <h1 class="title">Welcome Back</h1>
      <p class="subtitle">Enter your account credentials to access your portal</p>

      <form @submit.prevent="onSubmit" class="login-form">
        <!-- USERNAME -->
        <label class="label" for="usernameInput">
          <i class="pi pi-user"></i>
          <span>Username or Email</span>
        </label>
        <div class="pill">
          <input
            id="usernameInput"
            v-model="username"
            type="text"
            placeholder="e.g. admin or your email"
            autocomplete="username"
            required
          />
        </div>

        <!-- PASSWORD -->
        <div class="password-header">
          <label class="label" for="passwordInput">
            <i class="pi pi-lock"></i>
            <span>Password</span>
          </label>
          <router-link to="/forgot-password" class="forgot">
            Forgot password?
          </router-link>
        </div>
        <div class="pill">
          <input
            id="passwordInput"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter your password"
            autocomplete="current-password"
            required
          />
          <button
            type="button"
            class="show-btn"
            @click="toggleShow"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
          >
            <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
          </button>
        </div>

        <!-- ERROR -->
        <div v-if="errorMessage" class="error-banner">
          <i class="pi pi-exclamation-circle"></i>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- LOGIN BUTTON -->
        <button
          type="submit"
          class="signin"
          :class="{ 'is-loading': isLoading }"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="spinner" aria-hidden="true"></span>
          <i v-else class="pi pi-sign-in"></i>
          <span>{{ isLoading ? 'Signing in...' : 'Sign in to Portal' }}</span>
        </button>
      </form>

      <div class="signup-footer">
        <p>New stall applicant or tenant?</p>
        <router-link to="/create-account" class="signup-link">
          Create an Account
          <i class="pi pi-arrow-right"></i>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { supabase } from '../config/supabase'
import { useAuthStore, normalizeWorkflowRole } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// =====================
// FORM
// =====================
const username = ref('')
const password = ref('')

const showPassword = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

// =====================
// TOGGLE PASSWORD
// =====================
function toggleShow() {
  showPassword.value = !showPassword.value
}

function quickLogin(targetRole) {
  const token = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({
    sub: 'demo-user-1',
    role: targetRole,
    exp: Math.floor(Date.now() / 1000) + 86400 * 7
  })) + '.sig'

  authStore.setSession({
    token,
    role: targetRole,
    userId: 'demo-user-1',
    user: { name: 'Demo ' + targetRole, email: targetRole.toLowerCase() + '@manticao.gov.ph' }
  })

  if (targetRole === 'ADMIN') router.push('/admin/dashboard')
  else if (targetRole === 'TREASURER') router.push('/treasurer')
  else if (targetRole === 'MARKET_SUPERVISOR') router.push('/supervisor')
  else if (targetRole === 'BPLO_OFFICE') router.push('/bplo')
  else if (targetRole === 'ENDORSING_OFFICE') router.push('/endorsing')
}

// =====================
// LOGIN
// =====================
async function onSubmit() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const inputIdentifier = username.value.trim()
    const rawPassword = password.value

    let emailToAuth = inputIdentifier
    if (!inputIdentifier.includes('@')) {
      // First try resolving the username via Edge Function
      try {
        const { data: resData } = await supabase.functions.invoke('approval-workflow', {
          body: {
            action: 'resolve-login',
            identifier: inputIdentifier
          }
        })
        if (resData?.email) {
          emailToAuth = resData.email
        } else {
          emailToAuth = inputIdentifier.toLowerCase().replace(/[^a-z0-9_.-]/g, '') + '@manticao.market'
        }
      } catch (_) {
        emailToAuth = inputIdentifier.toLowerCase().replace(/[^a-z0-9_.-]/g, '') + '@manticao.market'
      }
    }

    console.log('[AUTH] Supabase signIn for:', emailToAuth)
    let authResult = await supabase.auth.signInWithPassword({
      email: emailToAuth,
      password: rawPassword
    })

    if (authResult.error && !inputIdentifier.includes('@')) {
      const retryResult = await supabase.auth.signInWithPassword({
        email: inputIdentifier.toLowerCase() + '@manticao.gov.ph',
        password: rawPassword
      })
      if (!retryResult.error && retryResult.data?.session) {
        authResult = retryResult
      }
    }

    if (authResult.error) {
      throw new Error(authResult.error.message || 'Invalid username or password')
    }

    const session = authResult.data.session
    const authUser = authResult.data.user

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    const rawRole = profile?.role || authUser.user_metadata?.role || (inputIdentifier.toLowerCase() === 'admin' ? 'ADMIN' : 'STAKEHOLDER')
    const role = normalizeWorkflowRole(rawRole)

    let stakeholderId = ''
    if (role === 'STAKEHOLDER') {
      const { data: stakeholder } = await supabase
        .from('stakeholders')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle()
      if (stakeholder) stakeholderId = String(stakeholder.id)
    }

    authStore.setSession({
      token: session.access_token,
      role: rawRole,
      userId: authUser.id,
      stakeholderId,
      user: {
        id: authUser.id,
        username: profile?.username || inputIdentifier,
        role: rawRole,
        email: authUser.email
      }
    })

    console.log('[AUTH] Session stored:', {
      isAuthenticated:  authStore.isAuthenticated,
      storedRole:       authStore.role,
      normalizedRole:   authStore.normalizedRole,
      resolvedUserId:   authStore.resolvedUserId,
      tokenPresent:     Boolean(authStore.token)
    })

    // ─── 5. ROLE-BASED ROUTING ────────────────────────────────────────────────

    // ADMIN
    if (role === 'ADMIN') {
      console.log('[AUTH] ✅ ADMIN detected — navigating to /admin/dashboard')
      router.push('/admin/dashboard')
      return
    }

    // TREASURER
    if (role === 'TREASURER') {
      console.log('[AUTH] ✅ TREASURER — navigating to /treasurer')
      router.push('/treasurer')
      return
    }

    // BPLO OFFICE
    if (role === 'BPLO_OFFICE') {
      console.log('[AUTH] ✅ BPLO_OFFICE — navigating to /bplo')
      router.push('/bplo')
      return
    }

    // ENDORSING OFFICE
    if (role === 'ENDORSING_OFFICE') {
      console.log('[AUTH] ✅ ENDORSING_OFFICE — navigating to /endorsing')
      router.push('/endorsing')
      return
    }

    // MARKET SUPERVISOR
    if (role === 'MARKET_SUPERVISOR') {
      console.log('[AUTH] ✅ MARKET_SUPERVISOR — navigating to /supervisor')
      router.push('/supervisor')
      return
    }

    // STAKEHOLDER
    if (role === 'STAKEHOLDER') {
      console.log('[AUTH] ✅ STAKEHOLDER — navigating to /application-progress (router guard handles redirect)')
      router.push('/application-progress')
      return
    }

    // UNKNOWN ROLE — should never reach here in production
    console.error('[AUTH] ❌ Unknown role after normalization:', { rawRole, role })
    errorMessage.value = 'Login failed: unrecognized role "' + role + '". Contact your administrator.'

  } catch (error) {
    // ─── 6. ERROR DIAGNOSIS ───────────────────────────────────────────────────
    const status   = error.response?.status
    const body     = error.response?.data
    const message  = error.message

    if (status === 401) {
      console.error('[AUTH] ❌ 401 Unauthorized — wrong username or password, or user is disabled.')
    } else if (status === 403) {
      console.error('[AUTH] ❌ 403 Forbidden — account may be locked or backend CORS/security config issue.')
    } else if (status === 500) {
      console.error('[AUTH] ❌ 500 Server Error — check Render logs. Likely: DB connection failure, AdminSeeder crash, or JWT secret missing.', body)
    } else if (!status) {
      console.error('[AUTH] ❌ Network error — backend unreachable. Check Render service status and VITE_API_URL.')
    } else {
      console.error('[AUTH] ❌ Login error', { status, body, message })
    }

    errorMessage.value =
      (typeof body === 'string' ? body : body?.message) ||
      message ||
      'Wrong username or password'
  } finally {
    isLoading.value = false
  }
}
</script>
<style scoped src="../styles/views/Login.css"></style>


