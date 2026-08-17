import { createRouter, createWebHistory } from "vue-router"
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
    meta: { roles: ['ADMIN', 'TREASURER', 'SUPERVISOR', 'MARKET_SUPERVISOR', 'MARKETSUPERVISOR'] }
  }
  ,
  {
    path: "/supervisor/contracts",
    name: "MSContracts",
    component: () => import("../MarketSupervisor/contract.vue"),
    meta: { roles: ['ADMIN', 'TREASURER', 'SUPERVISOR', 'MARKET_SUPERVISOR', 'MARKETSUPERVISOR'] }
  }
  ,
  {
    path: "/supervisor/stalls",
    name: "MSStalls",
    component: () => import("../MarketSupervisor/StallManagement.vue"),
    meta: { roles: ['ADMIN', 'TREASURER', 'SUPERVISOR', 'MARKET_SUPERVISOR', 'MARKETSUPERVISOR'] }
  }
  ,
  {
    path: "/supervisor/archive",
    name: "MSArchive",
    component: () => import("../MarketSupervisor/archive.vue"),
    meta: { roles: ['ADMIN', 'TREASURER', 'SUPERVISOR', 'MARKET_SUPERVISOR', 'MARKETSUPERVISOR'] }
  }
  ,
  {
    path: "/supervisor/reports",
    name: "MSReports",
    component: () => import("../MarketSupervisor/ReportPage.vue"),
    meta: { roles: ['ADMIN', 'TREASURER'] }
  }
  ,
  {
    path: "/supervisor/contract",
    redirect: { name: 'MSContracts' }
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
    path: '/endorsing',
    name: 'Endorsing',
    component: () => import('../EndorsingOfficeDashboard/EndorsingDashboard.vue'),
    meta: { roles: ['ENDORSING_OFFICE', 'ENDORISING_OFFICE', 'ENDORSINGOFFICE', 'ENDORSING_OFFICER'] }
  },
  {
    path: '/endorsing/approvals',
    name: 'EndorsingApproval',
    component: () => import('../EndorsingOfficeDashboard/EndorsingDashboard.vue'),
    meta: { roles: ['ENDORSING_OFFICE', 'ENDORISING_OFFICE', 'ENDORSINGOFFICE', 'ENDORSING_OFFICER'] }
  },
  {
    path: '/bplo',
    name: 'BPLO',
    component: () => import('../BPLODashboard/BPLODashboard.vue'),
    meta: { roles: ['BPLO_OFFICE', 'BPLOOFFICE', 'BPLO'] }
  },
  {
    path: '/bplo/approvals',
    name: 'BPLOApproval',
    component: () => import('../BPLODashboard/BPLODashboard.vue'),
    meta: { roles: ['BPLO_OFFICE', 'BPLOOFFICE', 'BPLO'] }
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
  ,
  {
    path: "/create-account",
    name: "CreateAccount",
    component: () => import("../views/CreateAccount.vue")
  },
  {
    path: "/unauthorized",
    name: "Unauthorized",
    component: () => import("../views/Unauthorized.vue")
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
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

      const feeReady =
        stakeholder.applicationStatus === 'PENDING_BUSINESS_PERMIT_PAYMENT' ||
        (
          stakeholder.finalEndorsed === true &&
          stakeholder.applicantFeePaid !== true
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
