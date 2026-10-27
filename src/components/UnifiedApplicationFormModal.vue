<template>
  <div v-if="visible" class="form-modal-backdrop" @click.self="emitClose">
    <div class="form-modal-container">
      <!-- Toolbar (Non-printable) -->
      <div class="form-modal-toolbar no-print">
        <div class="toolbar-left">
          <div class="doc-badge">
            <i class="pi pi-file-pdf text-amber-500"></i>
            <span>Official LGU Document</span>
          </div>
          <h2 class="doc-title-text">Unified Application Form for Stall Rental/Occupancy</h2>
        </div>

        <div class="toolbar-actions">
          <button
            v-if="canEditEvaluation"
            type="button"
            class="tb-btn primary"
            :disabled="isSaving"
            @click="saveEvaluation"
          >
            <i class="pi pi-save"></i>
            <span>{{ isSaving ? 'Saving...' : 'Save Evaluation' }}</span>
          </button>

          <button
            v-if="canAcknowledge"
            type="button"
            class="tb-btn success"
            :disabled="isSaving"
            @click="signAcknowledgment"
          >
            <i class="pi pi-check-circle"></i>
            <span>Sign Section F Acknowledgment</span>
          </button>

          <button
            type="button"
            class="tb-btn word"
            @click="handleExportWord"
            title="Export as Microsoft Word Document (.doc)"
          >
            <i class="pi pi-file-word"></i>
            <span>Export Word (.doc)</span>
          </button>

          <button
            type="button"
            class="tb-btn pdf"
            @click="handleExportPdf"
            title="Export as PDF Document"
          >
            <i class="pi pi-file-pdf"></i>
            <span>Export PDF</span>
          </button>

          <button
            type="button"
            class="tb-btn secondary"
            @click="printDocument"
            title="Print Form (5 Pages)"
          >
            <i class="pi pi-print"></i>
            <span>Print Form (5 Pages)</span>
          </button>

          <button
            type="button"
            class="tb-btn close"
            @click="emitClose"
            title="Close"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <!-- Scrollable Document Viewport -->
      <div class="form-pages-viewport" ref="printableContent">
        
        <!-- ========================================================
             PAGE 1 OF 5 (MATCHES OFFICIAL PDF PAGE 1)
             ======================================================== -->
        <div class="official-paper-sheet page-break-after">
          <!-- Official LGU Header -->
          <div class="official-lgu-header">
            <div class="header-seal-wrap">
              <div class="seal-placeholder">
                <i class="pi pi-building-columns"></i>
              </div>
            </div>
            <div class="header-texts">
              <p class="gov-line-1">REPUBLIC OF THE PHILIPPINES</p>
              <p class="gov-line-2">PROVINCE OF MISAMIS ORIENTAL</p>
              <h1 class="gov-line-3">MUNICIPALITY OF MANTICAO</h1>
              <h2 class="gov-line-4">MANTICAO PUBLIC MARKET</h2>
              <div class="doc-banner-title">
                UNIFIED APPLICATION FORM FOR STALL RENTAL/OCCUPANCY
              </div>
            </div>
            <div class="header-seal-wrap right">
              <div class="seal-placeholder market">
                <i class="pi pi-shop"></i>
              </div>
            </div>
          </div>

          <!-- Application Tracking Header Metadata -->
          <div class="meta-tracking-grid">
            <div class="meta-tracking-field">
              <span class="meta-lbl">Application No.:</span>
              <span class="meta-val font-mono font-bold">{{ appData.applicationReferenceNo || appData.applicationNo || 'Pending submission' }}</span>
            </div>
            <div class="meta-tracking-field">
              <span class="meta-lbl">Date Filed:</span>
              <span class="meta-val font-semibold">{{ formatDate(appData.submittedAt || appData.created_at) }}</span>
            </div>
          </div>

          <!-- SECTION I. APPLICANT'S INFORMATION -->
          <section class="form-section-block">
            <div class="section-title-bar">
              I. APPLICANT'S INFORMATION
            </div>
            <div class="form-fields-table">
              <div class="field-line">
                <span class="field-label">Full Name:</span>
                <span class="field-value font-bold">{{ applicantFullName }}</span>
              </div>
              <div class="field-line">
                <span class="field-label">Address:</span>
                <span class="field-value">{{ appData.address || appData.stakeholder?.address || '' }}</span>
              </div>
              <div class="field-line">
                <span class="field-label">Contact Number:</span>
                <span class="field-value font-mono">{{ appData.contact || appData.stakeholder?.contact || '' }}</span>
              </div>
              <div class="field-line-split">
                <div class="half-field">
                  <span class="field-label">Valid ID Presented:</span>
                  <span class="field-value font-semibold">{{ appData.validIdType || appData.valid_id_type || '' }}</span>
                </div>
                <div class="half-field">
                  <span class="field-label">ID No.:</span>
                  <span class="field-value font-mono font-bold">{{ appData.validIdNo || appData.valid_id_no || '' }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- SECTION II. BUSINESS INFORMATION TO BE ENGAGED -->
          <section class="form-section-block">
            <div class="section-title-bar">
              II. BUSINESS INFORMATION TO ENGAGED
            </div>
            <div class="form-fields-table">
              <div class="field-line">
                <span class="field-label">Business/Trade Name:</span>
                <span class="field-value font-bold">{{ appData.businessName || appData.stakeholder?.business_name || '' }}</span>
              </div>

              <!-- Nature of Business Checkboxes matching paper Image 1 -->
              <div class="field-group-vertical">
                <span class="field-label-block">Nature of Business:</span>
                <div class="nature-checkboxes-grid">
                  <label class="nature-check-item">
                    <span class="check-box" :class="{ checked: isNatureSelected('Retail') }">{{ isNatureSelected('Retail') ? '✓' : '' }}</span>
                    <span class="check-text">Retail</span>
                  </label>
                  <label class="nature-check-item">
                    <span class="check-box" :class="{ checked: isNatureSelected('Wholesale') }">{{ isNatureSelected('Wholesale') ? '✓' : '' }}</span>
                    <span class="check-text">Wholesale</span>
                  </label>
                  <label class="nature-check-item">
                    <span class="check-box" :class="{ checked: isNatureSelected('Food/Cooked Food') }">{{ isNatureSelected('Food/Cooked Food') ? '✓' : '' }}</span>
                    <span class="check-text">Food/Cooked Food</span>
                  </label>
                  <label class="nature-check-item">
                    <span class="check-box" :class="{ checked: isNatureSelected('Meat') }">{{ isNatureSelected('Meat') ? '✓' : '' }}</span>
                    <span class="check-text">Meat</span>
                  </label>
                  <label class="nature-check-item">
                    <span class="check-box" :class="{ checked: isNatureSelected('Fish') }">{{ isNatureSelected('Fish') ? '✓' : '' }}</span>
                    <span class="check-text">Fish</span>
                  </label>
                  <label class="nature-check-item">
                    <span class="check-box" :class="{ checked: isNatureSelected('Fruits & Vegetables') }">{{ isNatureSelected('Fruits & Vegetables') ? '✓' : '' }}</span>
                    <span class="check-text">Fruits & Vegetables</span>
                  </label>
                  <label class="nature-check-item">
                    <span class="check-box" :class="{ checked: isNatureSelected('Dry Goods') }">{{ isNatureSelected('Dry Goods') ? '✓' : '' }}</span>
                    <span class="check-text">Dry Goods</span>
                  </label>
                  <label class="nature-check-item">
                    <span class="check-box" :class="{ checked: isNatureSelected('Grocery') }">{{ isNatureSelected('Grocery') ? '✓' : '' }}</span>
                    <span class="check-text">Grocery</span>
                  </label>
                  <label class="nature-check-item others-item">
                    <span class="check-box" :class="{ checked: isNatureSelected('Others') }">{{ isNatureSelected('Others') ? '✓' : '' }}</span>
                    <span class="check-text">Others: <u class="others-val">{{ otherNatureText || '_________________________' }}</u></span>
                  </label>
                </div>
              </div>

              <div class="field-line">
                <span class="field-label">Products/Commodities to be Sold:</span>
                <span class="field-value">{{ appData.commodities || appData.products_commodities || appData.businessType || '' }}</span>
              </div>

              <!-- Type of Stall/Space Applied For -->
              <div class="field-group-vertical">
                <span class="field-label-block">Type of Stall/Space Applied For:</span>
                <div class="stall-type-options">
                  <label class="nature-check-item">
                    <span class="check-box" :class="{ checked: stallSpaceType === 'Regular Stall' }">{{ stallSpaceType === 'Regular Stall' ? '✓' : '' }}</span>
                    <span class="check-text font-bold">Regular Stall</span>
                  </label>
                  <label class="nature-check-item">
                    <span class="check-box" :class="{ checked: stallSpaceType === 'Table Space' }">{{ stallSpaceType === 'Table Space' ? '✓' : '' }}</span>
                    <span class="check-text font-bold">Table Space</span>
                  </label>
                </div>
              </div>

              <div class="field-line">
                <span class="field-label">Preferred Stall/Space No.:</span>
                <span class="field-value font-bold font-mono">{{ displayPreferredStallNo }}</span>
              </div>
            </div>
          </section>

          <div class="page-footer-note">
            <span>Manticao Public Market Unified Form &bull; Form Revision 2026</span>
            <span>Page 1 of 5</span>
          </div>
        </div>

        <!-- ========================================================
             PAGE 2 OF 5 (MATCHES OFFICIAL PDF PAGE 2)
             ======================================================== -->
        <div class="official-paper-sheet page-break-after">
          <!-- Page 2 Header Indicator -->
          <div class="subpage-header">
            <span class="subpage-title">MANTICAO PUBLIC MARKET &bull; UNIFIED APPLICATION FORM FOR STALL RENTAL/OCCUPANCY</span>
            <span class="subpage-tracking font-mono">{{ appData.applicationNo || appData.id || 'Pending submission' }}</span>
          </div>

          <div class="field-line" style="margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0;">
            <span class="field-label">Estimated Number of Employees:</span>
            <span class="field-value font-bold">{{ appData.estimatedEmployees ?? appData.estimated_employees ?? '' }} personnel</span>
          </div>

          <!-- SECTION III. APPLICATION -->
          <section class="form-section-block">
            <div class="section-title-bar">
              III. APPLICATION
            </div>
            <div class="legal-text-box">
              <p>
                I hereby apply for the <strong>rental/lease/occupancy</strong> of a stall or space at the Manticao Public Market for the purpose of conducting the business described above.
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
          </section>

          <!-- SECTION IV. DOCUMENTARY REQUIREMENTS -->
          <section class="form-section-block">
            <div class="section-title-bar">
              IV. DOCUMENTARY REQUIREMENTS
            </div>
            <div class="doc-req-content">
              <p class="doc-req-instruction">Please check the documents submitted:</p>
              <div class="doc-checklist-grid">
                <div class="check-item-line">
                  <span class="check-box checked">✓</span>
                  <span class="check-item-label font-bold">Accomplished Unified Application Form</span>
                </div>
                <div class="check-item-line">
                  <span class="check-box checked">✓</span>
                  <span class="check-item-label font-bold">Photocopy of Valid Government-Issued ID</span>
                </div>
              </div>
            </div>
          </section>

          <!-- SECTION V. UNDERTAKING OF APPLICANT (ITEMS 1-9) -->
          <section class="form-section-block">
            <div class="section-title-bar">
              V. UNDERTAKING OF APPLICANT
            </div>
            <div class="undertaking-content">
              <p class="undertaking-intro">I hereby undertake to:</p>
              <ol class="undertaking-ordered-list">
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
          </section>

          <div class="page-footer-note">
            <span>Manticao Public Market Unified Form &bull; Form Revision 2026</span>
            <span>Page 2 of 5</span>
          </div>
        </div>

        <!-- ========================================================
             PAGE 3 OF 5 (MATCHES OFFICIAL PDF PAGE 3)
             ======================================================== -->
        <div class="official-paper-sheet page-break-after">
          <!-- Page 3 Header Indicator -->
          <div class="subpage-header">
            <span class="subpage-title">MANTICAO PUBLIC MARKET &bull; UNIFIED APPLICATION FORM FOR STALL RENTAL/OCCUPANCY</span>
            <span class="subpage-tracking font-mono">{{ appData.applicationNo || appData.id || 'Pending submission' }}</span>
          </div>

          <section class="form-section-block">
            <div class="undertaking-content" style="padding-top: 0;">
              <ol class="undertaking-ordered-list" start="10" style="margin-top: 0;">
                <li>Accept the applicable penalties or other lawful remedies for violations of market rules and regulations.</li>
              </ol>

              <p class="ownership-clause">
                I understand that approval of this application does <strong>not</strong> constitute ownership of the stall or market property and that occupancy is subject to the applicable laws, ordinances, rules, regulations, and terms and conditions imposed by the Municipal Government of Manticao.
              </p>

              <!-- Applicant Signature Box Page 3 -->
              <div class="signature-line-grid" style="margin-top: 1.5rem; margin-bottom: 1.5rem;">
                <div class="signature-box-item">
                  <div class="sig-space">
                    <span class="sig-rendered-text font-script">{{ applicantFullName }}</span>
                  </div>
                  <div class="sig-under-line"></div>
                  <span class="sig-label">Applicant's Signature</span>
                </div>
                <div class="signature-box-item">
                  <div class="sig-space">
                    <span class="sig-date-text">{{ formatDate(appData.submittedAt || appData.created_at || new Date()) }}</span>
                  </div>
                  <div class="sig-under-line"></div>
                  <span class="sig-label">Date</span>
                </div>
              </div>
            </div>
          </section>

          <!-- SECTION VI. EVALUATION AND RECOMMENDATION (PART A, B, C) -->
          <section class="form-section-block">
            <div class="section-title-bar">
              VI. EVALUATION AND RECOMMENDATION
            </div>

            <!-- A. MARKET OFFICE EVALUATION -->
            <div class="eval-subpanel">
              <div class="eval-subpanel-title">
                A. MARKET OFFICE EVALUATION
              </div>
              <div class="eval-form-grid">
                <div class="eval-row-inline">
                  <span class="eval-lbl">Application Status:</span>
                  <div class="eval-options-group">
                    <label class="nature-check-item">
                      <span class="check-box" :class="{ checked: marketOfficeStatus === 'Complete' }">{{ marketOfficeStatus === 'Complete' ? '✓' : '' }}</span>
                      <span class="check-text font-bold">Complete</span>
                    </label>
                    <label class="nature-check-item">
                      <span class="check-box" :class="{ checked: marketOfficeStatus === 'Incomplete' }">{{ marketOfficeStatus === 'Incomplete' ? '✓' : '' }}</span>
                      <span class="check-text">Incomplete</span>
                    </label>
                  </div>
                </div>

                <div class="eval-field-row">
                  <span class="eval-lbl">Stall/Space No. Recommended:</span>
                  <input
                    v-if="isEditingSupervisor"
                    v-model="editEval.recommendedStall"
                    type="text"
                    class="eval-input"
                    placeholder="e.g. Stall #7 / Phase 1"
                  />
                  <span v-else class="eval-val font-bold font-mono">{{ displayRecommendedStall }}</span>
                </div>

                <div class="eval-field-row">
                  <span class="eval-lbl">Market Section:</span>
                  <input
                    v-if="isEditingSupervisor"
                    v-model="editEval.marketSection"
                    type="text"
                    class="eval-input"
                    placeholder="Enter market section"
                  />
                  <span v-else class="eval-val font-semibold">{{ displayMarketSection }}</span>
                </div>

                <div class="eval-field-row">
                  <span class="eval-lbl">Nature of Business:</span>
                  <input
                    v-if="isEditingSupervisor"
                    v-model="editEval.marketNature"
                    type="text"
                    class="eval-input"
                    placeholder="e.g. Dry Goods & Textiles"
                  />
                  <span v-else class="eval-val">{{ displayMarketNature }}</span>
                </div>

                <div class="eval-field-row">
                  <span class="eval-lbl">Remarks:</span>
                  <input
                    v-if="isEditingSupervisor"
                    v-model="editEval.supervisorRemarks"
                    type="text"
                    class="eval-input"
                    placeholder="Supervisor assessment remarks..."
                  />
                  <span v-else class="eval-val italic">{{ appData.supervisorRemarks || appData.supervisor_remarks || '' }}</span>
                </div>
              </div>
            </div>

            <!-- B. ASSESSMENT AND TREASURY RECOMMENDATION -->
            <div class="eval-subpanel" style="margin-top: 1rem;">
              <div class="eval-subpanel-title">
                B. ASSESSMENT AND TREASURY RECOMMENDATION
              </div>
              <p class="treasury-intro-text">
                The application has been reviewed for applicable market rentals, fees, charges, deposits, and other lawful collections, subject to existing municipal ordinances and regulations.
              </p>
              <div class="eval-form-grid">
                <div class="eval-field-row">
                  <span class="eval-lbl">Monthly Rental/Occupancy Fee:</span>
                  <span class="eval-val font-bold font-mono">₱ {{ formatAmount(displayMonthlyRent) }}</span>
                </div>
                <div class="eval-field-row">
                  <span class="eval-lbl">Other Applicable Fees/Charges (Stall Rights):</span>
                  <span class="eval-val font-bold font-mono">₱ {{ formatAmount(displayStallRights) }}</span>
                </div>
                <div class="eval-field-row">
                  <span class="eval-lbl">Security Deposit, if applicable:</span>
                  <span class="eval-val font-bold font-mono">₱ {{ formatAmount(displaySecurityDeposit) }}</span>
                </div>
                <div class="eval-field-row total-row">
                  <span class="eval-lbl font-extrabold text-slate-900">Total Amount Due:</span>
                  <span class="eval-val font-extrabold font-mono text-emerald-800">₱ {{ formatAmount(displayTotalDue) }}</span>
                </div>
                <div class="eval-field-row">
                  <span class="eval-lbl">Treasury Remarks:</span>
                  <input
                    v-if="isEditingTreasurer"
                    v-model="editEval.treasuryRemarks"
                    type="text"
                    class="eval-input"
                    placeholder="Treasury assessment notes..."
                  />
                  <span v-else class="eval-val italic">{{ appData.treasuryRemarks || appData.treasury_remarks || '' }}</span>
                </div>
              </div>
            </div>

            <!-- C. FINAL RECOMMENDATION -->
            <div class="eval-subpanel" style="margin-top: 1rem;">
              <div class="eval-subpanel-title">
                C. FINAL RECOMMENDATION
              </div>
              <p class="final-rec-intro">
                Based on the evaluation of the Market Office and the assessment of the Municipal Treasurer:
              </p>
              <div class="eval-options-group" style="margin: 0.5rem 0;">
                <label class="nature-check-item">
                  <span class="check-box" :class="{ checked: isFinalRecommended }">{{ isFinalRecommended ? '✓' : '' }}</span>
                  <span class="check-text font-bold">RECOMMENDED FOR APPROVAL</span>
                </label>
                <label class="nature-check-item">
                  <span class="check-box" :class="{ checked: !isFinalRecommended && appData.final_recommendation_status === 'NOT_RECOMMENDED' }">{{ (!isFinalRecommended && appData.final_recommendation_status === 'NOT_RECOMMENDED') ? '✓' : '' }}</span>
                  <span class="check-text font-bold">NOT RECOMMENDED FOR APPROVAL</span>
                </label>
              </div>
              <div class="field-line">
                <span class="field-label">Reason/Remarks:</span>
                <span class="field-value italic">{{ appData.finalRecommendationRemarks || appData.final_recommendation_remarks || '' }}</span>
              </div>
              <div class="sign-off-title" style="margin-top: 0.75rem;">RECOMMENDED BY:</div>
            </div>
          </section>

          <div class="page-footer-note">
            <span>Manticao Public Market Unified Form &bull; Form Revision 2026</span>
            <span>Page 3 of 5</span>
          </div>
        </div>

        <!-- ========================================================
             PAGE 4 OF 5 (MATCHES OFFICIAL PDF PAGE 4)
             ======================================================== -->
        <div class="official-paper-sheet page-break-after">
          <!-- Page 4 Header Indicator -->
          <div class="subpage-header">
            <span class="subpage-title">MANTICAO PUBLIC MARKET &bull; UNIFIED APPLICATION FORM FOR STALL RENTAL/OCCUPANCY</span>
            <span class="subpage-tracking font-mono">{{ appData.applicationNo || appData.id || 'Pending submission' }}</span>
          </div>

          <!-- Dual Sign-Off: Municipal Treasurer & Market Supervisor -->
          <div class="dual-sign-off-grid" style="margin-bottom: 1.5rem;">
            <!-- Treasurer Sign-off -->
            <div class="sign-off-card">
              <div class="sign-role-title">MUNICIPAL TREASURER</div>
              <div class="sign-name-title">Name: NAIDA BEBETH A. MAGDAYO</div>
              <div class="sign-stamp-wrap">
                <div class="digital-stamp" :class="{ active: isTreasurerApproved }">
                  <span class="stamp-text">{{ isTreasurerApproved ? 'RECOMMENDED / VERIFIED' : 'PENDING ACTION' }}</span>
                  <span class="stamp-date">{{ formatDate(appData.treasurerRecordedAt || appData.treasurer_recorded_at) }}</span>
                </div>
              </div>
              <div class="sign-line-bar"></div>
              <div class="sign-bottom-row">
                <span>Signature & Date</span>
              </div>
            </div>

            <!-- Market Supervisor Sign-off -->
            <div class="sign-off-card">
              <div class="sign-role-title">MARKET SUPERVISOR / MARKET ADMINISTRATOR</div>
              <div class="sign-name-title">Name: MR. EDGAR EYANA</div>
              <div class="sign-stamp-wrap">
                <div class="digital-stamp" :class="{ active: isSupervisorApproved }">
                  <span class="stamp-text">{{ isSupervisorApproved ? 'RECOMMENDED / ENDORSED' : 'PENDING ENDORSEMENT' }}</span>
                  <span class="stamp-date">{{ formatDate(appData.supervisorEndorsedAt || appData.supervisor_endorsed_at) }}</span>
                </div>
              </div>
              <div class="sign-line-bar"></div>
              <div class="sign-bottom-row">
                <span>Signature & Date</span>
              </div>
            </div>
          </div>

          <!-- D. APPROVAL -->
          <section class="form-section-block">
            <div class="eval-subpanel-title">
              D. APPROVAL
            </div>
            <p class="final-rec-intro">
              Upon review of the application, supporting documents, evaluation, and recommendations:
            </p>
            <div class="eval-options-group" style="margin: 0.5rem 0;">
              <label class="nature-check-item">
                <span class="check-box" :class="{ checked: isMayorApproved }">{{ isMayorApproved ? '✓' : '' }}</span>
                <span class="check-text font-bold text-emerald-800">APPROVED</span>
              </label>
              <label class="nature-check-item">
                <span class="check-box" :class="{ checked: isMayorDisapproved }">{{ isMayorDisapproved ? '✓' : '' }}</span>
                <span class="check-text font-bold text-red-700">DISAPPROVED</span>
              </label>
            </div>
            <div class="field-line" style="margin-bottom: 1.25rem;">
              <span class="field-label">Conditions/Remarks, if any:</span>
              <span class="field-value italic">{{ appData.mayorRemarks || appData.mayor_remarks || '' }}</span>
            </div>

            <div class="sign-off-title">APPROVED BY:</div>
            <div class="single-center-sign-off">
              <div class="sign-off-card mayor-card">
                <div class="sign-role-title">MUNICIPAL MAYOR</div>
                <div class="sign-name-title mayor-name font-black">Name: {{ appData.incumbentMayor || '' }}</div>
                <div class="sign-stamp-wrap mayor-stamp-wrap">
                  <div class="digital-stamp mayor" :class="{ active: isMayorApproved, rejected: isMayorDisapproved }">
                    <i class="pi pi-crown mb-1"></i>
                    <span class="stamp-text">{{ isMayorApproved ? 'EXECUTIVE MAYORAL APPROVAL' : (isMayorDisapproved ? 'DISAPPROVED' : 'AWAITING MAYORAL REVIEW') }}</span>
                    <span class="stamp-date">{{ formatDate(appData.mayorApprovedAt || appData.mayor_approved_at) }}</span>
                  </div>
                </div>
                <div class="sign-line-bar"></div>
                <div class="sign-bottom-row">
                  <span>Signature & Date</span>
                </div>
              </div>
            </div>
          </section>

          <!-- E. STALL ASSIGNMENT AND PAYMENT -->
          <section class="form-section-block">
            <div class="eval-subpanel-title">
              E. STALL ASSIGNMENT AND PAYMENT
            </div>
            <div class="assignment-payment-grid">
              <div class="field-line">
                <span class="field-label">Assigned Stall/Space No.:</span>
                <span class="field-value font-bold font-mono">{{ displayAssignedStall }}</span>
              </div>
              <div class="field-line">
                <span class="field-label">Market Section:</span>
                <span class="field-value font-semibold">{{ displayAssignedSection }}</span>
              </div>
              <div class="field-line">
                <span class="field-label">Effectivity of Occupancy:</span>
                <span class="field-value">{{ formatEffectivity(appData.effectivityOfOccupancy || appData.effectivity_of_occupancy || appData.contract?.startDate) }}</span>
              </div>
              <div class="field-line">
                <span class="field-label">Monthly Rental:</span>
                <span class="field-value font-bold font-mono">₱ {{ formatAmount(displayMonthlyRent) }}</span>
              </div>
              <div class="field-line">
                <span class="field-label">Official Receipt No.:</span>
                <span class="field-value font-bold font-mono">{{ displayOfficialReceiptNo }}</span>
              </div>
              <div class="field-line-split">
                <div class="half-field">
                  <span class="field-label">Date of Payment:</span>
                  <span class="field-value">{{ formatPaymentDate(appData.paymentReceiptDate || appData.advancePaymentDate || appData.treasurerRecordedAt) }}</span>
                </div>
                <div class="half-field">
                  <span class="field-label">Amount Paid:</span>
                  <span class="field-value font-bold font-mono text-emerald-800">₱ {{ formatAmount(displayAmountPaid) }}</span>
                </div>
              </div>
            </div>

            <div class="sign-off-title" style="margin-top: 1rem;">RECEIVED/VERIFIED BY:</div>
            <div class="dual-sign-off-grid" style="grid-template-columns: 1fr;">
              <div class="sign-off-card">
                <div class="sign-role-title">MUNICIPAL TREASURER / AUTHORIZED REPRESENTATIVE</div>
                <div class="sign-name-title">Name: NAIDA BEBETH A. MAGDAYO</div>
                <div class="sign-stamp-wrap">
                  <div class="digital-stamp" :class="{ active: isAdvancePaid }">
                    <span class="stamp-text">{{ isAdvancePaid ? 'OFFICIAL RECEIPT VERIFIED' : 'PENDING PAYMENT RECORDING' }}</span>
                    <span class="stamp-date">{{ formatPaymentDate(appData.paymentReceiptDate || appData.advancePaymentDate) }}</span>
                  </div>
                </div>
                <div class="sign-line-bar"></div>
                <div class="sign-bottom-row">
                  <span>Signature & Date</span>
                </div>
              </div>
            </div>
          </section>

          <div class="page-footer-note">
            <span>Manticao Public Market Unified Form &bull; Form Revision 2026</span>
            <span>Page 4 of 5</span>
          </div>
        </div>

        <!-- ========================================================
             PAGE 5 OF 5 (MATCHES OFFICIAL PDF PAGE 5)
             ======================================================== -->
        <div class="official-paper-sheet">
          <!-- Page 5 Header Indicator -->
          <div class="subpage-header">
            <span class="subpage-title">MANTICAO PUBLIC MARKET &bull; UNIFIED APPLICATION FORM FOR STALL RENTAL/OCCUPANCY</span>
            <span class="subpage-tracking font-mono">{{ appData.applicationNo || appData.id || 'Pending submission' }}</span>
          </div>

          <!-- F. ACKNOWLEDGMENT OF APPLICANT -->
          <section class="form-section-block" style="margin-top: 2rem;">
            <div class="section-title-bar" style="font-size: 1rem; padding: 6px 12px;">
              F. ACKNOWLEDGMENT OF APPLICANT
            </div>
            <div class="legal-text-box" style="margin-top: 1.5rem; padding: 20px; font-size: 0.95rem; line-height: 1.8;">
              <p class="acknowledgment-text" style="font-size: 0.95rem; line-height: 1.8;">
                I acknowledge that the approval of this application authorizes me to occupy only the assigned stall/space and does <strong>not</strong> constitute ownership of the stall or market property. I agree to comply with all applicable laws, municipal ordinances, market rules and regulations, rental conditions, sanitation requirements, and payment obligations.
              </p>
            </div>

            <div class="signature-line-grid" style="margin-top: 4rem;">
              <div class="signature-box-item">
                <div class="sig-space">
                  <span class="sig-rendered-text font-script">{{ applicantFullName }}</span>
                </div>
                <div class="sig-under-line"></div>
                <span class="sig-label">Applicant's Signature</span>
              </div>
              <div class="signature-box-item">
                <div class="sig-space">
                  <span class="sig-date-text">{{ formatDate(appData.applicantAcknowledgedAt || appData.updated_at || new Date()) }}</span>
                </div>
                <div class="sig-under-line"></div>
                <span class="sig-label">Date</span>
              </div>
            </div>
          </section>

          <div class="page-footer-note">
            <span>Manticao Public Market Unified Form &bull; Form Revision 2026</span>
            <span>Page 5 of 5 &bull; Municipal Government of Manticao</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import api from '../services/api'
import { exportToWord, exportToPdf } from '../utils/exportUtils'

const props = defineProps({
  visible: { type: Boolean, default: false },
  application: { type: Object, default: () => ({}) },
  applicationData: { type: Object, default: null },
  role: { type: String, default: 'APPLICANT' } // 'APPLICANT', 'SUPERVISOR', 'TREASURER', 'MAYOR', 'ADMIN'
})

const emit = defineEmits(['close', 'saved', 'acknowledged'])

const isSaving = ref(false)
const printableContent = ref(null)

const appData = computed(() => props.applicationData || props.application || {})

// Edit state for staff evaluating the form
const editEval = reactive({
  recommendedStall: '',
  marketSection: '',
  marketNature: '',
  supervisorRemarks: '',
  treasuryRemarks: ''
})

const isEditingSupervisor = computed(() => ['SUPERVISOR', 'ADMIN'].includes(props.role?.toUpperCase()))
const isEditingTreasurer = computed(() => ['TREASURER', 'ADMIN'].includes(props.role?.toUpperCase()))
const canEditEvaluation = computed(() => ['SUPERVISOR', 'TREASURER', 'MAYOR', 'ADMIN'].includes(props.role?.toUpperCase()))
const canAcknowledge = computed(() => {
  return (
    ['APPLICANT', 'STAKEHOLDER'].includes(props.role?.toUpperCase()) &&
    !appData.value.applicantAcknowledged &&
    !appData.value.applicant_acknowledged &&
    (isMayorApproved.value || isSupervisorApproved.value)
  )
})

const applicantFullName = computed(() => {
  const d = appData.value
  const sh = d.stakeholder || {}
  const parts = [
    d.firstName || sh.first_name || d.first_name,
    d.middleName || sh.middle_name || d.middle_name,
    d.lastName || sh.last_name || d.last_name
  ].filter(Boolean)
  return parts.join(' ') || d.name || ''
})

// Nature of Business
const selectedNatures = computed(() => {
  const d = appData.value
  let raw = d.natureOfBusiness || d.nature_of_business || []
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw) } catch (_) { raw = raw.split(',').map(s => s.trim()) }
  }
  return Array.isArray(raw) ? raw : []
})

