<template>
  <main class="unauthorized-page">
    <section class="panel">
      <i class="pi pi-lock"></i>
      <h1>Unauthorized</h1>
      <p>You do not have permission to open this page.</p>

      <button @click="goHome">
        Back to dashboard
      </button>
    </section>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  const role = String(localStorage.getItem('role') || '').replace('ROLE_', '').toUpperCase()

  // ADMIN — must go to admin dashboard, not treasurer
  if (role === 'ADMIN') {
    router.push('/admin/dashboard')
    return
  }

  if (role === 'TREASURER') {
    router.push('/treasurer')
    return
  }

  if (
    role === 'MARKETSUPERVISOR' ||
    role === 'MARKET_SUPERVISOR' ||
    role === 'SUPERVISOR'
  ) {
    router.push('/supervisor')
    return
  }

  if (role === 'BPLO' || role === 'BPLOOFFICE' || role === 'BPLO_OFFICE') {
    router.push('/bplo')
    return
  }

  if (
    role === 'ENDORSINGOFFICE' ||
    role === 'ENDORSING_OFFICE' ||
    role === 'ENDORSING_OFFICER' ||
    role === 'ENDORISING_OFFICE'
  ) {
    router.push('/endorsing')
    return
  }

  router.push('/stakeholder')
}
</script>

<style scoped src="./Unauthorized.css"></style>

