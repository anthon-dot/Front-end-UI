<template>
  <div class="reports-page">
    <main class="content">
      <!-- HEADER -->
      <header class="page-header">
        <div>
          <div class="header-badge">
            <i class="pi pi-shield"></i>
            Market Supervisor Portal
          </div>
          <h1 class="title">
            Supervisor Reports & Analytics
          </h1>
          <p class="subtitle">
            Monitor lease contract expirations, stall occupancy metrics, and municipal market incident logs
          </p>
        </div>

        <div v-if="isAuthorized" class="header-actions">
          <button
            class="btn-outline"
            @click="refreshCurrentTab"
            :disabled="isLoading"
            title="Refresh current report data"
          >
            <i class="pi pi-refresh" :class="{ 'pi-spin': isLoading }"></i>
            <span>Refresh</span>
          </button>

          <template v-if="activeTab === 'due-soon'">
            <button class="btn-success" @click="exportToExcel" title="Export as spreadsheet">
              <i class="pi pi-file-excel"></i>
              <span>Export Excel</span>
            </button>
            <button class="btn-danger-outline" @click="exportToPDF" title="Export printable PDF report">
              <i class="pi pi-file-pdf"></i>
              <span>Export PDF</span>
            </button>
            <button class="btn-primary" @click="printReport" title="Print document">
              <i class="pi pi-print"></i>
              <span>Print</span>
            </button>
          </template>

          <template v-else-if="activeTab === 'occupancy'">
            <button class="btn-success" @click="exportOccupancyToExcel" title="Export occupancy spreadsheet">
              <i class="pi pi-file-excel"></i>
              <span>Export Excel</span>
            </button>
            <button class="btn-primary" @click="printReport" title="Print document">
              <i class="pi pi-print"></i>
              <span>Print</span>
            </button>
          </template>

          <template v-else-if="activeTab === 'incidents'">
            <button class="btn-primary" @click="openCreate">
              <i class="pi pi-plus"></i>
              <span>Add Incident Report</span>
            </button>
          </template>
        </div>
      </header>

      <!-- RESTRICTED ACCESS NOTICE (IF UNAUTHORIZED) -->
      <section v-if="!isAuthorized" class="access-panel">
        <div class="access-icon-wrap">
          <i class="pi pi-lock"></i>
        </div>
        <h2>Access Restricted</h2>
        <p>This reporting module is strictly reserved for authorized Market Supervisors, Administrators, and Treasurers.</p>
        <div class="access-role-note">
          Current session role: <strong>{{ currentRole || 'Guest' }}</strong>
        </div>
      </section>

      <!-- MAIN REPORT CONTENT -->
      <template v-else>
        <!-- NAVIGATION TABS -->
        <nav class="report-tabs-nav" aria-label="Report Views">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'due-soon' }"
            @click="activeTab = 'due-soon'"
          >
            <i class="pi pi-hourglass"></i>
            <span>Due Soon Contracts</span>
            <span class="tab-badge warning" v-if="dueSoonTotalCount > 0">{{ dueSoonTotalCount }}</span>
          </button>

          <button
            class="tab-btn"
            :class="{ active: activeTab === 'occupancy' }"
            @click="activeTab = 'occupancy'"
          >
            <i class="pi pi-chart-pie"></i>
            <span>Stall Occupancy & Capacity</span>
          </button>

          <button
            class="tab-btn"
            :class="{ active: activeTab === 'incidents' }"
            @click="activeTab = 'incidents'"
          >
            <i class="pi pi-clipboard"></i>
            <span>Field & Incident Reports</span>
            <span class="tab-badge">{{ reports.length }}</span>
          </button>
        </nav>

        <!-- ======================================================== -->
        <!-- TAB 1: DUE SOON & EXPIRING CONTRACTS (PRIMARY)           -->
        <!-- ======================================================== -->
        <section v-if="activeTab === 'due-soon'" class="report-section">
          <!-- STAT CARDS -->
          <div class="stats-grid contracts-stats-grid">
            <div class="stat-card urgent-card">
              <div class="stat-card-header">
                <span class="stat-pill red">Urgent</span>
                <div class="stat-icon red-icon"><i class="pi pi-exclamation-triangle"></i></div>
              </div>
              <div class="stat-value red-text">{{ criticalCount }}</div>
              <div class="stat-label">Expiring in ≤ 30 Days</div>
              <div class="stat-sub">{{ formatCurrency(criticalRent) }} / mo at risk</div>
            </div>

            <div class="stat-card warning-card">
              <div class="stat-card-header">
                <span class="stat-pill amber">Warning</span>
                <div class="stat-icon amber-icon"><i class="pi pi-clock"></i></div>
              </div>
              <div class="stat-value amber-text">{{ warningCount }}</div>
              <div class="stat-label">Expiring in 31 – 60 Days</div>
              <div class="stat-sub">{{ formatCurrency(warningRent) }} / mo renewal window</div>
            </div>

            <div class="stat-card upcoming-card">
              <div class="stat-card-header">
                <span class="stat-pill blue">Upcoming</span>
                <div class="stat-icon blue-icon"><i class="pi pi-calendar"></i></div>
              </div>
              <div class="stat-value blue-text">{{ upcomingCount }}</div>
              <div class="stat-label">Expiring in 61 – 90 Days</div>
              <div class="stat-sub">{{ formatCurrency(upcomingRent) }} / mo projection</div>
            </div>

            <div class="stat-card expired-card">
              <div class="stat-card-header">
                <span class="stat-pill dark">Past Due</span>
                <div class="stat-icon dark-icon"><i class="pi pi-ban"></i></div>
              </div>
              <div class="stat-value dark-text">{{ expiredCount }}</div>
              <div class="stat-label">Overdue / Expired</div>
              <div class="stat-sub">Immediate action required</div>
            </div>

            <div class="stat-card summary-card">
              <div class="stat-card-header">
                <span class="stat-pill teal">Revenue Exposure</span>
                <div class="stat-icon teal-icon"><i class="pi pi-wallet"></i></div>
              </div>
              <div class="stat-value teal-text">{{ formatCurrency(totalRentAtRisk) }}</div>
              <div class="stat-label">Total Rent at Risk (≤90d)</div>
              <div class="stat-sub">{{ dueSoonTotalCount }} contracts nearing expiration</div>
            </div>
          </div>

          <!-- FILTERS & SEARCH BAR -->
          <div class="filter-bar-card">
            <div class="filter-group">
              <div class="search-wrap">
                <i class="pi pi-search search-icon"></i>
                <input
                  v-model="contractSearch"
                  type="text"
                  placeholder="Search contract ref, stall no., stakeholder name..."
                  class="filter-input"
                />
                <button
                  v-if="contractSearch"
                  class="clear-btn"
                  @click="contractSearch = ''"
                  title="Clear search"
                >
                  <i class="pi pi-times"></i>
                </button>
              </div>

              <div class="select-wrap">
                <label class="select-label"><i class="pi pi-filter"></i> Urgency Filter:</label>
                <select v-model="contractFilter" class="filter-select">
                  <option value="ALL_DUE">Expiring Soon (≤ 90 Days + Overdue)</option>
                  <option value="CRITICAL">Critical Only (≤ 30 Days)</option>
                  <option value="WARNING">Warning (31 – 60 Days)</option>
                  <option value="UPCOMING">Upcoming (61 – 90 Days)</option>
                  <option value="EXPIRED">Overdue / Expired Only</option>
                  <option value="ALL">All Active Contracts (Full Registry)</option>
                </select>
              </div>

              <div class="select-wrap">
                <label class="select-label"><i class="pi pi-sort-alt"></i> Sort By:</label>
                <select v-model="contractSort" class="filter-select">
                  <option value="urgency">Most Urgent Expirations First</option>
                  <option value="rentDesc">Highest Monthly Rent First</option>
                  <option value="endDate">End Date (Chronological)</option>
                  <option value="stallNo">Stall Number (A-Z)</option>
                </select>
              </div>
            </div>

            <div class="filter-status-info">
              Showing <strong>{{ filteredDueContracts.length }}</strong> of <strong>{{ enrichedContracts.length }}</strong> contracts
            </div>
          </div>

          <!-- CONTRACTS TABLE CARD -->
          <div class="table-card print-card">
            <div class="table-header">
              <div>
                <h2>Expiring Lease Contracts Directory</h2>
                <p>Contract end date countdowns, stakeholder info, and renewal issuance</p>
              </div>
              <div class="table-header-meta" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <button
                  type="button"
                  class="btn-outline email-due-btn"
                  style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; border: 1px solid #cbd5e1; background: #ffffff;"
                  :disabled="isSendingNoticeEmail"
                  @click="emailAllDueSoonContracts"
                >
                  <i class="pi pi-send" style="color: #0284c7;"></i>
                  <span>Email All Due Soon</span>
                </button>
                <span class="report-timestamp">As of {{ currentFormattedDate }}</span>
              </div>
            </div>

            <div class="table-wrapper">
              <table class="report-table contracts-table">
                <thead>
                  <tr>
                    <th>Contract Ref</th>
                    <th>Stall</th>
                    <th>Lessee / Stakeholder</th>
                    <th>Monthly Rent</th>
                    <th>Lease Period</th>
                    <th>Days Remaining</th>
                    <th>Urgency Status</th>
                    <th class="actions-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="contract in filteredDueContracts"
                    :key="contract.id"
                    :class="{ 'row-critical': contract.urgencyCategory === 'CRITICAL', 'row-expired': contract.urgencyCategory === 'EXPIRED' }"
                  >
                    <td>
                      <div class="contract-ref-cell">
                        <i class="pi pi-file-o contract-icon"></i>
                        <div>
                          <span class="contract-no">{{ contract.contractNo || contract.ref }}</span>
                          <span class="billing-freq">{{ contract.billingFrequency || 'MONTHLY' }}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div class="stall-badge-wrap">
                        <span class="stall-badge">{{ contract.stallNo }}</span>
                        <span class="stall-type-tag">{{ contract.stallType || 'Standard' }}</span>
                      </div>
                    </td>

                    <td>
                      <div class="stakeholder-cell">
                        <div class="sh-avatar">{{ getInitials(contract.stakeholderName) }}</div>
                        <div class="sh-details">
                          <strong class="sh-name">{{ contract.stakeholderName }}</strong>
                          <span class="sh-contact" v-if="contract.contact">
                            <i class="pi pi-phone"></i> {{ contract.contact }}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td class="rent-cell">
                      <strong>{{ formatCurrency(contract.monthlyRent) }}</strong>
                    </td>

                    <td>
                      <div class="period-cell">
                        <span class="date-start">{{ formatDateOnly(contract.startDate) }}</span>
                        <i class="pi pi-arrow-right date-arrow"></i>
                        <span class="date-end" :class="{ 'date-urgent': contract.daysRemaining <= 30 }">
                          {{ formatDateOnly(contract.endDate) }}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div class="countdown-badge-wrap">
                        <span
                          class="countdown-badge"
                          :class="countdownBadgeClass(contract)"
                        >
                          <i :class="countdownIcon(contract)"></i>
                          {{ formatCountdownText(contract) }}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span class="urgency-pill" :class="contract.urgencyCategory.toLowerCase()">
                        {{ contract.urgencyLabel }}
                      </span>
                    </td>

                    <td class="actions-cell">
                      <div class="actions">
                        <button
                          class="action-btn email-btn"
                          title="Email Official Expiration Notice"
                          :disabled="isSendingNoticeEmail"
                          @click="sendNoticeEmail(contract)"
                        >
                          <i class="pi pi-send"></i>
                          <span>Email</span>
                        </button>

                        <button
                          class="action-btn notice-btn"
                          title="Generate Renewal Notice"
                          @click="openNoticeModal(contract)"
                        >
                          <i class="pi pi-envelope"></i>
                          <span>Notice</span>
                        </button>

                        <button
                          class="action-btn view-btn"
                          title="View Lease Details"
                          @click="openDetailModal(contract)"
                        >
                          <i class="pi pi-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr v-if="filteredDueContracts.length === 0">
                    <td colspan="8" class="empty-cell">
                      <div class="empty-state-wrap">
                        <i class="pi pi-check-circle empty-state-icon"></i>
                        <h3>No contracts matching this urgency filter</h3>
                        <p>All active contracts in this criteria are currently in good standing or no records match your search.</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ======================================================== -->
        <!-- TAB 2: STALL OCCUPANCY & CAPACITY REPORT                  -->
        <!-- ======================================================== -->
        <section v-if="activeTab === 'occupancy'" class="report-section">
          <div class="stats-grid occupancy-stats-grid">
            <div class="stat-card">
              <div class="stat-card-header">
                <span class="stat-pill teal">Inventory</span>
                <div class="stat-icon teal-icon"><i class="pi pi-th-large"></i></div>
              </div>
              <div class="stat-value">{{ stallsList.length }}</div>
              <div class="stat-label">Total Municipal Stalls</div>
              <div class="stat-sub">Across all sections</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-header">
                <span class="stat-pill green">Active</span>
                <div class="stat-icon green-icon"><i class="pi pi-check-circle"></i></div>
              </div>
              <div class="stat-value green-text">{{ occupiedStallsCount }}</div>
              <div class="stat-label">Occupied Stalls</div>
              <div class="stat-sub">{{ occupancyRate }}% Occupancy Rate</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-header">
                <span class="stat-pill blue">Ready</span>
                <div class="stat-icon blue-icon"><i class="pi pi-tag"></i></div>
              </div>
              <div class="stat-value blue-text">{{ vacantStallsCount }}</div>
              <div class="stat-label">Available / Vacant</div>
              <div class="stat-sub">Ready for lease assignment</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-header">
                <span class="stat-pill amber">Off-Market</span>
                <div class="stat-icon amber-icon"><i class="pi pi-wrench"></i></div>
              </div>
              <div class="stat-value amber-text">{{ unavailableStallsCount }}</div>
              <div class="stat-label">Maintenance / Unavailable</div>
              <div class="stat-sub">Currently not lettable</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-header">
                <span class="stat-pill dark">Archive</span>
                <div class="stat-icon dark-icon"><i class="pi pi-inbox"></i></div>
              </div>
              <div class="stat-value dark-text">{{ archivedStallsCount }}</div>
              <div class="stat-label">Archived Stalls</div>
              <div class="stat-sub">Decommissioned stalls</div>
            </div>
          </div>

          <!-- SECTION BREAKDOWN TABLE -->
          <div class="table-card print-card">
            <div class="table-header">
              <div>
                <h2>Section & Commodity Breakdown</h2>
                <p>Capacity utilization and monthly rent potential per market section</p>
              </div>
            </div>

            <div class="table-wrapper">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Section / Type</th>
                    <th>Total Stalls</th>
                    <th>Occupied</th>
                    <th>Available</th>
                    <th>Unavailable</th>
                    <th>Archived</th>
                    <th>Occupancy Rate</th>
                    <th>Potential Revenue / mo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="sec in sectionBreakdown" :key="sec.name">
                    <td>
                      <strong>{{ sec.name }}</strong>
                    </td>
                    <td>{{ sec.total }}</td>
                    <td><span class="num-tag green-tag">{{ sec.occupied }}</span></td>
                    <td><span class="num-tag blue-tag">{{ sec.vacant }}</span></td>
                    <td><span class="num-tag amber-tag">{{ sec.unavailable }}</span></td>
                    <td><span class="num-tag dark-tag">{{ sec.archived }}</span></td>
                    <td>
                      <div class="rate-progress-wrap">
                        <div class="rate-bar" :style="{ width: sec.rate + '%' }"></div>
                        <span class="rate-text">{{ sec.rate }}%</span>
                      </div>
                    </td>
                    <td><strong>{{ formatCurrency(sec.potentialRent) }}</strong></td>
                  </tr>

                  <tr v-if="sectionBreakdown.length === 0">
                    <td colspan="8" class="empty-cell">No stall data loaded.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ======================================================== -->
        <!-- TAB 3: FIELD & INCIDENT REPORTS (CRUD PRESERVED)          -->
        <!-- ======================================================== -->
        <section v-if="activeTab === 'incidents'" class="report-section">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Reports</div>
              <div class="stat-value">{{ reports.length }}</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">Submitted</div>
              <div class="stat-value">{{ submittedCount }}</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">Visible Records</div>
              <div class="stat-value">{{ filteredReports.length }}</div>
            </div>
          </div>

          <div class="filter-bar-card">
            <div class="search-wrap">
              <i class="pi pi-search search-icon"></i>
              <input
                v-model="search"
                type="text"
                placeholder="Search incident reports by title or description..."
                class="filter-input"
              />
            </div>
          </div>

          <div class="table-card">
            <div class="table-header">
              <div>
                <h2>Incident & Inspection Reports</h2>
                <p>{{ filteredReports.length }} logged records</p>
              </div>

              <button class="btn-outline" @click="loadReports">
                <i class="pi pi-refresh"></i>
                Refresh
              </button>
            </div>

            <div class="table-wrapper">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Supervisor</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="report in filteredReports" :key="report.id">
                    <td>
                      <div class="report-title">{{ report.title }}</div>
                    </td>

                    <td class="description-cell">
                      {{ report.description || 'No description' }}
                    </td>

                    <td>
                      <span class="status-badge" :class="statusClass(report.status)">
                        {{ report.status }}
                      </span>
                    </td>

                    <td>{{ formatDate(report.createdDate) }}</td>

                    <td>{{ report.supervisorName }}</td>

                    <td>
                      <div class="actions">
                        <button
                          class="icon-btn"
                          title="Edit report"
                          @click="openEdit(report)"
                        >
                          <i class="pi pi-pencil"></i>
                        </button>

                        <button
                          class="icon-btn danger"
                          title="Delete report"
                          @click="confirmDelete(report)"
                        >
                          <i class="pi pi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr v-if="filteredReports.length === 0">
                    <td colspan="6" class="empty-cell">
                      No incident reports found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </template>
    </main>

    <!-- ======================================================== -->
    <!-- MODAL: CONTRACT DETAILS                                   -->
    <!-- ======================================================== -->
    <div
      v-if="detailModalContract"
      class="modal-backdrop"
      @click.self="detailModalContract = null"
    >
      <div class="modal contract-detail-modal">
        <div class="modal-header">
          <div>
            <span class="modal-badge">Lease Contract Dossier</span>
            <h2>{{ detailModalContract.contractNo || detailModalContract.ref }}</h2>
            <p>Stall {{ detailModalContract.stallNo }} • Assigned to {{ detailModalContract.stakeholderName }}</p>
          </div>
          <button class="close-btn" @click="detailModalContract = null">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Stall Number</span>
              <strong class="detail-val">{{ detailModalContract.stallNo }}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-label">Commodity / Section</span>
              <strong class="detail-val">{{ detailModalContract.stallType || 'Commercial' }}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-label">Lessee / Stakeholder</span>
              <strong class="detail-val">{{ detailModalContract.stakeholderName }}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-label">Contact Number</span>
              <strong class="detail-val">{{ detailModalContract.contact || 'N/A' }}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-label">Monthly Rental</span>
              <strong class="detail-val">{{ formatCurrency(detailModalContract.monthlyRent) }}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-label">Billing Frequency</span>
              <strong class="detail-val">{{ detailModalContract.billingFrequency || 'MONTHLY' }}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-label">Contract Start Date</span>
              <strong class="detail-val">{{ formatDateOnly(detailModalContract.startDate) }}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-label">Contract End Date</span>
              <strong class="detail-val" :class="{ 'red-text': detailModalContract.daysRemaining <= 30 }">
                {{ formatDateOnly(detailModalContract.endDate) }}
              </strong>
            </div>

            <div class="detail-item full-width">
              <span class="detail-label">Urgency & Expiration Status</span>
              <div class="status-summary-box" :class="detailModalContract.urgencyCategory.toLowerCase()">
                <i :class="countdownIcon(detailModalContract)"></i>
                <div>
                  <strong>{{ formatCountdownText(detailModalContract) }}</strong>
                  <p>Classification: {{ detailModalContract.urgencyLabel }}</p>
                </div>
              </div>
            </div>

            <div class="detail-item full-width" v-if="detailModalContract.terms">
              <span class="detail-label">Agreed Lease Terms</span>
              <div class="terms-preview-box">
                {{ detailModalContract.terms }}
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-primary" @click="openNoticeModal(detailModalContract)">
            <i class="pi pi-envelope"></i>
            Generate Renewal Notice
          </button>
          <button class="btn-secondary" @click="detailModalContract = null">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL: RENEWAL / EXPIRATION NOTICE                       -->
    <!-- ======================================================== -->
    <div
      v-if="noticeModalContract"
      class="modal-backdrop"
      @click.self="noticeModalContract = null"
    >
      <div class="modal notice-modal">
        <div class="modal-header">
          <div>
            <span class="modal-badge warning">Official Municipal Notice</span>
            <h2>Notice of Lease Expiration</h2>
            <p>Official communication for {{ noticeModalContract.stakeholderName }}</p>
          </div>
          <button class="close-btn" @click="noticeModalContract = null">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="notice-letter-paper" id="notice-document">
          <div class="letter-header">
            <div class="letter-republic">REPUBLIC OF THE PHILIPPINES</div>
            <div class="letter-office">OFFICE OF THE MARKET SUPERVISOR</div>
            <div class="letter-market">MUNICIPAL PUBLIC MARKET ADMINISTRATION</div>
            <div class="letter-divider"></div>
          </div>

          <div class="letter-date">
            Date: <strong>{{ currentFormattedDate }}</strong>
          </div>

          <div class="letter-recipient">
            TO: <strong>{{ noticeModalContract.stakeholderName }}</strong><br />
            LESSEE, STALL NO. <strong>{{ noticeModalContract.stallNo }}</strong> ({{ noticeModalContract.stallType || 'Standard' }})<br />
            CONTRACT REF: <strong>{{ noticeModalContract.contractNo || noticeModalContract.ref }}</strong>
          </div>

          <!-- Stakeholder Email Row for Nodemailer Delivery -->
          <div class="notice-email-row" style="margin: 12px 0 16px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; font-size: 13px;">
            <i class="pi pi-send" style="color: #0284c7; font-size: 15px;"></i>
            <span style="font-weight: 700; color: #475569; white-space: nowrap;">Stakeholder Email:</span>
            <input
              type="email"
              v-model="noticeModalContract.email"
              placeholder="Enter stakeholder email (e.g. lessee@gmail.com)"
              style="flex: 1; padding: 7px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; font-family: inherit; background: #ffffff; color: #0f172a;"
            />
            <span v-if="!noticeModalContract.email" style="font-size: 11px; color: #dc2626; font-weight: 700; white-space: nowrap;">
              * Email required
            </span>
          </div>

          <div class="letter-subject">
            SUBJECT: <strong>NOTICE OF LEASE CONTRACT EXPIRATION & RENEWAL PROCEDURE</strong>
          </div>

          <div class="letter-body">
            <p>Dear {{ noticeModalContract.stakeholderName }},</p>
            <p>
              Please be advised that your municipal market stall lease agreement for
              <strong>Stall No. {{ noticeModalContract.stallNo }}</strong> is scheduled to officially expire on
              <strong>{{ formatDateOnly(noticeModalContract.endDate) }}</strong>
              (<strong>{{ formatCountdownText(noticeModalContract) }}</strong>).
            </p>
            <p>
              To ensure uninterrupted commercial operations and avoid lease forfeiture or penalty assessments, you are respectfully requested to proceed to the Market Supervisor's Office on or before
              <strong>{{ formatDateOnly(noticeModalContract.endDate) }}</strong> to submit your renewal application along with the following requirements:
            </p>
            <ul>
              <li>Valid Government-Issued Identification</li>
              <li>Updated Barangay Clearance & Business Permit</li>
              <li>Receipts of monthly rental settlement (₱{{ Number(noticeModalContract.monthlyRent || 0).toLocaleString() }}/month)</li>
              <li>Executed Renewal Lease Agreement Form</li>
            </ul>
            <p>
              Failure to execute a renewal contract within the prescribed grace period may result in the stall being declared vacant and re-opened for allocation pursuant to municipal market regulations.
            </p>
          </div>

          <div class="letter-signature-block">
            <div class="sig-line"></div>
            <div class="sig-name">MARKET SUPERVISOR</div>
            <div class="sig-title">Municipal Market Administration Office</div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-primary" :disabled="isSendingNoticeEmail" @click="sendNoticeEmail(noticeModalContract)">
            <i class="pi pi-send"></i>
            {{ isSendingNoticeEmail ? 'Sending Notice...' : 'Email Notice to Stakeholder' }}
          </button>
          <button class="btn-outline" @click="printNotice">
            <i class="pi pi-print"></i>
            Print Notice
          </button>
          <button class="btn-outline" @click="copyNoticeText">
            <i class="pi pi-copy"></i>
            Copy Text
          </button>
          <button class="btn-secondary" @click="noticeModalContract = null">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL: ADD/EDIT INCIDENT REPORT (CRUD)                   -->
    <!-- ======================================================== -->
    <div
      v-if="showForm"
      class="modal-backdrop"
      @click.self="closeForm"
    >
      <div class="modal">
        <div class="modal-header">
          <div>
            <h2>
              {{ selectedReport ? 'Edit Incident Report' : 'Add Incident Report' }}
            </h2>
            <p>
              {{ selectedReport ? 'Update report details' : 'Create a new supervisor field/incident report' }}
            </p>
          </div>

          <button class="close-btn" @click="closeForm">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <ReportForm
          :report="selectedReport"
          @submit="saveReport"
          @cancel="closeForm"
        />
      </div>
    </div>

    <!-- MODAL: CONFIRM DELETE INCIDENT REPORT -->
    <div
      v-if="deleteTarget"
      class="modal-backdrop"
      @click.self="deleteTarget = null"
    >
      <div class="confirm-modal">
        <h2>Delete report?</h2>
        <p>
          This will permanently remove
          <strong>{{ deleteTarget.title }}</strong>.
        </p>

        <div class="confirm-actions">
          <button class="btn-secondary" @click="deleteTarget = null">
            Cancel
          </button>

          <button class="btn-danger" @click="removeReport">
            <i class="pi pi-trash"></i>
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted
} from 'vue'

