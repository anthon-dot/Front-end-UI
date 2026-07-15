<template>
  <div class="notification">
    <button class="bell" @click="toggle" aria-label="Notifications">
      <svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 17H9l-1 1v1h8v-1l-1-1z" fill="currentColor"/><path d="M12 3a4 4 0 00-4 4v2.1c0 .8-.4 1.6-1.1 2.1L5 13h14l-0.9-1.8c-.7-.5-1.1-1.3-1.1-2.1V7a4 4 0 00-4-4z" fill="currentColor"/></svg>
      <span v-if="unreadCount" class="badge">{{ unreadCount }}</span>
    </button>

    <transition name="fade">
      <div v-if="open" class="dropdown" @click.stop>
        <div class="top">
          <div class="title">Notifications</div>
          <button class="mark-all" @click="$emit('mark-all')">Mark all read</button>
        </div>

        <div v-if="notifications.length === 0" class="empty">You're all caught up 🎉</div>

        <ul>
          <li v-for="n in normalizedNotifications" :key="n.id" :class="{ unread: !n.read }" @click="$emit('mark-read', n.id)">
            <div class="left">
              <div class="dot" :class="{ unread: !n.read }"></div>
            </div>
            <div class="body">
              <div class="message">{{ n.message }}</div>
              <div class="meta">{{ n.date }}</div>
            </div>
            <div class="action">
              <button v-if="!n.read" @click.stop="$emit('mark-read', n.id)">Mark</button>
            </div>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
const props = defineProps({ notifications: { type: Array, default: () => [] } })
const emits = defineEmits(['mark-read','mark-all'])
const open = ref(false)
function toggle(){ open.value = !open.value }
const normalizedNotifications = computed(() => (props.notifications || []).map((n) => ({
  ...n,
  read: n.read ?? n.isRead ?? false,
  date: n.date || (n.createdAt ? new Date(n.createdAt).toLocaleString() : '')
})))
const unreadCount = computed(()=> normalizedNotifications.value.filter(n => !n.read).length)
</script>

<style scoped>
.notification { position:relative }
.bell { background:transparent; border:0; color:var(--surface-text); cursor:pointer; position:relative; padding:8px; display:inline-flex; align-items:center }
.icon { width:20px; height:20px }
.badge { background:var(--danger); color:white; border-radius:999px; padding:3px 7px; font-size:0.75rem; position:absolute; top:-6px; right:-6px; box-shadow:0 6px 18px rgba(2,6,23,0.4) }
.dropdown { position:absolute; right:0; top:44px; width:360px; background:var(--card); border-radius:12px; box-shadow:0 18px 60px rgba(2,6,23,0.8); padding:14px; z-index:9999; border:1px solid rgba(255,255,255,0.03) }
.top { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px }
.title { font-weight:700; color:var(--surface-text) }
.mark-all { background:transparent; border:0; color:var(--muted); cursor:pointer; font-weight:600 }
.empty { color:var(--muted); padding:18px; text-align:center; font-size:0.98rem }
ul { list-style:none; margin:0; padding:0; max-height:320px; overflow:auto; display:flex; flex-direction:column; gap:8px }
li { display:flex; align-items:flex-start; gap:12px; padding:12px; border-radius:12px; cursor:pointer; transition:background 0.16s ease, transform 0.16s ease }
li:hover { transform:translateY(-2px); background: rgba(37,99,235,0.06) }
li.unread { background: linear-gradient(90deg, rgba(37,99,235,0.10), rgba(20,184,166,0.08)) }
.left { width:12px; display:flex; align-items:flex-start }
.dot { width:12px; height:12px; border-radius:999px; background:rgba(255,255,255,0.14) }
.dot.unread { background: linear-gradient(90deg,var(--accent),var(--accent-2)); box-shadow:0 6px 18px rgba(12,8,40,0.36) }
.body { flex:1 }
.message { color:var(--surface-text); font-weight:700; font-size:1rem }
.meta { color:var(--muted); font-size:0.88rem; margin-top:6px }
.action button { background:transparent; border:0; color:var(--accent-2); cursor:pointer; font-weight:700 }
.fade-enter-active, .fade-leave-active { transition: opacity 0.12s }
.fade-enter-from, .fade-leave-to { opacity:0 }
</style>
