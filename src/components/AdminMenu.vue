<template>
  <!-- Mobile Topbar -->
  <header class="mobile-topbar" aria-label="Admin Mobile Navigation Bar">
    <button
      type="button"
      class="mobile-menu-btn"
      @click="toggleMobile"
      :aria-label="mobileOpen ? 'Close Menu' : 'Open Menu'"
    >
      <i :class="mobileOpen ? 'pi pi-times' : 'pi pi-bars'" />
    </button>
    <div class="mobile-brand">
      <div class="brand-logo-sm">AD</div>
      <span class="mobile-brand-title">Admin Panel</span>
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
    aria-label="Admin Sidebar"
  >
    <div class="sidebar-container">
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
            <div v-if="(isMobile || !collapsed) && section.label" class="section-label">
              {{ section.label }}
            </div>
          </Transition>

          <button
            v-for="item in section.items"
            :key="item.routeName"
            class="nav-item"
            :class="{ active: isActive(item), collapsed: !isMobile && collapsed }"
            @click="navigate(item)"
          >
            <i :class="item.icon" class="nav-icon" />
            <Transition name="fade-slide">
              <span v-if="isMobile || !collapsed" class="nav-label">{{ item.label }}</span>
            </Transition>
            <div v-if="isActive(item)" class="active-indicator" />
          </button>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" :class="{ collapsed: !isMobile && collapsed }" @click="logout">
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
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const collapsed = ref(false)
const mobileOpen = ref(false)
const isMobile = ref(false)

const sections = [
  {
    label: 'CORE ADMINISTRATION',
    items: [
      { label: 'User Management', icon: 'pi pi-users', routeName: 'AdminUsers' },
      { label: 'Rate Configuration', icon: 'pi pi-money-bill', routeName: 'AdminRentalRates' },
      { label: 'System Settings', icon: 'pi pi-cog', routeName: 'AdminSettings' },
      { label: 'Audit Logs', icon: 'pi pi-book', routeName: 'AdminAuditLogs' },
      { label: 'Database Maintenance', icon: 'pi pi-database', routeName: 'AdminLoginHistory' }
    ]
  },
  {
    label: 'MARKET REGISTRY',
    items: [
      { label: 'Stall Inventory & Map', icon: 'pi pi-map-marker', routeName: 'MSStalls' },
      { label: 'Stall Categories', icon: 'pi pi-tags', routeName: 'AdminStallTypes' },
      { label: 'Contracts & Leases', icon: 'pi pi-file-edit', routeName: 'MSContracts' },
      { label: 'Archive Records', icon: 'pi pi-inbox', routeName: 'MSArchive' }
    ]
  },
  {
    label: 'FINANCIAL AUDIT',
    items: [
      { label: 'Collections Summary', icon: 'pi pi-wallet', routeName: 'AdminCollectionReport' },
      { label: 'Occupancy Analytics', icon: 'pi pi-chart-pie', routeName: 'AdminOccupancy' }
    ]
  }
]

function isActive(item) {
  return route.name === item.routeName
}

function navigate(item) {
  if (isMobile.value) {
    closeMobile()
  }
  router.push({ name: item.routeName })
}

function toggleSidebar() {
  collapsed.value = !collapsed.value
}

function toggleMobile() {
  mobileOpen.value = !mobileOpen.value
}

function closeMobile() {
  mobileOpen.value = false
}

function logout() {
  authStore.clearSession()
  router.push({ name: 'Landing' })
}

function checkScreenSize() {
  isMobile.value = window.innerWidth < 1024
  updateSidebarWidth()
}

function updateSidebarWidth() {
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
  localStorage.setItem('admin-sidebar-collapsed', value)
  updateSidebarWidth()
})

watch(route, () => {
  if (isMobile.value) {
    closeMobile()
  }
})

onMounted(() => {
  const saved = localStorage.getItem('admin-sidebar-collapsed')
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

<style scoped src="../styles/components/AdminMenu.css"></style>
