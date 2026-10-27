<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto">
    <div class="relative w-full max-w-5xl bg-slate-100 rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden border border-slate-300">
      
      <!-- Non-Printable Header Toolbar -->
      <header class="no-print bg-slate-900 text-white px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-lg">
            <FileText class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-400">Official Municipal Dossier</span>
              <span class="text-slate-400 text-xs">•</span>
              <span class="text-xs font-mono text-slate-300">{{ applicationData.application_number || 'Pending submission' }}</span>
            </div>
            <h2 class="text-base sm:text-lg font-bold text-white tracking-tight">Printable Mirroring Engine (Physical Wet-Signature Workflow)</h2>
          </div>
        </div>

        <!-- Document Section Tabs -->
        <div class="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs flex-wrap">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg font-medium transition-all"
            :class="activeDocTab === 'ALL' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'"
            @click="activeDocTab = 'ALL'"
          >
            All Documents
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg font-medium transition-all"
            :class="activeDocTab === 'APPLICATION' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'"
            @click="activeDocTab = 'APPLICATION'"
          >
            Application Form (5p)
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg font-medium transition-all"
            :class="activeDocTab === 'LOI' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'"
            @click="activeDocTab = 'LOI'"
          >
            Letter of Intent (LOI)
          </button>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            @click="triggerPrint"
          >
            <Printer class="w-4 h-4" />
            <span>Print / Save to PDF</span>
          </button>
          <button
            type="button"
            class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            @click="$emit('close')"
            title="Close Dossier"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </header>

      <!-- Wet-Signature Banner (Non-Printable) -->
      <div class="no-print bg-amber-500/10 border-b border-amber-500/20 px-5 py-2.5 flex items-center gap-3 text-amber-900 text-xs shrink-0">
        <PenTool class="w-4 h-4 text-amber-600 shrink-0" />
        <p class="m-0">
          <strong>Official Wet-Signature Process:</strong> Mirrored directly from your submitted application data. Print out these municipal documents, physically affix signatures with a pen, and present them to the Manticao Market Administration. No digital/electronic signature required.
        </p>
      </div>

      <!-- Printable Documents Viewport -->
      <main id="dossierPrintArea" class="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200 print:bg-white print:p-0 print:overflow-visible">
        <div class="max-w-[8.5in] mx-auto flex flex-col gap-8 print:gap-0 print:max-w-none">
          
          <!-- ========================================================================= -->
          <!-- 1. OFFICIAL UNIFIED APPLICATION FORM FOR STALL RENTAL/OCCUPANCY           -->
          <!-- ========================================================================= -->
          <section v-if="activeDocTab === 'ALL' || activeDocTab === 'APPLICATION'" class="dossier-document-group">
            
            <!-- APP FORM PAGE 1 -->
            <article class="sheet-page">
              <div class="text-center pb-2 mb-3">
                <p class="text-[11px] font-serif uppercase tracking-widest text-slate-700 m-0 leading-tight">REPUBLIC OF THE PHILIPPINES</p>
                <p class="text-[11px] font-serif uppercase tracking-widest text-slate-700 m-0 leading-tight">PROVINCE OF MISAMIS ORIENTAL</p>
                <h1 class="text-sm font-serif font-black uppercase tracking-wide text-slate-950 m-0">MUNICIPALITY OF MANTICAO</h1>
                <h2 class="text-xs font-serif font-bold uppercase tracking-wider text-slate-900 mt-1">MANTICAO PUBLIC MARKET</h2>
                <div class="mt-2 text-xs font-black uppercase tracking-wider border-y-2 border-slate-900 py-1">
                  UNIFIED APPLICATION FORM FOR STALL RENTAL/OCCUPANCY
                </div>
              </div>

              <div class="text-xs font-serif space-y-1 mb-4">
                <div class="flex items-center">
                  <span class="w-32 font-bold text-slate-800">Application No.:</span>
                  <span class="border-b border-slate-800 flex-1 font-mono font-bold text-slate-950 px-2">
                    {{ applicationData.application_number || 'Pending submission' }}
                  </span>
                </div>
                <div class="flex items-center">
                  <span class="w-32 font-bold text-slate-800">Date Filed:</span>
                  <span class="border-b border-slate-800 flex-1 px-2 font-semibold">
                    {{ formatDate(applicationData.created_at || new Date()) }}
                  </span>
                </div>
              </div>

              <!-- I. APPLICANT'S INFORMATION -->
              <div class="text-xs font-serif mb-4">
                <h3 class="font-bold uppercase tracking-wide text-slate-950 border-b border-slate-900 pb-0.5 mb-2">
                  I. APPLICANT'S INFORMATION
                </h3>
                <div class="space-y-2">
                  <div>
                    <span class="font-bold text-slate-700 block text-[11px]">Full Name:</span>
                    <div class="border-b border-slate-800 font-bold text-slate-950 uppercase px-1 py-0.5">
                      {{ applicantInfo.full_name || 'N/A' }}
                    </div>
                  </div>
                  <div>
                    <span class="font-bold text-slate-700 block text-[11px]">Address:</span>
                    <div class="border-b border-slate-800 text-slate-900 px-1 py-0.5">
                      {{ applicantInfo.residential_address || 'Manticao, Misamis Oriental' }}
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="font-bold text-slate-700 block text-[11px]">Contact Number:</span>
                      <div class="border-b border-slate-800 font-mono text-slate-900 px-1 py-0.5">
                        {{ applicantInfo.contact_number || 'N/A' }}
                      </div>
                    </div>
                    <div>
                      <span class="font-bold text-slate-700 block text-[11px]">Civil Status / Citizenship:</span>
                      <div class="border-b border-slate-800 text-slate-900 px-1 py-0.5">
                        {{ applicantInfo.civil_status || 'Single' }} / {{ applicantInfo.citizenship || 'Filipino' }}
                      </div>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="font-bold text-slate-700 block text-[11px]">Valid ID Presented:</span>
                      <div class="border-b border-slate-800 text-slate-900 px-1 py-0.5">
                        {{ applicationData.valid_id_type || "Driver's License" }}
                      </div>
                    </div>
                    <div>
                      <span class="font-bold text-slate-700 block text-[11px]">ID No.:</span>
                      <div class="border-b border-slate-800 font-mono font-bold text-slate-950 px-1 py-0.5">
                        {{ applicationData.valid_id_number || 'N/A' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- II. BUSINESS INFORMATION TO ENGAGED -->
              <div class="text-xs font-serif mb-4">
                <h3 class="font-bold uppercase tracking-wide text-slate-950 border-b border-slate-900 pb-0.5 mb-2">
                  II. BUSINESS INFORMATION TO BE ENGAGED
                </h3>
                <div class="space-y-2">
                  <div>
                    <span class="font-bold text-slate-700 block text-[11px]">Business/Trade Name:</span>
                    <div class="border-b border-slate-800 font-bold text-slate-950 px-1 py-0.5">
                      {{ applicationData.trade_name || 'N/A' }}
                    </div>
                  </div>

                  <div>
                    <span class="font-bold text-slate-700 block text-[11px] mb-1">Nature of Business:</span>
                    <div class="grid grid-cols-4 gap-2 text-[11px] pl-1">
                      <label v-for="cat in ['Retail', 'Wholesale', 'Food/Cooked Food', 'Meat', 'Fish', 'Fruits & Vegetables', 'Dry Goods', 'Grocery']" :key="cat" class="flex items-center gap-1.5">
                        <span class="w-3.5 h-3.5 border border-slate-800 flex items-center justify-center font-bold text-[9px]" :class="isNatureMatch(cat) ? 'bg-slate-950 text-white' : ''">
                          {{ isNatureMatch(cat) ? '✓' : '' }}
                        </span>
                        <span>{{ cat }}</span>
                      </label>
                    </div>
                    <div class="flex items-center mt-1.5 text-[11px]">
                      <span class="w-3.5 h-3.5 border border-slate-800 flex items-center justify-center font-bold text-[9px] mr-1.5" :class="isOtherNature ? 'bg-slate-950 text-white' : ''">
                        {{ isOtherNature ? '✓' : '' }}
                      </span>
                      <span>Others: </span>
                      <span class="border-b border-slate-800 flex-1 px-2 italic">{{ otherNatureText }}</span>
                    </div>
                  </div>

                  <div>
                    <span class="font-bold text-slate-700 block text-[11px]">Products/Commodities to be Sold:</span>
                    <div class="border-b border-slate-800 text-slate-950 px-1 py-0.5">
                      {{ applicationData.commodities_to_sell || 'Authorized Market Goods' }}
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <span class="font-bold text-slate-700 block text-[11px] mb-1">Type of Stall/Space Applied For:</span>
                      <div class="flex gap-4 text-[11px]">
                        <label class="flex items-center gap-1.5">
                          <span class="w-3.5 h-3.5 border border-slate-800 flex items-center justify-center font-bold text-[9px]" :class="stallInfo.stall_type !== 'TABLE_SPACE' ? 'bg-slate-950 text-white' : ''">
                            {{ stallInfo.stall_type !== 'TABLE_SPACE' ? '✓' : '' }}
                          </span>
                          <span>Regular Stall</span>
                        </label>
                        <label class="flex items-center gap-1.5">
                          <span class="w-3.5 h-3.5 border border-slate-800 flex items-center justify-center font-bold text-[9px]" :class="stallInfo.stall_type === 'TABLE_SPACE' ? 'bg-slate-950 text-white' : ''">
                            {{ stallInfo.stall_type === 'TABLE_SPACE' ? '✓' : '' }}
                          </span>
                          <span>Table Space</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <span class="font-bold text-slate-700 block text-[11px]">Preferred Stall/Space No.:</span>
                      <div class="border-b border-slate-800 font-mono font-bold text-slate-950 px-1 py-0.5">
                        {{ stallInfo.stall_number }} ({{ stallInfo.section_name }})
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Page Footer -->
              <footer class="mt-auto pt-2 border-t border-slate-300 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Unified Application Form • Manticao Public Market</span>
                <span>Page 1 of 5</span>
              </footer>
            </article>

            <!-- APP FORM PAGE 2 -->
            <article class="sheet-page">
              <div class="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-300 pb-1 mb-4 font-mono">
                <span>MANTICAO PUBLIC MARKET • UNIFIED APPLICATION FORM</span>
                <span>Ref: {{ applicationData.application_number }}</span>
              </div>

              <div class="text-xs font-serif space-y-4 text-justify">
                <div class="flex items-center">
                  <span class="font-bold text-slate-700 mr-2">Estimated Number of Employees:</span>
                  <span class="border-b border-slate-800 px-3 font-bold">{{ applicationData.estimated_employees || 0 }}</span>
                </div>

                <!-- III. APPLICATION -->
                <div>
                  <h3 class="font-bold uppercase tracking-wide text-slate-950 border-b border-slate-900 pb-0.5 mb-2">
                    III. APPLICATION
                  </h3>
                  <div class="space-y-2 text-[11px] leading-relaxed">
                    <p>
                      I hereby apply for the <strong>rental/lease/occupancy</strong> of a stall or space at the <strong>Manticao Public Market</strong> for the purpose of conducting the business described above.
                    </p>
                    <p>
                      I certify that all information provided in this application is true and correct to the best of my knowledge. I understand that the approval of this application shall be subject to the availability of the requested stall/space and compliance with applicable laws, ordinances, market rules and regulations, and requirements of the Municipal Government of Manticao.
                    </p>
                    <p>
                      I further agree to pay all applicable rental fees, market fees, permits, deposits, utilities, and other lawful charges associated with the use and occupancy of the stall/space.
                    </p>
                    <p>
                      I understand that the stall/space shall be used only for the approved purpose and that any transfer, subleasing, alteration, or change in business activity shall require prior approval from the proper municipal office.
                    </p>
                  </div>
                </div>

                <!-- IV. DOCUMENTARY REQUIREMENTS -->
                <div>
                  <h3 class="font-bold uppercase tracking-wide text-slate-950 border-b border-slate-900 pb-0.5 mb-2">
                    IV. DOCUMENTARY REQUIREMENTS
                  </h3>
                  <p class="text-[11px] text-slate-700 mb-1">Please check the documents submitted:</p>
                  <div class="space-y-1 text-[11px]">
                    <div class="flex items-center gap-2">
                      <span class="w-3.5 h-3.5 border border-slate-800 bg-slate-950 text-white flex items-center justify-center font-bold text-[9px]">✓</span>
                      <span>[ X ] Accomplished Unified Application Form</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-3.5 h-3.5 border border-slate-800 bg-slate-950 text-white flex items-center justify-center font-bold text-[9px]">✓</span>
                      <span>[ X ] Photocopy of Valid Government-Issued ID ({{ applicationData.valid_id_type }})</span>
                    </div>
                  </div>
                </div>

                <!-- V. UNDERTAKING OF APPLICANT (Part 1) -->
                <div>
                  <h3 class="font-bold uppercase tracking-wide text-slate-950 border-b border-slate-900 pb-0.5 mb-2">
                    V. UNDERTAKING OF APPLICANT
                  </h3>
                  <p class="text-[11px] font-bold text-slate-900 mb-1">I hereby undertake to:</p>
                  <ol class="list-decimal pl-4 space-y-1 text-[11px] leading-snug">
                    <li>Use the assigned stall/space only for the approved business activity.</li>
                    <li>Comply with all existing market rules and regulations and applicable municipal ordinances.</li>
                    <li>Maintain cleanliness, sanitation, and proper waste disposal within and around the stall.</li>
                    <li>Pay rentals, fees, utilities, and other lawful charges on time.</li>
                    <li>Not sublease, transfer, assign, or allow another person to use the stall without prior written approval.</li>
                    <li>Maintain the stall and its fixtures in good and sanitary condition.</li>
                    <li>Comply with all health, safety, fire, sanitation, and other applicable requirements.</li>
                    <li>Vacate the stall/space upon lawful termination, expiration, or cancellation of the authority to occupy it.</li>
                    <li>Submit updated documents whenever required by the Municipal Government.</li>
                  </ol>
                </div>
              </div>

              <!-- Page Footer -->
              <footer class="mt-auto pt-2 border-t border-slate-300 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Unified Application Form • Manticao Public Market</span>
                <span>Page 2 of 5</span>
              </footer>
            </article>

            <!-- APP FORM PAGE 3 -->
            <article class="sheet-page">
              <div class="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-300 pb-1 mb-4 font-mono">
                <span>MANTICAO PUBLIC MARKET • EVALUATION &amp; ASSESSMENT</span>
                <span>Ref: {{ applicationData.application_number }}</span>
              </div>

              <div class="text-xs font-serif space-y-4 text-justify">
                <!-- V. Undertaking (Rule 10 + Concluding clause) -->
                <div>
                  <ol start="10" class="list-decimal pl-4 text-[11px] mb-2">
                    <li>Accept the applicable penalties or other lawful remedies for violations of market rules and regulations.</li>
                  </ol>
                  <p class="text-[11px] leading-relaxed text-slate-800">
                    I understand that approval of this application does <strong>not</strong> constitute ownership of the stall or market property and that occupancy is subject to the applicable laws, ordinances, rules, regulations, and terms and conditions imposed by the Municipal Government of Manticao.
                  </p>

                  <!-- Physical Wet Signature Line of Applicant -->
                  <div class="mt-4 grid grid-cols-2 gap-6 text-xs">
                    <div>
                      <span class="text-[11px] text-slate-700 block mb-6">Applicant's Signature:</span>
                      <div class="border-b-2 border-slate-900 pb-0.5 text-center font-bold uppercase text-slate-950">
                        {{ applicantInfo.full_name }}
                      </div>
                      <span class="text-[10px] text-slate-500 block text-center mt-0.5">(Physical Wet Signature)</span>
                    </div>
                    <div>
                      <span class="text-[11px] text-slate-700 block mb-6">Date:</span>
                      <div class="border-b-2 border-slate-900 pb-0.5 text-center font-semibold text-slate-950">
                        {{ formatDate(new Date()) }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- VI. EVALUATION AND RECOMMENDATION -->
                <div class="pt-2">
                  <h3 class="font-bold uppercase tracking-wide text-slate-950 border-b-2 border-slate-900 pb-0.5 mb-2">
                    VI. EVALUATION AND RECOMMENDATION
                  </h3>

                  <!-- A. MARKET OFFICE EVALUATION -->
                  <div class="border border-slate-300 p-2.5 bg-slate-50/50 mb-3 space-y-1.5 text-[11px]">
                    <div class="font-bold uppercase tracking-wider text-slate-900">A. MARKET OFFICE EVALUATION</div>
                    <div class="flex items-center gap-4">
                      <span class="font-semibold text-slate-700">Application Status:</span>
                      <span class="flex items-center gap-1"><span class="w-3.5 h-3.5 border border-slate-800 bg-slate-950 text-white flex items-center justify-center font-bold text-[9px]">✓</span> [ X ] Complete</span>
                      <span class="flex items-center gap-1"><span class="w-3.5 h-3.5 border border-slate-800 flex items-center justify-center font-bold text-[9px]"></span> [ ] Incomplete</span>
                    </div>
                    <div class="flex items-center">
                      <span class="w-48 font-semibold text-slate-700">Stall/Space No. Recommended:</span>
                      <span class="border-b border-slate-800 flex-1 font-mono font-bold">{{ stallInfo.stall_number }}</span>
                    </div>
                    <div class="flex items-center">
                      <span class="w-48 font-semibold text-slate-700">Market Section:</span>
                      <span class="border-b border-slate-800 flex-1">{{ stallInfo.section_name }}</span>
                    </div>
                    <div class="flex items-center">
                      <span class="w-48 font-semibold text-slate-700">Nature of Business:</span>
                      <span class="border-b border-slate-800 flex-1">{{ applicationData.nature_of_business }}</span>
                    </div>
                    <div class="flex items-center">
                      <span class="w-48 font-semibold text-slate-700">Remarks:</span>
                      <span class="border-b border-slate-800 flex-1 italic text-slate-800">{{ applicationData.market_remarks || 'Stall inspected and found compliant with market boundary code.' }}</span>
                    </div>
                  </div>

                  <!-- B. ASSESSMENT AND TREASURY RECOMMENDATION -->
                  <div class="border border-slate-300 p-2.5 bg-slate-50/50 space-y-1.5 text-[11px]">
                    <div class="font-bold uppercase tracking-wider text-slate-900">B. ASSESSMENT AND TREASURY RECOMMENDATION</div>
                    <p class="text-[10px] text-slate-600 mb-1 leading-tight">
                      The application has been reviewed for applicable market rentals, fees, charges, deposits, and other lawful collections, subject to existing municipal ordinances and regulations.
                    </p>
                    <div class="space-y-1 font-mono text-[11px]">
                      <div class="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                        <span class="font-serif">Monthly Rental/Occupancy Fee:</span>
                        <span class="font-bold">₱ {{ formatCurrency(stallInfo.monthly_rental_rate || 0) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                        <span class="font-serif">Other Applicable Fees/Charges (Stall Rights):</span>
                        <span class="font-bold">₱ {{ formatCurrency(stallInfo.stall_rights_fee || 0) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                        <span class="font-serif">Security Deposit (2-Month Advance Reserve):</span>
                        <span class="font-bold">₱ {{ formatCurrency((stallInfo.monthly_rental_rate || 0) * 2) }}</span>
                      </div>
                      <div class="flex justify-between font-bold text-xs pt-1">
                        <span class="font-serif">Total Amount Due:</span>
                        <span class="text-emerald-950 font-bold">₱ {{ formatCurrency((stallInfo.stall_rights_fee || 0) + ((stallInfo.monthly_rental_rate || 0) * 2)) }}</span>
                      </div>
                    </div>
                    <div class="flex items-center pt-1 font-serif text-[11px]">
                      <span class="w-32 font-semibold text-slate-700">Treasury Remarks:</span>
                      <span class="border-b border-slate-800 flex-1 italic text-slate-800">
                        {{ applicationData.treasury_or_number ? `Paid under OR #${applicationData.treasury_or_number} on ${formatDate(applicationData.treasury_payment_date)}` : 'Assessed per Municipal Market Ordinance No. 01 Series of 2018.' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Page Footer -->
              <footer class="mt-auto pt-2 border-t border-slate-300 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Unified Application Form • Manticao Public Market</span>
                <span>Page 3 of 5</span>
              </footer>
            </article>

            <!-- APP FORM PAGE 4 -->
            <article class="sheet-page">
              <div class="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-300 pb-1 mb-4 font-mono">
                <span>MANTICAO PUBLIC MARKET • RECOMMENDATION &amp; MAYORAL APPROVAL</span>
                <span>Ref: {{ applicationData.application_number }}</span>
              </div>

              <div class="text-xs font-serif space-y-4">
                <!-- C. FINAL RECOMMENDATION -->
                <div>
                  <h4 class="font-bold uppercase tracking-wide text-slate-950 border-b border-slate-900 pb-0.5 mb-2 text-[11px]">
                    C. FINAL RECOMMENDATION
                  </h4>
                  <p class="text-[11px] text-slate-800 mb-2">
                    Based on the evaluation of the Market Office and the assessment of the Municipal Treasurer:
                  </p>
                  <div class="flex items-center gap-6 text-[11px] mb-2 font-bold">
                    <label class="flex items-center gap-1.5">
                      <span class="w-3.5 h-3.5 border border-slate-800 bg-slate-950 text-white flex items-center justify-center font-bold text-[9px]">✓</span>
                      <span>[ X ] RECOMMENDED FOR APPROVAL</span>
                    </label>
                    <label class="flex items-center gap-1.5">
                      <span class="w-3.5 h-3.5 border border-slate-800 flex items-center justify-center font-bold text-[9px]"></span>
                      <span>[ ] NOT RECOMMENDED FOR APPROVAL</span>
                    </label>
                  </div>
                  <div class="flex items-center text-[11px] mb-4">
                    <span class="w-32 font-semibold text-slate-700">Reason/Remarks:</span>
                    <span class="border-b border-slate-800 flex-1 italic text-slate-800">Duly qualified and passed sanitation and market pre-qualifications.</span>
                  </div>

                  <div class="text-[11px] font-bold uppercase text-slate-800 mb-4">RECOMMENDED BY:</div>
                  <div class="grid grid-cols-2 gap-8 text-center text-xs">
                    <div>
                      <div class="text-[10px] font-bold text-slate-600 mb-6">MUNICIPAL TREASURER:</div>
                      <div class="border-b border-slate-900 pb-0.5 font-bold uppercase text-slate-950">
                        NAIDA BEBETH A. MAGDAYO
                      </div>
                      <div class="text-[10px] text-slate-600 mt-0.5">Signature &bull; Date: _________________</div>
                    </div>
                    <div>
                      <div class="text-[10px] font-bold text-slate-600 mb-6">MARKET SUPERVISOR / ADMINISTRATOR:</div>
                      <div class="border-b border-slate-900 pb-0.5 font-bold uppercase text-slate-950">
                        MR. EDGAR EYANA
                      </div>
                      <div class="text-[10px] text-slate-600 mt-0.5">Signature &bull; Date: _________________</div>
                    </div>
                  </div>
                </div>

                <!-- D. APPROVAL OF MUNICIPAL MAYOR -->
                <div class="pt-4 border-t-2 border-slate-900">
                  <h4 class="font-bold uppercase tracking-wide text-slate-950 pb-0.5 mb-2 text-[11px]">
                    D. APPROVAL
                  </h4>
                  <p class="text-[11px] text-slate-800 mb-2">
                    Upon review of the application, supporting documents, evaluation, and recommendations:
                  </p>
                  <div class="flex items-center gap-6 text-[11px] mb-2 font-bold">
                    <label class="flex items-center gap-1.5">
                      <span class="w-3.5 h-3.5 border border-slate-800 flex items-center justify-center font-bold text-[9px]" :class="isMayorApproved ? 'bg-slate-950 text-white' : ''">
                        {{ isMayorApproved ? '✓' : '' }}
                      </span>
                      <span>[ {{ isMayorApproved ? 'X' : ' ' }} ] APPROVED</span>
                    </label>
                    <label class="flex items-center gap-1.5">
                      <span class="w-3.5 h-3.5 border border-slate-800 flex items-center justify-center font-bold text-[9px]" :class="isMayorDisapproved ? 'bg-red-700 text-white' : ''">
                        {{ isMayorDisapproved ? '✓' : '' }}
                      </span>
                      <span>[ {{ isMayorDisapproved ? 'X' : ' ' }} ] DISAPPROVED</span>
                    </label>
                  </div>
                  <div class="flex items-center text-[11px] mb-4">
                    <span class="w-40 font-semibold text-slate-700">Conditions/Remarks, if any:</span>
                    <span class="border-b border-slate-800 flex-1 italic text-slate-800">{{ applicationData.mayor_remarks || '' }}</span>
                  </div>

                  <div class="text-[11px] font-bold uppercase text-slate-800 mb-2">APPROVED BY:</div>
                  <div class="max-w-xs mx-auto text-center pt-4">
                    <div class="text-[10px] font-bold text-slate-600 mb-6">MUNICIPAL MAYOR:</div>
                    <div class="border-b-2 border-slate-900 pb-0.5 font-bold uppercase text-sm text-slate-950">
                      {{ incumbentMayorName }}
                    </div>
                    <div class="text-[10px] text-slate-600 mt-0.5">Signature &bull; Date: _________________</div>
                  </div>
                </div>

                <!-- E. STALL ASSIGNMENT AND PAYMENT -->
                <div class="pt-4 border-t border-slate-400 text-[11px]">
                  <h4 class="font-bold uppercase tracking-wide text-slate-950 mb-2">
                    E. STALL ASSIGNMENT AND PAYMENT
                  </h4>
                  <div class="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div class="flex items-center">
                      <span class="w-36 font-semibold text-slate-700">Assigned Stall/Space No.:</span>
                      <span class="border-b border-slate-800 flex-1 font-mono font-bold">{{ stallInfo.stall_number }}</span>
                    </div>
                    <div class="flex items-center">
                      <span class="w-36 font-semibold text-slate-700">Market Section:</span>
                      <span class="border-b border-slate-800 flex-1">{{ stallInfo.section_name }}</span>
                    </div>
                    <div class="flex items-center">
                      <span class="w-36 font-semibold text-slate-700">Effectivity of Occupancy:</span>
                      <span class="border-b border-slate-800 flex-1">{{ formatContractDate(applicationData.contract_start_date) }}</span>
                    </div>
                    <div class="flex items-center">
                      <span class="w-36 font-semibold text-slate-700">Monthly Rental:</span>
                      <span class="border-b border-slate-800 flex-1 font-mono">₱ {{ formatCurrency(stallInfo.monthly_rental_rate || 0) }}</span>
                    </div>
                    <div class="flex items-center">
                      <span class="w-36 font-semibold text-slate-700">Official Receipt No.:</span>
                      <span class="border-b border-slate-800 flex-1 font-mono font-bold">{{ applicationData.treasury_or_number || '____________________' }}</span>
                    </div>
                    <div class="flex items-center">
                      <span class="w-36 font-semibold text-slate-700">Date of Payment:</span>
                      <span class="border-b border-slate-800 flex-1">{{ formatDate(applicationData.treasury_payment_date) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Page Footer -->
              <footer class="mt-auto pt-2 border-t border-slate-300 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Unified Application Form • Manticao Public Market</span>
                <span>Page 4 of 5</span>
              </footer>
            </article>

            <!-- APP FORM PAGE 5 -->
            <article class="sheet-page">
              <div class="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-300 pb-1 mb-4 font-mono">
                <span>MANTICAO PUBLIC MARKET • APPLICANT ACKNOWLEDGMENT</span>
                <span>Ref: {{ applicationData.application_number }}</span>
              </div>

              <div class="text-xs font-serif space-y-6 pt-4 text-justify">
                <!-- F. ACKNOWLEDGMENT OF APPLICANT -->
                <div>
                  <h3 class="font-bold uppercase tracking-wide text-slate-950 border-b-2 border-slate-900 pb-1 mb-4 text-sm">
                    F. ACKNOWLEDGMENT OF APPLICANT
                  </h3>
                  <p class="text-xs leading-relaxed text-slate-900 mb-6">
                    I acknowledge that the approval of this application authorizes me to occupy only the assigned stall/space and does not constitute ownership of the stall or market property. I agree to comply with all applicable laws, municipal ordinances, market rules and regulations, rental conditions, sanitation requirements, and payment obligations.
                  </p>

                  <div class="max-w-md mx-auto pt-8">
                    <span class="text-xs font-bold text-slate-700 block mb-8">Applicant's Signature:</span>
                    <div class="border-b-2 border-slate-900 pb-1 text-center font-bold text-sm uppercase text-slate-950">
                      {{ applicantInfo.full_name }}
                    </div>
                    <div class="text-[11px] text-slate-600 text-center mt-1">(Affix Physical Wet Signature in Ink)</div>

                    <div class="mt-8 flex items-center">
                      <span class="font-bold text-slate-800 mr-2">Date:</span>
                      <span class="border-b-2 border-slate-900 flex-1 px-2 font-semibold text-slate-950">{{ formatDate(new Date()) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Page Footer -->
              <footer class="mt-auto pt-2 border-t border-slate-300 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Unified Application Form • Manticao Public Market</span>
                <span>Page 5 of 5</span>
              </footer>
            </article>
          </section>

          <!-- ========================================================================= -->
          <!-- 2. OFFICIAL LETTER OF INTENT (LOI)                                         -->
          <!-- ========================================================================= -->
          <section v-if="activeDocTab === 'ALL' || activeDocTab === 'LOI'" class="dossier-document-group">
            <article class="sheet-page">
              <!-- Date -->
              <div class="text-xs font-serif mb-6">
                Date: <span class="border-b border-slate-800 px-3 font-semibold">{{ formatDate(applicationData.created_at || new Date()) }}</span>
              </div>

              <!-- Addressee -->
              <div class="text-xs font-serif leading-relaxed text-slate-900 mb-6">
                <div class="font-bold uppercase tracking-wide">{{ incumbentMayorName }}</div>
                <div>MUNICIPAL MAYOR</div>
                <div>MANTICAO, MISAMIS ORIENTAL</div>
              </div>

              <!-- Subject Line -->
              <div class="text-xs font-serif font-bold text-slate-950 mb-4">
                Subject: Letter of Intent - Market Stall Application
              </div>

              <!-- Salutation -->
              <div class="text-xs font-serif text-slate-900 mb-4">
                Dear Mayor:<br /><br />
                Greetings!
              </div>

              <!-- Letter Body (Exact match with official municipal document) -->
              <div class="text-xs font-serif leading-relaxed text-slate-900 space-y-4 text-justify">
                <p>
                  I am respectfully expressing my intent to apply for an available stall/space at 
                  <strong class="border-b border-slate-800 px-2">Stall No. {{ stallInfo.stall_number }} ({{ stallInfo.section_name }})</strong>
                  at the Manticao Public Market for the purpose of establishing and operating 
                  <strong class="border-b border-slate-800 px-2">{{ applicationData.commodities_to_sell || applicationData.trade_name }}</strong>.
                </p>

                <p>
                  I am willing to comply with all the necessary requirements, permits, rental fees, and other rules and regulations of the Municipal Government and Market Administration.
                </p>

                <p>
                  I sincerely hope that my application will be given due consideration. Thank you for your kind attention and assistance.
                </p>
              </div>

              <!-- Complimentary Close -->
              <div class="mt-10 text-xs font-serif text-slate-900">
                <p class="mb-10">Respectfully yours,</p>
                <div class="max-w-md">
                  <div class="border-b-2 border-slate-900 pb-1 font-bold text-sm uppercase text-slate-950 text-center">
                    {{ applicantInfo.full_name }}
                  </div>
                  <div class="text-[11px] text-slate-600 text-center mb-6">(Signature over Printed Name)</div>

                  <div class="space-y-2 text-xs">
                    <div class="flex items-center">
                      <span class="w-32 font-bold text-slate-700">Address:</span>
                      <span class="border-b border-slate-800 flex-1 px-1">{{ applicantInfo.residential_address }}</span>
                    </div>
                    <div class="flex items-center">
                      <span class="w-32 font-bold text-slate-700">Contact Number:</span>
                      <span class="border-b border-slate-800 flex-1 px-1 font-mono">{{ applicantInfo.contact_number }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Page Footer -->
              <footer class="mt-auto pt-3 border-t border-slate-300 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Official Municipal Dossier • Letter of Intent</span>
                <span>Page 1 of 1</span>
              </footer>
            </article>
          </section>

        </div>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileText, Printer, X, PenTool } from 'lucide-vue-next'
import type { Application, Profile, Stall, MunicipalOfficial } from '../../types/market-rental'

const props = withDefaults(
  defineProps<{
    visible: boolean
    application: Partial<Application>
    applicant?: Partial<Profile>
    stall?: Partial<Stall>
    mayorOfficial?: Partial<MunicipalOfficial>
  }>(),
  {
    visible: false,
    application: () => ({}),
    applicant: () => ({}),
    stall: () => ({}),
    mayorOfficial: () => ({})
  }
)

defineEmits<{
  (e: 'close'): void
}>()

const activeDocTab = ref<'ALL' | 'APPLICATION' | 'LOI'>('ALL')

const applicationData = computed(() => props.application || {})
const applicantInfo = computed(() => props.applicant || props.application?.applicant || {})
const stallInfo = computed(() => props.stall || props.application?.selected_stall || {})

const incumbentMayorName = computed(() => {
  return props.mayorOfficial?.full_name || props.application?.mayor_official?.full_name || ''
})

const isMayorApproved = computed(() => {
  const status = applicationData.value.current_status
  return status === 'MAYOR_APPROVED' || 
         status === 'TREASURY_ASSESSED' || 
         status === 'INITIAL_FEES_PAID' || 
         status === 'STALL_OFFICIALLY_ASSIGNED' || 
         status === 'CONTRACT_GENERATED' || 
         status === 'LEASE_ACTIVE'
})

const isMayorDisapproved = computed(() => {
  return applicationData.value.current_status === 'MAYOR_DISAPPROVED'
})

const natureVal = computed(() => {
  return String(applicationData.value.nature_of_business || '').trim()
})

function isNatureMatch(cat: string): boolean {
  const current = natureVal.value.toLowerCase()
  const target = cat.toLowerCase()
  return current.includes(target)
}

const isOtherNature = computed(() => {
  const cats = ['retail', 'wholesale', 'food', 'cooked food', 'meat', 'fish', 'fruits', 'vegetables', 'dry goods', 'grocery']
  const cur = natureVal.value.toLowerCase()
  return cur !== '' && !cats.some(c => cur.includes(c))
})

const otherNatureText = computed(() => {
  if (isOtherNature.value) return natureVal.value
  return '_________________________'
})

function formatDate(dateVal?: string | Date | null): string {
  if (!dateVal) return '—'
  const d = new Date(dateVal)
  if (isNaN(d.getTime())) return String(dateVal)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatContractDate(dateVal?: string | Date | null): string {
  if (!dateVal) return '____________________'
  return formatDate(dateVal)
}

function formatCurrency(val?: number | string | null): string {
  const n = Number(val || 0)
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function triggerPrint() {
  window.print()
}
</script>

<style scoped>
.sheet-page {
  background-color: #ffffff;
  color: #0f172a;
  width: 100%;
  max-width: 8.5in;
  min-height: 11in;
  padding: 0.7in 0.8in;
  margin: 0 auto 2rem auto;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  box-sizing: border-box;
}

.contract-page-header {
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  border-bottom: 1px solid #cbd5e1;
  padding-bottom: 4px;
  margin-bottom: 1.25rem;
  display: flex;
  justify-content: space-between;
}

.contract-body {
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  font-size: 12px;
  line-height: 1.6;
  color: #0f172a;
  text-align: justify;
  flex: 1;
}

/* Print CSS */
@media print {
  @page {
    size: 8.5in 13in;
    margin: 12mm 15mm 12mm 15mm;
  }

  body * {
    visibility: hidden;
  }

  #dossierPrintArea,
  #dossierPrintArea * {
    visibility: visible;
  }

  #dossierPrintArea {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    background: transparent !important;
  }

  .no-print {
    display: none !important;
  }

  .sheet-page {
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
    max-width: none !important;
    min-height: 0 !important;
    page-break-after: always !important;
    break-after: page !important;
  }

  .sheet-page:last-child {
    page-break-after: auto !important;
  }
}
</style>
