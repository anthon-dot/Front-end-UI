<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLayout } from './composables/layout.js';
import { useAuthStore } from '../stores/auth';
import Notification from '../components/Notification.vue';

const router = useRouter();
const authStore = useAuthStore();
const { onMenuToggle, toggleDarkMode, isDarkTheme } = useLayout();

const userMenuOpen = ref(false);

const userName = computed(() => {
    return authStore.user?.username || authStore.user?.email || authStore.role || 'User';
});

const userRole = computed(() => {
    return authStore.normalizedRole || 'GUEST';
});

const userInitials = computed(() => {
    const name = userName.value;
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
});

function toggleUserMenu() {
    userMenuOpen.value = !userMenuOpen.value;
}

function closeUserMenu(e) {
    if (userMenuOpen.value && !e.target.closest('.user-menu-wrapper')) {
        userMenuOpen.value = false;
    }
}

onMounted(() => {
    window.addEventListener('click', closeUserMenu);
});

onUnmounted(() => {
    window.removeEventListener('click', closeUserMenu);
});

function handleLogout() {
    authStore.clearSession();
    router.push('/login');
}
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" type="button" @click="onMenuToggle" aria-label="Toggle Sidebar Navigation">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo">
                <div class="topbar-logo-badge">
                    <i class="pi pi-building"></i>
                </div>
                <div class="topbar-brand-text">
                    <span class="brand-title">MANTICAO</span>
                    <span class="brand-subtitle">MARKET SYSTEM</span>
                </div>
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button
                    type="button"
                    class="layout-topbar-action"
                    @click="toggleDarkMode"
                    :title="isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
                    aria-label="Toggle Dark Mode"
                >
                    <i :class="['pi', isDarkTheme ? 'pi-sun' : 'pi-moon']"></i>
                </button>
            </div>

            <!-- Topbar Notification -->
            <Notification :notifications="[]" />

            <!-- User Menu -->
            <div class="user-menu-wrapper relative">
                <button
                    type="button"
                    class="layout-topbar-action user-profile-btn"
                    @click="toggleUserMenu"
                    aria-label="User Account Menu"
                >
                    <div class="user-avatar-pill">
                        {{ userInitials }}
                    </div>
                    <span class="user-name-label hidden md:inline">{{ userName }}</span>
                    <i class="pi pi-angle-down text-xs hidden md:inline"></i>
                </button>

                <transition name="fade-scale">
                    <div v-if="userMenuOpen" class="user-dropdown-panel" @click.stop>
                        <div class="dropdown-header">
                            <p class="font-bold text-slate-800 leading-tight">{{ userName }}</p>
                            <span class="role-badge">{{ userRole }}</span>
                        </div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-items">
                            <router-link
                                v-if="userRole === 'ADMIN'"
                                to="/admin/profile"
                                class="dropdown-item"
                                @click="userMenuOpen = false"
                            >
                                <i class="pi pi-user"></i>
                                <span>Profile & Account</span>
                            </router-link>
                            <router-link
                                v-else-if="userRole === 'STAKEHOLDER'"
                                to="/stakeholder/settings"
                                class="dropdown-item"
                                @click="userMenuOpen = false"
                            >
                                <i class="pi pi-cog"></i>
                                <span>Settings</span>
                            </router-link>
                            <button type="button" class="dropdown-item logout" @click="handleLogout">
                                <i class="pi pi-sign-out"></i>
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </transition>
            </div>
        </div>
    </div>
</template>
