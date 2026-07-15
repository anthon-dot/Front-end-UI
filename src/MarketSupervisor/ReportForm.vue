<template>
  <form class="report-form" @submit.prevent="submit">
    <label>
      Report Title
      <input
        v-model.trim="form.title"
        type="text"
        required
        placeholder="Enter report title"
      />
    </label>

    <label>
      Status
      <select v-model="form.status" required>
        <option value="DRAFT">DRAFT</option>
        <option value="SUBMITTED">SUBMITTED</option>
        <option value="IN_REVIEW">IN_REVIEW</option>
        <option value="RESOLVED">RESOLVED</option>
      </select>
    </label>

    <label>
      Description
      <textarea
        v-model.trim="form.description"
        rows="6"
        placeholder="Describe the report details"
      ></textarea>
    </label>

    <div class="form-actions">
      <button
        type="button"
        class="btn-secondary"
        @click="$emit('cancel')"
      >
        Cancel
      </button>

      <button type="submit" class="btn-primary">
        <i class="pi pi-save" />
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup>
import {
  reactive,
  watch,
  computed
} from 'vue'

const props = defineProps({
  report: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'submit',
  'cancel'
])

const form = reactive({
  title: '',
  description: '',
  status: 'DRAFT'
})

const submitLabel = computed(() => {
  return props.report?.id
    ? 'Update Report'
    : 'Create Report'
})

watch(
  () => props.report,
  (report) => {
    form.title = report?.title || ''
    form.description = report?.description || ''
    form.status = report?.status || 'DRAFT'
  },
  {
    immediate: true
  }
)

function submit() {
  emit('submit', {
    title: form.title,
    description: form.description,
    status: form.status
  })
}
</script>

<style scoped>
.report-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.report-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
}

.report-form input,
.report-form select,
.report-form textarea {
  width: 100%;
  border: 1px solid #dbe4ee;
  border-radius: 12px;
  padding: 12px 14px;
  color: #0f172a;
  font: inherit;
  outline: none;
  background: white;
}

.report-form input:focus,
.report-form select:focus,
.report-form textarea:focus {
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.14);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary {
  color: white;
  background: linear-gradient(135deg, #14b8a6, #0d9488);
}

.btn-secondary {
  color: #475569;
  background: #f1f5f9;
}
</style>
