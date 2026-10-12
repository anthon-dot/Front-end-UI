<script setup>
import { ref } from 'vue';

const currentYear = new Date().getFullYear();
const isScrolling = ref(false);

function scrollToTop() {
    isScrolling.value = true;
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    setTimeout(() => {
        isScrolling.value = false;
    }, 600);
}
</script>

<template>
    <footer class="layout-footer" aria-label="Portal Footer">
        <div class="footer-container">
            <!-- Left Brand & Status -->
            <div class="footer-brand-section">
                <div class="footer-brand-row">
                    <div class="footer-mini-logo" aria-hidden="true">
                        <i class="pi pi-building"></i>
                    </div>
                    <div class="footer-brand-text">
                        <span class="footer-title">Public Market of Manticao</span>
                        <span class="footer-subtitle">Rental & Stall Management System</span>
                    </div>
                </div>

                <div class="footer-meta-row">
                    <span class="footer-status-pill" title="System operational and responsive">
                        <span class="footer-status-dot"></span>
                        System Operational
                    </span>
                    <span class="footer-sep hidden sm:inline">•</span>
                    <span class="footer-copyright">&copy; {{ currentYear }} Municipality of Manticao</span>
                </div>
            </div>

            <!-- Right Interactive Actions -->
            <div class="footer-actions-section">
                <button
                    type="button"
                    class="footer-back-to-top"
                    :class="{ 'is-scrolling': isScrolling }"
                    @click="scrollToTop"
                    aria-label="Back to top of page"
                    title="Scroll to top of page"
                >
                    <i class="pi pi-arrow-up"></i>
                    <span>Back to Top</span>
                </button>
            </div>
        </div>
    </footer>
</template>
