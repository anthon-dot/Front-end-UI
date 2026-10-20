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

    if (role === 'MAYOR') {
        return [
            {
                label: 'EXECUTIVE OFFICE',
                items: [
                    { label: 'Mayor Dashboard', icon: 'pi pi-fw pi-home', to: '/mayor' },
                    { label: 'LOI Approvals', icon: 'pi pi-fw pi-file-edit', to: '/mayor/approvals' },
                    { label: 'Lease Revocations', icon: 'pi pi-fw pi-shield', to: '/mayor/revocations' },
                    { label: 'Market Stalls', icon: 'pi pi-fw pi-map-marker', to: '/stalls' }
                ]
            }
        ];
    }

    if (role === 'COLLECTOR_INSPECTOR') {
        return [
            {
                label: 'FIELD OPERATIONS',
                items: [
                    { label: 'Field Dashboard', icon: 'pi pi-fw pi-home', to: '/collector' },
                    { label: 'Daily Collections', icon: 'pi pi-fw pi-wallet', to: '/collector' },
                    { label: 'Treasury Remittances', icon: 'pi pi-fw pi-send', to: '/collector' }
                ]
            },
            {
                label: 'INSPECTIONS & SAFETY',
                items: [
                    { label: 'Stall Setup Inspections', icon: 'pi pi-fw pi-check-square', to: '/collector' },
                    { label: 'QR Permit Scanner', icon: 'pi pi-fw pi-qrcode', to: '/collector' },
                    { label: 'Market Stalls Map', icon: 'pi pi-fw pi-map-marker', to: '/stalls' }
                ]
            }
        ];
    }

    if (role === 'MARKET_SUPERVISOR') {
        return [
            {
                label: 'OVERVIEW',
                items: [
                    { label: 'Supervisor Dashboard', icon: 'pi pi-fw pi-home', to: '/supervisor' }
                ]
            },
            {
                label: 'OPERATIONS & STALLS',
                items: [
                    { label: 'Stall Management', icon: 'pi pi-fw pi-map-marker', to: '/supervisor/stalls' },
                    { label: 'Contracts of Lease', icon: 'pi pi-fw pi-file-edit', to: '/supervisor/contracts' },
                    { label: 'Archive Records', icon: 'pi pi-fw pi-inbox', to: '/supervisor/archive' }
                ]
            },
            {
                label: 'REPORTS & MONITORING',
                items: [
                    { label: 'Supervisor Reports', icon: 'pi pi-fw pi-chart-bar', to: '/supervisor/reports' },
                    { label: 'Occupancy Overview', icon: 'pi pi-fw pi-chart-pie', to: '/admin/occupancy' }
                ]
            }
        ];
    }

    if (role === 'ADMIN') {
        return [
            {
                label: 'OVERVIEW',
                items: [
                    { label: 'Admin Analytics', icon: 'pi pi-fw pi-chart-line', to: '/admin/dashboard' },
                    { label: 'Supervisor Dashboard', icon: 'pi pi-fw pi-home', to: '/supervisor' }
                ]
            },
            {
                label: 'CONFIG & FORMULAS',
                items: [
                    { label: 'Rental Rates', icon: 'pi pi-fw pi-dollar', to: '/admin/rental-rates' },
                    { label: 'Master Stalls', icon: 'pi pi-fw pi-building', to: '/admin/stalls' },
                    { label: 'Stall Types', icon: 'pi pi-fw pi-tags', to: '/admin/stall-types' },
                    { label: 'Contracts Registry', icon: 'pi pi-fw pi-file', to: '/admin/contracts' },
                    { label: 'Billing & Payments', icon: 'pi pi-fw pi-wallet', to: '/admin/payments' }
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
                label: 'SECURITY & SETTINGS',
                items: [
                    { label: 'BPLO Portal', icon: 'pi pi-fw pi-briefcase', to: '/bplo' },
                    { label: 'Endorsing Office', icon: 'pi pi-fw pi-check-circle', to: '/endorsing' },
                    { label: 'Audit Logs', icon: 'pi pi-fw pi-book', to: '/admin/audit-logs' },
                    { label: 'System Settings', icon: 'pi pi-fw pi-cog', to: '/admin/settings' }
                ]
            }
        ];
    }

    if (role === 'BPLO' || role === 'BPLO_STAFF') {
        return [
            {
                label: 'BPLO OPERATIONS',
                items: [
                    { label: 'BPLO Dashboard', icon: 'pi pi-fw pi-briefcase', to: '/bplo' },
                    { label: 'Business Permit Review', icon: 'pi pi-fw pi-file-edit', to: '/bplo' },
                    { label: 'Market Stalls Map', icon: 'pi pi-fw pi-map-marker', to: '/stalls' }
                ]
            }
        ];
    }

    if (role === 'ENDORSING_OFFICE') {
        return [
            {
                label: 'ENDORSING OFFICE',
                items: [
                    { label: 'Endorsement Dashboard', icon: 'pi pi-fw pi-check-circle', to: '/endorsing' },
                    { label: 'Application Endorsements', icon: 'pi pi-fw pi-file-edit', to: '/endorsing' },
                    { label: 'Market Stalls Map', icon: 'pi pi-fw pi-map-marker', to: '/stalls' }
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

    // STAKEHOLDER (APPLICANT / ACTIVE VENDOR)
    return [
        {
            label: 'MY PORTAL',
            items: [
                { label: 'Tenancy Dashboard', icon: 'pi pi-fw pi-home', to: '/stakeholder' },
                { label: 'Payment History', icon: 'pi pi-fw pi-wallet', to: '/stakeholder/payments' },
                { label: 'Market Stalls', icon: 'pi pi-fw pi-shop', to: '/stalls' },
                { label: 'Settings & Profile', icon: 'pi pi-fw pi-cog', to: '/stakeholder/settings' }
            ]
        },
        {
            label: 'APPLICATION',
            items: [
                { label: 'Application Progress', icon: 'pi pi-fw pi-hourglass', to: '/application-progress' },
                { label: 'Initial Fee Payment', icon: 'pi pi-fw pi-dollar', to: '/applicant-fee' },
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
