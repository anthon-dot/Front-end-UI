<template>
  <teleport to="body">
    <transition name="sys-modal-fade">
      <div
        v-if="dialogState.visible"
        class="sys-modal-overlay"
        role="dialog"
        :aria-modal="true"
        :aria-labelledby="'sys-modal-title'"
        @click.self="handleOverlayClick"
      >
        <div class="sys-modal-card" :class="cardThemeClass">
          <!-- Close button on top right for quick dismissal -->
          <button
            type="button"
            class="sys-modal-close"
            @click="handleCancel"
            aria-label="Close dialog"
          >
            <i class="pi pi-times"></i>
          </button>

          <!-- Halo Glow Icon Badge -->
          <div class="sys-icon-halo" :class="haloClass">
            <div class="sys-icon-inner" :class="innerIconClass">
              <i v-if="dialogState.severity === 'success'" class="pi pi-check text-xl"></i>
              <i v-else-if="dialogState.severity === 'error' || dialogState.isDanger" class="pi pi-exclamation-triangle text-xl"></i>
              <i v-else-if="dialogState.severity === 'warn'" class="pi pi-exclamation-circle text-xl"></i>
              <i v-else-if="dialogState.type === 'prompt'" class="pi pi-pencil text-xl"></i>
              <i v-else class="pi pi-info-circle text-xl"></i>
            </div>
          </div>

          <!-- Title -->
          <h3 id="sys-modal-title" class="sys-modal-title">
            {{ dialogState.title }}
          </h3>

          <!-- Message Body -->
          <p class="sys-modal-message">
            {{ dialogState.message }}
          </p>

          <!-- Prompt Input Field (if type === 'prompt') -->
          <div v-if="dialogState.type === 'prompt'" class="sys-modal-input-wrap">
            <textarea
              v-if="dialogState.multiline"
              ref="inputRef"
              v-model="dialogState.inputValue"
              :placeholder="dialogState.placeholder"
              class="sys-modal-input sys-modal-textarea"
              rows="3"
              @keydown.enter.exact.prevent="handleAccept"
            ></textarea>
            <input
              v-else
              ref="inputRef"
              v-model="dialogState.inputValue"
              :placeholder="dialogState.placeholder"
              class="sys-modal-input"
              type="text"
              @keydown.enter.prevent="handleAccept"
            />
            <span v-if="dialogState.inputError" class="sys-modal-error-text">
              {{ dialogState.inputError }}
            </span>
          </div>

          <!-- Actions -->
          <div class="sys-modal-actions" :class="{ 'is-single': dialogState.type === 'alert' }">
            <button
              v-if="dialogState.type !== 'alert'"
              type="button"
              class="sys-btn sys-btn-cancel"
              @click="handleCancel"
            >
              {{ dialogState.rejectLabel || 'Cancel' }}
            </button>
            <button
              type="button"
              class="sys-btn sys-btn-accept"
              :class="acceptBtnClass"
              @click="handleAccept"
            >
              {{ dialogState.acceptLabel || (dialogState.type === 'alert' ? 'Got it' : 'Confirm') }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { dialogState } from '../utils/systemMessage'

const inputRef = ref(null)

const haloClass = computed(() => {
  if (dialogState.severity === 'success') return 'halo-success'
  if (dialogState.severity === 'error' || dialogState.isDanger) return 'halo-error'
  if (dialogState.severity === 'warn') return 'halo-warn'
  return 'halo-info'
})

const innerIconClass = computed(() => {
  if (dialogState.severity === 'success') return 'inner-success'
  if (dialogState.severity === 'error' || dialogState.isDanger) return 'inner-error'
  if (dialogState.severity === 'warn') return 'inner-warn'
  return 'inner-info'
})

const acceptBtnClass = computed(() => {
  if (dialogState.severity === 'success') return 'btn-success'
  if (dialogState.severity === 'error' || dialogState.isDanger) return 'btn-danger'
  if (dialogState.severity === 'warn') return 'btn-warn'
  return 'btn-primary'
})

const cardThemeClass = computed(() => {
  return dialogState.isDanger ? 'theme-danger' : ''
})

watch(
  () => dialogState.visible,
  async (isVisible) => {
    if (isVisible && dialogState.type === 'prompt') {
      await nextTick()
      if (inputRef.value) {
        inputRef.value.focus()
      }
    }
  }
)

function handleAccept() {
  if (dialogState.type === 'prompt') {
    if (dialogState.required && !dialogState.inputValue.trim()) {
      dialogState.inputError = 'This field is required.'
      return
    }
    if (dialogState.resolve) {
      dialogState.resolve(dialogState.inputValue.trim())
    }
  } else {
    if (dialogState.resolve) {
      dialogState.resolve(true)
    }
  }
}

function handleCancel() {
  if (dialogState.reject) {
    dialogState.reject()
  } else if (dialogState.resolve) {
    dialogState.resolve(false)
  }
}

function handleOverlayClick() {
  if (dialogState.type === 'alert') {
    handleAccept()
  } else {
    handleCancel()
  }
}

function handleKeydown(e) {
  if (!dialogState.visible) return
  if (e.key === 'Escape') {
    handleCancel()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.sys-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  padding-bottom: max(1.5rem, env(safe-area-inset-bottom, 16px));
  padding-top: max(1rem, env(safe-area-inset-top, 16px));
  background-color: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-sizing: border-box;
}

.sys-modal-card {
  position: relative;
  width: 100%;
  max-width: 410px;
  background: #ffffff;
  border-radius: 24px;
  padding: 32px 28px 24px;
  box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-sizing: border-box;
  animation: modalPopIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

:global(.app-dark) .sys-modal-card {
  background: #1e293b;
  color: #f8fafc;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08);
}

@keyframes modalPopIn {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.sys-modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sys-modal-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

:global(.app-dark) .sys-modal-close:hover {
  background: #334155;
  color: #f8fafc;
}

/* Glowing Icon Halo */
.sys-icon-halo {
  width: 62px;
  height: 62px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  transition: transform 0.2s ease;
}

.halo-success {
  background: #ecfdf5;
  box-shadow: 0 0 0 8px rgba(209, 250, 229, 0.65);
}
.halo-error {
  background: #fff1f2;
  box-shadow: 0 0 0 8px rgba(254, 226, 226, 0.65);
}
.halo-warn {
  background: #fffbeb;
  box-shadow: 0 0 0 8px rgba(254, 243, 199, 0.65);
}
.halo-info {
  background: #eff6ff;
  box-shadow: 0 0 0 8px rgba(219, 234, 254, 0.65);
}

:global(.app-dark) .halo-success {
  background: rgba(16, 185, 129, 0.15);
  box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.1);
}
:global(.app-dark) .halo-error {
  background: rgba(239, 68, 68, 0.15);
  box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.1);
}
:global(.app-dark) .halo-warn {
  background: rgba(245, 158, 11, 0.15);
  box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.1);
}
:global(.app-dark) .halo-info {
  background: rgba(59, 130, 246, 0.15);
  box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.1);
}