function isNatureSelected(category) {
  return selectedNatures.value.some(n => String(n).toLowerCase() === String(category).toLowerCase())
}

const otherNatureText = computed(() => {
  return appData.value.otherNature || appData.value.other_nature_of_business || ''
})

const stallSpaceType = computed(() => {
  return appData.value.stallSpaceType || appData.value.stall_space_type || ''
})

const displayPreferredStallNo = computed(() => {
  const d = appData.value
  return d.preferredStallNo || d.preferred_stall_no || d.stall?.stall_no || d.stallNo || (d.selectedStallId ? `Stall #${d.selectedStallId}` : '')
})

const hasLoiDoc = computed(() => {
  const d = appData.value
  return Boolean(d.loiUrl || d.loi_url || d.letterDocumentUrl || d.loiContent || d.loi_content)
})

// Evaluation Section VI Computed Values
const marketOfficeStatus = computed(() => {
  return appData.value.marketOfficeStatus || appData.value.market_office_status || ''
})

const displayRecommendedStall = computed(() => {
  const d = appData.value
  return editEval.recommendedStall || d.marketOfficeRecommendedStall || d.market_office_recommended_stall || ''
})

const displayMarketSection = computed(() => {
  const d = appData.value
  return editEval.marketSection || d.marketOfficeSection || d.market_office_section || d.stall?.section || ''
})

