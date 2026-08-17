import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getStakeholderByUserId,
  getStakeholderRequirements
} from '../services/applicationService'

const CACHE_TTL = 5 * 60 * 1000

export const useStakeholderStore = defineStore('stakeholder', () => {
  const stakeholder = ref(null)
  const requirements = ref(null)
  const loadedForUserId = ref('')
  const loadedForStakeholderId = ref('')
  const stakeholderFetchedAt = ref(0)
  const requirementsFetchedAt = ref(0)

  const isStakeholderStale = computed(() => {
    return Date.now() - stakeholderFetchedAt.value > CACHE_TTL
  })
  const areRequirementsStale = computed(() => {
    return Date.now() - requirementsFetchedAt.value > CACHE_TTL
  })

  function hasFreshStakeholderLookup(userId) {
    return String(userId || '') === loadedForUserId.value &&
      stakeholderFetchedAt.value > 0 &&
      !isStakeholderStale.value
  }

  function hasFreshRequirementsLookup(stakeholderId) {
    return String(stakeholderId || '') === loadedForStakeholderId.value &&
      requirementsFetchedAt.value > 0 &&
      !areRequirementsStale.value
  }

  async function ensureStakeholderForUser(userId, { force = false } = {}) {
    const normalizedUserId = String(userId || '')

    if (!normalizedUserId) {
      stakeholder.value = null
      loadedForUserId.value = ''
      stakeholderFetchedAt.value = 0
      return null
    }

    if (!force && hasFreshStakeholderLookup(normalizedUserId)) {
      return stakeholder.value
    }

    stakeholder.value = await getStakeholderByUserId(normalizedUserId)
    loadedForUserId.value = normalizedUserId
    stakeholderFetchedAt.value = Date.now()

    if (!stakeholder.value) {
      requirements.value = null
      loadedForStakeholderId.value = ''
      requirementsFetchedAt.value = 0
    }

    return stakeholder.value
  }

  async function ensureRequirements(stakeholderId, { force = false } = {}) {
    const normalizedStakeholderId = String(stakeholderId || '')

    if (!normalizedStakeholderId) {
      requirements.value = null
      loadedForStakeholderId.value = ''
      requirementsFetchedAt.value = 0
      return null
    }

    if (!force && hasFreshRequirementsLookup(normalizedStakeholderId)) {
      return requirements.value
    }

    try {
      requirements.value = await getStakeholderRequirements(normalizedStakeholderId)
    } catch (error) {
      requirements.value = null
    }

    loadedForStakeholderId.value = normalizedStakeholderId
    requirementsFetchedAt.value = Date.now()
    return requirements.value
  }

  function clearCache() {
    stakeholder.value = null
    requirements.value = null
    loadedForUserId.value = ''
    loadedForStakeholderId.value = ''
    stakeholderFetchedAt.value = 0
    requirementsFetchedAt.value = 0
  }

  return {
    stakeholder,
    requirements,
    loadedForUserId,
    loadedForStakeholderId,
    stakeholderFetchedAt,
    requirementsFetchedAt,
    isStakeholderStale,
    areRequirementsStale,
    ensureStakeholderForUser,
    ensureRequirements,
    clearCache
  }
})
