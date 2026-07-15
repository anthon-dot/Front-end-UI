<template>

	<div class="dashboard contracts-page">

		<MarketSupervisorMenu :forceOpen="true" />

		<main class="content">

			<!-- HEADER -->
			<div class="page-header">

				<div>

					<h1 class="title">
						Contracts
					</h1>

					<p class="subtitle">
						Manage stakeholder contracts and stall agreements
					</p>

				</div>

				<div class="controls">

					<SearchField
						v-model="q"
						placeholder="Search stakeholder or business..."
					/>

					<div class="controls-actions">

						<button
							class="btn-primary"
							@click="openCreate()"
						>
							＋ Create Contract
						</button>

						<button
							class="btn-outline"
							@click="refresh"
						>
							↻ Refresh
						</button>

					</div>

				</div>

			</div>

			<!-- STATS -->
			<div class="stats-grid">

				<div class="stat-card">

					<div class="stat-label">
						Total Stakeholders
					</div>

					<div class="stat-value">
						{{ stakeholders.length }}
					</div>

				</div>

				<div class="stat-card">

					<div class="stat-label">
						Total Contracts
					</div>

					<div class="stat-value">
						{{ contracts.length }}
					</div>

				</div>

				<div class="stat-card">

					<div class="stat-label">
						Active Search Results
					</div>

					<div class="stat-value">
						{{ filtered.length }}
					</div>

				</div>

			</div>

			<!-- TABLE -->
			<div class="card table-card">

				<div class="table-header">

					<h2>
						Stakeholders List
					</h2>

					<span class="record-count">
						{{ filtered.length }} records
					</span>

				</div>

				<div class="table-wrapper">

					<table class="contract-table">

						<thead>

							<tr>

								<th>ID</th>
								<th>Stakeholder</th>
								<th>Business</th>
								<th>Assigned Stall</th>
								<th>Actions</th>

							</tr>

						</thead>

						<tbody>

							<tr
								v-for="s in filtered"
								:key="s.id"
								class="row"
							>

								<td class="id-cell">
									#{{ s.id }}
								</td>

								<td>

									<div class="name">
										{{ s.firstName }}
										{{ s.lastName }}
									</div>

								</td>

								<td>

									<div class="sub">
										{{ s.businessName || "No business name" }}
									</div>

								</td>

								<td>

									<span
										v-if="s.occupant?.stall"
										class="stall-badge"
									>
										Stall
										{{ s.occupant?.stall?.stallNo }}
									</span>

									<span
										v-else
										class="no-stall"
									>
										No Stall
									</span>

								</td>

								<td class="actions">

									<div class="action-row">

										<button
											class="btn-small btn-secondary"
											@click="openCreate(s)"
										>
											Create
										</button>

										<button
											class="btn-small btn-outline"
											@click="viewContracts(s)"
										>
											View
										</button>

									</div>

								</td>

							</tr>

							<!-- EMPTY -->
							<tr v-if="filtered.length === 0">

								<td
									colspan="5"
									class="empty-cell"
								>

									<div class="empty-box">

										<div class="empty-icon">
											📄
										</div>

										<h3>
											No stakeholders found
										</h3>

										<p>
											Try adjusting your search keyword.
										</p>

									</div>

								</td>

							</tr>

						</tbody>

					</table>

				</div>

			</div>

			<!-- CREATE MODAL -->
			<div
				v-if="showModal"
				class="modal-backdrop"
			>

				<div class="modal">

					<div class="modal-header">

						<div>

							<h3 class="modal-title">
								Create Contract
							</h3>

							<p class="modal-subtitle">

								For

								<strong>

									{{ current?.firstName || "New" }}
									{{ current?.lastName || "" }}

								</strong>

							</p>

						</div>

						<button
							class="close-btn"
							@click="close"
						>
							✕
						</button>

					</div>

					<div class="form-grid">

						<div class="form-group">

							<label>
								Start Date
							</label>

							<input
								type="date"
								v-model="form.start"
								class="input-field"
							/>

						</div>

						<div class="form-group">

							<label>
								End Date
							</label>

							<input
								type="date"
								v-model="form.end"
								class="input-field"
							/>

						</div>

					</div>

					<!-- MONTHLY RENT DISPLAY -->
