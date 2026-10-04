<template>
  <div class="layout min-h-screen bg-slate-50">
    <TreasurerMenu />

    <main class="page-container">
      
      <!-- HEADER -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span class="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <i class="pi pi-wallet text-2xl"></i>
            </span>
            Payments
          </h1>
          <p class="text-sm text-slate-500 mt-1">Manage and record stakeholder payments</p>
        </div>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div class="w-full sm:w-80">
            <SearchField v-model="tableSearch" placeholder="Search payment records..." />
          </div>
          <Button label="Record Payment" icon="pi pi-plus" @click="openModal" class="shadow-sm whitespace-nowrap w-full sm:w-auto !bg-[#11382b] !border-[#11382b] hover:!bg-[#0c281e]" />
        </div>
      </div>

      <!-- REPORT-STYLE SUMMARY STATS CARDS -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon green">
            <i class="pi pi-check-circle text-xl"></i>
          </div>
          <div class="summary-content">
            <span class="summary-label">Total Collected</span>
            <span class="summary-value">₱{{ totalAmountCollected.toLocaleString() }}</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon blue">
            <i class="pi pi-wallet text-xl"></i>
          </div>
          <div class="summary-content">
            <span class="summary-label">Total Transactions</span>
            <span class="summary-value">{{ filteredPayments.length }}</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon amber">
            <i class="pi pi-users text-xl"></i>
          </div>
          <div class="summary-content">
            <span class="summary-label">Stakeholders</span>
            <span class="summary-value">{{ stakeholderPaymentGroups.length }}</span>
          </div>
        </div>
      </div>

      <!-- Loading Skeleton or Spinner -->
      <div v-if="loading" class="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 shadow-sm">
        <i class="pi pi-spin pi-spinner text-3xl text-indigo-600 mb-3"></i>
        <p class="font-medium text-sm">Loading payment records...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="stakeholderPaymentGroups.length === 0" class="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 shadow-sm">
        <i class="pi pi-wallet text-4xl mb-3 text-slate-300"></i>
        <p class="font-medium text-slate-600">No payments found matching the criteria.</p>
      </div>

      <!-- Separate Card/Box per Stakeholder -->
      <div v-else class="space-y-6">
        <div 
          v-for="group in stakeholderPaymentGroups" 
          :key="group.stakeholder"
          class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
        >
          <!-- Box Header: Profile Avatar, Stakeholder Name, Stall Occupied, Totals -->
          <div class="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-slate-50/80 to-white border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-3.5">
              <!-- Profile Avatar Circle -->
              <div class="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-sm shadow-xs border border-indigo-200 flex-shrink-0">
                {{ initials(group.stakeholder) }}
              </div>
              
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                    {{ group.stakeholder }}
                  </h3>
                  
                  <!-- Stall Occupied Badge -->
                  <span v-if="group.stallNo" class="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg shadow-xs">
                    <i class="pi pi-shop text-[11px]"></i>
                    Stall {{ group.stallNo }}
                  </span>

                  <!-- Verified Tenant Tag -->
                  <Tag value="VERIFIED TENANT" severity="success" rounded class="!text-[10px] !py-0.5 !px-2 font-bold" />
                </div>

                <p v-if="group.businessName && group.businessName !== group.stakeholder" class="text-xs text-slate-500 font-medium mt-0.5">
                  {{ group.businessName }}
                </p>
              </div>
            </div>

            <!-- Group Financial Summary in Header -->
            <div class="flex items-center gap-4 text-xs font-semibold bg-white px-4 py-2 rounded-xl border border-slate-200/80 shadow-xs self-start md:self-auto">
              <span>Total Paid: <strong class="text-emerald-600">₱{{ group.totalAmount.toLocaleString() }}</strong></span>
              <span class="text-slate-200">|</span>
              <span>Transactions: <strong class="text-slate-800">{{ group.payments.length }}</strong></span>
            </div>
          </div>

          <!-- Payments Table inside the Stakeholder Box -->
          <div class="overflow-x-auto">
            <DataTable 
              :value="group.payments" 
              responsiveLayout="scroll"
              class="p-datatable-sm modern-table"
            >
              <Column field="id" header="Payment ID" sortable style="min-width: 120px;">
                <template #body="{ data }">
                  <span class="font-mono text-sm font-bold text-slate-600">#{{ data.id }}</span>
                </template>
              </Column>

              <Column header="Type" sortable sortField="paymentType" style="min-width: 170px;">
                <template #body="{ data }">
                  <Tag :value="formatType(data.paymentType || data.payment_type)" severity="info" rounded class="!bg-blue-50 !text-blue-600 !font-semibold border border-blue-100" />
                </template>
              </Column>

              <Column header="Rent Cycle" sortable sortField="rentCycle" style="min-width: 130px;">
                <template #body="{ data }">
                  <span v-if="data.rentCycle || data.rent_cycle">{{ formatType(data.rentCycle || data.rent_cycle) }}</span>
                  <span v-else class="text-slate-400">—</span>
                </template>
              </Column>

              <Column field="amount" header="Amount" sortable style="min-width: 120px;">
                <template #body="{ data }">
                  <span class="font-bold text-emerald-600">₱{{ Number(data.amount || 0).toLocaleString() }}</span>
                </template>
              </Column>

              <Column header="Receipt" sortable sortField="receiptNo" style="min-width: 140px;">
                <template #body="{ data }">
                  <span class="font-mono text-xs font-bold text-slate-700">{{ data.receiptNo || data.receipt_no || '—' }}</span>
                </template>
              </Column>
              
              <Column header="Reference" style="min-width: 130px;">
                <template #body="{ data }">
                  <span v-if="data.referenceNo || data.reference_no">{{ data.referenceNo || data.reference_no }}</span>
                  <span v-else class="text-slate-400">—</span>
                </template>
              </Column>

              <Column header="Date" sortable sortField="paymentDate" style="min-width: 120px;">
                <template #body="{ data }">
                  {{ formatDate(data.paymentDate || data.payment_date) }}
                </template>
              </Column>

              <Column header="Action" alignFrozen="right" :frozen="true" class="text-right" style="min-width: 130px;">
                <template #body="{ data }">
                  <Button 
                    label="View Details" 
                    icon="pi pi-eye" 
                    size="small" 
                    outlined 
                    severity="secondary" 
                    @click="openDetailsModal(data)"
                    class="!py-1.5 !px-3 !text-xs !font-semibold hover:!bg-slate-100 shadow-2xs"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </div>

      <!-- RECORD PAYMENT MODAL -->
      <Dialog v-model:visible="showModal" modal :closable="false" :focusOnShow="false"
              :style="{ width: '96vw', maxWidth: '680px' }" 
              :breakpoints="{ '960px': '96vw', '640px': '98vw' }" 
              class="ledger-dialog"
              :pt="{
                root: { class: '!rounded-3xl !border !border-slate-200 !shadow-2xl overflow-hidden' },
                content: { class: '!p-0 !bg-[#fcfbf9]' }
              }">
        <div class="bg-[#fdfdfc] text-slate-800 font-sans max-h-[90vh] flex flex-col">
          
          <!-- Header (Always visible at top) -->
          <div class="flex items-start justify-between gap-4 p-6 sm:p-7 pb-4 border-b border-slate-200/80 bg-white flex-shrink-0 z-20">
            <div>
              <span class="text-[11px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 inline-block mb-1">RECORD PAYMENT</span>
              <h2 class="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">Record stakeholder payment</h2>
              <p class="text-xs text-slate-500 mt-1">Fields marked with an asterisk are required.</p>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center text-lg shadow-xs" title="Record Payment">
                <i class="pi pi-wallet"></i>
              </div>
              <button type="button" @click="closeModal" class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer" title="Close">
                <i class="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Scrollable Body with Form Fields -->
          <div class="p-6 sm:p-8 overflow-y-auto flex-1 custom-scroll">
            <form @submit.prevent="recordPayment" id="recordPaymentForm" class="space-y-6">
              
              <!-- STAKEHOLDER NAME (HIGH Z-INDEX SO DROPDOWN FLOATS IN FRONT) -->
              <div class="flex flex-col gap-2 relative z-50 stakeholder-field-wrapper mb-6" style="position: relative; z-index: 50; margin-bottom: 1.75rem;">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-bold text-slate-800">Stakeholder name <span class="text-rose-500">*</span></label>
                  <span v-if="selectedStakeholder" class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Selected</span>
                </div>
                
                <div class="relative z-50 stakeholder-input-wrapper" style="position: relative; z-index: 50;">
                  <input
                    type="text"
                    v-model="stakeholderSearch"
                    @focus="isStakeholderDropdownOpen = true"
                    @input="isStakeholderDropdownOpen = true; if(selectedStakeholder) selectedStakeholder = null"
                    @blur="onStakeholderBlur"
                    placeholder="Search stakeholder by name, business, or stall..."
                    class="w-full h-12 px-4 pr-10 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 bg-[#fafafa] focus:bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#133e35]/20 focus:border-[#133e35] transition-all"
                  />
                  <button
                    v-if="stakeholderSearch"
                    type="button"
                    @click="resetSelection"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 text-xs cursor-pointer z-10"
                    title="Clear"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                  <i v-else class="pi pi-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none z-10"></i>

                  <!-- Floating Dropdown list of matching stakeholders (RENDERED IN FRONT OF ALL ELEMENTS) -->
                  <div
                    v-if="isStakeholderDropdownOpen"
                    class="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2 custom-scroll stakeholder-dropdown-menu"
                    style="z-index: 1000; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08);"
                  >
                    <div v-if="filteredStakeholdersForDropdown.length > 0">
                      <div
                        v-for="s in filteredStakeholdersForDropdown"
                        :key="s.id"
                        @mousedown.prevent="chooseStakeholder(s)"
                        class="p-2.5 rounded-xl hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between transition-colors border-b border-slate-100 last:border-none group"
                      >
                        <div class="flex items-center gap-2.5 min-w-0">
                          <div class="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-700 group-hover:text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0 transition-colors">
                            {{ initials(s.firstName, s.lastName) }}
                          </div>
                          <div class="min-w-0">
                            <div class="font-bold text-sm text-slate-900 group-hover:text-emerald-950 truncate">{{ s.firstName }} {{ s.lastName }}</div>
                            <div class="text-xs text-slate-500 truncate">
                              {{ s.businessName || 'Applicant' }}
                              <span v-if="s.occupant?.stall?.stallNo || s.selectedStall?.stallNo">
                                • Stall {{ s.occupant?.stall?.stallNo || s.selectedStall?.stallNo }}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div class="text-right text-xs font-bold text-slate-600 flex-shrink-0 ml-2">
                          <span v-if="activeCategory === 'ADVANCE_PAYMENT'" class="text-indigo-600">
                            ₱{{ Number(s.advanceBalance || 0).toLocaleString() }}
                          </span>
                          <span v-else-if="activeCategory === 'RENT_PAYMENT'" class="text-rose-600">
                            ₱{{ getTotalUnpaidAmount(s).toLocaleString() }}
                          </span>
                          <span v-else class="text-amber-600">Fee Pending</span>
                        </div>
                      </div>
                    </div>
                    <div v-else-if="stakeholderSearch" class="p-4 text-center text-xs text-slate-400">
                      <i class="pi pi-search text-base mb-1 block text-slate-300"></i>
                      No stakeholders found matching "{{ stakeholderSearch }}"
                    </div>
                  </div>
                </div>
              </div>

              <!-- PAYMENT TYPE (LOWER Z-INDEX TO PREVENT OVERLAY ISSUES) -->
              <div class="flex flex-col gap-2 relative z-1" style="position: relative; z-index: 1;">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-bold text-slate-800">Payment type <span class="text-rose-500">*</span></label>
                  <span class="text-xs text-slate-400">Select one option</span>
                </div>
                
                <div class="grid grid-cols-3 gap-2.5 sm:gap-4">
                  
                  <!-- Card 01: Advance payment -->
                  <div
                    @click="setCategory('ADVANCE_PAYMENT')"
                    class="group border rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between min-h-[120px] sm:min-h-[135px] cursor-pointer transition-all duration-200 select-none relative overflow-hidden active:scale-[0.98]"
                    :class="activeCategory === 'ADVANCE_PAYMENT'
                      ? 'border-2 border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/80 hover:shadow-sm'"
                  >
                    <!-- Active top accent glow line -->
                    <div 
                      v-if="activeCategory === 'ADVANCE_PAYMENT'" 
                      class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"
                    ></div>

                    <div class="flex items-center justify-between mb-2 sm:mb-3">
                      <span 
                        class="text-xs sm:text-sm font-bold font-mono transition-colors"
                        :class="activeCategory === 'ADVANCE_PAYMENT' ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'"
                      >01</span>

                      <!-- Interactive Green Check Indicator -->
                      <div 
                        class="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xs"
                        :class="activeCategory === 'ADVANCE_PAYMENT' 
                          ? 'bg-emerald-600 text-white scale-100 shadow-emerald-200 ring-2 ring-emerald-100 check-pop' 
                          : 'border-2 border-slate-200 bg-slate-50/80 text-transparent group-hover:border-emerald-300 group-hover:bg-emerald-50/50'"
                      >
                        <i 
                          class="pi pi-check text-[11px] font-black transition-transform duration-200"
                          :class="activeCategory === 'ADVANCE_PAYMENT' ? 'scale-100' : 'scale-0'"
                        ></i>
                      </div>
                    </div>

                    <div>
                      <div 
                        class="text-xs sm:text-sm leading-tight transition-colors"
                        :class="activeCategory === 'ADVANCE_PAYMENT' ? 'font-extrabold text-emerald-950' : 'font-bold text-slate-800 group-hover:text-slate-900'"
                      >
                        Advance payment
                      </div>
                      <div 
                        class="text-[11px] sm:text-xs mt-1 leading-normal transition-colors"
                        :class="activeCategory === 'ADVANCE_PAYMENT' ? 'text-emerald-800/80' : 'text-slate-500'"
                      >
                        Payment received in advance
                      </div>
                    </div>
                  </div>

                  <!-- Card 02: Business permit / Application payment -->
                  <div
                    @click="setCategory('BUSINESS_PERMIT_PAYMENT')"
                    class="group border rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between min-h-[120px] sm:min-h-[135px] cursor-pointer transition-all duration-200 select-none relative overflow-hidden active:scale-[0.98]"
                    :class="isPermitOrApp(activeCategory)
                      ? 'border-2 border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/80 hover:shadow-sm'"
                  >
                    <!-- Active top accent glow line -->
                    <div 
                      v-if="isPermitOrApp(activeCategory)" 
                      class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"
                    ></div>

                    <div class="flex items-center justify-between mb-2 sm:mb-3">
                      <span 
                        class="text-xs sm:text-sm font-bold font-mono transition-colors"
                        :class="isPermitOrApp(activeCategory) ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'"
                      >02</span>

                      <!-- Interactive Green Check Indicator -->
                      <div 
                        class="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xs"
                        :class="isPermitOrApp(activeCategory) 
                          ? 'bg-emerald-600 text-white scale-100 shadow-emerald-200 ring-2 ring-emerald-100 check-pop' 
                          : 'border-2 border-slate-200 bg-slate-50/80 text-transparent group-hover:border-emerald-300 group-hover:bg-emerald-50/50'"
                      >
                        <i 
                          class="pi pi-check text-[11px] font-black transition-transform duration-200"
                          :class="isPermitOrApp(activeCategory) ? 'scale-100' : 'scale-0'"
                        ></i>
                      </div>
                    </div>

                    <div>
                      <div 
                        class="text-xs sm:text-sm leading-tight transition-colors"
                        :class="isPermitOrApp(activeCategory) ? 'font-extrabold text-emerald-950' : 'font-bold text-slate-800 group-hover:text-slate-900'"
                      >
                        Business permit / Application
                      </div>
                      <div 
                        class="text-[11px] sm:text-xs mt-1 leading-normal transition-colors"
                        :class="isPermitOrApp(activeCategory) ? 'text-emerald-800/80' : 'text-slate-500'"
                      >
                        Application fee & business permit
                      </div>
                    </div>
                  </div>

                  <!-- Card 03: Contract stall payment -->
                  <div
                    @click="setCategory('RENT_PAYMENT')"
                    class="group border rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between min-h-[120px] sm:min-h-[135px] cursor-pointer transition-all duration-200 select-none relative overflow-hidden active:scale-[0.98]"
                    :class="activeCategory === 'RENT_PAYMENT'
                      ? 'border-2 border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/80 hover:shadow-sm'"
                  >
                    <!-- Active top accent glow line -->
                    <div 
                      v-if="activeCategory === 'RENT_PAYMENT'" 
                      class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"
                    ></div>

                    <div class="flex items-center justify-between mb-2 sm:mb-3">
                      <span 
                        class="text-xs sm:text-sm font-bold font-mono transition-colors"
                        :class="activeCategory === 'RENT_PAYMENT' ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'"
                      >03</span>

                      <!-- Interactive Green Check Indicator -->
                      <div 
                        class="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xs"
                        :class="activeCategory === 'RENT_PAYMENT' 
                          ? 'bg-emerald-600 text-white scale-100 shadow-emerald-200 ring-2 ring-emerald-100 check-pop' 
                          : 'border-2 border-slate-200 bg-slate-50/80 text-transparent group-hover:border-emerald-300 group-hover:bg-emerald-50/50'"
                      >
                        <i 
                          class="pi pi-check text-[11px] font-black transition-transform duration-200"
                          :class="activeCategory === 'RENT_PAYMENT' ? 'scale-100' : 'scale-0'"
                        ></i>
                      </div>
                    </div>

                    <div>
                      <div 
                        class="text-xs sm:text-sm leading-tight transition-colors"
                        :class="activeCategory === 'RENT_PAYMENT' ? 'font-extrabold text-emerald-950' : 'font-bold text-slate-800 group-hover:text-slate-900'"
                      >
                        Contract stall payment
                      </div>
                      <div 
                        class="text-[11px] sm:text-xs mt-1 leading-normal transition-colors"
                        :class="activeCategory === 'RENT_PAYMENT' ? 'text-emerald-800/80' : 'text-slate-500'"
                      >
                        Stall payment under a contract
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Total Advance Amount (if Advance Payment) -->
              <div v-if="activeCategory === 'ADVANCE_PAYMENT'" class="flex flex-col gap-1.5 p-4 bg-amber-50/40 border border-amber-200/80 rounded-xl relative z-1">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-slate-800">Total required advance amount <span class="text-rose-500">*</span></label>
                  <span v-if="selectedStakeholder" class="text-xs text-slate-500">Paid so far: ₱{{ Number(selectedStakeholder?.advanceBalance || 0).toLocaleString() }}</span>
                </div>
                <InputNumber v-model="form.totalAdvanceAmount" mode="currency" currency="PHP" locale="en-PH" class="w-full" placeholder="₱ 0.00" />
              </div>

              <!-- Select Billing Statement (if Contract Stall Payment) -->
              <div v-if="activeCategory === 'RENT_PAYMENT' && selectedStakeholder" class="flex flex-col gap-1.5 p-4 bg-slate-50 border border-slate-200 rounded-xl relative z-1">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-slate-800">Select billing statement <span class="text-rose-500">*</span></label>
                  <span class="text-xs text-slate-500">{{ selectedStakeholderBillings.length }} unpaid statement(s)</span>
                </div>
                <div v-if="selectedStakeholderBillings.length" class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  <div
                    v-for="b in selectedStakeholderBillings"
                    :key="b.id"
                    @click="selectBilling(b)"
                    class="p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between select-none"
                    :class="selectedBillingId === b.id ? 'border-2 border-[#133e35] bg-[#eff6f2]' : 'border-slate-200 bg-white hover:border-slate-300'"
                  >
                    <div>
                      <div class="text-xs font-bold text-slate-900">{{ b.billingNo }}</div>
                      <div class="text-[11px] text-slate-500 mt-0.5">Due: {{ formatDate(b.dueDate) }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm font-extrabold text-rose-600">₱{{ Number(b.balance || 0).toLocaleString() }}</div>
                      <div v-if="selectedBillingId === b.id" class="text-[10px] font-bold text-[#133e35]">Selected</div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-xs text-slate-400 py-1">
                  No unpaid billing statements recorded for this tenant.
                </div>
              </div>

              <!-- STANDARDIZED 2-COLUMN INPUT FIELDS GRID -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-1">
                
                <!-- Amount received * -->
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-bold text-slate-800">Amount received <span class="text-rose-500">*</span></label>
                  <InputNumber
                    v-model="form.amount"
                    mode="currency"
                    currency="PHP"
                    locale="en-PH"
                    class="w-full font-bold"
                    placeholder="₱ 0.00"
                  />
                </div>

                <!-- Date received * -->
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-bold text-slate-800">Date received <span class="text-rose-500">*</span></label>
                  <div class="relative">
                    <input
                      type="date"
                      v-model="form.dateReceived"
                      class="w-full h-12 px-4 pr-10 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#133e35]/20 focus:border-[#133e35]"
                    />
                    <i class="pi pi-calendar absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                  </div>
                </div>

                <!-- Reference number -->
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-bold text-slate-800">Reference number</label>
                  <input
                    type="text"
                    v-model="form.referenceNo"
                    placeholder="e.g. CHQ-1048"
                    class="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#133e35]/20 focus:border-[#133e35]"
                  />
                  <span class="text-xs text-slate-400">Cheque, transfer, or receipt number (optional)</span>
                </div>

                <!-- Official receipt number * -->
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-bold text-slate-800">Official receipt number <span class="text-rose-500">*</span></label>
                    <button type="button" @click="regenerateReceiptNo" class="text-xs text-[#133e35] hover:text-emerald-950 font-semibold flex items-center gap-1 cursor-pointer">
                      <i class="pi pi-refresh text-[10px]"></i> Auto-generate
                    </button>
                  </div>
                  <div class="relative">
                    <input
                      type="text"
                      v-model="form.receiptNo"
                      placeholder="Receipt #"
                      class="w-full h-12 px-4 pl-10 font-mono text-xs sm:text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#133e35]/20 focus:border-[#133e35]"
                    />
                    <i class="pi pi-receipt absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  </div>
                </div>

              </div>

              <!-- NOTES (FULL-WIDTH TEXTAREA) -->
              <div class="flex flex-col gap-2 relative z-10">
                <label class="text-sm font-bold text-slate-800">Notes</label>
                <textarea
                  v-model="form.notes"
                  rows="3"
                  placeholder="Add any context for this payment record..."
                  class="w-full p-4 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 bg-white placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#133e35]/20 focus:border-[#133e35]"
                ></textarea>
              </div>

            </form>
          </div>

          <!-- Sticky Footer (Always visible at the bottom of the modal) -->
          <div class="flex items-center justify-between p-4 sm:p-6 border-t border-slate-200/80 bg-white/95 backdrop-blur-xs flex-shrink-0 z-30">
            <div class="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <i class="pi pi-lock text-slate-400 text-xs"></i>
              <span class="hidden sm:inline">Saved to the internal market ledger</span>
              <span class="sm:hidden text-[11px]">Internal ledger</span>
            </div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="recordPaymentForm"
                :disabled="isSubmitting"
                class="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none bg-[#133e35] hover:bg-[#0c2b24] active:scale-95"
              >
                <span>{{ isSubmitting ? 'Recording...' : 'Record payment' }}</span>
                <i v-if="!isSubmitting" class="pi pi-arrow-right text-xs"></i>
                <i v-else class="pi pi-spin pi-spinner text-xs"></i>
              </button>
            </div>
          </div>

        </div>
      </Dialog>

      <!-- VIEW PAYMENT DETAILS MODAL -->
      <Dialog 
        v-model:visible="showDetailsModal" 
        modal 
        :closable="false" 
        :focusOnShow="false"
        :style="{ width: '96vw', maxWidth: '620px' }" 
        :breakpoints="{ '960px': '96vw', '640px': '98vw' }" 
        class="ledger-dialog"
        :pt="{
          root: { class: '!rounded-3xl !border !border-slate-200 !shadow-2xl overflow-hidden' },
          content: { class: '!p-0 !bg-[#fcfbf9]' }
        }"
      >
        <div v-if="selectedPaymentDetails" class="bg-[#fdfdfc] text-slate-800 font-sans max-h-[90vh] flex flex-col">
          
          <!-- Header -->
          <div class="flex items-start justify-between gap-4 p-6 sm:p-7 pb-4 border-b border-slate-200/80 bg-white flex-shrink-0">
            <div>
              <span class="text-[11px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 inline-block mb-1">
                TRANSACTION DETAILS
              </span>
              <h2 class="text-2xl font-serif font-bold text-slate-900 tracking-tight">Payment #{{ selectedPaymentDetails.id }}</h2>
              <p class="text-xs text-slate-500 mt-1">Recorded on {{ formatDateTime(selectedPaymentDetails.paymentDate || selectedPaymentDetails.payment_date) }}</p>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center text-lg shadow-xs">
                <i class="pi pi-receipt"></i>
              </div>
              <button 
                type="button" 
                @click="closeDetailsModal" 
                class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer" 
                title="Close"
              >
                <i class="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="p-6 sm:p-7 overflow-y-auto flex-1 space-y-5">
            
            <!-- Amount & Receipt Highlight Card -->
            <div class="bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-5 rounded-2xl border border-emerald-200/80 flex items-center justify-between shadow-xs">
              <div>
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Paid</p>
                <p class="text-3xl font-extrabold text-emerald-700 mt-1">
                  ₱{{ Number(selectedPaymentDetails.amount || 0).toLocaleString() }}
                </p>
              </div>
              <div class="text-right">
                <Tag 
                  :value="formatType(selectedPaymentDetails.paymentType || selectedPaymentDetails.payment_type)" 
                  severity="info" 
                  rounded 
                  class="!bg-emerald-100 !text-emerald-800 !font-bold border border-emerald-200 mb-1" 
                />
                <p class="text-xs font-mono font-bold text-slate-600 mt-1">
                  OR: {{ selectedPaymentDetails.receiptNo || selectedPaymentDetails.receipt_no || '—' }}
                </p>
              </div>
            </div>

            <!-- Stakeholder Profile Card -->
            <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div class="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Stakeholder Profile</span>
                <span v-if="getStakeholder(selectedPaymentDetails)?.id" class="text-[11px] font-mono font-semibold text-slate-500">
                  ID: #{{ getStakeholder(selectedPaymentDetails)?.id }}
                </span>
              </div>
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-sm shadow-xs border border-indigo-200 flex-shrink-0">
                  {{ initials(getStakeholder(selectedPaymentDetails)?.firstName || getStakeholder(selectedPaymentDetails)?.first_name, getStakeholder(selectedPaymentDetails)?.lastName || getStakeholder(selectedPaymentDetails)?.last_name) }}
                </div>
                <div class="min-w-0">
                  <h4 class="font-bold text-slate-900 text-base">
                    {{ getStakeholder(selectedPaymentDetails)?.firstName || getStakeholder(selectedPaymentDetails)?.first_name || 'Unknown' }} {{ getStakeholder(selectedPaymentDetails)?.lastName || getStakeholder(selectedPaymentDetails)?.last_name || '' }}
                  </h4>
                  <div class="flex items-center gap-2 flex-wrap text-xs text-slate-500 mt-0.5">
                    <span>{{ getStakeholder(selectedPaymentDetails)?.businessName || getStakeholder(selectedPaymentDetails)?.business_name || 'Stakeholder' }}</span>
                    <span v-if="getStakeholder(selectedPaymentDetails)?.selectedStall?.stallNo || getStakeholder(selectedPaymentDetails)?.occupant?.stall?.stallNo" class="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.2 rounded-md">
                      Stall {{ getStakeholder(selectedPaymentDetails)?.selectedStall?.stallNo || getStakeholder(selectedPaymentDetails)?.occupant?.stall?.stallNo }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Transaction Details Grid -->
            <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3 border-b border-slate-100 pb-2">Transaction Details</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-xs text-slate-400 font-medium block">Payment ID</span>
                  <span class="font-mono font-bold text-slate-800">#{{ selectedPaymentDetails.id }}</span>
                </div>
                <div>
                  <span class="text-xs text-slate-400 font-medium block">Official Receipt (OR)</span>
                  <span class="font-mono font-bold text-slate-800">{{ selectedPaymentDetails.receiptNo || selectedPaymentDetails.receipt_no || '—' }}</span>
                </div>
                <div>
                  <span class="text-xs text-slate-400 font-medium block">Reference / Check No.</span>
                  <span class="font-medium text-slate-800">{{ selectedPaymentDetails.referenceNo || selectedPaymentDetails.reference_no || 'None' }}</span>
                </div>
                <div>
                  <span class="text-xs text-slate-400 font-medium block">Payment Date</span>
                  <span class="font-medium text-slate-800">{{ formatDateTime(selectedPaymentDetails.paymentDate || selectedPaymentDetails.payment_date) }}</span>
                </div>
                <div>
                  <span class="text-xs text-slate-400 font-medium block">Payment Type</span>
                  <span class="font-medium text-slate-800">{{ formatType(selectedPaymentDetails.paymentType || selectedPaymentDetails.payment_type) }}</span>
                </div>
                <div v-if="selectedPaymentDetails.rentCycle || selectedPaymentDetails.rent_cycle">
                  <span class="text-xs text-slate-400 font-medium block">Rent Cycle</span>
                  <span class="font-medium text-slate-800">{{ formatType(selectedPaymentDetails.rentCycle || selectedPaymentDetails.rent_cycle) }}</span>
                </div>
              </div>
            </div>

            <!-- Linked Billing Details (If available) -->
            <div v-if="selectedPaymentDetails.billing" class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3 border-b border-slate-100 pb-2">Linked Billing Statement</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-xs text-slate-400 font-medium block">Billing Invoice</span>
                  <span class="font-mono font-bold text-slate-800">{{ selectedPaymentDetails.billing.billingNo || selectedPaymentDetails.billing.billing_no || `#${selectedPaymentDetails.billing.id}` }}</span>
                </div>
                <div>
                  <span class="text-xs text-slate-400 font-medium block">Billing Period</span>
                  <span class="font-medium text-slate-800">{{ selectedPaymentDetails.billing.billingPeriod || selectedPaymentDetails.billing.billing_period || 'N/A' }}</span>
                </div>
                <div>
                  <span class="text-xs text-slate-400 font-medium block">Remaining Balance</span>
                  <span class="font-bold text-rose-600">₱{{ Number(selectedPaymentDetails.billing.balance || 0).toLocaleString() }}</span>
                </div>
                <div>
                  <span class="text-xs text-slate-400 font-medium block">Billing Status</span>
                  <Tag :value="selectedPaymentDetails.billing.status || 'UNPAID'" rounded class="font-bold px-2 py-0.5 text-xs" />
                </div>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="p-4 sm:p-5 border-t border-slate-200/80 bg-white flex items-center justify-end gap-3 flex-shrink-0">
            <Button 
              label="Close" 
              icon="pi pi-times" 
              outlined 
              severity="secondary" 
              @click="closeDetailsModal"
              class="!px-5 !py-2.5 !rounded-xl !font-bold text-sm"
            />
          </div>

        </div>
      </Dialog>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import api, { normalizeRecord } from '../services/api'
import { fetchPayments, createPayment } from '../services/paymentService'
import { fetchBillings } from '../services/billingService'
import TreasurerMenu from '../components/TreasurerMenu.vue'
import SearchField from '../components/SearchField.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'

// =========================
// STATE
// =========================
const toast = useToast()
const loading = ref(true)
const isSubmitting = ref(false)
const payments = ref([])
const stakeholders = ref([])
const billings = ref([])

const tableSearch = ref('')

// Details modal state
const showDetailsModal = ref(false)
const selectedPaymentDetails = ref(null)

function openDetailsModal(payment) {
  selectedPaymentDetails.value = payment
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  selectedPaymentDetails.value = null
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return dateStr
  }
}

