import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../config/supabase'

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
    // 1. SYSTEM_ADMIN
    ADMIN: 'SYSTEM_ADMIN',
    SYSTEM_ADMIN: 'SYSTEM_ADMIN',
    SYSADMIN: 'SYSTEM_ADMIN',

    // 2. MAYOR_OFFICE
    MAYOR: 'MAYOR_OFFICE',
    MAYOR_OFFICE: 'MAYOR_OFFICE',
    MUNICIPAL_MAYOR: 'MAYOR_OFFICE',
    MAYORS_OFFICE: 'MAYOR_OFFICE',

    // 3. MARKET_SUPERVISOR
    SUPERVISOR: 'MARKET_SUPERVISOR',
    MARKETSUPERVISOR: 'MARKET_SUPERVISOR',
    MARKET_SUPERVISOR: 'MARKET_SUPERVISOR',
    COLLECTOR: 'MARKET_SUPERVISOR',
    INSPECTOR: 'MARKET_SUPERVISOR',
    COLLECTOR_INSPECTOR: 'MARKET_SUPERVISOR',

    // 4. TREASURER
    TREASURER: 'TREASURER',

    // 5. STAKEHOLDER
    TENANT: 'STAKEHOLDER',
    VENDOR: 'STAKEHOLDER',
    APPLICANT: 'STAKEHOLDER',
    STAKEHOLDER: 'STAKEHOLDER',
    USER: 'STAKEHOLDER'
  }

  return aliases[normalized] || normalized
}

export const useAuthStore = defineStore('auth', () => {
  const DEFAULT_DEMO_UUID = '00000000-0000-0000-0000-000000000001'
  const rawUid = localStorage.getItem('userId') || ''
  const initialUid = rawUid === 'demo-user-1' ? DEFAULT_DEMO_UUID : rawUid

  const token = ref(localStorage.getItem(AUTH_TOKEN_KEY) || '')
  const role = ref(localStorage.getItem('role') || '')
  const userId = ref(initialUid)
  const stakeholderId = ref(localStorage.getItem('stakeholderId') || '')
  const user = ref(null)

  const tokenPayload = computed(() => token.value ? decodeToken(token.value) : null)
  const normalizedRole = computed(() => {
    return normalizeWorkflowRole(role.value || tokenPayload.value?.role || tokenPayload.value?.user_metadata?.role)
  })
  const roles = computed(() => normalizedRole.value ? [normalizedRole.value] : [])
  const resolvedUserId = computed(() => {
    let id = userId.value || tokenPayload.value?.sub || tokenPayload.value?.userId || tokenPayload.value?.id || ''
    if (id === 'demo-user-1') id = DEFAULT_DEMO_UUID
    return id
  })
  const isAuthenticated = computed(() => Boolean(token.value))
  const isTokenExpired = computed(() => {
    const exp = tokenPayload.value?.exp
    return !exp || exp * 1000 <= Date.now()
  })

  function setSession(session = {}) {
    token.value = session.token || ''
    role.value = session.role || ''
    let incomingUid = session.userId ? String(session.userId) : ''
    if (incomingUid === 'demo-user-1') incomingUid = DEFAULT_DEMO_UUID
    userId.value = incomingUid
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

  let inFlightHydration = null

  async function hydrateFromStorage({ force = false } = {}) {
    // 1. Read immediate synchronous storage state
    if (!token.value) token.value = localStorage.getItem(AUTH_TOKEN_KEY) || ''
    if (!role.value) role.value = localStorage.getItem('role') || ''
    if (!userId.value) userId.value = localStorage.getItem('userId') || ''
    if (!stakeholderId.value) stakeholderId.value = localStorage.getItem('stakeholderId') || ''

    // If session is already active and valid in memory, avoid redundant network check
    if (!force && token.value && !isTokenExpired.value && role.value) {
      return
    }

    if (inFlightHydration) return inFlightHydration

    inFlightHydration = (async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          const errStr = String(sessionError.message || '').toLowerCase()
          if (errStr.includes('refresh') || errStr.includes('invalid') || errStr.includes('token')) {
            localStorage.removeItem('supabase.auth.token')
            localStorage.removeItem(AUTH_TOKEN_KEY)
          }
        } else if (session?.access_token) {
          token.value = session.access_token
          userId.value = session.user.id
          localStorage.setItem(AUTH_TOKEN_KEY, session.access_token)
          localStorage.setItem('userId', session.user.id)

          if (!role.value) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .maybeSingle()
            if (profile?.role) {
              role.value = profile.role
              localStorage.setItem('role', profile.role)
            }
          }
        }
      } catch (e) {
        const errStr = String(e?.message || '').toLowerCase()
        if (errStr.includes('refresh') || errStr.includes('invalid') || errStr.includes('token')) {
          localStorage.removeItem('supabase.auth.token')
          localStorage.removeItem(AUTH_TOKEN_KEY)
        }
      } finally {
        inFlightHydration = null
      }
    })()

    return inFlightHydration
  }

  async function clearSession() {
    token.value = ''
    role.value = ''
    userId.value = ''
    stakeholderId.value = ''
    user.value = null

    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem('role')
    localStorage.removeItem('userId')
    localStorage.removeItem('stakeholderId')

    try {
      await supabase.auth.signOut()
    } catch (e) {
      // Ignore signOut errors
    }
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
