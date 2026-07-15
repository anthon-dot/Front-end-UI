<template>
  <div class="ai-shell">
    <TreasurerMenu />

    <main class="ai-page">
      <header class="topbar">
        <div>
          <h1>AI Reports Dashboard</h1>
          <p>AI-generated market insights and intelligent reporting</p>
        </div>

        <div class="toolbar">
          <label class="search-box">
            <i class="pi pi-search"></i>
            <input v-model="search" type="search" placeholder="Search reports, insights, stalls..." />
          </label>
          <button class="icon-btn" :disabled="loading" @click="loadAIReports">
            <i class="pi pi-refresh"></i>
          </button>
        </div>
      </header>

      <p v-if="error" class="error-box">{{ error }}</p>

      <section class="summary-grid">
        <article v-for="card in summaryCards" :key="card.label" class="metric-card">
          <span class="metric-icon" :class="card.tone"><i :class="card.icon"></i></span>
          <div>
            <small>{{ card.label }}</small>
            <strong>{{ card.value }}</strong>
            <em>{{ card.caption }}</em>
          </div>
        </article>
      </section>

      <section class="report-panel">
        <nav class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <i :class="tab.icon"></i>
            {{ tab.label }}
          </button>
        </nav>

        <div class="report-grid">
          <section class="analytics-area">
            <div v-if="activeTab === 'occupancy'" class="chart-grid">
              <article class="chart-card">
                <h3>Occupied vs Vacant</h3>
                <div class="chart-wrap"><canvas ref="occupancyPie"></canvas></div>
              </article>
              <article class="chart-card">
                <h3>Business Category Occupancy</h3>
                <div class="chart-wrap"><canvas ref="categoryBar"></canvas></div>
              </article>
              <article class="chart-card wide">
                <h3>Monthly Revenue Trend</h3>
                <div class="chart-wrap"><canvas ref="trendLine"></canvas></div>
              </article>
            </div>

            <div v-else class="narrative-card">
              <span class="eyebrow">{{ currentReport.title }}</span>
              <h2>{{ currentReport.narrative || 'No AI narrative available yet.' }}</h2>
              <div class="mini-stats">
                <span v-for="item in currentReport.highlights || []" :key="item">{{ item }}</span>
              </div>
            </div>

            <div class="accordion-list">
              <article
                v-for="report in visibleReports"
                :key="report.reportType"
                class="accordion-item"
                :class="{ open: expandedReports.includes(report.reportType) }"
              >
                <button @click="toggleReport(report.reportType)">
                  <span><i class="pi pi-file-edit"></i>{{ report.title }}</span>
                  <i class="pi pi-chevron-down"></i>
                </button>
                <div v-if="expandedReports.includes(report.reportType)" class="accordion-body">
                  <p>{{ report.narrative }}</p>
                  <ul>
                    <li v-for="recommendation in report.recommendations" :key="recommendation">
                      {{ recommendation }}
                    </li>
                  </ul>
                </div>
              </article>
            </div>
          </section>

          <aside class="ai-side">
            <article class="analysis-card">
              <i class="pi pi-sparkles"></i>
              <h3>AI {{ currentReport.title }}</h3>
              <p>{{ currentReport.narrative || 'Generate a report to produce an AI narrative.' }}</p>
              <span class="risk" :class="riskClass">{{ currentReport.riskLevel || 'LOW' }} Risk</span>
            </article>

            <article class="recommend-card">
              <h3><i class="pi pi-bolt"></i> AI Recommendations</h3>
              <ol>
                <li v-for="item in currentRecommendations" :key="item">{{ item }}</li>
              </ol>
            </article>

            <button class="primary-btn" @click="generateRecommendation">
              <i class="pi pi-sparkles"></i>
              Generate Recommendation
            </button>
            <button class="ghost-btn" @click="exportReport">
              <i class="pi pi-file-pdf"></i>
              Export PDF
            </button>
            <button class="ghost-btn" @click="exportExcel">
              <i class="pi pi-file-excel"></i>
              Export Excel
            </button>
          </aside>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import TreasurerMenu from '../components/TreasurerMenu.vue'
