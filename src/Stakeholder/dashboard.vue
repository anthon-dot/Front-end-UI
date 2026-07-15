<template>
	<div class="stakeholder-layout">
		<StakeholderMenu />
		<main class="stakeholder-dashboard">
		<div class="header">
			<div class="header-left">
				<h1>{{ stakeholder?.name || 'Stakeholder' }}</h1>
				<div class="meta">{{ stakeholder?.business || '-' }}</div>
			</div>
			<div class="header-right">
				<Notification :notifications="notificationsForStakeholder" @mark-read="markRead" @mark-all="markAllRead" />
			</div>
		</div>

		<div class="grid">
			<section class="card profile">
				<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
					<div class="avatar">
						<img v-if="applicationsForThis?.avatar" :src="applicationsForThis.avatar" alt="avatar" />
						<span v-else class="avatar-initials">{{ (stakeholder?.name||'').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() }}</span>
					</div>
					<div style="flex:1">
						<div style="display:flex;gap:8px;align-items:center">
							<label class="btn-secondary" style="cursor:pointer">
								<input id="profileUploadInput" type="file" accept="image/*" @change="handleProfileUpload" style="display:none" />
								Upload Profile
							</label>
							<button v-if="applicationsForThis?.avatar" class="btn-secondary" @click="removeProfile">Remove</button>
						</div>
						<div class="meta" style="margin-top:8px">Uploaded: <span v-if="applicationsForThis?.avatarFileName">{{ applicationsForThis.avatarFileName }}</span><span v-else>—</span></div>
					</div>
				</div>
				<div class="row">
					<div>
						<div class="label">Status</div>
						<div class="value"><span :class="['chip', (stakeholder?.status||'').toLowerCase()]">{{ stakeholder?.status || 'N/A' }}</span></div>
					</div>
					<div>
						<div class="label">Contact</div>
						<div class="value">{{ stakeholder?.contact || '-' }}</div>
					</div>
					<div>
						<div class="label">Stall</div>
						<div class="value">{{ assignedStall?.number || stakeholder?.stall || stakeholder?.stallRequested || '-' }}</div>
					</div>
				</div>

				<div class="actions">
					<button class="btn-primary" @click="openEdit">Edit Profile</button>
					<button class="btn-secondary" @click="viewContracts">View Contracts</button>
				</div>
			</section>

			<section class="card contracts" id="contracts-section">
				<h3>Contracts</h3>
				<div v-if="contractsForStakeholder.length">
					<ul class="contracts-list">
						<li v-for="(c, idx) in contractsForStakeholder" :key="idx" class="contract-item">
								<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
									<div>
										<div class="contract-ref" v-if="c.ref">{{ c.ref }}</div>
										<div class="contract-dates">Start: <strong>{{ formatDate(c.start) || '-' }}</strong> — End: <strong>{{ formatDate(c.end) || '-' }}</strong></div>
									</div>
									<div>
										<button v-if="c.contractUrl || c.url" class="btn-secondary" @click.prevent="openContract(c)">View</button>
										<button v-else class="btn-secondary" @click.prevent="openContract(c)">Details</button>
									</div>
								</div>
						</li>
					</ul>
				</div>
				<div v-else class="empty">No contract records for this stakeholder.</div>
			</section>

			<section class="card uploads">
				<h3>Uploaded Files</h3>
				<table class="uploads-table">
					<thead>
						<tr><th>Type</th><th>File</th><th>Action</th></tr>
					</thead>
					<tbody>
						<tr v-for="f in uploadedFiles" :key="f.key">
							<td>{{ f.label }}</td>
							<td>{{ f.name }}</td>
							<td><button class="btn-secondary" @click="removeUploadedFile(f.key)">Remove</button></td>
						</tr>
						<tr v-if="uploadedFiles.length === 0"><td colspan="3" class="empty">No uploaded files.</td></tr>
					</tbody>
				</table>
			</section>

			<section class="card payments">
				<h3>Payments</h3>
				<table>
					<thead>
						<tr><th>Date</th><th>Type</th><th>Amount</th></tr>
					</thead>
					<tbody>
						<tr v-for="p in paymentsForStakeholder" :key="p.id">
							<td>{{ p.date }}</td>
							<td>{{ p.type }}</td>
							<td>{{ formatCurrency(p.amount) }}</td>
						</tr>
						<tr v-if="paymentsForStakeholder.length === 0"><td colspan="3" class="empty">No payments found.</td></tr>
					</tbody>
				</table>
			</section>

			<section class="card progress">
				<h3>Application Progress</h3>
				<div class="stepper-wrap">
					<div class="stepper">
						<div v-for="(s, idx) in stepDefs" :key="s.key" class="step" :class="{done: isDone(s.key), active: isActive(s.key)}">
							<div class="circle"> 
								<span v-if="isDone(s.key)">✔</span>
								<span v-else>{{ idx + 1 }}</span>
							</div>
							<div class="label">{{ s.label }}</div>
							<div class="filearea">
								<!-- special UI for treasurer payment step -->
								<div v-if="s.key === 'treasurerPaid'">
									<span v-if="isDone('treasurerPaid')" class="meta">Completed</span>
									<button v-else-if="isActive('treasurerPaid')" class="btn-primary" @click.prevent="markTreasurerPaid">Mark Paid</button>
									<div v-else class="meta muted">Locked</div>
								</div>
								<span v-else-if="getFileName(s.key)" class="meta">{{ getFileName(s.key) }}</span>
								<input v-else-if="canUpload(s.key)" type="file" @change="handleFileChange(s.key, $event)" />
								<div v-else class="meta muted">Locked</div>
							</div>
							<div v-if="idx < stepDefs.length - 1" class="connector" :class="{done: isDone(s.key) && isDone(stepDefs[idx+1].key)}"></div>
						</div>
					</div>
				</div>
			</section>
		</div>

		<div v-if="showEdit" class="modal-backdrop" @click.self="closeEdit">
			<div class="modal">
				<h3>Edit Profile</h3>
				<label>Name<input v-model="form.name" /></label>
				<label>Business<input v-model="form.business" /></label>
				<label>Contact<input v-model="form.contact" /></label>
				<div class="modal-actions">
					<button @click="closeEdit">Cancel</button>
					<button class="btn-primary" @click="saveProfile">Save</button>
				</div>
			</div>
		</div>

		<!-- Contract viewer modal (shows details and file when available) -->
		<div v-if="showContractModal" class="modal-backdrop" @click.self="closeContractModal">
			<div class="modal modal-large">
				<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
					<h3>Contract Details</h3>
					<div class="contract-actions">
						<button v-if="selectedContract && (selectedContract.contractUrl || selectedContract.url)" class="btn-secondary" @click="openInNewTab(selectedContract)">Open in new tab</button>
						<button @click="closeContractModal">Close</button>
					</div>
				</div>
				<div v-if="selectedContract" style="margin-top:10px">
					<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
						<div>
							<div class="label">Reference</div>
							<div class="value">{{ selectedContract.ref || selectedContract.id || '-' }}</div>
						</div>
						<div>
							<div class="label">Start Date</div>
							<div class="value">{{ formatDate(selectedContract.start) || '-' }}</div>
						</div>
						<div>
							<div class="label">End Date</div>
							<div class="value">{{ formatDate(selectedContract.end) || '-' }}</div>
						</div>
					</div>
					<div style="margin-top:12px">
						<div v-if="selectedContract.contractUrl || selectedContract.url" class="contract-viewer">
							<iframe v-if="isUrl(selectedContract.contractUrl || selectedContract.url)" :src="selectedContract.contractUrl || selectedContract.url" frameborder="0"></iframe>
							<div v-else class="no-file">Contract reference: <strong>{{ selectedContract.ref || selectedContract.id }}</strong></div>
						</div>
						<div v-else class="no-file">No contract file available for this record.</div>
					</div>
				</div>
			</div>
		</div>
		</main>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import sampleApplicants from '../data/applicants.js'
