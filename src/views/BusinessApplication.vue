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
        <button type="button" class="btn-view-progress" @click="router.push({ path: '/stakeholder', query: { section: 'application' } })">
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
        <!-- A. Personal Information -->
        <div class="form-section-card">
          <div class="section-card-header">
            <i class="pi pi-user"></i>
            <div>
              <h3>A. Personal Information</h3>
              <p>Applicant's full legal name and official contact coordinates</p>
            </div>
          </div>

          <div class="row three">
            <div class="field">
              <label>First Name <span class="required-star">*</span></label>
              <input v-model="firstName" type="text" placeholder="e.g. Juan" required />
            </div>

            <div class="field">
              <label>Middle Name <small class="optional-label">(Optional)</small></label>
              <input v-model="middleName" type="text" placeholder="e.g. Dela" />
            </div>

            <div class="field">
              <label>Last Name <span class="required-star">*</span></label>
              <input v-model="lastName" type="text" placeholder="e.g. Cruz" required />
            </div>
          </div>

          <div class="row two">
            <div class="field">
              <label>Contact Number <span class="required-star">*</span></label>
              <input v-model="contact" type="text" placeholder="09XXXXXXXXX" required />
            </div>

            <div class="field">
              <label>Email Address <span class="required-star">*</span></label>
              <input v-model="email" type="email" placeholder="juan@example.com" required />
            </div>
          </div>

          <div class="row">
            <div class="field">
              <label>Residential Address <span class="required-star">*</span></label>
              <input v-model="address" type="text" placeholder="Manticao, Misamis Oriental" required />
            </div>
          </div>
        </div>

        <!-- B. Business Information -->
        <div class="form-section-card">
          <div class="section-card-header">
            <i class="pi pi-briefcase"></i>
            <div>
              <h3>B. Business Information</h3>
              <p>Proposed commercial enterprise and stall preference details</p>
            </div>
          </div>

          <div class="row two">
            <div class="field">
              <label>Business Name <span class="required-star">*</span></label>
              <input v-model="businessName" type="text" placeholder="e.g. Cruz Vegetable Store" required />
            </div>

            <div class="field">
              <label>Business Type <span class="required-star">*</span></label>
              <select v-model="businessType" class="stall-select-input" required>
                <option value="" disabled>-- Select Business Type --</option>
                <option value="Vegetables & Fruits">Vegetables & Fruits</option>
                <option value="Fish & Seafood">Fish & Seafood</option>
                <option value="Meat & Poultry">Meat & Poultry</option>
                <option value="Dry Goods & Grocery">Dry Goods & Grocery</option>
                <option value="Apparel & Footwear">Apparel & Footwear</option>
                <option value="Food & Cooked Meals">Food & Cooked Meals</option>
                <option value="General Merchandise">General Merchandise</option>
                <option value="Other Commercial Services">Other Commercial Services</option>
              </select>
            </div>
          </div>

          <div class="row two">
            <div class="field">
              <label>Preferred Market Zone</label>
              <select v-model="preferredZone" class="stall-select-input">
                <option value="">-- Select Preferred Zone (Optional) --</option>
                <option value="Zone A - Wet Market (Fish & Meat)">Zone A - Wet Market (Fish & Meat)</option>
                <option value="Zone B - Vegetables & Fruits">Zone B - Vegetables & Fruits</option>
                <option value="Zone C - Dry Goods & Apparel">Zone C - Dry Goods & Apparel</option>
                <option value="Zone D - Food Stalls & Refreshments">Zone D - Food Stalls & Refreshments</option>
              </select>
            </div>

            <div class="field">
              <label>Requested Stall Size</label>
              <select v-model="requestedSize" class="stall-select-input">
                <option value="Standard (2m x 2m)">Standard (2m x 2m)</option>
                <option value="Medium (3m x 3m)">Medium (3m x 3m)</option>
                <option value="Large Corner (4m x 4m)">Large Corner (4m x 4m)</option>
              </select>
            </div>
          </div>

          <div class="row">
            <div class="field">
              <label>Preferred Stall <span class="required-star">*</span></label>
              <select v-model="selectedStallId" class="stall-select-input" required>
                <option :value="null" disabled>-- Select a vacant stall request --</option>
                <option v-for="st in availableStalls" :key="st.id" :value="st.id">
                  Stall #{{ st.stallNo }} &bull; {{ st.stallType }} &bull; ₱{{ Number(st.monthlyRent || 0).toLocaleString() }}/month
                </option>
              </select>
              <div class="field-help-text">
                <i class="pi pi-info-circle"></i>
                <em>Note: The preferred stall is a request, not a confirmed assignment. The Market Supervisor will verify availability and record the actual assignment upon review.</em>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="field">
              <label>Proposed Business Description</label>
              <textarea
                v-model="businessDescription"
                rows="3"
                class="form-textarea"
                placeholder="Brief description of the products or services you intend to sell..."
              ></textarea>
            </div>
          </div>

          <!-- Live Fee Calculation Notice -->
          <div v-if="chosenStallInfo" class="stall-calc-callout">
            <div class="calc-icon-circle">
              <i class="pi pi-calculator"></i>
            </div>
            <div class="calc-details">
              <div class="calc-header-row">
                <span class="calc-stall-name">Requested Stall: <strong>Stall {{ chosenStallInfo.stallNo }}</strong> ({{ chosenStallInfo.stallType }})</span>
                <span class="calc-badge">Authorized Fee Schedule</span>
              </div>
              <div class="calc-numbers-grid">
                <div class="num-item">
                  <span class="lbl">Monthly Rental Rate</span>
                  <strong class="val">₱{{ Number(chosenStallInfo.monthlyRent || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }} / mo</strong>
                </div>
                <div class="num-item">
                  <span class="lbl">Two-Month Advance Rent Deposit</span>
                  <strong class="val highlight">₱{{ (Number(chosenStallInfo.monthlyRent || 0) * 2).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</strong>
                </div>
                <div class="num-item">
                  <span class="lbl">Stall Rights Fee (One-time)</span>
                  <strong class="val">₱5,000.00</strong>
                </div>
              </div>
              <p class="calc-note">
                <i class="pi pi-lock"></i>
                Rental and rights fee amounts are fixed by the official municipal fee schedule. You are not required to enter payment amounts manually.
              </p>
            </div>
          </div>
        </div>

        <!-- C. Application Declaration -->
        <div class="form-section-card declaration-card">
          <div class="declaration-checkbox-row">
            <input
              id="declarationCheck"
              v-model="declarationAgreed"
              type="checkbox"
              class="custom-checkbox"
            />
            <label for="declarationCheck" class="declaration-label">
              <strong>I confirm that the information I provided is correct and complete.</strong>
              <span>I understand that any false statement may be grounds for rejection or revocation of market stall lease rights in accordance with the Manticao Market Operations Ordinance.</span>
            </label>
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
            <strong>Upload Official Application Requirements:</strong>
            <p>Please upload a clear scan or photograph of each required document in PDF, PNG, or JPEG format (max 15MB each).</p>
          </div>
        </div>

        <!-- Document 1: Letter of Intent (LOI) -->
        <div class="doc-upload-card">
          <div class="doc-card-top">
            <div class="doc-icon-wrap">
              <i class="pi pi-file-edit"></i>
            </div>
            <div class="doc-info">
              <div class="doc-title-row">
                <span class="doc-title">Document 1: Letter of Intent (LOI)</span>
                <span class="doc-status-badge" :class="getDocStatusClass('loi')">
                  {{ getDocStatusLabel('loi') }}
                </span>
              </div>
              <p class="doc-desc">
                Required &bull; PDF or accepted image format. A letter expressing your intention to rent a public market stall. It must follow the LGU's requirements, including Mayor's signature or approval evidence where applicable.
              </p>
              <div v-if="existingApplication?.loiUrl" class="existing-doc-link">
                <a :href="existingApplication.loiUrl" target="_blank" rel="noopener noreferrer">
                  <i class="pi pi-external-link"></i> View current LOI on file
                </a>
              </div>
            </div>
          </div>

          <div class="doc-actions-row">
            <input
              ref="loiFileInput"
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              style="display: none;"
              @change="handleFileSelected($event, 'letter')"
            />

            <button type="button" class="btn-doc-action" @click="loiFileInput?.click()">
              <i class="pi pi-upload"></i>
              <span>{{ letterFile ? 'Replace File' : 'Choose File' }}</span>
            </button>

            <button
              v-if="letterFile || letterPreviewUrl"
              type="button"
              class="btn-doc-action"
              @click="openPreview('loi')"
            >
              <i class="pi pi-eye"></i>
              <span>Preview</span>
            </button>

            <button
              v-if="letterFile"
              type="button"
              class="btn-doc-action danger"
              @click="removeFile('letter')"
            >
              <i class="pi pi-trash"></i>
              <span>Remove</span>
            </button>
          </div>

          <div v-if="letterFile" class="file-chosen-notice">
            <i class="pi pi-check"></i>
            <span>Ready for submission: <strong>{{ letterFile.name }}</strong> ({{ (letterFile.size / 1024).toFixed(1) }} KB)</span>
          </div>
        </div>

        <!-- Document 2: Valid Government ID -->
        <div class="doc-upload-card">
          <div class="doc-card-top">
            <div class="doc-icon-wrap">
              <i class="pi pi-id-card"></i>
            </div>
            <div class="doc-info">
              <div class="doc-title-row">
                <span class="doc-title">Document 2: Valid Government Identification (Valid ID)</span>
                <span class="doc-status-badge" :class="getDocStatusClass('id')">
                  {{ getDocStatusLabel('id') }}
                </span>
              </div>
              <p class="doc-desc">
                Required &bull; Accepted image or PDF format. A clear copy of the applicant's accepted identification document (Driver's License, UMID, National ID, Passport, or Voter's ID).
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

            <button type="button" class="btn-doc-action" @click="idFileInput?.click()">
              <i class="pi pi-upload"></i>
              <span>{{ idFile ? 'Replace File' : 'Choose File' }}</span>
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

          <div v-if="idFile" class="file-chosen-notice">
            <i class="pi pi-check"></i>
            <span>Ready for submission: <strong>{{ idFile.name }}</strong> ({{ (idFile.size / 1024).toFixed(1) }} KB)</span>
          </div>
        </div>

        <div class="notice-callout">
          <i class="pi pi-shield"></i>
          <div>
            <strong>Official Review Rule:</strong> Uploading an LOI is not the same as having an approved LOI. Authorized LGU personnel will review the uploaded Letter of Intent and record the official Mayor's approval decision.
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
                <th class="table-section-header" colspan="2">Applicant Details</th>
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
                <th class="table-section-header" colspan="2">Business Information</th>
              </tr>
              <tr>
                <td class="lbl-col">Business Name</td>
                <td class="val-col"><strong>{{ businessName }}</strong></td>
              </tr>
              <tr>
                <td class="lbl-col">Business Type</td>
                <td class="val-col">{{ businessType }}</td>
              </tr>
              <tr>
                <td class="lbl-col">Preferred Market Zone</td>
                <td class="val-col">{{ preferredZone || 'Not specified' }}</td>
              </tr>
              <tr>
                <td class="lbl-col">Requested Stall Size</td>
                <td class="val-col">{{ requestedSize }}</td>
              </tr>
              <tr>
                <td class="lbl-col">Proposed Description</td>
                <td class="val-col">{{ businessDescription || 'None provided' }}</td>
              </tr>

              <tr>
                <th class="table-section-header" colspan="2">Target Market Stall Request</th>
              </tr>
              <tr>
                <td class="lbl-col">Requested Stall</td>
                <td class="val-col">
                  <strong>Stall #{{ chosenStallInfo?.stallNo || 'Selected' }}</strong> &bull; {{ chosenStallInfo?.stallType || 'Standard' }}
                  <span class="stall-note-tag">(Subject to Supervisor Verification)</span>
                </td>
              </tr>
              <tr>
                <td class="lbl-col">Authorized Monthly Rent</td>
                <td class="val-col">₱{{ Number(chosenStallInfo?.monthlyRent || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }} / month</td>
              </tr>

              <tr>
                <th class="table-section-header" colspan="2">Documents & Declaration</th>
              </tr>
              <tr>
                <td class="lbl-col">Letter of Intent (LOI)</td>
                <td class="val-col">
                  <span class="doc-status-badge uploaded">
                    <i class="pi pi-check"></i> {{ letterFile ? letterFile.name : (existingApplication?.loiUrl ? 'On File' : 'Ready') }}
                  </span>
                  <button
                    v-if="letterPreviewUrl || existingApplication?.loiUrl"
                    type="button"
                    class="btn-text-preview"
                    @click="openPreview('loi')"
                  >
                    Preview LOI
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
              <tr>
                <td class="lbl-col">Declaration</td>
                <td class="val-col">
                  <i class="pi pi-check-circle" style="color: #10b981; margin-right: 6px;"></i>
                  Confirmed by applicant
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Action Buttons Step 3 -->
        <div class="actions-bar">
          <div class="left-actions">
            <button type="button" class="btn secondary" @click="currentStep = 2">
              ← Back to Documents
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
              @click="router.push({ path: '/stakeholder', query: { section: 'application' } })"
            >
              <i class="pi pi-file"></i>
              View Application
            </button>
            <button
              type="button"
              class="btn submit"
              @click="router.push({ path: '/stakeholder', query: { section: 'application' } })"
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

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'
import { supabase } from '../config/supabase'
import { useAuthStore } from '../stores/auth'
import { useStakeholderStore } from '../stores/stakeholder'
import { getStakeholderByUserId } from '../services/applicationService'
import { fetchStalls } from '../services/stallService'
import { systemMessage } from '../utils/systemMessage'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const stakeholderStore = useStakeholderStore()

// Step state: 1 (Form), 2 (Upload Documents), 3 (Review), 4 (Submitted)
const currentStep = ref(1)

// =========================
// FORM STATE (STEP 1)
// =========================
const firstName           = ref('')
const middleName          = ref('')
const lastName            = ref('')
const contact             = ref('')
const email               = ref('')
const address             = ref('')

const businessName        = ref('')
const businessType        = ref('')
const preferredZone       = ref('')
const requestedSize       = ref('Standard (2m x 2m)')
const selectedStallId     = ref(null)
const businessDescription = ref('')

const declarationAgreed   = ref(false)

// Stalls & Application
const stallsList          = ref([])
const existingApplication = ref(null)

// Files (STEP 2)
const idFile              = ref(null)
const letterFile          = ref(null)
const idPreviewUrl        = ref(null)
const letterPreviewUrl    = ref(null)

const idFileInput         = ref(null)
const loiFileInput        = ref(null)

// Submissions state (STEP 3 & 4)
const isSubmitting        = ref(false)
const errorMessage        = ref('')
const showConfirmModal    = ref(false)
const submittedAppNumber  = ref('APP-2026-001')
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

const submittedDateFormatted = computed(() => {
  const d = submittedDate.value || new Date()
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

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

  if (!firstName.value.trim() || !lastName.value.trim()) {
    errorMessage.value = 'Please enter your full name (First name and Last name are required).'
    return
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

  if (!address.value.trim()) {
    errorMessage.value = 'Please enter your residential address.'
    return
  }

  if (!businessName.value.trim()) {
    errorMessage.value = 'Please enter your business name.'
    return
  }

  if (!businessType.value) {
    errorMessage.value = 'Please select a business type.'
    return
  }

  if (!selectedStallId.value) {
    errorMessage.value = 'Please select a preferred vacant stall.'
    return
  }

  if (!declarationAgreed.value) {
    errorMessage.value = 'Please confirm the application declaration by checking the confirmation box.'
    return
  }

  currentStep.value = 2
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function proceedToStep3() {
  errorMessage.value = ''

  const hasLoi = letterFile.value || existingApplication.value?.loiUrl
  const hasId = idFile.value || existingApplication.value?.validIdUrl

  if (!hasLoi) {
    errorMessage.value = 'Please choose and upload your Letter of Intent (LOI).'
    return
  }

  if (!hasId) {
    errorMessage.value = 'Please choose and upload your Valid Government ID.'
    return
  }

  currentStep.value = 3
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function promptSubmitModal() {
  errorMessage.value = ''
  showConfirmModal.value = true
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
      previewType.value = letterFile.value.type.includes('pdf') ? 'pdf' : 'image'
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
      contact: contact.value,
      email: email.value,
      address: address.value,
      businessName: businessName.value,
      businessType: businessType.value,
      preferredZone: preferredZone.value,
      requestedSize: requestedSize.value,
      selectedStallId: selectedStallId.value,
      businessDescription: businessDescription.value,
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
    formData.append('businessName', businessName.value)
    formData.append('businessType', businessType.value)
    formData.append('contact', contact.value)
    formData.append('email', email.value)
    formData.append('address', address.value)
    formData.append('stallId', String(selectedStallId.value))

    if (preferredZone.value) formData.append('preferredZone', preferredZone.value)
    if (requestedSize.value) formData.append('requestedSize', requestedSize.value)
    if (businessDescription.value) formData.append('businessDescription', businessDescription.value)

    if (idFile.value) formData.append('idFile', idFile.value)
    if (letterFile.value) formData.append('letterFile', letterFile.value)

    const response = await api.post(
      '/applications',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    if (!response.data?.id && !response.data?.user_id) {
      throw new Error('Application could not be saved. Please try again.')
    }

    // Set submitted metadata
    submittedAppNumber.value = response.data?.applicationNo || (response.data?.id ? `APP-2026-${String(response.data.id).padStart(3, '0')}` : 'APP-2026-001')
    submittedDate.value = new Date()

    // Clear local draft
    localStorage.removeItem('stakeholder_application_draft')
    stakeholderStore.clearCache()

    // Switch to Step 4: Submitted Success
    currentStep.value = 4
    window.scrollTo({ top: 0, behavior: 'smooth' })

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
        monthlyRent: Number(s.monthly_rent ?? s.monthlyRent ?? 1500),
        status: String(s.status || 'AVAILABLE').toUpperCase()
      }))
    } catch (stErr) {
      console.warn('[BusinessApplication] Stalls loading notice:', stErr)
    }

    // 2. Query param stall preselection
    const qStallId = route.query.stall_id || route.query.stallId
    if (qStallId) {
      selectedStallId.value = Number(qStallId)
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
        if (existing.email) email.value = existing.email
        if (existing.address) address.value = existing.address
        if (existing.businessName) businessName.value = existing.businessName
        if (existing.businessType) businessType.value = existing.businessType
        if (existing.selectedStallId && !selectedStallId.value) {
          selectedStallId.value = Number(existing.selectedStallId)
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
          if (draft.email) email.value = draft.email
          if (draft.address) address.value = draft.address
          if (draft.businessName) businessName.value = draft.businessName
          if (draft.businessType) businessType.value = draft.businessType
          if (draft.preferredZone) preferredZone.value = draft.preferredZone
          if (draft.requestedSize) requestedSize.value = draft.requestedSize
          if (draft.selectedStallId && !selectedStallId.value) selectedStallId.value = draft.selectedStallId
          if (draft.businessDescription) businessDescription.value = draft.businessDescription
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
