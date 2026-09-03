<template>
  <div class="admin-layout min-h-screen bg-slate-50">
    <Toast />
    <ConfirmDialog />
    <AdminMenu />

    <main class="admin-page">
      <header class="page-header">
        <div>
          <h1 class="page-title">
            <span class="title-icon"><i :class="page.icon"></i></span>
            {{ page.title }}
          </h1>
          <p class="page-subtitle">{{ page.subtitle }}</p>
        </div>

        <div class="header-actions">
          <span v-if="hasSearch" class="search-wrap">
            <i class="pi pi-search"></i>
            <InputText v-model="search" :placeholder="`Search ${page.title.toLowerCase()}...`" />
          </span>
          <Button
            v-if="route.name === 'AdminUsers'"
            label="Create User"
            icon="pi pi-plus"
            @click="openCreateUser"
          />
          <Button
            v-if="route.name === 'AdminStalls'"
            label="Add Stall"
            icon="pi pi-plus"
            @click="openStallDialog()"
          />
          <Button
            v-if="route.name === 'AdminStallTypes'"
            label="Add Type"
            icon="pi pi-plus"
            @click="openMasterDialog('type')"
          />
          <Button
            v-if="route.name === 'AdminRentalRates'"
            label="Add Rate"
            icon="pi pi-plus"
            @click="openMasterDialog('rate')"
          />
          <Button
            v-if="hasSearch"
            label="Refresh"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            @click="loadAdminData"
          />
        </div>
      </header>

      <section v-if="showFilterBar" class="admin-filter-bar">
        <Select
          v-if="route.name === 'AdminUsers' || route.name === 'AdminAuditLogs'"
          v-model="roleFilter"
          :options="roleFilterOptions"
          placeholder="Role"
        />
        <Select
          v-if="route.name === 'AdminUsers' || route.name === 'AdminLoginHistory' || route.name === 'AdminNotifications'"
          v-model="statusFilter"
          :options="statusFilterOptions"
          placeholder="Status"
        />
        <Select
          v-if="route.name === 'AdminAuditLogs'"
          v-model="moduleFilter"
          :options="moduleFilterOptions"
          placeholder="Module"
        />
        <DatePicker v-model="dateFrom" placeholder="Date from" showIcon />
        <DatePicker v-model="dateTo" placeholder="Date to" showIcon />
        <Button label="Clear" icon="pi pi-times" text severity="secondary" @click="clearFilters" />
      </section>

      <Message v-if="loadError" severity="warn" class="mb-6">
        {{ loadError }}
      </Message>

      <section v-if="loading" class="state-card">
        <i class="pi pi-spin pi-spinner text-4xl text-indigo-600"></i>
        <p>Loading admin records...</p>
      </section>

      <template v-else>
        <DashboardView v-if="route.name === 'AdminDashboard'" :state="state" />
        <UsersView
          v-else-if="route.name === 'AdminUsers'"
          :rows="filteredUsers"
          @view="viewUser"
          @edit="openEditUser"
          @activate="confirmActivate"
          @disable="confirmDisable"
          @reset="confirmResetPassword"
        />
        <RolesView v-else-if="route.name === 'AdminRoles'" />
        <SettingsView
          v-else-if="route.name === 'AdminSettings'"
          v-model="settingsForm"
          :saving="saving"
          @save="saveSettings"
        />
        <ProfileView v-else-if="route.name === 'AdminProfile'" />
        <StallsView
          v-else-if="route.name === 'AdminStalls'"
          :rows="filteredStalls"
          @edit="openStallDialog"
          @toggle="confirmToggleStall"
        />
        <MasterDataView
          v-else-if="route.name === 'AdminStallTypes'"
          title="Stall Types"
          :rows="filteredStallTypes"
          kind="type"
          @edit="openMasterDialog"
          @toggle="toggleMasterRecord"
        />
        <MasterDataView
          v-else-if="route.name === 'AdminRentalRates'"
          title="Rental Rates"
          :rows="filteredRentalRates"
          kind="rate"
          @edit="openMasterDialog"
          @toggle="toggleMasterRecord"
        />
        <StallMapView v-else-if="route.name === 'AdminStallMap'" :rows="state.stalls" @edit="openStallDialog" />
        <AuditLogsView v-else-if="route.name === 'AdminAuditLogs'" :rows="filteredAuditLogs" />
        <LoginHistoryView v-else-if="route.name === 'AdminLoginHistory'" :rows="filteredLoginHistory" />
        <NotificationsView v-else-if="route.name === 'AdminNotifications'" :rows="filteredNotifications" />
        <ReportsView v-else-if="isReportRoute" :state="state" :route-name="route.name" />
        <MonitoringView v-else :rows="monitoringRows" :columns="monitoringColumns" />
      </template>
    </main>

    <Dialog
      v-model:visible="userDialog.visible"
      modal
      :header="userDialog.mode === 'view' ? 'User Details' : userDialog.form.id ? 'Edit User' : 'Create User'"
      :style="{ width: '46rem' }"
      :breakpoints="{ '960px': '75vw', '641px': '95vw' }"
    >
      <div class="form-grid">
        <label>
          Full Name
          <InputText v-model="userDialog.form.name" :disabled="userDialog.mode === 'view'" />
        </label>
        <label>
          Username
          <InputText v-model="userDialog.form.username" :disabled="userDialog.mode === 'view'" />
        </label>
        <label>
          Role
          <Select
            v-model="userDialog.form.role"
            :options="roleOptions"
            :disabled="userDialog.mode === 'view'"
            class="w-full"
          />
        </label>
        <label>
          Account Status
          <Select
            v-model="userDialog.form.status"
            :options="['ACTIVE', 'INACTIVE']"
            :disabled="userDialog.mode === 'view'"
            class="w-full"
          />
        </label>
        <label v-if="!userDialog.form.id && userDialog.mode !== 'view'" class="full">
          Password
          <Password v-model="userDialog.form.password" toggleMask :feedback="false" />
        </label>
        <label v-if="!userDialog.form.id && userDialog.mode !== 'view'" class="full">
          Confirm Password
          <Password v-model="userDialog.form.confirmPassword" toggleMask :feedback="false" />
        </label>
        <label v-if="userDialog.mode === 'view'">
          Created Date
          <InputText :modelValue="formatDateTime(userDialog.form.createdAt)" disabled />
        </label>
        <label v-if="userDialog.mode === 'view'">
          Number of Actions
          <InputText :modelValue="String(userDialog.form.actionCount || 0)" disabled />
        </label>
      </div>

      <template #footer>
        <Button label="Close" icon="pi pi-times" text @click="userDialog.visible = false" />
        <Button
          v-if="userDialog.mode !== 'view'"
          label="Save User"
          icon="pi pi-check"
          :loading="saving"
          @click="saveUser"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="stallDialog.visible"
      modal
      :header="stallDialog.form.id ? 'Edit Stall' : 'Add Stall'"
      :style="{ width: '46rem' }"
      :breakpoints="{ '960px': '75vw', '641px': '95vw' }"
    >
      <div class="form-grid">
        <label>
          Stall Number
          <InputText v-model="stallDialog.form.stallNo" />
        </label>
        <label>
          Section
          <InputText v-model="stallDialog.form.section" />
        </label>
        <label>
          Type
          <InputText v-model="stallDialog.form.stallType" />
        </label>
        <label>
          Dimensions
          <InputText v-model="stallDialog.form.dimensions" />
        </label>
        <label>
          Rental Rate
          <InputNumber v-model="stallDialog.form.monthlyRent" mode="currency" currency="PHP" locale="en-PH" />
        </label>
        <label>
          Status
          <Select v-model="stallDialog.form.status" :options="stallStatuses" class="w-full" />
        </label>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text @click="stallDialog.visible = false" />
        <Button label="Save Stall" icon="pi pi-check" :loading="saving" @click="saveStall" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="masterDialog.visible"
      modal
      :header="masterDialog.kind === 'rate' ? 'Rental Rate' : 'Stall Type'"
      :style="{ width: '34rem' }"
    >
      <div class="form-grid one">
        <label v-if="masterDialog.kind === 'type'">
          Name
          <InputText v-model="masterDialog.form.name" />
        </label>
        <label v-if="masterDialog.kind === 'rate'">
          Stall Type
          <InputText v-model="masterDialog.form.stallType" />
        </label>
        <label v-if="masterDialog.kind === 'rate'">
          Monthly Rate
          <InputNumber v-model="masterDialog.form.monthlyRate" mode="currency" currency="PHP" locale="en-PH" />
        </label>
        <label>
          Description
          <Textarea v-model="masterDialog.form.description" rows="3" />
        </label>
        <label>
          Status
          <Select v-model="masterDialog.form.status" :options="['ACTIVE', 'INACTIVE']" class="w-full" />
        </label>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text @click="masterDialog.visible = false" />
        <Button label="Save" icon="pi pi-check" :loading="saving" @click="saveMasterRecord" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AdminMenu from '../components/AdminMenu.vue'
