<template>
  <main class="progress-wrapper">
    <Toast />

    <div class="page-header">
      <div>
        <h1>Application Progress</h1>
        <p>Track your public market rental approval across each office.</p>
      </div>
      <div class="header-actions">
        <Tag
          v-if="stakeholder"
          :value="stakeholder.applicationStatus || stakeholder.application_status || 'PENDING'"
          :severity="overallSeverity"
        />
        <Button
          v-if="isFullyActivated || isDashboardReady(stakeholder, requirements)"
          label="Vendor Dashboard"
          icon="pi pi-th-large"
          severity="primary"
          size="small"
          class="font-bold shadow-xs"
          @click="router.push('/stakeholder')"
        />
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          size="small"
          :loading="isRefreshing"
          @click="loadProgress(false, true)"
        />
        <Button
          label="Log Out"
          icon="pi pi-sign-out"
          severity="danger"
          outlined
          size="small"
          class="logout-btn"
          @click="logout"
        />
      </div>
    </div>

    <!-- Application & Document Tracking Overview Card -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 mb-6 shadow-md border border-indigo-900/50">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 text-xs font-mono font-bold rounded border border-indigo-400/30">
              <i class="pi pi-file mr-1"></i> Tracking No: {{ applicationTrackingNo }}
            </span>
            <Tag :value="currentHoldingOffice" severity="info" rounded class="!text-[11px] font-bold" />
          </div>
          <h2 class="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>Current Office:</span>
            <span class="text-amber-400">{{ currentHoldingOffice }}</span>
          </h2>
          <p class="text-xs text-slate-300 mt-1 max-w-2xl">
            {{ currentOfficeAction }}
          </p>
        </div>

        <div class="flex items-center gap-3 bg-white/10 backdrop-blur px-4 py-3 rounded-xl border border-white/10 self-start md:self-auto">
          <div class="text-right">
            <span class="text-[10px] uppercase tracking-wider text-slate-300 block font-semibold">Workflow Status</span>
            <strong class="text-sm font-extrabold text-emerald-300">
              {{ stakeholder?.applicationStatus || stakeholder?.application_status || 'PENDING' }}
            </strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Official Municipal Application Documents Action Strip -->
    <div class="mb-6 bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg flex-shrink-0">
          <i class="pi pi-file-check"></i>
        </div>
        <div>
          <strong class="text-sm text-slate-800 font-bold block">Official Municipal Application Documents</strong>
          <span class="text-xs text-slate-500">
            Official stall rental application documents: 5-Page Unified Application Form and Letter of Intent to Mayor Stephen S. Tan.
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <Button
          label="Unified Application Form (5 Pages)"
          icon="pi pi-file-pdf"
          severity="primary"
          size="small"
          class="font-semibold shadow-xs"
          @click="showUnifiedFormModal = true"
        />
        <Button
          label="Letter of Intent"
          icon="pi pi-file-edit"
          severity="secondary"
          outlined
          size="small"
          class="font-semibold"
          @click="showLoiModal = true"
        />
      </div>
    </div>

    <!-- Dedicated Market Stall Selection & Advance Payment Baseline Card -->
    <div class="stall-selection-hero-card" :class="{ 'has-stall': Boolean(stallInfo) }">
      <div class="stall-hero-header">
        <div class="stall-hero-title-wrap">
          <div class="stall-hero-icon" :class="{ 'is-reserved': Boolean(stallInfo) && !isStallAssigned, 'is-active': isStallAssigned }">
            <i class="pi pi-shop"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="stall-hero-title">
                {{ stallInfo ? `Target Stall: Stall #${stallInfo.stallNo || stallInfo.number}` : 'Select Your Market Stall' }}
              </h2>
              <Tag
                v-if="stallInfo"
                :value="isStallAssigned ? 'STALL ASSIGNED (ACTIVE)' : 'RESERVED (PENDING APPROVAL)'"
                :severity="isStallAssigned ? 'success' : 'warn'"
                rounded
              />
            </div>
            <p class="stall-hero-subtitle">
              {{ stallInfo 
                  ? 'Your selected stall is reserved with occupant status PENDING. Baseline is set to 2 months advance payment.' 
                  : 'Choose an available vacant stall in Manticao Public Market to calculate your 2-month advance payment requirement.' }}
            </p>
          </div>
        </div>

        <div v-if="stallInfo && !isStallAssigned" class="stall-hero-actions">
          <Button
            label="Change Stall"
            icon="pi pi-pencil"
            severity="secondary"
            outlined
            size="small"
            @click="openSelectStallModal"
          />
        </div>
      </div>

      <!-- If stall is selected: Full Breakdown Display -->
      <div v-if="stallInfo" class="stall-details-grid">
        <div class="stall-detail-item">
          <span class="detail-label">Stall Number</span>
          <strong class="detail-val">#{{ stallInfo.stallNo || stallInfo.number }}</strong>
        </div>
        <div class="stall-detail-item">
          <span class="detail-label">Section / Classification</span>
          <strong class="detail-val">{{ stallInfo.stallType || stallInfo.section || 'Standard Stall' }}</strong>
        </div>
        <div class="stall-detail-item">
          <span class="detail-label">Monthly Rental Rate</span>
          <strong class="detail-val text-emerald-600">₱{{ Number(stallInfo.monthlyRent || stallInfo.monthly_rent || 0).toLocaleString() }}/month</strong>
        </div>
        <div class="stall-detail-item highlight-advance">
          <span class="detail-label">Required 2-Month Advance Payment</span>
          <strong class="detail-val text-amber-800">
            ₱{{ (Number(stallInfo.monthlyRent || stallInfo.monthly_rent || 0) * 2).toLocaleString() }}
            <small class="text-xs font-normal text-amber-700 block">(₱{{ Number(stallInfo.monthlyRent || stallInfo.monthly_rent || 0).toLocaleString() }}/mo × 2 months)</small>
          </strong>
        </div>
      </div>

      <!-- If NO stall is selected: Inline Stall Selector with live preview and confirm -->
      <div v-else class="stall-inline-picker">
        <div class="mb-3">
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Vacant Market Stall (Map View - Only Vacant Stalls Displayed) <span class="text-rose-500">*</span>
          </label>
          <VacantStallMapPicker
            v-model="inlineSelectedStallId"
            :stalls="stallsList"
          />
        </div>

        <div class="flex items-center justify-end mt-3 mb-2">
          <Button
            label="Confirm & Reserve Stall"
            icon="pi pi-check"
            severity="primary"
            class="btn-confirm-inline-stall"
            :disabled="!inlineSelectedStallId || isSavingStallSelection"
            :loading="isSavingStallSelection"
            @click="confirmInlineStallSelection"
          />
        </div>

        <!-- Live Preview of Advance Payment -->
        <div v-if="inlineStallPreview" class="inline-calc-preview">
          <div class="preview-badge-row">
            <span class="text-xs font-bold text-amber-900">
              <i class="pi pi-calculator mr-1"></i> 2-Month Advance Payment Calculation:
            </span>
            <span class="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-[11px] rounded-full">
              Baseline Calculated
            </span>
          </div>
          <div class="preview-numbers-grid">
            <div>
              <span class="preview-lbl">Selected Stall</span>
              <strong class="preview-num">Stall #{{ inlineStallPreview.stallNo }} ({{ inlineStallPreview.stallType }})</strong>
            </div>
            <div>
              <span class="preview-lbl">Monthly Rent</span>
              <strong class="preview-num">₱{{ Number(inlineStallPreview.monthlyRent || 0).toLocaleString() }}/mo</strong>
            </div>
            <div class="preview-total-box">
              <span class="preview-lbl text-amber-800">Total 2-Month Advance Required:</span>
              <strong class="preview-total-amt">₱{{ (Number(inlineStallPreview.monthlyRent || 0) * 2).toLocaleString() }}</strong>
            </div>
          </div>
          <p class="text-[11px] text-amber-800 mt-2">
            <i class="pi pi-info-circle mr-1"></i> Reserving this stall sets occupant status to <strong>PENDING</strong> and stall status to <strong>RESERVED</strong> until Mayor's approval, Treasurer advance payment recording, and Market Supervisor contract approval.
          </p>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="state-box">Loading application status...</div>
    <div v-else-if="errorMessage" class="state-box error">{{ errorMessage }}</div>

    <section v-else class="panel">
      <Timeline :value="steps" align="alternate" class="workflow-timeline">
        <template #marker="{ item }">
          <span :class="['circle', item.status]">{{ item.id }}</span>
        </template>

        <template #content="{ item }">
          <div class="step-card">
            <div>
              <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                <span class="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;">
                  <i class="pi pi-user mr-1"></i> Role: {{ item.role }}
                </span>
              </div>
              <h2 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 2px 0 6px;">
                Step {{ item.id }}: {{ item.title }}
              </h2>
              <p style="font-size: 0.85rem; color: #475569; margin: 0 0 10px; line-height: 1.5;">
                {{ item.description }}
              </p>

              <!-- Step 1 Designated Stall Context -->
              <div v-if="item.id === 1" class="timeline-step-stall-box">
                <div v-if="stallInfo" class="flex items-center justify-between">
                  <span class="text-xs text-slate-700 font-medium">
                    <i class="pi pi-shop text-amber-600 mr-1"></i>
                    Target Stall: <strong>Stall #{{ stallInfo.stallNo || stallInfo.number }}</strong> ({{ stallInfo.stallType || stallInfo.section || 'Market Stall' }})
                  </span>
                  <button
                    v-if="!isStallAssigned"
                    type="button"
                    class="btn-text-change-stall"
                    @click="openSelectStallModal"
                  >
                    <i class="pi pi-pencil"></i> Change Stall
                  </button>
                </div>
                <div v-else class="flex items-center justify-between">
                  <span class="text-xs text-amber-700 font-semibold">
                    <i class="pi pi-exclamation-circle mr-1"></i> No market stall chosen yet
                  </span>
                  <button
                    type="button"
                    class="btn-text-select-stall"
                    @click="openSelectStallModal"
                  >
                    <i class="pi pi-plus-circle"></i> Select Stall
                  </button>
                </div>
              </div>

              <!-- Step 4 Advance Payment Calculation Breakdown -->
              <div v-if="item.id === 4" class="timeline-step-stall-box">
                <div v-if="stallInfo">
                  <span class="text-xs text-slate-500 block">Required 2-Month Advance (Held as Credit):</span>
                  <strong class="text-xs text-emerald-600 block mt-0.5">
                    ₱{{ (Number(stallInfo.monthlyRent || stallInfo.monthly_rent || 0) * 2).toLocaleString() }}
                    <span class="text-slate-400 font-normal"> (₱{{ Number(stallInfo.monthlyRent || stallInfo.monthly_rent || 0).toLocaleString() }}/mo × 2 months)</span>
                  </strong>
                </div>
                <div v-else>
                  <span class="text-xs text-slate-400 italic">Select a stall to compute your 2-month required advance payment.</span>
                </div>
              </div>

              <!-- Step 10 External BPLO Guidance -->
              <div v-if="item.id === 10" class="timeline-step-stall-box" style="background: #f0fdf4; border: 1px solid #bbf7d0;">
                <span class="text-xs text-emerald-800 block">
                  <i class="pi pi-info-circle mr-1"></i>
                  External BPLO Process: Access the official Business Permit application form on your dashboard, submit to the BPLO office, and pay the assessed fee to the Municipal Treasurer.
                </span>
              </div>
            </div>
            <Tag :value="statusLabel(item.status)" :severity="statusSeverity(item.status)" />
          </div>
        </template>
      </Timeline>

      <div v-if="requirements?.complete === false" class="requirements-callout">
        <div>
          <strong>Requirements need action</strong>
          <p>Upload the missing documents before dashboard access is enabled.</p>
        </div>
        <Button label="Upload Requirements" icon="pi pi-upload" @click="router.push('/requirements')" />
      </div>

      <!-- Application Returned For Correction Notice -->
      <div v-if="isReturnedForCorrection" class="bg-amber-50 border border-amber-300 text-amber-950 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div class="flex items-start gap-3">
          <i class="pi pi-exclamation-triangle text-amber-600 text-2xl mt-0.5"></i>
          <div>
            <h3 class="text-sm font-extrabold text-amber-950 m-0">Application Returned for Correction</h3>
            <p class="text-xs text-amber-800 mt-1 m-0">
              <strong>Mayor's Remarks:</strong> {{ stakeholder?.mayorRemarks || stakeholder?.mayor_remarks || 'Please review and update your Letter of Intent or valid ID documents.' }}
            </p>
          </div>
        </div>
        <Button
          label="Update & Resubmit"
          icon="pi pi-file-edit"
          severity="warn"
          size="small"
          class="font-bold flex-shrink-0"
          @click="router.push('/business-application')"
        />
      </div>

      <!-- Active Tenancy Congratulations Callout -->
      <div v-if="isFullyActivated || steps[7]?.status === 'approved'" class="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 text-xs font-bold rounded border border-emerald-400/30">
              <i class="pi pi-check-circle mr-1"></i> ACTIVE TENANCY GRANTED
            </span>
          </div>
          <h3 class="text-base font-extrabold text-white m-0">Congratulations! Your market stall tenancy is active.</h3>
          <p class="text-xs text-emerald-200 mt-1 m-0">Your 3-Year Contract of Lease and Digital Occupancy Permit are active. Access your stall management and monthly billing statements.</p>
        </div>
        <Button
          label="Open Vendor Dashboard"
          icon="pi pi-arrow-right"
          iconPos="right"
          severity="success"
          size="small"
          class="font-bold flex-shrink-0"
          @click="router.push('/stakeholder')"
        />
      </div>
    </section>

    <!-- Dedicated Hazard-Free Stall Upload Modal -->
    <div v-if="showHazardModal" class="hazard-modal-backdrop" @click.self="closeHazardModal">
      <div class="hazard-modal-card">
        <div class="hazard-modal-header">
          <div class="hazard-header-title">
            <div class="hazard-icon-circle">
              <i class="pi pi-shield"></i>
            </div>
            <div>
              <h3>Confirmation of Hazard-Free Stall</h3>
              <p>Upload verification for your occupied stall</p>
            </div>
          </div>
          <button class="hazard-btn-close" @click="closeHazardModal">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="hazard-modal-body">
          <div v-if="stallInfo" class="hazard-stall-pill">
            <div class="pill-item">
              <span class="lbl">Occupied Stall</span>
              <strong>Stall {{ stallInfo.stallNo || stallInfo.number }}</strong>
            </div>
            <div class="pill-item">
              <span class="lbl">Section / Type</span>
              <strong>{{ stallInfo.section || stallInfo.stallType || 'Market' }}</strong>
            </div>
            <div class="pill-item">
              <span class="lbl">Status</span>
              <strong class="text-emerald-600">Assigned & Active</strong>
            </div>
          </div>

          <div class="hazard-instructions">
            <p>
              Please upload the official document confirming that your occupied stall is free from electrical, structural, fire, and health hazards. This confirmation is reviewed by the <strong>Market Inspector</strong> and <strong>Market Supervisor</strong>.
            </p>
          </div>

          <div
            class="hazard-dropzone"
            :class="{ 'has-file': Boolean(selectedHazardFile) }"
            @dragover.prevent
            @drop.prevent="onHazardDrop"
          >
            <input
              ref="hazardFileInput"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              class="hazard-hidden-input"
              @change="onHazardFileSelect"
            />
            <input
              ref="hazardCameraInput"
              type="file"
              accept="image/*"
              capture="environment"
              class="hazard-hidden-input"
              @change="onHazardFileSelect"
            />
            <div v-if="!selectedHazardFile" class="dropzone-prompt">
              <i class="pi pi-cloud-upload dropzone-icon"></i>
              <span>Choose how to attach your Hazard-Free confirmation:</span>
              <div style="display:flex;gap:10px;justify-content:center;margin-top:12px;flex-wrap:wrap">
                <button type="button" @click.stop="triggerHazardCamera" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;border:1px solid #0284c7;background:#f0f9ff;color:#0284c7;font-weight:600;font-size:0.85rem;cursor:pointer">
                  <i class="pi pi-camera"></i> Take Photo
                </button>
                <button type="button" @click.stop="triggerHazardFileInput" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;color:#334155;font-weight:600;font-size:0.85rem;cursor:pointer">
                  <i class="pi pi-folder-open"></i> Upload File / PDF
                </button>
              </div>
              <small style="margin-top:10px;display:block">Supported formats: PDF, PNG, JPG (Max: 10MB)</small>
            </div>
            <div v-else class="dropzone-selected-preview">
              <div class="file-info-row">
                <i class="pi pi-file-pdf file-type-icon"></i>
                <div class="file-details">
                  <span class="file-name">{{ selectedHazardFile.name }}</span>
                  <span class="file-size">{{ (selectedHazardFile.size / 1024).toFixed(1) }} KB</span>
                </div>
              </div>
              <button type="button" class="btn-remove-hazard-file" @click="selectedHazardFile = null">
                <i class="pi pi-trash"></i> Remove
              </button>
            </div>
          </div>

          <div v-if="hazardError" class="hazard-error-notice">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ hazardError }}</span>
          </div>
        </div>

        <div class="hazard-modal-footer">
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            size="small"
            @click="closeHazardModal"
          />
          <Button
            :label="isUploadingHazard ? 'Uploading...' : 'Upload & Submit Confirmation'"
            icon="pi pi-check"
            severity="primary"
            size="small"
            :disabled="!selectedHazardFile || isUploadingHazard"
            :loading="isUploadingHazard"
            @click="submitHazardFreeFile"
          />
        </div>
      </div>
    </div>

    <!-- Dedicated Select Stall Modal -->
    <div v-if="showSelectStallModal" class="hazard-modal-backdrop" @click.self="closeSelectStallModal">
      <div class="hazard-modal-card" style="max-width: 960px; width: 95vw;">
        <div class="hazard-modal-header">
          <div class="hazard-header-title">
            <div class="hazard-icon-circle" style="background: #f59e0b; color: #fff;">
              <i class="pi pi-shop"></i>
            </div>
            <div>
              <h3>Select Market Stall</h3>
              <p>Choose an available vacant stall on the interactive market map to establish your 2-month advance payment baseline</p>
            </div>
          </div>
          <button class="hazard-btn-close" @click="closeSelectStallModal">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="hazard-modal-body">
          <VacantStallMapPicker
            v-model="selectedModalStallId"
            :stalls="stallsList"
            @select-stall="handleModalStallSelect"
          />

          <!-- Calculation Preview Box -->
          <div v-if="modalStallInfo" class="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl mt-3 mb-3" style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 12px; padding: 14px;">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-amber-900">Stall #{{ modalStallInfo.stallNo }} ({{ modalStallInfo.stallType }})</span>
              <Tag value="2-MONTH BASELINE" severity="warn" rounded class="text-[10px]" />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
              <div>
                <span class="text-slate-500 block text-xs">Monthly Rental Rate</span>
                <strong class="text-slate-900 text-sm">₱{{ Number(modalStallInfo.monthlyRent || 0).toLocaleString() }}/mo</strong>
              </div>
              <div>
                <span class="text-slate-500 block text-xs">Required Advance Payment (2 Mos)</span>
                <strong class="text-amber-800 text-sm" style="color: #b45309; font-size: 1.05rem;">₱{{ (Number(modalStallInfo.monthlyRent || 0) * 2).toLocaleString() }}</strong>
              </div>
            </div>
            <p class="text-[11px] text-amber-900/80 mt-2" style="margin-top: 10px; font-size: 0.8rem; color: #92400e;">
              <i class="pi pi-info-circle mr-1"></i>
              Upon confirmation, this stall will be <strong>Reserved</strong> for you (Occupant status: <strong>PENDING</strong>) until Mayor's approval, Treasurer advance payment recording, and Market Supervisor verification.
            </p>
          </div>

          <div v-if="stallSelectionError" class="hazard-error-notice">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ stallSelectionError }}</span>
          </div>
        </div>

        <div class="hazard-modal-footer">
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            size="small"
            @click="closeSelectStallModal"
          />
          <Button
            :label="isSavingStallSelection ? 'Saving Selection...' : 'Confirm Stall Selection'"
            icon="pi pi-check"
            severity="primary"
            size="small"
            :disabled="!selectedModalStallId || isSavingStallSelection"
            :loading="isSavingStallSelection"
            @click="confirmStallSelection"
          />
        </div>
      </div>
    </div>

    <!-- Official 5-Page Unified Application Form Modal (Rental/Occupancy) -->
    <UnifiedApplicationFormModal
      v-if="showUnifiedFormModal"
      :visible="showUnifiedFormModal"
      :application-data="unifiedApplicationData"
      :application="unifiedApplicationData"
      role="APPLICANT"
      @close="showUnifiedFormModal = false"
      @acknowledge="handleApplicantAcknowledge"
    />

    <!-- Official Letter of Intent Modal (Image 4) -->
    <LetterOfIntentModal
      v-if="showLoiModal"
      :visible="showLoiModal"
      :applicant-name="applicantFullName"
      :applicant-address="stakeholder?.address || ''"
      :applicant-contact="stakeholder?.contact || ''"
      :business-nature="stakeholder?.natureOfBusiness || stakeholder?.businessType || ''"
      :preferred-stall="stallInfo?.stallNo ? `Stall #${stallInfo.stallNo}` : ''"
      :commodities="stakeholder?.productsCommodities || ''"
      :existing-loi-content="stakeholder?.loiContent || ''"
      :incumbent-mayor="stakeholder?.incumbentMayor || stakeholder?.incumbent_mayor || 'HON. MAYOR STEPHEN S. TAN'"
      @close="showLoiModal = false"
    />

    <!-- Official 12-Page Contract & Mirroring Dossier -->
    <PrintableDossier
      v-if="showPrintableDossierModal"
      :visible="showPrintableDossierModal"
      :application="printableApplicationPayload"
      :applicant="printableApplicantPayload"
      :stall="printableStallPayload"
      :mayor-official="printableMayorPayload"
      @close="showPrintableDossierModal = false"
    />
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../config/supabase'
import api, { normalizeRecord } from '../services/api'
import { fetchStalls } from '../services/stallService'
import {
  getApplicationByUserId,
  getStakeholderByUserId,
  getStakeholderRequirements,
  isDashboardReady,
  uploadHazardFreeDocument
} from '../services/applicationService'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Timeline from 'primevue/timeline'
import Toast from 'primevue/toast'
import UnifiedApplicationFormModal from '../components/UnifiedApplicationFormModal.vue'
import LetterOfIntentModal from '../components/LetterOfIntentModal.vue'
import VacantStallMapPicker from '../components/VacantStallMapPicker.vue'
import PrintableDossier from '../components/documents/PrintableDossier.vue'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

