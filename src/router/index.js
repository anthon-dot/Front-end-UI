import { createRouter, createWebHistory } from "vue-router"
import { ref } from "vue"

export const isNavigating = ref(false)
import {
  isDashboardReady
} from "../services/applicationService"
import { useAuthStore, normalizeWorkflowRole } from "../stores/auth"
import { useStakeholderStore } from "../stores/stakeholder"

const routes = [
  {
    path: "/",
    name: "Landing",
    component: () => import("../views/Landing.vue")
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/Login.vue")
  },
  {
    path: "/create-account",
    name: "CreateAccount",
    component: () => import("../views/CreateAccount.vue")
  },
  {
    path: "/unauthorized",
    name: "Unauthorized",
    component: () => import("../views/Unauthorized.vue")
  },
  {
    path: "/",
    component: () => import("../layout/AppLayout.vue"),
    children: [
      {
        path: "/admin",
        redirect: { name: "AdminDashboard" }
      },
      {
        path: "/admin/dashboard",
        name: "AdminDashboard",
        component: () => import("../Admin/AdminView.vue"),
        meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
      },
  {
    path: "/admin/users",
    name: "AdminUsers",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/roles-permissions",
    redirect: { name: "AdminRoles" }
  },
  {
    path: "/admin/roles",
    name: "AdminRoles",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/login-history",
    name: "AdminLoginHistory",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/stall-map",
    name: "AdminStallMap",
    redirect: { name: "MSStalls", query: { view: "map" } }
  },
  {
    path: "/admin/stalls",
    name: "AdminStalls",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/stall-types",
    name: "AdminStallTypes",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/rental-rates",
    name: "AdminRentalRates",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/applications",
    name: "AdminApplications",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/stakeholders",
    name: "AdminStakeholders",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/contracts",
    name: "AdminContracts",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/payments",
    name: "AdminPayments",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/billing",
    name: "AdminBilling",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/occupancy",
    name: "AdminOccupancy",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/reports/collection",
    name: "AdminCollectionReport",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/reports/liability",
    name: "AdminLiabilityReport",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/reports/revenue",
    name: "AdminRevenueReport",
    redirect: { name: "AdminCollectionReport" }
  },
  {
    path: "/admin/reports/applications",
    name: "AdminApplicationsReport",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/reports/occupancy",
    name: "AdminOccupancyReport",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/reports/system-activity",
    name: "AdminActivityReport",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/reports",
    redirect: { name: "AdminCollectionReport" }
  },
  {
    path: "/admin/audit-logs",
    name: "AdminAuditLogs",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/notifications",
    name: "AdminNotifications",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/settings",
    name: "AdminSettings",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  },
  {
    path: "/admin/profile",
    name: "AdminProfile",
    component: () => import("../Admin/AdminView.vue"),
    meta: { roles: ['ADMIN', 'MARKET_SUPERVISOR', 'SUPERVISOR', 'MARKETSUPERVISOR'] }
  }
  ,
  {
    path: "/treasurer",
    name: "Treasurer",
    component: () => import("../Treasurer/dashboard.vue"),
    meta: { roles: ['ADMIN', 'TREASURER'] }
  }
  ,
  {
    path: "/application-progress",
    name: "ApplicationProgress",
    component: () => import("../views/ApplicationProgress.vue"),
    meta: { roles: ['APPLICANT', 'TENANT', 'STAKEHOLDER'], onboardingRoute: true }
  },
  {
    path: "/applicant-fee",
    name: "ApplicantFee",
    component: () => import("../views/ApplicantFee.vue"),
    meta: { roles: ['APPLICANT', 'TENANT', 'STAKEHOLDER'], onboardingRoute: true }
  },
   {
    path: '/business-application',
    name: 'BusinessApplication',
    component: () => import('../views/BusinessApplication.vue'),
    meta: { roles: ['APPLICANT', 'TENANT', 'STAKEHOLDER'], onboardingRoute: true }
  },
  {
    path: "/treasurer/applicant",
    name: "Applicant",
    component: () => import("../Treasurer/Applicant.vue"),
    meta: { roles: ['ADMIN', 'TREASURER'] }
  }
  ,
  {
    path: "/treasurer/billing",
    name: "Billing",
    component: () => import("../Treasurer/Billing.vue"),
    meta: { roles: ['ADMIN', 'TREASURER'] }
  }
  ,
  {
    path: "/treasurer/payment",
    name: "Payment",
    component: () => import("../Treasurer/Payment.vue"),
    meta: { roles: ['ADMIN', 'TREASURER'] }
  }
  ,
  {
    path: "/treasurer/report",
    name: "Report",
    component: () => import("../Treasurer/Report.vue"),
    meta: { roles: ['ADMIN', 'TREASURER'] }
  }
  ,
  {
    path: "/treasurer/ai-reports",
    name: "AIReports",
    component: () => import("../Treasurer/AIReportsDashboard.vue"),
    meta: { roles: ['ADMIN', 'TREASURER'] }
  }
  ,
  {
    path: "/treasurer/ai-notifications",
    name: "AINotifications",
    component: () => import("../Treasurer/AINotifications.vue"),
    meta: { roles: ['ADMIN', 'TREASURER'] }
  }
  ,
  {
    path: "/supervisor",
    name: "MarketSupervisor",
    component: () => import("../MarketSupervisor/dashboard.vue"),
    meta: { roles: ['ADMIN', 'SUPERVISOR', 'MARKET_SUPERVISOR', 'MARKETSUPERVISOR'] }
  }
  ,
  {
    path: "/supervisor/contracts",
    name: "MSContracts",
    component: () => import("../MarketSupervisor/contract.vue"),
    meta: { roles: ['ADMIN', 'SUPERVISOR', 'MARKET_SUPERVISOR', 'MARKETSUPERVISOR'] }
  }
  ,
  {
    path: "/supervisor/stalls",
    name: "MSStalls",
    component: () => import("../MarketSupervisor/StallManagement.vue"),
    meta: { roles: ['ADMIN', 'SUPERVISOR', 'MARKET_SUPERVISOR', 'MARKETSUPERVISOR'] }
  }
  ,
  {
    path: "/supervisor/archive",
    name: "MSArchive",
    component: () => import("../MarketSupervisor/archive.vue"),
    meta: { roles: ['ADMIN', 'SUPERVISOR', 'MARKET_SUPERVISOR', 'MARKETSUPERVISOR'] }
  }
  ,
  {
    path: "/supervisor/reports",
    name: "MSReports",
    component: () => import("../MarketSupervisor/ReportPage.vue"),
    meta: { roles: ['ADMIN', 'SUPERVISOR', 'MARKET_SUPERVISOR', 'MARKETSUPERVISOR'] }
  }
  ,
  {
    path: "/supervisor/contract",
    redirect: { name: 'MSContracts' }
  },
  {
    path: "/supervisor/map",
    redirect: { name: 'MSStalls', query: { view: 'map' } }
  },
  {
    path: "/supervisor/applications",
    redirect: { name: 'MarketSupervisor', query: { tab: 'applications' } }
  },
  {
    path: "/supervisor/assignments",
    redirect: { name: 'MSStalls', query: { action: 'assign' } }
  },
  {
    path: "/supervisor/occupancy",
    redirect: { name: 'MarketSupervisor', query: { tab: 'occupancy' } }
  },
  {
    path: "/treasurer/advance-credit",
    redirect: { name: 'Billing', query: { tab: 'advance-credit' } }
  },
  {
    path: "/treasurer/applicant-payments",
    redirect: { name: 'Applicant' }
  },
  {
    path: "/treasurer/daily-collections",
    redirect: { name: 'Billing', query: { tab: 'collections' } }
  },
  {
    path: "/treasurer/outstanding",
    redirect: { name: 'Billing', query: { tab: 'outstanding' } }
  },
  {
    path: "/treasurer/overdue",
    redirect: { name: 'Billing', query: { tab: 'overdue' } }
  }
  ,
  {
    path: '/stakeholder',
    name: 'Stakeholder',
    component: () => import('../Stakeholder/dashboard.vue'),
    meta: { roles: ['TENANT', 'STAKEHOLDER'], requiresApprovedApplication: true }
  },
  {
    path: '/stalls',
    name: 'StallList',
    component: () => import('../views/stallList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/mayor',
    name: 'Mayor',
    component: () => import('../Mayor/MayorDashboard.vue'),
    meta: { roles: ['ADMIN', 'MAYOR'] }
  },
  {
    path: '/mayor/approvals',
    name: 'MayorApprovals',
    component: () => import('../Mayor/MayorDashboard.vue'),
    meta: { roles: ['ADMIN', 'MAYOR'] }
  },
  {
    path: '/mayor/revocations',
    name: 'MayorRevocations',
    component: () => import('../Mayor/MayorDashboard.vue'),
    meta: { roles: ['ADMIN', 'MAYOR'] }
  },
  {
    path: '/collector',
    name: 'CollectorInspector',
    component: () => import('../CollectorInspector/CollectorInspectorDashboard.vue'),
    meta: { roles: ['ADMIN', 'COLLECTOR_INSPECTOR'] }
  },
  {
    path: '/inspector',
    redirect: '/collector'
  },
  {
    path: '/collector/remittances',
    redirect: '/collector'
  },
  {
    path: '/inspector/inspections',
    redirect: '/collector'
  },
  {
    path: '/inspector/scan',
    redirect: '/collector'
  },
  {
    path: '/stakeholder/settings',
    name: 'StakeholderSettings',
    component: () => import('../Stakeholder/Settings.vue'),
    meta: { roles: ['TENANT', 'STAKEHOLDER'], requiresApprovedApplication: true }
  },
  {
    path: '/stakeholder/payments',
    name: 'StakeholderPayments',
    component: () => import('../Stakeholder/PaymentHistory.vue'),
    meta: { roles: ['TENANT', 'STAKEHOLDER'], requiresApprovedApplication: true }
  },
  {
    path: '/requirements',
    name: 'Requirements',
    component: () => import('../views/Requirements.vue'),
    meta: { roles: ['APPLICANT', 'TENANT', 'STAKEHOLDER'], onboardingRoute: true }
  },
  {
    path: "/audit-logs",
    name: "AuditLogs",
    component: () => import("../Treasurer/AuditLog.vue"),
    meta: { roles: ['ADMIN', 'TREASURER'] }
  }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const STALE_CHUNK_RELOAD_KEY = 'front-end-ui:stale-chunk-reloaded'

router.onError((error) => {
  isNavigating.value = false
  const message = String(error?.message || error || '')

  const isStaleChunkError =
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module')

  if (!isStaleChunkError) return

  if (sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY)) {
    sessionStorage.removeItem(STALE_CHUNK_RELOAD_KEY)
    return
  }

  sessionStorage.setItem(STALE_CHUNK_RELOAD_KEY, 'true')
  window.location.reload()
})

router.afterEach(() => {
  isNavigating.value = false
  sessionStorage.removeItem(STALE_CHUNK_RELOAD_KEY)
})

router.beforeEach(async (to) => {
  isNavigating.value = true
  const authStore = useAuthStore()
  const stakeholderStore = useStakeholderStore()
  const publicRoutes = ['Landing', 'Login', 'CreateAccount', 'Unauthorized']

  if (publicRoutes.includes(to.name)) {
    return true
  }

  authStore.hydrateFromStorage()

  if (!authStore.isAuthenticated) {
    return { name: 'Login' }
  }

  if (authStore.isTokenExpired) {
    authStore.clearSession()
    stakeholderStore.clearCache()
    return { name: 'Login' }
  }

  const role = authStore.normalizedRole

  const allowedRoles =
    to.meta?.roles?.map(normalizeWorkflowRole)

  if (
    allowedRoles?.length &&
    !allowedRoles.includes(role)
  ) {
    return { name: 'Unauthorized' }
  }

  if (role === 'STAKEHOLDER') {
    const userId = authStore.resolvedUserId

    if (!userId) {
      authStore.clearSession()
      stakeholderStore.clearCache()
      return { name: 'Login' }
    }

    try {
      const stakeholder = await stakeholderStore.ensureStakeholderForUser(userId)

      if (!stakeholder) {
        if (to.name === 'BusinessApplication') {
          return true
        }

        return { name: 'BusinessApplication' }
      }

      authStore.setStakeholderId(stakeholder.id)

      const requirements =
        await stakeholderStore.ensureRequirements(stakeholder.id)

      if (isDashboardReady(stakeholder, requirements)) {
        if (to.name === 'BusinessApplication' || to.name === 'ApplicationProgress' || to.name === 'ApplicantFee') {
          return { name: 'Stakeholder' }
        }

        return true
      }

      const feePaidOrVerified = Boolean(
        stakeholder.applicantFeePaid ||
        stakeholder.applicant_fee_paid ||
        stakeholder.applicationFormPaid ||
        stakeholder.application_form_paid ||
        stakeholder.treasurerPaid ||
        stakeholder.treasurer_paid ||
        stakeholder.verifiedTenant ||
        stakeholder.verified_tenant ||
        stakeholder.verifiedStakeholder ||
        stakeholder.verified_stakeholder ||
        stakeholder.verified
      )

      const feeReady =
        !feePaidOrVerified &&
        (
          stakeholder.applicationStatus === 'PENDING_BUSINESS_PERMIT_PAYMENT' ||
          stakeholder.finalEndorsed === true
        )

      if (feeReady && to.name !== 'ApplicantFee') {
        return { name: 'ApplicantFee' }
      }

      if (to.name === 'ApplicationProgress' || to.name === 'ApplicantFee') {
        return true
      }

      if (to.name === 'BusinessApplication') {
        return { name: 'ApplicationProgress' }
      }

      if (to.meta?.requiresApprovedApplication) {
        if (
          stakeholder.applicationStatus === 'COMPLETED' &&
          stakeholder.applicantFeePaid === true &&
          requirements &&
          !requirements.complete
        ) {
          return { name: 'Requirements' }
        }

        return { name: 'ApplicationProgress' }
      }

      if (to.name === 'Requirements') {
        return true
      }
    } catch (error) {
      if (to.name === 'ApplicationProgress') {
        return true
      }

      return { name: 'ApplicationProgress' }
    }
  }

  return true
})

export default router
