<template>
  <div class="notify-shell">
    <TreasurerMenu />

    <main class="notify-page">
      <section class="hero">
        <div>
          <h1>AI Notifications</h1>
          <p>AI-generated market intelligence and smart administrative alerts</p>
        </div>
        <div class="hero-actions">
          <label class="search-box">
            <i class="pi pi-search"></i>
            <input v-model="search" type="search" placeholder="Search notifications..." />
          </label>
          <select v-model="filter">
            <option>All Notifications</option>
            <option>High Priority</option>
            <option>Medium Priority</option>
            <option>Low Priority</option>
            <option>Unread</option>
            <option>Read</option>
          </select>
          <button class="ghost-btn" :disabled="loading" @click="loadNotifications">
            <i class="pi pi-refresh"></i>
            Refresh
          </button>
          <button class="primary-btn" :disabled="generating" @click="generateNotifications">
            <i class="pi pi-sparkles"></i>
            {{ generating ? 'Generating' : 'Generate Notification' }}
          </button>
        </div>
      </section>

      <p v-if="error" class="error-box">{{ error }}</p>

      <section class="stats-grid">
        <article v-for="stat in stats" :key="stat.label" class="stat-card">
          <span :class="stat.tone"><i :class="stat.icon"></i></span>
          <div>
            <small>{{ stat.label }}</small>
            <strong>{{ stat.value }}</strong>
          </div>
        </article>
      </section>

      <section class="notification-list">
        <article
          v-for="notification in filteredNotifications"
          :key="notification.id"
          class="notification-card"
          :class="{ expanded: expandedId === notification.id, unread: !notification.isRead }"
        >
          <div class="collapsed-row">
            <div class="ai-badge">AI</div>
            <div class="type-icon" :class="priorityClass(notification.priority)">
              <i :class="iconFor(notification.notificationType)"></i>
            </div>

            <div class="main-copy">
              <div class="title-line">
                <h2>{{ notification.title }}</h2>
                <span v-if="!notification.isRead" class="dot"></span>
              </div>
              <p>{{ notification.message }}</p>
              <em><i class="pi pi-sparkles"></i>{{ notification.recommendation || 'Review the related market record.' }}</em>
              <time><i class="pi pi-clock"></i>{{ dateTime(notification.createdAt) }}</time>
            </div>

            <div class="side-actions">
              <span class="priority" :class="priorityClass(notification.priority)">
                {{ titleCase(notification.priority) }} Priority
              </span>
              <span class="read-state" :class="{ read: notification.isRead }">
                {{ notification.isRead ? 'Read' : 'Unread' }}
              </span>
              <button @click="toggle(notification.id)">
                <i class="pi pi-eye"></i>
                View Details
              </button>
              <button v-if="!notification.isRead" @click="markRead(notification.id)">
                <i class="pi pi-check"></i>
                Mark as Read
              </button>
            </div>
          </div>

          <transition name="expand">
            <div v-if="expandedId === notification.id" class="expanded-panel">
              <article>
                <h3>AI Explanation</h3>
                <p>{{ notification.explanation || notification.message }}</p>
              </article>
              <article>
                <h3>Suggested Actions</h3>
                <ul>
                  <li v-for="action in notification.suggestedActions" :key="action">{{ action }}</li>
                </ul>
              </article>
              <article>
                <h3>Related Data</h3>
                <dl>
                  <div><dt>Business</dt><dd>{{ notification.businessName || 'System-wide alert' }}</dd></div>
                  <div><dt>Stakeholder</dt><dd>{{ notification.stakeholderName || 'Multiple records' }}</dd></div>
                  <div><dt>Category</dt><dd>{{ notification.businessType || notification.notificationType }}</dd></div>
                  <div><dt>Record</dt><dd>{{ notification.relatedRecordType }} #{{ notification.relatedRecordId }}</dd></div>
                </dl>
              </article>
              <div class="expanded-actions">
                <button class="ghost-btn" @click="openRelated(notification)">
                  <i class="pi pi-external-link"></i>
                  Open Related Record
                </button>
                <button class="primary-btn" @click="goReports">
                  <i class="pi pi-chart-line"></i>
                  Generate Report
                </button>
              </div>
            </div>
          </transition>
        </article>

        <article v-if="!loading && filteredNotifications.length === 0" class="empty-state">
          <i class="pi pi-sparkles"></i>
          <h2>No AI notifications found</h2>
          <p>Generate notifications to analyze overdue billing, contracts, occupancy, tenant risk, and vacant stalls from live database records.</p>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import TreasurerMenu from '../components/TreasurerMenu.vue'
import {
  generateAINotifications,
  getAINotifications,
  markAINotificationAsRead
} from '../services/aiNotificationService'

const router = useRouter()
const notifications = ref([])
const loading = ref(false)
const generating = ref(false)
const error = ref('')
const search = ref('')
const filter = ref('All Notifications')
const expandedId = ref(null)