import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'

import ReportForm from './ReportForm.vue'
import api from '../services/api'
import sampleContracts from '../data/contracts.js'
import sampleApplicants from '../data/applicants.js'

import {
  getReports,
  createReport,
  updateReport,
  deleteReport
} from '../services/reportService'
import { systemMessage } from '../utils/systemMessage'

// ==========================================
// STATE
// ==========================================
const activeTab = ref('due-soon') // 'due-soon' | 'occupancy' | 'incidents'
const isLoading = ref(false)

// Incident Reports (Original CRUD)
const reports = ref([])
const search = ref('')
const showForm = ref(false)
const selectedReport = ref(null)
const deleteTarget = ref(null)

// Market Supervisor Core Data
const contractsList = ref([])
const stallsList = ref([])
const stakeholdersList = ref([])

// Filters for Due Soon Contracts
const contractSearch = ref('')
const contractFilter = ref('ALL_DUE') // 'ALL_DUE' | 'CRITICAL' | 'WARNING' | 'UPCOMING' | 'EXPIRED' | 'ALL'
const contractSort = ref('urgency') // 'urgency' | 'rentDesc' | 'endDate' | 'stallNo'

// Modals
const detailModalContract = ref(null)
const noticeModalContract = ref(null)

// ==========================================
// AUTHORIZATION
// ==========================================
const currentRole = computed(() => {
  return localStorage.getItem('role') || ''
})

