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

<style scoped src="./AINotifications.css"></style>