// Modals State
const showUnifiedFormModal = ref(false)
const showLoiModal = ref(false)
const showPrintableDossierModal = ref(false)

const printableApplicationPayload = computed(() => {
  const s = stakeholder.value || {}
  const st = stallInfo.value || {}
  return {
    application_number: s.applicationNo || applicationTrackingNo.value || 'APP-2026-0012',
    trade_name: s.businessName || s.tradeName || 'Commercial Enterprise',
    nature_of_business: s.natureOfBusiness || s.businessType || 'General Retail',
    commodities_to_sell: s.productsCommodities || s.commodities || 'Authorized Goods',
    estimated_employees: Number(s.employeeCount || s.estimatedEmployees || 1),
    valid_id_type: s.validIdType || 'Government ID',
    valid_id_number: s.validIdNo || s.validIdNumber || 'ID-VERIFIED-2026',
    current_status: s.applicationStatus || 'APPLICATION_SUBMITTED',
    created_at: s.createdAt || new Date().toISOString(),
    contract_number: s.contractNo || 'CNT-2026-0142',
    contract_start_date: s.contractStartDate || '2026-10-14',
    contract_end_date: s.contractEndDate || '2031-10-14',
    treasury_or_number: s.officialReceiptNo || s.orNumber || 'OR-3675241',
    treasury_payment_date: s.paymentDate || new Date().toISOString(),
    advance_rent_paid: Number(st.monthlyRent || 2300) * 2,
    stall_rights_paid: 5000,
    mayor_decision_ref_no: 'RES-2026-MAYOR-012'
  }
})

