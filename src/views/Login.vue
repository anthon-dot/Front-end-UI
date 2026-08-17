<template>
  <div class="login-wrap">

    <div class="login-box">

      <h1 class="title">
        Welcome Back
      </h1>

      <p class="subtitle">
        Please login to continue
      </p>

      <!-- USERNAME -->
      <label class="label">
        Username
      </label>

      <div class="pill">
        <input
          v-model="username"
          type="text"
          placeholder="Enter username"
        />
      </div>

      <!-- PASSWORD -->
      <label class="label">
        Password
      </label>

      <div class="pill">
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Enter password"
        />

        <button
          type="button"
          class="show"
          @click="toggleShow"
        >
          {{ showPassword ? '🙈' : '👁' }}
        </button>
      </div>

      <!-- ERROR -->
      <p
        v-if="errorMessage"
        class="error"
      >
        {{ errorMessage }}
      </p>

      <!-- FORGOT PASSWORD -->
      <div class="forgot-box">
        <router-link
          to="/forgot-password"
          class="forgot"
        >
          Forgot Password?
        </router-link>
      </div>

      <!-- LOGIN -->
      <button
        class="signin"
        :class="{ 'is-loading': isLoading }"
        :disabled="isLoading"
        @click="onSubmit"
      >
        <span v-if="isLoading" class="spinner" aria-hidden="true"></span>
        {{ isLoading ? 'Signing in...' : 'Sign in' }}
      </button>

    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getApplicationByUserId, getStakeholderRouteForApplication } from '../services/applicationService'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

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

// =====================
// LOGIN
// =====================
async function onSubmit() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    // =====================
    // LOGIN REQUEST
    // =====================
    const loginResponse = await api.post('/auth/login', {
      username: username.value,
      password: password.value
    })

    const data = loginResponse.data

    console.log('LOGIN:', data)

    // =====================
    // SAVE SESSION
    // =====================
    authStore.setSession({
      token: data.token,
      role: data.role,
      userId: data.userId || data.id,
      user: data
    })

    const rawRole = String(data.role || '').replace('ROLE_', '').toUpperCase()
    const roleAliases = {
      MARKETSUPERVISOR: 'MARKET_SUPERVISOR',
      BPLO: 'BPLO_OFFICE',
      BPLOOFFICE: 'BPLO_OFFICE',
      ENDORSINGOFFICE: 'ENDORSING_OFFICE',
      ENDORSING_OFFICER: 'ENDORSING_OFFICE',
      ENDORISING_OFFICE: 'ENDORSING_OFFICE',
      TENANT: 'STAKEHOLDER',
      APPLICANT: 'STAKEHOLDER'
    }
    const role = roleAliases[rawRole] || rawRole

    // TREASURER
if (role === 'TREASURER') {
  router.push('/treasurer')
  return
}

// BPLO OFFICE
if (role === 'BPLO_OFFICE') {
  router.push('/bplo')
  return
}

// ENDORSING OFFICE
if (role === 'ENDORSING_OFFICE') {
  router.push('/endorsing')
  return
}

// MARKET SUPERVISOR
if (role === 'MARKET_SUPERVISOR') {
  router.push('/supervisor')
  return
}

   // =====================
// STAKEHOLDER
// =====================
if (role === 'STAKEHOLDER') {
  try {
    const application = await getApplicationByUserId(data.userId || data.id)
    router.push(getStakeholderRouteForApplication(application))
    return

  } catch (error) {
    console.error(
      'APPLICATION STATUS ERROR:',
      error
    )

    errorMessage.value =
      'Signed in, but the application status could not be loaded. Please try again.'
    return
  }
}

    // =====================
    // UNKNOWN ROLE
    // =====================
    errorMessage.value =
      'Unknown role: ' + role
  } catch (error) {
    console.error('LOGIN ERROR:', error)

    errorMessage.value =
      error.message ||
      'Wrong username or password'
  } finally {
    isLoading.value = false
  }
}
</script>
<style scoped>

.login-wrap {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  padding: 24px;
  background:
    radial-gradient(circle at 18% 12%, rgba(37, 99, 235, 0.22), transparent 26rem),
    radial-gradient(circle at 86% 18%, rgba(20, 184, 166, 0.18), transparent 24rem),
    linear-gradient(135deg, #f8fbff 0%, #eef4ff 48%, #f7f8fb 100%);
}

.login-box {
  width: min(100%, 420px);
  padding: 36px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(22px);
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.16);
  color: #101828;
  animation: login-enter 420ms ease both;
}

.title {
  text-align: center;
  font-size: clamp(2rem, 6vw, 2.6rem);
  line-height: 1.05;
  letter-spacing: 0;
  margin: 0;
}

.subtitle {
  text-align: center;
  margin: 10px 0 30px;
  color: #667085;
}

.label {
  display: block;
  margin-top: 15px;
  margin-bottom: 8px;
  color: #344054;
  font-size: 0.9rem;
  font-weight: 700;
}

.pill {
  position: relative;
}

.pill input {
  width: 100%;
  padding: 14px 48px 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
  color: #101828;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.pill input:focus {
  border-color: rgba(37, 99, 235, 0.46);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
  background: #ffffff;
}

.pill input::placeholder {
  color: #98a2b3;
}

.show {
  position: absolute;
  right: 8px;
  top: 50%;
  width: 36px;
  height: 36px;
  transform: translateY(-50%);
  background: transparent;
  color: #667085;
  cursor: pointer;
}

.error {
  margin-top: 15px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff1f2;
  color: #be123c;
  text-align: center;
  font-weight: 700;
}

.forgot-box {
  margin-top: 12px;
  text-align: right;
}

.forgot {
  color: #2563eb;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
}

.signin {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  margin-top: 25px;
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb, #0f766e);
  color: white;
  font-weight: 800;
  box-shadow: 0 16px 32px rgba(37, 99, 235, 0.22);
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: white;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes login-enter {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 480px) {
  .login-box {
    padding: 28px 22px;
  }
}

</style>
