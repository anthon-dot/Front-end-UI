<template>
  <div v-if="visible" class="dossier-modal-backdrop" @click.self="$emit('close')">
    <div class="dossier-modal-shell">
      <!-- Toolbar (Non-printable) -->
      <div class="dossier-toolbar no-print">
        <div class="toolbar-info">
          <div class="dossier-badge">
            <i class="pi pi-briefcase"></i>
            <span>Official LGU Municipal Dossier</span>
          </div>
          <h2 class="dossier-title">Official Market Tenancy &amp; Business Permit Dossier</h2>
          <span class="dossier-ref">Tracking: {{ appData.trackingNumber || appData.applicationNo || 'BP-2026-0782' }} &bull; Manticao Public Market</span>
        </div>

        <div class="toolbar-nav-tabs">
          <button
            type="button"
            class="nav-tab-btn"
            :class="{ active: activeTab === 'all' }"
            @click="activeTab = 'all'"
          >
            <i class="pi pi-copy"></i>
            <span>All Documents (Full Dossier)</span>
          </button>
          <button
            type="button"
            class="nav-tab-btn"
            :class="{ active: activeTab === 'permit' }"
            @click="activeTab = 'permit'"
          >
            <i class="pi pi-id-card"></i>
            <span>Business Permit Form (2 Pages)</span>
          </button>
          <button
            type="button"
            class="nav-tab-btn"
            :class="{ active: activeTab === 'rental' }"
            @click="activeTab = 'rental'"
          >
            <i class="pi pi-file-pdf"></i>
            <span>Stall Rental Form (3 Pages)</span>
          </button>
          <button
            type="button"
            class="nav-tab-btn"
            :class="{ active: activeTab === 'loi' }"
            @click="activeTab = 'loi'"
          >
            <i class="pi pi-file-edit"></i>
            <span>Letter of Intent</span>
          </button>
        </div>

        <div class="toolbar-actions">
          <button type="button" class="btn-tb word" @click="handleExportWord" title="Export Full Dossier as Microsoft Word Document (.doc)">
            <i class="pi pi-file-word"></i>
            <span>Export Word (.doc)</span>
          </button>
          <button type="button" class="btn-tb print" @click="handlePrint">
            <i class="pi pi-print"></i>
            <span>Print {{ activeTab === 'all' ? 'Full Dossier' : 'Document' }}</span>
          </button>
          <button type="button" class="btn-tb download" @click="handleDownload">
            <i class="pi pi-file-pdf"></i>
            <span>Export PDF</span>
          </button>
          <button type="button" class="btn-tb close" @click="$emit('close')" title="Close">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <!-- Printable Document Scrollport -->
      <div class="dossier-viewport" id="printable-unified-dossier">
        <!-- ========================================================
             DOCUMENT 1: UNIFIED APPLICATION FORM FOR BUSINESS PERMIT
             (Pages 1 & 2)
             ======================================================== -->
        <div v-if="activeTab === 'all' || activeTab === 'permit'" class="dossier-doc-block">
          <!-- BPLO Header & Page 1 -->
          <div class="dossier-page page-break-after">
            <div class="permit-header-strip">
              <div class="seal-slot">
                <svg viewBox="0 0 100 100" class="seal-svg-mini">
                  <circle cx="50" cy="50" r="46" fill="#0284c7" stroke="#0369a1" stroke-width="3" />
                  <circle cx="50" cy="50" r="38" fill="#ffffff" stroke="#f59e0b" stroke-width="2" />
                  <path d="M50 16 L54 28 L66 28 L56 36 L60 48 L50 40 L40 48 L44 36 L34 28 L46 28 Z" fill="#f59e0b" />
                  <circle cx="50" cy="50" r="18" fill="#0284c7" />
                  <text x="50" y="54" font-size="9" font-weight="900" text-anchor="middle" fill="#ffffff">MANTICAO</text>
                  <text x="50" y="82" font-size="6.5" font-weight="700" text-anchor="middle" fill="#0f172a">MISAMIS ORIENTAL</text>
                </svg>
              </div>
              <div class="center-texts">
                <div class="h-p1">Republic of the Philippines</div>
                <div class="h-p2">Province of Misamis Oriental</div>
                <div class="h-p3">MUNICIPALITY OF MANTICAO</div>
                <div class="h-p4">BUSINESS PERMITS &amp; LICENSING OFFICE (BPLO)</div>
                <h1 class="h-title">UNIFIED APPLICATION FORM FOR BUSINESS PERMIT</h1>
              </div>
              <div class="seal-slot">
                <svg viewBox="0 0 100 100" class="seal-svg-mini">
                  <circle cx="50" cy="50" r="46" fill="#b91c1c" stroke="#991b1b" stroke-width="3" />
                  <circle cx="50" cy="50" r="38" fill="#ffffff" stroke="#eab308" stroke-width="2" />
                  <circle cx="50" cy="46" r="14" fill="#1e3a8a" />
                  <polygon points="50,34 53,42 61,42 55,47 57,55 50,50 43,55 45,47 39,42 47,42" fill="#eab308" />
                  <text x="50" y="78" font-size="7" font-weight="900" text-anchor="middle" fill="#1e3a8a">BAGONG</text>
                  <text x="50" y="86" font-size="6.5" font-weight="900" text-anchor="middle" fill="#b91c1c">PILIPINAS</text>
                </svg>
              </div>
            </div>

            <!-- Top Option Strip -->
            <div class="meta-strip-grid">
              <div class="strip-col">
                <div class="check-line"><span class="box-ch">{{ isType('NEW') ? '✓' : '' }}</span> <span>NEW</span></div>
                <div class="check-line"><span class="box-ch">{{ isType('RENEWAL') ? '✓' : '' }}</span> <span>RENEWAL</span></div>
                <div class="check-line"><span class="box-ch">{{ isType('ADDITIONAL') ? '✓' : '' }}</span> <span>ADDITIONAL</span></div>
              </div>
              <div class="strip-col">
                <span class="strip-lbl">Mode of Payment:</span>
                <div class="check-line"><span class="box-ch">{{ isPay('Annually') ? '✓' : '' }}</span> <span>Annually</span></div>
                <div class="check-line"><span class="box-ch">{{ isPay('Bi-Annually') ? '✓' : '' }}</span> <span>Bi-Annually</span></div>
                <div class="check-line"><span class="box-ch">{{ isPay('Quarterly') ? '✓' : '' }}</span> <span>Quarterly</span></div>
              </div>
              <div class="strip-col meta-num">
                <div><span class="lbl-dim">Date of Receipt:</span> <strong>{{ formatDate(appData.submittedAt || new Date()) }}</strong></div>
                <div><span class="lbl-dim">Tracking No:</span> <strong class="font-mono">{{ appData.trackingNumber || appData.applicationNo || 'BP-2026-0782' }}</strong></div>
                <div><span class="lbl-dim">Business ID:</span> <strong class="font-mono">{{ appData.businessIdNumber || 'BIN-9024-0041' }}</strong></div>
              </div>
            </div>

            <!-- SECTION A -->
            <div class="doc-sec-box">
              <div class="doc-sec-title">A. BUSINESS INFORMATION AND REGISTRATION</div>
              <div class="doc-sec-content">
                <div class="sec-item">
                  <span class="sec-label">Entity Type:</span>
                  <div class="sub-checks-row">
                    <span class="check-tag"><span class="box-ch">{{ isOrg('Sole Proprietor') ? '✓' : '' }}</span> Sole Proprietor [ {{ isGender('Female') ? '✓' : ' ' }} Female ]</span>
                    <span class="check-tag"><span class="box-ch">{{ isOrg('One Person Corporation') ? '✓' : '' }}</span> One Person Corp</span>
                    <span class="check-tag"><span class="box-ch">{{ isOrg('Partnership') ? '✓' : '' }}</span> Partnership</span>
                    <span class="check-tag"><span class="box-ch">{{ isOrg('Corporation') ? '✓' : '' }}</span> Corporation</span>
                    <span class="check-tag"><span class="box-ch">{{ isOrg('Cooperative') ? '✓' : '' }}</span> Cooperative</span>
                  </div>
                </div>

                <div class="grid-2-col">
                  <div><span class="sec-label">DTI / SEC / CDA Reg No:</span> <strong>{{ appData.dtiSecCdaRegNo || 'DTI-REG-2026-9024' }}</strong></div>
                  <div><span class="sec-label">Tax ID No (TIN):</span> <strong>{{ appData.tinNo || '432-890-123-000' }}</strong></div>
                </div>

                <div class="grid-2-col">
                  <div><span class="sec-label">Trade Name / Franchise:</span> <strong>{{ appData.tradeNameFranchise || appData.businessName || 'ABUHAN FISH VENDOR STALL' }}</strong></div>
                  <div><span class="sec-label">Business Mobile / Email:</span> <strong>{{ appData.mobileNo || appData.contact || '09932889970' }}</strong> &bull; {{ appData.email || 'risma.abuhan@gmail.com' }}</div>
                </div>

                <div class="full-field">
                  <span class="sec-label">Main Office Address:</span>
                  <strong>{{ mainAddressString }}</strong>
                </div>

                <div class="grid-2-col highlight-owner">
                  <div><span class="sec-label">Sole Proprietor Owner Surname:</span> <strong>{{ ownerSurname }}</strong></div>
                  <div><span class="sec-label">Given Name &amp; Middle:</span> <strong>{{ ownerGivenName }} {{ ownerMiddleName }}</strong></div>
                </div>
              </div>
            </div>

            <!-- SECTION B -->
            <div class="doc-sec-box">
              <div class="doc-sec-title">B. BUSINESS OPERATION</div>
              <div class="doc-sec-content">
                <div class="grid-4-col">
                  <div><span class="sec-label">Business Area:</span> <strong>{{ appData.businessAreaSqm || 9 }} sq.m.</strong></div>
                  <div><span class="sec-label">Total Floor Area:</span> <strong>{{ appData.totalFloorAreaSqm || 9 }} sq.m.</strong></div>
                  <div><span class="sec-label">Female Employees:</span> <strong>{{ appData.numEmployeesFemale || 1 }}</strong></div>
                  <div><span class="sec-label">Employees in Manticao:</span> <strong>{{ appData.numEmployeesLguResiding || 1 }}</strong></div>
                </div>

                <div class="grid-2-col">
                  <div><span class="sec-label">Business Location Address:</span> <strong>{{ locAddressString }}</strong></div>
                  <div><span class="sec-label">Property Status &amp; Incentives:</span> <strong>Owned: {{ appData.propertyOwned ? 'Yes' : 'Leased Market Stall' }}</strong> &bull; Incentives: No</div>
                </div>

                <!-- Line of Business Schedule -->
                <div class="table-wrap-box">
                  <table class="dossier-inner-table">
                    <thead>
                      <tr>
                        <th>Line of Business</th>
                        <th style="width: 14%;">PSIC Code</th>
                        <th>Products / Services</th>
                        <th style="width: 8%;">Units</th>
                        <th style="width: 18%; text-align: right;">Capitalization (₱)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(line, idx) in activeLines" :key="idx">
                        <td><strong>{{ line.lineOfBusiness }}</strong></td>
                        <td class="text-center font-mono">{{ line.psicCode || '47211' }}</td>
                        <td>{{ line.productsServices }}</td>
                        <td class="text-center">{{ line.numUnits || 1 }}</td>
                        <td class="text-right font-bold font-mono">₱{{ formatMoney(line.capitalization || 50000) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Perjury Statutory Box -->
                <div class="perjury-stat-box">
                  <p class="perjury-p">
                    I DECLARE UNDER PENALTY OF PERJURY that all information in this application are true and correct based on my personal knowledge and authentic records submitted. Any false information or fake documents supplied shall be grounds for legal action and automatically revokes permit.
                  </p>
                  <div class="sig-row-flex">
                    <div class="sig-block-col">
                      <div class="hand-sig font-script">{{ fullOwnerName }}</div>
                      <div class="sig-bar"></div>
                      <strong>{{ fullOwnerName }}</strong>
                      <span class="sig-sub">SIGNATURE OF APPLICANT / OWNER OVER PRINTED NAME</span>
                    </div>
                    <div class="sig-block-col">
                      <div class="hand-sig font-script">OWNER / PROPRIETRESS</div>
                      <div class="sig-bar"></div>
                      <strong>OWNER / PROPRIETRESS</strong>
                      <span class="sig-sub">DESIGNATION / POSITION / TITLE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="dossier-page-foot">
              <span>Municipality of Manticao &bull; Unified Application Form for Business Permit</span>
              <span>Page 1 of 2</span>
            </div>
          </div>

          <!-- BPLO Page 2: Assessment of 10 Fees, 9 Endorsing Offices, Sworn Statement -->
          <div class="dossier-page page-break-after">
            <div class="dossier-mini-head">
              <span>MUNICIPALITY OF MANTICAO &bull; BUSINESS PERMITS &amp; LICENSING OFFICE</span>
              <span class="font-mono">Tracking: {{ appData.trackingNumber || appData.applicationNo || 'BP-2026-0782' }}</span>
            </div>

            <!-- Assessment of Fees -->
            <div class="doc-sec-box">
              <div class="doc-sec-title">ASSESSMENT OF FEES AND LOCAL TAXES</div>
              <div class="fees-dual-grid">
                <table class="dossier-inner-table">
                  <thead>
                    <tr>
                      <th>Assessment Item (Local Taxes &amp; Regulatory Fees)</th>
                      <th style="width: 30%; text-align: right;">Amount (PHP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Gross Sales Tax (Business Tax)</td><td class="text-right font-mono">1,080.00</td></tr>
                    <tr><td>Penalty / Surcharge</td><td class="text-right font-mono">210.60</td></tr>
                    <tr><td>Mayor's Permit Fee</td><td class="text-right font-mono">500.00</td></tr>
                    <tr><td>Mayor's Clearance</td><td class="text-right font-mono">100.00</td></tr>
                    <tr><td>Police Clearance</td><td class="text-right font-mono">100.00</td></tr>
                    <tr><td>Tax Clearance</td><td class="text-right font-mono">100.00</td></tr>
                    <tr><td>Registration Fee</td><td class="text-right font-mono">100.00</td></tr>
                    <tr><td>Sanitary Permit</td><td class="text-right font-mono">100.00</td></tr>
                    <tr><td>Health Certificate</td><td class="text-right font-mono">100.00</td></tr>
                    <tr><td>Garbage Charges</td><td class="text-right font-mono">600.00</td></tr>
                    <tr><td>Barangay Clearance Fee (Poblacion)</td><td class="text-right font-mono">100.00</td></tr>
                    <tr class="grand-total-highlight">
                      <td><strong>GRAND TOTAL</strong></td>
                      <td class="text-right font-extrabold font-mono text-base">₱2,890.60</td>
                    </tr>
                  </tbody>
                </table>

                <div class="receipt-callout-panel">
                  <div class="rc-header">OFFICIAL RECEIPT VERIFICATION</div>
                  <div class="rc-or-number">OR: 3675241</div>
                  <div class="rc-total-paid">Total Assessed &amp; Paid: <strong>₱2,890.60</strong></div>
                  <div class="rc-examiner">Assessed by: <strong>J. ANDANA</strong></div>
                  <div class="rc-office">Municipal Treasurer's Office &bull; Manticao</div>
                  <div class="rc-divider"></div>
                  <div class="rc-sworn-title">SWORN STATEMENT OF AVERAGE GROSS SALES</div>
                  <p class="rc-sworn-p">Monthly average gross sales recorded and affirmed pursuant to Manticao Tax Ordinance.</p>
                  <div class="rc-months-strip">
                    <span>Jan: ₱45k</span> <span>Feb: ₱48k</span> <span>Mar: ₱50k</span> <span>Apr: ₱52k</span>
                    <span>May: ₱49k</span> <span>Jun: ₱51k</span> <span>Jul: ₱53k</span> <span>Aug: ₱50k</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Verification of Documentary Requirements: 9 Endorsing Offices -->
            <div class="doc-sec-box">
              <div class="doc-sec-title">VERIFICATION OF DOCUMENTARY REQUIREMENTS (ENDORSING OFFICES / AGENCIES)</div>
              <table class="dossier-inner-table clearances-tbl">
                <thead>
                  <tr>
                    <th style="width: 32%;">Endorsing Office / Agency</th>
                    <th style="width: 28%;">Description</th>
                    <th style="width: 22%;">Verified By (Name &amp; Signature)</th>
                    <th style="width: 9%;">Date</th>
                    <th style="width: 9%;">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Municipal Treasurer's Office</strong></td>
                    <td>Assessment / Tax Order of Payment</td>
                    <td><strong class="text-emerald-700">J. ANDANA</strong></td>
                    <td class="text-center font-mono">7/8/26</td>
                    <td class="text-center font-bold text-emerald-700">PAID</td>
                  </tr>
                  <tr>
                    <td>Office of the Building Official / Engineering</td>
                    <td>Certificate of Occupancy / Electrical</td>
                    <td><span>ENGR. M. BALACUIT</span></td>
                    <td class="text-center font-mono">7/8/26</td>
                    <td class="text-center">OK</td>
                  </tr>
                  <tr>
                    <td>Municipal Health Office / Sanitary</td>
                    <td>Health Certificate &amp; Sanitary Permit</td>
                    <td><span>DR. SANITARY OFFICER</span></td>
                    <td class="text-center font-mono">7/8/26</td>
                    <td class="text-center">OK</td>
                  </tr>
                  <tr>
                    <td>Municipal Planning &amp; Development Office</td>
                    <td>Zoning / Locational Clearance</td>
                    <td><span>MPDO PLANNING CHIEF</span></td>
                    <td class="text-center font-mono">7/8/26</td>
                    <td class="text-center">OK</td>
                  </tr>
                  <tr>
                    <td>Municipal Environment &amp; Natural Resources (MENRO)</td>
                    <td>Solid Waste Management Compliance</td>
                    <td><span>MENRO OFFICER</span></td>
                    <td class="text-center font-mono">7/8/26</td>
                    <td class="text-center">OK</td>
                  </tr>
                  <tr>
                    <td>Public Employment Service Office (PESO)</td>
                    <td>List of Employees with Designations</td>
                    <td><span>PESO MANAGER</span></td>
                    <td class="text-center font-mono">7/8/26</td>
                    <td class="text-center">OK</td>
                  </tr>
                  <tr class="market-office-verified-row">
                    <td><strong>Public Market Office</strong></td>
                    <td>Market Stall Rental Contract / Lease</td>
                    <td><strong class="text-blue-800">EDGAR EYANA</strong></td>
                    <td class="text-center font-mono">7/8/26</td>
                    <td class="text-center font-extrabold text-blue-800">FISH VENDOR OK</td>
                  </tr>
                  <tr>
                    <td>Municipal Disaster Risk Reduction (MDRRMO)</td>
                    <td>Safety &amp; Disaster Risk Compliance</td>
                    <td><span>MDRRMO CHIEF</span></td>
                    <td class="text-center font-mono">7/8/26</td>
                    <td class="text-center">OK</td>
                  </tr>
                  <tr>
                    <td>Bureau of Fire Protection (BFP)</td>
                    <td>Fire Safety Inspection Certificate (FSIC)</td>
                    <td><span>BFP FIRE MARSHAL</span></td>
                    <td class="text-center font-mono">7/8/26</td>
                    <td class="text-center">OK</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- BPLO Final Approval Block -->
            <div class="bplo-approval-strip">
              <div class="bplo-sig-side">
                <div class="hand-sig font-script">JUNE CLYDE D. PATILANO</div>
                <div class="sig-bar"></div>
                <strong>JUNE CLYDE D. PATILANO</strong>
                <span class="sig-sub">LRCO II / BPLO DESIGNATE</span>
                <span class="sig-date-text">DATE SIGNED: {{ formatDate(new Date()) }}</span>
              </div>
              <div class="bplo-sketch-side">
                <div class="sketch-label">BUSINESS LOCATION SKETCH (PUBLIC MARKET STALL)</div>
                <div class="sketch-box-inner">
                  <i class="pi pi-map-pin text-rose-600"></i>
                  <strong>MANTICAO PUBLIC MARKET &bull; {{ appData.preferredStallNo || 'STALL #WS-01 (WET SECTION)' }}</strong>
                  <span class="sketch-sub">Poblacion, Manticao, Misamis Oriental &bull; 9 sq.m.</span>
                </div>
              </div>
            </div>

            <div class="dossier-page-foot">
              <span>Municipality of Manticao &bull; Unified Application Form for Business Permit</span>
              <span>Page 2 of 2</span>
            </div>
          </div>
        </div>

        <!-- ========================================================
             DOCUMENT 2: LETTER OF INTENT TO MAYOR STEPHEN S. TAN
             (Page 3 / Individual)
             ======================================================== -->
        <div v-if="activeTab === 'all' || activeTab === 'loi'" class="dossier-doc-block">
          <div class="dossier-page page-break-after loi-paper-sheet">
            <div class="loi-header-center">
              <h2 class="loi-formal-title">LETTER OF INTENT</h2>
              <span class="loi-formal-sub">Application for Stall Lease &bull; Manticao Public Market</span>
            </div>

            <div class="loi-date-line">
              {{ formatDate(new Date()) }}
            </div>

            <div class="loi-addressee">
              <strong>{{ appData.incumbentMayor || 'HON. MAYOR STEPHEN S. TAN' }}</strong><br />
              <span>MUNICIPAL MAYOR</span><br />
              <span>MUNICIPALITY OF MANTICAO</span><br />
              <span>PROVINCE OF MISAMIS ORIENTAL</span>
            </div>

            <div class="loi-subject-line">
              <strong>SUBJECT: Application for {{ appData.commodities || 'Fish Vendor / Wet Section Trade' }} Stall Lease</strong>
            </div>

            <div class="loi-body-content">
              <p>Dear Mayor Tan:</p>
              <p>Greetings!</p>
              <p>
                I am respectfully expressing my intent to apply for an available market stall/space at the <strong>Manticao Public Market</strong>, specifically <strong>{{ appData.preferredStallNo || 'Wet Section Stall #WS-01' }}</strong>, for the purpose of establishing and operating <strong>{{ appData.tradeNameFranchise || appData.businessName || 'ABUHAN FISH VENDOR STALL' }}</strong> ({{ appData.commodities || 'Fresh Fish and Marine Products' }}).
              </p>
              <p>
                I am willing and ready to comply with all the necessary requirements, permits, municipal rental fees, advance deposits, sanitation rules, and other lawful regulations established by the Municipal Government of Manticao and the Market Administration.
              </p>
              <p>
                I sincerely hope that my application will be given favorable consideration and approval. Thank you very much for your leadership and kind assistance.
              </p>
            </div>

            <div class="loi-signoff-block">
              <p>Respectfully yours,</p>
              <div class="hand-sig font-script">{{ fullOwnerName }}</div>
              <div class="sig-bar"></div>
              <strong>{{ fullOwnerName }}</strong>
              <div class="loi-contact-details">
                <span>{{ mainAddressString }}</span><br />
                <span>Mobile: {{ appData.mobileNo || appData.contact || '09932889970' }}</span>
              </div>
            </div>

            <div class="dossier-page-foot">
              <span>Municipality of Manticao &bull; Letter of Intent</span>
              <span>Official Attachment</span>
            </div>
          </div>
        </div>

        <!-- ========================================================
             DOCUMENT 3: UNIFIED APPLICATION FORM FOR STALL RENTAL
             (3 Pages with Sections I - VI, Eyana, Magdayo, Mayor Tan)
             ======================================================== -->
        <div v-if="activeTab === 'all' || activeTab === 'rental'" class="dossier-doc-block">
          <!-- Page 1 of Stall Rental Form -->
          <div class="dossier-page page-break-after">
            <div class="rental-header-block">
              <p class="r-h1">REPUBLIC OF THE PHILIPPINES</p>
              <p class="r-h2">PROVINCE OF MISAMIS ORIENTAL</p>
              <h1 class="r-h3">MUNICIPALITY OF MANTICAO</h1>
              <h2 class="r-h4">MANTICAO PUBLIC MARKET</h2>
              <div class="r-doc-badge">UNIFIED APPLICATION FORM FOR STALL RENTAL/OCCUPANCY</div>
            </div>

            <div class="meta-two-col">
              <div><span class="lbl-dim">Application No.:</span> <strong class="font-mono">{{ appData.applicationNo || 'APP-2026-0782' }}</strong></div>
              <div><span class="lbl-dim">Date Filed:</span> <strong>{{ formatDate(appData.submittedAt || new Date()) }}</strong></div>
            </div>

            <!-- Section I -->
            <div class="doc-sec-box">
              <div class="doc-sec-title">I. APPLICANT'S INFORMATION</div>
              <div class="doc-sec-content">
                <div class="grid-2-col">
                  <div><span class="sec-label">Full Name:</span> <strong>{{ fullOwnerName }}</strong></div>
                  <div><span class="sec-label">Contact Number:</span> <strong>{{ appData.mobileNo || appData.contact || '09932889970' }}</strong></div>
                </div>
                <div class="full-field">
                  <span class="sec-label">Residential Address:</span>
                  <strong>{{ mainAddressString }}</strong>
                </div>
                <div class="grid-2-col">
                  <div><span class="sec-label">Valid ID Presented:</span> <strong>{{ appData.validIdType || 'National ID (PhilSys)' }}</strong></div>
                  <div><span class="sec-label">ID No.:</span> <strong class="font-mono">{{ appData.validIdNo || '1234-5678-9012-3456' }}</strong></div>
                </div>
              </div>
            </div>

            <!-- Section II -->
            <div class="doc-sec-box">
              <div class="doc-sec-title">II. BUSINESS INFORMATION TO BE ENGAGED</div>
              <div class="doc-sec-content">
                <div class="full-field">
                  <span class="sec-label">Business / Trade Name:</span>
                  <strong>{{ appData.tradeNameFranchise || appData.businessName || 'ABUHAN FISH VENDOR STALL' }}</strong>
                </div>
                <div class="sec-item">
                  <span class="sec-label">Nature of Business:</span>
                  <div class="sub-checks-row">
                    <span class="check-tag"><span class="box-ch">✓</span> Retail</span>
                    <span class="check-tag"><span class="box-ch"> </span> Wholesale</span>
                    <span class="check-tag"><span class="box-ch"> </span> Food/Cooked Food</span>
                    <span class="check-tag"><span class="box-ch"> </span> Meat</span>
                    <span class="check-tag"><span class="box-ch">✓</span> Fish</span>
                    <span class="check-tag"><span class="box-ch"> </span> Fruits &amp; Vegetables</span>
                    <span class="check-tag"><span class="box-ch"> </span> Dry Goods</span>
                    <span class="check-tag"><span class="box-ch"> </span> Grocery</span>
                  </div>
                </div>
                <div class="full-field">
                  <span class="sec-label">Products / Commodities to be Sold:</span>
                  <strong>{{ appData.commodities || 'Fresh Fish and Marine Seafood Products' }}</strong>
                </div>
                <div class="grid-3-col">
                  <div><span class="sec-label">Stall Space Type:</span> <strong>{{ appData.stallSpaceType || 'Regular Stall' }}</strong></div>
                  <div><span class="sec-label">Target Stall:</span> <strong>{{ appData.preferredStallNo || 'Stall #WS-01' }}</strong></div>
                  <div><span class="sec-label">Estimated Employees:</span> <strong>{{ appData.estimatedEmployees || 1 }} personnel</strong></div>
                </div>
              </div>
            </div>

            <!-- Section III -->
            <div class="doc-sec-box">
              <div class="doc-sec-title">III. APPLICATION</div>
              <div class="doc-sec-content statutory-body">
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
            </div>

            <div class="dossier-page-foot">
              <span>Manticao Public Market &bull; Unified Application Form for Stall Rental/Occupancy</span>
              <span>Page 1 of 3</span>
            </div>
          </div>

          <!-- Page 2 of Stall Rental Form: IV, V, VI (A & B) -->
          <div class="dossier-page page-break-after">
            <!-- Section IV -->
            <div class="doc-sec-box">
              <div class="doc-sec-title">IV. DOCUMENTARY REQUIREMENTS</div>
              <div class="doc-sec-content">
                <div class="check-line"><span class="box-ch">✓</span> <span>Accomplished Unified Application Form (Auto-generated by system)</span></div>
                <div class="check-line"><span class="box-ch">✓</span> <span>Photocopy of Valid Government-Issued ID ({{ appData.validIdType || 'National ID' }})</span></div>
                <div class="check-line"><span class="box-ch">✓</span> <span>Letter of Intent addressed to Hon. Mayor Stephen S. Tan</span></div>
              </div>
            </div>

            <!-- Section V -->
            <div class="doc-sec-box">
              <div class="doc-sec-title">V. UNDERTAKING OF APPLICANT</div>
              <div class="doc-sec-content statutory-body">
                <ol class="undertaking-num-list">
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
                <p class="stat-em">
                  <em>I understand that approval of this application does not constitute ownership of the stall or market property and that occupancy is subject to applicable laws, ordinances, rules, regulations, and terms and conditions imposed by the Municipal Government of Manticao.</em>
                </p>

                <div class="sig-row-flex" style="margin-top: 1rem;">
                  <div class="sig-block-col">
                    <div class="hand-sig font-script">{{ fullOwnerName }}</div>
                    <div class="sig-bar"></div>
                    <strong>{{ fullOwnerName }}</strong>
                    <span class="sig-sub">APPLICANT'S SIGNATURE</span>
                  </div>
                  <div class="sig-block-col">
                    <div class="hand-sig font-script">{{ formatDate(appData.submittedAt || new Date()) }}</div>
                    <div class="sig-bar"></div>
                    <strong>{{ formatDate(appData.submittedAt || new Date()) }}</strong>
                    <span class="sig-sub">DATE</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section VI: Parts A & B -->
            <div class="doc-sec-box">
              <div class="doc-sec-title">VI. EVALUATION AND RECOMMENDATION</div>
              <div class="doc-sec-content">
                <!-- Part A: Market Office -->
                <div class="eval-strip-block">
                  <div class="eval-block-title">A. MARKET OFFICE EVALUATION</div>
                  <div class="grid-2-col">
                    <div><span class="sec-label">Application Status:</span> <strong>Complete (Endorsed)</strong></div>
                    <div><span class="sec-label">Stall/Space Recommended:</span> <strong class="font-mono text-blue-900">{{ appData.preferredStallNo || 'Stall #WS-01' }}</strong></div>
                  </div>
                  <div class="grid-2-col">
                    <div><span class="sec-label">Market Section:</span> <strong>Wet Section (Fish &amp; Meat)</strong></div>
                    <div><span class="sec-label">Nature of Business:</span> <strong>Fish Vendor Trade</strong></div>
                  </div>
                  <div><span class="sec-label">Remarks:</span> <em class="text-blue-800 font-bold">FISH VENDOR OK &bull; Verified by Edgar Eyana</em></div>
                </div>

                <!-- Part B: Treasury Assessment -->
                <div class="eval-strip-block" style="margin-top: 8px;">
                  <div class="eval-block-title">B. ASSESSMENT AND TREASURY RECOMMENDATION</div>
                  <div class="grid-3-col">
                    <div><span class="sec-label">Monthly Rental:</span> <strong class="font-mono">₱ {{ formatMoney(displayMonthlyRent) }}</strong></div>
                    <div><span class="sec-label">Stall Rights Fee:</span> <strong class="font-mono">₱ 5,000.00</strong></div>
                    <div><span class="sec-label">2-Month Advance:</span> <strong class="font-mono">₱ {{ formatMoney(displayMonthlyRent * 2) }}</strong></div>
                  </div>
                  <div class="grid-2-col" style="margin-top: 4px;">
                    <div><span class="sec-label">Total Amount Due:</span> <strong class="font-mono text-emerald-800 text-base">₱ {{ formatMoney(displayMonthlyRent * 3 + 5000) }}</strong></div>
                    <div><span class="sec-label">Treasury Examiner:</span> <strong>NAIDA BEBETH A. MAGDAYO / J. ANDANA</strong></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="dossier-page-foot">
              <span>Manticao Public Market &bull; Unified Application Form for Stall Rental/Occupancy</span>
              <span>Page 2 of 3</span>
            </div>
          </div>

          <!-- Page 3 of Stall Rental Form: VI (C, D, E, F) Sign-offs -->
          <div class="dossier-page">
            <div class="doc-sec-box">
              <div class="doc-sec-title">VI. EVALUATION AND RECOMMENDATION (CONTINUED)</div>
              <div class="doc-sec-content">
                <!-- Part C: Final Recommendation -->
                <div class="eval-strip-block">
                  <div class="eval-block-title">C. FINAL RECOMMENDATION</div>
                  <p class="text-xs text-slate-600">Based on the evaluation of the Market Office and the assessment of the Municipal Treasurer:</p>
                  <div class="check-line"><span class="box-ch">✓</span> <strong>RECOMMENDED FOR APPROVAL</strong></div>
                  <div class="sign-off-dual-row" style="margin-top: 14px;">
                    <div class="sign-off-person">
                      <div class="hand-sig font-script">NAIDA BEBETH A. MAGDAYO</div>
                      <div class="sig-bar"></div>
                      <strong>NAIDA BEBETH A. MAGDAYO</strong>
                      <span class="sig-sub">MUNICIPAL TREASURER</span>
                    </div>
                    <div class="sign-off-person">
                      <div class="hand-sig font-script">EDGAR EYANA</div>
                      <div class="sig-bar"></div>
                      <strong>MR. EDGAR EYANA</strong>
                      <span class="sig-sub">MARKET SUPERVISOR / ADMINISTRATOR</span>
                    </div>
                  </div>
                </div>

                <!-- Part D: Mayor Approval -->
                <div class="eval-strip-block" style="margin-top: 12px; border: 1.5px solid #1e3a8a;">
                  <div class="eval-block-title" style="color: #1e3a8a;">D. APPROVAL OF THE MUNICIPAL MAYOR</div>
                  <p class="text-xs text-slate-600">Upon review of the application, supporting documents, evaluation, and recommendations:</p>
                  <div class="check-line"><span class="box-ch">✓</span> <strong class="text-blue-900">APPROVED</strong></div>
                  <div class="mayor-sig-center" style="margin-top: 16px; text-align: center;">
                    <div class="hand-sig font-script text-lg" style="color: #1e3a8a;">HON. STEPHEN S. TAN</div>
                    <div class="sig-bar" style="width: 240px; margin: 4px auto;"></div>
                    <strong style="color: #1e3a8a; font-size: 13px;">HON. STEPHEN S. TAN</strong><br />
                    <span class="sig-sub">MUNICIPAL MAYOR &bull; MANTICAO, MISAMIS ORIENTAL</span>
                  </div>
                </div>

                <!-- Part E: Stall Assignment and Payment -->
                <div class="eval-strip-block" style="margin-top: 12px;">
                  <div class="eval-block-title">E. STALL ASSIGNMENT AND PAYMENT</div>
                  <div class="grid-3-col">
                    <div><span class="sec-label">Assigned Stall:</span> <strong class="font-mono">{{ appData.preferredStallNo || 'Stall #WS-01' }}</strong></div>
                    <div><span class="sec-label">Market Section:</span> <strong>Wet Section (Fish)</strong></div>
                    <div><span class="sec-label">Monthly Rental:</span> <strong class="font-mono">₱ {{ formatMoney(displayMonthlyRent) }}</strong></div>
                  </div>
                  <div class="grid-3-col" style="margin-top: 4px;">
                    <div><span class="sec-label">Official Receipt No.:</span> <strong class="font-mono text-emerald-800">3675241</strong></div>
                    <div><span class="sec-label">Date of Payment:</span> <strong>{{ formatDate(new Date()) }}</strong></div>
                    <div><span class="sec-label">Amount Paid:</span> <strong class="font-mono">₱ {{ formatMoney(displayMonthlyRent * 3 + 5000) }}</strong></div>
                  </div>
                </div>

                <!-- Part F: Applicant Acknowledgment -->
                <div class="eval-strip-block" style="margin-top: 12px; background: #eff6ff; border: 1.5px solid #93c5fd;">
                  <div class="eval-block-title" style="color: #1d4ed8;">F. ACKNOWLEDGMENT OF APPLICANT</div>
                  <p class="text-xs text-slate-700" style="margin-bottom: 10px;">
                    I acknowledge that the approval of this application authorizes me to occupy only the assigned stall/space and does not constitute ownership of the stall or market property. I agree to comply with all applicable laws, municipal ordinances, market rules and regulations, rental conditions, sanitation requirements, and payment obligations.
                  </p>
                  <div class="sig-row-flex">
                    <div class="sig-block-col">
                      <div class="hand-sig font-script">{{ fullOwnerName }}</div>
                      <div class="sig-bar"></div>
                      <strong>{{ fullOwnerName }}</strong>
                      <span class="sig-sub">APPLICANT'S SIGNATURE</span>
                    </div>
                    <div class="sig-block-col">
                      <div class="hand-sig font-script">{{ formatDate(new Date()) }}</div>
                      <div class="sig-bar"></div>
                      <strong>{{ formatDate(new Date()) }}</strong>
                      <span class="sig-sub">DATE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="dossier-page-foot">
              <span>Manticao Public Market &bull; Unified Application Form for Stall Rental/Occupancy</span>
              <span>Page 3 of 3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { exportToWord, exportToPdf } from '../utils/exportUtils'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  appData: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['close'])

const activeTab = ref('all') // 'all', 'permit', 'rental', 'loi'

const ownerSurname = computed(() => {
  return props.appData.ownerSurname || props.appData.lastName || 'ABUHAN'
})

const ownerGivenName = computed(() => {
  return props.appData.ownerGivenName || props.appData.firstName || 'RISMA'
})

const ownerMiddleName = computed(() => {
  return props.appData.ownerMiddleName || props.appData.middleName || 'PORCO'
})

const fullOwnerName = computed(() => {
  const parts = [ownerGivenName.value, ownerMiddleName.value ? `${ownerMiddleName.value[0]}.` : '', ownerSurname.value].filter(Boolean)
  return parts.join(' ').toUpperCase()
})

const mainAddressString = computed(() => {
  if (props.appData.address) return props.appData.address
  const parts = [
    props.appData.mainStreet || 'P-4',
    props.appData.mainBarangay || 'POBLACION',
    props.appData.mainMunicipality || 'MANTICAO',
    props.appData.mainProvince || 'MISAMIS OR.',
    props.appData.mainZipCode || '9024'
  ].filter(Boolean)
  return parts.join(', ')
})

const locAddressString = computed(() => {
  if (props.appData.locSameAsMain) return mainAddressString.value
  const parts = [
    props.appData.locStreet || 'P-4',
    props.appData.locBarangay || 'POBLACION',
    props.appData.locMunicipality || 'MANTICAO',
    props.appData.locProvince || 'MISAMIS OR.',
    props.appData.locZipCode || '9024'
  ].filter(Boolean)
  return parts.join(', ')
})

const activeLines = computed(() => {
  if (Array.isArray(props.appData.businessLines) && props.appData.businessLines.length > 0) {
    return props.appData.businessLines
  }
  return [
    {
      lineOfBusiness: props.appData.businessType || 'Fish Vendor / Wet Section Trade',
      psicCode: '47211',
      productsServices: props.appData.commodities || 'Fresh Fish and Marine Products',
      numUnits: 1,
      capitalization: 50000,
      grossSales: 0
    }
  ]
})

const displayMonthlyRent = computed(() => {
  return Number(props.appData.monthlyRent || props.appData.treasuryMonthlyRent || 1500)
})

function isType(val) {
  const cur = props.appData.applicationType || 'NEW'
  return String(cur).toUpperCase() === String(val).toUpperCase()
}

function isPay(val) {
  const cur = props.appData.paymentMode || 'Annually'
  return String(cur).toLowerCase() === String(val).toLowerCase()
}

function isOrg(val) {
  const cur = props.appData.orgType || 'Sole Proprietor'
  return String(cur).toLowerCase() === String(val).toLowerCase()
}

function isGender(val) {
  const cur = props.appData.orgGender || 'Female'
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

function handleDownload() {
  const name = `Manticao_Market_Dossier_${props.appData.trackingNumber || props.appData.applicationNo || '2026'}`
  exportToPdf('#printable-unified-dossier', name, { title: 'Official Market Tenancy & Business Permit Dossier' })
}

function handleExportWord() {
  const name = `Manticao_Market_Dossier_${props.appData.trackingNumber || props.appData.applicationNo || '2026'}`
  exportToWord('#printable-unified-dossier', name, { title: 'Official Market Tenancy & Business Permit Dossier' })
}
</script>

<style scoped>
.dossier-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  overflow-y: auto;
}

.dossier-modal-shell {
  background: #f1f5f9;
  border-radius: 16px;
  width: 100%;
  max-width: 1040px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dossier-toolbar {
  background: #0f172a;
  color: white;
  padding: 16px 20px;
  border-bottom: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dossier-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.4);
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  width: fit-content;
}

.dossier-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #f8fafc;
}

.dossier-ref {
  font-size: 12px;
  color: #94a3b8;
}

.toolbar-nav-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.nav-tab-btn {
  background: #1e293b;
  color: #cbd5e1;
  border: 1px solid #334155;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.nav-tab-btn:hover {
  background: #334155;
  color: white;
}

.nav-tab-btn.active {
  background: #2563eb;
  color: white;
  border-color: #3b82f6;
  box-shadow: 0 0 10px rgba(37, 99, 235, 0.5);
}

.toolbar-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-tb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-tb.word {
  background: #1e3a8a;
  color: white;
}

.btn-tb.word:hover {
  background: #1d4ed8;
}

.btn-tb.print {
  background: #059669;
  color: white;
}

.btn-tb.print:hover {
  background: #047857;
}

.btn-tb.download {
  background: #b91c1c;
  color: white;
}

.btn-tb.download:hover {
  background: #1d4ed8;
}

.btn-tb.close {
  background: #334155;
  color: #e2e8f0;
}

.btn-tb.close:hover {
  background: #475569;
}

.dossier-viewport {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: #e2e8f0;
  max-height: calc(90vh - 120px);
  overflow-y: auto;
}

.dossier-page {
  background: #ffffff;
  color: #0f172a;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: 30px 36px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 11px;
  line-height: 1.35;
  border: 1px solid #cbd5e1;
  position: relative;
}

.permit-header-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: center;
  border-bottom: 2px solid #0f172a;
  padding-bottom: 8px;
  margin-bottom: 10px;
}

