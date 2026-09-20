<template>
  <div class="layout min-h-screen bg-slate-50">
    <TreasurerMenu />

    <!-- ========================= -->
    <!-- MAIN CONTENT -->
    <!-- ========================= -->

    <main class="page-container">

      <!-- ========================= -->
      <!-- PAGE HEADER -->
      <!-- ========================= -->

      <div class="page-header">

        <div>
          <h2 class="page-title">
            Treasurer Reports
          </h2>

          <p class="page-subtitle">
            Monitor billing, collections, and account statuses
          </p>
        </div>

        <button
          class="refresh-btn"
          @click="refreshReports"
        >
          <i class="pi pi-refresh" />
          Refresh Reports
        </button>

      </div>
      <!-- ========================= -->
      <!-- FILTER SECTION -->
      <!-- ========================= -->

      <div class="filter-section">

  <div class="filter-group">

    <!-- MONTH FILTER -->
    <div class="filter-item">
      <label>Month</label>

      <select
        v-model="selectedMonth"
        class="modern-select"
      >
        <option value="">
          All Months
        </option>

        <option
          v-for="month in months"
          :key="month.value"
          :value="month.value"
        >
          {{ month.label }}
        </option>
      </select>
    </div>

    <!-- YEAR FILTER -->
    <div class="filter-item">
      <label>Year</label>

      <select
        v-model="selectedYear"
        class="modern-select"
      >
        <option value="">
          All Years
        </option>

        <option
          v-for="year in years"
          :key="year"
          :value="year"
        >
          {{ year }}
        </option>
      </select>
    </div>

  </div>

  <div class="filter-actions">

    <button
      class="refresh-btn"
      @click="applyFilters"
    >
      <i class="pi pi-filter" />
      Apply Filters
    </button>

    <button
      class="clear-btn"
      @click="clearFilters"
    >
      <i class="pi pi-times" />
      Clear
    </button>

  </div>

</div>
      <!-- ========================= -->
      <!-- SUMMARY CARDS -->
      <!-- ========================= -->

      <div class="summary-grid">

        <div class="summary-card">
          <div class="summary-icon blue">
            <i class="pi pi-wallet" />
          </div>

          <div>
            <p class="summary-label">
              Total Collected
            </p>

            <h3 class="summary-value">
              ₱ {{ totalCollected }}
            </h3>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon red">
            <i class="pi pi-exclamation-circle" />
          </div>

          <div>
            <p class="summary-label">
              Outstanding
            </p>

            <h3 class="summary-value">
              ₱ {{ totalOutstanding }}
            </h3>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon green">
            <i class="pi pi-check-circle" />
          </div>

          <div>
            <p class="summary-label">
              Paid Accounts
            </p>

            <h3 class="summary-value">
              {{ paidAccounts }}
            </h3>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon orange">
            <i class="pi pi-times-circle" />
          </div>

          <div>
            <p class="summary-label">
              Unpaid Accounts
            </p>

            <h3 class="summary-value">
              {{ unpaidAccounts }}
            </h3>
          </div>
        </div>

      </div>

      <!-- ========================= -->
      <!-- BILLING REPORT -->
      <!-- ========================= -->

      <div class="modern-card mb-4">

        <div class="card-header-modern">
          <div>
            <h4>Billing Report</h4>
            <p>Outstanding balances and due dates</p>
          </div>
        </div>

        <div class="table-wrapper">

          <table class="modern-table">

            <thead>
              <tr>
                <th>Billing No</th>
                <th>Business Name</th>
                <th>Balance</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              <tr
                v-for="billing in outstandingBalances"
                :key="billing.billingNo"
              >
                <td>{{ billing.billingNo }}</td>

                <td>{{ billing.businessName }}</td>

                <td class="fw-semibold">
                  ₱ {{ billing.balance }}
                </td>

                <td>{{ billing.dueDate }}</td>

                <td>

                  <span
                    class="status-badge"
                    :class="
                      billing.balance > 0
                        ? 'danger'
                        : 'success'
                    "
                  >
                    {{
                      billing.balance > 0
                        ? 'UNPAID'
                        : 'PAID'
                    }}
                  </span>

                </td>
              </tr>

            </tbody>

          </table>

        </div>

      </div>

      <!-- ========================= -->
      <!-- PAYMENT REPORT -->
      <!-- ========================= -->

      <div class="modern-card">

        <div class="card-header-modern">
          <div>
            <h4>Payment Collections</h4>
            <p>Daily collection summaries</p>
          </div>
        </div>

        <div class="table-wrapper">

          <table class="modern-table">

            <thead>
              <tr>
                <th>Date</th>
                <th>Total Transactions</th>
                <th>Total Collections</th>
              </tr>
            </thead>

            <tbody>

              <tr
                v-for="payment in dailyCollections"
                :key="payment.date"
              >
                <td>{{ payment.date }}</td>

                <td>
                  {{ payment.totalTransactions }}
                </td>

                <td class="fw-semibold">
                  ₱ {{ payment.totalAmount }}
                </td>
              </tr>

            </tbody>

          </table>

        </div>

      </div>

    </main>

  </div>
