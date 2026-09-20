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

<style scoped src="./AdminMenu.css"></style>
