<template>
  <div class="min-h-screen bg-slate-100 text-slate-900 pb-16">
    
    <!-- Top Municipal Navigation Bar -->
    <header class="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-700/80 text-emerald-100 flex items-center justify-center font-black text-lg border border-emerald-500/40 shadow-xs">
            <Building2 class="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h1 class="text-sm sm:text-base font-extrabold tracking-tight text-white leading-tight">
              Manticao Public Market Rental Portal
            </h1>
            <p class="text-[11px] font-medium text-emerald-400">
              New Applicant Onboarding (Steps 1 – 8) &bull; Municipality of Manticao
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="activeApplication"
            type="button"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            @click="showDossierModal = true"
          >
            <Printer class="w-3.5 h-3.5" />
            <span>Official Dossier</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-all"
            @click="handleLogout"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
      
      <!-- VIEW 1: ACTIVE APPLICATION IN PROGRESS (TRACKER VIEW) -->
      <div v-if="activeApplication" class="space-y-6">
        <div class="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
            <div>
              <span class="text-xs uppercase font-bold tracking-wider text-slate-500 block">Active Lifecycle Application</span>
              <strong class="text-base text-slate-900 font-mono">{{ activeApplication.application_number }}</strong>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all"
              @click="loadUserData"
            >
              <RotateCw class="w-3.5 h-3.5 inline mr-1" />
              <span>Refresh Status</span>
            </button>
            <button
              type="button"
              class="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              @click="openDossier('ALL')"
            >
              <FileText class="w-3.5 h-3.5 inline mr-1" />
              <span>View &amp; Print Dossier</span>
            </button>
          </div>
        </div>

        <!-- Render the Progress Tracker Component -->
        <ApplicationTimeline
          :application="activeApplication"
          :applicant="profile"
          :stall="activeStall"
          :mayor-official="incumbentMayor"
          @open-dossier="openDossier"
          @refresh="loadUserData"
        />
      </div>

      <!-- VIEW 2: NEW APPLICATION STEPPER WIZARD -->
      <div v-else class="space-y-6">
        
        <!-- Header Hero Card -->
        <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
          <div class="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <Building2 class="w-80 h-80 text-emerald-400" />
          </div>
          <div class="max-w-2xl relative z-10">
            <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-3">
              Official Municipal Leasing System
            </span>
            <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              New Stallholder Application &amp; Lease Portal
            </h2>
            <p class="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Apply for an available public market stall, upload your single identification document, and automatically compile official print-ready municipal dossiers under the Manticao Market Code (Ordinance No. 01, Series of 2018).
            </p>
          </div>

          <!-- Stepper Indicator -->
          <div class="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div 
              v-for="st in [
                { num: 1, title: 'Stall Selection', sub: 'Choose Vacant Stall' },
                { num: 2, title: 'Personal & ID', sub: 'Single ID Upload' },
                { num: 3, title: 'Business Details', sub: 'Trade & Commodities' },
                { num: 4, title: 'Undertaking & Submit', sub: '10 Market Rules' }
              ]"
              :key="st.num"
              class="flex items-center gap-2.5 p-2 rounded-xl transition-all"
              :class="wizardStep === st.num ? 'bg-emerald-500/20 border border-emerald-500/40 text-white' : (wizardStep > st.num ? 'text-emerald-400' : 'text-slate-500')"
            >
              <div 
                class="w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0"
                :class="wizardStep === st.num ? 'bg-emerald-500 text-slate-950 font-black' : (wizardStep > st.num ? 'bg-emerald-950 border border-emerald-600 text-emerald-300' : 'bg-slate-800 text-slate-400')"
              >
                <Check v-if="wizardStep > st.num" class="w-4 h-4" />
                <span v-else>{{ st.num }}</span>
              </div>
              <div class="leading-tight">
                <span class="text-xs font-bold block">{{ st.title }}</span>
                <span class="text-[10px] text-slate-400 hidden sm:block">{{ st.sub }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 1: INTERACTIVE STALL SELECTOR -->
        <div v-if="wizardStep === 1" class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 class="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Step 1: Select an Available Public Market Stall</span>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono">
                  {{ vacantStalls.length }} Vacant
                </span>
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Only stalls with status <strong>VACANT</strong> are eligible for reservation and municipal leasing.
              </p>
            </div>

            <!-- Section Filter Pills -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <button
                v-for="sec in sectionFilters"
                :key="sec"
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                :class="selectedSectionFilter === sec ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'"
                @click="selectedSectionFilter = sec"
              >
                {{ sec }}
              </button>
            </div>
          </div>

          <!-- Stalls Grid -->
          <div v-if="filteredStalls.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="stall in filteredStalls"
              :key="stall.id"
              class="relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between"
              :class="formData.selected_stall_id === stall.id ? 'border-emerald-600 bg-emerald-50/30 shadow-md ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300 bg-white'"
              @click="selectStall(stall)"
            >
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span class="px-2.5 py-0.5 rounded-lg text-xs font-black font-mono bg-slate-900 text-white">
                    Stall #{{ stall.stall_number }}
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {{ stall.status }}
                  </span>
                </div>

                <h4 class="text-sm font-bold text-slate-900 mb-1">{{ stall.section_name }}</h4>
                <div class="text-xs text-slate-500 space-y-1 mb-4">
                  <div class="flex justify-between">
                    <span>Stall Type:</span>
                    <strong class="text-slate-800">{{ stall.stall_type }}</strong>
                  </div>
                  <div class="flex justify-between">
                    <span>Floor Area:</span>
                    <strong class="text-slate-800">{{ stall.floor_area_sqm || 12 }} sq.m.</strong>
                  </div>
                </div>
              </div>

              <!-- Rates and Fees Breakdown -->
              <div class="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs font-mono space-y-1">
                <div class="flex justify-between text-slate-600">
                  <span class="font-sans">Monthly Rental:</span>
                  <span class="font-bold text-slate-900">₱{{ formatCurrency(stall.monthly_rental_rate) }}/mo</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span class="font-sans">Stall Rights Fee:</span>
                  <span class="font-bold text-slate-900">₱{{ formatCurrency(stall.stall_rights_fee) }}</span>
                </div>
                <div class="flex justify-between text-slate-600 pt-1 border-t border-dashed border-slate-300">
                  <span class="font-sans text-[11px]">2-Mo Advance Reserve:</span>
                  <span class="font-bold text-emerald-800">₱{{ formatCurrency(stall.monthly_rental_rate * 2) }}</span>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span class="text-slate-500 font-medium">Click to select</span>
                <span 
                  class="w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[11px]"
                  :class="formData.selected_stall_id === stall.id ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 text-transparent'"
                >
                  ✓
                </span>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
            <p>No vacant stalls match this filter.</p>
          </div>

          <!-- Footer Next Button -->
          <div class="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              class="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
              :disabled="!formData.selected_stall_id"
              @click="wizardStep = 2"
            >
              <span>Continue to Personal &amp; ID Upload</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- STEP 2: PERSONAL PROFILE & SINGLE ID UPLOAD -->
        <div v-if="wizardStep === 2" class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-6">
          <div class="pb-4 border-b border-slate-100">
            <h3 class="text-lg font-black text-slate-900 tracking-tight">
              Step 2: Applicant Profile &amp; Single ID Upload
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Under municipal leasing rules, only <strong>one (1) valid government photo ID</strong> is required to be submitted.
            </p>
          </div>

          <!-- Personal Fields Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="sm:col-span-2">
              <label class="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
              <input
                v-model="formData.full_name"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden font-bold text-slate-900"
                placeholder="Enter full legal name"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Civil Status *</label>
              <select
                v-model="formData.civil_status"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden font-medium text-slate-900"
              >
                <option value="" disabled>Select civil status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Citizenship *</label>
              <input
                v-model="formData.citizenship"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden text-slate-900"
                placeholder="Enter citizenship"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="block font-bold text-slate-700 mb-1">Residential Address *</label>
              <input
                v-model="formData.residential_address"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden text-slate-900"
                placeholder="Enter residential address"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="block font-bold text-slate-700 mb-1">Contact Mobile Number *</label>
              <input
                v-model="formData.contact_number"
                type="tel"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden font-mono text-slate-900"
                placeholder="Enter contact mobile number"
              />
            </div>
          </div>

          <!-- Single ID Upload Container -->
          <div class="pt-4 border-t border-slate-100">
            <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">
              Government Identification Upload (One ID Only)
            </h4>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
              <div>
                <label class="block font-bold text-slate-700 mb-1">ID Type Presented *</label>
                <select
                  v-model="formData.valid_id_type"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden text-slate-900"
                >
                  <option value="" disabled>Select ID type</option>
                  <option value="PhilSys National ID">PhilSys National ID</option>
                  <option value="Driver's License">Driver's License</option>
                  <option value="Passport">Philippine Passport</option>
                  <option value="Voter's ID">Voter's ID / Certification</option>
                  <option value="SSS / GSIS UMID">SSS / GSIS UMID</option>
                  <option value="Barangay Certificate">Barangay Identification Certificate</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">ID Identification Number *</label>
                <input
                  v-model="formData.valid_id_number"
                  type="text"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden font-mono font-bold text-slate-900"
                  placeholder="Enter government ID number"
                />
              </div>
            </div>

            <!-- Drag and Drop Area -->
            <div 
              class="border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative"
              :class="uploadedFile ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'"
              @click="triggerFileInput"
              @dragover.prevent
              @drop.prevent="handleFileDrop"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                class="hidden"
                @change="handleFileSelect"
              />

              <div v-if="!uploadedFile" class="space-y-2">
                <div class="w-12 h-12 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                  <UploadCloud class="w-6 h-6" />
                </div>
                <div class="text-xs">
                  <span class="font-bold text-slate-800">Click to upload</span> or drag and drop your government ID
                </div>
                <p class="text-[11px] text-slate-400">PDF, PNG, or JPG (Max 10MB)</p>
              </div>

              <div v-else class="flex items-center justify-center gap-3">
                <FileCheck class="w-8 h-8 text-emerald-600" />
                <div class="text-left text-xs">
                  <strong class="font-bold text-slate-900 block">{{ uploadedFile.name }}</strong>
                  <span class="text-slate-500">{{ formatFileSize(uploadedFile.size) }} &bull; Ready for upload</span>
                </div>
                <button
                  type="button"
                  class="ml-4 p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                  @click.stop="uploadedFile = null"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Wizard Navigation -->
          <div class="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              @click="wizardStep = 1"
            >
              Back
            </button>
            <button
              type="button"
              class="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
              :disabled="!isStep2Valid"
              @click="wizardStep = 3"
            >
              <span>Continue to Business Details</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- STEP 3: BUSINESS DETAILS & INCUMBENT MAYOR -->
        <div v-if="wizardStep === 3" class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-6">
          <div class="pb-4 border-b border-slate-100">
            <h3 class="text-lg font-black text-slate-900 tracking-tight">
              Step 3: Registered Business &amp; Commodities
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Specify your trade name and commodities to sell. The Letter of Intent will be dynamically addressed to the incumbent mayor.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="sm:col-span-2">
              <label class="block font-bold text-slate-700 mb-1">Business / Trade Name *</label>
              <input
                v-model="formData.trade_name"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden font-bold text-slate-900"
                placeholder="Enter registered business or trade name"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Nature of Business *</label>
              <select
                v-model="formData.nature_of_business"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden font-medium text-slate-900"
              >
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Food/Cooked Food">Food/Cooked Food</option>
                <option value="Meat">Meat</option>
                <option value="Fish">Fish</option>
                <option value="Fruits & Vegetables">Fruits &amp; Vegetables</option>
                <option value="Dry Goods">Dry Goods</option>
                <option value="Grocery">Grocery</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Estimated Personnel / Employees *</label>
              <input
                v-model.number="formData.estimated_employees"
                type="number"
                min="0"
                max="20"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden text-slate-900 font-mono"
                placeholder="1"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="block font-bold text-slate-700 mb-1">Commodities to be Sold *</label>
              <input
                v-model="formData.commodities_to_sell"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden text-slate-900"
                placeholder="e.g. Fresh Fish, Bangus, Tilapia, and Marine Products"
              />
            </div>
          </div>

          <!-- Incumbent Mayor Dynamic Banner -->
          <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
                <Crown class="w-5 h-5 text-amber-600" />
              </div>
              <label class="flex-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Incumbent Municipal Mayor</span>
                <input
                  v-model="incumbentMayor.full_name"
                  type="text"
                  class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                  placeholder="Enter the municipal mayor’s name"
                  required
                />
              </label>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Active Executive
            </span>
          </div>

          <!-- Wizard Navigation -->
          <div class="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              @click="wizardStep = 2"
            >
              Back
            </button>
            <button
              type="button"
              class="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
              :disabled="!isStep3Valid"
              @click="wizardStep = 4"
            >
              <span>Continue to Statutory Rules</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- STEP 4: 10 STATUTORY MARKET RULES & FINAL SUBMISSION -->
        <div v-if="wizardStep === 4" class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-6">
          <div class="pb-4 border-b border-slate-100">
            <h3 class="text-lg font-black text-slate-900 tracking-tight">
              Step 4: Statutory Undertaking of Applicant
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Review and accept the 10 statutory market rules pursuant to Municipal Ordinance No. 01, Series of 2018 (Manticao Market Code).
            </p>
          </div>

          <!-- 10 Market Rules Checklist -->
          <div class="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 text-xs space-y-2.5">
            <div
              v-for="(rule, idx) in statutoryRules"
              :key="idx"
              class="flex items-start gap-2.5 text-slate-800 leading-snug"
            >
              <span class="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                {{ idx + 1 }}
              </span>
              <span>{{ rule }}</span>
            </div>
          </div>

          <!-- Acceptance Checkbox -->
          <div class="p-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/20 text-xs">
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                v-model="formData.statutory_undertaking_accepted"
                type="checkbox"
                class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 mt-0.5"
              />
              <span class="text-slate-800 leading-relaxed font-semibold">
                I hereby accept and swear to abide by the 10 statutory market rules, rental schedules, and ordinances of the Municipality of Manticao. I understand that submitting this application dynamically compiles official print-ready municipal documents that require physical wet-ink signatures.
              </span>
            </label>
          </div>

          <!-- Submission Feedback Banner -->
          <div v-if="submissionError" class="p-3 bg-red-50 border border-red-300 rounded-xl text-red-900 text-xs flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0 text-red-600" />
            <span>{{ submissionError }}</span>
          </div>

          <!-- Wizard Navigation & Submit Button -->
          <div class="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              @click="wizardStep = 3"
            >
              Back
            </button>
            <button
              type="button"
              class="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-lg transition-all inline-flex items-center gap-2 active:scale-95"
              :disabled="!formData.statutory_undertaking_accepted || isSubmitting"
              @click="submitApplication"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <CheckCircle2 v-else class="w-4 h-4" />
              <span>{{ isSubmitting ? 'Submitting Application...' : 'Submit Official Application & Mirror Documents' }}</span>
            </button>
          </div>
        </div>

      </div>
    </main>

    <!-- Document Mirroring Modal (PrintableDossier) -->
    <PrintableDossier
      :visible="showDossierModal"
      :application="dossierApplication"
      :applicant="profile"
      :stall="activeStall"
      :mayor-official="incumbentMayor"
      @close="showDossierModal = false"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Building2,
  Printer,
  LogOut,
  RotateCw,
  FileText,
  Check,
  ArrowRight,
  UploadCloud,
  FileCheck,
  X,
  Crown,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-vue-next'
import { supabase } from '../../config/supabase'
import { STATUTORY_RULES_10 } from '../../types/market-rental'
import type { Stall, Profile, Application, MunicipalOfficial } from '../../types/market-rental'
import PrintableDossier from '../../components/documents/PrintableDossier.vue'
import ApplicationTimeline from '../../components/applicant/ApplicationTimeline.vue'

const router = useRouter()
const statutoryRules = STATUTORY_RULES_10

const wizardStep = ref<number>(1)
const isSubmitting = ref<boolean>(false)
const submissionError = ref<string>('')
const showDossierModal = ref<boolean>(false)

const profile = ref<Partial<Profile>>({})
const stalls = ref<Stall[]>([])
const activeApplication = ref<Partial<Application> | null>(null)
const incumbentMayor = ref<Partial<MunicipalOfficial>>({
  full_name: '',
  position_title: 'Municipal Mayor',
  is_incumbent: true
})

const selectedSectionFilter = ref<string>('All')
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)

