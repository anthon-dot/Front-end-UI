<template>
  <div class="layout min-h-screen bg-slate-50">
    <Toast position="top-right" />

    <!-- Sidebar -->
    <TreasurerMenu />

    <!-- Main -->
    <main class="page-container">
      
      <!-- Title & Search & Refresh Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span class="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-xs">
              <i class="pi pi-receipt text-2xl"></i>
            </span>
            Billing Records
          </h2>
          <p class="text-sm text-slate-500 mt-1">Tenant rental billing statements, payment schedules, and balances</p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <div class="w-full sm:w-72">
            <SearchField v-model="search" placeholder="Search tenant, stall, or billing ID..." />
          </div>
          <Button 
            icon="pi pi-cog" 
            label="Generate Bills" 
            severity="success" 
            size="small" 
            :loading="isGeneratingBills" 
            @click="generateMonthlyBillsAction"
            class="!py-2 !px-3 font-semibold"
            title="Generate monthly bills according to contract schedule"
          />
          <Button 
            icon="pi pi-download" 
            label="Export Report" 
            outlined 
            severity="secondary" 
            size="small" 
            @click="exportBillingReport"
            class="!py-2 !px-3 font-semibold"
            title="Export billing & overdue report"
          />
          <Button 
            icon="pi pi-envelope" 
            label="Email Due Reminders" 
            severity="warn" 
            size="small" 
            :loading="isSendingBulkReminders" 
            @click="sendBulkDueReminders"
            class="!py-2 !px-3 font-semibold"
          />
          <Button 
            icon="pi pi-refresh" 
            label="Refresh" 
            outlined 
            size="small" 
            :loading="loading" 
            @click="fetchBillings"
            class="!py-2 !px-3 font-semibold"
          />
        </div>
      </div>

      <!-- VIEW MODE SWITCHER TABS -->
      <div class="flex items-center gap-2 mb-5 border-b border-slate-200 pb-2 flex-wrap">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2"
          :class="mainBillingView === 'BILLS' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
          @click="setMainView('BILLS')"
        >
          <i class="pi pi-receipt"></i>
          Billing Statements ({{ rows.length }})
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2"
          :class="mainBillingView === 'ADVANCE_CREDIT' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
          @click="setMainView('ADVANCE_CREDIT')"
        >
          <i class="pi pi-wallet"></i>
          Advance Credit Ledger ({{ advanceCreditStakeholders.length }})
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2"
          :class="mainBillingView === 'OVERDUE' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
          @click="setMainView('OVERDUE')"
        >
          <i class="pi pi-exclamation-triangle"></i>
          Overdue Accounts & Notice Tracking ({{ overdueRows.length }})
        </button>
      </div>

      <!-- VIEW 1: BILLING STATEMENTS -->
      <div v-if="mainBillingView === 'BILLS'">
        <!-- Summary Cards -->
        <div class="summary-grid">
        <!-- Total Invoiced -->
        <div class="summary-card">
          <div class="summary-icon blue">
            <i class="pi pi-receipt"></i>
          </div>
          <div>
            <p class="summary-label">Total Invoiced</p>
            <h3 class="summary-value">₱ {{ totalInvoiced.toLocaleString() }}</h3>
          </div>
        </div>

        <!-- Total Collected -->
        <div class="summary-card">
          <div class="summary-icon green">
            <i class="pi pi-check-circle"></i>
          </div>
          <div>
            <p class="summary-label">Total Collected</p>
            <h3 class="summary-value text-emerald-600">₱ {{ totalPaid.toLocaleString() }}</h3>
          </div>
        </div>

        <!-- Outstanding Balance -->
        <div class="summary-card">
          <div class="summary-icon red">
            <i class="pi pi-exclamation-circle"></i>
          </div>
          <div>
            <p class="summary-label">Outstanding Balance</p>
            <h3 class="summary-value text-rose-600">₱ {{ totalBalance.toLocaleString() }}</h3>
          </div>
        </div>
      </div>

      <!-- Schedule Color Legend & Filter Tabs Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <!-- Quick Filter Chips -->
        <div class="flex items-center gap-2 flex-wrap text-xs">
          <span class="text-slate-400 font-bold uppercase tracking-wider text-[11px] mr-1">Filter:</span>
          <button 
            type="button"
            class="filter-chip"
            :class="{ active: activeFilter === 'ALL' }"
            @click="activeFilter = 'ALL'"
          >
            All Bills ({{ rows.length }})
          </button>
          <button 
            type="button"
            class="filter-chip danger"
            :class="{ active: activeFilter === 'PAST_DUE' }"
            @click="activeFilter = 'PAST_DUE'"
          >
            Past Due ({{ pastDueCount }})
          </button>
          <button 
            type="button"
            class="filter-chip warning"
            :class="{ active: activeFilter === 'THIS_MONTH' }"
            @click="activeFilter = 'THIS_MONTH'"
          >
            This Month ({{ thisMonthCount }})
          </button>
          <button 
            type="button"
            class="filter-chip success"
            :class="{ active: activeFilter === 'ADVANCE' }"
            @click="activeFilter = 'ADVANCE'"
          >
            Advance ({{ advanceCount }})
          </button>
          <button 
            type="button"
            class="filter-chip"
            :class="{ active: activeFilter === 'UNPAID' }"
            @click="activeFilter = 'UNPAID'"
          >
            Unpaid Only ({{ unpaidCount }})
          </button>
          <button 
            type="button"
            class="filter-chip"
            :class="{ active: activeFilter === 'PAID' }"
            @click="activeFilter = 'PAID'"
          >
            Paid ({{ paidCount }})
          </button>
        </div>

        <!-- Schedule Color Legend -->
        <div class="flex items-center gap-2 sm:gap-3 flex-wrap text-xs font-semibold text-slate-500 border-t lg:border-t-0 pt-3 lg:pt-0">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px]">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span> Past Due
          </span>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span> This Month
          </span>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px]">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Advance
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[300px] mb-6">
        <i class="pi pi-spin pi-spinner text-4xl text-indigo-600 mb-4"></i>
        <p class="text-slate-500 font-medium">Fetching billing records and checking statements...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="stakeholderGroups.length === 0" class="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400">
        <i class="pi pi-inbox text-5xl mb-3 text-slate-300"></i>
        <p class="text-base font-semibold text-slate-600">No billing records match your filters.</p>
        <p class="text-xs text-slate-400 mt-1" v-if="activeFilter !== 'ALL' || search">Try clearing your search query or switching to All Bills.</p>
        <Button 
          v-if="activeFilter !== 'ALL' || search"
          label="Clear Filters" 
          icon="pi pi-filter-slash" 
          size="small" 
          outlined 
          class="mt-4"
          @click="clearFilters"
        />
      </div>

      <!-- Stakeholder Cards -->
      <div v-else class="space-y-6">
        <div 
          v-for="group in stakeholderGroups" 
          :key="group.stakeholder"
          class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
        >
          <!-- Box Header -->
          <div class="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-slate-50/80 to-white border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-3.5">
              <!-- Profile Avatar -->
              <div class="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-sm shadow-xs border border-indigo-200 flex-shrink-0">
                {{ initials(group.stakeholder) }}
              </div>
              
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                    {{ group.stakeholder }}
                  </h3>
                  
                  <!-- Stall Badge -->
                  <span v-if="group.stallNo" class="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg shadow-xs">
                    <i class="pi pi-shop text-[11px]"></i>
                    Stall {{ group.stallNo }}
                  </span>

                  <!-- Status Tag -->
                  <Tag v-if="group.stallNo" value="VERIFIED TENANT" severity="success" rounded class="!text-[10px] !py-0.5 !px-2 font-bold" />
                  <Tag v-else value="APPLICANT" severity="info" rounded class="!text-[10px] !py-0.5 !px-2 font-bold" />
                </div>

                <p v-if="group.businessName && group.businessName !== group.stakeholder" class="text-xs text-slate-500 font-medium mt-0.5">
                  {{ group.businessName }}
                </p>
              </div>
            </div>

            <!-- Group Financial Summary in Header -->
            <div class="flex items-center gap-4 text-xs font-semibold bg-white px-4 py-2 rounded-xl border border-slate-200/80 shadow-xs self-start md:self-auto">
              <span>Total: <strong class="text-slate-800">₱{{ group.totalInvoiced.toLocaleString() }}</strong></span>
              <span class="text-slate-200">|</span>
              <span>Paid: <strong class="text-emerald-600">₱{{ group.totalPaid.toLocaleString() }}</strong></span>
              <span class="text-slate-200">|</span>
              <span>Balance: <strong class="text-rose-600">₱{{ group.totalBalance.toLocaleString() }}</strong></span>
            </div>
          </div>

          <!-- Bills Table inside the Stakeholder Box -->
          <div class="overflow-x-auto">
            <DataTable 
              :value="group.bills" 
              :rowClass="getRowClass"
              responsiveLayout="scroll"
              class="p-datatable-sm modern-table"
            >
              <!-- 1. Billing ID -->
              <Column field="id" header="Billing ID" class="font-mono text-sm font-bold text-slate-600" style="min-width: 140px;">
                <template #body="{ data }">
                  <span class="cursor-pointer hover:text-indigo-600 underline-offset-2 hover:underline" @click="openBillDetails(data)">
                    {{ data.id }}
                  </span>
                </template>
              </Column>

              <!-- 2. Period -->
              <Column field="period" header="Period" class="text-slate-600 text-sm font-medium" style="min-width: 160px;">
                <template #body="{ data }">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-slate-800">{{ formatPeriod(data.period) }}</span>
                    <span v-if="isPastDue(data)" class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                      PAST DUE
                    </span>
                    <span v-else-if="isThisMonth(data)" class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      THIS MONTH
                    </span>
                    <span v-else-if="isNextTwoMonths(data)" class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ADVANCE
                    </span>
                  </div>
                </template>
              </Column>
              
              <!-- 3. Total -->
              <Column field="total" header="Total" style="min-width: 100px;">
                <template #body="{ data }">
                  <span class="font-semibold text-slate-700">₱{{ Number(data.total || 0).toLocaleString() }}</span>
                </template>
              </Column>

              <!-- 4. Paid -->
              <Column field="paid" header="Paid" style="min-width: 100px;">
                <template #body="{ data }">
                  <span class="font-bold text-emerald-600">₱{{ Number(data.paid || 0).toLocaleString() }}</span>
                </template>
              </Column>

              <!-- 5. Balance -->
              <Column field="balance" header="Balance" style="min-width: 100px;">
                <template #body="{ data }">
                  <span class="font-bold text-rose-600">₱{{ Number(data.balance || 0).toLocaleString() }}</span>
                </template>
              </Column>

              <!-- 6. Due Date -->
              <Column field="due" header="Due Date" class="text-slate-600 text-sm" style="min-width: 110px;">
                <template #body="{ data }">
                  <span>{{ formatDate(data.due) }}</span>
                </template>
              </Column>

              <!-- 7. Status & 2-Month Grace Period indicator -->
              <Column field="status" header="Status" style="min-width: 140px;">
                <template #body="{ data }">
                  <div class="flex flex-col gap-1">
                    <Tag :value="data.status" :severity="getStatusSeverity(data.status)" rounded class="font-bold px-3 py-1" />
                    <span v-if="data.isWithinGracePeriod" class="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-center">
                      Grace Period (Day {{ data.daysPastDue }}/60)
                    </span>
                    <span v-else-if="data.status === 'OVERDUE'" class="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-center">
                      60+ Days (Notice Eligible)
                    </span>
                  </div>
                </template>
              </Column>

              <!-- 8. Actions -->
              <Column header="Actions" alignFrozen="right" :frozen="true" class="text-right" style="min-width: 250px;">
                <template #body="{ data }">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- Allocate Advance Credit Button -->
                    <Button 
                      v-if="data.status !== 'PAID'"
                      label="Credit" 
                      icon="pi pi-wallet" 
                      size="small" 
                      severity="help"
                      class="!py-1 !px-2.5 !text-xs font-bold"
                      title="Allocate existing 2-month advance credit without double-counting cash"
                      @click="openAllocateModal(data)"
                    />

                    <!-- Quick Daily / Partial Collection Button -->
                    <Button 
                      v-if="data.status !== 'PAID'"
                      label="Daily" 
                      icon="pi pi-calendar-plus" 
                      size="small" 
                      severity="warn"
                      class="!py-1 !px-2.5 !text-xs font-bold"
                      title="Record quick daily cash collection"
                      @click="openDailyModal(data)"
                    />

                    <!-- Collect Regular Payment Button -->
                    <Button 
                      v-if="data.status !== 'PAID'"
                      label="Pay" 
                      icon="pi pi-credit-card" 
                      size="small" 
                      severity="success"
                      class="!py-1 !px-2.5 !text-xs font-bold"
                      @click="collectPayment(data)"
                    />

                    <!-- Send Reminder Notification Button -->
                    <Button 
                      icon="pi pi-send" 
                      size="small" 
                      :disabled="data.status === 'PAID'" 
                      @click="sendNotification(data)"
                      :outlined="data.status !== 'PAID'"
                      :severity="data.status === 'PAID' ? 'secondary' : 'info'"
                      class="!py-1 !px-2 text-xs"
                      title="Send billing reminder"
                    />

                    <!-- View Details Button -->
                    <Button 
                      icon="pi pi-eye" 
                      size="small" 
                      outlined 
                      severity="secondary" 
                      class="!py-1 !px-2 text-slate-500"
                      title="View statement details"
                      @click="openBillDetails(data)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
        </div>
      </div>
      </div>
      </div>

      <!-- ============================================== -->
      <!-- VIEW 2: ADVANCE CREDIT LEDGER                  -->
      <!-- ============================================== -->
      <div v-else-if="mainBillingView === 'ADVANCE_CREDIT'" class="space-y-6">
        <!-- Advance Credit Summary Cards -->
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-icon blue">
              <i class="pi pi-wallet text-xl"></i>
            </div>
            <div>
              <p class="summary-label">Total Advance Rent Deposited</p>
              <h3 class="summary-value text-indigo-700">₱ {{ totalAdvanceDeposited.toLocaleString() }}</h3>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon amber">
              <i class="pi pi-arrow-right-arrow-left text-xl"></i>
            </div>
            <div>
              <p class="summary-label">Credit Allocated to Bills</p>
              <h3 class="summary-value text-amber-600">₱ {{ totalAdvanceAllocated.toLocaleString() }}</h3>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon green">
              <i class="pi pi-shield text-xl"></i>
            </div>
            <div>
              <p class="summary-label">Available Advance Credits</p>
              <h3 class="summary-value text-emerald-600">₱ {{ totalAdvanceAvailable.toLocaleString() }}</h3>
            </div>
          </div>
        </div>

        <!-- Information Callout Box -->
        <div class="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 text-xs text-indigo-950 flex items-start gap-3 shadow-xs">
          <i class="pi pi-info-circle text-indigo-600 text-lg mt-0.5"></i>
          <div>
            <div class="font-extrabold text-sm text-indigo-950 mb-0.5">Advance Rent Accounting & Allocation Rule</div>
            <p class="text-indigo-800 leading-relaxed m-0">
              In accordance with Municipal Treasury regulations, <strong>two-month advance rent</strong> is held in trust as an unallocated credit. It does <strong>not</strong> automatically settle the first two billing statements. Allocations are authorized transfers of existing deposit credit to liquidate specific rental statements and are <strong>not</strong> counted as duplicate cash income in daily collection journals.
            </p>
          </div>
        </div>

        <!-- Advance Credit Table -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between gap-4">
            <div>
              <h3 class="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <i class="pi pi-wallet text-indigo-600"></i>
                Advance Rental Deposit Ledger
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Stakeholders with verified 2-month advance rental credits on record</p>
            </div>
            <span class="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {{ advanceCreditStakeholders.length }} Accounts
            </span>
          </div>

          <div v-if="advanceCreditStakeholders.length === 0" class="text-center py-16 text-slate-400">
            <i class="pi pi-wallet text-5xl mb-3 text-slate-300"></i>
            <p class="text-base font-semibold text-slate-600">No advance credit deposits currently recorded.</p>
            <p class="text-xs text-slate-400 mt-1">Initial 2-month advance rental payments verified in Applicant Payments will appear here.</p>
          </div>

          <DataTable 
            v-else
            :value="advanceCreditStakeholders" 
            class="p-datatable-sm" 
            responsiveLayout="scroll"
          >
            <!-- Stakeholder Info -->
            <Column header="Stakeholder" style="min-width: 200px">
              <template #body="{ data }">
                <div class="font-bold text-slate-900 text-xs sm:text-sm">{{ data.stakeholder }}</div>
                <div v-if="data.businessName" class="text-xs text-slate-500">{{ data.businessName }}</div>
                <span v-if="data.stallNo" class="inline-block mt-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  Stall #{{ data.stallNo }}
                </span>
              </template>
            </Column>

            <!-- Originating Receipt -->
            <Column header="Originating Receipt" style="min-width: 160px">
              <template #body="{ data }">
                <div class="font-mono text-xs font-bold text-slate-700">{{ data.originatingReceipt || 'O.R.-INITIAL' }}</div>
                <div class="text-[11px] text-slate-400">{{ formatDate(data.receiptDate) }}</div>
              </template>
            </Column>

            <!-- Original Advance Deposited -->
            <Column header="Original Advance" style="min-width: 130px">
              <template #body="{ data }">
                <span class="text-xs font-bold text-slate-800">₱{{ Number(data.originalAdvance || 0).toLocaleString() }}</span>
              </template>
            </Column>

            <!-- Allocated to Bills -->
            <Column header="Allocated to Bills" style="min-width: 130px">
              <template #body="{ data }">
                <span class="text-xs font-semibold text-amber-600">₱{{ Number(data.allocatedAmount || 0).toLocaleString() }}</span>
              </template>
            </Column>

            <!-- Available Balance -->
            <Column header="Available Credit" style="min-width: 140px">
              <template #body="{ data }">
                <span class="text-sm font-extrabold text-emerald-600">₱{{ Number(data.availableBalance || 0).toLocaleString() }}</span>
              </template>
            </Column>

            <!-- Status Tag -->
            <Column header="Credit Status" style="min-width: 130px">
              <template #body="{ data }">
                <Tag 
                  :value="data.status" 
                  :severity="data.status === 'AVAILABLE' ? 'success' : (data.status === 'PARTIALLY_ALLOCATED' ? 'warning' : 'secondary')" 
                  rounded 
                  class="!text-[11px] !py-0.5 !px-2.5 font-bold"
                />
              </template>
            </Column>

            <!-- Actions -->
            <Column header="Actions" style="min-width: 160px; text-align: right">
              <template #body="{ data }">
                <div class="flex items-center justify-end gap-2">
                  <Button 
                    v-if="data.availableBalance > 0"
                    icon="pi pi-wallet" 
                    label="Allocate" 
                    size="small" 
                    severity="help" 
                    class="!py-1.5 !px-3 !text-xs font-bold"
                    title="Allocate available credit to an outstanding statement"
                    @click="openAllocateFromLedger(data)"
                  />
                  <Button 
                    v-else
                    icon="pi pi-check" 
                    label="Exhausted" 
                    size="small" 
                    disabled 
                    outlined
                    class="!py-1 !px-2 !text-xs"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- VIEW 3: OVERDUE ACCOUNTS & NOTICE TRACKING      -->
      <!-- ============================================== -->
      <div v-else-if="mainBillingView === 'OVERDUE'" class="space-y-6">
        <!-- Overdue Summary Cards -->
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-icon red">
              <i class="pi pi-exclamation-triangle text-xl"></i>
            </div>
            <div>
              <p class="summary-label">Overdue Bills</p>
              <h3 class="summary-value text-rose-600">{{ overdueRows.length }}</h3>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon red">
              <i class="pi pi-dollar text-xl"></i>
            </div>
            <div>
              <p class="summary-label">Total Overdue Arrears</p>
              <h3 class="summary-value text-rose-700">₱ {{ totalOverdueArrears.toLocaleString() }}</h3>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon amber">
              <i class="pi pi-shield text-xl"></i>
            </div>
            <div>
              <p class="summary-label">90+ Day Delinquency Risk</p>
              <h3 class="summary-value text-amber-700">{{ criticalRevocationCount }} Cases</h3>
            </div>
          </div>
        </div>

        <!-- Municipal Delinquency Policy Callout -->
        <div class="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-950 flex items-start gap-3 shadow-xs">
          <i class="pi pi-shield text-rose-600 text-lg mt-0.5"></i>
          <div>
            <div class="font-extrabold text-sm text-rose-950 mb-0.5">Municipal Delinquency & Grace Period Procedure</div>
            <p class="text-rose-800 leading-relaxed m-0">
              The Municipality enforces a <strong>60-day confirmed grace period</strong>. Accounts exceeding 60 days receive structured delinquency notices: <em>First Notice</em> &bull; <em>Second Notice</em> &bull; <em>Final Demand</em>. Accounts exceeding <strong>90 days in arrears</strong> become legally eligible for lease revocation under the exclusive executive authority of the <strong>Municipal Mayor</strong>.
            </p>
          </div>
        </div>

        <!-- Overdue Accounts Table -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 class="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <i class="pi pi-exclamation-triangle text-rose-600"></i>
                Overdue Accounts Ledger
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Past due rental statements and grace-period compliance status</p>
            </div>
            <Button 
              icon="pi pi-download" 
              label="Export Overdue Report" 
              size="small" 
              severity="secondary" 
              outlined 
              class="!py-1.5 !px-3 font-semibold text-xs"
              @click="exportBillingReport"
            />
          </div>

          <div v-if="overdueRows.length === 0" class="text-center py-16 text-slate-400">
            <i class="pi pi-check-circle text-5xl mb-3 text-emerald-400"></i>
            <p class="text-base font-semibold text-slate-700">No overdue accounts on record!</p>
            <p class="text-xs text-slate-400 mt-1">All tenants are current on rental dues or within allowable billing horizons.</p>
          </div>

          <DataTable 
            v-else
            :value="overdueRows" 
            class="p-datatable-sm" 
            responsiveLayout="scroll"
          >
            <!-- Stakeholder & Business -->
            <Column header="Stakeholder" style="min-width: 180px">
              <template #body="{ data }">
                <div class="font-bold text-slate-900 text-xs sm:text-sm">{{ data.stakeholder }}</div>
                <div v-if="data.businessName" class="text-xs text-slate-500">{{ data.businessName }}</div>
              </template>
            </Column>

            <!-- Assigned Stall -->
            <Column header="Stall" style="min-width: 110px">
              <template #body="{ data }">
                <span class="inline-block text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  Stall {{ data.stallNo || '—' }}
                </span>
              </template>
            </Column>

            <!-- Statement / Invoice -->
            <Column header="Statement #" style="min-width: 130px">
              <template #body="{ data }">
                <div class="font-mono text-xs font-bold text-slate-700">{{ data.id }}</div>
                <div class="text-[11px] text-slate-400">{{ formatPeriod(data.period) }}</div>
              </template>
            </Column>

            <!-- Due Date & Age -->
            <Column header="Due Date & Age" style="min-width: 140px">
              <template #body="{ data }">
                <div class="text-xs font-semibold text-slate-800">{{ formatDate(data.due) }}</div>
                <span class="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded mt-0.5">
                  <i class="pi pi-clock text-[10px]"></i>
                  {{ data.daysPastDue }} days past due
                </span>
              </template>
            </Column>

            <!-- Outstanding Balance -->
            <Column header="Overdue Balance" style="min-width: 120px">
              <template #body="{ data }">
                <span class="text-xs sm:text-sm font-extrabold text-rose-600">₱{{ Number(data.balance || 0).toLocaleString() }}</span>
              </template>
            </Column>

            <!-- Grace Period Status -->
            <Column header="60-Day Grace Period" style="min-width: 160px">
              <template #body="{ data }">
                <Tag 
                  :value="data.daysPastDue <= 60 ? 'WITHIN 60-DAY GRACE' : 'GRACE EXPIRED'" 
                  :severity="data.daysPastDue <= 60 ? 'warning' : 'danger'" 
                  rounded 
                  class="!text-[10px] !py-0.5 !px-2 font-bold"
                />
              </template>
            </Column>

            <!-- Notice Status -->
            <Column header="Notice Status" style="min-width: 150px">
              <template #body="{ data }">
                <span v-if="data.daysPastDue > 90" class="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded">
                  <i class="pi pi-shield text-[10px]"></i> Mayoral Revocation Eligible
                </span>
                <span v-else-if="data.noticeSent" class="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  <i class="pi pi-envelope text-[10px]"></i> Notice Dispatched
                </span>
                <span v-else class="text-xs text-slate-400 italic">None Issued</span>
              </template>
            </Column>

            <!-- Actions -->
            <Column header="Actions" style="min-width: 190px; text-align: right">
              <template #body="{ data }">
                <div class="flex items-center justify-end gap-1.5">
                  <Button 
                    icon="pi pi-credit-card" 
                    label="Pay" 
                    size="small" 
                    severity="success" 
                    class="!py-1 !px-2.5 !text-xs font-bold"
                    @click="collectPayment(data)"
                  />
                  <Button 
                    icon="pi pi-envelope" 
                    label="Notice" 
                    size="small" 
                    severity="warn" 
                    outlined
                    class="!py-1 !px-2 !text-xs font-bold"
                    title="Issue official overdue notice"
                    @click="openNoticeModal(data)"
                  />
                  <Button 
                    icon="pi pi-eye" 
                    size="small" 
                    outlined 
                    severity="secondary" 
                    class="!py-1 !px-2 text-slate-500"
                    title="View details"
                    @click="openBillDetails(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <!-- Bill Details Dialog -->
      <Dialog 
        v-model:visible="detailsDialogVisible" 
        modal 
        header="Billing Statement Details" 
        :style="{ width: '560px', maxWidth: '95vw' }"
        :dismissableMask="true"
      >
        <div v-if="selectedBill" id="printable-billing-statement" class="space-y-4 pt-2">
          <!-- Official Municipal Header -->
          <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #475569;">
              Republic of the Philippines &bull; Province of Misamis Oriental
            </div>
            <div style="font-weight: 800; font-size: 1rem; color: #0f172a;">
              MUNICIPALITY OF MANTICAO
            </div>
            <div style="font-size: 0.85rem; font-weight: 700; color: #1e3a8a;">
              OFFICE OF THE MUNICIPAL TREASURER
            </div>
            <div style="font-size: 0.95rem; font-weight: 800; color: #047857; margin-top: 4px;">
              OFFICIAL RENTAL BILLING STATEMENT
            </div>
          </div>

          <!-- Top Invoice Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span class="text-xs text-slate-400 font-semibold uppercase">Invoice Number</span>
              <h4 class="text-lg font-mono font-bold text-slate-800">{{ selectedBill.id }}</h4>
            </div>
            <Tag :value="selectedBill.status" :severity="getStatusSeverity(selectedBill.status)" rounded class="font-bold px-3 py-1" />
          </div>

          <!-- Tenant & Stall Info -->
          <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-slate-500 font-medium">Tenant Name:</span>
              <span class="font-bold text-slate-800">{{ selectedBill.stakeholder }}</span>
            </div>
            <div v-if="selectedBill.businessName" class="flex justify-between text-xs">
              <span class="text-slate-500 font-medium">Business:</span>
              <span class="font-semibold text-slate-700">{{ selectedBill.businessName }}</span>
            </div>
            <div v-if="selectedBill.stallNo" class="flex justify-between text-xs">
              <span class="text-slate-500 font-medium">Stall Assigned:</span>
              <span class="font-bold text-indigo-700">Stall {{ selectedBill.stallNo }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500 font-medium">Billing Period:</span>
              <span class="font-semibold text-slate-700">{{ formatPeriod(selectedBill.period) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500 font-medium">Payment Due Date:</span>
              <span class="font-bold text-slate-800">{{ formatDate(selectedBill.due) }}</span>
            </div>
          </div>

          <!-- Financial Breakdown -->
          <div class="space-y-2 pt-1">
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Total Billed:</span>
              <span class="font-bold text-slate-800">₱{{ Number(selectedBill.total || 0).toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Amount Paid:</span>
              <span class="font-bold text-emerald-600">₱{{ Number(selectedBill.paid || 0).toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-base font-extrabold pt-2 border-t border-slate-100">
              <span class="text-slate-700">Balance Due:</span>
              <span class="text-rose-600">₱{{ Number(selectedBill.balance || 0).toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between gap-2 w-full pt-3 flex-wrap">
            <div class="flex items-center gap-2">
              <Button 
                label="Close" 
                severity="secondary" 
                outlined 
                size="small" 
                @click="detailsDialogVisible = false" 
              />
              <Button 
                label="Export Word" 
                icon="pi pi-file-word" 
                severity="help" 
                size="small" 
                @click="exportStatementWord(selectedBill)" 
              />
              <Button 
                label="Export PDF" 
                icon="pi pi-file-pdf" 
                severity="danger" 
                size="small" 
                @click="exportStatementPdf(selectedBill)" 
              />
            </div>
            <div class="flex items-center gap-2">
              <Button 
                v-if="selectedBill && selectedBill.status !== 'PAID'"
                icon="pi pi-wallet" 
                label="Apply Credit" 
                severity="help" 
                size="small" 
                @click="detailsDialogVisible = false; openAllocateModal(selectedBill)" 
              />
              <Button 
                v-if="selectedBill && selectedBill.status !== 'PAID'"
                icon="pi pi-send" 
                label="Send Reminder" 
                severity="info" 
                outlined
                size="small" 
                @click="sendNotification(selectedBill)" 
              />
              <Button 
                v-if="selectedBill && selectedBill.status !== 'PAID'"
                icon="pi pi-credit-card" 
                label="Collect Payment" 
                severity="success" 
                size="small" 
                @click="collectPayment(selectedBill)" 
              />
            </div>
          </div>
        </template>
      </Dialog>

      <!-- ALLOCATE ADVANCE CREDIT MODAL (Confirmed Decision 2: Allocated without counting as duplicate cash revenue) -->
      <Dialog
        v-model:visible="showAllocateModal"
        modal
        header="Allocate 2-Month Advance Rental Credit"
        :style="{ width: '480px', maxWidth: '95vw' }"
        :dismissableMask="true"
      >
        <div v-if="allocateTargetBill" class="space-y-4 pt-2">
          <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-900 leading-relaxed">
            <div class="font-bold mb-1 flex items-center gap-1.5 text-indigo-950">
              <i class="pi pi-info-circle text-indigo-600"></i>
              Non-Revenue Advance Credit Allocation
            </div>
            Applying existing advance rental credit offsets this bill's balance directly. It is <strong>NOT</strong> recorded as new cash collection in daily treasury reports.
          </div>

          <div class="space-y-2 text-sm bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div class="flex justify-between">
              <span class="text-slate-500">Payee / Lessee:</span>
              <span class="font-bold text-slate-800">{{ allocateTargetBill.stakeholder }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Target Statement:</span>
              <span class="font-mono font-bold text-slate-700">{{ allocateTargetBill.id }} ({{ formatPeriod(allocateTargetBill.period) }})</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Statement Balance:</span>
              <span class="font-bold text-rose-600">₱{{ Number(allocateTargetBill.balance || 0).toLocaleString() }}</span>
            </div>
            <div class="flex justify-between pt-2 border-t border-slate-200">
              <span class="text-slate-500">Available Advance Credit:</span>
              <span class="font-black text-emerald-700">₱{{ Number(availableAdvanceCredit || 0).toLocaleString() }}</span>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 uppercase">Amount to Allocate (₱) *</label>
            <input
              v-model.number="allocateAmount"
              type="number"
              min="1"
              :max="Math.min(allocateTargetBill.balance || 0, availableAdvanceCredit || 0)"
              class="w-full border border-slate-300 rounded-xl p-2.5 text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span class="text-[11px] text-slate-400">Cannot exceed remaining bill balance or available credit.</span>
          </div>

          <div v-if="availableAdvanceCredit <= 0" class="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            This stakeholder has no available advance credit on record. You can collect regular payments via the Pay button.
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2 w-full pt-3">
            <Button label="Cancel" severity="secondary" outlined size="small" @click="showAllocateModal = false" />
            <Button
              label="Confirm Allocation"
              icon="pi pi-check"
              severity="help"
              size="small"
              :loading="isAllocating"
              :disabled="isAllocating || allocateAmount <= 0 || availableAdvanceCredit <= 0"
              @click="submitAllocateCredit"
            />
          </div>
        </template>
      </Dialog>

      <!-- QUICK DAILY / PARTIAL COLLECTION MODAL -->
      <Dialog
        v-model:visible="showDailyModal"
        modal
        header="Record Daily Market Collection"
        :style="{ width: '480px', maxWidth: '95vw' }"
        :dismissableMask="true"
      >
        <div v-if="dailyTargetBill" class="space-y-4 pt-2">
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
            Record actual daily partial payments (e.g., ₱100 daily towards a ₱3,000 monthly rent). Each micro-payment immediately decrements the bill's outstanding balance.
          </div>

          <div class="space-y-2 text-sm bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div class="flex justify-between">
              <span class="text-slate-500">Payee:</span>
              <span class="font-bold text-slate-800">{{ dailyTargetBill.stakeholder }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Current Balance:</span>
              <span class="font-black text-rose-600">₱{{ Number(dailyTargetBill.balance || 0).toLocaleString() }}</span>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 uppercase">Collection Amount (₱) *</label>
            <input
              v-model.number="dailyAmount"
              type="number"
              min="1"
              :max="dailyTargetBill.balance || 99999"
              class="w-full border border-slate-300 rounded-xl p-2.5 text-base font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 100"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 uppercase">Official Receipt # (O.R.) *</label>
            <input
              v-model="dailyReceiptNo"
              type="text"
              class="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="OR-DLY-..."
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 uppercase">Collector Notes / Field Route</label>
            <input
              v-model="dailyNotes"
              type="text"
              class="w-full border border-slate-300 rounded-xl p-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Daily field collector route notes"
            />
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2 w-full pt-3">
            <Button label="Cancel" severity="secondary" outlined size="small" @click="showDailyModal = false" />
            <Button
              label="Save Daily Collection"
              icon="pi pi-check"
              severity="success"
              size="small"
              :loading="isSubmittingDaily"
              :disabled="isSubmittingDaily || dailyAmount <= 0 || !dailyReceiptNo"
              @click="submitDailyCollection"
            />
          </div>
        </template>
      </Dialog>

      <!-- OFFICIAL DELINQUENCY NOTICE MODAL -->
      <Dialog
        v-model:visible="showNoticeDialog"
        modal
        header="Issue Official Overdue Notice"
        :style="{ width: '500px', maxWidth: '95vw' }"
        :dismissableMask="true"
      >
        <div v-if="noticeTargetBill" class="space-y-4 pt-2">
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
            Issue official delinquency warning to <strong>{{ noticeTargetBill.stakeholder }}</strong> regarding past due rental statement <strong>{{ noticeTargetBill.id }}</strong> (₱{{ Number(noticeTargetBill.balance || 0).toLocaleString() }}).
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 uppercase">Notice Escalation Stage *</label>
            <select
              v-model="noticeType"
              class="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="FIRST_NOTICE">1st Notice of Overdue Rental (After 60-Day Grace)</option>
              <option value="SECOND_NOTICE">2nd Delinquency Notice</option>
              <option value="FINAL_DEMAND">Final Demand Notice (Pre-Revocation)</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 uppercase">Issuing Official / Office</label>
            <input
              v-model="noticeIssuer"
              type="text"
              class="w-full border border-slate-300 rounded-xl p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 uppercase">Official Instructions / Remarks</label>
            <textarea
              v-model="noticeRemarks"
              rows="3"
              class="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="e.g. Settle balance at Treasury within 7 working days to avoid Mayoral lease revocation proceedings..."
            ></textarea>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2 w-full pt-3">
            <Button label="Cancel" severity="secondary" outlined size="small" @click="showNoticeDialog = false" />
            <Button
              label="Issue & Dispatch Notice"
              icon="pi pi-send"
              severity="warn"
              size="small"
              :loading="isIssuingNotice"
              @click="submitNotice"
            />
          </div>
        </template>
      </Dialog>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import api from '../services/api'
import { fetchBillings as getBillingsApi, sendBillingNotification } from '../services/billingService'
import TreasurerMenu from '../components/TreasurerMenu.vue'
import SearchField from '../components/SearchField.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import systemMessage from '../utils/systemMessage'
import { exportToWord, exportToPdf, printElement } from '../utils/exportUtils'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const isSendingBulkReminders = ref(false)
const isGeneratingBills = ref(false)

// Main tab navigation: BILLS, ADVANCE_CREDIT, OVERDUE
const mainBillingView = ref('BILLS')
function setMainView(mode) {
  mainBillingView.value = mode
}

const search = ref('')
const rows = ref([])
const allStakeholders = ref([])
const advanceCreditsList = ref([])
const noticesList = ref([])
const loading = ref(false)
const activeFilter = ref('ALL') // ALL, PAST_DUE, THIS_MONTH, ADVANCE, UNPAID, PAID

// Dialog state
const detailsDialogVisible = ref(false)
const selectedBill = ref(null)

// Advance Credit Allocation Dialog state
const showAllocateModal = ref(false)
const allocateTargetBill = ref(null)
const allocateAmount = ref(0)
const availableAdvanceCredit = ref(0)
const isAllocating = ref(false)

// Daily Collection Dialog state
const showDailyModal = ref(false)
const dailyTargetBill = ref(null)
const dailyAmount = ref(100)
const dailyReceiptNo = ref('')
const dailyCollectorName = ref('Municipal Treasury Collector')
const dailyNotes = ref('')
const isSubmittingDaily = ref(false)

// Delinquency Notice Modal state
const showNoticeDialog = ref(false)
const noticeTargetBill = ref(null)
const noticeType = ref('FIRST_NOTICE')
const noticeIssuer = ref('Office of the Municipal Treasurer')
const noticeRemarks = ref('')
const isIssuingNotice = ref(false)

const now = new Date()
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
const currentMonth = now.getMonth() + 1
const currentYear = now.getFullYear()

/* =========================
   FETCH BACKEND DATA
========================= */
async function fetchBillings() {
  loading.value = true

  try {
    const data = await getBillingsApi()

    rows.value = (data || []).map(b => {
      const st = b.occupant?.stakeholder || b.stakeholderObj || b.stakeholder || {}
      const stFirstName = st.firstName || st.first_name || ''
      const stLastName = st.lastName || st.last_name || ''
      const stFullName = `${stFirstName} ${stLastName}`.trim()
      const businessName = st.businessName || st.business_name || b.businessName || ''
      const stakeholderLabel = (b.stakeholder && b.stakeholder !== 'Verified Tenant')
        ? b.stakeholder
        : (stFullName || businessName || b.occupantName || b.occupant_name || 'Verified Tenant')
      const stallNo = b.stallNo || b.stall_no || b.contract?.stall?.stallNo || b.contract?.stall?.stall_no || ''
      const stakeholderId = b.stakeholderId || st.id || b.occupant?.stakeholderId || b.occupant?.stakeholder_id

      const totalVal = Number(b.totalAmount ?? b.total_amount ?? b.total ?? 0)
      const paidVal = Number(b.paidAmount ?? b.paid_amount ?? b.paid ?? 0)
      const balanceVal = Number(b.balance ?? Math.max(totalVal - paidVal, 0))

      const dueDateStr = b.dueDate || b.due_date || b.due || null
      let computedStatus = (b.status || '').toUpperCase()
      let daysPastDue = 0
      let isWithinGracePeriod = false

      if (balanceVal <= 0) {
        computedStatus = 'PAID'
      } else {
        const todayStr = new Date().toISOString().split('T')[0]
        const isPastDueDate = dueDateStr && todayStr > dueDateStr
        if (isPastDueDate) {
          daysPastDue = Math.floor((Date.now() - new Date(dueDateStr).getTime()) / (1000 * 60 * 60 * 24))
          // Confirmed Decision 4: 2-month grace period (60 days)
          if (daysPastDue > 60) {
            computedStatus = 'OVERDUE'
          } else {
            isWithinGracePeriod = true
            computedStatus = paidVal > 0 ? 'PARTIALLY_PAID' : 'UNPAID'
          }
        } else if (paidVal > 0 && balanceVal > 0) {
          computedStatus = 'PARTIALLY_PAID'
        } else if (!computedStatus || computedStatus === 'OVERDUE') {
          computedStatus = 'UNPAID'
        }
      }

      return {
        ...b,
        rawId: b.rawId || b.id,
        id: b.billingNo || b.billing_no || (b.id ? `BILL-${b.id}` : 'N/A'),
        billingNo: b.billingNo || b.billing_no || (b.id ? `BILL-${b.id}` : ''),
        stakeholder: stakeholderLabel,
        stakeholderId,
        businessName,
        stallNo,
        period: b.billingPeriod || b.billing_period || b.period || 'N/A',
        total: totalVal,
        paid: paidVal,
        balance: balanceVal,
        due: dueDateStr || 'N/A',
        status: computedStatus,
        daysPastDue,
        isWithinGracePeriod,
        email: (b.email || st.email || b.stakeholderEmail || b.occupant?.email || '').trim(),
        stakeholderEmail: (b.email || st.email || b.stakeholderEmail || b.occupant?.email || '').trim()
      }
    })

    // Fetch related records for Advance Credit Ledger & Overdue Notices
    try {
      const [shRes, acRes, notRes] = await Promise.allSettled([
        api.get('/stakeholders'),
        api.get('/advance-credits'),
        api.get('/notices')
      ])
      if (shRes.status === 'fulfilled') {
        allStakeholders.value = Array.isArray(shRes.value?.data) ? shRes.value.data : []
      }
      if (acRes.status === 'fulfilled') {
        advanceCreditsList.value = Array.isArray(acRes.value?.data) ? acRes.value.data : []
      }
      if (notRes.status === 'fulfilled') {
        noticesList.value = Array.isArray(notRes.value?.data) ? notRes.value.data : []
      }
    } catch (_) {}
  } catch (err) {
    console.error('Error loading billings', err)
    toast.add({
      severity: 'error',
      summary: 'Load Error',
      detail: 'Failed to fetch billing records. Please check your connection.',
      life: 4000
    })
  } finally {
    loading.value = false
  }
}

/* =========================
   FILTER & GROUP BY STAKEHOLDER
========================= */
const pastDueCount = computed(() => rows.value.filter(isPastDue).length)
const thisMonthCount = computed(() => rows.value.filter(isThisMonth).length)
const advanceCount = computed(() => rows.value.filter(isNextTwoMonths).length)
const unpaidCount = computed(() => rows.value.filter(r => r.status !== 'PAID').length)
const paidCount = computed(() => rows.value.filter(r => r.status === 'PAID').length)

const filteredRows = computed(() => {
  const query = search.value.toLowerCase().trim()

  return rows.value.filter(r => {
    // 1. Filter by category
    if (activeFilter.value === 'PAST_DUE' && !isPastDue(r)) return false
    if (activeFilter.value === 'THIS_MONTH' && !isThisMonth(r)) return false
    if (activeFilter.value === 'ADVANCE' && !isNextTwoMonths(r)) return false
    if (activeFilter.value === 'UNPAID' && r.status === 'PAID') return false
    if (activeFilter.value === 'PAID' && r.status !== 'PAID') return false

    // 2. Filter by search text
    if (!query) return true
    return (
      (r.stakeholder || '').toLowerCase().includes(query) ||
      (r.businessName || '').toLowerCase().includes(query) ||
      (r.stallNo || '').toLowerCase().includes(query) ||
      (r.id || '').toLowerCase().includes(query) ||
      (r.period || '').toLowerCase().includes(query)
    )
  })
})

const totalInvoiced = computed(() => rows.value.reduce((sum, r) => sum + r.total, 0))
const totalPaid = computed(() => rows.value.reduce((sum, r) => sum + r.paid, 0))
const totalBalance = computed(() => rows.value.reduce((sum, r) => sum + r.balance, 0))

const stakeholderGroups = computed(() => {
  const groupsMap = new Map()

  for (const r of filteredRows.value) {
    const key = r.stakeholder || 'Verified Tenant'
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        stakeholder: key,
        stakeholderId: r.stakeholderId,
        businessName: r.businessName || '',
        stallNo: r.stallNo || '',
        bills: []
      })
    }
    const group = groupsMap.get(key)
    if (!group.stallNo && r.stallNo) group.stallNo = r.stallNo
    if (!group.businessName && r.businessName) group.businessName = r.businessName
    if (!group.stakeholderId && r.stakeholderId) group.stakeholderId = r.stakeholderId
    group.bills.push(r)
  }

  const groups = Array.from(groupsMap.values()).map(g => {
    // Sort bills: past due first, then this month, then future advance months
    g.bills.sort((a, b) => (a.due || '').localeCompare(b.due || ''))
    g.totalInvoiced = g.bills.reduce((sum, b) => sum + (Number(b.total) || 0), 0)
    g.totalPaid = g.bills.reduce((sum, b) => sum + (Number(b.paid) || 0), 0)
    g.totalBalance = g.bills.reduce((sum, b) => sum + (Number(b.balance) || 0), 0)
    return g
  })

  // Sort groups alphabetically by stakeholder name
  groups.sort((a, b) => a.stakeholder.localeCompare(b.stakeholder))
  return groups
})

function clearFilters() {
  activeFilter.value = 'ALL'
  search.value = ''
}

/* =========================
   SCHEDULE & COLOR CLASSIFIER
========================= */
function parsePeriod(periodStr) {
  if (!periodStr || typeof periodStr !== 'string') return null
  const match = periodStr.match(/MONTHLY-(\d+)-(\d+)/i)
  if (match) {
    return { month: parseInt(match[1], 10), year: parseInt(match[2], 10) }
  }
  const dateMatch = periodStr.match(/(\d{4})-(\d{1,2})/)
  if (dateMatch) {
    return { month: parseInt(dateMatch[2], 10), year: parseInt(dateMatch[1], 10) }
  }
  const words = periodStr.trim().split(/\s+/)
  if (words.length === 2) {
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const mIdx = monthNames.findIndex(m => words[0].toLowerCase().startsWith(m))
    const yr = parseInt(words[1], 10)
    if (mIdx !== -1 && !isNaN(yr)) {
      return { month: mIdx + 1, year: yr }
    }
  }
  return null
}

function isPastDue(row) {
  if (row.status === 'PAID') return false
  if (row.status === 'OVERDUE') return true
  if (!row.due || row.due === 'N/A') return false
  const due = new Date(row.due)
  if (isNaN(due.getTime())) return false
  return due < todayStart
}


function isThisMonth(row) {
  if (isPastDue(row)) return false
  const p = parsePeriod(row.period)
  if (p) {
    return p.month === currentMonth && p.year === currentYear
  }
  if (row.due && row.due !== 'N/A') {
    const d = new Date(row.due)
    if (!isNaN(d.getTime())) {
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear
    }
  }
  return false
}

function isNextTwoMonths(row) {
  if (isPastDue(row) || isThisMonth(row)) return false
  const p = parsePeriod(row.period)
  let m, y
  if (p) {
    m = p.month
    y = p.year
  } else if (row.due && row.due !== 'N/A') {
    const d = new Date(row.due)
    if (!isNaN(d.getTime())) {
      m = d.getMonth() + 1
      y = d.getFullYear()
    }
  }
  if (m && y) {
    const diff = (y - currentYear) * 12 + (m - currentMonth)
    return diff >= 1 && diff <= 2
  }
  return false
}

function getRowClass(data) {
  if (isPastDue(data)) return 'row-past-due'
  if (isThisMonth(data)) return 'row-this-month'
  if (isNextTwoMonths(data)) return 'row-advance-month'
  return ''
}

/* =========================
   FORMATTERS & HELPERS
========================= */
function formatPeriod(period) {
  if (!period || period === 'N/A') return '—'
  if (typeof period === 'string' && period.startsWith('MONTHLY-')) {
    const parts = period.split('-')
    if (parts.length === 3) {
      const monthNum = parseInt(parts[1], 10)
      const year = parts[2]
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      if (monthNum >= 1 && monthNum <= 12) {
        return `${monthNames[monthNum - 1]} ${year}`
      }
    }
  }
  return period
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === 'N/A') return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
  } catch (e) {
    return dateStr
  }
}

function getStatusSeverity(status) {
  switch (status) {
    case 'PAID': return 'success'
    case 'UNPAID': return 'warning'
    case 'PARTIAL':
    case 'PARTIALLY_PAID': return 'info'
    case 'OVERDUE': return 'danger'
    default: return 'secondary'
  }
}

function initials(name) {
  if (!name || name === 'Unknown') return 'TN'
  const clean = name.replace(/[^a-zA-Z\s]/g, '').trim()
  if (!clean) return 'TN'
  return clean.split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

/* =========================
   ACTIONS
========================= */
async function sendNotification(row) {
  try {
    const res = await sendBillingNotification(row.rawId || row.billingNo || row.id, {
      email: row.email || row.stakeholderEmail,
      stallNo: row.stallNo,
      stakeholderId: row.stakeholderId
    })
    const emailTarget = res?.targetEmail || res?.emailResult?.email || row.email
    const emailMsg = emailTarget ? ` & emailed to ${emailTarget}` : ''
    toast.add({
      severity: 'success',
      summary: 'Reminder Dispatched',
      detail: `Billing reminder recorded${emailMsg} for ${row.stakeholder}.`,
      life: 5000
    })
  } catch (err) {
    console.error('Failed to send notification', err)
    toast.add({
      severity: 'error',
      summary: 'Notification Failed',
      detail: 'Could not send reminder notification.',
      life: 4000
    })
  }
}

async function sendBulkDueReminders() {
  const dueBills = rows.value.filter(r => (Number(r.balance || 0) > 0) && (isPastDue(r) || isThisMonth(r) || r.status !== 'PAID'))
  if (dueBills.length === 0) {
    toast.add({
      severity: 'info',
      summary: 'No Due Bills',
      detail: 'There are currently no unpaid bills due this month or past due.',
      life: 4000
    })
    return
  }

  const confirmed = await systemMessage.confirm(
    `Send official email notices and in-app reminders to ${dueBills.length} stakeholder(s) with bills due soon or past due?`,
    {
      title: 'Dispatch Due Reminders',
      acceptLabel: 'Send Reminders',
      rejectLabel: 'Cancel'
    }
  )

  if (!confirmed) return

  isSendingBulkReminders.value = true
  try {
    const { sendBulkBillingDueNotifications } = await import('../services/emailNotificationService')
    const res = await sendBulkBillingDueNotifications(dueBills)
    toast.add({
      severity: 'success',
      summary: 'Due Reminders Dispatched',
      detail: `Successfully emailed and notified ${res.sent} stakeholder(s).`,
      life: 5500
    })
  } catch (err) {
    console.error('Error sending bulk billing reminders:', err)
    toast.add({
      severity: 'error',
      summary: 'Dispatch Error',
      detail: err.message || 'Could not send bulk reminders.',
      life: 4500
    })
  } finally {
    isSendingBulkReminders.value = false
  }
}

function collectPayment(row) {
  detailsDialogVisible.value = false
  const sId = row.stakeholderId || row.occupant?.stakeholder_id || row.occupant?.stakeholderId
  router.push({
    name: 'Payment',
    query: {
      stakeholderId: sId || '',
      billingId: row.rawId || row.id || '',
      category: 'RENT_PAYMENT'
    }
  })
}

function openBillDetails(row) {
  selectedBill.value = row
  detailsDialogVisible.value = true
}

function exportStatementWord(b) {
  const bill = b || selectedBill.value
  const targetId = 'printable-billing-statement'
  const filename = `Billing_Statement_${bill?.id || bill?.billingNo || 'Official'}`
  exportToWord(targetId, filename, {
    title: `MUNICIPAL BILLING STATEMENT - ${bill?.id || 'STATEMENT'}`
  })
}

function exportStatementPdf(b) {
  const bill = b || selectedBill.value
  const targetId = 'printable-billing-statement'
  const filename = `Billing_Statement_${bill?.id || bill?.billingNo || 'Official'}.pdf`
  exportToPdf(targetId, filename, {
    title: `MUNICIPAL BILLING STATEMENT - ${bill?.id || 'STATEMENT'}`
  })
}

/* =========================
   ADVANCE CREDIT ALLOCATION
========================= */
async function openAllocateModal(row) {
  allocateTargetBill.value = row
  availableAdvanceCredit.value = 0
  allocateAmount.value = 0
  showAllocateModal.value = true

  const shId = row.stakeholderId || row.occupant?.stakeholder_id || row.occupant?.stakeholderId
  if (!shId) return

  try {
    const res = await api.get(`/advance-credits/stakeholder/${shId}`)
    const credits = Array.isArray(res.data) ? res.data : []
    const totalAvail = credits.reduce((sum, c) => sum + Number(c.available_amount ?? c.availableAmount ?? 0), 0)
    
    // Fallback to stakeholder advance_balance if advance_credits table has not yet populated
    if (totalAvail <= 0) {
      const shRes = await api.get(`/stakeholders/${shId}`)
      const shBal = Number(shRes.data?.advance_balance ?? shRes.data?.advanceBalance ?? 0)
      availableAdvanceCredit.value = shBal
    } else {
      availableAdvanceCredit.value = totalAvail
    }

    allocateAmount.value = Math.min(Number(row.balance || 0), availableAdvanceCredit.value)
  } catch (err) {
    console.warn('Error loading advance credits:', err)
  }
}

async function submitAllocateCredit() {
  if (!allocateTargetBill.value || allocateAmount.value <= 0) return
  isAllocating.value = true

  try {
    const res = await api.post('/advance-credits/allocate', {
      billingId: allocateTargetBill.value.rawId || allocateTargetBill.value.id,
      amount: allocateAmount.value,
      stakeholderId: allocateTargetBill.value.stakeholderId,
      authorizedByName: 'Municipal Treasurer'
    })

    toast.add({
      severity: 'success',
      summary: 'Advance Credit Applied',
      detail: `Successfully allocated ₱${allocateAmount.value.toLocaleString()} to ${allocateTargetBill.value.id}. Balance updated.`,
      life: 5000
    })

    showAllocateModal.value = false
    allocateTargetBill.value = null
    await fetchBillings()
  } catch (err) {
    console.error('Failed to allocate credit:', err)
    toast.add({
      severity: 'error',
      summary: 'Allocation Failed',
      detail: err.message || 'Could not allocate advance credit.',
      life: 4500
    })
  } finally {
    isAllocating.value = false
  }
}

/* =========================
   DAILY MICRO COLLECTIONS
========================= */
function openDailyModal(row) {
  dailyTargetBill.value = row
  dailyAmount.value = Math.min(100, Number(row.balance || 100))
  dailyReceiptNo.value = `OR-DLY-${Date.now().toString().slice(-6)}`
  dailyCollectorName.value = 'Daily Market Collector'
  dailyNotes.value = `Daily collection for Stall ${row.stallNo || 'WS'}`
  showDailyModal.value = true
}

async function submitDailyCollection() {
  if (!dailyTargetBill.value || dailyAmount.value <= 0) return
  isSubmittingDaily.value = true

  try {
    await api.post('/collections/daily', {
      billingId: dailyTargetBill.value.rawId || dailyTargetBill.value.id,
      amount: dailyAmount.value,
      receiptNo: dailyReceiptNo.value,
      collectorName: dailyCollectorName.value,
      notes: dailyNotes.value
    })

    toast.add({
      severity: 'success',
      summary: 'Daily Collection Recorded',
      detail: `Recorded ₱${dailyAmount.value.toLocaleString()} (Receipt: ${dailyReceiptNo.value}) for ${dailyTargetBill.value.id}.`,
      life: 5000
    })

    showDailyModal.value = false
    dailyTargetBill.value = null
    await fetchBillings()
  } catch (err) {
    console.error('Failed to record daily collection:', err)
    toast.add({
      severity: 'error',
      summary: 'Collection Error',
      detail: err.message || 'Could not record daily collection.',
      life: 4500
    })
  } finally {
    isSubmittingDaily.value = false
  }
}

/* ========================================================
   ADVANCE CREDIT LEDGER & OVERDUE ACCOUNTS COMPUTED
======================================================== */
const overdueRows = computed(() => {
  return rows.value
    .filter(r => Number(r.balance || 0) > 0 && (r.status === 'OVERDUE' || isPastDue(r)))
    .map(r => {
      const hasNotice = noticesList.value.some(n => Number(n.stakeholder_id || n.stakeholderId) === Number(r.stakeholderId))
      return {
        ...r,
        noticeSent: hasNotice
      }
    })
})

const totalOverdueArrears = computed(() => {
  return overdueRows.value.reduce((sum, r) => sum + Number(r.balance || 0), 0)
})

const criticalRevocationCount = computed(() => {
  return overdueRows.value.filter(r => Number(r.daysPastDue || 0) > 90).length
})

const advanceCreditStakeholders = computed(() => {
  const map = new Map()

  for (const s of allStakeholders.value) {
    const sId = s.id
    const orig = Number(s.total_advance_amount || s.advance_payment_amount || 6000)
    const avail = Number(s.advance_balance ?? (s.advance_payment_paid ? 6000 : 0))
    if (avail > 0 || orig > 0 || s.advance_payment_paid || s.advance_receipt_no) {
      const allocated = Math.max(0, orig - avail)
      map.set(sId, {
        stakeholderId: sId,
        stakeholder: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.username || 'Stakeholder',
        businessName: s.business_name || '',
        stallNo: s.selected_stall_id || s.stall_no || '',
        originatingReceipt: s.advance_receipt_no || 'OR-ADV-INITIAL',
        receiptDate: s.created_at || s.updated_at,
        originalAdvance: orig,
        allocatedAmount: allocated,
        availableBalance: avail,
        status: avail > 0 ? (allocated > 0 ? 'PARTIALLY_ALLOCATED' : 'AVAILABLE') : 'FULLY_ALLOCATED'
      })
    }
  }

  for (const c of advanceCreditsList.value) {
    const sId = c.stakeholder_id || c.stakeholderId
    const sh = c.stakeholder || {}
    const orig = Number(c.amount || 6000)
    const avail = Number(c.available_amount ?? c.availableAmount ?? 0)
    const allocated = Number(c.allocated_amount ?? c.allocatedAmount ?? Math.max(0, orig - avail))
    map.set(sId, {
      stakeholderId: sId,
      stakeholder: map.get(sId)?.stakeholder || `${sh.first_name || ''} ${sh.last_name || ''}`.trim() || 'Stakeholder',
      businessName: map.get(sId)?.businessName || sh.business_name || '',
      stallNo: map.get(sId)?.stallNo || '',
      originatingReceipt: c.receipt_no || c.receiptNo || map.get(sId)?.originatingReceipt || 'OR-ADV-INITIAL',
      receiptDate: c.created_at || map.get(sId)?.receiptDate,
      originalAdvance: orig,
      allocatedAmount: allocated,
      availableBalance: avail,
      status: avail > 0 ? (allocated > 0 ? 'PARTIALLY_ALLOCATED' : 'AVAILABLE') : 'FULLY_ALLOCATED'
    })
  }

  return Array.from(map.values()).sort((a, b) => b.availableBalance - a.availableBalance)
})

const totalAdvanceDeposited = computed(() => {
  return advanceCreditStakeholders.value.reduce((sum, s) => sum + Number(s.originalAdvance || 0), 0)
})

const totalAdvanceAllocated = computed(() => {
  return advanceCreditStakeholders.value.reduce((sum, s) => sum + Number(s.allocatedAmount || 0), 0)
})

const totalAdvanceAvailable = computed(() => {
  return advanceCreditStakeholders.value.reduce((sum, s) => sum + Number(s.availableBalance || 0), 0)
})

/* =========================
   LEDGER & NOTICE ACTIONS
========================= */
function openAllocateFromLedger(ledgerRow) {
  const unpaidBill = rows.value.find(r => Number(r.stakeholderId) === Number(ledgerRow.stakeholderId) && Number(r.balance || 0) > 0)
  if (!unpaidBill) {
    toast.add({
      severity: 'info',
      summary: 'No Unpaid Bills',
      detail: `${ledgerRow.stakeholder} currently has no outstanding bills to allocate credit towards.`,
      life: 4000
    })
    return
  }
  openAllocateModal(unpaidBill)
}

function openNoticeModal(row) {
  noticeTargetBill.value = row
  noticeType.value = row.daysPastDue > 90 ? 'FINAL_DEMAND' : (row.daysPastDue > 60 ? 'SECOND_NOTICE' : 'FIRST_NOTICE')
  noticeIssuer.value = 'Office of the Municipal Treasurer'
  noticeRemarks.value = `Immediate settlement required for overdue rental statement ${row.id} (₱${Number(row.balance).toLocaleString()}).`
  showNoticeDialog.value = true
}

async function submitNotice() {
  if (!noticeTargetBill.value) return
  isIssuingNotice.value = true
  try {
    const { issueOverdueNotice } = await import('../services/billingService')
    await issueOverdueNotice({
      contractId: noticeTargetBill.value.contractId || noticeTargetBill.value.contract?.id || 1,
      stakeholderId: noticeTargetBill.value.stakeholderId,
      billingIds: [noticeTargetBill.value.rawId || noticeTargetBill.value.id],
      noticeType: noticeType.value,
      balanceSnapshot: noticeTargetBill.value.balance,
      daysOverdue: noticeTargetBill.value.daysPastDue,
      notes: noticeRemarks.value,
      issuerName: noticeIssuer.value
    })

    toast.add({
      severity: 'success',
      summary: 'Notice Dispatched',
      detail: `Official ${noticeType.value} successfully recorded and dispatched for ${noticeTargetBill.value.stakeholder}.`,
      life: 5000
    })
    showNoticeDialog.value = false
    noticeTargetBill.value = null
    await fetchBillings()
  } catch (err) {
    console.error('Failed to issue notice:', err)
    toast.add({
      severity: 'error',
      summary: 'Notice Error',
      detail: err.message || 'Could not issue notice.',
      life: 4500
    })
  } finally {
    isIssuingNotice.value = false
  }
}

async function generateMonthlyBillsAction() {
  isGeneratingBills.value = true
  try {
    const { ensureBillingsForVerifiedTenants } = await import('../services/billingService')
    await ensureBillingsForVerifiedTenants({ force: true })
    toast.add({
      severity: 'success',
      summary: 'Billing Generation Complete',
      detail: 'Monthly rental billing statements generated for all active eligible leases without duplicates.',
      life: 5000
    })
    await fetchBillings()
  } catch (err) {
    console.error('Error generating bills:', err)
    toast.add({
      severity: 'error',
      summary: 'Generation Failed',
      detail: err.message || 'Could not generate bills.',
      life: 4500
    })
  } finally {
    isGeneratingBills.value = false
  }
}

function exportBillingReport() {
  const exportData = mainBillingView.value === 'OVERDUE' ? overdueRows.value : rows.value
  if (!exportData || exportData.length === 0) {
    toast.add({ severity: 'warn', summary: 'Export Empty', detail: 'No data to export.', life: 3000 })
    return
  }
  const billsData = exportData.map(r => ({
    'Invoice #': r.id,
    'Stakeholder': r.stakeholder,
    'Business': r.businessName || '—',
    'Stall': r.stallNo || '—',
    'Period': r.period,
    'Due Date': r.due,
    'Total Due': r.total,
    'Paid': r.paid,
    'Balance': r.balance,
    'Status': r.status,
    'Days Past Due': r.daysPastDue || 0
  }))

  const headers = Object.keys(billsData[0] || {}).join(',')
  const csvRows = billsData.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...csvRows].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `Manticao_Market_${mainBillingView.value}_Report_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  toast.add({
    severity: 'info',
    summary: 'Report Exported',
    detail: 'Report exported to CSV successfully.',
    life: 3000
  })
}

// Watch query parameters for immediate view switching
watch(() => route.query.tab, (tab) => {
  if (tab === 'advance-credit') {
    mainBillingView.value = 'ADVANCE_CREDIT'
  } else if (tab === 'overdue') {
    mainBillingView.value = 'OVERDUE'
  } else if (tab === 'outstanding') {
    mainBillingView.value = 'BILLS'
    activeFilter.value = 'UNPAID'
  } else if (tab === 'collections') {
    mainBillingView.value = 'BILLS'
    activeFilter.value = 'ALL'
  }
}, { immediate: true })

/* =========================
   LIFECYCLE
========================= */
onMounted(() => {
  fetchBillings()
  try {
    const app = document.getElementById('app')
    if (app) app.classList.add('full-bleed')
  } catch (e) {}
})

onUnmounted(() => {
  try {
    const app = document.getElementById('app')
    if (app) app.classList.remove('full-bleed')
  } catch (e) {}
})
</script>

<style scoped src="../styles/Treasurer/Billing.css"></style>