const printableApplicantPayload = computed(() => {
  const s = stakeholder.value || {}
  return {
    full_name: applicantFullName.value,
    civil_status: s.civilStatus || 'Married',
    citizenship: s.citizenship || 'Filipino',
    residential_address: s.address || 'Poblacion, Manticao, Misamis Oriental',
    contact_number: s.contact || s.phone || '09932889430'
  }
})

const printableStallPayload = computed(() => {
  const st = stallInfo.value || {}
  return {
    stall_number: st.stallNo || '61',
    section_name: st.info || st.section || 'Phase 3 and 4 / Dry Goods Section',
    stall_type: st.stallType || 'REGULAR_STALL',
    floor_area_sqm: st.area || 12,
    monthly_rental_rate: Number(st.monthlyRent || 2300),
    stall_rights_fee: 5000
  }
})

const printableMayorPayload = computed(() => {
  return {
    full_name: 'HON. STEPHEN S. TAN',
    position_title: 'Municipal Mayor',
    is_incumbent: true
  }
})

const applicantFullName = computed(() => {
  const s = stakeholder.value
  if (!s) return 'Applicant'
  return [s.firstName || s.first_name, s.middleName || s.middle_name, s.lastName || s.last_name].filter(Boolean).join(' ') || s.name || 'Applicant'
})

const unifiedApplicationData = computed(() => {
  const s = stakeholder.value || {}
  const st = stallInfo.value || {}
  return {
    ...s,
    id: s.id || s.stakeholderId || s.applicationId,
    applicationNo: s.applicationNo || applicationTrackingNo.value,
    firstName: s.firstName || s.first_name,
    middleName: s.middleName || s.middle_name,
    lastName: s.lastName || s.last_name,
    address: s.address,
    contact: s.contact,
    validIdType: s.validIdType || s.valid_id_type || 'National ID (PhilSys)',
    validIdNo: s.validIdNo || s.valid_id_no || '',
    businessName: s.businessName || s.business_name,
    businessType: s.businessType || s.business_type,
    natureOfBusiness: s.natureOfBusiness || s.nature_of_business,
    otherNatureOfBusiness: s.otherNatureOfBusiness || s.other_nature_of_business,
    productsCommodities: s.productsCommodities || s.products_commodities,
    stallSpaceType: s.stallSpaceType || s.stall_space_type || 'Regular Stall',
    preferredStallNo: st.stallNo || st.number || s.preferredStallNo || '',
    estimatedEmployees: s.estimatedEmployees || s.estimated_employees || 1,
    undertakingAgreed: s.undertakingAgreed ?? true,
    loiUrl: s.loiUrl || requirements.value?.letter?.url,
    validIdUrl: s.validIdUrl || requirements.value?.id?.url,
    loiContent: s.loiContent || '',
    incumbentMayor: s.incumbentMayor || s.incumbent_mayor || 'HON. MAYOR STEPHEN S. TAN',
    monthlyRent: st.monthlyRent || st.monthly_rent || s.monthlyRent || 0,
    marketOfficeStatus: s.marketOfficeStatus || 'Complete',
    marketOfficeStallRecommended: s.marketOfficeStallRecommended || st.stallNo || '',
    marketOfficeSection: s.marketOfficeSection || st.stallType || '',
    marketOfficeNature: s.marketOfficeNature || s.businessType || '',
    marketOfficeRemarks: s.marketOfficeRemarks || 'Recommended for Mayor & Treasury assessment.',
    treasuryFeeMonthly: s.treasuryFeeMonthly || st.monthlyRent || st.monthly_rent || 0,
    treasuryFeeOther: s.treasuryFeeOther || 0,
    treasuryFeeSecurityDeposit: s.treasuryFeeSecurityDeposit || (Number(st.monthlyRent || st.monthly_rent || 0) * 2),
    treasuryTotalDue: s.treasuryTotalDue || (Number(st.monthlyRent || st.monthly_rent || 0) * 3),
    treasuryRemarks: s.treasuryRemarks || '',
    finalRecommendation: s.finalRecommendation || (s.marketApprovalStatus === 'APPROVED' ? 'RECOMMENDED' : 'PENDING'),
    mayorDecision: s.mayorDecision || (s.marketApprovalStatus === 'APPROVED' ? 'APPROVED' : (s.applicationStatus === 'APPROVED' ? 'APPROVED' : 'PENDING')),
    mayorRemarks: s.mayorRemarks || s.mayor_remarks || '',
    mayorDecisionDate: s.mayorDecisionDate || s.mayor_approved_at || null,
    assignedStallNo: s.assignedStallNo || st.stallNo || '',
    assignedMarketSection: s.assignedMarketSection || st.stallType || '',
    assignedMonthlyRent: s.assignedMonthlyRent || st.monthlyRent || st.monthly_rent || 0,
    paymentOrNo: s.paymentOrNo || s.official_receipt_no || '',
    paymentAmount: s.paymentAmount || s.total_initial_amount_paid || 0,
    applicantAcknowledged: s.applicantAcknowledged ?? false,
    applicantAcknowledgedDate: s.applicantAcknowledgedDate || null
  }
})

