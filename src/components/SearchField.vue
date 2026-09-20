<template>
  <div :class="['search-field', { focused }]" role="search">
    <span class="icon-wrap" aria-hidden="true">
      <!-- inline search SVG to ensure visibility even if icon font isn't loaded -->
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
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
    <button v-if="clearable && internalValue" class="clear-btn" @click="clear" :aria-label="clearLabel">
      <!-- inline clear (X) SVG -->
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <span v-if="loading" class="loader" aria-hidden="true"></span>
  </div>
</template>

<script>
export default {
  name: 'SearchField',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: 'Search' },
    loading: { type: Boolean, default: false },
    clearable: { type: Boolean, default: true },
    icon: { type: String, default: 'pi pi-search' },
    debounce: { type: Number, default: 250 },
    ariaLabel: { type: String, default: '' },
    clearLabel: { type: String, default: 'Clear search' }
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
      this.$nextTick(() => this.$refs.input && this.$refs.input.focus())
    }
  }
}
</script>

<style scoped src="../styles/components/SearchField.css"></style>