import sampleContracts from '../data/contracts.js'
import StakeholderMenu from '../components/stakeholdermenu.vue'
import Notification from '../components/Notification.vue'
import {
	getStakeholderNotifications,
	markAllNotificationsAsRead,
	markNotificationAsRead
} from '../services/notificationService'

const route = useRoute()
const router = useRouter()
const stakeholderId =
	route.query.id ||
	route.params.id ||
	localStorage.getItem('stakeholderId') ||
	null

const showEdit = ref(false)
const form = ref({ name: '', business: '', contact: '' })

function loadApplications() {
	try { const raw = localStorage.getItem('ms_applications'); if (raw) return JSON.parse(raw) } catch (e) {}
	return sampleApplicants.map(x => ({ ...x }))
}

const applications = ref(loadApplications())

function saveApplications() { try { localStorage.setItem('ms_applications', JSON.stringify(applications.value)) } catch (e) {} }

const stakeholder = computed(() => {
	if (!stakeholderId) return applications.value[0] || null
	return applications.value.find(a => String(a.id) === String(stakeholderId)) || null
})

function loadStalls() {
	try { const raw = localStorage.getItem('ms_stalls'); if (raw) return JSON.parse(raw) } catch (e) {}
	return []
}

const stalls = ref(loadStalls())

