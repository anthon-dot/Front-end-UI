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
          <span class="p-input-icon-left w-full sm:w-80 shadow-sm rounded-lg overflow-hidden border border-slate-200">
            <i class="pi pi-search text-slate-400 pl-3"></i>
            <InputText v-model="tableSearch" placeholder="Search stakeholder or payment id..." class="w-full border-none pl-10 bg-white" />
          </span>
          <Button label="Record Payment" icon="pi pi-plus" @click="openModal" class="shadow-sm whitespace-nowrap w-full sm:w-auto" />
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

      <!-- RECORD PAYMENT MODAL WITH 3 COLUMN BUTTONS -->
      <Dialog v-model:visible="showModal" modal header="Record Payment" 
              :style="{ width: '75vw', maxWidth: '1000px' }" 
              :breakpoints="{ '1200px': '85vw', '960px': '92vw', '640px': '98vw' }" 
              class="modern-dialog">
        <p class="text-slate-500 mb-4 text-sm">Choose a payment category button below. Only the selected column will be visible to manage and record payments.</p>
        
        <!-- 3 COLUMN BUTTONS -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          
          <!-- BUTTON 1: ADVANCE PAYMENT -->
          <button 
            type="button" 
            @click="setCategory('ADVANCE_PAYMENT')"
            class="flex items-center justify-between p-3.5 rounded-2xl border font-bold text-sm transition-all duration-200 cursor-pointer text-left"
            :class="activeCategory === 'ADVANCE_PAYMENT' 
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 ring-2 ring-indigo-200' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'">
            <div class="flex items-center gap-3">
              <span class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                    :class="activeCategory === 'ADVANCE_PAYMENT' ? 'bg-indigo-700/70 text-white' : 'bg-indigo-50 text-indigo-600'">
                <i class="pi pi-shield text-base"></i>
              </span>
              <div>
                <div class="leading-tight text-sm font-bold">Advance Payment</div>
                <div class="text-[11px] font-normal mt-0.5" :class="activeCategory === 'ADVANCE_PAYMENT' ? 'text-indigo-200' : 'text-slate-400'">Initial advance deposit</div>
              </div>
            </div>
            <Tag :value="advancePaymentStakeholders.length + ' Pending'" 
                 :severity="activeCategory === 'ADVANCE_PAYMENT' ? 'contrast' : (advancePaymentStakeholders.length ? 'info' : 'secondary')" 
                 rounded class="!text-[11px] !font-bold" />
          </button>

          <!-- BUTTON 2: APPLICATION FORM -->
          <button 
            type="button" 
            @click="setCategory('APPLICATION_FORM')"
            class="flex items-center justify-between p-3.5 rounded-2xl border font-bold text-sm transition-all duration-200 cursor-pointer text-left"
            :class="activeCategory === 'APPLICATION_FORM' 
              ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-100 ring-2 ring-amber-200' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-slate-50'">
            <div class="flex items-center gap-3">
              <span class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                    :class="activeCategory === 'APPLICATION_FORM' ? 'bg-amber-700/70 text-white' : 'bg-amber-50 text-amber-600'">
                <i class="pi pi-file-edit text-base"></i>
              </span>
              <div>
                <div class="leading-tight text-sm font-bold">Application Form</div>
                <div class="text-[11px] font-normal mt-0.5" :class="activeCategory === 'APPLICATION_FORM' ? 'text-amber-200' : 'text-slate-400'">Application fee</div>
              </div>
            </div>
            <Tag :value="appFormStakeholders.length + ' Pending'" 
                 :severity="activeCategory === 'APPLICATION_FORM' ? 'contrast' : (appFormStakeholders.length ? 'warn' : 'secondary')" 
                 rounded class="!text-[11px] !font-bold" />
          </button>

          <!-- BUTTON 3: RENT PAYMENT -->
          <button 
            type="button" 
            @click="setCategory('RENT_PAYMENT')"
            class="flex items-center justify-between p-3.5 rounded-2xl border font-bold text-sm transition-all duration-200 cursor-pointer text-left"
            :class="activeCategory === 'RENT_PAYMENT' 
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100 ring-2 ring-emerald-200' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-slate-50'">
            <div class="flex items-center gap-3">
              <span class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                    :class="activeCategory === 'RENT_PAYMENT' ? 'bg-emerald-700/70 text-white' : 'bg-emerald-50 text-emerald-600'">
                <i class="pi pi-home text-base"></i>
              </span>
              <div>
                <div class="leading-tight text-sm font-bold">Rent Payment</div>
                <div class="text-[11px] font-normal mt-0.5" :class="activeCategory === 'RENT_PAYMENT' ? 'text-emerald-200' : 'text-slate-400'">Monthly stall rentals</div>
              </div>
            </div>
            <Tag :value="rentPaymentStakeholders.length + ' Unpaid'" 
                 :severity="activeCategory === 'RENT_PAYMENT' ? 'contrast' : (rentPaymentStakeholders.length ? 'danger' : 'secondary')" 
                 rounded class="!text-[11px] !font-bold" />
          </button>

        </div>

        <!-- VISIBLE COLUMN CONTENT (Only the selected column is visible) -->
        <div class="mb-6">
          
          <!-- COLUMN 1: ADVANCE PAYMENT -->
          <div v-if="activeCategory === 'ADVANCE_PAYMENT'" 
               class="rounded-2xl border transition-all p-4 bg-white shadow-sm flex flex-col h-[380px]"
               :class="selectedPaymentType === 'ADVANCE_PAYMENT' ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'">
            <!-- Column Header -->
            <div class="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <i class="pi pi-shield text-lg"></i>
                </span>
                <div>
                  <h3 class="font-bold text-slate-800 text-sm">Advance Payment Stakeholders</h3>
                  <p class="text-[11px] text-slate-400">Approved applicants awaiting initial advance deposit</p>
                </div>
              </div>
              <Tag :value="advancePaymentStakeholders.length + ' Pending'" 
                   :severity="advancePaymentStakeholders.length ? 'info' : 'secondary'" 
                   rounded class="!text-xs font-bold" />
            </div>

            <!-- Search input -->
            <div class="mb-3">
              <span class="p-input-icon-left w-full">
                <i class="pi pi-search text-slate-400 text-xs"></i>
                <InputText v-model="searchAdvance" placeholder="Search advance applicants by name, business, stall..." class="w-full pl-8 py-2 text-xs bg-slate-50 border-slate-200 rounded-lg" />
              </span>
            </div>

            <!-- Stakeholder list -->
            <div class="flex-1 overflow-y-auto space-y-2 pr-1 custom-scroll">
              <div v-for="s in advancePaymentStakeholders" :key="s.id"
                   @click="selectStakeholderForType(s, 'ADVANCE_PAYMENT')"
                   class="p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between"
                   :class="selectedStakeholder?.id === s.id && selectedPaymentType === 'ADVANCE_PAYMENT'
                           ? 'bg-indigo-50 border-indigo-400 shadow-sm ring-1 ring-indigo-300'
                           : 'bg-slate-50/50 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30'">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {{ initials(s.firstName, s.lastName) }}
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-sm text-slate-800 truncate">{{ s.firstName }} {{ s.lastName }}</div>
                    <div class="text-xs text-slate-500 truncate">
                      {{ s.businessName || 'Applicant' }}
                      <span v-if="s.occupant?.stall?.stallNo || s.selectedStall?.stallNo"> • Stall {{ s.occupant?.stall?.stallNo || s.selectedStall?.stallNo }}</span>
                    </div>
                  </div>
                </div>
                <div class="text-right flex-shrink-0 ml-3 flex items-center gap-3">
                  <div>
                    <div class="text-[10px] uppercase font-bold text-slate-400">Balance / Required</div>
                    <div class="text-xs font-bold text-indigo-600">
                      ₱{{ Number(s.advanceBalance || 0).toLocaleString() }} / ₱{{ Number(s.totalAdvanceAmount || 0).toLocaleString() }}
                    </div>
                  </div>
                  <i v-if="selectedStakeholder?.id === s.id && selectedPaymentType === 'ADVANCE_PAYMENT'" class="pi pi-check-circle text-indigo-600 text-lg"></i>
                </div>
              </div>

              <div v-if="advancePaymentStakeholders.length === 0" class="text-center py-12 text-slate-400">
                <i class="pi pi-check-circle text-2xl text-emerald-400 mb-1 block"></i>
                <p class="text-xs font-medium">No approved applicants awaiting advance payment.</p>
                <p class="text-[10px] text-slate-400 mt-0.5">Applicants must be approved by Treasurer first.</p>
              </div>
            </div>
          </div>

          <!-- COLUMN 2: APPLICATION FORM -->
          <div v-else-if="activeCategory === 'APPLICATION_FORM'"
               class="rounded-2xl border transition-all p-4 bg-white shadow-sm flex flex-col h-[380px]"
               :class="selectedPaymentType === 'APPLICATION_FORM' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200'">
            <!-- Column Header -->
            <div class="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <span class="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <i class="pi pi-file-edit text-lg"></i>
                </span>
                <div>
                  <h3 class="font-bold text-slate-800 text-sm">Application Form Stakeholders</h3>
                  <p class="text-[11px] text-slate-400">Applicants awaiting application and permit fee</p>
                </div>
              </div>
              <Tag :value="appFormStakeholders.length + ' Pending'" 
                   :severity="appFormStakeholders.length ? 'warn' : 'secondary'" 
                   rounded class="!text-xs font-bold" />
            </div>

            <!-- Search input -->
            <div class="mb-3">
              <span class="p-input-icon-left w-full">
                <i class="pi pi-search text-slate-400 text-xs"></i>
                <InputText v-model="searchAppForm" placeholder="Search application applicants by name, business..." class="w-full pl-8 py-2 text-xs bg-slate-50 border-slate-200 rounded-lg" />
              </span>
            </div>

            <!-- Stakeholder list -->
            <div class="flex-1 overflow-y-auto space-y-2 pr-1 custom-scroll">
              <div v-for="s in appFormStakeholders" :key="s.id"
                   @click="selectStakeholderForType(s, 'APPLICATION_FORM')"
                   class="p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between"
                   :class="selectedStakeholder?.id === s.id && selectedPaymentType === 'APPLICATION_FORM'
                           ? 'bg-amber-50 border-amber-400 shadow-sm ring-1 ring-amber-300'
                           : 'bg-slate-50/50 border-slate-100 hover:border-amber-200 hover:bg-amber-50/30'">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {{ initials(s.firstName, s.lastName) }}
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-sm text-slate-800 truncate">{{ s.firstName }} {{ s.lastName }}</div>
                    <div class="text-xs text-slate-500 truncate">{{ s.businessName || s.businessType || 'Applicant' }}</div>
                  </div>
                </div>
                <div class="text-right flex-shrink-0 ml-3 flex items-center gap-3">
                  <Tag value="FEE UNPAID" severity="danger" class="!text-[11px] !py-0.5 !px-2.5 font-bold" rounded />
                  <i v-if="selectedStakeholder?.id === s.id && selectedPaymentType === 'APPLICATION_FORM'" class="pi pi-check-circle text-amber-600 text-lg"></i>
                </div>
              </div>

              <div v-if="appFormStakeholders.length === 0" class="text-center py-12 text-slate-400">
                <i class="pi pi-check-circle text-2xl text-emerald-400 mb-1 block"></i>
                <p class="text-xs font-medium">No applicants awaiting application fee.</p>
                <p class="text-[10px] text-slate-400 mt-0.5">Paid applicants are excluded.</p>
              </div>
            </div>
          </div>

          <!-- COLUMN 3: RENT PAYMENT -->
          <div v-else-if="activeCategory === 'RENT_PAYMENT'"
               class="rounded-2xl border transition-all p-4 bg-white shadow-sm flex flex-col h-[380px]"
               :class="selectedPaymentType === 'RENT_PAYMENT' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'">
            <!-- Column Header -->
            <div class="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <span class="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <i class="pi pi-home text-lg"></i>
                </span>
                <div>
                  <h3 class="font-bold text-slate-800 text-sm">Rent Payment Tenants</h3>
                  <p class="text-[11px] text-slate-400">Tenants with occupied stalls and pending monthly billings</p>
                </div>
              </div>
              <Tag :value="rentPaymentStakeholders.length + ' Unpaid'" 
                   :severity="rentPaymentStakeholders.length ? 'danger' : 'secondary'" 
                   rounded class="!text-xs font-bold" />
            </div>

            <!-- Search input -->
            <div class="mb-3">
              <span class="p-input-icon-left w-full">
                <i class="pi pi-search text-slate-400 text-xs"></i>
                <InputText v-model="searchRent" placeholder="Search rent tenants by name, stall, business..." class="w-full pl-8 py-2 text-xs bg-slate-50 border-slate-200 rounded-lg" />
              </span>
            </div>

            <!-- Stakeholder list -->
            <div class="flex-1 overflow-y-auto space-y-2 pr-1 custom-scroll">
              <div v-for="s in rentPaymentStakeholders" :key="s.id"
                   @click="selectStakeholderForType(s, 'RENT_PAYMENT')"
                   class="p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between"
                   :class="selectedStakeholder?.id === s.id && selectedPaymentType === 'RENT_PAYMENT'
                           ? 'bg-emerald-50 border-emerald-400 shadow-sm ring-1 ring-emerald-300'
                           : 'bg-slate-50/50 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30'">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {{ initials(s.firstName, s.lastName) }}
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-sm text-slate-800 truncate">{{ s.firstName }} {{ s.lastName }}</div>
                    <div class="text-xs text-slate-500 truncate">
                      Stall: {{ s.occupant?.stall?.stallNo || 'Occupied' }}
                      <span v-if="s.businessName"> • {{ s.businessName }}</span>
                    </div>
                  </div>
                </div>
                <div class="text-right flex-shrink-0 ml-3 flex items-center gap-3">
                  <div>
                    <div class="text-[10px] uppercase font-bold text-slate-400">Total Due</div>
                    <div class="text-xs font-black text-rose-600">₱{{ getTotalUnpaidAmount(s).toLocaleString() }}</div>
                  </div>
                  <i v-if="selectedStakeholder?.id === s.id && selectedPaymentType === 'RENT_PAYMENT'" class="pi pi-check-circle text-emerald-600 text-lg"></i>
                </div>
              </div>

              <div v-if="rentPaymentStakeholders.length === 0" class="text-center py-12 text-slate-400">
                <i class="pi pi-check-circle text-2xl text-emerald-400 mb-1 block"></i>
                <p class="text-xs font-medium">No tenants with unpaid rent.</p>
                <p class="text-[10px] text-slate-400 mt-0.5">Tenants with no unpaid bills are excluded.</p>
              </div>
            </div>
          </div>

        </div>

        <!-- PAYMENT DETAILS ENTRY FOR SELECTED STAKEHOLDER -->
        <div v-if="selectedStakeholder && selectedPaymentType" 
             class="rounded-2xl border p-5 transition-all"
             :class="{
               'bg-indigo-50/40 border-indigo-200': selectedPaymentType === 'ADVANCE_PAYMENT',
               'bg-amber-50/40 border-amber-200': selectedPaymentType === 'APPLICATION_FORM',
               'bg-emerald-50/40 border-emerald-200': selectedPaymentType === 'RENT_PAYMENT'
             }">
          
          <!-- Selected Header Bar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm"
                   :class="{
                     'bg-indigo-600 text-white': selectedPaymentType === 'ADVANCE_PAYMENT',
                     'bg-amber-600 text-white': selectedPaymentType === 'APPLICATION_FORM',
                     'bg-emerald-600 text-white': selectedPaymentType === 'RENT_PAYMENT'
                   }">
                {{ initials(selectedStakeholder.firstName, selectedStakeholder.lastName) }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-extrabold text-slate-900 text-sm sm:text-base">
                    {{ selectedStakeholder.firstName }} {{ selectedStakeholder.lastName }}
                  </h4>
                  <Tag :value="formatType(selectedPaymentType)" 
                       :severity="selectedPaymentType === 'ADVANCE_PAYMENT' ? 'info' : (selectedPaymentType === 'APPLICATION_FORM' ? 'warn' : 'success')" 
                       rounded class="!text-[11px] font-bold" />
                </div>
                <p class="text-xs text-slate-500">
                  {{ selectedStakeholder.businessName }} 
                  <span v-if="selectedStakeholder.occupant?.stall?.stallNo"> • Stall {{ selectedStakeholder.occupant.stall.stallNo }}</span>
                </p>
              </div>
            </div>

            <Button icon="pi pi-times" text rounded severity="secondary" size="small" @click="resetSelection" v-tooltip="'Deselect'" class="!p-1 text-slate-400 self-end sm:self-auto" />
          </div>

          <!-- INPUT FORM FIELDS PER PAYMENT TYPE -->
          <div class="space-y-4">
            
            <!-- ADVANCE PAYMENT SPECIFIC FIELDS -->
            <div v-if="selectedPaymentType === 'ADVANCE_PAYMENT'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">Total Required Advance</label>
                <InputNumber v-model="form.totalAdvanceAmount" inputId="totalAdvance" mode="currency" currency="PHP" locale="en-PH" class="w-full" />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">Payment Amount</label>
                <InputNumber v-model="form.amount" inputId="amount" mode="currency" currency="PHP" locale="en-PH" class="w-full font-bold" />
              </div>

              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-slate-700">Receipt No. (Auto)</label>
                  <button type="button" @click="regenerateReceiptNo" class="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                    <i class="pi pi-refresh text-[9px]"></i> Auto
                  </button>
                </div>
                <div class="relative">
                  <InputText v-model="form.receiptNo" placeholder="Receipt #" class="w-full bg-slate-50/80 font-mono text-xs font-bold text-slate-700 pl-8 border-slate-200 focus:bg-white" />
                  <i class="pi pi-receipt absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">Reference No (Optional)</label>
                <InputText v-model="form.referenceNo" placeholder="Bank / Ref #" class="w-full bg-white" />
              </div>
            </div>

            <!-- APPLICATION FORM SPECIFIC FIELDS -->
            <div v-else-if="selectedPaymentType === 'APPLICATION_FORM'" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">Application Fee Amount</label>
                <InputNumber v-model="form.amount" inputId="appAmount" mode="currency" currency="PHP" locale="en-PH" class="w-full font-bold" />
              </div>

              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-slate-700">Receipt No. (Auto)</label>
                  <button type="button" @click="regenerateReceiptNo" class="text-[10px] text-amber-600 hover:text-amber-800 font-semibold flex items-center gap-1">
                    <i class="pi pi-refresh text-[9px]"></i> Auto
                  </button>
                </div>
                <div class="relative">
                  <InputText v-model="form.receiptNo" placeholder="Receipt #" class="w-full bg-slate-50/80 font-mono text-xs font-bold text-slate-700 pl-8 border-slate-200 focus:bg-white" />
                  <i class="pi pi-receipt absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">Reference No (Optional)</label>
                <InputText v-model="form.referenceNo" placeholder="Bank / Ref #" class="w-full bg-white" />
              </div>
            </div>

            <!-- RENT PAYMENT SPECIFIC FIELDS -->
            <div v-else-if="selectedPaymentType === 'RENT_PAYMENT'" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-2">Select Billing Reference to Pay</label>
                <div v-if="selectedStakeholderBillings.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-40 overflow-y-auto pr-1 custom-scroll">
                  <div v-for="b in selectedStakeholderBillings" :key="b.id"
                       class="p-2.5 rounded-xl border cursor-pointer transition-all"
                       :class="selectedBillingId === b.id ? 'bg-white border-emerald-500 ring-2 ring-emerald-200 shadow-sm' : 'bg-white/80 border-slate-200 hover:border-emerald-300'"
                       @click="selectBilling(b)">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-xs text-slate-800">{{ b.billingNo }}</span>
                      <span class="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">₱{{ Number(b.balance || 0).toLocaleString() }}</span>
                    </div>
                    <div class="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                      <span>Due: {{ formatDate(b.dueDate) }}</span>
                      <span class="uppercase font-semibold text-[10px] text-slate-400">{{ formatType(b.billingFrequency) || 'Monthly' }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="bg-white p-3 rounded-xl text-center text-slate-500 text-xs border border-slate-200">
                  No unpaid billings found for this stakeholder.
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-700">Payment Amount</label>
                  <InputNumber v-model="form.amount" inputId="rentAmount" mode="currency" currency="PHP" locale="en-PH" class="w-full font-bold" />
                </div>

                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-slate-700">Receipt No. (Auto)</label>
                    <button type="button" @click="regenerateReceiptNo" class="text-[10px] text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1">
                      <i class="pi pi-refresh text-[9px]"></i> Auto
                    </button>
                  </div>
                  <div class="relative">
                    <InputText v-model="form.receiptNo" placeholder="Receipt #" class="w-full bg-slate-50/80 font-mono text-xs font-bold text-slate-700 pl-8 border-slate-200 focus:bg-white" />
                    <i class="pi pi-receipt absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-700">Reference No (Optional)</label>
                  <InputText v-model="form.referenceNo" placeholder="Bank / Ref #" class="w-full bg-white" />
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- EMPTY STATE WHEN NO STAKEHOLDER SELECTED YET -->
        <div v-else class="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400 bg-slate-50/50">
          <i class="pi pi-hand-pointer text-xl mb-1 text-slate-300 block"></i>
          <p class="text-xs font-medium">Click on any stakeholder in the list above to enter and record payment details.</p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
            <Button label="Cancel" icon="pi pi-times" text @click="closeModal" class="text-slate-600" />
            <Button :label="confirmBtnLabel" icon="pi pi-check" @click="recordPayment" :disabled="!canRecord" :loading="isSubmitting" severity="success" class="shadow-sm" />
          </div>
        </template>
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
const selectedPaymentType = ref('')
const selectedBillingId = ref(null)

// Search fields for the 3 separated columns
const searchAdvance = ref('')
const searchAppForm = ref('')
const searchRent = ref('')

const form = ref({
  paymentType: '',
  totalAdvanceAmount: null,
  amount: null,
  referenceNo: '',
  receiptNo: ''
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
  form.value.receiptNo = generateReceiptNo(selectedPaymentType.value)
}

function selectStakeholderForType(s, type) {
  selectedStakeholder.value = s
  selectedPaymentType.value = type
  activeCategory.value = type
  form.value.paymentType = type
  form.value.referenceNo = ''
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
  if (selectedPaymentType.value !== category) {
    resetSelection()
  }
}

function resetSelection() {
  selectedStakeholder.value = null
  selectedPaymentType.value = ''
  selectedBillingId.value = null
  form.value = { paymentType: '', totalAdvanceAmount: null, amount: null, referenceNo: '', receiptNo: '' }
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
  searchAdvance.value = ''
  searchAppForm.value = ''
  searchRent.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetSelection()
}

const canRecord = computed(() => {
  if (!selectedStakeholder.value || !selectedPaymentType.value) return false
  if (Number(form.value.amount) <= 0) return false
  if (selectedPaymentType.value === 'RENT_PAYMENT') return !!selectedBillingId.value
  if (selectedPaymentType.value === 'ADVANCE_PAYMENT') return Number(form.value.totalAdvanceAmount) > 0
  return true
})

const confirmBtnLabel = computed(() => {
  if (!selectedPaymentType.value) return 'Record Payment'
  if (selectedPaymentType.value === 'ADVANCE_PAYMENT') return 'Record Advance Payment'
  if (selectedPaymentType.value === 'APPLICATION_FORM') return 'Record Application Fee'
  if (selectedPaymentType.value === 'RENT_PAYMENT') return 'Record Rent Payment'
  return 'Record Payment'
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

    if (selectedPaymentType.value === 'ADVANCE_PAYMENT' && !selectedStakeholder.value.treasurerApproved) {
      toast.add({
        severity: 'error',
        summary: 'Approval Required',
        detail: 'This stakeholder must be approved by the Treasurer before advance payment can be recorded.',
        life: 4500
      })
      return
    }

    if (selectedPaymentType.value === 'RENT_PAYMENT') {
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
      if (!selectedBillingId.value) {
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
      receiptNo: form.value.receiptNo || generateReceiptNo(selectedPaymentType.value),
      paymentType: selectedPaymentType.value
    }

    if (selectedPaymentType.value === 'RENT_PAYMENT') {
      const selectedBilling = selectedStakeholderBillings.value.find(b => b.id === selectedBillingId.value)
      payload.rentCycle = selectedBilling?.billingFrequency || 'MONTHLY'
      payload.billing = { id: selectedBillingId.value }
    }

    if (selectedPaymentType.value === 'ADVANCE_PAYMENT') {
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
