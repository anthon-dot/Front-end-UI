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

<style scoped src="../styles/components/Notification.css"></style>
