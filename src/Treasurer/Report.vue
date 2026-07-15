<template>
  <div class="treasurer-layout">

    <!-- ========================= -->
    <!-- SIDEBAR -->
    <!-- ========================= -->

    <aside
      class="sidebar"
      :class="{ collapsed }"
    >
      <div class="sidebar-container">

        <!-- Header -->
        <div class="sidebar-header">

          <button
            class="toggle-btn"
            @click="toggleSidebar"
          >
            <i :class="collapsed ? 'pi pi-bars' : 'pi pi-angle-left'" />
          </button>

          <Transition name="fade-slide">
            <div
              v-if="!collapsed"
              class="brand"
            >
              <div class="brand-logo">
                TR
              </div>

              <div class="brand-text">
                <h1>Treasurer</h1>
                <p>Management Panel</p>
              </div>
            </div>
          </Transition>

        </div>

        <!-- Navigation -->
        <nav class="nav-menu">

          <button
            v-for="item in items"
            :key="item.id"
            class="nav-item"
            :class="{
              active: isActive(item),
              collapsed
            }"
            @click="navigate(item)"
          >
            <i
              :class="item.icon"
              class="nav-icon"
            />

            <Transition name="fade-slide">
              <span
                v-if="!collapsed"
                class="nav-label"
              >
                {{ item.label }}
              </span>
            </Transition>

            <div
              v-if="isActive(item)"
              class="active-indicator"
            />

          </button>

        </nav>

        <!-- Footer -->
        <div class="sidebar-footer">

          <button
            class="logout-btn"
            :class="{ collapsed }"
            @click="logout"
          >
            <i class="pi pi-sign-out" />

            <Transition name="fade-slide">
              <span v-if="!collapsed">
                Logout
              </span>
            </Transition>

          </button>

        </div>

      </div>
    </aside>

    <!-- ========================= -->
    <!-- MAIN CONTENT -->
    <!-- ========================= -->

    <main
      class="main-content"
      :class="{ collapsed }"
    >

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
<!-- PLACE THIS ABOVE SUMMARY GRID
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

export default {
  name: "TreasurerReports",

  data() {
    return {

      // =========================
      // SIDEBAR
      // =========================

      collapsed: false,

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
      ],

      // =========================
      // NAVIGATION
      // =========================

      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: "pi pi-home",
          routeName: "Treasurer"
        },
        {
          id: "stakeholder",
          label: "Applicants",
          icon: "pi pi-users",
          routeName: "Applicant"
        },
        {
          id: "billing",
          label: "Billing",
          icon: "pi pi-receipt",
          routeName: "Billing"
        },
        {
          id: "payment",
          label: "Payments",
          icon: "pi pi-wallet",
          routeName: "Payment"
        },
        {
          id: "report",
          label: "Reports",
          icon: "pi pi-chart-bar",
          routeName: "Report"
        },
        {
          id: "audit",
          label: "Audit Logs",
          icon: "pi pi-list",
          routeName: "AuditLogs"
        }
      ]

    };
  },

  methods: {

    // =========================
    // SIDEBAR
    // =========================

    toggleSidebar() {

      this.collapsed = !this.collapsed;

      localStorage.setItem(
        "sidebar-collapsed",
        this.collapsed
      );

    },

    isActive(item) {

      return this.$route.name === item.routeName;

    },

    navigate(item) {

      this.$router.push({
        name: item.routeName
      });

    },

    logout() {

      localStorage.removeItem("authToken");

      this.$router.push({
        name: "Landing"
      });

    },

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
<style scoped>

:root {
  --sidebar-width: 280px;
  --primary: #4f46e5;
  --primary-light: #eef2ff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --bg: #f8fafc;
}

/* =========================
   LAYOUT
========================= */

.treasurer-layout {
  display: flex;
  background: var(--bg);
  min-height: 100vh;
}

/* =========================
   SIDEBAR
========================= */

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 280px;
  transition: all 0.3s ease;
  z-index: 1000;
}

.sidebar.collapsed {
  width: 90px;
}

.sidebar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(18px);
  border-right: 1px solid var(--border);
  box-shadow:
    0 10px 40px rgba(15,23,42,0.06);
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 1.2rem;
  min-height: 82px;
  border-bottom: 1px solid var(--border);
}

