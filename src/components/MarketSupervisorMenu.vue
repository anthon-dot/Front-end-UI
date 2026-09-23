<template>
  <!-- Mobile Topbar -->
  <header class="mobile-topbar" aria-label="Market Supervisor Mobile Navigation Bar">
    <button
      type="button"
      class="mobile-menu-btn"
      @click="toggleMobile"
      :aria-label="mobileOpen ? 'Close Menu' : 'Open Menu'"
    >
      <i :class="mobileOpen ? 'pi pi-times' : 'pi pi-bars'" />
    </button>
    <div class="mobile-brand">
      <div class="brand-logo-sm">MS</div>
      <span class="mobile-brand-title">Market Supervisor</span>
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
    aria-label="Market Supervisor Sidebar"
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
              MS
            </div>

            <div class="brand-text">
              <h1>Market Supervisor</h1>
              <p>Management Panel</p>
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
          <i :class="item.icon" class="nav-icon" />

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
  computed,
  watch,
  onMounted,
  onUnmounted,
  defineProps
} from 'vue'

import {
  useRouter,
  useRoute
} from 'vue-router'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  forceOpen: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const collapsed = ref(false)
const mobileOpen = ref(false)
const isMobile = ref(false)

const baseItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'pi pi-home',
    routeName: 'MarketSupervisor'
  },
  {
    id: 'contracts',
    label: 'Contracts',
    icon: 'pi pi-file-edit',
    routeName: 'MSContracts'
  },
  {
    id: 'stalls',
    label: 'Stall Management',
    icon: 'pi pi-building',
    routeName: 'MSStalls'
  },
  {
    id: 'archive',
    label: 'Archive Record',
    icon: 'pi pi-inbox',
    routeName: 'MSArchive'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'pi pi-chart-bar',
    routeName: 'MSReports'
  }
]

const items = computed(() => {
  const role =
    String(authStore.normalizedRole || '')
      .toUpperCase()

  return baseItems.filter((item) => {
    if (item.id !== 'reports') {
      return true
    }

    return role === 'ADMIN' || role === 'TREASURER'
  })
})

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

const toggleMobile = () => {
  mobileOpen.value = !mobileOpen.value
}

const closeMobile = () => {
  mobileOpen.value = false
}

const isActive = (item) => {
  return route.name === item.routeName
}

const navigate = (item) => {
  if (isMobile.value) {
    closeMobile()
  }
  router.push({
    name: item.routeName
  })
}

const logout = () => {
  authStore.clearSession()
  router.push({
    name: 'Landing'
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
    'supervisor-sidebar',
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
      'supervisor-sidebar'
    )

  if (props.forceOpen) {
    collapsed.value = false
  } else if (saved !== null) {
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

<style scoped src="../styles/components/MarketSupervisorMenu.css"></style>
