<template>
  <main class="min-h-screen bg-slate-50 px-4 py-10">
    <section class="mx-auto grid max-w-5xl gap-6">
      <header class="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-xs font-black uppercase text-blue-600">Stakeholder Activation</p>
          <h1 class="mt-1 text-3xl font-bold text-slate-950">Business Permit Payment Status</h1>
          <p class="mt-2 text-slate-500">Business permit payment is required before dashboard access.</p>
        </div>
        <span :class="statusBadgeClass">{{ verified ? 'VERIFIED' : 'UNVERIFIED' }}</span>
      </header>

      <div v-if="loading" class="rounded-lg border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
        Loading payment status...
      </div>

      <div v-else-if="errorMessage" class="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {{ errorMessage }}
      </div>

      <template v-else>
        <section class="grid gap-4 md:grid-cols-3">
          <article class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-bold text-slate-500">Payment Status</p>
            <strong class="mt-2 block text-2xl text-slate-950">{{ stakeholder?.applicantFeePaid ? 'Paid' : 'Required' }}</strong>
          </article>
          <article class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-bold text-slate-500">Amount Recorded</p>
            <strong class="mt-2 block text-2xl text-slate-950">{{ amountLabel }}</strong>
          </article>
          <article class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-bold text-slate-500">Verification Date</p>
            <strong class="mt-2 block text-2xl text-slate-950">{{ dateLabel }}</strong>
          </article>
        </section>

        <section v-if="!verified" class="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h2 class="text-xl font-bold">Business permit payment required.</h2>
          <p class="mt-2">Please coordinate with the Treasurer office. Once the payment is recorded, your stakeholder account will be activated automatically and dashboard access will open.</p>
          <div class="mt-5 grid gap-3 rounded-lg bg-white/70 p-4 text-sm md:grid-cols-3">
            <div><strong class="block">Step 1</strong>Prepare your business permit payment.</div>
            <div><strong class="block">Step 2</strong>Ask the Treasurer to record it as a business permit payment.</div>
            <div><strong class="block">Step 3</strong>Refresh this page to confirm verification.</div>
          </div>
        </section>

        <section v-else class="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
          <h2 class="text-xl font-bold">Your stakeholder account is active.</h2>
          <p class="mt-2">Dashboard access and stakeholder features are now enabled.</p>
          <button class="mt-5 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700" @click="router.push('/stakeholder')">
            Open Stakeholder Dashboard
          </button>
        </section>
      </template>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getStakeholderByUserId, isDashboardReady } from '../services/applicationService'

const router = useRouter()
const stakeholder = ref(null)
const loading = ref(true)
const errorMessage = ref('')
let refreshTimer = null

const verified = computed(() => isDashboardReady(stakeholder.value))
const amountLabel = computed(() => {
  const amount = Number(stakeholder.value?.applicantFeeAmount || 0)
  return amount > 0
    ? amount.toLocaleString(undefined, { style: 'currency', currency: 'PHP' })
    : '-'
})
const dateLabel = computed(() => {
  const date = stakeholder.value?.verificationDate || stakeholder.value?.applicantFeeDate
  return date ? new Date(date).toLocaleDateString() : '-'
})
const statusBadgeClass = computed(() => [
  'inline-flex rounded-full px-3 py-1 text-sm font-black',
  verified.value
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-amber-100 text-amber-800'
])

async function refreshStakeholderStatus() {
  const userId = localStorage.getItem('userId')
  stakeholder.value = await getStakeholderByUserId(userId)

  console.log('[ApplicantFee] refreshed stakeholder payment status', {
    stakeholderId: stakeholder.value?.id,
    applicantFeePaid: stakeholder.value?.applicantFeePaid,
    verified: stakeholder.value?.verified,
    verifiedStakeholder: stakeholder.value?.verifiedStakeholder,
    verifiedTenant: stakeholder.value?.verifiedTenant,
    dashboardReady: isDashboardReady(stakeholder.value)
  })

  if (!stakeholder.value) {
    router.replace('/business-application')
    return
  }

  if (isDashboardReady(stakeholder.value)) {
    router.replace('/stakeholder')
  }
}

onMounted(async () => {
  try {
    await refreshStakeholderStatus()
    refreshTimer = window.setInterval(refreshStakeholderStatus, 5000)
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load applicant fee status.'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
  }
})
</script>
