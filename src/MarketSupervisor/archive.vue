<template>
	<div class="archive-page">
		<MarketSupervisorMenu />

		<div class="page-content">
						<div class="flex justify-between items-center mb-4">
							<h1 class="text-2xl font-semibold">Archive Records</h1>

							<div v-if="selectedTab === 'stakeholders'" class="search-field" role="search">
								<i class="pi pi-search search-icon" aria-hidden="true"></i>
								<input ref="stakeSearchRef" v-model="q" placeholder="Search by name or business" class="search-input" aria-label="Search stakeholders" />
								<button v-if="q" class="search-clear" @click="clearStakeSearch" aria-label="Clear search"><i class="pi pi-times"></i></button>
							</div>

							<div v-if="selectedTab === 'stalls'" class="search-field" role="search">
								<i class="pi pi-search search-icon" aria-hidden="true"></i>
								<input ref="stallsSearchRef" v-model="qStalls" placeholder="Search stall # or occupant" class="search-input" aria-label="Search stalls" />
								<button v-if="qStalls" class="search-clear" @click="clearStallsSearch" aria-label="Clear search"><i class="pi pi-times"></i></button>
							</div>
						</div>
			<div class="bg-white rounded-2xl shadow overflow-hidden">
				<div class="tabs p-3 border-b flex gap-3 items-center">
					<button :class="['tab', { active: selectedTab === 'stakeholders' }]" @click="selectedTab = 'stakeholders'">
						<i class="pi pi-users" aria-hidden="true"></i>
						<span>Stakeholders</span>
						<span class="tab-count">{{ archived.length }}</span>
					</button>
					<button :class="['tab', { active: selectedTab === 'stalls' }]" @click="selectedTab = 'stalls'">
						<i class="pi pi-home" aria-hidden="true"></i>
						<span>Stalls</span>
						<span class="tab-count">{{ archivedStalls.length }}</span>
					</button>
				</div>
				<div class="p-4">
					<!-- Stakeholders panel -->
					<div v-show="selectedTab === 'stakeholders'">
						<div class="p-4 border-b mb-4 flex items-center justify-between">
							<h2 class="text-lg font-medium">Archived Stakeholders</h2>
							<span class="muted">Showing {{ archived.length }} records</span>
						</div>
						<div class="table-scroll">
							<table class="app-table w-full text-sm">
								<thead>
									<tr>
										<th>Stakeholder</th>
										<th>Business</th>
										<th>Status</th>
										<th>Applied On</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="s in filtered" :key="s.id">
										<td class="cell-wrap" style="padding:12px">
											<div class="name-cell">
												<div class="name-main">{{ s.name }}</div>
												<div class="name-sub" v-if="s.contact">{{ s.contact }}</div>
											</div>
										</td>
										<td>{{ s.business || '-' }}</td>
										<td><span :class="['chip', s.status && s.status.toLowerCase() === 'archived' ? 'archived' : 'muted']">{{ s.status }}</span></td>
										<td><div class="muted">{{ s.appliedOn || '-' }}</div><div class="xs muted">{{ s.archivedOn || '' }}</div></td>
										<td>
											<div class="actions">
												<button class="btn btn-ghost" @click="openView(s)"><i class="pi pi-eye"></i></button>
												<button class="btn btn-primary" @click="restore(s)"><i class="pi pi-replay"></i> Restore</button>
												<button class="btn btn-danger" @click="removePermanent(s)"><i class="pi pi-trash"></i></button>
											</div>
										</td>
									</tr>
									<tr v-if="filtered.length === 0">
										<td colspan="5" class="p-6 text-center text-gray-500">No archived records found.</td>
									</tr>
								</tbody>
							</table>
							</div>
						</div>
						
					<!-- Stalls panel -->
					<div v-show="selectedTab === 'stalls'">
						<div class="p-4 border-b mb-4 flex items-center justify-between">
							<h2 class="text-lg font-medium">Archived Stalls</h2>
							<span class="muted">Showing {{ archivedStalls.length }} stalls</span>
						</div>
						<div class="table-scroll">
							<table class="app-table w-full text-sm">
								<thead>
									<tr>
										<th>Stall #</th>
										<th>Occupant</th>
										<th>Archived On</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="st in archivedStalls" :key="st.id">
										<td class="fw">{{ st.number }}</td>
										<td>{{ st.occupant || '-' }}</td>
										<td><div class="muted">{{ st.archivedOn || '-' }}</div><div class="xs muted">{{ st.reason || '' }}</div></td>
										<td>
											<div class="actions">
												<button class="btn btn-primary" @click="restoreStall(st)"><i class="pi pi-replay"></i></button>
												<button class="btn btn-danger" @click="removeStallPermanent(st)"><i class="pi pi-trash"></i></button>
											</div>
										</td>
									</tr>
									<tr v-if="archivedStalls.length === 0">
										<td colspan="4" class="p-6 text-center text-gray-500">No archived stalls.</td>
									</tr>
								</tbody>
							</table>
							</div>
						</div>
					</div>
				</div>

			<div v-if="showModal" class="modal-backdrop">
				<div class="modal">
					<h3 class="text-xl font-semibold mb-3">Stakeholder Details</h3>
					<div class="info-box">
						<p><strong>Name:</strong> {{ selected.name }}</p>
						<p><strong>Business:</strong> {{ selected.business }}</p>
						<p v-if="selected.stallRequested"><strong>Stall Requested:</strong> {{ selected.stallRequested }}</p>
						<p><strong>Status:</strong> {{ selected.status }}</p>
						<p v-if="selected.notes"><strong>Notes:</strong> {{ selected.notes }}</p>
					</div>
					<div class="flex justify-end gap-2">
						<button class="btn-outline" @click="close">Close</button>
						<button class="btn-approve" @click="restore(selected)">Restore</button>
					</div>
				</div>
			</div>
		</div>

	</div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import MarketSupervisorMenu from '../components/MarketSupervisorMenu.vue'
