<template>
  <aside class="office-sidebar" :class="{ collapsed }" aria-label="BPLO office menu">
    <div class="sidebar-head">
      <button class="icon-button" type="button" @click="toggle" :aria-label="collapsed ? 'Open menu' : 'Close menu'">
        <span></span><span></span><span></span>
      </button>
      <div v-if="!collapsed" class="brand">
        <strong>BPLO Office</strong>
        <small>Final approval</small>
      </div>
    </div>

    <nav v-if="!collapsed" class="nav-list">
      <button class="nav-item active" type="button" @click="router.push('/bplo')">Dashboard</button>
      <button class="nav-item" type="button" @click="router.push('/bplo/approvals')">Approvals</button>
      <button class="nav-item logout" type="button" @click="logout">Log out</button>
    </nav>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const collapsed = ref(localStorage.getItem('bploOfficeMenuCollapsed') === 'true')

function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem('bploOfficeMenuCollapsed', String(collapsed.value))
  document.documentElement.style.setProperty('--office-sidebar-width', collapsed.value ? '72px' : '248px')
}

function logout() {
  authStore.clearSession()
  router.push({ name: 'Landing' })
}

document.documentElement.style.setProperty('--office-sidebar-width', collapsed.value ? '72px' : '248px')
</script>

<style scoped src="./BPLOOfficeMenu.css"></style>
