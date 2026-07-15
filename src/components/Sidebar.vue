<template>
  <aside class="sidebar">
    <nav class="menu">
      <RouterLink
        v-for="item in menu"
        :key="item.name"
        :to="item.route"
        class="menu-item"
        active-class="active"
      >
        <span class="icon">{{ item.icon }}</span>
        <span class="label">{{ item.name }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
const menu = [
  { name: "Stakeholder Management", route: "/", icon: "👥" },
  { name: "Billings", route: "/treasurer/billing", icon: "💵" },
  { name: "Payments", route: "/treasurer/payment", icon: "💲" },
  { name: "Reports", route: "/treasurer/report", icon: "📊" },
  { name: "Notifications", route: "/notifications", icon: "🔔" },
  { name: "Audit Logs", route: "/audit-logs", icon: "🧾" },
];
</script>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  padding: 16px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* STRAIGHT-LINED BUTTONS */
.menu-item {
  display: flex;
  align-items: center;         /* 🔑 keeps everything straight */
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  color: #374151;
  text-decoration: none;
  font-weight: 500;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item.active {
  background: #eaf2ff;
  color: #2563eb;
}

.icon {
  width: 24px;                /* 🔑 same width for all icons */
  text-align: center;
  font-size: 18px;
}

.label {
  white-space: nowrap;
}
</style>
