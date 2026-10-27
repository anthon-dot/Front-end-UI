<template>
  <div class="w-full bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
    
    <!-- Top Summary Banner -->
    <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 sm:p-6 border-b border-slate-800">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5 flex-wrap">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <FileText class="w-3.5 h-3.5" />
              {{ application.application_number || 'Pending submission' }}
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase" :class="statusBadgeClass">
              {{ currentStatusLabel }}
            </span>
          </div>

          <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Stall Application Status:</span>
            <span class="text-emerald-400">{{ stallDisplay }}</span>
          </h2>

          <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {{ currentStatusDescription }}
          </p>
        </div>

        <!-- Quick Access Actions -->
        <div class="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all shadow-xs"
            @click="$emit('open-dossier', 'ALL')"
          >
            <FolderOpen class="w-4 h-4 text-emerald-400" />
            <span>Open Complete Dossier</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            @click="$emit('open-dossier', activeActionDocTab)"
          >
            <Printer class="w-4 h-4" />
            <span>{{ primaryActionButtonText }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Stepper Milestones Container -->
    <div class="p-4 sm:p-6 lg:p-8 bg-slate-50/50">
      <div class="max-w-4xl mx-auto space-y-6">
        
        <div 
          v-for="(step, index) in steps" 
          :key="step.id"
          class="relative flex items-start gap-4 sm:gap-6 group"
        >
          <!-- Connecting Vertical Line -->
          <div 
            v-if="index < steps.length - 1"
            class="absolute left-5 sm:left-6 top-10 bottom-0 w-0.5 -ml-[1px]"
            :class="step.isCompleted ? 'bg-emerald-500' : 'bg-slate-200'"
          ></div>

          <!-- Step Circle Icon -->
          <div 
            class="relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs transition-all duration-300"
            :class="[
              step.isCompleted ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 
              step.isInProgress ? 'bg-amber-500 text-white ring-4 ring-amber-500/20 shadow-amber-500/30 animate-pulse' : 
              step.isRejected ? 'bg-red-600 text-white ring-4 ring-red-500/20' : 
              'bg-white text-slate-400 border-2 border-slate-200'
            ]"
          >
            <Check v-if="step.isCompleted" class="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            <AlertCircle v-else-if="step.isRejected" class="w-5 h-5 sm:w-6 sm:h-6" />
            <component :is="step.icon" v-else class="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <!-- Step Content Card -->
          <div 
            class="flex-1 bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-xs"
            :class="[
              step.isInProgress ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-300/50' : 
              step.isCompleted ? 'border-emerald-200/80 bg-emerald-50/10' : 
              step.isRejected ? 'border-red-300 bg-red-50/20' : 
              'border-slate-200/80 opacity-80'
            ]"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div class="flex items-center gap-2.5">
                <span class="text-xs font-mono font-bold text-slate-400">Step {{ index + 1 }}</span>
                <h3 class="text-sm sm:text-base font-bold text-slate-900 tracking-tight">{{ step.title }}</h3>
              </div>

              <!-- Status Badge -->
              <div>
                <span 
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="[
                    step.isCompleted ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 
                    step.isInProgress ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' : 
                    step.isRejected ? 'bg-red-100 text-red-800 border border-red-300' : 
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  ]"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="step.isCompleted ? 'bg-emerald-600' : step.isInProgress ? 'bg-amber-600' : step.isRejected ? 'bg-red-600' : 'bg-slate-400'"></span>
                  {{ step.statusBadge }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
              {{ step.description }}
            </p>

            <!-- Dynamic Specific Details & Meta Tags -->
            <div v-if="step.metaDetails" class="bg-slate-50 rounded-xl p-3 border border-slate-200/80 mb-3 text-xs space-y-1.5">
              <div v-for="(val, label) in step.metaDetails" :key="label" class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span class="font-semibold text-slate-600">{{ label }}:</span>
                <span class="font-bold text-slate-900">{{ val }}</span>
              </div>
            </div>

            <!-- Action Prompt / Instruction Alert for Applicant -->
            <div v-if="step.actionPrompt" class="flex items-start gap-2.5 p-3 rounded-xl mb-3 text-xs leading-relaxed" :class="step.actionPromptClass">
              <Info class="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong class="font-bold block mb-0.5">{{ step.actionPromptTitle }}</strong>
                <span>{{ step.actionPrompt }}</span>
              </div>
            </div>

            <!-- Contextual Action Buttons -->
            <div v-if="step.actions && step.actions.length" class="flex items-center gap-2 pt-1 flex-wrap">
              <button
                v-for="action in step.actions"
                :key="action.label"
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-xs"
                :class="action.isPrimary ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'"
                @click="handleActionClick(action)"
              >
                <component :is="action.icon" class="w-3.5 h-3.5" />
                <span>{{ action.label }}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Official Physical Wet-Signing Explainer Footer -->
    <div class="bg-slate-100 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
      <div class="flex items-center gap-2">
        <ShieldCheck class="w-4 h-4 text-emerald-600 shrink-0" />
        <span><strong>Municipal Policy:</strong> Bilateral physical wet-ink signing is strictly enforced. No digital pad signatures or electronic certificates required.</span>
      </div>
      <div class="text-[11px] font-mono text-slate-500">
        Local Government Unit of Manticao • Public Market Enterprise
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  FileText,
  Check,
  AlertCircle,
  FolderOpen,
  Printer,
  Info,
  ShieldCheck,
  Building,
  CreditCard,
  Lock,
  PenTool,
  Award
} from 'lucide-vue-next'
import type { Application, Profile, Stall, MunicipalOfficial, AppStepStatus } from '../../types/market-rental'