const isAuthorized = computed(() => {
  const role = (localStorage.getItem('role') || '').toUpperCase().trim()
  if (!role) return true // default in local dev/testing
  return [
    'MARKETSUPERVISOR',
    'MARKET_SUPERVISOR',
    'SUPERVISOR',
    'ADMIN',
    'TREASURER'
  ].includes(role) ||
    role.includes('SUPERVISOR') ||
    role.includes('ADMIN') ||
    role.includes('TREASURER')
})

const currentFormattedDate = computed(() => {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date())
})

// ==========================================
// DATA COMPUTATIONS & ENRICHMENT
// ==========================================
function getInitials(name) {
  if (!name) return 'SH'
  const parts = String(name).trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

function formatDateOnly(dateStr) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (_) {
    return dateStr
  }
}

function formatCurrency(val) {
  const num = Number(val || 0)
  return '₱' + num.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Enriched contracts with real-time countdown & classification
const enrichedContracts = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return contractsList.value.map(c => {
    // Determine end date
    const endStr = c.endDate || c.end || '2026-12-31'
    const endDate = new Date(endStr)
    endDate.setHours(0, 0, 0, 0)

    let daysRemaining = 0
    if (!isNaN(endDate.getTime())) {
      const diffTime = endDate.getTime() - today.getTime()
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    // Determine Urgency
    let urgencyCategory = 'GOOD_STANDING'
    let urgencyLabel = 'Good Standing'

    if (daysRemaining < 0) {
      urgencyCategory = 'EXPIRED'
      urgencyLabel = 'Overdue / Expired'
    } else if (daysRemaining <= 30) {
      urgencyCategory = 'CRITICAL'
      urgencyLabel = 'Critical (≤30 Days)'
    } else if (daysRemaining <= 60) {
      urgencyCategory = 'WARNING'
      urgencyLabel = 'Warning (31–60 Days)'
    } else if (daysRemaining <= 90) {
      urgencyCategory = 'UPCOMING'
      urgencyLabel = 'Upcoming (61–90 Days)'
    }

    // Match stall
    let stallNo = c.stallNo || ''
    let stallType = c.stallType || ''
    let monthlyRent = Number(c.monthlyRent || 0)

    const matchedStall = stallsList.value.find(st =>
      String(st.id) === String(c.stallId) ||
      (st.stallNo && c.stallNo && String(st.stallNo).toLowerCase() === String(c.stallNo).toLowerCase())
    )

    if (matchedStall) {
      if (!stallNo) stallNo = matchedStall.stallNo || matchedStall.stall_no || matchedStall.number
      if (!stallType) stallType = matchedStall.stallType || matchedStall.stall_type || matchedStall.type || matchedStall.info
      if (!monthlyRent) monthlyRent = Number(matchedStall.monthlyRent || matchedStall.monthly_rent || 0)
    }

    if (!stallNo) stallNo = `WS-${String(c.id).slice(-3) || '01'}`
    if (!monthlyRent) monthlyRent = 3500

    let stakeholderName = c.stakeholderName || ''
    let contact = c.contact || ''
    let email = c.email || c.stakeholderEmail || ''

    const sh = stakeholdersList.value.find(s => String(s.id) === String(c.stakeholderId))
    if (sh) {
      if (!stakeholderName) stakeholderName = sh.name || `${sh.firstName || ''} ${sh.lastName || ''}`.trim()
      if (!contact) contact = sh.contact || sh.phone || ''
      if (!email) email = sh.email || sh.email_address || sh.mail || ''
    }

    if (!stakeholderName) {
      stakeholderName = 'Stallholder Lessee'
    }

    return {
      ...c,
      stallNo,
      stallType,
      monthlyRent,
      stakeholderName,
      contact,
      email,
      stakeholderEmail: email,
      startDate: c.startDate || c.start || '2025-01-01',
      endDate: endStr,
      daysRemaining,
      urgencyCategory,
      urgencyLabel
    }
  })
})

