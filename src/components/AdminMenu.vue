<template>
  <aside class="sidebar" :class="{ collapsed }" aria-label="Admin Sidebar">
    <div class="sidebar-container">
      <div class="sidebar-header">
        <button
          class="toggle-btn"
          @click="toggleSidebar"
          :aria-label="collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
        >
          <i :class="collapsed ? 'pi pi-bars' : 'pi pi-angle-left'" />
        </button>

        <Transition name="fade-slide">
          <div v-if="!collapsed" class="brand">
            <div class="brand-logo">AD</div>
            <div class="brand-text">
              <h1>Admin</h1>
              <p>System Panel</p>
            </div>
          </div>
        </Transition>
      </div>

      <nav class="nav-menu">
        <div v-for="section in sections" :key="section.label" class="nav-section">
          <Transition name="fade-slide">
            <div v-if="!collapsed && section.label" class="section-label">
              {{ section.label }}
            </div>
          </Transition>

          <button
            v-for="item in section.items"
            :key="item.routeName"
            class="nav-item"
            :class="{ active: isActive(item), collapsed }"
            @click="navigate(item)"
          >
            <i :class="item.icon" class="nav-icon" />
            <Transition name="fade-slide">
              <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
            </Transition>
            <div v-if="isActive(item)" class="active-indicator" />
          </button>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" :class="{ collapsed }" @click="logout">
          <i class="pi pi-sign-out" />
          <Transition name="fade-slide">
            <span v-if="!collapsed">Logout</span>
          </Transition>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const collapsed = ref(false)

const sections = [
  {
    label: '',
    items: [{ label: 'Dashboard', icon: 'pi pi-home', routeName: 'AdminDashboard' }]
  },
  {
    label: 'User Management',
    items: [
      { label: 'Users', icon: 'pi pi-users', routeName: 'AdminUsers' },
      { label: 'Roles & Permissions', icon: 'pi pi-shield', routeName: 'AdminRoles' },
      { label: 'Login History', icon: 'pi pi-history', routeName: 'AdminLoginHistory' }
    ]
  },
  {
    label: 'Market Management',
    items: [
      { label: 'Stall Map', icon: 'pi pi-map', routeName: 'AdminStallMap' },
      { label: 'Stalls', icon: 'pi pi-building', routeName: 'AdminStalls' },
      { label: 'Stall Types', icon: 'pi pi-tags', routeName: 'AdminStallTypes' },
      { label: 'Rental Rates', icon: 'pi pi-money-bill', routeName: 'AdminRentalRates' }
    ]
  },
  {
    label: 'Monitoring',
    items: [
      { label: 'Applications', icon: 'pi pi-file', routeName: 'AdminApplications' },
      { label: 'Stakeholders', icon: 'pi pi-id-card', routeName: 'AdminStakeholders' },
      { label: 'Contracts', icon: 'pi pi-file-check', routeName: 'AdminContracts' },
      { label: 'Payments', icon: 'pi pi-wallet', routeName: 'AdminPayments' },
      { label: 'Billing', icon: 'pi pi-receipt', routeName: 'AdminBilling' },
      { label: 'Occupancy', icon: 'pi pi-chart-pie', routeName: 'AdminOccupancy' }
    ]
  },
  {
    label: 'Reports',
    items: [
      { label: 'Revenue', icon: 'pi pi-chart-line', routeName: 'AdminRevenueReport' },
      { label: 'Applications', icon: 'pi pi-chart-bar', routeName: 'AdminApplicationsReport' },
      { label: 'Occupancy', icon: 'pi pi-chart-scatter', routeName: 'AdminOccupancyReport' },
      { label: 'System Activity', icon: 'pi pi-list-check', routeName: 'AdminActivityReport' }
    ]
  },
  {
    label: 'Security',
    items: [{ label: 'Audit Logs', icon: 'pi pi-lock', routeName: 'AdminAuditLogs' }]
  },
  {
    label: 'System',
    items: [
      { label: 'Notifications', icon: 'pi pi-bell', routeName: 'AdminNotifications' },
      { label: 'Settings', icon: 'pi pi-cog', routeName: 'AdminSettings' },
      { label: 'Profile', icon: 'pi pi-user', routeName: 'AdminProfile' }
    ]
  }
]

function isActive(item) {
  return route.name === item.routeName
}

function navigate(item) {
  router.push({ name: item.routeName })
}

function toggleSidebar() {
  collapsed.value = !collapsed.value
}

function logout() {
  authStore.clearSession()
  router.push({ name: 'Landing' })
}

watch(collapsed, (value) => {
  localStorage.setItem('admin-sidebar-collapsed', value)
  document.documentElement.style.setProperty('--sidebar-width', value ? '90px' : '300px')
})

onMounted(() => {
  const saved = localStorage.getItem('admin-sidebar-collapsed')
  collapsed.value = saved === 'true'
  document.documentElement.style.setProperty('--sidebar-width', collapsed.value ? '90px' : '300px')
})
</script>

<style scoped>
.sidebar {
  --primary: #1d4ed8;
  --primary-light: #eff6ff;
  --text: #101828;
  --muted: #667085;
  --border: rgba(148, 163, 184, 0.22);
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--sidebar-width);
  transition: width 0.3s ease;
  z-index: 1000;
}

.sidebar.collapsed {
  width: 90px;
}

.sidebar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(22px);
  border-right: 1px solid var(--border);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.10);
}

.sidebar-header {
  display: flex;
  align-items: center;
  min-height: 82px;
  padding: 1.2rem;
  border-bottom: 1px solid var(--border);
}

.toggle-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.9);
  color: var(--muted);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: 14px;
}

.brand-logo {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, #1d4ed8, #0f766e);
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.24);
}

.brand-text h1 {
  margin: 0;
  font-size: 1rem;
  color: var(--text);
  font-weight: 800;
}

.brand-text p,
.section-label {
  margin: 2px 0 0;
  font-size: 0.76rem;
  color: var(--muted);
}

.nav-menu {
  flex: 1;
  padding: 1rem 0.8rem;
  overflow-y: auto;
}

.section-label {
  padding: 14px 16px 6px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.nav-item {
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  margin-bottom: 6px;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: var(--muted);
}

.nav-item.collapsed {
  justify-content: center;
}

.nav-item:hover {
  background: rgba(37, 99, 235, 0.08);
  color: var(--primary);
  transform: translateX(3px);
}

.nav-item.active {
  background: linear-gradient(135deg, #2563eb, #0f766e);
  color: white;
  font-weight: 700;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
}

.nav-icon {
  min-width: 20px;
  font-size: 1.05rem;
}

.nav-label {
  font-size: 0.9rem;
  white-space: nowrap;
}

.active-indicator {
  position: absolute;
  right: 12px;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: white;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: none;
  border-radius: 14px;
  background: #fff1f2;
  color: #e11d48;
  font-weight: 700;
}

.logout-btn.collapsed {
  justify-content: center;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