<div
	v-if="current?.occupant?.stall"
	class="form-group"
>

	<label>
		Monthly Rent
	</label>

	<div class="rent-display">

		₱
		{{
			current.occupant.stall.monthlyRent
		}}

	</div>

</div>

					<!-- BILLING -->
					<div class="form-group">

						<label>
							Billing Frequency
						</label>

						<select
							v-model="form.billingFrequency"
							class="input-field"
						>

							<option value="MONTHLY">
								MONTHLY
							</option>

							<option value="WEEKLY">
								WEEKLY
							</option>

							<option value="SEMI_MONTHLY">
								SEMI_MONTHLY
							</option>

						</select>

					</div>

					<!-- TERMS -->
					<div class="form-group">

						<label>
							Terms & Conditions
						</label>

						<textarea
							v-model="form.terms"
							rows="5"
							class="textarea-field"
							placeholder="Enter agreement terms..."
						></textarea>

					</div>

					<div class="modal-actions">

						<button
							class="btn-secondary"
							@click="close"
						>
							Cancel
						</button>

						<button
							class="btn-primary"
							@click="createContract"
						>
							Create Contract
						</button>

					</div>

				</div>

			</div>

			<!-- VIEW MODAL -->
			<div
				v-if="viewModal"
				class="modal-backdrop"
			>

				<div class="modal large">

					<div class="modal-header">

						<div>

							<h3 class="modal-title">
								Contracts
							</h3>

							<p class="modal-subtitle">

								{{ current?.firstName }}
								{{ current?.lastName }}

							</p>

						</div>

						<button
							class="close-btn"
							@click="closeView"
						>
							✕
						</button>

					</div>

					<div
						v-if="viewContractsList.length"
						class="contracts-list"
					>

						<div
							v-for="c in viewContractsList"
							:key="c.id"
							class="contract-item"
						>

							<div class="contract-top">

								<div>

									<div class="contract-title">
										{{ c.contractNo }}
									</div>

									<div class="contract-sub">
										{{ c.startDate }}
										→
										{{ c.endDate }}
									</div>

								</div>

								<span class="status-badge">
									{{ c.status }}
								</span>

							</div>

							<div class="terms-box">
								{{ c.terms }}
							</div>

						</div>

					</div>

					<div
						v-else
						class="empty-box"
					>

						<div class="empty-icon">
							📑
						</div>

						<h3>
							No Contracts Found
						</h3>

					</div>

				</div>

			</div>

		</main>

	</div>

</template>

<script setup>

import {
	ref,
	computed,
	onMounted
}
from "vue"

import api
	from "../services/api"

import MarketSupervisorMenu
	from "../components/MarketSupervisorMenu.vue"

import SearchField
	from "../components/SearchField.vue"


// =============================
// STATE
// =============================

const q = ref("")

const stakeholders = ref([])

const contracts = ref([])

const showModal = ref(false)

const viewModal = ref(false)

const current = ref(null)

const viewContractsList = ref([])

const form = ref({

	start: "",

	end: "",

	billingFrequency: "MONTHLY",

	terms: ""

})


// =============================
// LOAD STAKEHOLDERS
// =============================

async function loadStakeholders() {

	try {

		const response =
			await api.get(
				"/stakeholders"
			)

		stakeholders.value =
			response.data

	}

	catch (error) {

		console.error(error)

		alert(
			"Failed to load stakeholders"
		)

	}

}


// =============================
// LOAD CONTRACTS
// =============================

async function loadContracts() {

	try {

		const response =
			await api.get(
				"/contracts"
			)

		contracts.value =
			response.data

	}

	catch (error) {

		console.error(error)

		alert(
			"Failed to load contracts"
		)

	}

}


// =============================
// REFRESH
// =============================

async function refresh() {

	await loadStakeholders()

	await loadContracts()

}


// =============================
// FILTERED
// =============================

const filtered = computed(() => {

	const term =
		q.value.toLowerCase()

	if (!term) {

		return stakeholders.value

	}

	return stakeholders.value.filter(s =>

		(
			(s.firstName || "") +
			" " +
			(s.lastName || "") +
			" " +
			(s.businessName || "")
		)
		.toLowerCase()
		.includes(term)

	)

})


// =============================
// OPEN CREATE
// =============================

