<template>
  <Toast position="top-right" />
  <ConfirmDialog pt:root:class="confirm-modal-root" pt:mask:class="confirm-modal-mask">
    <template #container="{ message, acceptCallback, rejectCallback }">
      <div class="confirm-dialog-card">
        <!-- Centered Icon Badge with soft halo glow (matches screenshot) -->
        <div class="confirm-icon-halo" :class="getHaloClass(message)">
          <div class="confirm-icon-inner" :class="getInnerClass(message)">
            <!-- Success icon (Approve / Activate / Verify) -->
            <i v-if="isSuccess(message)" class="pi pi-check text-2xl confirm-icon-pi"></i>
            <!-- Exclamation icon (Delete / Reject / Warn / Default) -->
            <i v-else class="pi pi-exclamation-triangle text-2xl confirm-icon-pi"></i>
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

<style src="./styles/App.css"></style>

