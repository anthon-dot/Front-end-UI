<template>
  <div class="collector-dashboard min-h-screen bg-slate-50 pb-24 md:pb-12">
    <!-- TOP HEADER -->
    <header class="bg-white border-b border-slate-200 px-4 py-3.5 sticky top-0 z-30 shadow-xs">
      <div class="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <i class="pi pi-wallet text-xl"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg md:text-xl font-bold text-slate-800 m-0 tracking-tight">Field Collector Mobile</h1>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Online
              </span>
            </div>
            <p class="text-xs text-slate-500 m-0 hidden sm:block">Manticao Public Market &bull; Daily Micro-Collections (₱100/day) & Field Operations</p>
          </div>
        </div>

        <!-- QUICK SECONDARY TOOLS & REFRESH -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5"
            :class="activeTab === 'inspections' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'"
            @click="activeTab = 'inspections'"
            title="Physical Stall Setup Inspections (Step 14)"
          >
            <i class="pi pi-check-square"></i>
            <span class="hidden md:inline">Setup Inspections</span>
            <span v-if="pendingInspections.length > 0" class="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-600 text-white font-bold">
              {{ pendingInspections.length }}
            </span>
          </button>

          <button
            type="button"
            class="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5"
            :class="activeTab === 'scanner' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'"
            @click="activeTab = 'scanner'"
            title="Scan QR Permit"
          >
            <i class="pi pi-qrcode"></i>
            <span class="hidden md:inline">QR Permit Scanner</span>
          </button>

          <button
            type="button"
            class="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
            @click="fetchData"
            :disabled="isLoading"
            title="Refresh sync"
          >
            <i class="pi pi-refresh" :class="{ 'pi-spin': isLoading }"></i>
          </button>
        </div>
      </div>
    </header>

    <div class="max-w-6xl mx-auto px-4 py-4">
      <!-- SUMMARY METRICS RIBBON -->
      <section class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div class="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Today's Total</span>
            <div class="text-xl font-extrabold text-teal-700 mt-0.5">₱{{ Number(todayTotalAmount).toLocaleString() }}</div>
            <span class="text-[11px] text-slate-500 font-medium">{{ todayCollections.length }} micro-payments</span>
          </div>
          <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <i class="pi pi-wallet text-sm"></i>
          </div>
        </div>

        <div class="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">To Remit</span>
            <div class="text-xl font-extrabold text-amber-600 mt-0.5">₱{{ Number(unremittedTotal).toLocaleString() }}</div>
            <span class="text-[11px] text-amber-700 font-medium">{{ unremittedCollections.length }} in pouch</span>
          </div>
          <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <i class="pi pi-send text-sm"></i>
          </div>
        </div>

        <div class="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Occupied Stalls</span>
            <div class="text-xl font-extrabold text-slate-800 mt-0.5">{{ occupiedStalls.length }}</div>
            <span class="text-[11px] text-slate-500 font-medium">Field route</span>
          </div>
          <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <i class="pi pi-shop text-sm"></i>
          </div>
        </div>

        <div class="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Weekly Sum</span>
            <div class="text-xl font-extrabold text-emerald-700 mt-0.5">₱{{ Number(weekTotalAmount).toLocaleString() }}</div>
            <span class="text-[11px] text-slate-500 font-medium">{{ weekCollections.length }} receipts</span>
          </div>
          <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <i class="pi pi-chart-line text-sm"></i>
          </div>
        </div>
      </section>

      <!-- DESKTOP / TABLET NAV TABS (HIDDEN ON NARROW MOBILE, VISIBLE ON SM+) -->
      <nav class="hidden md:flex bg-white rounded-xl border border-slate-200 px-3 pt-2 gap-2 mb-5 shadow-xs">
        <button
          type="button"
          class="py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2"
          :class="activeTab === 'collect' ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-800'"
          @click="activeTab = 'collect'"
        >
          <i class="pi pi-plus-circle"></i>
          <span>Collect</span>
        </button>

        <button
          type="button"
          class="py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2"
          :class="activeTab === 'my-collections' ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-800'"
          @click="activeTab = 'my-collections'"
        >
          <i class="pi pi-list"></i>
          <span>My Collections</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-100 text-teal-800 font-bold">
            {{ todayCollections.length }}
          </span>
        </button>

        <button
          type="button"
          class="py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2"
          :class="activeTab === 'remit' ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-800'"
          @click="activeTab = 'remit'"
        >
          <i class="pi pi-send"></i>
          <span>Remit</span>
          <span v-if="unremittedCollections.length > 0" class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
            {{ unremittedCollections.length }}
          </span>
        </button>

        <button
          type="button"
          class="py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2"
          :class="activeTab === 'lookup' ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-800'"
          @click="activeTab = 'lookup'"
        >
          <i class="pi pi-search"></i>
          <span>Vendor Lookup</span>
        </button>

        <button
          type="button"
          class="py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2"
          :class="activeTab === 'profile' ? 'border-slate-700 text-slate-800 bg-slate-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-800'"
          @click="activeTab = 'profile'"
        >
          <i class="pi pi-user"></i>
          <span>Profile</span>
        </button>
      </nav>

      <!-- ============================================================ -->
      <!-- FUNCTION 1: COLLECT (MOBILE-OPTIMIZED QUICK CASH RECORD) -->
      <!-- ============================================================ -->
      <section v-if="activeTab === 'collect'" class="space-y-4">
        <!-- Collection Card -->
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6">
          <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <span class="text-[11px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                FIELD CASHIERING
              </span>
              <h2 class="text-lg font-bold text-slate-900 mt-1 m-0">Record Daily Micro-Payment</h2>
              <p class="text-xs text-slate-500 m-0 mt-0.5">Enter collection amount &bull; Immediately updates vendor balance in ledger</p>
            </div>
            <div class="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              ₱
            </div>
          </div>

          <form @submit.prevent="submitFieldCollection" class="space-y-4">
            <!-- STEP 1: SELECT OR SEARCH VENDOR / STALL -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Select Vendor & Stall *
              </label>

              <!-- Search filter input for quick filter -->
              <div class="relative mb-2">
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  v-model="stallSearchFilter"
                  type="text"
                  class="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Quick filter stalls by vendor name or stall #..."
                />
              </div>

              <select
                v-model="collectionForm.stallId"
                class="w-full border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                @change="onStallSelected"
                required
              >
                <option value="" disabled>-- Select Occupied Stallholder --</option>
                <option
                  v-for="s in filteredOccupiedStalls"
                  :key="s.id"
                  :value="s.id"
                >
                  Stall #{{ s.stall_no }} &bull; {{ getStallVendorName(s) }} ({{ s.section?.name || 'Main Section' }})
                </option>
              </select>
            </div>

            <!-- SELECTED STALL CARD INFO (IF SELECTED) -->
            <div v-if="selectedStallDetails" class="p-3.5 bg-gradient-to-br from-teal-50/60 to-slate-50 rounded-xl border border-teal-200/80 text-xs space-y-1.5">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-[10px] text-teal-800 font-bold uppercase tracking-wider">Selected Occupant</span>
                  <div class="font-bold text-slate-900 text-sm">{{ getStallVendorName(selectedStallDetails) }}</div>
                  <div class="text-slate-500">{{ selectedStallDetails.occupant?.stakeholder?.business_name || 'Public Stallholder' }}</div>
                </div>
                <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-800">
                  Stall #{{ selectedStallDetails.stall_no }}
                </span>
              </div>
              <div class="pt-2 border-t border-teal-100/80 flex justify-between text-slate-600">
                <span>Monthly Rate: <strong>₱{{ Number(selectedStallDetails.monthly_rent || 1500).toLocaleString() }}</strong></span>
                <span>Type: <strong class="uppercase">{{ selectedStallDetails.rate_category || 'REGULAR' }}</strong></span>
              </div>
            </div>

            <!-- STEP 2: PRESET AMOUNT BUTTONS (₱50, ₱100 DEFAULT, ₱200, ₱500) -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Collection Amount (₱) *
              </label>
              
              <div class="grid grid-cols-4 gap-2 mb-2">
                <button
                  type="button"
                  class="py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex flex-col items-center"
                  :class="collectionForm.amount === 50 ? 'bg-teal-600 text-white border-teal-600 shadow-sm scale-102' : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'"
                  @click="collectionForm.amount = 50"
                >
                  <span>₱50</span>
                  <span class="text-[9px] font-normal opacity-80">Half Day</span>
                </button>

                <button
                  type="button"
                  class="py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex flex-col items-center"
                  :class="collectionForm.amount === 100 ? 'bg-teal-600 text-white border-teal-600 shadow-sm scale-102 ring-2 ring-teal-300' : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'"
                  @click="collectionForm.amount = 100"
                >
                  <span>₱100</span>
                  <span class="text-[9px] font-semibold opacity-90">Daily Standard</span>
                </button>

                <button
                  type="button"
                  class="py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex flex-col items-center"
                  :class="collectionForm.amount === 200 ? 'bg-teal-600 text-white border-teal-600 shadow-sm scale-102' : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'"
                  @click="collectionForm.amount = 200"
                >
                  <span>₱200</span>
                  <span class="text-[9px] font-normal opacity-80">2 Days</span>
                </button>

                <button
                  type="button"
                  class="py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex flex-col items-center"
                  :class="collectionForm.amount === 500 ? 'bg-teal-600 text-white border-teal-600 shadow-sm scale-102' : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'"
                  @click="collectionForm.amount = 500"
                >
                  <span>₱500</span>
                  <span class="text-[9px] font-normal opacity-80">Advance</span>
                </button>
              </div>

              <!-- CUSTOM AMOUNT INPUT -->
              <div class="relative">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₱</span>
                <input
                  v-model.number="collectionForm.amount"
                  type="number"
                  step="10"
                  min="1"
                  class="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-xl text-base font-extrabold text-teal-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter amount..."
                  required
                />
              </div>
            </div>

            <!-- NOTES / REMARKS -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">
                Remarks / Notes
              </label>
              <input
                v-model="collectionForm.notes"
                type="text"
                class="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Daily micro-collection at market stall..."
              />
            </div>

            <!-- SUBMIT BUTTON -->
            <button
              type="submit"
              class="w-full py-3.5 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white rounded-xl text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isSubmitting || !collectionForm.stallId || !collectionForm.amount"
            >
              <i class="pi pi-check" :class="{ 'pi-spin pi-spinner': isSubmitting }"></i>
              <span>{{ isSubmitting ? 'Recording Micro-Payment...' : `Record ₱${Number(collectionForm.amount || 0).toLocaleString()} Collection` }}</span>
            </button>
          </form>
        </div>

        <!-- RECENT ACTIVITY SNIPPET -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">Latest Field Collections</h3>
            <button type="button" class="text-xs font-bold text-teal-600 hover:underline cursor-pointer" @click="activeTab = 'my-collections'">
              View All ({{ todayCollections.length }})
            </button>
          </div>

          <div v-if="todayCollections.length === 0" class="text-center py-6 text-slate-400 text-xs">
            <i class="pi pi-inbox text-2xl mb-1 text-slate-300"></i>
            <p class="m-0">No collections recorded yet today.</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="c in todayCollections.slice(0, 3)"
              :key="c.id"
              class="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs"
            >
              <div>
                <div class="font-bold text-slate-800">{{ c.vendor_name || 'Market Vendor' }}</div>
                <div class="text-[11px] text-slate-400">Stall #{{ c.stall_no }} &bull; {{ c.receipt_no }}</div>
              </div>
              <div class="text-right">
                <div class="font-extrabold text-teal-700">₱{{ Number(c.amount).toLocaleString() }}</div>
                <span class="text-[10px] text-slate-400">{{ formatTime(c.created_at || c.payment_date) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================================ -->
      <!-- FUNCTION 2: MY COLLECTIONS (LIST TODAY & THIS WEEK) -->
      <!-- ============================================================ -->
      <section v-if="activeTab === 'my-collections'" class="space-y-4">
        <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
            <div>
              <h2 class="text-base font-bold text-slate-900 m-0">My Micro-Collections Ledger</h2>
              <p class="text-xs text-slate-500 m-0 mt-0.5">Filter collections recorded today vs this week</p>
            </div>

            <!-- TOGGLE FILTER (TODAY / WEEK) -->
            <div class="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold self-start sm:self-auto">
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                :class="collectionsFilter === 'today' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                @click="collectionsFilter = 'today'"
              >
                Today (₱{{ Number(todayTotalAmount).toLocaleString() }})
              </button>
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                :class="collectionsFilter === 'week' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                @click="collectionsFilter = 'week'"
              >
                This Week (₱{{ Number(weekTotalAmount).toLocaleString() }})
              </button>
            </div>
          </div>

          <!-- LIST OF COLLECTIONS -->
          <div v-if="displayedCollections.length === 0" class="text-center py-12 text-slate-400">
            <i class="pi pi-receipt text-3xl mb-2 text-slate-300"></i>
            <p class="font-semibold text-slate-700 m-0">No collections for this period</p>
            <p class="text-xs text-slate-400 mt-1">Recorded field collections will appear here in real time.</p>
          </div>

          <div v-else class="space-y-2.5">
            <div
              v-for="c in displayedCollections"
              :key="c.id"
              class="p-3.5 bg-slate-50/70 hover:bg-teal-50/30 rounded-xl border border-slate-200/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  #{{ c.stall_no || '—' }}
                </div>
                <div>
                  <div class="font-bold text-slate-900 text-xs sm:text-sm">{{ c.vendor_name || c.stakeholder?.business_name || 'Market Vendor' }}</div>
                  <div class="text-[11px] text-slate-500 font-mono mt-0.5">
                    OR Receipt: {{ c.receipt_no }} &bull; {{ formatDateTime(c.payment_date || c.created_at) }}
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="c.remittance_id ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                >
                  {{ c.remittance_id ? 'REMITTED' : 'IN POUCH' }}
                </span>
                <span class="text-sm font-extrabold text-teal-700 font-mono">
                  ₱{{ Number(c.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================================ -->
      <!-- FUNCTION 3: REMIT (END-OF-DAY RECONCILIATION & SLIP) -->
      <!-- ============================================================ -->
      <section v-if="activeTab === 'remit'" class="space-y-4">
        <!-- Remittance Action Card -->
        <div class="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-2xl p-5 sm:p-6 shadow-md">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 border border-white/30 uppercase tracking-wider inline-block mb-2">
            END-OF-DAY TREASURY REMITTANCE
          </span>
          <h2 class="text-xl sm:text-2xl font-black m-0 tracking-tight">Turn In Pouch Collections</h2>
          <p class="text-xs text-amber-100 mt-1 max-w-md">
            Aggregates total unremitted cash collected in the field today and generates a digital remittance slip for Municipal Treasury reconciliation.
          </p>

          <div class="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span class="text-xs uppercase text-amber-200 font-bold block">Unremitted Cash In Hand</span>
              <div class="text-3xl font-black mt-0.5">₱{{ Number(unremittedTotal).toLocaleString() }}</div>
              <span class="text-xs text-amber-100 font-medium">{{ unremittedCollections.length }} micro-receipts pending batch</span>
            </div>

            <button
              type="button"
              class="px-5 py-3 bg-white hover:bg-amber-50 text-amber-900 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isSubmitting || unremittedCollections.length === 0"
              @click="submitRemittanceBatch"
            >
              <i class="pi pi-send" :class="{ 'pi-spin pi-spinner': isSubmitting }"></i>
              <span>{{ isSubmitting ? 'Submitting Batch...' : `Generate Remittance Slip (₱${Number(unremittedTotal).toLocaleString()})` }}</span>
            </button>
          </div>
        </div>

        <!-- REMITTANCE HISTORY -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Remittance Batch History</h3>
          
          <div v-if="remittances.length === 0" class="text-center py-8 text-slate-400 text-xs">
            <i class="pi pi-send text-3xl mb-2 text-slate-300"></i>
            <p class="font-semibold text-slate-700 m-0">No past remittances recorded</p>
          </div>

          <div v-else class="space-y-2.5">
            <div
              v-for="rem in remittances"
              :key="rem.id"
              class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div class="font-mono font-bold text-slate-800 text-xs sm:text-sm">{{ rem.remittance_no }}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">
                  {{ rem.collection_count }} receipts &bull; {{ formatDateTime(rem.created_at) }}
                </div>
              </div>

              <div class="flex items-center justify-between sm:justify-end gap-3">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="rem.status === 'RECONCILED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                >
                  {{ rem.status === 'RECONCILED' ? 'TREASURY RECONCILED' : 'PENDING TREASURY' }}
                </span>
                <span class="text-sm font-black text-slate-900 font-mono">
                  ₱{{ Number(rem.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================================ -->
      <!-- FUNCTION 4: VENDOR LOOKUP (CHECK BALANCE & OVERDUE AT STALL) -->
      <!-- ============================================================ -->
      <section v-if="activeTab === 'lookup'" class="space-y-4">
        <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div class="pb-3 mb-4 border-b border-slate-100">
            <span class="text-[11px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              STALL-SIDE COMPLIANCE LOOKUP
            </span>
            <h2 class="text-base font-bold text-slate-900 mt-1 m-0">Vendor Ledger & Delinquency Check</h2>
            <p class="text-xs text-slate-500 m-0 mt-0.5">Quickly check outstanding balances or overdue flags while standing at the vendor stall</p>
          </div>

          <!-- SEARCH INPUT -->
          <div class="relative mb-4">
            <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              v-model="vendorLookupQuery"
              type="text"
              class="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              placeholder="Search vendor name, business name, or stall # (e.g. 02)..."
            />
          </div>

          <!-- VENDOR LIST CARDS -->
          <div class="space-y-3">
            <div
              v-for="stall in searchedStalls"
              :key="stall.id"
              class="p-4 bg-slate-50/80 hover:bg-blue-50/30 rounded-xl border border-slate-200 transition-colors"
            >
              <div class="flex items-start justify-between gap-2 mb-2">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                    #{{ stall.stall_no }}
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900 text-sm m-0">{{ getStallVendorName(stall) }}</h4>
                    <p class="text-xs text-slate-500 m-0">{{ stall.occupant?.stakeholder?.business_name || 'Market Vendor' }} &bull; {{ stall.section?.name || 'Section' }}</p>
                  </div>
                </div>

                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="isStallOverdue(stall) ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'"
                >
                  {{ isStallOverdue(stall) ? 'OVERDUE' : 'CURRENT' }}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs py-2 my-2 border-y border-slate-200/60">
                <div>
                  <span class="text-slate-400 block text-[11px]">Dimensions & Category:</span>
                  <span class="font-semibold text-slate-800">{{ stall.dimensions || '3x3m' }} &bull; {{ stall.rate_category || 'NEW' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[11px]">Monthly Due:</span>
                  <span class="font-extrabold text-slate-900">₱{{ Number(stall.monthly_rent || 1500).toLocaleString() }}/mo</span>
                </div>
              </div>

              <div class="flex items-center justify-between pt-1">
                <span class="text-[11px] text-slate-500 font-medium">3-Year Triennial Lease</span>
                <button
                  type="button"
                  class="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                  @click="quickCollectForStall(stall)"
                >
                  <i class="pi pi-wallet"></i> Collect ₱100
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================================ -->
      <!-- FUNCTION 5: PROFILE (COLLECTOR ID & SYNC STATUS) -->
      <!-- ============================================================ -->
      <section v-if="activeTab === 'profile'" class="space-y-4">
        <div class="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs max-w-xl mx-auto">
          <div class="flex items-center gap-3.5 pb-4 mb-4 border-b border-slate-100">
            <div class="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
              <i class="pi pi-user"></i>
            </div>
            <div>
              <span class="text-[11px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                AUTHORIZED FIELD STAFF
              </span>
              <h2 class="text-lg font-bold text-slate-900 mt-1 m-0">{{ authStore.user?.username || 'Collector Officer' }}</h2>
              <p class="text-xs text-slate-500 m-0">Field Revenue Collector & Market Inspector</p>
            </div>
          </div>

          <div class="space-y-3 text-xs mb-6">
            <div class="flex justify-between py-2 border-b border-slate-100">
              <span class="text-slate-500">Official Collector ID:</span>
              <span class="font-mono font-bold text-slate-800">{{ activeCollectorId }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-100">
              <span class="text-slate-500">Assigned Market Zone:</span>
              <span class="font-bold text-slate-800">Public Market of Manticao (All Sectors)</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-100 items-center">
              <span class="text-slate-500">Sync Status:</span>
              <span class="inline-flex items-center gap-1 font-bold text-emerald-700">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online & Synced
              </span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-100">
              <span class="text-slate-500">Last Sync:</span>
              <span class="text-slate-700 font-medium">{{ lastSyncTime }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-100">
              <span class="text-slate-500">App Version:</span>
              <span class="font-mono text-slate-600 font-semibold">Manticao RMS Mobile v2.4 (PWA)</span>
            </div>
          </div>

          <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
            <div>
              <div class="font-bold text-slate-800">Today's Micro-Collections:</div>
              <div class="text-slate-500">{{ todayCollections.length }} payments &bull; ₱{{ Number(todayTotalAmount).toLocaleString() }}</div>
            </div>
            <button
              type="button"
              class="px-3 py-1.5 bg-teal-600 text-white rounded-lg font-bold cursor-pointer hover:bg-teal-700"
              @click="fetchData"
            >
              Sync Now
            </button>
          </div>
        </div>
      </section>

      <!-- ============================================================ -->
      <!-- TAB: STALL SETUP INSPECTIONS (PRESERVED) -->
      <!-- ============================================================ -->
      <section v-if="activeTab === 'inspections'" class="space-y-4">
        <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div class="pb-3 mb-4 border-b border-slate-100">
            <span class="text-[11px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              STEP 14 COMPLIANCE
            </span>
            <h2 class="text-base font-bold text-slate-900 mt-1 m-0">Physical Stall Setup Inspections</h2>
            <p class="text-xs text-slate-500 m-0 mt-0.5">Verify physical wiring, boundary, fire safety, and sanitation before commercial operation</p>
          </div>

          <div v-if="pendingInspections.length === 0" class="text-center py-10 text-slate-400">
            <i class="pi pi-check-circle text-4xl text-emerald-500 mb-2"></i>
            <p class="font-semibold text-slate-800 m-0">No stalls awaiting setup inspection</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="app in pendingInspections"
              :key="app.id"
              class="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div class="font-bold text-slate-900 text-sm">
                  Stall #{{ app.stall?.stall_no || app.stall_id }} &bull; {{ app.stakeholder?.business_name }}
                </div>
                <div class="text-xs text-slate-500 mt-0.5">
                  Tenant: {{ app.stakeholder?.first_name }} {{ app.stakeholder?.last_name }} &bull; {{ app.application_no || `APP-${app.id}` }}
                </div>
              </div>
              <button
                type="button"
                class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                @click="openInspectionModal(app)"
              >
                <i class="pi pi-check-square mr-1"></i> Conduct Physical Inspection
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================================ -->
      <!-- TAB: QR PERMIT SCANNER (PRESERVED) -->
      <!-- ============================================================ -->
      <section v-if="activeTab === 'scanner'" class="space-y-4">
        <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div class="pb-3 mb-4 border-b border-slate-100">
            <span class="text-[11px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              ANTI-TAMPER VERIFICATION
            </span>
            <h2 class="text-base font-bold text-slate-900 mt-1 m-0">QR Permit Authenticity Scanner</h2>
            <p class="text-xs text-slate-500 m-0 mt-0.5">Enter permit number or SHA-256 hash digest to confirm municipal authenticity</p>
          </div>

          <div class="flex gap-2 max-w-xl mb-4">
            <input
              v-model="scanIdentifier"
              type="text"
              class="flex-1 border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. MNT-PERMIT-2026-0001 or SHA-256..."
              @keyup.enter="performInspectorScan"
            />
            <button
              type="button"
              class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              :disabled="isScanning || !scanIdentifier.trim()"
              @click="performInspectorScan"
            >
              Verify Permit
            </button>
          </div>

          <div v-if="scanResult" class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-slate-400 font-bold block">PERMIT NUMBER</span>
                <span class="font-mono font-bold text-slate-900 text-sm">{{ scanResult.permit_no }}</span>
              </div>
              <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                {{ scanResult.status }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
              <div>Vendor: <strong class="text-slate-800">{{ scanResult.vendor_name }}</strong></div>
              <div>Stall: <strong class="text-slate-800">#{{ scanResult.stall_no }}</strong></div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ============================================================ -->
    <!-- FIXED MOBILE BOTTOM NAVIGATION BAR (PRIMARY MOBILE UX) -->
    <!-- ============================================================ -->
    <nav class="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 shadow-2xl flex md:hidden items-center justify-around">
      <!-- 1. Collect -->
      <button
        type="button"
        class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer"
        :class="activeTab === 'collect' ? 'text-teal-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'"
        @click="activeTab = 'collect'"
      >
        <i class="pi pi-wallet text-lg"></i>
        <span class="text-[10px] mt-0.5">Collect</span>
      </button>

      <!-- 2. My Collections -->
      <button
        type="button"
        class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer relative"
        :class="activeTab === 'my-collections' ? 'text-teal-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'"
        @click="activeTab = 'my-collections'"
      >
        <i class="pi pi-list text-lg"></i>
        <span class="text-[10px] mt-0.5">Collections</span>
        <span v-if="todayCollections.length > 0" class="absolute top-0 right-2 w-4 h-4 bg-teal-500 text-slate-950 font-black rounded-full text-[9px] flex items-center justify-center">
          {{ todayCollections.length }}
        </span>
      </button>

      <!-- 3. Remit -->
      <button
        type="button"
        class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer relative"
        :class="activeTab === 'remit' ? 'text-amber-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'"
        @click="activeTab = 'remit'"
      >
        <i class="pi pi-send text-lg"></i>
        <span class="text-[10px] mt-0.5">Remit</span>
        <span v-if="unremittedCollections.length > 0" class="absolute top-0 right-2 w-4 h-4 bg-amber-500 text-slate-950 font-black rounded-full text-[9px] flex items-center justify-center">
          {{ unremittedCollections.length }}
        </span>
      </button>

      <!-- 4. Vendor Lookup -->
      <button
        type="button"
        class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer"
        :class="activeTab === 'lookup' ? 'text-blue-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'"
        @click="activeTab = 'lookup'"
      >
        <i class="pi pi-search text-lg"></i>
        <span class="text-[10px] mt-0.5">Lookup</span>
      </button>

      <!-- 5. Profile -->
      <button
        type="button"
        class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer"
        :class="activeTab === 'profile' ? 'text-teal-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'"
        @click="activeTab = 'profile'"
      >
        <i class="pi pi-user text-lg"></i>
        <span class="text-[10px] mt-0.5">Profile</span>
      </button>
    </nav>

    <!-- MODAL: STALL INSPECTION DECISION -->
    <div v-if="showInspectionModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        <h3 class="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
          <i class="pi pi-check-square text-blue-600"></i>
          Stall Setup Physical Inspection
        </h3>
        <p class="text-xs text-slate-500 mb-4">
          Inspecting Stall #{{ selectedInspectionApp?.stall?.stall_no }} for {{ selectedInspectionApp?.stakeholder?.business_name }}. Verify physical setup conditions.
        </p>

        <div class="space-y-2.5 mb-4 text-xs">
          <label class="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
            <input type="checkbox" v-model="inspectionForm.electricalClearance" class="w-4 h-4 text-blue-600" />
            <div>
              <div class="font-bold text-slate-800">Electrical Clearance</div>
              <div class="text-[11px] text-slate-500">Wiring compliant, circuit breaker installed.</div>
            </div>
          </label>

          <label class="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
            <input type="checkbox" v-model="inspectionForm.structuralClearance" class="w-4 h-4 text-blue-600" />
            <div>
              <div class="font-bold text-slate-800">Structural Clearance</div>
              <div class="text-[11px] text-slate-500">Within designated 3x3m boundary.</div>
            </div>
          </label>

          <label class="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
            <input type="checkbox" v-model="inspectionForm.fireSafetyClearance" class="w-4 h-4 text-blue-600" />
            <div>
              <div class="font-bold text-slate-800">Fire Safety Clearance</div>
              <div class="text-[11px] text-slate-500">Fire extinguisher accessible.</div>
            </div>
          </label>

          <label class="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
            <input type="checkbox" v-model="inspectionForm.sanitationClearance" class="w-4 h-4 text-blue-600" />
            <div>
              <div class="font-bold text-slate-800">Sanitation & Drainage Clearance</div>
              <div class="text-[11px] text-slate-500">Clean drainage connectivity, proper trash bin.</div>
            </div>
          </label>
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            @click="showInspectionModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
            :disabled="isSubmitting"
            @click="submitInspectionDecision"
          >
            {{ isSubmitting ? 'Recording...' : 'Submit Clearance (PASSED)' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const activeTab = ref('collect');
const collectionsFilter = ref('today');
const isLoading = ref(false);
const isSubmitting = ref(false);
const isScanning = ref(false);

const collections = ref([]);
const remittances = ref([]);
const applications = ref([]);
const occupiedStalls = ref([]);

const stallSearchFilter = ref('');
const vendorLookupQuery = ref('');
const scanIdentifier = ref('');
const scanResult = ref(null);

const showInspectionModal = ref(false);
const selectedInspectionApp = ref(null);

const lastSyncTime = ref(new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }));

const activeCollectorId = computed(() => {
  const uid = authStore.user?.id || '42';
  return `MNT-COL-${String(uid).slice(-4).padStart(4, '0')}`;
});

const collectionForm = ref({
  stallId: '',
  stakeholderId: null,
  amount: 100,
  notes: 'Daily field market collection'
});

const inspectionForm = ref({
  electricalClearance: true,
  structuralClearance: true,
  fireSafetyClearance: true,
  sanitationClearance: true,
  remarks: 'Physical stall setup inspected and verified safe.'
});

const todayStr = new Date().toISOString().split('T')[0];

const todayCollections = computed(() => {
  return collections.value.filter((c) => {
    const d = (c.payment_date || c.created_at || '').split('T')[0];
    return d === todayStr;
  });
});

const todayTotalAmount = computed(() => {
  return todayCollections.value.reduce((sum, c) => sum + Number(c.amount || 0), 0);
});

const weekCollections = computed(() => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return collections.value.filter((c) => {
    const d = new Date(c.payment_date || c.created_at);
    return d >= oneWeekAgo;
  });
});

const weekTotalAmount = computed(() => {
  return weekCollections.value.reduce((sum, c) => sum + Number(c.amount || 0), 0);
});

const displayedCollections = computed(() => {
  return collectionsFilter.value === 'today' ? todayCollections.value : weekCollections.value;
});

const unremittedCollections = computed(() => {
  return collections.value.filter((c) => !c.remittance_id);
});

const unremittedTotal = computed(() => {
  return unremittedCollections.value.reduce((sum, c) => sum + Number(c.amount || 0), 0);
});

const pendingInspections = computed(() => {
  return applications.value.filter(
    (app) => app.status === 'PENDING_INSPECTION' || (app.contract_executed_at && !app.hazard_free_confirmed && app.status !== 'COMPLETED')
  );
});

const filteredOccupiedStalls = computed(() => {
  if (!stallSearchFilter.value.trim()) return occupiedStalls.value;
  const q = stallSearchFilter.value.toLowerCase();
  return occupiedStalls.value.filter((s) => {
    const sNo = String(s.stall_no || '').toLowerCase();
    const vendor = getStallVendorName(s).toLowerCase();
    const bName = String(s.occupant?.stakeholder?.business_name || '').toLowerCase();
    return sNo.includes(q) || vendor.includes(q) || bName.includes(q);
  });
});

const selectedStallDetails = computed(() => {
  if (!collectionForm.value.stallId) return null;
  return occupiedStalls.value.find((s) => Number(s.id) === Number(collectionForm.value.stallId));
});

const searchedStalls = computed(() => {
  if (!vendorLookupQuery.value.trim()) return occupiedStalls.value;
  const q = vendorLookupQuery.value.toLowerCase();
  return occupiedStalls.value.filter((s) => {
    const sNo = String(s.stall_no || '').toLowerCase();
    const vendor = getStallVendorName(s).toLowerCase();
    const bName = String(s.occupant?.stakeholder?.business_name || '').toLowerCase();
    return sNo.includes(q) || vendor.includes(q) || bName.includes(q);
  });
});

function getStallVendorName(stall) {
  if (!stall) return 'Vendor';
  const st = stall.occupant?.stakeholder;
  if (st?.first_name || st?.last_name) {
    return `${st.first_name || ''} ${st.last_name || ''}`.trim();
  }
  return stall.occupant?.stakeholder?.business_name || `Vendor Stall #${stall.stall_no}`;
}

function isStallOverdue(stall) {
  return Boolean(stall?.occupant?.is_delinquent || stall?.is_delinquent);
}

function quickCollectForStall(stall) {
  collectionForm.value.stallId = stall.id;
  onStallSelected();
  activeTab.value = 'collect';
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function fetchData() {
  isLoading.value = true;
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };

    // 1. Remittances
    try {
      const remRes = await axios.get('/api/collections/remittances', { headers });
      remittances.value = remRes.data?.remittances || [];
    } catch (e) {
      remittances.value = [];
    }

    // 2. Applications
    try {
      const appRes = await axios.get('/api/applications', { headers });
      applications.value = appRes.data?.applications || [];
    } catch (e) {
      applications.value = [];
    }

    // 3. Stalls
    try {
      const stallRes = await axios.get('/api/stalls', { headers });
      const stalls = stallRes.data?.stalls || [];
      occupiedStalls.value = stalls.filter((s) => s.status === 'OCCUPIED' || s.occupant_id);
    } catch (e) {
      occupiedStalls.value = [];
    }

    // 4. Field Collections
    try {
      const payRes = await axios.get('/api/payments', { headers });
      const allPayments = payRes.data?.payments || [];
      collections.value = allPayments.filter((p) => p.payment_channel === 'FIELD_COLLECTOR' || p.payment_type === 'FIELD_COLLECTION');
    } catch (e) {
      collections.value = [];
    }

    lastSyncTime.value = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    console.error('[COLLECTOR] Fetch error:', err);
  } finally {
    isLoading.value = false;
  }
}

function onStallSelected() {
  const stall = occupiedStalls.value.find((s) => Number(s.id) === Number(collectionForm.value.stallId));
  if (stall?.occupant?.stakeholder_id) {
    collectionForm.value.stakeholderId = stall.occupant.stakeholder_id;
  }
}

async function submitFieldCollection() {
  isSubmitting.value = true;
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };
    const res = await axios.post(
      '/api/collections/field',
      {
        stallId: collectionForm.value.stallId,
        stakeholderId: collectionForm.value.stakeholderId,
        amount: collectionForm.value.amount,
        notes: collectionForm.value.notes
      },
      { headers }
    );

    const orNo = res.data?.payment?.receipt_no || res.data?.receiptNo || 'Confirmed';
    alert(`Payment recorded successfully!\nOfficial Receipt: ${orNo}\nAmount: ₱${Number(collectionForm.value.amount).toLocaleString()}`);

    collectionForm.value.stallId = '';
    collectionForm.value.amount = 100;
    await fetchData();
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to record field collection.');
  } finally {
    isSubmitting.value = false;
  }
}

async function submitRemittanceBatch() {
  if (unremittedCollections.value.length === 0) return;
  if (!confirm(`Submit ${unremittedCollections.value.length} field collections totaling ₱${unremittedTotal.value.toLocaleString()} to Municipal Treasury?`)) return;

  isSubmitting.value = true;
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };
    const res = await axios.post(
      '/api/collections/remittances',
      {
        collectionIds: unremittedCollections.value.map((c) => c.id),
        remarks: 'Daily field market collection batch remittance'
      },
      { headers }
    );

    const remNo = res.data?.remittance?.remittance_no || 'Submitted';
    alert(`Remittance batch generated successfully!\nRemittance Slip: ${remNo}\nTotal: ₱${Number(unremittedTotal.value).toLocaleString()}\nPlease turn in cash to Municipal Treasurer.`);
    await fetchData();
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to submit remittance batch.');
  } finally {
    isSubmitting.value = false;
  }
}

function openInspectionModal(app) {
  selectedInspectionApp.value = app;
  inspectionForm.value.electricalClearance = true;
  inspectionForm.value.structuralClearance = true;
  inspectionForm.value.fireSafetyClearance = true;
  inspectionForm.value.sanitationClearance = true;
  inspectionForm.value.remarks = 'Physical stall setup inspected and verified compliant with municipal standards.';
  showInspectionModal.value = true;
}

async function submitInspectionDecision() {
  if (!selectedInspectionApp.value) return;
  isSubmitting.value = true;
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };
    await axios.put(
      `/api/applications/${selectedInspectionApp.value.id}/inspector-verify`,
      {
        electricalClearance: inspectionForm.value.electricalClearance,
        structuralClearance: inspectionForm.value.structuralClearance,
        fireSafetyClearance: inspectionForm.value.fireSafetyClearance,
        sanitationClearance: inspectionForm.value.sanitationClearance,
        status: 'PASSED',
        remarks: inspectionForm.value.remarks
      },
      { headers }
    );

    showInspectionModal.value = false;
    selectedInspectionApp.value = null;
    await fetchData();
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to record stall setup inspection.');
  } finally {
    isSubmitting.value = false;
  }
}

async function performInspectorScan() {
  if (!scanIdentifier.value.trim()) return;
  isScanning.value = true;
  scanResult.value = null;
  try {
    const headers = { Authorization: `Bearer ${authStore.token}` };
    const res = await axios.get(`/api/permits/inspect/${encodeURIComponent(scanIdentifier.value.trim())}`, { headers });
    scanResult.value = res.data?.permit || res.data;
  } catch (err) {
    alert(err.response?.data?.error || 'Permit not found or invalid.');
  } finally {
    isScanning.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.collector-dashboard {
  min-height: 100vh;
}
</style>
