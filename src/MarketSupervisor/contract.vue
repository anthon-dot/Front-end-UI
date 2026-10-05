<template>
	<div class="dashboard contracts-page">
		<MarketSupervisorMenu :forceOpen="true" />

		<main class="content">
			<!-- PAGE HEADER -->
			<div class="page-header">
				<div>
					<h1 class="title">
						<i class="pi pi-file-edit" style="color: #0d9488; font-size: 26px;"></i>
						Contracts Management
					</h1>
					<p class="subtitle">
						Manage municipal stall lease contracts, agreement terms, and stakeholder records
					</p>
				</div>

				<div class="controls">
					<SearchField
						v-model="q"
						placeholder="Search contract, stakeholder, stall..."
					/>

					<div class="controls-actions">
						<button
							class="btn-outline"
							@click="refresh"
							title="Refresh data from server"
						>
							<i class="pi pi-refresh" :class="{ 'pi-spin': isLoading }"></i>
							Refresh
						</button>
					</div>
				</div>
			</div>

			<!-- STATS METRICS -->
			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-header">
						<div class="stat-icon teal">
							<i class="pi pi-file"></i>
						</div>
					</div>
					<div>
						<div class="stat-label">Total Contracts</div>
						<div class="stat-value">{{ contracts.length }}</div>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-header">
						<div class="stat-icon green">
							<i class="pi pi-check-circle"></i>
						</div>
					</div>
					<div>
						<div class="stat-label">Active Contracts</div>
						<div class="stat-value">{{ activeContractsCount }}</div>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-header">
						<div class="stat-icon amber">
							<i class="pi pi-clock"></i>
						</div>
					</div>
					<div>
						<div class="stat-label">Expired / Terminated</div>
						<div class="stat-value">{{ inactiveContractsCount }}</div>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-header">
						<div class="stat-icon blue">
							<i class="pi pi-users"></i>
						</div>
					</div>
					<div>
						<div class="stat-label">Stakeholders with Stalls</div>
						<div class="stat-value">{{ stakeholdersWithStallsCount }}</div>
					</div>
				</div>
			</div>

			<!-- TABS NAVIGATION -->
			<div class="tabs-nav">
				<button
					class="tab-btn"
					:class="{ active: activeTab === 'contracts' }"
					@click="activeTab = 'contracts'"
				>
					<i class="pi pi-list"></i>
					All Contracts
					<span class="tab-badge">{{ filteredContracts.length }}</span>
				</button>

				<button
					class="tab-btn"
					:class="{ active: activeTab === 'stakeholders' }"
					@click="activeTab = 'stakeholders'"
				>
					<i class="pi pi-users"></i>
					Stakeholders & Stalls
					<span class="tab-badge">{{ filteredStakeholders.length }}</span>
				</button>
			</div>

			<!-- ACTIVE FILTER BANNER IF NAVIGATED FROM STALL MANAGEMENT -->
			<div v-if="q" style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px; background: #f0fdfa; border: 1px solid #99f6e4; padding: 10px 16px; border-radius: 12px; font-size: 13px; color: #0f766e;">
				<i class="pi pi-filter" style="color: #0d9488;"></i>
				<span>Active Filter: <strong>"{{ q }}"</strong> (Showing contracts matching this stall/stakeholder)</span>
				<button style="margin-left: auto; background: #ffffff; border: 1px solid #cbd5e1; padding: 3px 10px; border-radius: 6px; font-size: 12px; color: #475569; font-weight: 700; cursor: pointer;" @click="q = ''">
					✕ Clear Filter
				</button>
			</div>

			<!-- TAB 1: ALL CONTRACTS TABLE -->
			<div v-if="activeTab === 'contracts'" class="card table-card">
				<div class="table-header">
					<div class="table-title-wrap">
						<h2 class="table-title">Lease Contracts Directory</h2>
						<span class="record-count">{{ filteredContracts.length }} records</span>
					</div>

					<div class="table-filter-group">
						<label for="statusFilter" style="font-size: 13px; font-weight: 600; color: #64748b;">Status:</label>
						<select id="statusFilter" v-model="statusFilter" class="filter-select">
							<option value="ALL">All Statuses</option>
							<option value="ACTIVE">Active</option>
							<option value="EXPIRED">Expired</option>
							<option value="TERMINATED">Terminated</option>
						</select>
					</div>
				</div>

				<div class="table-wrapper">
					<table class="contract-table">
						<thead>
							<tr>
								<th>Contract Ref</th>
								<th>Stakeholder</th>
								<th>Business</th>
								<th>Stall</th>
								<th>Monthly Rent</th>
								<th>Frequency</th>
								<th>Lease Duration</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="c in filteredContracts" :key="c.id || c.contractNo">
								<td>
									<div class="contract-ref-badge">
										<i class="pi pi-shield" style="font-size: 10px; color: #0d9488;"></i>
										{{ c.contractNo || c.ref || ('CON-' + c.id) }}
									</div>
								</td>

								<td>
									<div class="stakeholder-cell">
										<div class="avatar-circle">
											{{ getInitials(c.stakeholderName || getContractStakeholder(c)?.firstName, getContractStakeholder(c)?.lastName) }}
										</div>
										<div>
											<div class="name">
												{{ c.stakeholderName || getStakeholderFullName(getContractStakeholder(c)) || 'Assigned Lessee' }}
											</div>
											<div class="sub">
												ID: #{{ c.stakeholderId || getContractStakeholder(c)?.id || '-' }}
											</div>
										</div>
									</div>
								</td>

								<td>
									<div class="name">
										{{ c.businessName || getContractStakeholder(c)?.businessName || 'General Trade' }}
									</div>
									<div class="sub">
										{{ getContractStakeholder(c)?.businessType || 'Retail' }}
									</div>
								</td>

								<td>
									<span class="stall-badge">
										<i class="pi pi-building" style="font-size: 10px;"></i>
										Stall {{ getContractStallNo(c) }}
									</span>
									<div v-if="getContractStallType(c)" class="sub" style="margin-top: 3px;">
										{{ getContractStallType(c) }}
									</div>
								</td>

								<td>
									<div class="rent-text">
										{{ formatCurrency(c.monthlyRent || getContractStall(c)?.monthlyRent) }}
									</div>
								</td>

								<td>
									<span class="freq-tag">
										{{ c.billingFrequency || 'MONTHLY' }}
									</span>
								</td>

								<td>
									<div class="dates-wrap">
										<span><strong>{{ formatDate(c.startDate || c.start) }}</strong></span>
										<span class="dates-arrow">to</span>
										<span><strong>{{ formatDate(c.endDate || c.end) }}</strong></span>
									</div>
								</td>

								<td>
									<span class="status-badge" :class="String(c.status || 'ACTIVE').toLowerCase()">
										<i :class="getStatusIcon(c.status)" style="font-size: 10px;"></i>
										{{ c.status || 'ACTIVE' }}
									</span>
								</td>

								<td class="actions">
									<div class="action-row">
										<button
											class="btn-small btn-secondary"
											@click="openViewContract(c)"
											title="View and print official lease agreement"
										>
											<i class="pi pi-eye"></i>
											View & Print
										</button>

										<button
											class="btn-small btn-outline"
											@click="openEditModal(c)"
											title="Edit contract terms, rent, and dates"
										>
											<i class="pi pi-file-edit"></i>
											Edit
										</button>

										<button
											v-if="String(c.status).toUpperCase() === 'ACTIVE'"
											class="btn-small btn-danger"
											@click="terminateContract(c)"
											title="Terminate contract"
										>
											Terminate
										</button>
									</div>
								</td>
							</tr>

							<!-- EMPTY STATE FOR CONTRACTS -->
							<tr v-if="filteredContracts.length === 0">
								<td colspan="9" class="empty-cell">
									<div class="empty-box">
										<div class="empty-icon">📑</div>
										<h3>No contracts found</h3>
										<p>
											{{ q ? 'No contracts match your search keyword.' : 'No lease contracts have been created yet. Click "+ Create Contract" to issue one.' }}
										</p>
										<button
											v-if="!q"
											class="btn-primary"
											style="margin-top: 14px;"
											@click="goToStalls()"
										>
											<i class="pi pi-building"></i>
											Go to Stall Management to Issue Contracts
										</button>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<!-- TAB 2: STAKEHOLDERS & STALLS TABLE -->
			<div v-if="activeTab === 'stakeholders'" class="card table-card">
				<div class="table-header">
					<div class="table-title-wrap">
						<h2 class="table-title">Stakeholders & Assigned Stalls</h2>
						<span class="record-count">{{ filteredStakeholders.length }} stakeholders</span>
					</div>
				</div>

				<div class="table-wrapper">
					<table class="contract-table">
						<thead>
							<tr>
								<th>ID</th>
								<th>Stakeholder</th>
								<th>Business</th>
								<th>Assigned Stall</th>
								<th>Active Contract</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="s in filteredStakeholders" :key="s.id" class="row">
								<td class="id-cell">
									<div class="contract-ref-badge">#{{ s.id }}</div>
								</td>

								<td>
									<div class="stakeholder-cell">
										<div class="avatar-circle">
											{{ getInitials(s.firstName, s.lastName) }}
										</div>
										<div>
											<div class="name">
												{{ s.firstName }} {{ s.lastName }}
											</div>
											<div class="sub">
												{{ s.contact || s.email || 'No contact specified' }}
											</div>
										</div>
									</div>
								</td>

								<td>
									<div class="name">
										{{ s.businessName || "No business name" }}
									</div>
									<div class="sub">
										{{ s.businessType || "General Trade" }}
									</div>
								</td>

								<td>
									<span v-if="getStakeholderStallNo(s)" class="stall-badge">
										<i class="pi pi-building" style="font-size: 10px;"></i>
										Stall {{ getStakeholderStallNo(s) }}
									</span>
									<span v-else class="no-stall">
										<i class="pi pi-exclamation-triangle" style="font-size: 10px;"></i>
										No Stall Assigned
									</span>
								</td>

								<td>
									<span
										v-if="getStakeholderContract(s)"
										class="status-badge active"
									>
										<i class="pi pi-check" style="font-size: 10px;"></i>
										{{ getStakeholderContract(s).contractNo || getStakeholderContract(s).ref || 'ACTIVE' }}
									</span>
									<span
										v-else
										class="status-badge pending"
									>
										No Contract Yet
									</span>
								</td>

								<td class="actions">
									<div class="action-row">
										<button
											v-if="getStakeholderContractsList(s).length"
											class="btn-small btn-secondary"
											@click="viewStakeholderContracts(s)"
											title="View contracts for this stakeholder"
										>
											<i class="pi pi-file"></i>
											View ({{ getStakeholderContractsList(s).length }})
										</button>

										<button
											v-else
											class="btn-small btn-outline"
											@click="goToStalls(s)"
											title="Assign stall and issue contract in Stall Management"
										>
											<i class="pi pi-building"></i>
											Manage in Stalls
										</button>
									</div>
								</td>
							</tr>

							<!-- EMPTY STATE FOR STAKEHOLDERS -->
							<tr v-if="filteredStakeholders.length === 0">
								<td colspan="6" class="empty-cell">
									<div class="empty-box">
										<div class="empty-icon">👥</div>
										<h3>No stakeholders found</h3>
										<p>Try adjusting your search keyword.</p>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<!-- ========================================== -->
			<!-- VIEW & PRINT CONTRACT MODAL               -->
			<!-- ========================================== -->
			<div v-if="viewModal" class="modal-backdrop" @click.self="closeView">
				<div class="modal large">
					<div class="modal-header">
						<div>
							<h3 class="modal-title">
								{{ selectedContract ? 'Official Lease Contract' : 'Stakeholder Contracts' }}
							</h3>
							<p class="modal-subtitle">
								{{ current?.firstName }} {{ current?.lastName }} • {{ current?.businessName || 'Municipal Public Market' }}
							</p>
						</div>

						<button class="close-btn" @click="closeView">✕</button>
					</div>

					<!-- SINGLE CONTRACT DETAILED OFFICIAL DOCUMENT VIEW -->
					<div v-if="selectedContract" class="official-doc-wrapper">
						<div class="doc-paper" id="printable-contract">
							<!-- OFFICIAL HEADER -->
							<div class="doc-header">
								<div class="doc-govt">
									Republic of the Philippines<br />
									Province of Misamis Oriental<br />
									MUNICIPALITY OF MANTICAO
								</div>
								<div class="doc-office">
									OFFICE OF THE ECONOMIC ENTERPRISE & MARKET SUPERVISOR
								</div>
								<div class="doc-main-title">
									CONTRACT OF LEASE FOR PUBLIC MARKET STALL
								</div>
							</div>

							<!-- METADATA ROW -->
							<div class="doc-meta-row">
								<div>
									<strong>Contract No:</strong> {{ selectedContract.contractNo || selectedContract.ref }}
								</div>
								<div>
									<strong>Status:</strong>
									<span class="status-badge" :class="String(selectedContract.status || 'ACTIVE').toLowerCase()" style="margin-left: 6px;">
										{{ selectedContract.status || 'ACTIVE' }}
									</span>
								</div>
							</div>

							<!-- PARTIES -->
							<div class="doc-parties">
								This CONTRACT OF LEASE is made and executed by and between the <strong>LOCAL GOVERNMENT UNIT OF MANTICAO</strong>, represented herein by the Market Supervisor (hereinafter referred to as the <strong>"LESSOR"</strong>), and <strong>{{ getContractStakeholderName(selectedContract) }}</strong>, of legal age, Filipino citizen, doing business under the name and style of <strong>"{{ selectedContract.businessName || 'Market Stall Enterprise' }}"</strong> (hereinafter referred to as the <strong>"LESSEE"</strong>).
							</div>

							<!-- SPECIFICATIONS TABLE -->
							<table class="doc-specs-table">
								<tbody>
									<tr>
										<td class="label-cell">Leased Premises</td>
										<td>
											<strong>Stall No. {{ getContractStallNo(selectedContract) }}</strong>
											({{ getContractStallType(selectedContract) || 'Standard Market Stall' }})
										</td>
									</tr>
									<tr>
										<td class="label-cell">Monthly Rental Rate</td>
										<td>
											<strong>{{ formatCurrency(selectedContract.monthlyRent || getContractStall(selectedContract)?.monthlyRent) }}</strong>
											/ month
										</td>
									</tr>
									<tr>
										<td class="label-cell">Payment Frequency</td>
										<td>{{ selectedContract.billingFrequency || 'MONTHLY' }}</td>
									</tr>
									<tr>
										<td class="label-cell">Lease Term / Period</td>
										<td>
											<strong>{{ formatDate(selectedContract.startDate || selectedContract.start) }}</strong>
											to
											<strong>{{ formatDate(selectedContract.endDate || selectedContract.end) }}</strong>
										</td>
									</tr>
								</tbody>
							</table>

							<!-- TERMS -->
							<div style="font-weight: 800; font-size: 13px; margin-bottom: 6px; text-transform: uppercase;">
								Terms and Conditions of Lease:
							</div>
							<div class="doc-terms-box">
								{{ selectedContract.terms || defaultTerms }}
							</div>

							<!-- SIGNATURES -->
							<div class="doc-signatures-grid">
								<div class="sig-col">
									<div class="sig-line"></div>
									<div class="sig-name">Market Supervisor</div>
									<div class="sig-title">Market Administration</div>
								</div>

								<div class="sig-col">
									<div class="sig-line"></div>
									<div class="sig-name">Municipal Treasurer</div>
									<div class="sig-title">Treasury Office</div>
								</div>

								<div class="sig-col">
									<div class="sig-line"></div>
									<div class="sig-name">{{ getContractStakeholderName(selectedContract) }}</div>
									<div class="sig-title">Lessee / Stallholder</div>
								</div>
							</div>
						</div>
					</div>

					<!-- MULTIPLE CONTRACTS LIST VIEW (IF OPENED FROM STAKEHOLDER TAB) -->
					<div v-else-if="viewContractsList.length" class="contracts-list">
						<div
							v-for="c in viewContractsList"
							:key="c.id"
							class="contract-item"
						>
							<div class="contract-top">
								<div>
									<div class="contract-title">
										{{ c.contractNo || c.ref }}
									</div>
									<div class="contract-sub">
										Stall {{ getContractStallNo(c) }} • {{ formatDate(c.startDate || c.start) }} → {{ formatDate(c.endDate || c.end) }}
									</div>
								</div>
								<div style="display: flex; gap: 8px; align-items: center;">
									<span class="status-badge" :class="String(c.status || 'ACTIVE').toLowerCase()">
										{{ c.status || 'ACTIVE' }}
									</span>
									<button class="btn-small btn-outline" @click="selectedContract = c">
										<i class="pi pi-eye"></i> View Agreement
									</button>
								</div>
							</div>
							<div class="terms-box">
								{{ c.terms }}
							</div>
						</div>
					</div>

					<div v-else class="empty-box">
						<div class="empty-icon">📑</div>
						<h3>No Contracts Found</h3>
						<p>No active contracts on record for this stakeholder.</p>
					</div>

					<div class="modal-actions">
						<button
							v-if="selectedContract"
							class="btn-primary"
							@click="printContract"
						>
							<i class="pi pi-print"></i>
							Print Official Agreement
						</button>

						<button
							v-if="selectedContract && viewContractsList.length > 1"
							class="btn-secondary"
							@click="selectedContract = null"
						>
							Back to List
						</button>

						<button
							class="btn-secondary"
							@click="closeView"
						>
							Close
						</button>
					</div>
				</div>
			</div>

			<!-- ========================================== -->
			<!-- EDIT CONTRACT MODAL                        -->
			<!-- ========================================== -->
			<div v-if="editModal" class="modal-backdrop" @click.self="closeEditModal">
				<div class="modal">
					<div class="modal-header">
						<div>
							<h3 class="modal-title">Edit Lease Contract</h3>
							<p class="modal-subtitle">
								{{ editForm.contractNo }} • {{ editForm.stakeholderName || 'Assigned Lessee' }}
							</p>
						</div>
						<button class="close-btn" @click="closeEditModal">✕</button>
					</div>

					<form @submit.prevent="saveEditContract" style="display: flex; flex-direction: column; gap: 14px;">
						<div>
							<label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 5px;">Contract Reference #</label>
							<input
								v-model="editForm.contractNo"
								type="text"
								required
								style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px;"
							/>
						</div>

						<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
							<div>
								<label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 5px;">Start Date</label>
								<input
									v-model="editForm.startDate"
									type="date"
									required
									style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px;"
								/>
							</div>
							<div>
								<label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 5px;">End Date</label>
								<input
									v-model="editForm.endDate"
									type="date"
									required
									style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px;"
								/>
							</div>
						</div>

						<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
							<div>
								<label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 5px;">Monthly Rent (₱)</label>
								<input
									v-model.number="editForm.monthlyRent"
									type="number"
									min="0"
									step="50"
									required
									style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px;"
								/>
							</div>
							<div>
								<label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 5px;">Billing Frequency</label>
								<select
									v-model="editForm.billingFrequency"
									style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; background: #fff;"
								>
									<option value="MONTHLY">Monthly</option>
									<option value="QUARTERLY">Quarterly</option>
									<option value="SEMI-ANNUALLY">Semi-Annually</option>
									<option value="ANNUALLY">Annually</option>
								</select>
							</div>
						</div>

						<div>
							<label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 5px;">Contract Status</label>
							<select
								v-model="editForm.status"
								style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; background: #fff;"
							>
								<option value="ACTIVE">ACTIVE</option>
								<option value="EXPIRED">EXPIRED</option>
								<option value="TERMINATED">TERMINATED</option>
							</select>
						</div>

						<div>
							<label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 5px;">Terms & Conditions</label>
							<textarea
								v-model="editForm.terms"
								rows="5"
								style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 13px; font-family: inherit; line-height: 1.5;"
								placeholder="Contract terms and conditions..."
							></textarea>
						</div>

						<div class="modal-actions" style="margin-top: 10px;">
							<button type="submit" class="btn-primary" :disabled="isSavingEdit">
								<i class="pi pi-check" :class="{ 'pi-spin': isSavingEdit }"></i>
								{{ isSavingEdit ? 'Saving...' : 'Save Changes' }}
							</button>
							<button type="button" class="btn-secondary" @click="closeEditModal">
								Cancel
							</button>
						</div>
					</form>
				</div>
			</div>
		</main>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'