const formData = reactive({
  full_name: '',
  civil_status: '',
  citizenship: '',
  residential_address: '',
  contact_number: '',
  selected_stall_id: '',
  trade_name: '',
  nature_of_business: '',
  commodities_to_sell: '',
  estimated_employees: 0,
  valid_id_type: '',
  valid_id_number: '',
  statutory_undertaking_accepted: false
})

const sectionFilters = ['All', 'Phase 3 & 4 (Dry Goods)', 'Phase 1 (Wet Section)', 'Phase 2 (Commercial)', 'Table Space']

const vacantStalls = computed(() => {
  return stalls.value.filter(s => s.status === 'VACANT')
})

const filteredStalls = computed(() => {
  const filter = selectedSectionFilter.value
  if (filter === 'All') return vacantStalls.value
  if (filter.includes('Phase 3')) return vacantStalls.value.filter(s => s.section_name.includes('Phase 3'))
  if (filter.includes('Phase 1')) return vacantStalls.value.filter(s => s.section_name.includes('Phase 1'))
  if (filter.includes('Phase 2')) return vacantStalls.value.filter(s => s.section_name.includes('Phase 2'))
  if (filter.includes('Table')) return vacantStalls.value.filter(s => s.stall_type === 'TABLE_SPACE')
  return vacantStalls.value
})

