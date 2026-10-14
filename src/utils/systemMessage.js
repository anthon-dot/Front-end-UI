import { reactive } from 'vue'

export const dialogState = reactive({
  visible: false,
  type: 'alert', // 'alert' | 'confirm' | 'prompt'
  title: '',
  message: '',
  severity: 'info', // 'success' | 'warn' | 'error' | 'info'
  acceptLabel: 'OK',
  rejectLabel: 'Cancel',
  placeholder: '',
  defaultValue: '',
  inputValue: '',
  inputError: '',
  required: false,
  multiline: false,
  isDanger: false,
  resolve: null,
  reject: null
})

// Optional reference to PrimeVue toast service if registered
let primeToastInstance = null
export function registerToastInstance(toast) {
  primeToastInstance = toast
}

/**
 * Modern Alert dialog (Promise-based)
 */
export function modernAlert(message, options = {}) {
  return new Promise((resolve) => {
    const text = typeof message === 'string' ? message : JSON.stringify(message, null, 2)
    const severity = options.severity || detectSeverity(text)
    const defaultTitle = severity === 'success' ? 'Success' : severity === 'error' ? 'Notice' : severity === 'warn' ? 'Attention' : 'Information'

    dialogState.type = 'alert'
    dialogState.title = options.title || defaultTitle
    dialogState.message = text
    dialogState.severity = severity
    dialogState.acceptLabel = options.acceptLabel || 'Got it'
    dialogState.rejectLabel = ''
    dialogState.isDanger = severity === 'error'
    dialogState.inputValue = ''
    dialogState.inputError = ''
    dialogState.resolve = () => {
      dialogState.visible = false
      resolve(true)
    }
    dialogState.reject = () => {
      dialogState.visible = false
      resolve(true)
    }
    dialogState.visible = true
  })
}

/**
 * Modern Confirm dialog (Promise-based, resolves to true or false)
 */
export function modernConfirm(message, options = {}) {
  return new Promise((resolve) => {
    const text = typeof message === 'string' ? message : JSON.stringify(message, null, 2)
    const lower = text.toLowerCase()
    const isDestructive = options.isDanger || lower.includes('delete') || lower.includes('remove') || lower.includes('terminate') || lower.includes('archive') || lower.includes('reject')
    const severity = options.severity || (isDestructive ? 'error' : 'info')
    const defaultTitle = options.title || (isDestructive ? 'Confirm Action' : 'Are you sure?')

    dialogState.type = 'confirm'
    dialogState.title = defaultTitle
    dialogState.message = text
    dialogState.severity = severity
    dialogState.acceptLabel = options.acceptLabel || (isDestructive ? 'Confirm' : 'Yes, Proceed')
    dialogState.rejectLabel = options.rejectLabel || 'Cancel'
    dialogState.isDanger = isDestructive
    dialogState.inputValue = ''
    dialogState.inputError = ''
    dialogState.resolve = () => {
      dialogState.visible = false
      resolve(true)
    }
    dialogState.reject = () => {
      dialogState.visible = false
      resolve(false)
    }
    dialogState.visible = true
  })
}

/**
 * Modern Prompt dialog (Promise-based, resolves to input string or null)
 */
export function modernPrompt(message, options = {}) {
  return new Promise((resolve) => {
    const text = typeof message === 'string' ? message : String(message || '')
    dialogState.type = 'prompt'
    dialogState.title = options.title || 'Input Required'
    dialogState.message = text
    dialogState.severity = options.severity || 'info'
    dialogState.acceptLabel = options.acceptLabel || 'Submit'
    dialogState.rejectLabel = options.rejectLabel || 'Cancel'
    dialogState.placeholder = options.placeholder || 'Enter details here...'
    dialogState.defaultValue = options.defaultValue || ''
    dialogState.inputValue = options.defaultValue || ''
    dialogState.inputError = ''
    dialogState.required = options.required ?? true
    dialogState.multiline = options.multiline ?? true
    dialogState.isDanger = Boolean(options.isDanger)
    dialogState.resolve = (value) => {
      dialogState.visible = false
      resolve(value)
    }
    dialogState.reject = () => {
      dialogState.visible = false
      resolve(null)
    }
    dialogState.visible = true
  })
}

/**
 * Helper to show toast with fallback to modernAlert
 */
export function showToast(severity, summary, detail, life = 4500) {
  if (primeToastInstance && typeof primeToastInstance.add === 'function') {
    primeToastInstance.add({
      severity,
      summary,
      detail: typeof detail === 'string' ? detail : JSON.stringify(detail),
      life
    })
    return
  }
  // Fallback to alert if toast service not available
  modernAlert(detail || summary, { title: summary, severity })
}

function detectSeverity(text) {
  const l = (text || '').toLowerCase()
  if (l.includes('fail') || l.includes('error') || l.includes('incorrect') || l.includes('invalid') || l.includes('denied')) return 'error'
  if (l.includes('warn') || l.includes('already exists') || l.includes('missing') || l.includes('required') || l.includes('please select') || l.includes('please enter')) return 'warn'
  if (l.includes('success') || l.includes('restored') || l.includes('approved') || l.includes('copied') || l.includes('saved')) return 'success'
  return 'info'
}

export const systemMessage = {
  alert: modernAlert,
  confirm: modernConfirm,
  prompt: modernPrompt,
  success(detail, summary = 'Success') {
    showToast('success', summary, detail)
  },
  error(detail, summary = 'Error') {
    showToast('error', summary, detail)
  },
  warn(detail, summary = 'Notice') {
    showToast('warn', summary, detail)
  },
  info(detail, summary = 'Information') {
    showToast('info', summary, detail)
  }
}

/**
 * Global override for window.alert, window.confirm, window.prompt
 * Eliminates "localhost:5173 says" native dialogs completely.
 */
export function installGlobalSystemMessageOverrides() {
  if (typeof window === 'undefined') return

  // Prevent multiple installations
  if (window.__systemMessageInstalled) return
  window.__systemMessageInstalled = true

  // Expose on window for easy dev/runtime access
  window.systemMessage = systemMessage
  window.modernAlert = modernAlert
  window.modernConfirm = modernConfirm
  window.modernPrompt = modernPrompt

  // Replace native browser window.alert
  window.alert = function (msg) {
    modernAlert(String(msg ?? ''))
  }

  // Replace native browser window.confirm
  window.confirm = function (msg) {
    modernConfirm(String(msg ?? ''))
    return true
  }

  // Replace native browser window.prompt
  window.prompt = function (msg, defaultVal) {
    modernPrompt(String(msg ?? ''), { defaultValue: defaultVal || '' })
    return defaultVal || ''
  }
}
