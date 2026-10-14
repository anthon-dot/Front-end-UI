<template>
	<div class="archive-page">
		<MarketSupervisorMenu />

		<div class="page-content">
			<div class="flex justify-between items-center mb-4 flex-wrap gap-3">
				<div>
					<h1 class="text-2xl font-semibold text-slate-800">Archive & Historical Records</h1>
					<p class="text-xs text-slate-500 mt-1">
						Historical registry of archived stakeholders, vacated stall allocations, and concluded lease agreements
					</p>
				</div>

				<div v-if="selectedTab === 'stakeholders'" style="width: 280px;">
					<SearchField v-model="q" placeholder="Search by name, business, status..." />
				</div>

				<div v-if="selectedTab === 'stalls'" style="width: 280px;">
					<SearchField v-model="qStalls" placeholder="Search stall # or occupant..." />
				</div>

				<div v-if="selectedTab === 'contracts'" style="width: 280px;">
					<SearchField v-model="qContracts" placeholder="Search contract #, stall, lessee..." />
				</div>
			</div>

			<div class="bg-white rounded-2xl shadow overflow-hidden border border-slate-100">
				<!-- TAB NAVIGATION -->
				<div class="tabs p-3 border-b flex gap-3 items-center flex-wrap">
					<button
						:class="['tab', { active: selectedTab === 'stakeholders' }]"
						@click="selectedTab = 'stakeholders'"
					>
						<i class="pi pi-users" aria-hidden="true"></i>
						<span>Archived Stakeholders</span>
						<span class="tab-count">{{ filteredStakeholders.length }}</span>
					</button>

					<button
						:class="['tab', { active: selectedTab === 'stalls' }]"
						@click="selectedTab = 'stalls'"
					>
						<i class="pi pi-building" aria-hidden="true"></i>
						<span>Historical Stall Allocations</span>
						<span class="tab-count">{{ filteredArchivedStalls.length }}</span>
					</button>

					<button
						:class="['tab', { active: selectedTab === 'contracts' }]"
						@click="selectedTab = 'contracts'"
					>
						<i class="pi pi-file" aria-hidden="true"></i>
						<span>Concluded Contracts</span>
						<span class="tab-count">{{ filteredContracts.length }}</span>
					</button>
				</div>

				<div class="p-4">
					<!-- TAB 1: STAKEHOLDERS PANEL -->
					<div v-show="selectedTab === 'stakeholders'">
						<div class="p-4 border-b mb-4 flex items-center justify-between">
							<h2 class="text-lg font-medium text-slate-800">Archived Stakeholders</h2>
							<span class="muted text-xs">Showing {{ filteredStakeholders.length }} records</span>
						</div>

						<div class="table-scroll">
							<table class="app-table w-full text-sm">
								<thead>
									<tr>
										<th>Stakeholder</th>
										<th>Business</th>
										<th>Archive Status</th>
										<th>Record Date</th>
										<th style="text-align: right;">Actions</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="s in filteredStakeholders" :key="s.id">
										<td class="cell-wrap" style="padding:12px">
											<div class="name-cell">
												<div class="name-main font-semibold">{{ s.name }}</div>
												<div class="name-sub text-xs text-slate-400" v-if="s.contact">{{ s.contact }}</div>
											</div>
										</td>
										<td>{{ s.business || '—' }}</td>
										<td>
											<span :class="['chip', 'archived']">
												{{ s.status || 'Archived' }}
											</span>
										</td>
										<td>
											<div class="muted text-xs">{{ formatDate(s.appliedOn || s.createdAt) }}</div>
										</td>
										<td style="text-align: right;">
											<div class="actions" style="justify-content: flex-end;">
												<button class="btn btn-ghost" title="View details" @click="openView(s)">
													<i class="pi pi-eye"></i>
												</button>
												<button class="btn btn-primary" title="Restore record to active" @click="restore(s)">
													<i class="pi pi-replay"></i> Restore
												</button>
											</div>
										</td>
									</tr>
									<tr v-if="filteredStakeholders.length === 0">
										<td colspan="5" class="p-6 text-center text-gray-500">
											No archived stakeholder records found.
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					<!-- TAB 2: STALLS PANEL -->
					<div v-show="selectedTab === 'stalls'">
						<div class="p-4 border-b mb-4 flex items-center justify-between">
							<h2 class="text-lg font-medium text-slate-800">Historical & Vacated Stall Records</h2>
							<span class="muted text-xs">Showing {{ filteredArchivedStalls.length }} records</span>
						</div>

						<div class="table-scroll">
							<table class="app-table w-full text-sm">
								<thead>
									<tr>
										<th>Stall #</th>
										<th>Section / Type</th>
										<th>Previous Occupant</th>
										<th>Historical Status</th>
										<th style="text-align: right;">Actions</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="st in filteredArchivedStalls" :key="st.id">
										<td class="fw font-bold">Stall {{ st.number }}</td>
										<td>{{ st.type || 'Standard Stall' }}</td>
										<td>{{ st.occupant || '—' }}</td>
										<td>
											<span class="chip muted">
												{{ st.status || 'Vacated' }}
											</span>
										</td>
										<td style="text-align: right;">
											<div class="actions" style="justify-content: flex-end;">
												<button class="btn btn-primary" title="Restore stall" @click="restoreStall(st)">
													<i class="pi pi-replay"></i> Restore
												</button>
											</div>
										</td>
									</tr>
									<tr v-if="filteredArchivedStalls.length === 0">
										<td colspan="5" class="p-6 text-center text-gray-500">
											No archived stall records.
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					<!-- TAB 3: CONCLUDED CONTRACTS PANEL -->
					<div v-show="selectedTab === 'contracts'">
						<div class="p-4 border-b mb-4 flex items-center justify-between">
							<h2 class="text-lg font-medium text-slate-800">Concluded, Terminated & Expired Lease Contracts</h2>
							<span class="muted text-xs">Showing {{ filteredContracts.length }} records</span>
						</div>

						<div class="table-scroll">
							<table class="app-table w-full text-sm">
								<thead>
									<tr>
										<th>Contract #</th>
										<th>Stall</th>
										<th>Lessee</th>
										<th>Duration</th>
										<th>Contract Status</th>
										<th style="text-align: right;">Actions</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="c in filteredContracts" :key="c.id">
										<td class="font-mono font-bold text-xs text-slate-800">{{ c.contractNo || c.ref }}</td>
										<td>Stall {{ c.stallNo || '-' }}</td>
										<td>{{ c.stakeholderName || c.lessee || 'Lessee' }}</td>
										<td class="text-xs text-slate-500">{{ formatDate(c.startDate) }} to {{ formatDate(c.endDate) }}</td>
										<td>
											<span :class="['chip', c.status === 'TERMINATED' ? 'archived' : 'muted']">
												{{ c.status || 'CONCLUDED' }}
											</span>
										</td>
										<td style="text-align: right;">
											<div class="actions" style="justify-content: flex-end;">
												<button class="btn btn-primary" title="Restore contract to active" @click="restoreContract(c)">
													<i class="pi pi-replay"></i> Restore
												</button>
											</div>
										</td>
									</tr>
									<tr v-if="filteredContracts.length === 0">
										<td colspan="6" class="p-6 text-center text-gray-500">
											No concluded or terminated lease contracts found.
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			<!-- DETAIL MODAL -->
			<div v-if="showModal" class="modal-backdrop" @click.self="close">
				<div class="modal">
					<h3 class="text-xl font-semibold mb-3">Stakeholder Record Details</h3>
					<div class="info-box">
						<p><strong>Name:</strong> {{ selected.name }}</p>
						<p><strong>Business:</strong> {{ selected.business }}</p>
						<p v-if="selected.contact"><strong>Contact:</strong> {{ selected.contact }}</p>
						<p v-if="selected.stallRequested"><strong>Stall Requested:</strong> {{ selected.stallRequested }}</p>
						<p><strong>Archive Status:</strong> {{ selected.status }}</p>
						<p v-if="selected.notes"><strong>Notes:</strong> {{ selected.notes }}</p>
					</div>
					<div class="flex justify-end gap-2 mt-4">
						<button class="btn-outline" @click="close">Close</button>
						<button class="btn-approve" @click="restore(selected)">Restore Record</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import MarketSupervisorMenu from '../components/MarketSupervisorMenu.vue'
