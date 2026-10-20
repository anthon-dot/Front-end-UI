<template>
  <div class="market-reports-container">
    <!-- Printable Official Municipal Header (Only visible on paper / print preview) -->
    <header class="print-only-header">
      <h1>Republic of the Philippines</h1>
      <h2>Province of Misamis Oriental • Municipality of Manticao</h2>
      <h3>OFFICE OF THE MUNICIPAL TREASURER & MARKET ADMINISTRATION</h3>
      <p style="margin: 4px 0; font-size: 11pt; font-weight: bold;">
        {{ currentReportMeta.title.toUpperCase() }}
      </p>
      <small style="display: block; margin-top: 2px;">
        Generated on {{ currentTimestampFormatted }} • System Report
      </small>
    </header>

    <!-- Top Card: Header & Tabs -->
    <section class="report-header-card">
      <div class="report-header-top">
        <div class="report-title-group">
          <h2>
            <i :class="currentReportMeta.icon" style="color: #2563eb;"></i>
            {{ currentReportMeta.title }}
          </h2>
          <p>{{ currentReportMeta.description }}</p>
        </div>

        <div class="report-actions">
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            size="small"
            :loading="isLoading"
            @click="handleRefresh"
          />
          <Button
            label="Export CSV"
            icon="pi pi-file-excel"
            severity="success"
            size="small"
            @click="handleExportCsv"
          />
          <Button
            label="Print Report"
            icon="pi pi-print"
            severity="primary"
            size="small"
            @click="handlePrintReport"
          />
        </div>
      </div>

      <!-- Navigation Tabs: 3 Required Types -->
      <nav class="report-nav-tabs" aria-label="Market Reports Navigation">
        <button
          type="button"
          class="report-tab-btn"
          :class="{ active: currentTab === 'collection' }"
          @click="setTab('collection')"
        >
          <i class="pi pi-wallet"></i>
          <span>1. Collection Report</span>
          <span class="report-badge-pill">{{ collectionReceipts.length }}</span>
        </button>

        <button
          type="button"
          class="report-tab-btn"
          :class="{ active: currentTab === 'liability' }"
          @click="setTab('liability')"
        >
          <i class="pi pi-exclamation-circle"></i>
          <span>2. Liability Report</span>
          <span class="report-badge-pill" :style="totalUnpaidCount > 0 ? 'background: #fee2e2; color: #991b1b;' : ''">
            {{ totalUnpaidCount }} Unpaid
          </span>
        </button>

        <button
          type="button"
          class="report-tab-btn"
          :class="{ active: currentTab === 'occupancy' }"
          @click="setTab('occupancy')"
        >
          <i class="pi pi-chart-pie"></i>
          <span>3. Stall Occupancy Report</span>
          <span class="report-badge-pill">{{ occupiedCount }}/{{ totalStallsCount }} Occupied</span>
        </button>
      </nav>
    </section>

    <!-- ======================================================== -->
    <!-- 1. COLLECTION REPORT VIEW                                -->
    <!-- ======================================================== -->
    <template v-if="currentTab === 'collection'">
      <!-- Collection KPI Cards -->
      <div class="report-metrics-grid">
        <div class="report-metric-card">
          <div class="metric-info">
            <span class="metric-caption">Total Collections</span>
            <span class="metric-number" style="color: #059669;">{{ formatMoney(totalCollectionAmount) }}</span>
            <span class="metric-sub">Rental payments collected by Treasurer's Office</span>
          </div>
          <div class="metric-icon-wrap emerald">
            <i class="pi pi-wallet"></i>
          </div>
        </div>

        <div class="report-metric-card">
          <div class="metric-info">
            <span class="metric-caption">Recorded Transactions</span>
            <span class="metric-number">{{ filteredCollections.length }}</span>
            <span class="metric-sub">Payment receipts in period</span>
          </div>
          <div class="metric-icon-wrap blue">
            <i class="pi pi-check-circle"></i>
          </div>
        </div>

        <div class="report-metric-card">
          <div class="metric-info">
            <span class="metric-caption">Rent Payments</span>
            <span class="metric-number">{{ formatMoney(rentPaymentsTotal) }}</span>
            <span class="metric-sub">{{ rentPaymentsCount }} monthly rental installments</span>
          </div>
          <div class="metric-icon-wrap indigo">
            <i class="pi pi-building"></i>
          </div>
        </div>

        <div class="report-metric-card">
          <div class="metric-info">
            <span class="metric-caption">Advance & Permit Fees</span>
            <span class="metric-number">{{ formatMoney(advancePaymentsTotal) }}</span>
            <span class="metric-sub">Advance rental deposits & fees</span>
          </div>
          <div class="metric-icon-wrap purple">
            <i class="pi pi-shield"></i>
          </div>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="report-filter-bar">
        <div class="filter-left-group">
          <div class="filter-search-box">
            <i class="pi pi-search" style="color: #94a3b8;"></i>
            <input
              v-model="collectionSearch"
              type="text"
              placeholder="Search by OR No., payor name, business, reference..."
            />
          </div>

          <select v-model="selectedMonth" class="filter-select">
            <option value="">All Months</option>
            <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>

          <select v-model="selectedYear" class="filter-select">
            <option value="">All Years</option>
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
          </select>

          <select v-model="collectionTypeFilter" class="filter-select">
            <option value="ALL">All Payment Types</option>
            <option value="RENT">Rent Payments</option>
            <option value="ADVANCE">Advance Payments</option>
            <option value="FEE">Application / Permit Fees</option>
          </select>
        </div>

        <div class="filter-count-badge">
          Showing <strong>{{ filteredCollections.length }}</strong> of {{ collectionReceipts.length }} official receipts
        </div>
      </div>

      <!-- Official Receipts Table Card -->
      <div class="report-table-card">
        <div class="table-title-bar">
          <div>
            <h3>Official Receipt Records & Collections</h3>
            <p>Official Treasurer rental payment transactions recorded with official receipt tracking</p>
          </div>
          <div class="table-actions">
            <span class="report-badge-pill" style="background: #ecfdf5; color: #047857;">
              Total: {{ formatMoney(filteredCollectionTotal) }}
            </span>
          </div>
        </div>

        <div class="table-responsive-wrapper">
          <table class="report-data-table">
            <thead>
              <tr>
                <th>Official Receipt (OR No.)</th>
                <th>Payment Date</th>
                <th>Payor / Stakeholder</th>
                <th>Business Name</th>
                <th>Stall</th>
                <th>Payment Type</th>
                <th>Reference No.</th>
                <th>Amount Collected</th>
                <th>Recorded By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredCollections" :key="item.id || item.orNo">
                <td>
                  <span class="receipt-no-chip">{{ item.orNo || 'OR-Pending' }}</span>
                </td>
                <td>{{ formatDate(item.date) }}</td>
                <td>
                  <strong style="color: #0f172a;">{{ item.payor }}</strong>
                </td>
                <td>{{ item.business || '—' }}</td>
                <td>
                  <span class="stall-no-badge" v-if="item.stall && item.stall !== 'No stall'">
                    <i class="pi pi-shop"></i> {{ item.stall }}
                  </span>
                  <span v-else style="color: #94a3b8;">—</span>
                </td>
                <td>
                  <span class="badge-status info">{{ item.type }}</span>
                </td>
                <td style="font-family: monospace; font-size: 0.82rem; color: #64748b;">
                  {{ item.referenceNo || 'Direct Remittance' }}
                </td>
                <td class="currency-bold" style="color: #047857;">
                  {{ formatMoney(item.rawAmount) }}
                </td>
                <td>{{ item.recordedBy || 'Treasurer\'s Office' }}</td>
                <td>
                  <span class="badge-status success">
                    <i class="pi pi-check"></i> Recorded
                  </span>
                </td>
              </tr>

              <tr v-if="filteredCollections.length === 0">
                <td colspan="10">
                  <div class="empty-report-state">
                    <i class="pi pi-inbox"></i>
                    <h3>No payment transactions found</h3>
                    <p>No collection records match your specified month, year, or search criteria.</p>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="filteredCollections.length > 0">
              <tr>
                <td colspan="7" style="text-align: right; text-transform: uppercase;">
                  Period Collection Grand Total:
                </td>
                <td class="currency-bold" style="font-size: 1.1rem; color: #047857;">
                  {{ formatMoney(filteredCollectionTotal) }}
                </td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>

    <!-- ======================================================== -->
    <!-- 2. LIABILITY REPORT VIEW                                 -->
    <!-- ======================================================== -->
    <template v-else-if="currentTab === 'liability'">
      <!-- Liability KPI Cards -->
      <div class="report-metrics-grid">
        <div class="report-metric-card">
          <div class="metric-info">
            <span class="metric-caption">Outstanding Balances</span>
            <span class="metric-number" style="color: #e11d48;">{{ formatMoney(totalOutstandingAmount) }}</span>
            <span class="metric-sub">Total rental obligations due from stakeholders</span>
          </div>
          <div class="metric-icon-wrap rose">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
        </div>

        <div class="report-metric-card">
          <div class="metric-info">
            <span class="metric-caption">Unpaid Bills</span>
            <span class="metric-number">{{ totalUnpaidCount }}</span>
            <span class="metric-sub">Accounts requiring collection action</span>
          </div>
          <div class="metric-icon-wrap amber">
            <i class="pi pi-clock"></i>
          </div>
        </div>

        <div class="report-metric-card">
          <div class="metric-info">
            <span class="metric-caption">Paid Accounts</span>
            <span class="metric-number" style="color: #16a34a;">{{ totalPaidCount }}</span>
            <span class="metric-sub">Fully settled billings</span>
          </div>
          <div class="metric-icon-wrap emerald">
            <i class="pi pi-check-circle"></i>
          </div>
        </div>

        <div class="report-metric-card">
          <div class="metric-info">
            <span class="metric-caption">Collection Efficiency</span>
            <span class="metric-number">{{ collectionEfficiencyRate }}%</span>
            <span class="metric-sub">{{ formatMoney(totalSettledAmount) }} collected of total billed</span>
          </div>
          <div class="metric-icon-wrap blue">
            <i class="pi pi-percentage"></i>
          </div>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="report-filter-bar">
        <div class="filter-left-group">
          <div class="filter-search-box">
            <i class="pi pi-search" style="color: #94a3b8;"></i>
            <input
              v-model="liabilitySearch"
              type="text"
              placeholder="Search by billing no., stakeholder, business name, stall..."
            />
          </div>

          <select v-model="liabilityStatusFilter" class="filter-select">
            <option value="ALL">All Statuses</option>
            <option value="UNPAID_ONLY">Unpaid Only (Outstanding > 0)</option>
            <option value="OVERDUE">Overdue Only</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid Only (Settled)</option>
          </select>

          <select v-model="selectedMonth" class="filter-select">
            <option value="">All Months</option>
            <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>

          <select v-model="selectedYear" class="filter-select">
            <option value="">All Years</option>
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>

        <div class="filter-count-badge">
          Showing <strong>{{ filteredLiabilities.length }}</strong> of {{ liabilityRecords.length }} obligations
        </div>
      </div>

      <!-- Unpaid Balances Table Card -->
      <div class="report-table-card">
        <div class="table-title-bar">
          <div>
            <h3>Rental Obligations & Balances Registry</h3>
            <p>Comprehensive register of monthly rental billings, amounts due, outstanding balances, and status</p>
          </div>
          <div class="table-actions">
            <span class="report-badge-pill" style="background: #ffe4e6; color: #9f1239;">
              Outstanding: {{ formatMoney(filteredOutstandingTotal) }}
            </span>
          </div>
        </div>

        <div class="table-responsive-wrapper">
          <table class="report-data-table">
            <thead>
              <tr>
                <th>Billing No</th>
                <th>Stakeholder / Lessee</th>
                <th>Business Name</th>
                <th>Stall</th>
                <th>Rental Obligation Period</th>
                <th>Due Date</th>
                <th>Amount Due</th>
                <th>Amount Paid</th>
                <th>Outstanding Balance</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bill in filteredLiabilities" :key="bill.billingNo">
                <td>
                  <span class="receipt-no-chip">{{ bill.billingNo }}</span>
                </td>
                <td>
                  <strong style="color: #0f172a;">{{ bill.stakeholder }}</strong>
                </td>
                <td>{{ bill.business || bill.businessName || '—' }}</td>
                <td>
                  <span class="stall-no-badge" v-if="bill.stall && bill.stall !== 'No stall'">
                    <i class="pi pi-shop"></i> {{ bill.stall }}
                  </span>
                  <span v-else style="color: #94a3b8;">—</span>
                </td>
                <td>{{ bill.period || 'Monthly Rental' }}</td>
                <td>
                  <span :style="bill.isOverdue ? 'color: #e11d48; font-weight: 700;' : ''">
                    {{ formatDate(bill.dueDate) }}
                  </span>
                </td>
                <td class="currency-bold">{{ formatMoney(bill.totalAmount) }}</td>
                <td style="color: #16a34a; font-weight: 600;">{{ formatMoney(bill.paidAmount) }}</td>
                <td :class="bill.balance > 0 ? 'currency-danger' : 'currency-bold'">
                  {{ formatMoney(bill.balance) }}
                </td>
                <td>
                  <span
                    class="badge-status"
                    :class="{
                      danger: bill.status === 'OVERDUE' || (bill.status === 'UNPAID' && bill.balance > 0),
                      warning: bill.status === 'PARTIALLY_PAID',
                      success: bill.status === 'PAID' || bill.balance <= 0
                    }"
                  >
                    <i
                      :class="bill.balance <= 0 ? 'pi pi-check-circle' : (bill.status === 'OVERDUE' ? 'pi pi-exclamation-circle' : 'pi pi-clock')"
                    ></i>
                    {{ bill.status }}
                  </span>
                </td>
              </tr>

              <tr v-if="filteredLiabilities.length === 0">
                <td colspan="10">
                  <div class="empty-report-state">
                    <i class="pi pi-check-circle" style="color: #10b981;"></i>
                    <h3>No liabilities found</h3>
                    <p>All rental obligations for this selection are either fully paid or no records match your filters.</p>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="filteredLiabilities.length > 0">
              <tr>
                <td colspan="6" style="text-align: right; text-transform: uppercase;">
                  Subtotals (Filtered):
                </td>
                <td class="currency-bold">{{ formatMoney(filteredAmountDueTotal) }}</td>
                <td class="currency-bold" style="color: #16a34a;">{{ formatMoney(filteredAmountPaidTotal) }}</td>
                <td class="currency-danger" style="font-size: 1.1rem;">{{ formatMoney(filteredOutstandingTotal) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>

    <!-- ======================================================== -->
    <!-- 3. STALL OCCUPANCY REPORT VIEW                           -->
    <!-- ======================================================== -->
    <template v-else-if="currentTab === 'occupancy'">
      <!-- Stall Occupancy KPI Cards -->
      <div class="report-metrics-grid">
        <div class="report-metric-card">
          <div class="metric-info">
            <span class="metric-caption">Total Stalls</span>
            <span class="metric-number">{{ totalStallsCount }}</span>
            <span class="metric-sub">Public market stall inventory</span>
          </div>
          <div class="metric-icon-wrap indigo">
            <i class="pi pi-th-large"></i>
          </div>
        </div>

        <div class="report-metric-card">
          <div class="metric-info">
            <span class="metric-caption">Occupied Stalls</span>
            <span class="metric-number" style="color: #16a34a;">{{ occupiedCount }}</span>
            <span class="metric-sub">{{ overallOccupancyRate }}% occupancy rate</span>
          </div>
          <div class="metric-icon-wrap emerald">
            <i class="pi pi-check-circle"></i>
          </div>
        </div>

        <div class="report-metric-card">
          <div class="metric-info">
            <span class="metric-caption">Available / Vacant</span>
            <span class="metric-number" style="color: #2563eb;">{{ vacantCount }}</span>
            <span class="metric-sub">Ready for tenant assignment</span>
          </div>
          <div class="metric-icon-wrap blue">
            <i class="pi pi-shop"></i>
          </div>
        </div>

        <div class="report-metric-card">
          <div class="metric-info">
            <span class="metric-caption">Potential Monthly Rent</span>
            <span class="metric-number">{{ formatMoney(potentialMonthlyRent) }}</span>
            <span class="metric-sub">{{ formatMoney(occupiedMonthlyRent) }} currently active</span>
          </div>
          <div class="metric-icon-wrap amber">
            <i class="pi pi-chart-line"></i>
          </div>
        </div>
      </div>

      <!-- Section Capacity Breakdown Table Card -->
      <div class="report-table-card">
        <div class="table-title-bar">
          <div>
            <h3>Section & Commodity Capacity Breakdown</h3>
            <p>Utilization metrics and potential rental income distribution per market section</p>
          </div>
        </div>

        <div class="table-responsive-wrapper">
          <table class="report-data-table">
            <thead>
              <tr>
                <th>Market Section</th>
                <th>Total Stalls</th>
                <th>Occupied</th>
                <th>Available</th>
                <th>Occupancy Rate</th>
                <th>Section Monthly Potential</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sec in sectionBreakdown" :key="sec.name">
                <td>
                  <strong style="color: #0f172a;">{{ sec.name }}</strong>
                </td>
                <td>{{ sec.total }}</td>
                <td>
                  <span class="badge-status success">{{ sec.occupied }}</span>
                </td>
                <td>
                  <span class="badge-status info">{{ sec.vacant }}</span>
                </td>
                <td>
                  <div class="occupancy-rate-bar-wrap">
                    <div class="occupancy-rate-track">
                      <div
                        class="occupancy-rate-fill"
                        :class="sec.rate >= 75 ? 'rate-high' : (sec.rate >= 40 ? 'rate-medium' : 'rate-low')"
                        :style="{ width: `${sec.rate}%` }"
                      ></div>
                    </div>
                    <span style="font-size: 0.82rem; font-weight: 700; color: #334155;">{{ sec.rate }}%</span>
                  </div>
                </td>
                <td class="currency-bold">{{ formatMoney(sec.potentialRent) }}</td>
              </tr>
              <tr v-if="sectionBreakdown.length === 0">
                <td colspan="6" style="text-align: center; color: #94a3b8; padding: 1.5rem;">
                  No section data available.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="report-filter-bar">
        <div class="filter-left-group">
          <div class="filter-search-box">
            <i class="pi pi-search" style="color: #94a3b8;"></i>
            <input
              v-model="occupancySearch"
              type="text"
              placeholder="Search by stall no., occupant name, business, section..."
            />
          </div>

          <select v-model="occupancyStatusFilter" class="filter-select">
            <option value="ALL">All Statuses</option>
            <option value="OCCUPIED">Occupied Only</option>
            <option value="AVAILABLE">Available / Vacant Only</option>
            <option value="MAINTENANCE">Maintenance Only</option>
          </select>

          <select v-model="occupancySectionFilter" class="filter-select">
            <option value="ALL">All Sections</option>
            <option v-for="sec in uniqueSections" :key="sec" :value="sec">{{ sec }}</option>
          </select>
        </div>

        <div class="filter-count-badge">
          Showing <strong>{{ filteredOccupancyStalls.length }}</strong> of {{ stallsList.length }} stalls
        </div>
      </div>

      <!-- Assigned Stalls & Occupants Table Card -->
      <div class="report-table-card">
        <div class="table-title-bar">
          <div>
            <h3>Market Stalls Assignment & Occupancy Registry</h3>
            <p>Complete monitoring of assigned stalls, stakeholders, contract terms, and available units</p>
          </div>
        </div>

        <div class="table-responsive-wrapper">
          <table class="report-data-table">
            <thead>
              <tr>
                <th>Stall Number</th>
                <th>Section</th>
                <th>Stall Type</th>
                <th>Rental Rate / mo</th>
                <th>Occupancy Status</th>
                <th>Assigned Stakeholder / Occupant</th>
                <th>Business Name</th>
                <th>Contract Ref</th>
                <th>Lease Period</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stall in filteredOccupancyStalls" :key="stall.id || stall.stallNo">
                <td>
                  <span class="stall-no-badge">
                    <i class="pi pi-shop"></i> {{ stall.stallNo }}
                  </span>
                </td>
                <td>{{ stall.section }}</td>
                <td>{{ stall.stallType }}</td>
                <td class="currency-bold">{{ formatMoney(stall.monthlyRent) }}</td>
                <td>
                  <span
                    class="badge-status"
                    :class="{
                      success: stall.status === 'OCCUPIED',
                      info: stall.status === 'AVAILABLE' || stall.status === 'VACANT',
                      warning: stall.status === 'MAINTENANCE'
                    }"
                  >
                    <i
                      :class="stall.status === 'OCCUPIED' ? 'pi pi-check' : (stall.status === 'MAINTENANCE' ? 'pi pi-wrench' : 'pi pi-tag')"
                    ></i>
                    {{ stall.status }}
                  </span>
                </td>
                <td>
                  <strong v-if="stall.occupantName && stall.occupantName !== 'Available / Unassigned'" style="color: #0f172a;">
                    {{ stall.occupantName }}
                  </strong>
                  <span v-else style="color: #94a3b8; font-style: italic;">
                    Unassigned (Vacant)
                  </span>
                </td>
                <td>{{ stall.businessName || '—' }}</td>
                <td>
                  <span v-if="stall.contractNo && stall.contractNo !== 'None'" class="receipt-no-chip">
                    {{ stall.contractNo }}
                  </span>
                  <span v-else style="color: #94a3b8;">None</span>
                </td>
                <td style="font-size: 0.84rem; color: #64748b;">
                  {{ stall.leasePeriod || '—' }}
                </td>
              </tr>

              <tr v-if="filteredOccupancyStalls.length === 0">
                <td colspan="9">
                  <div class="empty-report-state">
                    <i class="pi pi-building"></i>
                    <h3>No stalls found</h3>
                    <p>No stalls match your selected status, section, or search query.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Printable Official Footer (Signatures) -->
    <footer class="print-only-footer">
      <div class="print-signature-box">
        <div class="print-signature-line"></div>
        <p>Prepared By:</p>
        <small>Market Operations Staff</small>
      </div>

      <div class="print-signature-box">
        <div class="print-signature-line"></div>
        <p>Verified & Certified By:</p>
        <small>Municipal Treasurer</small>
      </div>

      <div class="print-signature-box">
        <div class="print-signature-line"></div>
        <p>Noted By:</p>
        <small>Market Supervisor / Admin</small>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import Button from 'primevue/button'
import api, { normalizeRecord } from '../../services/api'
import { exportToCsv } from '../../services/reportService'

const props = defineProps({
  initialTab: {
    type: String,
    default: 'collection' // 'collection' | 'liability' | 'occupancy'
  },
  state: {
    type: Object,
    default: null
  },
  mode: {
    type: String,
    default: 'admin' // 'admin' | 'treasurer' | 'supervisor'
  }
})

const emit = defineEmits(['refresh'])

// Active tab state
const currentTab = ref(props.initialTab || 'collection')
const isLoading = ref(false)

// Global filter state
const selectedMonth = ref('')
const selectedYear = ref('')

const monthOptions = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 }
]

