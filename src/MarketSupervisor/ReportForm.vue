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

<style scoped src="../styles/MarketSupervisor/ReportForm.css"></style>
