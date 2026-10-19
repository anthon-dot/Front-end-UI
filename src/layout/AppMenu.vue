<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useLayout } from './composables/layout.js';
import AppMenuItem from './AppMenuItem.vue';

const authStore = useAuthStore();
const route = useRoute();
const { layoutState } = useLayout();

const baseModel = computed(() => {
    const role = authStore.normalizedRole;

    if (role === 'MARKET_SUPERVISOR' || role === 'ADMIN') {
        return [
            {
                label: 'OVERVIEW',
                items: [
                    { label: 'Supervisor Dashboard', icon: 'pi pi-fw pi-home', to: '/supervisor' },
                    { label: 'Admin Analytics', icon: 'pi pi-fw pi-chart-line', to: '/admin/dashboard' }
                ]
            },
            {
                label: 'OPERATIONS & STALLS',
                items: [
                    { label: 'Stall Management', icon: 'pi pi-fw pi-th-large', to: '/supervisor/stalls' },
                    { label: 'Stall Map', icon: 'pi pi-fw pi-map', to: '/admin/stall-map' },
                    { label: 'Master Stalls', icon: 'pi pi-fw pi-building', to: '/admin/stalls' },
                    { label: 'Stall Types', icon: 'pi pi-fw pi-tags', to: '/admin/stall-types' },
                    { label: 'Rental Rates', icon: 'pi pi-fw pi-dollar', to: '/admin/rental-rates' },
                    { label: 'Contracts', icon: 'pi pi-fw pi-file-edit', to: '/supervisor/contracts' },
                    { label: 'Archive Records', icon: 'pi pi-fw pi-inbox', to: '/supervisor/archive' }
                ]
            },
            {
                label: 'MONITORING & FINANCIALS',
                items: [
                    { label: 'Applications', icon: 'pi pi-fw pi-file-edit', to: '/admin/applications' },
                    { label: 'Stakeholders', icon: 'pi pi-fw pi-id-card', to: '/admin/stakeholders' },
                    { label: 'Contracts Registry', icon: 'pi pi-fw pi-file', to: '/admin/contracts' },
                    { label: 'Occupancy', icon: 'pi pi-fw pi-chart-pie', to: '/admin/occupancy' },
                    { label: 'Payments', icon: 'pi pi-fw pi-wallet', to: '/admin/payments' },
                    { label: 'Billing', icon: 'pi pi-fw pi-receipt', to: '/admin/billing' }
                ]
            },
            {
                label: 'USER MANAGEMENT',
                items: [
                    { label: 'Users', icon: 'pi pi-fw pi-users', to: '/admin/users' },
                    { label: 'Roles & Permissions', icon: 'pi pi-fw pi-shield', to: '/admin/roles' },
                    { label: 'Login History', icon: 'pi pi-fw pi-history', to: '/admin/login-history' }
                ]
            },
            {
                label: 'REPORTS & SECURITY',
                items: [
                    { label: 'Supervisor Reports', icon: 'pi pi-fw pi-chart-bar', to: '/supervisor/reports' },
                    { label: 'Revenue Report', icon: 'pi pi-fw pi-chart-line', to: '/admin/reports/revenue' },
                    { label: 'Applications Report', icon: 'pi pi-fw pi-chart-bar', to: '/admin/reports/applications' },
                    { label: 'Occupancy Report', icon: 'pi pi-fw pi-percentage', to: '/admin/reports/occupancy' },
                    { label: 'System Activity', icon: 'pi pi-fw pi-list-check', to: '/admin/reports/system-activity' },
                    { label: 'Audit Logs', icon: 'pi pi-fw pi-book', to: '/admin/audit-logs' },
                    { label: 'Notifications', icon: 'pi pi-fw pi-bell', to: '/admin/notifications' },
                    { label: 'System Settings', icon: 'pi pi-fw pi-cog', to: '/admin/settings' }
                ]
            }
        ];
    }

    if (role === 'TREASURER') {
        return [
            {
                label: 'OVERVIEW',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/treasurer' }
                ]
            },
            {
                label: 'MANAGEMENT',
                items: [
                    { label: 'Applicants', icon: 'pi pi-fw pi-users', to: '/treasurer/applicant' },
                    { label: 'Billing', icon: 'pi pi-fw pi-file-edit', to: '/treasurer/billing' },
                    { label: 'Payment Records', icon: 'pi pi-fw pi-wallet', to: '/treasurer/payment' }
                ]
            },
            {
                label: 'ANALYTICS & REPORTS',
                items: [
                    { label: 'Revenue Reports', icon: 'pi pi-fw pi-chart-line', to: '/treasurer/report' },
                    { label: 'AI Analytics', icon: 'pi pi-fw pi-sparkles', to: '/treasurer/ai-reports' },
                    { label: 'AI Notifications', icon: 'pi pi-fw pi-bell', to: '/treasurer/ai-notifications' },
                    { label: 'Audit Logs', icon: 'pi pi-fw pi-book', to: '/audit-logs' }
                ]
            }
        ];
    }

    if (role === 'BPLO_OFFICE') {
        return [
            {
                label: 'OVERVIEW',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/bplo' },
                    { label: 'Approvals', icon: 'pi pi-fw pi-check-circle', to: '/bplo/approvals' }
                ]
            }
        ];
    }

    if (role === 'ENDORSING_OFFICE') {
        return [
            {
                label: 'OVERVIEW',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/endorsing' },
                    { label: 'Approvals', icon: 'pi pi-fw pi-check-circle', to: '/endorsing/approvals' }
                ]
            }
        ];
    }

    // STAKEHOLDER / TENANT
    return [
        {
            label: 'MY PORTAL',
            items: [
                { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/stakeholder' },
                { label: 'Payment History', icon: 'pi pi-fw pi-wallet', to: '/stakeholder/payments' },
                { label: 'Market Stalls', icon: 'pi pi-fw pi-shop', to: '/stalls' },
                { label: 'Settings & Profile', icon: 'pi pi-fw pi-cog', to: '/stakeholder/settings' }
            ]
        },
        {
            label: 'APPLICATION',
            items: [
                { label: 'Application Progress', icon: 'pi pi-fw pi-hourglass', to: '/application-progress' },
                { label: 'Requirements', icon: 'pi pi-fw pi-file-check', to: '/requirements' }
            ]
        }
    ];
});

