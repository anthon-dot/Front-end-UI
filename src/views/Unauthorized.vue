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

  if (role === 'TREASURER' || role === 'ADMIN') {
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

<style scoped>
.unauthorized-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f8fafc;
}

.panel {
  width: min(100%, 440px);
  padding: 32px;
  border-radius: 18px;
  background: white;
  text-align: center;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12);
}

.panel i {
  color: #dc2626;
  font-size: 34px;
}

.panel h1 {
  margin: 14px 0 8px;
  color: #0f172a;
  font-size: 28px;
}

.panel p {
  margin: 0 0 20px;
  color: #64748b;
}

.panel button {
  border: none;
  border-radius: 10px;
  padding: 11px 16px;
  color: white;
  background: #0f766e;
  font-weight: 800;
  cursor: pointer;
}
</style>