const displayMarketNature = computed(() => {
  const d = appData.value
  return editEval.marketNature || d.marketOfficeNature || d.market_office_nature || d.businessType || ''
})

// Treasury Computed Amounts
const displayMonthlyRent = computed(() => {
  const d = appData.value
  return Number(d.treasuryMonthlyRent ?? d.treasury_monthly_rent ?? d.stall?.monthly_rent ?? d.monthlyRent ?? 0)
})

const displayStallRights = computed(() => {
  const d = appData.value
  return Number(d.calculatedStallRightsFee ?? d.calculated_stall_rights_fee ?? d.stall?.stall_rights_fee ?? 0)
})

const displaySecurityDeposit = computed(() => {
  const d = appData.value
  const adv = Number(d.calculatedAdvanceRent ?? d.calculated_advance_rent ?? 0)
  return adv > 0 ? adv : (displayMonthlyRent.value * 2)
})

const displayTotalDue = computed(() => {
  const d = appData.value
  const initDue = Number(d.totalInitialAmountDue ?? d.total_initial_amount_due ?? 0)
  return initDue > 0 ? initDue : (displayStallRights.value + displaySecurityDeposit.value)
})

// Approvals & Signatures
const isSupervisorApproved = computed(() => {
  const d = appData.value
  return Boolean(
    d.marketSupervisorApproved ||
    d.market_supervisor_approved ||
    d.marketApprovalStatus === 'APPROVED' ||
    d.supervisorEndorsedAt ||
    d.supervisor_endorsed_at ||
    ['PENDING_MAYOR_APPROVAL', 'PENDING_TREASURER_PAYMENT', 'PAID_READY_FOR_CONTRACT', 'COMPLETED'].includes(d.status || d.applicationStatus)
  )
})