import sampleContracts from '../data/contracts.js'
import MarketSupervisorMenu from '../components/MarketSupervisorMenu.vue'
import SearchField from '../components/SearchField.vue'

const route = useRoute()
const router = useRouter()

// =============================
// STATE
// =============================
const q = ref('')
const activeTab = ref('contracts') // 'contracts' | 'stakeholders'
const statusFilter = ref('ALL')
const isLoading = ref(false)

const stakeholders = ref([])
const stalls = ref([])
const contracts = ref([])

// Edit Contract Modal State
const editModal = ref(false)
const editingContract = ref(null)
const isSavingEdit = ref(false)
const editForm = ref({
	contractNo: '',
	startDate: '',
	endDate: '',
	monthlyRent: 0,
	billingFrequency: 'MONTHLY',
	status: 'ACTIVE',
	terms: '',
	stakeholderName: ''
})

const viewModal = ref(false)
const current = ref(null)
const selectedContract = ref(null)
const viewContractsList = ref([])

// =============================
// HELPERS
// =============================
function formatDate(dateStr) {
	if (!dateStr) return '-'
	try {
		const d = new Date(dateStr)
		if (isNaN(d.getTime())) return dateStr
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	} catch (_) {
		return dateStr
	}
}

function formatCurrency(val) {
	const num = Number(val || 0)
	return '₱' + num.toLocaleString('en-PH', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})
}

