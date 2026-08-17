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

<style scoped>
.office-sidebar{position:fixed;inset:0 auto 0 0;width:var(--office-sidebar-width,248px);background:#fff;border-right:1px solid #e2e8f0;z-index:20;transition:width .18s ease}
.sidebar-head{display:flex;align-items:center;gap:12px;padding:18px 14px;border-bottom:1px solid #e2e8f0}
.brand{display:flex;flex-direction:column;line-height:1.2;color:#0f172a}.brand small{color:#64748b;margin-top:3px}
.icon-button{width:42px;height:42px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:8px;display:grid;place-content:center;gap:4px;cursor:pointer}.icon-button span{display:block;width:18px;height:2px;background:#334155;border-radius:4px}
.nav-list{display:grid;gap:8px;padding:16px 12px}.nav-item{border:0;background:transparent;color:#334155;text-align:left;padding:11px 12px;border-radius:8px;font-weight:700;cursor:pointer}.nav-item:hover,.nav-item.active{background:#ecfdf5;color:#047857}.logout{margin-top:12px;color:#be123c}
@media (max-width:760px){.office-sidebar{position:sticky;top:0;width:100%;height:auto}.nav-list{grid-template-columns:1fr 1fr auto}.sidebar-head{padding:12px}.office-sidebar.collapsed .nav-list{display:none}}
</style>
