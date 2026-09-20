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
import StakeholderMenu from '../components/StakeholderMenu.vue'

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

<style scoped src="./Settings.css"></style>
