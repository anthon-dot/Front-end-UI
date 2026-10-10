<template>
  <div class="notification">
    <button class="bell" @click="toggle" aria-label="Notifications">
      <i class="pi pi-bell text-lg bell-icon"></i>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({ notifications: { type: Array, default: () => [] } })
const emits = defineEmits(['mark-read', 'mark-all'])

const open = ref(false)
function toggle() { open.value = !open.value }

function closeOnClickOutside(e) {
  if (open.value && !e.target.closest('.notification')) {
    open.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', closeOnClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', closeOnClickOutside)
})

const normalizedNotifications = computed(() => (props.notifications || []).map((n) => ({
  ...n,
  read: n.read ?? n.isRead ?? false,
  date: n.date || (n.createdAt ? new Date(n.createdAt).toLocaleString() : '')
})))

const unreadCount = computed(() => normalizedNotifications.value.filter(n => !n.read).length)
</script>

<style scoped src="../styles/components/Notification.css"></style>