// Metric counters
const criticalCount = computed(() => {
  return enrichedContracts.value.filter(c => c.daysRemaining >= 0 && c.daysRemaining <= 30).length
})

const criticalRent = computed(() => {
  return enrichedContracts.value
    .filter(c => c.daysRemaining >= 0 && c.daysRemaining <= 30)
    .reduce((sum, c) => sum + (c.monthlyRent || 0), 0)
})

const warningCount = computed(() => {
  return enrichedContracts.value.filter(c => c.daysRemaining > 30 && c.daysRemaining <= 60).length
})

const warningRent = computed(() => {
  return enrichedContracts.value
    .filter(c => c.daysRemaining > 30 && c.daysRemaining <= 60)
    .reduce((sum, c) => sum + (c.monthlyRent || 0), 0)
})

const upcomingCount = computed(() => {
  return enrichedContracts.value.filter(c => c.daysRemaining > 60 && c.daysRemaining <= 90).length
})

const upcomingRent = computed(() => {
  return enrichedContracts.value
    .filter(c => c.daysRemaining > 60 && c.daysRemaining <= 90)
    .reduce((sum, c) => sum + (c.monthlyRent || 0), 0)
})

const expiredCount = computed(() => {
  return enrichedContracts.value.filter(c => c.daysRemaining < 0).length
})

