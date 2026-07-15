<template>
  <div class="stakeholder-layout">
    <StakeholderMenu />
    <main class="settings-page">
      <h2>Settings</h2>
      <p class="muted">Manage your account and credentials</p>

      <div class="settings-grid">
        <section class="card">
          <h3>Profile</h3>
          <div class="form-row">
            <label>Name</label>
            <input class="input" v-model="profile.name" placeholder="Full name" />
          </div>
          <div class="form-row">
            <label>Business</label>
            <input class="input" v-model="profile.business" placeholder="Business name" />
          </div>
          <div class="form-row">
            <label>Contact</label>
            <input class="input" v-model="profile.contact" placeholder="Contact number" />
          </div>
          <div class="actions">
            <button class="btn-primary" @click="saveProfile">Save Profile</button>
          </div>
        </section>

        <section class="card">
          <h3>Account Credentials</h3>
          <div class="form-row">
            <label>Username</label>
            <input class="input" v-model="credentials.username" placeholder="Username" />
          </div>
          <div class="form-row">
            <label>Current Password</label>
            <input class="input" type="password" v-model="credentials.currentPassword" placeholder="Current password" />
          </div>
          <div class="form-row">
            <label>New Password</label>
            <input class="input" type="password" v-model="credentials.newPassword" placeholder="New password" />
          </div>
          <div class="form-row">
            <label>Confirm New Password</label>
            <input class="input" type="password" v-model="credentials.confirmPassword" placeholder="Confirm new password" />
          </div>
          <div class="actions">
            <button class="btn-primary" @click="saveCredentials">Save Credentials</button>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import StakeholderMenu from '../components/stakeholdermenu.vue'

const route = useRoute()
const stakeholderId = route.query.id || route.params.id || 'default'

const profileKey = `stakeholder_profile_${stakeholderId}`
const credentialsKey = `stakeholder_credentials_${stakeholderId}`

const profile = ref({ name: '', business: '', contact: '' })
const credentials = ref({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' })
// settings removed (Preferences card removed)

function loadProfile(){ try{ const v = localStorage.getItem(profileKey); if(v) profile.value = JSON.parse(v) }catch(e){} }
function saveProfile(){ try{ localStorage.setItem(profileKey, JSON.stringify(profile.value)); alert('Profile saved') }catch(e){} }

function loadCredentials(){ try{ const v = localStorage.getItem(credentialsKey); if(v){ const parsed = JSON.parse(v); credentials.value.username = parsed.username || '' } }catch(e){} }
function saveCredentials(){
  try{
    const stored = (()=>{ try{ const s = localStorage.getItem(credentialsKey); return s ? JSON.parse(s) : {} }catch(e){} return {} })()
    // If a current password exists, verify it
    if (stored.password && credentials.value.currentPassword !== stored.password){ alert('Current password is incorrect'); return }
    if (credentials.value.newPassword && credentials.value.newPassword !== credentials.value.confirmPassword){ alert('New passwords do not match'); return }
    const toSave = { username: credentials.value.username, password: credentials.value.newPassword || stored.password || '' }
    localStorage.setItem(credentialsKey, JSON.stringify(toSave))
    credentials.value.currentPassword = ''
    credentials.value.newPassword = ''
    credentials.value.confirmPassword = ''
    alert('Credentials saved')
  }catch(e){}
}

// preferences storage removed

onMounted(()=>{ loadProfile(); loadCredentials() })
</script>

<style scoped>
.stakeholder-layout { display:flex; align-items:flex-start }
.settings-page { padding:28px; flex:1; padding-top: calc(var(--header-height,64px) + 28px); background: #f3f4f6 }
.muted { color:#6b7280 }
.settings-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px }
.card { background:#fff; padding:18px; border-radius:12px; margin-top:12px; box-shadow: 0 6px 18px rgba(16,24,40,0.06) }
.form-row { display:flex; gap:12px; align-items:center; margin-bottom:12px }
.form-row label { width:130px; color:#374151 }
.input { flex:1; padding:10px 12px; border:1px solid #e5e7eb; border-radius:8px; outline:none }
.input:focus { border-color:#0ea5a4; box-shadow:0 0 0 3px rgba(14,165,164,0.08) }
.actions { display:flex; justify-content:flex-end; margin-top:8px }
.btn-primary { background:#0ea5a4; color:#fff; padding:8px 14px; border-radius:10px; border:none; cursor:pointer }
.btn-primary:hover { filter:brightness(0.95) }
/* ensure single-column on narrow screens */
@media (max-width:900px){ .stakeholder-layout{ flex-direction:column } .settings-page{ padding-left:16px } .settings-grid{ grid-template-columns:1fr } .form-row label{ width:110px } }
</style>
