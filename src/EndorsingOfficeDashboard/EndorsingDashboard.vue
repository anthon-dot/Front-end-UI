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

<style scoped>
.office-shell{min-height:100vh;background:#f8fafc}.office-main{padding:28px 28px 40px;margin-left:var(--office-sidebar-width,248px)}.page-header{margin-bottom:18px}.eyebrow{margin:0 0 6px;color:#2563eb;font-size:12px;text-transform:uppercase;font-weight:900;letter-spacing:0}.page-header h1{margin:0;color:#0f172a;font-size:30px}.page-header p{margin:8px 0 0;color:#64748b}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}.metrics article{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;box-shadow:0 12px 28px rgba(15,23,42,.05)}.metrics span{display:block;color:#64748b;font-weight:800}.metrics strong{display:block;margin-top:8px;color:#0f172a;font-size:28px}@media (max-width:900px){.office-main{margin-left:0;padding:18px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (max-width:520px){.metrics{grid-template-columns:1fr}}
</style>
