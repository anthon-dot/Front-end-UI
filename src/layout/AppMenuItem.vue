<script setup>
import { useLayout } from './composables/layout.js';
import { inject, onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const { layoutState, setActiveMenuItem, toggleMenu } = useLayout();

// Best-match active path resolved once in AppMenu (null when used standalone)
const activeMenuPath = inject('activeMenuPath', null);

const props = defineProps({
    item: {
        type: Object,
        default: () => ({})
    },
    index: {
        type: Number,
        default: 0
    },
    root: {
        type: Boolean,
        default: true
    },
    parentItemKey: {
        type: String,
        default: null
    }
});

const isActiveMenu = ref(false);
const itemKey = ref(null);

onBeforeMount(() => {
    itemKey.value = props.parentItemKey ? props.parentItemKey + '-' + props.index : String(props.index);

    const activeItem = layoutState.activeMenuItem;

    isActiveMenu.value = activeItem === itemKey.value || Boolean(activeItem && typeof activeItem === 'string' && activeItem.startsWith(itemKey.value + '-'));
});

watch(
    () => layoutState.activeMenuItem,
    (newVal) => {
        isActiveMenu.value = newVal === itemKey.value || Boolean(newVal && typeof newVal === 'string' && newVal.startsWith(itemKey.value + '-'));
    }
);

function spawnRipple(event) {
    const target = event.currentTarget;
    if (!target || typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    // On touch/mobile, fall back to center if clientX is missing or 0
    const hasClientCoords = event.clientX != null && event.clientX > 0;
    const clientX = hasClientCoords ? event.clientX : (rect.left + rect.width / 2);
    const clientY = hasClientCoords ? event.clientY : (rect.top + rect.height / 2);

    const ripple = document.createElement('span');
    ripple.className = 'menu-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${clientX - rect.left - size / 2}px`;
    ripple.style.top = `${clientY - rect.top - size / 2}px`;
    target.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

function itemClick(event, item) {
    if (item.disabled) {
        event.preventDefault();
        return;
    }

    spawnRipple(event);

    if ((item.to || item.url) && (layoutState.staticMenuMobileActive || layoutState.overlayMenuActive)) {
        setTimeout(() => {
            toggleMenu();
        }, 130);
    }

    if (item.command) {
        item.command({ originalEvent: event, item: item });
    }

    const foundItemKey = item.items ? (isActiveMenu.value ? props.parentItemKey : itemKey) : itemKey.value;

    setActiveMenuItem(foundItemKey);
}

function checkActiveRoute(item) {
    if (!item?.to) return false;
    if (activeMenuPath) return activeMenuPath.value === item.to;
    if (route.path === item.to) return true;
    if (item.to !== '/' && route.path.startsWith(item.to + '/')) return true;
    return false;
}
</script>

<template>
    <li :class="{ 'layout-root-menuitem': root, 'active-menuitem': isActiveMenu }" :style="{ '--i': item._order ?? index }">
        <div v-if="root && item.visible !== false" class="layout-menuitem-root-text">{{ item.label }}</div>
        <a v-if="(!item.to || item.items) && item.visible !== false" :href="item.url" @click="itemClick($event, item, index)" :class="item.class" :target="item.target" tabindex="0">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </a>
        <router-link v-if="item.to && !item.items && item.visible !== false" @click="itemClick($event, item, index)" :class="[item.class, { 'active-route': checkActiveRoute(item) }]" :aria-current="checkActiveRoute(item) ? 'page' : undefined" :title="item.label" tabindex="0" :to="item.to">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </router-link>
        <Transition v-if="item.items && item.visible !== false" name="layout-submenu">
            <ul v-show="root ? true : isActiveMenu" class="layout-submenu">
                <app-menu-item v-for="(child, i) in item.items" :key="child" :index="i" :item="child" :parentItemKey="itemKey" :root="false"></app-menu-item>
            </ul>
        </Transition>
    </li>
</template>