// Unified Business Permit 2-Page Form Payload (Images 1-4)
const businessPermitApplicationData = computed(() => {
  const s = stakeholder.value || {}
  const st = stallInfo.value || {}
  return {
    ...s,
    incumbentMayor: s.incumbentMayor || s.incumbent_mayor || 'HON. MAYOR STEPHEN S. TAN',
    id: s.id || s.stakeholderId || s.applicationId,
    applicationNo: s.applicationNo || applicationTrackingNo.value || 'BP-2026-0782',
    trackingNumber: s.trackingNumber || s.applicationNo || applicationTrackingNo.value || 'BP-2026-0782',
    businessIdNumber: s.businessIdNumber || (s.id ? `BIN-9024-${String(s.id).padStart(4, '0')}` : 'BIN-9024-0041'),
    applicationType: s.applicationType || 'NEW',
    paymentMode: s.paymentMode || 'Annually',
    orgType: s.orgType || 'Sole Proprietor',
    orgGender: s.orgGender || 'Female',
    dtiSecCdaRegNo: s.dtiSecCdaRegNo || '',
    tinNo: s.tinNo || '',
    tradeNameFranchise: s.tradeNameFranchise || s.businessName || 'ABUHAN FISH VENDOR STALL',
    businessName: s.tradeNameFranchise || s.businessName || 'ABUHAN FISH VENDOR STALL',
    businessType: s.businessType || 'Retail',
    mainHouseBldgNo: s.mainHouseBldgNo || 'P-4',
    mainBldgName: s.mainBldgName || '',
    mainLotNo: s.mainLotNo || '',
    mainBlockNo: s.mainBlockNo || '',
    mainStreet: s.mainStreet || 'P-4',
    mainSubdivision: s.mainSubdivision || '',
    mainBarangay: s.mainBarangay || 'POBLACION',
    mainDistrict: s.mainDistrict || '',
    mainMunicipality: s.mainMunicipality || 'MANTICAO',
    mainProvince: s.mainProvince || 'MISAMIS OR.',
    mainZipCode: s.mainZipCode || '9024',
    telephoneNo: s.telephoneNo || '',
    mobileNo: s.mobileNo || s.contact || '09932889970',
    contact: s.mobileNo || s.contact || '09932889970',
    email: s.email || '',
    ownerSurname: s.ownerSurname || s.lastName || 'ABUHAN',
    ownerGivenName: s.ownerGivenName || s.firstName || 'RISMA',
    ownerMiddleName: s.ownerMiddleName || s.middleName || 'PORCO',
    ownerSuffix: s.ownerSuffix || '',
    corpPresidentSurname: s.corpPresidentSurname || '',
    corpPresidentGivenName: s.corpPresidentGivenName || '',
    corpPresidentMiddleName: s.corpPresidentMiddleName || '',
    corpPresidentSuffix: s.corpPresidentSuffix || '',
    corpCitizenship: s.corpCitizenship || 'Filipino',
    businessAreaSqm: s.businessAreaSqm || 9,
    totalFloorAreaSqm: s.totalFloorAreaSqm || 9,
    numEmployeesMale: s.numEmployeesMale || 0,
    numEmployeesFemale: s.numEmployeesFemale || 1,
    numEmployeesLguResiding: s.numEmployeesLguResiding || 1,
    deliveryVehiclesVanTruck: s.deliveryVehiclesVanTruck || 0,
    deliveryVehiclesMotorcycle: s.deliveryVehiclesMotorcycle || 0,
    locSameAsMain: s.locSameAsMain ?? true,
    locHouseBldgNo: s.locHouseBldgNo || s.mainHouseBldgNo || 'P-4',
    locStreet: s.locStreet || s.mainStreet || 'P-4',
    locBarangay: s.locBarangay || s.mainBarangay || 'POBLACION',
    locMunicipality: s.locMunicipality || s.mainMunicipality || 'MANTICAO',
    locProvince: s.locProvince || s.mainProvince || 'MISAMIS OR.',
    locZipCode: s.locZipCode || s.mainZipCode || '9024',
    propertyOwned: s.propertyOwned ?? true,
    taxDecNo: s.taxDecNo || '',
    propertyIdNo: s.propertyIdNo || '',
    taxIncentivesEnjoyed: s.taxIncentivesEnjoyed ?? false,
    businessActivity: s.businessActivity || 'Main Office',
    businessLines: s.businessLines || [
      { lineOfBusiness: 'Fish Vendor / Wet Section Trade', psic: '', units: 1, capitalization: 50000, grossSales: 0 }
    ],
    preferredStallNo: st.stallNo ? `Stall #${st.stallNo}` : (s.preferredStallNo ? `Stall #${s.preferredStallNo}` : 'Market Stall #WS-01'),
    bploApprovedBy: s.bploApprovedBy || 'JUNE CLYDE D. PATILANO',
    bploDesignation: s.bploDesignation || 'LRCO II/BPLO Designate',
    bploDateSigned: s.bploDateSigned || new Date(),
    marketOfficeVerifiedBy: s.marketOfficeVerifiedBy || 'EDGAR EYANA',
    marketOfficeVerifiedRemarks: s.marketOfficeVerifiedRemarks || 'FISH VENDOR OK',
    treasurerVerifiedBy: s.treasurerVerifiedBy || 'J. ANDANA',
    treasurerVerifiedDate: s.treasurerVerifiedDate || new Date(),
    totalFeesAssessment: s.totalFeesAssessment || 2890.60,
    businessPermitOrNo: s.businessPermitOrNo || s.paymentOrNo || '3675241',
    perjuryDeclarationAgreed: true
  }
})

function handleModalStallSelect(stall) {
  if (stall?.id) {
    selectedModalStallId.value = Number(stall.id)
  }
}

async function handleApplicantAcknowledge() {
  try {
    const appId = stakeholder.value?.id || stakeholder.value?.stakeholderId || stakeholder.value?.applicationId
    if (!appId) return

    await api.put(`/applications/${appId}`, {
      applicantAcknowledged: true,
      applicantAcknowledgedDate: new Date().toISOString()
    })

    toast.add({
      severity: 'success',
      summary: 'Occupancy Acknowledged',
      detail: 'You have digitally confirmed and acknowledged your market stall rental authorization.',
      life: 4000
    })

    await loadProgress(true)
  } catch (err) {
    console.error('[ApplicationProgress] acknowledge error:', err)
    toast.add({
      severity: 'error',
      summary: 'Acknowledgment Error',
      detail: err.message || 'Could not record acknowledgment.',
      life: 4000
    })
  }
}

async function logout() {
  if (pollTimer) clearInterval(pollTimer)
  await authStore.clearSession()
  localStorage.removeItem('currentStakeholder')
  localStorage.removeItem('stakeholderId')
  router.push('/login')
}

const isLoading = ref(false)
const isRefreshing = ref(false)
const errorMessage = ref('')
const stakeholder = ref(null)
const requirements = ref(null)
let pollTimer = null

// Stall Selection State (Inline & Modal)
const showSelectStallModal = ref(false)
const stallsList = ref([])
const selectedModalStallId = ref(null)
const inlineSelectedStallId = ref(null)
const isSavingStallSelection = ref(false)
const stallSelectionError = ref('')

const availableStalls = computed(() => {
  return stallsList.value.filter(s => {
    const isAvail = s.status === 'AVAILABLE' || s.status === 'VACANT'
    const curStallId = stakeholder.value?.selectedStallId || stakeholder.value?.selected_stall_id || stakeholder.value?.stall?.id
    const isCurrent = curStallId && Number(s.id) === Number(curStallId)
    return isAvail || isCurrent
  })
})

const modalStallInfo = computed(() => {
  if (!selectedModalStallId.value) return null
  return stallsList.value.find(s => Number(s.id) === Number(selectedModalStallId.value)) || null
})

