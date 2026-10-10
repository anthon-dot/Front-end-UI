<script setup>
const currentYear = new Date().getFullYear();
</script>

<template>
    <div class="layout-footer">
        <div class="flex items-center gap-2 text-sm text-slate-500">
            <span class="font-semibold text-slate-700">Public Market of Manticao</span>
            <span>•</span>
            <span>Rental Management System</span>
            <span>•</span>
            <span>&copy; {{ currentYear }}</span>
        </div>
    </div>
</template>
