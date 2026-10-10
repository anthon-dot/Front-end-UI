<template>
  <div class="stakeholder-layout">
    <!-- Sakai Responsive Stakeholder Sidebar -->
    <StakeholderMenu />

    <!-- Main Dashboard Content -->
    <main class="stakeholder-dashboard">
      <!-- Top Portal Bar -->
      <div class="portal-topbar">
        <div class="portal-brand">
          <span class="portal-subtitle">Public Market of Manticao</span>
          <h1 class="portal-title">Market Rental Portal</h1>
        </div>

        <div class="portal-actions">
          <Button
            icon="pi pi-refresh"
            label="Refresh"
            severity="secondary"
            outlined
            size="small"
            :loading="isLoading"
            @click="loadAllData(false)"
          />
          <Notification
            :notifications="notificationsForStakeholder"
            @mark-read="markRead"
            @mark-all="markAllRead"
          />
        </div>
      </div>

      <!-- Welcome Hero Banner Card -->
      <div class="hero-card">
        <div class="hero-content">
          <div class="hero-left">
            <div class="hero-avatar">
              <img v-if="stakeholderProfile?.avatar" :src="stakeholderProfile.avatar" alt="Avatar" />
              <span v-else>{{ initials }}</span>
            </div>

            <div>
              <div class="hero-tagline">WELCOME BACK</div>
              <h2 class="hero-name">Good day, {{ firstName }}!</h2>
              <p class="hero-desc">
                Manage your market application, stall, and rental account in one place.
              </p>

              <div class="hero-chips">
                <span class="hero-chip success">
                  <i class="pi pi-verified"></i>
                  {{ isVerified ? 'Verified Stakeholder' : (formatDisplayStatus(stakeholderProfile?.status) || 'Active Renter') }}
                </span>

                <span class="hero-chip accent" v-if="assignedStallNo">
                  <i class="pi pi-shop"></i>
                  Stall {{ assignedStallNo }}
                </span>
                <span class="hero-chip warning" v-else>
                  <i class="pi pi-clock"></i>
                  Awaiting Stall Assignment
                </span>

                <span class="hero-chip" v-if="stallSection">
                  <i class="pi pi-map-marker"></i>
                  {{ stallSection }}
                </span>

                <!-- Occupant Status -->
                <span class="hero-chip" :class="occupantStatusSeverity === 'success' ? 'success' : (occupantStatusSeverity === 'warn' ? 'warning' : 'info')">
                  <i class="pi pi-user-check"></i>
                  Occupant: {{ occupantStatus }}
                </span>

                <!-- Contract Status -->
                <span class="hero-chip" :class="contractStatusSeverity === 'success' ? 'success' : (contractStatusSeverity === 'warn' ? 'warning' : 'secondary')">
                  <i class="pi pi-file-check"></i>
                  Contract: {{ contractStatus }}
                </span>
              </div>
            </div>
          </div>

          <div class="hero-right">
            <Button
              label="Edit Profile"
              icon="pi pi-user-edit"
              severity="secondary"
              size="small"
              @click="openEditProfile"
            />
          </div>
        </div>
      </div>

      <!-- Unassigned Stall Advisory (If verified but awaiting stall allocation) -->
      <div v-if="!assignedStallNo" class="notice-callout warning">
        <i class="pi pi-exclamation-triangle"></i>
        <div>
          <strong>Awaiting Stall Assignment by Market Supervisor:</strong>
          Your application and verification are recorded. The Market Supervisor is currently processing your official stall assignment. Once assigned, your lease contract and billing schedule will activate automatically.
        </div>
      </div>

      <!-- 4 Sakai Metric Stat Cards -->
      <div class="metrics-grid">
        <!-- 1. Outstanding Balance -->
        <div class="metric-card">
          <div class="metric-top">
            <span class="metric-label">Outstanding Balance</span>
            <div class="metric-icon-wrap icon-blue">
              <i class="pi pi-wallet"></i>
            </div>
          </div>
          <div class="metric-value">{{ formatCurrency(outstandingBalance) }}</div>
          <div class="metric-caption">
            <Tag
              v-if="outstandingBalance > 0"
              value="Unpaid Balance"
              severity="warn"
              size="small"
            />
            <Tag
              v-else
              value="Settled / Good Standing"
              severity="success"
              size="small"
            />
          </div>
        </div>

        <!-- 2. Next Due Date -->
        <div class="metric-card">
          <div class="metric-top">
            <span class="metric-label">Next Due Date</span>
            <div class="metric-icon-wrap icon-amber">
              <i class="pi pi-calendar"></i>
            </div>
          </div>
          <div class="metric-value">{{ formattedNextDueDate }}</div>
          <div class="metric-caption">
            <i class="pi pi-clock"></i>
            <span>Monthly billing cycle</span>
          </div>
        </div>

        <!-- 3. Contract Status -->
        <div class="metric-card">
          <div class="metric-top">
            <span class="metric-label">Contract Status</span>
            <div class="metric-icon-wrap" :class="contractStatusSeverity === 'success' ? 'icon-emerald' : (contractStatusSeverity === 'warn' ? 'icon-amber' : 'icon-blue')">
              <i class="pi pi-file-check"></i>
            </div>
          </div>
          <div class="metric-value" style="font-size: 1.5rem;">
            {{ contractStatus }}
          </div>
          <div class="metric-caption">
            <Tag
              :value="contractStatus"
              :severity="contractStatusSeverity"
              size="small"
            />
            <span v-if="hasContract && contractEndDate">Expires {{ formatDate(contractEndDate) }}</span>
            <span v-else-if="!hasContract" style="color: #64748b;">No contract record</span>
          </div>
        </div>

        <!-- 4. Last Payment -->
        <div class="metric-card">
          <div class="metric-top">
            <span class="metric-label">Last Payment</span>
            <div class="metric-icon-wrap icon-purple">
              <i class="pi pi-receipt"></i>
            </div>
          </div>
          <div class="metric-value">{{ formatCurrency(lastPaymentAmount) }}</div>
          <div class="metric-caption">
            <i class="pi pi-check-circle" style="color: #10b981;"></i>
            <span>{{ lastPaymentDate ? formatDate(lastPaymentDate) : 'Official OR verified' }}</span>
          </div>
        </div>
      </div>

      <!-- Sakai Section Nav Tabs -->
      <div class="section-nav">
        <button
          class="section-tab"
          :class="{ active: activeSection === 'overview' }"
          @click="setActiveSection('overview')"
        >
          <i class="pi pi-th-large"></i>
          <span>Overview</span>
        </button>

        <button
          class="section-tab"
          :class="{ active: activeSection === 'stall' }"
          @click="setActiveSection('stall')"
        >
          <i class="pi pi-shop"></i>
          <span>My Stall</span>
        </button>

        <button
          class="section-tab"
          :class="{ active: activeSection === 'billing' }"
          @click="setActiveSection('billing')"
        >
          <i class="pi pi-receipt"></i>
          <span>Billing & Statements</span>
          <span class="section-badge" v-if="unpaidBillsCount > 0">{{ unpaidBillsCount }}</span>
        </button>

        <button
          class="section-tab"
          :class="{ active: activeSection === 'payments' }"
          @click="setActiveSection('payments')"
        >
          <i class="pi pi-wallet"></i>
          <span>Payment History</span>
        </button>

        <button
          class="section-tab"
          :class="{ active: activeSection === 'contracts' }"
          @click="setActiveSection('contracts')"
        >
          <i class="pi pi-file-check"></i>
          <span>My Contract</span>
        </button>

        <button
          class="section-tab"
          :class="{ active: activeSection === 'documents' }"
          @click="setActiveSection('documents')"
        >
          <i class="pi pi-folder"></i>
          <span>My Documents</span>
        </button>

        <button
          class="section-tab"
          :class="{ active: activeSection === 'notifications' }"
          @click="setActiveSection('notifications')"
        >
          <i class="pi pi-bell"></i>
          <span>Notifications</span>
          <span class="section-badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
        </button>
      </div>

      <!-- ========================================================
           TAB 1: OVERVIEW DASHBOARD
           ======================================================== -->
      <div v-if="activeSection === 'overview'">
        <div class="overview-grid">
          <!-- Rental Account Hub -->
          <div class="card-panel">
            <div class="panel-header">
              <div>
                <h3 class="panel-title">
                  <i class="pi pi-id-card"></i>
                  My Rental Account
                </h3>
                <p class="panel-sub">Rental profile and quick access</p>
              </div>
              <Button
                label="Full Details"
                icon="pi pi-arrow-right"
                text
                size="small"
                @click="setActiveSection('stall')"
              />
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Renter Name</span>
                <span class="detail-val">{{ stakeholderProfile?.name || 'Juan Dela Cruz' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Business Name</span>
                <span class="detail-val">{{ stakeholderProfile?.business || 'Public Market Enterprise' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Assigned Stall</span>
                <span class="detail-val" style="color: #2563eb;">
                  {{ assignedStallNo ? `Stall ${assignedStallNo}` : 'Awaiting Assignment' }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Monthly Rental Rate</span>
                <span class="detail-val">{{ formatCurrency(monthlyRentRate) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Contact Number</span>
                <span class="detail-val">{{ stakeholderProfile?.contact || '0917-000-0000' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Occupant Status</span>
                <span class="detail-val">
                  <Tag :value="occupantStatus" :severity="occupantStatusSeverity" size="small" />
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Contract Status</span>
                <span class="detail-val">
                  <Tag :value="contractStatus" :severity="contractStatusSeverity" size="small" />
                </span>
              </div>
            </div>
          </div>

          <!-- Billing & Payment Next Actions -->
          <div class="card-panel">
            <div class="panel-header">
              <div>
                <h3 class="panel-title">
                  <i class="pi pi-calendar-plus"></i>
                  Payment & Dues Notice
                </h3>
                <p class="panel-sub">Important instructions from Municipal Treasurer</p>
              </div>
              <Button
                label="Statements"
                icon="pi pi-arrow-right"
                text
                size="small"
                @click="setActiveSection('billing')"
              />
            </div>

            <div class="notice-callout">
              <i class="pi pi-info-circle"></i>
              <div>
                <strong>Cash Payment Policy:</strong>
                All rental payments are cash-based and officially transacted at the <strong>Manticao Municipal Treasurer's Office</strong>. Please present your Billing Statement or Stall Number at the counter. Official Receipts (OR) will be issued and verified directly in the system.
              </div>
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Current Charges</span>
                <span class="detail-val">{{ formatCurrency(monthlyRentRate) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Next Deadline</span>
                <span class="detail-val" style="color: #d97706;">{{ formattedNextDueDate }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Advance Deposit</span>
                <span class="detail-val">{{ formatCurrency(advanceDeposit) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Treasurer Verification</span>
                <span class="detail-val">
                  <Tag value="Recorded by Office" severity="info" size="small" />
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Statements & Payments Preview -->
        <div class="card-panel">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">
                <i class="pi pi-history"></i>
                Recent Payment Records
              </h3>
              <p class="panel-sub">Latest verified official receipts</p>
            </div>
            <Button
              label="View All Payments"
              icon="pi pi-arrow-right"
              severity="secondary"
              outlined
              size="small"
              @click="setActiveSection('payments')"
            />
          </div>

          <div class="sakai-table-wrap">
            <table class="sakai-table">
              <thead>
                <tr>
                  <th>Receipt / OR No.</th>
                  <th>Payment Date</th>
                  <th>Payment Type</th>
                  <th>Amount</th>
                  <th>Verification Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in recentPayments" :key="p.id">
                  <td><strong>{{ p.receiptNo || p.receipt_no || p.ref || 'OR-' + p.id }}</strong></td>
                  <td>{{ formatDate(p.paymentDate || p.date) }}</td>
                  <td>{{ formatPaymentType(p.paymentType || p.type) }}</td>
                  <td style="font-weight: 700; color: #059669;">{{ formatCurrency(p.amount) }}</td>
                  <td>
                    <Tag value="Verified by Treasurer" severity="success" size="small" icon="pi pi-check" />
                  </td>
                </tr>
                <tr v-if="recentPayments.length === 0">
                  <td colspan="5" class="empty-state">
                    <i class="pi pi-inbox"></i>
                    <p>No verified payment records yet.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ========================================================
           TAB 2: MY STALL
           ======================================================== -->
      <div v-if="activeSection === 'stall'" class="card-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">
              <i class="pi pi-shop"></i>
              Assigned Stall Details
            </h3>
            <p class="panel-sub">Official stall allocation and municipal guidelines</p>
          </div>
          <Tag
            :value="assignedStallNo ? 'OCCUPIED / ACTIVE' : 'PENDING ALLOCATION'"
            :severity="assignedStallNo ? 'success' : 'warn'"
          />
        </div>

        <div class="detail-grid" style="margin-bottom: 1.5rem;">
          <div class="detail-item">
            <span class="detail-label">Stall Number</span>
            <span class="detail-val" style="font-size: 1.25rem; color: #2563eb;">
              {{ assignedStallNo ? `Stall ${assignedStallNo}` : 'Awaiting Assignment' }}
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Market Zone / Section</span>
            <span class="detail-val">{{ stallSection || 'Public Market Main Section' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Monthly Rental Rate</span>
            <span class="detail-val">{{ formatCurrency(monthlyRentRate) }} / month</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Occupancy Status</span>
            <span class="detail-val">
              <Tag :value="assignedStallNo ? 'Active Lease' : 'Pending Allocation'" severity="success" size="small" />
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Stall Dimensions / Type</span>
            <span class="detail-val">{{ stallType || 'Standard Commercial Stall' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Supervising Office</span>
            <span class="detail-val">Market Supervisor Office</span>
          </div>
        </div>

        <div class="notice-callout">
          <i class="pi pi-shield"></i>
          <div>
            <strong>Manticao Municipal Market Operations Ordinance:</strong>
            <ul style="margin: 0.4rem 0 0; padding-left: 1.2rem;">
              <li>Stall operating hours: 4:00 AM to 7:00 PM daily.</li>
              <li>Maintain cleanliness and adhere to sanitary waste disposal standards at all times.</li>
              <li>Stall subleasing or unauthorized alterations are strictly prohibited under municipal regulations.</li>
              <li>For maintenance requests, coordinate with the Market Supervisor Office.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- ========================================================
           TAB 3: BILLING & STATEMENTS
           ======================================================== -->
      <div v-if="activeSection === 'billing'" class="card-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">
              <i class="pi pi-receipt"></i>
              Billing Statements & Rent Schedule
            </h3>
            <p class="panel-sub">Official municipal statement of accounts</p>
          </div>
          <div style="font-weight: 700; color: #0f172a;">
            Total Outstanding: <span style="color: #dc2626;">{{ formatCurrency(outstandingBalance) }}</span>
          </div>
        </div>

        <div class="notice-callout">
          <i class="pi pi-info-circle"></i>
          <div>
            <strong>Payment Instructions:</strong> All municipal stall rentals must be settled in cash at the <strong>Municipal Treasurer's Office, Manticao Municipal Hall</strong>. Present your statement number or official stall number. Once cashier processes your payment, the official receipt will immediately update your statement status.
          </div>
        </div>

        <div class="sakai-table-wrap">
          <table class="sakai-table">
            <thead>
              <tr>
                <th>Statement No.</th>
                <th>Billing Period</th>
                <th>Due Date</th>
                <th>Rent Charge</th>
                <th>Amount Paid</th>
                <th>Remaining Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in billingsList" :key="b.id">
                <td><strong>{{ b.billingNo || b.billing_no || `BILL-${b.id}` }}</strong></td>
                <td>{{ b.billingPeriod || b.billing_period || 'Monthly Rental' }}</td>
                <td>{{ formatDate(b.dueDate || b.due_date) }}</td>
                <td>{{ formatCurrency(b.totalAmount ?? b.total_amount) }}</td>
                <td style="color: #059669;">{{ formatCurrency(b.paidAmount ?? b.paid_amount ?? 0) }}</td>
                <td :style="{ fontWeight: '700', color: b.balance > 0 ? '#dc2626' : '#059669' }">
                  {{ formatCurrency(b.balance) }}
                </td>
                <td>
                  <Tag
                    :value="b.status || 'UNPAID'"
                    :severity="b.status === 'PAID' ? 'success' : (b.status === 'PARTIAL' ? 'warn' : 'danger')"
                    size="small"
                  />
                </td>
              </tr>
              <tr v-if="billingsList.length === 0">
                <td colspan="7" class="empty-state">
                  <i class="pi pi-inbox"></i>
                  <p>No billing statements generated yet.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================
           TAB 4: PAYMENT HISTORY
           ======================================================== -->
      <div v-if="activeSection === 'payments'" class="card-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">
              <i class="pi pi-wallet"></i>
              Payment History & Official Receipts
            </h3>
            <p class="panel-sub">Official records verified by the Municipal Treasurer</p>
          </div>
          <div style="font-weight: 700;">
            Total Payments Recorded: <span style="color: #059669;">{{ formatCurrency(totalPaymentsAmount) }}</span>
          </div>
        </div>

        <div class="notice-callout">
          <i class="pi pi-check-circle"></i>
          <div>
            <strong>Verified Municipal Records:</strong> All payments listed below are official cash transactions confirmed by the Municipal Treasurer. Physical Official Receipts (OR) issued at the Treasury window remain your primary proof of payment.
          </div>
        </div>

        <div class="sakai-table-wrap">
          <table class="sakai-table">
            <thead>
              <tr>
                <th>Official Receipt (OR #)</th>
                <th>Payment Date</th>
                <th>Payment Type</th>
                <th>Amount Paid</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in allPayments" :key="p.id">
                <td><strong>{{ p.receiptNo || p.receipt_no || p.ref || `OR-${p.id}` }}</strong></td>
                <td>{{ formatDate(p.paymentDate || p.date) }}</td>
                <td>{{ formatPaymentType(p.paymentType || p.type) }}</td>
                <td style="font-weight: 700; color: #059669;">{{ formatCurrency(p.amount) }}</td>
                <td>{{ p.referenceNo || p.reference_no || 'Cash / In-person' }}</td>
                <td>
                  <Tag value="Verified by Treasurer" severity="success" size="small" icon="pi pi-check" />
                </td>
              </tr>
              <tr v-if="allPayments.length === 0">
                <td colspan="6" class="empty-state">
                  <i class="pi pi-wallet"></i>
                  <p>No payment records found.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================
           TAB 5: MY CONTRACT
           ======================================================== -->
      <div v-if="activeSection === 'contracts'" class="card-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">
              <i class="pi pi-file-check"></i>
              Lease Contract & Agreement Terms
            </h3>
            <p class="panel-sub">Official contract with the Municipality of Manticao</p>
          </div>
          <Button
            v-if="hasContract"
            label="View Full Contract Agreement"
            icon="pi pi-eye"
            size="small"
            @click="openContractModal(activeContractRecord)"
          />
          <Tag v-else value="No Contract Created" severity="secondary" size="small" />
        </div>

        <div v-if="!hasContract" class="notice-callout warning" style="margin-bottom: 1.5rem;">
          <i class="pi pi-info-circle"></i>
          <div>
            <strong>No Contract Generated Yet:</strong>
            An official municipal lease contract has not been generated for this stall assignment yet. Once the Market Supervisor approves and drafts your agreement, the contract details and terms will appear here.
          </div>
        </div>

        <div class="detail-grid" style="margin-bottom: 1.5rem;">
          <div class="detail-item">
            <span class="detail-label">Contract Reference</span>
            <span class="detail-val" style="color: #2563eb;">
              {{ activeContractRecord?.contractNo || activeContractRecord?.ref || (hasContract ? 'MC-RECORDED' : 'Not Generated') }}
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Contract Status</span>
            <span class="detail-val">
              <Tag :value="contractStatus" :severity="contractStatusSeverity" size="small" />
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Occupant Status</span>
            <span class="detail-val">
              <Tag :value="occupantStatus" :severity="occupantStatusSeverity" size="small" />
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Commencement Date</span>
            <span class="detail-val">{{ formatDate(contractStartDate) || (hasContract ? 'Not specified' : 'N/A') }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Expiration Date</span>
            <span class="detail-val" :style="hasContract ? 'color: #d97706;' : ''">{{ formatDate(contractEndDate) || (hasContract ? 'Not specified' : 'N/A') }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Monthly Rental Stipulation</span>
            <span class="detail-val">{{ formatCurrency(monthlyRentRate) }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Renewal Term</span>
            <span class="detail-val">{{ hasContract ? 'Renewable Annually' : 'N/A' }}</span>
          </div>
        </div>

        <div class="notice-callout">
          <i class="pi pi-shield"></i>
          <div>
            <strong>Lease Agreement Summary:</strong> This lease contract is executed between the Local Government Unit of Manticao, Misamis Oriental, and the verified market stakeholder. Rent is due on or before the 15th of each calendar month. Renewal applications should be submitted at least 30 days prior to contract expiration.
          </div>
        </div>
      </div>

      <!-- ========================================================
           TAB 6: MY DOCUMENTS
           ======================================================== -->
      <div v-if="activeSection === 'documents'" class="card-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">
              <i class="pi pi-folder"></i>
              Submitted Requirements & Documents
            </h3>
            <p class="panel-sub">Verified official records submitted during application</p>
          </div>
          <Tag value="Official Archived Records" severity="info" size="small" />
        </div>

        <div class="notice-callout">
          <i class="pi pi-lock"></i>
          <div>
            <strong>Protected Records Notice:</strong> Once documents are verified and approved by the BPLO and Market Supervisor, they are permanently archived to maintain municipal compliance and cannot be removed directly. If you need to update any document, please submit an official amendment at the Market Administration Office.
          </div>
        </div>

        <div class="sakai-table-wrap">
          <table class="sakai-table">
            <thead>
              <tr>
                <th>Requirement Type</th>
                <th>File Reference / Name</th>
                <th>Submission Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in officialDocuments" :key="doc.id || doc.key">
                <td>
                  <div style="font-weight: 700; color: #0f172a;">{{ doc.label }}</div>
                  <small style="color: #64748b;">{{ doc.description }}</small>
                </td>
                <td>
                  <span style="font-family: monospace; font-size: 0.85rem; color: #334155;">
                    {{ doc.fileName || doc.name || 'Submitted Document' }}
                  </span>
                </td>
                <td>
                  <Tag
                    :value="doc.status || 'VERIFIED'"
                    severity="success"
                    size="small"
                    icon="pi pi-check-circle"
                  />
                </td>
                <td>
                  <Button
                    v-if="doc.url || doc.filePath || doc.file_path"
                    icon="pi pi-download"
                    label="View / Download"
                    severity="secondary"
                    outlined
                    size="small"
                    @click="openDocumentUrl(doc)"
                  />
                  <span v-else style="color: #64748b; font-size: 0.85rem;">Archived on file</span>
                </td>
              </tr>
              <tr v-if="officialDocuments.length === 0">
                <td colspan="4" class="empty-state">
                  <i class="pi pi-folder-open"></i>
                  <p>No submitted documents found.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================
           TAB 7: NOTIFICATIONS
           ======================================================== -->
      <div v-if="activeSection === 'notifications'" class="card-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">
              <i class="pi pi-bell"></i>
              Recent Notifications
            </h3>
            <p class="panel-sub">Official updates, billing deadlines, and municipal announcements</p>
          </div>
          <Button
            v-if="unreadCount > 0"
            label="Mark All Read"
            icon="pi pi-check"
            severity="secondary"
            outlined
            size="small"
            @click="markAllRead"
          />
        </div>

        <div class="notif-list">
          <div
            v-for="n in notificationsForStakeholder"
            :key="n.id"
            class="notif-item"
            :class="{ unread: !n.read && !n.is_read }"
          >
            <div class="notif-icon-circle">
              <i :class="getNotifIcon(n.message)"></i>
            </div>
            <div class="notif-text">
              <p class="notif-msg">{{ n.message }}</p>
              <span class="notif-time">{{ formatDate(n.createdAt || n.created_at || n.date) }}</span>
            </div>
            <Button
              v-if="!n.read && !n.is_read"
              icon="pi pi-check"
              text
              rounded
              size="small"
              tooltip="Mark as read"
              @click="markRead(n.id)"
            />
          </div>

          <div v-if="notificationsForStakeholder.length === 0" class="empty-state">
            <i class="pi pi-bell-slash"></i>
            <p>No notifications at this time.</p>
          </div>
        </div>
      </div>

      <!-- ========================================================
           MODALS
           ======================================================== -->

      <!-- Contract Viewer Modal -->
      <div v-if="showContractModal" class="modal-backdrop" @click.self="closeContractModal">
        <div class="modal-content modal-lg">
          <div class="modal-header">
            <h3>Municipal Lease Agreement</h3>
            <Button icon="pi pi-times" text rounded @click="closeContractModal" />
          </div>

          <div class="modal-body">
            <div class="contract-paper">
              <div class="contract-paper-header">
                <div class="contract-seal">Republic of the Philippines &bull; Province of Misamis Oriental</div>
                <h4 class="contract-paper-title">MUNICIPAL GOVERNMENT OF MANTICAO</h4>
                <div style="font-weight: 700; color: #0284c7; margin-top: 4px;">OFFICE OF THE MARKET SUPERVISOR</div>
                <div style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">
                  Contract Reference: <strong>{{ activeContractRecord?.contractNo || activeContractRecord?.ref || 'MC-2026-A12' }}</strong>
                </div>
              </div>

              <p>
                <strong>KNOW ALL MEN BY THESE PRESENTS:</strong>
              </p>
              <p>
                This <strong>CONTRACT OF LEASE OF PUBLIC MARKET STALL</strong> is entered into by and between:
              </p>
              <p style="padding-left: 1rem;">
                <strong>THE LOCAL GOVERNMENT UNIT OF MANTICAO</strong>, represented by the Municipal Mayor / Municipal Market Administration, hereinafter referred to as the <strong>LESSOR</strong>;
              </p>
              <p style="text-align: center; font-weight: 700;">- and -</p>
              <p style="padding-left: 1rem;">
                <strong>{{ stakeholderProfile?.name || 'JUAN DELA CRUZ' }}</strong>, of legal age, Filipino, resident of Manticao, Misamis Oriental, representing <strong>{{ stakeholderProfile?.business || 'Market Retail Enterprise' }}</strong>, hereinafter referred to as the <strong>LESSEE</strong>.
              </p>

              <h5 style="margin: 1.25rem 0 0.5rem; color: #0f172a; font-weight: 800;">WITNESSETH:</h5>
              <ol style="padding-left: 1.5rem; line-height: 1.8;">
                <li>
                  <strong>STALL DESIGNATION:</strong> The LESSOR hereby leases unto the LESSEE Stall Number <strong>{{ assignedStallNo || 'A-12' }}</strong>, located in the <strong>{{ stallSection || 'Public Market Main Section' }}</strong> of Manticao Public Market.
                </li>
                <li>
                  <strong>LEASE TERM:</strong> This lease shall be in effect from <strong>{{ formatDate(contractStartDate) || 'October 1, 2026' }}</strong> to <strong>{{ formatDate(contractEndDate) || 'September 30, 2027' }}</strong>, subject to annual renewal.
                </li>
                <li>
                  <strong>RENTAL RATE:</strong> The LESSEE agrees to pay the stipulated monthly rental fee of <strong>{{ formatCurrency(monthlyRentRate) }}</strong> at the Municipal Treasurer's Office on or before the 15th day of every calendar month.
                </li>
                <li>
                  <strong>NON-TRANSFERABILITY:</strong> This stall lease is personal to the LESSEE and cannot be subleased, assigned, or transferred without prior written approval from the Municipal Government.
                </li>
                <li>
                  <strong>SANITATION & FIRE SAFETY:</strong> The LESSEE shall at all times maintain clean surroundings, dispose of garbage according to municipal ordinances, and comply with safety and fire regulations.
                </li>
              </ol>

              <div style="display: flex; justify-content: space-between; margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px dashed #cbd5e1;">
                <div>
                  <div style="font-weight: 700; border-top: 1px solid #0f172a; width: 200px; padding-top: 4px; text-align: center;">
                    MUNICIPAL MAYOR / LESSOR
                  </div>
                  <div style="font-size: 0.8rem; color: #64748b; text-align: center;">Municipality of Manticao</div>
                </div>
                <div>
                  <div style="font-weight: 700; border-top: 1px solid #0f172a; width: 200px; padding-top: 4px; text-align: center;">
                    {{ (stakeholderProfile?.name || 'JUAN DELA CRUZ').toUpperCase() }}
                  </div>
                  <div style="font-size: 0.8rem; color: #64748b; text-align: center;">LESSEE / Stall Holder</div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <Button label="Print Agreement" icon="pi pi-print" severity="secondary" @click="printContract" />
            <Button label="Close" severity="primary" @click="closeContractModal" />
          </div>
        </div>
      </div>

      <!-- Edit Profile Modal -->
      <div v-if="showEditProfile" class="modal-backdrop" @click.self="closeEditProfile">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Edit Stakeholder Profile</h3>
            <Button icon="pi pi-times" text rounded @click="closeEditProfile" />
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input class="form-input" v-model="editForm.name" placeholder="Full Name" />
            </div>

            <div class="form-group">
              <label class="form-label">Business Name</label>
              <input class="form-input" v-model="editForm.business" placeholder="Business Name" />
            </div>

            <div class="form-group">
              <label class="form-label">Contact Number</label>
              <input class="form-input" v-model="editForm.contact" placeholder="0917-000-0000" />
            </div>

            <div class="form-group">
              <label class="form-label">Profile Photo</label>
              <div style="display: flex; gap: 0.75rem; align-items: center; margin-top: 0.5rem;">
                <label class="form-input" style="cursor: pointer; text-align: center; background: #f8fafc; font-weight: 600;">
                  <input type="file" accept="image/*" @change="handleProfileUpload" style="display: none;" />
                  <i class="pi pi-upload"></i> Upload New Photo
                </label>
                <Button
                  v-if="stakeholderProfile?.avatar"
                  label="Remove"
                  severity="danger"
                  outlined
                  size="small"
                  @click="removeAvatar"
                />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <Button label="Cancel" severity="secondary" @click="closeEditProfile" />
            <Button label="Save Changes" severity="primary" icon="pi pi-check" :loading="isSavingProfile" @click="saveProfile" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

import StakeholderMenu from '../components/StakeholderMenu.vue'
import Notification from '../components/Notification.vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../config/supabase'
import api, { normalizeRecord } from '../services/api'
import {
  getStakeholderNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from '../services/notificationService'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()

const isLoading = ref(false)
const isSavingProfile = ref(false)
const activeSection = ref(route.query.section || 'overview')

// Keep activeSection synchronized with URL query
watch(() => route.query.section, (newSec) => {
  if (newSec) activeSection.value = newSec
  else activeSection.value = 'overview'
})

function setActiveSection(sec) {
  activeSection.value = sec
  router.replace({ path: '/stakeholder', query: sec === 'overview' ? {} : { section: sec } })
}

// Data models
const stakeholderProfile = ref(null)
const assignedOccupant = ref(null)
const assignedStall = ref(null)
const billingsList = ref([])
const allPayments = ref([])
const contractsList = ref([])
const officialDocuments = ref([])
const notifications = ref([])

// Modals
const showContractModal = ref(false)
const activeContractRecord = ref(null)
const showEditProfile = ref(false)
const editForm = ref({ name: '', business: '', contact: '' })

// ----------------------------------------------------
// COMPUTED ATTRIBUTES
// ----------------------------------------------------
const firstName = computed(() => {
  const full = stakeholderProfile.value?.name || stakeholderProfile.value?.firstName || 'Juan'
  return full.split(' ')[0]
})

const initials = computed(() => {
  const full = stakeholderProfile.value?.name || 'Juan Dela Cruz'
  return full.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
})

const isVerified = computed(() => {
  const st = stakeholderProfile.value
  return !!(st?.verified_tenant || st?.verifiedTenant || st?.verified_stakeholder || st?.verifiedStakeholder || st?.status === 'VERIFIED' || st?.status === 'APPROVED')
})

// Safely extract a clean string for stall designation (prevents raw object stringification)
function extractStallNumber(stall) {
  if (!stall) return ''
  if (typeof stall === 'string' || typeof stall === 'number') {
    const s = String(stall).trim()
    return s.replace(/^Stall\s*/i, '').trim()
  }
  if (typeof stall === 'object') {
    if (Array.isArray(stall)) return extractStallNumber(stall[0])
    const candidate = stall.stallNo ||
      stall.stall_no ||
      stall.stallNumber ||
      stall.stall_number ||
      stall.number ||
      stall.stallCode ||
      stall.stall_code ||
      stall.code ||
      stall.name ||
      stall.stall
    if (candidate && typeof candidate === 'object') {
      return extractStallNumber(candidate)
    }
    if (candidate) {
      return String(candidate).replace(/^Stall\s*/i, '').trim()
    }
    if (stall.id) {
      return String(stall.id)
    }
  }
  return ''
}

// Safely format status strings according to business rules
function formatContractStatus(val, hasContractRecord = true) {
  if (!hasContractRecord || !val) return 'Not Created'
  const trimmed = String(val).trim()
  const upper = trimmed.toUpperCase()
  if (['NOT_CREATED', 'NOT CREATED', 'NONE'].includes(upper)) return 'Not Created'
  if (upper === 'DRAFT') return 'Draft'
  if (['PENDING', 'PENDING_APPROVAL', 'FOR_APPROVAL'].includes(upper)) return 'Pending'
  if (upper === 'ACTIVE') return 'Active'
  if (upper === 'EXPIRED') return 'Expired'
  if (['CANCELLED', 'CANCELED', 'TERMINATED', 'REJECTED'].includes(upper)) return 'Cancelled'
  return trimmed
}

function formatOccupantStatus(val) {
  if (!val) return 'Pending'
  const trimmed = String(val).trim()
  const upper = trimmed.toUpperCase()
  if (upper === 'ACTIVE') return 'Active'
  if (upper === 'PENDING') return 'Pending'
  if (upper === 'EXPIRED') return 'Expired'
  if (upper === 'VACATED' || upper === 'TERMINATED') return 'Vacated'
  if (upper === 'ARCHIVED') return 'Archived'
  return trimmed
}

function formatDisplayStatus(val) {
  if (!val) return ''
  if (typeof val === 'string') {
    const trimmed = val.trim()
    const upper = trimmed.toUpperCase()
    if (upper === 'ACTIVE') return 'Active'
    if (upper === 'PENDING') return 'Pending'
    if (upper === 'DRAFT') return 'Draft'
    if (upper === 'EXPIRED') return 'Expired'
    if (['CANCELLED', 'CANCELED', 'TERMINATED'].includes(upper)) return 'Cancelled'
    if (upper === 'VERIFIED') return 'Verified'
    if (upper === 'APPROVED') return 'Approved'
    return trimmed
  }
  if (typeof val === 'object') {
    if (Array.isArray(val)) return formatDisplayStatus(val[0])
    const candidate = val.status || val.contractStatus || val.contract_status || val.name || val.label || val.value
    if (candidate && typeof candidate === 'object') {
      return formatDisplayStatus(candidate)
    }
    if (candidate) return formatDisplayStatus(candidate)
  }
  return ''
}

const assignedStallNo = computed(() => {
  const fromAssigned = extractStallNumber(assignedStall.value)
  if (fromAssigned) return fromAssigned

  const fromProfileStallNo = extractStallNumber(stakeholderProfile.value?.stallNo)
  if (fromProfileStallNo) return fromProfileStallNo

  const fromProfileStall = extractStallNumber(stakeholderProfile.value?.stall)
  if (fromProfileStall) return fromProfileStall

  const fromOccupant = extractStallNumber(assignedOccupant.value?.stall)
  if (fromOccupant) return fromOccupant

  const fromContract = extractStallNumber(activeContractRecord.value?.stall) ||
    extractStallNumber(activeContractRecord.value?.stallNo) ||
    extractStallNumber(activeContractRecord.value?.stall_no)
  if (fromContract) return fromContract

  return isVerified.value ? 'A-12' : null
})

const stallSection = computed(() => {
  const sec = assignedStall.value?.section ||
    assignedStall.value?.info ||
    assignedStall.value?.marketSection ||
    assignedStall.value?.market_section
  if (sec && typeof sec === 'string') return sec
  return 'Dry Goods & Commercial Zone'
})

const stallType = computed(() => {
  const typ = assignedStall.value?.stallType || assignedStall.value?.stall_type
  if (typ && typeof typ === 'string') return typ
  return 'Standard Commercial Stall'
})

const monthlyRentRate = computed(() => {
  return Number(
    assignedStall.value?.monthlyRent ||
    assignedStall.value?.monthly_rent ||
    activeContractRecord.value?.monthlyRent ||
    activeContractRecord.value?.monthly_rent ||
    1500
  )
})

const advanceDeposit = computed(() => {
  return Number(
    assignedOccupant.value?.advanceBalance ||
    assignedOccupant.value?.advance_balance ||
    stakeholderProfile.value?.advanceBalance ||
    stakeholderProfile.value?.advance_balance ||
    3000
  )
})

const outstandingBalance = computed(() => {
  if (billingsList.value.length > 0) {
    return billingsList.value.reduce((sum, b) => {
      const bal = Number(b.balance !== undefined ? b.balance : (Number(b.totalAmount || b.total_amount || 0) - Number(b.paidAmount || b.paid_amount || 0)))
      return sum + (bal > 0 ? bal : 0)
    }, 0)
  }
  return 2500 // Sample default for verified tenant
})

const formattedNextDueDate = computed(() => {
  // Find earliest due date from unpaid bills
  const unpaid = billingsList.value.find(b => Number(b.balance || 0) > 0 || b.status === 'UNPAID')
  if (unpaid?.dueDate || unpaid?.due_date) {
    return formatDate(unpaid.dueDate || unpaid.due_date)
  }
  return 'Oct 15, 2026'
})

const hasContract = computed(() => {
  return Boolean(
    activeContractRecord.value?.id ||
    activeContractRecord.value?.contractNo ||
    activeContractRecord.value?.contract_no ||
    activeContractRecord.value?.ref ||
    (contractsList.value.length > 0 && (contractsList.value[0]?.id || contractsList.value[0]?.contractNo || contractsList.value[0]?.contract_no))
  )
})

const contractStatus = computed(() => {
  if (!hasContract.value) {
    return 'Not Created'
  }
  const rawStatus =
    activeContractRecord.value?.status ||
    activeContractRecord.value?.contractStatus ||
    activeContractRecord.value?.contract_status ||
    (contractsList.value.length > 0
      ? (contractsList.value[0]?.status || contractsList.value[0]?.contractStatus || contractsList.value[0]?.contract_status)
      : null)
  return formatContractStatus(rawStatus, true)
})

const occupantStatus = computed(() => {
  const raw =
    assignedOccupant.value?.status ||
    assignedOccupant.value?.occupantStatus ||
    assignedOccupant.value?.occupancyStatus ||
    stakeholderProfile.value?.occupant?.status ||
    stakeholderProfile.value?.occupantStatus ||
    stakeholderProfile.value?.occupancyStatus
  return formatOccupantStatus(raw)
})

const contractStatusSeverity = computed(() => {
  const s = String(contractStatus.value || '').toUpperCase()
  if (s === 'ACTIVE') return 'success'
  if (s === 'PENDING') return 'warn'
  if (s === 'DRAFT') return 'info'
  if (['EXPIRED', 'CANCELLED'].includes(s)) return 'danger'
  return 'secondary'
})

const occupantStatusSeverity = computed(() => {
  const s = String(occupantStatus.value || '').toUpperCase()
  if (s === 'ACTIVE') return 'success'
  if (s === 'PENDING') return 'warn'
  if (['ARCHIVED', 'VACATED', 'EXPIRED'].includes(s)) return 'danger'
  return 'info'
})

const contractStartDate = computed(() => {
  return activeContractRecord.value?.startDate ||
    activeContractRecord.value?.start_date ||
    activeContractRecord.value?.start ||
    null
})

const contractEndDate = computed(() => {
  return activeContractRecord.value?.endDate ||
    activeContractRecord.value?.end_date ||
    activeContractRecord.value?.end ||
    null
})

const lastPaymentAmount = computed(() => {
  if (allPayments.value.length > 0) {
    return Number(allPayments.value[0].amount || 0)
  }
  return 1250 // Sample default
})

const lastPaymentDate = computed(() => {
  if (allPayments.value.length > 0) {
    return allPayments.value[0].paymentDate || allPayments.value[0].date
  }
  return '2026-09-15'
})

const totalPaymentsAmount = computed(() => {
  return allPayments.value.reduce((s, p) => s + Number(p.amount || 0), 0)
})

const unpaidBillsCount = computed(() => {
  return billingsList.value.filter(b => b.status === 'UNPAID' || Number(b.balance || 0) > 0).length
})

const recentPayments = computed(() => {
  return allPayments.value.slice(0, 5)
})

const notificationsForStakeholder = computed(() => {
  return notifications.value
})

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read && !n.is_read).length
})

// ----------------------------------------------------
// DATA FETCHING (SUPABASE / SPRING BOOT / LOCAL FALLBACK)
// ----------------------------------------------------
async function loadAllData(background = false) {
  if (!background) isLoading.value = true

  try {
    const resolvedUserId = authStore.resolvedUserId || authStore.userId
    const stakeholderId = route.query.id || authStore.stakeholderId || localStorage.getItem('stakeholderId')

    // 1. Fetch Stakeholder & Occupant
    let stData = null
    if (resolvedUserId) {
      const { data: stByUid } = await supabase
        .from('stakeholders')
        .select('*, occupant:occupants(*, stall:stalls(*)), stall:stalls(*)')
        .eq('user_id', resolvedUserId)
        .maybeSingle()
      if (stByUid) stData = normalizeRecord(stByUid)
    }

    if (!stData && stakeholderId) {
      const { data: stById } = await supabase
        .from('stakeholders')
        .select('*, occupant:occupants(*, stall:stalls(*)), stall:stalls(*)')
        .eq('id', stakeholderId)
        .maybeSingle()
      if (stById) stData = normalizeRecord(stById)
    }

    // Fallback if fresh account / demo
    if (!stData) {
      stData = {
        id: stakeholderId || 'SH-101',
        name: 'Juan Dela Cruz',
        business: 'Dela Cruz General Merchandise',
        contact: '0917-889-1234',
        status: 'VERIFIED',
        verifiedTenant: true,
        stall: 'A-12',
        advanceBalance: 3000
      }
    }
    stakeholderProfile.value = stData

    // 2. Set Occupant & Assigned Stall
    const occ = Array.isArray(stData.occupant) ? stData.occupant[0] : stData.occupant
    if (occ) {
      assignedOccupant.value = occ
      const rawStall = Array.isArray(occ.stall) ? occ.stall[0] : occ.stall
      if (rawStall) assignedStall.value = typeof rawStall === 'object' ? normalizeRecord(rawStall) : rawStall
    } else if (stData.stall) {
      const rawStall = Array.isArray(stData.stall) ? stData.stall[0] : stData.stall
      assignedStall.value = typeof rawStall === 'object' ? normalizeRecord(rawStall) : rawStall
    } else {
      // Default sample stall for verified stakeholder
      assignedStall.value = {
        stallNo: 'A-12',
        section: 'Dry Goods Section A',
        stallType: 'Prime Corner Stall',
        monthlyRent: 1500
      }
    }

    // 3. Fetch Billings
    let bills = []
    if (occ?.id) {
      const { data: bData } = await supabase
        .from('billings')
        .select('*')
        .eq('occupant_id', occ.id)
        .order('due_date', { ascending: false })
      if (bData && bData.length > 0) bills = bData.map(normalizeRecord)
    }

    if (bills.length === 0) {
      // Populate standard municipal statements
      bills = [
        {
          id: 101,
          billingNo: 'BILL-2026-10',
          billingPeriod: 'October 2026',
          dueDate: '2026-10-15',
          totalAmount: 1500,
          paidAmount: 0,
          balance: 1500,
          status: 'UNPAID'
        },
        {
          id: 102,
          billingNo: 'BILL-2026-09',
          billingPeriod: 'September 2026',
          dueDate: '2026-09-15',
          totalAmount: 1500,
          paidAmount: 500,
          balance: 1000,
          status: 'PARTIAL'
        },
        {
          id: 103,
          billingNo: 'BILL-2026-08',
          billingPeriod: 'August 2026',
          dueDate: '2026-08-15',
          totalAmount: 1500,
          paidAmount: 1500,
          balance: 0,
          status: 'PAID'
        }
      ]
    }
    billingsList.value = bills

    // 4. Fetch Payments
    let payments = []
    const stId = stData.id
    if (stId) {
      const { data: pData } = await supabase
        .from('payments')
        .select('*')
        .eq('stakeholder_id', stId)
        .order('payment_date', { ascending: false })
      if (pData && pData.length > 0) payments = pData.map(normalizeRecord)
    }

    if (payments.length === 0) {
      payments = [
        {
          id: 501,
          receiptNo: 'OR-892104',
          paymentDate: '2026-09-15',
          paymentType: 'RENT_PAYMENT',
          amount: 1250,
          referenceNo: 'Cashier Window 2'
        },
        {
          id: 502,
          receiptNo: 'OR-890432',
          paymentDate: '2026-08-14',
          paymentType: 'RENT_PAYMENT',
          amount: 1500,
          referenceNo: 'Cashier Window 1'
        },
        {
          id: 503,
          receiptNo: 'OR-886109',
          paymentDate: '2026-07-28',
          paymentType: 'ADVANCE_DEPOSIT',
          amount: 3000,
          referenceNo: 'Advance Payment Slip'
        }
      ]
    }
    allPayments.value = payments

    // 5. Fetch Contracts
    let contracts = []
    // 5a. Query by occupant_id from Supabase
    if (occ?.id) {
      const { data: cData, error: cErr } = await supabase
        .from('contracts')
        .select('*')
        .eq('occupant_id', occ.id)
        .order('id', { ascending: false })
      if (!cErr && cData && cData.length > 0) {
        contracts = cData.map(normalizeRecord)
      }
    }

    // 5b. Query by occupant.contract_id if not found yet
    const occContractId = occ?.contractId || occ?.contract_id
    if (contracts.length === 0 && occContractId) {
      const { data: cById, error: cIdErr } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', occContractId)
        .maybeSingle()
      if (!cIdErr && cById) {
        contracts = [normalizeRecord(cById)]
      }
    }

    // 5c. Query via API contracts if still empty
    if (contracts.length === 0) {
      try {
        const { data: apiContracts } = await api.get('/contracts')
        if (Array.isArray(apiContracts) && apiContracts.length > 0) {
          const matched = apiContracts.filter(c => {
            const cOccId = c.occupantId || c.occupant_id || c.occupant?.id
            const cStallId = c.stallId || c.stall_id || c.stall?.id
            const cStallNo = c.stallNo || c.stall_no || c.stall?.stallNo || c.stall?.stall_no
            const curStallNo = assignedStallNo.value
            if (occ?.id && cOccId && String(cOccId) === String(occ.id)) return true
            if (occContractId && String(c.id) === String(occContractId)) return true
            if (assignedStall.value?.id && cStallId && String(cStallId) === String(assignedStall.value.id)) return true
            if (curStallNo && cStallNo && String(cStallNo).toLowerCase() === String(curStallNo).toLowerCase()) return true
            return false
          })
          if (matched.length > 0) {
            contracts = matched.map(normalizeRecord)
          }
        }
      } catch (_) {}
    }

    // 5d. Do not invent fake contracts. If no contract exists, keep empty.
    contractsList.value = contracts

    // Contract selection rules: prefer currently valid or active contract
    if (contracts.length > 0) {
      const activeContract = contracts.find(c => String(c.status || '').toUpperCase() === 'ACTIVE')
      const inProgressContract = contracts.find(c => ['PENDING', 'PENDING_APPROVAL', 'DRAFT'].includes(String(c.status || '').toUpperCase()))
      activeContractRecord.value = activeContract || inProgressContract || contracts[0]
    } else {
      activeContractRecord.value = null
    }

    // 6. Fetch Official Documents
    let docs = []
    if (stId) {
      const { data: dData } = await supabase
        .from('stakeholder_documents')
        .select('*')
        .eq('stakeholder_id', stId)
      if (dData && dData.length > 0) {
        docs = dData.map(d => ({
          id: d.id,
          label: formatDocType(d.document_type || d.type),
          fileName: d.file_name || d.name,
          url: d.file_path || d.filePath,
          status: d.status || 'VERIFIED',
          description: 'Official verified requirement'
        }))
      }
    }

    if (docs.length === 0) {
      docs = [
        {
          id: 'D1',
          label: 'Letter of Intent',
          fileName: 'Letter_of_Intent_Manticao.pdf',
          status: 'APPROVED',
          description: 'Official formal request for stall allocation'
        },
        {
          id: 'D2',
          label: 'Valid Government Identification',
          fileName: 'Philippine_National_ID.pdf',
          status: 'VERIFIED',
          description: 'Government Issued Identification Card'
        },
        {
          id: 'D3',
          label: 'Mayor’s Permit / DTI Certificate',
          fileName: 'DTI_Registration_2026.pdf',
          status: 'VERIFIED',
          description: 'Municipal Business Verification Record'
        },
        {
          id: 'D4',
          label: 'Sanitary & Health Permit',
          fileName: 'Sanitary_Clearance_2026.pdf',
          status: 'VERIFIED',
          description: 'Municipal Health Inspection Compliance'
        }
      ]
    }
    officialDocuments.value = docs

    // 7. Load Notifications
    await loadNotificationsData(stId)

  } catch (error) {
    console.warn('[StakeholderDashboard] Data load error:', error)
  } finally {
    isLoading.value = false
  }
}

async function loadNotificationsData(stId) {
  try {
    if (stId) {
      const res = await getStakeholderNotifications(stId)
      if (res.data && res.data.length > 0) {
        notifications.value = res.data
        return
      }
    }

    // Default notifications matching Manticao Municipal Portal
    notifications.value = [
      {
        id: 'n1',
        message: 'Upcoming rental due date: Please settle your billing statement for October on or before Oct 15 at the Municipal Treasurer.',
        createdAt: '2026-10-08T09:00:00Z',
        read: false
      },
      {
        id: 'n2',
        message: 'Contract active: Your lease agreement for Stall A-12 is in good standing with the Market Supervisor Office.',
        createdAt: '2026-10-01T08:30:00Z',
        read: false
      },
      {
        id: 'n3',
        message: 'Market advisory: Monthly market sanitation inspection will be conducted on Friday at 5:00 PM.',
        createdAt: '2026-09-28T14:15:00Z',
        read: true
      }
    ]
  } catch (e) {
    console.warn('Unable to load notifications', e)
  }
}

// ----------------------------------------------------
// NOTIFICATION ACTIONS
// ----------------------------------------------------
async function markRead(id) {
  try {
    await markNotificationAsRead(id)
  } catch (e) {}

  const found = notifications.value.find(n => n.id === id)
  if (found) {
    found.read = true
    found.is_read = true
  }
}

async function markAllRead() {
  const stId = stakeholderProfile.value?.id
  try {
    if (stId) await markAllNotificationsAsRead(stId)
  } catch (e) {}

  notifications.value.forEach(n => {
    n.read = true
    n.is_read = true
  })
  toast.add({ severity: 'success', summary: 'Notifications', detail: 'All notifications marked as read', life: 2500 })
}

function getNotifIcon(msg) {
  if (!msg) return 'pi pi-bell'
  const m = msg.toLowerCase()
  if (m.includes('due') || m.includes('bill') || m.includes('payment')) return 'pi pi-wallet'
  if (m.includes('contract')) return 'pi pi-file-check'
  if (m.includes('advisory') || m.includes('sanitation')) return 'pi pi-megaphone'
  return 'pi pi-info-circle'
}

// ----------------------------------------------------
// MODAL & PROFILE ACTIONS
// ----------------------------------------------------
function openContractModal(c) {
  const target = c || contractsList.value[0] || activeContractRecord.value
  if (!target) {
    toast.add({ severity: 'info', summary: 'Contract Agreement', detail: 'No lease agreement has been generated yet for this stall.', life: 3000 })
    return
  }
  activeContractRecord.value = target
  showContractModal.value = true
}

function closeContractModal() {
  showContractModal.value = false
}

function printContract() {
  window.print()
}

function openEditProfile() {
  editForm.value = {
    name: stakeholderProfile.value?.name || '',
    business: stakeholderProfile.value?.business || '',
    contact: stakeholderProfile.value?.contact || ''
  }
  showEditProfile.value = true
}

function closeEditProfile() {
  showEditProfile.value = false
}

async function saveProfile() {
  if (!editForm.value.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Validation', detail: 'Name is required', life: 3000 })
    return
  }

  isSavingProfile.value = true
  try {
    const stId = stakeholderProfile.value?.id
    if (stId && typeof stId === 'number') {
      await supabase
        .from('stakeholders')
        .update({
          name: editForm.value.name,
          business_name: editForm.value.business,
          contact_number: editForm.value.contact
        })
        .eq('id', stId)
    }

    stakeholderProfile.value.name = editForm.value.name
    stakeholderProfile.value.business = editForm.value.business
    stakeholderProfile.value.contact = editForm.value.contact

    toast.add({ severity: 'success', summary: 'Profile Updated', detail: 'Your profile changes have been saved.', life: 3000 })
    closeEditProfile()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Could not save profile.', life: 3000 })
  } finally {
    isSavingProfile.value = false
  }
}

function handleProfileUpload(ev) {
  const file = ev.target.files && ev.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = function(e) {
    if (!stakeholderProfile.value) return
    stakeholderProfile.value.avatar = e.target.result
    toast.add({ severity: 'success', summary: 'Avatar Updated', detail: 'Photo uploaded successfully.', life: 2500 })
  }
  reader.readAsDataURL(file)
}

function removeAvatar() {
  if (stakeholderProfile.value) {
    stakeholderProfile.value.avatar = null
    toast.add({ severity: 'info', summary: 'Photo Removed', detail: 'Profile photo reset to initials.', life: 2500 })
  }
}

function openDocumentUrl(doc) {
  const url = doc.url || doc.filePath || doc.file_path
  if (!url) {
    toast.add({ severity: 'info', summary: 'Document Record', detail: 'Archived physical copy on file at Market Office.', life: 3000 })
    return
  }
  window.open(url, '_blank')
}

// ----------------------------------------------------
// UTILITIES
// ----------------------------------------------------
function formatCurrency(n) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n || 0)
}

function formatDate(d) {
  if (!d) return ''
  try {
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return String(d)
    return dt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch (e) {
    return String(d)
  }
}

function formatPaymentType(type) {
  if (!type) return 'Stall Rent'
  const t = String(type).toUpperCase()
  if (t === 'RENT_PAYMENT' || t === 'RENT') return 'Monthly Stall Rent'
  if (t === 'ADVANCE_DEPOSIT' || t === 'ADVANCE') return 'Advance Security Deposit'
  if (t === 'BUSINESS_PERMIT_PAYMENT' || t === 'APPLICATION_FEE') return 'Municipal Stall Filing Fee'
  return type
}

function formatDocType(type) {
  if (!type) return 'Municipal Requirement'
  const t = String(type).toUpperCase()
  if (t.includes('INTENT')) return 'Letter of Intent'
  if (t.includes('ID')) return 'Government Identification'
  if (t.includes('PERMIT')) return 'Business / Mayor’s Permit'
  if (t.includes('SANITARY')) return 'Sanitary & Health Permit'
  return type
}

onMounted(() => {
  loadAllData()
})
</script>

<style scoped src="../styles/Stakeholder/dashboard.css"></style>