const inlineStallPreview = computed(() => {
  if (!inlineSelectedStallId.value) return null
  return stallsList.value.find(s => Number(s.id) === Number(inlineSelectedStallId.value)) || null
})

function openSelectStallModal() {
  stallSelectionError.value = ''
  const curStallId = stakeholder.value?.selectedStallId || stakeholder.value?.selected_stall_id || stakeholder.value?.stall?.id
  selectedModalStallId.value = curStallId ? Number(curStallId) : null
  showSelectStallModal.value = true
}

function closeSelectStallModal() {
  showSelectStallModal.value = false
  stallSelectionError.value = ''
}

async function confirmInlineStallSelection() {
  if (!inlineSelectedStallId.value) {
    toast.add({
      severity: 'warn',
      summary: 'Selection Required',
      detail: 'Please choose a vacant market stall.',
      life: 3000
    })
    return
  }
  isSavingStallSelection.value = true
  try {
    let sid = stakeholder.value?.stakeholderId || stakeholder.value?.id
    if (!sid) {
      const uid = localStorage.getItem('userId')
      if (uid) {
        const res = await api.get(`/stakeholders/user/${uid}`)
        if (res?.data?.id) sid = res.data.id
      }
    }
    if (!sid) throw new Error('Stakeholder ID is missing.')

    await api.put(`/stakeholders/${sid}/select-stall`, {
      stallId: inlineSelectedStallId.value
    })

    toast.add({
      severity: 'success',
      summary: 'Stall Reserved',
      detail: 'Target market stall selected! 2-month advance payment baseline calculated and occupant status set to PENDING.',
      life: 4500
    })

    await loadProgress(true)
  } catch (err) {
    console.error('[ApplicationProgress] inline stall selection error:', err)
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: err.message || 'Failed to update stall selection.',
      life: 4000
    })
  } finally {
    isSavingStallSelection.value = false
  }
}

async function confirmStallSelection() {
  if (!selectedModalStallId.value) {
    stallSelectionError.value = 'Please choose a vacant stall.'
    return
  }
  isSavingStallSelection.value = true
  stallSelectionError.value = ''

  try {
    let sid = stakeholder.value?.stakeholderId || stakeholder.value?.id
    if (!sid) {
      const uid = localStorage.getItem('userId')
      if (uid) {
        const res = await api.get(`/stakeholders/user/${uid}`)
        if (res?.data?.id) sid = res.data.id
      }
    }
    if (!sid) throw new Error('Stakeholder ID is missing.')

    await api.put(`/stakeholders/${sid}/select-stall`, {
      stallId: selectedModalStallId.value
    })

    inlineSelectedStallId.value = selectedModalStallId.value

    toast.add({
      severity: 'success',
      summary: 'Stall Reserved',
      detail: 'Target market stall selected! 2-month advance payment baseline updated.',
      life: 4000
    })

    showSelectStallModal.value = false
    await loadProgress(true)
  } catch (err) {
    console.error('[ApplicationProgress] stall selection error:', err)
    stallSelectionError.value = err.message || 'Failed to update stall selection.'
  } finally {
    isSavingStallSelection.value = false
  }
}

// Hazard-Free Modal & Upload State
const showHazardModal = ref(false)
const selectedHazardFile = ref(null)
const isUploadingHazard = ref(false)
const hazardError = ref('')
const hazardFileInput = ref(null)
const hazardCameraInput = ref(null)
function triggerHazardCamera() {
  hazardCameraInput.value?.click()
}
const hasDismissedAutoPop = ref(false)

const applicationTrackingNo = computed(() => {
  const data = stakeholder.value
  if (!data) return 'APP-PENDING'
  return data.applicationNo || (data.id ? `APP-${data.id}` : 'APP-PENDING')
})

const currentWorkflowStatusFormatted = computed(() => {
  const data = stakeholder.value
  if (!data) return 'REGISTERED'
  return data.applicationStatus || data.application_status || 'APPLICATION_SUBMITTED'
})

const currentHoldingOffice = computed(() => {
  const data = stakeholder.value
  if (!data) return "Market Supervisor"
  const s = String(data.applicationStatus || data.application_status || '').toUpperCase()
  if (s.includes('REJECTED')) return 'Disapproved'
  if (s === 'RETURNED_FOR_CORRECTION') return "Mayor's Office / Authorized Staff"
  if (['SUBMITTED', 'PENDING_MAYOR_APPROVAL'].includes(s)) return "Mayor's Office"
  if (['APPROVED_PENDING_ADVANCE_PAYMENT', 'PENDING_TREASURER_PAYMENT'].includes(s)) return "Treasurer's Office"
  if (['ADVANCE_PAID', 'PENDING_SUPERVISOR_REVIEW'].includes(s)) return 'Market Supervisor'
  if (['CONTRACT_PREPARED', 'FEES_CLEARED', 'ACTIVE_OCCUPANT'].includes(s)) return 'Market Operations & Treasury'
  if (['BILLING_ACTIVE', 'COMPLETED', 'FULLY_APPROVED'].includes(s) || data.verifiedTenant || data.verified_tenant) return 'Market Operations & Billing'
  if (s === 'OCCUPANT_VERIFIED') return 'System (Tenancy Registry)'
  if (s === 'CONTRACT_ACTIVE') return 'System Validation'
  if (s === 'PENDING_CONTRACT_SIGNATURE') return 'Market Supervisor & Stakeholder'
  if (s === 'FOR_STALL_ASSIGNMENT') return 'Market Supervisor'
  if (s === 'AWAITING_INITIAL_PAYMENT' || s === 'LOI_APPROVED' || (data.mayorApproved && !data.advancePaymentPaid)) return "Treasurer's Office"
  if (s === 'AWAITING_LOI_DECISION' || s === 'SUBMITTED' || s === 'APPLICATION_SUBMITTED' || s === 'UNDER_REVIEW') return "Mayor's Office / Authorized Staff"
  return 'Stakeholder'
})

const currentOfficeAction = computed(() => {
  const data = stakeholder.value
  const s = String(data?.applicationStatus || data?.application_status || '').toUpperCase()
  if (s === 'REGISTERED') return 'Account registered. Select your preferred vacant stall and submit your rental application.'
  if (['APPLICATION_SUBMITTED', 'AWAITING_LOI_DECISION', 'SUBMITTED', 'UNDER_REVIEW', 'PENDING_MAYOR_APPROVAL'].includes(s)) return "Rental application submitted and awaiting the Mayor's LOI decision."
  if (s === 'LOI_APPROVED') return "LOI approved. Routing to Municipal Treasurer for assessment of stall rights fee and 2-month advance rent."
  if (['AWAITING_INITIAL_PAYMENT', 'PENDING_TREASURER_PAYMENT', 'APPROVED_PENDING_ADVANCE_PAYMENT'].includes(s)) return "Mayor approved the application. Awaiting the Treasurer's cash advance payment and Official Receipt."
  if (['FOR_STALL_ASSIGNMENT', 'PENDING_SUPERVISOR_REVIEW', 'ADVANCE_PAID'].includes(s)) return "Advance payment recorded. The Market Supervisor is assigning a vacant stall and preparing the lease contract."
  if (s === 'CONTRACT_PREPARED') return 'The Market Supervisor prepared the lease contract. Awaiting the Treasurer’s final application or regulatory fee.'
  if (s === 'FEES_CLEARED' || s === 'ACTIVE_OCCUPANT') return 'Required fees are cleared and the stakeholder account is active.'
  if (s === 'PENDING_CONTRACT_SIGNATURE') return "Market Supervisor preparing lease contract for bilateral signature."
  if (s === 'CONTRACT_ACTIVE') return "System validation passed: Lease activated across all 5 verification conditions."
  if (s === 'OCCUPANT_VERIFIED') return "System verified occupant record linked to assigned stall without duplicate."
  if (['BILLING_ACTIVE', 'COMPLETED', 'FULLY_APPROVED'].includes(s) || data?.verifiedTenant) return "Rental billing active per contract schedule. Advance rent held as segregated credit reserve."
  return 'Review your application status and complete any required actions.'
})

const currentStageTitle = computed(() => {
  const data = stakeholder.value
  if (!data) return 'Step 1: Stakeholder Registration & Stall Selection'
  const s = String(data.applicationStatus || data.application_status || '').toUpperCase()
  if (s === 'REGISTERED') return 'Step 1: Registration Complete & Stall Selection'
  if (['APPLICATION_SUBMITTED', 'AWAITING_LOI_DECISION', 'SUBMITTED', 'UNDER_REVIEW', 'PENDING_MAYOR_APPROVAL'].includes(s)) return "Step 3: Record Mayor's LOI Decision"
  if (s === 'LOI_APPROVED' || s === 'AWAITING_INITIAL_PAYMENT' || s === 'PENDING_TREASURER_PAYMENT' || s === 'APPROVED_PENDING_ADVANCE_PAYMENT') return 'Step 4: Pay Initial Rental Fees'
  if (s === 'PENDING_SUPERVISOR_REVIEW' || s === 'ADVANCE_PAID') return 'Step 5: Review & Assign Stall'
  if (['CONTRACT_PREPARED', 'FEES_CLEARED', 'ACTIVE_OCCUPANT'].includes(s)) return 'Step 6: Contract & Account Activation'
  if (s === 'FOR_STALL_ASSIGNMENT') return 'Step 5: Review & Assign Stall'
  if (s === 'PENDING_CONTRACT_SIGNATURE') return 'Step 6: Prepare & Sign Contract'
  if (s === 'CONTRACT_ACTIVE') return 'Step 7: Activate Lease'
  if (s === 'OCCUPANT_VERIFIED') return 'Step 8: Occupant Verified'
  if (s === 'BILLING_ACTIVE' || data?.verifiedTenant) return 'Step 9: Rental Billing Active'
  if (s === 'COMPLETED' || s === 'FULLY_APPROVED') return 'Step 10: Business Permit Stage'
  return 'Step 2: Submit Rental Application'
})