function getInitials(first, last) {
	const f = String(first || '').trim().charAt(0).toUpperCase()
	const l = String(last || '').trim().charAt(0).toUpperCase()
	return (f + l) || 'SH'
}

function getStakeholderFullName(s) {
	if (!s) return ''
	const f = s.firstName || s.first_name || ''
	const l = s.lastName || s.last_name || ''
	return `${f} ${l}`.trim()
}

function getStakeholderStallNo(s) {
	if (!s) return ''
	if (s.occupant?.stall?.stallNo) return s.occupant.stall.stallNo
	if (s.occupant?.stall?.stall_no) return s.occupant.stall.stall_no
	if (s.selectedStall?.stallNo) return s.selectedStall.stallNo
	if (s.selectedStall?.stall_no) return s.selectedStall.stall_no
	if (s.stall?.stallNo) return s.stall.stallNo
	if (s.stall?.stall_no) return s.stall.stall_no

	// Check if this stakeholder is an occupant in stalls array
	const matchedStall = stalls.value.find(st => {
		const occ = st.occupant
		if (!occ) return false
		if (Array.isArray(occ)) {
			return occ.some(o => String(o.stakeholder_id || o.stakeholderId) === String(s.id))
		}
		return String(occ.stakeholder_id || occ.stakeholderId || occ.stakeholder?.id) === String(s.id)
	})
	if (matchedStall) return matchedStall.stallNo || matchedStall.stall_no

	return ''
}