const props = withDefaults(
  defineProps<{
    application: Partial<Application>
    applicant?: Partial<Profile>
    stall?: Partial<Stall>
    mayorOfficial?: Partial<MunicipalOfficial>
  }>(),
  {
    application: () => ({}),
    applicant: () => ({}),
    stall: () => ({}),
    mayorOfficial: () => ({})
  }
)

const emit = defineEmits<{
  (e: 'open-dossier', tab: 'ALL' | 'APPLICATION' | 'LOI' | 'CONTRACT'): void
  (e: 'refresh'): void
}>()

const status = computed<AppStepStatus>(() => {
  const raw = String(props.application?.current_status || props.application?.status || 'APPLICATION_SUBMITTED')
  const canonical: Record<string, AppStepStatus> = {
    SUBMITTED: 'APPLICATION_SUBMITTED',
    APPROVED_PENDING_ADVANCE_PAYMENT: 'MAYOR_APPROVED',
    ADVANCE_PAID: 'INITIAL_FEES_PAID',
    CONTRACT_PREPARED: 'CONTRACT_GENERATED',
    FEES_CLEARED: 'LEASE_ACTIVE',
    ACTIVE_OCCUPANT: 'LEASE_ACTIVE',
    MAYOR_REJECTED: 'MAYOR_DISAPPROVED'
  }
  return (canonical[raw] || raw) as AppStepStatus
})

const stallDisplay = computed(() => {
  const stall = props.stall || props.application?.selected_stall
  if (!stall) return 'Stall Pending Assignment'
  return `Stall #${stall.stall_number} (${stall.section_name})`
})

const currentStatusLabel = computed(() => {
  const s = status.value
  switch (s) {
    case 'APPLICATION_SUBMITTED': return 'Step 1 & 2: Application Filed'
    case 'MAYOR_REVIEW': return 'Step 3: Under Mayoral Review'
    case 'MAYOR_APPROVED': return 'Step 3: Mayoral Endorsement Approved'
    case 'MAYOR_DISAPPROVED': return 'Application Disapproved'
    case 'TREASURY_ASSESSED': return 'Step 4: Treasury Assessed'
    case 'INITIAL_FEES_PAID': return 'Step 4: Initial Fees Paid'
    case 'STALL_OFFICIALLY_ASSIGNED': return 'Step 5: Stall Officially Assigned'
    case 'CONTRACT_GENERATED': return 'Step 6: Ready for Physical Signing'
    case 'LEASE_ACTIVE': return 'Step 7 & 8: Lease Activated & Occupied'
    default: return s
  }
})

