<script setup>
import { computed, watch, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useLayout } from './composables/layout.js';
import AppTopbar from './AppTopbar.vue';
import AppSidebar from './AppSidebar.vue';
import AppFooter from './AppFooter.vue';

const { layoutConfig, layoutState, resetMenu } = useLayout();
const route = useRoute();

const containerClass = computed(() => {
    return {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive
    };
});

function onMaskClick() {
    resetMenu();
}

watch(
    () => route.path,
    () => {
        resetMenu();
    }
);
</script>

<template>
    <div class="layout-wrapper" :class="containerClass">
        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">
            <div class="layout-main">
                <router-view></router-view>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask" @click="onMaskClick"></div>
    </div>
</template>
