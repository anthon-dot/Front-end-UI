<template>
  <div class="office-shell">
    <EndorsingOfficeMenu />
    <main class="office-main">
      <header class="page-header">
        <div>
          <p class="eyebrow">Endorsing Office</p>
          <h1>Application Endorsements</h1>
          <p>Review BPLO-approved applications before business permit payment.</p>
        </div>
      </header>

      <section class="metrics">
        <article><span>Total</span><strong>{{ total }}</strong></article>
        <article><span>Ready</span><strong>{{ ready }}</strong></article>
        <article><span>Endorsed</span><strong>{{ endorsed }}</strong></article>
        <article><span>Rejected</span><strong>{{ rejected }}</strong></article>
      </section>

      <EndorsingApproval />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import EndorsingOfficeMenu from '../components/EndorsingOfficeMenu.vue'
import EndorsingApproval from './EndorsingApproval.vue'
import { getApplications } from '../services/applicationService'

const applications = ref([])
onMounted(async () => {
  try { applications.value = await getApplications() } catch (error) { applications.value = [] }
})

const total = computed(() => applications.value.length)
const ready = computed(() => applications.value.filter((app) => app.bploStatus === 'APPROVED' && (app.endorsingStatus || app.endorsementStatus || 'PENDING') === 'PENDING').length)
const endorsed = computed(() => applications.value.filter((app) => (app.endorsingStatus || app.endorsementStatus) === 'ENDORSED' || app.endorsementStatus === 'APPROVED').length)
const rejected = computed(() => applications.value.filter((app) => (app.endorsingStatus || app.endorsementStatus) === 'REJECTED').length)
</script>

<style scoped src="../styles/EndorsingOfficeDashboard/EndorsingDashboard.css"></style>