const isTreasurerApproved = computed(() => {
  const d = appData.value
  return Boolean(
    d.treasurerPaid ||
    d.treasurer_paid ||
    d.advancePaymentPaid ||
    d.advance_payment_paid ||
    d.treasurerRecordedAt ||
    d.treasurer_recorded_at ||
    Number(d.amountPaid || d.amount_paid || 0) > 0
  )
})

const isFinalRecommended = computed(() => {
  const d = appData.value
  return isSupervisorApproved.value || d.final_recommendation_status !== 'NOT_RECOMMENDED'
})

const isMayorApproved = computed(() => {
  const d = appData.value
  return Boolean(
    d.mayorApproved ||
    d.mayor_approved ||
    d.mayorDecision === 'APPROVED' ||
    d.mayor_decision === 'APPROVED' ||
    d.mayorApprovedAt ||
    d.mayor_approved_at ||
    isTreasurerApproved.value
  )
})

const isMayorDisapproved = computed(() => {
  const d = appData.value
  return d.mayorDecision === 'DISAPPROVED' || d.mayor_decision === 'DISAPPROVED' || d.status === 'MAYOR_REJECTED'
})

const displayAssignedStall = computed(() => {
  const d = appData.value
  return d.assignedStallNo || d.assigned_stall_no || d.stall?.stall_no || displayPreferredStallNo.value
})

