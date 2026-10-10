<template>
  <div :class="['search-field', { focused }]" role="search" @click="focusInput">
    <span class="icon-wrap" aria-hidden="true">
      <i :class="[icon || 'pi pi-search', 'search-icon']"></i>
    </span>
    <input
      ref="input"
      class="search-input"
      :placeholder="placeholder"
      :value="internalValue"
      @input="onInput"
      @focus="focused = true"
      @blur="focused = false"
      :aria-label="ariaLabel || placeholder"
    />
    <button v-if="clearable && internalValue" class="clear-btn" type="button" @click.stop="clear" :aria-label="clearLabel" title="Clear">
      <i class="pi pi-times clear-icon"></i>
    </button>
    <span v-if="loading" class="loader" aria-hidden="true"></span>
    <span v-if="showShortcut && !internalValue" class="shortcut-badge" aria-hidden="true">
      <kbd>{{ kbdShortcut }}</kbd>
    </span>
  </div>
</template>

<script>
export default {
  name: 'SearchField',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: 'Search...' },
    loading: { type: Boolean, default: false },
    clearable: { type: Boolean, default: true },
    icon: { type: String, default: 'pi pi-search' },
    debounce: { type: Number, default: 250 },
    ariaLabel: { type: String, default: '' },
    clearLabel: { type: String, default: 'Clear search' },
    showShortcut: { type: Boolean, default: true },
    kbdShortcut: { type: String, default: '⌘ K' }
  },
  data() {
    return {
      focused: false,
      internalValue: this.modelValue,
      _debounceTimer: null
    }
  },
  watch: {
    modelValue(v) {
      this.internalValue = v
    }
  },
  mounted() {
    window.addEventListener('keydown', this.handleGlobalKeydown)
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleGlobalKeydown)
  },
  methods: {
    onInput(e) {
      const val = e.target.value
      this.internalValue = val
      if (this.debounce > 0) {
        clearTimeout(this._debounceTimer)
        this._debounceTimer = setTimeout(() => this.$emit('update:modelValue', val), this.debounce)
      } else {
        this.$emit('update:modelValue', val)
      }
    },
    clear() {
      this.internalValue = ''
      clearTimeout(this._debounceTimer)
      this.$emit('update:modelValue', '')
      this.$nextTick(() => this.focusInput())
    },
    focusInput() {
      if (this.$refs.input) {
        this.$refs.input.focus()
      }
    },
    handleGlobalKeydown(e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        // Prevent default browser search where applicable and focus this search bar if visible
        if (this.$refs.input && document.contains(this.$refs.input)) {
          e.preventDefault()
          this.focusInput()
        }
      }
    }
  }
}
</script>

<style scoped src="../styles/components/SearchField.css"></style>