.seal-svg-mini {
  width: 54px;
  height: 54px;
}

.center-texts .h-p1 { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
.center-texts .h-p2 { font-size: 9px; }
.center-texts .h-p3 { font-size: 12px; font-weight: 800; }
.center-texts .h-p4 { font-size: 9px; font-weight: 700; color: #1e3a8a; }
.center-texts .h-title { font-size: 14px; font-weight: 900; margin: 4px 0 0; letter-spacing: -0.2px; }

.meta-strip-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1.8fr;
  border: 1.5px solid #0f172a;
  padding: 6px 10px;
  margin-bottom: 10px;
  font-size: 10.5px;
  gap: 8px;
}

.box-ch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
  border: 1.5px solid #0f172a;
  font-size: 11px;
  font-weight: 900;
  color: #1e3a8a;
  margin-right: 4px;
  background: white;
}

.check-line {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}

.meta-num {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lbl-dim {
  color: #64748b;
  font-size: 10px;
}

.doc-sec-box {
  border: 1.5px solid #0f172a;
  margin-bottom: 10px;
}

.doc-sec-title {
  background: #0f172a;
  color: white;
  font-weight: 800;
  font-size: 10.5px;
  padding: 3px 8px;
  text-transform: uppercase;
}

.doc-sec-content {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sec-label {
  font-size: 10px;
  color: #475569;
  display: block;
}

.grid-2-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.grid-3-col {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.grid-4-col {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.sub-checks-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
}

.check-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
}

.table-wrap-box {
  margin-top: 4px;
}

.dossier-inner-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}

.dossier-inner-table th,
.dossier-inner-table td {
  border: 1px solid #cbd5e1;
  padding: 4px 6px;
}

.dossier-inner-table th {
  background: #f1f5f9;
  font-weight: 800;
  text-align: left;
}

.perjury-stat-box {
  border: 1px dashed #64748b;
  padding: 6px 8px;
  background: #fafafa;
  margin-top: 6px;
}

.perjury-p {
  font-size: 9.5px;
  text-align: justify;
  margin: 0 0 8px;
  color: #334155;
}

.sig-row-flex {
  display: flex;
  justify-content: space-around;
  gap: 16px;
}

.sig-block-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 45%;
}