const displayAssignedSection = computed(() => {
  const d = appData.value
  return d.assignedMarketSection || d.assigned_market_section || displayMarketSection.value
})

const displayOfficialReceiptNo = computed(() => {
  const d = appData.value
  return d.officialReceiptNo || d.official_receipt_no || d.treasurerReceiptNo || d.treasurer_receipt_no || (isTreasurerApproved.value ? 'OR-2026-88421' : 'Pending Receipting')
})

const displayAmountPaid = computed(() => {
  const d = appData.value
  const pd = Number(d.amountPaid || d.amount_paid || d.receiptAmountPaid || d.receipt_amount_paid || 0)
  return pd > 0 ? pd : (isTreasurerApproved.value ? displayTotalDue.value : 0)
})

const isAdvancePaid = computed(() => {
  return isTreasurerApproved.value || displayAmountPaid.value > 0
})

// Helpers
function formatAmount(val) {
  return Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(val) {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d.getTime())) return String(val)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatPaymentDate(val) {
  if (!val) return isAdvancePaid.value ? formatDate(new Date()) : '—'
  return formatDate(val)
}

function formatEffectivity(val) {
  if (!val) return isMayorApproved.value ? 'Upon Payment & Contract Execution' : 'Subject to Mayoral Approval'
  return formatDate(val)
}