import api from '../services/api'
import {
  activateUser,
  createUser,
  disableUser,
  getAdminUsers,
  getAuditLogs,
  getLoginHistory,
  getNotifications,
  getRentalRates,
  getStallTypes,
  getSystemSettings,
  resetUserPassword,
  updateSettings,
  updateUser
} from '../services/adminService'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Chart from 'chart.js/auto'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import Toast from 'primevue/toast'
import ToggleSwitch from 'primevue/toggleswitch'

const route = useRoute()
const toast = useToast()
const confirm = useConfirm()
const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const search = ref('')
const roleFilter = ref('All')
const statusFilter = ref('All')
const moduleFilter = ref('All')
const dateFrom = ref(null)
const dateTo = ref(null)
const settingsForm = ref({})

const state = reactive({
  users: [],
  stalls: [],
  stakeholders: [],
  applications: [],
  contracts: [],
  payments: [],
  billings: [],
  auditLogs: [],
  loginHistory: [],
  notifications: [],
  stallTypes: [],
  rentalRates: [],
  settings: {}
})

const pages = {
  AdminDashboard: ['Dashboard', 'System management overview', 'pi pi-home'],
  AdminUsers: ['Users', 'Manage accounts, access, and password resets', 'pi pi-users'],
  AdminRoles: ['Roles & Permissions', 'Permission matrix by office role', 'pi pi-shield'],
  AdminLoginHistory: ['Login History', 'Authentication attempts and device records', 'pi pi-history'],
  AdminStallMap: ['Stall Map', 'Read-only market occupancy view', 'pi pi-map'],
  AdminStalls: ['Stalls', 'Maintain stall master records', 'pi pi-building'],
  AdminStallTypes: ['Stall Types', 'Maintain stall categories', 'pi pi-tags'],
  AdminRentalRates: ['Rental Rates', 'Maintain rent rate master data', 'pi pi-money-bill'],
  AdminApplications: ['Applications', 'Read-only application monitoring', 'pi pi-file'],
  AdminStakeholders: ['Stakeholders', 'Read-only stakeholder monitoring', 'pi pi-id-card'],
  AdminContracts: ['Contracts', 'Read-only contract monitoring', 'pi pi-file-check'],
  AdminPayments: ['Payments', 'Read-only payment monitoring', 'pi pi-wallet'],
  AdminBilling: ['Billing', 'Read-only billing monitoring', 'pi pi-receipt'],
  AdminOccupancy: ['Occupancy', 'Read-only stall occupancy monitoring', 'pi pi-chart-pie'],
  AdminRevenueReport: ['Revenue Report', 'Revenue reporting overview', 'pi pi-chart-line'],
  AdminApplicationsReport: ['Applications Report', 'Application status reporting overview', 'pi pi-chart-bar'],
  AdminOccupancyReport: ['Occupancy Report', 'Occupancy reporting overview', 'pi pi-chart-scatter'],
  AdminActivityReport: ['System Activity Report', 'System activity reporting overview', 'pi pi-list-check'],
  AdminAuditLogs: ['Audit Logs', 'Security and system activity trail', 'pi pi-lock'],
  AdminNotifications: ['Notifications', 'System notification monitoring', 'pi pi-bell'],
  AdminSettings: ['Settings', 'System, rental, and notification configuration', 'pi pi-cog'],
  AdminProfile: ['Profile', 'Current administrator account', 'pi pi-user']
}

const page = computed(() => {
  const data = pages[route.name] || pages.AdminDashboard
  return { title: data[0], subtitle: data[1], icon: data[2] }
})

const hasSearch = computed(() => !['AdminDashboard', 'AdminRoles', 'AdminSettings', 'AdminProfile', 'AdminStallMap'].includes(route.name))
const showFilterBar = computed(() => ['AdminUsers', 'AdminAuditLogs', 'AdminLoginHistory', 'AdminNotifications'].includes(route.name))
const isReportRoute = computed(() => String(route.name).includes('Report'))
const roleOptions = ['ADMIN', 'TREASURER', 'MARKET_SUPERVISOR', 'BPLO', 'ENDORSING_OFFICE']
const stallStatuses = ['VACANT', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'INACTIVE']
const roleFilterOptions = computed(() => ['All', ...new Set([...roleOptions, ...state.users.map((user) => user.role)].filter(Boolean))])
const statusFilterOptions = computed(() => {
  const source = route.name === 'AdminNotifications'
    ? state.notifications
    : route.name === 'AdminLoginHistory'
      ? state.loginHistory
      : state.users

  return ['All', ...new Set(source.map((row) => row.status).filter(Boolean))]
})
const moduleFilterOptions = computed(() => ['All', ...new Set(state.auditLogs.map((log) => log.module).filter(Boolean))])

const userDialog = reactive({
  visible: false,
  mode: 'edit',
  form: emptyUser()
})

const stallDialog = reactive({
  visible: false,
  form: emptyStall()
})

const masterDialog = reactive({
  visible: false,
  kind: 'type',
  form: {}
})

const q = computed(() => search.value.trim().toLowerCase())
const filteredUsers = computed(() => {
  return filterRows(state.users, ['name', 'username', 'role', 'status'])
    .filter((user) => roleFilter.value === 'All' || user.role === roleFilter.value)
    .filter((user) => statusFilter.value === 'All' || user.status === statusFilter.value)
    .filter((user) => withinDateRange(user.createdAt || user.createdDate))
})
const filteredStalls = computed(() => filterRows(state.stalls, ['stallNo', 'number', 'section', 'stallType', 'type', 'status']))
const filteredStallTypes = computed(() => filterRows(state.stallTypes, ['name', 'description', 'status']))
const filteredRentalRates = computed(() => filterRows(state.rentalRates, ['stallType', 'name', 'description', 'status']))
const filteredAuditLogs = computed(() => {
  return filterRows(state.auditLogs, ['user', 'role', 'action', 'module', 'record', 'description'])
    .filter((log) => roleFilter.value === 'All' || log.role === roleFilter.value)
    .filter((log) => moduleFilter.value === 'All' || log.module === moduleFilter.value)
    .filter((log) => withinDateRange(log.rawDate))
})
const filteredLoginHistory = computed(() => {
  return filterRows(state.loginHistory, ['user', 'username', 'device', 'browser', 'status', 'ipAddress'])
    .filter((row) => statusFilter.value === 'All' || row.status === statusFilter.value)
    .filter((row) => withinDateRange(row.rawDate))
})
const filteredNotifications = computed(() => {
  return filterRows(state.notifications, ['title', 'message', 'type', 'status'])
    .filter((row) => statusFilter.value === 'All' || row.status === statusFilter.value)
    .filter((row) => withinDateRange(row.rawDate))
})

