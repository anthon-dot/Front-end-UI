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

      <!-- TABLE -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto p-2">
        <DataTable 
          :value="filteredPayments"
          :loading="loading" 
          paginator 
          :rows="10" 
          :rowsPerPageOptions="[10, 20, 50]"
          responsiveLayout="scroll"
          class="p-datatable-sm modern-table"
        >
          <template #empty>
            <div class="text-center py-12 text-slate-400">
              <i class="pi pi-wallet text-4xl mb-3 text-slate-300"></i>
              <p>No payments found matching the criteria.</p>
            </div>
          </template>

          <Column header="Stakeholder" sortable sortField="stakeholder.lastName">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  {{ initials(data.stakeholder?.firstName, data.stakeholder?.lastName) }}
                </div>
                <div>
                  <div class="font-semibold text-slate-800">{{ data.stakeholder?.firstName }} {{ data.stakeholder?.lastName }}</div>
                  <div class="text-xs text-slate-500">{{ data.stakeholder?.businessName }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="id" header="Payment ID" sortable>
            <template #body="{ data }">
              <span class="font-mono text-sm font-bold text-slate-600">#{{ data.id }}</span>
            </template>
          </Column>

          <Column field="paymentType" header="Type" sortable>
            <template #body="{ data }">
              <Tag :value="formatType(data.paymentType)" severity="info" rounded class="!bg-blue-50 !text-blue-600 !font-semibold border border-blue-100" />
            </template>
          </Column>

          <Column field="rentCycle" header="Rent Cycle" sortable>
            <template #body="{ data }">
              <span v-if="data.rentCycle">{{ formatType(data.rentCycle) }}</span>
              <span v-else class="text-slate-400">—</span>
            </template>
          </Column>

          <Column field="amount" header="Amount" sortable>
            <template #body="{ data }">
              <span class="font-bold text-emerald-600">₱{{ Number(data.amount || 0).toLocaleString() }}</span>
            </template>
          </Column>

          <Column field="receiptNo" header="Receipt" sortable></Column>
          
          <Column field="referenceNo" header="Reference">
            <template #body="{ data }">
              <span v-if="data.referenceNo">{{ data.referenceNo }}</span>
              <span v-else class="text-slate-400">—</span>
            </template>
          </Column>

          <Column field="paymentDate" header="Date" sortable>
            <template #body="{ data }">
              {{ formatDate(data.paymentDate) }}
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- RECORD PAYMENT MODAL MATCHING IMAGE 1 DESIGN -->
      <Dialog v-model:visible="showModal" modal :closable="false"
              :style="{ width: '96vw', maxWidth: '720px' }" 
              :breakpoints="{ '960px': '96vw', '640px': '98vw' }" 
              class="ledger-dialog"
              :pt="{
                root: { class: '!rounded-3xl !border !border-slate-200 !shadow-2xl overflow-hidden' },
                content: { class: '!p-0 !bg-[#fcfbf9]' }
              }">
        <form @submit.prevent="recordPayment" class="flex flex-col max-h-[90vh] bg-[#fdfdfc] text-slate-800 font-sans">
          
          <!-- Sticky Header -->
          <div class="flex items-start justify-between gap-4 p-5 sm:p-7 pb-4 border-b border-slate-200/80 bg-white/95 backdrop-blur-xs sticky top-0 z-30">
            <div>
              <span class="text-[11px] font-black uppercase tracking-widest text-[#92400e]">NEW LEDGER ENTRY</span>
              <h2 class="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-slate-900 mt-0.5 tracking-tight">Payment details</h2>
              <p class="text-xs text-slate-500 mt-1">Fields marked with an asterisk are required.</p>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#fef3c7] border border-[#fde68a] text-[#92400e] flex items-center justify-center text-base sm:text-lg shadow-xs" title="Ledger Entry">
                <i class="pi pi-book"></i>
              </div>
              <button type="button" @click="closeModal" class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer" title="Close">
                <i class="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Scrollable Body with Clean Guided Steps -->
          <div class="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6 custom-scroll">
            
            <!-- STEP 1: PAYMENT TYPE -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">1</span>
                  Payment Type <span class="text-rose-500">*</span>
                </label>
                <span class="text-[11px] text-slate-400">Choose category</span>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                
                <!-- Card 01: Advance payment -->
                <div
                  @click="setCategory('ADVANCE_PAYMENT')"
                  class="p-3.5 rounded-2xl transition-all cursor-pointer relative flex flex-col justify-between select-none"
                  :class="activeCategory === 'ADVANCE_PAYMENT'
                    ? 'border-2 border-[#14532d] bg-[#f2f7f4] shadow-xs'
                    : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-[#b45309] font-mono">01</span>
                    <span v-if="activeCategory === 'ADVANCE_PAYMENT'" class="w-5 h-5 rounded-full bg-[#14532d] text-white flex items-center justify-center text-[10px]">
                      <i class="pi pi-check"></i>
                    </span>
                    <span v-else class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {{ advancePaymentStakeholders.length }} pending
                    </span>
                  </div>
                  <div>
                    <div class="font-bold text-sm text-slate-900 leading-tight">Advance payment</div>
                    <div class="text-[11px] text-slate-500 mt-1 leading-normal">Initial security deposit</div>
                  </div>
                </div>

                <!-- Card 02: Application payment -->
                <div
                  @click="setCategory('APPLICATION_FORM')"
                  class="p-3.5 rounded-2xl transition-all cursor-pointer relative flex flex-col justify-between select-none"
                  :class="activeCategory === 'APPLICATION_FORM'
                    ? 'border-2 border-[#14532d] bg-[#f2f7f4] shadow-xs'
                    : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-[#b45309] font-mono">02</span>
                    <span v-if="activeCategory === 'APPLICATION_FORM'" class="w-5 h-5 rounded-full bg-[#14532d] text-white flex items-center justify-center text-[10px]">
                      <i class="pi pi-check"></i>
                    </span>
                    <span v-else class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {{ appFormStakeholders.length }} pending
                    </span>
                  </div>
                  <div>
                    <div class="font-bold text-sm text-slate-900 leading-tight">Application payment</div>
                    <div class="text-[11px] text-slate-500 mt-1 leading-normal">Fee for new application</div>
                  </div>
                </div>

                <!-- Card 03: Contract stall payment -->
                <div
                  @click="setCategory('RENT_PAYMENT')"
                  class="p-3.5 rounded-2xl transition-all cursor-pointer relative flex flex-col justify-between select-none"
                  :class="activeCategory === 'RENT_PAYMENT'
                    ? 'border-2 border-[#14532d] bg-[#f2f7f4] shadow-xs'
                    : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-[#b45309] font-mono">03</span>
                    <span v-if="activeCategory === 'RENT_PAYMENT'" class="w-5 h-5 rounded-full bg-[#14532d] text-white flex items-center justify-center text-[10px]">
                      <i class="pi pi-check"></i>
                    </span>
                    <span v-else class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {{ rentPaymentStakeholders.length }} due
                    </span>
                  </div>
                  <div>
                    <div class="font-bold text-sm text-slate-900 leading-tight">Contract stall payment</div>
                    <div class="text-[11px] text-slate-500 mt-1 leading-normal">Monthly stall rental</div>
                  </div>
                </div>

              </div>
            </div>

            <!-- STEP 2: STAKEHOLDER / PAYEE SELECTION -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">2</span>
                  Select Payee <span class="text-rose-500">*</span>
                </label>
                <span v-if="!selectedStakeholder" class="text-[11px] text-slate-400">
                  {{ availableStakeholdersForType.length }} {{ activeCategory === 'RENT_PAYMENT' ? 'with due balance' : 'pending' }}
                </span>
              </div>

              <!-- Selected Payee Card -->
              <div v-if="selectedStakeholder" class="p-4 bg-emerald-50/80 border border-emerald-300/90 rounded-2xl flex items-center justify-between transition-all shadow-xs">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-full bg-[#11382b] text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                    {{ initials(selectedStakeholder.firstName, selectedStakeholder.lastName) }}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-bold text-sm text-slate-900 truncate">
                        {{ selectedStakeholder.firstName }} {{ selectedStakeholder.lastName }}
                      </span>
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/70 text-emerald-900">
                        <i class="pi pi-check text-[8px] mr-1"></i> Selected Payee
                      </span>
                    </div>
                    <div class="text-xs text-slate-600 truncate mt-0.5">
                      {{ selectedStakeholder.businessName || 'Applicant' }}
                      <span v-if="selectedStakeholder.occupant?.stall?.stallNo || selectedStakeholder.selectedStall?.stallNo" class="font-medium text-slate-700">
                        • Stall {{ selectedStakeholder.occupant?.stall?.stallNo || selectedStakeholder.selectedStall?.stallNo }}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  @click="resetSelection"
                  class="flex-shrink-0 ml-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <i class="pi pi-sync text-[10px]"></i>
                  <span>Change</span>
                </button>
              </div>

              <!-- Payee Search and List (when no payee selected yet) -->
              <div v-else class="space-y-2">
                <div class="relative">
                  <input
                    type="text"
                    v-model="stakeholderSearch"
                    placeholder="Type name, business, or stall # to filter..."
                    class="w-full h-11 px-3.5 pl-10 pr-9 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 shadow-2xs"
                  />
                  <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                  <button
                    v-if="stakeholderSearch"
                    type="button"
                    @click="stakeholderSearch = ''"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                </div>

                <!-- Payee Card List -->
                <div class="max-h-56 sm:max-h-60 overflow-y-auto space-y-2 pr-1 custom-scroll">
                  <div
                    v-for="s in availableStakeholdersForType"
                    :key="s.id"
                    @click="chooseStakeholder(s)"
                    class="p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-600 hover:bg-emerald-50/20 cursor-pointer transition-all flex items-center justify-between active:scale-[0.99] shadow-2xs"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {{ initials(s.firstName, s.lastName) }}
                      </div>
                      <div class="min-w-0">
                        <div class="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {{ s.firstName }} {{ s.lastName }}
                        </div>
                        <div class="text-[11px] sm:text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          <span>{{ s.businessName || 'Applicant' }}</span>
                          <span v-if="s.occupant?.stall?.stallNo || s.selectedStall?.stallNo" class="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-600 text-[10px]">
                            Stall {{ s.occupant?.stall?.stallNo || s.selectedStall?.stallNo }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="text-right flex-shrink-0 ml-2">
                      <div v-if="activeCategory === 'ADVANCE_PAYMENT'" class="font-bold text-xs sm:text-sm text-indigo-600">
                        ₱{{ Math.max(Number(s.totalAdvanceAmount || 0) - Number(s.advanceBalance || 0), 0).toLocaleString() }}
                        <div class="text-[10px] text-slate-400 font-normal">rem. advance</div>
                      </div>
                      <div v-else-if="activeCategory === 'RENT_PAYMENT'" class="font-bold text-xs sm:text-sm text-rose-600">
                        ₱{{ getTotalUnpaidAmount(s).toLocaleString() }}
                        <div class="text-[10px] text-slate-400 font-normal">due balance</div>
                      </div>
                      <div v-else class="text-[11px] sm:text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Fee Pending
                      </div>
                    </div>
                  </div>

                  <!-- Empty State -->
                  <div v-if="availableStakeholdersForType.length === 0" class="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                    <i class="pi pi-users text-2xl mb-1 text-slate-300"></i>
                    <p class="text-xs font-medium">No payees match your search for {{ formatType(activeCategory) }}.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- STEP 3: PAYMENT DETAILS (EXPANDS ON PAYEE SELECT) -->
            <div v-if="selectedStakeholder" class="space-y-4 pt-2 border-t border-slate-200/80">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">3</span>
                  Payment Details <span class="text-rose-500">*</span>
                </label>
              </div>

              <!-- Advance Amount Field if Advance Payment -->
              <div v-if="activeCategory === 'ADVANCE_PAYMENT'" class="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-1">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-slate-800">Total Required Advance Amount <span class="text-rose-500">*</span></label>
                  <span class="text-[11px] text-slate-500">Already paid: ₱{{ Number(selectedStakeholder?.advanceBalance || 0).toLocaleString() }}</span>
                </div>
                <InputNumber
                  v-model="form.totalAdvanceAmount"
                  mode="currency"
                  currency="PHP"
                  locale="en-PH"
                  class="w-full text-base"
                  placeholder="₱ 0.00"
                />
              </div>

              <!-- Contract Rent Billing Selector -->
              <div v-if="activeCategory === 'RENT_PAYMENT'" class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-slate-800">Select Billing Statement to Pay <span class="text-rose-500">*</span></label>
                  <span class="text-[11px] text-slate-500">{{ selectedStakeholderBillings.length }} unpaid statement(s)</span>
                </div>
                <div v-if="selectedStakeholderBillings.length" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    v-for="b in selectedStakeholderBillings"
                    :key="b.id"
                    @click="selectBilling(b)"
                    class="p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between select-none"
                    :class="selectedBillingId === b.id ? 'border-2 border-[#14532d] bg-[#f2f7f4] shadow-2xs' : 'border-slate-200 bg-white hover:border-slate-300'"
                  >
                    <div>
                      <div class="text-xs font-bold text-slate-900">{{ b.billingNo }}</div>
                      <div class="text-[11px] text-slate-500 mt-0.5">Due: {{ formatDate(b.dueDate) }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm font-extrabold text-rose-600">₱{{ Number(b.balance || 0).toLocaleString() }}</div>
                      <div v-if="selectedBillingId === b.id" class="text-[10px] font-bold text-emerald-700">Selected</div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-xs text-slate-400 py-1">
                  No unpaid billing statements recorded for this tenant.
                </div>
              </div>

              <!-- Amount & Date (2 columns) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-800">Amount received <span class="text-rose-500">*</span></label>
                  <InputNumber
                    v-model="form.amount"
                    mode="currency"
                    currency="PHP"
                    locale="en-PH"
                    class="w-full font-bold text-base"
                    placeholder="₱ 0.00"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-800">Date received <span class="text-rose-500">*</span></label>
                  <div class="relative">
                    <input
                      type="date"
                      v-model="form.dateReceived"
                      class="w-full h-11 px-3.5 pr-10 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 shadow-2xs"
                    />
                    <i class="pi pi-calendar absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                  </div>
                </div>
              </div>

              <!-- Payment Method & Reference Number (2 columns) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-800">Payment method <span class="text-rose-500">*</span></label>
                  <select
                    v-model="form.paymentMethod"
                    class="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 shadow-2xs cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check / Cheque</option>
                    <option value="GCash">GCash / E-Wallet</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-800">Reference number</label>
                  <input
                    type="text"
                    v-model="form.referenceNo"
                    placeholder="e.g. CHQ-1048, GCash Ref #"
                    class="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 shadow-2xs"
                  />
                </div>
              </div>

              <!-- Official Receipt Number -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-slate-800">Official Receipt Number <span class="text-rose-500">*</span></label>
                  <button type="button" @click="regenerateReceiptNo" class="text-xs text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1 cursor-pointer">
                    <i class="pi pi-refresh text-[10px]"></i> Auto-generate
                  </button>
                </div>
                <div class="relative">
                  <input
                    type="text"
                    v-model="form.receiptNo"
                    placeholder="Receipt #"
                    class="w-full h-11 px-3.5 pl-9 font-mono text-xs sm:text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 shadow-2xs"
                  />
                  <i class="pi pi-receipt absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
              </div>

              <!-- Notes -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-800">Notes <span class="text-slate-400 font-normal">(optional)</span></label>
                <textarea
                  v-model="form.notes"
                  rows="2"
                  placeholder="Add any context for this payment record..."
                  class="w-full p-3 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 bg-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 shadow-2xs"
                ></textarea>
              </div>
            </div>

          </div>

          <!-- Sticky Footer -->
          <div class="flex items-center justify-between p-4 sm:p-6 border-t border-slate-200/80 bg-white/95 backdrop-blur-xs sticky bottom-0 z-30">
            <div class="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <i class="pi pi-lock text-slate-400 text-xs"></i>
              <span class="hidden sm:inline">Saved to the internal market ledger</span>
              <span class="sm:hidden text-[11px]">Internal ledger</span>
            </div>

            <div class="flex items-center gap-2.5">
              <button
                type="button"
                @click="closeModal"
                class="px-3.5 sm:px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="!canRecord || isSubmitting"
                class="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                style="background-color: #11382b;"
                onmouseover="if(!this.disabled) this.style.backgroundColor='#0b271e'"
                onmouseout="if(!this.disabled) this.style.backgroundColor='#11382b'"
              >
                <span>{{ isSubmitting ? 'Recording...' : submitButtonText }}</span>
                <i v-if="!isSubmitting" class="pi pi-arrow-right text-xs"></i>
                <i v-else class="pi pi-spin pi-spinner text-xs"></i>
              </button>
            </div>
          </div>

        </form>
      </Dialog>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '../services/api'
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
    payments.value = await fetchPayments()
  } catch (error) { console.error(error) }
}

async function loadStakeholders() {
  try {
    const response = await api.get('/stakeholders')
    stakeholders.value = response.data.filter(s => !s.isArchived)
  } catch (error) { console.error(error) }
}

async function loadBillings() {
  try {
    billings.value = await fetchBillings()
  } catch (error) { console.error(error) }
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

// 2. Application Form List: ONLY stakeholders whose application fee is NOT finished/paid
const appFormStakeholders = computed(() => {
  const search = searchAppForm.value.toLowerCase().trim()
  return stakeholders.value.filter(s => {
    if (s.applicantFeePaid || s.treasurerPaid) return false
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
    if (!s.occupant || !s.occupant.stall) return false
    if (!hasUnpaidBillings(s)) return false
    if (s.isArchived) return false

    if (!search) return true
    const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase()
    const bName = (s.businessName || '').toLowerCase()
    const stall = (s.occupant?.stall?.stallNo || '').toLowerCase()
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
  const search = tableSearch.value.toLowerCase()
  return payments.value.filter(p => {
    const name = `${p.stakeholder?.firstName || ''} ${p.stakeholder?.lastName || ''}`.toLowerCase()
    return name.includes(search) || 
           String(p.id).includes(search) || 
           (p.receiptNo || '').toLowerCase().includes(search)
  })
})

// =========================
// SELECTION METHODS
// =========================
const availableStakeholdersForType = computed(() => {
  const q = stakeholderSearch.value.toLowerCase().trim()
  let list = []
  if (activeCategory.value === 'ADVANCE_PAYMENT') {
    list = advancePaymentStakeholders.value
  } else if (activeCategory.value === 'APPLICATION_FORM') {
    list = appFormStakeholders.value
  } else if (activeCategory.value === 'RENT_PAYMENT') {
    list = rentPaymentStakeholders.value
  } else {
    list = stakeholders.value
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

function chooseStakeholder(s) {
  selectStakeholderForType(s, activeCategory.value)
  isStakeholderDropdownOpen.value = false
  stakeholderSearch.value = ''
}

function generateReceiptNo(type = selectedPaymentType.value) {
  const prefixMap = {
    ADVANCE_PAYMENT: 'ADV',
    APPLICATION_FORM: 'APP',
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
  } else if (type === 'APPLICATION_FORM') {
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

function initials(first, last) {
  return ((first?.charAt(0) || '') + (last?.charAt(0) || '')).toUpperCase()
}

function formatType(type) {
  if (!type) return ''
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
  if (activeCategory.value === 'APPLICATION_FORM') return 'Record Application Fee'
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
      paymentType: activeCategory.value,
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

    const savedData = await createPayment(payload)
    console.log('[Payment] payment saved', {
      paymentId: savedData?.id,
      stakeholderId: selectedStakeholder.value.id,
      paymentType: savedData?.paymentType,
      amount: savedData?.amount
    })
    
    await Promise.all([loadPayments(), loadBillings(), loadStakeholders()])
    
    closeModal()
    toast.add({
      severity: 'success',
      summary: 'Payment Recorded',
      detail: `Successfully recorded ${formatType(selectedPaymentType.value).toLowerCase()} of ₱${Number(form.value.amount).toLocaleString()} for ${selectedStakeholder.value.firstName} ${selectedStakeholder.value.lastName}.`,
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