const stats = computed(() => {
  const today = new Date().toDateString()
  return [
    { label: 'Total Notifications', value: notifications.value.length, icon: 'pi pi-file-edit', tone: 'purple' },
    { label: 'High Priority Alerts', value: notifications.value.filter((item) => item.priority === 'HIGH').length, icon: 'pi pi-exclamation-triangle', tone: 'rose' },
    { label: 'Unread Notifications', value: notifications.value.filter((item) => !item.isRead).length, icon: 'pi pi-envelope', tone: 'blue' },
    { label: "Today's Generated Alerts", value: notifications.value.filter((item) => new Date(item.createdAt).toDateString() === today).length, icon: 'pi pi-calendar', tone: 'cyan' }
  ]
})

const filteredNotifications = computed(() => {
  const term = search.value.trim().toLowerCase()
  return notifications.value.filter((item) => {
    const matchesSearch = !term || `${item.title} ${item.message} ${item.recommendation} ${item.businessName}`.toLowerCase().includes(term)
    const matchesFilter =
      filter.value === 'All Notifications' ||
      (filter.value === 'High Priority' && item.priority === 'HIGH') ||
      (filter.value === 'Medium Priority' && item.priority === 'MEDIUM') ||
      (filter.value === 'Low Priority' && item.priority === 'LOW') ||
      (filter.value === 'Unread' && !item.isRead) ||
      (filter.value === 'Read' && item.isRead)
    return matchesSearch && matchesFilter
  })
})

function priorityClass(priority) {
  return String(priority || 'LOW').toLowerCase()
}

function iconFor(type) {
  const map = {
    OVERDUE_PAYMENT: 'pi pi-receipt',
    CONTRACT_EXPIRATION: 'pi pi-file',
    LOW_OCCUPANCY: 'pi pi-chart-pie',
    HIGH_RISK_TENANT: 'pi pi-exclamation-circle',
    VACANT_STALL: 'pi pi-shop'
  }
  return map[type] || 'pi pi-bell'
}

function titleCase(value) {
  return String(value || 'Low').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase())
}

function dateTime(value) {
  if (!value) return 'No timestamp'
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value))
}

function toggle(id) {
  expandedId.value = expandedId.value === id ? null : id
}

