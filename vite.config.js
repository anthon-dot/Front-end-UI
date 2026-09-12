import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('chart.js')) {
              return 'chartjs'
            }
            if (id.includes('primevue/datatable') || id.includes('primevue/column')) {
              return 'primevue-table'
            }
            if (
              id.includes('primevue/dialog') ||
              id.includes('primevue/select') ||
              id.includes('primevue/button') ||
              id.includes('primevue/input') ||
              id.includes('primevue/tag') ||
              id.includes('primevue/card')
            ) {
              return 'primevue-form'
            }
            if (id.includes('primevue')) {
              return 'primevue-core'
            }
            if (
              id.includes('vue') ||
              id.includes('vue-router') ||
              id.includes('pinia') ||
              id.includes('axios')
            ) {
              return 'vendor'
            }
          }
        }
      }
    }
  }
})