function getStakeholderStallObj(s) {
	if (!s) return null
	if (s.occupant?.stall) return s.occupant.stall
	if (s.selectedStall) return s.selectedStall
	if (s.stall) return s.stall

	const matchedStall = stalls.value.find(st => {
		const occ = st.occupant
		if (!occ) return false
		if (Array.isArray(occ)) {
			return occ.some(o => String(o.stakeholder_id || o.stakeholderId) === String(s.id))
		}
		return String(occ.stakeholder_id || occ.stakeholderId || occ.stakeholder?.id) === String(s.id)
	})
	return matchedStall || null
}

function getContractStakeholder(c) {
	if (!c) return null
	if (c.occupant?.stakeholder) return c.occupant.stakeholder
	if (c.stakeholderId) {
		const found = stakeholders.value.find(s => String(s.id) === String(c.stakeholderId))
		if (found) return found
	}
	return null
}

function getContractStakeholderName(c) {
	if (!c) return 'Lessee'
	if (c.stakeholderName) return c.stakeholderName
	const sh = getContractStakeholder(c)
	if (sh) return getStakeholderFullName(sh)
	return 'Lessee'
}

function getContractStall(c) {
	if (!c) return null
	if (c.stall) return c.stall
	if (c.stallId) {
		const found = stalls.value.find(s => String(s.id) === String(c.stallId))
		if (found) return found
	}
	if (c.stallNo) {
		const found = stalls.value.find(s => (s.stallNo || s.stall_no) === c.stallNo)
		if (found) return found
	}
	return null
}

