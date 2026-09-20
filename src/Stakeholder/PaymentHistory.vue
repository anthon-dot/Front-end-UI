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
import StakeholderMenu from '../components/StakeholderMenu.vue'

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

<style scoped src="./PaymentHistory.css"></style>
