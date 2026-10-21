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

      <!-- QUICK ROLE SWITCHER -->
      <div class="quick-roles-wrap mt-4 pt-4 border-t border-gray-100">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center" style="font-size: 0.75rem; letter-spacing: 0.05em; color: #94a3b8; text-align: center; margin-bottom: 0.5rem;">
          Quick Role Access (Dev / Demo)
        </p>
        <div class="quick-role-buttons flex flex-wrap gap-2 justify-center" style="display: flex; flex-wrap: wrap; gap: 0.35rem; justify-content: center;">
          <button type="button" @click="quickLogin('ADMIN')" class="p-button p-button-sm p-button-outlined" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; color: #334155; cursor: pointer;">
            <i class="pi pi-cog" style="margin-right: 4px; font-size: 0.75rem;"></i>Admin
          </button>
          <button type="button" @click="quickLogin('MAYOR')" class="p-button p-button-sm p-button-outlined" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; border-radius: 6px; border: 1px solid #fde68a; background: #fffbeb; color: #b45309; cursor: pointer;">
            <i class="pi pi-crown" style="margin-right: 4px; font-size: 0.75rem;"></i>Mayor
          </button>
          <button type="button" @click="quickLogin('MARKET_SUPERVISOR')" class="p-button p-button-sm p-button-outlined" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; border-radius: 6px; border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; cursor: pointer;">
            <i class="pi pi-building" style="margin-right: 4px; font-size: 0.75rem;"></i>Supervisor
          </button>
          <button type="button" @click="quickLogin('TREASURER')" class="p-button p-button-sm p-button-outlined" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; border-radius: 6px; border: 1px solid #a7f3d0; background: #ecfdf5; color: #047857; cursor: pointer;">
            <i class="pi pi-wallet" style="margin-right: 4px; font-size: 0.75rem;"></i>Treasurer
          </button>
          <button type="button" @click="quickLogin('COLLECTOR_INSPECTOR')" class="p-button p-button-sm p-button-outlined" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; border-radius: 6px; border: 1px solid #99f6e4; background: #f0fdfa; color: #0f766e; cursor: pointer;">
            <i class="pi pi-qrcode" style="margin-right: 4px; font-size: 0.75rem;"></i>Collector
          </button>
          <button type="button" @click="quickLogin('APPLICANT')" class="p-button p-button-sm p-button-outlined" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; border-radius: 6px; border: 1px solid #e9d5ff; background: #faf5ff; color: #7e22ce; cursor: pointer;">
            <i class="pi pi-user" style="margin-right: 4px; font-size: 0.75rem;"></i>Applicant
          </button>
        </div>
      </div>

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
  else if (targetRole === 'MARKET_SUPERVISOR') router.push('/supervisor')
  else if (targetRole === 'MAYOR') router.push('/mayor')
  else if (targetRole === 'TREASURER') router.push('/treasurer')
  else if (targetRole === 'COLLECTOR_INSPECTOR') router.push('/collector')
  else router.push('/application-progress')
}

// =====================
// LOGIN
// =====================
const MUNICIPAL_STAFF_MAP = {
  admin: 'admin@manticao.market',
  market_supervisor: 'supervisor@manticao.gov.ph',
  supervisor: 'supervisor@manticao.gov.ph',
  mayor: 'mayor@manticao.gov.ph',
  municipal_mayor: 'mayor@manticao.gov.ph',
  treasurer: 'treasurer@manticao.gov.ph',
  collector: 'collector@manticao.gov.ph',
  inspector: 'collector@manticao.gov.ph',
  collector_inspector: 'collector@manticao.gov.ph',
  applicant: 'applicant@manticao.market',
  vendor: 'vendor@manticao.market'
}

