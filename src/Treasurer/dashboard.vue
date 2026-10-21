<template>
  <div class="dashboard min-h-screen bg-slate-50">
    <TreasurerMenu />

    <div class="page-container">
      
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span class="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <i class="pi pi-wallet text-2xl"></i>
            </span>
            Treasurer & Revenue Hub
          </h2>
          <p class="text-sm text-slate-500 mt-1">Municipal Treasury of Manticao &bull; Collections, OR Issuance & Audit Controls</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Button label="Initial Fees Queue" icon="pi pi-check-circle" severity="warning" outlined class="shadow-sm" @click="router.push({ name: 'Applicant' })" />
          <Button label="Daily Remittance" icon="pi pi-send" severity="secondary" outlined class="shadow-sm" @click="router.push({ name: 'Billing' })" />
          <Button label="Record Walk-in Payment" icon="pi pi-plus" class="shadow-sm !bg-emerald-700 !border-emerald-700 hover:!bg-emerald-800" @click="router.push({ name: 'Payment', query: { action: 'record' } })" />
        </div>
      </div>

      <!-- ================= CENTRALIZED VENDOR SEARCH ENGINE ================= -->
      <div class="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 mb-8 text-white shadow-lg relative overflow-hidden">
        <div class="relative z-10 max-w-3xl">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 mb-2">
            <i class="pi pi-search text-xs"></i> CENTRALIZED TREASURY SEARCH ENGINE
          </span>
          <h3 class="text-xl sm:text-2xl font-bold tracking-tight mb-2">Instant Vendor Ledger & OR Lookup</h3>
          <p class="text-xs sm:text-sm text-emerald-100/80 mb-4">
            Search by Vendor Name, Stall Number (e.g. #WS-04), or Official Receipt Number (OR#) to instantly view balance, payment breakdown, and payment history.
          </p>
          <form @submit.prevent="executeVendorSearch" class="flex flex-col sm:flex-row gap-2">
            <div class="relative flex-1">
              <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                v-model="vendorSearchQuery"
                type="text"
                class="w-full pl-10 pr-4 py-3 bg-white text-slate-900 rounded-xl text-sm font-medium placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Enter Vendor Name, Stall # (e.g. 05), or OR Number..."
              />
            </div>
            <button
              type="submit"
              class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Search Records</span>
              <i class="pi pi-arrow-right text-xs"></i>
            </button>
          </form>
        </div>
      </div>

      <!-- ================= HIGH-LEVEL METRICS ================= -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        
        <!-- 1. Total Collections Today -->
        <Card class="bg-gradient-to-br from-emerald-50/70 to-white hover:-translate-y-1 transition-all duration-300 border border-emerald-100 hover:shadow-md cursor-pointer" @click="router.push({ name: 'Payment' })">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">Collections Today</span>
                <h3 class="text-2xl font-black text-emerald-700 mt-2">₱{{ Number(todayTotalAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</h3>
                <span class="text-xs text-slate-500 font-medium">{{ todayCollectionsCount }} transactions logged</span>
              </div>
              <div class="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                <i class="pi pi-calendar-plus text-xl"></i>
              </div>
            </div>
          </template>
        </Card>

        <!-- 2. Pending Initial Fees -->
        <Card class="bg-gradient-to-br from-amber-50/70 to-white hover:-translate-y-1 transition-all duration-300 border border-amber-100 hover:shadow-md cursor-pointer" @click="router.push({ name: 'Applicant' })">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending Initial Fees</span>
                <h3 class="text-2xl font-black text-amber-600 mt-2">{{ pendingInitialFeesCount }}</h3>
                <span class="text-xs text-amber-700 font-medium">Mayor-approved awaiting OR</span>
              </div>
              <div class="p-3 bg-amber-100 text-amber-700 rounded-xl">
                <i class="pi pi-clock text-xl"></i>
              </div>
            </div>
          </template>
        </Card>

        <!-- 3. Overdue Accounts -->
        <Card class="bg-gradient-to-br from-rose-50/70 to-white hover:-translate-y-1 transition-all duration-300 border border-rose-100 hover:shadow-md cursor-pointer" @click="router.push({ name: 'Billing' })">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-rose-800 uppercase tracking-wider">Overdue Accounts</span>
                <h3 class="text-2xl font-black text-rose-600 mt-2">{{ overdueAccountsCount }} Accounts</h3>
                <span class="text-xs text-rose-700 font-medium">₱{{ Number(overdueTotalAmount).toLocaleString() }} in arrears</span>
              </div>
              <div class="p-3 bg-rose-100 text-rose-700 rounded-xl">
                <i class="pi pi-exclamation-circle text-xl"></i>
              </div>
            </div>
          </template>
        </Card>

        <!-- 4. Total Collections YTD -->
        <Card class="bg-gradient-to-br from-indigo-50/70 to-white hover:-translate-y-1 transition-all duration-300 border border-indigo-100 hover:shadow-md cursor-pointer" @click="router.push({ name: 'Report' })">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-indigo-800 uppercase tracking-wider">Total Revenue YTD</span>
                <h3 class="text-2xl font-black text-slate-800 mt-2">{{ money(aiSummary.totalCollected || totalLifetimeCollected) }}</h3>
                <span class="text-xs text-slate-500 font-medium">Occupancy: {{ percent(aiSummary.occupancyRate) }}</span>
              </div>
              <div class="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <i class="pi pi-wallet text-xl"></i>
              </div>
            </div>
          </template>
        </Card>

      </div>

      <!-- ================= CHART + STATUS ================= -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <!-- LINE CHART -->
        <Card class="xl:col-span-2 border border-slate-100 shadow-sm rounded-2xl">
          <template #title>
            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <div class="flex items-center gap-2">
                <span class="p-2 bg-slate-50 text-slate-600 rounded-lg">
                  <i class="pi pi-chart-bar text-sm"></i>
                </span>
                <span class="text-lg font-bold text-slate-800">Revenue Overview</span>
              </div>
              <Select v-model="chartRange" :options="['Last 7 Months', 'This Year']" class="w-40 p-inputtext-sm rounded-lg" />
            </div>
          </template>
          <template #content>
            <div class="h-[340px] w-full pt-4">
              <canvas ref="revenueChart"></canvas>
            </div>
          </template>
        </Card>

        <!-- APPLICATION STATUS -->
        <Card class="border border-slate-100 shadow-sm rounded-2xl">
          <template #title>
            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <div class="flex items-center gap-2">
                <span class="p-2 bg-slate-50 text-slate-600 rounded-lg">
                  <i class="pi pi-clipboard text-sm"></i>
                </span>
                <span class="text-lg font-bold text-slate-800">Application Status</span>
              </div>
              <Button icon="pi pi-ellipsis-v" text rounded aria-label="Options" />
            </div>
          </template>
          <template #content>
            <div class="pt-6">
              <div class="flex justify-between text-sm font-semibold text-slate-600 mb-2">
                <span>Total Received</span>
                <span>1</span>
              </div>
              
              <!-- Progress Bar -->
              <div class="w-full bg-slate-100 rounded-full h-3 mb-8 overflow-hidden flex">
                <div class="bg-emerald-500 h-3" style="width: 0%"></div>
                <div class="bg-yellow-400 h-3" style="width: 100%"></div>
                <div class="bg-red-500 h-3" style="width: 0%"></div>
              </div>

              <!-- Legend -->
              <div class="grid grid-cols-3 gap-4 text-center mb-8">
                <div class="flex flex-col items-center">
                  <div class="w-3 h-3 rounded-full bg-emerald-500 mb-2 shadow-sm shadow-emerald-200"></div>
                  <strong class="text-lg text-slate-800 font-bold">0</strong>
                  <span class="text-xs text-slate-500 font-medium">Approved</span>
                </div>
                <div class="flex flex-col items-center">
                  <div class="w-3 h-3 rounded-full bg-yellow-400 mb-2 shadow-sm shadow-yellow-200"></div>
                  <strong class="text-lg text-slate-800 font-bold">1</strong>
                  <span class="text-xs text-slate-500 font-medium">Pending</span>
                </div>
                <div class="flex flex-col items-center">
                  <div class="w-3 h-3 rounded-full bg-red-500 mb-2 shadow-sm shadow-red-200"></div>
                  <strong class="text-lg text-slate-800 font-bold">0</strong>
                  <span class="text-xs text-slate-500 font-medium">Rejected</span>
                </div>
              </div>

              <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 class="text-3xl font-black text-indigo-600">1</h4>
                  <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Review</span>
                </div>
                <div class="p-3 bg-white rounded-full shadow-sm text-indigo-400 border border-slate-100">
                  <i class="pi pi-file-edit text-xl"></i>
                </div>
              </div>

            </div>
          </template>
        </Card>

      </div>

      <div class="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card
          v-for="insight in aiInsights"
          :key="`${insight.title}-${insight.message}`"
          class="border border-slate-100 shadow-sm rounded-2xl"
        >
          <template #content>
            <div class="flex items-start gap-3">
              <span class="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <i class="pi pi-sparkles"></i>
              </span>
              <div>
                <h4 class="m-0 text-slate-800 font-bold">{{ insight.title }}</h4>
                <p class="m-0 mt-2 text-sm text-slate-500 leading-relaxed">{{ insight.message }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import axios from "axios"
import TreasurerMenu from "../components/TreasurerMenu.vue"
import Card from 'primevue/card'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { getAIReportSummary, getPaymentAnalysis } from '../services/aiReportService'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const revenueChart = ref(null)
const chartRange = ref('Last 7 Months')
const aiSummary = ref({})
const aiPayment = ref({})
let chartInstance = null

const vendorSearchQuery = ref('')

const todayTotalAmount = ref(0)
const todayCollectionsCount = ref(0)
const pendingInitialFeesCount = ref(0)
const overdueAccountsCount = ref(0)
const overdueTotalAmount = ref(0)
const totalLifetimeCollected = ref(0)

function executeVendorSearch() {
  if (!vendorSearchQuery.value.trim()) {
    router.push({ name: 'Payment' })
    return
  }
  router.push({ name: 'Payment', query: { search: vendorSearchQuery.value.trim() } })
}

const aiInsights = computed(() => aiSummary.value.insights || [])

function money(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(Number(value || 0))
}

function percent(value) {
  return `${Number(value || 0).toFixed(2)}%`
}

onMounted(async () => {
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` }

    // Load payments for Collections Today & Lifetime Total
    try {
      const payRes = await axios.get('/api/payments', { headers })
      const payments = payRes.data?.payments || []
      const todayStr = new Date().toISOString().split('T')[0]
      const todayList = payments.filter(p => (p.payment_date || p.created_at || '').startsWith(todayStr))
      todayCollectionsCount.value = todayList.length
      todayTotalAmount.value = todayList.reduce((sum, p) => sum + Number(p.amount || 0), 0)
      totalLifetimeCollected.value = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    } catch (e) {
      console.warn('Error loading payments for dashboard:', e)
    }

    // Load applications for Pending Initial Fees
    try {
      const appRes = await axios.get('/api/applications', { headers })
      const apps = appRes.data?.applications || []
      pendingInitialFeesCount.value = apps.filter(a => a.status === 'MAYOR_APPROVED' || a.status === 'PENDING_INITIAL_FEE').length
    } catch (e) {
      console.warn('Error loading applications for initial fees count:', e)
    }

    // Load delinquency / overdue stats
    try {
      const delinqRes = await axios.get('/api/delinquency/stats', { headers })
      const stats = delinqRes.data?.stats || delinqRes.data || {}
      overdueAccountsCount.value = Number(stats.delinquentCount || stats.totalDelinquent || 0)
      overdueTotalAmount.value = Number(stats.totalOverdueAmount || stats.totalArrears || 0)
    } catch (e) {
      // Fallback: estimate from billings
      try {
        const billRes = await axios.get('/api/billings', { headers })
        const billings = billRes.data?.billings || []
        const overdue = billings.filter(b => b.status === 'OVERDUE' || (b.status !== 'PAID' && new Date(b.due_date) < new Date()))
        overdueAccountsCount.value = overdue.length
        overdueTotalAmount.value = overdue.reduce((sum, b) => sum + Number(b.balance || b.amount || 0), 0)
      } catch (err) {}
    }

    const [summaryResponse, paymentResponse] = await Promise.all([
      getAIReportSummary(),
      getPaymentAnalysis()
    ])

    aiSummary.value = summaryResponse.data
    aiPayment.value = paymentResponse.data

    const Chart = (await import("chart.js/auto")).default
    const trends = aiSummary.value.monthlyTrends || []

    chartInstance = new Chart(revenueChart.value, {
      type: "line",
      data: {
        labels: trends.length ? trends.map((item) => item.label) : ["No data"],
        datasets: [
          {
            label: "Revenue (PHP)",
            data: trends.length ? trends.map((item) => Number(item.amount || 0)) : [0],
            borderColor: "#6366f1", // indigo-500
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#ffffff",
            pointBorderColor: "#6366f1",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              boxWidth: 8,
              color: '#64748b',
              font: {
                family: "'Inter', sans-serif",
                size: 12,
                weight: '500'
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { family: "'Inter', sans-serif", size: 13 },
            bodyFont: { family: "'Inter', sans-serif", size: 14, weight: 'bold' },
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false, drawBorder: false },
            ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif" } }
          },
          y: { 
            beginAtZero: true,
            grid: { color: '#f1f5f9', drawBorder: false, borderDash: [5, 5] },
            ticks: { 
              color: '#94a3b8', 
              font: { family: "'Inter', sans-serif" },
              callback: function(value) {
                return '₱' + value / 1000 + 'k';
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      }
    })
  } catch (err) {
    console.warn("Chart.js not installed")
  }
})

onMounted(() => {
  try {
    const app = document.getElementById('app')
    if (app) app.classList.add('full-bleed')
  } catch (e) {}
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }

  try {
    const app = document.getElementById('app')
    if (app) app.classList.remove('full-bleed')
  } catch (e) {}
})
</script>

<style scoped src="../styles/Treasurer/dashboard.css"></style>