const dueSoonTotalCount = computed(() => {
  return enrichedContracts.value.filter(c => c.daysRemaining <= 90).length
})

const totalRentAtRisk = computed(() => {
  return enrichedContracts.value
    .filter(c => c.daysRemaining <= 90)
    .reduce((sum, c) => sum + (c.monthlyRent || 0), 0)
})

// Filtered contracts list
const filteredDueContracts = computed(() => {
  let list = [...enrichedContracts.value]

  // Timeframe / Urgency filter
  if (contractFilter.value === 'ALL_DUE') {
    list = list.filter(c => c.daysRemaining <= 90)
  } else if (contractFilter.value === 'CRITICAL') {
    list = list.filter(c => c.daysRemaining >= 0 && c.daysRemaining <= 30)
  } else if (contractFilter.value === 'WARNING') {
    list = list.filter(c => c.daysRemaining > 30 && c.daysRemaining <= 60)
  } else if (contractFilter.value === 'UPCOMING') {
    list = list.filter(c => c.daysRemaining > 60 && c.daysRemaining <= 90)
  } else if (contractFilter.value === 'EXPIRED') {
    list = list.filter(c => c.daysRemaining < 0)
  }
  // 'ALL' keeps everything

  // Search filter
  const term = contractSearch.value.toLowerCase().trim()
  if (term) {
    list = list.filter(c => {
      const match = [
        c.contractNo,
        c.ref,
        c.stallNo,
        c.stallType,
        c.stakeholderName,
        c.contact
      ].join(' ').toLowerCase()
      return match.includes(term)
    })
  }

  // Sorting
  if (contractSort.value === 'urgency') {
    list.sort((a, b) => a.daysRemaining - b.daysRemaining)
  } else if (contractSort.value === 'rentDesc') {
    list.sort((a, b) => (b.monthlyRent || 0) - (a.monthlyRent || 0))
  } else if (contractSort.value === 'endDate') {
    list.sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
  } else if (contractSort.value === 'stallNo') {
    list.sort((a, b) => String(a.stallNo).localeCompare(String(b.stallNo)))
  }

  return list
})