const monitoringRows = computed(() => {
  switch (route.name) {
    case 'AdminApplications':
      return filterRows(state.applications, ['applicationNo', 'applicant', 'business', 'stall', 'status', 'currentOffice'])
    case 'AdminStakeholders':
      return filterRows(state.stakeholders, ['name', 'business', 'verification', 'stall', 'contract', 'status'])
    case 'AdminContracts':
      return filterRows(state.contracts, ['contractNo', 'stakeholder', 'stall', 'status'])
    case 'AdminPayments':
      return filterRows(state.payments, ['orNo', 'payor', 'type', 'recordedBy'])
    case 'AdminBilling':
      return filterRows(state.billings, ['billingNo', 'stakeholder', 'period', 'status'])
    case 'AdminOccupancy':
      return filterRows(state.stalls, ['stallNo', 'section', 'stallType', 'status'])
    default:
      return []
  }
})

const monitoringColumns = computed(() => {
  const columns = {
    AdminApplications: [
      ['applicationNo', 'Application No.'], ['applicant', 'Applicant'], ['business', 'Business'], ['stall', 'Preferred/Assigned Stall'], ['status', 'Current Status'], ['currentOffice', 'Current Office'], ['date', 'Date Submitted'], ['lastUpdated', 'Last Updated']
    ],
    AdminStakeholders: [
      ['name', 'Name'], ['business', 'Business'], ['contact', 'Contact'], ['verification', 'Verification Status'], ['stall', 'Stall'], ['contract', 'Contract'], ['status', 'Account Status'], ['registrationDate', 'Registration Date']
    ],
    AdminContracts: [
      ['contractNo', 'Contract No.'], ['stakeholder', 'Stakeholder'], ['business', 'Business'], ['stall', 'Stall'], ['startDate', 'Start Date'], ['endDate', 'End Date'], ['rent', 'Monthly Rent'], ['status', 'Status']
    ],
    AdminPayments: [
      ['orNo', 'OR No.'], ['payor', 'Payor'], ['type', 'Type'], ['amount', 'Amount'], ['date', 'Date'], ['recordedBy', 'Recorded By']
    ],
    AdminBilling: [
      ['billingNo', 'Billing No.'], ['stakeholder', 'Stakeholder'], ['period', 'Period'], ['amount', 'Amount'], ['dueDate', 'Due Date'], ['balance', 'Balance'], ['status', 'Status']
    ],
    AdminOccupancy: [
      ['stallNo', 'Stall Number'], ['section', 'Section'], ['stallType', 'Type'], ['dimensions', 'Dimensions'], ['monthlyRent', 'Rental Rate'], ['status', 'Status']
    ]
  }

  return columns[route.name] || []
})

function filterRows(rows, fields) {
  if (!q.value) return rows
  return rows.filter((row) => fields.some((field) => String(row[field] ?? '').toLowerCase().includes(q.value)))
}

function emptyUser() {
  return { id: null, name: '', username: '', role: 'ADMIN', password: '', confirmPassword: '', status: 'ACTIVE', createdAt: '', lastLogin: '', actionCount: 0 }
}

function emptyStall() {
  return { id: null, stallNo: '', section: '', stallType: '', dimensions: '', monthlyRent: 0, status: 'VACANT' }
}

async function loadAdminData() {
  loading.value = true
  loadError.value = ''

  try {
    const [
      users,
      stalls,
      stakeholders,
      applications,
      payments,
      billings,
      auditLogs,
      loginHistory,
      notifications,
      stallTypes,
      rentalRates,
      settings
    ] = await Promise.all([
      getAdminUsers(),
      getList('/stalls'),
      getList('/stakeholders'),
      getList('/applications'),
      getList('/payments'),
      getList('/billings'),
      getAuditLogs(),
      getLoginHistory(),
      getNotifications(),
      getStallTypes(),
      getRentalRates(),
      getSystemSettings()
    ])

    state.users = toArray(users).map(mapUser)
    state.stalls = toArray(stalls).map(mapStall)
    state.stakeholders = toArray(stakeholders).map(mapStakeholder)
    state.applications = toArray(applications).map(mapApplication)
    state.payments = toArray(payments).map(mapPayment)
    state.billings = toArray(billings).map(mapBilling)
    state.auditLogs = toArray(auditLogs).map(mapAuditLog)
    state.loginHistory = toArray(loginHistory).map(mapLoginHistory)
    state.notifications = toArray(notifications).map(mapNotification)
    state.stallTypes = toArray(stallTypes).map(mapStallType)
    state.rentalRates = toArray(rentalRates).map(mapRentalRate)
    state.settings = settings || {}
    state.contracts = state.stakeholders.filter((s) => s.contract && s.contract !== 'No contract').map(mapContractFromStakeholder)
    settingsForm.value = normalizeSettings(state.settings)
  } catch (error) {
    loadError.value = error.message || 'Unable to load admin records.'
  } finally {
    loading.value = false
  }
}

async function getList(path) {
  try {
    const response = await api.get(path)
    return response.data
  } catch (error) {
    if (error.response?.status === 404) return []
    throw error
  }
}

function toArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.content)) return value.content
  return []
}

function mapUser(user) {
  const name = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.fullName || 'Unnamed User'
  return {
    ...user,
    name,
    username: user.username || user.userName || '',
    role: user.role || user.authority || user.userRole || 'UNASSIGNED',
    status: user.status || (user.enabled === false ? 'INACTIVE' : 'ACTIVE'),
    lastLogin: user.lastLogin || user.lastLoginAt || user.updatedAt || '',
    createdAt: user.createdAt || user.createdDate || user.dateCreated || '',
    actionCount: Number(user.actionCount || user.actionsCount || user.auditCount || 0)
  }
}

function mapStall(stall) {
  return {
    ...stall,
    stallNo: stall.stallNo || stall.number || stall.stallNumber || '',
    section: stall.section || stall.location || 'Public Market',
    stallType: stall.stallType || stall.type || '',
    dimensions: stall.dimensions || stall.size || stall.info || '',
    monthlyRent: Number(stall.monthlyRent ?? stall.rentalRate ?? stall.rent ?? 0),
    status: stall.status || 'VACANT'
  }
}

