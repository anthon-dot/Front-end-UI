<!-- ============================= -->
<!-- BusinessApplication.vue -->
<!-- Stakeholder Application: Step 2, Step 3, Step 4 -->
<!-- ============================= -->

<template>
  <div class="create-page">
    <div class="container">
      <div class="form-header">
        <div>
          <h2>Stakeholder Stall Application</h2>
          <p class="form-subtitle">Public Market Rental Management System &bull; Municipality of Manticao</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn-dashboard" @click="router.push('/stakeholder')">
            <i class="pi pi-home"></i>
            <span>Stakeholder Portal</span>
          </button>
          <button type="button" class="logout-btn" @click="logout">
            <i class="pi pi-sign-out"></i>
            <span>Log Out</span>
          </button>
        </div>
      </div>

      <!-- Step Progress Header -->
      <div class="step-wizard-bar">
        <div class="step-wizard-step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
          <span class="step-num">1</span>
          <span class="step-label">Application Form</span>
        </div>
        <div class="step-wizard-divider" :class="{ completed: currentStep > 1 }"></div>
        <div class="step-wizard-step" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
          <span class="step-num">2</span>
          <span class="step-label">Upload Documents</span>
        </div>
        <div class="step-wizard-divider" :class="{ completed: currentStep > 2 }"></div>
        <div class="step-wizard-step" :class="{ active: currentStep === 3, completed: currentStep > 3 }">
          <span class="step-num">3</span>
          <span class="step-label">Review Application</span>
        </div>
        <div class="step-wizard-divider" :class="{ completed: currentStep >= 4 }"></div>
        <div class="step-wizard-step" :class="{ active: currentStep === 4, completed: currentStep === 4 }">
          <span class="step-num"><i class="pi pi-check"></i></span>
          <span class="step-label">Submitted</span>
        </div>
      </div>

      <!-- Active Application Banner if already submitted -->
      <div v-if="existingApplication && currentStep !== 4" class="existing-application-banner" style="margin-bottom: 1.5rem;">
        <div class="banner-content">
          <i class="pi pi-info-circle banner-icon"></i>
          <div>
            <strong>Active Application in Progress</strong>
            <p>
              You currently have an application on record (Reference: <strong>{{ existingApplication.applicationNo || `APP-${existingApplication.id}` }}</strong> &bull; Status: 
              <span class="status-badge">{{ existingApplication.applicationStatus || existingApplication.status || 'PENDING' }}</span>).
            </p>
          </div>
        </div>
        <button type="button" class="btn-view-progress" @click="router.push({ name: 'ApplicationProgress' })">
          Track Progress →
        </button>
      </div>

      <!-- Error Banner -->
      <div v-if="errorMessage" class="error-banner-box">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- ========================================================
           STEP 1: STAKEHOLDER APPLICATION FORM
           ======================================================== -->
      <div v-if="currentStep === 1" class="form-step-container">
        <!-- TOP BANNER: MANTICAO PUBLIC MARKET UNIFIED APPLICATION FORM FOR STALL RENTAL/OCCUPANCY -->
        <div class="form-section-card business-permit-header-card" style="border: 2px solid #0284c7; background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%);">
          <div class="permit-meta-header-bar" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 1rem; flex-wrap: wrap;">
            <div class="lgu-title-wrap">
              <span class="lgu-badge" style="font-size: 0.75rem; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">
                Republic of the Philippines &bull; Province of Misamis Oriental &bull; Municipality of Manticao
              </span>
              <h3 class="permit-main-title" style="margin: 0; font-size: 1.3rem; font-weight: 900; color: #0f172a;">
                MANTICAO PUBLIC MARKET &bull; UNIFIED APPLICATION FORM FOR STALL RENTAL/OCCUPANCY
              </h3>
              <p style="margin: 4px 0 0; font-size: 0.82rem; color: #475569;">
                Step 1: Stakeholder Account Registration, Commercial Details &amp; Preferred Vacant Stall Selection
              </p>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button
                type="button"
                class="btn-preview-official-doc"
                style="display: inline-flex; align-items: center; gap: 8px; background: #0284c7; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer;"
                @click="showUnifiedFormModal = true"
              >
                <i class="pi pi-file-pdf"></i>
                <span>Preview Official 5-Page Stall Form</span>
              </button>
              <button
                type="button"
                style="display: inline-flex; align-items: center; gap: 8px; background: #059669; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer;"
                @click="showLoiModal = true"
              >
                <i class="pi pi-file-edit"></i>
                <span>Letter of Intent</span>
              </button>
            </div>
          </div>

          <div style="background: white; border: 1px solid #bae6fd; border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <div style="font-size: 0.82rem; color: #0369a1; font-weight: 600;">
              <i class="pi pi-info-circle" style="margin-right: 6px;"></i>
              <strong>Workflow Stage 1 of 10:</strong> Submit your rental application and pick an available stall. Submitting does not automatically make you an approved tenant. Approval is recorded by authorized LGU staff after Mayor review.
            </div>
            <div style="display: flex; gap: 12px; font-size: 0.8rem; color: #64748b;">
              <span>Application No: <strong style="color: #0f172a;">{{ submittedAppNumber || 'AUTO-GENERATED' }}</strong></span>
              <span>&bull;</span>
              <span>Date Filed: <strong style="color: #0f172a;">{{ submittedDateFormatted }}</strong></span>
            </div>
          </div>
        </div>

        <!-- SECTION 0: MUNICIPAL ADMINISTRATION REFERENCE -->
        <div class="form-section-card" style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 14px 18px; margin-bottom: 1.5rem;">
          <div style="display: flex; gap: 14px; align-items: flex-start;">
            <i class="pi pi-crown" style="font-size: 1.8rem; color: #16a34a; margin-top: 2px;"></i>
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <label style="display: block; font-weight: 800; font-size: 0.95rem; color: #166534; margin-bottom: 2px;">
                  Section 0: Municipal Administration Reference
                </label>
                <span style="font-size: 0.75rem; background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 3px 8px; border-radius: 6px; font-weight: 700;">
                  Executive Addressee &bull; Salutation Authority
                </span>
              </div>
              <p style="margin: 0 0 10px; font-size: 0.82rem; color: #15803d; line-height: 1.4;">
                Specifies or verifies the current Municipal Mayor (editable across administrations). Populates the salutation, formal Letter of Intent (LOI), Section VI.D Mayoral approval block, and Lease Contract clauses.
              </p>
              <div class="row three" style="margin-bottom: 0;">
                <div class="field" style="margin-bottom: 0;">
                  <label style="font-size: 0.78rem; font-weight: 700; color: #14532d;">Incumbent Municipal Mayor <span class="required-star">*</span></label>
                  <input
                    v-model="incumbentMayor"
                    type="text"
                    placeholder="Enter incumbent Municipal Mayor"
                    style="font-weight: 800; font-size: 0.92rem; border: 1.5px solid #22c55e; background: #ffffff; color: #14532d;"
                    required
                  />
                </div>
                <div class="field" style="margin-bottom: 0;">
                  <label style="font-size: 0.78rem; font-weight: 700; color: #14532d;">Designation Title</label>
                  <input
                    type="text"
                    :value="designationTitle"
                    readonly
                    style="background: #f8fafc; color: #475569; font-weight: 700; cursor: not-allowed;"
                  />
                </div>
                <div class="field" style="margin-bottom: 0;">
                  <label style="font-size: 0.78rem; font-weight: 700; color: #14532d;">LGU Administrative Entity</label>
                  <input
                    type="text"
                    :value="lguAdministrativeEntity"
                    readonly
                    style="background: #f8fafc; color: #475569; font-weight: 700; cursor: not-allowed;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PHASE 1: STEP 1A: STAKEHOLDER CITIZEN PROFILE SETUP (stakeholders table) -->
        <div class="form-section-card">
          <div class="section-card-header">
            <i class="pi pi-id-card"></i>
            <div>
              <h3>Step 1A: Stakeholder Citizen Profile Setup</h3>
              <p>Registers your official Citizen / Market Stakeholder Identity in the public stakeholders registry</p>
            </div>
          </div>

          <!-- Name Breakdown -->
          <div class="row four">
            <div class="field">
              <label>Surname / Last Name <span class="required-star">*</span></label>
              <input v-model="lastName" type="text" placeholder="Enter last name" required />
            </div>
            <div class="field">
              <label>Given Name / First Name <span class="required-star">*</span></label>
              <input v-model="firstName" type="text" placeholder="Enter first name" required />
            </div>
            <div class="field">
              <label>Middle Name</label>
              <input v-model="middleName" type="text" placeholder="Enter middle name (optional)" />
            </div>
            <div class="field">
              <label>Suffix</label>
              <input v-model="ownerSuffix" type="text" placeholder="Jr., III, etc." />
            </div>
          </div>

          <!-- Civil Status, DOB, Gender -->
          <div class="row three">
            <div class="field">
              <label>Civil Status <span class="required-star">*</span></label>
              <select v-model="civilStatus" class="stall-select-input" required>
                <option value="" disabled>Select civil status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
              </select>
            </div>
            <div class="field">
              <label>Date of Birth (18+ Legal Age Verification) <span class="required-star">*</span></label>
              <input v-model="dateOfBirth" type="date" required />
            </div>
            <div class="field">
              <label>Gender <span class="required-star">*</span></label>
              <select v-model="gender" class="stall-select-input" required>
                <option value="" disabled>Select gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          <!-- Residential Address -->
          <div class="sub-address-group-box" style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 1.25rem;">
            <div class="sub-group-header" style="font-weight: 800; font-size: 0.9rem; color: #1e293b; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              <i class="pi pi-map-marker" style="color: #0284c7;"></i>
              <span>Permanent Residential Address (For Legal Notices &amp; Summons)</span>
            </div>
            <div class="row four">
              <div class="field">
                <label>Street / Purok / House No. <span class="required-star">*</span></label>
                <input v-model="mainStreet" type="text" placeholder="Purok / Street / House No." required />
              </div>
              <div class="field">
                <label>Barangay <span class="required-star">*</span></label>
                <input v-model="mainBarangay" type="text" placeholder="Barangay" required />
              </div>
              <div class="field">
                <label>Municipality <span class="required-star">*</span></label>
                <input v-model="mainMunicipality" type="text" placeholder="Manticao" required />
              </div>
              <div class="field">
                <label>Province &amp; Zip <span class="required-star">*</span></label>
                <div style="display: flex; gap: 6px;">
                  <input v-model="mainProvince" type="text" placeholder="Misamis Oriental" style="flex: 2;" required />
                  <input v-model="mainZipCode" type="text" placeholder="9024" style="flex: 1;" required />
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Coordinates -->
          <div class="row two">
            <div class="field">
              <label>Official Contact Mobile <span class="required-star">*</span> <small>(Vendor direct hotline)</small></label>
              <input v-model="contact" type="text" placeholder="09XXXXXXXXX" required />
            </div>
            <div class="field">
              <label>Account Email Address <span class="required-star">*</span> <small>(System notifications)</small></label>
              <input v-model="email" type="email" placeholder="user@example.com" required />
            </div>
          </div>

          <!-- Emergency Contacts -->
          <div class="row two">
            <div class="field">
              <label>Emergency Contact Person <span class="required-star">*</span> <small>(Immediate kin)</small></label>
              <input v-model="emergencyContactPerson" type="text" placeholder="Full name of emergency contact" required />
            </div>
            <div class="field">
              <label>Emergency Contact Number <span class="required-star">*</span> <small>(Next of kin mobile)</small></label>
              <input v-model="emergencyContactNumber" type="text" placeholder="09XXXXXXXXX" required />
            </div>
          </div>

          <!-- Section I Valid ID -->
          <div class="row two">
            <div class="field">
              <label>Valid Government ID Presented <span class="required-star">*</span></label>
              <select v-model="validIdType" class="stall-select-input" required>
                <option value="" disabled>Select ID type</option>
                <option value="PhilSys National ID">PhilSys National ID</option>
                <option value="Driver's License">Driver's License</option>
                <option value="UMID">UMID (Unified Multi-Purpose ID)</option>
                <option value="Philippine Passport">Philippine Passport</option>
                <option value="Voter's ID">Voter's ID / Certification</option>
                <option value="Postal ID">Postal ID</option>
                <option value="Other Valid ID">Other Government-Issued ID</option>
              </select>
            </div>
            <div class="field">
              <label>Government ID Card Number <span class="required-star">*</span></label>
              <input v-model="validIdNo" type="text" placeholder="Enter ID card number" required />
            </div>
          </div>
        </div>

        <!-- SECTION II: BUSINESS INFORMATION TO BE ENGAGED -->
        <div class="form-section-card">
          <div class="section-card-header">
            <i class="pi pi-briefcase"></i>
            <div>
              <h3>II. Business Information to be Engaged</h3>
              <p>Trade name, line of commodities, business nature, space type, and employee count</p>
            </div>
          </div>

          <div class="field" style="margin-bottom: 1.25rem;">
            <label>Business / Trade Name <span class="required-star">*</span></label>
            <input v-model="businessName" type="text" placeholder="Registered business / trade name" required />
          </div>

          <!-- Nature of Business Checkboxes (Matching Page 1 of Official Stall Application Form) -->
          <div class="field" style="margin-bottom: 1.25rem;">
            <label style="font-weight: 700; margin-bottom: 8px; display: block;">
              Nature of Business <span class="required-star">*</span>
              <small style="font-weight: normal; color: #64748b; margin-left: 6px;">(Select all applicable categories pursuant to Page 1 of Stall Rental Form)</small>
            </label>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px;">
              <label v-for="opt in natureOptions" :key="opt" style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.88rem; font-weight: 600; color: #1e293b; cursor: pointer;">
                <input type="checkbox" :value="opt" v-model="natureOfBusiness" />
                <span>{{ opt }}</span>
              </label>
            </div>
            <div v-if="natureOfBusiness.includes('Others')" style="margin-top: 10px;">
              <label style="font-size: 0.8rem; font-weight: 600; color: #475569;">Specify Other Nature of Business:</label>
              <input v-model="otherNature" type="text" placeholder="Please describe specific commercial activity..." />
            </div>
          </div>

          <div class="row two">
            <div class="field">
              <label>Products / Commodities to be Sold <span class="required-star">*</span></label>
              <input v-model="commodities" type="text" placeholder="Commodities / items to be sold" required />
            </div>
            <div class="field">
              <label>Type of Stall / Space Applied For <span class="required-star">*</span></label>
              <div class="opt-pills-row" style="display: flex; gap: 10px; margin-top: 4px;">
                <label class="opt-pill" :class="{ active: stallSpaceType === 'Regular Stall' }">
                  <input type="radio" value="Regular Stall" v-model="stallSpaceType" />
                  <span>Regular Stall</span>
                </label>
                <label class="opt-pill" :class="{ active: stallSpaceType === 'Table Space' }">
                  <input type="radio" value="Table Space" v-model="stallSpaceType" />
                  <span>Table Space</span>
                </label>
              </div>
            </div>
          </div>

          <div class="row two">
            <div class="field">
              <label>Estimated Number of Employees <span class="required-star">*</span></label>
              <input v-model.number="estimatedEmployees" type="number" min="0" placeholder="1" required />
            </div>
            <div class="field">
              <label>Primary Section / Category</label>
              <select v-model="businessType" class="stall-select-input">
                <option value="" disabled>Select business category</option>
                <option value="Fish & Seafood">Wet Section (Fish &amp; Seafood)</option>
                <option value="Meat & Poultry">Meat &amp; Poultry Section</option>
                <option value="Vegetables & Fruits">Fruits &amp; Vegetables Section</option>
                <option value="Dry Goods & Apparel">Dry Goods &amp; Apparel Section</option>
                <option value="Food & Cooked Meals">Food Court / Cooked Meals</option>
                <option value="Grocery & Retail">Grocery &amp; General Retail</option>
                <option value="Other Commercial Services">Other Commercial Section</option>
              </select>
            </div>
          </div>
        </div>

        <!-- STALL SELECTION WITH INTERACTIVE MAP: SHOW ONLY THE VACANT ONE (Images 1 & User Requirement) -->
        <div class="form-section-card stall-picker-card">
          <div class="section-card-header">
            <i class="pi pi-map"></i>
            <div>
              <h3>Market Stall Selection (Vacant Stalls Only)</h3>
              <p>Explore real-time vacancies on the Manticao Public Market interactive map and select your stall</p>
            </div>
          </div>

          <VacantStallMapPicker
            v-model="selectedStallId"
            :stalls="stallsList"
            @select-stall="handleStallSelected"
          />

          <!-- Step 1B: Interactive Stall Selection Details -->
          <div v-if="chosenStallInfo" class="stall-calc-callout" style="margin-top: 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <i class="pi pi-map-pin" style="color: #16a34a; font-size: 1.25rem;"></i>
                <strong style="color: #14532d; font-size: 1rem;">Step 1B: Selected Vacant Stall Locked for Application</strong>
              </div>
              <span style="background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; padding: 4px 10px; border-radius: 8px; font-size: 0.78rem; font-weight: 800;">
                Map State: HELD_FOR_APPLICATION
              </span>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; background: white; padding: 12px; border-radius: 8px; border: 1px solid #bbf7d0;">
              <div>
                <span style="font-size: 0.75rem; color: #64748b; display: block;">Selected Stall ID</span>
                <strong style="font-size: 0.9rem; color: #0f172a;" class="font-mono">STL-{{ chosenStallInfo.id }}</strong>
              </div>
              <div>
                <span style="font-size: 0.75rem; color: #64748b; display: block;">Stall Number Code</span>
                <strong style="font-size: 0.9rem; color: #0f172a;">{{ stallNumberCode }}</strong>
              </div>
              <div>
                <span style="font-size: 0.75rem; color: #64748b; display: block;">Market Section</span>
                <strong style="font-size: 0.9rem; color: #0f172a;">{{ stallMarketSection }}</strong>
              </div>
              <div>
                <span style="font-size: 0.75rem; color: #64748b; display: block;">Floor Area Dimensions</span>
                <strong style="font-size: 0.9rem; color: #0f172a;">{{ stallFloorArea }}</strong>
              </div>
              <div>
                <span style="font-size: 0.75rem; color: #64748b; display: block;">Base Monthly Rental Rate</span>
                <strong style="font-size: 0.95rem; color: #166534;">{{ stallMonthlyRentFormatted }}</strong>
              </div>
              <div>
                <span style="font-size: 0.75rem; color: #64748b; display: block;">Two-Month Advance Deposit</span>
                <strong style="font-size: 0.95rem; color: #b45309;">₱{{ (Number(chosenStallInfo.monthlyRent || 0) * 2).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</strong>
              </div>
            </div>
            <p style="margin: 10px 0 0; font-size: 0.78rem; color: #15803d; line-height: 1.4;">
              <i class="pi pi-lock" style="margin-right: 4px;"></i>
              Temporary reservation lock prevents duplicate picks during application submission. Final official assignment will be verified by Market Supervisor (MR. EDGAR EYANA) at Step 5.
            </p>
          </div>
        </div>

        <!-- III. APPLICATION (Verbatim Statutory Text from Image 1) -->
        <div class="form-section-card declaration-card">
          <div class="section-card-header">
            <i class="pi pi-file-check"></i>
            <div>
              <h3>III. Application Certification</h3>
              <p>Republic of the Philippines &bull; Province of Misamis Oriental &bull; Municipality of Manticao</p>
            </div>
          </div>

          <div class="statutory-text-box">
            <p>
              I hereby apply for the rental/lease/occupancy of a stall or space at the <strong>Manticao Public Market</strong> for the purpose of conducting the business described above.
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

          <div class="declaration-checkbox-row" style="margin-top: 1rem;">
            <input
              id="declarationCheck"
              v-model="declarationAgreed"
              type="checkbox"
              class="custom-checkbox"
            />
            <label for="declarationCheck" class="declaration-label">
              <strong>I certify and agree to the Section III Application terms above. <span class="required-star">*</span></strong>
              <span>Mandatory certification pursuant to the Manticao Public Market Unified Application Form.</span>
            </label>
          </div>
        </div>

        <!-- ADVISORY: ONLY TWO APPLICATION DOCUMENTS REQUIRED -->
        <div class="step-guide-box" style="margin-top: 1rem; background: #f8fafc; border: 1.5px solid #cbd5e1; border-left: 5px solid #0284c7; padding: 14px 18px; border-radius: 10px;">
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <i class="pi pi-info-circle" style="color: #0284c7; font-size: 1.3rem; margin-top: 2px;"></i>
            <div>
              <strong style="color: #0f172a; font-size: 0.9rem; display: block; margin-bottom: 4px;">
                Official Application Documents Notice:
              </strong>
              <p style="margin: 0; font-size: 0.83rem; color: #475569; line-height: 1.5;">
                This application requires strictly two official documents: the <strong>Unified Application Form for Stall Rental/Occupancy (5 Pages)</strong> and the <strong>Letter of Intent to Mayor Stephen S. Tan</strong> (with a photocopy of your valid government ID). No business permit is required for stall application.
              </p>
            </div>
          </div>
        </div>

        <!-- Action Buttons Step 1 -->
        <div class="actions-bar">
          <div class="left-actions">
            <button type="button" class="btn cancel" @click="handleCancel">
              Cancel
            </button>
            <button type="button" class="btn secondary" @click="saveDraft">
              <i class="pi pi-save"></i>
              Save as Draft
            </button>
          </div>
          <button type="button" class="btn submit" @click="proceedToStep2">
            Next: Upload Documents →
          </button>
        </div>
      </div>

      <!-- ========================================================
           STEP 2: UPLOAD REQUIRED DOCUMENTS
           ======================================================== -->
      <div v-if="currentStep === 2" class="form-step-container">
        <div class="step-guide-box">
          <i class="pi pi-file-arrow-up"></i>
          <div>
            <strong>Step 2: Unified Digital Application &amp; Valid ID Upload:</strong>
            <p>The system automatically compiles your formal Letter of Intent (LOI) addressed to <strong>{{ incumbentMayor }}</strong>. You do <strong>not</strong> need to draft, scan, or upload an LOI document. The applicant uploads only <strong>one requirement: a clear copy of a valid government-issued ID</strong>.</p>
          </div>
        </div>

        <!-- SECTION I: AUTO-MIRRORED STAKEHOLDER INFORMATION & ID UPLOAD -->
        <div class="form-section-card" style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 18px; margin-bottom: 1.25rem;">
          <div class="section-card-header" style="margin-bottom: 14px;">
            <i class="pi pi-id-card" style="color: #0284c7;"></i>
            <div>
              <h3 style="margin: 0; font-size: 1.05rem; color: #0f172a;">Section I: Auto-Mirrored Stakeholder Information &amp; ID Upload</h3>
              <p style="margin: 2px 0 0; font-size: 0.8rem; color: #64748b;">Read-only mirrored profile from Step 1A and Step 1B stall selection</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
            <div>
              <span style="font-size: 0.75rem; color: #64748b; display: block; font-weight: 600;">Application Reference No.</span>
              <strong style="font-size: 0.92rem; color: #1e40af;" class="font-mono">{{ submittedAppNumber || 'Generated on submission' }}</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: #64748b; display: block; font-weight: 600;">Date Filed</span>
              <strong style="font-size: 0.92rem; color: #0f172a;">{{ submittedDateFormatted }} (Auto-set)</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: #64748b; display: block; font-weight: 600;">Applicant Legal Name</span>
              <strong style="font-size: 0.92rem; color: #0f172a;">{{ fullName }}</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: #64748b; display: block; font-weight: 600;">Civil Status &amp; Gender</span>
              <strong style="font-size: 0.92rem; color: #0f172a;">{{ civilStatus }} &bull; {{ gender }}</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: #64748b; display: block; font-weight: 600;">Residential Address</span>
              <strong style="font-size: 0.92rem; color: #0f172a;">{{ address }}</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: #64748b; display: block; font-weight: 600;">Contact Number</span>
              <strong style="font-size: 0.92rem; color: #0f172a;">{{ contact }}</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: #64748b; display: block; font-weight: 600;">Target Stall Number</span>
              <strong style="font-size: 0.92rem; color: #15803d;">{{ stallNumberCode }}</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: #64748b; display: block; font-weight: 600;">Valid Government ID Type</span>
              <strong style="font-size: 0.92rem; color: #0f172a;">{{ validIdType }}</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: #64748b; display: block; font-weight: 600;">Government ID Card Number</span>
              <strong style="font-size: 0.92rem; color: #0f172a;" class="font-mono">{{ validIdNo }}</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: #64748b; display: block; font-weight: 600;">LOI Document Upload Required?</span>
              <span style="display: inline-block; background: #ecfdf5; color: #166534; font-weight: 800; font-size: 0.78rem; padding: 2px 8px; border-radius: 6px; border: 1px solid #86efac;">
                FALSE &bull; System Auto-Compiled
              </span>
            </div>
          </div>
        </div>

        <!-- Section IV: Documentary Requirements Checklist (Image 2) -->
        <div class="doc-checklist-card">
          <div class="checklist-header">
            <i class="pi pi-list-check"></i>
            <div>
              <h4>IV. Documentary Requirements Checklist</h4>
              <p>Official checklist pursuant to Manticao Public Market Unified Application Form</p>
            </div>
          </div>
          <div class="checklist-items">
            <div class="checklist-item done">
              <i class="pi pi-check-circle"></i>
              <span>Accomplished Unified Application Form (Auto-generated by system)</span>
            </div>
            <div class="checklist-item done">
              <i class="pi pi-check-circle"></i>
              <span>Digital Letter of Intent (LOI) addressed to {{ incumbentMayor }} (Compiled automatically by system)</span>
            </div>
            <div class="checklist-item" :class="{ done: Boolean(idFile || existingApplication?.validIdUrl) }">
              <i :class="idFile || existingApplication?.validIdUrl ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
              <span>Photocopy of Valid Government-Issued ID ({{ validIdType }}) <strong style="color: #059669;">[Required Upload]</strong></span>
            </div>
          </div>
        </div>

        <!-- Document 1: Digital Letter of Intent (LOI) - System Compiled -->
        <div class="doc-upload-card" style="border: 2px solid #3b82f6; background: #f8fafc;">
          <div class="doc-card-top">
            <div class="doc-icon-wrap" style="background: #eff6ff; color: #2563eb;">
              <i class="pi pi-sparkles"></i>
            </div>
            <div class="doc-info" style="flex: 1;">
              <div class="doc-title-row" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <span class="doc-title" style="font-size: 1.05rem; font-weight: 800; color: #1e3a8a;">
                  Digital Letter of Intent (LOI)
                </span>
                <span class="doc-status-badge uploaded" style="background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd;">
                  <i class="pi pi-check"></i> Automatically Compiled by System
                </span>
              </div>
              <p class="doc-desc" style="color: #475569; margin: 4px 0 10px;">
                Addressed to <strong>{{ incumbentMayor }}</strong> &bull; The system automatically compiles the formal LOI based on your registration and selected stall. You do <strong>not</strong> draft, scan, or upload an LOI document.
              </p>

              <!-- Compiled LOI Preview Box -->
              <div class="compiled-loi-preview-box" style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 0.82rem; color: #334155; line-height: 1.6; max-height: 200px; overflow-y: auto; white-space: pre-wrap; margin-bottom: 12px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);">{{ compiledLoiDisplay }}</div>

              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button
                  type="button"
                  class="btn-generate-loi"
                  style="background: #2563eb; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;"
                  @click="showLoiModal = true"
                >
                  <i class="pi pi-file-edit"></i>
                  <span>View / Edit Formal LOI</span>
                </button>
                <button
                  type="button"
                  class="btn secondary"
                  style="border: 1px solid #cbd5e1; background: white; padding: 8px 14px; border-radius: 8px; font-weight: 600; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;"
                  @click="exportLoiWord"
                >
                  <i class="pi pi-file-word" style="color: #2563eb;"></i>
                  <span>Export Word (.doc)</span>
                </button>
                <button
                  type="button"
                  class="btn secondary"
                  style="border: 1px solid #cbd5e1; background: white; padding: 8px 14px; border-radius: 8px; font-weight: 600; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;"
                  @click="exportLoiPdf"
                >
                  <i class="pi pi-file-pdf" style="color: #dc2626;"></i>
                  <span>Export PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Document 2: Valid Government ID (The ONLY Upload Requirement) -->
        <div class="doc-upload-card" style="border: 2px solid #059669; background: #ffffff;">
          <div class="doc-card-top">
            <div class="doc-icon-wrap" style="background: #ecfdf5; color: #059669;">
              <i class="pi pi-id-card"></i>
            </div>
            <div class="doc-info" style="flex: 1;">
              <div class="doc-title-row" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <span class="doc-title" style="font-size: 1.05rem; font-weight: 800; color: #065f46;">
                  Document Requirement: Valid Government Identification (Valid ID)
                </span>
                <span class="doc-status-badge" :class="getDocStatusClass('id')">
                  {{ getDocStatusLabel('id') }}
                </span>
              </div>
              <p class="doc-desc" style="color: #475569; margin: 4px 0 10px;">
                <strong>Single Required Upload:</strong> Please upload a clear photocopy, photo, or scan of your valid government-issued ID ({{ validIdType }}) showing ID number <code>{{ validIdNo || 'Specified in Step 1' }}</code>. Accepted: PDF, PNG, JPG, JPEG (Max 15MB).
              </p>
              <div v-if="existingApplication?.validIdUrl" class="existing-doc-link">
                <a :href="existingApplication.validIdUrl" target="_blank" rel="noopener noreferrer">
                  <i class="pi pi-external-link"></i> View current ID on file
                </a>
              </div>
            </div>
          </div>

          <div class="doc-actions-row">
            <input
              ref="idFileInput"
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              style="display: none;"
              @change="handleFileSelected($event, 'id')"
            />

            <button type="button" class="btn-doc-action" style="background: #059669; color: white;" @click="idFileInput?.click()">
              <i class="pi pi-upload"></i>
              <span>{{ idFile ? 'Replace Valid ID' : 'Upload Valid ID (*)' }}</span>
            </button>

            <button
              v-if="idFile || idPreviewUrl"
              type="button"
              class="btn-doc-action"
              @click="openPreview('id')"
            >
              <i class="pi pi-eye"></i>
              <span>Preview</span>
            </button>

            <button
              v-if="idFile"
              type="button"
              class="btn-doc-action danger"
              @click="removeFile('id')"
            >
              <i class="pi pi-trash"></i>
              <span>Remove</span>
            </button>
          </div>

          <div v-if="idFile" class="file-chosen-notice" style="background: #f0fdf4; border: 1px solid #86efac; color: #166534;">
            <i class="pi pi-check-circle" style="color: #16a34a;"></i>
            <span>Ready for submission: <strong>{{ idFile.name }}</strong> ({{ (idFile.size / 1024).toFixed(1) }} KB)</span>
          </div>
        </div>

        <div class="notice-callout">
          <i class="pi pi-shield"></i>
          <div>
            <strong>Step 3 Mayoral LOI Decision Notice:</strong> The physical/printed LOI is endorsed to the Office of the Municipal Mayor. Once the Mayor signs the executive approval or disapproval, authorized LGU staff log into the system to record the official decision, attach the reference number, and record the decision date.
          </div>
        </div>

        <!-- Action Buttons Step 2 -->
        <div class="actions-bar">
          <div class="left-actions">
            <button type="button" class="btn secondary" @click="currentStep = 1">
              ← Back to Edit
            </button>
          </div>
          <button type="button" class="btn submit" @click="proceedToStep3">
            Next: Review →
          </button>
        </div>
      </div>

      <!-- ========================================================
           STEP 3: REVIEW APPLICATION & SUBMISSION
           ======================================================== -->
      <div v-if="currentStep === 3" class="form-step-container">
        <div class="step-guide-box">
          <i class="pi pi-check-square"></i>
          <div>
            <strong>Review Your Application Summary:</strong>
            <p>Please double-check all information and uploaded documents before final submission to the Market Office.</p>
          </div>
        </div>

        <div class="review-table-container">
          <table class="review-table">
            <tbody>
              <tr>
                <th class="table-section-header" colspan="2">I. Applicant Details</th>
              </tr>
              <tr>
                <td class="lbl-col">Full Name</td>
                <td class="val-col"><strong>{{ fullName }}</strong></td>
              </tr>
              <tr>
                <td class="lbl-col">Contact Number</td>
                <td class="val-col">{{ contact }}</td>
              </tr>
              <tr>
                <td class="lbl-col">Email Address</td>
                <td class="val-col">{{ email }}</td>
              </tr>
              <tr>
                <td class="lbl-col">Residential Address</td>
                <td class="val-col">{{ address }}</td>
              </tr>
              <tr>
                <td class="lbl-col">Civil Status &amp; Gender</td>
                <td class="val-col"><strong>{{ civilStatus }}</strong> &bull; {{ gender }} (DOB: {{ dateOfBirth }})</td>
              </tr>
              <tr>
                <td class="lbl-col">Emergency Contact</td>
                <td class="val-col"><strong>{{ emergencyContactPerson }}</strong> &bull; {{ emergencyContactNumber }}</td>
              </tr>
              <tr>
                <td class="lbl-col">Valid ID Presented</td>
                <td class="val-col"><strong>{{ validIdType }}</strong> &bull; ID No: <code>{{ validIdNo }}</code></td>
              </tr>
              <tr>
                <td class="lbl-col">Incumbent Municipal Mayor</td>
                <td class="val-col">
                  <strong style="color: #15803d;">{{ incumbentMayor }}</strong>
                  <span class="stall-note-tag" style="background: #ecfdf5; color: #166534; border: 1px solid #86efac; margin-left: 8px;">Executive Addressee</span>
                </td>
              </tr>

              <tr>
                <th class="table-section-header" colspan="2">II. Business Information to be Engaged</th>
              </tr>
              <tr>
                <td class="lbl-col">Business / Trade Name</td>
                <td class="val-col"><strong>{{ businessName }}</strong></td>
              </tr>
              <tr>
                <td class="lbl-col">Nature of Business</td>
                <td class="val-col">
                  <span v-if="natureOfBusiness.length">{{ natureOfBusiness.join(', ') }}</span>
                  <span v-else>{{ businessType }}</span>
                  <span v-if="natureOfBusiness.includes('Others') && otherNature" class="text-slate-500"> ({{ otherNature }})</span>
                </td>
              </tr>
              <tr>
                <td class="lbl-col">Products / Commodities</td>
                <td class="val-col">{{ commodities || 'None specified' }}</td>
              </tr>
              <tr>
                <td class="lbl-col">Stall / Space Type</td>
                <td class="val-col"><span class="badge-type">{{ stallSpaceType }}</span></td>
              </tr>
              <tr>
                <td class="lbl-col">Estimated Employees</td>
                <td class="val-col">{{ estimatedEmployees }} personnel ({{ numEmployeesFemale }} female)</td>
              </tr>
              <tr>
                <td class="lbl-col">Business &amp; Floor Area</td>
                <td class="val-col"><strong>{{ stallFloorArea }}</strong> ({{ businessAreaSqm || 12.00 }} sq.m.)</td>
              </tr>
              <tr>
                <td class="lbl-col">Capitalization / Line of Business</td>
                <td class="val-col">
                  <strong>₱{{ Number(businessLines[0]?.capitalization || 0).toLocaleString('en-PH') }}</strong> &bull;
                  {{ businessLines[0]?.lineOfBusiness || 'Fish Vendor / Wet Section Trade' }} (PSIC: {{ businessLines[0]?.psicCode || '47211' }})
                </td>
              </tr>
              <tr>
                <td class="lbl-col">Target Stall Request</td>
                <td class="val-col">
                  <strong>{{ stallNumberCode }}</strong> &bull; {{ stallMarketSection }}
                  <span class="stall-note-tag" style="background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd;">HELD_FOR_APPLICATION</span>
                </td>
              </tr>
              <tr>
                <td class="lbl-col">Base Monthly Rental Rate</td>
                <td class="val-col"><strong style="color: #166534;">{{ stallMonthlyRentFormatted }}</strong></td>
              </tr>

              <tr>
                <th class="table-section-header" colspan="2">IV. Documentary Requirements</th>
              </tr>
              <tr>
                <td class="lbl-col">Letter of Intent (LOI)</td>
                <td class="val-col">
                  <span class="doc-status-badge uploaded" style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;">
                    <i class="pi pi-check"></i> Digitally Compiled &amp; Addressed to {{ incumbentMayor }}
                  </span>
                  <button
                    type="button"
                    class="btn-text-preview"
                    @click="showLoiModal = true"
                  >
                    View / Edit LOI
                  </button>
                </td>
              </tr>
              <tr>
                <td class="lbl-col">Valid Government ID</td>
                <td class="val-col">
                  <span class="doc-status-badge uploaded">
                    <i class="pi pi-check"></i> {{ idFile ? idFile.name : (existingApplication?.validIdUrl ? 'On File' : 'Ready') }}
                  </span>
                  <button
                    v-if="idPreviewUrl || existingApplication?.validIdUrl"
                    type="button"
                    class="btn-text-preview"
                    @click="openPreview('id')"
                  >
                    Preview ID
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- V. Undertaking of Applicant (Image 2 Section V) -->
        <div class="form-section-card undertaking-card" style="margin-top: 1.5rem;">
          <div class="section-card-header">
            <i class="pi pi-shield"></i>
            <div>
              <h3>V. Undertaking of Applicant</h3>
              <p>Statutory rules and covenants pursuant to Manticao Public Market Operations Code</p>
            </div>
          </div>

          <div class="undertaking-list">
            <ol>
              <li>Use the assigned stall/space only for the approved business activity.</li>
              <li>Comply with all existing market rules and regulations and applicable municipal ordinances.</li>
              <li>Maintain cleanliness, sanitation, and proper waste disposal within and around the stall.</li>
              <li>Pay rentals, fees, utilities, and other lawful charges on time.</li>
              <li>Not sublease, transfer, assign, or allow another person to use the stall without prior written approval.</li>
              <li>Maintain the stall and its fixtures in good and sanitary condition.</li>
              <li>Comply with all health, safety, fire, sanitation, and other applicable requirements.</li>
              <li>Vacate the stall/space upon lawful termination, expiration, or cancellation of the authority to occupy it.</li>
              <li>Submit updated documents whenever required by the Municipal Government.</li>
              <li>Accept the applicable penalties or other lawful remedies for violations of market rules and regulations.</li>
            </ol>
            <div class="undertaking-statutory-note">
              <em>I understand that approval of this application does not constitute ownership of the stall or market property and that occupancy is subject to applicable laws, ordinances, rules, regulations, and terms and conditions imposed by the Municipal Government of Manticao.</em>
            </div>
          </div>

          <div class="declaration-checkbox-row" style="margin-top: 1.25rem;">
            <input
              id="undertakingCheck"
              v-model="undertakingAgreed"
              type="checkbox"
              class="custom-checkbox"
            />
            <label for="undertakingCheck" class="declaration-label">
              <strong>I undertake and agree to abide by all 10 statutory market covenants above. <span class="required-star">*</span></strong>
              <span>Checked and confirmed as an applicant of Manticao Public Market.</span>
            </label>
          </div>

          <!-- Submission Lifecycle Queue Status & Physical Signature Notice -->
          <div style="margin-top: 1.25rem; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #1e293b; font-weight: 700;">
                <i class="pi pi-arrow-right-arrow-left" style="color: #2563eb;"></i>
                <span>Initial Submission Status:</span>
              </div>
              <span style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 4px 10px; border-radius: 8px; font-size: 0.8rem; font-weight: 800;">
                AWAITING_LOI_DECISION (Queued for Mayoral Review)
              </span>
            </div>
            <p style="margin: 0; font-size: 0.8rem; color: #64748b; line-height: 1.4;">
              <i class="pi pi-info-circle" style="color: #0284c7; margin-right: 4px;"></i>
              Physical signature over printed name is affixed upon document printing at the Market Administration Office / Mayor's Office during official contract signing (Step 6).
            </p>
          </div>
        </div>

        <!-- Action Buttons Step 3 -->
        <div class="actions-bar">
          <div class="left-actions">
            <button type="button" class="btn secondary" @click="currentStep = 2">
              ← Back to Documents
            </button>
            <button type="button" class="btn secondary" @click="showUnifiedFormModal = true">
              <i class="pi pi-file-pdf"></i>
              Unified Application Form (5 Pages)
            </button>
            <button type="button" class="btn secondary" @click="showLoiModal = true">
              <i class="pi pi-file-edit"></i>
              Letter of Intent
            </button>
            <button type="button" class="btn cancel" @click="handleCancel">
              Cancel
            </button>
          </div>
          <button
            type="button"
            class="btn submit"
            :disabled="isSubmitting"
            @click="promptSubmitModal"
          >
            {{ isSubmitting ? 'Submitting...' : 'Submit Application' }}
          </button>
        </div>
      </div>

      <!-- ========================================================
           STEP 4: SUBMITTED SUCCESS CONFIRMATION
           ======================================================== -->
      <div v-if="currentStep === 4" class="form-step-container">
        <div class="submitted-success-card">
          <div class="success-icon-badge">
            <i class="pi pi-check-circle"></i>
          </div>
          <h2 class="success-title">Application Submitted</h2>
          <span class="status-pill pending">Pending Review</span>

          <div class="submitted-summary-box">
            <div class="summary-item">
              <span class="s-label">Application Number</span>
              <span class="s-val highlight">{{ submittedAppNumber }}</span>
            </div>
            <div class="summary-item">
              <span class="s-label">Applicant</span>
              <span class="s-val">{{ fullName }}</span>
            </div>
            <div class="summary-item">
              <span class="s-label">Submitted On</span>
              <span class="s-val">{{ submittedDateFormatted }}</span>
            </div>
          </div>

          <!-- Official Municipal Application Documents Action Box -->
          <div class="official-docs-action-box" style="margin: 1.5rem 0; padding: 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; flex-direction: column; gap: 10px; text-align: left;">
            <div style="font-size: 0.9rem; font-weight: 700; color: #1e293b;">
              <i class="pi pi-print" style="color: #2563eb; margin-right: 6px;"></i>
              Official Municipal Application Documents
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button
                type="button"
                class="btn secondary"
                style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600;"
                @click="showUnifiedFormModal = true"
              >
                <i class="pi pi-file-pdf"></i>
                View / Print Unified Application Form (5 Pages)
              </button>
              <button
                type="button"
                class="btn secondary"
                style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; border-color: #0284c7; color: #0369a1; background: #f0f9ff;"
                @click="showLoiModal = true"
              >
                <i class="pi pi-file-edit"></i>
                View / Print Letter of Intent
              </button>
            </div>
          </div>

          <div class="next-step-advisory">
            <i class="pi pi-clock"></i>
            <p>
              Your application has been received. Please wait for the authorized LGU personnel to review the Letter of Intent and record the approval decision.
            </p>
          </div>

          <div class="submitted-actions-row">
            <button
              type="button"
              class="btn secondary"
              @click="router.push({ name: 'ApplicationProgress' })"
            >
              <i class="pi pi-file"></i>
              View Application
            </button>
            <button
              type="button"
              class="btn submit"
              @click="router.push({ name: 'ApplicationProgress' })"
            >
              <i class="pi pi-chart-line"></i>
              Track Progress
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================================
           MODALS
           ======================================================== -->

      <!-- Submit Confirmation Modal -->
      <div v-if="showConfirmModal" class="modal-backdrop" @click.self="showConfirmModal = false">
        <div class="modal-dialog">
          <div class="modal-header">
            <i class="pi pi-send" style="color: #2563eb; font-size: 1.3rem;"></i>
            <h3>Confirm Application Submission</h3>
          </div>
          <div class="modal-body">
            <p style="margin: 0 0 1rem; color: #1e293b; font-size: 0.95rem; line-height: 1.6;">
              Are you sure you want to submit your application? Please verify that your information and uploaded documents are correct.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.85rem; color: #64748b;">
              <i class="pi pi-info-circle" style="color: #2563eb; margin-right: 4px;"></i>
              Once submitted, your application will be queued for formal Mayor's LOI review and Treasurer fee assessment.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn secondary" @click="showConfirmModal = false">
              Go Back
            </button>
            <button
              type="button"
              class="btn submit"
              :disabled="isSubmitting"
              @click="executeSubmission"
            >
              {{ isSubmitting ? 'Submitting...' : 'Confirm Submission' }}
            </button>
          </div>
        </div>
      </div>

      <!-- File Preview Modal -->
      <div v-if="showPreviewModal" class="modal-backdrop" @click.self="showPreviewModal = false">
        <div class="modal-dialog preview-dialog">
          <div class="modal-header">
            <h3>{{ previewTitle }}</h3>
            <button type="button" class="btn-close" @click="showPreviewModal = false">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="modal-body preview-body">
            <img v-if="previewType === 'image'" :src="previewSrc" alt="Document Preview" class="preview-img" />
            <iframe v-else-if="previewType === 'pdf'" :src="previewSrc" class="preview-iframe" title="PDF Preview"></iframe>
            <div v-else class="preview-fallback">
              <i class="pi pi-file-pdf" style="font-size: 3rem; color: #ef4444;"></i>
              <p>Preview available by downloading file or viewing in external window.</p>
              <a :href="previewSrc" target="_blank" rel="noopener noreferrer" class="btn-link">
                Open Document in New Window ↗
              </a>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn secondary" @click="showPreviewModal = false">
              Close Preview
            </button>
          </div>
        </div>
      </div>

      <!-- Official 5-Page Unified Application Form Modal (Rental/Occupancy) -->
      <UnifiedApplicationFormModal
        v-if="showUnifiedFormModal"
        :visible="showUnifiedFormModal"
        :application-data="unifiedFormData"
        :application="unifiedFormData"
        role="APPLICANT"
        @close="showUnifiedFormModal = false"
      />

      <!-- Official Letter of Intent Generator Modal -->
      <LetterOfIntentModal
        v-if="showLoiModal"
        :visible="showLoiModal"
        :applicant-name="fullName"
        :applicant-address="address"
        :applicant-contact="contact"
        :business-nature="natureOfBusiness.length ? natureOfBusiness.join(', ') : businessType"
        :preferred-stall="chosenStallInfo?.stallNo ? `Stall #${chosenStallInfo.stallNo}` : ''"
        :commodities="commodities"
        :existing-loi-content="loiContent"
        :incumbent-mayor="incumbentMayor"
        @close="showLoiModal = false"
        @use-loi="handleUseLoi"
        @attach="handleUseLoi($event.text || $event)"
      />

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { isUuid } from '../services/api'
import { supabase } from '../config/supabase'
import { useAuthStore } from '../stores/auth'
import { useStakeholderStore } from '../stores/stakeholder'
import { getStakeholderByUserId } from '../services/applicationService'
import { fetchStalls } from '../services/stallService'
import { systemMessage } from '../utils/systemMessage'
import UnifiedApplicationFormModal from '../components/UnifiedApplicationFormModal.vue'
import LetterOfIntentModal from '../components/LetterOfIntentModal.vue'
import VacantStallMapPicker from '../components/VacantStallMapPicker.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const stakeholderStore = useStakeholderStore()

// Step state: 1 (Form), 2 (Upload Documents), 3 (Review), 4 (Submitted)
const currentStep = ref(1)

// ==========================================
// UNIFIED BUSINESS PERMIT APPLICATION FIELDS (IMAGES 1-4)
// ==========================================
const applicationType         = ref('NEW') // 'NEW', 'RENEWAL', 'ADDITIONAL'
const paymentMode             = ref('Annually') // 'Annually', 'Bi-Annually', 'Quarterly'
const trackingNumber          = ref('')
const businessIdNumber        = ref('')

// Section A: Business Information and Registration
const orgType                 = ref('Sole Proprietor')
const orgGender               = ref('') // 'Male', 'Female'
const dtiSecCdaRegNo          = ref('')
const tinNo                   = ref('')
const tradeNameFranchise      = ref('')

// Main Office Address components
const mainHouseBldgNo         = ref('')
const mainBldgName            = ref('')
const mainLotNo               = ref('')
const mainBlockNo             = ref('')
const mainStreet              = ref('')
const mainSubdivision         = ref('')
const mainBarangay            = ref('')
const mainDistrict            = ref('')
const mainMunicipality        = ref('')
const mainProvince            = ref('')
const mainZipCode             = ref('')

const telephoneNo             = ref('')
const mobileNo                = ref('')

// Sole Proprietorship Owner
const ownerSurname            = ref('')
const ownerGivenName          = ref('')
const ownerMiddleName         = ref('')
const ownerSuffix             = ref('')

// Corporate President / Officer
const corpPresidentSurname    = ref('')
const corpPresidentGivenName  = ref('')
const corpPresidentMiddleName = ref('')
const corpPresidentSuffix     = ref('')
const corpCitizenship         = ref('')

// Section B: Business Operation
const businessAreaSqm         = ref(0)
const totalFloorAreaSqm       = ref(0)
const numEmployeesMale        = ref(0)
const numEmployeesFemale      = ref(0)
const numEmployeesLguResiding = ref(0)
const deliveryVehiclesVanTruck= ref(0)
const deliveryVehiclesMotorcycle = ref(0)

// Business Location Address
const locSameAsMain           = ref(true)
const locHouseBldgNo          = ref('')
const locBldgName             = ref('')
const locLotNo                = ref('')
const locBlockNo              = ref('')
const locStreet               = ref('')
const locSubdivision          = ref('')
const locBarangay             = ref('')
const locDistrict             = ref('')
const locMunicipality         = ref('')
const locProvince             = ref('')
const locZipCode              = ref('')

// Property Ownership & Incentives
const propertyOwned           = ref(false)
const taxDecNo                = ref('')
const propertyIdNo            = ref('')
const taxIncentivesEnjoyed    = ref(false)

const businessActivity        = ref('')
const businessActivityOther   = ref('')

// Line of Business (Table from Image 1)
const businessLines           = ref([])

// =========================
// FORM STATE (STEP 1)
// =========================
// Phase 1A: Stakeholder Citizen Profile State
const firstName           = ref('')
const middleName          = ref('')
const lastName            = ref('')
const civilStatus         = ref('')
const dateOfBirth         = ref('')
const gender              = ref('')
const contact             = ref('')
const email               = ref('')
const address             = ref('')
const emergencyContactPerson = ref('')
const emergencyContactNumber = ref('')

// Section 0: Municipal Administration Reference
const incumbentMayor      = ref('')
const designationTitle    = ref('Municipal Mayor')
const lguAdministrativeEntity = ref('Municipality of Manticao, Misamis Oriental')

// Section I: Valid ID
const validIdType         = ref('')
const validIdNo           = ref('')

// Unified Form Section II: Business Information
const businessName        = ref('')
const businessType        = ref('')
const natureOptions       = [
  'Retail',
  'Wholesale',
  'Food/Cooked Food',
  'Meat',
  'Fish',
  'Fruits & Vegetables',
  'Dry Goods',
  'Grocery',
  'Others'
]
const natureOfBusiness    = ref([])
const otherNature         = ref('')
const commodities         = ref('')
const stallSpaceType      = ref('')
const estimatedEmployees  = ref(0)

const preferredZone       = ref('')
const requestedSize       = ref('')
const selectedStallId     = ref(null)
const preferredStallNo    = ref('')
const businessDescription = ref('')

const declarationAgreed   = ref(false)
const undertakingAgreed   = ref(false)

// Stalls & Application
const stallsList          = ref([])
const existingApplication = ref(null)

// Files (STEP 2)
const idFile              = ref(null)
const letterFile          = ref(null)
const idPreviewUrl        = ref(null)
const letterPreviewUrl    = ref(null)
const loiContent          = ref('')

const idFileInput         = ref(null)
const loiFileInput        = ref(null)

// Modals
const showLoiModal         = ref(false)
const showUnifiedFormModal = ref(false)
const showBusinessPermitModal = ref(false)
const showDossierModal     = ref(false)

// Submissions state (STEP 3 & 4)
const isSubmitting        = ref(false)
const errorMessage        = ref('')
const showConfirmModal    = ref(false)
const submittedAppNumber  = ref('')
const submittedDate       = ref(new Date())

// Preview Modal state
const showPreviewModal    = ref(false)
const previewTitle        = ref('')
const previewSrc          = ref('')
const previewType         = ref('image')

// =========================
// COMPUTED ATTRIBUTES
// =========================
const fullName = computed(() => {
  const parts = [firstName.value, middleName.value, lastName.value].filter(Boolean)
  return parts.join(' ') || 'Applicant'
})

const availableStalls = computed(() => {
  return stallsList.value.filter(s => {
    const isAvail = s.status === 'AVAILABLE' || s.status === 'VACANT'
    const isCurrent = selectedStallId.value && Number(s.id) === Number(selectedStallId.value)
    return isAvail || isCurrent
  })
})

const chosenStallInfo = computed(() => {
  if (!selectedStallId.value) return null
  return stallsList.value.find(s => Number(s.id) === Number(selectedStallId.value)) || null
})

const stallNumberCode = computed(() => {
  if (!chosenStallInfo.value) return preferredStallNo.value
  const num = chosenStallInfo.value.stallNo
  return chosenStallInfo.value.stallType?.toLowerCase().includes('wet')
    ? `Wet Section Stall #${num}`
    : `Stall #${num}`
})

const stallMarketSection = computed(() => {
  if (!chosenStallInfo.value) return 'Wet Section (Fish & Marine)'
  return chosenStallInfo.value.section?.name || chosenStallInfo.value.stallType || 'Wet Section (Fish & Marine)'
})

const stallFloorArea = computed(() => {
  if (!chosenStallInfo.value) return '3.00m × 4.00m (12.00 sq.m.)'
  return chosenStallInfo.value.dimensions || (chosenStallInfo.value.area_sqm ? `${chosenStallInfo.value.area_sqm} sq.m.` : '3.00m × 4.00m (12.00 sq.m.)')
})

const stallMonthlyRentFormatted = computed(() => {
  const r = Number(chosenStallInfo.value?.monthlyRent || 0)
  return `₱${r.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
})

const submittedDateFormatted = computed(() => {
  const d = submittedDate.value || new Date()
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

// Unified form data payload for official 3-page printable view
const unifiedFormData = computed(() => {
  return {
    id: existingApplication.value?.id || null,
    applicationNo: submittedAppNumber.value || existingApplication.value?.applicationNo || '',
    created_at: existingApplication.value?.created_at || new Date().toISOString(),
    firstName: firstName.value,
    middleName: middleName.value,
    lastName: lastName.value,
    civilStatus: civilStatus.value,
    dateOfBirth: dateOfBirth.value,
    gender: gender.value,
    address: address.value,
    contact: contact.value,
    emergencyContactPerson: emergencyContactPerson.value,
    emergencyContactNumber: emergencyContactNumber.value,
    validIdType: validIdType.value,
    validIdNo: validIdNo.value,
    businessName: businessName.value,
    businessType: businessType.value,
    natureOfBusiness: natureOfBusiness.value,
    otherNatureOfBusiness: otherNature.value,
    productsCommodities: commodities.value,
    stallSpaceType: stallSpaceType.value,
    preferredStallNo: chosenStallInfo.value?.stallNo ? `Stall #${chosenStallInfo.value.stallNo}` : preferredStallNo.value,
    stallNumberCode: stallNumberCode.value,
    stallMarketSection: stallMarketSection.value,
    stallFloorArea: stallFloorArea.value,
    floorAreaDimensions: stallFloorArea.value,
    estimatedEmployees: estimatedEmployees.value,
    declarationAgreed: declarationAgreed.value,
    undertakingAgreed: undertakingAgreed.value,
    loiUrl: letterPreviewUrl.value || existingApplication.value?.loiUrl,
    validIdUrl: idPreviewUrl.value || existingApplication.value?.validIdUrl,
    loiContent: loiContent.value,
    incumbentMayor: incumbentMayor.value,
    monthlyRent: chosenStallInfo.value?.monthlyRent || 0,
    baseMonthlyRentalRate: chosenStallInfo.value?.monthlyRent || 0,
    marketOfficeStatus: existingApplication.value?.marketOfficeStatus || '',
    treasuryFeeMonthly: existingApplication.value?.treasuryFeeMonthly || chosenStallInfo.value?.monthlyRent || 0,
    treasuryFeeSecurityDeposit: existingApplication.value?.treasuryFeeSecurityDeposit || (Number(chosenStallInfo.value?.monthlyRent || 0) * 2),
  }
})

// Unified Business Permit Form payload for official 2-page printable view (Images 1-4)
const businessPermitFormData = computed(() => {
  return {
    id: existingApplication.value?.id || null,
    applicationNo: submittedAppNumber.value || existingApplication.value?.applicationNo || '',
    trackingNumber: trackingNumber.value || submittedAppNumber.value || existingApplication.value?.trackingNumber || '',
    businessIdNumber: businessIdNumber.value || existingApplication.value?.businessIdNumber || '',
    applicationType: applicationType.value,
    paymentMode: paymentMode.value,
    orgType: orgType.value,
    orgGender: gender.value || orgGender.value,
    civilStatus: civilStatus.value,
    dateOfBirth: dateOfBirth.value,
    gender: gender.value,
    emergencyContactPerson: emergencyContactPerson.value,
    emergencyContactNumber: emergencyContactNumber.value,
    dtiSecCdaRegNo: dtiSecCdaRegNo.value,
    tinNo: tinNo.value,
    tradeNameFranchise: tradeNameFranchise.value || businessName.value,
    businessName: tradeNameFranchise.value || businessName.value,
    businessType: businessType.value,
    mainHouseBldgNo: mainHouseBldgNo.value,
    mainBldgName: mainBldgName.value,
    mainLotNo: mainLotNo.value,
    mainBlockNo: mainBlockNo.value,
    mainStreet: mainStreet.value,
    mainSubdivision: mainSubdivision.value,
    mainBarangay: mainBarangay.value,
    mainDistrict: mainDistrict.value,
    mainMunicipality: mainMunicipality.value,
    mainProvince: mainProvince.value,
    mainZipCode: mainZipCode.value,
    telephoneNo: telephoneNo.value,
    mobileNo: mobileNo.value || contact.value,
    contact: mobileNo.value || contact.value,
    email: email.value,
    ownerSurname: ownerSurname.value || lastName.value,
    ownerGivenName: ownerGivenName.value || firstName.value,
    ownerMiddleName: ownerMiddleName.value || middleName.value,
    ownerSuffix: ownerSuffix.value,
    corpPresidentSurname: corpPresidentSurname.value,
    corpPresidentGivenName: corpPresidentGivenName.value,
    corpPresidentMiddleName: corpPresidentMiddleName.value,
    corpPresidentSuffix: corpPresidentSuffix.value,
    corpCitizenship: corpCitizenship.value,
    businessAreaSqm: businessAreaSqm.value,
    totalFloorAreaSqm: totalFloorAreaSqm.value,
    numEmployeesMale: numEmployeesMale.value,
    numEmployeesFemale: numEmployeesFemale.value,
    numEmployeesLguResiding: numEmployeesLguResiding.value,
    deliveryVehiclesVanTruck: deliveryVehiclesVanTruck.value,
    deliveryVehiclesMotorcycle: deliveryVehiclesMotorcycle.value,
    locSameAsMain: locSameAsMain.value,
    locHouseBldgNo: locSameAsMain.value ? mainHouseBldgNo.value : locHouseBldgNo.value,
    locBldgName: locSameAsMain.value ? mainBldgName.value : locBldgName.value,
    locLotNo: locSameAsMain.value ? mainLotNo.value : locLotNo.value,
    locBlockNo: locSameAsMain.value ? mainBlockNo.value : locBlockNo.value,
    locStreet: locSameAsMain.value ? mainStreet.value : locStreet.value,
    locSubdivision: locSameAsMain.value ? mainSubdivision.value : locSubdivision.value,
    locBarangay: locSameAsMain.value ? mainBarangay.value : locBarangay.value,
    locDistrict: locSameAsMain.value ? mainDistrict.value : locDistrict.value,
    locMunicipality: locSameAsMain.value ? mainMunicipality.value : locMunicipality.value,
    locProvince: locSameAsMain.value ? mainProvince.value : locProvince.value,
    locZipCode: locSameAsMain.value ? mainZipCode.value : locZipCode.value,
    propertyOwned: propertyOwned.value,
    taxDecNo: taxDecNo.value,
    propertyIdNo: propertyIdNo.value,
    taxIncentivesEnjoyed: taxIncentivesEnjoyed.value,
    businessActivity: businessActivity.value,
    businessActivityOther: businessActivityOther.value,
    businessLines: businessLines.value,
    preferredStallNo: chosenStallInfo.value?.stallNo ? `Stall #${chosenStallInfo.value.stallNo}` : preferredStallNo.value,
    incumbentMayor: incumbentMayor.value,
    ...existingApplication.value
  }
})

// Auto-Compile Digital Letter of Intent Text
function generateCompiledLoiText() {
  const todayFormatted = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const targetStall = chosenStallInfo.value?.stallNo ? `Stall #${chosenStallInfo.value.stallNo}` : (preferredStallNo.value ? `Stall #${preferredStallNo.value}` : 'Phase 1 and 2 Section')
  const businessDesc = tradeNameFranchise.value || businessName.value || '[Business name]'
  const commodityDesc = commodities.value || businessType.value || '[Business activity]'
  const applicant = fullName.value || 'Applicant'
  const addr = address.value || (mainStreet.value ? `${mainStreet.value} ${mainBarangay.value}, ${mainMunicipality.value}, ${mainProvince.value}` : '[Applicant address]')
  const tel = mobileNo.value || contact.value || '[Contact number]'
  const mayor = incumbentMayor.value || '[Municipal Mayor]'

  return `Date: ${todayFormatted}

${mayor}
MUNICIPAL MAYOR
MANTICAO, MISAMIS ORIENTAL

Subject: Letter of Intent - Market Stall Application

Dear Mayor:

Greetings!

I am respectfully expressing my intent to apply for an available stall/space at ${targetStall} at the Manticao Public Market for the purpose of establishing and operating ${businessDesc} (${commodityDesc}).

I am willing to comply with all the necessary requirements, permits, rental fees, and other rules and regulations of the Municipal Government and Market Administration.

I sincerely hope that my application will be given due consideration. Thank you for your kind attention and assistance.

Respectfully yours,

${applicant}
Address: ${addr}
Contact Number: ${tel}
`
}

const compiledLoiDisplay = computed(() => {
  return loiContent.value || generateCompiledLoiText()
})

function exportLoiWord() {
  const text = loiContent.value || generateCompiledLoiText()
  const blob = new Blob([text], { type: 'application/msword;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `Letter_of_Intent_${(lastName.value || 'Applicant').replace(/\s+/g, '_')}.doc`
  link.click()
  URL.revokeObjectURL(link.href)
}

function exportLoiPdf() {
  showLoiModal.value = true
}

function handleStallSelected(stall) {
  if (!stall) return
  selectedStallId.value = stall.id
  if (stall.areaSqm) {
    businessAreaSqm.value = Number(stall.areaSqm)
    totalFloorAreaSqm.value = Number(stall.areaSqm)
  }
  if (stall.stallNo) {
    preferredStallNo.value = stall.stallNo
  }
}

// Document status helpers
function getDocStatusLabel(type) {
  if (type === 'loi') {
    if (letterFile.value) return 'Uploaded'
    if (existingApplication.value?.loiUrl) return 'Pending Review'
    return 'Required'
  }
  if (type === 'id') {
    if (idFile.value) return 'Uploaded'
    if (existingApplication.value?.validIdUrl) return 'Pending Review'
    return 'Required'
  }
  return 'Required'
}

function getDocStatusClass(type) {
  const lbl = getDocStatusLabel(type)
  if (lbl === 'Uploaded') return 'uploaded'
  if (lbl === 'Pending Review') return 'pending'
  return 'required'
}

// =========================
// STEP NAVIGATION & VALIDATION
// =========================
function proceedToStep2() {
  errorMessage.value = ''

  if (!incumbentMayor.value.trim()) {
    errorMessage.value = 'Please enter the incumbent Municipal Mayor.'
    return
  }

  if (!firstName.value.trim() || !lastName.value.trim()) {
    errorMessage.value = 'Please enter your full name (First name and Last name are required).'
    return
  }

  // Legal age verification (18+)
  if (dateOfBirth.value) {
    const dob = new Date(dateOfBirth.value)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    if (age < 18) {
      errorMessage.value = 'Applicant must be of legal age (at least 18 years old) to apply for market stall tenancy.'
      return
    }
  }

  const cleanContact = contact.value.trim()
  if (!cleanContact || cleanContact.length < 10) {
    errorMessage.value = 'Please enter a valid contact number (e.g. 09XXXXXXXXX).'
    return
  }

  if (!email.value.trim() || !email.value.includes('@')) {
    errorMessage.value = 'Please enter a valid email address.'
    return
  }

  const residentialAddressParts = [
    mainStreet.value,
    mainBarangay.value,
    mainMunicipality.value,
    mainProvince.value,
    mainZipCode.value
  ].map(part => String(part || '').trim())

  if (residentialAddressParts.some(part => !part)) {
    errorMessage.value = 'Please complete your residential address, including street, barangay, municipality, province, and ZIP code.'
    return
  }
  // The visible address is split into fields; persist the complete address as
  // one value for application records, previews, and downstream office review.
  address.value = residentialAddressParts.join(', ')

  if (!validIdNo.value.trim()) {
    errorMessage.value = 'Please enter your Valid ID Number (Section I).'
    return
  }

  if (!businessName.value.trim()) {
    errorMessage.value = 'Please enter your business / trade name.'
    return
  }

  if (!natureOfBusiness.value || natureOfBusiness.value.length === 0) {
    errorMessage.value = 'Please select at least one Nature of Business category.'
    return
  }

  if (natureOfBusiness.value.includes('Others') && !otherNature.value.trim()) {
    errorMessage.value = 'Please specify the other nature of business.'
    return
  }

  if (!commodities.value.trim()) {
    errorMessage.value = 'Please specify the products or commodities to be sold.'
    return
  }

  if (!selectedStallId.value) {
    errorMessage.value = 'Please select a preferred vacant stall / space.'
    return
  }

  if (!declarationAgreed.value) {
    errorMessage.value = 'Please certify and agree to the Section III Application declaration.'
    return
  }

  currentStep.value = 2
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function proceedToStep3() {
  errorMessage.value = ''

  const hasId = idFile.value || existingApplication.value?.validIdUrl

  if (!hasId) {
    errorMessage.value = 'Please upload a clear copy of your Valid Government-Issued ID.'
    return
  }

  // Ensure digital LOI is compiled and ready
  if (!loiContent.value) {
    loiContent.value = generateCompiledLoiText()
  }

  currentStep.value = 3
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function promptSubmitModal() {
  errorMessage.value = ''
  if (!undertakingAgreed.value) {
    errorMessage.value = 'Please read and agree to all 10 Applicant Undertakings under Section V before submitting.'
    return
  }
  showConfirmModal.value = true
}

// Auto LOI handler from LetterOfIntentModal
function handleUseLoi(loiText) {
  const actualText = typeof loiText === 'string' ? loiText : (loiText?.text || '')
  loiContent.value = actualText
  const blob = new Blob([actualText], { type: 'text/plain;charset=utf-8' })
  const file = new File([blob], `Letter_of_Intent_${(lastName.value || 'Applicant').replace(/\s+/g, '_')}.txt`, { type: 'text/plain' })
  letterFile.value = file
  if (letterPreviewUrl.value) URL.revokeObjectURL(letterPreviewUrl.value)
  letterPreviewUrl.value = URL.createObjectURL(file)
  showLoiModal.value = false
  systemMessage.alert(`Official Letter of Intent addressed to ${incumbentMayor.value} has been updated.`, {
    title: 'Letter of Intent Updated',
    severity: 'success'
  })
}

// =========================
// FILE HANDLERS
// =========================
function handleFileSelected(event, type) {
  const file = event.target.files?.[0]
  if (!file) return

  if (type === 'id') {
    idFile.value = file
    if (idPreviewUrl.value) URL.revokeObjectURL(idPreviewUrl.value)
    idPreviewUrl.value = URL.createObjectURL(file)
  } else if (type === 'letter') {
    letterFile.value = file
    if (letterPreviewUrl.value) URL.revokeObjectURL(letterPreviewUrl.value)
    letterPreviewUrl.value = URL.createObjectURL(file)
  }
}

function removeFile(type) {
  if (type === 'id') {
    idFile.value = null
    if (idPreviewUrl.value) URL.revokeObjectURL(idPreviewUrl.value)
    idPreviewUrl.value = null
    if (idFileInput.value) idFileInput.value.value = ''
  } else if (type === 'letter') {
    letterFile.value = null
    loiContent.value = ''
    if (letterPreviewUrl.value) URL.revokeObjectURL(letterPreviewUrl.value)
    letterPreviewUrl.value = null
    if (loiFileInput.value) loiFileInput.value.value = ''
  }
}

function openPreview(docType) {
  if (docType === 'loi') {
    previewTitle.value = 'Letter of Intent Preview'
    if (letterFile.value) {
      previewSrc.value = letterPreviewUrl.value
      previewType.value = letterFile.value.type.includes('pdf') ? 'pdf' : (letterFile.value.type.includes('text') ? 'text' : 'image')
    } else if (existingApplication.value?.loiUrl) {
      previewSrc.value = existingApplication.value.loiUrl
      previewType.value = existingApplication.value.loiUrl.endsWith('.pdf') ? 'pdf' : 'image'
    }
    showPreviewModal.value = true
  } else if (docType === 'id') {
    previewTitle.value = 'Valid Government ID Preview'
    if (idFile.value) {
      previewSrc.value = idPreviewUrl.value
      previewType.value = idFile.value.type.includes('pdf') ? 'pdf' : 'image'
    } else if (existingApplication.value?.validIdUrl) {
      previewSrc.value = existingApplication.value.validIdUrl
      previewType.value = existingApplication.value.validIdUrl.endsWith('.pdf') ? 'pdf' : 'image'
    }
    showPreviewModal.value = true
  }
}

// =========================
// SAVE DRAFT
// =========================
async function saveDraft() {
  try {
    const draftData = {
      firstName: firstName.value,
      middleName: middleName.value,
      lastName: lastName.value,
      civilStatus: civilStatus.value,
      dateOfBirth: dateOfBirth.value,
      gender: gender.value,
      emergencyContactPerson: emergencyContactPerson.value,
      emergencyContactNumber: emergencyContactNumber.value,
      contact: contact.value,
      email: email.value,
      address: address.value,
      validIdType: validIdType.value,
      validIdNo: validIdNo.value,
      businessName: businessName.value,
      businessType: businessType.value,
      natureOfBusiness: natureOfBusiness.value,
      otherNature: otherNature.value,
      commodities: commodities.value,
      stallSpaceType: stallSpaceType.value,
      estimatedEmployees: estimatedEmployees.value,
      preferredZone: preferredZone.value,
      requestedSize: requestedSize.value,
      selectedStallId: selectedStallId.value,
      businessDescription: businessDescription.value,
      loiContent: loiContent.value,
      incumbentMayor: incumbentMayor.value,
      // Unified Business Permit fields
      applicationType: applicationType.value,
      paymentMode: paymentMode.value,
      orgType: orgType.value,
      orgGender: orgGender.value,
      dtiSecCdaRegNo: dtiSecCdaRegNo.value,
      tinNo: tinNo.value,
      tradeNameFranchise: tradeNameFranchise.value,
      mainHouseBldgNo: mainHouseBldgNo.value,
      mainBldgName: mainBldgName.value,
      mainLotNo: mainLotNo.value,
      mainBlockNo: mainBlockNo.value,
      mainStreet: mainStreet.value,
      mainSubdivision: mainSubdivision.value,
      mainBarangay: mainBarangay.value,
      mainDistrict: mainDistrict.value,
      mainMunicipality: mainMunicipality.value,
      mainProvince: mainProvince.value,
      mainZipCode: mainZipCode.value,
      ownerSurname: ownerSurname.value,
      ownerGivenName: ownerGivenName.value,
      ownerMiddleName: ownerMiddleName.value,
      ownerSuffix: ownerSuffix.value,
      corpPresidentSurname: corpPresidentSurname.value,
      corpPresidentGivenName: corpPresidentGivenName.value,
      corpPresidentMiddleName: corpPresidentMiddleName.value,
      corpPresidentSuffix: corpPresidentSuffix.value,
      corpCitizenship: corpCitizenship.value,
      businessAreaSqm: businessAreaSqm.value,
      totalFloorAreaSqm: totalFloorAreaSqm.value,
      numEmployeesMale: numEmployeesMale.value,
      numEmployeesFemale: numEmployeesFemale.value,
      numEmployeesLguResiding: numEmployeesLguResiding.value,
      deliveryVehiclesVanTruck: deliveryVehiclesVanTruck.value,
      deliveryVehiclesMotorcycle: deliveryVehiclesMotorcycle.value,
      locSameAsMain: locSameAsMain.value,
      locHouseBldgNo: locHouseBldgNo.value,
      locBldgName: locBldgName.value,
      locLotNo: locLotNo.value,
      locBlockNo: locBlockNo.value,
      locStreet: locStreet.value,
      locSubdivision: locSubdivision.value,
      locBarangay: locBarangay.value,
      locDistrict: locDistrict.value,
      locMunicipality: locMunicipality.value,
      locProvince: locProvince.value,
      locZipCode: locZipCode.value,
      propertyOwned: propertyOwned.value,
      taxDecNo: taxDecNo.value,
      propertyIdNo: propertyIdNo.value,
      taxIncentivesEnjoyed: taxIncentivesEnjoyed.value,
      businessActivity: businessActivity.value,
      businessActivityOther: businessActivityOther.value,
      businessLines: businessLines.value,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem('stakeholder_application_draft', JSON.stringify(draftData))
    await systemMessage.alert('Your application details have been saved as a draft. You can continue anytime.', {
      title: 'Draft Saved',
      severity: 'info'
    })
  } catch (err) {
    errorMessage.value = 'Could not save draft locally.'
  }
}

function handleCancel() {
  if (businessName.value || firstName.value) {
    if (confirm('Are you sure you want to exit the application? Any unsaved changes may be lost.')) {
      router.push('/stakeholder')
    }
  } else {
    router.push('/stakeholder')
  }
}

// =========================
// SUBMIT APPLICATION (STEP 3 -> STEP 4)
// =========================
async function executeSubmission() {
  showConfirmModal.value = false
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    let currentUserId = authStore.resolvedUserId || localStorage.getItem('userId')
    if (!currentUserId || currentUserId === 'null' || currentUserId === 'undefined') {
      const { data: { session } } = await supabase.auth.getSession()
      currentUserId = session?.user?.id
    }

    if (!currentUserId) {
      throw new Error('Please sign in or create an account before submitting.')
    }

    localStorage.setItem('userId', currentUserId)

    const formData = new FormData()
    formData.append('userId', currentUserId)
    formData.append('firstName', firstName.value)
    formData.append('middleName', middleName.value)
    formData.append('lastName', lastName.value)
    formData.append('civilStatus', civilStatus.value)
    formData.append('dateOfBirth', dateOfBirth.value)
    formData.append('gender', gender.value)
    formData.append('contact', mobileNo.value || contact.value)
    formData.append('email', email.value)
    formData.append('address', address.value)
    formData.append('emergencyContactPerson', emergencyContactPerson.value)
    formData.append('emergencyContactNumber', emergencyContactNumber.value)
    formData.append('stallId', String(selectedStallId.value))
    formData.append('stallNumberCode', stallNumberCode.value)
    formData.append('stallMarketSection', stallMarketSection.value)
    formData.append('stallFloorArea', stallFloorArea.value)
    formData.append('baseMonthlyRentalRate', String(chosenStallInfo.value?.monthlyRent || 0))
    formData.append('trackingNumber', submittedAppNumber.value || '')

    // Unified Business Permit Form additions (Images 1-4)
    formData.append('applicationType', applicationType.value)
    formData.append('paymentMode', paymentMode.value)
    formData.append('orgType', orgType.value)
    formData.append('orgGender', gender.value || orgGender.value)
    formData.append('dtiSecCdaRegNo', dtiSecCdaRegNo.value)
    formData.append('tinNo', tinNo.value)
    formData.append('tradeNameFranchise', tradeNameFranchise.value || businessName.value)
    formData.append('mainHouseBldgNo', mainHouseBldgNo.value)
    formData.append('mainBldgName', mainBldgName.value)
    formData.append('mainLotNo', mainLotNo.value)
    formData.append('mainBlockNo', mainBlockNo.value)
    formData.append('mainStreet', mainStreet.value)
    formData.append('mainSubdivision', mainSubdivision.value)
    formData.append('mainBarangay', mainBarangay.value)
    formData.append('mainDistrict', mainDistrict.value)
    formData.append('mainMunicipality', mainMunicipality.value)
    formData.append('mainProvince', mainProvince.value)
    formData.append('mainZipCode', mainZipCode.value)
    formData.append('telephoneNo', telephoneNo.value)
    formData.append('mobileNo', mobileNo.value || contact.value)
    formData.append('ownerSurname', ownerSurname.value || lastName.value)
    formData.append('ownerGivenName', ownerGivenName.value || firstName.value)
    formData.append('ownerMiddleName', ownerMiddleName.value || middleName.value)
    formData.append('ownerSuffix', ownerSuffix.value)
    formData.append('corpPresidentSurname', corpPresidentSurname.value)
    formData.append('corpPresidentGivenName', corpPresidentGivenName.value)
    formData.append('corpPresidentMiddleName', corpPresidentMiddleName.value)
    formData.append('corpPresidentSuffix', corpPresidentSuffix.value)
    formData.append('corpCitizenship', corpCitizenship.value)
    formData.append('businessAreaSqm', String(businessAreaSqm.value))
    formData.append('totalFloorAreaSqm', String(totalFloorAreaSqm.value))
    formData.append('numEmployeesMale', String(numEmployeesMale.value))
    formData.append('numEmployeesFemale', String(numEmployeesFemale.value))
    formData.append('numEmployeesLguResiding', String(numEmployeesLguResiding.value))
    formData.append('deliveryVehiclesVanTruck', String(deliveryVehiclesVanTruck.value))
    formData.append('deliveryVehiclesMotorcycle', String(deliveryVehiclesMotorcycle.value))
    formData.append('locSameAsMain', String(locSameAsMain.value))
    formData.append('locHouseBldgNo', locSameAsMain.value ? mainHouseBldgNo.value : locHouseBldgNo.value)
    formData.append('locBldgName', locSameAsMain.value ? mainBldgName.value : locBldgName.value)
    formData.append('locLotNo', locSameAsMain.value ? mainLotNo.value : locLotNo.value)
    formData.append('locBlockNo', locSameAsMain.value ? mainBlockNo.value : locBlockNo.value)
    formData.append('locStreet', locSameAsMain.value ? mainStreet.value : locStreet.value)
    formData.append('locSubdivision', locSameAsMain.value ? mainSubdivision.value : locSubdivision.value)
    formData.append('locBarangay', locSameAsMain.value ? mainBarangay.value : locBarangay.value)
    formData.append('locDistrict', locSameAsMain.value ? mainDistrict.value : locDistrict.value)
    formData.append('locMunicipality', locSameAsMain.value ? mainMunicipality.value : locMunicipality.value)
    formData.append('locProvince', locSameAsMain.value ? mainProvince.value : locProvince.value)
    formData.append('locZipCode', locSameAsMain.value ? mainZipCode.value : locZipCode.value)
    formData.append('propertyOwned', String(propertyOwned.value))
    formData.append('taxDecNo', taxDecNo.value)
    formData.append('propertyIdNo', propertyIdNo.value)
    formData.append('taxIncentivesEnjoyed', String(taxIncentivesEnjoyed.value))
    formData.append('businessActivity', businessActivity.value)
    formData.append('businessActivityOther', businessActivityOther.value)
    formData.append('businessLines', JSON.stringify(businessLines.value))

    // Market Lease additions
    formData.append('validIdType', validIdType.value)
    formData.append('validIdNo', validIdNo.value)
    formData.append('natureOfBusiness', JSON.stringify(natureOfBusiness.value))
    formData.append('otherNature', otherNature.value)
    formData.append('commodities', commodities.value)
    formData.append('stallSpaceType', stallSpaceType.value)
    formData.append('estimatedEmployees', String(estimatedEmployees.value))
    formData.append('undertakingAgreed', String(undertakingAgreed.value))
    if (!loiContent.value) {
      loiContent.value = generateCompiledLoiText()
    }
    formData.append('loiContent', loiContent.value)
    formData.append('incumbentMayor', incumbentMayor.value)

    if (preferredZone.value) formData.append('preferredZone', preferredZone.value)
    if (requestedSize.value) formData.append('requestedSize', requestedSize.value)
    if (businessDescription.value) formData.append('businessDescription', businessDescription.value)

    if (idFile.value) formData.append('idFile', idFile.value)
    if (letterFile.value) {
      formData.append('letterFile', letterFile.value)
    } else if (loiContent.value) {
      const virtualLoiBlob = new Blob([loiContent.value], { type: 'text/plain;charset=utf-8' })
      const virtualLoi = new File([virtualLoiBlob], `Letter_of_Intent_${(lastName.value || 'Applicant').replace(/\s+/g, '_')}.txt`, { type: 'text/plain' })
      formData.append('letterFile', virtualLoi)
    }

    const response = await api.post(
      '/applications',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    if (!response.data?.id && !response.data?.user_id) {
      throw new Error('Application could not be saved. Please try again.')
    }

    // Set submitted metadata
    submittedAppNumber.value = response.data?.applicationNo || (response.data?.id ? `APP-${String(response.data.id).padStart(3, '0')}` : '')
    submittedDate.value = new Date()

    // Sync real application email to user_profiles if applicant is signed in with a valid UUID
    if (currentUserId && isUuid(currentUserId) && email.value && !email.value.endsWith('@manticao.market')) {
      try {
        await supabase
          .from('user_profiles')
          .update({ email: email.value.trim() })
          .eq('id', currentUserId)
      } catch (profErr) {
        console.warn('[BusinessApplication] user_profiles email sync notice:', profErr?.message)
      }
    }

    // Clear local draft
    localStorage.removeItem('stakeholder_application_draft')
    localStorage.removeItem('preferred_stall_id')
    localStorage.removeItem('preferred_stall_no')
    stakeholderStore.clearCache()

    // Switch to Step 4: Submitted Success
    currentStep.value = 4
    window.scrollTo({ top: 0, behavior: 'smooth' })
    await router.replace({ name: 'ApplicationProgress' })

  } catch (error) {
    console.error('[BusinessApplication] Submission error:', error)
    errorMessage.value = error.message || 'Application submission failed. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

// =========================
// INIT / MOUNTED
// =========================
onMounted(async () => {
  try {
    // 1. Fetch available stalls
    try {
      const rawStalls = await fetchStalls()
      stallsList.value = (rawStalls || []).map(s => ({
        id: s.id,
        stallNo: s.stall_no || s.stallNo || s.number,
        stallType: s.stall_type || s.stallType || s.info || 'Standard Stall',
        monthlyRent: Number(s.monthly_rent ?? s.monthlyRent ?? 0),
        status: String(s.status || '').toUpperCase()
      }))
    } catch (stErr) {
      console.warn('[BusinessApplication] Stalls loading notice:', stErr)
    }

    // 2. Query param or localStorage stall preselection
    const qStallId = route.query.stall_id || route.query.stallId
    if (qStallId) {
      selectedStallId.value = Number(qStallId)
    } else {
      const storedStallId = localStorage.getItem('preferred_stall_id')
      if (storedStallId && !isNaN(Number(storedStallId))) {
        selectedStallId.value = Number(storedStallId)
      }
    }

    // 3. User & existing application retrieval
    let currentUserId = authStore.resolvedUserId || localStorage.getItem('userId')
    if (!currentUserId || currentUserId === 'null' || currentUserId === 'undefined') {
      const { data: { session } } = await supabase.auth.getSession()
      currentUserId = session?.user?.id
    }

    if (currentUserId) {
      const existing = await getStakeholderByUserId(currentUserId)
      if (existing) {
        existingApplication.value = existing
        if (existing.firstName) firstName.value = existing.firstName
        if (existing.middleName) middleName.value = existing.middleName
        if (existing.lastName) lastName.value = existing.lastName
        if (existing.contact) contact.value = existing.contact
        if (existing.email && !existing.email.endsWith('@manticao.market')) email.value = existing.email
        if (existing.address) address.value = existing.address
        if (existing.validIdType) validIdType.value = existing.validIdType
        if (existing.validIdNo) validIdNo.value = existing.validIdNo
        if (existing.businessName) businessName.value = existing.businessName
        if (existing.businessType) businessType.value = existing.businessType
        if (existing.natureOfBusiness) {
          try {
            natureOfBusiness.value = Array.isArray(existing.natureOfBusiness)
              ? existing.natureOfBusiness
              : JSON.parse(existing.natureOfBusiness)
          } catch (_) {
            natureOfBusiness.value = [existing.natureOfBusiness]
          }
        }
        if (existing.otherNatureOfBusiness) otherNature.value = existing.otherNatureOfBusiness
        if (existing.productsCommodities) commodities.value = existing.productsCommodities
        if (existing.stallSpaceType) stallSpaceType.value = existing.stallSpaceType
        if (existing.estimatedEmployees) estimatedEmployees.value = existing.estimatedEmployees
        if (existing.loiContent) loiContent.value = existing.loiContent
        if (existing.incumbentMayor || existing.incumbent_mayor) {
          incumbentMayor.value = existing.incumbentMayor || existing.incumbent_mayor
        }
        if (existing.selectedStallId && !selectedStallId.value) {
          selectedStallId.value = Number(existing.selectedStallId)
        }
        // Unified Business Permit restorations
        if (existing.applicationType) applicationType.value = existing.applicationType
        if (existing.paymentMode) paymentMode.value = existing.paymentMode
        if (existing.orgType) orgType.value = existing.orgType
        if (existing.orgGender) orgGender.value = existing.orgGender
        if (existing.dtiSecCdaRegNo) dtiSecCdaRegNo.value = existing.dtiSecCdaRegNo
        if (existing.tinNo) tinNo.value = existing.tinNo
        if (existing.tradeNameFranchise) tradeNameFranchise.value = existing.tradeNameFranchise
        if (existing.mainHouseBldgNo) mainHouseBldgNo.value = existing.mainHouseBldgNo
        if (existing.mainBldgName) mainBldgName.value = existing.mainBldgName
        if (existing.mainLotNo) mainLotNo.value = existing.mainLotNo
        if (existing.mainBlockNo) mainBlockNo.value = existing.mainBlockNo
        if (existing.mainStreet) mainStreet.value = existing.mainStreet
        if (existing.mainSubdivision) mainSubdivision.value = existing.mainSubdivision
        if (existing.mainBarangay) mainBarangay.value = existing.mainBarangay
        if (existing.mainDistrict) mainDistrict.value = existing.mainDistrict
        if (existing.mainMunicipality) mainMunicipality.value = existing.mainMunicipality
        if (existing.mainProvince) mainProvince.value = existing.mainProvince
        if (existing.mainZipCode) mainZipCode.value = existing.mainZipCode
        if (existing.ownerSurname) ownerSurname.value = existing.ownerSurname
        if (existing.ownerGivenName) ownerGivenName.value = existing.ownerGivenName
        if (existing.ownerMiddleName) ownerMiddleName.value = existing.ownerMiddleName
        if (existing.ownerSuffix) ownerSuffix.value = existing.ownerSuffix
        if (existing.corpPresidentSurname) corpPresidentSurname.value = existing.corpPresidentSurname
        if (existing.corpPresidentGivenName) corpPresidentGivenName.value = existing.corpPresidentGivenName
        if (existing.corpPresidentMiddleName) corpPresidentMiddleName.value = existing.corpPresidentMiddleName
        if (existing.corpPresidentSuffix) corpPresidentSuffix.value = existing.corpPresidentSuffix
        if (existing.corpCitizenship) corpCitizenship.value = existing.corpCitizenship
        if (existing.businessAreaSqm != null) businessAreaSqm.value = Number(existing.businessAreaSqm)
        if (existing.totalFloorAreaSqm != null) totalFloorAreaSqm.value = Number(existing.totalFloorAreaSqm)
        if (existing.numEmployeesMale != null) numEmployeesMale.value = Number(existing.numEmployeesMale)
        if (existing.numEmployeesFemale != null) numEmployeesFemale.value = Number(existing.numEmployeesFemale)
        if (existing.numEmployeesLguResiding != null) numEmployeesLguResiding.value = Number(existing.numEmployeesLguResiding)
        if (existing.deliveryVehiclesVanTruck != null) deliveryVehiclesVanTruck.value = Number(existing.deliveryVehiclesVanTruck)
        if (existing.deliveryVehiclesMotorcycle != null) deliveryVehiclesMotorcycle.value = Number(existing.deliveryVehiclesMotorcycle)
        if (existing.propertyOwned !== undefined) propertyOwned.value = !!existing.propertyOwned
        if (existing.taxDecNo) taxDecNo.value = existing.taxDecNo
        if (existing.propertyIdNo) propertyIdNo.value = existing.propertyIdNo
        if (existing.taxIncentivesEnjoyed !== undefined) taxIncentivesEnjoyed.value = !!existing.taxIncentivesEnjoyed
        if (existing.businessActivity) businessActivity.value = existing.businessActivity
        if (existing.businessLines) {
          try {
            businessLines.value = Array.isArray(existing.businessLines) ? existing.businessLines : JSON.parse(existing.businessLines)
          } catch (_) {}
        }
      }
    }

    // 4. Restore local draft if available and form is empty
    if (!existingApplication.value && !businessName.value) {
      try {
        const rawDraft = localStorage.getItem('stakeholder_application_draft')
        if (rawDraft) {
          const draft = JSON.parse(rawDraft)
          if (draft.firstName) firstName.value = draft.firstName
          if (draft.middleName) middleName.value = draft.middleName
          if (draft.lastName) lastName.value = draft.lastName
          if (draft.contact) contact.value = draft.contact
          if (draft.email && !draft.email.endsWith('@manticao.market')) email.value = draft.email
          if (draft.address) address.value = draft.address
          if (draft.validIdType) validIdType.value = draft.validIdType
          if (draft.validIdNo) validIdNo.value = draft.validIdNo
          if (draft.businessName) businessName.value = draft.businessName
          if (draft.businessType) businessType.value = draft.businessType
          if (draft.natureOfBusiness) natureOfBusiness.value = draft.natureOfBusiness
          if (draft.otherNature) otherNature.value = draft.otherNature
          if (draft.commodities) commodities.value = draft.commodities
          if (draft.stallSpaceType) stallSpaceType.value = draft.stallSpaceType
          if (draft.estimatedEmployees) estimatedEmployees.value = draft.estimatedEmployees
          if (draft.preferredZone) preferredZone.value = draft.preferredZone
          if (draft.requestedSize) requestedSize.value = draft.requestedSize
          if (draft.selectedStallId && !selectedStallId.value) selectedStallId.value = draft.selectedStallId
          if (draft.businessDescription) businessDescription.value = draft.businessDescription
          if (draft.loiContent) loiContent.value = draft.loiContent
          if (draft.incumbentMayor) incumbentMayor.value = draft.incumbentMayor
          // Unified Business Permit restorations from draft
          if (draft.applicationType) applicationType.value = draft.applicationType
          if (draft.paymentMode) paymentMode.value = draft.paymentMode
          if (draft.orgType) orgType.value = draft.orgType
          if (draft.orgGender) orgGender.value = draft.orgGender
          if (draft.dtiSecCdaRegNo) dtiSecCdaRegNo.value = draft.dtiSecCdaRegNo
          if (draft.tinNo) tinNo.value = draft.tinNo
          if (draft.tradeNameFranchise) tradeNameFranchise.value = draft.tradeNameFranchise
          if (draft.mainHouseBldgNo) mainHouseBldgNo.value = draft.mainHouseBldgNo
          if (draft.mainBldgName) mainBldgName.value = draft.mainBldgName
          if (draft.mainLotNo) mainLotNo.value = draft.mainLotNo
          if (draft.mainBlockNo) mainBlockNo.value = draft.mainBlockNo
          if (draft.mainStreet) mainStreet.value = draft.mainStreet
          if (draft.mainSubdivision) mainSubdivision.value = draft.mainSubdivision
          if (draft.mainBarangay) mainBarangay.value = draft.mainBarangay
          if (draft.mainDistrict) mainDistrict.value = draft.mainDistrict
          if (draft.mainMunicipality) mainMunicipality.value = draft.mainMunicipality
          if (draft.mainProvince) mainProvince.value = draft.mainProvince
          if (draft.mainZipCode) mainZipCode.value = draft.mainZipCode
          if (draft.ownerSurname) ownerSurname.value = draft.ownerSurname
          if (draft.ownerGivenName) ownerGivenName.value = draft.ownerGivenName
          if (draft.ownerMiddleName) ownerMiddleName.value = draft.ownerMiddleName
          if (draft.ownerSuffix) ownerSuffix.value = draft.ownerSuffix
          if (draft.businessAreaSqm != null) businessAreaSqm.value = Number(draft.businessAreaSqm)
          if (draft.totalFloorAreaSqm != null) totalFloorAreaSqm.value = Number(draft.totalFloorAreaSqm)
          if (draft.numEmployeesFemale != null) numEmployeesFemale.value = Number(draft.numEmployeesFemale)
          if (draft.numEmployeesLguResiding != null) numEmployeesLguResiding.value = Number(draft.numEmployeesLguResiding)
          if (draft.propertyOwned !== undefined) propertyOwned.value = !!draft.propertyOwned
          if (draft.taxIncentivesEnjoyed !== undefined) taxIncentivesEnjoyed.value = !!draft.taxIncentivesEnjoyed
          if (draft.businessLines) businessLines.value = draft.businessLines
        }
      } catch (_) {}
    }

  } catch (err) {
    console.warn('[BusinessApplication] Init warning:', err.message)
  }
})

async function logout() {
  await authStore.clearSession()
  localStorage.removeItem('currentStakeholder')
  localStorage.removeItem('stakeholderId')
  router.push('/login')
}
</script>

<style scoped src="../styles/views/BusinessApplication.css"></style>