import SearchField from '../components/SearchField.vue'
import sampleApplicants from '../data/applicants.js'
import api from '../services/api'
import { systemMessage } from '../utils/systemMessage'

const STORAGE_KEY = 'ms_applications'
const STALLS_KEY = 'ms_stalls'

const confirm = useConfirm()
const q = ref('')
const qStalls = ref('')
const qContracts = ref('')
const showModal = ref(false)
const selected = ref({})
const selectedTab = ref('stakeholders')

const applications = ref([])
const stalls = ref([])
const contracts = ref([])

function formatDate(d) {
	if (!d) return '—'
	try {
		return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
	} catch (_) {
		return d
	}
}

async function loadData() {
	// 1. Load stakeholders from storage & API
	let storedApps = []
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw) storedApps = JSON.parse(raw)
	} catch (_) {}

	if (!storedApps.length) {
		storedApps = (sampleApplicants || []).map((x) => ({ ...x }))
	}

	try {
		const res = await api.get('/stakeholders')
		const apiStakeholders = Array.isArray(res.data) ? res.data : []
		const mapped = apiStakeholders
			.filter((s) => s.isArchived === true || s.is_archived === true || String(s.marketApprovalStatus || '').toUpperCase() === 'REJECTED' || String(s.applicationStatus || '').toUpperCase() === 'REJECTED')
			.map((s) => ({
				id: s.id,
				name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Stakeholder #' + s.id,
				business: s.businessName || '',
				contact: s.contact || '',
				status: s.marketApprovalStatus === 'REJECTED' ? 'REJECTED' : 'Archived',
				appliedOn: s.createdAt || s.created_at || new Date().toISOString()
			}))

		for (const m of mapped) {
			if (!storedApps.some((a) => String(a.id) === String(m.id))) {
				storedApps.push(m)
			}
		}
	} catch (err) {
		console.warn('[Archive] API stakeholders notice:', err)
	}

	applications.value = storedApps

	// 2. Load stalls
	let storedStalls = []
	try {
		const raw = localStorage.getItem(STALLS_KEY)
		if (raw) storedStalls = JSON.parse(raw)
	} catch (_) {}

	try {
		const res = await api.get('/stalls')
		const apiStalls = Array.isArray(res.data) ? res.data : []
		for (const st of apiStalls) {
			if (st.status === 'ARCHIVED' || st.isArchived) {
				if (!storedStalls.some((s) => String(s.id) === String(st.id))) {
					storedStalls.push({
						id: st.id,
						number: st.stallNo || st.stall_no || st.number,
						type: st.stallType || st.stall_type,
						occupant: st.occupant?.name || '',
						status: 'Archived'
					})
				}
			}
		}
	} catch (err) {
		console.warn('[Archive] API stalls notice:', err)
	}

	stalls.value = storedStalls

	// 3. Load contracts
	let storedContracts = []
	try {
		const raw = localStorage.getItem('contracts')
		if (raw) storedContracts = JSON.parse(raw)
	} catch (_) {}

	try {
		const res = await api.get('/contracts')
		const allContracts = Array.isArray(res.data) ? res.data : []
		for (const ac of allContracts) {
			if (!storedContracts.some((c) => String(c.id) === String(ac.id))) {
				storedContracts.push(ac)
			}
		}
	} catch (err) {
		console.warn('[Archive] API contracts notice:', err)
	}

	contracts.value = storedContracts.filter((c) => {
		const st = String(c.status || '').toUpperCase()
		return st === 'TERMINATED' || st === 'EXPIRED' || st === 'CANCELLED' || st === 'ARCHIVED' || c.isArchived
	})
}