async function loadNotifications() {
  loading.value = true
  error.value = ''
  try {
    const response = await getAINotifications()
    const items = Array.isArray(response.data) ? response.data : []
    notifications.value = newestFirst(items)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function generateNotifications() {
  generating.value = true
  error.value = ''
  try {
    const response = await generateAINotifications()
    notifications.value = newestFirst(Array.isArray(response.data) ? response.data : [])
  } catch (err) {
    error.value = err.message
  } finally {
    generating.value = false
  }
}

async function markRead(id) {
  await markAINotificationAsRead(id)
  await loadNotifications()
}

function newestFirst(items) {
  return [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}

function openRelated(notification) {
  if (notification.relatedRecordType === 'BILLING') router.push({ name: 'Billing' })
  else if (notification.relatedRecordType === 'CONTRACT') router.push({ name: 'MSContracts' })
  else router.push({ name: 'AIReports' })
}

function goReports() {
  router.push({ name: 'AIReports' })
}

onMounted(async () => {
  await generateNotifications()
})
</script>

<style scoped>
.notify-shell { min-height: 100vh; background: radial-gradient(circle at 78% 0%, rgba(55, 91, 255, .24), transparent 30%), #081225; color: #f8fbff; }
.notify-page { padding: 28px; padding-left: calc(var(--sidebar-width, 280px) + 28px); }
.hero { min-height: 220px; padding: 34px; display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; border: 1px solid rgba(148, 163, 184, .28); border-radius: 8px; background: linear-gradient(135deg, rgba(91, 33, 182, .48), rgba(12, 27, 58, .82)); box-shadow: 0 24px 70px rgba(0,0,0,.28); }
.hero h1 { margin: 0; font-size: clamp(2rem, 4vw, 3.2rem); letter-spacing: 0; }
.hero p { margin: 10px 0 0; color: #cbd5e1; font-size: 1.05rem; }
.hero-actions { display: grid; grid-template-columns: minmax(220px, 1fr) 190px auto auto; gap: 10px; width: min(860px, 100%); }
.search-box, .hero-actions select { height: 48px; border: 1px solid rgba(203,213,225,.22); border-radius: 8px; background: rgba(8,18,37,.72); color: #e5edff; }
.search-box { display: flex; align-items: center; gap: 10px; padding: 0 14px; }
.search-box input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: inherit; }
.hero-actions select { padding: 0 12px; }
.primary-btn, .ghost-btn, .side-actions button { min-height: 48px; border-radius: 8px; border: 0; cursor: pointer; display: inline-flex; justify-content: center; align-items: center; gap: 8px; font-weight: 900; transition: .2s ease; }
.primary-btn { color: white; background: linear-gradient(135deg, #7c3aed, #3b82f6); }
.ghost-btn, .side-actions button { color: #e5edff; background: rgba(255,255,255,.08); border: 1px solid rgba(203,213,225,.2); }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: -58px 26px 26px; position: relative; z-index: 2; }
.stat-card { min-height: 118px; display: flex; align-items: center; gap: 16px; padding: 22px; border: 1px solid rgba(203,213,225,.22); border-radius: 8px; background: rgba(15, 23, 42, .82); box-shadow: 0 18px 45px rgba(0,0,0,.22); }
.stat-card span { width: 54px; height: 54px; border-radius: 8px; display: grid; place-items: center; font-size: 1.35rem; }
.stat-card span.purple { background: rgba(124,58,237,.22); color: #c4b5fd; } .stat-card span.rose { background: rgba(225,29,72,.22); color: #fda4af; } .stat-card span.blue { background: rgba(59,130,246,.22); color: #bfdbfe; } .stat-card span.cyan { background: rgba(6,182,212,.22); color: #67e8f9; }
.stat-card small { display: block; color: #cbd5e1; }
.stat-card strong { display: block; margin-top: 6px; font-size: 2rem; }
.notification-list { display: grid; gap: 12px; }
.notification-card { border: 1px solid rgba(148,163,184,.24); border-radius: 8px; background: rgba(15, 23, 42, .78); box-shadow: 0 20px 50px rgba(0,0,0,.2); overflow: hidden; transition: .2s ease; }
.notification-card.unread { border-color: rgba(124,58,237,.55); }
.collapsed-row { display: grid; grid-template-columns: 86px 62px minmax(0, 1fr) 230px; gap: 20px; align-items: center; padding: 22px; }
.ai-badge { width: 70px; height: 70px; border-radius: 50%; display: grid; place-items: center; color: white; font-size: 1.35rem; font-weight: 1000; background: radial-gradient(circle, #7c3aed, #312e81); box-shadow: 0 0 28px rgba(124,58,237,.75); }
.type-icon { width: 58px; height: 58px; border-radius: 50%; display: grid; place-items: center; font-size: 1.25rem; border: 1px solid currentColor; }
.type-icon.high, .priority.high { color: #fb7185; background: rgba(225,29,72,.15); } .type-icon.medium, .priority.medium { color: #fbbf24; background: rgba(245,158,11,.15); } .type-icon.low, .priority.low { color: #60a5fa; background: rgba(59,130,246,.15); }
.main-copy { min-width: 0; }
.title-line { display: flex; align-items: center; gap: 10px; }
.title-line h2 { margin: 0; font-size: 1.2rem; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #fb7185; }
.main-copy p { margin: 8px 0; color: #e2e8f0; line-height: 1.45; }
.main-copy em, .main-copy time { display: block; color: #a78bfa; font-style: normal; margin-top: 8px; }
.main-copy time { color: #94a3b8; font-size: .9rem; }
.side-actions { display: grid; gap: 10px; }
.priority, .read-state { justify-self: start; padding: 7px 12px; border-radius: 999px; font-weight: 900; font-size: .82rem; }
.read-state { color: #c4b5fd; }
.read-state.read { color: #86efac; }
.expanded-panel { display: grid; grid-template-columns: 1fr 1fr 300px; gap: 18px; margin: 0 18px 18px; padding: 18px; border-radius: 8px; background: rgba(15, 35, 70, .72); border: 1px solid rgba(148,163,184,.22); }
.expanded-panel h3 { margin: 0 0 10px; }
.expanded-panel p, .expanded-panel li, .expanded-panel dd { color: #cbd5e1; line-height: 1.55; }
.expanded-panel ul { margin: 0; padding-left: 18px; }
.expanded-panel dl { margin: 0; display: grid; gap: 8px; }
.expanded-panel dl div { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid rgba(148,163,184,.16); padding-bottom: 8px; }
.expanded-panel dt { color: #94a3b8; }
.expanded-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 10px; }
.empty-state { text-align: center; padding: 54px 20px; border: 1px dashed rgba(148,163,184,.34); border-radius: 8px; color: #cbd5e1; }
.empty-state i { font-size: 2rem; color: #a78bfa; }
.error-box { padding: 14px 16px; border-radius: 8px; background: #fff1f2; color: #be123c; font-weight: 800; }
.expand-enter-active, .expand-leave-active { transition: all .2s ease; }
.expand-enter-from, .expand-leave-to { opacity: 0; transform: translateY(-8px); }
@media (max-width: 1200px) { .hero { flex-direction: column; } .hero-actions { grid-template-columns: 1fr 1fr; } .stats-grid { grid-template-columns: repeat(2, 1fr); } .collapsed-row { grid-template-columns: 70px minmax(0, 1fr); } .type-icon { display: none; } .side-actions { grid-column: 1 / -1; grid-template-columns: repeat(2, 1fr); } .expanded-panel { grid-template-columns: 1fr; } }
@media (max-width: 760px) { .notify-page { padding-left: 18px; padding-right: 18px; } .hero { padding: 22px; } .hero-actions, .stats-grid, .side-actions { grid-template-columns: 1fr; } .stats-grid { margin: 14px 0 20px; } .collapsed-row { grid-template-columns: 1fr; } .ai-badge { width: 58px; height: 58px; } }
</style>