import sampleApplicants from '../data/applicants.js'

const STORAGE_KEY = 'ms_applications'
	const STALLS_KEY = 'ms_stalls'

const confirm = useConfirm()
const q = ref('')
const showModal = ref(false)
const selected = ref({})
const selectedTab = ref('stakeholders')
const stakeSearchRef = ref(null)
const stallsSearchRef = ref(null)
const qStalls = ref('')

function loadApplications() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw) return JSON.parse(raw)
	} catch (e) {}
	// fallback to sample data
	return sampleApplicants.map(x => ({ ...x }))
}

const applications = ref(loadApplications())

function saveApplications() {
	try { localStorage.setItem(STORAGE_KEY, JSON.stringify(applications.value)) } catch (e) {}
}

function isArchived(app) {
	if (!app || !app.status) return false
	const s = String(app.status).toLowerCase()
	return s.includes('archive') || s === 'archived' || s === 'deleted'
}

const archived = computed(() => applications.value.filter(a => isArchived(a)))

function loadStalls() {
	try { const raw = localStorage.getItem(STALLS_KEY); if (raw) return JSON.parse(raw) } catch (e) {}
	return []
}

function saveStalls(list) { try { localStorage.setItem(STALLS_KEY, JSON.stringify(list)) } catch (e) {} }

const stalls = ref(loadStalls())

// watch selectedTab and focus the correct search input
watch(selectedTab, (v) => {
	nextTick(() => {
		if (v === 'stakeholders') {
			stakeSearchRef.value && stakeSearchRef.value.focus && stakeSearchRef.value.focus()
		} else {
			stallsSearchRef.value && stallsSearchRef.value.focus && stallsSearchRef.value.focus()
		}
	})
})

const archivedStalls = computed(() => {
		const term = (qStalls.value || '').toString().toLowerCase().trim()
		let list = (stalls.value || []).filter(s => s && s.status && String(s.status).toLowerCase() === 'archived')
		if (!term) return list
		return list.filter(s => (String(s.number || '').toLowerCase().includes(term)) || ((s.occupant || '').toLowerCase().includes(term)) || ((s.id || '').toLowerCase().includes(term)))
})

function clearStakeSearch() { q.value = ''; nextTick(() => stakeSearchRef.value && stakeSearchRef.value.focus && stakeSearchRef.value.focus()) }
function clearStallsSearch() { qStalls.value = ''; nextTick(() => stallsSearchRef.value && stallsSearchRef.value.focus && stallsSearchRef.value.focus()) }

const archivedCount = computed(() => archived.value.length)

const filtered = computed(() => {
	const term = (q.value || '').toLowerCase().trim()
	if (!term) return archived.value
	return archived.value.filter(a => (a.name || '').toLowerCase().includes(term) || (a.business || '').toLowerCase().includes(term) || (a.id || '').toLowerCase().includes(term))
})

function openView(app) {
	selected.value = app
	showModal.value = true
}

function close() { showModal.value = false }

function restore(app) {
	if (!app) return
	const idx = applications.value.findIndex(a => a.id === app.id)
	if (idx === -1) return
	// set to APPROVED by default when restoring; keep case consistent with other parts
	applications.value[idx].status = 'APPROVED'
	// clear archive metadata if any
	if (applications.value[idx].archivedOn) delete applications.value[idx].archivedOn
	saveApplications()
	// update selected view and close modal
	if (selected.value && selected.value.id === app.id) showModal.value = false
	alert('Record restored: ' + applications.value[idx].name)
}

function removePermanent(app) {
	if (!app) return
	confirm.require({
		header: 'Delete Record',
		message: 'Are you sure you want to permanently delete this record? This action cannot be undone.',
		acceptLabel: 'Delete',
		rejectLabel: 'Cancel',
		severity: 'danger',
		accept: () => {
			const idx = applications.value.findIndex(a => a.id === app.id)
			if (idx === -1) return
			const name = applications.value[idx].name || app.id
			applications.value.splice(idx, 1)
			saveApplications()
			alert('Deleted: ' + name)
		}
	})
}

function restoreStall(st) {
	if (!st) return
	const idx = stalls.value.findIndex(x => x.id === st.id)
	if (idx === -1) return
	stalls.value[idx].status = 'Vacant'
	if (stalls.value[idx].archivedOn) delete stalls.value[idx].archivedOn
	saveStalls(stalls.value)
	alert('Stall restored: ' + stalls.value[idx].number)
}

function removeStallPermanent(st) {
	if (!st) return
	confirm.require({
		header: 'Delete Stall',
		message: 'Are you sure you want to permanently delete this stall? This action cannot be undone.',
		acceptLabel: 'Delete',
		rejectLabel: 'Cancel',
		severity: 'danger',
		accept: () => {
			const idx = stalls.value.findIndex(x => x.id === st.id)
			if (idx === -1) return
			const num = stalls.value[idx].number || st.id
			stalls.value.splice(idx, 1)
			saveStalls(stalls.value)
			alert('Deleted stall: ' + num)
		}
	})
}
</script>

<style scoped src="../styles/MarketSupervisor/archive.css"></style>