const statusBadgeClass = computed(() => {
  const s = status.value
  if (s === 'LEASE_ACTIVE') return 'bg-emerald-500 text-white'
  if (s === 'MAYOR_DISAPPROVED') return 'bg-red-500 text-white'
  if (['MAYOR_REVIEW', 'TREASURY_ASSESSED', 'CONTRACT_GENERATED'].includes(s)) return 'bg-amber-500 text-slate-950'
  return 'bg-blue-500 text-white'
})

const currentStatusDescription = computed(() => {
  const s = status.value
  switch (s) {
    case 'APPLICATION_SUBMITTED':
      return 'Your digital unified form has been submitted and mirrored. Print the official Letter of Intent (LOI) and submit it to the Office of the Municipal Mayor.'
    case 'MAYOR_REVIEW':
      return 'The Office of the Municipal Mayor is evaluating your Letter of Intent and stall request.'
    case 'MAYOR_APPROVED':
      return 'The Municipal Mayor has endorsed your stall application. Please proceed to the Municipal Treasury for assessment.'
    case 'MAYOR_DISAPPROVED':
      return 'Your application was not approved by the Municipal Mayor. Your designated stall has been released.'
    case 'TREASURY_ASSESSED':
      return 'Treasury assessment is ready. Please proceed to the Treasury Office with your cash payment for Stall Rights Fee and 2-Month Advance Deposit.'
    case 'INITIAL_FEES_PAID':
      return 'Initial fees confirmed and receipted. Market Supervisor will now conduct final boundary inspection and lock the stall.'
    case 'STALL_OFFICIALLY_ASSIGNED':
      return 'Market Supervisor has confirmed compliance and officially locked the stall in your name.'
    case 'CONTRACT_GENERATED':
      return 'Your official 12-page legal Contract of Lease has been compiled. Download, print, physically wet-sign, and present to the Market Office.'
    case 'LEASE_ACTIVE':
      return 'Congratulations! All statutory requirements verified. Your 5-year lease is officially active and stall handover is complete.'
    default:
      return 'Follow each milestone step to complete your municipal market lease onboarding.'
  }
})

const primaryActionButtonText = computed(() => {
  const s = status.value
  if (s === 'APPLICATION_SUBMITTED' || s === 'MAYOR_REVIEW') return 'Download Print-Ready LOI'
  if (s === 'CONTRACT_GENERATED') return 'Download Contract of Lease (12p)'
  if (s === 'LEASE_ACTIVE') return 'View Active Lease Dossier'
  return 'Print / View Official Documents'
})

const activeActionDocTab = computed<'ALL' | 'APPLICATION' | 'LOI' | 'CONTRACT'>(() => {
  const s = status.value
  if (s === 'APPLICATION_SUBMITTED' || s === 'MAYOR_REVIEW') return 'LOI'
  if (s === 'CONTRACT_GENERATED' || s === 'LEASE_ACTIVE') return 'CONTRACT'
  return 'APPLICATION'
})

