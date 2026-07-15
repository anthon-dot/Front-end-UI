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

const router = useRouter()
const route = useRoute()

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
  localStorage.removeItem('token')
  localStorage.removeItem('authToken')
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

<style scoped>
.sidebar {
  --primary: #2563eb;
  --primary-light: #eff6ff;
  --text: #101828;
  --muted: #667085;
  --border: rgba(148, 163, 184, 0.22);
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--sidebar-width);
  transition: width 0.3s ease;
  z-index: 1000;
}

.sidebar.collapsed {
  width: 90px;
}

.sidebar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(22px);
  border-right: 1px solid var(--border);
  box-shadow:
    0 24px 70px rgba(15, 23, 42, 0.10);
}

/* Header */

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 1.2rem;
  min-height: 82px;
  border-bottom: 1px solid var(--border);
}

.toggle-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.9);
  color: var(--muted);
  cursor: pointer;
  transition: 0.25s ease;
  font-size: 1.1rem;
}

.toggle-btn:hover {
  background: var(--primary-light);
  color: var(--primary);
  transform: translateY(-1px);
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
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 800;
  color: white;
  background: linear-gradient(
    135deg,
    #2563eb,
    #0f766e
  );
  box-shadow:
    0 12px 24px rgba(37, 99, 235, 0.26);
}

.brand-text h1 {
  margin: 0;
  font-size: 1rem;
  color: var(--text);
  font-weight: 800;
}

.brand-text p {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: var(--muted);
}

/* Navigation */

.nav-menu {
  flex: 1;
  padding: 1rem 0.8rem;
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
  border-radius: 14px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.25s ease;
}

.nav-item.collapsed {
  justify-content: center;
}

.nav-item:hover {
  background: rgba(37, 99, 235, 0.08);
  color: var(--primary);
  transform: translateX(3px);
}

.nav-item.active {
  background: linear-gradient(135deg, #2563eb, #0f766e);
  color: white;
  font-weight: 700;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-label {
  font-size: 0.95rem;
  white-space: nowrap;
}

.active-indicator {
  position: absolute;
  right: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.9;
}

/* Footer */

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: none;
  border-radius: 14px;
  background: #fff1f2;
  color: #e11d48;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 600;
}

.logout-btn.collapsed {
  justify-content: center;
}

.logout-btn:hover {
  background: #ffe4e6;
  transform: translateY(-1px);
}

/* Animations */

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* Scrollbar */

.nav-menu::-webkit-scrollbar {
  width: 5px;
}

.nav-menu::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 20px;
}

/* Mobile */

@media (max-width: 768px) {
  .sidebar {
    z-index: 2000;
  }
}
</style>
