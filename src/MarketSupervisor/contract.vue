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

<style scoped src="../styles/MarketSupervisor/contract.css"></style>