const currentActingRole = computed(() => {
  const data = stakeholder.value
  if (!data) return 'Stakeholder'
  const s = String(data.applicationStatus || data.application_status || '').toUpperCase()
  if (s === 'REGISTERED') return 'Stakeholder'
  if (['APPLICATION_SUBMITTED', 'AWAITING_LOI_DECISION', 'SUBMITTED', 'UNDER_REVIEW', 'PENDING_MAYOR_APPROVAL'].includes(s)) return 'Municipal Mayor'
  if (s === 'LOI_APPROVED' || s === 'AWAITING_INITIAL_PAYMENT' || s === 'PENDING_TREASURER_PAYMENT' || s === 'APPROVED_PENDING_ADVANCE_PAYMENT') return 'Treasurer'
  if (s === 'ADVANCE_PAID') return 'Market Supervisor'
  if (s === 'CONTRACT_PREPARED' || s === 'FEES_CLEARED') return 'Treasurer / System'
  if (s === 'FOR_STALL_ASSIGNMENT') return 'Market Supervisor'
  if (s === 'PENDING_CONTRACT_SIGNATURE') return 'Market Supervisor + Stakeholder'
  if (s === 'CONTRACT_ACTIVE') return 'System Validation'
  if (s === 'OCCUPANT_VERIFIED') return 'System'
  if (s === 'BILLING_ACTIVE') return 'System + Treasurer'
  if (s === 'COMPLETED' || s === 'FULLY_APPROVED') return 'Stakeholder + BPLO + Treasurer'
  return 'Stakeholder'
})

const steps = ref([
  { id: 1, role: 'Stakeholder / Applicant', title: 'Stakeholder Registration & Stall Selection', description: 'The prospective vendor creates an account on the portal and browses the interactive stall map to select a preferred vacant stall or table space.', status: 'pending' },
  { id: 2, role: 'Stakeholder / Applicant', title: 'Unified Digital Application & Valid ID Upload', description: 'Applicant fills out Unified Application Form with personal/business details and Incumbent Mayor. The system automatically compiles the formal LOI from saved data (no document upload for LOI). Only 1 document is uploaded: a clear copy of a valid government-issued ID.', status: 'pending' },
  { id: 3, role: 'MAYOR_OFFICE', title: "Mayoral LOI Decision Recording", description: "The physical printed and hand-signed LOI is submitted to the Office of the Mayor. MAYOR_OFFICE records physical receipt, official approval or rejection, and document reference.", status: 'pending' },
  { id: 4, role: 'Municipal Treasurer', title: 'Assessment & Payment of Initial Rental Fees', description: 'Treasury assesses Stall Rights Fee and Two-Month Advance Rent deposit. Payment is recorded in cash against an issued Official Receipt (OR). Advance rent is held intact as segregated reserve.', status: 'pending' },
  { id: 5, role: 'Market Supervisor', title: 'Market Office Evaluation & Official Stall Assignment', description: 'Market Supervisor verifies applicant eligibility, checks physical stall boundaries and sanitation compliance, and officially locks in the stall assignment on the map to prevent double-allocation.', status: 'pending' },
  { id: 6, role: 'Market Supervisor & Stakeholder', title: 'Lease Contract Preparation & Signing', description: 'The system drafts the official Contract of Lease incorporating assigned stall number, agreed rental rate, billing schedule, and municipal clauses. Both parties execute and record signed contract status.', status: 'pending' },
  { id: 7, role: 'System Validation Engine', title: 'Automated Lease Activation Verification', description: 'The system automatically verifies all five mandatory conditions (LOI approval, verified initial Treasury payment with valid OR, confirmed non-conflicting stall, bilateral signatures, effective date arrival) before transitioning to ACTIVE.', status: 'pending' },
  { id: 8, role: 'System Engine', title: 'Occupant Verification', description: 'Upon contract activation, the system links the verified stakeholder to the active stall registry, creating a verified occupant profile without generating duplicate stakeholder records.', status: 'pending' },
  { id: 9, role: 'System Engine & Municipal Treasurer', title: 'Periodic Rental Billing Commences', description: 'Recurring rental statements generated per lease terms. Advance rent deposit remains untouched unless authorized manual allocation is approved; 2-month grace period applies before overdue notices.', status: 'pending' },
  { id: 10, role: 'Stakeholder, External BPLO & Municipal Treasurer', title: 'Post-Occupancy Commercial Business Permitting', description: 'Once operational under active lease, stakeholder downloads official Unified Business Permit form from portal, submits physically to external BPLO, and pays assessed permit fee to Treasurer.', status: 'pending' }
])

const isSteps1To5Green = computed(() => {
  return steps.value[0]?.status === 'approved' &&
         steps.value[1]?.status === 'approved' &&
         steps.value[2]?.status === 'approved' &&
         steps.value[3]?.status === 'approved' &&
         steps.value[4]?.status === 'approved'
})

const isReturnedForCorrection = computed(() => {
  const data = stakeholder.value
  if (!data) return false
  return (
    data.applicationStatus === 'RETURNED_FOR_CORRECTION' ||
    data.application_status === 'RETURNED_FOR_CORRECTION' ||
    data.mayorDecision === 'RETURNED_FOR_CORRECTION' ||
    data.endorsementStatus === 'RETURNED_FOR_CORRECTION'
  )
})

const isFullyActivated = computed(() => {
  const data = stakeholder.value
  if (!data) return false
  return Boolean(
    data.verifiedTenant ||
    data.verified_tenant ||
    data.verifiedStakeholder ||
    data.onboardingStatus === 'ACTIVE_VENDOR' ||
    data.onboarding_status === 'ACTIVE_VENDOR' ||
    data.applicationStatus === 'COMPLETED' ||
    data.application_status === 'COMPLETED' ||
    data.applicationStatus === 'FULLY_APPROVED' ||
    data.application_status === 'FULLY_APPROVED'
  )
})

const hasHazardFreeDoc = computed(() => {
  const data = stakeholder.value
  if (!data) return false
  return Boolean(
    data.hazardFreeConfirmed ||
    data.hazard_free_confirmed ||
    data.hazardFreeDocumentUrl ||
    data.hazard_free_document_url ||
    requirements.value?.some(d =>
      d.document_type === 'HAZARD_FREE_CONFIRMATION' ||
      d.document_type === 'HAZARD_FREE_CERTIFICATE' ||
      d.documentType === 'HAZARD_FREE_CONFIRMATION' ||
      d.documentType === 'HAZARD_FREE_CERTIFICATE'
    )
  )
})

const hazardDocInfo = computed(() => {
  const data = stakeholder.value
  if (!data) return null
  const reqDoc = requirements.value?.find(d =>
    d.document_type === 'HAZARD_FREE_CONFIRMATION' ||
    d.document_type === 'HAZARD_FREE_CERTIFICATE' ||
    d.documentType === 'HAZARD_FREE_CONFIRMATION' ||
    d.documentType === 'HAZARD_FREE_CERTIFICATE'
  )
  const url = reqDoc?.file_path || reqDoc?.filePath || data.hazardFreeDocumentUrl || data.hazard_free_document_url || null
  const name = reqDoc?.file_name || reqDoc?.fileName || data.hazardFreeFileName || 'Hazard_Free_Stall_Confirmation.pdf'
  if (!url && !hasHazardFreeDoc.value) return null
  return { url, name }
})

function openHazardModal() {
  hazardError.value = ''
  selectedHazardFile.value = null
  showHazardModal.value = true
}

function closeHazardModal() {
  showHazardModal.value = false
  selectedHazardFile.value = null
  hazardError.value = ''
  hasDismissedAutoPop.value = true
}

function triggerHazardFileInput() {
  hazardFileInput.value?.click()
}

function onHazardFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) {
    selectedHazardFile.value = file
    hazardError.value = ''
  }
}

function onHazardDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    selectedHazardFile.value = file
    hazardError.value = ''
  }
}

async function submitHazardFreeFile() {
  if (!selectedHazardFile.value) {
    hazardError.value = 'Please select a file to upload.'
    return
  }
  isUploadingHazard.value = true
  hazardError.value = ''

  try {
    const sid = stakeholder.value?.stakeholderId || stakeholder.value?.id
    const appId = stakeholder.value?.businessApplicationId || stakeholder.value?.id
    const result = await uploadHazardFreeDocument(selectedHazardFile.value, sid, appId)

    if (stakeholder.value) {
      stakeholder.value.hazardFreeConfirmed = true
      stakeholder.value.hazardFreeDocumentUrl = result.publicUrl
      stakeholder.value.hazardFreeFileName = result.fileName
    }

    toast.add({
      severity: 'success',
      summary: 'Hazard-Free Confirmation Uploaded',
      detail: 'Document has been recorded and submitted to Market Inspector & Supervisor.',
      life: 4500
    })

    showHazardModal.value = false
    selectedHazardFile.value = null
    await loadProgress(true)
  } catch (err) {
    console.error('[ApplicationProgress] hazard upload error:', err)
    hazardError.value = err.message || 'Failed to upload document. Please try again.'
  } finally {
    isUploadingHazard.value = false
  }
}

