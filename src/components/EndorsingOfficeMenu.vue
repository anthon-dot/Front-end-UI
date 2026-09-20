<template>
  <aside class="office-sidebar" :class="{ collapsed }" aria-label="Endorsing office menu">
    <div class="sidebar-head">
      <button class="icon-button" type="button" @click="toggle" :aria-label="collapsed ? 'Open menu' : 'Close menu'">
        <span></span><span></span><span></span>
      </button>
      <div v-if="!collapsed" class="brand">
        <strong>Endorsing Office</strong>
        <small>Review queue</small>
      </div>
    </div>

    <nav v-if="!collapsed" class="nav-list">
      <button class="nav-item active" type="button" @click="router.push('/endorsing')">Dashboard</button>
      <button class="nav-item" type="button" @click="router.push('/endorsing/approvals')">Approvals</button>
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
const collapsed = ref(localStorage.getItem('endorsingOfficeMenuCollapsed') === 'true')

function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem('endorsingOfficeMenuCollapsed', String(collapsed.value))
  document.documentElement.style.setProperty('--office-sidebar-width', collapsed.value ? '72px' : '248px')
}

function logout() {
  authStore.clearSession()
  router.push({ name: 'Landing' })
}

document.documentElement.style.setProperty('--office-sidebar-width', collapsed.value ? '72px' : '248px')
</script>

<style scoped src="../styles/components/EndorsingOfficeMenu.css"></style>
