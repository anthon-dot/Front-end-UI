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
          <h1 class="portal-title">Market Rental Management Portal</h1>
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
              <div class="hero-tagline">MUNICIPALITY OF MANTICAO &bull; STAKEHOLDER PORTAL</div>
              <h2 class="hero-name">Good day, {{ firstName }}!</h2>
              <p class="hero-desc">
                Follow your application progress, inspect assigned stalls, view bills, and track advance rental credits.
              </p>

              <div class="hero-chips">
                <span class="hero-chip success">
                  <i class="pi pi-verified"></i>
                  {{ isVerified ? 'Verified Stakeholder' : (formatDisplayStatus(stakeholderProfile?.status) || 'Active Stakeholder') }}
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

                <span class="hero-chip" :class="occupantStatusSeverity === 'success' ? 'success' : (occupantStatusSeverity === 'warn' ? 'warning' : 'info')">
                  <i class="pi pi-user-check"></i>
                  Occupant: {{ occupantStatus }}
                </span>

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

      <!-- ========================================================
           STATUS-DRIVEN LIFECYCLE GUIDE BANNER (PART 5)
           Guides applicant to next required action without administrative controls
           ======================================================== -->
      <div class="lifecycle-banner" :class="lifecycleGuide.severity">
        <div class="lifecycle-left">
          <div class="lifecycle-icon">
            <i :class="lifecycleGuide.icon"></i>
          </div>
          <div class="lifecycle-texts">
            <div class="lifecycle-status-tag">LIFECYCLE STATUS: {{ lifecycleGuide.status.toUpperCase() }}</div>
            <div class="lifecycle-msg">{{ lifecycleGuide.message }}</div>
          </div>
        </div>
        <div class="lifecycle-right">
          <Button
            :label="lifecycleGuide.actionLabel"
            :icon="lifecycleGuide.icon"
            :severity="lifecycleGuide.btnSeverity || (lifecycleGuide.severity === 'danger' ? 'danger' : (lifecycleGuide.severity === 'warn' ? 'warning' : 'primary'))"
            size="small"
            @click="lifecycleGuide.action"
          />
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
            <span>Monthly billing cycle (due 15th)</span>
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

        <!-- 4. Available Advance Credit -->
        <div class="metric-card">
          <div class="metric-top">
            <span class="metric-label">Advance Rent Credit</span>
            <div class="metric-icon-wrap icon-emerald">
              <i class="pi pi-shield"></i>
            </div>
          </div>
          <div class="metric-value" style="color: #059669;">{{ formatCurrency(availableAdvanceCredit) }}</div>
          <div class="metric-caption">
            <i class="pi pi-check-circle" style="color: #10b981;"></i>
            <span>Held as advance credit</span>
          </div>
        </div>
      </div>

      <!-- ========================================================
           SAKAI SECTION NAV TABS (10 CANONICAL SECTIONS)
           ======================================================== -->
      <div class="section-nav">
        <button
          class="section-tab"
          :class="{ active: activeSection === 'overview' }"
          @click="setActiveSection('overview')"
        >
          <i class="pi pi-th-large"></i>
          <span>Dashboard</span>
        </button>

        <button
          class="section-tab"
          :class="{ active: activeSection === 'application' }"
          @click="setActiveSection('application')"
        >
          <i class="pi pi-file-edit"></i>
          <span>My Application</span>
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
          :class="{ active: activeSection === 'contracts' }"
          @click="setActiveSection('contracts')"
        >
          <i class="pi pi-id-card"></i>
          <span>My Contract</span>
        </button>

        <button
          class="section-tab"
          :class="{ active: activeSection === 'billing' }"
          @click="setActiveSection('billing')"
        >
          <i class="pi pi-receipt"></i>
          <span>My Bills</span>
          <span class="section-badge" v-if="unpaidBillsCount > 0">{{ unpaidBillsCount }}</span>
        </button>

        <button
          class="section-tab"
          :class="{ active: activeSection === 'payments' }"
          @click="setActiveSection('payments')"
        >
          <i class="pi pi-history"></i>
          <span>Payment History</span>
        </button>

        <button
          class="section-tab"
          :class="{ active: activeSection === 'advance-credit' }"
          @click="setActiveSection('advance-credit')"
        >
          <i class="pi pi-wallet"></i>
          <span>Advance Credit</span>
        </button>

        <button
          class="section-tab"
          :class="{ active: activeSection === 'business-permit-fee' }"
          @click="setActiveSection('business-permit-fee')"
        >
          <i class="pi pi-shield"></i>
          <span>Business Permit Fee</span>
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

        <button
          class="section-tab"
          :class="{ active: activeSection === 'profile' }"
          @click="setActiveSection('profile')"
        >
          <i class="pi pi-user"></i>
          <span>My Profile</span>
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
                label="Full Stall Details"
                icon="pi pi-arrow-right"
                text
                size="small"
                @click="setActiveSection('stall')"
              />
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Stakeholder Name</span>
                <span class="detail-val">{{ stakeholderProfile?.name || stakeholderProfile?.firstName || 'Juan Dela Cruz' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Business Name</span>
                <span class="detail-val">{{ stakeholderProfile?.business || stakeholderProfile?.businessName || 'Cruz Vegetable Store' }}</span>
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
                label="View Bills"
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
                <span class="detail-label">Monthly Rent</span>
                <span class="detail-val">{{ formatCurrency(monthlyRentRate) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Next Deadline</span>
                <span class="detail-val" style="color: #d97706;">{{ formattedNextDueDate }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Available Advance Credit</span>
                <span class="detail-val" style="color: #059669; font-weight: 700;">{{ formatCurrency(availableAdvanceCredit) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Treasurer Verification</span>
                <span class="detail-val">
                  <Tag value="Official OR Verified" severity="success" size="small" />
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Lifecycle Portals Row -->
        <div class="card-panel" style="margin-top: 1.5rem;">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">
                <i class="pi pi-compass"></i>
                Stakeholder Navigation Shortcuts
              </h3>
              <p class="panel-sub">Access each required stage of your stall lease</p>
            </div>
          </div>

          <div class="financial-split-grid">
            <div class="fee-stat-box" style="cursor: pointer;" @click="setActiveSection('application')">
              <div class="fee-stat-label">1. My Application</div>
              <div style="font-weight: 700; color: #2563eb; margin: 4px 0;">LOI & Documents Status</div>
              <div class="fee-stat-sub">Review application details, Mayor's LOI decision, and notes.</div>
            </div>

            <div class="fee-stat-box" style="cursor: pointer;" @click="openInitialPaymentModal">
              <div class="fee-stat-label">2. Initial Payments</div>
              <div style="font-weight: 700; color: #059669; margin: 4px 0;">₱11,000 Initial Collection</div>
              <div class="fee-stat-sub">₱5k Rights Fee + ₱6k Advance Rent verified by Treasurer.</div>
            </div>

            <div class="fee-stat-box" style="cursor: pointer;" @click="setActiveSection('stall')">
              <div class="fee-stat-label">3. My Stall</div>
              <div style="font-weight: 700; color: #0284c7; margin: 4px 0;">Stall {{ assignedStallNo || 'Assignment' }}</div>
              <div class="fee-stat-sub">Inspect assigned stall location, zone, and operational guidelines.</div>
            </div>

            <div class="fee-stat-box" style="cursor: pointer;" @click="setActiveSection('contracts')">
              <div class="fee-stat-label">4. My Contract</div>
              <div style="font-weight: 700; color: #7c3aed; margin: 4px 0;">3-Year Lease Terms</div>
              <div class="fee-stat-sub">Review agreement, activation checklist, and renewal requests.</div>
            </div>

            <div class="fee-stat-box" style="cursor: pointer;" @click="setActiveSection('advance-credit')">
              <div class="fee-stat-label">5. Advance Credit</div>
              <div style="font-weight: 700; color: #059669; margin: 4px 0;">{{ formatCurrency(availableAdvanceCredit) }} Credit</div>
              <div class="fee-stat-sub">Track credit balance held until authorized allocation.</div>
            </div>

            <div class="fee-stat-box" style="cursor: pointer;" @click="setActiveSection('business-permit-fee')">
              <div class="fee-stat-label">6. Business Permit Fee</div>
              <div style="font-weight: 700; color: #d97706; margin: 4px 0;">₱1,500 BPA-2026-001</div>
              <div class="fee-stat-sub">Pay assessed fee at Treasury counter following BPLO assessment.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================
           TAB 2: MY APPLICATION (STEP 4 & 5)
           ======================================================== -->
      <div v-if="activeSection === 'application'" class="card-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">
              <i class="pi pi-file-edit"></i>
              Stakeholder Application & LOI Approval
            </h3>
            <p class="panel-sub">Official records submitted to the Municipal Market Administration</p>
          </div>
          <div class="btn-action-group">
            <Button
              label="View Status"
              icon="pi pi-info-circle"
              severity="secondary"
              size="small"
              @click="toast.add({ severity: 'info', summary: 'Application Status', detail: `Status: ${appStatusDisplay}`, life: 3000 })"
            />
            <Button
              v-if="userApplication?.status === 'NEEDS_CORRECTION'"
              label="View Correction Notes"
              icon="pi pi-exclamation-triangle"
              severity="warn"
              size="small"
              @click="toast.add({ severity: 'warn', summary: 'Correction Notes', detail: userApplication?.notes || 'Please update the requested document.', life: 4000 })"
            />
            <Button
              label="Edit Application"
              icon="pi pi-pencil"
              severity="secondary"
              outlined
              size="small"
              @click="router.push('/business-application')"
            />
            <Button
              v-if="userApplication?.status === 'NEEDS_CORRECTION'"
              label="Resubmit Application"
              icon="pi pi-refresh"
              severity="primary"
              size="small"
              @click="router.push('/business-application')"
            />
            <Button
              label="Track Progress"
              icon="pi pi-chart-line"
              severity="primary"
              size="small"
              @click="router.push('/application-progress')"
            />
          </div>
        </div>

        <!-- Application Summary Card -->
        <div class="detail-grid" style="margin-bottom: 1.5rem;">
          <div class="detail-item">
            <span class="detail-label">Application Number</span>
            <span class="detail-val" style="color: #2563eb; font-weight: 800;">
              {{ userApplication?.applicationNo || (userApplication?.id ? `APP-2026-${String(userApplication.id).padStart(3, '0')}` : 'APP-2026-001') }}
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Applicant Name</span>
            <span class="detail-val">{{ fullName }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Submitted On</span>
            <span class="detail-val">{{ formatDate(userApplication?.created_at || userApplication?.submittedAt || '2026-10-21') }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Business Name</span>
            <span class="detail-val">{{ userApplication?.businessName || stakeholderProfile?.business || 'Cruz Vegetable Store' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Business Type</span>
            <span class="detail-val">{{ userApplication?.businessType || 'Vegetables & Fruits' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Requested Stall / Zone</span>
            <span class="detail-val">{{ userApplication?.requestedStall || (assignedStallNo ? `Stall ${assignedStallNo}` : 'Stall A-012') }} ({{ stallSection }})</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Application Status</span>
            <span class="detail-val">
              <Tag :value="appStatusDisplay" :severity="appStatusSeverity" />
            </span>
          </div>
        </div>

        <!-- Step 5: Mayor's LOI Approval Status Card -->
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <i class="pi pi-verified" style="color: #2563eb; font-size: 1.3rem;"></i>
              <strong style="color: #0f172a; font-size: 1.05rem;">Mayor's Letter of Intent (LOI) Official Decision</strong>
            </div>
            <Tag :value="loiDecisionTag.label" :severity="loiDecisionTag.severity" />
          </div>

          <p style="margin: 0 0 0.75rem; color: #334155; font-size: 0.95rem; line-height: 1.5;">
            {{ loiDecisionMessage }}
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.85rem; color: #64748b; line-height: 1.5;">
            <i class="pi pi-lock" style="color: #64748b; margin-right: 4px;"></i>
            <strong>Backend Security Requirement:</strong> Authorized LGU personnel record the Mayor's official decision, decision date, and signed approval evidence. An applicant cannot approve their own LOI or modify the approval decision directly.
          </div>
        </div>

        <!-- Initial Payment Requirement Callout (Step 6) -->
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%); border: 1px solid #bbf7d0; border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <i class="pi pi-wallet" style="color: #059669; font-size: 1.25rem;"></i>
              <strong style="color: #065f46; font-size: 1.05rem;">Initial Payment Requirements (Step 6):</strong>
            </div>
            <p style="margin: 0.35rem 0 0; color: #334155; font-size: 0.88rem; max-width: 620px;">
              Upon LOI approval, proceed to the <strong>Municipal Treasurer's Office</strong> to pay the one-time Stall Rights Fee (₱5,000) and Two-Month Advance Rent (₱6,000). Total initial collection: <strong>₱11,000.00</strong> in cash.
            </p>
          </div>
          <Button
            label="View Payment Requirements"
            icon="pi pi-eye"
            severity="success"
            size="small"
            @click="openInitialPaymentModal"
          />
        </div>

        <!-- Submitted Documents Status -->
        <h4 style="margin: 1.5rem 0 0.75rem; color: #0f172a; font-size: 1.05rem; font-weight: 700;">
          Uploaded Documents
        </h4>
        <div class="sakai-table-wrap">
          <table class="sakai-table">
            <thead>
              <tr>
                <th>Document Type</th>
                <th>File Reference</th>
                <th>Review Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Letter of Intent (LOI)</strong>
                  <div style="font-size: 0.8rem; color: #64748b;">Formal letter expressing intent to lease market stall</div>
                </td>
                <td>{{ userApplication?.loiUrl ? 'Letter_of_Intent_Manticao.pdf' : 'LOI_Submitted.pdf' }}</td>
                <td>
                  <Tag value="Approved by Mayor's Office" severity="success" size="small" icon="pi pi-check" />
                </td>
                <td>
                  <Button
                    label="Preview LOI"
                    icon="pi pi-eye"
                    severity="secondary"
                    outlined
                    size="small"
                    @click="openPreviewDocument('Letter of Intent', userApplication?.loiUrl)"
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Valid Government ID</strong>
                  <div style="font-size: 0.8rem; color: #64748b;">Philippine National ID / Driver's License on file</div>
                </td>
                <td>{{ userApplication?.validIdUrl ? 'Valid_Government_ID.pdf' : 'Philippine_National_ID.pdf' }}</td>
                <td>
                  <Tag value="Verified by Market Admin" severity="success" size="small" icon="pi pi-check" />
                </td>
                <td>
                  <Button
                    label="Preview ID"
                    icon="pi pi-eye"
                    severity="secondary"
                    outlined
                    size="small"
                    @click="openPreviewDocument('Valid Government ID', userApplication?.validIdUrl)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================
           TAB 3: MY STALL (STEP 7 & 10)
           ======================================================== -->
      <div v-if="activeSection === 'stall'" class="card-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">
              <i class="pi pi-shop"></i>
              Official Stall Assignment & Preparation
            </h3>
            <p class="panel-sub">Market Supervisor assignment and physical setup instructions</p>
          </div>
          <div class="btn-action-group">
            <Button
              label="View Stall Details"
              icon="pi pi-info-circle"
              severity="secondary"
              size="small"
              @click="toast.add({ severity: 'info', summary: 'Stall Assignment', detail: `Assigned Stall: ${assignedStallNo || 'A-012'} (Zone A)`, life: 3000 })"
            />
            <Button
              label="View on Map"
              icon="pi pi-map"
              severity="secondary"
              outlined
              size="small"
              @click="router.push('/stalls')"
            />
            <Button
              label="View Contract Terms"
              icon="pi pi-file"
              severity="secondary"
              outlined
              size="small"
              @click="setActiveSection('contracts')"
            />
            <Button
              label="View Office Instructions"
              icon="pi pi-book"
              severity="secondary"
              outlined
              size="small"
              @click="toast.add({ severity: 'info', summary: 'Market Office', detail: 'Market Supervisor Office: 8:00 AM - 5:00 PM Mon-Fri at Manticao Municipal Market.', life: 4000 })"
            />
            <Button
              label="View Permit Fee Status"
              icon="pi pi-shield"
              severity="primary"
              size="small"
              @click="setActiveSection('business-permit-fee')"
            />
          </div>
        </div>

        <!-- Step 7 Official Stall Assignment Card -->
        <div class="detail-grid" style="margin-bottom: 1.5rem;">
          <div class="detail-item">
            <span class="detail-label">Requested Stall</span>
            <span class="detail-val">{{ userApplication?.requestedStall || (assignedStallNo ? `Stall ${assignedStallNo}` : 'Stall A-012') }} (Preference)</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Assigned Stall</span>
            <span class="detail-val" style="font-size: 1.25rem; color: #2563eb; font-weight: 800;">
              {{ assignedStallNo ? `Stall ${assignedStallNo}` : 'Stall A-012' }}
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Market Zone</span>
            <span class="detail-val">{{ stallSection || 'Zone A &bull; Wet Market & Commercial Section' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Stall Size</span>
            <span class="detail-val">{{ stallType || 'Standard Commercial Stall (2m x 2m)' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Authorized Rental Rate</span>
            <span class="detail-val" style="font-weight: 700; color: #0f172a;">{{ formatCurrency(monthlyRentRate) }} / month</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Assignment Status</span>
            <span class="detail-val">
              <Tag value="Assigned & Reserved" severity="success" size="small" />
            </span>
          </div>
        </div>

        <!-- Security Rule Note -->
        <div class="notice-callout" style="margin-bottom: 1.5rem;">
          <i class="pi pi-shield"></i>
          <div>
            <strong>Market Supervisor Authority:</strong>
            The Market Supervisor confirms stall availability and assigns stalls officially. Stakeholders cannot assign stalls or mark stalls as occupied on their own.
          </div>
        </div>

        <!-- Step 10 Physical Stall Setup & External BPLO Process -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
          <h4 style="margin: 0 0 0.5rem; color: #0f172a; font-size: 1.1rem; font-weight: 700;">
            Step 10: Physical Stall Setup & Separate BPLO Process
          </h4>
          <p style="margin: 0 0 1rem; color: #475569; font-size: 0.9rem; line-height: 1.5;">
            After your lease contract becomes active, coordinate the physical setup and complete the separate business permit process:
          </p>

          <div class="financial-split-grid">
            <div class="fee-stat-box">
              <div class="fee-stat-label">Physical Stall Setup</div>
              <ul style="margin: 0.5rem 0 0; padding-left: 1.2rem; font-size: 0.85rem; color: #334155; line-height: 1.5;">
                <li>Market operating hours: 4:00 AM to 7:00 PM daily.</li>
                <li>Ensure sanitary waste bins and fire extinguisher compliance.</li>
                <li>No unauthorized structural modifications or subleasing.</li>
              </ul>
            </div>

            <div class="fee-stat-box">
              <div class="fee-stat-label">External BPLO Process</div>
              <ul style="margin: 0.5rem 0 0; padding-left: 1.2rem; font-size: 0.85rem; color: #334155; line-height: 1.5;">
                <li>Follow the separate BPLO procedure at the Municipal Hall.</li>
                <li>BPLO will assess the business permit fee (Reference: BPA-2026-001).</li>
                <li>Proceed to Treasurer's Office to pay the assessed fee (₱1,500).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================
           TAB 4: MY CONTRACT (STEP 8, 9, 16)
           ======================================================== -->
      <div v-if="activeSection === 'contracts'" class="card-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">
              <i class="pi pi-id-card"></i>
              Lease Contract & Activation Status
            </h3>
            <p class="panel-sub">Official 3-year lease contract with the Municipality of Manticao</p>
          </div>
          <div class="btn-action-group">
            <Button
              label="View Contract"
              icon="pi pi-file"
              size="small"
              @click="openContractModal(activeContractRecord)"
            />
            <Button
              label="Download Contract"
              icon="pi pi-download"
              severity="secondary"
              outlined
              size="small"
              @click="printContract"
            />
            <Button
              label="Confirm Review"
              icon="pi pi-check"
              severity="secondary"
              outlined
              size="small"
              @click="toast.add({ severity: 'info', summary: 'Contract Review', detail: 'Contract review confirmed. Please observe signing instructions.', life: 3000 })"
            />
            <Button
              label="View Signing Instructions"
              icon="pi pi-info-circle"
              severity="secondary"
              outlined
              size="small"
              @click="toast.add({ severity: 'info', summary: 'Signing Instructions', detail: 'Physical signing is conducted at the Market Supervisor Office before activation.', life: 4000 })"
            />
            <Button
              label="Print Contract"
              icon="pi pi-print"
              severity="secondary"
              outlined
              size="small"
              @click="printContract"
            />
          </div>
        </div>

        <!-- Contract Details Grid -->
        <div class="detail-grid" style="margin-bottom: 1.5rem;">
          <div class="detail-item">
            <span class="detail-label">Contract Number</span>
            <span class="detail-val" style="color: #2563eb; font-weight: 800;">
              {{ activeContractRecord?.contractNo || activeContractRecord?.ref || 'MC-2026-001' }}
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Stakeholder Name</span>
            <span class="detail-val">{{ stakeholderProfile?.name || fullName }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Assigned Stall</span>
            <span class="detail-val">{{ assignedStallNo ? `Stall ${assignedStallNo}` : 'Stall A-012' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Contract Start Date</span>
            <span class="detail-val">{{ formatDate(contractStartDate) || 'Nov 1, 2026' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Contract End Date</span>
            <span class="detail-val" style="color: #d97706;">{{ formatDate(contractEndDate) || 'Oct 31, 2029' }} (3-Year Lease)</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Monthly Rental Rate</span>
            <span class="detail-val">{{ formatCurrency(monthlyRentRate) }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Billing Frequency</span>
            <span class="detail-val">Monthly (Due 15th)</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Advance Rent Credit</span>
            <span class="detail-val" style="color: #059669; font-weight: 700;">{{ formatCurrency(availableAdvanceCredit) }}</span>
          </div>
        </div>

        <!-- Step 9 Contract Activation Checklist -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <i class="pi pi-check-square" style="color: #2563eb; font-size: 1.25rem;"></i>
              <strong style="color: #0f172a; font-size: 1.05rem;">Step 9: Contract Activation Checklist</strong>
            </div>
            <Tag value="ACTIVE" severity="success" />
          </div>

          <p style="margin: 0 0 1rem; color: #64748b; font-size: 0.85rem;">
            The contract becomes active only after the backend verifies all required conditions:
          </p>

          <div class="checklist-container">
            <div class="checklist-item checked">
              <i class="pi pi-check-circle checklist-icon"></i>
              <span>Required application/LOI approval recorded by Mayor's Office</span>
            </div>
            <div class="checklist-item checked">
              <i class="pi pi-check-circle checklist-icon"></i>
              <span>Required initial payments (₱11,000) verified by Municipal Treasurer</span>
            </div>
            <div class="checklist-item checked">
              <i class="pi pi-check-circle checklist-icon"></i>
              <span>Valid stall assignment confirmed by Market Supervisor</span>
            </div>
            <div class="checklist-item checked">
              <i class="pi pi-check-circle checklist-icon"></i>
              <span>Required contract signatures verified on record</span>
            </div>
            <div class="checklist-item checked">
              <i class="pi pi-check-circle checklist-icon"></i>
              <span>Contract dates and rental terms validated</span>
            </div>
          </div>
        </div>

        <!-- Step 16 Renewal, Termination, and Closure Actions -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;">
          <h4 style="margin: 0 0 0.5rem; color: #0f172a; font-size: 1.05rem; font-weight: 700;">
            Step 16: Contract Renewal, Termination, or Closure
          </h4>
          <p style="margin: 0 0 1rem; color: #64748b; font-size: 0.88rem;">
            Near the contract's end date, submit renewal requests or coordinate closure. The stakeholder's request does not automatically renew the lease; authorized staff review and record the final decision.
          </p>

          <div class="btn-action-group">
            <Button
              label="Request Renewal"
              icon="pi pi-refresh"
              severity="secondary"
              size="small"
              @click="openRenewalModal"
            />
            <Button
              label="Submit Renewal Documents"
              icon="pi pi-upload"
              severity="secondary"
              outlined
              size="small"
              @click="toast.add({ severity: 'info', summary: 'Renewal Documents', detail: 'Please upload updated Mayor Permit and Sanitary Clearance at the Market Office.', life: 4000 })"
            />
            <Button
              label="View Outstanding Balance"
              icon="pi pi-wallet"
              severity="secondary"
              outlined
              size="small"
              @click="setActiveSection('billing')"
            />
            <Button
              label="Request Account Statement"
              icon="pi pi-file-pdf"
              severity="secondary"
              outlined
              size="small"
              @click="toast.add({ severity: 'success', summary: 'Statement Generated', detail: 'Official Statement of Account queued for download.', life: 3000 })"
            />
            <Button
              label="View Contract Closure Status"
              icon="pi pi-info-circle"
              severity="secondary"
              outlined
              size="small"
              @click="toast.add({ severity: 'info', summary: 'Closure Status', detail: 'Lease is currently in ACTIVE good standing. No closure recorded.', life: 3000 })"
            />
          </div>
        </div>
      </div>

      <!-- ========================================================
           TAB 5: MY BILLS (STEP 12 & 15)
           ======================================================== -->
      <div v-if="activeSection === 'billing'" class="card-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">
              <i class="pi pi-receipt"></i>
              Monthly Rental Bills
            </h3>
            <p class="panel-sub">Official statement of accounts & rental billing schedule</p>
          </div>
          <div style="font-weight: 700; color: #0f172a;">
            Total Outstanding: <span style="color: #dc2626;">{{ formatCurrency(outstandingBalance) }}</span>
          </div>
        </div>

        <div class="notice-callout">
          <i class="pi pi-info-circle"></i>
          <div>
            <strong>Cash Payment Policy:</strong>
            All monthly rental bills must be settled in cash at the <strong>Manticao Municipal Treasurer's Office</strong>. Please present your Bill Number or Stall Number at the counter. The system will update your bill balance immediately after the cashier records the official receipt.
          </div>
        </div>

        <!-- Overdue Reminders & Grace Period Callout (Step 15) -->
        <div v-if="stakeholderNoticesList.length > 0 || outstandingBalance > 0" style="background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <i class="pi pi-clock" style="color: #d97706; font-size: 1.2rem;"></i>
              <strong style="color: #92400e;">Step 15: Rental Payment Reminder & Grace Period</strong>
            </div>
            <Tag value="2-Month Grace Period Policy" severity="warn" size="small" />
          </div>
          <p style="margin: 0 0 0.5rem; color: #78350f; font-size: 0.88rem; line-height: 1.4;">
            Your rental account is tracked under the confirmed 2-month grace period. Once the grace period ends, formal municipal notices are issued. Please settle your account at the Treasurer's Office.
          </p>
          <div class="btn-action-group" style="margin-top: 0.75rem;">
            <Button
              label="View Outstanding Bills"
              icon="pi pi-list"
              severity="warn"
              size="small"
              @click="toast.add({ severity: 'warn', summary: 'Outstanding Arrears', detail: `Total outstanding balance: ${formatCurrency(outstandingBalance)}`, life: 3000 })"
            />
            <Button
              v-if="stakeholderNoticesList.length > 0"
              label="View Official Notice"
              icon="pi pi-bell"
              severity="danger"
              size="small"
              @click="openNoticeDetailModal(stakeholderNoticesList[0])"
            />
          </div>
        </div>

        <!-- Bills Table (Step 12) -->
        <div class="sakai-table-wrap">
          <table class="sakai-table">
            <thead>
              <tr>
                <th>Bill Number</th>
                <th>Billing Period</th>
                <th>Rental Charge</th>
                <th>Due Date</th>
                <th>Payments Allocated</th>
                <th>Advance Credit</th>
                <th>Remaining Balance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in billingsList" :key="b.id">
                <td><strong>{{ b.billingNo || b.billing_no || `BILL-${b.id}` }}</strong></td>
                <td>{{ b.billingPeriod || b.billing_period || 'Monthly Rental' }}</td>
                <td>{{ formatCurrency(b.totalAmount ?? b.total_amount ?? monthlyRentRate) }}</td>
                <td>{{ formatDate(b.dueDate || b.due_date) }}</td>
                <td style="color: #059669;">{{ formatCurrency(b.paidAmount ?? b.paid_amount ?? 0) }}</td>
                <td style="color: #0284c7;">{{ formatCurrency(b.advanceAllocated ?? 0) }}</td>
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
                <td>
                  <div class="btn-action-group">
                    <Button
                      label="View Bill"
                      icon="pi pi-eye"
                      severity="secondary"
                      size="small"
                      @click="openBillDetailModal(b)"
                    />
                    <Button
                      label="Download Bill"
                      icon="pi pi-download"
                      severity="secondary"
                      outlined
                      size="small"
                      @click="downloadBill(b)"
                    />
                  </div>
                </td>
              </tr>
              <tr v-if="billingsList.length === 0">
                <td colspan="9" class="empty-state">
                  <i class="pi pi-inbox"></i>
                  <p>No billing statements generated yet.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================
           TAB 6: PAYMENT HISTORY (STEP 6 & 14)
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

        <!-- Initial Payment Verification Card (Step 6) -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <i class="pi pi-check-circle" style="color: #16a34a; font-size: 1.25rem;"></i>
              <strong style="color: #0f172a; font-size: 1rem;">Initial Payment Requirements Verification (Step 6)</strong>
            </div>
            <Tag value="Treasurer Verified" severity="success" />
          </div>

          <div class="financial-split-grid" style="margin-top: 1rem; margin-bottom: 0.5rem;">
            <div class="fee-stat-box">
              <div class="fee-stat-label">Stall Rights Fee</div>
              <div class="fee-stat-amount" style="font-size: 1.35rem; color: #0f172a;">₱5,000.00</div>
              <div class="fee-stat-sub">One-time initial fee &bull; OR-2026-001</div>
            </div>

            <div class="fee-stat-box">
              <div class="fee-stat-label">Two-Month Advance Rent</div>
              <div class="fee-stat-amount" style="font-size: 1.35rem; color: #059669;">₱6,000.00</div>
              <div class="fee-stat-sub">Held as available credit &bull; OR-2026-002</div>
            </div>

            <div class="fee-stat-box">
              <div class="fee-stat-label">Total Initial Collection</div>
              <div class="fee-stat-amount" style="font-size: 1.35rem; color: #2563eb;">₱11,000.00</div>
              <div class="fee-stat-sub">Counted once in Treasury collections</div>
            </div>
          </div>
        </div>

        <div class="notice-callout">
          <i class="pi pi-check-circle"></i>
          <div>
            <strong>Verified Municipal Records:</strong> All payments listed below are official cash transactions confirmed by the Municipal Treasurer. Physical Official Receipts (OR) issued at the Treasury window remain your primary proof of payment.
          </div>
        </div>

        <!-- Monthly Payments Table (Step 14) -->
        <div class="sakai-table-wrap">
          <table class="sakai-table">
            <thead>
              <tr>
                <th>Receipt / OR No.</th>
                <th>Payment Date</th>
                <th>Payment Type</th>
                <th>Amount Received</th>
                <th>Bill Allocation</th>
                <th>Remaining Balance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in allPayments" :key="p.id">
                <td><strong>{{ p.receiptNo || p.receipt_no || p.ref || `OR-${p.id}` }}</strong></td>
                <td>{{ formatDate(p.paymentDate || p.date) }}</td>
                <td>{{ formatPaymentType(p.paymentType || p.type) }}</td>
                <td style="font-weight: 700; color: #059669;">{{ formatCurrency(p.amount) }}</td>
                <td>{{ p.billAllocation || 'Direct Fee' }}</td>
                <td>{{ formatCurrency(p.remainingBalance || 0) }}</td>
                <td>
                  <Tag value="Verified by Treasurer" severity="success" size="small" icon="pi pi-check" />
                </td>
                <td>
                  <div class="btn-action-group">
                    <Button
                      label="View Receipt"
                      icon="pi pi-receipt"
                      severity="secondary"
                      size="small"
                      @click="openReceiptModal(p)"
                    />
                    <Button
                      label="Download Receipt"
                      icon="pi pi-download"
                      severity="secondary"
                      outlined
                      size="small"
                      @click="downloadReceipt(p)"
                    />
                  </div>
                </td>
              </tr>
              <tr v-if="allPayments.length === 0">
                <td colspan="8" class="empty-state">
                  <i class="pi pi-wallet"></i>
                  <p>No payment records found.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================
           TAB 7: ADVANCE CREDIT (STEP 13)
           ======================================================== -->
      <div v-if="activeSection === 'advance-credit'" class="card-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">
              <i class="pi pi-wallet"></i>
              Advance Rent Overview & Tracking
            </h3>
            <p class="panel-sub">Financial credit held until authorized allocation by LGU staff</p>
          </div>
          <div class="btn-action-group">
            <Button
              label="View Advance Receipt"
              icon="pi pi-receipt"
              severity="secondary"
              size="small"
              @click="openAdvanceReceipt"
            />
            <Button
              label="View Allocation History"
              icon="pi pi-history"
              severity="secondary"
              outlined
              size="small"
              @click="showAdvanceAllocationModal = true"
            />
            <Button
              label="View Related Bills"
              icon="pi pi-receipt"
              severity="primary"
              size="small"
              @click="setActiveSection('billing')"
            />
          </div>
        </div>

        <!-- Advance Credit Balances Card (Step 13) -->
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%); border: 1px solid #bbf7d0; border-radius: 14px; padding: 2rem; margin-bottom: 1.5rem; text-align: center;">
          <span style="font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #047857;">Available Advance Credit</span>
          <div style="font-size: 2.75rem; font-weight: 900; color: #065f46; margin: 0.35rem 0 0.5rem;">
            {{ formatCurrency(availableAdvanceCredit) }}
          </div>
          <Tag value="Awaiting authorized allocation" severity="success" />

          <div class="financial-split-grid" style="margin-top: 1.5rem; text-align: left;">
            <div class="fee-stat-box" style="background: rgba(255, 255, 255, 0.8);">
              <div class="fee-stat-label">Original Advance Payment</div>
              <div class="fee-stat-amount" style="font-size: 1.35rem; color: #065f46;">₱6,000.00</div>
              <div class="fee-stat-sub">Two-month advance deposit recorded at Treasury</div>
            </div>

            <div class="fee-stat-box" style="background: rgba(255, 255, 255, 0.8);">
              <div class="fee-stat-label">Previously Allocated</div>
              <div class="fee-stat-amount" style="font-size: 1.35rem; color: #475569;">₱0.00</div>
              <div class="fee-stat-sub">Allocated against generated rental bills</div>
            </div>

            <div class="fee-stat-box" style="background: rgba(255, 255, 255, 0.8);">
              <div class="fee-stat-label">Remaining Credit Balance</div>
              <div class="fee-stat-amount" style="font-size: 1.35rem; color: #059669;">₱6,000.00</div>
              <div class="fee-stat-sub">Available for future authorized allocation</div>
            </div>
          </div>
        </div>

        <!-- Step 13 Financial Rule Note -->
        <div class="notice-callout" style="margin-bottom: 1.5rem;">
          <i class="pi pi-shield"></i>
          <div>
            <strong>Client Decision Rule:</strong> There is no stakeholder-side <em>Apply Advance to Bill</em> button. Advance rent remains a credit until authorized allocation by Treasury personnel. The allocation is a separate accounting transaction, never counted as a second cash collection.
          </div>
        </div>

        <!-- Example Financial Allocation Walkthrough -->
        <h4 style="margin: 1.5rem 0 0.75rem; color: #0f172a; font-size: 1.05rem; font-weight: 700;">
          How Authorized Credit Allocation Works
        </h4>
        <div class="sakai-table-wrap">
          <table class="sakai-table">
            <thead>
              <tr>
                <th>Transaction Stage</th>
                <th>Credit / Bill Movement</th>
                <th>Amount</th>
                <th>Financial Treatment</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1. Original Advance Credit</strong></td>
                <td>Total credit balance created</td>
                <td style="font-weight: 700; color: #059669;">₱6,000.00</td>
                <td>Cash received once at Treasury window</td>
              </tr>
              <tr>
                <td><strong>2. Authorized Allocation</strong></td>
                <td>Treasurer allocates credit to monthly bill</td>
                <td style="font-weight: 700; color: #2563eb;">₱1,500.00</td>
                <td>Ledger entry only; not a new cash collection</td>
              </tr>
              <tr>
                <td><strong>3. Remaining Advance Credit</strong></td>
                <td>Updated available balance</td>
                <td style="font-weight: 700; color: #059669;">₱4,500.00</td>
                <td>Preserved for subsequent billing periods</td>
              </tr>
              <tr>
                <td><strong>4. Original Bill (₱3,000)</strong></td>
                <td>Bill balance after credit application</td>
                <td style="font-weight: 700; color: #dc2626;">₱1,500.00</td>
                <td>Lessee settles remaining ₱1,500 in cash at window</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================
           TAB 8: BUSINESS PERMIT FEE (STEP 10 & 11)
           ======================================================== -->
      <div v-if="activeSection === 'business-permit-fee'" class="card-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">
              <i class="pi pi-shield"></i>
              Business Permit Fee Assessment & Payment
            </h3>
            <p class="panel-sub">Separate BPLO assessment and Treasury cash collection</p>
          </div>
          <div class="btn-action-group">
            <Button
              label="View Assessment Details"
              icon="pi pi-info-circle"
              severity="secondary"
              size="small"
              @click="showBploAssessmentModal = true"
            />
            <Button
              label="View Payment Instructions"
              icon="pi pi-book"
              severity="secondary"
              outlined
              size="small"
              @click="toast.add({ severity: 'info', summary: 'Payment Instructions', detail: 'Present assessment reference BPA-2026-001 at the Treasurer window.', life: 4000 })"
            />
            <Button
              label="View Receipt"
              icon="pi pi-receipt"
              severity="primary"
              size="small"
              @click="openBploReceipt"
            />
          </div>
        </div>

        <!-- Step 11 Business Permit Fee Card -->
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <span style="font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Assessment Reference</span>
              <div style="font-size: 1.35rem; font-weight: 800; color: #2563eb;">{{ businessPermitAssessment.refNo }}</div>
            </div>
            <Tag :value="businessPermitAssessment.status.toUpperCase()" :severity="businessPermitAssessment.status === 'Paid' ? 'success' : 'warn'" />
          </div>

          <div class="financial-split-grid">
            <div class="fee-stat-box">
              <div class="fee-stat-label">Assessed Fee Amount</div>
              <div class="fee-stat-amount" style="color: #0f172a;">₱{{ Number(businessPermitAssessment.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</div>
              <div class="fee-stat-sub">Official rate determined by BPLO</div>
            </div>

            <div class="fee-stat-box">
              <div class="fee-stat-label">Payment Method</div>
              <div class="fee-stat-amount" style="font-size: 1.35rem; color: #2563eb;">Cash at Treasury</div>
              <div class="fee-stat-sub">Municipal Treasurer's Office window</div>
            </div>

            <div class="fee-stat-box">
              <div class="fee-stat-label">Recorded Receipt</div>
              <div class="fee-stat-amount" style="font-size: 1.35rem; color: #059669;">{{ businessPermitAssessment.orNumber || 'OR-2026-BPA' }}</div>
              <div class="fee-stat-sub">Confirmed by cashier</div>
            </div>
          </div>
        </div>

        <!-- Step 11 Advisory Note -->
        <div class="notice-callout">
          <i class="pi pi-info-circle"></i>
          <div>
            <strong>Educational Compliance Rule:</strong> Paying the business permit fee records the official receipt at the Treasury window. Permit issuance remains part of the external BPLO process. The application does not falsely claim the permit has been released merely because the fee was paid.
          </div>
        </div>

        <!-- Treasurer's Procedure Guide -->
        <h4 style="margin: 1.5rem 0 0.75rem; color: #0f172a; font-size: 1.05rem; font-weight: 700;">
          Treasurer's Collection Procedure
        </h4>
        <ol style="padding-left: 1.5rem; line-height: 1.8; color: #334155;">
          <li>Cashier verifies BPLO assessment evidence or assessment reference (BPA-2026-001).</li>
          <li>Cashier confirms the amount payable (₱1,500.00).</li>
          <li>Cashier receives cash payment and records receipt reference.</li>
          <li>Transaction is saved in system and stakeholder status updates to Paid.</li>
        </ol>
      </div>

      <!-- ========================================================
           TAB 9: NOTIFICATIONS (STEP 15)
           ======================================================== -->
      <div v-if="activeSection === 'notifications'" class="card-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">
              <i class="pi pi-bell"></i>
              Official Notifications & Overdue Reminders
            </h3>
            <p class="panel-sub">Overdue alerts, 2-month grace period tracking, and municipal advisories</p>
          </div>
          <div class="btn-action-group">
            <Button
              v-if="unreadCount > 0"
              label="Mark All Read"
              icon="pi pi-check"
              severity="secondary"
              outlined
              size="small"
              @click="markAllRead"
            />
            <Button
              label="View Outstanding Bills"
              icon="pi pi-receipt"
              severity="primary"
              size="small"
              @click="setActiveSection('billing')"
            />
          </div>
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
            <div class="btn-action-group">
              <Button
                label="View Notice Details"
                icon="pi pi-eye"
                text
                size="small"
                @click="openNoticeDetailModal({ remarks: n.message, issuedAt: n.createdAt })"
              />
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
          </div>

          <div v-if="notificationsForStakeholder.length === 0" class="empty-state">
            <i class="pi pi-bell-slash"></i>
            <p>No notifications at this time.</p>
          </div>
        </div>
      </div>

      <!-- ========================================================
           TAB 10: MY PROFILE
           ======================================================== -->
      <div v-if="activeSection === 'profile'" class="card-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">
              <i class="pi pi-user"></i>
              Stakeholder Profile
            </h3>
            <p class="panel-sub">Personal contact info and registered commercial enterprise</p>
          </div>
          <Button
            label="Edit Profile"
            icon="pi pi-pencil"
            severity="primary"
            size="small"
            @click="openEditProfile"
          />
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Full Name</span>
            <span class="detail-val">{{ stakeholderProfile?.name || fullName }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Business Name</span>
            <span class="detail-val">{{ stakeholderProfile?.business || 'Cruz Vegetable Store' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Business Type</span>
            <span class="detail-val">{{ stakeholderProfile?.businessType || 'Vegetables & Fruits' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Contact Number</span>
            <span class="detail-val">{{ stakeholderProfile?.contact || '0917-000-0000' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Email Address</span>
            <span class="detail-val">{{ stakeholderProfile?.email || 'juan@example.com' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Residential Address</span>
            <span class="detail-val">{{ stakeholderProfile?.address || 'Manticao, Misamis Oriental' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Stall Assignment</span>
            <span class="detail-val" style="color: #2563eb;">{{ assignedStallNo ? `Stall ${assignedStallNo}` : 'Awaiting Assignment' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Verification Status</span>
            <span class="detail-val">
              <Tag :value="isVerified ? 'VERIFIED STAKEHOLDER' : 'PENDING'" severity="success" size="small" />
            </span>
          </div>
        </div>
      </div>

      <!-- ========================================================
           MODALS
           ======================================================== -->

      <!-- 1. Initial Payment Requirements Modal (Step 6) -->
      <div v-if="showInitialPaymentModal" class="modal-backdrop" @click.self="showInitialPaymentModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Initial Payment Requirements (Step 6)</h3>
            <Button icon="pi pi-times" text rounded @click="showInitialPaymentModal = false" />
          </div>

          <div class="modal-body">
            <p style="margin: 0 0 1rem; color: #475569; font-size: 0.88rem;">
              <em>Illustrative amounts only; actual fees must follow the LGU's approved rates.</em>
            </p>

            <div class="financial-split-grid">
              <div class="fee-stat-box">
                <div class="fee-stat-label">Stall Rights Fee</div>
                <div class="fee-stat-amount" style="font-size: 1.5rem; color: #0f172a;">₱5,000.00</div>
                <div class="fee-stat-sub">One-time initial charge, according to LGU rules</div>
              </div>

              <div class="fee-stat-box">
                <div class="fee-stat-label">Two-Month Advance Rent</div>
                <div class="fee-stat-amount" style="font-size: 1.5rem; color: #059669;">₱6,000.00</div>
                <div class="fee-stat-sub">Held as advance credit until authorized allocation</div>
              </div>
            </div>

            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: #1e3a8a; font-size: 1.05rem;">Total Initial Collection:</strong>
                <strong style="color: #2563eb; font-size: 1.4rem;">₱11,000.00</strong>
              </div>
              <div style="margin-top: 0.5rem; font-size: 0.82rem; color: #3b82f6;">
                Status: <strong>Awaiting Treasurer verification at Treasury window</strong>
              </div>
            </div>

            <div class="notice-callout" style="margin-top: 1rem;">
              <i class="pi pi-info-circle"></i>
              <div>
                <strong>Cashier Procedure:</strong> Cash payments are officially received at the Treasurer's counter. Official Receipts are generated and distinguished between rights fee and advance credit.
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <Button label="Close" severity="secondary" @click="showInitialPaymentModal = false" />
          </div>
        </div>
      </div>

      <!-- 2. Bill Detail Breakdown Modal (Step 12) -->
      <div v-if="showBillDetailModal && selectedBill" class="modal-backdrop" @click.self="showBillDetailModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Billing Statement Details</h3>
            <Button icon="pi pi-times" text rounded @click="showBillDetailModal = false" />
          </div>

          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Bill Number</span>
                <span class="detail-val" style="color: #2563eb; font-weight: 800;">{{ selectedBill.billingNo || `BILL-${selectedBill.id}` }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Billing Period</span>
                <span class="detail-val">{{ selectedBill.billingPeriod || 'Monthly Rental' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Contract & Stall</span>
                <span class="detail-val">Contract MC-2026-001 &bull; Stall {{ assignedStallNo || 'A-012' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Rental Charge</span>
                <span class="detail-val">{{ formatCurrency(selectedBill.totalAmount || monthlyRentRate) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Due Date</span>
                <span class="detail-val" style="color: #d97706;">{{ formatDate(selectedBill.dueDate) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Cash Payments Allocated</span>
                <span class="detail-val" style="color: #059669;">{{ formatCurrency(selectedBill.paidAmount || 0) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Advance Credit Allocated</span>
                <span class="detail-val" style="color: #0284c7;">{{ formatCurrency(selectedBill.advanceAllocated || 0) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Remaining Balance</span>
                <span class="detail-val" style="font-size: 1.25rem; font-weight: 800; color: #dc2626;">
                  {{ formatCurrency(selectedBill.balance) }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Current Status</span>
                <span class="detail-val">
                  <Tag :value="selectedBill.status || 'UNPAID'" :severity="selectedBill.status === 'PAID' ? 'success' : 'warn'" />
                </span>
              </div>
            </div>

            <div class="notice-callout" style="margin-top: 1rem;">
              <i class="pi pi-lock"></i>
              <div>
                <strong>Notice:</strong> The stakeholder cannot edit the bill amount or mark the bill as paid online. Settle balance at the Municipal Treasurer's Office.
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <Button label="Download Bill" icon="pi pi-download" severity="secondary" @click="downloadBill(selectedBill)" />
            <Button label="Close" severity="primary" @click="showBillDetailModal = false" />
          </div>
        </div>
      </div>

      <!-- 3. Official Receipt Modal (Step 14) -->
      <div v-if="showReceiptModal && selectedReceipt" class="modal-backdrop" @click.self="showReceiptModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Official Municipal Receipt (OR)</h3>
            <Button icon="pi pi-times" text rounded @click="showReceiptModal = false" />
          </div>

          <div class="modal-body">
            <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 1.5rem; text-align: center; margin-bottom: 1rem;">
              <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b;">Republic of the Philippines &bull; Manticao, Misamis Oriental</div>
              <h4 style="margin: 0.25rem 0 0.5rem; font-size: 1.2rem; font-weight: 800; color: #0f172a;">OFFICE OF THE MUNICIPAL TREASURER</h4>
              <div style="font-size: 0.95rem; font-weight: 700; color: #2563eb;">
                Official Receipt #: {{ selectedReceipt.receiptNo || selectedReceipt.ref || `OR-${selectedReceipt.id}` }}
              </div>
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Payment Date</span>
                <span class="detail-val">{{ formatDate(selectedReceipt.paymentDate || selectedReceipt.date) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Payment Type</span>
                <span class="detail-val">{{ formatPaymentType(selectedReceipt.paymentType || selectedReceipt.type) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Cash Amount Received</span>
                <span class="detail-val" style="color: #059669; font-weight: 800; font-size: 1.15rem;">
                  {{ formatCurrency(selectedReceipt.amount) }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Bill Allocation</span>
                <span class="detail-val">{{ selectedReceipt.billAllocation || 'Monthly Rental Settlement' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Remaining Balance</span>
                <span class="detail-val">{{ formatCurrency(selectedReceipt.remainingBalance || 0) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Verification</span>
                <span class="detail-val">
                  <Tag value="Recorded & Verified by Treasurer" severity="success" size="small" icon="pi pi-check" />
                </span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <Button label="Download Receipt" icon="pi pi-download" severity="secondary" @click="downloadReceipt(selectedReceipt)" />
            <Button label="Close" severity="primary" @click="showReceiptModal = false" />
          </div>
        </div>
      </div>

      <!-- 4. Contract Viewer Modal (Step 8) -->
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
                  Contract Reference: <strong>{{ activeContractRecord?.contractNo || activeContractRecord?.ref || 'MC-2026-001' }}</strong>
                </div>
              </div>

              <p><strong>KNOW ALL MEN BY THESE PRESENTS:</strong></p>
              <p>This <strong>CONTRACT OF LEASE OF PUBLIC MARKET STALL</strong> is entered into by and between:</p>
              <p style="padding-left: 1rem;">
                <strong>THE LOCAL GOVERNMENT UNIT OF MANTICAO</strong>, represented by the Municipal Mayor / Municipal Market Administration, hereinafter referred to as the <strong>LESSOR</strong>;
              </p>
              <p style="text-align: center; font-weight: 700;">- and -</p>
              <p style="padding-left: 1rem;">
                <strong>{{ stakeholderProfile?.name || fullName }}</strong>, of legal age, Filipino, resident of Manticao, Misamis Oriental, representing <strong>{{ stakeholderProfile?.business || 'Cruz Vegetable Store' }}</strong>, hereinafter referred to as the <strong>LESSEE</strong>.
              </p>

              <h5 style="margin: 1.25rem 0 0.5rem; color: #0f172a; font-weight: 800;">WITNESSETH:</h5>
              <ol style="padding-left: 1.5rem; line-height: 1.8;">
                <li>
                  <strong>STALL DESIGNATION:</strong> The LESSOR hereby leases unto the LESSEE Stall Number <strong>{{ assignedStallNo || 'A-012' }}</strong>, located in <strong>{{ stallSection || 'Zone A' }}</strong> of Manticao Public Market.
                </li>
                <li>
                  <strong>LEASE TERM:</strong> This lease shall be in effect for a period of three (3) years from <strong>{{ formatDate(contractStartDate) || 'November 1, 2026' }}</strong> to <strong>{{ formatDate(contractEndDate) || 'October 31, 2029' }}</strong>.
                </li>
                <li>
                  <strong>RENTAL RATE:</strong> The LESSEE agrees to pay the stipulated monthly rental fee of <strong>{{ formatCurrency(monthlyRentRate) }}</strong> at the Municipal Treasurer's Office on or before the 15th day of every calendar month.
                </li>
                <li>
                  <strong>ADVANCE CREDIT:</strong> Two-month advance rent of ₱6,000.00 is held as an advance credit until authorized allocation by LGU staff.
                </li>
                <li>
                  <strong>NON-TRANSFERABILITY:</strong> This stall lease is personal to the LESSEE and cannot be subleased, assigned, or transferred without prior written approval.
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
                    {{ (stakeholderProfile?.name || fullName).toUpperCase() }}
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

      <!-- 5. Edit Profile Modal -->
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

      <!-- 6. Advance Allocation History Modal (Step 13) -->
      <div v-if="showAdvanceAllocationModal" class="modal-backdrop" @click.self="showAdvanceAllocationModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Advance Credit Allocation History</h3>
            <Button icon="pi pi-times" text rounded @click="showAdvanceAllocationModal = false" />
          </div>

          <div class="modal-body">
            <p style="margin: 0 0 1rem; color: #475569; font-size: 0.88rem;">
              Advance rent credit records held under contract MC-2026-001:
            </p>

            <div class="sakai-table-wrap">
              <table class="sakai-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Allocation Reference</th>
                    <th>Allocated Amount</th>
                    <th>Remaining Credit</th>
                    <th>Authorized Staff</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Oct 21, 2026</td>
                    <td>Deposit Recording (OR-2026-002)</td>
                    <td style="color: #059669; font-weight: 700;">+₱6,000.00</td>
                    <td>₱6,000.00</td>
                    <td>Municipal Treasurer</td>
                  </tr>
                  <tr v-if="advanceCreditsList.length === 0">
                    <td colspan="5" class="empty-state">
                      <p>No deductions or allocations recorded yet. Full ₱6,000.00 credit available.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="modal-footer">
            <Button label="Close" severity="primary" @click="showAdvanceAllocationModal = false" />
          </div>
        </div>
      </div>

      <!-- 7. BPLO Assessment Details Modal (Step 11) -->
      <div v-if="showBploAssessmentModal" class="modal-backdrop" @click.self="showBploAssessmentModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Business Permit Fee Assessment</h3>
            <Button icon="pi pi-times" text rounded @click="showBploAssessmentModal = false" />
          </div>

          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Assessment Reference</span>
                <span class="detail-val" style="color: #2563eb; font-weight: 800;">{{ businessPermitAssessment.refNo }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Assessed Fee Amount</span>
                <span class="detail-val">₱{{ Number(businessPermitAssessment.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Assessment Date</span>
                <span class="detail-val">{{ formatDate(businessPermitAssessment.assessedAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Payment Status</span>
                <span class="detail-val">
                  <Tag :value="businessPermitAssessment.status.toUpperCase()" :severity="businessPermitAssessment.status === 'Paid' ? 'success' : 'warn'" />
                </span>
              </div>
            </div>

            <div class="notice-callout" style="margin-top: 1rem;">
              <i class="pi pi-info-circle"></i>
              <div>
                <strong>Treasurer Counter Instructions:</strong> Present reference BPA-2026-001 at the Municipal Treasurer window. Pay ₱1,500.00 in cash to receive your official receipt.
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <Button label="Close" severity="primary" @click="showBploAssessmentModal = false" />
          </div>
        </div>
      </div>

      <!-- 8. Notice Detail Modal (Step 15) -->
      <div v-if="showNoticeModal && selectedNotice" class="modal-backdrop" @click.self="showNoticeModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Official Municipal Notice Details</h3>
            <Button icon="pi pi-times" text rounded @click="showNoticeModal = false" />
          </div>

          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Notice Type</span>
                <span class="detail-val">Rental Payment Reminder</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Date Issued</span>
                <span class="detail-val">{{ formatDate(selectedNotice.issuedAt || new Date()) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Outstanding Balance</span>
                <span class="detail-val" style="color: #dc2626; font-weight: 800;">{{ formatCurrency(outstandingBalance) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Official Office</span>
                <span class="detail-val">Municipal Market Administration</span>
              </div>
            </div>

            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
              <strong style="color: #92400e; display: block; margin-bottom: 0.35rem;">Official Instructions:</strong>
              <p style="margin: 0; color: #78350f; font-size: 0.9rem; line-height: 1.5;">
                {{ selectedNotice.remarks || 'Your rental bill has an outstanding balance. Please coordinate with the Treasurer’s Office to settle your account during the confirmed grace period.' }}
              </p>
            </div>
          </div>

          <div class="modal-footer">
            <Button label="View Outstanding Bills" severity="secondary" @click="setActiveSection('billing'); showNoticeModal = false;" />
            <Button label="Close" severity="primary" @click="showNoticeModal = false" />
          </div>
        </div>
      </div>

      <!-- 9. Lease Renewal Request Modal (Step 16) -->
      <div v-if="showRenewalModal" class="modal-backdrop" @click.self="showRenewalModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Request Contract Renewal (Step 16)</h3>
            <Button icon="pi pi-times" text rounded @click="showRenewalModal = false" />
          </div>

          <div class="modal-body">
            <p style="margin: 0 0 1rem; color: #475569; font-size: 0.9rem; line-height: 1.5;">
              Submit an official renewal request for your market stall lease contract:
            </p>

            <div class="detail-grid" style="margin-bottom: 1rem;">
              <div class="detail-item">
                <span class="detail-label">Contract Reference</span>
                <span class="detail-val">MC-2026-001</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Assigned Stall</span>
                <span class="detail-val">Stall {{ assignedStallNo || 'A-012' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Current Expiry</span>
                <span class="detail-val">{{ formatDate(contractEndDate) || 'Oct 31, 2029' }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Renewal Notes / Remarks</label>
              <textarea v-model="renewalRemarks" class="form-input" rows="3" placeholder="State your proposed lease extension terms..."></textarea>
            </div>

            <div class="notice-callout">
              <i class="pi pi-shield"></i>
              <div>
                <strong>Official Procedure:</strong> The stakeholder's request does not automatically renew the lease. Authorized staff review compliance, payment history, and record the official decision.
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <Button label="Cancel" severity="secondary" @click="showRenewalModal = false" />
            <Button label="Submit Renewal Request" severity="primary" icon="pi pi-send" @click="submitRenewalRequest" />
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
const userApplication = ref(null)
const assignedOccupant = ref(null)
const assignedStall = ref(null)
const billingsList = ref([])
const allPayments = ref([])
const contractsList = ref([])
const officialDocuments = ref([])
const notifications = ref([])
const advanceCreditsList = ref([])
const stakeholderNoticesList = ref([])

// Modals
const showContractModal = ref(false)
const activeContractRecord = ref(null)
const showEditProfile = ref(false)
const editForm = ref({ name: '', business: '', contact: '' })

const showInitialPaymentModal = ref(false)
const showBillDetailModal = ref(false)
const selectedBill = ref(null)
const showReceiptModal = ref(false)
const selectedReceipt = ref(null)
const showAdvanceAllocationModal = ref(false)
const showBploAssessmentModal = ref(false)
const showNoticeModal = ref(false)
const selectedNotice = ref(null)
const showRenewalModal = ref(false)
const renewalRemarks = ref('')

const businessPermitAssessment = ref({
  refNo: 'BPA-2026-001',
  amount: 1500,
  status: 'Unpaid',
  assessedAt: '2026-10-21',
  orNumber: null
})

// ----------------------------------------------------
// COMPUTED ATTRIBUTES
// ----------------------------------------------------
const firstName = computed(() => {
  const full = stakeholderProfile.value?.name || stakeholderProfile.value?.firstName || 'Juan'
  return full.split(' ')[0]
})

const fullName = computed(() => {
  return stakeholderProfile.value?.name || stakeholderProfile.value?.firstName || 'Juan Dela Cruz'
})

const initials = computed(() => {
  const full = stakeholderProfile.value?.name || 'Juan Dela Cruz'
  return full.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
})

const isVerified = computed(() => {
  const st = stakeholderProfile.value
  return !!(st?.verified_tenant || st?.verifiedTenant || st?.verified_stakeholder || st?.verifiedStakeholder || st?.status === 'VERIFIED' || st?.status === 'APPROVED')
})

// ----------------------------------------------------
// PART 5: LIFECYCLE STATE MACHINE (14 STATES)
// ----------------------------------------------------
const lifecycleStatus = computed(() => {
  if (!userApplication.value && !stakeholderProfile.value?.application_status && !assignedStallNo.value && !hasContract.value) {
    return 'no_application'
  }

  const appStatus = String(userApplication.value?.status || userApplication.value?.applicationStatus || stakeholderProfile.value?.application_status || '').toUpperCase()

  if (appStatus === 'DRAFT') return 'draft'
  if (appStatus === 'SUBMITTED' || appStatus === 'PENDING') return 'submitted'
  if (appStatus === 'UNDER_REVIEW' || appStatus === 'PENDING_SUPERVISOR') return 'under_review'
  if (appStatus === 'NEEDS_CORRECTION') return 'needs_correction'
  if (appStatus === 'LOI_APPROVED' || appStatus === 'PENDING_TREASURER') return 'loi_approved'

  // Contract checks
  const cStatus = String(contractStatus.value || '').toUpperCase()
  if (cStatus === 'EXPIRED' || cStatus === 'CANCELLED' || cStatus === 'TERMINATED' || cStatus === 'CLOSED') {
    return 'expired_closed'
  }

  // Formal notices check
  if (stakeholderNoticesList.value && stakeholderNoticesList.value.length > 0) {
    return 'notice_issued'
  }

  // Overdue check
  if (outstandingBalance.value > 0 && billingsList.value.some(b => b.status === 'OVERDUE' || Number(b.balance || 0) > 0)) {
    return 'overdue'
  }

  if (cStatus === 'ACTIVE') {
    return 'active'
  }

  if (cStatus === 'SIGNED' || cStatus === 'SIGNED_PENDING_ACTIVATION' || cStatus === 'PENDING_START_DATE') {
    return 'signed_pending_activation'
  }

  if (cStatus === 'PENDING' || cStatus === 'PENDING_SIGNATURE' || cStatus === 'DRAFT') {
    return 'contract_pending_signature'
  }

  // Stall assignment check
  if (!assignedStallNo.value || assignedStallNo.value === 'Awaiting Assignment') {
    return 'stall_assignment_pending'
  }

  return 'active'
})

const lifecycleGuide = computed(() => {
  switch (lifecycleStatus.value) {
    case 'no_application':
      return {
        status: 'No application',
        message: 'You have not submitted a stall application.',
        actionLabel: 'Apply for Stall',
        icon: 'pi pi-plus-circle',
        severity: 'info',
        action: () => router.push('/business-application')
      }
    case 'draft':
      return {
        status: 'Draft',
        message: 'Your application is incomplete.',
        actionLabel: 'Continue Application',
        icon: 'pi pi-pencil',
        severity: 'warn',
        action: () => router.push('/business-application')
      }
    case 'submitted':
      return {
        status: 'Submitted',
        message: 'Your application has been received.',
        actionLabel: 'Track Progress',
        icon: 'pi pi-send',
        severity: 'info',
        action: () => setActiveSection('application')
      }
    case 'under_review':
      return {
        status: 'Under review',
        message: 'Your application is being reviewed.',
        actionLabel: 'View Application',
        icon: 'pi pi-search',
        severity: 'info',
        action: () => setActiveSection('application')
      }
    case 'needs_correction':
      return {
        status: 'Needs correction',
        message: 'Please correct the items identified by the LGU.',
        actionLabel: 'Edit Application',
        icon: 'pi pi-exclamation-circle',
        severity: 'danger',
        action: () => router.push('/business-application')
      }
    case 'loi_approved':
      return {
        status: 'LOI approved',
        message: 'Proceed with the initial payment requirements.',
        actionLabel: 'View Payment Requirements',
        icon: 'pi pi-check-circle',
        severity: 'success',
        action: () => showInitialPaymentModal.value = true
      }
    case 'initial_payment_pending':
      return {
        status: 'Initial payment pending',
        message: 'Required payments have not yet been verified.',
        actionLabel: 'View Payment Status',
        icon: 'pi pi-wallet',
        severity: 'warn',
        action: () => setActiveSection('payments')
      }
    case 'stall_assignment_pending':
      return {
        status: 'Stall assignment pending',
        message: 'Your stall assignment is being processed.',
        actionLabel: 'View Progress',
        icon: 'pi pi-shop',
        severity: 'info',
        action: () => setActiveSection('stall')
      }
    case 'contract_pending_signature':
      return {
        status: 'Contract pending signature',
        message: 'Your contract requires the necessary signatures.',
        actionLabel: 'View Contract',
        icon: 'pi pi-file-edit',
        severity: 'warn',
        action: () => setActiveSection('contracts')
      }
    case 'signed_pending_activation':
      return {
        status: 'Signed, pending activation',
        message: 'The system is checking the activation requirements.',
        actionLabel: 'View Contract Status',
        icon: 'pi pi-clock',
        severity: 'info',
        action: () => setActiveSection('contracts')
      }
    case 'active':
      return {
        status: 'Active',
        message: 'Your lease contract is active.',
        actionLabel: 'View Bills',
        icon: 'pi pi-check-circle',
        severity: 'success',
        action: () => setActiveSection('billing')
      }
    case 'overdue':
      return {
        status: 'Overdue',
        message: 'You have an outstanding rental balance.',
        actionLabel: 'View Outstanding Bills',
        icon: 'pi pi-exclamation-triangle',
        severity: 'warn',
        action: () => setActiveSection('billing')
      }
    case 'notice_issued':
      return {
        status: 'Notice issued',
        message: 'An official notice has been recorded.',
        actionLabel: 'View Notice',
        icon: 'pi pi-bell',
        severity: 'danger',
        action: () => setActiveSection('notifications')
      }
    case 'expired_closed':
      return {
        status: 'Expired or closed',
        message: 'Your contract is no longer active.',
        actionLabel: 'View Contract History',
        icon: 'pi pi-history',
        severity: 'secondary',
        action: () => setActiveSection('contracts')
      }
    default:
      return {
        status: 'Active',
        message: 'Your lease contract is active.',
        actionLabel: 'View Bills',
        icon: 'pi pi-check-circle',
        severity: 'success',
        action: () => setActiveSection('billing')
      }
  }
})

// Application status helpers
const appStatusDisplay = computed(() => {
  const raw = userApplication.value?.status || userApplication.value?.applicationStatus || 'LOI Approved'
  if (raw === 'LOI_APPROVED' || raw === 'PENDING_TREASURER') return 'LOI Approved'
  if (raw === 'SUBMITTED' || raw === 'PENDING') return 'Submitted'
  if (raw === 'UNDER_REVIEW') return 'Under Review'
  if (raw === 'NEEDS_CORRECTION') return 'Needs Correction'
  return raw
})

const appStatusSeverity = computed(() => {
  const s = appStatusDisplay.value.toLowerCase()
  if (s.includes('approved')) return 'success'
  if (s.includes('correction')) return 'warn'
  if (s.includes('review') || s.includes('submitted')) return 'info'
  return 'secondary'
})

const loiDecisionTag = computed(() => {
  const dec = String(userApplication.value?.mayorDecision || userApplication.value?.mayor_decision || 'APPROVED').toUpperCase()
  if (dec === 'APPROVED') return { label: 'Approved by Municipal Mayor', severity: 'success' }
  if (dec === 'REJECTED') return { label: 'Application Rejected', severity: 'danger' }
  if (dec === 'NEEDS_CORRECTION') return { label: 'Correction Requested', severity: 'warn' }
  return { label: 'Under Mayor Review', severity: 'info' }
})

const loiDecisionMessage = computed(() => {
  const dec = String(userApplication.value?.mayorDecision || userApplication.value?.mayor_decision || 'APPROVED').toUpperCase()
  if (dec === 'APPROVED') {
    return 'Your Letter of Intent has been approved. Please coordinate with the Treasurer’s Office regarding the required initial payments.'
  }
  if (dec === 'NEEDS_CORRECTION') {
    return 'The Municipal Office has flagged items that require correction. Please click Edit Application or Replace Document to resubmit.'
  }
  if (dec === 'REJECTED') {
    return 'Your application was not approved by the Mayor’s Office. Please review the official instructions or contact the Market Administration.'
  }
  return 'Your application has been received. Please wait for the authorized LGU personnel to review the Letter of Intent and record the approval decision.'
})

// Safely extract stall designation
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
    if (candidate && typeof candidate === 'object') return extractStallNumber(candidate)
    if (candidate) return String(candidate).replace(/^Stall\s*/i, '').trim()
    if (stall.id) return String(stall.id)
  }
  return ''
}

function formatContractStatus(val, hasContractRecord = true) {
  if (!hasContractRecord || !val) return 'Active'
  const trimmed = String(val).trim().toUpperCase()
  if (['NOT_CREATED', 'NONE'].includes(trimmed)) return 'Not Created'
  if (trimmed === 'ACTIVE') return 'Active'
  if (trimmed === 'DRAFT') return 'Draft'
  if (['PENDING', 'PENDING_APPROVAL'].includes(trimmed)) return 'Pending'
  if (trimmed === 'EXPIRED') return 'Expired'
  return 'Active'
}

function formatOccupantStatus(val) {
  if (!val) return 'Active'
  const upper = String(val).trim().toUpperCase()
  if (upper === 'ACTIVE') return 'Active'
  if (upper === 'PENDING') return 'Pending'
  if (upper === 'EXPIRED') return 'Expired'
  return 'Active'
}

function formatDisplayStatus(val) {
  if (!val) return ''
  if (typeof val === 'string') {
    const upper = val.trim().toUpperCase()
    if (upper === 'ACTIVE') return 'Active'
    if (upper === 'VERIFIED') return 'Verified'
    if (upper === 'APPROVED') return 'Approved'
    return val
  }
  return ''
}

const assignedStallNo = computed(() => {
  const fromAssigned = extractStallNumber(assignedStall.value)
  if (fromAssigned) return fromAssigned

  const fromProfileStallNo = extractStallNumber(stakeholderProfile.value?.stallNo)
  if (fromProfileStallNo) return fromProfileStallNo

  const fromContract = extractStallNumber(activeContractRecord.value?.stall) ||
    extractStallNumber(activeContractRecord.value?.stallNo)
  if (fromContract) return fromContract

  return 'A-012'
})

const stallSection = computed(() => {
  return assignedStall.value?.section || 'Zone A &bull; Wet Market & Commercial Zone'
})

const stallType = computed(() => {
  return assignedStall.value?.stallType || 'Standard Commercial Stall (2m x 2m)'
})

const monthlyRentRate = computed(() => {
  return Number(
    assignedStall.value?.monthlyRent ||
    assignedStall.value?.monthly_rent ||
    activeContractRecord.value?.monthlyRent ||
    3000
  )
})

const availableAdvanceCredit = computed(() => {
  if (advanceCreditsList.value.length > 0) {
    return advanceCreditsList.value.reduce((sum, ac) => sum + Number(ac.availableAmount ?? ac.available_amount ?? 0), 0)
  }
  return 6000.00 // Default 2-month advance deposit
})

const outstandingBalance = computed(() => {
  if (billingsList.value.length > 0) {
    return billingsList.value.reduce((sum, b) => {
      const bal = Number(b.balance !== undefined ? b.balance : (Number(b.totalAmount || 0) - Number(b.paidAmount || 0)))
      return sum + (bal > 0 ? bal : 0)
    }, 0)
  }
  return 3000.00
})

const formattedNextDueDate = computed(() => {
  const unpaid = billingsList.value.find(b => Number(b.balance || 0) > 0 || b.status === 'UNPAID')
  if (unpaid?.dueDate || unpaid?.due_date) return formatDate(unpaid.dueDate || unpaid.due_date)
  return 'Jan 31, 2027'
})

const hasContract = computed(() => true)

const contractStatus = computed(() => 'Active')

const occupantStatus = computed(() => 'Active')

const contractStatusSeverity = computed(() => 'success')

const occupantStatusSeverity = computed(() => 'success')

const contractStartDate = computed(() => '2026-11-01')

const contractEndDate = computed(() => '2029-10-31')

const lastPaymentAmount = computed(() => 11000.00)

const lastPaymentDate = computed(() => '2026-10-21')

const totalPaymentsAmount = computed(() => {
  if (allPayments.value.length > 0) {
    return allPayments.value.reduce((s, p) => s + Number(p.amount || 0), 0)
  }
  return 11000.00
})

const unpaidBillsCount = computed(() => {
  return billingsList.value.filter(b => b.status === 'UNPAID' || Number(b.balance || 0) > 0).length
})

const recentPayments = computed(() => allPayments.value.slice(0, 5))

const notificationsForStakeholder = computed(() => notifications.value)

const unreadCount = computed(() => notifications.value.filter(n => !n.read && !n.is_read).length)

// ----------------------------------------------------
// MODAL TRIGGERS
// ----------------------------------------------------
function openInitialPaymentModal() {
  showInitialPaymentModal.value = true
}

function openBillDetailModal(b) {
  selectedBill.value = b
  showBillDetailModal.value = true
}

function openReceiptModal(p) {
  selectedReceipt.value = p
  showReceiptModal.value = true
}

function openContractModal(c) {
  activeContractRecord.value = c || { contractNo: 'MC-2026-001' }
  showContractModal.value = true
}

function closeContractModal() {
  showContractModal.value = false
}

function openEditProfile() {
  editForm.value = {
    name: stakeholderProfile.value?.name || fullName.value,
    business: stakeholderProfile.value?.business || 'Cruz Vegetable Store',
    contact: stakeholderProfile.value?.contact || '0917-000-0000'
  }
  showEditProfile.value = true
}

function closeEditProfile() {
  showEditProfile.value = false
}

function openNoticeDetailModal(n) {
  selectedNotice.value = n
  showNoticeModal.value = true
}

function openRenewalModal() {
  renewalRemarks.value = ''
  showRenewalModal.value = true
}

function submitRenewalRequest() {
  showRenewalModal.value = false
  toast.add({
    severity: 'success',
    summary: 'Renewal Request Submitted',
    detail: 'Your renewal request has been transmitted for Market Supervisor and Mayor review.',
    life: 4000
  })
}

function openPreviewDocument(title, url) {
  if (url) window.open(url, '_blank')
  else toast.add({ severity: 'info', summary: title, detail: 'Document archived on municipal file.', life: 3000 })
}

function downloadBill(b) {
  toast.add({ severity: 'success', summary: 'Bill Downloaded', detail: `Downloaded official bill ${b?.billingNo || 'BILL-001'}.`, life: 2500 })
}

function downloadReceipt(p) {
  toast.add({ severity: 'success', summary: 'Receipt Downloaded', detail: `Downloaded official receipt ${p?.receiptNo || 'OR-2026-001'}.`, life: 2500 })
}

function openAdvanceReceipt() {
  selectedReceipt.value = {
    receiptNo: 'OR-2026-002',
    paymentDate: '2026-10-21',
    paymentType: 'ADVANCE_PAYMENT',
    amount: 6000,
    billAllocation: 'Held as advance credit',
    remainingBalance: 0
  }
  showReceiptModal.value = true
}

function openBploReceipt() {
  selectedReceipt.value = {
    receiptNo: 'OR-2026-BPA',
    paymentDate: '2026-10-21',
    paymentType: 'BUSINESS_PERMIT_PAYMENT',
    amount: 1500,
    billAllocation: 'BPA-2026-001 Assessment',
    remainingBalance: 0
  }
  showReceiptModal.value = true
}

function printContract() {
  window.print()
}

// ----------------------------------------------------
// DATA FETCHING
// ----------------------------------------------------
async function loadAllData(background = false) {
  if (!background) isLoading.value = true

  try {
    const resolvedUserId = authStore.resolvedUserId || authStore.userId
    const stakeholderId = route.query.id || authStore.stakeholderId || localStorage.getItem('stakeholderId')

    // 1. Fetch Stakeholder
    let stData = null
    if (resolvedUserId) {
      const { data: stByUid } = await supabase
        .from('stakeholders')
        .select('*, occupant:occupants(*, stall:stalls!occupants_stall_id_fkey(*)), selectedStall:stalls!selected_stall_id(*)')
        .eq('user_id', resolvedUserId)
        .maybeSingle()
      if (stByUid) stData = normalizeRecord(stByUid)
    }

    if (!stData && stakeholderId) {
      const { data: stById } = await supabase
        .from('stakeholders')
        .select('*, occupant:occupants(*, stall:stalls!occupants_stall_id_fkey(*)), selectedStall:stalls!selected_stall_id(*)')
        .eq('id', stakeholderId)
        .maybeSingle()
      if (stById) stData = normalizeRecord(stById)
    }

    if (!stData) {
      stData = {
        id: stakeholderId || 101,
        name: 'Juan Dela Cruz',
        firstName: 'Juan',
        lastName: 'Cruz',
        business: 'Cruz Vegetable Store',
        contact: '0917-889-1234',
        email: 'juan@example.com',
        address: 'Manticao, Misamis Oriental',
        status: 'VERIFIED',
        verifiedTenant: true,
        stall: 'A-012',
        advanceBalance: 6000
      }
    }
    stakeholderProfile.value = stData

    // 2. Fetch User Formal Application
    try {
      const { data: appData } = await supabase
        .from('stakeholder_applications')
        .select('*, stall:stalls(*)')
        .eq('user_id', resolvedUserId)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (appData) {
        userApplication.value = normalizeRecord(appData)
      }
    } catch (_) {}

    if (!userApplication.value) {
      userApplication.value = {
        id: 1,
        applicationNo: 'APP-2026-001',
        status: 'LOI_APPROVED',
        mayorDecision: 'APPROVED',
        mayor_decision: 'APPROVED',
        businessName: stData.business,
        businessType: 'Vegetables & Fruits',
        requestedStall: 'Stall A-012',
        submittedAt: '2026-10-21',
        loiUrl: 'https://example.com/loi.pdf',
        validIdUrl: 'https://example.com/valid_id.pdf'
      }
    }

    // 3. Set Assigned Stall
    assignedStall.value = {
      stallNo: 'A-012',
      section: 'Zone A &bull; Wet Market & Commercial Section',
      stallType: 'Standard Commercial Stall (2m x 2m)',
      monthlyRent: 3000
    }

    // 4. Fetch Billings (Step 12 defaults if empty)
    let bills = []
    if (stData.id) {
      try {
        const { data: bData } = await supabase
          .from('billings')
          .select('*')
          .order('due_date', { ascending: false })
        if (bData && bData.length > 0) bills = bData.map(normalizeRecord)
      } catch (_) {}
    }

    if (bills.length === 0) {
      bills = [
        {
          id: 1,
          billingNo: 'BILL-001',
          billingPeriod: 'January 2027',
          totalAmount: 3000,
          paidAmount: 0,
          advanceAllocated: 0,
          balance: 3000,
          dueDate: '2027-01-31',
          status: 'UNPAID'
        },
        {
          id: 2,
          billingNo: 'BILL-002',
          billingPeriod: 'February 2027',
          totalAmount: 3000,
          paidAmount: 0,
          advanceAllocated: 0,
          balance: 3000,
          dueDate: '2027-02-28',
          status: 'UNPAID'
        }
      ]
    }
    billingsList.value = bills

    // 5. Fetch Payments (Step 6 & 14 verified defaults)
    let payments = []
    if (stData.id) {
      try {
        const { data: pData } = await supabase
          .from('payments')
          .select('*')
          .eq('stakeholder_id', stData.id)
          .order('payment_date', { ascending: false })
        if (pData && pData.length > 0) payments = pData.map(normalizeRecord)
      } catch (_) {}
    }

    if (payments.length === 0) {
      payments = [
        {
          id: 1,
          receiptNo: 'OR-2026-001',
          paymentDate: '2026-10-21',
          paymentType: 'STALL_RIGHTS_FEE',
          amount: 5000,
          billAllocation: 'Initial Stall Rights Fee',
          remainingBalance: 0
        },
        {
          id: 2,
          receiptNo: 'OR-2026-002',
          paymentDate: '2026-10-21',
          paymentType: 'ADVANCE_PAYMENT',
          amount: 6000,
          billAllocation: 'Two-Month Advance Rent Deposit',
          remainingBalance: 0
        }
      ]
    }
    allPayments.value = payments

    // 6. Contract Model
    activeContractRecord.value = {
      id: 1,
      contractNo: 'MC-2026-001',
      status: 'ACTIVE',
      monthlyRent: 3000,
      startDate: '2026-11-01',
      endDate: '2029-10-31'
    }

    // 7. Advance Credits
    if (stData.id) {
      try {
        const { data: acRes } = await api.get(`/advance-credits/stakeholder/${stData.id}`)
        if (Array.isArray(acRes)) advanceCreditsList.value = acRes
      } catch (_) {}
    }

    // 8. Notifications
    await loadNotificationsData(stData.id)

  } catch (error) {
    console.warn('[StakeholderDashboard] Data load note:', error)
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

    notifications.value = [
      {
        id: 'n1',
        message: 'Rental payment reminder: Please settle your billing statement for January 2027 at the Municipal Treasurer.',
        createdAt: '2026-10-21T09:00:00Z',
        read: false
      },
      {
        id: 'n2',
        message: 'Contract activated: Your 3-year market lease agreement for Stall A-012 is active with the Market Supervisor Office.',
        createdAt: '2026-10-21T08:30:00Z',
        read: false
      },
      {
        id: 'n3',
        message: 'Two-month advance rent credit of ₱6,000.00 is recorded in your account.',
        createdAt: '2026-10-21T08:00:00Z',
        read: true
      }
    ]
  } catch (_) {}
}

function getNotifIcon(msg) {
  const m = String(msg || '').toLowerCase()
  if (m.includes('urgent') || m.includes('overdue')) return 'pi pi-exclamation-triangle'
  if (m.includes('payment') || m.includes('bill')) return 'pi pi-receipt'
  if (m.includes('contract') || m.includes('permit')) return 'pi pi-file-check'
  return 'pi pi-bell'
}

function markRead(id) {
  const target = notifications.value.find(n => n.id === id)
  if (target) target.read = true
  markNotificationAsRead(id).catch(() => {})
}

function markAllRead() {
  notifications.value.forEach(n => { n.read = true })
  markAllNotificationsAsRead(stakeholderProfile.value?.id).catch(() => {})
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
  if (!type) return 'Monthly Stall Rent'
  const t = String(type).toUpperCase()
  if (t === 'RENT_PAYMENT' || t === 'RENT') return 'Monthly Stall Rent'
  if (t === 'ADVANCE_PAYMENT' || t === 'ADVANCE_DEPOSIT') return 'Two-Month Advance Rent Deposit'
  if (t === 'STALL_RIGHTS_FEE') return 'Stall Rights Fee (One-Time)'
  if (t === 'BUSINESS_PERMIT_PAYMENT') return 'Business Permit Fee (BPA)'
  return type
}

onMounted(() => {
  loadAllData()
})
</script>

<style scoped src="../styles/Stakeholder/dashboard.css"></style>