.hand-sig {
  font-size: 14px;
  color: #1e3a8a;
  min-height: 18px;
}

.sig-bar {
  width: 100%;
  border-bottom: 1.5px solid #0f172a;
  margin: 2px 0 3px;
}

.sig-sub {
  font-size: 8.5px;
  color: #64748b;
  text-transform: uppercase;
}

.fees-dual-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 10px;
}

.receipt-callout-panel {
  border: 1.5px solid #059669;
  background: #ecfdf5;
  padding: 8px;
  border-radius: 6px;
}

.rc-header {
  font-size: 9.5px;
  font-weight: 800;
  color: #065f46;
  margin-bottom: 4px;
}

.rc-or-number {
  font-size: 14px;
  font-weight: 900;
  font-family: monospace;
  color: #065f46;
}

.rc-total-paid {
  font-size: 11px;
  margin-top: 2px;
}

.rc-examiner, .rc-office {
  font-size: 9px;
  color: #047857;
}

.rc-divider {
  border-top: 1px dashed #6ee7b7;
  margin: 6px 0;
}

.rc-sworn-title {
  font-size: 9px;
  font-weight: 800;
  color: #065f46;
}

.rc-sworn-p {
  font-size: 8.5px;
  margin: 2px 0 4px;
  color: #065f46;
}

