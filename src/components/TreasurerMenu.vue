<template>
  <aside
    class="sidebar"
    :class="{ collapsed }"
    aria-label="Treasurer Sidebar"
  >
    <div class="sidebar-container">

      <!-- Header -->
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
            <div class="brand-logo">TR</div>
            <div class="brand-text">
              <h1>Treasurer</h1>
              <p>Management Panel</p>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Navigation -->
      <nav class="nav-menu">
        <button
          v-for="item in items"
          :key="item.id"
          class="nav-item"
          :class="{ active: isActive(item), collapsed }"
          @click="navigate(item)"
        >
          <i :class="item.icon" class="nav-icon" />

          <Transition name="fade-slide">
            <span v-if="!collapsed" class="nav-label">
              {{ item.label }}
            </span>
          </Transition>

          <div
            v-if="isActive(item)"
            class="active-indicator"
          />
        </button>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <button
          class="logout-btn"
          :class="{ collapsed }"
          @click="logout"
        >
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
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const collapsed = ref(false)

const items = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'pi pi-home',
    routeName: 'Treasurer'
  },
  {
    id: 'stakeholder',
    label: 'Applicants',
    icon: 'pi pi-users',
    routeName: 'Applicant'
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: 'pi pi-receipt',
    routeName: 'Billing'
  },
  {
    id: 'payment',
    label: 'Payments',
    icon: 'pi pi-wallet',
    routeName: 'Payment'
  },
  {
    id: 'report',
    label: 'Reports',
    icon: 'pi pi-chart-bar',
    routeName: 'Report'
  },
  {
    id: 'ai-reports',
    label: 'AI Reports',
    icon: 'pi pi-sparkles',
    routeName: 'AIReports'
  },
  {
    id: 'ai-notifications',
    label: 'AI Notifications',
    icon: 'pi pi-bell',
    routeName: 'AINotifications'
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    icon: 'pi pi-list',
    routeName: 'AuditLogs'
  }
]

const isActive = (item) => {
  return route.name === item.routeName
}

const navigate = (item) => {
  router.push({ name: item.routeName })
}

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

const logout = () => {
  authStore.clearSession()
  router.push({ name: 'Landing' })
}

watch(collapsed, (value) => {
  localStorage.setItem('sidebar-collapsed', value)

  document.documentElement.style.setProperty(
    '--sidebar-width',
    value ? '90px' : '280px'
  )
})

onMounted(() => {
  const saved = localStorage.getItem('sidebar-collapsed')

  if (saved !== null) {
    collapsed.value = saved === 'true'
  }

  document.documentElement.style.setProperty(
    '--sidebar-width',
    collapsed.value ? '90px' : '280px'
  )
})
</script>

<style scoped src="../styles/components/TreasurerMenu.css"></style>
