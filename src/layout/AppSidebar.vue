<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useLayout } from './composables/layout.js';
import AppMenu from './AppMenu.vue';

const router = useRouter();
const authStore = useAuthStore();
const { layoutState, resetMenu } = useLayout();

const userName = computed(() => {
    return authStore.user?.username || authStore.user?.email || authStore.role || 'User';
});

const userRole = computed(() => {
    return authStore.normalizedRole || 'GUEST';
});

const displayRole = computed(() => {
    const r = userRole.value;
    if (r === 'SYSTEM_ADMIN' || r === 'ADMIN') return 'System Administrator';
    if (r === 'MARKET_SUPERVISOR' || r === 'SUPERVISOR') return 'Market Supervisor';
    if (r === 'MAYOR_OFFICE' || r === 'MAYOR') return "Mayor's Office";
    if (r === 'TREASURER') return 'Municipal Treasurer';
    if (r === 'STAKEHOLDER') return 'Stakeholder';
    return r;
});

const userInitials = computed(() => {
    const name = userName.value;
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
});

function handleLogout() {
    if (layoutState.staticMenuMobileActive) {
        resetMenu();
    }
    authStore.clearSession();
    router.push('/login');
}
</script>

<template>
    <aside class="layout-sidebar" aria-label="Sidebar Navigation">
        <!-- Scrollable Navigation Menu -->
        <div class="layout-sidebar-content">
            <app-menu></app-menu>
        </div>

        <!-- Pinned Bottom Nav Footer with Logout Button -->
        <div class="layout-sidebar-footer">
            <div class="sidebar-user-card">
                <div class="sidebar-user-avatar" :title="userRole">
                    {{ userInitials }}
                </div>
                <div class="sidebar-user-info">
                    <span class="sidebar-user-name" :title="userName">{{ userName }}</span>
                    <span class="sidebar-user-role">{{ displayRole }}</span>
                </div>
                <button
                    type="button"
                    class="sidebar-logout-btn"
                    @click="handleLogout"
                    title="Sign Out of System"
                    aria-label="Sign Out"
                >
                    <i class="pi pi-sign-out"></i>
                    <span class="logout-text">Logout</span>
                </button>
            </div>
        </div>
    </aside>
</template>
