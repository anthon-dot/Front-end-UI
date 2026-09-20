<template>
  <aside
    class="sidebar"
    :class="{ collapsed }"
    aria-label="Market Supervisor Sidebar"
  >
    <div class="sidebar-container">

      <!-- HEADER -->
      <div class="sidebar-header">

        <button
          class="toggle-btn"
          @click="toggleSidebar"
          :aria-label="collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
        >
          <i
            :class="collapsed ? 'pi pi-bars' : 'pi pi-angle-left'"
          />
        </button>

        <Transition name="fade-slide">
          <div
            v-if="!collapsed"
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
            collapsed
          }"
          @click="navigate(item)"
        >

          <span class="nav-icon">
            {{ item.icon }}
          </span>

          <Transition name="fade-slide">
            <span
              v-if="!collapsed"
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
          :class="{ collapsed }"
          @click="logout"
        >

          <span class="nav-icon">
            🚪
          </span>

          <Transition name="fade-slide">
            <span v-if="!collapsed">
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

const baseItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    routeName: 'MarketSupervisor'
  },

  {
    id: 'contracts',
    label: 'Contracts',
    icon: '📑',
    routeName: 'MSContracts'
  },

  {
    id: 'stalls',
    label: 'Stall Management',
    icon: '🏪',
    routeName: 'MSStalls'
  },

  {
    id: 'archive',
    label: 'Archive Record',
    icon: '🗂️',
    routeName: 'MSArchive'
  },

  {
    id: 'reports',
    label: 'Reports',
    icon: 'R',
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

const isActive = (item) => {
  return route.name === item.routeName
}

const navigate = (item) => {
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

watch(collapsed, (value) => {

  localStorage.setItem(
    'supervisor-sidebar',
    value
  )

  document.documentElement.style.setProperty(
    '--sidebar-width',
    value ? '90px' : '280px'
  )

})

onMounted(() => {

  const saved =
    localStorage.getItem(
      'supervisor-sidebar'
    )

  if (props.forceOpen) {
    collapsed.value = false
  }

  else if (saved !== null) {
    collapsed.value =
      saved === 'true'
  }

  document.documentElement.style.setProperty(
    '--sidebar-width',
    collapsed.value
      ? '90px'
      : '280px'
  )

})
</script>

<style scoped src="../styles/components/MarketSupervisorMenu.css"></style>