// Attach a running order to every entry so the CSS entrance animation can stagger.
const model = computed(() => {
    let order = 0;
    return baseModel.value.map((section) => ({
        ...section,
        _order: order++,
        items: section.items?.map((item) => ({ ...item, _order: order++ }))
    }));
});

// Pick the single most specific matching route, so "/treasurer" (Dashboard)
// is not highlighted together with "/treasurer/billing".
const activeMenuPath = computed(() => {
    const path = route.path;
    let best = null;
    const visit = (items = []) => {
        items.forEach((item) => {
            if (item.to && (path === item.to || (item.to !== '/' && path.startsWith(item.to + '/')))) {
                if (!best || item.to.length > best.length) best = item.to;
            }
            if (item.items) visit(item.items);
        });
    };
    visit(model.value);
    return best;
});

provide('activeMenuPath', activeMenuPath);

/* ---------- Sliding active indicator ---------- */
const menuRef = ref(null);
const indicatorRef = ref(null);
const indicatorReady = ref(false);
const indicator = reactive({ top: 0, height: 0, visible: false });
let resizeObserver = null;

function measureIndicator() {
    const menu = menuRef.value;
    if (!menu) return;
    const active = menu.querySelector('a.active-route');
    if (!active || !active.offsetHeight) {
        indicator.visible = false;
        return;
    }
    const menuRect = menu.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const nextTop = activeRect.top - menuRect.top;
    const moved = indicator.visible && Math.abs(nextTop - indicator.top) > 1;
    indicator.top = nextTop;
    indicator.height = activeRect.height;
    indicator.visible = true;
    if (moved && indicatorReady.value) replaySquash();
}

function replaySquash() {
    const el = indicatorRef.value;
    if (!el) return;
    el.classList.remove('is-moving');
    void el.offsetWidth; // restart the CSS animation
    el.classList.add('is-moving');
}

function scheduleMeasure() {
    nextTick(() => requestAnimationFrame(measureIndicator));
}

watch(() => route.path, scheduleMeasure);
watch(model, scheduleMeasure);
watch(
    () => layoutState.staticMenuMobileActive,
    (isOpen) => {
        if (isOpen) {
            scheduleMeasure();
            setTimeout(measureIndicator, 320);
        }
    }
);

onMounted(() => {
    nextTick(() => {
        measureIndicator();
        // Enable transitions only after the first placement (no fly-in from top).
        requestAnimationFrame(() => requestAnimationFrame(() => (indicatorReady.value = true)));
    });
    if (typeof ResizeObserver !== 'undefined' && menuRef.value) {
        resizeObserver = new ResizeObserver(() => measureIndicator());
        resizeObserver.observe(menuRef.value);
    }
});

onBeforeUnmount(() => {
    resizeObserver?.disconnect();
});
</script>

<template>
    <ul ref="menuRef" class="layout-menu" :class="{ 'has-indicator': indicator.visible }">
        <li
            ref="indicatorRef"
            class="layout-menu-indicator"
            :class="{ 'is-visible': indicator.visible, 'no-anim': !indicatorReady }"
            :style="{ transform: `translateY(${indicator.top}px)`, height: `${indicator.height}px` }"
            aria-hidden="true"
        ></li>
        <template v-for="(item, i) in model" :key="item.label || i">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>
