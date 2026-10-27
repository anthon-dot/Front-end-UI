<template>
  <div v-if="visible" class="loi-modal-backdrop" @click.self="emitClose">
    <div class="loi-modal-container">
      <!-- Toolbar -->
      <div class="loi-toolbar no-print">
        <div class="toolbar-title-wrap">
          <div class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
            <i class="pi pi-file-edit"></i>
          </div>
          <div>
            <h3>Official Letter of Intent (LOI)</h3>
            <p>Generated Document &bull; Hon. Mayor Stephen S. Tan &bull; Manticao Public Market</p>
          </div>
        </div>

        <div class="toolbar-actions">
          <span v-if="currentRefNo" class="ref-badge font-mono">
            Ref: {{ currentRefNo }}
          </span>

          <button
            v-if="!isReadOnly"
            type="button"
            class="loi-btn save"
            @click="handleSaveDraft"
            title="Save draft of your LOI details"
          >
            <i class="pi pi-save"></i>
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            class="loi-btn export-pdf"
            @click="handleExportPrintPdf"
            :disabled="isProcessing"
            title="Export official PDF and record printed status"
          >
            <i class="pi pi-print"></i>
            <span>{{ isProcessing ? 'Generating...' : 'Export / Print LOI' }}</span>
          </button>

          <button
            type="button"
            class="loi-btn close"
            @click="emitClose"
            title="Close"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <!-- Action Guidance Alert Banner -->
      <div class="loi-instructions-banner no-print">
        <i class="pi pi-info-circle text-amber-400 text-lg flex-shrink-0"></i>
        <div v-if="!isReadOnly">
          <strong>Next Offline Submission Step:</strong>
          <span> Print this letter, sign it by hand, and submit it physically to the Office of the Mayor. Your application will proceed to fee assessment once the Mayor's Office records its approval.</span>
        </div>
        <div v-else>
          <strong>Official Generated Document (No Upload Required):</strong>
          <span> Built from saved application data adhering verbatim to the official template. Handwritten signature is collected on the printed paper copy submitted to the Office of the Mayor.</span>
        </div>
      </div>

      <!-- Main Document Sheet (Matches Letter of Intent.pdf authoritative layout) -->
      <div class="loi-sheet-container">
        <div class="official-loi-sheet" id="loiPrintArea">
          <!-- Top Line: Date: ____________________ -->
          <div class="loi-top-date">
            Date: <span class="handwrite-line">{{ formattedDate }}</span>
          </div>

          <!-- Addressee Block -->
          <div class="loi-addressee-block">
            <div class="mayor-name">{{ props.incumbentMayor || '' }}</div>
            <div class="mayor-title">MUNICIPAL MAYOR</div>
            <div class="mayor-lgu">MANTICAO, MISAMIS ORIENTAL</div>
          </div>

          <!-- Subject Line (Bold) -->
          <div class="loi-subject-line">
            Subject: Letter of Intent - Market Stall Application
          </div>

          <!-- Salutation -->
          <div class="loi-salutation-line">
            Dear Mayor:
          </div>

          <!-- Opening Greetings -->
          <div class="loi-greeting-line">
            Greetings!
          </div>

          <!-- Body Paragraphs (Verbatim reproduction from official PDF template) -->
          <div class="loi-body-text">
            <p>
              I am respectfully expressing my intent to apply for an available stall/space at
              <span class="fill-blank font-bold">{{ displayStallReference }}</span> at the Manticao Public Market for
              the purpose of establishing and operating
              <span class="fill-blank font-bold">{{ displayCommodityDescription }}</span>.
            </p>

            <p>
              I am willing to comply with all the necessary requirements, permits, rental fees, and other rules
              and regulations of the Municipal Government and Market Administration.
            </p>

            <p>
              I sincerely hope that my application will be given due consideration. Thank you for your kind
              attention and assistance.
            </p>
          </div>

          <!-- Closing -->
          <div class="loi-closing">
            Respectfully yours,
          </div>

          <!-- Signature Block (Blank line for physical handwriting over printed name) -->
          <div class="loi-signature-section">
            <div class="signature-line-mark">________________________________________________</div>
            <div class="printed-name">{{ applicantFullName }}</div>
            <div class="printed-sub">(Signature over Printed Name)</div>
            
            <div class="coord-row">
              <span class="coord-lbl">Address:</span>
              <span class="coord-val">{{ applicantAddress }}</span>
            </div>
            <div class="coord-row">
              <span class="coord-lbl">Contact Number:</span>
              <span class="coord-val font-mono">{{ applicantContact }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Callout (non-print) -->
      <div class="loi-footer-note no-print">
        <i class="pi pi-shield text-emerald-400"></i>
        <span>
          No digital signature or scanned LOI upload is collected. Approval outcome and reference to the physical signed copy will be recorded by <strong>MAYOR_OFFICE</strong>.
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { jsPDF } from 'jspdf'
import api from '../services/api'
import { supabase } from '../config/supabase'

const props = defineProps({
  visible: { type: Boolean, default: false },
  applicationId: { type: [String, Number], default: null },
  loiReferenceNo: { type: String, default: '' },
  loiStatus: { type: String, default: 'NOT_GENERATED' },
  applicantData: { type: Object, default: () => ({}) },
  applicantName: { type: String, default: '' },
  applicantAddress: { type: String, default: '' },
  applicantContact: { type: String, default: '' },
  businessNature: { type: String, default: '' },
  preferredStall: { type: String, default: '' },
  commodities: { type: String, default: '' },
  incumbentMayor: { type: String, default: '' },
  isReadOnly: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'saved', 'printed'])

const isProcessing = ref(false)
const localRefNo = ref('')

onMounted(() => {
  if (props.loiReferenceNo) {
    localRefNo.value = props.loiReferenceNo
  } else {
    localRefNo.value = `LOI-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
  }
})

const currentRefNo = computed(() => {
  return props.loiReferenceNo || localRefNo.value
})

const formattedDate = computed(() => {
  const d = new Date()
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

const applicantFullName = computed(() => {
  if (props.applicantName) return props.applicantName
  const d = props.applicantData || {}
  const parts = [d.firstName, d.middleName, d.lastName].filter(Boolean)
  return parts.join(' ') || d.name || ''
})

const applicantAddress = computed(() => {
  return props.applicantAddress || props.applicantData?.address || ''
})

const applicantContact = computed(() => {
  return props.applicantContact || props.applicantData?.contact || props.applicantData?.phone || ''
})

const displayStallReference = computed(() => {
  if (props.preferredStall) return props.preferredStall
  const d = props.applicantData || {}
  if (d.stallNo) return `Stall #${d.stallNo}`
  if (d.preferredStallNo) return `Stall #${d.preferredStallNo}`
  return 'an available commercial stall'
})

const displayCommodityDescription = computed(() => {
  return props.commodities || props.businessNature || props.applicantData?.commodities || props.applicantData?.businessType || ''
})

function buildLoiSnapshot() {
  return {
    loi_reference_no: currentRefNo.value,
    applicant_name: applicantFullName.value,
    address: applicantAddress.value,
    contact: applicantContact.value,
    preferred_stall: displayStallReference.value,
    intended_business: displayCommodityDescription.value,
    incumbent_mayor: props.incumbentMayor,
    date_generated: new Date().toISOString(),
    template_version: 'v1.0'
  }
}

async function handleSaveDraft() {
  const snapshot = buildLoiSnapshot()
  const appId = props.applicationId || props.applicantData?.id
  if (appId) {
    try {
      await api.put(`/applications/${appId}`, {
        loi_reference_no: currentRefNo.value,
        loi_status: 'GENERATED',
        loi_generated_at: new Date().toISOString(),
        loi_snapshot_json: snapshot
      })
    } catch (_) {}
  }
  emit('saved', snapshot)
  emitClose()
}

async function handleExportPrintPdf() {
  isProcessing.value = true
  const snapshot = buildLoiSnapshot()
  const appId = props.applicationId || props.applicantData?.id

  try {
    // 1. Record print action in database (LOI_PRINTED)
    if (appId) {
      try {
        await api.post(`/applications/${appId}/loi/record-print`, {
          loi_reference_no: currentRefNo.value,
          snapshot
        })
      } catch (err) {
        console.warn('[LOI Modal] record-print warning:', err?.message)
      }
    }

    // 2. Generate PDF adhering verbatim to Letter of Intent.pdf layout
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    doc.setFont('times', 'normal')

    // Top Line: Date: ______________
    doc.setFontSize(11)
    doc.text(`Date: ${formattedDate.value}`, 25, 30)

    // Addressee Block (left aligned)
    doc.setFont('times', 'bold')
    doc.text(props.incumbentMayor || '', 25, 45)
    doc.setFont('times', 'normal')
    doc.text('MUNICIPAL MAYOR', 25, 51)
    doc.text('MANTICAO, MISAMIS ORIENTAL', 25, 57)

    // Subject Line in Bold
    doc.setFont('times', 'bold')
    doc.text('Subject: Letter of Intent - Market Stall Application', 25, 68)

    // Salutation
    doc.setFont('times', 'normal')
    doc.text('Dear Mayor:', 25, 78)
    doc.text('Greetings!', 25, 86)

    // Paragraph 1
    const p1 = `I am respectfully expressing my intent to apply for an available stall/space at ${displayStallReference.value} at the Manticao Public Market for the purpose of establishing and operating ${displayCommodityDescription.value}.`
    const splitP1 = doc.splitTextToSize(p1, 160)
    doc.text(splitP1, 25, 96)

    // Paragraph 2
    const p2 = `I am willing to comply with all the necessary requirements, permits, rental fees, and other rules and regulations of the Municipal Government and Market Administration.`
    const splitP2 = doc.splitTextToSize(p2, 160)
    doc.text(splitP2, 25, 116)

    // Paragraph 3
    const p3 = `I sincerely hope that my application will be given due consideration. Thank you for your kind attention and assistance.`
    const splitP3 = doc.splitTextToSize(p3, 160)
    doc.text(splitP3, 25, 134)

    // Closing
    doc.text('Respectfully yours,', 25, 154)

    // Signature Block (Line for physical handwritten wet signature)
    doc.text('________________________________________________', 25, 180)
    doc.setFont('times', 'bold')
    doc.text(applicantFullName.value.toUpperCase(), 25, 186)
    doc.setFont('times', 'normal')
    doc.text('(Signature over Printed Name)', 25, 191)
    doc.text(`Address: ${applicantAddress.value}`, 25, 198)
    doc.text(`Contact Number: ${applicantContact.value}`, 25, 204)

    // Save PDF
    const filename = `Letter_of_Intent_${applicantFullName.value.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
    doc.save(filename)

    // Trigger physical print dialog as well
    setTimeout(() => {
      window.print()
    }, 500)

    emit('printed', { referenceNo: currentRefNo.value, snapshot })
  } catch (err) {
    console.error('[LOI Modal] export error:', err)
  } finally {
    isProcessing.value = false
  }
}

function emitClose() {
  emit('close')
}
</script>

<style scoped>
.loi-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(5px);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  overflow-y: auto;
}

.loi-modal-container {
  background: #0f172a;
  border-radius: 16px;
  width: 100%;
  max-width: 820px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  border: 1px solid #334155;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.loi-toolbar {
  background: #1e293b;
  color: #ffffff;
  padding: 0.85rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #334155;
  gap: 1rem;
}

.toolbar-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.toolbar-title-wrap h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: #f8fafc;
}
.toolbar-title-wrap p {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ref-badge {
  background: #334155;
  color: #fbbf24;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid #475569;
}

.loi-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.loi-btn.save {
  background: #334155;
  color: #f1f5f9;
  border: 1px solid #475569;
}
.loi-btn.save:hover { background: #475569; }

.loi-btn.export-pdf {
  background: #0d9488;
  color: #ffffff;
}
.loi-btn.export-pdf:hover { background: #0f766e; }

.loi-btn.close {
  background: transparent;
  color: #94a3b8;
  font-size: 1.1rem;
  padding: 6px 8px;
}
.loi-btn.close:hover { color: #f8fafc; }

.loi-instructions-banner {
  background: #451a03;
  color: #fef3c7;
  padding: 10px 16px;
  font-size: 0.8rem;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-bottom: 1px solid #78350f;
}

.loi-sheet-container {
  background: #334155;
  padding: 2.5rem 1.5rem;
  display: flex;
  justify-content: center;
  overflow-y: auto;
  max-height: 68vh;
}

/* Verbatim layout reproducing Letter of Intent.pdf */
.official-loi-sheet {
  background: #ffffff;
  color: #000000;
  width: 100%;
  max-width: 680px;
  min-height: 800px;
  padding: 55px 65px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  font-family: 'Times New Roman', Times, serif;
  font-size: 11pt;
  line-height: 1.6;
}

.loi-top-date {
  margin-bottom: 24pt;
}

.handwrite-line {
  border-bottom: 1px solid #000000;
  display: inline-block;
  min-width: 180px;
  padding-left: 6px;
}

.loi-addressee-block {
  margin-bottom: 22pt;
  line-height: 1.35;
}
.loi-addressee-block .mayor-name {
  font-weight: bold;
}

.loi-subject-line {
  font-weight: bold;
  margin-bottom: 18pt;
}

.loi-salutation-line {
  margin-bottom: 14pt;
}

.loi-greeting-line {
  margin-bottom: 16pt;
}

.loi-body-text p {
  margin: 0 0 14pt;
  text-align: justify;
}

.fill-blank {
  border-bottom: 1px solid #000000;
  padding: 0 4px;
}

.loi-closing {
  margin-top: 24pt;
  margin-bottom: 30pt;
}

.loi-signature-section {
  line-height: 1.35;
}

.signature-line-mark {
  margin-bottom: 4px;
}

.printed-name {
  font-weight: bold;
  text-transform: uppercase;
}

.printed-sub {
  font-size: 10pt;
  margin-bottom: 12pt;
}

.coord-row {
  margin-top: 4px;
  font-size: 10.5pt;
}

.coord-lbl {
  margin-right: 6px;
}

.coord-val {
  border-bottom: 1px solid #000000;
  display: inline-block;
  min-width: 250px;
  padding-left: 4px;
}

.loi-footer-note {
  background: #1e293b;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  color: #cbd5e1;
  border-top: 1px solid #334155;
}

@media print {
  .no-print {
    display: none !important;
  }
  .loi-modal-backdrop {
    position: static !important;
    background: transparent !important;
    padding: 0 !important;
    display: block !important;
  }
  .loi-modal-container {
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
    max-width: 100% !important;
  }
  .loi-sheet-container {
    background: transparent !important;
    padding: 0 !important;
  }
  .official-loi-sheet {
    box-shadow: none !important;
    padding: 40px !important;
  }
}
</style>
