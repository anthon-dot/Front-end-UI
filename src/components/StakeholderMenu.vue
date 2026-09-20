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
    route: '/stakeholder'
  },
  {
    id: 'payments',
    label: 'Payment History',
    icon: 'pi pi-wallet',
    route: '/stakeholder/payments'
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
  router.push(item.route)
}

const isActive = (item) => {
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
      collapsed.value ? '90px' : '280px'
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
