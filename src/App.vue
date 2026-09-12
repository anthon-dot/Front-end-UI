<template>
  <Toast position="top-right" />
  <ConfirmDialog pt:root:class="confirm-modal-root" pt:mask:class="confirm-modal-mask">
    <template #container="{ message, acceptCallback, rejectCallback }">
      <div class="confirm-dialog-card">
        <!-- Centered Icon Badge with soft halo glow (matches screenshot) -->
        <div class="confirm-icon-halo" :class="getHaloClass(message)">
          <div class="confirm-icon-inner" :class="getInnerClass(message)">
            <!-- Success icon (Approve / Activate / Verify) -->
            <svg v-if="isSuccess(message)" class="confirm-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
            <!-- Exclamation icon (Delete / Reject / Warn / Default matching UI screenshot) -->
            <svg v-else class="confirm-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
        </div>

        <!-- Title / Header -->
        <h3 class="confirm-card-title">
          {{ message.header || 'Are you sure?' }}
        </h3>

        <!-- Description / Message -->
        <p class="confirm-card-message">
          {{ message.message }}
        </p>

        <!-- Actions (Cancel / Confirm side-by-side) -->
        <div class="confirm-card-actions">
          <button
            type="button"
            class="confirm-btn-cancel"
            @click="rejectCallback"
          >
            {{ message.rejectProps?.label || message.rejectLabel || 'Cancel' }}
          </button>
          <button
            type="button"
            class="confirm-btn-accept"
            :class="getAcceptButtonClass(message)"
            @click="acceptCallback"
          >
            {{ message.acceptProps?.label || message.acceptLabel || (isSuccess(message) ? 'Approve' : isDelete(message) ? 'Delete' : 'Confirm') }}
          </button>
        </div>
      </div>
    </template>
  </ConfirmDialog>

  <div v-if="isNavigating" class="global-route-loader">
    <div class="loader-progress"></div>
  </div>
  <router-view />
</template>

<script setup>
import { isNavigating } from './router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

function isSuccess(message) {
  if (!message) return false
  if (message.severity === 'success') return true
  const h = (message.header || '').toLowerCase()
  const m = (message.message || '').toLowerCase()
  const l = (message.acceptLabel || '').toLowerCase()
  return h.includes('approve') || h.includes('activate') || h.includes('restore') || h.includes('verify') || l.includes('approve') || l.includes('activate')
}

function isDelete(message) {
  if (!message) return false
  const h = (message.header || '').toLowerCase()
  const m = (message.message || '').toLowerCase()
  const l = (message.acceptLabel || '').toLowerCase()
  return h.includes('delete') || h.includes('remove') || h.includes('reject') || h.includes('archive') || m.includes('delete') || l.includes('delete') || l.includes('remove')
}

function getHaloClass(message) {
  if (isSuccess(message)) return 'halo-success'
  if (message?.severity === 'warn') return 'halo-warn'
  return 'halo-danger'
}

function getInnerClass(message) {
  if (isSuccess(message)) return 'inner-success'
  if (message?.severity === 'warn') return 'inner-warn'
  return 'inner-danger'
}

function getAcceptButtonClass(message) {
  if (isSuccess(message)) return 'btn-accept-success'
  if (message?.severity === 'warn') return 'btn-accept-warn'
  return 'btn-accept-danger'
}
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
