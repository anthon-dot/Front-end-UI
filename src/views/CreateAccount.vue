<template>
  <div class="create-page">

    <div class="container">

      <h2>Create Account</h2>

      <p class="subtitle">Enter your credentials to create a new account.</p>

      <!-- ERROR -->
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <form @submit.prevent="createAccount">

        <div class="field">
          <label>Username</label>
          <input
            v-model="username"
            type="text"
            placeholder="Enter username"
            required
          />
        </div>

        <div class="field">
          <label>Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="Enter password"
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

          <router-link to="/" class="btn cancel">
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

      </form>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()

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
    // Register — backend sets role=STAKEHOLDER and status=ACTIVE automatically
    await api.post('/auth/register', {
      username: username.value,
      password: password.value
    })

    // Go straight to login — no role popup needed
    router.push('/login')

  } catch (error) {
    errorMessage.value =
      error.message || 'Failed to create account. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>

.create-page {
  padding: 40px;
  background: #f5f7fb;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  width: min(100%, 460px);
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12);
}

h2 {
  margin: 0 0 6px;
  font-size: 1.7rem;
  color: #101828;
}

.subtitle {
  margin: 0 0 28px;
  color: #667085;
  font-size: 0.92rem;
}

.field {
  margin-bottom: 18px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 700;
  font-size: 0.9rem;
  color: #344054;
}

.field input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 0.95rem;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.field input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.error {
  margin-bottom: 16px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #fff1f2;
  color: #be123c;
  font-weight: 700;
  font-size: 0.9rem;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cancel {
  background: #e5e7eb;
  color: #374151;
  flex: 0 0 auto;
}

.submit {
  background: linear-gradient(135deg, #2563eb, #0f766e);
  color: white;
  flex: 1;
}

.submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

</style>