function openCreate(stakeholder = {}) {

	current.value =
		stakeholder

	form.value = {

	start: "",

	end: "",

	billingFrequency: "MONTHLY",

	terms: ""

}

	showModal.value = true

}


// =============================
// CLOSE
// =============================

function close() {

	showModal.value = false

}


// =============================
// CREATE CONTRACT
// =============================

async function createContract() {

	try {

		if (
			!current.value ||
			!current.value.occupant?.stall
		) {

			alert(
				"No stall assigned to stakeholder."
			)

			return
		}

		const payload = {

			contractNo:
				"CON-" + Date.now(),

			startDate:
				form.value.start,

			endDate:
				form.value.end,

			monthlyRent:
	current.value.occupant.stall.monthlyRent,

			billingFrequency:
				form.value.billingFrequency,

			terms:
				form.value.terms,

			status:
				"ACTIVE",

			occupant: {

				id:
					current.value.occupant.id

			},

			stall: {

				id:
					current.value.occupant.stall.id

			}

		}

		console.log(
			"PAYLOAD:",
			payload
		)

		const response =
			await api.post(
				"/contracts",
				payload
			)

		console.log(
			response.data
		)

		alert(
			"Contract created successfully"
		)

		showModal.value = false

		await loadContracts()

	}

	catch (error) {

		console.error(error)

		console.log(
			error.response?.data
		)

		alert(
			error.response?.data ||
			"Failed to create contract"
		)

	}

}


// =============================
// VIEW CONTRACTS
// =============================

function viewContracts(stakeholder) {

	current.value =
		stakeholder

	viewContractsList.value =
		contracts.value.filter(c =>

			c.stall &&
			stakeholder.occupant?.stall &&
			c.stall.id ===
			stakeholder.occupant.stall.id

		)

	viewModal.value = true

}


// =============================
// CLOSE VIEW
// =============================

function closeView() {

	viewModal.value = false

}


// =============================
// ON MOUNT
// =============================

onMounted(async () => {

	await refresh()

})

</script>

<style scoped>

.contracts-page {
	min-height: 100vh;
	background:
		linear-gradient(
			135deg,
			#f0fdfa,
			#f8fafc
		);
}

.content {
	padding: 24px;
	margin-left: var(--sidebar-width, 260px);
	transition:
		margin-left .25s ease,
		padding .25s ease;
	min-height: 100vh;
	box-sizing: border-box;
}

/* RESPONSIVE */
@media (max-width: 900px) {

	.content {
		margin-left: 74px;
		padding: 16px;
	}

}
/* HEADER */
.page-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 16px;
	background: rgba(255,255,255,.85);
	padding: 24px;
	border-radius: 22px;
	margin-bottom: 18px;
	box-shadow:
		0 10px 24px rgba(0,0,0,.05);
}

.title {
	font-size: 32px;
	font-weight: 800;
	color: #0f172a;
}

.subtitle {
	color: #64748b;
	font-size: 14px;
	margin-top: 4px;
}

.controls {
	display: flex;
	align-items: center;
	gap: 14px;
	flex-wrap: wrap;
}

.controls-actions {
	display: flex;
	gap: 10px;
}

/* STATS */
.stats-grid {
	display: grid;
	grid-template-columns:
		repeat(auto-fit, minmax(200px,1fr));
	gap: 16px;
	margin-bottom: 20px;
}

.stat-card {
	background: white;
	padding: 20px;
	border-radius: 20px;
	box-shadow:
		0 6px 16px rgba(0,0,0,.05);
}

.stat-label {
	font-size: 14px;
	color: #64748b;
}

.stat-value {
	font-size: 30px;
	font-weight: 800;
	margin-top: 8px;
	color: #0f172a;
}

/* CARD */
.card {
	background: rgba(255,255,255,.9);
	border-radius: 24px;
	padding: 20px;
	box-shadow:
		0 10px 24px rgba(0,0,0,.05);
}

.table-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 18px;
}

.record-count {
	font-size: 13px;
	color: #64748b;
}

/* TABLE */
.table-wrapper {
	overflow-x: auto;
}

.contract-table {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0 12px;
}

.contract-table th {
	text-align: left;
	font-size: 14px;
	color: #64748b;
	padding: 14px;
}