function getContractStallNo(c) {
	if (!c) return '-'
	if (c.stallNo) return c.stallNo
	if (c.stall?.stallNo) return c.stall.stallNo
	if (c.stall?.stall_no) return c.stall.stall_no
	const st = getContractStall(c)
	if (st) return st.stallNo || st.stall_no
	return '-'
}

function getContractStallType(c) {
	if (!c) return ''
	if (c.stallType) return c.stallType
	if (c.stall?.stallType) return c.stall.stallType
	if (c.stall?.stall_type) return c.stall.stall_type
	const st = getContractStall(c)
	if (st) return st.stallType || st.stall_type
	return ''
}

function getStakeholderContract(s) {
	if (!s) return null
	return contracts.value.find(c => {
		const isSameStakeholder = String(c.stakeholderId) === String(s.id) ||
			String(c.occupant?.stakeholderId) === String(s.id) ||
			String(c.occupant?.stakeholder?.id) === String(s.id)
		if (isSameStakeholder) return true

		const sStallNo = getStakeholderStallNo(s)
		if (sStallNo && getContractStallNo(c) === sStallNo) return true

		return false
	})
}

function getStakeholderContractsList(s) {
	if (!s) return []
	return contracts.value.filter(c => {
		const isSameStakeholder = String(c.stakeholderId) === String(s.id) ||
			String(c.occupant?.stakeholderId) === String(s.id) ||
			String(c.occupant?.stakeholder?.id) === String(s.id)
		if (isSameStakeholder) return true

		const sStallNo = getStakeholderStallNo(s)
		if (sStallNo && getContractStallNo(c) === sStallNo) return true

		return false
	})
}

