<template>
  <div class="office-shell">
    <BPLOOfficeMenu />
    <main class="office-main">
      <header class="page-header">
        <div>
          <p class="eyebrow">BPLO Office</p>
          <h1>Business Permit Review</h1>
          <p>Approve or reject applications after Market Supervisor stall assignment.</p>
        </div>
      </header>

      <section class="metrics">
        <article><span>Total</span><strong>{{ total }}</strong></article>
        <article><span>Ready</span><strong>{{ ready }}</strong></article>
        <article><span>Approved</span><strong>{{ approved }}</strong></article>
        <article><span>Rejected</span><strong>{{ rejected }}</strong></article>
      </section>

      <BPLOApproval />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import BPLOOfficeMenu from '../components/BPLOOfficeMenu.vue'
import BPLOApproval from './BPLOApproval.vue'
import { getApplications } from '../services/applicationService'

const applications = ref([])
onMounted(async () => {
  try { applications.value = await getApplications() } catch (error) { applications.value = [] }
})

const total = computed(() => applications.value.length)
const ready = computed(() => applications.value.filter((app) => app.marketApprovalStatus === 'APPROVED' && (app.bploStatus || 'PENDING') === 'PENDING').length)
const approved = computed(() => applications.value.filter((app) => app.bploStatus === 'APPROVED').length)
const rejected = computed(() => applications.value.filter((app) => app.bploStatus === 'REJECTED' || app.finalStatus === 'REJECTED').length)
</script>

<style scoped src="./BPLODashboard.css"></style>