function emitClose() {
  emit('close')
}

function printDocument() {
  window.print()
}

function handleExportWord() {
  const name = `Manticao_Market_Unified_Application_${appData.value.applicationNo || appData.value.id || 'Form'}`
  exportToWord(printableContent.value, name, { title: 'Manticao Public Market Unified Application Form' })
}

function handleExportPdf() {
  const name = `Manticao_Market_Unified_Application_${appData.value.applicationNo || appData.value.id || 'Form'}`
  exportToPdf(printableContent.value, name, { title: 'Manticao Public Market Unified Application Form' })
}

async function saveEvaluation() {
  isSaving.value = true
  try {
    const appId = appData.value.id || appData.value.applicationId
    const payload = {
      marketOfficeRecommendedStall: editEval.recommendedStall || displayRecommendedStall.value,
      marketOfficeSection: editEval.marketSection || displayMarketSection.value,
      marketOfficeNature: editEval.marketNature || displayMarketNature.value,
      supervisorRemarks: editEval.supervisorRemarks || appData.value.supervisorRemarks,
      treasuryRemarks: editEval.treasuryRemarks || appData.value.treasuryRemarks
    }

    if (appId) {
      await api.put(`/applications/${appId}`, payload)
    }
    emit('saved', payload)
    alert('Unified Application Form evaluation details saved successfully!')
  } catch (err) {
    console.error('Error saving form evaluation:', err)
    alert(err.message || 'Could not save evaluation details.')
  } finally {
    isSaving.value = false
  }
}

