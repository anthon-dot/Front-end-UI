<template>
  <div class="dashboard">
    <!-- PAGE HEADER -->
    <header class="dash-header">
      <div class="dash-header-left">
        <h1>
          <i class="pi pi-th-large text-indigo-600"></i>
          Supervisor Dashboard
        </h1>
        <p>Public Market of Manticao &bull; Application Approvals & Stall Registry Overview</p>
      </div>

      <div class="dash-header-actions">
        <button
          type="button"
          class="btn-refresh"
          @click="refreshData"
          title="Refresh dashboard data"
        >
          <i class="pi pi-refresh" :class="{ 'pi-spin': isLoading }"></i>
          <span>{{ isLoading ? 'Refreshing...' : 'Refresh Data' }}</span>
        </button>
      </div>
    </header>

    <!-- 6 DATA-DRIVEN SUMMARY METRIC CARDS -->
    <section class="metrics-grid-6" aria-label="Dashboard Statistics Overview">
      <!-- 1. Total Applications -->
      <div class="metric-card">
        <div class="metric-card-top">
          <span class="metric-label">Total Applications</span>
          <div class="metric-icon-wrap icon-indigo">
            <i class="pi pi-file-edit"></i>
          </div>
        </div>
        <div>
          <div class="metric-value">{{ totalCount }}</div>
          <div class="metric-sub">Registered applicants</div>
        </div>
      </div>

      <!-- 2. Awaiting Market Supervisor Approval -->
      <div class="metric-card">
        <div class="metric-card-top">
          <span class="metric-label">Awaiting Approval</span>
          <div class="metric-icon-wrap icon-amber">
            <i class="pi pi-clock"></i>
          </div>
        </div>
        <div>
          <div class="metric-value text-amber-600">{{ pendingCount }}</div>
          <div class="metric-sub">Advance paid & eligible</div>
        </div>
      </div>

      <!-- 3. Supervisor-Approved Applications -->
      <div class="metric-card">
        <div class="metric-card-top">
          <span class="metric-label">Approved by MS</span>
          <div class="metric-icon-wrap icon-emerald">
            <i class="pi pi-check-circle"></i>
          </div>
        </div>
        <div>
          <div class="metric-value text-emerald-600">{{ approvedCount }}</div>
          <div class="metric-sub">Forwarded / ready</div>
        </div>
      </div>

      <!-- 4. Total Stalls -->
      <div class="metric-card">
        <div class="metric-card-top">
          <span class="metric-label">Total Stalls</span>
          <div class="metric-icon-wrap icon-blue">
            <i class="pi pi-building"></i>
          </div>
        </div>
        <div>
          <div class="metric-value">{{ totalStallsCount }}</div>
          <div class="metric-sub">Market inventory</div>
        </div>
      </div>

      <!-- 5. Occupied Stalls -->
      <div class="metric-card">
        <div class="metric-card-top">
          <span class="metric-label">Occupied Stalls</span>
          <div class="metric-icon-wrap icon-teal">
            <i class="pi pi-users"></i>
          </div>
        </div>
        <div>
          <div class="metric-value text-teal-600">{{ occupiedStallsCount }}</div>
          <div class="metric-sub">{{ totalStallsCount ? Math.round((occupiedStallsCount / totalStallsCount) * 100) : 0 }}% occupancy rate</div>
        </div>
      </div>

      <!-- 6. Vacant Stalls -->
      <div class="metric-card">
        <div class="metric-card-top">
          <span class="metric-label">Vacant Stalls</span>
          <div class="metric-icon-wrap icon-purple">
            <i class="pi pi-inbox"></i>
          </div>
        </div>
        <div>
          <div class="metric-value text-indigo-600">{{ vacantStallsCount }}</div>
          <div class="metric-sub">Available for lease</div>
        </div>
      </div>
    </section>

    <!-- CONTROLS & SEARCH BAR -->
    <div class="dash-controls-bar">
      <!-- Status Tabs -->
      <div class="tab-pills" role="tablist">
        <button
          type="button"
          class="tab-pill"
          :class="{ active: currentTab === 'PENDING' }"
          @click="currentTab = 'PENDING'"
        >
          Awaiting Approval ({{ pendingCount }})
        </button>
        <button
          type="button"
          class="tab-pill"
          :class="{ active: currentTab === 'APPROVED' }"
          @click="currentTab = 'APPROVED'"
        >
          Approved Applications ({{ approvedCount }})
        </button>
        <button
          type="button"
          class="tab-pill"
          :class="{ active: currentTab === 'ALL' }"
          @click="currentTab = 'ALL'"
        >
          All Applications ({{ totalCount }})
        </button>
      </div>

      <!-- Search Input -->
      <div class="search-wrap">
        <i class="pi pi-search search-icon"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search applicant, business, receipt..."
          class="search-input"
        />
      </div>
    </div>

    <!-- APPLICATIONS TABLE -->
    <div class="table-card">
      <div class="table-card-header">
        <h2 class="table-card-title">
          <i class="pi pi-list-check text-indigo-500"></i>
          <span>{{ tableTitle }}</span>
          <span class="table-count-badge">{{ displayedApplicants.length }}</span>
        </h2>

        <span class="text-xs text-slate-500">
          Click <strong>View Details</strong> to inspect application documents before approval
        </span>
      </div>

      <div class="table-scroll">
        <table class="app-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Business Name & Type</th>
              <th>Advance-Payment Verification</th>
              <th>Required Documents</th>
              <th>Application Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="app in displayedApplicants" :key="app.id">
              <!-- Applicant Name & Contact -->
              <td>
                <div class="name-cell">
                  <div class="name-main">
                    {{ app.firstName }} {{ app.lastName }}
                  </div>
                  <div class="name-sub">
                    <i class="pi pi-phone text-[10px] mr-1"></i>{{ app.contact || 'No phone' }}
                  </div>
                </div>
              </td>

              <!-- Business Info -->
              <td>
                <div class="font-medium text-slate-800">
                  {{ app.businessName || '—' }}
                </div>
                <div class="text-xs text-slate-500">
                  {{ app.businessType || 'General Trade' }}
                </div>
              </td>

              <!-- Advance Payment Verification -->
              <td>
                <div v-if="hasAdvancePayment(app)" class="flex flex-col gap-1 items-start">
                  <span class="pay-pill paid">
                    <i class="pi pi-check-circle text-xs"></i>
                    <span>Verified / Paid</span>
                  </span>
                  <span v-if="getApplicantReceipt(app)" class="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    <i class="pi pi-receipt text-[10px]"></i>
                    {{ getApplicantReceipt(app) }}
                  </span>
                </div>
                <div v-else class="flex flex-col gap-1 items-start">
                  <span class="pay-pill unpaid">
                    <i class="pi pi-clock text-xs"></i>
                    <span>Unverified / Unpaid</span>
                  </span>
                  <span class="text-[11px] text-slate-400 italic">Advance payment pending</span>
                </div>
              </td>

              <!-- Required Document Availability -->
              <td>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span
                    :class="['doc-pill', getDocsInfo(app).hasId ? 'has-docs' : '']"
                    :title="getDocsInfo(app).hasId ? 'Valid ID submitted' : 'Valid ID missing'"
                  >
                    <i :class="getDocsInfo(app).hasId ? 'pi pi-check text-emerald-600' : 'pi pi-times text-slate-400'"></i>
                    Valid ID
                  </span>
                  <span
                    :class="['doc-pill', getDocsInfo(app).hasLetter ? 'has-docs' : '']"
                    :title="getDocsInfo(app).hasLetter ? 'Letter of Intent submitted' : 'Letter missing'"
                  >
                    <i :class="getDocsInfo(app).hasLetter ? 'pi pi-check text-emerald-600' : 'pi pi-times text-slate-400'"></i>
                    Letter of Intent
                  </span>
                </div>
              </td>

              <!-- Application Status -->
              <td>
                <span :class="['status-badge', statusClass(app.marketApprovalStatus)]">
                  <i :class="statusIcon(app.marketApprovalStatus)"></i>
                  {{ getDisplayStatus(app) }}
                </span>
              </td>

              <!-- Actions -->
              <td style="text-align: right;">
                <div class="btn-action-group" style="justify-content: flex-end;">
                  <!-- Unified Form (5 Pages) -->
                  <button
                    type="button"
                    class="btn-unified-form"
                    style="padding: 6px 11px; font-size: 11px; font-weight: 700; border-radius: 8px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"
                    @click.stop="openUnifiedForm(app)"
                    title="Review & complete Section VI.A Evaluation on Official 5-Page Form"
                  >
                    <i class="pi pi-file-check"></i>
                    <span>Unified Form (5 Pages)</span>
                  </button>

                  <!-- View Details -->
                  <button
                    type="button"
                    class="btn-details"
                    @click="open(app)"
                    title="Inspect applicant information and documents"
                  >
                    <i class="pi pi-eye"></i>
                    <span>View Details</span>
                  </button>

                  <!-- Approve Button: Enabled ONLY when canApprove(app) is true -->
                  <!-- Quick Assign Stall Button for applicants without stall -->
                  <button
                    v-if="!app.selectedStall && !app.occupant"
                    type="button"
                    class="btn-assign-quick"
                    style="padding: 6px 11px; font-size: 11px; font-weight: 700; border-radius: 8px; background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s;"
                    @click.stop="openQuickAssignModal(app)"
                    title="Assign a vacant stall to this applicant"
                  >
                    <i class="pi pi-building"></i>
                    <span>Assign Stall</span>
                  </button>

                  <!-- Approve Button: Enabled ONLY when canApprove(app) is true -->
                  <button
                    v-if="canApprove(app)"
                    type="button"
                    class="btn-approve"
                    :disabled="isApproving"
                    @click="approveMarketSupervisor(app)"
                    title="Approve this application and forward downstream"
                  >
                    <i class="pi pi-check" :class="{ 'pi-spin': isApproving }"></i>
                    <span>{{ isApproving ? 'Approving...' : 'Approve' }}</span>
                  </button>

                  <!-- Already Approved Status Chip -->
                  <span
                    v-else-if="isAlreadyApproved(app)"
                    class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1"
                  >
                    <i class="pi pi-check-circle"></i>
                    Approved
                  </span>
                </div>
              </td>
            </tr>

            <!-- EMPTY STATE -->
            <tr v-if="displayedApplicants.length === 0">
              <td colspan="6" class="p-8 text-center text-slate-400">
                <i class="pi pi-folder-open text-4xl mb-2 text-slate-300 block"></i>
                <span class="font-medium">No applications found</span>
                <p class="text-xs text-slate-400 mt-1">
                  {{ searchQuery ? 'Try adjusting your search keywords.' : 'No applications match the current filter.' }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- VIEW & APPROVE DETAIL MODAL -->
    <Dialog
      v-model:visible="showModal"
      modal
      header="Applicant Information & Documents"
      :style="{ width: '56vw', maxWidth: '850px' }"
      :breakpoints="{ '960px': '75vw', '641px': '95vw' }"
      class="modern-dialog"
    >
      <div v-if="selected.id" class="p-4 bg-slate-50 rounded-xl border border-slate-100">
        <!-- Top header info -->
        <div class="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200">
          <div class="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-sm">
            {{ (selected.firstName || '').charAt(0) }}{{ (selected.lastName || '').charAt(0) }}
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-800">
              {{ selected.lastName }}, {{ selected.firstName }} {{ selected.middleName || '' }}
            </h3>
            <p class="text-slate-500 font-medium">{{ selected.businessName || 'Business Applicant' }}</p>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
          <div>
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Phone</span>
            <p class="text-slate-800 font-medium">{{ selected.contact || '—' }}</p>
          </div>
          <div>
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</span>
            <p class="text-slate-800 font-medium">{{ selected.email || '—' }}</p>
          </div>
          <div>
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Business Type</span>
            <p class="text-slate-800 font-medium">{{ selected.businessType || 'General Retail' }}</p>
          </div>
          <div>
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Postal Address</span>
            <p class="text-slate-800 font-medium">{{ selected.address || 'Manticao, Misamis Oriental' }}</p>
          </div>
        </div>

        <!-- Verification Metrics Summary Cards -->
        <div class="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <!-- Selected Stall -->
          <div class="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
            <div class="flex items-center justify-between mb-1">
              <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Target Stall</span>
              <button
                type="button"
                class="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                @click="openQuickAssignModal(selected)"
              >
                <i class="pi pi-building"></i>
                {{ selected.selectedStall ? 'Change Stall' : 'Assign Stall' }}
              </button>
            </div>
            <p class="text-sm font-bold text-indigo-600 truncate">
              <span v-if="selected.selectedStall">
                Stall {{ selected.selectedStall.stallNo || selected.selectedStall.stall_no || selected.selectedStall.number }} - {{ selected.selectedStall.stallType || selected.selectedStall.stall_type || selected.selectedStall.type || 'Standard Stall' }}
              </span>
              <span v-else class="text-slate-400 font-normal text-xs italic">
                No stall assigned yet
              </span>
            </p>
          </div>

          <!-- Advance Payment -->
          <div class="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Advance Payment</span>
              <p class="text-sm font-semibold text-slate-700">
                {{ selected.advanceBalance ? '₱' + Number(selected.advanceBalance || 0).toLocaleString() : (hasAdvancePayment(selected) ? 'Paid' : 'Unpaid') }}
              </p>
            </div>
            <div>
              <Tag
                v-if="hasAdvancePayment(selected)"
                value="VERIFIED"
                severity="success"
                rounded
                class="!bg-emerald-100 !text-emerald-700 !font-bold"
              />
              <Tag
                v-else
                value="UNPAID"
                severity="danger"
                rounded
                class="!bg-rose-100 !text-rose-700 !font-bold"
              />
            </div>
          </div>

          <!-- Official Receipt -->
          <div class="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Receipt Number</span>
            <p v-if="getApplicantReceipt(selected)" class="text-xs font-bold font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded inline-flex items-center gap-1.5 mt-0.5">
              <i class="pi pi-receipt text-indigo-500"></i>
              {{ getApplicantReceipt(selected) }}
            </p>
            <p v-else class="text-slate-400 font-normal text-xs italic mt-1">
              No receipt recorded
            </p>
          </div>
        </div>

        <!-- SUBMITTED DOCUMENTS -->
        <div class="mt-6 pt-6 border-t border-slate-200">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Submitted Required Documents ({{ selected.documents?.length || 0 }})
            </h4>
            <span class="text-xs text-slate-400">Click any document to inspect in full view</span>
          </div>

          <div v-if="selected.documents && selected.documents.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              v-for="doc in selected.documents"
              :key="doc.id || doc.filePath || doc.fileName"
              class="group relative bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all"
              @click="openImagePreview(doc)"
            >
              <div class="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden relative">
                <!-- Loading spinner -->
                <div v-if="loadingImages[getDocKey(doc)]" class="flex flex-col items-center justify-center gap-1.5 text-indigo-500">
                  <i class="pi pi-spin pi-spinner text-2xl"></i>
                  <span class="text-[10px] text-slate-400">Loading...</span>
                </div>

                <!-- Image loaded via blob -->
                <img
                  v-else-if="isImageFile(doc) && loadedImageUrls[getDocKey(doc)]"
                  :src="loadedImageUrls[getDocKey(doc)]"
                  :alt="doc.documentType"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  @error="handleImageError($event, doc)"
                />

                <!-- Image fallback using direct URL -->
                <img
                  v-else-if="isImageFile(doc) && !imageFailed[getDocKey(doc)]"
                  :src="getDocUrl(doc)"
                  :alt="doc.documentType"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  @error="handleImageError($event, doc)"
                />

                <!-- Image load failure state -->
                <div
                  v-else-if="isImageFile(doc) && imageFailed[getDocKey(doc)]"
                  class="flex flex-col items-center justify-center gap-1 text-slate-400 p-2 text-center w-full h-full"
                >
                  <i class="pi pi-exclamation-triangle text-2xl text-amber-400"></i>
                  <span class="text-xs font-semibold text-slate-600">File Not Found</span>
                  <span class="text-[9px] text-slate-400 leading-tight">Image load error</span>
                </div>

                <!-- PDF or other file type -->
                <div v-else class="flex flex-col items-center gap-2 text-slate-400">
                  <i class="pi pi-file text-3xl"></i>
                  <span class="text-xs font-semibold">{{ getFileExtension(doc) }}</span>
                </div>
              </div>

              <div class="p-2.5">
                <p class="text-xs font-semibold text-slate-700 truncate">{{ doc.documentType }}</p>
                <p class="text-[10px] text-slate-400 truncate mt-0.5">{{ doc.fileName }}</p>
              </div>

              <div class="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors flex items-center justify-center">
                <i class="pi pi-eye text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"></i>
              </div>
            </div>
          </div>

          <!-- Empty Documents State -->
          <div v-else class="bg-white rounded-xl border border-slate-100 p-6 text-center">
            <i class="pi pi-file text-3xl text-slate-300 mb-2 block"></i>
            <p class="text-sm text-slate-500">No documents uploaded by this applicant.</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <div>
            <span v-if="isAlreadyApproved(selected)" class="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-flex items-center gap-1.5">
              <i class="pi pi-check-circle text-emerald-500"></i>
              Approved by Market Supervisor
            </span>
            <span v-else-if="!hasAdvancePayment(selected)" class="text-xs text-amber-600 font-medium">
              <i class="pi pi-info-circle text-xs mr-1"></i>Advance payment pending (can be settled with Treasury)
            </span>
          </div>

          <div class="flex items-center gap-2">
            <Button
              v-if="!selected.selectedStall"
              label="Assign Stall"
              icon="pi pi-building"
              severity="info"
              outlined
              @click="openQuickAssignModal(selected)"
            />
            <Button
              v-if="canApprove(selected)"
              label="Approve Application"
              icon="pi pi-check"
              severity="success"
              :disabled="isApproving"
              @click="approveMarketSupervisor(selected)"
            />
            <Button label="Close" icon="pi pi-times" text @click="close" class="text-slate-600" />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- QUICK ASSIGN STALL DIALOG -->
    <Dialog
      v-model:visible="showAssignStallModal"
      modal
      header="Assign Stall to Applicant"
      :style="{ width: '48vw', maxWidth: '650px' }"
      :breakpoints="{ '960px': '70vw', '641px': '95vw' }"
      class="modern-dialog"
    >
      <div v-if="selectedApplicantForStall" class="p-4 bg-slate-50 rounded-xl border border-slate-100">
        <!-- Applicant summary banner -->
        <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 mb-4 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
            {{ (selectedApplicantForStall.firstName || '').charAt(0) }}{{ (selectedApplicantForStall.lastName || '').charAt(0) }}
          </div>
          <div>
            <h4 class="font-bold text-slate-800 text-sm">
              {{ selectedApplicantForStall.lastName }}, {{ selectedApplicantForStall.firstName }}
            </h4>
            <p class="text-xs text-slate-500">
              {{ selectedApplicantForStall.businessName || 'Business Applicant' }} &bull; {{ selectedApplicantForStall.contact || 'No contact' }}
            </p>
          </div>
        </div>

        <!-- Vacant stall search input -->
        <div class="mb-3">
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
            Choose from Available Vacant Stalls ({{ vacantStallsList.length }})
          </label>
          <div class="relative">
            <input
              v-model="stallAssignmentSearch"
              type="text"
              placeholder="Filter by stall number, section, or type..."
              class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
            <span
              v-if="stallAssignmentSearch"
              class="absolute right-2.5 top-2 text-xs text-slate-400 cursor-pointer"
              @click="stallAssignmentSearch = ''"
            >✕</span>
          </div>
        </div>

        <!-- Vacant stalls list -->
        <div v-if="vacantStallsList.length === 0" class="p-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <i class="pi pi-info-circle text-2xl text-amber-500 block mb-1"></i>
          <span class="text-xs font-semibold">No vacant stalls available in the registry.</span>
        </div>

        <div v-else-if="filteredVacantStalls.length === 0" class="p-4 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
          No vacant stalls matching "{{ stallAssignmentSearch }}"
        </div>

        <div v-else class="max-h-60 overflow-y-auto space-y-2 pr-1">
          <div
            v-for="st in filteredVacantStalls"
            :key="st.id"
            class="p-3 bg-white rounded-xl border cursor-pointer transition-all flex items-center justify-between"
            :class="chosenStallId === st.id ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'"
            @click="selectStallToAssign(st)"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                :class="chosenStallId === st.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'"
              >
                #{{ st.number || st.stallNo || st.stall_no }}
              </div>
              <div>
                <strong class="text-xs text-slate-800 block">
                  Stall {{ st.number || st.stallNo || st.stall_no }} &bull; {{ st.type || st.stallType || st.stall_type || 'Standard Stall' }}
                </strong>
                <span class="text-[11px] text-slate-500">
                  {{ st.info || st.section || 'General Market Section' }}
                </span>
              </div>
            </div>
            <div class="text-right">
              <strong class="text-xs text-emerald-600 block">
                ₱{{ Number(st.rent || st.monthlyRent || st.monthly_rent || 0).toLocaleString() }}/mo
              </strong>
              <span
                v-if="chosenStallId === st.id"
                class="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full inline-block"
              >
                Selected
              </span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <button
            type="button"
            class="text-xs text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            @click="goToStallManagementForApplicant(selectedApplicantForStall)"
          >
            <i class="pi pi-map"></i>
            Open in Stall Management (Map View)
          </button>
          <div class="flex items-center gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              text
              @click="showAssignStallModal = false"
              class="text-slate-600"
            />
            <Button
              label="Confirm & Assign Stall"
              icon="pi pi-check"
              severity="success"
              :disabled="!chosenStallId || isAssigningStall"
              :loading="isAssigningStall"
              @click="confirmQuickAssignStall"
            />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- IMAGE / PDF FULL-PAGE PREVIEW DIALOG -->
    <Dialog
      v-model:visible="showImagePreview"
      modal
      :header="previewDoc?.documentType || 'Document Preview'"
      :style="{ width: '80vw', maxWidth: '900px' }"
      :breakpoints="{ '960px': '90vw', '641px': '98vw' }"
      class="modern-dialog"
    >
      <div v-if="previewDoc" class="flex flex-col items-center">
        <div class="w-full bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center min-h-[300px] max-h-[70vh]">
          <img
            v-if="isImageFile(previewDoc.fileName || previewDoc.filePath)"
            :src="loadedImageUrls[getDocKey(previewDoc)] || getDocUrl(previewDoc)"
            :alt="previewDoc.documentType"
            class="max-w-full max-h-[70vh] object-contain"
            @error="handleImageError($event, previewDoc)"
          />
          <iframe
            v-else-if="isPdfFile(previewDoc.fileName || previewDoc.filePath)"
            :src="loadedImageUrls[getDocKey(previewDoc)] || getDocUrl(previewDoc)"
            class="w-full h-[70vh] border-0"
          ></iframe>
          <div v-else class="flex flex-col items-center gap-3 p-8 text-slate-400">
            <i class="pi pi-file text-5xl"></i>
            <p class="text-sm">This file type cannot be previewed inline.</p>
          </div>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <a
            :href="getDocUrl(previewDoc)"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <i class="pi pi-external-link"></i>
            Open Original File
          </a>
          <span class="text-xs text-slate-400">{{ previewDoc.fileName }}</span>
        </div>
      </div>
      <template #footer>
        <Button label="Close" icon="pi pi-times" text @click="showImagePreview = false" class="text-slate-600" />
      </template>
    </Dialog>

    <!-- Official 3-Page Unified Application Form Modal (Market Supervisor - Mr. Edgar Eyana) -->
    <UnifiedApplicationFormModal
      :visible="showUnifiedFormModal"
      :application-data="selectedUnifiedData"
      role="SUPERVISOR"
      @close="showUnifiedFormModal = false"
      @submit-evaluation="handleSupervisorEvaluationSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import api from '../services/api'
import { API_ORIGIN } from '../config/apiConfig'
import { AUTH_TOKEN_KEY } from '../stores/auth'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import { systemMessage } from '../utils/systemMessage'
import UnifiedApplicationFormModal from '../components/UnifiedApplicationFormModal.vue'

const router = useRouter()
const route = useRoute()
const confirm = useConfirm()

// State
const applications = ref([])
const stalls = ref([])
const isLoading = ref(false)
const showModal = ref(false)
const selected = ref({})
const isApproving = ref(false)

// Unified Form Modal State
const showUnifiedFormModal = ref(false)
const selectedUnifiedData = ref({})

// Business Permit Form Modal State (Images 1-4)
const showBusinessPermitModal = ref(false)
const selectedBusinessPermitData = ref({})

function openBusinessPermitForm(app) {
  selectedBusinessPermitData.value = {
    ...app,
    id: app.id || app.applicationId,
    applicationNo: app.applicationNo || (app.id ? `BP-2026-${String(app.id).padStart(3, '0')}` : 'BP-2026-0782'),
    trackingNumber: app.trackingNumber || app.applicationNo || 'BP-2026-0782',
    businessIdNumber: app.businessIdNumber || (app.id ? `BIN-9024-${String(app.id).padStart(4, '0')}` : 'BIN-9024-0041'),
    applicationType: app.applicationType || 'NEW',
    paymentMode: app.paymentMode || 'Annually',
    orgType: app.orgType || 'Sole Proprietor',
    orgGender: app.orgGender || 'Female',
    dtiSecCdaRegNo: app.dtiSecCdaRegNo || '',
    tinNo: app.tinNo || '',
    tradeNameFranchise: app.tradeNameFranchise || app.businessName || 'ABUHAN FISH VENDOR STALL',
    businessName: app.tradeNameFranchise || app.businessName || 'ABUHAN FISH VENDOR STALL',
    businessType: app.businessType || 'Retail',
    mainHouseBldgNo: app.mainHouseBldgNo || 'P-4',
    mainBldgName: app.mainBldgName || '',
    mainLotNo: app.mainLotNo || '',
    mainBlockNo: app.mainBlockNo || '',
    mainStreet: app.mainStreet || 'P-4',
    mainSubdivision: app.mainSubdivision || '',
    mainBarangay: app.mainBarangay || 'POBLACION',
    mainDistrict: app.mainDistrict || '',
    mainMunicipality: app.mainMunicipality || 'MANTICAO',
    mainProvince: app.mainProvince || 'MISAMIS OR.',
    mainZipCode: app.mainZipCode || '9024',
    mobileNo: app.mobileNo || app.contact || '09932889970',
    ownerSurname: app.ownerSurname || app.lastName || 'ABUHAN',
    ownerGivenName: app.ownerGivenName || app.firstName || 'RISMA',
    ownerMiddleName: app.ownerMiddleName || app.middleName || 'PORCO',
    businessAreaSqm: app.businessAreaSqm || 9,
    totalFloorAreaSqm: app.totalFloorAreaSqm || 9,
    numEmployeesMale: app.numEmployeesMale || 0,
    numEmployeesFemale: app.numEmployeesFemale || 1,
    numEmployeesLguResiding: app.numEmployeesLguResiding || 1,
    deliveryVehiclesVanTruck: app.deliveryVehiclesVanTruck || 0,
    deliveryVehiclesMotorcycle: app.deliveryVehiclesMotorcycle || 0,
    propertyOwned: app.propertyOwned ?? true,
    taxIncentivesEnjoyed: app.taxIncentivesEnjoyed ?? false,
    businessActivity: app.businessActivity || 'Main Office',
    businessLines: app.businessLines || [
      { lineOfBusiness: 'Fish Vendor / Wet Section Trade', psic: '', units: 1, capitalization: 50000, grossSales: 0 }
    ],
    bploApprovedBy: app.bploApprovedBy || 'JUNE CLYDE D. PATILANO',
    bploDesignation: app.bploDesignation || 'LRCO II/BPLO Designate',
    bploDateSigned: app.bploDateSigned || new Date(),
    marketOfficeVerifiedBy: 'EDGAR EYANA',
    marketOfficeVerifiedRemarks: app.marketOfficeVerifiedRemarks || 'FISH VENDOR OK',
    treasurerVerifiedBy: app.treasurerVerifiedBy || 'J. ANDANA',
    treasurerVerifiedDate: app.treasurerVerifiedDate || new Date(),
    totalFeesAssessment: app.totalFeesAssessment || 2890.60,
    businessPermitOrNo: app.businessPermitOrNo || '3675241',
    perjuryDeclarationAgreed: true
  }
  showBusinessPermitModal.value = true
}

function openUnifiedForm(app) {
  selectedUnifiedData.value = {
    id: app.id || app.applicationId,
    applicationNo: app.applicationNo || `APP-${app.id}`,
    firstName: app.firstName,
    middleName: app.middleName,
    lastName: app.lastName,
    address: app.address,
    contact: app.contact,
    validIdType: app.validIdType || app.valid_id_type || 'National ID (PhilSys)',
    validIdNo: app.validIdNo || app.valid_id_no || '',
    businessName: app.businessName,
    businessType: app.businessType,
    natureOfBusiness: app.natureOfBusiness || [],
    otherNatureOfBusiness: app.otherNatureOfBusiness || '',
    productsCommodities: app.productsCommodities || '',
    stallSpaceType: app.stallSpaceType || 'Regular Stall',
    preferredStallNo: app.selectedStall?.stallNo || app.preferredStallNo || '',
    estimatedEmployees: app.estimatedEmployees || 1,
    undertakingAgreed: true,
    loiUrl: app.loiUrl || app.letter_document_url,
    validIdUrl: app.validIdUrl || app.id_document_url,
    loiContent: app.loiContent || '',
    monthlyRent: app.selectedStall?.monthlyRent || 1500,
    marketOfficeStatus: app.marketOfficeStatus || 'Complete',
    marketOfficeStallRecommended: app.marketOfficeStallRecommended || app.selectedStall?.stallNo || '',
    marketOfficeSection: app.marketOfficeSection || app.selectedStall?.stallType || 'Standard',
    marketOfficeNature: app.marketOfficeNature || app.businessType || '',
    marketOfficeRemarks: app.marketOfficeRemarks || 'Recommended for Mayoral and Treasury review.',
    treasuryFeeMonthly: app.treasuryFeeMonthly || app.selectedStall?.monthlyRent || 1500,
    treasuryFeeOther: app.treasuryFeeOther || 5000,
    treasuryFeeSecurityDeposit: app.treasuryFeeSecurityDeposit || (Number(app.selectedStall?.monthlyRent || 1500) * 2),
    treasuryTotalDue: app.treasuryTotalDue || ((Number(app.selectedStall?.monthlyRent || 1500) * 3) + 5000),
    treasuryRemarks: app.treasuryRemarks || '',
    finalRecommendation: app.finalRecommendation || 'RECOMMENDED',
    mayorDecision: app.mayorDecision || 'PENDING',
    mayorRemarks: app.mayorRemarks || '',
    mayorDecisionDate: app.mayorDecisionDate || null,
    assignedStallNo: app.assignedStallNo || app.selectedStall?.stallNo || '',
    assignedMarketSection: app.assignedMarketSection || app.selectedStall?.stallType || '',
    assignedMonthlyRent: app.assignedMonthlyRent || app.selectedStall?.monthlyRent || 1500,
    paymentOrNo: app.paymentOrNo || '',
    paymentAmount: app.paymentAmount || 0,
    applicantAcknowledged: app.applicantAcknowledged ?? false
  }
  showUnifiedFormModal.value = true
}

async function handleSupervisorEvaluationSubmit(evaluation) {
  try {
    const appId = evaluation.id || selectedUnifiedData.value.id
    await api.put(`/applications/${appId}`, {
      marketOfficeStatus: evaluation.status,
      marketOfficeStallRecommended: evaluation.stallRecommended,
      marketOfficeSection: evaluation.marketSection,
      marketOfficeNature: evaluation.natureOfBusiness,
      marketOfficeRemarks: evaluation.remarks,
      finalRecommendation: evaluation.finalRecommendation || 'RECOMMENDED'
    })
    await systemMessage.alert('Market Office Evaluation (Section VI.A) successfully recorded.', {
      title: 'Evaluation Submitted',
      severity: 'success'
    })
    showUnifiedFormModal.value = false
    await refreshData()
  } catch (err) {
    console.error('[MarketSupervisor] Evaluation error:', err)
    await systemMessage.alert(err.message || 'Could not save Market Office evaluation.', {
      title: 'Submission Error',
      severity: 'error'
    })
  }
}

// Quick Stall Assignment State
const showAssignStallModal = ref(false)
const selectedApplicantForStall = ref(null)
const chosenStallId = ref(null)
const isAssigningStall = ref(false)
const stallAssignmentSearch = ref('')

// Controls
const currentTab = ref('PENDING')
const searchQuery = ref('')

// Image preview state
const showImagePreview = ref(false)
const previewDoc = ref(null)
const loadedImageUrls = ref({})
const loadingImages = ref({})
const imageFailed = ref({})

// Quick assign vacant stalls computation
const vacantStallsList = computed(() => {
  return (stalls.value || []).filter((s) => {
    const st = String(s.status || '').toUpperCase()
    return st === 'VACANT' || st === 'AVAILABLE'
  })
})

const filteredVacantStalls = computed(() => {
  const list = vacantStallsList.value
  const q = stallAssignmentSearch.value.trim().toLowerCase()
  if (!q) return list
  return list.filter((s) => {
    const num = String(s.number || s.stallNo || s.stall_no || '').toLowerCase()
    const type = String(s.type || s.stallType || s.stall_type || '').toLowerCase()
    const info = String(s.info || s.section || '').toLowerCase()
    return num.includes(q) || type.includes(q) || info.includes(q)
  })
})

function openQuickAssignModal(app) {
  selectedApplicantForStall.value = app
  chosenStallId.value = null
  stallAssignmentSearch.value = ''
  showAssignStallModal.value = true
}

function selectStallToAssign(stall) {
  chosenStallId.value = stall.id
}

async function confirmQuickAssignStall() {
  if (!chosenStallId.value || !selectedApplicantForStall.value) {
    systemMessage.warn('Please select a vacant stall to assign.', 'Selection Required')
    return
  }

  isAssigningStall.value = true
  try {
    const { allocateOccupant } = await import('../services/stallService')
    const app = selectedApplicantForStall.value
    const targetStall = stalls.value.find((s) => s.id === chosenStallId.value)
    const stallNum = targetStall?.number || targetStall?.stallNo || chosenStallId.value

    await allocateOccupant(chosenStallId.value, app.id)

    systemMessage.success(
      `Stall #${stallNum} successfully assigned to ${app.firstName || ''} ${app.lastName || ''}!`,
      'Stall Assigned'
    )

    showAssignStallModal.value = false

    // Update in applications
    const index = applications.value.findIndex((a) => a.id === app.id)
    if (index !== -1) {
      applications.value[index] = {
        ...applications.value[index],
        selectedStall: targetStall,
        selectedStallId: chosenStallId.value,
        marketApprovalStatus: 'APPROVED',
        marketSupervisorApproved: true
      }
    }

    if (selected.value?.id === app.id) {
      selected.value = {
        ...selected.value,
        selectedStall: targetStall,
        selectedStallId: chosenStallId.value,
        marketApprovalStatus: 'APPROVED',
        marketSupervisorApproved: true
      }
    }

    await refreshData()
  } catch (err) {
    console.error(err)
    systemMessage.error(err.message || 'Failed to assign stall', 'Assignment Failed')
  } finally {
    isAssigningStall.value = false
  }
}

function goToStallManagementForApplicant(app) {
  showAssignStallModal.value = false
  showModal.value = false
  router.push({
    name: 'MSStalls',
    query: {
      assignStakeholderId: app?.id,
      view: 'map'
    }
  })
}

// ===================================
// DATA LOADING
// ===================================
async function loadApplications() {
  try {
    const response = await api.get('/stakeholders')
    applications.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.error('[Dashboard] Error loading applications:', error)
  }
}

async function loadStalls() {
  try {
    const response = await api.get('/stalls')
    stalls.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.error('[Dashboard] Error loading stalls:', error)
  }
}

async function refreshData() {
  isLoading.value = true
  try {
    await Promise.all([loadApplications(), loadStalls()])
  } finally {
    isLoading.value = false
  }
}

// ===================================
// APPROVAL ELIGIBILITY RULES
// ===================================
function hasAdvancePayment(app) {
  if (!app) return false
  return (
    app.advancePayment === true ||
    app.advancePaymentPaid === true ||
    app.advancePaymentCompleted === true ||
    app.advance_payment_paid === true ||
    app.advance_payment_completed === true ||
    app.treasurerApproved === true ||
    app.treasurer_approved === true ||
    (Array.isArray(app.payments) &&
      app.payments.some(
        (p) =>
          (p.paymentType === 'ADVANCE_PAYMENT' || p.payment_type === 'ADVANCE_PAYMENT') &&
          String(p.status || 'PAID').toUpperCase() !== 'FAILED'
      ))
  )
}

function isAlreadyApproved(app) {
  if (!app) return false
  if (app.marketSupervisorApproved === true || app.market_supervisor_approved === true) return true
  if (String(app.marketApprovalStatus || '').toUpperCase() === 'APPROVED') return true
  const appStatus = String(app.applicationStatus || '').toUpperCase()
  return ['PAID_READY_FOR_CONTRACT', 'PENDING_BPLO_APPROVAL', 'APPROVED', 'COMPLETED', 'FULLY_APPROVED'].includes(appStatus)
}

function canApprove(app) {
  if (!app) return false
  // Must not already be approved
  if (isAlreadyApproved(app)) return false

  const appStatus = String(app.applicationStatus || '').toUpperCase()
  if (['REJECTED', 'CANCELLED'].includes(appStatus)) return false

  const marketStatus = String(app.marketApprovalStatus || 'PENDING').toUpperCase()
  const isPending = marketStatus === 'PENDING' || marketStatus === 'FOR_APPROVAL'

  return isPending
}

// ===================================
// SUMMARY METRIC COUNTS
// ===================================
const totalCount = computed(() => applications.value.length)

const pendingCount = computed(() => {
  return applications.value.filter((app) => canApprove(app)).length
})

const approvedCount = computed(() => {
  return applications.value.filter((app) => isAlreadyApproved(app)).length
})

const totalStallsCount = computed(() => stalls.value.length)

const occupiedStallsCount = computed(() => {
  return stalls.value.filter((s) => String(s.status).toUpperCase() === 'OCCUPIED').length
})

const vacantStallsCount = computed(() => {
  return stalls.value.filter((s) => {
    const st = String(s.status).toUpperCase()
    return st === 'VACANT' || st === 'AVAILABLE'
  }).length
})

// ===================================
// FILTERED APPLICANTS LIST
// ===================================
const displayedApplicants = computed(() => {
  let list = applications.value

  if (currentTab.value === 'PENDING') {
    list = list.filter((app) => canApprove(app))
  } else if (currentTab.value === 'APPROVED') {
    list = list.filter((app) => isAlreadyApproved(app))
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return list

  return list.filter((app) => {
    const fullName = `${app.firstName || ''} ${app.lastName || ''}`.toLowerCase()
    const bizName = String(app.businessName || '').toLowerCase()
    const contact = String(app.contact || '').toLowerCase()
    const receipt = String(getApplicantReceipt(app) || '').toLowerCase()
    return fullName.includes(q) || bizName.includes(q) || contact.includes(q) || receipt.includes(q)
  })
})

const tableTitle = computed(() => {
  if (currentTab.value === 'PENDING') return 'Applications Awaiting Market Supervisor Approval'
  if (currentTab.value === 'APPROVED') return 'Supervisor-Approved Applications'
  return 'All Registered Applications'
})

// ===================================
// DOCUMENT CHECKLIST HELPER
// ===================================
function getDocsInfo(app) {
  if (!app) return { hasId: false, hasLetter: false }
  const docs = Array.isArray(app.documents) ? app.documents : []
  const hasId =
    docs.some((d) => {
      const t = String(d.documentType || d.document_type || '').toUpperCase()
      return t.includes('ID') || t.includes('VALID')
    }) || !!(app.idDocumentUrl || app.id_document_url || app.idUrl || app.idFileName)
  const hasLetter =
    docs.some((d) => {
      const t = String(d.documentType || d.document_type || '').toUpperCase()
      return t.includes('LETTER') || t.includes('INTENT')
    }) || !!(app.letterDocumentUrl || app.letter_document_url || app.letterUrl || app.letterFileName)
  return { hasId, hasLetter }
}

function getApplicantReceipt(app) {
  if (!app) return ''
  if (app.receiptNo || app.receipt_no) return app.receiptNo || app.receipt_no
  if (app.advanceReceiptNo || app.advance_receipt_no) return app.advanceReceiptNo || app.advance_receipt_no
  if (Array.isArray(app.payments) && app.payments.length > 0) {
    const adv = app.payments.find(
      (p) => p.paymentType === 'ADVANCE_PAYMENT' || p.payment_type === 'ADVANCE_PAYMENT'
    )
    if (adv?.receiptNo || adv?.receipt_no) return adv.receiptNo || adv.receipt_no
    const latest = app.payments[0]
    if (latest?.receiptNo || latest?.receipt_no) return latest.receiptNo || latest.receipt_no
  }
  if (app.referenceNo || app.reference_no) return app.referenceNo || app.reference_no
  return ''
}

function statusClass(status) {
  const s = String(status || 'PENDING').toLowerCase()
  if (s === 'approved') return 'approved'
  if (s === 'rejected') return 'rejected'
  return 'pending'
}

function statusIcon(status) {
  const s = String(status || 'PENDING').toLowerCase()
  if (s === 'approved') return 'pi pi-check-circle text-emerald-600'
  if (s === 'rejected') return 'pi pi-times-circle text-rose-600'
  return 'pi pi-clock text-amber-600'
}

function getDisplayStatus(app) {
  if (isAlreadyApproved(app)) return 'APPROVED'
  return app.marketApprovalStatus || 'PENDING'
}

// ===================================
// APPROVE ACTION
// ===================================
async function approveMarketSupervisor(app) {
  if (!app || isApproving.value) return
  const applicantName = `${app.firstName || ''} ${app.lastName || ''}`.trim() || 'this applicant'

  // Resolve target stall ID
  const targetStallId = app.selectedStallId || app.selected_stall_id || app.selectedStall?.id || app.occupant?.stall?.id || app.occupant?.stall_id
  const targetStall = stalls.value.find((s) => String(s.id) === String(targetStallId))
  const stallNum = targetStall?.number || targetStall?.stallNo || app.selectedStall?.stallNo || app.occupant?.stall?.stallNo || ''

  if (!targetStallId) {
    systemMessage.info(`Please assign a market stall to ${applicantName} to approve and create their contract.`, 'Stall Assignment Required')
    openQuickAssignModal(app)
    return
  }

  confirm.require({
    header: 'Confirm Market Supervisor Approval & Stall Assignment',
    message: `Are you sure you want to approve ${applicantName}, officially assign Stall #${stallNum || targetStallId}, and auto-generate their digital lease contract?`,
    icon: 'pi pi-check-circle',
    acceptLabel: 'Approve & Create Contract',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-success',
    accept: async () => {
      isApproving.value = true
      try {
        const response = await api.put(`/stakeholders/${app.id}/market-approve`, { stallId: targetStallId })
        const updated = response.data

        const index = applications.value.findIndex((a) => a.id === app.id)
        if (index !== -1) {
          applications.value[index] = {
            ...applications.value[index],
            ...updated,
            selectedStall: targetStall,
            selectedStallId: targetStallId,
            marketApprovalStatus: 'APPROVED',
            marketSupervisorApproved: true
          }
        }

        if (selected.value?.id === app.id) {
          selected.value = {
            ...selected.value,
            ...updated,
            selectedStall: targetStall,
            selectedStallId: targetStallId,
            marketApprovalStatus: 'APPROVED',
            marketSupervisorApproved: true
          }
        }

        // Non-blocking notification dispatch
        void (async () => {
          try {
            const { sendApplicationProgressNotification } = await import('../services/emailNotificationService')
            await sendApplicationProgressNotification({
              stakeholderId: app.id,
              userId: app.userId || app.user_id,
              email: app.email,
              stage: 'MARKET_SUPERVISOR',
              status: 'APPROVED',
              title: 'Market Supervisor Approval Granted',
              message: `Your application has been verified and approved by the Market Supervisor. Stall #${stallNum || ''} has been officially assigned with an active digital lease contract. Your application has proceeded to BPLO business permit validation.`,
              remarks: `Assigned Stall: #${stallNum || ''}. Lease contract initiated.`
            })
          } catch (eErr) {
            console.warn('[MarketSupervisor] Email dispatch warning:', eErr)
          }
        })()

        systemMessage.success(`Application for ${applicantName} approved, Stall #${stallNum || ''} assigned, and digital lease contract created!`, 'Approved & Contract Created')
        await refreshData()
      } catch (error) {
        console.error('[Dashboard] Approval failed:', error)
        systemMessage.error(error.message || 'Approval request failed', 'Approval Failed')
      } finally {
        isApproving.value = false
      }
    }
  })
}

// ===================================
// DETAILS DIALOG & DOCUMENT HELPERS
// ===================================
function extractFileName(val) {
  if (!val) return 'document'
  const clean = String(val).split('?')[0]
  const slashParts = clean.split('/')
  const lastPart = slashParts[slashParts.length - 1]
  const backslashParts = lastPart.split('\\\\')
  return backslashParts[backslashParts.length - 1] || 'document'
}

function open(app) {
  let docs = Array.isArray(app.documents) ? [...app.documents] : []

  const fieldMap = [
    { key: 'letterOfIntent', label: 'Letter of Intent' },
    { key: 'validID', label: 'Valid ID' },
    { key: 'applicationForm', label: 'Application Form' },
    { key: 'avatar', label: 'Profile Photo' }
  ]
  for (const { key, label } of fieldMap) {
    const rawVal =
      app[key + 'FileName'] || app[key + 'File'] || app[key + 'Url'] || app[key + '_url']
    if (rawVal && typeof rawVal === 'string' && rawVal.trim() !== '') {
      if (!docs.some((d) => (d.documentType || d.document_type) === label)) {
        docs.push({
          id: key,
          documentType: label,
          fileName: extractFileName(rawVal),
          filePath: app[key + 'Url'] || app[key + '_url'] || rawVal
        })
      }
    }
  }

  const idUrl = app.idDocumentUrl || app.id_document_url || app.idUrl
  if (
    idUrl &&
    !docs.some(
      (d) =>
        (d.documentType || d.document_type) === 'VALID_ID' ||
        (d.documentType || d.document_type) === 'Valid ID'
    )
  ) {
    docs.push({
      id: 'valid_id',
      documentType: 'Valid ID',
      fileName: app.idFileName || app.id_file_name || extractFileName(idUrl),
      filePath: idUrl
    })
  }

  const letterUrl = app.letterDocumentUrl || app.letter_document_url || app.letterUrl
  if (
    letterUrl &&
    !docs.some(
      (d) =>
        (d.documentType || d.document_type) === 'APPLICATION_LETTER' ||
        (d.documentType || d.document_type) === 'Letter of Intent'
    )
  ) {
    docs.push({
      id: 'letter_of_intent',
      documentType: 'Letter of Intent',
      fileName: app.letterFileName || app.letter_file_name || extractFileName(letterUrl),
      filePath: letterUrl
    })
  }

  docs = docs.map((doc, idx) => {
    const filePath = doc.filePath || doc.file_path || doc.url || ''
    const fileName =
      doc.fileName || doc.file_name || (filePath ? extractFileName(filePath) : 'document_' + (idx + 1))
    const documentType = doc.documentType || doc.document_type || 'Document'
    return {
      ...doc,
      id: doc.id || fileName,
      fileName,
      filePath: filePath || fileName,
      documentType
    }
  })

  app.documents = docs

  for (const doc of docs) {
    if (isImageFile(doc) || isPdfFile(doc)) {
      fetchImageBlob(doc)
    }
  }

  selected.value = app
  showModal.value = true
}

function close() {
  showModal.value = false
  selected.value = {}
}

function getDocKey(doc) {
  if (!doc) return ''
  if (typeof doc === 'string') return doc
  return String(doc.filePath || doc.file_path || doc.fileName || doc.file_name || doc.id || '')
}

function getDocUrl(doc) {
  if (!doc) return ''
  let target =
    typeof doc === 'object'
      ? doc.filePath || doc.file_path || doc.url || doc.fileName || doc.file_name || ''
      : String(doc || '')
  if (!target) return ''

  if (
    target.startsWith('http://') ||
    target.startsWith('https://') ||
    target.startsWith('data:') ||
    target.startsWith('blob:')
  ) {
    return target
  }

  if (
    target.includes('applications/') ||
    target.includes('stalls/') ||
    target.includes('documents/') ||
    target.startsWith('uploads/')
  ) {
    const clean = target.replace(/^\/?(uploads\/)?/, '')
    return 'https://uzykxxphunglcwojoqtf.supabase.co/storage/v1/object/public/uploads/' + clean
  }

  const cleaned = target.replace(/^\/?(uploads\/)?/, '')
  return API_ORIGIN + '/uploads/' + cleaned
}

async function fetchImageBlob(docOrFileName) {
  const key = getDocKey(docOrFileName)
  if (!key || loadedImageUrls.value[key]) return

  const url = getDocUrl(docOrFileName)
  if (!url) return

  if (url.startsWith('data:') || url.startsWith('blob:')) {
    loadedImageUrls.value[key] = url
    return
  }

  loadingImages.value[key] = true
  imageFailed.value[key] = false

  try {
    const isSupabase = url.includes('supabase.co')
    const headers = isSupabase
      ? {}
      : {
          Authorization:
            'Bearer ' + (localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('token') || '')
        }

    let res = await fetch(url, { headers })
    if (!res.ok && !url.includes('/api/uploads/') && !isSupabase) {
      const altUrl = url.replace('/uploads/', '/api/uploads/')
      try {
        const altRes = await fetch(altUrl, { headers })
        if (altRes.ok) res = altRes
      } catch (ignored) {}
    }

    if (res.ok) {
      const blob = await res.blob()
      loadedImageUrls.value[key] = URL.createObjectURL(blob)
    } else {
      if (url.startsWith('http')) {
        loadedImageUrls.value[key] = url
      } else {
        imageFailed.value[key] = true
      }
    }
  } catch (err) {
    console.warn('[ImageLoad] Error fetching ' + url + ':', err)
    if (url.startsWith('http')) {
      loadedImageUrls.value[key] = url
    } else {
      imageFailed.value[key] = true
    }
  } finally {
    loadingImages.value[key] = false
  }
}

function isImageFile(doc) {
  const target =
    typeof doc === 'object'
      ? doc?.filePath || doc?.file_path || doc?.fileName || doc?.file_name || ''
      : String(doc || '')
  if (!target) return false
  if (target.startsWith('data:image/')) return true
  const clean = target.split('?')[0].split('#')[0]
  const ext = clean.split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
}

function isPdfFile(doc) {
  const target =
    typeof doc === 'object'
      ? doc?.filePath || doc?.file_path || doc?.fileName || doc?.file_name || ''
      : String(doc || '')
  if (!target) return false
  if (target.startsWith('data:application/pdf')) return true
  const clean = target.split('?')[0].split('#')[0]
  const ext = clean.split('.').pop().toLowerCase()
  return ext === 'pdf'
}

function getFileExtension(doc) {
  const target =
    typeof doc === 'object'
      ? doc?.filePath || doc?.file_path || doc?.fileName || doc?.file_name || ''
      : String(doc || '')
  if (!target) return ''
  if (target.startsWith('data:image/')) return '.IMG'
  if (target.startsWith('data:application/pdf')) return '.PDF'
  const clean = target.split('?')[0].split('#')[0]
  return '.' + clean.split('.').pop().toUpperCase()
}

function openImagePreview(doc) {
  previewDoc.value = doc
  const key = getDocKey(doc)
  if (key && !loadedImageUrls.value[key]) {
    fetchImageBlob(doc)
  }
  showImagePreview.value = true
}

function handleImageError(event, doc) {
  const key = getDocKey(doc)
  if (key) imageFailed.value[key] = true
  event.target.style.display = 'none'
  const parent = event.target.parentElement
  if (parent && !parent.querySelector('.img-fallback-box')) {
    const fallback = document.createElement('div')
    fallback.className =
      'img-fallback-box flex flex-col items-center justify-center gap-1.5 text-slate-400 p-3 text-center w-full h-full'
    fallback.innerHTML =
      '<i class="pi pi-exclamation-triangle text-2xl text-amber-400"></i><span class="text-xs font-semibold text-slate-600">File Not Found</span><span class="text-[10px] text-slate-400 leading-tight">Image load error</span>'
    parent.appendChild(fallback)
  }
}

watch(() => route.query.tab, (tab) => {
  if (tab === 'applications') {
    currentTab.value = 'PENDING'
  } else if (tab === 'occupancy') {
    currentTab.value = 'APPROVED'
  }
}, { immediate: true })

onMounted(() => {
  refreshData()
})
</script>

<style scoped src="../styles/MarketSupervisor/dashboard.css"></style>