// Milestone Step Calculations
const steps = computed(() => {
  const s = status.value
  const app = props.application
  const stall = props.stall || app?.selected_stall

  return [
    // 1. Application & LOI Submitted
    {
      id: 1,
      title: 'Unified Application & LOI Submission',
      icon: FileText,
      isCompleted: true,
      isInProgress: false,
      isRejected: false,
      statusBadge: 'Completed',
      description: 'Unified application completed with single government ID presented. The dynamic Letter of Intent (LOI) addressed to Hon. Mayor Stephen S. Tan has been prepared.',
      metaDetails: {
        'Tracking Reference': app?.application_number || 'Pending submission',
        'Stall Applied': stall?.stall_number ? `Stall #${stall.stall_number} (${stall.section_name})` : 'Assigned Stall',
        'Government ID': `${app?.valid_id_type || 'ID'} (No: ${app?.valid_id_number || 'N/A'})`
      },
      actionPromptTitle: 'Next Action Required:',
      actionPrompt: 'Download and print the Letter of Intent (LOI). Affix your physical wet signature and submit it to the Office of the Municipal Mayor.',
      actionPromptClass: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
      actions: [
        { label: 'Download Print-Ready LOI', icon: Printer, isPrimary: true, tab: 'LOI' },
        { label: 'View Unified Form (5p)', icon: FileText, isPrimary: false, tab: 'APPLICATION' }
      ]
    },

    // 2. Mayoral Review & Action
    {
      id: 2,
      title: 'Mayoral Review & Executive Endorsement',
      icon: Building,
      isCompleted: ['MAYOR_APPROVED', 'TREASURY_ASSESSED', 'INITIAL_FEES_PAID', 'STALL_OFFICIALLY_ASSIGNED', 'CONTRACT_GENERATED', 'LEASE_ACTIVE'].includes(s),
      isInProgress: ['APPLICATION_SUBMITTED', 'MAYOR_REVIEW'].includes(s),
      isRejected: s === 'MAYOR_DISAPPROVED',
      statusBadge: s === 'MAYOR_DISAPPROVED' ? 'Disapproved' : (['MAYOR_APPROVED', 'TREASURY_ASSESSED', 'INITIAL_FEES_PAID', 'STALL_OFFICIALLY_ASSIGNED', 'CONTRACT_GENERATED', 'LEASE_ACTIVE'].includes(s) ? 'Approved' : 'In Review'),
      description: 'The Local Chief Executive reviews the physical LOI, commodity appropriateness, and municipal economic enterprise regulations.',
      metaDetails: app?.mayor_decision_ref_no ? {
        'Executive Decision': 'APPROVED',
        'Endorsement Ref No': app.mayor_decision_ref_no,
        'Action Date': formatDate(app.mayor_decision_date)
      } : undefined,
      actionPromptTitle: s === 'APPLICATION_SUBMITTED' ? 'Mayor’s Office Action:' : undefined,
      actionPrompt: s === 'APPLICATION_SUBMITTED' ? 'Once your printed LOI is physically received, authorized municipal staff will record the Mayor’s decision here.' : undefined,
      actionPromptClass: 'bg-amber-50 text-amber-900 border border-amber-200'
    },

    // 3. Treasury Assessment & Payment
    {
      id: 3,
      title: 'Treasury Assessment & Initial Fees Remittance',
      icon: CreditCard,
      isCompleted: ['INITIAL_FEES_PAID', 'STALL_OFFICIALLY_ASSIGNED', 'CONTRACT_GENERATED', 'LEASE_ACTIVE'].includes(s),
      isInProgress: ['MAYOR_APPROVED', 'TREASURY_ASSESSED'].includes(s),
      isRejected: false,
      statusBadge: ['INITIAL_FEES_PAID', 'STALL_OFFICIALLY_ASSIGNED', 'CONTRACT_GENERATED', 'LEASE_ACTIVE'].includes(s) ? 'Fees Paid & Receipted' : (['MAYOR_APPROVED', 'TREASURY_ASSESSED'].includes(s) ? 'Payment Required' : 'Pending'),
      description: 'Remit the non-refundable Stall Rights Fee (₱5,000 for Regular / ₱7,000 for Corner) plus the mandatory segregated Two-Month Advance Rent Deposit.',
      metaDetails: {
        'Stall Rights Fee': `PHP ${formatCurrency(stall?.stall_rights_fee || 0)}`,
        'Segregated 2-Mo Deposit': `PHP ${formatCurrency((stall?.monthly_rental_rate || 0) * 2)}`,
        ...(app?.treasury_or_number ? {
          'Official Receipt No': app.treasury_or_number,
          'Payment Date': formatDate(app.treasury_payment_date),
          'Advance Deposit Held': `PHP ${formatCurrency(app.advance_rent_paid)}`
        } : {})
      },
      actionPromptTitle: ['MAYOR_APPROVED', 'TREASURY_ASSESSED'].includes(s) ? 'Treasury Action Required:' : undefined,
      actionPrompt: ['MAYOR_APPROVED', 'TREASURY_ASSESSED'].includes(s) ? 'Proceed in person to the Municipal Treasury window with your payment. Cashier will issue an Official Receipt (OR) to unlock stall assignment.' : undefined,
      actionPromptClass: 'bg-amber-50 text-amber-900 border border-amber-200'
    },

    // 4. Market Supervisor Stall Verification & Lock
    {
      id: 4,
      title: 'Market Supervisor Stall Inspection & Assignment',
      icon: Lock,
      isCompleted: ['STALL_OFFICIALLY_ASSIGNED', 'CONTRACT_GENERATED', 'LEASE_ACTIVE'].includes(s),
      isInProgress: s === 'INITIAL_FEES_PAID',
      isRejected: false,
      statusBadge: ['STALL_OFFICIALLY_ASSIGNED', 'CONTRACT_GENERATED', 'LEASE_ACTIVE'].includes(s) ? 'Officially Assigned' : (s === 'INITIAL_FEES_PAID' ? 'Verification In Progress' : 'Pending'),
      description: 'The Market Supervisor inspects physical boundaries, sanitation clearances, and locks the stall status to ASSIGNED.',
      metaDetails: app?.market_evaluated_at ? {
        'Inspected By': 'Market Supervisor (Mr. Edgar Eyana / Catherine M. Ibarrat)',
        'Evaluation Date': formatDate(app.market_evaluated_at),
        'Status': 'ASSIGNED (Exclusive Hold)'
      } : undefined
    },

    // 5. Contract Preparation & Physical Wet-Signing
    {
      id: 5,
      title: 'Contract Preparation & Physical Wet-Signing',
      icon: PenTool,
      isCompleted: ['LEASE_ACTIVE'].includes(s) || !!app?.physical_contract_verified_at,
      isInProgress: s === 'CONTRACT_GENERATED' || s === 'STALL_OFFICIALLY_ASSIGNED',
      isRejected: false,
      statusBadge: ['LEASE_ACTIVE'].includes(s) || !!app?.physical_contract_verified_at ? 'Wet-Signatures Verified' : (s === 'CONTRACT_GENERATED' ? 'Ready to Wet-Sign' : 'Pending'),
      description: 'The complete 12-page legal Contract of Lease under Municipal Ordinance No. 01, S. 2018 is compiled. Both parties sign physically using ink.',
      metaDetails: {
        'Contract Number': app?.contract_number || 'CNT-2026-GENERATED',
        'Lease Term': '5 Years (Renewable)',
        'Monthly Rental': `PHP ${formatCurrency(stall?.monthly_rental_rate || 0)} / mo`,
        ...(app?.physical_contract_verified_at ? {
          'Bilateral Wet-Signature': 'Verified by Market Administration'
        } : {})
      },
      actionPromptTitle: s === 'CONTRACT_GENERATED' ? 'Physical Signing Instructions:' : undefined,
      actionPrompt: s === 'CONTRACT_GENERATED' ? 'Download and print all 12 pages of the Contract of Lease. Sign on Page 11 and each page margin with a pen, then bring it to the Market Office for verification.' : undefined,
      actionPromptClass: 'bg-amber-50 text-amber-900 border border-amber-200',
      actions: [
        { label: 'Download Contract of Lease (12 Pages)', icon: Printer, isPrimary: true, tab: 'CONTRACT' }
      ]
    },

    // 6. Lease Activated & Stall Handover
    {
      id: 6,
      title: 'Automated Activation & Occupant Verification',
      icon: Award,
      isCompleted: s === 'LEASE_ACTIVE',
      isInProgress: false,
      isRejected: false,
      statusBadge: s === 'LEASE_ACTIVE' ? 'Active & Operational' : 'Pending Activation',
      description: 'Final automated activation. The stall status is updated to OCCUPIED and the applicant is recorded as the authorized occupant.',
      metaDetails: s === 'LEASE_ACTIVE' ? {
        'Tenancy Status': 'ACTIVE LESSEE',
        'Effective Start': formatDate(app?.contract_start_date),
        'Contract Expiration': formatDate(app?.contract_end_date),
        'Stall Operational Status': 'OCCUPIED'
      } : undefined
    }
  ]
})

function handleActionClick(action: { tab?: string }) {
  if (action.tab) {
    emit('open-dossier', action.tab as 'ALL' | 'APPLICATION' | 'LOI' | 'CONTRACT')
  }
}

function formatDate(dateVal?: string | Date | null): string {
  if (!dateVal) return '—'
  const d = new Date(dateVal)
  if (isNaN(d.getTime())) return String(dateVal)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatCurrency(val?: number | string | null): string {
  const n = Number(val || 0)
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>