.rc-months-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 8.5px;
  color: #047857;
}

.market-office-verified-row td {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.bplo-approval-strip {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  border: 1.5px solid #0f172a;
  padding: 8px;
  margin-top: 6px;
}

.bplo-sig-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  justify-content: center;
}

.bplo-sketch-side {
  border-left: 1px solid #cbd5e1;
  padding-left: 10px;
}

.sketch-label {
  font-size: 8.5px;
  font-weight: 800;
  color: #475569;
  margin-bottom: 4px;
}

.sketch-box-inner {
  border: 1px dashed #94a3b8;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: #f8fafc;
}

.sketch-sub {
  font-size: 8px;
  color: #64748b;
}

.dossier-mini-head {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  font-weight: 800;
  color: #64748b;
  border-bottom: 1px solid #cbd5e1;
  padding-bottom: 3px;
  margin-bottom: 8px;
}

.dossier-page-foot {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #e2e8f0;
  margin-top: 8px;
  padding-top: 4px;
  font-size: 8px;
  color: #94a3b8;
}

/* Letter of Intent styling */
.loi-paper-sheet {
  padding: 48px 56px;
  font-size: 12px;
  line-height: 1.6;
}

.loi-formal-title {
  text-align: center;
  font-size: 16px;
  font-weight: 900;
  margin: 0;
  letter-spacing: 0.5px;
}