const stallInfo = computed(() => {
  const data = stakeholder.value
  if (!data) return null
  const fromData = data.stall || data.occupant?.stall || (Array.isArray(data.occupants) && data.occupants[0]?.stall)
  if (fromData) return fromData
  const sId = data.selectedStallId || data.selected_stall_id
  if (sId && stallsList.value.length > 0) {
    return stallsList.value.find(s => String(s.id) === String(sId)) || null
  }
  return null
})

const isStallAssigned = computed(() => {
  const data = stakeholder.value
  if (!data) return false
  const occ = data.occupant || (Array.isArray(data.occupants) && data.occupants[0])
  const occStatus = String(occ?.status || '').toUpperCase()
  const isSupApproved = Boolean(data.marketSupervisorApproved || data.market_supervisor_approved || data.marketApprovalStatus === 'APPROVED')
  return Boolean(
    (occ?.stall || data.stall) &&
    (occStatus === 'ACTIVE' || isSupApproved)
  )
})

const overallSeverity = computed(() => {
  const st = stakeholder.value?.applicationStatus || stakeholder.value?.application_status
  if (st === 'COMPLETED' || st === 'FULLY_APPROVED') return 'success'
  if (st === 'REJECTED') return 'danger'
  return 'warn'
})

const applicantFeeRequired = computed(() => {
  const data = stakeholder.value
  if (!data || data.applicantFeePaid || data.applicant_fee_paid || data.applicationFormPaid || data.application_form_paid || data.treasurerPaid || data.treasurer_paid) {
    return false
  }

  const status = data.applicationStatus || data.application_status
  return status === 'PENDING_BUSINESS_PERMIT_PAYMENT' ||
    data.finalEndorsed === true ||
    data.final_endorsed === true
})