const activeStall = computed(() => {
  if (activeApplication.value?.selected_stall) return activeApplication.value.selected_stall
  return stalls.value.find(s => s.id === formData.selected_stall_id) || {}
})

const isStep2Valid = computed(() => {
  return formData.full_name.trim() !== '' &&
         formData.residential_address.trim() !== '' &&
         formData.contact_number.trim() !== '' &&
         formData.valid_id_number.trim() !== '' &&
         (uploadedFile.value !== null || formData.valid_id_number.length > 5)
})

const isStep3Valid = computed(() => {
  return formData.trade_name.trim() !== '' &&
         formData.nature_of_business.trim() !== '' &&
         formData.commodities_to_sell.trim() !== '' &&
         (incumbentMayor.value.full_name || '').trim() !== ''
})

const dossierApplication = computed<Partial<Application>>(() => {
  if (activeApplication.value) return activeApplication.value
  return {
    application_number: '',
    trade_name: formData.trade_name,
    nature_of_business: formData.nature_of_business,
    commodities_to_sell: formData.commodities_to_sell,
    estimated_employees: formData.estimated_employees,
    valid_id_type: formData.valid_id_type,
    valid_id_number: formData.valid_id_number,
    applicant: profile.value as Profile,
    selected_stall: activeStall.value as Stall,
    mayor_official: incumbentMayor.value as MunicipalOfficial
  }
})

