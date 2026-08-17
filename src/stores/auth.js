import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const AUTH_TOKEN_KEY = 'authToken'

function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(normalized))
  } catch (error) {
    return null
  }
}

function normalizeRole(role) {
  return String(role || '')
    .replace('ROLE_', '')
    .trim()
    .toUpperCase()
}

export function normalizeWorkflowRole(role) {
  const normalized = normalizeRole(role)

  const aliases = {
    MARKETSUPERVISOR: 'MARKET_SUPERVISOR',
    BPLO: 'BPLO_OFFICE',
    BPLOOFFICE: 'BPLO_OFFICE',
    ENDORSINGOFFICE: 'ENDORSING_OFFICE',
    ENDORSING_OFFICER: 'ENDORSING_OFFICE',
    ENDORISING_OFFICE: 'ENDORSING_OFFICE',
    TENANT: 'STAKEHOLDER',
    APPLICANT: 'STAKEHOLDER'
  }

  return aliases[normalized] || normalized
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(AUTH_TOKEN_KEY) || '')
  const role = ref(localStorage.getItem('role') || '')
  const userId = ref(localStorage.getItem('userId') || '')
  const stakeholderId = ref(localStorage.getItem('stakeholderId') || '')
  const user = ref(null)

  const tokenPayload = computed(() => token.value ? decodeToken(token.value) : null)
  const normalizedRole = computed(() => {
    return normalizeWorkflowRole(role.value || tokenPayload.value?.role)
  })
  const roles = computed(() => normalizedRole.value ? [normalizedRole.value] : [])
  const resolvedUserId = computed(() => {
    return userId.value || tokenPayload.value?.userId || tokenPayload.value?.id || ''
  })
  const isAuthenticated = computed(() => Boolean(token.value))
  const isTokenExpired = computed(() => {
    const exp = tokenPayload.value?.exp
    return !exp || exp * 1000 <= Date.now()
  })

  function setSession(session = {}) {
    token.value = session.token || ''
    role.value = session.role || ''
    userId.value = session.userId ? String(session.userId) : ''
    stakeholderId.value = session.stakeholderId ? String(session.stakeholderId) : ''
    user.value = session.user || null

    if (token.value) {
      localStorage.setItem(AUTH_TOKEN_KEY, token.value)
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY)
    }

    if (role.value) localStorage.setItem('role', role.value)
    else localStorage.removeItem('role')

    if (userId.value) localStorage.setItem('userId', userId.value)
    else localStorage.removeItem('userId')

    if (stakeholderId.value) localStorage.setItem('stakeholderId', stakeholderId.value)
    else localStorage.removeItem('stakeholderId')
  }

  function setStakeholderId(id) {
    stakeholderId.value = id ? String(id) : ''

    if (stakeholderId.value) {
      localStorage.setItem('stakeholderId', stakeholderId.value)
    } else {
      localStorage.removeItem('stakeholderId')
    }
  }

  function hydrateFromStorage() {
    token.value = localStorage.getItem(AUTH_TOKEN_KEY) || ''
    role.value = localStorage.getItem('role') || ''
    userId.value = localStorage.getItem('userId') || ''
    stakeholderId.value = localStorage.getItem('stakeholderId') || ''
  }

  function clearSession() {
    token.value = ''
    role.value = ''
    userId.value = ''
    stakeholderId.value = ''
    user.value = null

    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem('role')
    localStorage.removeItem('userId')
    localStorage.removeItem('stakeholderId')
  }

  return {
    token,
    role,
    userId,
    stakeholderId,
    user,
    tokenPayload,
    normalizedRole,
    roles,
    resolvedUserId,
    isAuthenticated,
    isTokenExpired,
    setSession,
    setStakeholderId,
    hydrateFromStorage,
    clearSession
  }
})