function getStatusIcon(status) {
	const st = String(status || 'ACTIVE').toUpperCase()
	if (st === 'ACTIVE') return 'pi pi-check-circle'
	if (st === 'EXPIRED') return 'pi pi-clock'
	if (st === 'TERMINATED') return 'pi pi-times-circle'
	return 'pi pi-info-circle'
}

// =============================
// STORAGE SYNC
// =============================
function saveContractsToStorage() {
	try {
		localStorage.setItem('contracts', JSON.stringify(contracts.value))
	} catch (e) {
		console.warn('Storage save error:', e)
	}
}

function loadContractsFromStorage() {
	try {
		const raw = localStorage.getItem('contracts')
		if (raw) {
			const parsed = JSON.parse(raw)
			if (Array.isArray(parsed) && parsed.length) return parsed
		}
	} catch (e) {}

	// Fallback to sampleContracts
	return (sampleContracts || []).map((c, i) => ({
		id: c.id || (100 + i),
		contractNo: c.ref || `CON-2025-${String(i + 1).padStart(3, '0')}`,
		ref: c.ref || `CON-2025-${String(i + 1).padStart(3, '0')}`,
		stakeholderId: c.stakeholderId || String(i + 1),
		startDate: c.start || '2025-01-01',
		endDate: c.end || '2025-12-31',
		monthlyRent: 3500,
		billingFrequency: 'MONTHLY',
		terms: defaultTerms,
		status: 'ACTIVE',
		stallNo: `WS-0${i + 1}`
	}))
}

// =============================
// FETCHING
// =============================
async function loadStakeholders() {
	try {
		const response = await api.get('/stakeholders')
		stakeholders.value = response.data || []
	} catch (error) {
		console.warn('Failed to load stakeholders:', error)
	}
}