</template>

<script>
import api from "../services/api";
import TreasurerMenu from "../components/TreasurerMenu.vue";

export default {
  name: "TreasurerReports",

  components: {
    TreasurerMenu
  },

  data() {
    return {
      // =========================
      // REPORT DATA
      // =========================

      outstandingBalances: [],
      dailyCollections: [],

      totalCollected: 0,
      totalOutstanding: 0,

      paidAccounts: 0,
      unpaidAccounts: 0,

      // =========================
      // FILTERS
      // =========================

      selectedMonth: "",
      selectedYear: "",

      months: [
        { label: "January", value: 1 },
        { label: "February", value: 2 },
        { label: "March", value: 3 },
        { label: "April", value: 4 },
        { label: "May", value: 5 },
        { label: "June", value: 6 },
        { label: "July", value: 7 },
        { label: "August", value: 8 },
        { label: "September", value: 9 },
        { label: "October", value: 10 },
        { label: "November", value: 11 },
        { label: "December", value: 12 }
      ],

      years: [
        2023,
        2024,
        2025,
        2026
      ]
    };
  },

  methods: {

    // =========================
    // FILTERS
    // =========================

    async applyFilters() {

      await this.refreshReports();

    },

    async clearFilters() {

      this.selectedMonth = "";
      this.selectedYear = "";

      await this.refreshReports();

    },

    // =========================
    // OUTSTANDING BALANCES
    // =========================

    async loadOutstandingBalances() {

      try {

        const response = await api.get(
          "/reports/outstanding-balances",
          {
            params: {
              month: this.selectedMonth,
              year: this.selectedYear
            }
          }
        );

        this.outstandingBalances = response.data;

        let outstanding = 0;

        // RESET COUNTERS
        this.paidAccounts = 0;
        this.unpaidAccounts = 0;

        this.outstandingBalances.forEach(b => {

          outstanding += Number(b.balance);

          if (Number(b.balance) > 0) {

            this.unpaidAccounts++;

          } else {

            this.paidAccounts++;

          }

        });

        this.totalOutstanding =
          outstanding.toFixed(2);

      } catch (error) {

        console.error(
          "Error loading outstanding balances:",
          error
        );

      }

    },

    // =========================
    // DAILY COLLECTIONS
    // =========================

    async loadDailyCollections() {

      try {

        const response = await api.get(
          "/reports/daily-collections",
          {
            params: {
              month: this.selectedMonth,
              year: this.selectedYear
            }
          }
        );

        this.dailyCollections = response.data;

        let total = 0;

        this.dailyCollections.forEach(p => {

          total += Number(p.totalAmount);

        });

        this.totalCollected =
          total.toFixed(2);

      } catch (error) {

        console.error(
          "Error loading daily collections:",
          error
        );

      }

    },

    // =========================
    // REFRESH REPORTS
    // =========================

    async refreshReports() {

      await this.loadOutstandingBalances();
      await this.loadDailyCollections();

    }

  },

  // =========================
  // MOUNTED
  // =========================

  async mounted() {

    const saved =
      localStorage.getItem(
        "sidebar-collapsed"
      );

    if (saved !== null) {

      this.collapsed =
        saved === "true";

    }

    await this.refreshReports();

  }

};
</script>
<style scoped src="./Report.css"></style>
