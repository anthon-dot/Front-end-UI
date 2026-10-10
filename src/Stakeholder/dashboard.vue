<template>
  <div class="stakeholder-layout">
    <StakeholderMenu />

    <main class="stakeholder-dashboard">
      <!-- TOPBAR -->
      <div class="dash-topbar">
        <div class="search-box">
          <i class="pi pi-search search-icon" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Search vendors, stalls, leases..."
            class="search-input"
            aria-label="Search vendors, stalls, leases"
          />
          <kbd class="search-kbd">⌘ K</kbd>
        </div>

        <div class="topbar-actions">
          <button
            class="notif-btn"
            @click="toggleNotifications"
            title="Notifications"
            aria-label="Notifications"
          >
            <i class="pi pi-bell" />
            <span v-if="unreadCount > 0" class="notif-dot" />
          </button>

          <button
            class="btn-new-contract"
            @click="openNewContractModal"
            aria-label="New contract"
          >
            New contract
            <span class="plus-icon">+</span>
          </button>
        </div>
      </div>

      <!-- WELCOME BANNER -->
      <section class="dash-welcome">
        <div class="welcome-info">
          <span class="date-label">{{ currentDateFormatted }}</span>
          <h1 class="welcome-title">Good morning, {{ displayName }}.</h1>
          <p class="welcome-sub">Here's what's happening across Marlowe Central today.</p>
        </div>

        <div class="period-toggle" role="tablist" aria-label="Time period selection">
          <button
            class="period-btn"
            :class="{ active: selectedPeriod === 'month' }"
            @click="selectedPeriod = 'month'"
            role="tab"
            :aria-selected="selectedPeriod === 'month'"
          >
            This month
          </button>
          <button
            class="period-btn"
            :class="{ active: selectedPeriod === 'quarter' }"
            @click="selectedPeriod = 'quarter'"
            role="tab"
            :aria-selected="selectedPeriod === 'quarter'"
          >
            Quarter
          </button>
          <button
            class="period-btn"
            :class="{ active: selectedPeriod === 'year' }"
            @click="selectedPeriod = 'year'"
            role="tab"
            :aria-selected="selectedPeriod === 'year'"
          >
            Year
          </button>
        </div>
      </section>

      <!-- 4 METRIC CARDS -->
      <section class="metrics-grid">
        <!-- 1. Monthly revenue (Dark Green Card) -->
        <div class="metric-card card-revenue">
          <div class="card-top">
            <span class="card-label">Monthly revenue</span>
            <div class="card-icon-wrap">
              <i class="pi pi-chart-bar" />
            </div>
          </div>
          <div>
            <div class="card-value">{{ currentMetrics.revenue }}</div>
            <div class="card-trend">
              <span class="trend-val">↗ {{ currentMetrics.revenueTrend }}</span> from last {{ selectedPeriod }}
            </div>
          </div>
          <!-- Wavy SVG sparkline along the bottom -->
          <svg class="revenue-sparkline" viewBox="0 0 320 54" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M0,45 C45,43 75,32 110,38 C145,44 175,26 215,34 C255,42 285,18 320,24"
              fill="none"
              stroke="#e2d89b"
              stroke-width="2.6"
              stroke-linecap="round"
            />
          </svg>
        </div>

        <!-- 2. Occupancy (White Card) -->
        <div class="metric-card card-occupancy">
          <div class="card-top">
            <span class="card-label">Occupancy</span>
            <div class="card-icon-wrap">
              <i class="pi pi-shop" />
            </div>
          </div>
          <div>
            <div class="card-value">{{ currentMetrics.occupancy }}</div>
            <div class="card-trend">
              <span class="trend-val">↗ {{ currentMetrics.occupancyTrend }}</span>
              <span>{{ currentMetrics.stallsInfo }}</span>
            </div>
            <div class="card-progress-track">
              <div
                class="card-progress-fill fill-occupancy"
                :style="{ width: currentMetrics.occupancyWidth }"
              />
            </div>
          </div>
        </div>

        <!-- 3. Active vendors (White Card) -->
        <div class="metric-card card-vendors">
          <div class="card-top">
            <span class="card-label">Active vendors</span>
            <div class="card-icon-wrap">
              <i class="pi pi-users" />
            </div>
          </div>
          <div>
            <div class="card-value">{{ currentMetrics.activeVendors }}</div>
            <div class="card-trend">
              <span class="trend-val">+{{ currentMetrics.vendorsTrend }}</span> this {{ selectedPeriod }}
            </div>
            <div class="vendor-avatars">
              <span
                v-for="badge in vendorBadges"
                :key="badge.text"
                class="avatar-badge"
                :style="{ backgroundColor: badge.bg, color: badge.color }"
              >
                {{ badge.text }}
              </span>
            </div>
          </div>
        </div>

        <!-- 4. Rent collected (White Card) -->
        <div class="metric-card card-rent">
          <div class="card-top">
            <span class="card-label">Rent collected</span>
            <div class="card-icon-wrap">
              <i class="pi pi-calendar" />
            </div>
          </div>
          <div>
            <div class="card-value">{{ currentMetrics.rentCollected }}</div>
            <div class="card-trend">
              <strong style="color: #b45309; font-weight: 700;">{{ currentMetrics.outstandingCount }} payments</strong>
              <span>still outstanding</span>
            </div>
            <div class="card-progress-track">
              <div
                class="card-progress-fill fill-rent"
                :style="{ width: currentMetrics.rentWidth }"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- LOWER SECTION: 2 COLUMNS -->
      <div class="dash-lower-grid">
        <!-- LEFT: Recent rent activity -->
        <section class="dash-panel rent-activity-card">
          <div class="panel-header">
            <div class="panel-title-group">
              <h2 class="panel-title">Recent rent activity</h2>
              <span class="panel-subtitle">October payment status</span>
            </div>
            <button class="view-all-btn" @click="openViewAllModal">
              View all
              <i class="pi pi-arrow-right" />
            </button>
          </div>

          <div class="rent-table-wrap">
            <table class="rent-table">
              <thead>
                <tr>
                  <th>VENDOR</th>
                  <th>STALL</th>
                  <th>RENT</th>
                  <th>STATUS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredRentActivity" :key="item.id">
                  <td>
                    <div class="vendor-cell">
                      <div
                        class="vendor-avatar"
                        :style="{ backgroundColor: item.avatarBg, color: item.avatarColor }"
                      >
                        {{ item.avatar }}
                      </div>
                      <span class="vendor-name">{{ item.vendor }}</span>
                    </div>
                  </td>
                  <td class="stall-cell">{{ item.stall }}</td>
                  <td class="rent-cell">{{ formatCurrency(item.rent) }}</td>
                  <td>
                    <span :class="['status-pill', item.statusClass]">
                      {{ item.status }}
                    </span>
                  </td>
                  <td style="position: relative; text-align: right;">
                    <button
                      class="row-action-btn"
                      @click="toggleRowMenu(item.id)"
                      :title="'Actions for ' + item.vendor"
                      aria-label="Row actions"
                    >
                      ···
                    </button>
                    <!-- Row Action Dropdown -->
                    <div v-if="activeMenuId === item.id" class="action-dropdown" @click.stop>
                      <button @click="viewVendorDetails(item)">
                        <i class="pi pi-eye" /> View details
                      </button>
                      <button @click="sendPaymentReminder(item)">
                        <i class="pi pi-send" /> Send reminder
                      </button>
                      <button @click="openContractByStall(item.stall)">
                        <i class="pi pi-file-pdf" /> View lease contract
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredRentActivity.length === 0">
                  <td colspan="5" style="text-align: center; color: #9ca3af; padding: 2rem;">
                    No rent records matching "{{ searchQuery }}".
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- RIGHT: Needs attention -->
        <section class="dash-panel needs-attention-card">
          <div class="panel-header">
            <div class="panel-title-group">
              <div class="panel-title-row">
                <h2 class="panel-title">Needs attention</h2>
                <span class="panel-badge">{{ attentionItems.length }}</span>
              </div>
              <span class="panel-subtitle">Priority tasks for today</span>
            </div>
          </div>

          <div class="attention-list">
            <div
              v-for="task in attentionItems"
              :key="task.id"
              class="attention-item"
              @click="handleAttentionClick(task)"
              role="button"
              tabindex="0"
            >
              <div class="attention-left">
                <div :class="['attention-icon-box', task.iconClass]">
                  <i :class="task.icon" />
                </div>
                <div class="attention-content">
                  <span class="attention-title">{{ task.title }}</span>
                  <span class="attention-sub">{{ task.sub }}</span>
                </div>
              </div>
              <i class="pi pi-chevron-right attention-chevron" />
            </div>
          </div>
        </section>
      </div>

      <!-- ONBOARDING & DOCUMENTS QUICK ACCESS -->
      <section class="portal-extra-bar">
        <div class="portal-extra-left">
          <i class="pi pi-folder-open" />
          <div>
            <div class="portal-extra-title">Stakeholder Application & Documents Hub</div>
            <div class="portal-extra-sub">
              Access your application verification progress, uploaded business permits, and profile settings.
            </div>
          </div>
        </div>
        <button class="btn-open-drawer" @click="showDocumentsModal = true">
          View Documents & Progress
        </button>
      </section>

      <!-- MODAL: NEW CONTRACT -->
      <div
        v-if="showNewContractModal"
        class="modal-backdrop"
        @click.self="showNewContractModal = false"
      >
        <div class="modal-content">
          <div class="modal-header">
            <h3>New Stall Lease Contract</h3>
            <button class="modal-close-btn" @click="showNewContractModal = false">✕</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitNewContract">
              <div class="form-group">
                <label>Vendor / Business Name</label>
                <input
                  v-model="newContractForm.vendor"
                  type="text"
                  placeholder="e.g. Green Valley Produce"
                  required
                />
              </div>
              <div class="form-group">
                <label>Assigned Stall</label>
                <input
                  v-model="newContractForm.stall"
                  type="text"
                  placeholder="e.g. A-15 or S-08"
                  required
                />
              </div>
              <div class="form-group">
                <label>Monthly Rent Amount ($)</label>
                <input
                  v-model.number="newContractForm.rent"
                  type="number"
                  placeholder="1200"
                  required
                />
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label>Start Date</label>
                  <input v-model="newContractForm.startDate" type="date" required />
                </div>
                <div class="form-group">
                  <label>End Date</label>
                  <input v-model="newContractForm.endDate" type="date" required />
                </div>
              </div>
              <div class="form-group">
                <label>Notes / Terms</label>
                <textarea
                  v-model="newContractForm.notes"
                  rows="2"
                  placeholder="Additional contract terms or conditions..."
                />
              </div>
              <div class="modal-actions">
                <button
                  type="button"
                  class="btn-modal-cancel"
                  @click="showNewContractModal = false"
                >
                  Cancel
                </button>
                <button type="submit" class="btn-modal-submit">Create Contract</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- MODAL: VIEW ALL RENT ACTIVITY -->
      <div
        v-if="showViewAllModal"
        class="modal-backdrop"
        @click.self="showViewAllModal = false"
      >
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h3>All Rent & Payment Activity</h3>
            <button class="modal-close-btn" @click="showViewAllModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div style="margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.88rem; color: #6b7280;">
                Showing <strong>{{ rentActivityList.length }}</strong> recorded transactions
              </span>
              <div style="display: flex; gap: 8px;">
                <button
                  class="btn-modal-cancel"
                  style="padding: 6px 12px; font-size: 0.8rem;"
                  @click="filterStatus = 'all'"
                >
                  All
                </button>
                <button
                  class="btn-modal-cancel"
                  style="padding: 6px 12px; font-size: 0.8rem;"
                  @click="filterStatus = 'Paid'"
                >
                  Paid
                </button>
                <button
                  class="btn-modal-cancel"
                  style="padding: 6px 12px; font-size: 0.8rem;"
                  @click="filterStatus = 'Overdue'"
                >
                  Overdue
                </button>
              </div>
            </div>
            <table class="rent-table">
              <thead>
                <tr>
                  <th>VENDOR</th>
                  <th>STALL</th>
                  <th>RENT</th>
                  <th>DUE DATE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in displayedAllRentList"
                  :key="item.id"
                >
                  <td>
                    <div class="vendor-cell">
                      <div
                        class="vendor-avatar"
                        :style="{ backgroundColor: item.avatarBg, color: item.avatarColor }"
                      >
                        {{ item.avatar }}
                      </div>
                      <span class="vendor-name">{{ item.vendor }}</span>
                    </div>
                  </td>
                  <td class="stall-cell">{{ item.stall }}</td>
                  <td class="rent-cell">{{ formatCurrency(item.rent) }}</td>
                  <td style="font-size: 0.82rem; color: #6b7280;">{{ item.dueDate || '2026-10-15' }}</td>
                  <td>
                    <span :class="['status-pill', item.statusClass]">
                      {{ item.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL: ATTENTION TASK DETAILS -->
      <div
        v-if="selectedAttentionTask"
        class="modal-backdrop"
        @click.self="selectedAttentionTask = null"
      >
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ selectedAttentionTask.title }}</h3>
            <button class="modal-close-btn" @click="selectedAttentionTask = null">✕</button>
          </div>
          <div class="modal-body">
            <p style="color: #6b7280; font-size: 0.88rem; margin-bottom: 16px;">
              {{ selectedAttentionTask.description }}
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div
                v-for="(detail, i) in selectedAttentionTask.items"
                :key="i"
                style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 10px; padding: 12px; display: flex; justify-content: space-between; align-items: center;"
              >
                <div>
                  <div style="font-weight: 700; color: #111827; font-size: 0.9rem;">
                    {{ detail.name }}
                  </div>
                  <div style="font-size: 0.8rem; color: #6b7280;">
                    {{ detail.info }}
                  </div>
                </div>
                <button
                  class="btn-modal-submit"
                  style="padding: 6px 12px; font-size: 0.8rem;"
                  @click="handleAttentionAction(detail)"
                >
                  {{ detail.actionLabel }}
                </button>
              </div>
            </div>
            <div class="modal-actions" style="margin-top: 20px;">
              <button class="btn-modal-cancel" @click="selectedAttentionTask = null">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL: NOTIFICATIONS -->
      <div
        v-if="showNotificationsModal"
        class="modal-backdrop"
        @click.self="showNotificationsModal = false"
      >
        <div class="modal-content">
          <div class="modal-header">
            <h3>Notifications</h3>
            <button class="modal-close-btn" @click="showNotificationsModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
              <button
                class="btn-modal-cancel"
                style="padding: 4px 8px; font-size: 0.78rem;"
                @click="markAllNotificationsRead"
              >
                Mark all as read
              </button>
            </div>
            <div v-if="notificationsList.length === 0" style="text-align: center; color: #9ca3af; padding: 2rem;">
              No notifications at this time.
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div
                v-for="n in notificationsList"
                :key="n.id"
                style="padding: 12px; border-radius: 10px; background: #fafaf9; border-left: 3px solid #144733;"
              >
                <div style="font-size: 0.88rem; color: #111827;">{{ n.message }}</div>
                <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">{{ n.date }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL: DOCUMENTS & PROGRESS DRAWER -->
      <div
        v-if="showDocumentsModal"
        class="modal-backdrop"
        @click.self="showDocumentsModal = false"
      >
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h3>Stakeholder Application & Verification</h3>
            <button class="modal-close-btn" @click="showDocumentsModal = false">✕</button>
          </div>
          <div class="modal-body">
            <!-- Stakeholder Profile Summary -->
            <div style="background: #f9fafb; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h4 style="margin: 0; font-size: 1.1rem; color: #111827;">
                    {{ currentStakeholder?.name || 'Ana Garcia' }}
                  </h4>
                  <p style="margin: 4px 0 0; font-size: 0.85rem; color: #6b7280;">
                    Business: {{ currentStakeholder?.business || 'Garcia Organic Produce' }} | Contact: {{ currentStakeholder?.contact || '0917-882-9912' }}
                  </p>
                </div>
                <span class="status-pill status-paid">Active Stakeholder</span>
              </div>
            </div>

            <!-- Documents & Contracts List -->
            <h4 style="margin-bottom: 10px; font-size: 0.95rem;">Registered Contracts</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
              <div
                v-for="c in contracts"
                :key="c.id"
                style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;"
              >
                <div>
                  <strong style="color: #111827; font-size: 0.88rem;">{{ c.ref }}</strong>
                  <div style="font-size: 0.78rem; color: #6b7280;">
                    Period: {{ c.start }} — {{ c.end }}
                  </div>
                </div>
                <button
                  class="btn-modal-cancel"
                  style="padding: 6px 12px; font-size: 0.8rem;"
                  @click="openContract(c)"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL: CONTRACT VIEWER -->
      <div
        v-if="showContractModal"
        class="modal-backdrop"
        @click.self="showContractModal = false"
      >
        <div class="modal-content">
          <div class="modal-header">
            <h3>Contract Details</h3>
            <button class="modal-close-btn" @click="showContractModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div v-if="selectedContract" style="display: flex; flex-direction: column; gap: 12px;">
              <div>
                <span style="font-size: 0.8rem; color: #6b7280; display: block;">Reference</span>
                <strong style="font-size: 1rem; color: #111827;">{{ selectedContract.ref }}</strong>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <span style="font-size: 0.8rem; color: #6b7280; display: block;">Start Date</span>
                  <span style="font-weight: 600;">{{ selectedContract.start }}</span>
                </div>
                <div>
                  <span style="font-size: 0.8rem; color: #6b7280; display: block;">End Date</span>
                  <span style="font-weight: 600;">{{ selectedContract.end }}</span>
                </div>
              </div>
              <div style="margin-top: 14px; padding: 14px; background: #f9fafb; border-radius: 10px; text-align: center;">
                <i class="pi pi-file-pdf" style="font-size: 2rem; color: #144733; margin-bottom: 8px; display: inline-block;" />
                <div style="font-size: 0.88rem; color: #374151;">Lease Agreement Document</div>
                <button
                  class="btn-modal-submit"
                  style="margin-top: 10px; font-size: 0.82rem; padding: 6px 14px;"
                  @click="alert('Contract document downloaded successfully')"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import StakeholderMenu from '../components/StakeholderMenu.vue'
