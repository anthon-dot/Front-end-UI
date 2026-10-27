<template>
  <div v-if="visible" class="form-modal-backdrop" @click.self="$emit('close')">
    <div class="form-modal-shell">
      <!-- Modal Action Header (Screen only) -->
      <div class="modal-control-bar no-print">
        <div class="control-left">
          <div class="doc-pill">
            <i class="pi pi-file-check"></i>
            <span>Official LGU Form &bull; 2 Pages</span>
          </div>
          <h2 class="modal-title">Unified Application Form for Business Permit</h2>
          <span class="tracking-tag">Tracking: {{ formData.trackingNumber || formData.applicationNo || 'BP-2026-0782' }}</span>
        </div>

        <div class="control-right">
          <button type="button" class="btn-word" @click="handleExportWord" title="Export as Microsoft Word Document (.doc)">
            <i class="pi pi-file-word"></i>
            <span>Export Word (.doc)</span>
          </button>
          <button type="button" class="btn-pdf" @click="handleExportPdf" title="Export as PDF Document">
            <i class="pi pi-file-pdf"></i>
            <span>Export PDF</span>
          </button>
          <button type="button" class="btn-print" @click="handlePrint">
            <i class="pi pi-print"></i>
            <span>Print Official Form</span>
          </button>
          <button type="button" class="btn-close-modal" @click="$emit('close')">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <!-- Scrollable Printable Document Pages -->
      <div class="printable-document-container" id="printable-business-permit-doc">
        <!-- ==========================================
             PAGE 1: BUSINESS REGISTRATION & OPERATION
             ========================================== -->
        <div class="permit-page page-1">
          <!-- Top Header Strip -->
          <div class="permit-header">
            <div class="header-logo-left">
              <div class="official-seal-badge manticao-seal-badge">
                <svg viewBox="0 0 100 100" class="seal-svg" aria-label="Municipality of Manticao Official Seal">
                  <circle cx="50" cy="50" r="46" fill="#0284c7" stroke="#0369a1" stroke-width="3" />
                  <circle cx="50" cy="50" r="38" fill="#ffffff" stroke="#f59e0b" stroke-width="2" />
                  <path d="M50 16 L54 28 L66 28 L56 36 L60 48 L50 40 L40 48 L44 36 L34 28 L46 28 Z" fill="#f59e0b" />
                  <circle cx="50" cy="50" r="18" fill="#0284c7" />
                  <text x="50" y="54" font-size="9" font-weight="900" text-anchor="middle" fill="#ffffff" font-family="sans-serif">MANTICAO</text>
                  <text x="50" y="82" font-size="6.5" font-weight="700" text-anchor="middle" fill="#0f172a" font-family="sans-serif">MISAMIS ORIENTAL</text>
                </svg>
              </div>
            </div>

            <div class="header-text-center">
              <div class="republic-text">Republic of the Philippines</div>
              <div class="province-text">Province of Misamis Oriental</div>
              <div class="municipality-text">MUNICIPALITY OF MANTICAO</div>
              <div class="office-sub">BUSINESS PERMITS &amp; LICENSING OFFICE (BPLO)</div>
              <h1 class="main-form-title">UNIFIED APPLICATION FORM FOR BUSINESS PERMIT</h1>
            </div>

            <div class="header-logo-right">
              <div class="official-seal-badge bagong-pilipinas-badge">
                <svg viewBox="0 0 100 100" class="seal-svg" aria-label="Bagong Pilipinas Seal">
                  <circle cx="50" cy="50" r="46" fill="#b91c1c" stroke="#991b1b" stroke-width="3" />
                  <circle cx="50" cy="50" r="38" fill="#ffffff" stroke="#eab308" stroke-width="2" />
                  <circle cx="50" cy="46" r="14" fill="#1e3a8a" />
                  <polygon points="50,34 53,42 61,42 55,47 57,55 50,50 43,55 45,47 39,42 47,42" fill="#eab308" />
                  <text x="50" y="78" font-size="7" font-weight="900" text-anchor="middle" fill="#1e3a8a" font-family="sans-serif">BAGONG</text>
                  <text x="50" y="86" font-size="6.5" font-weight="900" text-anchor="middle" fill="#b91c1c" font-family="sans-serif">PILIPINAS</text>
                </svg>
              </div>
            </div>
          </div>

          <!-- Application Type & Payment Mode Bar -->
          <div class="permit-type-grid">
            <div class="type-col">
              <div class="type-check-item">
                <span class="box-check">{{ isType('NEW') ? '✓' : '' }}</span>
                <label>NEW</label>
              </div>
              <div class="type-check-item">
                <span class="box-check">{{ isType('RENEWAL') ? '✓' : '' }}</span>
                <label>RENEWAL</label>
              </div>
              <div class="type-check-item">
                <span class="box-check">{{ isType('ADDITIONAL') ? '✓' : '' }}</span>
                <label>ADDITIONAL</label>
              </div>
            </div>

            <div class="payment-mode-col">
              <div class="payment-title">Payment Mode:</div>
              <div class="payment-modes-list">
                <div class="type-check-item">
                  <span class="box-check">{{ isPayMode('Annually') ? '✓' : '' }}</span>
                  <label>Annually</label>
                </div>
                <div class="type-check-item">
                  <span class="box-check">{{ isPayMode('Bi-Annually') ? '✓' : '' }}</span>
                  <label>Bi-Annually</label>
                </div>
                <div class="type-check-item">
                  <span class="box-check">{{ isPayMode('Quarterly') ? '✓' : '' }}</span>
                  <label>Quarterly</label>
                </div>
              </div>
            </div>

            <div class="tracking-meta-col">
              <div class="meta-row">
                <span class="lbl">Date of Receipt:</span>
                <span class="val">{{ formatDate(formData.dateOfReceipt || formData.submittedAt || new Date()) }}</span>
              </div>
              <div class="meta-row">
                <span class="lbl">Tracking Number:</span>
                <span class="val font-mono">{{ formData.trackingNumber || formData.applicationNo || 'BP-2026-0782' }}</span>
              </div>
              <div class="meta-row">
                <span class="lbl">Business ID Number:</span>
                <span class="val font-mono">{{ formData.businessIdNumber || 'BIN-9024-0041' }}</span>
              </div>
            </div>
          </div>

          <!-- SECTION A: BUSINESS INFORMATION AND REGISTRATION -->
          <div class="section-box">
            <div class="section-banner">
              <strong>A. BUSINESS INFORMATION AND REGISTRATION</strong>
            </div>

            <div class="sec-row org-type-row">
              <span class="inline-lbl">Please choose one:</span>
              <div class="org-options-wrap">
                <div class="type-check-item">
                  <span class="box-check">{{ isOrg('Sole Proprietor') ? '✓' : '' }}</span>
                  <label>Sole Proprietor</label>
                  <span class="gender-sub">
                    [ {{ isGender('Male') ? '✓' : ' ' }} ] Male &nbsp;
                    [ {{ isGender('Female') ? '✓' : ' ' }} ] Female
                  </span>
                </div>
                <div class="type-check-item">
                  <span class="box-check">{{ isOrg('One Person Corporation') ? '✓' : '' }}</span>
                  <label>One Person Corporation</label>
                </div>
                <div class="type-check-item">
                  <span class="box-check">{{ isOrg('Partnership') ? '✓' : '' }}</span>
                  <label>Partnership</label>
                </div>
                <div class="type-check-item">
                  <span class="box-check">{{ isOrg('Corporation') ? '✓' : '' }}</span>
                  <label>Corporation</label>
                  <span class="gender-sub">
                    [ {{ isCorpFilipino ? '✓' : ' ' }} ] Filipino &nbsp;
                    [ {{ !isCorpFilipino ? '✓' : ' ' }} ] Foreign
                  </span>
                </div>
                <div class="type-check-item">
                  <span class="box-check">{{ isOrg('Cooperative') ? '✓' : '' }}</span>
                  <label>Cooperative</label>
                </div>
              </div>
            </div>

            <div class="sec-grid two-cols">
              <div class="data-field">
                <span class="f-lbl">DTI / CDA / SEC Registration:</span>
                <span class="f-val">{{ formData.dtiSecCdaRegNo || 'DTI-REG-2026-9024' }}</span>
              </div>
              <div class="data-field">
                <span class="f-lbl">Tax Identification Number (TIN):</span>
                <span class="f-val">{{ formData.tinNo || '432-890-123-000' }}</span>
              </div>
            </div>

            <div class="data-field single-line">
              <span class="f-lbl">Trade Name / Franchise (if applicable):</span>
              <span class="f-val font-bold">{{ formData.tradeNameFranchise || formData.businessName || 'ABUHAN FISH VENDOR STALL' }}</span>
            </div>

            <!-- Main Office Address -->
            <div class="address-sub-block">
              <div class="sub-block-title">Main Office Address:</div>
              <div class="addr-grid">
                <div class="a-cell"><span class="a-lbl">House/Bldg No.:</span> <span class="a-val">{{ formData.mainHouseBldgNo || '' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Name of Bldg.:</span> <span class="a-val">{{ formData.mainBldgName || '' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Lot No.:</span> <span class="a-val">{{ formData.mainLotNo || '' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Block No.:</span> <span class="a-val">{{ formData.mainBlockNo || '' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Street:</span> <span class="a-val font-bold">{{ formData.mainStreet || 'P-4' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Subdivision:</span> <span class="a-val">{{ formData.mainSubdivision || '' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Barangay:</span> <span class="a-val font-bold">{{ formData.mainBarangay || 'POBLACION' }}</span></div>
                <div class="a-cell"><span class="a-lbl">District:</span> <span class="a-val">{{ formData.mainDistrict || '' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Municipality:</span> <span class="a-val font-bold">{{ formData.mainMunicipality || 'MANTICAO' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Province:</span> <span class="a-val font-bold">{{ formData.mainProvince || 'MISAMIS OR.' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Zip Code:</span> <span class="a-val font-bold">{{ formData.mainZipCode || '9024' }}</span></div>
              </div>
            </div>

            <!-- Contact Coordinates -->
            <div class="sec-grid three-cols">
              <div class="data-field">
                <span class="f-lbl">Telephone No.:</span>
                <span class="f-val">{{ formData.telephoneNo || '' }}</span>
              </div>
              <div class="data-field">
                <span class="f-lbl">Mobile No.:</span>
                <span class="f-val font-bold">{{ formData.mobileNo || formData.contact || '09932889970' }}</span>
              </div>
              <div class="data-field">
                <span class="f-lbl">E-mail Address:</span>
                <span class="f-val">{{ formData.email || 'risma.abuhan@gmail.com' }}</span>
              </div>
            </div>

            <!-- Sole Proprietorship Owner -->
            <div class="owner-names-block">
              <div class="sub-block-title">(For Sole Proprietorship) Name of Owner:</div>
              <div class="names-grid">
                <div class="name-cell">
                  <span class="name-lbl">Surname</span>
                  <span class="name-val">{{ ownerSurname }}</span>
                </div>
                <div class="name-cell">
                  <span class="name-lbl">Given Name</span>
                  <span class="name-val">{{ ownerGivenName }}</span>
                </div>
                <div class="name-cell">
                  <span class="name-lbl">Middle Name</span>
                  <span class="name-val">{{ ownerMiddleName }}</span>
                </div>
                <div class="name-cell suffix-cell">
                  <span class="name-lbl">Suffix</span>
                  <span class="name-val">{{ formData.ownerSuffix || '' }}</span>
                </div>
              </div>
            </div>

            <!-- Corporate Officer (if applicable) -->
            <div class="owner-names-block corp-block">
              <div class="sub-block-title">(For Corporations / Cooperative / Partnerships) Name of President / Officer in Charge:</div>
              <div class="names-grid">
                <div class="name-cell">
                  <span class="name-lbl">Surname</span>
                  <span class="name-val">{{ formData.corpPresidentSurname || '' }}</span>
                </div>
                <div class="name-cell">
                  <span class="name-lbl">Given Name</span>
                  <span class="name-val">{{ formData.corpPresidentGivenName || '' }}</span>
                </div>
                <div class="name-cell">
                  <span class="name-lbl">Middle Name</span>
                  <span class="name-val">{{ formData.corpPresidentMiddleName || '' }}</span>
                </div>
                <div class="name-cell suffix-cell">
                  <span class="name-lbl">Suffix</span>
                  <span class="name-val">{{ formData.corpPresidentSuffix || '' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION B: BUSINESS OPERATION -->
          <div class="section-box">
            <div class="section-banner">
              <strong>B. BUSINESS OPERATION</strong>
            </div>

            <div class="operation-stats-strip">
              <div class="stat-cell">
                <span class="stat-lbl">Business Area (in sq.m.):</span>
                <span class="stat-val font-bold">{{ formData.businessAreaSqm || '9.00' }}</span>
              </div>
              <div class="stat-cell">
                <span class="stat-lbl">Total Floor Area in sq.m.:</span>
                <span class="stat-val font-bold">{{ formData.totalFloorAreaSqm || '9.00' }}</span>
              </div>
              <div class="stat-cell">
                <span class="stat-lbl">Total Employees:</span>
                <span class="stat-val">Male: <strong>{{ formData.numEmployeesMale ?? 0 }}</strong> | Female: <strong>{{ formData.numEmployeesFemale ?? 1 }}</strong></span>
              </div>
              <div class="stat-cell">
                <span class="stat-lbl">Employees residing in Manticao:</span>
                <span class="stat-val font-bold">{{ formData.numEmployeesLguResiding ?? 1 }}</span>
              </div>
              <div class="stat-cell">
                <span class="stat-lbl">Delivery Vehicles:</span>
                <span class="stat-val">Van/Truck: <strong>{{ formData.deliveryVehiclesVanTruck ?? 0 }}</strong> | Moto: <strong>{{ formData.deliveryVehiclesMotorcycle ?? 0 }}</strong></span>
              </div>
            </div>

            <!-- Business Location Address -->
            <div class="address-sub-block">
              <div class="location-header-row">
                <span class="sub-block-title">Business Location Address:</span>
                <span class="same-as-main-check">
                  <span class="box-check">{{ (formData.locSameAsMain !== false) ? '✓' : '' }}</span>
                  <label>Same as Main Office Address</label>
                </span>
              </div>
              <div class="addr-grid">
                <div class="a-cell"><span class="a-lbl">House/Bldg No.:</span> <span class="a-val">{{ formData.locHouseBldgNo || formData.mainHouseBldgNo || '' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Name of Bldg.:</span> <span class="a-val">{{ formData.locBldgName || formData.mainBldgName || '' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Lot No.:</span> <span class="a-val">{{ formData.locLotNo || formData.mainLotNo || '' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Block No.:</span> <span class="a-val">{{ formData.locBlockNo || formData.mainBlockNo || '' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Street:</span> <span class="a-val font-bold">{{ formData.locStreet || formData.mainStreet || 'P-4' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Subdivision:</span> <span class="a-val">{{ formData.locSubdivision || '' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Barangay:</span> <span class="a-val font-bold">{{ formData.locBarangay || formData.mainBarangay || 'POBLACION' }}</span></div>
                <div class="a-cell"><span class="a-lbl">District:</span> <span class="a-val">{{ formData.locDistrict || '' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Municipality:</span> <span class="a-val font-bold">{{ formData.locMunicipality || 'MANTICAO' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Province:</span> <span class="a-val font-bold">{{ formData.locProvince || 'MISAMIS OR.' }}</span></div>
                <div class="a-cell"><span class="a-lbl">Zip Code:</span> <span class="a-val font-bold">{{ formData.locZipCode || '9024' }}</span></div>
              </div>
            </div>

            <!-- Ownership & Incentives Row -->
            <div class="sec-grid two-cols ownership-incentives-row">
              <div class="ownership-col">
                <span class="inline-lbl">Owned?:</span>
                <span class="type-check-item">
                  <span class="box-check">{{ isOwned ? '✓' : '' }}</span>
                  <label>Yes</label>
                </span>
                <span class="type-check-item">
                  <span class="box-check">{{ !isOwned ? '✓' : '' }}</span>
                  <label>No</label>
                </span>
                <small class="ownership-hint">(If no, attach copy of Notarized Lease/Stall Contract)</small>
              </div>

              <div class="incentives-col">
                <span class="inline-lbl">Tax incentives from Government?:</span>
                <span class="type-check-item">
                  <span class="box-check">{{ formData.taxIncentivesEnjoyed ? '✓' : '' }}</span>
                  <label>Yes</label>
                </span>
                <span class="type-check-item">
                  <span class="box-check">{{ !formData.taxIncentivesEnjoyed ? '✓' : '' }}</span>
                  <label>No</label>
                </span>
              </div>
            </div>

            <!-- Business Activity -->
            <div class="business-activity-row">
              <span class="inline-lbl">Business Activity:</span>
              <div class="activity-options-wrap">
                <span class="type-check-item"><span class="box-check">{{ isActivity('Main Office') ? '✓' : '' }}</span> Main Office</span>
                <span class="type-check-item"><span class="box-check">{{ isActivity('Branch Office') ? '✓' : '' }}</span> Branch Office</span>
                <span class="type-check-item"><span class="box-check">{{ isActivity('Admin Office Only') ? '✓' : '' }}</span> Admin Office Only</span>
                <span class="type-check-item"><span class="box-check">{{ isActivity('Warehouse') ? '✓' : '' }}</span> Warehouse</span>
                <span class="type-check-item">
                  <span class="box-check">{{ (isActivity('Others') || true) ? '✓' : '' }}</span>
                  Others, Pls. Specify: <strong>{{ formData.businessActivityOther || 'Public Market Stall Retail' }}</strong>
                </span>
              </div>
            </div>

            <!-- Line of Business Table -->
            <div class="lines-table-container">
              <table class="permit-table">
                <thead>
                  <tr>
                    <th style="width: 25%;">Line of Business</th>
                    <th style="width: 12%;">PSIC Code</th>
                    <th style="width: 28%;">Products / Services</th>
                    <th style="width: 8%;">No. of Units</th>
                    <th style="width: 14%;">Capitalization<br /><small>(For New Business)</small></th>
                    <th style="width: 13%;">Last Year's Gross<br /><small>(For Renewal)</small></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(line, idx) in activeBusinessLines" :key="idx">
                    <td class="font-bold">{{ line.lineOfBusiness }}</td>
                    <td class="text-center font-mono">{{ line.psicCode || '47211' }}</td>
                    <td>{{ line.productsServices }}</td>
                    <td class="text-center">{{ line.numUnits || 1 }}</td>
                    <td class="text-right font-bold">₱{{ formatMoney(line.capitalization || 50000) }}</td>
                    <td class="text-right">{{ line.grossSales ? '₱' + formatMoney(line.grossSales) : '-' }}</td>
                  </tr>
                  <tr v-if="activeBusinessLines.length === 0">
                    <td class="font-bold">Fish Vendor / Wet Section Trade</td>
                    <td class="text-center font-mono">47211</td>
                    <td>Fresh Fish and Marine Products</td>
                    <td class="text-center">1</td>
                    <td class="text-right font-bold">₱50,000.00</td>
                    <td class="text-right">-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Statutory Declaration Under Penalty of Perjury -->
            <div class="perjury-declaration-box">
              <p class="perjury-text">
                I DECLARE UNDER PENALTY OF PERJURY that all information in this application are true and correct based on my personal knowledge and authentic records submitted to the Investment Services, Business Permits &amp; License Division. Any false or misleading information supplied, or production of fake/falsified documents shall be grounds for appropriate legal action against me and automatically revokes permit. I hereby agree that all personal (as defined under the Data Privacy Law of 2012 and its Implementing Rules and Regulation) and account transaction information or records with the Municipal Government of Manticao may be processed, profiled or shared to requesting parties for the purpose of any court, legal process, examination, inquiry and audit or investigation of any authority.
              </p>

              <div class="applicant-signature-row">
                <div class="signature-block">
                  <div class="sig-line">
                    <span class="sig-handwritten font-serif">{{ printedOwnerFullName }}</span>
                  </div>
                  <strong class="sig-name">{{ printedOwnerFullName }}</strong>
                  <span class="sig-title">SIGNATURE OF APPLICANT / OWNER OVER PRINTED NAME</span>
                </div>

                <div class="position-block">
                  <div class="sig-line">
                    <span class="sig-handwritten font-serif">{{ formData.applicantTitle || 'OWNER / PROPRIETRESS' }}</span>
                  </div>
                  <strong class="sig-name">{{ formData.applicantTitle || 'OWNER / PROPRIETRESS' }}</strong>
                  <span class="sig-title">DESIGNATION / POSITION / TITLE</span>
                </div>
              </div>
            </div>
          </div>

          <div class="page-footer-note">
            <span>Unified Application Form for Business Permit &bull; Page 1 of 2</span>
            <span>Municipality of Manticao, Misamis Oriental</span>
          </div>
        </div>

        <!-- ==========================================
             PAGE 2: ASSESSMENT OF FEES & CLEARANCES
             ========================================== -->
        <div class="permit-page page-2">
          <!-- Page 2 Header -->
          <div class="page-2-mini-header">
            <span class="mini-lgu-text">MUNICIPALITY OF MANTICAO &bull; BUSINESS PERMITS &amp; LICENSING OFFICE</span>
            <span class="mini-tracking">Tracking No: {{ formData.trackingNumber || formData.applicationNo || 'BP-2026-0782' }}</span>
          </div>

          <!-- SECTION: ASSESSMENT OF FEES AND LOCAL TAXES -->
          <div class="section-box">
            <div class="section-banner">
              <strong>ASSESSMENT OF FEES AND LOCAL TAXES</strong>
            </div>

            <div class="assessment-layout-grid">
              <!-- Left: Fee Breakdown Table -->
              <div class="fees-table-col">
                <table class="permit-table fees-table">
                  <thead>
                    <tr>
                      <th>Assessment of Fees and Local Taxes</th>
                      <th style="width: 32%; text-align: right;">Amount (PHP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Gross Sales Tax (Business Tax)</td>
                      <td class="text-right font-mono">1,080.00</td>
                    </tr>
                    <tr>
                      <td>Penalty / Surcharge</td>
                      <td class="text-right font-mono">210.60</td>
                    </tr>
                    <tr class="sub-header-row">
                      <td colspan="2"><strong>Regulatory Fees and Charges:</strong></td>
                    </tr>
                    <tr>
                      <td class="pl-3">Mayor's Permit Fee</td>
                      <td class="text-right font-mono">500.00</td>
                    </tr>
                    <tr>
                      <td class="pl-3">Mayor's Clearance</td>
                      <td class="text-right font-mono">100.00</td>
                    </tr>
                    <tr>
                      <td class="pl-3">Police Clearance</td>
                      <td class="text-right font-mono">100.00</td>
                    </tr>
                    <tr>
                      <td class="pl-3">Tax Clearance</td>
                      <td class="text-right font-mono">100.00</td>
                    </tr>
                    <tr>
                      <td class="pl-3">Registration Fee</td>
                      <td class="text-right font-mono">100.00</td>
                    </tr>
                    <tr>
                      <td class="pl-3">Sanitary Permit</td>
                      <td class="text-right font-mono">100.00</td>
                    </tr>
                    <tr>
                      <td class="pl-3">Health Certificate</td>
                      <td class="text-right font-mono">100.00</td>
                    </tr>
                    <tr>
                      <td class="pl-3">Garbage Charges</td>
                      <td class="text-right font-mono">600.00</td>
                    </tr>
                    <tr>
                      <td class="pl-3">Barangay Clearance Fee (Poblacion)</td>
                      <td class="text-right font-mono">100.00</td>
                    </tr>
                    <tr class="grand-total-row">
                      <td><strong>GRAND TOTAL</strong></td>
                      <td class="text-right font-bold text-base font-mono">₱2,890.60</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Right: Official Receipt & Sworn Sales -->
              <div class="or-sketch-col">
                <div class="or-badge-box">
                  <div class="or-title">OFFICIAL RECEIPT RECORD</div>
                  <div class="or-num-tag">OR: 3675241</div>
                  <div class="or-amount">Total Paid: <strong>₱2,890.60</strong></div>
                  <div class="or-date">Date Assessed: {{ formatDate(formData.treasurerVerifiedDate || '2026-07-08') }}</div>
                  <div class="or-examiner">Assessed by: <strong>J. ANDANA</strong> (Municipal Treasurer's Office)</div>
                </div>

                <div class="sworn-statement-box">
                  <div class="sworn-title">SWORN STATEMENT OF GROSS SALES</div>
                  <p class="sworn-desc">
                    I hereby DECLARE that my monthly average gross sales of my business are recorded and truthful.
                  </p>
                  <div class="months-mini-grid">
                    <span class="m-pill">Jan: ₱45k</span>
                    <span class="m-pill">Feb: ₱48k</span>
                    <span class="m-pill">Mar: ₱50k</span>
                    <span class="m-pill">Apr: ₱52k</span>
                    <span class="m-pill">May: ₱49k</span>
                    <span class="m-pill">Jun: ₱51k</span>
                    <span class="m-pill">Jul: ₱53k</span>
                    <span class="m-pill">Aug: ₱50k</span>
                    <span class="m-pill">Sep: ₱49k</span>
                    <span class="m-pill">Oct: ₱52k</span>
                    <span class="m-pill">Nov: ₱54k</span>
                    <span class="m-pill">Dec: ₱58k</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION: VERIFICATION OF DOCUMENTARY REQUIREMENTS (9 ENDORSING OFFICES) -->
          <div class="section-box">
            <div class="section-banner">
              <strong>VERIFICATION OF DOCUMENTARY REQUIREMENTS (ENDORSING OFFICES / AGENCIES)</strong>
            </div>

            <table class="permit-table clearances-table">
              <thead>
                <tr>
                  <th style="width: 32%;">Endorsing Offices / Agency</th>
                  <th style="width: 28%;">Description / Required Clearance</th>
                  <th style="width: 20%;">Verified By (Name &amp; Signature)</th>
                  <th style="width: 10%;">Date Verified</th>
                  <th style="width: 10%;">Remarks</th>
                </tr>
              </thead>
              <tbody>
                <!-- 1. Treasurer -->
                <tr class="verified-row">
                  <td><strong>Municipal Treasurer's Office</strong></td>
                  <td>Assessment / Tax Order of Payment</td>
                  <td>
                    <span class="stamp-verified font-bold">J. ANDANA</span>
                  </td>
                  <td class="text-center font-mono">7/8/26</td>
                  <td class="text-center font-bold text-emerald-700">PAID</td>
                </tr>

                <!-- 2. Building Official -->
                <tr>
                  <td>Office of the Building Official / Engineering</td>
                  <td>Certificate of Occupancy / Electrical</td>
                  <td><span class="pending-line">ENGR. M. BALACUIT</span></td>
                  <td class="text-center font-mono">7/8/26</td>
                  <td class="text-center">OK</td>
                </tr>

                <!-- 3. Health Office -->
                <tr>
                  <td>Municipal Health Office / Sanitary</td>
                  <td>Health Certificate and Sanitary Permit</td>
                  <td><span class="pending-line">DR. R. CABRERA</span></td>
                  <td class="text-center font-mono">7/8/26</td>
                  <td class="text-center">CLEARED</td>
                </tr>

                <!-- 4. Planning / Zoning -->
                <tr>
                  <td>Municipal Planning and Development Office</td>
                  <td>Zoning / Locational Clearance</td>
                  <td><span class="pending-line">MPDO OFFICER</span></td>
                  <td class="text-center font-mono">7/8/26</td>
                  <td class="text-center">CONFORMED</td>
                </tr>

                <!-- 5. MENRO -->
                <tr>
                  <td>Municipal Environment &amp; Natural Resources</td>
                  <td>Solid Waste Management Compliance</td>
                  <td><span class="pending-line">MENRO OFFICER</span></td>
                  <td class="text-center font-mono">7/8/26</td>
                  <td class="text-center">OK</td>
                </tr>

                <!-- 6. PESO / Negosyo Center -->
                <tr>
                  <td>Public Employment Service Office / Negosyo</td>
                  <td>List of Employees with Designations</td>
                  <td><span class="pending-line">PESO OFFICER</span></td>
                  <td class="text-center font-mono">7/8/26</td>
                  <td class="text-center">ENROLLED</td>
                </tr>

                <!-- 7. Public Market Office (EDGAR EYANA) -->
                <tr class="verified-row highlight-market">
                  <td><strong>Public Market Office</strong></td>
                  <td>Market Stall Rental Contract / Lease Agreement</td>
                  <td>
                    <span class="stamp-verified font-bold text-blue-900">EDGAR EYANA</span>
                  </td>
                  <td class="text-center font-mono">7/8/26</td>
                  <td class="text-center font-bold text-emerald-800">FISH VENDOR OK</td>
                </tr>

                <!-- 8. MDRRMO -->
                <tr>
                  <td>Municipal Disaster Risk Reduction &amp; Mgmt</td>
                  <td>Safety and Risk Compliance</td>
                  <td><span class="pending-line">MDRRMO OFFICER</span></td>
                  <td class="text-center font-mono">7/8/26</td>
                  <td class="text-center">COMPLIED</td>
                </tr>

                <!-- 9. BFP -->
                <tr>
                  <td>Bureau of Fire Protection</td>
                  <td>Fire Safety Inspection Certificate (FSIC)</td>
                  <td><span class="pending-line">BFP INSPECTOR</span></td>
                  <td class="text-center font-mono">7/8/26</td>
                  <td class="text-center">INSPECTED</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom: Approval Sign-off & Location Sketch Box -->
          <div class="sec-grid two-cols approval-sketch-grid">
            <div class="bplo-approval-card">
              <div class="approval-header">Approved / Recommended by:</div>
              <div class="bplo-sign-space">
                <span class="sig-handwritten font-serif">June Clyde D. Patilano</span>
              </div>
              <div class="bplo-officer-name">JUNE CLYDE D. PATILANO</div>
              <div class="bplo-officer-title">LRCO II / BPLO Designate</div>
              <div class="bplo-date-row">
                <span>Date Signed:</span>
                <span class="font-mono font-bold">{{ formatDate(formData.bploDateSigned || new Date()) }}</span>
              </div>
            </div>

            <div class="sketch-box-card">
              <div class="sketch-header">BUSINESS LOCATION SKETCH (FOR NEW BUSINESS)</div>
              <div class="sketch-canvas-placeholder">
                <div class="sketch-marker-pin">
                  <i class="pi pi-map-pin"></i>
                  <span>{{ formData.preferredStallNo || 'Market Stall #WS-01' }}</span>
                </div>
                <div class="sketch-desc">
                  Manticao Central Public Market &bull; Wet Section &bull; Poblacion, Manticao, Misamis Oriental
                </div>
              </div>
            </div>
          </div>

          <div class="page-footer-note">
            <span>Unified Application Form for Business Permit &bull; Page 2 of 2</span>
            <span>Business Permits &amp; Licensing Office (BPLO) &bull; Municipality of Manticao</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { exportToWord, exportToPdf } from '../utils/exportUtils'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  formData: {
    type: Object,
    default: () => ({})
  },
  permitData: {
    type: Object,
    default: () => ({})
  },
  applicationData: {
    type: Object,
    default: null
  }
})

defineEmits(['close'])

const effectiveFormData = computed(() => {
  if (props.formData && Object.keys(props.formData).length > 0) return props.formData
  if (props.applicationData && Object.keys(props.applicationData).length > 0) return props.applicationData
  if (props.permitData && Object.keys(props.permitData).length > 0) return props.permitData
  return {}
})

// Expose computed formData for template access
const formData = effectiveFormData

const ownerSurname = computed(() => {
  return formData.value.ownerSurname || formData.value.lastName || 'ABUHAN'
})

const ownerGivenName = computed(() => {
  return formData.value.ownerGivenName || formData.value.firstName || 'RISMA'
})

const ownerMiddleName = computed(() => {
  return formData.value.ownerMiddleName || formData.value.middleName || 'PORCO'
})

const printedOwnerFullName = computed(() => {
  const parts = [ownerGivenName.value, ownerMiddleName.value ? `${ownerMiddleName.value[0]}.` : '', ownerSurname.value].filter(Boolean)
  return parts.join(' ').toUpperCase()
})

const isOwned = computed(() => {
  return Boolean(formData.value.propertyOwned)
})

const isCorpFilipino = computed(() => {
  return formData.value.corpCitizenship !== 'Foreign'
})

const activeBusinessLines = computed(() => {
  if (Array.isArray(formData.value.businessLines) && formData.value.businessLines.length > 0) {
    return formData.value.businessLines
  }
  return [
    {
      lineOfBusiness: formData.value.businessType || 'Fish Vendor / Wet Section Trade',
      psicCode: '47211',
      productsServices: formData.value.commodities || 'Fresh Fish, Marine Seafood Products',
      numUnits: 1,
      capitalization: 50000,
      grossSales: 0
    }
  ]
})

function isType(val) {
  const cur = formData.value.applicationType || 'NEW'
  return String(cur).toUpperCase() === String(val).toUpperCase()
}

function isPayMode(val) {
  const cur = formData.value.paymentMode || 'Annually'
  return String(cur).toLowerCase() === String(val).toLowerCase()
}

function isOrg(val) {
  const cur = formData.value.orgType || 'Sole Proprietor'
  return String(cur).toLowerCase() === String(val).toLowerCase()
}

function isGender(val) {
  const cur = formData.value.orgGender || 'Female'
  return String(cur).toLowerCase() === String(val).toLowerCase()
}

function isActivity(val) {
  const cur = formData.value.businessActivity || 'Others'
  return String(cur).toLowerCase() === String(val).toLowerCase()
}

function formatMoney(num) {
  return Number(num || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return String(d)
  return dt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function handlePrint() {
  window.print()
}

function handleExportWord() {
  const name = `Manticao_Business_Permit_Application_${formData.value.trackingNumber || formData.value.applicationNo || 'Form'}`
  exportToWord('#printable-business-permit-doc', name, { title: 'Unified Application Form for Business Permit' })
}

function handleExportPdf() {
  const name = `Manticao_Business_Permit_Application_${formData.value.trackingNumber || formData.value.applicationNo || 'Form'}`
  exportToPdf('#printable-business-permit-doc', name, { title: 'Unified Application Form for Business Permit' })
}

function handleLogoError(e) {
  e.target.style.display = 'none'
}
</script>

<style scoped>
.form-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  overflow-y: auto;
}

.form-modal-shell {
  background: #f8fafc;
  border-radius: 16px;
  width: 100%;
  max-width: 960px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-top: 10px;
  margin-bottom: 30px;
}

/* Control Bar (Screen only) */
.modal-control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #0f172a;
  color: #ffffff;
  padding: 14px 20px;
  border-bottom: 2px solid #334155;
}

.control-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.doc-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #2563eb;
  color: white;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.modal-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
}

.tracking-tag {
  font-size: 0.75rem;
  background: #334155;
  color: #cbd5e1;
  padding: 2px 8px;
  border-radius: 4px;
}

.control-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-word {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn-word:hover {
  background: #1d4ed8;
}

.btn-pdf {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #b91c1c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn-pdf:hover {
  background: #dc2626;
}

.btn-print {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-print:hover {
  background: #059669;
}

.btn-close-modal {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.btn-close-modal:hover {
  color: #ffffff;
  background: #334155;
}

/* Document Container */
.printable-document-container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  background: #f1f5f9;
}

/* Page Standard Size (Letter / A4 ratio) */
.permit-page {
  background: #ffffff;
  color: #0f172a;
  border: 1.5px solid #cbd5e1;
  border-radius: 4px;
  padding: 24px 28px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11px;
  line-height: 1.35;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Header */
.permit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.header-seal,
.official-seal-badge {
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seal-svg {
  width: 100%;
  height: 100%;
}

.header-text-center {
  text-align: center;
  flex: 1;
}

.republic-text {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.province-text {
  font-size: 10px;
  font-weight: bold;
}

.municipality-text {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.5px;
}

.office-sub {
  font-size: 9px;
  color: #475569;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.main-form-title {
  margin: 4px 0 0;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #000000;
}

/* Type Grid */
.permit-type-grid {
  display: grid;
  grid-template-columns: 1.2fr 1.8fr 2fr;
  border: 1.5px solid #000000;
  margin-bottom: 8px;
  background: #ffffff;
}

.type-col, .payment-mode-col, .tracking-meta-col {
  padding: 6px 10px;
}

.type-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-right: 1px solid #000000;
  justify-content: center;
}

.payment-mode-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-right: 1px solid #000000;
}

.payment-title {
  font-weight: bold;
  font-size: 10px;
}

.payment-modes-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tracking-meta-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 10px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
}

.meta-row .lbl {
  color: #475569;
}

/* Checkbox Style */
.type-check-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
}

.box-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
  border: 1.2px solid #000000;
  font-size: 10px;
  font-weight: bold;
  background: #ffffff;
  line-height: 1;
}

/* Section Boxes */
.section-box {
  border: 1.5px solid #000000;
  margin-bottom: 8px;
}

.section-banner {
  background: #f1f5f9;
  border-bottom: 1.2px solid #000000;
  padding: 3px 8px;
  font-size: 10.5px;
  font-weight: 900;
  letter-spacing: 0.3px;
}

.sec-row {
  padding: 5px 8px;
  border-bottom: 1px solid #e2e8f0;
}

.org-type-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.org-options-wrap {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.gender-sub {
  font-size: 9.5px;
  color: #334155;
  margin-left: 2px;
}

.sec-grid {
  display: grid;
  border-bottom: 1px solid #e2e8f0;
}

.sec-grid.two-cols {
  grid-template-columns: 1fr 1fr;
}

.sec-grid.three-cols {
  grid-template-columns: 1fr 1fr 1.2fr;
}

.data-field {
  padding: 4px 8px;
  display: flex;
  gap: 6px;
  align-items: baseline;
  border-right: 1px solid #e2e8f0;
}

.data-field:last-child {
  border-right: none;
}

.data-field.single-line {
  border-bottom: 1px solid #e2e8f0;
}

.f-lbl {
  font-weight: bold;
  font-size: 10px;
  white-space: nowrap;
}

.f-val {
  font-size: 10.5px;
  color: #0f172a;
}

/* Address Blocks */
.address-sub-block {
  padding: 5px 8px;
  border-bottom: 1px solid #e2e8f0;
  background: #fafafa;
}

.sub-block-title {
  font-weight: bold;
  font-size: 10px;
  margin-bottom: 3px;
}

.addr-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px 8px;
  font-size: 9.5px;
}

.a-cell {
  display: flex;
  gap: 3px;
}

.a-lbl {
  color: #64748b;
  font-size: 9px;
}

/* Owner Names Block */
.owner-names-block {
  padding: 5px 8px;
  border-bottom: 1px solid #e2e8f0;
}

.owner-names-block.corp-block {
  border-bottom: none;
  background: #fafafa;
}

.names-grid {
  display: grid;
  grid-template-columns: 2fr 2fr 2fr 1fr;
  gap: 6px;
  margin-top: 2px;
}

.name-cell {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 3px 6px;
  display: flex;
  flex-direction: column;
}

.name-lbl {
  font-size: 8.5px;
  color: #64748b;
  text-transform: uppercase;
}

.name-val {
  font-size: 11px;
  font-weight: bold;
  color: #0f172a;
}

/* Operation Stats Strip */
.operation-stats-strip {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr 1.2fr 1.2fr;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}

.stat-cell {
  padding: 4px 6px;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  font-size: 9.5px;
}

.stat-cell:last-child {
  border-right: none;
}

.stat-lbl {
  font-size: 8.5px;
  color: #64748b;
}

.location-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
}

.same-as-main-check {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: bold;
}

/* Ownership & Incentives */
.ownership-incentives-row {
  padding: 4px 8px;
  display: flex;
  gap: 20px;
  align-items: center;
}

.ownership-col, .incentives-col {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
}

.ownership-hint {
  font-size: 8.5px;
  color: #64748b;
}

.business-activity-row {
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 10px;
}

.activity-options-wrap {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Tables */
.permit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9.5px;
}

.permit-table th, .permit-table td {
  border: 1px solid #000000;
  padding: 3px 6px;
}

.permit-table th {
  background: #f1f5f9;
  font-weight: bold;
  text-align: left;
}

/* Perjury Declaration */
.perjury-declaration-box {
  padding: 8px 10px;
  background: #ffffff;
}

.perjury-text {
  font-size: 8.5px;
  text-align: justify;
  line-height: 1.35;
  color: #1e293b;
  margin: 0 0 10px 0;
}

.applicant-signature-row {
  display: flex;
  justify-content: space-around;
  margin-top: 14px;
}

.signature-block, .position-block {
  text-align: center;
  width: 40%;
}

.sig-line {
  border-bottom: 1.2px solid #000000;
  padding-bottom: 2px;
  min-height: 20px;
}

.sig-handwritten {
  font-style: italic;
  font-size: 13px;
  color: #0f172a;
}

.sig-name {
  display: block;
  font-size: 10.5px;
  margin-top: 3px;
}

.sig-title {
  display: block;
  font-size: 8.5px;
  color: #475569;
}

/* Page 2 Styles */
.page-2-mini-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 1.5px solid #000000;
  padding-bottom: 4px;
  margin-bottom: 8px;
  font-size: 9px;
  font-weight: bold;
}

.assessment-layout-grid {
  display: grid;
  grid-template-columns: 1.6fr 1.2fr;
  gap: 8px;
  padding: 6px;
}

.fees-table td {
  padding: 2.5px 6px;
}

.sub-header-row td {
  background: #f8fafc;
  font-size: 9.5px;
}

.grand-total-row td {
  background: #f1f5f9;
  border-top: 2px solid #000000;
}

.or-sketch-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.or-badge-box {
  border: 1.5px dashed #059669;
  background: #ecfdf5;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 9.5px;
}

.or-title {
  font-weight: 800;
  color: #065f46;
  font-size: 10px;
  margin-bottom: 2px;
}

.or-num-tag {
  font-family: monospace;
  font-weight: 800;
  font-size: 12px;
  color: #047857;
}

.sworn-statement-box {
  border: 1px solid #cbd5e1;
  background: #fafafa;
  padding: 6px 8px;
  border-radius: 4px;
}

.sworn-title {
  font-weight: bold;
  font-size: 9.5px;
  margin-bottom: 2px;
}

.sworn-desc {
  font-size: 8.5px;
  margin: 0 0 4px 0;
  color: #475569;
}

.months-mini-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 3px;
}

.m-pill {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  font-size: 8px;
  text-align: center;
  padding: 1px 2px;
  font-family: monospace;
}

/* Clearances Table */
.clearances-table td {
  padding: 3px 6px;
}

.clearances-table .verified-row {
  background: #f0fdf4;
}

.clearances-table .highlight-market {
  background: #eff6ff;
}

.stamp-verified {
  font-family: monospace;
  letter-spacing: 0.5px;
  color: #065f46;
}

.pending-line {
  color: #64748b;
  font-size: 9px;
}

/* BPLO Sign & Sketch Grid */
.approval-sketch-grid {
  margin-top: 8px;
  gap: 12px;
}

.bplo-approval-card {
  border: 1.5px solid #000000;
  padding: 10px 14px;
  text-align: center;
  background: #ffffff;
}

.approval-header {
  font-size: 9.5px;
  font-weight: bold;
  margin-bottom: 8px;
  text-align: left;
}

.bplo-sign-space {
  min-height: 22px;
  border-bottom: 1.5px solid #000000;
  margin-bottom: 4px;
}

.bplo-officer-name {
  font-weight: 900;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.bplo-officer-title {
  font-size: 9.5px;
  color: #334155;
}

.bplo-date-row {
  margin-top: 6px;
  font-size: 9px;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.sketch-box-card {
  border: 1.5px solid #000000;
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.sketch-header {
  font-size: 9px;
  font-weight: bold;
  margin-bottom: 4px;
}

.sketch-canvas-placeholder {
  flex: 1;
  min-height: 80px;
  border: 1px dashed #94a3b8;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  text-align: center;
}

.sketch-marker-pin {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #dc2626;
  font-weight: bold;
  font-size: 10px;
}

.sketch-desc {
  font-size: 8.5px;
  color: #64748b;
  margin-top: 4px;
}

.page-footer-note {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 8px;
  color: #64748b;
  border-top: 1px solid #e2e8f0;
  padding-top: 3px;
}

/* ==========================================
   PRINT STYLES: 2 PAGES EXACT PRINT REPRODUCTION
   ========================================== */
@media print {
  @page {
    size: letter portrait;
    margin: 8mm 8mm 8mm 8mm;
  }

  body * {
    visibility: hidden;
  }

  .no-print {
    display: none !important;
  }

  #printable-business-permit-doc, #printable-business-permit-doc * {
    visibility: visible;
  }

  .form-modal-backdrop {
    position: static !important;
    background: transparent !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  .form-modal-shell {
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    width: 100% !important;
    max-width: 100% !important;
    border-radius: 0 !important;
  }

  .printable-document-container {
    padding: 0 !important;
    gap: 0 !important;
    background: transparent !important;
  }

  .permit-page {
    border: none !important;
    padding: 0 !important;
    box-shadow: none !important;
    page-break-after: always !important;
    break-after: page !important;
    width: 100% !important;
  }

  .permit-page.page-2 {
    page-break-after: auto !important;
    break-after: auto !important;
  }
}
</style>