const currentYear = new Date().getFullYear()
const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]

// Tab-specific filters
const collectionSearch = ref('')
const collectionTypeFilter = ref('ALL')

const liabilitySearch = ref('')
const liabilityStatusFilter = ref('ALL')

const occupancySearch = ref('')
const occupancyStatusFilter = ref('ALL')
const occupancySectionFilter = ref('ALL')

// Internal raw data if not provided via props.state
const internalPayments = ref([])
const internalBillings = ref([])
const internalStalls = ref([])
const internalStakeholders = ref([])
const internalContracts = ref([])

// Synchronize tab prop
watch(() => props.initialTab, (newTab) => {
  if (newTab) {
    currentTab.value = normalizeTabName(newTab)
  }
})

function normalizeTabName(name) {
  const lower = String(name).toLowerCase()
  if (lower.includes('collect') || lower.includes('revenue')) return 'collection'
  if (lower.includes('liab') || lower.includes('bill')) return 'liability'
  if (lower.includes('occup')) return 'occupancy'
  return 'collection'
}

function setTab(tab) {
  currentTab.value = tab
}

const currentReportMeta = computed(() => {
  const metaMap = {
    collection: {
      title: '1. Collection Report',
      description: 'Rental payments collected by the Treasurer’s Office, official receipt records, and transaction history.',
      icon: 'pi pi-wallet'
    },
    liability: {
      title: '2. Liability Report',
      description: 'Rental obligations, unpaid bills, amounts due, and payment status of stakeholders.',
      icon: 'pi pi-exclamation-circle'
    },
    occupancy: {
      title: '3. Stall Occupancy Report',
      description: 'Occupancy and assignment of stalls in the public market, occupant tracking, and available stall monitoring.',
      icon: 'pi pi-chart-pie'
    }
  }
  return metaMap[currentTab.value] || metaMap.collection
})