.toggle-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 14px;
  background: #f8fafc;
  color: var(--muted);
  cursor: pointer;
  transition: 0.25s ease;
  font-size: 1.1rem;
}

.toggle-btn:hover {
  background: var(--primary-light);
  color: var(--primary);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: 14px;
}

.brand-logo {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-weight: 800;
  color: white;
  background: linear-gradient(
    135deg,
    #6366f1,
    #4338ca
  );
}

.brand-text h1 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
}

.brand-text p {
  margin: 0;
  color: var(--muted);
  font-size: 0.8rem;
}

/* =========================
   NAVIGATION
========================= */

.nav-menu {
  flex: 1;
  padding: 1rem 0.8rem;
}

.nav-item {
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  margin-bottom: 8px;
  border: none;
  border-radius: 18px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.25s ease;
}

.nav-item.collapsed {
  justify-content: center;
}

.nav-item:hover {
  background: #f8fafc;
  color: var(--primary);
}

.nav-item.active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 700;
}

.nav-icon {
  font-size: 1.2rem;
}

.active-indicator {
  position: absolute;
  right: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: none;
  border-radius: 18px;
  background: #fff1f2;
  color: #e11d48;
  cursor: pointer;
  font-weight: 600;
}

.logout-btn.collapsed {
  justify-content: center;
}

/* =========================
   MAIN CONTENT
========================= */

.main-content {
  flex: 1;
  margin-left: 280px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.main-content.collapsed {
  margin-left: 90px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  color: var(--text);
}

.page-subtitle {
  color: var(--muted);
  margin-top: 6px;
}

.refresh-btn {
  border: none;
  background: linear-gradient(
    135deg,
    #6366f1,
    #4338ca
  );
  color: white;
  padding: 12px 20px;
  border-radius: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: 0.25s ease;
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 24px rgba(79,70,229,0.25);
}

/* =========================
   SUMMARY CARDS
========================= */

.summary-grid {
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: white;
  border-radius: 24px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow:
    0 10px 30px rgba(15,23,42,0.06);
}

.summary-icon {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 1.4rem;
}

.summary-icon.blue {
  background: #eef2ff;
  color: #4f46e5;
}

.summary-icon.red {
  background: #fef2f2;
  color: #dc2626;
}

.summary-icon.green {
  background: #ecfdf5;
  color: #059669;
}

.summary-icon.orange {
  background: #fff7ed;
  color: #ea580c;
}

.summary-label {
  color: var(--muted);
  margin-bottom: 5px;
}

.summary-value {
  margin: 0;
  font-weight: 800;
}

/* =========================
   TABLES
========================= */

.modern-card {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    0 10px 30px rgba(15,23,42,0.06);
}

.card-header-modern {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.card-header-modern h4 {
  margin: 0;
  font-weight: 700;
}

.card-header-modern p {
  margin-top: 6px;
  color: var(--muted);
}

.table-wrapper {
  overflow-x: auto;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-table thead {
  background: #f8fafc;
}

.modern-table th,
.modern-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.modern-table tbody tr {
  transition: 0.2s ease;
}

.modern-table tbody tr:hover {
  background: #f8fafc;
}

.status-badge {
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.status-badge.success {
  background: #dcfce7;
  color: #15803d;
}

.status-badge.danger {
  background: #fee2e2;
  color: #dc2626;
}

/* =========================
   ANIMATION
========================= */

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* =========================
   MOBILE
========================= */

@media (max-width: 768px) {

  .sidebar {
    z-index: 2000;
  }

  .main-content,
  .main-content.collapsed {
    margin-left: 0;
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

}
/* =========================
   FILTERS
========================= */

.filter-section {
  background: white;
  border-radius: 24px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
  flex-wrap: wrap;
  box-shadow:
    0 10px 30px rgba(15,23,42,0.06);
}

.filter-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
}

.modern-select {
  min-width: 180px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 14px;
  background: white;
  font-size: 0.95rem;
  transition: 0.2s ease;
}

.modern-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow:
    0 0 0 4px rgba(99,102,241,0.1);
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.clear-btn {
  border: none;
  background: #f1f5f9;
  color: #475569;
  padding: 12px 18px;
  border-radius: 14px;
  font-weight: 600;
  transition: 0.2s ease;
}

.clear-btn:hover {
  background: #e2e8f0;
}
</style>
