<template>
	<aside class="treasurer-sidebar" :class="{ collapsed }" aria-label="Endorsing sidebar">
		<div class="sidebar-inner">
			<div class="sidebar-top">
				<button
					class="toggle-btn"
					@click="toggle"
					:aria-expanded="!collapsed"
					:aria-label="collapsed ? 'Open menu' : 'Close menu'"
				>
					<svg v-if="collapsed" width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
						<rect y="1" width="20" height="2" rx="1" fill="currentColor" />
						<rect y="6" width="20" height="2" rx="1" fill="currentColor" />
						<rect y="11" width="20" height="2" rx="1" fill="currentColor" />
					</svg>
					<svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
						<path d="M3 3L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						<path d="M15 3L3 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
					</svg>
				</button>

				<div class="brand">
					<span class="title" v-if="!collapsed">Market Supervisor Dashboard</span>
				</div>
			</div>

			<nav class="sidebar-nav" aria-label="Market Supervisor menu">
						<ul>
							<li v-for="item in items" :key="item.id" :class="{ 'is-active': isActive(item) }">
								<button class="menu-btn" @click="onClick(item)">
									<span class="label" v-if="!collapsed">{{ item.label }}</span>
									<span class="icon-short" v-else aria-hidden="true"></span>
								</button>
							</li>
						</ul>
					</nav>
		</div>
	</aside>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineProps } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const props = defineProps({ forceOpen: { type: Boolean, default: false } })

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const items = [
	{ id: 'dashboard', label: 'Dashboard', to: '/endorsing', routeName: 'Endorsing' },
	{ id: 'applications', label: 'Applications', routeName: 'Endorsing' },
	{ id: 'logout', label: 'Log out' }
]

const collapsed = ref(false)
const showProfileMenu = ref(false)
const profilePop = ref(null)

function toggle() {
	collapsed.value = !collapsed.value
	try { localStorage.setItem('endorsingMenuCollapsed', String(collapsed.value)) } catch (e) {}
	try {
		const app = document.getElementById('app')
		if (app) app.style.setProperty('--sidebar-width', collapsed.value ? '64px' : '220px')
	} catch (e) {}
}

function onClick(item) {
	if (item && item.id === 'logout') {
		logout()
		return
	}
		if (item.routeName) {
			router.push({ name: item.routeName }).catch(() => {})
			return
		}
		if (item.to) {
			router.push(item.to).catch(() => {})
			return
	}
	// fallback
	alert(`${item.label} clicked — not yet implemented`)
}

function isActive(item) {
	try {
		if (item.routeName && route.name) return String(route.name) === String(item.routeName)
		if (item.to && route.path) return String(route.path).startsWith(String(item.to))
	} catch (e) {}
	return false
}

function toggleProfile() {
	showProfileMenu.value = !showProfileMenu.value
}

function logout() {
	authStore.clearSession()
	showProfileMenu.value = false
	router.push({ name: 'Landing' }).catch(() => {})
}

function onDocumentClick(e) {
	const pop = profilePop.value
	if (!pop) return
	if (pop.contains(e.target)) return
	showProfileMenu.value = false
}

function addClickAway() { document.addEventListener('click', onDocumentClick) }
function removeClickAway() { document.removeEventListener('click', onDocumentClick) }

onMounted(() => {
	try {
		const stored = localStorage.getItem('endorsingMenuCollapsed')
		if (props.forceOpen) {
			collapsed.value = false
		} else if (stored !== null) {
			collapsed.value = stored === 'true'
		}
	} catch (e) {}
	addClickAway()
	try {
		const app = document.getElementById('app')
		if (app) {
			app.classList.add('sidebar-open')
			app.style.setProperty('--sidebar-width', collapsed.value ? '64px' : '220px')
		}
	} catch (e) {}
})

onUnmounted(() => {
	try {
		const app = document.getElementById('app')
		if (app) {
			app.classList.remove('sidebar-open')
			app.style.removeProperty('--sidebar-width')
		}
	} catch (e) {}
	removeClickAway()
})
</script>

<style scoped>
.treasurer-sidebar {
	position: fixed;
	left: 0;
	top: 0;
	bottom: 0;
	width: var(--sidebar-width, 220px);
	background: #ffffff;
	color: #222;
	z-index: 2200;
	border-right: 1px solid #e6eaf0;
	transition: width .18s ease, background .12s ease;
	display: flex;
	box-sizing: border-box;
}
.treasurer-sidebar.collapsed { width: 64px }
.treasurer-sidebar { min-width: 64px }

.sidebar-inner {
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: flex-start; /* stick to top */
	height: 100%;
	padding: 4px 6px; /* reduced padding */
}

.sidebar-top {
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 8px;
	padding: 6px 6px; /* reduced top/bottom padding */
}

.brand { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #213; padding-left: 4px }
.brand .title { font-size: 17px }

.toggle-btn {
	background: transparent;
	color: #444;
	border: 1px solid transparent;
	padding: 6px;
	border-radius: 8px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}
.toggle-btn svg { color: #333 }

.sidebar-nav { padding: 4px 6px; overflow: auto }
.sidebar-nav ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px }
.menu-btn { 
	background: transparent; color: #0f172a; border: none; text-align: left; 
	padding: 10px 12px; border-radius: 8px; cursor: pointer; font-weight: 600; 
	display: flex; align-items: center; gap: 10px 
}
.menu-btn:hover { background: rgba(16,24,40,0.04) }

.is-active .menu-btn { background: rgba(16,24,40,0.06); box-shadow: inset 0 0 0 1px rgba(16,24,40,0.02); }

.treasurer-sidebar.collapsed .brand .title { display: none }
.treasurer-sidebar.collapsed .sidebar-nav { display: none }
.treasurer-sidebar.collapsed .sidebar-top { justify-content: center }
.treasurer-sidebar.collapsed .toggle-btn { background:#fff; border-radius:10px; box-shadow:0 2px 6px rgba(2,6,23,0.08); padding:10px }

@media (max-width:900px) {
	.treasurer-sidebar { position: fixed; z-index:1500 }
}
</style>