function formatCountdownText(contract) {
  const d = contract.daysRemaining
  if (d < 0) {
    return `Overdue by ${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'}`
  }
  if (d === 0) {
    return 'Expires Today!'
  }
  return `${d} day${d === 1 ? '' : 's'} remaining`
}

function countdownBadgeClass(contract) {
  const d = contract.daysRemaining
  if (d < 0) return 'cd-expired'
  if (d <= 30) return 'cd-critical'
  if (d <= 60) return 'cd-warning'
  if (d <= 90) return 'cd-upcoming'
  return 'cd-good'
}

function countdownIcon(contract) {
  const d = contract.daysRemaining
  if (d < 0) return 'pi pi-ban'
  if (d <= 30) return 'pi pi-exclamation-circle'
  if (d <= 60) return 'pi pi-clock'
  if (d <= 90) return 'pi pi-calendar'
  return 'pi pi-check'
}

// ==========================================
// STALL OCCUPANCY METRICS & BREAKDOWN
// ==========================================
const occupiedStallsCount = computed(() => {
  return stallsList.value.filter(s => String(s.status || '').toUpperCase() === 'OCCUPIED').length
})

const vacantStallsCount = computed(() => {
  return stallsList.value.filter(s => {
    const st = String(s.status || '').toUpperCase()
    return st === 'AVAILABLE' || st === 'VACANT'
  }).length
})

const unavailableStallsCount = computed(() => {
  return stallsList.value.filter(s => {
    const st = String(s.status || '').toUpperCase()
    return st === 'UNAVAILABLE' || st === 'MAINTENANCE' || st === 'RESERVED'
  }).length
})

const archivedStallsCount = computed(() => {
  return stallsList.value.filter(s => String(s.status || '').toUpperCase() === 'ARCHIVED').length
})

const occupancyRate = computed(() => {
  const activeTotal = stallsList.value.filter(s => String(s.status || '').toUpperCase() !== 'ARCHIVED').length
  if (!activeTotal) return 0
  return Math.round((occupiedStallsCount.value / activeTotal) * 100)
})

const sectionBreakdown = computed(() => {
  const map = {}
  stallsList.value.forEach(st => {
    const secName = st.stallType || st.stall_type || st.type || st.info || 'General Commercial'
    if (!map[secName]) {
      map[secName] = {
        name: secName,
        total: 0,
        occupied: 0,
        vacant: 0,
        unavailable: 0,
        archived: 0,
        potentialRent: 0
      }
    }
    const stat = String(st.status || '').toUpperCase()
    map[secName].total++
    if (stat === 'OCCUPIED') map[secName].occupied++
    else if (stat === 'AVAILABLE' || stat === 'VACANT') map[secName].vacant++
    else if (stat === 'ARCHIVED') map[secName].archived++
    else map[secName].unavailable++

    map[secName].potentialRent += Number(st.monthlyRent || st.monthly_rent || 3500)
  })

  return Object.values(map).map(sec => {
    const nonArchived = sec.total - sec.archived
    const rate = nonArchived > 0 ? Math.round((sec.occupied / nonArchived) * 100) : 0
    return { ...sec, rate }
  })
})