.contract-table td {
	background: white;
	padding: 18px 14px;
}

.contract-table tbody tr {
	box-shadow:
		0 4px 12px rgba(0,0,0,.04);
	border-radius: 16px;
	transition: .2s;
}

.contract-table tbody tr:hover {
	transform: translateY(-2px);
}

.name {
	font-weight: 700;
	color: #0f172a;
}

.sub {
	font-size: 13px;
	color: #64748b;
}

.stall-badge {
	background: #dcfce7;
	color: #166534;
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 700;
}

.no-stall {
	color: #ef4444;
	font-size: 13px;
	font-weight: 600;
}

/* BUTTONS */
.btn-primary {
	background:
		linear-gradient(
			135deg,
			#14b8a6,
			#0d9488
		);
	color: white;
	border: none;
	padding: 11px 16px;
	border-radius: 12px;
	font-weight: 700;
	cursor: pointer;
}

.btn-outline,
.btn-secondary {
	background: white;
	border: 1px solid #dbe4ee;
	padding: 11px 16px;
	border-radius: 12px;
	cursor: pointer;
}

.btn-small {
	padding: 8px 12px;
	font-size: 13px;
	border-radius: 10px;
}

.action-row {
	display: flex;
	gap: 8px;
}

/* MODAL */
.modal-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(15,23,42,.45);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 3000;
	padding: 20px;
}

.modal {
	background: white;
	width: 100%;
	max-width: 620px;
	border-radius: 24px;
	padding: 24px;
	box-shadow:
		0 20px 40px rgba(0,0,0,.12);
}

.modal.large {
	max-width: 760px;
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: start;
	margin-bottom: 20px;
}

.modal-title {
	font-size: 24px;
	font-weight: 800;
}

.modal-subtitle {
	color: #64748b;
	font-size: 14px;
	margin-top: 4px;
}

.close-btn {
	background: #f1f5f9;
	border: none;
	width: 38px;
	height: 38px;
	border-radius: 50%;
	cursor: pointer;
	font-size: 16px;
}

.form-grid {
	display: grid;
	grid-template-columns: repeat(2,1fr);
	gap: 16px;
}

.form-group {
	margin-bottom: 16px;
}

.form-group label {
	display: block;
	font-size: 14px;
	font-weight: 600;
	margin-bottom: 8px;
	color: #334155;
}

.input-field,
.textarea-field {
	width: 100%;
	border: 1px solid #dbe4ee;
	border-radius: 14px;
	padding: 12px;
	outline: none;
	font-size: 14px;
}

.input-field:focus,
.textarea-field:focus {
	border-color: #14b8a6;
	box-shadow:
		0 0 0 3px rgba(20,184,166,.15);
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	margin-top: 18px;
}

/* CONTRACT VIEW */
.contracts-list {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.contract-item {
	background: #f8fafc;
	border-radius: 18px;
	padding: 18px;
}

.contract-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.contract-title {
	font-weight: 800;
	font-size: 16px;
	color: #0f172a;
}

.contract-sub {
	font-size: 13px;
	color: #64748b;
}

.status-badge {
	background: #dbeafe;
	color: #1d4ed8;
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 700;
}

.terms-box {
	background: white;
	padding: 14px;
	border-radius: 14px;
	font-size: 14px;
	color: #334155;
	line-height: 1.5;
}

/* EMPTY */
.empty-cell {
	padding: 40px !important;
	text-align: center;
}

.empty-box {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 30px;
	color: #64748b;
}

.empty-icon {
	font-size: 42px;
	margin-bottom: 10px;
}

/* RESPONSIVE */
@media (max-width: 768px) {

	.page-header {
		flex-direction: column;
		align-items: stretch;
	}

	.controls {
		flex-direction: column;
		align-items: stretch;
	}

	.controls-actions {
		width: 100%;
	}

	.form-grid {
		grid-template-columns: 1fr;
	}

	.contract-top {
		flex-direction: column;
		align-items: start;
		gap: 10px;
	}
}
.rent-display {

	width: 100%;

	padding: 12px;

	border-radius: 14px;

	background: #f8fafc;

	border: 1px solid #dbe4ee;

	font-size: 15px;

	font-weight: 700;

	color: #0f172a;

}
</style>
