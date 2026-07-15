<template>
  <div class="stakeholder-layout">
    <StakeholderMenu />
    <main class="payments-page">
      <div class="page-header">
        <div>
          <h2>Payment History</h2>
          <p class="muted">Recent payments and reconciliations</p>
        </div>
        <div class="header-actions">
          <input class="search" v-model="q" placeholder="Search by type or date" />
          <div class="summary">Total: <strong>{{ formatCurrency(totalAmount) }}</strong></div>
        </div>
      </div>

      <div class="card payments-card">
        <div v-if="filtered.length === 0" class="empty-card">No payments found.</div>

        <ul class="payments-list">
          <li v-for="p in filtered" :key="p.id" class="payment-item">
            <div class="left">
              <div class="date">{{ p.date }}</div>
              <div class="type">{{ p.type }}</div>
              <div v-if="p.receipt || p.receiptUrl" class="receipt-row">
                <small class="muted">Receipt:</small>
                <span class="receipt-value">{{ p.receipt || p.receiptUrl }}</span>
                <button v-if="isUrl(p.receipt || p.receiptUrl)" class="btn-link" @click.prevent="openReceipt(p)">View</button>
                <button v-else class="btn-link" @click.prevent="copyReceipt(p)">Copy</button>
              </div>
            </div>
            <div class="right">{{ formatCurrency(p.amount) }}</div>
          </li>
        </ul>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import StakeholderMenu from '../components/stakeholdermenu.vue'

const payments = ref([])
const q = ref('')
function load(){ try{ const raw = localStorage.getItem('payments'); if(raw) payments.value = JSON.parse(raw) }catch(e){} }
const filtered = computed(() => {
  const term = (q.value || '').toLowerCase().trim()
  if (!term) return payments.value
  return payments.value.filter(p => (p.type||'').toLowerCase().includes(term) || (p.date||'').toLowerCase().includes(term) || String(p.amount||'').includes(term))
})

const totalAmount = computed(() => payments.value.reduce((s,p)=> s + (Number(p.amount)||0), 0))

function formatCurrency(n){ return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(n||0) }
onMounted(()=>load())

function isUrl(v){ if(!v) return false; try{ const s = String(v).trim(); return /^https?:\/\//i.test(s) || /^data:/i.test(s) }catch(e){return false} }

function openReceipt(p){ const url = p.receiptUrl || p.receipt; if(!url) return; if(isUrl(url)){ window.open(url,'_blank') } else { alert('Receipt: ' + url) } }

function copyReceipt(p){ const val = p.receipt || p.receiptUrl; if(!val) return; try{ navigator.clipboard.writeText(val); alert('Receipt copied to clipboard') }catch(e){ alert('Receipt: ' + val) } }
</script>

<style scoped>
.stakeholder-layout { display:flex; align-items:flex-start }
.payments-page { padding:24px; flex:1; padding-top: calc(var(--header-height,64px) + 24px); background:#f8fafc }
.muted { color:#6b7280 }
.page-header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:14px }
.header-actions { display:flex; gap:12px; align-items:center }
.search { padding:8px 10px; border-radius:10px; border:1px solid #e6eef0; outline:none; min-width:200px }
.search:focus{ box-shadow:0 0 0 3px rgba(14,165,164,0.06); border-color:#0ea5a4 }
.summary { color:#374151 }
.card { background:#fff; padding:14px; border-radius:12px; box-shadow:0 6px 18px rgba(16,24,40,0.04) }
.payments-card { padding:0 }
.empty-card { padding:28px; text-align:center; color:#6b7280 }
.payments-list { list-style:none; margin:0; padding:0 }
.payment-item { display:flex; justify-content:space-between; align-items:center; padding:14px 16px; border-bottom:1px solid #f1f5f9 }
.payment-item:last-child{ border-bottom:none }
.payment-item .left { display:flex; flex-direction:column }
.payment-item .date { font-weight:600; color:#111827 }
.payment-item .type { color:#6b7280; font-size:13px }
.payment-item .right { font-weight:700; color:#0f766e }
.receipt-row { display:flex; gap:8px; align-items:center; margin-top:6px }
.receipt-value { color:#374151; font-size:13px; margin-left:6px }
.btn-link { background:none; border:none; color:#0ea5a4; cursor:pointer; padding:6px; border-radius:6px }
.btn-link:hover{ background:rgba(14,165,164,0.06) }
@media (max-width:900px){ .stakeholder-layout{ flex-direction:column } .payments-page{ padding-left:16px } .page-header{ flex-direction:column; align-items:flex-start } .header-actions{ width:100%; justify-content:space-between } }
</style>