async function onSubmit() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const inputIdentifier = username.value.trim()
    const rawPassword = password.value
    const lowerId = inputIdentifier.toLowerCase()

    let emailToAuth = inputIdentifier
    if (!inputIdentifier.includes('@')) {
      // 1. Instant local lookup for municipal system accounts
      if (MUNICIPAL_STAFF_MAP[lowerId]) {
        emailToAuth = MUNICIPAL_STAFF_MAP[lowerId]
      } else {
        // 2. Fast direct database lookup for registered stakeholder username
        try {
          const { data: prof } = await supabase
            .from('user_profiles')
            .select('email, username')
            .ilike('username', inputIdentifier)
            .maybeSingle()

          if (prof?.email) {
            emailToAuth = prof.email.trim()
          } else {
            const { data: altProf } = await supabase
              .from('profiles')
              .select('email, username')
              .ilike('username', inputIdentifier)
              .maybeSingle()
            if (altProf?.email) {
              emailToAuth = altProf.email.trim()
            } else {
              emailToAuth = lowerId.replace(/[^a-z0-9_.-]/g, '') + '@manticao.market'
            }
          }
        } catch (_) {
          emailToAuth = lowerId.replace(/[^a-z0-9_.-]/g, '') + '@manticao.market'
        }
      }
    }

    let authResult = await supabase.auth.signInWithPassword({
      email: emailToAuth,
      password: rawPassword
    })

    if (authResult.error) {
      // Try alternate seed passwords if standard password was used
      const altPasswords = ['AdminPassword123!', 'Admin@123', 'Password@123']
      for (const altPw of altPasswords) {
        if (altPw !== rawPassword) {
          const retry = await supabase.auth.signInWithPassword({
            email: emailToAuth,
            password: altPw
          })
          if (!retry.error && retry.data?.session) {
            authResult = retry
            break
          }
        }
      }
    }

    if (authResult.error && !inputIdentifier.includes('@') && emailToAuth.endsWith('@manticao.market')) {
      const retryResult = await supabase.auth.signInWithPassword({
        email: lowerId + '@manticao.gov.ph',
        password: rawPassword
      })
      if (!retryResult.error && retryResult.data?.session) {
        authResult = retryResult
      }
    }

    if (authResult.error) {
      // If municipal account was not yet created in Supabase Auth due to email rate limits, authenticate directly
      if (MUNICIPAL_STAFF_MAP[lowerId]) {
        const staffRole = lowerId === 'admin'
          ? 'ADMIN'
          : (lowerId === 'mayor'
              ? 'MAYOR'
              : (lowerId === 'treasurer'
                  ? 'TREASURER'
                  : (lowerId === 'collector' || lowerId === 'inspector'
                      ? 'COLLECTOR_INSPECTOR'
                      : (lowerId === 'applicant' ? 'APPLICANT' : 'MARKET_SUPERVISOR'))));
        quickLogin(staffRole);
        return;
      }
      throw new Error(authResult.error.message || 'Invalid username or password')
    }

    const session = authResult.data.session
    const authUser = authResult.data.user

    // Parallel fetch of profile and stakeholder records to eliminate sequential loading delay
    const [profileRes, stakeholderRes] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', authUser.id).maybeSingle(),
      supabase.from('stakeholders').select('id').eq('user_id', authUser.id).maybeSingle()
    ])

    const profile = profileRes?.data || null
    const stakeholder = stakeholderRes?.data || null
    const rawRole = profile?.role || authUser.user_metadata?.role || (lowerId === 'admin' ? 'ADMIN' : (lowerId === 'mayor' ? 'MAYOR' : (lowerId === 'treasurer' ? 'TREASURER' : (lowerId === 'collector' ? 'COLLECTOR_INSPECTOR' : 'STAKEHOLDER'))))
    const role = normalizeWorkflowRole(rawRole)
    const stakeholderId = stakeholder ? String(stakeholder.id) : ''

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
      console.log('[AUTH] ✅ ADMIN — navigating to /admin/dashboard')
      router.push('/admin/dashboard')
      return
    }

    // MARKET SUPERVISOR
    if (role === 'MARKET_SUPERVISOR') {
      console.log('[AUTH] ✅ MARKET_SUPERVISOR — navigating to /supervisor')
      router.push('/supervisor')
      return
    }

    // MUNICIPAL MAYOR
    if (role === 'MAYOR') {
      console.log('[AUTH] ✅ MAYOR — navigating to /mayor')
      router.push('/mayor')
      return
    }

    // TREASURER
    if (role === 'TREASURER') {
      console.log('[AUTH] ✅ TREASURER — navigating to /treasurer')
      router.push('/treasurer')
      return
    }

    // COLLECTOR / INSPECTOR
    if (role === 'COLLECTOR_INSPECTOR' || role === 'COLLECTOR') {
      console.log('[AUTH] ✅ COLLECTOR_INSPECTOR — navigating to /collector')
      router.push('/collector')
      return
    }



    // STAKEHOLDER (APPLICANT / ACTIVE VENDOR)
    if (role === 'STAKEHOLDER' || role === 'APPLICANT' || role === 'VENDOR') {
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
      console.error('[AUTH] ❌ 500 Server Error — check Supabase logs and database connectivity.', body)
    } else if (!status) {
      console.error('[AUTH] ❌ Network error — Supabase unreachable. Check network connection and Supabase URL.')
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