.sys-icon-inner {
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.inner-success {
  background: #d1fae5;
  color: #059669;
}
.inner-error {
  background: #ffe4e6;
  color: #e11d48;
}
.inner-warn {
  background: #fef3c7;
  color: #d97706;
}
.inner-info {
  background: #dbeafe;
  color: #2563eb;
}

:global(.app-dark) .inner-success { background: #065f46; color: #34d399; }
:global(.app-dark) .inner-error { background: #881337; color: #fb7185; }
:global(.app-dark) .inner-warn { background: #78350f; color: #fbbf24; }
:global(.app-dark) .inner-info { background: #1e3a8a; color: #60a5fa; }

/* Text Content */
.sys-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

:global(.app-dark) .sys-modal-title {
  color: #f8fafc;
}

.sys-modal-message {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: #64748b;
  margin: 0 0 20px 0;
  max-width: 340px;
  word-break: break-word;
}

:global(.app-dark) .sys-modal-message {
  color: #94a3b8;
}

/* Prompt Input */
.sys-modal-input-wrap {
  width: 100%;
  margin-bottom: 20px;
  text-align: left;
}

.sys-modal-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1.5px solid #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
  font-size: 0.9375rem;
  box-sizing: border-box;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
}

.sys-modal-input:focus {
  border-color: #059669;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
}

:global(.app-dark) .sys-modal-input {
  background: #0f172a;
  border-color: #334155;
  color: #f8fafc;
}

:global(.app-dark) .sys-modal-input:focus {
  border-color: #10b981;
  background: #0f172a;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.sys-modal-textarea {
  resize: vertical;
  min-height: 72px;
}

.sys-modal-error-text {
  display: block;
  font-size: 0.8125rem;
  color: #e11d48;
  margin-top: 6px;
  font-weight: 500;
}

/* Actions */
.sys-modal-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.sys-modal-actions.is-single {
  justify-content: center;
}

.sys-btn {
  flex: 1;
  padding: 13px 20px;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.16s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
  min-height: 46px;
}

.sys-modal-actions.is-single .sys-btn {
  width: 100%;
}

.sys-btn:active {
  transform: scale(0.98);
}

.sys-btn-cancel {
  background: #f1f5f9;
  color: #334155;
}

.sys-btn-cancel:hover {
  background: #e2e8f0;
  color: #0f172a;
}

:global(.app-dark) .sys-btn-cancel {
  background: #334155;
  color: #cbd5e1;
}

:global(.app-dark) .sys-btn-cancel:hover {
  background: #475569;
  color: #f8fafc;
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.28);
}
.btn-success:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.28);
}
.btn-danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}

.btn-warn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.28);
}
.btn-warn:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.28);
}
.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

/* Transitions */
.sys-modal-fade-enter-active,
.sys-modal-fade-leave-active {
  transition: opacity 0.22s ease;
}

.sys-modal-fade-enter-from,
.sys-modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .sys-modal-card {
    padding: 28px 20px 20px;
    border-radius: 20px;
    max-width: calc(100vw - 1.5rem);
  }

  .sys-btn {
    padding: 12px 16px;
    font-size: 0.9rem;
  }
}
</style>