async function loadStalls() {
	try {
		const response = await api.get('/stalls')
		stalls.value = response.data || []
	} catch (error) {
		console.warn('Failed to load stalls:', error)
	}
}

async function loadContracts() {
	try {
		const response = await api.get('/contracts')
		const remoteContracts = response.data || []
		const localContracts = loadContractsFromStorage()

		// Merge remote & local contracts without duplicates
		const combined = [...remoteContracts]
		for (const loc of localContracts) {
			const exists = combined.some(c =>
				(c.id && loc.id && String(c.id) === String(loc.id)) ||
				(c.contractNo && loc.contractNo && c.contractNo === loc.contractNo) ||
				(c.ref && loc.ref && c.ref === loc.ref)
			)
			if (!exists) {
				combined.push(loc)
			}
		}

		// Also guarantee that any stall marked as OCCUPIED in stalls has a visible active contract
		for (const st of stalls.value) {
			const status = String(st.status || '').toUpperCase()
			if (status === 'OCCUPIED') {
				const stallNo = st.stallNo || st.stall_no || st.number || `Stall ${st.id}`
				const hasContract = combined.some(c =>
					(c.stallId && String(c.stallId) === String(st.id)) ||
					(c.stallNo && String(c.stallNo) === String(stallNo))
				)
				if (!hasContract) {
					const occ = st.occupant
					const occObj = Array.isArray(occ) ? occ[0] : occ
					const sh = occObj?.stakeholder || stakeholders.value.find(s => String(s.id) === String(occObj?.stakeholder_id || occObj?.stakeholderId))
					const shName = sh ? getStakeholderFullName(sh) : (occObj?.name || 'Assigned Occupant')
					combined.unshift({
						id: `CON-${st.id}`,
						contractNo: `CON-${stallNo}-${new Date().getFullYear()}`,
						ref: `CON-${stallNo}-${new Date().getFullYear()}`,
						stakeholderId: sh?.id || occObj?.stakeholder_id || '1',
						stakeholderName: shName,
						businessName: sh?.businessName || '',
						stallId: st.id,
						stallNo: stallNo,
						stallType: st.stallType || st.stall_type || st.type || 'Standard Stall',
						startDate: '2026-01-01',
						endDate: '2026-12-31',
						monthlyRent: Number(st.monthlyRent || st.monthly_rent || st.rent || 0),
						billingFrequency: 'MONTHLY',
						terms: defaultTerms,
						status: 'ACTIVE',
						createdAt: new Date().toISOString()
					})
				}
			}
		}

		contracts.value = combined
		saveContractsToStorage()
	} catch (error) {
		console.warn('Failed to load contracts from API, using cached/sample contracts:', error)
		contracts.value = loadContractsFromStorage()
	}
}

async function refresh() {
	isLoading.value = true
	try {
		await loadStakeholders()
		await loadStalls()
		await loadContracts()
	} finally {
		isLoading.value = false
	}
}

