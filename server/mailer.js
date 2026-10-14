import nodemailer from 'nodemailer'

/**
 * ==============================================================================
 * NODEMAILER TRANSPORTER CONFIGURATION
 * ==============================================================================
 * Connects to standard SMTP services (Gmail, Brevo, Outlook, Mailtrap, AWS SES, etc.)
 * or creates an automated test account (Ethereal) when credentials are not supplied.
 */

let transporter = null
let transporterConfig = null
let isTestAccount = false

export async function getTransporter() {
  if (transporter) {
    return { transporter, isTestAccount, config: transporterConfig }
  }

  const host = process.env.SMTP_HOST || process.env.VITE_SMTP_HOST || ''
  const port = Number(process.env.SMTP_PORT || process.env.VITE_SMTP_PORT || 587)
  const secure = (process.env.SMTP_SECURE || process.env.VITE_SMTP_SECURE) === 'true' || port === 465
  const user = process.env.SMTP_USER || process.env.VITE_SMTP_USER || ''
  const pass = process.env.SMTP_PASS || process.env.VITE_SMTP_PASS || ''

  // If real SMTP credentials are provided, use them
  if (host && user && pass) {
    transporterConfig = {
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    }
    transporter = nodemailer.createTransport(transporterConfig)
    isTestAccount = false
    console.log(`[Nodemailer] Transporter initialized for ${host}:${port} (${user})`)
    return { transporter, isTestAccount, config: transporterConfig }
  }

  // Fallback: Create ethereal test account for seamless zero-config local testing
  try {
    const testAccount = await nodemailer.createTestAccount()
    transporterConfig = {
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    }
    transporter = nodemailer.createTransport(transporterConfig)
    isTestAccount = true
    console.log(`[Nodemailer] Initialized Ethereal test account: ${testAccount.user}`)
    return { transporter, isTestAccount, config: transporterConfig }
  } catch (err) {
    console.warn('[Nodemailer] Could not create Ethereal test account, using JSON stream transporter:', err.message)
    transporter = nodemailer.createTransport({
      jsonTransport: true
    })
    isTestAccount = true
    return { transporter, isTestAccount, config: { host: 'json-fallback' } }
  }
}

/**
 * Send an email using Nodemailer.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} [options.recipientName] - Recipient full name
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Rich HTML email body
 * @param {string} [options.text] - Plaintext fallback
 * @param {string} [options.from] - Custom sender address
 */
export async function sendEmail({ to, recipientName, subject, html, text, from }) {
  if (!to || !to.trim()) {
    throw new Error('Recipient email address ("to") is required.')
  }

  const { transporter: activeTransporter, isTestAccount: isTest } = await getTransporter()

  const defaultFrom = process.env.SMTP_FROM ||
    process.env.VITE_SMTP_FROM ||
    '"Office of the Market Supervisor - Municipality of Manticao" <noreply@manticao-market.gov.ph>'

  const mailOptions = {
    from: from || defaultFrom,
    to: recipientName ? `"${recipientName}" <${to.trim()}>` : to.trim(),
    subject: subject || 'Municipal Market Administration Notification',
    text: text || subject,
    html: html || `<p>${text || subject}</p>`
  }

  const info = await activeTransporter.sendMail(mailOptions)

  let previewUrl = null
  if (isTest && nodemailer.getTestMessageUrl) {
    previewUrl = nodemailer.getTestMessageUrl(info)
    console.log(`[Nodemailer Preview URL]: ${previewUrl}`)
  }

  console.log(`[Nodemailer] Email sent successfully to ${to} (Message ID: ${info.messageId})`)

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
    isTestAccount: isTest,
    recipient: to.trim(),
    subject
  }
}

/**
 * Verify transporter connectivity
 */
export async function verifyTransporter() {
  const { transporter: activeTransporter, isTestAccount: isTest, config } = await getTransporter()
  try {
    await activeTransporter.verify()
    return {
      connected: true,
      isTestAccount: isTest,
      host: config.host,
      port: config.port
    }
  } catch (err) {
    return {
      connected: false,
      error: err.message,
      isTestAccount: isTest,
      host: config.host
    }
  }
}

export default {
  getTransporter,
  sendEmail,
  verifyTransporter
}