// Modal state
const showModal = ref(false)
const activeCategory = ref('ADVANCE_PAYMENT')
const selectedStakeholder = ref(null)
const selectedPaymentType = ref('ADVANCE_PAYMENT')
const selectedBillingId = ref(null)

// Stakeholder searchable dropdown inside modal
const stakeholderSearch = ref('')
const isStakeholderDropdownOpen = ref(false)

// Search fields for the 3 separated columns
const searchAdvance = ref('')
const searchAppForm = ref('')
const searchRent = ref('')

const form = ref({
  paymentType: 'ADVANCE_PAYMENT',
  totalAdvanceAmount: null,
  amount: null,
  referenceNo: '',
  receiptNo: '',
  dateReceived: new Date().toISOString().split('T')[0],
  paymentMethod: 'Cash',
  notes: ''
})

// =========================
// LIFECYCLE
// =========================
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      loadPayments(),
      loadStakeholders(),
      loadBillings()
    ])
  } finally {
    loading.value = false
  }
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

// =========================
// LOADERS
// =========================
async function loadPayments() {
  try {
    const raw = await fetchPayments()
    payments.value = (raw || []).map(p => {
      const norm = normalizeRecord(p)
      if (p.stakeholder) {
        norm.stakeholder = normalizeRecord(p.stakeholder)
      }
      return norm
    })
  } catch (error) { console.error(error) }
}

