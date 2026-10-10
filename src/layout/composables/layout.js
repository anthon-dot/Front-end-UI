import { reactive, computed } from 'vue';

const layoutConfig = reactive({
    preset: 'Aura',
    primary: 'emerald',
    surface: null,
    darkTheme: false,
    menuMode: 'static'
});

const layoutState = reactive({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    profileSidebarVisible: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
    activeMenuItem: null
});

// Initialize dark theme from storage or system preference if available
if (typeof window !== 'undefined') {
    const savedDark = localStorage.getItem('sakai-dark-theme');
    if (savedDark === 'true') {
        layoutConfig.darkTheme = true;
        document.documentElement.classList.add('app-dark');
    } else if (savedDark === 'false') {
        layoutConfig.darkTheme = false;
        document.documentElement.classList.remove('app-dark');
    }
}

export function useLayout() {
    const setActiveMenuItem = (item) => {
        layoutState.activeMenuItem = typeof item === 'object' && item?.value !== undefined ? item.value : item;
    };

    const toggleDarkMode = () => {
        if (!document.startViewTransition) {
            executeDarkModeToggle();
        } else {
            document.startViewTransition(() => executeDarkModeToggle());
        }
    };

    const executeDarkModeToggle = () => {
        layoutConfig.darkTheme = !layoutConfig.darkTheme;
        if (layoutConfig.darkTheme) {
            document.documentElement.classList.add('app-dark');
            localStorage.setItem('sakai-dark-theme', 'true');
        } else {
            document.documentElement.classList.remove('app-dark');
            localStorage.setItem('sakai-dark-theme', 'false');
        }
    };

    const onMenuToggle = () => {
        if (layoutConfig.menuMode === 'overlay') {
            layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
        }

        if (window.innerWidth > 991) {
            layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive;
        } else {
            layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive;
        }
    };

    const toggleMenu = () => {
        onMenuToggle();
    };

    const resetMenu = () => {
        layoutState.overlayMenuActive = false;
        layoutState.staticMenuMobileActive = false;
        layoutState.menuHoverActive = false;
    };

    const isSidebarActive = computed(() => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive);
    const isDarkTheme = computed(() => layoutConfig.darkTheme);

    return {
        layoutConfig,
        layoutState,
        onMenuToggle,
        toggleMenu,
        isSidebarActive,
        isDarkTheme,
        setActiveMenuItem,
        toggleDarkMode,
        resetMenu
    };
}