const assignedStall = computed(() => {
	if (!stakeholder.value) return null
	return stalls.value.find(s => (s.occupant && s.occupant === stakeholder.value.name) || s.number === stakeholder.value.stall) || null
})

function loadPayments() {
	try { const raw = localStorage.getItem('payments'); if (raw) return JSON.parse(raw) } catch (e) {}
	return []
}

function loadContracts(){ try{ const raw = localStorage.getItem('contracts'); if (raw) return JSON.parse(raw) }catch(e){} return sampleContracts.map(x=>({ ...x })) }

const payments = ref(loadPayments())
const contracts = ref(loadContracts())

function saveContracts(){ try{ localStorage.setItem('contracts', JSON.stringify(contracts.value)) }catch(e){} }

function loadNotifications(){ try { const raw = localStorage.getItem('ms_notifications'); if (raw) return JSON.parse(raw) } catch(e){} return [] }

function saveNotifications(){ try { localStorage.setItem('ms_notifications', JSON.stringify(notifications.value)) } catch(e){} }

const notifications = ref(loadNotifications())

const notificationsForStakeholder = computed(()=>{
	if (!stakeholder.value) return []
	return notifications.value.filter(n => String(n.stakeholderId) === String(stakeholder.value.id))
})

function addNotification(message){
	const id = 'N' + Date.now()
	const item = { id, stakeholderId: stakeholder.value ? stakeholder.value.id : null, message, date: new Date().toLocaleString(), read:false }
	notifications.value.unshift(item)
	saveNotifications()
}

async function loadBackendNotifications(){
	if (!stakeholderId) return

	try {
		const response = await getStakeholderNotifications(stakeholderId)
		notifications.value = response.data
	} catch (error) {
		console.warn('Unable to load backend notifications', error)
	}
}

async function markRead(id){
	try {
		await markNotificationAsRead(id)
		await loadBackendNotifications()
		return
	} catch (error) {
		console.warn('Unable to mark backend notification as read', error)
	}

	const idx = notifications.value.findIndex(n=>n.id===id)
	if (idx!==-1){ notifications.value[idx].read = true; saveNotifications() }
}

async function markAllRead(){
	if (stakeholderId) {
		try {
			await markAllNotificationsAsRead(stakeholderId)
			await loadBackendNotifications()
			return
		} catch (error) {
			console.warn('Unable to mark backend notifications as read', error)
		}
	}

	let changed = false
	for (const n of notifications.value){ if (String(n.stakeholderId) === String(stakeholder.value?.id) && !n.read){ n.read = true; changed = true } }
	if (changed) saveNotifications()
}

const paymentsForStakeholder = computed(() => {
	if (!stakeholder.value) return []
	return payments.value.filter(p => (p.stakeholderId && String(p.stakeholderId) === String(stakeholder.value.id)) || (p.stakeholder && p.stakeholder === stakeholder.value.name))
})

const contractsForStakeholder = computed(() => {
	if (!stakeholder.value) return []
	const list = []
	// include contracts stored globally
	for (const c of contracts.value){ if (String(c.stakeholderId) === String(stakeholder.value.id)) list.push(c) }
	const app = applicationsForThis.value || {}
	// application-level contract fields
	if (Array.isArray(app.contracts)){
		for (const c of app.contracts) list.push({ start: c.start, end: c.end, ref: c.ref })
	}
	if (app.contractStart || app.contractEnd) list.push({ start: app.contractStart, end: app.contractEnd, ref: app.contractRef })
	// stall assignment based contract info
	if (assignedStall && assignedStall.value){
		const s = assignedStall.value
		const start = s.assignedOn || s.assignedAt || app.approvedOn || stakeholder.value.approvedOn || app.appliedOn
		const end = s.leaseEnd || s.assignedUntil || app.contractEnd || null
		if (start || end) list.push({ start, end, ref: s.number || s.name })
	}
	return list
})

