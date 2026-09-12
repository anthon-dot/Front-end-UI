<template>
  <div v-if="isNavigating" class="global-route-loader">
    <div class="loader-progress"></div>
  </div>
  <router-view />
</template>

<script setup>
import { isNavigating } from './router'
</script>

<style>
body {
  margin: 0;
}

.global-route-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  z-index: 99999;
  background: rgba(16, 185, 129, 0.15);
  overflow: hidden;
  pointer-events: none;
}

.loader-progress {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  animation: indeterminate 1.4s infinite ease-in-out;
  transform-origin: 0% 50%;
}

@keyframes indeterminate {
  0% {
    transform: translateX(-100%) scaleX(0.2);
  }
  50% {
    transform: translateX(0%) scaleX(0.7);
  }
  100% {
    transform: translateX(100%) scaleX(0.2);
  }
}
</style>