async function loadStakeholders() {
  try {
    const response = await api.get('/stakeholders')
    stakeholders.value = (response.data || []).map(normalizeRecord).filter(s => !s.isArchived)
  } catch (error) { console.error(error) }
}

async function loadBillings() {
  try {
    billings.value = await fetchBillings()
  } catch (error) { console.error(error) }
}

// Helper to reliably resolve a stakeholder object for table display
function getStakeholder(data) {
  if (data?.stakeholder && (data.stakeholder.firstName || data.stakeholder.first_name || data.stakeholder.lastName || data.stakeholder.last_name)) {
    return data.stakeholder
  }
  const sId = data?.stakeholderId || data?.stakeholder_id || data?.stakeholder?.id
  if (sId && stakeholders.value && stakeholders.value.length > 0) {
    const found = stakeholders.value.find(s => Number(s.id) === Number(sId))
    if (found) return found
  }
  return data?.stakeholder || null
}

// =========================
// HELPERS
// =========================
function isAdvanceFinished(s) {
  if (Boolean(s.advancePaymentPaid || s.advancePaymentCompleted || s.advancePayment)) return true
  const total = Number(s.totalAdvanceAmount || 0)
  const bal = Number(s.advanceBalance || 0)
  if (total > 0 && bal >= total) return true
  return false
}

