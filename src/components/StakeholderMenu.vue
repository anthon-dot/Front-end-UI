<template>
  <aside
    class="sidebar"
    :class="{ collapsed }"
    aria-label="Stakeholder Sidebar"
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
            collapsed
          }"
          @click="navigate(item)"
        >

          <i
            :class="item.icon"
            class="nav-icon"
          />

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

          <i class="pi pi-sign-out nav-icon" />

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
  watch,
  onMounted
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

const navigate = (item) => {
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

watch(collapsed, (value) => {

  localStorage.setItem(
    'stakeholder-sidebar',
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
      'stakeholder-sidebar'
    )

  if (saved !== null) {
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

<style scoped src="../styles/components/StakeholderMenu.css"></style>
