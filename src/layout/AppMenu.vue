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

    // 5. MUNICIPAL MAYOR DASHBOARD
    if (role === 'MAYOR') {
        return [
            {
                label: 'EXECUTIVE OVERSIGHT',
                items: [
                    { label: 'Executive Summary', icon: 'pi pi-fw pi-chart-line', to: '/mayor' },
                    { label: 'Pending Approvals', icon: 'pi pi-fw pi-file-edit', to: '/mayor/approvals' },
                    { label: 'Revocation Requests', icon: 'pi pi-fw pi-shield', to: '/mayor/revocations' },
                    { label: 'Reports', icon: 'pi pi-fw pi-chart-bar', to: '/stalls' }
                ]
            }
        ];
    }

    // 7. FIELD COLLECTOR MOBILE & WEB
    if (role === 'COLLECTOR_INSPECTOR' || role === 'COLLECTOR') {
        return [
            {
                label: 'FIELD OPERATIONS',
                items: [
                    { label: 'Collect', icon: 'pi pi-fw pi-wallet', to: '/collector' },
                    { label: 'My Collections', icon: 'pi pi-fw pi-list', to: '/collector' },
                    { label: 'Remit', icon: 'pi pi-fw pi-send', to: '/collector' },
                    { label: 'Vendor Lookup', icon: 'pi pi-fw pi-search', to: '/collector' },
                    { label: 'Profile', icon: 'pi pi-fw pi-user', to: '/collector' }
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

    // 4. MARKET SUPERVISOR DASHBOARD
    if (role === 'MARKET_SUPERVISOR' || role === 'SUPERVISOR') {
        return [
            {
                label: 'MARKET OPERATIONS',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/supervisor' },
                    { label: 'Stall Inventory', icon: 'pi pi-fw pi-map-marker', to: '/supervisor/stalls' },
                    { label: 'Application Review', icon: 'pi pi-fw pi-file-edit', to: '/supervisor' },
                    { label: 'Contract Management', icon: 'pi pi-fw pi-file', to: '/supervisor/contracts' },
                    { label: 'Occupancy Permits', icon: 'pi pi-fw pi-qrcode', to: '/supervisor/contracts' },
                    { label: 'Stall Inspections', icon: 'pi pi-fw pi-check-square', to: '/collector' },
                    { label: 'Delinquency Management', icon: 'pi pi-fw pi-exclamation-triangle', to: '/supervisor/reports' },
                    { label: 'Archives', icon: 'pi pi-fw pi-inbox', to: '/supervisor/archive' }
                ]
            }
        ];
    }

    // 8. SYSTEM ADMINISTRATOR DASHBOARD
    if (role === 'ADMIN') {
        return [
            {
                label: 'SYSTEM CONFIGURATION',
                items: [
                    { label: 'User Management', icon: 'pi pi-fw pi-users', to: '/admin/users' },
                    { label: 'Rate Configuration', icon: 'pi pi-fw pi-dollar', to: '/admin/rental-rates' },
                    { label: 'System Settings', icon: 'pi pi-fw pi-cog', to: '/admin/settings' },
                    { label: 'Audit Logs', icon: 'pi pi-fw pi-book', to: '/admin/audit-logs' },
                    { label: 'Database Maintenance', icon: 'pi pi-fw pi-database', to: '/admin/login-history' }
                ]
            },
            {
                label: 'MODULE OVERVIEW',
                items: [
                    { label: 'Admin Analytics', icon: 'pi pi-fw pi-chart-line', to: '/admin/dashboard' },
                    { label: 'Supervisor View', icon: 'pi pi-fw pi-building', to: '/supervisor' },
                    { label: 'BPLO Portal', icon: 'pi pi-fw pi-briefcase', to: '/bplo' },
                    { label: 'Endorsing Office', icon: 'pi pi-fw pi-check-circle', to: '/endorsing' },
                    { label: 'Stall Map Registry', icon: 'pi pi-fw pi-map-marker', to: '/admin/stalls' }
                ]
            }
        ];
    }

    // 6. BPLO DASHBOARD
    if (role === 'BPLO' || role === 'BPLO_STAFF') {
        return [
            {
                label: 'BPLO REGULATORY COMPLIANCE',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-briefcase', to: '/bplo' },
                    { label: 'Business Permit Assessment', icon: 'pi pi-fw pi-calculator', to: '/bplo' },
                    { label: 'Release Permits', icon: 'pi pi-fw pi-check-circle', to: '/bplo' },
                    { label: 'Returned Applications', icon: 'pi pi-fw pi-replay', to: '/bplo' },
                    { label: 'Market Stalls Map', icon: 'pi pi-fw pi-map-marker', to: '/stalls' }
                ]
            }
        ];
    }

    // 6. ENDORSING OFFICE DASHBOARD
    if (role === 'ENDORSING_OFFICE') {
        return [
            {
                label: 'ENDORSING OFFICE REVIEW',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/endorsing' },
                    { label: 'Endorsement Queue', icon: 'pi pi-fw pi-file-edit', to: '/endorsing' },
                    { label: 'Returned Applications', icon: 'pi pi-fw pi-replay', to: '/endorsing' },
                    { label: 'Market Stalls Map', icon: 'pi pi-fw pi-map-marker', to: '/stalls' }
                ]
            }
        ];
    }

    // 3. TREASURER / REVENUE STAFF DASHBOARD
    if (role === 'TREASURER') {
        return [
            {
                label: 'TREASURY REVENUE OPERATIONS',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/treasurer' },
                    { label: 'Vendor Search', icon: 'pi pi-fw pi-search', to: '/treasurer' },
                    { label: 'Record Payment', icon: 'pi pi-fw pi-credit-card', to: '/treasurer/payment' },
                    { label: 'Initial Fees', icon: 'pi pi-fw pi-check-circle', to: '/treasurer/applicant' },
                    { label: 'Daily Remittance', icon: 'pi pi-fw pi-send', to: '/treasurer/billing' }
                ]
            },
            {
                label: 'FINANCIAL REPORTING & AUDIT',
                items: [
                    { label: 'Reports', icon: 'pi pi-fw pi-chart-line', to: '/treasurer/report' },
                    { label: 'Audit Trail', icon: 'pi pi-fw pi-book', to: '/audit-logs' }
                ]
            }
        ];
    }

    // 2. VENDOR / STAKEHOLDER PORTAL
    return [
        {
            label: 'VENDOR PORTAL',
            items: [
                { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/stakeholder' },
                { label: 'Application Status', icon: 'pi pi-fw pi-hourglass', to: '/application-progress' },
                { label: 'Upload Documents', icon: 'pi pi-fw pi-upload', to: '/requirements' },
                { label: 'My Stall & Contract', icon: 'pi pi-fw pi-file-edit', to: '/stakeholder' },
                { label: 'Billing & Payments', icon: 'pi pi-fw pi-wallet', to: '/stakeholder/payments' },
                { label: 'Notifications', icon: 'pi pi-fw pi-bell', to: '/application-progress' },
                { label: 'Account Settings', icon: 'pi pi-fw pi-cog', to: '/stakeholder/settings' }
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