const currentTimestampFormatted = computed(() => {
  return new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// =========================================================================
// DATA FETCHING & SYNCHRONIZATION
// =========================================================================
async function loadReportsData(force = false) {
  isLoading.value = true
  try {
    if (props.state && props.state.payments?.length) {
      // Data already loaded in props
      isLoading.value = false
      return
    }

    const [paymentsRes, billingsRes, stallsRes, stakeholdersRes, contractsRes] = await Promise.allSettled([
      api.get('/payments'),
      api.get('/billings'),
      api.get('/stalls'),
      api.get('/stakeholders'),
      api.get('/contracts')
    ])

    if (paymentsRes.status === 'fulfilled' && paymentsRes.value?.data) {
      internalPayments.value = normalizeRecord(paymentsRes.value.data)
    }
    if (billingsRes.status === 'fulfilled' && billingsRes.value?.data) {
      internalBillings.value = normalizeRecord(billingsRes.value.data)
    }
    if (stallsRes.status === 'fulfilled' && stallsRes.value?.data) {
      internalStalls.value = normalizeRecord(stallsRes.value.data)
    }
    if (stakeholdersRes.status === 'fulfilled' && stakeholdersRes.value?.data) {
      internalStakeholders.value = normalizeRecord(stakeholdersRes.value.data)
    }
    if (contractsRes.status === 'fulfilled' && contractsRes.value?.data) {
      internalContracts.value = normalizeRecord(contractsRes.value.data)
    }
  } catch (err) {
    console.warn('[MarketReports] Error loading report data:', err)
  } finally {
    isLoading.value = false
  }
}

function handleRefresh() {
  emit('refresh')
  loadReportsData(true)
}

onMounted(() => {
  loadReportsData()
})

// =========================================================================
// 1. COLLECTION REPORT DATA RESOLUTION
// =========================================================================
const collectionReceipts = computed(() => {
  const source = (props.state?.payments?.length ? props.state.payments : internalPayments.value) || []
  return source.map((p) => {
    const rawAmt = Number(String(p.amount || 0).replace(/[^\d.-]/g, '')) || 0
    const rawDate = p.paymentDate || p.payment_date || p.date || p.createdAt || p.created_at || ''
    const payorName = p.payor || p.stakeholderName ||
      [p.stakeholder?.firstName, p.stakeholder?.lastName].filter(Boolean).join(' ') ||
      p.occupantName || 'Stakeholder Payor'
    const orNum = p.orNo || p.receiptNo || p.receipt_no || (p.id ? `OR-${p.id}` : 'OR-Record')
    const bName = p.business || p.businessName || p.stakeholder?.businessName || ''
    const stall = p.stall || p.stallNo || p.billing?.stallNo || ''

    return {
      ...p,
      orNo: orNum,
      payor: payorName,
      business: bName,
      stall,
      type: formatPaymentType(p.type || p.paymentType || p.payment_type),
      date: rawDate,
      rawAmount: rawAmt,
      referenceNo: p.referenceNo || p.reference_no || '',
      recordedBy: p.recordedBy || 'Treasurer\'s Office'
    }
  })
})

function formatPaymentType(type) {
  if (!type) return 'Rent Payment'
  const upper = String(type).toUpperCase()
  if (upper.includes('ADVANCE')) return 'Advance Deposit'
  if (upper.includes('APPLICATION') || upper.includes('PERMIT') || upper.includes('FEE')) return 'Application / Permit Fee'
  return 'Rent Payment'
}

const filteredCollections = computed(() => {
  const q = collectionSearch.value.trim().toLowerCase()
  return collectionReceipts.value.filter((item) => {
    // Search filter
    if (q) {
      const match =
        item.orNo?.toLowerCase().includes(q) ||
        item.payor?.toLowerCase().includes(q) ||
        item.business?.toLowerCase().includes(q) ||
        item.stall?.toLowerCase().includes(q) ||
        item.referenceNo?.toLowerCase().includes(q)
      if (!match) return false
    }

    // Month filter
    if (selectedMonth.value && item.date) {
      const d = new Date(item.date)
      if (!isNaN(d.getTime()) && d.getMonth() + 1 !== Number(selectedMonth.value)) return false
    }

    // Year filter
    if (selectedYear.value && item.date) {
      const d = new Date(item.date)
      if (!isNaN(d.getTime()) && d.getFullYear() !== Number(selectedYear.value)) return false
    }

    // Type filter
    if (collectionTypeFilter.value !== 'ALL') {
      if (collectionTypeFilter.value === 'RENT' && !item.type.includes('Rent')) return false
      if (collectionTypeFilter.value === 'ADVANCE' && !item.type.includes('Advance')) return false
      if (collectionTypeFilter.value === 'FEE' && !item.type.includes('Fee')) return false
    }

    return true
  })
})

const totalCollectionAmount = computed(() => {
  return collectionReceipts.value.reduce((sum, item) => sum + item.rawAmount, 0)
})

const filteredCollectionTotal = computed(() => {
  return filteredCollections.value.reduce((sum, item) => sum + item.rawAmount, 0)
})

const rentPaymentsTotal = computed(() => {
  return collectionReceipts.value
    .filter((r) => r.type.includes('Rent'))
    .reduce((sum, r) => sum + r.rawAmount, 0)
})

const rentPaymentsCount = computed(() => {
  return collectionReceipts.value.filter((r) => r.type.includes('Rent')).length
})

const advancePaymentsTotal = computed(() => {
  return collectionReceipts.value
    .filter((r) => !r.type.includes('Rent'))
    .reduce((sum, r) => sum + r.rawAmount, 0)
})

// =========================================================================
// 2. LIABILITY REPORT DATA RESOLUTION
// =========================================================================
const liabilityRecords = computed(() => {
  const source = (props.state?.billings?.length ? props.state.billings : internalBillings.value) || []
  return source.map((b) => {
    const tot = Number(String(b.totalAmount ?? b.total_amount ?? b.amount ?? 0).replace(/[^\d.-]/g, '')) || 0
    const pd = Number(String(b.paidAmount ?? b.paid_amount ?? 0).replace(/[^\d.-]/g, '')) || 0
    const bal = Number(String(b.balance !== undefined ? b.balance : Math.max(tot - pd, 0)).replace(/[^\d.-]/g, '')) || 0
    const sName = b.stakeholder || b.stakeholderName ||
      [b.occupant?.stakeholder?.firstName, b.occupant?.stakeholder?.lastName].filter(Boolean).join(' ') ||
      b.occupantName || 'Stakeholder Lessee'
    const bName = b.business || b.businessName || b.occupant?.stakeholder?.businessName || ''
    const stNo = b.stall || b.stallNo || b.contract?.stall?.stallNo || ''
    const due = b.dueDate || b.due_date || ''
    const isOverdue = Boolean(due && new Date(due).getTime() < Date.now() && bal > 0)
    const status = bal <= 0 ? 'PAID' : (isOverdue ? 'OVERDUE' : (pd > 0 ? 'PARTIALLY_PAID' : 'UNPAID'))

    return {
      ...b,
      billingNo: b.billingNo || b.billing_no || (b.id ? `BILL-${b.id}` : 'BILL-Record'),
      stakeholder: sName,
      business: bName,
      stall: stNo,
      period: b.period || b.billingPeriod || b.billing_period || 'Monthly Rental',
      dueDate: due,
      totalAmount: tot,
      paidAmount: pd,
      balance: bal,
      status,
      isOverdue
    }
  })
})

const filteredLiabilities = computed(() => {
  const q = liabilitySearch.value.trim().toLowerCase()
  return liabilityRecords.value.filter((bill) => {
    // Search filter
    if (q) {
      const match =
        bill.billingNo?.toLowerCase().includes(q) ||
        bill.stakeholder?.toLowerCase().includes(q) ||
        bill.business?.toLowerCase().includes(q) ||
        bill.stall?.toLowerCase().includes(q)
      if (!match) return false
    }

    // Month filter
    if (selectedMonth.value && (bill.dueDate || bill.period)) {
      const d = new Date(bill.dueDate || bill.period)
      if (!isNaN(d.getTime()) && d.getMonth() + 1 !== Number(selectedMonth.value)) return false
    }

    // Year filter
    if (selectedYear.value && (bill.dueDate || bill.period)) {
      const d = new Date(bill.dueDate || bill.period)
      if (!isNaN(d.getTime()) && d.getFullYear() !== Number(selectedYear.value)) return false
    }

    // Status filter
    if (liabilityStatusFilter.value !== 'ALL') {
      if (liabilityStatusFilter.value === 'UNPAID_ONLY' && bill.balance <= 0) return false
      if (liabilityStatusFilter.value === 'OVERDUE' && bill.status !== 'OVERDUE') return false
      if (liabilityStatusFilter.value === 'PARTIALLY_PAID' && bill.status !== 'PARTIALLY_PAID') return false
      if (liabilityStatusFilter.value === 'PAID' && bill.balance > 0) return false
    }

    return true
  })
})

const totalOutstandingAmount = computed(() => {
  return liabilityRecords.value.reduce((sum, b) => sum + (b.balance > 0 ? b.balance : 0), 0)
})

const filteredOutstandingTotal = computed(() => {
  return filteredLiabilities.value.reduce((sum, b) => sum + (b.balance > 0 ? b.balance : 0), 0)
})

const filteredAmountDueTotal = computed(() => {
  return filteredLiabilities.value.reduce((sum, b) => sum + b.totalAmount, 0)
})

const filteredAmountPaidTotal = computed(() => {
  return filteredLiabilities.value.reduce((sum, b) => sum + b.paidAmount, 0)
})

const totalUnpaidCount = computed(() => {
  return liabilityRecords.value.filter((b) => b.balance > 0).length
})

const totalPaidCount = computed(() => {
  return liabilityRecords.value.filter((b) => b.balance <= 0).length
})

const totalSettledAmount = computed(() => {
  return liabilityRecords.value.reduce((sum, b) => sum + b.paidAmount, 0)
})

const collectionEfficiencyRate = computed(() => {
  const totalBilled = liabilityRecords.value.reduce((sum, b) => sum + b.totalAmount, 0)
  if (!totalBilled) return 100
  return Math.min(Math.round((totalSettledAmount.value / totalBilled) * 100), 100)
})

// =========================================================================
// 3. STALL OCCUPANCY REPORT DATA RESOLUTION
// =========================================================================
const stallsList = computed(() => {
  const rawStalls = (props.state?.stalls?.length ? props.state.stalls : internalStalls.value) || []
  const rawContracts = (props.state?.contracts?.length ? props.state.contracts : internalContracts.value) || []
  const rawStakeholders = (props.state?.stakeholders?.length ? props.state.stakeholders : internalStakeholders.value) || []

  return rawStalls.map((s) => {
    const sNo = s.stallNo || s.stall_no || s.number || ''
    const matchedContract = rawContracts.find(
      (c) => (c.stall && c.stall === sNo) || (c.stallNo && c.stallNo === sNo) || (c.stallId && String(c.stallId) === String(s.id))
    )
    const matchedStakeholder = rawStakeholders.find(
      (sh) => (sh.stall && sh.stall === sNo) || (sh.selectedStallId && String(sh.selectedStallId) === String(s.id))
    )

    const occupant = s.occupant
    const occName =
      matchedStakeholder?.name ||
      matchedContract?.stakeholder ||
      (occupant?.stakeholder ? [occupant.stakeholder.firstName, occupant.stakeholder.lastName].filter(Boolean).join(' ') : occupant?.name) ||
      ''

    const busName =
      matchedStakeholder?.business ||
      matchedContract?.business ||
      occupant?.stakeholder?.businessName ||
      ''

    const normStatus = String(s.status || '').toUpperCase()
    const isOccupied = ['OCCUPIED', 'RENTED', 'ASSIGNED'].includes(normStatus) || Boolean(occName)

    const contractNo =
      matchedContract?.contractNo ||
      matchedContract?.ref ||
      matchedStakeholder?.contract ||
      (isOccupied ? `CON-${sNo}` : 'None')

    const leasePeriod =
      matchedContract?.startDate && matchedContract?.endDate
        ? `${matchedContract.startDate} to ${matchedContract.endDate}`
        : (isOccupied ? 'Active Lease' : '—')

    return {
      ...s,
      stallNo: sNo,
      section: s.section || s.info || 'Main Public Section',
      stallType: s.stallType || s.stall_type || 'Standard Stall',
      monthlyRent: Number(s.monthlyRent ?? s.monthly_rent ?? 0),
      status: isOccupied ? 'OCCUPIED' : (normStatus === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE'),
      occupantName: isOccupied ? (occName || 'Assigned Stakeholder') : 'Available / Unassigned',
      businessName: busName || (isOccupied ? 'Registered Stall Vendor' : '—'),
      contractNo,
      leasePeriod
    }
  })
})

const uniqueSections = computed(() => {
  return [...new Set(stallsList.value.map((s) => s.section).filter(Boolean))]
})

const filteredOccupancyStalls = computed(() => {
  const q = occupancySearch.value.trim().toLowerCase()
  return stallsList.value.filter((stall) => {
    // Search
    if (q) {
      const match =
        stall.stallNo?.toLowerCase().includes(q) ||
        stall.section?.toLowerCase().includes(q) ||
        stall.stallType?.toLowerCase().includes(q) ||
        stall.occupantName?.toLowerCase().includes(q) ||
        stall.businessName?.toLowerCase().includes(q)
      if (!match) return false
    }

    // Status filter
    if (occupancyStatusFilter.value !== 'ALL') {
      if (occupancyStatusFilter.value === 'OCCUPIED' && stall.status !== 'OCCUPIED') return false
      if (occupancyStatusFilter.value === 'AVAILABLE' && stall.status !== 'AVAILABLE') return false
      if (occupancyStatusFilter.value === 'MAINTENANCE' && stall.status !== 'MAINTENANCE') return false
    }

    // Section filter
    if (occupancySectionFilter.value !== 'ALL' && stall.section !== occupancySectionFilter.value) {
      return false
    }

    return true
  })
})

const totalStallsCount = computed(() => stallsList.value.length)
const occupiedCount = computed(() => stallsList.value.filter((s) => s.status === 'OCCUPIED').length)
const vacantCount = computed(() => stallsList.value.filter((s) => s.status === 'AVAILABLE' || s.status === 'VACANT').length)
const overallOccupancyRate = computed(() => {
  if (!totalStallsCount.value) return 0
  return Math.round((occupiedCount.value / totalStallsCount.value) * 100)
})

const potentialMonthlyRent = computed(() => {
  return stallsList.value.reduce((sum, s) => sum + s.monthlyRent, 0)
})

const occupiedMonthlyRent = computed(() => {
  return stallsList.value.filter((s) => s.status === 'OCCUPIED').reduce((sum, s) => sum + s.monthlyRent, 0)
})

const sectionBreakdown = computed(() => {
  const map = {}
  stallsList.value.forEach((stall) => {
    const sec = stall.section || 'General'
    if (!map[sec]) {
      map[sec] = { name: sec, total: 0, occupied: 0, vacant: 0, potentialRent: 0 }
    }
    map[sec].total += 1
    if (stall.status === 'OCCUPIED') {
      map[sec].occupied += 1
    } else {
      map[sec].vacant += 1
    }
    map[sec].potentialRent += Number(stall.monthlyRent || 0)
  })

  return Object.values(map).map((sec) => ({
    ...sec,
    rate: sec.total ? Math.round((sec.occupied / sec.total) * 100) : 0
  }))
})

// =========================================================================
// EXPORT & PRINT ACTIONS
// =========================================================================
function handleExportCsv() {
  if (currentTab.value === 'collection') {
    const headers = [
      { key: 'orNo', label: 'Official Receipt (OR No.)' },
      { key: 'date', label: 'Payment Date' },
      { key: 'payor', label: 'Payor / Stakeholder' },
      { key: 'business', label: 'Business Name' },
      { key: 'stall', label: 'Stall No.' },
      { key: 'type', label: 'Payment Type' },
      { key: 'referenceNo', label: 'Reference No.' },
      { key: 'rawAmount', label: 'Amount Collected (PHP)' },
      { key: 'recordedBy', label: 'Recorded By' },
      { key: 'status', label: 'Status' }
    ]
    exportToCsv('Collection_Report_Treasurer', headers, filteredCollections.value)
  } else if (currentTab.value === 'liability') {
    const headers = [
      { key: 'billingNo', label: 'Billing No.' },
      { key: 'stakeholder', label: 'Stakeholder / Lessee' },
      { key: 'business', label: 'Business Name' },
      { key: 'stall', label: 'Stall No.' },
      { key: 'period', label: 'Obligation Period' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'totalAmount', label: 'Amount Due (PHP)' },
      { key: 'paidAmount', label: 'Amount Paid (PHP)' },
      { key: 'balance', label: 'Outstanding Balance (PHP)' },
      { key: 'status', label: 'Payment Status' }
    ]
    exportToCsv('Liability_Report_Stakeholders', headers, filteredLiabilities.value)
  } else if (currentTab.value === 'occupancy') {
    const headers = [
      { key: 'stallNo', label: 'Stall Number' },
      { key: 'section', label: 'Section' },
      { key: 'stallType', label: 'Stall Type' },
      { key: 'monthlyRent', label: 'Rental Rate (PHP)' },
      { key: 'status', label: 'Occupancy Status' },
      { key: 'occupantName', label: 'Assigned Stakeholder / Occupant' },
      { key: 'businessName', label: 'Business Name' },
      { key: 'contractNo', label: 'Contract Reference' },
      { key: 'leasePeriod', label: 'Lease Period' }
    ]
    exportToCsv('Stall_Occupancy_Report', headers, filteredOccupancyStalls.value)
  }
}

function handlePrintReport() {
  window.print()
}

// Utilities
function formatMoney(val) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(val || 0))
}

function formatDate(val) {
  if (!val) return '—'
  const d = new Date(val)
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<style scoped src="../../styles/components/MarketReports.css"></style>