// =============================
// COMPUTED FILTERED LISTS
// =============================
const activeContractsCount = computed(() => {
	return contracts.value.filter(c => String(c.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length
})

const inactiveContractsCount = computed(() => {
	return contracts.value.filter(c => {
		const st = String(c.status || '').toUpperCase()
		return st === 'EXPIRED' || st === 'TERMINATED'
	}).length
})

const stakeholdersWithStallsCount = computed(() => {
	return stakeholders.value.filter(s => Boolean(getStakeholderStallNo(s))).length
})

const filteredContracts = computed(() => {
	const term = q.value.trim().toLowerCase()
	return contracts.value.filter(c => {
		// Filter by status
		if (statusFilter.value !== 'ALL') {
			const cStatus = String(c.status || 'ACTIVE').toUpperCase()
			if (cStatus !== statusFilter.value) return false
		}

		if (!term) return true

		const ref = String(c.contractNo || c.ref || '').toLowerCase()
		const shName = String(c.stakeholderName || getContractStakeholderName(c)).toLowerCase()
		const biz = String(c.businessName || '').toLowerCase()
		const stall = String(getContractStallNo(c)).toLowerCase()

		return ref.includes(term) || shName.includes(term) || biz.includes(term) || stall.includes(term)
	})
})

const filteredStakeholders = computed(() => {
	const term = q.value.trim().toLowerCase()
	if (!term) return stakeholders.value

	return stakeholders.value.filter(s => {
		const fullName = getStakeholderFullName(s).toLowerCase()
		const biz = String(s.businessName || '').toLowerCase()
		const stall = String(getStakeholderStallNo(s)).toLowerCase()
		const id = String(s.id || '')

		return fullName.includes(term) || biz.includes(term) || stall.includes(term) || id.includes(term)
	})
})

// =============================
// NAVIGATION & ACTIONS
// =============================
function goToStalls(s = null) {
	const qVal = s ? (getStakeholderStallNo(s) || s.businessName || s.firstName) : ''
	router.push({ name: 'MSStalls', query: qVal ? { q: qVal } : {} })
}

// =============================
// VIEW & TERMINATE
// =============================
function openViewContract(contract) {
	selectedContract.value = contract
	current.value = getContractStakeholder(contract) || {
		firstName: contract.stakeholderName || 'Assigned',
		lastName: 'Lessee',
		businessName: contract.businessName
	}
	viewContractsList.value = [contract]
	viewModal.value = true
}

function viewStakeholderContracts(stakeholder) {
	current.value = stakeholder
	const list = getStakeholderContractsList(stakeholder)
	viewContractsList.value = list
	selectedContract.value = list.length === 1 ? list[0] : null
	viewModal.value = true
}

function closeView() {
	viewModal.value = false
	selectedContract.value = null
	viewContractsList.value = []
}

function openEditModal(contract) {
	editingContract.value = contract
	editForm.value = {
		contractNo: contract.contractNo || contract.contract_no || contract.ref || '',
		startDate: contract.startDate || contract.start_date || contract.start || '',
		endDate: contract.endDate || contract.end_date || contract.end || '',
		monthlyRent: Number(contract.monthlyRent ?? contract.monthly_rent ?? 0),
		billingFrequency: contract.billingFrequency || contract.billing_frequency || 'MONTHLY',
		status: (contract.status || 'ACTIVE').toUpperCase(),
		terms: contract.terms || defaultTerms,
		stakeholderName: contract.stakeholderName || getStakeholderFullName(getContractStakeholder(contract)) || ''
	}
	editModal.value = true
}

function closeEditModal() {
	editModal.value = false
	editingContract.value = null
}

async function saveEditContract() {
	if (!editForm.value.contractNo || !editForm.value.contractNo.trim()) {
		alert('Please enter a valid contract reference number.')
		return
	}
	if (!editForm.value.startDate || !editForm.value.endDate) {
		alert('Please select both contract start and end dates.')
		return
	}
	if (new Date(editForm.value.endDate) <= new Date(editForm.value.startDate)) {
		alert('Contract End Date must be after Start Date.')
		return
	}
	if (isNaN(editForm.value.monthlyRent) || Number(editForm.value.monthlyRent) < 0) {
		alert('Monthly rent must be a valid non-negative amount.')
		return
	}

	isSavingEdit.value = true
	try {
		const c = editingContract.value
		const payload = {
			contractNo: editForm.value.contractNo.trim(),
			ref: editForm.value.contractNo.trim(),
			startDate: editForm.value.startDate,
			endDate: editForm.value.endDate,
			monthlyRent: Number(editForm.value.monthlyRent || 0),
			billingFrequency: editForm.value.billingFrequency || 'MONTHLY',
			status: editForm.value.status || 'ACTIVE',
			terms: editForm.value.terms
		}

		if (c?.id) {
			try {
				await api.put(`/contracts/${c.id}`, payload)
			} catch (err) {
				console.warn('Backend contract update warning:', err)
			}
		}

		// Update in-memory contract object
		Object.assign(c, payload)
		c.contract_no = payload.contractNo
		c.start_date = payload.startDate
		c.end_date = payload.endDate
		c.monthly_rent = payload.monthlyRent
		c.billing_frequency = payload.billingFrequency

		saveContractsToStorage()
		closeEditModal()
		alert(`Contract ${payload.contractNo} updated successfully!`)
	} catch (err) {
		console.error(err)
		alert(`Failed to update contract: ${err.message || err}`)
	} finally {
		isSavingEdit.value = false
	}
}

async function terminateContract(contract) {
	const refName = contract.contractNo || contract.ref || 'this contract'
	if (!confirm(`Are you sure you want to TERMINATE ${refName}? This will mark the contract as inactive.`)) {
		return
	}

	try {
		if (contract.id) {
			await api.put(`/contracts/${contract.id}`, { status: 'TERMINATED' })
		}
	} catch (err) {
		console.warn('Backend terminate error (updating local state):', err)
	}

	contract.status = 'TERMINATED'
	saveContractsToStorage()
	alert(`${refName} has been marked as TERMINATED.`)
}

function printContract() {
	window.print()
}

// =============================
// LIFECYCLE
// =============================
onMounted(async () => {
	await refresh()

	// Check if navigated from Stall Management with a specific stall/stakeholder query
	if (route.query.q) {
		q.value = String(route.query.q)
		activeTab.value = 'contracts'
	}
})
</script>

<style scoped src="../styles/MarketSupervisor/contract.css"></style>
