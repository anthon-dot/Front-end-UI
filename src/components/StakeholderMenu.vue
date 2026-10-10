<template>
  <!-- Mobile Topbar -->
  <header class="mobile-topbar" aria-label="Stakeholder Mobile Navigation Bar">
    <button
      type="button"
      class="mobile-menu-btn"
      @click="toggleMobile"
      :aria-label="mobileOpen ? 'Close Menu' : 'Open Menu'"
    >
      <i :class="mobileOpen ? 'pi pi-times' : 'pi pi-bars'" />
    </button>
    <div class="mobile-brand">
      <div class="brand-logo-sm">SH</div>
      <span class="mobile-brand-title">Stakeholder Portal</span>
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
    aria-label="Stakeholder Sidebar"
  >
    <div class="sidebar-container">

      <!-- HEADER -->
      <div class="sidebar-header">
        <button
          class="toggle-btn"
          @click="isMobile ? closeMobile() : toggleSidebar()"
          :aria-label="isMobile ? 'Close Sidebar' : (collapsed ? 'Expand Sidebar' : 'Collapse Sidebar')"
        >
          <i :class="isMobile ? 'pi pi-times' : (collapsed ? 'pi pi-bars' : 'pi pi-angle-left')" />
        </button>

        <Transition name="fade-slide">
          <div
            v-if="isMobile || !collapsed"
            class="brand"
          >
            <div class="brand-logo">
              SH
            </div>

            <div class="brand-text">
              <h1>Stakeholder</h1>
              <p>Portal Panel</p>
            </div>
          </div>
        </Transition>
      </div>

      <!-- NAVIGATION -->
      <nav class="nav-menu">
        <button
          v-for="item in items"
          :key="item.id"
          class="nav-item"
          :class="{
            active: isActive(item),
            collapsed: !isMobile && collapsed
          }"
          @click="navigate(item)"
        >
          <i
            :class="item.icon"
            class="nav-icon"
          />

          <Transition name="fade-slide">
            <span
              v-if="isMobile || !collapsed"
              class="nav-label"
            >
              {{ item.label }}
            </span>
          </Transition>

          <div
            v-if="isActive(item)"
            class="active-indicator"
          />
        </button>
      </nav>

      <!-- FOOTER -->
      <div class="sidebar-footer">
        <button
          class="logout-btn"
          :class="{ collapsed: !isMobile && collapsed }"
          @click="logout"
        >
          <i class="pi pi-sign-out nav-icon" />

          <Transition name="fade-slide">
            <span v-if="isMobile || !collapsed">
              Logout
            </span>
          </Transition>
        </button>
      </div>

    </div>
  </aside>
</template>

<script setup>
import {
  ref,
  watch,
  onMounted,
  onUnmounted
} from 'vue'

import {
  useRouter,
  useRoute
} from 'vue-router'
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
    route: '/stakeholder',
    section: 'overview'
  },
  {
    id: 'stall',
    label: 'My Stall',
    icon: 'pi pi-shop',
    section: 'stall'
  },
  {
    id: 'billing',
    label: 'Billing & Statements',
    icon: 'pi pi-receipt',
    section: 'billing'
  },
  {
    id: 'payments',
    label: 'Payment History',
    icon: 'pi pi-wallet',
    route: '/stakeholder/payments',
    section: 'payments'
  },
  {
    id: 'contract',
    label: 'My Contract',
    icon: 'pi pi-file-check',
    section: 'contracts'
  },
  {
    id: 'documents',
    label: 'My Documents',
    icon: 'pi pi-folder',
    section: 'documents'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'pi pi-bell',
    section: 'notifications'
  },
  {
    id: 'profile',
    label: 'My Profile',
    icon: 'pi pi-user',
    section: 'profile'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'pi pi-cog',
    route: '/stakeholder/settings'
  }
]

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

const toggleMobile = () => {
  mobileOpen.value = !mobileOpen.value
}

const closeMobile = () => {
  mobileOpen.value = false
}

const navigate = (item) => {
  if (isMobile.value) {
    closeMobile()
  }
  if (item.section) {
    if (route.path === '/stakeholder') {
      router.replace({ path: '/stakeholder', query: { section: item.section } })
    } else {
      router.push({ path: '/stakeholder', query: { section: item.section } })
    }
  } else if (item.route) {
    router.push(item.route)
  }
}

const isActive = (item) => {
  if (item.id === 'dashboard') {
    return route.path === '/stakeholder' && (!route.query.section || route.query.section === 'overview')
  }
  if (item.section) {
    return route.path === '/stakeholder' && route.query.section === item.section
  }
  if (item.id === 'payments') {
    return route.path === '/stakeholder/payments' || (route.path === '/stakeholder' && route.query.section === 'payments')
  }
  return route.path === item.route
}

const logout = () => {
  authStore.clearSession()
  localStorage.removeItem('currentStakeholder')
  router.push({
    name: 'Login'
  })
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
  localStorage.setItem(
    'stakeholder-sidebar',
    value
  )
  updateSidebarWidth()
})

watch(route, () => {
  if (isMobile.value) {
    closeMobile()
  }
})

onMounted(() => {
  const saved =
    localStorage.getItem(
      'stakeholder-sidebar'
    )

  if (saved !== null) {
    collapsed.value =
      saved === 'true'
  }

  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<style scoped src="../styles/components/StakeholderMenu.css"></style>