async function loadProgress(isSilent = false, refreshStalls = false) {
  if (isSilent) {
    if (isRefreshing.value || isLoading.value) return
    isRefreshing.value = true
  } else {
    isLoading.value = true
  }
  errorMessage.value = ''

  try {
    // Only refresh stalls when explicitly requested or initially empty
    if (refreshStalls || !stallsList.value || stallsList.value.length === 0) {
      try {
        const rawStalls = await fetchStalls()
        stallsList.value = (rawStalls || []).map(s => ({
          id: s.id,
          stallNo: s.stall_no || s.stallNo || s.number,
          stallType: s.stall_type || s.stallType || s.info || 'Standard Stall',
          monthlyRent: Number(s.monthly_rent ?? s.monthlyRent ?? 1500),
          status: String(s.status || 'AVAILABLE').toUpperCase()
        }))
      } catch (_) {}
    }

    let resolvedUserId = authStore.resolvedUserId || localStorage.getItem('userId')
    if (!resolvedUserId || resolvedUserId === 'null' || resolvedUserId === 'undefined') {
      const { data: { session } } = await supabase.auth.getSession()
      resolvedUserId = session?.user?.id
    }

    if (!resolvedUserId) {
      router.replace('/login')
      return
    }

    localStorage.setItem('userId', resolvedUserId)

    // Load stakeholder and fallback to business_application if needed
    let data = await getStakeholderByUserId(resolvedUserId)
    if (!data) {
      data = await getApplicationByUserId(resolvedUserId)
    }

    if (!data) {
      router.replace('/business-application')
      return
    }

    const norm = normalizeRecord(data)
    stakeholder.value = norm

    const initialStallId = norm.selectedStallId || norm.selected_stall_id || norm.stall?.id || norm.occupant?.stall?.id
    if (initialStallId && !inlineSelectedStallId.value) {
      inlineSelectedStallId.value = Number(initialStallId)
    }

    if (norm.id || norm.stakeholderId) {
      const sid = norm.stakeholderId || norm.id
      localStorage.setItem('stakeholderId', String(sid))
      requirements.value = await getStakeholderRequirements(sid)
    }

    applyStepStatuses(norm)
  } catch (error) {
    console.error('[ApplicationProgress] loadProgress error:', error)
    errorMessage.value = error.message || 'Unable to load application progress.'
    if (!isSilent) {
      toast.add({
        severity: 'error',
        summary: 'Progress unavailable',
        detail: errorMessage.value,
        life: 3500
      })
    }
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

function applyStepStatuses(data) {
  steps.value.forEach(step => {
    step.status = 'pending'
  })

  const currentStatus = String(data.applicationStatus || data.application_status || '').toUpperCase()

  // STEP 1 — Stakeholder registers (Stakeholder)
  // Account created, personal & business details recorded, preferred vacant stall selected
  const hasStallSelected = Boolean(data.stall || data.selectedStallId || data.selected_stall_id || data.preferredStallNo)
  const stallName = data.stall?.stallNo || data.stall?.number || data.preferredStallNo || data.selectedStallId
  steps.value[0].status = 'approved'
  if (stallName) {
    steps.value[0].description = `Registered account with personal/business details and selected preferred Stall #${stallName} on market map.`
  } else {
    steps.value[0].status = 'needs-action'
    steps.value[0].description = 'Account registered. Please select your preferred vacant stall on the market map.'
  }

  // STEP 2 — Submit rental application (Stakeholder)
  // Submits the Letter of Intent (LOI), valid ID, and application documents for Mayor review
  const hasSubmittedApp = Boolean(
    data.loiUrl ||
    data.letterDocumentUrl ||
    data.validIdUrl ||
    data.idDocumentUrl ||
    data.documentsSubmitted ||
    currentStatus !== 'REGISTERED'
  )
  if (hasSubmittedApp) {
    steps.value[1].status = 'approved'
    steps.value[1].description = 'Unified Application Form, signed Letter of Intent (LOI) to Mayor Stephen S. Tan, and Valid Government ID submitted.'
  } else {
    steps.value[1].status = 'needs-action'
    steps.value[1].description = 'Please submit your Letter of Intent (LOI), Valid ID, and rental application documents.'
  }

  // STEP 3 — Record Mayor's LOI decision (MAYOR_OFFICE)
  // MAYOR_OFFICE records the Mayor's approval/rejection based on the signed physical LOI
  const isMayorApproved = Boolean(
    data.loiApprovalStatus === 'APPROVED' ||
    data.loi_approval_status === 'APPROVED' ||
    data.loiStatus === 'APPROVED' ||
    data.loi_status === 'APPROVED' ||
    data.mayorApproved ||
    data.mayor_approved ||
    data.mayorDecision === 'APPROVED' ||
    data.mayor_decision === 'APPROVED' ||
    [
      'APPROVED_PENDING_ADVANCE_PAYMENT',
      'ADVANCE_PAID',
      'CONTRACT_PREPARED',
      'FEES_CLEARED',
      'ACTIVE_OCCUPANT',
      'LOI_APPROVED',
      'AWAITING_INITIAL_PAYMENT',
      'FOR_STALL_ASSIGNMENT',
      'PENDING_CONTRACT_SIGNATURE',
      'CONTRACT_ACTIVE',
      'OCCUPANT_VERIFIED',
      'BILLING_ACTIVE',
      'COMPLETED',
      'FULLY_APPROVED'
    ].includes(currentStatus)
  )

  const isMayorRejected = (
    data.loiApprovalStatus === 'REJECTED' ||
    data.loi_approval_status === 'REJECTED' ||
    data.loiStatus === 'REJECTED' ||
    data.loi_status === 'REJECTED' ||
    currentStatus === 'MAYOR_REJECTED' ||
    currentStatus === 'REJECTED' ||
    data.mayorDecision === 'REJECTED' ||
    data.mayor_decision === 'REJECTED'
  )

  const isMayorReturned = (
    currentStatus === 'RETURNED_FOR_CORRECTION' ||
    data.mayorDecision === 'RETURNED_FOR_CORRECTION' ||
    data.mayor_decision === 'RETURNED_FOR_CORRECTION'
  )

  if (isMayorRejected) {
    steps.value[2].status = 'rejected'
    const mayorName = data.incumbentMunicipalMayor || data.incumbent_municipal_mayor || 'Municipal Mayor'
    steps.value[2].description = `Letter of Intent rejected by ${mayorName}.${data.loiRemarks || data.loi_remarks || data.mayorRemarks ? ' Remarks: ' + (data.loiRemarks || data.loi_remarks || data.mayorRemarks) : ''}`
  } else if (isMayorReturned) {
    steps.value[2].status = 'needs-action'
    steps.value[2].description = `Returned for correction by Municipal Mayor: ${data.loiRemarks || data.loi_remarks || data.mayorRemarks || 'Please update your submitted documents.'}`
  } else if (isMayorApproved) {
    steps.value[2].status = 'approved'
    steps.value[2].description = `Office of the Municipal Mayor recorded official APPROVAL on the Letter of Intent (Ref: ${data.loiApprovalReference || data.loi_approval_reference || data.loiReferenceNo || 'Approved'}).`
  } else if (data.loiStatus === 'RECEIVED' || data.loi_status === 'RECEIVED') {
    steps.value[2].status = 'pending'
    steps.value[2].description = "Physical signed Letter of Intent has been RECEIVED by the Office of the Mayor. Mayoral review and decision recording in progress."
  } else if (hasSubmittedApp) {
    steps.value[2].status = 'pending'
    steps.value[2].description = "Letter of Intent generated and awaiting physical submission / review by the Office of the Municipal Mayor."
  }

  // STEP 4 — Pay initial rental fees (Treasurer)
  // After LOI approval, Treasurer assesses and records required stall rights fee and two-month advance rent payment
  const monthlyRent = Number(data.stall?.monthlyRent || data.stall?.monthly_rent || 1500)
  const reqAdvance = Number(data.totalAdvanceAmount || data.total_advance_amount || (monthlyRent * 2))
  const stallRights = Number(data.calculatedStallRightsFee || data.calculated_stall_rights_fee || 5000)
  const totalInitial = stallRights + reqAdvance

  const hasInitialPaid = Boolean(
    data.advancePaymentPaid ||
    data.advance_payment_paid ||
    data.initialFeesPaid ||
    data.initial_fees_paid ||
    data.treasurerPaid ||
    data.treasurer_paid ||
    data.applicantFeePaid ||
    data.applicant_fee_paid ||
    [
      'FOR_STALL_ASSIGNMENT',
      'ADVANCE_PAID',
      'CONTRACT_PREPARED',
      'FEES_CLEARED',
      'ACTIVE_OCCUPANT',
      'PENDING_CONTRACT_SIGNATURE',
      'CONTRACT_PREPARED',
      'FEES_CLEARED',
      'ACTIVE_OCCUPANT',
      'CONTRACT_ACTIVE',
      'ACTIVE_OCCUPANT',
      'OCCUPANT_VERIFIED',
      'ACTIVE_OCCUPANT',
      'BILLING_ACTIVE',
      'ACTIVE_OCCUPANT',
      'COMPLETED',
      'FULLY_APPROVED'
    ].includes(currentStatus)
  )

  if (hasInitialPaid) {
    steps.value[3].status = 'approved'
    const orNum = data.advancePaymentOr || data.official_receipt_no || data.advanceReceiptNo || ''
    steps.value[3].description = `Treasurer assessed and recorded Stall Rights Fee (₱${stallRights.toLocaleString()}) and 2-Month Advance Rent (₱${reqAdvance.toLocaleString()}) under O.R. ${orNum || 'Recorded'}. Advance rent is held as credit.`
  } else if (isMayorApproved) {
    steps.value[3].status = 'needs-action'
    steps.value[3].description = `LOI approved. Please pay assessed Stall Rights Fee (₱${stallRights.toLocaleString()}) and 2-Month Advance Rent (₱${reqAdvance.toLocaleString()}) to the Municipal Treasurer. Advance rent is held as credit.`
  }

  // STEP 5 — Review and assign stall (Market Supervisor)
  // Market Supervisor checks eligibility, verifies stall is available, and confirms assignment
  const isStallAssigned = Boolean(
    data.stallAssigned ||
    data.stall_assigned ||
    data.marketSupervisorAssigned ||
    data.market_supervisor_assigned ||
    data.marketSupervisorApproved ||
    data.market_supervisor_approved ||
    [
      'PENDING_CONTRACT_SIGNATURE',
      'CONTRACT_ACTIVE',
      'OCCUPANT_VERIFIED',
      'BILLING_ACTIVE',
      'COMPLETED',
      'FULLY_APPROVED'
    ].includes(currentStatus)
  )

  if (isStallAssigned) {
    steps.value[4].status = 'approved'
    steps.value[4].description = `Market Supervisor verified applicant eligibility, confirmed stall vacancy, and officially assigned Stall #${stallName || 'Assigned'}.`
  } else if (hasInitialPaid) {
    steps.value[4].status = 'pending'
    steps.value[4].description = 'Initial fees recorded. Market Supervisor is checking eligibility, verifying stall vacancy, and confirming stall assignment.'
  }

  // STEP 6 — Prepare and sign contract (Market Supervisor + Stakeholder)
  // Market Supervisor prepares lease contract. Required parties sign it.
  const isContractSigned = Boolean(
    data.contractSigned ||
    data.contract_signed ||
    data.contractSignedAt ||
    data.contract_signed_at ||
    [
      'CONTRACT_ACTIVE',
      'OCCUPANT_VERIFIED',
      'BILLING_ACTIVE',
      'COMPLETED',
      'FULLY_APPROVED'
    ].includes(currentStatus)
  )

  if (isContractSigned) {
    steps.value[5].status = 'approved'
    steps.value[5].description = 'Lease contract prepared by Market Supervisor and signed by both Market Supervisor and Stakeholder.'
  } else if (isStallAssigned) {
    steps.value[5].status = 'needs-action'
    steps.value[5].description = 'Stall assigned. Market Supervisor preparing lease contract for bilateral signature.'
  }

  // STEP 7 — Activate lease (System validation)
  // System checks LOI approval, verified initial payments, stall assignment, signed contract, and effective date before activating lease
  const isLeaseActivated = Boolean(
    data.contractActive ||
    data.contract_active ||
    data.leaseActivated ||
    data.lease_activated ||
    [
      'CONTRACT_ACTIVE',
      'OCCUPANT_VERIFIED',
      'BILLING_ACTIVE',
      'COMPLETED',
      'FULLY_APPROVED'
    ].includes(currentStatus)
  )

  if (isLeaseActivated) {
    steps.value[6].status = 'approved'
    steps.value[6].description = 'System validation passed: Verified LOI approval, initial payments, stall assignment, signed contract, and effective date. Lease is ACTIVE.'
  } else if (isContractSigned) {
    steps.value[6].status = 'pending'
    steps.value[6].description = 'System validating 5 mandatory conditions (LOI approval, initial payments, stall assignment, signed contract, effective date) for lease activation.'
  }

  // STEP 8 — Create or verify occupant record (System)
  // System links verified stakeholder to assigned stall and active contract without creating duplicates
  const isOccupantVerified = Boolean(
    data.occupantVerified ||
    data.occupant_verified ||
    data.verifiedTenant ||
    data.verified_tenant ||
    data.verifiedStakeholder ||
    data.verified_stakeholder ||
    [
      'OCCUPANT_VERIFIED',
      'BILLING_ACTIVE',
      'COMPLETED',
      'FULLY_APPROVED'
    ].includes(currentStatus)
  )

  if (isOccupantVerified) {
    steps.value[7].status = 'approved'
    steps.value[7].description = `System verified and linked stakeholder to Stall #${stallName || 'Assigned'} and active lease contract as official occupant without duplicates.`
  } else if (isLeaseActivated) {
    steps.value[7].status = 'pending'
    steps.value[7].description = 'Awaiting system to verify and link occupant record to assigned stall.'
  }

  // STEP 9 — Start rental billing (System + Treasurer)
  // System generates bills according to contract's billing schedule. Advance rent remains separate credit until authorized allocation
  const isBillingActive = Boolean(
    data.billingActive ||
    data.billing_active ||
    [
      'BILLING_ACTIVE',
      'COMPLETED',
      'FULLY_APPROVED'
    ].includes(currentStatus)
  )

  if (isBillingActive) {
    steps.value[8].status = 'approved'
    steps.value[8].description = 'Periodic rental billing generated according to contract schedule. 2-month advance rent remains held as segregated credit.'
  } else if (isOccupantVerified) {
    steps.value[8].status = 'pending'
    steps.value[8].description = 'Occupant verified. Ready for periodic rental billing generation and advance credit management.'
  }

  // STEP 10 — Business permit process (Stakeholder + External BPLO + Treasurer)
  // Post-occupancy: stall set up & operational, download permit form, apply through external BPLO, pay assessed fee to Treasurer
  const isPermitComplete = Boolean(
    data.businessPermitCompleted ||
    data.business_permit_completed ||
    data.businessPermitReleased ||
    data.business_permit_released ||
    currentStatus === 'COMPLETED' || currentStatus === 'ACTIVE_OCCUPANT'
  )
  const isPermitFeePaid = Boolean(
    data.businessPermitFeePaid ||
    data.business_permit_fee_paid ||
    data.bploPaid
  )

  if (isPermitComplete) {
    steps.value[9].status = 'approved'
    steps.value[9].description = 'Business permit process completed with external BPLO and permit fee payment recorded by Treasurer.'
  } else if (isPermitFeePaid) {
    steps.value[9].status = 'approved'
    steps.value[9].description = 'Business permit fee paid to Treasurer. External BPLO clearance and permit documentation on file.'
  } else if (isBillingActive || isOccupantVerified) {
    steps.value[9].status = 'needs-action'
    steps.value[9].description = 'Post-occupancy requirement: Download business permit form from your dashboard, apply at external BPLO, and settle assessed permit fee with the Municipal Treasurer.'
  } else {
    steps.value[9].status = 'pending'
    steps.value[9].description = 'Post-occupancy step: Applies once the stall is set up and operational under an active lease contract.'
  }
}

function statusLabel(status) {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  if (status === 'needs-action') return 'Needs Action'
  return 'Pending'
}

function statusSeverity(status) {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  if (status === 'needs-action') return 'warn'
  return 'secondary'
}

onMounted(() => {
  loadProgress(false, true)
  pollTimer = setInterval(() => {
    if (!document.hidden) {
      loadProgress(true, false)
    }
  }, 20000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped src="../styles/views/ApplicationProgress.css"></style>