function selectStall(stall: Stall) {
  formData.selected_stall_id = stall.id
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    uploadedFile.value = target.files[0]
  }
}

function handleFileDrop(e: DragEvent) {
  if (e.dataTransfer && e.dataTransfer.files[0]) {
    uploadedFile.value = e.dataTransfer.files[0]
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function formatCurrency(val?: number | null): string {
  const n = Number(val || 0)
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function openDossier(tab: 'ALL' | 'APPLICATION' | 'LOI' | 'CONTRACT') {
  showDossierModal.value = true
}

async function loadUserData() {
  try {
    // 1. Get authenticated session
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id

    // 2. Fetch Stalls Catalog
    const { data: stallsData } = await supabase
      .from('stalls')
      .select('*')
      .order('stall_number', { ascending: true })

    if (stallsData && stallsData.length > 0) {
      stalls.value = stallsData
    }

    // 3. Fetch Incumbent Mayor
    const { data: mayorData } = await supabase
      .from('municipal_officials')
      .select('*')
      .eq('position_title', 'Municipal Mayor')
      .eq('is_incumbent', true)
      .limit(1)
      .maybeSingle()

    if (mayorData) {
      incumbentMayor.value = mayorData
    }

    // 4. If logged in, fetch profile and check for existing application
    if (userId) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (profileData) {
        profile.value = profileData
        formData.full_name = profileData.full_name || ''
        formData.civil_status = profileData.civil_status || ''
        formData.citizenship = profileData.citizenship || ''
        formData.residential_address = profileData.residential_address || ''
        formData.contact_number = profileData.contact_number || ''
      }

      // Check active application
      const { data: appData } = await supabase
        .from('applications')
        .select('*, selected_stall:stalls(*), mayor_official:municipal_officials(*)')
        .eq('applicant_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (appData) {
        activeApplication.value = appData
      }
    }
  } catch (err) {
    console.warn('[NewApplicationView] Error loading data:', err)
  }
}

async function submitApplication() {
  isSubmitting.value = true
  submissionError.value = ''

  try {
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) throw new Error('Please sign in before submitting your application.')

    // 1. Upload ID file to Supabase Storage if file exists
    let storagePath = `ids/${userId}_${Date.now()}`
    if (uploadedFile.value) {
      const fileName = `${userId}/${Date.now()}_${uploadedFile.value.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('application-documents')
        .upload(fileName, uploadedFile.value, { upsert: true })

      if (!uploadErr && uploadData?.path) {
        storagePath = uploadData.path
      }
    }

    // 2. Ensure profile exists or update it
    const profilePayload = {
      id: userId,
      full_name: formData.full_name,
      civil_status: formData.civil_status,
      citizenship: formData.citizenship,
      residential_address: formData.residential_address,
      contact_number: formData.contact_number,
      role: 'STAKEHOLDER'
    }

    await supabase
      .from('profiles')
      .upsert(profilePayload)

    // 3. Insert application into Supabase
    const appPayload = {
      applicant_id: userId,
      selected_stall_id: formData.selected_stall_id,
      trade_name: formData.trade_name,
      nature_of_business: formData.nature_of_business,
      commodities_to_sell: formData.commodities_to_sell,
      estimated_employees: Number(formData.estimated_employees ?? 0),
      valid_id_type: formData.valid_id_type,
      valid_id_number: formData.valid_id_number,
      valid_id_storage_path: storagePath,
      mayor_official_id: incumbentMayor.value.id || null,
      statutory_undertaking_accepted: formData.statutory_undertaking_accepted,
      current_status: 'SUBMITTED'
    }

    const { data: insertedApp, error: insertErr } = await supabase
      .from('applications')
      .insert(appPayload)
      .select('*, selected_stall:stalls(*), mayor_official:municipal_officials(*)')
      .single()

    if (insertErr) throw insertErr
    activeApplication.value = insertedApp

    // Open dossier automatically
    showDossierModal.value = true
  } catch (err: any) {
    submissionError.value = err.message || 'Error submitting application. Please verify your inputs.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/login')
}

onMounted(() => {
  loadUserData()
})
</script>