import {
  generateAIReport,
  getAIReportSummary,
  getBillingAnalysis,
  getContractAnalysis,
  getFinancialAnalysis,
  getFinancialInsights,
  getOccupancyAnalysis,
  getOccupancyReport,
  getPaymentAnalysis,
  getStakeholderAnalysis,
  exportAIReportExcel,
  exportAIReportPdf
} from '../services/aiReportService'

const tabs = [
  { id: 'occupancy', label: 'Occupancy Report', icon: 'pi pi-chart-pie' },
  { id: 'financial', label: 'Financial Report', icon: 'pi pi-wallet' },
  { id: 'billing', label: 'Billing Report', icon: 'pi pi-receipt' },
  { id: 'contract', label: 'Contract Report', icon: 'pi pi-file' },
  { id: 'stakeholder', label: 'Stakeholder Report', icon: 'pi pi-users' }
]

const summary = ref({})
const payment = ref({})
const occupancy = ref({})
const financial = ref({})
const reports = ref({})
const activeTab = ref('occupancy')
const expandedReports = ref(['financial'])
const loading = ref(false)
const error = ref('')
const search = ref('')
const occupancyPie = ref(null)
const categoryBar = ref(null)
const trendLine = ref(null)
const charts = []

const currentReport = computed(() => reports.value[activeTab.value] || {})
const currentRecommendations = computed(() => currentReport.value.recommendations?.length
  ? currentReport.value.recommendations
  : ['Review the latest database records and regenerate the AI report.'])
const riskClass = computed(() => String(currentReport.value.riskLevel || 'low').toLowerCase())

const summaryCards = computed(() => [
  { label: 'Total Stalls', value: number(occupancy.value.totalStalls), caption: 'Recorded capacity', icon: 'pi pi-shop', tone: 'purple' },
  { label: 'Occupied Stalls', value: number(occupancy.value.occupiedStalls), caption: `${percent(occupancy.value.occupancyRate)} occupied`, icon: 'pi pi-check-square', tone: 'green' },
  { label: 'Vacant Stalls', value: number(occupancy.value.vacantStalls), caption: 'Available for assignment', icon: 'pi pi-box', tone: 'orange' },
  { label: 'Occupancy Rate', value: percent(occupancy.value.occupancyRate), caption: 'Live stall utilization', icon: 'pi pi-chart-pie', tone: 'blue' },
  { label: 'Expected Revenue', value: money(financial.value.totalBilled), caption: 'Total billed amount', icon: 'pi pi-money-bill', tone: 'purple' },
  { label: 'Collected Revenue', value: money(financial.value.totalCollected), caption: `${percent(financial.value.collectionRate)} efficiency`, icon: 'pi pi-chart-line', tone: 'green' },
  { label: 'Outstanding Balance', value: money(financial.value.outstandingBalance), caption: 'Requires monitoring', icon: 'pi pi-exclamation-circle', tone: 'rose' }
])

const visibleReports = computed(() => {
  const term = search.value.trim().toLowerCase()
  const list = tabs.map((tab) => reports.value[tab.id]).filter(Boolean)
  if (!term) return list
  return list.filter((report) =>
    `${report.title} ${report.narrative} ${(report.recommendations || []).join(' ')}`
      .toLowerCase()
      .includes(term)
  )
})

function number(value) {
  return new Intl.NumberFormat('en-PH').format(Number(value || 0))
}

function money(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
}

function percent(value) {
  return `${Number(value || 0).toFixed(1)}%`
}

function toggleReport(type) {
  expandedReports.value = expandedReports.value.includes(type)
    ? expandedReports.value.filter((item) => item !== type)
    : [...expandedReports.value, type]
}

function chartDataMap() {
  return reports.value.occupancy?.data?.occupiedByBusinessCategory || {}
}

