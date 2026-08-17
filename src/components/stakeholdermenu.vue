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

<style scoped>
:root {
  --sidebar-width: 280px;

  --primary: #4f46e5;
  --primary-light: #eef2ff;

  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;

  width: var(--sidebar-width);

  transition:
    width .3s ease;

  z-index: 1000;
}

.sidebar.collapsed {
  width: 90px;
}

.sidebar-container {
  height: 100%;

  display: flex;
  flex-direction: column;

  background:
    rgba(255,255,255,.92);

  backdrop-filter:
    blur(18px);

  border-right:
    1px solid var(--border);

  box-shadow:
    0 10px 40px rgba(15,23,42,.06);
}

/* HEADER */

.sidebar-header {
  display: flex;
  align-items: center;

  padding: 1.2rem;

  min-height: 82px;

  border-bottom:
    1px solid var(--border);
}

.toggle-btn {
  width: 44px;
  height: 44px;

  border: none;
  border-radius: 14px;

  background: #f8fafc;

  color: var(--muted);

  cursor: pointer;

  transition: .25s ease;

  font-size: 1.1rem;
}

.toggle-btn:hover {
  background:
    var(--primary-light);

  color:
    var(--primary);

  transform:
    translateY(-1px);
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

  border-radius: 16px;

  display: grid;
  place-items: center;

  font-weight: 800;

  color: white;

  background:
    linear-gradient(
      135deg,
      #6366f1,
      #4338ca
    );

  box-shadow:
    0 10px 20px rgba(79,70,229,.3);
}

.brand-text h1 {
  margin: 0;

  font-size: 1rem;

  color: var(--text);

  font-weight: 800;
}

.brand-text p {
  margin: 2px 0 0;

  font-size: .78rem;

  color: var(--muted);
}

/* NAVIGATION */

.nav-menu {
  flex: 1;

  padding: 1rem .8rem;

  overflow-y: auto;
}

.nav-item {
  width: 100%;

  position: relative;

  display: flex;
  align-items: center;
  gap: 14px;

  padding: 14px 16px;
  margin-bottom: 8px;

  border: none;
  border-radius: 18px;

  background: transparent;

  color: var(--muted);

  cursor: pointer;

  transition: all .25s ease;
}

.nav-item.collapsed {
  justify-content: center;
}

.nav-item:hover {
  background: #f8fafc;

  color: var(--primary);

  transform: translateX(2px);
}

.nav-item.active {
  background:
    var(--primary-light);

  color: var(--primary);

  font-weight: 700;

  box-shadow:
    0 10px 24px rgba(79,70,229,.12);
}

.nav-icon {
  font-size: 1.1rem;

  min-width: 22px;

  text-align: center;
}

.nav-label {
  font-size: .95rem;
  white-space: nowrap;
}

.active-indicator {
  position: absolute;

  right: 12px;

  width: 8px;
  height: 8px;

  border-radius: 999px;

  background: var(--primary);
}

/* FOOTER */

.sidebar-footer {
  padding: 1rem;

  border-top:
    1px solid var(--border);
}

.logout-btn {
  width: 100%;

  display: flex;
  align-items: center;
  gap: 14px;

  padding: 14px 16px;

  border: none;
  border-radius: 18px;

  background: #fff1f2;

  color: #e11d48;

  cursor: pointer;

  transition: all .25s ease;

  font-weight: 600;
}

.logout-btn.collapsed {
  justify-content: center;
}

.logout-btn:hover {
  background: #ffe4e6;

  transform: translateY(-1px);
}

/* ANIMATIONS */

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all .25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* SCROLLBAR */

.nav-menu::-webkit-scrollbar {
  width: 5px;
}

.nav-menu::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 20px;
}

/* MOBILE */

@media (max-width: 768px) {

  .sidebar {
    z-index: 2000;
  }

}
</style>