import sampleApplicants from '../data/applicants.js'
import sampleContracts from '../data/contracts.js'
import {
  getStakeholderNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from '../services/notificationService'

const route = useRoute()
const stakeholderId =
  route.query.id ||
  route.params.id ||
  localStorage.getItem('stakeholderId') ||
  null

// SEARCH & PERIOD FILTER
const searchQuery = ref('')
const searchInputRef = ref(null)
const selectedPeriod = ref('month')

// USER GREETING & DATE
const displayName = computed(() => {
  const current = currentStakeholder.value
  if (current?.name) {
    const first = current.name.split(' ')[0]
    return first || 'Ana'
  }
  return 'Ana'
})

const currentDateFormatted = computed(() => {
  // Format matching screenshot: TUESDAY, OCTOBER 22
  const now = new Date()
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`
})

// METRIC VALUES PER PERIOD
const currentMetrics = computed(() => {
  if (selectedPeriod.value === 'quarter') {
    return {
      revenue: '$254,180',
      revenueTrend: '11.2%',
      occupancy: '92.4%',
      occupancyTrend: '3.5%',
      stallsInfo: '78 of 84 stalls',
      occupancyWidth: '92.4%',
      activeVendors: '68',
      vendorsTrend: '6',
      rentCollected: '96.1%',
      outstandingCount: '3',
      rentWidth: '96.1%'
    }
  }
  if (selectedPeriod.value === 'year') {
    return {
      revenue: '$982,500',
      revenueTrend: '14.6%',
      occupancy: '93.0%',
      occupancyTrend: '4.2%',
      stallsInfo: '79 of 84 stalls',
      occupancyWidth: '93.0%',
      activeVendors: '68',
      vendorsTrend: '12',
      rentCollected: '97.8%',
      outstandingCount: '2',
      rentWidth: '97.8%'
    }
  }
  // Default: 'month' (exact numbers from design mockup)
  return {
    revenue: '$86,420',
    revenueTrend: '8.4%',
    occupancy: '91.7%',
    occupancyTrend: '2.1%',
    stallsInfo: '77 of 84 stalls',
    occupancyWidth: '91.7%',
    activeVendors: '68',
    vendorsTrend: '4',
    rentCollected: '94.2%',
    outstandingCount: '5',
    rentWidth: '94.2%'
  }
})

// VENDOR AVATAR STACK
const vendorBadges = [
  { text: 'GV', bg: '#d1fae5', color: '#065f46' },
  { text: 'BF', bg: '#fef3c7', color: '#92400e' },
  { text: 'CH', bg: '#e0f2fe', color: '#0369a1' },
  { text: '+65', bg: '#f1f5f9', color: '#64748b' }
]

// RECENT RENT ACTIVITY DATA (Matching Screenshot Rows)
const rentActivityList = ref([
  {
    id: 'act-1',
    vendor: 'Green Valley Produce',
    avatar: 'GV',
    avatarBg: '#d1fae5',
    avatarColor: '#065f46',
    stall: 'A-12',
    rent: 1280,
    status: 'Paid',
    statusClass: 'status-paid',
    dueDate: '2026-10-15',
    paymentMethod: 'Bank Transfer'
  },
  {
    id: 'act-2',
    vendor: 'Bread & Fold',
    avatar: 'BF',
    avatarBg: '#fef3c7',
    avatarColor: '#92400e',
    stall: 'B-04',
    rent: 1150,
    status: 'Due soon',
    statusClass: 'status-due',
    dueDate: '2026-10-25',
    paymentMethod: 'GCash'
  },
  {
    id: 'act-3',
    vendor: 'Coastal Harvest',
    avatar: 'CH',
    avatarBg: '#e0f2fe',
    avatarColor: '#0369a1',
    stall: 'C-18',
    rent: 980,
    status: 'Paid',
    statusClass: 'status-paid',
    dueDate: '2026-10-12',
    paymentMethod: 'Cash'
  },
  {
    id: 'act-4',
    vendor: 'Mora Family Flowers',
    avatar: 'MF',
    avatarBg: '#fee2e2',
    avatarColor: '#991b1b',
    stall: 'A-03',
    rent: 1320,
    status: 'Overdue',
    statusClass: 'status-overdue',
    dueDate: '2026-10-05',
    paymentMethod: 'Overdue'
  }
])

const filteredRentActivity = computed(() => {
  const query = (searchQuery.value || '').toLowerCase().trim()
  if (!query) return rentActivityList.value
  return rentActivityList.value.filter(item =>
    item.vendor.toLowerCase().includes(query) ||
    item.stall.toLowerCase().includes(query) ||
    item.status.toLowerCase().includes(query) ||
    String(item.rent).includes(query)
  )
})

// NEEDS ATTENTION LIST (Matching Screenshot Rows)
const attentionItems = ref([
  {
    id: 'task-1',
    type: 'overdue',
    title: '3 overdue payments',
    sub: 'More than 7 days past due',
    iconClass: 'icon-red',
    icon: 'pi pi-exclamation-circle',
    description: 'The following stall vendors have overdue rent balances exceeding 7 days:',
    items: [
      { name: 'Mora Family Flowers', info: 'Stall A-03 • $1,320 overdue (9 days)', actionLabel: 'Send Notice' },
      { name: 'Sunrise Bakery', info: 'Stall B-11 • $1,050 overdue (11 days)', actionLabel: 'Send Notice' },
      { name: 'Island Spices Co.', info: 'Stall C-02 • $890 overdue (8 days)', actionLabel: 'Send Notice' }
    ]
  },
  {
    id: 'task-2',
    type: 'expiring',
    title: '2 contracts expiring',
    sub: 'Within the next 30 days',
    iconClass: 'icon-green',
    icon: 'pi pi-file',
    description: 'Lease contracts expiring in the next 30 calendar days requiring renewal:',
    items: [
      { name: 'Green Valley Produce', info: 'Stall A-12 • Expires in 18 days (Nov 15)', actionLabel: 'Renew Lease' },
      { name: 'Artisan Pottery & Crafts', info: 'Stall D-05 • Expires in 27 days (Nov 24)', actionLabel: 'Renew Lease' }
    ]
  },
  {
    id: 'task-3',
    type: 'signature',
    title: '1 contract awaiting signature',
    sub: 'Sent yesterday',
    iconClass: 'icon-teal',
    icon: 'pi pi-user',
    description: 'Contract documents generated and sent to vendor, pending signature:',
    items: [
      { name: 'Luna Artisan Bakeshop', info: 'Stall B-14 • 12-month standard lease agreement', actionLabel: 'Review & Sign' }
    ]
  }
])

// MODALS AND INTERACTIONS
const showNewContractModal = ref(false)
const showViewAllModal = ref(false)
const showNotificationsModal = ref(false)
const showDocumentsModal = ref(false)
const showContractModal = ref(false)
const selectedContract = ref(null)
const selectedAttentionTask = ref(null)
const activeMenuId = ref(null)
const filterStatus = ref('all')

const newContractForm = ref({
  vendor: '',
  stall: '',
  rent: '',
  startDate: '',
  endDate: '',
  notes: ''
})

const displayedAllRentList = computed(() => {
  if (filterStatus.value === 'all') return rentActivityList.value
  return rentActivityList.value.filter(i => i.status.toLowerCase() === filterStatus.value.toLowerCase())
})

function openNewContractModal() {
  newContractForm.value = {
    vendor: '',
    stall: '',
    rent: '',
    startDate: '',
    endDate: '',
    notes: ''
  }
  showNewContractModal.value = true
}

function submitNewContract() {
  const form = newContractForm.value
  if (!form.vendor || !form.stall || !form.rent) return

  const initials = form.vendor
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const newRecord = {
    id: 'act-' + Date.now(),
    vendor: form.vendor,
    avatar: initials || 'VN',
    avatarBg: '#dcfce7',
    avatarColor: '#166534',
    stall: form.stall,
    rent: Number(form.rent),
    status: 'Paid',
    statusClass: 'status-paid',
    dueDate: form.endDate || '2026-11-30',
    paymentMethod: 'New Lease'
  }

  rentActivityList.value.unshift(newRecord)

  // Save to sample contracts if start & end provided
  contracts.value.unshift({
    id: 'C-' + Date.now(),
    ref: `CONTRACT-${form.stall}-${new Date().getFullYear()}`,
    start: form.startDate,
    end: form.endDate,
    contractUrl: ''
  })
  try {
    localStorage.setItem('contracts', JSON.stringify(contracts.value))
  } catch (e) {}

  addNotification(`New lease contract registered for ${form.vendor} (${form.stall}).`)
  showNewContractModal.value = false
  alert(`Contract for ${form.vendor} created successfully!`)
}

function openViewAllModal() {
  showViewAllModal.value = true
}

function toggleNotifications() {
  showNotificationsModal.value = !showNotificationsModal.value
}

function toggleRowMenu(id) {
  activeMenuId.value = activeMenuId.value === id ? null : id
}

function viewVendorDetails(item) {
  activeMenuId.value = null
  alert(`Vendor: ${item.vendor}\nStall: ${item.stall}\nRent: $${item.rent}\nStatus: ${item.status}\nDue Date: ${item.dueDate}`)
}

function sendPaymentReminder(item) {
  activeMenuId.value = null
  addNotification(`Payment reminder notice dispatched to ${item.vendor}.`)
  alert(`Payment reminder sent to ${item.vendor}!`)
}

function openContractByStall(stallNumber) {
  activeMenuId.value = null
  const found = contracts.value.find(c => c.ref.includes(stallNumber)) || contracts.value[0]
  openContract(found)
}

function openContract(c) {
  selectedContract.value = c
  showContractModal.value = true
}

function handleAttentionClick(task) {
  selectedAttentionTask.value = task
}

function handleAttentionAction(detail) {
  alert(`Action "${detail.actionLabel}" executed for ${detail.name}. Notification queued.`)
  addNotification(`Task processed: ${detail.actionLabel} for ${detail.name}`)
  selectedAttentionTask.value = null
}

// FORMATTING UTILITIES
function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(n || 0)
}

// DATA SOURCES & NOTIFICATIONS
function loadContracts() {
  try {
    const raw = localStorage.getItem('contracts')
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return sampleContracts.map(x => ({ ...x }))
}

function loadApplications() {
  try {
    const raw = localStorage.getItem('ms_applications')
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return sampleApplicants.map(x => ({ ...x }))
}

function loadNotifications() {
  try {
    const raw = localStorage.getItem('ms_notifications')
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return [
    { id: 'N1', message: 'October monthly rent statement published.', date: 'Today at 09:15 AM', read: false },
    { id: 'N2', message: 'Stall inspection scheduled for Section A this Thursday.', date: 'Yesterday at 04:30 PM', read: false }
  ]
}

const contracts = ref(loadContracts())
const applications = ref(loadApplications())
const notificationsList = ref(loadNotifications())

const currentStakeholder = computed(() => {
  if (!stakeholderId) return applications.value[0] || null
  return applications.value.find(a => String(a.id) === String(stakeholderId)) || applications.value[0] || null
})

const unreadCount = computed(() => {
  return notificationsList.value.filter(n => !n.read).length
})

function addNotification(message) {
  const item = {
    id: 'N' + Date.now(),
    message,
    date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false
  }
  notificationsList.value.unshift(item)
  try {
    localStorage.setItem('ms_notifications', JSON.stringify(notificationsList.value))
  } catch (e) {}
}

function markAllNotificationsRead() {
  notificationsList.value.forEach(n => (n.read = true))
  try {
    localStorage.setItem('ms_notifications', JSON.stringify(notificationsList.value))
  } catch (e) {}
}

// KEYBOARD SHORTCUT: CMD/CTRL + K TO FOCUS SEARCH
function handleKeyDown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
  if (e.key === 'Escape') {
    activeMenuId.value = null
  }
}

function handleGlobalClick() {
  activeMenuId.value = null
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('click', handleGlobalClick)
})
</script>

<style scoped src="../styles/Stakeholder/dashboard.css"></style>