function getUnpaidBillingsForStakeholder(stakeholderId) {
  if (!stakeholderId) return []
  return billings.value.filter(b => {
    const bid = b.stakeholderId || b.stakeholder?.id
    return b.status !== 'PAID' && Number(bid) === Number(stakeholderId) && Number(b.balance || 0) > 0
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
}

function hasUnpaidBillings(s) {
  return getUnpaidBillingsForStakeholder(s.id).length > 0
}

function getTotalUnpaidAmount(s) {
  const list = getUnpaidBillingsForStakeholder(s.id)
  return list.reduce((sum, b) => sum + Number(b.balance || 0), 0)
}

// =========================
// 3 SEPARATED COLUMN LISTS
// =========================

// 1. Advance Payment List: ONLY approved stakeholders whose advance payment is NOT finished
const advancePaymentStakeholders = computed(() => {
  const search = searchAdvance.value.toLowerCase().trim()
  return stakeholders.value.filter(s => {
    // MUST be approved by Treasurer first
    if (!s.treasurerApproved) return false
    // Must NOT be finished with advance payment
    if (isAdvanceFinished(s)) return false
    if (s.isArchived) return false
    if (s.applicationStatus === 'REJECTED' || s.onboardingStatus === 'REJECTED') return false

    if (!search) return true
    const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase()
    const bName = (s.businessName || '').toLowerCase()
    const stall = (s.occupant?.stall?.stallNo || s.selectedStall?.stallNo || '').toLowerCase()
    return name.includes(search) || bName.includes(search) || stall.includes(search)
  })
})

// 2. Application Form / Business Permit List: ONLY stakeholders whose application fee / business permit fee is NOT finished/paid
const appFormStakeholders = computed(() => {
  const search = searchAppForm.value.toLowerCase().trim()
  return stakeholders.value.filter(s => {
    if (s.applicantFeePaid || s.applicant_fee_paid || s.treasurerPaid || s.treasurer_paid || s.applicationFormPaid || s.application_form_paid || s.verifiedTenant || s.verified_tenant) return false
    if (s.isArchived) return false
    if (s.applicationStatus === 'REJECTED' || s.onboardingStatus === 'REJECTED') return false

    if (!search) return true
    const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase()
    const bName = (s.businessName || '').toLowerCase()
    const stall = (s.occupant?.stall?.stallNo || s.selectedStall?.stallNo || '').toLowerCase()
    return name.includes(search) || bName.includes(search) || stall.includes(search)
  })
})

// 3. Rent Payment List: ONLY tenants who have occupied stalls AND have unpaid billings
const rentPaymentStakeholders = computed(() => {
  const search = searchRent.value.toLowerCase().trim()
  return stakeholders.value.filter(s => {
    const hasStallOrOccupant = Boolean(s.occupant?.stall || s.stall || s.selectedStall || s.verifiedTenant || s.verified_tenant)
    if (!hasStallOrOccupant) return false
    if (!hasUnpaidBillings(s)) return false
    if (s.isArchived) return false

    if (!search) return true
    const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase()
    const bName = (s.businessName || '').toLowerCase()
    const stall = (s.occupant?.stall?.stallNo || s.selectedStall?.stallNo || s.stall?.stallNo || '').toLowerCase()
    return name.includes(search) || bName.includes(search) || stall.includes(search)
  })
})

// Billings for currently selected stakeholder
const selectedStakeholderBillings = computed(() => {
  if (!selectedStakeholder.value) return []
  return getUnpaidBillingsForStakeholder(selectedStakeholder.value.id)
})

// Main Table filter
const filteredPayments = computed(() => {
  const search = tableSearch.value.toLowerCase().trim()
  if (!search) return payments.value
  return payments.value.filter(p => {
    const s = getStakeholder(p)
    const name = `${s?.firstName || s?.first_name || ''} ${s?.lastName || s?.last_name || ''}`.toLowerCase()
    const bName = (s?.businessName || s?.business_name || '').toLowerCase()
    const pType = formatType(p.paymentType || p.payment_type).toLowerCase()
    const receipt = (p.receiptNo || p.receipt_no || '').toLowerCase()
    const ref = (p.referenceNo || p.reference_no || '').toLowerCase()
    const stall = (s?.occupant?.stall?.stallNo || s?.selectedStall?.stallNo || s?.stall?.stallNo || s?.stallNo || s?.stall_no || p.stallNo || '').toLowerCase()
    return name.includes(search) || 
           bName.includes(search) || 
           pType.includes(search) || 
           String(p.id).includes(search) || 
           receipt.includes(search) || 
           ref.includes(search) ||
           stall.includes(search)
  })
})

const totalAmountCollected = computed(() => {
  return filteredPayments.value.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
})

const stakeholderPaymentGroups = computed(() => {
  const groupsMap = new Map()

  for (const p of filteredPayments.value) {
    const s = getStakeholder(p)
    const firstName = s?.firstName || s?.first_name || ''
    const lastName = s?.lastName || s?.last_name || ''
    const fullName = `${firstName} ${lastName}`.trim() || s?.businessName || s?.business_name || 'Verified Tenant'
    const businessName = s?.businessName || s?.business_name || ''
    const stallNo = s?.occupant?.stall?.stallNo || s?.selectedStall?.stallNo || s?.stall?.stallNo || s?.stallNo || s?.stall_no || p.stallNo || ''
    const stakeholderId = s?.id || p.stakeholderId || p.stakeholder_id || fullName

    const key = stakeholderId ? `s_${stakeholderId}` : fullName

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        id: stakeholderId,
        stakeholder: fullName,
        firstName,
        lastName,
        businessName,
        stallNo,
        payments: []
      })
    }

    const group = groupsMap.get(key)
    if (!group.stallNo && stallNo) group.stallNo = stallNo
    if (!group.businessName && businessName) group.businessName = businessName
    group.payments.push(p)
  }

  const groups = Array.from(groupsMap.values()).map(g => {
    // Sort payments within the group by date descending (latest payment first)
    g.payments.sort((a, b) => {
      const dateA = new Date(a.paymentDate || a.payment_date || 0).getTime()
      const dateB = new Date(b.paymentDate || b.payment_date || 0).getTime()
      return dateB - dateA
    })
    g.totalAmount = g.payments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    return g
  })

  // Sort groups alphabetically by stakeholder name
  groups.sort((a, b) => a.stakeholder.localeCompare(b.stakeholder))
  return groups
})