// ==========================================
// EXPORTS: EXCEL & PDF & PRINT
// ==========================================
function exportToExcel() {
  const data = filteredDueContracts.value.map(c => ({
    'Contract Ref': c.contractNo || c.ref,
    'Stall No': c.stallNo,
    'Commodity Type': c.stallType || 'Standard',
    'Stakeholder Name': c.stakeholderName,
    'Contact': c.contact || 'N/A',
    'Monthly Rent (PHP)': c.monthlyRent,
    'Start Date': formatDateOnly(c.startDate),
    'End Date': formatDateOnly(c.endDate),
    'Days Remaining': c.daysRemaining,
    'Urgency Status': c.urgencyLabel,
    'Countdown': formatCountdownText(c)
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Due Soon Contracts')
  XLSX.writeFile(
    workbook,
    `Market_Supervisor_Due_Soon_Contracts_${new Date().toISOString().slice(0, 10)}.xlsx`
  )
}

function exportOccupancyToExcel() {
  const data = sectionBreakdown.value.map(s => ({
    'Section': s.name,
    'Total Stalls': s.total,
    'Occupied': s.occupied,
    'Vacant / Available': s.vacant,
    'Unavailable / Maintenance': s.unavailable,
    'Archived': s.archived,
    'Occupancy Rate (%)': s.rate,
    'Monthly Rent Potential (PHP)': s.potentialRent
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stall Capacity')
  XLSX.writeFile(
    workbook,
    `Market_Supervisor_Stall_Capacity_${new Date().toISOString().slice(0, 10)}.xlsx`
  )
}

function exportToPDF() {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  // Header Banner
  doc.setFillColor(15, 118, 110)
  doc.rect(0, 0, 842, 50, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('OFFICE OF THE MARKET SUPERVISOR — EXPIRING LEASE CONTRACTS REPORT', 30, 32)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(`Generated on: ${currentFormattedDate.value} | Total Contracts Due: ${filteredDueContracts.value.length} | Revenue Exposure: ${formatCurrency(totalRentAtRisk.value)}`, 30, 72)

  // Column Headers
  const startY = 95
  doc.setFillColor(241, 245, 249)
  doc.rect(30, startY - 14, 782, 22, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text('CONTRACT REF', 35, startY)
  doc.text('STALL NO', 150, startY)
  doc.text('LESSEE / STAKEHOLDER', 230, startY)
  doc.text('MONTHLY RENT', 400, startY)
  doc.text('END DATE', 500, startY)
  doc.text('DAYS LEFT', 590, startY)
  doc.text('URGENCY STATUS', 680, startY)

  // Rows
  let curY = startY + 22
  doc.setFont('helvetica', 'normal')

  filteredDueContracts.value.slice(0, 24).forEach((c, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252)
      doc.rect(30, curY - 12, 782, 18, 'F')
    }

    if (c.daysRemaining <= 30) {
      doc.setTextColor(220, 38, 38)
    } else if (c.daysRemaining <= 60) {
      doc.setTextColor(217, 119, 6)
    } else {
      doc.setTextColor(30, 41, 59)
    }

    doc.text(String(c.contractNo || c.ref).slice(0, 18), 35, curY)
    doc.text(String(c.stallNo), 150, curY)
    doc.text(String(c.stakeholderName).slice(0, 26), 230, curY)
    doc.text(formatCurrency(c.monthlyRent), 400, curY)
    doc.text(formatDateOnly(c.endDate), 500, curY)
    doc.text(String(c.daysRemaining) + ' d', 590, curY)
    doc.text(String(c.urgencyLabel), 680, curY)

    curY += 18
  })

  // Footer note
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text('Certified Official Record — Municipal Market Operations & Regulatory Board', 30, 565)

  doc.save(`Contracts_Due_Soon_Report_${new Date().toISOString().slice(0, 10)}.pdf`)
}

function printReport() {
  window.print()
}

// ==========================================
// MODAL ACTIONS
// ==========================================
function openDetailModal(contract) {
  detailModalContract.value = contract
}

function openNoticeModal(contract) {
  noticeModalContract.value = contract
}

function printNotice() {
  window.print()
}

function copyNoticeText() {
  const el = document.getElementById('notice-document')
  if (el) {
    navigator.clipboard.writeText(el.innerText).then(() => {
      systemMessage.success('Notice text copied to clipboard successfully.', 'Copied')
    }).catch(() => {
      systemMessage.error('Unable to copy to clipboard.', 'Clipboard Error')
    })
  }
}

const isSendingNoticeEmail = ref(false)

async function sendNoticeEmail(contract) {
  if (!contract) return

  const targetEmail = (contract.email || contract.stakeholderEmail || '').trim()
  if (!targetEmail) {
    systemMessage.error(
      `Please provide an email address for ${contract.stakeholderName || 'this stakeholder'} before dispatching the notice.`,
      'Stakeholder Email Required'
    )
    return
  }

  isSendingNoticeEmail.value = true
  try {
    const { sendContractDueNotification } = await import('../services/emailNotificationService')
    const res = await sendContractDueNotification({
      contractId: contract.id || contract.rawId,
      stakeholderId: contract.stakeholderId || contract.stakeholder_id,
      contractNo: contract.contractNo || contract.ref,
      stallNo: contract.stallNo,
      stallType: contract.stallType,
      monthlyRent: contract.monthlyRent,
      endDate: contract.endDate,
      daysRemaining: contract.daysRemaining,
      urgencyCategory: contract.urgencyCategory,
      email: targetEmail
    })

    if (res.success) {
      const emailTarget = res.email ? ` to ${res.email}` : ''
      const previewNote = res.previewUrl ? ` (Preview: ${res.previewUrl})` : ''
      systemMessage.success(
        `Official lease expiration notice successfully dispatched via Nodemailer${emailTarget}!${previewNote}`,
        'Notice Dispatched via Nodemailer'
      )
    } else {
      systemMessage.error(res.error || 'Failed to dispatch email via Nodemailer.', 'Notice Error')
    }
  } catch (err) {
    console.error('[sendNoticeEmail] error:', err)
    systemMessage.error(err.message || 'Could not send expiration notice email.', 'Notice Error')
  } finally {
    isSendingNoticeEmail.value = false
  }
}

async function emailAllDueSoonContracts() {
  const list = filteredDueContracts.value.filter(c => c.daysRemaining <= 90)
  if (list.length === 0) {
    systemMessage.info('No contracts currently expiring within 90 days or overdue in this view.', 'No Due Contracts')
    return
  }

  const confirmed = await systemMessage.confirm(
    `Send official lease renewal notices via Nodemailer to all ${list.length} stakeholder(s) whose contracts are expiring soon or overdue?`,
    {
      title: 'Email Expiration Notices (Nodemailer)',
      acceptLabel: 'Send All Notices via Nodemailer',
      rejectLabel: 'Cancel'
    }
  )

  if (!confirmed) return

  isSendingNoticeEmail.value = true
  try {
    const { sendBulkContractDueNotifications } = await import('../services/emailNotificationService')
    const res = await sendBulkContractDueNotifications(list)
    systemMessage.success(
      `Official lease expiration notices dispatched via Nodemailer: ${res.sent} sent successfully${res.skipped ? `, ${res.skipped} skipped (missing email)` : ''}.`,
      'Bulk Notices Dispatched'
    )
  } catch (err) {
    console.error('[emailAllDueSoonContracts] error:', err)
    systemMessage.error(err.message || 'Failed to send bulk notices.', 'Error')
  } finally {
    isSendingNoticeEmail.value = false
  }
}

// ==========================================
// INCIDENT REPORTS CRUD (PRESERVED)
// ==========================================
const filteredReports = computed(() => {
  const term = search.value.toLowerCase().trim()
  if (!term) return reports.value

  return reports.value.filter((report) => {
    const haystack = [
      report.title,
      report.description,
      report.status,
      report.supervisorName
    ].join(' ').toLowerCase()
    return haystack.includes(term)
  })
})

const submittedCount = computed(() => {
  return reports.value.filter(r => r.status === 'SUBMITTED').length
})

async function loadReports() {
  try {
    const response = await getReports()
    reports.value = response.data || []
  } catch (error) {
    console.error(error)
  }
}

function openCreate() {
  selectedReport.value = null
  showForm.value = true
}

function openEdit(report) {
  selectedReport.value = { ...report }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  selectedReport.value = null
}

async function saveReport(payload) {
  try {
    if (selectedReport.value?.id) {
      await updateReport(selectedReport.value.id, payload)
      systemMessage.success('Report updated successfully.', 'Report Saved')
    } else {
      await createReport(payload)
      systemMessage.success('Report created successfully.', 'Report Created')
    }
    closeForm()
    await loadReports()
  } catch (error) {
    console.error(error)
    systemMessage.error(error.response?.data?.message || 'Failed to save report', 'Operation Failed')
  }
}

function confirmDelete(report) {
  deleteTarget.value = report
}

async function removeReport() {
  try {
    await deleteReport(deleteTarget.value.id)
    systemMessage.success('Report deleted successfully.', 'Report Deleted')
    deleteTarget.value = null
    await loadReports()
  } catch (error) {
    console.error(error)
    systemMessage.error(error.response?.data?.message || 'Failed to delete report', 'Delete Failed')
  }
}

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function statusClass(status) {
  return String(status || '').toLowerCase().replaceAll('_', '-')
}

// ==========================================
// DATA LOADING
// ==========================================
async function loadMarketData() {
  isLoading.value = true
  try {
    // 1. Load Stalls
    try {
      const stallsRes = await api.get('/stalls')
      stallsList.value = stallsRes.data || []
    } catch (_) {
      const localStalls = localStorage.getItem('ms_stalls')
      if (localStalls) {
        stallsList.value = JSON.parse(localStalls)
      } else {
        // Fallback stalls
        stallsList.value = [
          { id: '1', stallNo: 'WS-01', stallType: 'Wet Section', monthlyRent: 3500, status: 'OCCUPIED' },
          { id: '2', stallNo: 'WS-02', stallType: 'Wet Section', monthlyRent: 3500, status: 'OCCUPIED' },
          { id: '3', stallNo: 'DG-01', stallType: 'Dry Goods', monthlyRent: 4200, status: 'OCCUPIED' },
          { id: '4', stallNo: 'FC-01', stallType: 'Food Court', monthlyRent: 5000, status: 'AVAILABLE' },
          { id: '5', stallNo: 'FC-02', stallType: 'Food Court', monthlyRent: 5000, status: 'MAINTENANCE' }
        ]
      }
    }

    // 2. Load Stakeholders
    try {
      const shRes = await api.get('/stakeholders')
      stakeholdersList.value = shRes.data || []
    } catch (_) {
      stakeholdersList.value = sampleApplicants || []
    }

    // 3. Load Contracts
    let loadedContracts = []
    try {
      const cRes = await api.get('/contracts')
      if (Array.isArray(cRes.data) && cRes.data.length) {
        loadedContracts = [...cRes.data]
      }
    } catch (_) {}

    // Check localStorage contracts
    const localContractsRaw = localStorage.getItem('contracts')
    if (localContractsRaw) {
      try {
        const parsed = JSON.parse(localContractsRaw)
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (!loadedContracts.some(c => String(c.id) === String(item.id) || c.contractNo === item.contractNo)) {
              loadedContracts.push(item)
            }
          }
        }
      } catch (_) {}
    }

    // Merge sample contracts with dynamic realistic due dates around current year (2026)
    if (!loadedContracts.length) {
      loadedContracts = (sampleContracts || []).map((c, i) => ({
        id: c.id || `C-${1001 + i}`,
        contractNo: c.ref || `CON-2026-00${i + 1}`,
        ref: c.ref || `CON-2026-00${i + 1}`,
        stakeholderId: c.stakeholderId || `A00${i + 1}`,
        startDate: c.start || '2025-11-01',
        endDate: c.end || '2026-10-24',
        monthlyRent: 3500 + (i * 700),
        billingFrequency: 'MONTHLY',
        status: 'ACTIVE',
        stallNo: `WS-0${i + 1}`,
        stallType: i === 0 ? 'Wet Section' : i === 1 ? 'Dry Goods' : 'Food Court'
      }))
    }

    // Ensure we have a rich distribution for market supervisor testing (Critical, Warning, Upcoming, Expired)
    const hasCritical = loadedContracts.some(c => {
      const d = Math.ceil((new Date(c.endDate || c.end).getTime() - new Date().getTime()) / 86400000)
      return d >= 0 && d <= 30
    })

    if (!hasCritical) {
      // Add a critical contract expiring in 13 days
      const d13 = new Date()
      d13.setDate(d13.getDate() + 13)
      loadedContracts.unshift({
        id: 'DEMO-CRIT',
        contractNo: 'CON-WS-02-EXP26',
        ref: 'CON-WS-02-EXP26',
        stakeholderId: 'A002',
        stakeholderName: 'Juan Dela Cruz',
        contact: '0917-987-6543',
        stallNo: 'WS-02',
        stallType: 'Wet Fish Section',
        monthlyRent: 4200,
        billingFrequency: 'MONTHLY',
        startDate: '2025-10-25',
        endDate: d13.toISOString().slice(0, 10),
        status: 'ACTIVE'
      })
    }

    const hasWarning = loadedContracts.some(c => {
      const d = Math.ceil((new Date(c.endDate || c.end).getTime() - new Date().getTime()) / 86400000)
      return d > 30 && d <= 60
    })

    if (!hasWarning) {
      const d48 = new Date()
      d48.setDate(d48.getDate() + 48)
      loadedContracts.push({
        id: 'DEMO-WARN',
        contractNo: 'CON-DG-01-EXP26',
        ref: 'CON-DG-01-EXP26',
        stakeholderId: 'A001',
        stakeholderName: 'Maria Santos',
        contact: '0917-123-4567',
        stallNo: 'DG-01',
        stallType: 'Dry Goods & Textiles',
        monthlyRent: 3800,
        billingFrequency: 'MONTHLY',
        startDate: '2025-11-28',
        endDate: d48.toISOString().slice(0, 10),
        status: 'ACTIVE'
      })
    }

    const hasExpired = loadedContracts.some(c => {
      const d = Math.ceil((new Date(c.endDate || c.end).getTime() - new Date().getTime()) / 86400000)
      return d < 0
    })

    if (!hasExpired) {
      const dPast = new Date()
      dPast.setDate(dPast.getDate() - 12)
      loadedContracts.push({
        id: 'DEMO-EXP',
        contractNo: 'CON-FC-04-PAST',
        ref: 'CON-FC-04-PAST',
        stakeholderId: 'A003',
        stakeholderName: 'Liza Mercado',
        contact: '0917-000-1122',
        stallNo: 'FC-04',
        stallType: 'Food Court & Refreshments',
        monthlyRent: 5500,
        billingFrequency: 'MONTHLY',
        startDate: '2025-09-01',
        endDate: dPast.toISOString().slice(0, 10),
        status: 'EXPIRED'
      })
    }

    contractsList.value = loadedContracts
  } catch (err) {
    console.error('loadMarketData error:', err)
  } finally {
    isLoading.value = false
  }
}

async function refreshCurrentTab() {
  if (activeTab.value === 'incidents') {
    await loadReports()
  } else {
    await loadMarketData()
  }
}

onMounted(async () => {
  await Promise.all([
    loadReports(),
    loadMarketData()
  ])
})
</script>

<style scoped src="../styles/MarketSupervisor/ReportPage.css"></style>