.loi-formal-sub {
  display: block;
  text-align: center;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 24px;
}

.loi-date-line {
  margin-bottom: 20px;
  font-weight: 600;
}

.loi-addressee {
  margin-bottom: 20px;
  line-height: 1.4;
}

.loi-subject-line {
  margin-bottom: 20px;
  border-bottom: 1.5px solid #0f172a;
  padding-bottom: 4px;
}

.loi-body-content p {
  margin-bottom: 14px;
  text-align: justify;
}

.loi-signoff-block {
  margin-top: 36px;
  width: 260px;
}

/* Stall Rental Header */
.rental-header-block {
  text-align: center;
  margin-bottom: 12px;
}

.r-h1, .r-h2 { font-size: 9px; margin: 0; letter-spacing: 0.5px; }
.r-h3 { font-size: 13px; font-weight: 800; margin: 2px 0 0; }
.r-h4 { font-size: 10px; font-weight: 700; color: #1e3a8a; margin: 0; }
.r-doc-badge {
  display: inline-block;
  background: #0f172a;
  color: white;
  padding: 3px 12px;
  font-size: 10px;
  font-weight: 800;
  margin-top: 6px;
}

.meta-two-col {
  display: flex;
  justify-content: space-between;
  border-bottom: 1.5px solid #0f172a;
  padding-bottom: 4px;
  margin-bottom: 10px;
}

.statutory-body {
  font-size: 9.5px;
  line-height: 1.45;
}

.undertaking-num-list {
  padding-left: 18px;
  margin: 4px 0 8px;
}

.undertaking-num-list li {
  margin-bottom: 3px;
}

.stat-em {
  font-size: 9px;
  color: #475569;
}

.eval-strip-block {
  border: 1px solid #cbd5e1;
  padding: 6px 8px;
  background: #f8fafc;
}

.eval-block-title {
  font-size: 9.5px;
  font-weight: 800;
  color: #334155;
  margin-bottom: 4px;
}

.sign-off-dual-row {
  display: flex;
  justify-content: space-around;
  gap: 16px;
}

.sign-off-person {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 45%;
}

/* PRINT MEDIA */
@media print {
  @page {
    size: letter portrait;
    margin: 8mm;
  }

  body * {
    visibility: hidden;
  }

  .no-print {
    display: none !important;
  }

  #printable-unified-dossier, #printable-unified-dossier * {
    visibility: visible;
  }

  .dossier-modal-backdrop {
    position: static !important;
    background: transparent !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  .dossier-modal-shell {
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    width: 100% !important;
    max-width: 100% !important;
    border-radius: 0 !important;
  }

  .dossier-viewport {
    padding: 0 !important;
    background: transparent !important;
    max-height: none !important;
    overflow: visible !important;
    gap: 0 !important;
  }

  .dossier-page {
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .page-break-after {
    page-break-after: always !important;
    break-after: page !important;
  }
}
</style>