const showContractModal = ref(false)
const selectedContract = ref(null)

function openContract(c){
	if (!c) return
	selectedContract.value = c
	showContractModal.value = true
}

function closeContractModal(){ selectedContract.value = null; showContractModal.value = false }

function openInNewTab(c){ const url = c.contractUrl || c.url; if (!url) return alert('No contract file available'); try{ window.open(url,'_blank') }catch(e){ alert('Unable to open contract') } }

function isUrl(v){ if(!v) return false; try{ return /^https?:\/\//i.test(v) || /^data:/i.test(v) }catch(e){ return false } }

const stepState = computed(() => {
  const s = stakeholder.value || {}
  return {
    letterOfIntent: !!s.letterOfIntent,
    validID: !!s.validID,
    advancePaid: !!s.advancePaid,
		contractUnlocked: !!s.contractUnlocked,
    postUpload1: !!s.postUpload1,
    postUpload2: !!s.postUpload2,
    applicationFormUnlocked: !!s.applicationFormUnlocked
		,treasurerPaid: !!s.treasurerPaid
	}
})

function setStep(key, value){
	if (!stakeholder.value) return
	const idx = applications.value.findIndex(a => String(a.id) === String(stakeholder.value.id))
	if (idx === -1) return
	applications.value[idx][key] = value
	saveApplications()
}

const stepDefs = [
	{ key: 'letterOfIntent', label: 'Letter of Intent' },
	{ key: 'validID', label: 'Valid ID' },
	{ key: 'advancePaid', label: 'Advance payment' },
	{ key: 'contractUnlocked', label: 'Contract' },
	{ key: 'postUpload1', label: 'Post-contract upload 1' },
	{ key: 'postUpload2', label: 'Post-contract upload 2' },
	{ key: 'applicationFormUnlocked', label: 'Application form' },
	{ key: 'treasurerPaid', label: 'Payment to Treasurer' }
]

function isDone(key){ return !!stepState.value[key] }

function isActive(key){
	// active if previous steps are done and this one is not done
	const keys = stepDefs.map(s=>s.key)
	const idx = keys.indexOf(key)
	if (idx === -1) return false
	for (let i = 0; i < idx; i++){ if (!stepState.value[keys[i]]) return false }
	return !stepState.value[key]
}

function getFileName(key){
	const a = applicationsForThis.value || {}
	const v = a[key + 'FileName'] || a[key + 'File'] || a[key]
	// avoid returning boolean true (happens when we set a[key]=true)
	if (typeof v === 'string' && v.trim() !== '') return v
	return null
}

function canUpload(key){
	// allow upload when the relevant unlock is present or when it's an earlier step
	if (key === 'postUpload1' || key === 'postUpload2') return !!stepState.value.contractUnlocked
	if (key === 'applicationFormUnlocked') return !!(stepState.value.postUpload1 && stepState.value.postUpload2)
	return true
}

const uploadedFiles = computed(()=>{
	const a = applicationsForThis.value || {}
	const list = []
	// profile photo
	if (a.avatarFileName) list.push({ key: 'avatar', label: 'Profile Photo', name: a.avatarFileName })
	for (const s of stepDefs){
		const name = getFileName(s.key)
		if (name) list.push({ key: s.key, label: s.label, name })
	}
	return list
})

function removeUploadedFile(key){
	if (!stakeholder.value) return
	if (!confirm('Remove uploaded file for "' + key + '"?')) return
	const idx = applications.value.findIndex(a => String(a.id) === String(stakeholder.value.id))
	if (idx === -1) return
	const a = applications.value[idx]
	if (key === 'avatar'){
		delete a.avatar
		delete a.avatarFileName
	} else {
		delete a[key]
		delete a[key + 'File']
		delete a[key + 'FileName']
		// legacy keys
		if (key === 'letterOfIntent') delete a.letterOfIntentFile
		if (key === 'validID') delete a.validIDFile
		if (key === 'postUpload1') delete a.postUpload1File
		if (key === 'postUpload2') delete a.postUpload2File
	}
	saveApplications()
}

const contractUrl = '/contract.pdf'
const applicationFormUrl = '/application-form.pdf'

const applicationsForThis = computed(() => {
	if (!stakeholder.value) return null
	return applications.value.find(a => String(a.id) === String(stakeholder.value.id)) || null
})

const progressPercent = computed(() => {
	const s = stepState.value
	const keys = ['letterOfIntent','validID','advancePaid','contractUnlocked','postUpload1','postUpload2','applicationFormUnlocked','treasurerPaid']
	const total = keys.length
	const done = keys.reduce((acc,k)=> acc + (s[k] ? 1 : 0), 0)
	return (done / total) * 100
})

function savePayments(){ try{ localStorage.setItem('payments', JSON.stringify(payments.value)) }catch(e){} }

function markTreasurerPaid(){
	if (!stakeholder.value) return
	if (!confirm('Mark payment to treasurer as completed for this stakeholder?')) return
	const id = 'P' + Date.now()
	const item = { id, stakeholderId: stakeholder.value.id, stakeholder: stakeholder.value.name, date: new Date().toLocaleDateString(), type: 'To Treasurer', amount: 0 }
	payments.value.unshift(item)
	savePayments()
	const idx = applications.value.findIndex(a => String(a.id) === String(stakeholder.value.id))
	if (idx !== -1){
		applications.value[idx].treasurerPaid = true
		applications.value[idx].status = 'VERIFIED'
		saveApplications()
	}
	addNotification('Payment to treasurer recorded. Stakeholder verified.')
	alert('Payment recorded and stakeholder verified')
}

function reconcileTreasurerFromPayments(){
	if (!stakeholder.value) return
	const found = payments.value.find(p => (String(p.stakeholderId) === String(stakeholder.value.id) || p.stakeholder === stakeholder.value.name) && p.type === 'To Treasurer')
	if (found){
		const idx = applications.value.findIndex(a => String(a.id) === String(stakeholder.value.id))
		if (idx !== -1 && !applications.value[idx].treasurerPaid){
			applications.value[idx].treasurerPaid = true
			applications.value[idx].status = 'VERIFIED'
			saveApplications()
		}
	}
}

function handleFileChange(stepKey, ev){
	const file = ev.target.files && ev.target.files[0]
	if (!file) return
	if (!stakeholder.value) return
	const idx = applications.value.findIndex(a => String(a.id) === String(stakeholder.value.id))
	if (idx === -1) return
	// store filename locally (avoid storing boolean 'true' so filename shows correctly)
	applications.value[idx][stepKey] = file.name
	applications.value[idx][stepKey + 'File'] = file.name
	applications.value[idx][stepKey + 'FileName'] = file.name
	// legacy-friendly keys
	if (stepKey === 'postUpload1') applications.value[idx].postUpload1File = file.name
	if (stepKey === 'postUpload2') applications.value[idx].postUpload2File = file.name
	if (stepKey === 'letterOfIntent') applications.value[idx].letterOfIntentFile = file.name
	if (stepKey === 'validID') applications.value[idx].validIDFile = file.name
	saveApplications()
}

function handleProfileUpload(ev){
	const file = ev.target.files && ev.target.files[0]
	if (!file) return
	if (!stakeholder.value) return
	const idx = applications.value.findIndex(a => String(a.id) === String(stakeholder.value.id))
	if (idx === -1) return
	const reader = new FileReader()
	reader.onload = function(e){
		const data = e.target.result
		applications.value[idx].avatar = data
		applications.value[idx].avatarFileName = file.name
		saveApplications()
	}
	reader.readAsDataURL(file)
}

function removeProfile(){
	if (!stakeholder.value) return
	const idx = applications.value.findIndex(a => String(a.id) === String(stakeholder.value.id))
	if (idx === -1) return
	delete applications.value[idx].avatar
	delete applications.value[idx].avatarFileName
	saveApplications()
}

function scanUnlockContract(){
	if (!stepState.value.advancePaid){ alert('Advance payment not detected. Contract cannot be unlocked.'); return }
	setStep('contractUnlocked', true)
	addNotification('Your contract has been unlocked and is ready to download.')
	alert('Contract unlocked and available for download')
}

function scanUnlockApplication(){
	if (!stepState.value.postUpload1 || !stepState.value.postUpload2){ alert('Required post-contract uploads not found.'); return }
	setStep('applicationFormUnlocked', true)
	addNotification('Your application form has been unlocked and is ready to download.')
	alert('Application form unlocked and available for download')
}

function formatCurrency(n){ return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(n||0) }

function formatDate(d){
	if(!d) return ''
	try{ const dt = new Date(d); if (isNaN(dt)) return d; return dt.toLocaleDateString() }catch(e){ return String(d) }
}

const stallDetails = computed(()=>{
	if(assignedStall && assignedStall.value){
		const s = assignedStall.value
		const parts = [s.number || s.name || '', s.zone || s.location || s.section || '', s.assignedOn || s.assignedAt || '']
		return parts.filter(Boolean).join(' — ') || JSON.stringify(s)
	}
	return stakeholder.value?.stall || stakeholder.value?.stallRequested || '-'
})

function openEdit(){ if (!stakeholder.value) return; form.value = { name: stakeholder.value.name||'', business: stakeholder.value.business||'', contact: stakeholder.value.contact||'' }; showEdit.value = true }
function closeEdit(){ showEdit.value = false }
function saveProfile(){ if (!stakeholder.value) return; const idx = applications.value.findIndex(a=>String(a.id)===String(stakeholder.value.id)); if (idx!==-1){ applications.value[idx].name = form.value.name; applications.value[idx].business = form.value.business; applications.value[idx].contact = form.value.contact; saveApplications(); showEdit.value = false; alert('Profile saved') } }

function archiveAccount(){ if (!stakeholder.value) return; if (!confirm('Archive this account?')) return; const idx = applications.value.findIndex(a=>String(a.id)===String(stakeholder.value.id)); if (idx!==-1){ applications.value[idx].status = 'ARCHIVED'; applications.value[idx].archivedOn = new Date().toISOString().slice(0,10); saveApplications(); alert('Archived'); router.push({ name: 'Landing' }).catch(()=>{}) } }

function viewPayments(){ /* could navigate to payments view or open modal; for now scroll */ window.scrollTo({ top: document.body.scrollHeight, behavior:'smooth' }) }

function viewContracts(){ const el = document.getElementById('contracts-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); else window.scrollTo({ top: document.body.scrollHeight, behavior:'smooth' }) }

onMounted(()=>{
	// ensure we have latest data
	applications.value = loadApplications()
	stalls.value = loadStalls()
	payments.value = loadPayments()
	contracts.value = loadContracts()
	// persist sample contracts into localStorage on first run
	try{ if (!localStorage.getItem('contracts')) saveContracts() }catch(e){}
	// reconcile any existing treasurer payments and update application state
	reconcileTreasurerFromPayments()
	loadBackendNotifications()
	window.setInterval(loadBackendNotifications, 30000)
})
</script>

<style scoped>
.stakeholder-layout { display:flex; align-items:flex-start }
.stakeholder-dashboard { padding: 20px; flex:1; padding-top: calc(var(--header-height,64px) + 20px) }
.header { display:flex; justify-content:space-between; align-items:center; gap:12px }
.header h1 { margin:0; font-size:1.5rem }
.header .meta { color:#6b7280; margin:0; font-size:0.95rem }
.header-left { display:flex; flex-direction:column }
.header-right { display:flex; align-items:center }
.grid { display:grid; grid-template-columns: 360px 1fr; gap:16px }
.card { background: var(--card); padding:14px; border-radius:12px; box-shadow:0 8px 24px rgba(2,6,23,0.04); color:var(--surface-text) }
.card.progress { grid-column: 1 / -1 }
.row { display:flex; gap:16px; margin-bottom:12px }
.label { font-size:12px; color:#6b7280 }
.value { font-weight:600 }
.chip { padding:6px 10px; border-radius:999px; background:#eef2ff; color:#0f172a }
.chip.archived { background:#fef2f2; color:#7f1d1d }
.chip.approved { background: rgba(16,185,129,0.12); color: var(--success); border: 1px solid rgba(16,185,129,0.18) }
.chip.pending { background: rgba(250,204,21,0.12); color: #b45309 }
.chip.rejected { background: rgba(239,68,68,0.12); color: #b91c1c }

/* prevent overlap and ensure chips align nicely */
.row { display:flex; gap:16px; margin-bottom:12px; align-items:center; flex-wrap:wrap }
.value { min-width:120px }
.chip { display:inline-flex; align-items:center; justify-content:center; min-width:64px }
.actions { display:flex; gap:8px }
.btn-primary { background:#0ea5a4; color:white; padding:8px 12px; border-radius:8px; border:none }
.btn-secondary { background:#f3f4f6; padding:8px 12px; border-radius:8px; border:none }
.btn-danger { background:#ef4444; color:white; padding:8px 12px; border-radius:8px; border:none }
.payments table { width:100%; border-collapse:collapse }
.payments th, .payments td { padding:8px; border-bottom:1px solid #eee; text-align:left }
.empty { text-align:center; color:#6b7280 }
.contracts-list { list-style:none; padding:0; margin:0 }
.contract-item { padding:8px 0; border-bottom:1px solid #f1f5f9 }
.contract-ref { font-weight:700; color:#0f172a }
.contract-dates { color:#374151; margin-top:4px }
.uploads-table { width:100%; border-collapse:collapse; margin-top:8px }
.uploads-table th, .uploads-table td { padding:10px; border-bottom:1px solid #eee; text-align:left }
.uploads-table th { color:#6b7280; font-weight:600 }
.modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center }
.modal { background:white; padding:16px; border-radius:10px; width:100%; max-width:420px }
.modal-large { max-width:900px }
.contract-viewer { height:72vh; border:1px solid #eef2f7; border-radius:8px; overflow:hidden }
.contract-viewer iframe { width:100%; height:100%; border:0 }
.contract-actions { display:flex; gap:8px }
.no-file { padding:18px; color:#374151 }
.modal label { display:block; margin-bottom:8px }
.modal input { width:100%; padding:8px; border:1px solid #e6eef7; border-radius:8px }
.modal-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:10px }
@media (max-width:900px){ .grid { grid-template-columns: 1fr } .stakeholder-dashboard{ margin-left:0; padding-left:16px } }

.progress .steps { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px }
.stepper-wrap{ padding:22px 12px }
.stepper{ display:flex; gap:28px; align-items:flex-start }
.step{ position:relative; flex:1; text-align:center; padding-top:18px }
.step .circle{ width:56px; height:56px; border-radius:50%; background:#fff; border:2px solid #e6e6e6; display:inline-flex; align-items:center; justify-content:center; font-weight:700; font-size:15px }
.step.done .circle{ background:linear-gradient(90deg,#059669,#0ea5a4); color:white; border:none }
.step.active .circle{ box-shadow:0 6px 18px rgba(5,150,105,0.12); border-color:#10b981 }
.step .label{ margin-top:12px; color:#374151; font-size:1rem }
.step .filearea{ margin-top:10px }
.step .filearea input[type=file]{ display:inline-block }
.step .meta{ display:block; color:#374151 }
.step .muted{ color:#9ca3af }
.connector{ position:absolute; top:46px; left:50%; right:-50%; height:8px; background:#e6e6e6; z-index:-1; border-radius:8px }
.connector.done{ background:linear-gradient(90deg,#059669,#0ea5a4) }
.btn-primary { text-decoration:none; display:inline-block }

.progress-header { display:flex; align-items:center; gap:12px; margin-bottom:10px }
.progress-track { flex:1; height:10px; background: rgba(255,255,255,0.04); border-radius:999px; position:relative; overflow:hidden }
.progress-fill { position:absolute; left:0; top:0; bottom:0; background: linear-gradient(90deg,var(--accent),var(--accent-2)); width:0 }
.progress-percent { width:56px; text-align:right; color:var(--muted); font-weight:700 }
.steps .meta { color:var(--muted); font-size:0.9rem }
.btn-secondary { background:transparent; color:var(--accent-2); border:1px solid rgba(255,255,255,0.06); padding:6px 8px; border-radius:8px }
.btn-primary { background:linear-gradient(90deg,var(--accent),#6b46ff); color:white; padding:6px 10px; border-radius:10px }

.avatar { width:72px; height:72px; border-radius:50%; overflow:hidden; background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); display:flex;align-items:center;justify-content:center }
.avatar img { width:100%; height:100%; object-fit:cover }
.avatar-initials { color:var(--surface-text); font-weight:700 }
</style>
