<template>
  <!-- Mobile Topbar -->
  <header class="mobile-topbar" aria-label="Mobile Navigation Bar">
    <button
      type="button"
      class="mobile-menu-btn"
      @click="toggleMobile"
      :aria-label="mobileOpen ? 'Close Menu' : 'Open Menu'"
    >
      <i :class="mobileOpen ? 'pi pi-times' : 'pi pi-bars'" />
    </button>
    <div class="mobile-brand">
      <div class="brand-logo-sm">TR</div>
      <span class="mobile-brand-title">Treasurer</span>
    </div>
  </header>

  <!-- Mobile Backdrop Overlay -->
  <div
    v-if="mobileOpen"
    class="sidebar-backdrop"
    @click="closeMobile"
    aria-hidden="true"
  />

  <aside
    class="sidebar"
    :class="{ collapsed: !isMobile && collapsed, 'mobile-open': mobileOpen }"
    aria-label="Treasurer Sidebar"
  >
    <div class="sidebar-container">

      <!-- Header -->
      <div class="sidebar-header">
        <button
          class="toggle-btn"
          @click="isMobile ? closeMobile() : toggleSidebar()"
          :aria-label="isMobile ? 'Close Sidebar' : (collapsed ? 'Expand Sidebar' : 'Collapse Sidebar')"
        >
          <i :class="isMobile ? 'pi pi-times' : (collapsed ? 'pi pi-bars' : 'pi pi-angle-left')" />
        </button>

        <Transition name="fade-slide">
          <div v-if="isMobile || !collapsed" class="brand">
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
          :class="{ active: isActive(item), collapsed: !isMobile && collapsed }"
          @click="navigate(item)"
        >
          <i :class="item.icon" class="nav-icon" />

          <Transition name="fade-slide">
            <span v-if="isMobile || !collapsed" class="nav-label">
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
          :class="{ collapsed: !isMobile && collapsed }"
          @click="logout"
        >
          <i class="pi pi-sign-out" />

          <Transition name="fade-slide">
            <span v-if="isMobile || !collapsed">Logout</span>
          </Transition>
        </button>
      </div>

    </div>
  </aside>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const collapsed = ref(false)
const mobileOpen = ref(false)
const isMobile = ref(false)

const items = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'pi pi-home',
    routeName: 'Treasurer'
  },
  {
    id: 'applicant-payments',
    label: 'Applicant Payments',
    icon: 'pi pi-user-check',
    routeName: 'Applicant'
  },
  {
    id: 'payment-recording',
    label: 'Payment Recording',
    icon: 'pi pi-credit-card',
    routeName: 'Payment',
    query: { action: 'record' }
  },
  {
    id: 'billing-management',
    label: 'Billing Management',
    icon: 'pi pi-receipt',
    routeName: 'Billing'
  },
  {
    id: 'advance-credit',
    label: 'Advance Credit',
    icon: 'pi pi-wallet',
    routeName: 'Billing',
    query: { tab: 'advance-credit' }
  },
  {
    id: 'business-permit-fees',
    label: 'Business Permit Fees',
    icon: 'pi pi-id-card',
    routeName: 'Payment',
    query: { type: 'permit-fees' }
  },
  {
    id: 'daily-collections',
    label: 'Daily Collections',
    icon: 'pi pi-calendar-plus',
    routeName: 'Billing',
    query: { tab: 'collections' }
  },
  {
    id: 'outstanding-balances',
    label: 'Outstanding Balances',
    icon: 'pi pi-chart-pie',
    routeName: 'Billing',
    query: { tab: 'outstanding' }
  },
  {
    id: 'overdue-accounts',
    label: 'Overdue Accounts',
    icon: 'pi pi-exclamation-triangle',
    routeName: 'Billing',
    query: { tab: 'overdue' }
  },
  {
    id: 'receipts',
    label: 'Receipts',
    icon: 'pi pi-list',
    routeName: 'Payment',
    query: { tab: 'receipts' }
  },
  {
    id: 'reports',
    label: 'Financial Reports',
    icon: 'pi pi-chart-line',
    routeName: 'Report'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'pi pi-bell',
    routeName: 'AINotifications'
  },
  {
    id: 'profile',
    label: 'My Profile',
    icon: 'pi pi-user',
    routeName: 'AdminProfile'
  }
]

const isActive = (item) => {
  if (item.query?.tab) {
    return route.name === item.routeName && route.query.tab === item.query.tab
  }
  if (item.query?.action) {
    return route.name === item.routeName && route.query.action === item.query.action
  }
  if (item.query?.type) {
    return route.name === item.routeName && route.query.type === item.query.type
  }
  return route.name === item.routeName && !route.query.tab && !route.query.action && !route.query.type
}

const navigate = (item) => {
  if (isMobile.value) {
    closeMobile()
  }
  router.push({ name: item.routeName, query: item.query || {} })
}

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

const toggleMobile = () => {
  mobileOpen.value = !mobileOpen.value
}

const closeMobile = () => {
  mobileOpen.value = false
}

const logout = () => {
  authStore.clearSession()
  router.push({ name: 'Landing' })
}

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 1024
  updateSidebarWidth()
}

const updateSidebarWidth = () => {
  if (isMobile.value) {
    document.documentElement.style.setProperty('--sidebar-width', '0px')
  } else {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed.value ? '76px' : '260px'
    )
  }
}

watch(collapsed, (value) => {
  localStorage.setItem('sidebar-collapsed', value)
  updateSidebarWidth()
})

watch(route, () => {
  if (isMobile.value) {
    closeMobile()
  }
})

onMounted(() => {
  const saved = localStorage.getItem('sidebar-collapsed')

  if (saved !== null) {
    collapsed.value = saved === 'true'
  }

  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<style scoped src="../styles/components/TreasurerMenu.css"></style>