function saveApplications() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(applications.value))
	} catch (_) {}
}

function saveStalls(list) {
	try {
		localStorage.setItem(STALLS_KEY, JSON.stringify(list))
	} catch (_) {}
}

const filteredStakeholders = computed(() => {
	const term = (q.value || '').toLowerCase().trim()
	const list = applications.value.filter((a) => {
		const s = String(a.status || '').toLowerCase()
		return s.includes('archive') || s === 'archived' || s === 'rejected' || s === 'deleted'
	})
	if (!term) return list
	return list.filter(
		(a) =>
			(a.name || '').toLowerCase().includes(term) ||
			(a.business || '').toLowerCase().includes(term) ||
			String(a.id || '').toLowerCase().includes(term)
	)
})

const filteredArchivedStalls = computed(() => {
	const term = (qStalls.value || '').toLowerCase().trim()
	let list = stalls.value
	if (!term) return list
	return list.filter(
		(s) =>
			String(s.number || '').toLowerCase().includes(term) ||
			(s.occupant || '').toLowerCase().includes(term)
	)
})

const filteredContracts = computed(() => {
	const term = (qContracts.value || '').toLowerCase().trim()
	const list = contracts.value
	if (!term) return list
	return list.filter(
		(c) =>
			String(c.contractNo || c.ref || '').toLowerCase().includes(term) ||
			String(c.stallNo || '').toLowerCase().includes(term) ||
			String(c.stakeholderName || '').toLowerCase().includes(term)
	)
})