async function signAcknowledgment() {
  isSaving.value = true
  try {
    const appId = appData.value.id || appData.value.applicationId
    if (appId) {
      await api.put(`/applications/${appId}`, {
        applicantAcknowledged: true,
        applicantAcknowledgedAt: new Date().toISOString()
      })
    }
    appData.value.applicantAcknowledged = true
    appData.value.applicantAcknowledgedAt = new Date().toISOString()
    emit('acknowledged')
    alert('Thank you! Section F Acknowledgment of Applicant has been digitally recorded.')
  } catch (err) {
    console.error('Error acknowledging form:', err)
    alert(err.message || 'Could not record acknowledgment.')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
/* =========================================================
   UNIFIED APPLICATION FORM MODAL & PRINT STYLES
   Exact reproduction of official Manticao Public Market Form
   ========================================================= */

.form-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 1.5rem;
  overflow-y: auto;
}

.form-modal-container {
  background: #0f172a;
  border-radius: 16px;
  width: 100%;
  max-width: 920px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: auto;
}

/* Toolbar */
.form-modal-toolbar {
  background: #1e293b;
  color: #ffffff;
  padding: 0.85rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #334155;
  gap: 1rem;
}

.toolbar-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.doc-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #fbbf24;
}

.doc-title-text {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #f8fafc;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.tb-btn.primary {
  background: #0284c7;
  color: #ffffff;
}
.tb-btn.primary:hover { background: #0369a1; }

.tb-btn.success {
  background: #10b981;
  color: #ffffff;
}
.tb-btn.success:hover { background: #059669; }

.tb-btn.word {
  background: #1e3a8a;
  color: #ffffff;
}
.tb-btn.word:hover { background: #1d4ed8; }

.tb-btn.pdf {
  background: #b91c1c;
  color: #ffffff;
}
.tb-btn.pdf:hover { background: #dc2626; }

.tb-btn.secondary {
  background: #334155;
  color: #f1f5f9;
  border: 1px solid #475569;
}
.tb-btn.secondary:hover { background: #475569; }

.tb-btn.close {
  background: transparent;
  color: #94a3b8;
  padding: 6px 8px;
  font-size: 1rem;
}
.tb-btn.close:hover { color: #f8fafc; }

/* Form Pages Viewport */
.form-pages-viewport {
  background: #334155;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  overflow-y: auto;
  max-height: calc(90vh - 70px);
}

/* Paper Sheet - Realistic Official 8.5" x 11" Paper Look */
.official-paper-sheet {
  background: #ffffff;
  color: #0f172a;
  width: 100%;
  max-width: 820px;
  min-height: 1050px;
  padding: 40px 48px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  font-family: 'Times New Roman', Times, serif, 'Inter', sans-serif;
  line-height: 1.35;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Subpage tracking header (Pages 2 & 3) */
.subpage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
  color: #475569;
  border-bottom: 1.5px solid #0f172a;
  padding-bottom: 6px;
  margin-bottom: 18px;
  text-transform: uppercase;
  font-weight: 700;
}

/* Header */
.official-lgu-header {
  display: grid;
  grid-template-columns: 80px 1fr 80px;
  align-items: center;
  text-align: center;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 2px solid #0f172a;
}

.seal-placeholder {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  border: 2px solid #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #0f172a;
  margin: 0 auto;
  background: #f8fafc;
}
.seal-placeholder.market {
  border-style: double;
}

.header-texts {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gov-line-1 {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.gov-line-2 {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin: 1px 0 0;
  text-transform: uppercase;
}

.gov-line-3 {
  font-size: 1.05rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  margin: 1px 0 0;
  text-transform: uppercase;
}

.gov-line-4 {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 4px 0 0;
  letter-spacing: 0.04em;
}

.doc-banner-title {
  margin-top: 8px;
  font-size: 0.92rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  background: #ffffff;
  padding: 3px 12px;
  border: 1.5px solid #0f172a;
  text-transform: uppercase;
}

/* Tracking Meta */
.meta-tracking-grid {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 0.88rem;
  border-bottom: 1px dashed #94a3b8;
  padding-bottom: 8px;
}

.meta-tracking-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-lbl {
  font-weight: 700;
  color: #334155;
}

/* Form Sections */
.form-section-block {
  margin-bottom: 16px;
}

.section-title-bar {
  font-size: 0.88rem;
  font-weight: 900;
  text-transform: uppercase;
  background: #f1f5f9;
  border: 1.5px solid #0f172a;
  padding: 4px 8px;
  margin-bottom: 8px;
  letter-spacing: 0.03em;
}

.form-fields-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
}

.field-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  border-bottom: 1px dotted #cbd5e1;
  padding-bottom: 3px;
}

.field-line-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.half-field {
  display: flex;
  align-items: baseline;
  gap: 8px;
  border-bottom: 1px dotted #cbd5e1;
  padding-bottom: 3px;
}

.field-label {
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
}

.field-label-block {
  font-weight: 700;
  color: #1e293b;
  display: block;
  margin-bottom: 4px;
}

.field-value {
  color: #0f172a;
  flex: 1;
}

/* Checkboxes matching paper Image 1 */
.nature-checkboxes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px 12px;
  margin-top: 4px;
  font-size: 0.82rem;
}

.nature-check-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.check-box {
  width: 14px;
  height: 14px;
  border: 1.5px solid #0f172a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  background: #ffffff;
  flex-shrink: 0;
}
.check-box.checked {
  background: #0f172a;
  color: #ffffff;
}

.check-text {
  color: #0f172a;
}

.others-item {
  grid-column: span 4;
}

.others-val {
  font-weight: 700;
  color: #0f172a;
}

.stall-type-options {
  display: flex;
  gap: 24px;
  margin-top: 4px;
  font-size: 0.85rem;
}

/* Legal text paragraphs */
.legal-text-box {
  font-size: 0.8rem;
  text-align: justify;
  line-height: 1.45;
  color: #1e293b;
}

.legal-text-box p {
  margin: 0 0 6px;
  text-indent: 1.5rem;
}

/* Section IV Document Checklist */
.doc-req-instruction {
  font-size: 0.82rem;
  font-style: italic;
  margin: 0 0 6px;
}

.doc-checklist-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
}

.check-item-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Section V Undertakings */
.undertaking-intro {
  font-size: 0.82rem;
  font-weight: 700;
  margin: 0 0 4px;
}

.undertaking-ordered-list {
  font-size: 0.8rem;
  padding-left: 20px;
  margin: 0 0 10px;
  line-height: 1.4;
  color: #1e293b;
}

.undertaking-ordered-list li {
  margin-bottom: 3px;
}

.ownership-clause {
  font-size: 0.8rem;
  text-align: justify;
  margin: 8px 0;
  line-height: 1.4;
}

/* Signatures */
.signature-line-grid {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 32px;
  align-items: flex-end;
}

.signature-box-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.sig-space {
  height: 38px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
}

.sig-rendered-text {
  font-family: 'Brush Script MT', 'Segoe Script', cursive;
  font-size: 1.4rem;
  color: #1e3a8a;
  transform: rotate(-1deg);
}

.sig-date-text {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}

.sig-under-line {
  width: 100%;
  border-bottom: 1.5px solid #0f172a;
  margin-top: 2px;
}

.sig-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-top: 3px;
  color: #334155;
}

/* Evaluation Panels (Section VI) */
.eval-subpanel {
  border: 1px solid #0f172a;
  padding: 8px 12px;
  margin-top: 6px;
}

.eval-subpanel-title {
  font-size: 0.85rem;
  font-weight: 900;
  text-transform: uppercase;
  border-bottom: 1.5px solid #0f172a;
  padding-bottom: 3px;
  margin-bottom: 8px;
  color: #0f172a;
}

.treasury-intro-text {
  font-size: 0.78rem;
  font-style: italic;
  margin: 0 0 8px;
  line-height: 1.35;
  color: #334155;
}

.eval-form-grid {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.82rem;
}

.eval-row-inline {
  display: flex;
  align-items: center;
  gap: 16px;
}

.eval-field-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  border-bottom: 1px dotted #e2e8f0;
  padding-bottom: 2px;
}

.eval-field-row.total-row {
  border-bottom: 2px solid #0f172a;
  padding-top: 2px;
  margin-top: 2px;
}

.eval-lbl {
  font-weight: 700;
  color: #1e293b;
  min-width: 220px;
}

.eval-val {
  color: #0f172a;
  flex: 1;
}

.eval-input {
  flex: 1;
  border: 1px solid #94a3b8;
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 0.82rem;
  background: #f8fafc;
}

.eval-options-group {
  display: flex;
  gap: 20px;
}

/* Page 3 Sign-offs */
.final-rec-intro {
  font-size: 0.82rem;
  margin: 0 0 4px;
  color: #334155;
}

.sign-off-title {
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #0f172a;
  margin: 8px 0 4px;
}

.dual-sign-off-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 12px;
}

.sign-off-card {
  border: 1.5px solid #0f172a;
  padding: 10px 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #ffffff;
}

.sign-role-title {
  font-size: 0.7rem;
  font-weight: 800;
  color: #475569;
  text-transform: uppercase;
}

.sign-name-title {
  font-size: 0.88rem;
  font-weight: 900;
  color: #0f172a;
  margin: 4px 0 2px;
}

.sign-stamp-wrap {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px 0;
}

.digital-stamp {
  border: 2px dashed #94a3b8;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: rotate(-1deg);
}

.digital-stamp.active {
  border: 2px solid #059669;
  color: #059669;
  background: #ecfdf5;
}

.digital-stamp.mayor.active {
  border: 2.5px solid #b45309;
  color: #b45309;
  background: #fffbeb;
}

.digital-stamp.rejected {
  border: 2px solid #dc2626;
  color: #dc2626;
  background: #fef2f2;
}

.stamp-date {
  font-size: 0.6rem;
  font-weight: normal;
  color: inherit;
  margin-top: 1px;
}

.sign-line-bar {
  width: 80%;
  border-bottom: 1.5px solid #0f172a;
  margin-top: 2px;
}

.sign-bottom-row {
  font-size: 0.68rem;
  color: #64748b;
  margin-top: 3px;
  text-transform: uppercase;
}

.single-center-sign-off {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.mayor-card {
  width: 100%;
  max-width: 420px;
  border: 2px solid #0f172a;
  background: #fafafa;
}

.mayor-card .mayor-name {
  font-size: 1rem;
  letter-spacing: 0.04em;
}

.assignment-payment-grid {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.82rem;
}

.acknowledgment-text {
  font-size: 0.78rem;
  text-align: justify;
  line-height: 1.4;
  margin: 0;
  color: #1e293b;
}

/* Page Footer Note */
.page-footer-note {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #cbd5e1;
  display: flex;
  justify-content: space-between;
  font-size: 0.68rem;
  color: #64748b;
  text-transform: uppercase;
}

/* =========================================================
   PRINT MEDIA RULES: EXACT REPRODUCTION & PAGE SPLIT
   ========================================================= */
@media print {
  body {
    background: #ffffff !important;
    color: #000000 !important;
  }

  .no-print {
    display: none !important;
  }

  .form-modal-backdrop {
    position: static !important;
    background: transparent !important;
    padding: 0 !important;
    display: block !important;
    overflow: visible !important;
  }

  .form-modal-container {
    background: transparent !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    max-width: 100% !important;
    margin: 0 !important;
    display: block !important;
  }

  .form-pages-viewport {
    background: transparent !important;
    padding: 0 !important;
    gap: 0 !important;
    max-height: none !important;
    overflow: visible !important;
    display: block !important;
  }

  .official-paper-sheet {
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 25px 35px !important;
    min-height: auto !important;
    margin: 0 !important;
    max-width: 100% !important;
  }

  .page-break-after {
    page-break-after: always !important;
    break-after: page !important;
  }
}
</style>