// Helper to check if type is business permit or application payment
function isPermitOrApp(type) {
  return type === 'APPLICATION_FORM' || type === 'BUSINESS_PERMIT_PAYMENT' || type === 'APPLICATION_FEE'
}

// =========================
// SELECTION METHODS
// =========================
const filteredStakeholdersForDropdown = computed(() => {
  const q = stakeholderSearch.value.toLowerCase().trim()
  let list = []
  if (activeCategory.value === 'ADVANCE_PAYMENT') {
    list = advancePaymentStakeholders.value
  } else if (isPermitOrApp(activeCategory.value)) {
    list = appFormStakeholders.value
  } else if (activeCategory.value === 'RENT_PAYMENT') {
    list = rentPaymentStakeholders.value
  } else {
    list = stakeholders.value
  }

  // If category-specific list is empty, default to all active stakeholders
  if (!list || list.length === 0) {
    list = stakeholders.value.filter(s => !s.isArchived)
  }

  if (!q) return list

  const filtered = list.filter(s => {
    const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase()
    const bName = (s.businessName || '').toLowerCase()
    const stall = (s.occupant?.stall?.stallNo || s.selectedStall?.stallNo || '').toLowerCase()
    return name.includes(q) || bName.includes(q) || stall.includes(q)
  })

  if (filtered.length > 0) return filtered

  // Fallback to searching all active stakeholders so the user is never stuck
  return stakeholders.value.filter(s => {
    if (s.isArchived) return false
    const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase()
    const bName = (s.businessName || '').toLowerCase()
    const stall = (s.occupant?.stall?.stallNo || s.selectedStall?.stallNo || '').toLowerCase()
    return name.includes(q) || bName.includes(q) || stall.includes(q)
  })
})
const availableStakeholdersForType = filteredStakeholdersForDropdown