function openView(app) {
	selected.value = app
	showModal.value = true
}

function close() {
	showModal.value = false
}

function restore(app) {
	if (!app) return
	const idx = applications.value.findIndex((a) => a.id === app.id)
	if (idx === -1) return
	applications.value[idx].status = 'APPROVED'
	if (applications.value[idx].archivedOn) delete applications.value[idx].archivedOn
	saveApplications()
	if (selected.value && selected.value.id === app.id) showModal.value = false
	systemMessage.success('Record restored: ' + (applications.value[idx].name || app.id), 'Record Restored')
}

async function restoreStall(st) {
	if (!st) return
	try {
		if (st.id) {
			await api.put(`/stalls/${st.id}`, { status: 'AVAILABLE', isArchived: false })
		}
	} catch (e) {
		console.warn('API restore stall warning:', e)
	}
	const idx = stalls.value.findIndex((x) => x.id === st.id)
	if (idx !== -1) {
		stalls.value.splice(idx, 1)
	}
	saveStalls(stalls.value)
	systemMessage.success('Stall restored to active registry: ' + st.number, 'Stall Restored')
}

async function restoreContract(c) {
	if (!c) return
	try {
		if (c.id) {
			await api.put(`/contracts/${c.id}`, { status: 'ACTIVE', isArchived: false })
		}
	} catch (e) {
		console.warn('API restore contract warning:', e)
	}
	const idx = contracts.value.findIndex((x) => x.id === c.id)
	if (idx !== -1) {
		contracts.value.splice(idx, 1)
	}
	try {
		const raw = localStorage.getItem('contracts')
		if (raw) {
			const list = JSON.parse(raw)
			const cIdx = list.findIndex((item) => String(item.id) === String(c.id) || item.contractNo === c.contractNo)
			if (cIdx !== -1) {
				list[cIdx].status = 'ACTIVE'
				list[cIdx].isArchived = false
				localStorage.setItem('contracts', JSON.stringify(list))
			}
		}
	} catch (_) {}
	systemMessage.success('Contract restored to active contracts: ' + (c.contractNo || c.ref), 'Contract Restored')
}

onMounted(() => {
	loadData()
})
</script>

<style scoped src="../styles/MarketSupervisor/archive.css"></style>
