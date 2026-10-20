<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useLayout } from './composables/layout.js';
import { useAuthStore } from '../stores/auth';
import { supabase } from '../config/supabase';
import Notification from '../components/Notification.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { onMenuToggle, toggleDarkMode, isDarkTheme, isSidebarActive, layoutState } = useLayout();

const userMenuOpen = ref(false);
const notifications = ref([]);
const isScrolled = ref(false);

function onScroll() {
    isScrolled.value = window.scrollY > 4;
}

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

const portalHomeRoute = computed(() => {
    switch (userRole.value) {
        case 'ADMIN': return '/admin/dashboard';
        case 'MARKET_SUPERVISOR': return '/supervisor';
        case 'MAYOR': return '/mayor';
        case 'TREASURER': return '/treasurer';
        case 'BPLO':
        case 'BPLO_STAFF': return '/bplo';
        case 'ENDORSING_OFFICE': return '/endorsing';
        case 'COLLECTOR':
        case 'COLLECTOR_INSPECTOR': return '/collector';
        case 'VENDOR':
        case 'APPLICANT':
        case 'STAKEHOLDER': return '/stakeholder';
        default: return '/';
    }
});

const currentRouteMeta = computed(() => {
    const path = route.path;
    if (path.startsWith('/admin')) {
        const seg = path.replace('/admin', '').replace(/^\//, '') || 'Dashboard';
        return {
            portal: 'System Administrator',
            page: seg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Dashboard',
            icon: 'pi pi-cog'
        };
    }
    if (path.startsWith('/supervisor')) {
        const seg = path.replace('/supervisor', '').replace(/^\//, '') || 'Dashboard';
        return {
            portal: 'Market Supervisor',
            page: seg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Dashboard',
            icon: 'pi pi-shopping-bag'
        };
    }
    if (path.startsWith('/bplo')) {
        const seg = path.replace('/bplo', '').replace(/^\//, '') || 'Business Permit Review';
        return {
            portal: 'BPLO Office',
            page: seg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Business Permit Review',
            icon: 'pi pi-briefcase'
        };
    }
    if (path.startsWith('/endorsing')) {
        const seg = path.replace('/endorsing', '').replace(/^\//, '') || 'Application Endorsements';
        return {
            portal: 'Endorsing Office',
            page: seg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Application Endorsements',
            icon: 'pi pi-verified'
        };
    }
    if (path.startsWith('/mayor')) {
        const seg = path.replace('/mayor', '').replace(/^\//, '') || 'Dashboard';
        return {
            portal: 'Municipal Mayor',
            page: seg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Dashboard',
            icon: 'pi pi-crown'
        };
    }
    if (path.startsWith('/treasurer')) {
        const seg = path.replace('/treasurer', '').replace(/^\//, '') || 'Dashboard';
        return {
            portal: 'Municipal Treasurer',
            page: seg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Dashboard',
            icon: 'pi pi-wallet'
        };
    }
    if (path.startsWith('/collector') || path.startsWith('/inspector')) {
        const seg = path.replace('/collector', '').replace('/inspector', '').replace(/^\//, '') || 'Operations';
        return {
            portal: 'Field Collector & Inspector',
            page: seg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Operations',
            icon: 'pi pi-qrcode'
        };
    }
    if (path.startsWith('/stakeholder') || path === '/stalls' || path === '/requirements' || path === '/application-progress') {
        const seg = path.replace('/stakeholder', '').replace(/^\//, '') || (path === '/stalls' ? 'Stall List' : 'Dashboard');
        return {
            portal: 'Stakeholder',
            page: seg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Dashboard',
            icon: 'pi pi-user'
        };
    }
    return {
        portal: 'Manticao Market',
        page: (route.name || 'Dashboard').toString().replace(/([A-Z])/g, ' $1').trim(),
        icon: 'pi pi-th-large'
    };
});

async function loadNotifications() {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        if (!error && Array.isArray(data)) {
            notifications.value = data;
        }
    } catch (_) {
        notifications.value = [];
    }
}

async function markNotificationRead(id) {
    const item = notifications.value.find(n => n.id === id);
    if (item) item.read = true;
    try {
        await supabase.from('notifications').update({ read: true, is_read: true }).eq('id', id);
    } catch (_) {}
}

async function markAllNotificationsRead() {
    notifications.value.forEach(n => { n.read = true; });
    try {
        await supabase.from('notifications').update({ read: true, is_read: true });
    } catch (_) {}
}

function toggleUserMenu() {
    userMenuOpen.value = !userMenuOpen.value;
}

function closeUserMenu(e) {
    if (userMenuOpen.value && !e.target.closest('.user-menu-wrapper')) {
        userMenuOpen.value = false;
    }
}

function onKeydown(e) {
    if (e.key === 'Escape' && userMenuOpen.value) {
        userMenuOpen.value = false;
    }
}

onMounted(() => {
    window.addEventListener('click', closeUserMenu);
    window.addEventListener('keydown', onKeydown);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    loadNotifications();
});

onUnmounted(() => {
    window.removeEventListener('click', closeUserMenu);
    window.removeEventListener('keydown', onKeydown);
    window.removeEventListener('scroll', onScroll);
});

function handleLogout() {
    authStore.clearSession();
    router.push('/login');
}
</script>

<template>
    <div class="layout-topbar" :class="{ 'is-scrolled': isScrolled }">
        <div class="layout-topbar-logo-container">
            <button
                class="layout-menu-button layout-topbar-action"
                :class="{ 'menu-collapsed': layoutState.staticMenuDesktopInactive, 'menu-open': layoutState.staticMenuMobileActive }"
                type="button"
                @click="onMenuToggle"
                title="Toggle Sidebar Navigation"
                aria-label="Toggle Sidebar Navigation"
                :aria-expanded="layoutState.staticMenuMobileActive || !layoutState.staticMenuDesktopInactive"
            >
                <span class="hamburger" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </button>
            <router-link :to="portalHomeRoute" class="layout-topbar-logo" title="Go to Dashboard Home">
                <div class="topbar-logo-badge">
                    <i class="pi pi-building"></i>
                </div>
                <div class="topbar-brand-text">
                    <span class="brand-title">MANTICAO</span>
                    <span class="brand-subtitle">MARKET SYSTEM</span>
                </div>
            </router-link>

            <!-- Interactive Route Breadcrumb -->
            <div class="topbar-breadcrumb-wrap hidden lg:flex items-center gap-2">
                <span class="breadcrumb-sep">/</span>
                <span class="breadcrumb-portal-chip">
                    <i :class="currentRouteMeta.icon" class="text-xs mr-1"></i>
                    {{ currentRouteMeta.portal }}
                </span>
                <span class="breadcrumb-sep">/</span>
                <transition name="crumb" mode="out-in">
                    <span :key="currentRouteMeta.page" class="breadcrumb-page-name">{{ currentRouteMeta.page }}</span>
                </transition>
            </div>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button
                    type="button"
                    class="layout-topbar-action theme-toggle-btn"
                    @click="toggleDarkMode"
                    :title="isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
                    aria-label="Toggle Dark Mode"
                >
                    <i :class="['pi', isDarkTheme ? 'pi-sun' : 'pi-moon']"></i>
                </button>
            </div>

            <!-- Topbar Notification -->
            <Notification
                :notifications="notifications"
                @mark-read="markNotificationRead"
                @mark-all="markAllNotificationsRead"
            />

            <!-- User Menu -->
            <div class="user-menu-wrapper relative">
                <button
                    type="button"
                    class="layout-topbar-action user-profile-btn"
                    :class="{ active: userMenuOpen }"
                    @click="toggleUserMenu"
                    aria-label="User Account Menu"
                >
                    <div class="user-avatar-pill">
                        {{ userInitials }}
                    </div>
                    <span class="user-name-label hidden md:inline">{{ userName }}</span>
                    <i class="pi pi-angle-down text-xs hidden md:inline transition-transform duration-200" :class="{ 'rotate-180': userMenuOpen }"></i>
                </button>

                <transition name="fade-scale">
                    <div v-if="userMenuOpen" class="user-dropdown-panel" @click.stop>
                        <div class="dropdown-header">
                            <p class="font-bold text-slate-800 dark:text-slate-100 leading-tight">{{ userName }}</p>
                            <span class="role-badge">{{ userRole }}</span>
                        </div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-items">
                            <router-link
                                v-if="userRole === 'ADMIN' || userRole === 'MARKET_SUPERVISOR'"
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
                            <router-link
                                :to="portalHomeRoute"
                                class="dropdown-item"
                                @click="userMenuOpen = false"
                            >
                                <i class="pi pi-home"></i>
                                <span>Dashboard Home</span>
                            </router-link>
                            <div class="dropdown-divider"></div>
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
