<template>
  <div class="layout min-h-screen bg-slate-50">
    <TreasurerMenu />

    <!-- ========================= -->
    <!-- MAIN CONTENT -->
    <!-- ========================= -->
    <main class="page-container">
      <MarketReports
        mode="treasurer"
        initial-tab="collection"
      />
    </main>
  </div>
</template>

<script>
import TreasurerMenu from "../components/TreasurerMenu.vue";
import MarketReports from "../components/reports/MarketReports.vue";

export default {
  name: "TreasurerReports",

  components: {
    TreasurerMenu,
    MarketReports
  }
};
</script>

<style scoped src="../styles/Treasurer/Report.css"></style>