function chooseStakeholder(s) {
  selectStakeholderForType(s, activeCategory.value)
  stakeholderSearch.value = `${s.firstName} ${s.lastName}${s.occupant?.stall?.stallNo ? ' • Stall ' + s.occupant.stall.stallNo : ''}`
  isStakeholderDropdownOpen.value = false
}

function onStakeholderBlur() {
  setTimeout(() => {
    isStakeholderDropdownOpen.value = false
  }, 250)
}

function generateReceiptNo(type = selectedPaymentType.value) {
  const prefixMap = {
    ADVANCE_PAYMENT: 'ADV',
    APPLICATION_FORM: 'BP',
    BUSINESS_PERMIT_PAYMENT: 'BP',
    APPLICATION_FEE: 'BP',
    RENT_PAYMENT: 'RNT'
  }
  const prefix = prefixMap[type] || 'OR'
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${yyyy}${mm}${dd}-${random}`
}

function regenerateReceiptNo() {
  form.value.receiptNo = generateReceiptNo(activeCategory.value)
}

function selectStakeholderForType(s, type) {
  selectedStakeholder.value = s
  selectedPaymentType.value = type
  activeCategory.value = type
  form.value.paymentType = type
  form.value.referenceNo = form.value.referenceNo || ''
  form.value.receiptNo = generateReceiptNo(type)

  if (type === 'ADVANCE_PAYMENT') {
    form.value.totalAdvanceAmount = s.totalAdvanceAmount ? Number(s.totalAdvanceAmount) : null
    const remaining = Math.max(Number(s.totalAdvanceAmount || 0) - Number(s.advanceBalance || 0), 0)
    form.value.amount = remaining > 0 ? remaining : null
    selectedBillingId.value = null
  } else if (type === 'RENT_PAYMENT') {
    form.value.totalAdvanceAmount = null
    const unpaids = getUnpaidBillingsForStakeholder(s.id)
    if (unpaids.length) {
      selectedBillingId.value = unpaids[0].id
      form.value.amount = Number(unpaids[0].balance || 0)
    } else {
      selectedBillingId.value = null
      form.value.amount = null
    }
  } else if (isPermitOrApp(type)) {
    form.value.totalAdvanceAmount = null
    selectedBillingId.value = null
    form.value.amount = s.applicantFeeAmount ? Number(s.applicantFeeAmount) : null
  }
}

function selectBilling(b) {
  selectedBillingId.value = b.id
  form.value.amount = Number(b.balance || 0)
}

function setCategory(category) {
  activeCategory.value = category
  selectedPaymentType.value = category
  form.value.paymentType = category
  form.value.receiptNo = generateReceiptNo(category)

  if (selectedStakeholder.value) {
    selectStakeholderForType(selectedStakeholder.value, category)
    stakeholderSearch.value = `${selectedStakeholder.value.firstName} ${selectedStakeholder.value.lastName}${selectedStakeholder.value.occupant?.stall?.stallNo ? ' • Stall ' + selectedStakeholder.value.occupant.stall.stallNo : ''}`
  }
}

function resetSelection() {
  selectedStakeholder.value = null
  selectedPaymentType.value = activeCategory.value || 'ADVANCE_PAYMENT'
  selectedBillingId.value = null
  stakeholderSearch.value = ''
  isStakeholderDropdownOpen.value = false
  form.value = {
    paymentType: activeCategory.value || 'ADVANCE_PAYMENT',
    totalAdvanceAmount: null,
    amount: null,
    referenceNo: '',
    receiptNo: generateReceiptNo(activeCategory.value || 'ADVANCE_PAYMENT'),
    dateReceived: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: ''
  }
}

function initials(nameOrFirst, last) {
  if (last !== undefined && last !== null && last !== '') {
    return (((nameOrFirst?.charAt(0) || '') + (last?.charAt(0) || '')).toUpperCase()) || '?'
  }
  if (!nameOrFirst) return '?'
  return String(nameOrFirst)
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'
}

function formatType(type) {
  if (!type) return ''
  if (isPermitOrApp(type)) {
    return 'Business Permit / Application'
  }
  return type.replaceAll('_', ' ')
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

function openModal(defaultCategory = 'ADVANCE_PAYMENT') {
  resetSelection()
  activeCategory.value = defaultCategory
  selectedPaymentType.value = defaultCategory
  form.value.paymentType = defaultCategory
  form.value.receiptNo = generateReceiptNo(defaultCategory)
  form.value.dateReceived = new Date().toISOString().split('T')[0]
  form.value.paymentMethod = 'Cash'
  form.value.notes = ''
  stakeholderSearch.value = ''
  isStakeholderDropdownOpen.value = false
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetSelection()
}

const canRecord = computed(() => {
  if (!selectedStakeholder.value) return false
  if (Number(form.value.amount) <= 0) return false
  if (activeCategory.value === 'RENT_PAYMENT' && selectedStakeholderBillings.value.length > 0) return !!selectedBillingId.value
  if (activeCategory.value === 'ADVANCE_PAYMENT') return Number(form.value.totalAdvanceAmount) > 0
  return true
})

const confirmBtnLabel = computed(() => {
  if (!activeCategory.value) return 'Record Payment'
  if (activeCategory.value === 'ADVANCE_PAYMENT') return 'Record Advance Payment'
  if (isPermitOrApp(activeCategory.value)) return 'Record Business Permit / Application Payment'
  if (activeCategory.value === 'RENT_PAYMENT') return 'Record Rent Payment'
  return 'Record Payment'
})

const submitButtonText = computed(() => {
  if (!selectedStakeholder.value) return 'Select a payee'
  if (activeCategory.value === 'ADVANCE_PAYMENT' && (!form.value.totalAdvanceAmount || Number(form.value.totalAdvanceAmount) <= 0)) {
    return 'Enter total advance'
  }
  if (!form.value.amount || Number(form.value.amount) <= 0) return 'Enter amount'
  if (activeCategory.value === 'RENT_PAYMENT' && selectedStakeholderBillings.value.length > 0 && !selectedBillingId.value) {
    return 'Select billing'
  }
  return 'Record payment'
})

// =========================
// RECORD PAYMENT
// =========================
async function recordPayment() {
  try {
    if (!selectedStakeholder.value) {
      toast.add({
        severity: 'warn',
        summary: 'Stakeholder Required',
        detail: 'Please select a stakeholder first.',
        life: 3500
      })
      return
    }

    if (activeCategory.value === 'ADVANCE_PAYMENT' && !selectedStakeholder.value.treasurerApproved) {
      toast.add({
        severity: 'error',
        summary: 'Approval Required',
        detail: 'This stakeholder must be approved by the Treasurer before advance payment can be recorded.',
        life: 4500
      })
      return
    }

    if (activeCategory.value === 'ADVANCE_PAYMENT' && (!form.value.totalAdvanceAmount || Number(form.value.totalAdvanceAmount) <= 0)) {
      toast.add({
        severity: 'warn',
        summary: 'Total Advance Required',
        detail: 'Please enter the total required advance amount.',
        life: 3500
      })
      return
    }

    if (activeCategory.value === 'RENT_PAYMENT') {
      if (!selectedStakeholder.value?.occupant) {
        toast.add({
          severity: 'error',
          summary: 'Missing Occupant',
          detail: 'Stakeholder has no occupant record.',
          life: 4000
        })
        return
      }
      if (!selectedStakeholder.value?.occupant?.stall) {
        toast.add({
          severity: 'error',
          summary: 'No Occupied Stall',
          detail: 'Stakeholder has no occupied stall.',
          life: 4000
        })
        return
      }
      if (selectedStakeholderBillings.value.length > 0 && !selectedBillingId.value) {
        toast.add({
          severity: 'warn',
          summary: 'Billing Required',
          detail: 'Please select a billing reference to pay.',
          life: 4000
        })
        return
      }
    }

    if (!form.value.amount || Number(form.value.amount) <= 0) {
      toast.add({
        severity: 'error',
        summary: 'Invalid Amount',
        detail: 'Please enter a valid payment amount greater than zero.',
        life: 3500
      })
      return
    }

    isSubmitting.value = true

    const payload = {
      stakeholderId: selectedStakeholder.value.id,
      stakeholder: { id: selectedStakeholder.value.id },
      amount: Number(form.value.amount),
      referenceNo: form.value.referenceNo,
      receiptNo: form.value.receiptNo || generateReceiptNo(activeCategory.value),
      paymentType: isPermitOrApp(activeCategory.value) ? 'BUSINESS_PERMIT_PAYMENT' : activeCategory.value,
      paymentDate: form.value.dateReceived ? new Date(form.value.dateReceived).toISOString() : new Date().toISOString()
    }

    if (activeCategory.value === 'RENT_PAYMENT') {
      const selectedBilling = selectedStakeholderBillings.value.find(b => b.id === selectedBillingId.value)
      payload.rentCycle = selectedBilling?.billingFrequency || 'MONTHLY'
      if (selectedBillingId.value) {
        payload.billing = { id: selectedBillingId.value }
        payload.billingId = selectedBillingId.value
      }
    }

    if (activeCategory.value === 'ADVANCE_PAYMENT') {
      payload.totalAdvanceAmount = Number(form.value.totalAdvanceAmount)
    }

    const stakeholderFirstName = selectedStakeholder.value?.firstName || ''
    const stakeholderLastName = selectedStakeholder.value?.lastName || ''
    const stakeholderFullName = `${stakeholderFirstName} ${stakeholderLastName}`.trim() || 'stakeholder'
    const typeLabel = formatType(selectedPaymentType.value || activeCategory.value).toLowerCase()
    const recordedAmount = Number(form.value.amount || 0).toLocaleString()

    const savedData = await createPayment(payload)
    console.log('[Payment] payment saved', {
      paymentId: savedData?.id,
      stakeholderId: payload.stakeholderId,
      paymentType: savedData?.payment_type || savedData?.paymentType || payload.paymentType,
      amount: savedData?.amount
    })
    
    await Promise.all([loadPayments(), loadBillings(), loadStakeholders()])
    
    closeModal()
    toast.add({
      severity: 'success',
      summary: 'Payment Recorded',
      detail: `Successfully recorded ${typeLabel} of ₱${recordedAmount} for ${stakeholderFullName}.`,
      life: 4500
    })
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: 'Payment Error',
      detail: error.response?.data?.message || error.message || 'Failed to record payment.',
      life: 5000
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped src="../styles/Treasurer/Payment.css"></style>
