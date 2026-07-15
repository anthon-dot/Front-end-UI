<template>
  <div class="dashboard min-h-screen bg-slate-50">
    <TreasurerMenu />

    <div class="page-container">
      
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span class="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <i class="pi pi-home text-2xl"></i>
            </span>
            Treasurer Dashboard
          </h2>
          <p class="text-sm text-slate-500 mt-1">Overview of revenue, collections, and application statuses.</p>
        </div>
        <div class="flex items-center gap-3">
          <Button label="Export Report" icon="pi pi-download" severity="secondary" outlined class="shadow-sm" />
          <Button label="New Payment" icon="pi pi-plus" class="shadow-sm" />
        </div>
      </div>

      <!-- ================= STATS ================= -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <Card class="bg-gradient-to-br from-indigo-50/50 to-white hover:-translate-y-1 transition-all duration-300 border border-slate-100 hover:shadow-md">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</span>
                <h3 class="text-2xl font-black text-slate-800 mt-2">{{ money(aiSummary.totalCollected) }}</h3>
              </div>
              <div class="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <i class="pi pi-wallet text-xl"></i>
              </div>
            </div>
          </template>
        </Card>

        <Card class="bg-gradient-to-br from-emerald-50/50 to-white hover:-translate-y-1 transition-all duration-300 border border-slate-100 hover:shadow-md">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">This Month</span>
                <h3 class="text-2xl font-black text-emerald-600 mt-2">{{ percent(aiPayment.percentageChange) }}</h3>
              </div>
              <div class="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                <i class="pi pi-chart-line text-xl"></i>
              </div>
            </div>
            <div class="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600">
              <i class="pi pi-arrow-up text-[10px]"></i>
              <span>{{ aiPayment.summary || 'Trend analysis loading' }}</span>
            </div>
          </template>
        </Card>

        <Card class="bg-gradient-to-br from-blue-50/50 to-white hover:-translate-y-1 transition-all duration-300 border border-slate-100 hover:shadow-md">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Occupancy</span>
                <h3 class="text-2xl font-black text-slate-800 mt-2">{{ percent(aiSummary.occupancyRate) }}</h3>
              </div>
              <div class="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <i class="pi pi-money-bill text-xl"></i>
              </div>
            </div>
          </template>
        </Card>

        <Card class="bg-gradient-to-br from-orange-50/50 to-white hover:-translate-y-1 transition-all duration-300 border border-slate-100 hover:shadow-md">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding</span>
                <h3 class="text-2xl font-black text-orange-600 mt-2">{{ money(aiSummary.outstandingBalance) }}</h3>
              </div>
              <div class="p-3 bg-orange-100 text-orange-600 rounded-xl">
                <i class="pi pi-clock text-xl"></i>
              </div>
            </div>
          </template>
        </Card>

      </div>

      <!-- ================= CHART + STATUS ================= -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <!-- LINE CHART -->
        <Card class="lg:col-span-2 border border-slate-100 shadow-sm rounded-2xl">
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

      <div class="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
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
import TreasurerMenu from "../components/TreasurerMenu.vue"
import Card from 'primevue/card'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { getAIReportSummary, getPaymentAnalysis } from '../services/aiReportService'

const revenueChart = ref(null)
const chartRange = ref('Last 7 Months')
const aiSummary = ref({})
const aiPayment = ref({})
let chartInstance = null

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

<style scoped>
.dashboard {
  padding-top: calc(var(--header-height, 64px) + 24px);
  padding-bottom: 40px;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  padding-left: calc(var(--sidebar-width, 260px) + 24px);
  transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.p-card) {
  background: #ffffff;
  color: #1e293b;
}

:deep(.p-card-body) {
  padding: 1.5rem;
}

:deep(.p-select) {
  background: #f8fafc;
  border-color: #e2e8f0;
}

@media (max-width: 900px) {
  .page-container {
    padding-left: 24px;
  }
}
</style>
