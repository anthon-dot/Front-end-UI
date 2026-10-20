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

  if (role === 'ADMIN') {
    router.push('/admin/dashboard')
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

  if (role === 'MAYOR') {
    router.push('/mayor')
    return
  }

  if (role === 'TREASURER') {
    router.push('/treasurer')
    return
  }

  if (role === 'COLLECTOR_INSPECTOR' || role === 'COLLECTOR' || role === 'INSPECTOR') {
    router.push('/collector')
    return
  }

  router.push('/application-progress')
}
</script>

<style scoped src="../styles/views/Unauthorized.css"></style>

