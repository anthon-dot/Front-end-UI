<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import AppMenuItem from './AppMenuItem.vue';

const authStore = useAuthStore();

const model = computed(() => {
    const role = authStore.normalizedRole;

    if (role === 'ADMIN') {
        return [
            {
                label: 'OVERVIEW',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/admin/dashboard' }
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
                label: 'STALL & OPERATIONS',
                items: [
                    { label: 'Stall Map', icon: 'pi pi-fw pi-map', to: '/admin/stall-map' },
                    { label: 'Stalls', icon: 'pi pi-fw pi-th-large', to: '/admin/stalls' },
                    { label: 'Stall Types', icon: 'pi pi-fw pi-tags', to: '/admin/stall-types' },
                    { label: 'Rental Rates', icon: 'pi pi-fw pi-dollar', to: '/admin/rental-rates' },
                    { label: 'Applications', icon: 'pi pi-fw pi-file-edit', to: '/admin/applications' },
                    { label: 'Stakeholders', icon: 'pi pi-fw pi-id-card', to: '/admin/stakeholders' },
                    { label: 'Contracts', icon: 'pi pi-fw pi-file', to: '/admin/contracts' },
                    { label: 'Occupancy', icon: 'pi pi-fw pi-chart-pie', to: '/admin/occupancy' }
                ]
            },
            {
                label: 'FINANCIALS',
                items: [
                    { label: 'Payments', icon: 'pi pi-fw pi-wallet', to: '/admin/payments' },
                    { label: 'Billing', icon: 'pi pi-fw pi-receipt', to: '/admin/billing' }
                ]
            },
            {
                label: 'REPORTS & AUDIT',
                items: [
                    { label: 'Revenue Report', icon: 'pi pi-fw pi-chart-line', to: '/admin/reports/revenue' },
                    { label: 'Applications Report', icon: 'pi pi-fw pi-chart-bar', to: '/admin/reports/applications' },
                    { label: 'Occupancy Report', icon: 'pi pi-fw pi-percentage', to: '/admin/reports/occupancy' },
                    { label: 'System Activity', icon: 'pi pi-fw pi-list-check', to: '/admin/reports/system-activity' },
                    { label: 'Audit Logs', icon: 'pi pi-fw pi-book', to: '/admin/audit-logs' },
                    { label: 'Notifications', icon: 'pi pi-fw pi-bell', to: '/admin/notifications' }
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

    if (role === 'MARKET_SUPERVISOR') {
        return [
            {
                label: 'OVERVIEW',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/supervisor' }
                ]
            },
            {
                label: 'OPERATIONS',
                items: [
                    { label: 'Stall Management', icon: 'pi pi-fw pi-th-large', to: '/supervisor/stalls' },
                    { label: 'Contracts', icon: 'pi pi-fw pi-file-edit', to: '/supervisor/contracts' },
                    { label: 'Archive', icon: 'pi pi-fw pi-inbox', to: '/supervisor/archive' },
                    { label: 'Reports', icon: 'pi pi-fw pi-chart-bar', to: '/supervisor/reports' }
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
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item.label || i">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>