async function renderCharts() {
  await nextTick()
  charts.splice(0).forEach((chart) => chart.destroy())
  const Chart = (await import('chart.js/auto')).default

  if (occupancyPie.value) {
    charts.push(new Chart(occupancyPie.value, {
      type: 'doughnut',
      data: {
        labels: ['Occupied', 'Vacant'],
        datasets: [{ data: [occupancy.value.occupiedStalls || 0, occupancy.value.vacantStalls || 0], backgroundColor: ['#6d28d9', '#c4b5fd'], borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } }, cutout: '62%' }
    }))
  }

  const categoryMap = chartDataMap()
  if (categoryBar.value) {
    charts.push(new Chart(categoryBar.value, {
      type: 'bar',
      data: {
        labels: Object.keys(categoryMap),
        datasets: [{ data: Object.values(categoryMap), backgroundColor: '#3b82f6', borderRadius: 8 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }
    }))
  }

  const trends = summary.value.monthlyTrends || []
  if (trendLine.value) {
    charts.push(new Chart(trendLine.value, {
      type: 'line',
      data: {
        labels: trends.map((item) => item.label),
        datasets: [{ label: 'Collections', data: trends.map((item) => Number(item.amount || 0)), borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,.12)', fill: true, tension: 0.35 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }
    }))
  }
}

async function loadAIReports() {
  loading.value = true
  error.value = ''

  try {
    const [summaryRes, paymentRes, occupancyRes, financialRes, occupancyReport, financialReport, billingReport, contractReport, stakeholderReport] = await Promise.all([
      getAIReportSummary(),
      getPaymentAnalysis(),
      getOccupancyAnalysis(),
      getFinancialInsights(),
      getOccupancyReport(),
      getFinancialAnalysis(),
      getBillingAnalysis(),
      getContractAnalysis(),
      getStakeholderAnalysis()
    ])

    summary.value = summaryRes.data
    payment.value = paymentRes.data
    occupancy.value = occupancyRes.data
    financial.value = financialRes.data
    reports.value = {
      occupancy: occupancyReport.data,
      financial: financialReport.data,
      billing: billingReport.data,
      contract: contractReport.data,
      stakeholder: stakeholderReport.data
    }
    await renderCharts()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function generateRecommendation() {
  const response = await generateAIReport(activeTab.value)
  reports.value = { ...reports.value, [activeTab.value]: response.data }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function exportReport() {
  const response = await exportAIReportPdf()
  downloadBlob(response.data, 'ai-market-report.pdf')
}

async function exportExcel() {
  const response = await exportAIReportExcel()
  downloadBlob(response.data, 'ai-market-report.xlsx')
}

watch(activeTab, () => {
  if (activeTab.value === 'occupancy') renderCharts()
})

onMounted(loadAIReports)
</script>

<style scoped>
.ai-shell { min-height: 100vh; background: #f7f8fd; color: #111437; }
.ai-page { padding: 32px 28px 44px; padding-left: calc(var(--sidebar-width, 280px) + 28px); }
.topbar { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; margin-bottom: 24px; }
.topbar h1 { margin: 0; font-size: clamp(1.8rem, 3vw, 2.6rem); letter-spacing: 0; }
.topbar p { margin: 8px 0 0; color: #535b88; }
.toolbar { display: flex; gap: 12px; align-items: center; }
.search-box { width: min(360px, 42vw); height: 48px; display: flex; align-items: center; gap: 10px; padding: 0 16px; border: 1px solid #d8dcf0; border-radius: 8px; background: white; }
.search-box input { border: 0; outline: 0; flex: 1; min-width: 0; color: #15183d; }
.icon-btn, .primary-btn, .ghost-btn { border: 0; border-radius: 8px; cursor: pointer; font-weight: 800; transition: .2s ease; }
.icon-btn { width: 48px; height: 48px; color: #5638ee; background: white; border: 1px solid #d8dcf0; }
.summary-grid { display: grid; grid-template-columns: repeat(7, minmax(150px, 1fr)); gap: 14px; margin-bottom: 18px; }
.metric-card, .report-panel, .chart-card, .analysis-card, .recommend-card, .accordion-item, .narrative-card { background: rgba(255,255,255,.92); border: 1px solid #e4e7f5; border-radius: 8px; box-shadow: 0 16px 40px rgba(37, 45, 105, .08); }
.metric-card { padding: 18px; display: flex; gap: 14px; min-width: 0; }
.metric-icon { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 8px; flex: 0 0 auto; }
.metric-icon.purple { color: #6d28d9; background: #ede9fe; } .metric-icon.green { color: #059669; background: #d1fae5; } .metric-icon.orange { color: #f97316; background: #ffedd5; } .metric-icon.blue { color: #2563eb; background: #dbeafe; } .metric-icon.rose { color: #e11d48; background: #ffe4e6; }
.metric-card small, .metric-card em { display: block; color: #626a96; font-style: normal; font-size: .78rem; }
.metric-card strong { display: block; margin: 8px 0; font-size: 1.35rem; color: #111437; }
.report-panel { padding: 14px; }
.tabs { display: grid; grid-template-columns: repeat(5, 1fr); border-bottom: 1px solid #e4e7f5; }
.tabs button { min-height: 54px; border: 0; background: transparent; color: #303969; font-weight: 800; cursor: pointer; border-bottom: 3px solid transparent; }
.tabs button.active { color: #5638ee; border-bottom-color: #5638ee; }
.report-grid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 16px; padding-top: 16px; }
.chart-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.chart-card { padding: 18px; }
.chart-card.wide { grid-column: 1 / -1; }
.chart-card h3, .analysis-card h3, .recommend-card h3 { margin: 0 0 14px; }
.chart-wrap { height: 270px; }
.ai-side { display: grid; gap: 12px; align-content: start; }
.analysis-card { padding: 22px; color: white; background: linear-gradient(145deg, #6236ff, #2563eb); }
.analysis-card p { line-height: 1.6; }
.risk { display: inline-flex; margin-top: 8px; padding: 7px 10px; border-radius: 999px; background: rgba(255,255,255,.18); font-weight: 900; }
.recommend-card, .narrative-card { padding: 20px; }
.recommend-card ol { margin: 0; padding-left: 22px; color: #4c557f; line-height: 1.55; }
.primary-btn, .ghost-btn { min-height: 48px; display: inline-flex; justify-content: center; align-items: center; gap: 9px; }
.primary-btn { color: white; background: linear-gradient(135deg, #5b21b6, #3b82f6); }
.ghost-btn { color: #5638ee; background: white; border: 1px solid #c7d2fe; }
.accordion-list { display: grid; gap: 10px; margin-top: 14px; }
.accordion-item button { width: 100%; min-height: 48px; display: flex; justify-content: space-between; align-items: center; gap: 12px; border: 0; background: transparent; padding: 0 16px; color: #161a42; font-weight: 900; cursor: pointer; }
.accordion-item button span { display: inline-flex; gap: 10px; align-items: center; }
.accordion-item.open .pi-chevron-down { transform: rotate(180deg); }
.accordion-body { padding: 0 18px 16px; color: #535b88; line-height: 1.55; }
.accordion-body ul { margin-bottom: 0; }
.narrative-card h2 { font-size: 1.35rem; line-height: 1.45; margin: 8px 0 18px; }
.eyebrow { color: #5638ee; font-weight: 900; }
.mini-stats { display: flex; flex-wrap: wrap; gap: 8px; }
.mini-stats span { padding: 8px 10px; border-radius: 999px; color: #3b2bbf; background: #ede9fe; font-weight: 800; font-size: .8rem; }
.error-box { padding: 14px 16px; border-radius: 8px; background: #fff1f2; color: #be123c; font-weight: 800; }
@media (max-width: 1200px) { .summary-grid { grid-template-columns: repeat(3, 1fr); } .report-grid { grid-template-columns: 1fr; } }
@media (max-width: 800px) { .ai-page { padding-left: 20px; padding-right: 20px; } .topbar, .toolbar { flex-direction: column; align-items: stretch; } .search-box { width: 100%; } .summary-grid, .tabs, .chart-grid { grid-template-columns: 1fr; } }
</style>
