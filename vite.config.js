import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function nodemailerDevPlugin() {
  return {
    name: 'vite-plugin-nodemailer',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/email')) {
          return next()
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

        if (req.method === 'GET' && url.pathname === '/api/email/status') {
          try {
            const { verifyTransporter } = await import('./server/mailer.js')
            const status = await verifyTransporter()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ status: 'online', service: 'Vite Nodemailer Dev Plugin', ...status }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
          return
        }

        if (req.method === 'POST' && url.pathname === '/api/email/send') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', async () => {
            try {
              const payload = body ? JSON.parse(body) : {}
              const { sendEmail } = await import('./server/mailer.js')
              const result = await sendEmail(payload)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, ...result }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
          return
        }

        if (req.method === 'POST' && url.pathname === '/api/email/test') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', async () => {
            try {
              const payload = body ? JSON.parse(body) : {}
              const { sendEmail } = await import('./server/mailer.js')
              const target = payload.to || 'stakeholder-test@example.com'
              const result = await sendEmail({
                to: target,
                recipientName: 'Stakeholder Test',
                subject: 'Manticao Public Market - Test Stakeholder Notification',
                html: '<p>Test email dispatched via Nodemailer in Vite dev server.</p>',
                text: 'Test email dispatched via Nodemailer in Vite dev server.'
              })
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, ...result }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
          return
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), nodemailerDevPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        bypass(req) {
          if (req.url?.startsWith('/api/email')) {
            return req.url;
          }
        }
      }
    }
  },
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