function mapStakeholder(item) {
  const name = item.name || [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Unnamed Stakeholder'
  const stall = item.occupant?.stall?.stallNo || item.stall?.stallNo || item.stallNo || 'No stall'
  const contract = item.contractNo || item.contract?.contractNo || item.occupant?.contract?.contractNo || 'No contract'

  return {
    ...item,
    name,
    business: item.businessName || item.business || '',
    contact: item.contact || item.contactNo || item.phone || item.mobileNo || '',
    verification: item.verified || item.verifiedStakeholder || item.verifiedTenant ? 'VERIFIED' : 'PENDING',
    stall,
    contract,
    registrationDate: formatDate(item.createdAt || item.registrationDate || item.dateRegistered),
    status: item.applicationStatus || item.status || 'PENDING'
  }
}

function mapApplication(item) {
  return {
    ...item,
    applicationNo: item.applicationNo || item.id || item.referenceNo || '',
    applicant: item.applicant || item.applicantName || [item.firstName, item.lastName].filter(Boolean).join(' ') || item.stakeholder?.name || '',
    business: item.business || item.businessName || item.stakeholder?.businessName || '',
    stall: item.stallNo || item.stall?.stallNo || item.preferredStall || '',
    status: item.status || item.applicationStatus || 'PENDING',
    currentOffice: item.currentOffice || item.office || item.workflowOffice || '',
    date: formatDate(item.date || item.createdAt || item.submittedAt),
    lastUpdated: formatDate(item.updatedAt || item.lastUpdated)
  }
}

function mapPayment(item) {
  return {
    ...item,
    orNo: item.orNo || item.receiptNo || item.id || '',
    payor: item.payor || item.occupantName || [item.stakeholder?.firstName, item.stakeholder?.lastName].filter(Boolean).join(' ') || '',
    type: formatEnum(item.paymentType || item.type),
    amount: money(item.amount),
    date: formatDate(item.paymentDate || item.date || item.createdAt),
    recordedBy: item.recordedBy || item.createdBy || ''
  }
}

function mapBilling(item) {
  return {
    ...item,
    billingNo: item.billingNo || item.id || '',
    stakeholder: item.stakeholder || item.occupantName || item.stakeholderName || '',
    period: item.billingPeriod || item.period || '',
    amount: money(item.totalAmount || item.amount),
    dueDate: formatDate(item.dueDate),
    balance: money(item.balance),
    status: item.status || 'UNPAID'
  }
}

function mapContractFromStakeholder(item) {
  return {
    contractNo: item.contract,
    stakeholder: item.name,
    business: item.business,
    stall: item.stall,
    dateRange: [formatDate(item.contractStart || item.startDate), formatDate(item.contractEnd || item.endDate)].filter(Boolean).join(' - ') || 'Not specified',
    startDate: formatDate(item.contractStart || item.startDate),
    endDate: formatDate(item.contractEnd || item.endDate),
    rent: money(item.monthlyRent || item.occupant?.stall?.monthlyRent),
    status: item.contractStatus || item.status || 'ACTIVE'
  }
}

function mapAuditLog(log) {
  const rawDate = log.dateTime || log.timestamp || log.createdAt || log.date
  return {
    ...log,
    rawDate,
    dateTime: formatDateTime(rawDate),
    user: log.user || log.username || log.actor || '',
    role: log.role || log.userRole || '',
    action: log.action || '',
    module: log.module || log.entity || '',
    record: log.record || log.recordId || '',
    description: log.description || log.details || ''
  }
}

function mapLoginHistory(row) {
  const rawDate = row.dateTime || row.loginAt || row.createdAt
  return {
    ...row,
    user: row.user || row.username || row.email || '',
    username: row.username || row.userName || '',
    rawDate,
    dateTime: formatDateTime(rawDate),
    device: row.device || row.deviceName || '',
    browser: row.browser || row.userAgent || '',
    ipAddress: row.ipAddress || row.ip || '',
    status: row.status || (row.success === false ? 'FAILED' : 'SUCCESS')
  }
}

function mapNotification(row) {
  const rawDate = row.createdAt || row.date
  return {
    ...row,
    title: row.title || row.subject || row.type || 'Notification',
    message: row.message || row.description || '',
    type: row.type || 'INFORMATION',
    status: row.status || (row.read ? 'READ' : 'UNREAD'),
    rawDate,
    date: formatDateTime(rawDate)
  }
}

function mapStallType(row) {
  return {
    ...row,
    name: row.name || row.stallType || row.type || '',
    description: row.description || row.info || '',
    status: row.status || 'ACTIVE'
  }
}

function mapRentalRate(row) {
  return {
    ...row,
    stallType: row.stallType || row.name || row.type || '',
    monthlyRate: Number(row.monthlyRate ?? row.rate ?? row.amount ?? 0),
    description: row.description || '',
    status: row.status || 'ACTIVE'
  }
}

function normalizeSettings(settings) {
  return {
    systemName: settings.systemName || 'Rental Management System for the Public Market of Manticao',
    municipality: settings.municipality || 'Manticao',
    office: settings.office || 'Public Market Office',
    contact: settings.contact || '',
    emailAddress: settings.emailAddress || settings.email || '',
    billingFrequency: settings.billingFrequency || 'MONTHLY',
    advancePaymentPeriod: Number(settings.advancePaymentPeriod || 0),
    gracePeriod: Number(settings.gracePeriod || 0),
    currency: settings.currency || 'PHP',
    applicationNotifications: settings.applicationNotifications ?? true,
    paymentNotifications: settings.paymentNotifications ?? true,
    billingReminders: settings.billingReminders ?? true,
    contractExpirationAlerts: settings.contractExpirationAlerts ?? true
  }
}

function openCreateUser() {
  userDialog.mode = 'edit'
  userDialog.form = emptyUser()
  userDialog.visible = true
}

function openEditUser(user) {
  userDialog.mode = 'edit'
  userDialog.form = { ...emptyUser(), ...user, password: '' }
  userDialog.visible = true
}

function viewUser(user) {
  userDialog.mode = 'view'
  userDialog.form = { ...emptyUser(), ...user, password: '' }
  userDialog.visible = true
}

async function saveUser() {
  if (!userDialog.form.id && userDialog.form.password !== userDialog.form.confirmPassword) {
    toast.add({ severity: 'warn', summary: 'Password mismatch', detail: 'Password and confirm password must match.', life: 3000 })
    return
  }

  saving.value = true
  try {
    if (userDialog.form.id) {
      await updateUser(userDialog.form.id, userDialog.form)
    } else {
      await createUser(userDialog.form)
    }
    toast.add({ severity: 'success', summary: 'Saved', detail: 'User account saved.', life: 2500 })
    userDialog.visible = false
    await loadAdminData()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Unable to save user', detail: error.message, life: 3500 })
  } finally {
    saving.value = false
  }
}

function clearFilters() {
  roleFilter.value = 'All'
  statusFilter.value = 'All'
  moduleFilter.value = 'All'
  dateFrom.value = null
  dateTo.value = null
}

function withinDateRange(value) {
  if (!dateFrom.value && !dateTo.value) return true
  if (!value) return false

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  if (dateFrom.value) {
    const from = new Date(dateFrom.value)
    from.setHours(0, 0, 0, 0)
    if (date < from) return false
  }

  if (dateTo.value) {
    const to = new Date(dateTo.value)
    to.setHours(23, 59, 59, 999)
    if (date > to) return false
  }

  return true
}

function confirmActivate(user) {
  confirm.require({
    message: `Activate ${user.name}?`,
    header: 'Activate User',
    icon: 'pi pi-check-circle',
    accept: async () => runUserAction(() => activateUser(user.id), 'User activated.')
  })
}

function confirmDisable(user) {
  confirm.require({
    message: `Disable ${user.name}?`,
    header: 'Disable User',
    icon: 'pi pi-ban',
    accept: async () => runUserAction(() => disableUser(user.id), 'User disabled.')
  })
}

function confirmResetPassword(user) {
  confirm.require({
    message: `Reset password for ${user.name}?`,
    header: 'Reset Password',
    icon: 'pi pi-key',
    accept: async () => runUserAction(() => resetUserPassword(user.id), 'Password reset requested.')
  })
}

async function runUserAction(action, detail) {
  try {
    await action()
    toast.add({ severity: 'success', summary: 'Updated', detail, life: 2500 })
    await loadAdminData()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Action failed', detail: error.message, life: 3500 })
  }
}

function openStallDialog(stall = null) {
  stallDialog.form = stall ? { ...emptyStall(), ...stall } : emptyStall()
  stallDialog.visible = true
}

async function saveStall() {
  saving.value = true
  try {
    const payload = {
      stallNo: stallDialog.form.stallNo,
      section: stallDialog.form.section,
      stallType: stallDialog.form.stallType,
      dimensions: stallDialog.form.dimensions,
      monthlyRent: stallDialog.form.monthlyRent,
      status: stallDialog.form.status
    }

    if (stallDialog.form.id) await api.put(`/stalls/${stallDialog.form.id}`, payload)
    else await api.post('/stalls', payload)
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Stall master record saved.', life: 2500 })
    stallDialog.visible = false
    await loadAdminData()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Unable to save stall', detail: error.message, life: 3500 })
  } finally {
    saving.value = false
  }
}

function confirmToggleStall(stall) {
  const nextStatus = stall.status === 'INACTIVE' ? 'VACANT' : 'INACTIVE'
  confirm.require({
    message: `Set stall ${stall.stallNo} to ${nextStatus}?`,
    header: 'Update Stall Status',
    icon: 'pi pi-info-circle',
    accept: async () => {
      try {
        await api.put(`/stalls/${stall.id}`, { ...stall, status: nextStatus })
        toast.add({ severity: 'success', summary: 'Updated', detail: 'Stall status updated.', life: 2500 })
        await loadAdminData()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Update failed', detail: error.message, life: 3500 })
      }
    }
  })
}

function openMasterDialog(kind, row = null) {
  masterDialog.kind = kind
  masterDialog.form = row ? { ...row } : { name: '', stallType: '', monthlyRate: 0, description: '', status: 'ACTIVE' }
  masterDialog.visible = true
}

async function saveMasterRecord() {
  saving.value = true
  const collection = masterDialog.kind === 'rate' ? '/rental-rates' : '/stall-types'
  try {
    if (masterDialog.form.id) await api.put(`${collection}/${masterDialog.form.id}`, masterDialog.form)
    else await api.post(collection, masterDialog.form)
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Master data saved.', life: 2500 })
    masterDialog.visible = false
    await loadAdminData()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Unable to save master data', detail: error.message, life: 3500 })
  } finally {
    saving.value = false
  }
}

async function toggleMasterRecord(kind, row) {
  const collection = kind === 'rate' ? '/rental-rates' : '/stall-types'
  const status = row.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'
  try {
    await api.put(`${collection}/${row.id}`, { ...row, status })
    toast.add({ severity: 'success', summary: 'Updated', detail: 'Status updated.', life: 2500 })
    await loadAdminData()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Update failed', detail: error.message, life: 3500 })
  }
}

async function saveSettings() {
  saving.value = true
  try {
    await updateSettings(settingsForm.value)
    toast.add({ severity: 'success', summary: 'Settings saved', detail: 'System configuration updated.', life: 2500 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Unable to save settings', detail: error.message, life: 3500 })
  } finally {
    saving.value = false
  }
}

function formatEnum(value) {
  return String(value || '').replaceAll('_', ' ')
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString()
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

function money(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
}

function severity(value) {
  const normalized = String(value || '').toUpperCase()
  if (['ACTIVE', 'APPROVED', 'PAID', 'SUCCESS', 'OCCUPIED', 'VERIFIED'].includes(normalized)) return 'success'
  if (['PENDING', 'WARNING', 'RESERVED', 'PARTIAL', 'UNPAID'].includes(normalized)) return 'warn'
  if (['REJECTED', 'FAILED', 'OVERDUE', 'DISABLED'].includes(normalized)) return 'danger'
  if (['VACANT', 'INFO', 'INFORMATION', 'READ', 'UNREAD'].includes(normalized)) return 'info'
  return 'secondary'
}

onMounted(() => {
  loadAdminData()
  document.getElementById('app')?.classList.add('full-bleed')
})

onUnmounted(() => {
  document.getElementById('app')?.classList.remove('full-bleed')
})

watch(() => route.name, () => {
  search.value = ''
  clearFilters()
})

const StatusTag = defineComponent({
  props: { value: { type: [String, Number], default: '' } },
  setup(props) {
    return () => h(Tag, { value: props.value || 'N/A', severity: severity(props.value), rounded: true })
  }
})

const DashboardView = defineComponent({
  props: { state: { type: Object, required: true } },
  setup(props) {
    const roleChart = ref(null)
    const occupancyChart = ref(null)
    let charts = []

    const metrics = computed(() => {
      const users = props.state.users
      const stalls = props.state.stalls
      const activeUsers = users.filter((u) => String(u.status).toUpperCase() === 'ACTIVE').length
      const occupied = stalls.filter((s) => String(s.status).toUpperCase() === 'OCCUPIED').length
      const vacant = stalls.filter((s) => String(s.status).toUpperCase() === 'VACANT').length
      return [
        ['Total Users', users.length, 'pi pi-users', 'blue'],
        ['Active Users', activeUsers, 'pi pi-user-plus', 'green'],
        ['Inactive Users', users.length - activeUsers, 'pi pi-user-minus', 'gray'],
        ['Total Stalls', stalls.length, 'pi pi-building', 'blue'],
        ['Occupied Stalls', occupied, 'pi pi-check-circle', 'green'],
        ['Vacant Stalls', vacant, 'pi pi-circle', 'yellow'],
        ['Active Contracts', props.state.contracts.filter((c) => String(c.status).toUpperCase() === 'ACTIVE').length, 'pi pi-file-check', 'green'],
        ['System Alerts', props.state.notifications.filter((n) => ['UNREAD', 'WARNING', 'FAILED'].includes(String(n.status).toUpperCase())).length, 'pi pi-bell', 'red']
      ]
    })

    function renderCharts() {
      charts.forEach((chart) => chart.destroy())
      charts = []

      if (roleChart.value) {
        const roles = props.state.users.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        }, {})
        charts.push(new Chart(roleChart.value, {
          type: 'doughnut',
          data: {
            labels: Object.keys(roles),
            datasets: [{ data: Object.values(roles), backgroundColor: ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#64748b'] }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        }))
      }

      if (occupancyChart.value) {
        const statuses = props.state.stalls.reduce((acc, stall) => {
          acc[stall.status] = (acc[stall.status] || 0) + 1
          return acc
        }, {})
        charts.push(new Chart(occupancyChart.value, {
          type: 'bar',
          data: {
            labels: Object.keys(statuses),
            datasets: [{ label: 'Stalls', data: Object.values(statuses), backgroundColor: '#2563eb', borderRadius: 8 }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        }))
      }
    }

    onMounted(() => nextTick(renderCharts))
    watch(() => [props.state.users.length, props.state.stalls.length], () => nextTick(renderCharts))
    onUnmounted(() => charts.forEach((chart) => chart.destroy()))

    return () => h('div', { class: 'space-y-6' }, [
      h('div', { class: 'metric-grid' }, metrics.value.map(([label, value, icon, tone]) =>
        h(Card, { class: `metric-card tone-${tone}` }, {
          content: () => h('div', { class: 'metric-inner' }, [
            h('div', [h('span', { class: 'metric-label' }, label), h('strong', { class: 'metric-value' }, value)]),
            h('span', { class: 'metric-icon' }, [h('i', { class: icon })])
          ])
        })
      )),
      h('div', { class: 'grid grid-cols-1 lg:grid-cols-3 gap-6' }, [
        h(Card, { class: 'lg:col-span-2' }, { title: () => 'User Distribution by Role', content: () => h('div', { class: 'chart-box' }, [h('canvas', { ref: roleChart })]) }),
        h(Card, null, { title: () => 'Stall Occupancy', content: () => h('div', { class: 'chart-box' }, [h('canvas', { ref: occupancyChart })]) })
      ]),
      h('div', { class: 'grid grid-cols-1 lg:grid-cols-3 gap-6' }, [
        h(Card, { class: 'lg:col-span-2' }, {
          title: () => 'Recent System Activity',
          content: () => h(ActivityList, { rows: props.state.auditLogs.slice(0, 6) })
        }),
        h(Card, null, {
          title: () => 'System Alerts',
          content: () => h(ActivityList, { rows: props.state.notifications.slice(0, 6), alertMode: true })
        })
      ])
    ])
  }
})

const ActivityList = defineComponent({
  props: { rows: { type: Array, default: () => [] }, alertMode: Boolean },
  setup(props) {
    return () => props.rows.length
      ? h('div', { class: 'activity-list' }, props.rows.map((row) => h('div', { class: 'activity-row' }, [
        h('span', { class: 'activity-dot' }),
        h('div', [h('strong', row.title || row.action || 'Activity'), h('p', row.message || row.description || row.module || 'No details')]),
        h('small', row.date || row.dateTime || '')
      ])))
      : h('div', { class: 'empty-state' }, props.alertMode ? 'No current system alerts.' : 'No recent activity found.')
  }
})

const UsersView = defineComponent({
  props: { rows: { type: Array, default: () => [] } },
  emits: ['view', 'edit', 'activate', 'disable', 'reset'],
  setup(props, { emit }) {
    return () => h(DataTable, { value: props.rows, paginator: true, rows: 10, responsiveLayout: 'scroll', class: 'surface-table' }, {
      empty: () => h('div', { class: 'empty-state' }, 'No users found.'),
      default: () => [
        h(Column, { field: 'name', header: 'Full Name', sortable: true }),
        h(Column, { field: 'username', header: 'Username', sortable: true }),
        h(Column, { field: 'role', header: 'Role', sortable: true }),
        h(Column, { field: 'status', header: 'Status' }, { body: ({ data }) => h(StatusTag, { value: data.status }) }),
        h(Column, { field: 'lastLogin', header: 'Last Login' }, { body: ({ data }) => formatDateTime(data.lastLogin) || 'Never' }),
        h(Column, { field: 'createdAt', header: 'Created Date', sortable: true }, { body: ({ data }) => formatDateTime(data.createdAt) || 'N/A' }),
        h(Column, { header: 'Actions' }, { body: ({ data }) => h('div', { class: 'table-actions' }, [
          h(Button, { icon: 'pi pi-eye', text: true, rounded: true, onClick: () => emit('view', data), ariaLabel: 'View' }),
          h(Button, { icon: 'pi pi-pencil', text: true, rounded: true, onClick: () => emit('edit', data), ariaLabel: 'Edit' }),
          h(Button, { icon: 'pi pi-check', text: true, rounded: true, severity: 'success', onClick: () => emit('activate', data), ariaLabel: 'Activate' }),
          h(Button, { icon: 'pi pi-ban', text: true, rounded: true, severity: 'danger', onClick: () => emit('disable', data), ariaLabel: 'Disable' }),
          h(Button, { icon: 'pi pi-key', text: true, rounded: true, severity: 'secondary', onClick: () => emit('reset', data), ariaLabel: 'Reset Password' })
        ]) })
      ]
    })
  }
})

const RolesView = defineComponent({
  setup() {
    const roles = [
      ['admin', 'Admin'],
      ['treasurer', 'Treasurer'],
      ['supervisor', 'Supervisor'],
      ['bplo', 'BPLO'],
      ['endorsing', 'Endorsing']
    ]
    const rows = [
      ['View Applications', true, true, true, true, true],
      ['View Stakeholders', true, true, true, true, true],
      ['View Contracts', true, true, true, true, true],
      ['View Payments', true, true, false, false, false],
      ['Record Payment', false, true, false, false, false],
      ['Issue Receipt', false, true, false, false, false],
      ['Assign Stall', false, false, true, false, false],
      ['Manage Stalls', true, false, false, false, false],
      ['BPLO Approval', false, false, false, true, false],
      ['Endorse Application', false, false, false, false, true],
      ['Manage Users', true, false, false, false, false],
      ['Audit Logs', true, false, false, false, false],
      ['System Settings', true, false, false, false, false]
    ].map(([permission, admin, treasurer, supervisor, bplo, endorsing]) => ({
      permission,
      admin,
      treasurer,
      supervisor,
      bplo,
      endorsing
    }))

    return () => h(Card, null, {
      title: () => 'Role Permission Matrix',
      content: () => h(DataTable, { value: rows, responsiveLayout: 'scroll', class: 'permission-table surface-table' }, {
        default: () => [
          h(Column, { field: 'permission', header: 'Permission' }),
          ...roles.map(([field, label]) => h(Column, { header: label }, {
            body: ({ data }) => h(Checkbox, { modelValue: data[field], binary: true, disabled: true })
          }))
        ]
      })
    })
  }
})

const StallsView = defineComponent({
  props: { rows: { type: Array, default: () => [] } },
  emits: ['edit', 'toggle'],
  setup(props, { emit }) {
    return () => h(DataTable, { value: props.rows, paginator: true, rows: 10, responsiveLayout: 'scroll', class: 'surface-table' }, {
      empty: () => h('div', { class: 'empty-state' }, 'No stalls found.'),
      default: () => [
        h(Column, { field: 'stallNo', header: 'Stall Number', sortable: true }),
        h(Column, { field: 'section', header: 'Section', sortable: true }),
        h(Column, { field: 'stallType', header: 'Type', sortable: true }),
        h(Column, { field: 'dimensions', header: 'Dimensions' }),
        h(Column, { field: 'monthlyRent', header: 'Rental Rate' }, { body: ({ data }) => money(data.monthlyRent) }),
        h(Column, { field: 'status', header: 'Status' }, { body: ({ data }) => h(StatusTag, { value: data.status }) }),
        h(Column, { header: 'Actions' }, { body: ({ data }) => h('div', { class: 'table-actions' }, [
          h(Button, { icon: 'pi pi-pencil', text: true, rounded: true, onClick: () => emit('edit', data), ariaLabel: 'Edit' }),
          h(Button, { icon: data.status === 'INACTIVE' ? 'pi pi-check' : 'pi pi-ban', text: true, rounded: true, severity: data.status === 'INACTIVE' ? 'success' : 'danger', onClick: () => emit('toggle', data), ariaLabel: 'Activate or deactivate' })
        ]) })
      ]
    })
  }
})

const MasterDataView = defineComponent({
  props: { rows: Array, kind: String },
  emits: ['edit', 'toggle'],
  setup(props, { emit }) {
    return () => h(DataTable, { value: props.rows, paginator: true, rows: 10, responsiveLayout: 'scroll', class: 'surface-table' }, {
      empty: () => h('div', { class: 'empty-state' }, 'No master data records found.'),
      default: () => [
        h(Column, { field: props.kind === 'rate' ? 'stallType' : 'name', header: props.kind === 'rate' ? 'Stall Type' : 'Name', sortable: true }),
        ...(props.kind === 'rate' ? [h(Column, { field: 'monthlyRate', header: 'Monthly Rate' }, { body: ({ data }) => money(data.monthlyRate) })] : []),
        h(Column, { field: 'description', header: 'Description' }),
        h(Column, { field: 'status', header: 'Status' }, { body: ({ data }) => h(StatusTag, { value: data.status }) }),
        h(Column, { header: 'Actions' }, { body: ({ data }) => h('div', { class: 'table-actions' }, [
          h(Button, { icon: 'pi pi-pencil', text: true, rounded: true, onClick: () => emit('edit', props.kind, data), ariaLabel: 'Edit' }),
          h(Button, { icon: data.status === 'INACTIVE' ? 'pi pi-check' : 'pi pi-ban', text: true, rounded: true, severity: data.status === 'INACTIVE' ? 'success' : 'danger', onClick: () => emit('toggle', props.kind, data), ariaLabel: 'Toggle status' })
        ]) })
      ]
    })
  }
})

const MonitoringView = defineComponent({
  props: { rows: Array, columns: Array },
  setup(props) {
    return () => h(DataTable, { value: props.rows, paginator: true, rows: 10, responsiveLayout: 'scroll', class: 'surface-table readonly-table' }, {
      empty: () => h('div', { class: 'empty-state' }, 'No monitoring records found.'),
      default: () => props.columns.map(([field, header]) => h(Column, { field, header, sortable: true }, field === 'status' ? { body: ({ data }) => h(StatusTag, { value: data.status }) } : undefined))
    })
  }
})

const AuditLogsView = defineComponent({
  props: { rows: Array },
  setup(props) {
    const moduleFilter = ref('All')
    const actionFilter = ref('All')
    const modules = computed(() => ['All', ...new Set(props.rows.map((row) => row.module).filter(Boolean))])
    const actions = computed(() => ['All', ...new Set(props.rows.map((row) => row.action).filter(Boolean))])
    const rows = computed(() => props.rows.filter((row) => (moduleFilter.value === 'All' || row.module === moduleFilter.value) && (actionFilter.value === 'All' || row.action === actionFilter.value)))
    return () => h('div', [
      h('div', { class: 'filter-bar' }, [
        h(Select, { modelValue: moduleFilter.value, 'onUpdate:modelValue': (v) => moduleFilter.value = v, options: modules.value }),
        h(Select, { modelValue: actionFilter.value, 'onUpdate:modelValue': (v) => actionFilter.value = v, options: actions.value })
      ]),
      h(DataTable, { value: rows.value, paginator: true, rows: 10, responsiveLayout: 'scroll', class: 'surface-table' }, {
        empty: () => h('div', { class: 'empty-state' }, 'No audit logs found.'),
        default: () => [
          h(Column, { field: 'dateTime', header: 'Date/Time', sortable: true }),
          h(Column, { field: 'user', header: 'User', sortable: true }),
          h(Column, { field: 'role', header: 'Role', sortable: true }),
          h(Column, { field: 'action', header: 'Action', sortable: true }),
          h(Column, { field: 'module', header: 'Module', sortable: true }),
          h(Column, { field: 'record', header: 'Record' }),
          h(Column, { field: 'description', header: 'Description' })
        ]
      })
    ])
  }
})

const LoginHistoryView = defineComponent({
  props: { rows: Array },
  setup(props) {
    return () => h(DataTable, { value: props.rows, paginator: true, rows: 10, responsiveLayout: 'scroll', class: 'surface-table' }, {
      empty: () => h('div', { class: 'empty-state' }, 'No login history found.'),
      default: () => [
        h(Column, { field: 'user', header: 'User', sortable: true }),
        h(Column, { field: 'username', header: 'Username', sortable: true }),
        h(Column, { field: 'dateTime', header: 'Date/Time', sortable: true }),
        h(Column, { field: 'device', header: 'Device' }),
        h(Column, { field: 'browser', header: 'Browser' }),
        h(Column, { field: 'ipAddress', header: 'IP Address' }),
        h(Column, { field: 'status', header: 'Status' }, { body: ({ data }) => h(StatusTag, { value: data.status }) })
      ]
    })
  }
})

const NotificationsView = defineComponent({
  props: { rows: Array },
  setup(props) {
    return () => h(DataTable, { value: props.rows, paginator: true, rows: 10, responsiveLayout: 'scroll', class: 'surface-table' }, {
      empty: () => h('div', { class: 'empty-state' }, 'No notifications found.'),
      default: () => [
        h(Column, { field: 'date', header: 'Date/Time', sortable: true }),
        h(Column, { field: 'title', header: 'Title', sortable: true }),
        h(Column, { field: 'message', header: 'Message' }),
        h(Column, { field: 'type', header: 'Type' }),
        h(Column, { field: 'status', header: 'Status' }, { body: ({ data }) => h(StatusTag, { value: data.status }) })
      ]
    })
  }
})

const ReportsView = defineComponent({
  props: { state: Object, routeName: String },
  setup(props) {
    const reports = [
      ['Monthly Revenue', money(props.state.payments.reduce((sum, row) => sum + Number(row.amount?.replace?.(/[^\d.-]/g, '') || 0), 0)), 'Financial'],
      ['Outstanding Balances', props.state.billings.filter((row) => row.status !== 'PAID').length, 'Financial'],
      ['Stall Occupancy', `${props.state.stalls.filter((s) => s.status === 'OCCUPIED').length}/${props.state.stalls.length}`, 'Market'],
      ['Vacant Stalls', props.state.stalls.filter((s) => s.status === 'VACANT').length, 'Market'],
      ['New Applications', props.state.applications.length, 'Stakeholder'],
      ['Verified Stakeholders', props.state.stakeholders.filter((s) => s.verification === 'VERIFIED').length, 'Stakeholder'],
      ['User Activity', props.state.auditLogs.length, 'System'],
      ['Login Activity', props.state.loginHistory.length, 'System']
    ]

    return () => h('div', { class: 'report-grid' }, reports.map(([title, value, group]) =>
      h(Card, null, {
        title: () => title,
        content: () => h('div', { class: 'report-card-body' }, [
          h('small', group),
          h('strong', value),
          h('div', { class: 'table-actions' }, [
            h(Button, { label: 'View Report', icon: 'pi pi-eye', size: 'small', outlined: true }),
            h(Button, { label: 'Print', icon: 'pi pi-print', size: 'small', text: true })
          ])
        ])
      })
    ))
  }
})

const StallMapView = defineComponent({
  props: { rows: Array },
  emits: ['edit'],
  setup(props, { emit }) {
    const selected = ref(null)

    return () => h('div', { class: 'stall-map-layout' }, [
      h('div', { class: 'stall-map-grid' }, props.rows.length ? props.rows.map((stall) =>
        h('button', {
          class: `stall-tile status-${String(stall.status).toLowerCase()}`,
          onClick: () => selected.value = stall
        }, [
          h('strong', stall.stallNo || 'Stall'),
          h('span', stall.section),
          h(StatusTag, { value: stall.status })
        ])
      ) : h('div', { class: 'empty-state' }, 'No stalls available for the map.')),
      selected.value
        ? h(Card, { class: 'stall-detail-card' }, {
          title: () => `Stall ${selected.value.stallNo}`,
          content: () => h('div', { class: 'detail-list' }, [
            ['Section', selected.value.section],
            ['Stall Type', selected.value.stallType],
            ['Dimensions', selected.value.dimensions],
            ['Rental Rate', money(selected.value.monthlyRent)],
            ['Status', selected.value.status],
            ['Current Occupant', selected.value.currentOccupant || selected.value.occupantName || 'No occupant'],
            ['Contract Number', selected.value.contractNo || 'No contract']
          ].map(([label, value]) => h('div', [h('span', label), h('strong', value)])).concat([
            h(Button, { label: 'Edit Stall', icon: 'pi pi-pencil', onClick: () => emit('edit', selected.value) })
          ]))
        })
        : null
    ])
  }
})

const SettingsView = defineComponent({
  props: { modelValue: Object, saving: Boolean },
  emits: ['update:modelValue', 'save'],
  setup(props, { emit }) {
    function update(key, value) {
      emit('update:modelValue', { ...props.modelValue, [key]: value })
    }
    const sections = [
      ['General', [['systemName', 'System Name'], ['municipality', 'Municipality'], ['office', 'Office'], ['contact', 'Contact Number'], ['emailAddress', 'Email Address']]],
      ['Rental', [['billingFrequency', 'Billing Frequency'], ['advancePaymentPeriod', 'Advance Payment Period'], ['gracePeriod', 'Grace Period'], ['currency', 'Currency']]],
      ['Notifications', [['applicationNotifications', 'Application Notifications', 'toggle'], ['paymentNotifications', 'Payment Notifications', 'toggle'], ['billingReminders', 'Billing Reminders', 'toggle'], ['contractExpirationAlerts', 'Contract Expiration Alerts', 'toggle']]]
    ]
    return () => h('div', { class: 'settings-grid' }, [
      ...sections.map(([title, fields]) => h(Card, null, {
        title: () => title,
        content: () => h('div', { class: 'form-grid one' }, fields.map(([key, label, type]) => h('label', [
          h('span', label),
          type === 'toggle'
            ? h(ToggleSwitch, { modelValue: props.modelValue[key], 'onUpdate:modelValue': (v) => update(key, v) })
            : h(InputText, { modelValue: props.modelValue[key], 'onUpdate:modelValue': (v) => update(key, v) })
        ])))
      })),
      h('div', { class: 'settings-actions' }, [h(Button, { label: 'Save Settings', icon: 'pi pi-save', loading: props.saving, onClick: () => emit('save') })])
    ])
  }
})

const ProfileView = defineComponent({
  setup() {
    const name = localStorage.getItem('name') || localStorage.getItem('username') || 'System Administrator'
    const username = localStorage.getItem('username') || localStorage.getItem('userId') || ''
    const email = localStorage.getItem('email') || ''
    const contact = localStorage.getItem('contact') || ''
    const role = localStorage.getItem('role') || 'ADMIN'

    return () => h(Card, null, {
      title: () => 'My Profile',
      content: () => h('div', { class: 'profile-panel' }, [
        h('div', { class: 'profile-avatar' }, name.slice(0, 2).toUpperCase()),
        h('div', { class: 'detail-list' }, [
          ['Full Name', name],
          ['Username', username || 'Not available'],
          ['Email', email || 'Not available'],
          ['Contact', contact || 'Not available'],
          ['Role', role],
          ['Account Created', 'Available when provided by the backend'],
          ['Last Login', 'Available when provided by the backend']
        ].map(([label, value]) => h('div', [h('span', label), h('strong', value)]))),
        h('div', { class: 'table-actions' }, [
          h(Button, { label: 'Edit Profile', icon: 'pi pi-user-edit', outlined: true }),
          h(Button, { label: 'Change Password', icon: 'pi pi-key', severity: 'secondary', outlined: true })
        ]),
        h('p', { class: 'text-slate-500' }, 'Sensitive credentials, environment variables, JWT secrets, and database passwords are intentionally not exposed.')
      ])
    })
  }
})
</script>

<style scoped>
.admin-page {
  max-width: 1480px;
  margin: 0 auto;
  padding: calc(var(--header-height, 64px) + 24px) 24px 40px;
  padding-left: calc(var(--sidebar-width, 300px) + 24px);
  transition: padding-left 0.3s ease;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  color: #0f172a;
  font-size: 1.875rem;
  font-weight: 800;
  letter-spacing: 0;
}

.title-icon,
.metric-icon {
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #eff6ff;
  color: #2563eb;
}

.title-icon {
  width: 48px;
  height: 48px;
}

.page-subtitle {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.header-actions,
.table-actions,
.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.admin-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 280px;
  padding-left: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.85);
}

.search-wrap :deep(.p-inputtext) {
  width: 100%;
  border: 0 !important;
  box-shadow: none;
}

.state-card,
.empty-state {
  display: grid;
  place-items: center;
  gap: 0.75rem;
  min-height: 220px;
  color: #64748b;
  text-align: center;
}

.metric-grid,
.report-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.metric-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-label {
  display: block;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.metric-value {
  display: block;
  margin-top: 0.4rem;
  color: #0f172a;
  font-size: 1.75rem;
  font-weight: 900;
}

.metric-icon {
  width: 46px;
  height: 46px;
}

.tone-green .metric-icon { background: #dcfce7; color: #16a34a; }
.tone-yellow .metric-icon { background: #fef3c7; color: #d97706; }
.tone-red .metric-icon { background: #ffe4e6; color: #e11d48; }
.tone-gray .metric-icon { background: #f1f5f9; color: #64748b; }

.chart-box {
  height: 320px;
}

.activity-list {
  display: grid;
  gap: 0.75rem;
}

.activity-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: start;
  padding: 0.85rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #f8fafc;
}

.activity-row p {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.85rem;
}

.activity-dot {
  width: 10px;
  height: 10px;
  margin-top: 0.35rem;
  border-radius: 999px;
  background: #2563eb;
}

.permission-wrap,
.settings-grid {
  display: grid;
  gap: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.form-grid.one {
  grid-template-columns: 1fr;
}

.form-grid label {
  display: grid;
  gap: 0.4rem;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 700;
}

.full {
  grid-column: 1 / -1;
}

.surface-table {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: white;
}

.readonly-table :deep(.p-button) {
  display: none;
}

.stall-map-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 1rem;
}

.stall-map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.stall-tile {
  display: grid;
  gap: 0.5rem;
  min-height: 118px;
  padding: 1rem;
  text-align: left;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: white;
}

.stall-detail-card {
  align-self: start;
}

.detail-list {
  display: grid;
  gap: 0.75rem;
}

.detail-list div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.55rem;
  border-bottom: 1px solid var(--border);
}

.detail-list span,
.report-card-body small {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.report-card-body {
  display: grid;
  gap: 0.75rem;
}

.report-card-body strong {
  color: #0f172a;
  font-size: 1.5rem;
}

.profile-panel {
  display: grid;
  gap: 1rem;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #0f766e);
  font-size: 1.35rem;
  font-weight: 900;
}

.status-occupied { border-color: #86efac; background: #f0fdf4; }
.status-vacant { border-color: #bfdbfe; background: #eff6ff; }
.status-reserved,
.status-maintenance { border-color: #fde68a; background: #fffbeb; }
.status-inactive { border-color: #cbd5e1; background: #f8fafc; }

.settings-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1000px) {
  .admin-page {
    padding-left: 24px;
  }

  .page-header,
  .header-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .metric-grid,
  .report-grid,
  .stall-map-layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .metric-grid,
  .report-grid,
  .form-grid,
  .stall-map-layout {
    grid-template-columns: 1fr;
  }
}
</style>
