import nodemailer from 'nodemailer'

/**
 * ==============================================================================
 * NODEMAILER EMAIL DISPATCHER
 * ==============================================================================
 * Dispatches official municipal notifications strictly using Nodemailer SMTP.
 * Configured with university sender: anthony.jamaca@msunaawan.edu.ph
 */

let transporter = null
let transporterConfig = null
let isTestAccount = false

export async function getTransporter() {
  if (transporter) {
    return { transporter, isTestAccount, config: transporterConfig }
  }

  const host = process.env.SMTP_HOST || process.env.VITE_SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT || process.env.VITE_SMTP_PORT || 587)
  const secure = (process.env.SMTP_SECURE || process.env.VITE_SMTP_SECURE) === 'true' || port === 465
  const user = process.env.SMTP_USER || process.env.VITE_SMTP_USER || 'anthony.jamaca@msunaawan.edu.ph'
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
    console.log(`[Nodemailer SMTP] Transporter initialized for ${host}:${port} (${user})`)
    return { transporter, isTestAccount, config: transporterConfig }
  }

  // Fallback: Create ethereal test account for local testing if SMTP_PASS is not yet provided
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
    console.log(`[Nodemailer] Running in local test sandbox. Configured sender: ${user}`)
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
 * Dispatch an email strictly using Nodemailer.
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

  const targetEmail = to.trim()
  const emailSubject = subject || 'Municipal Market Administration Notification'
  const emailHtml = html || `<p>${text || subject}</p>`
  const emailText = text || subject

  const { transporter: activeTransporter, isTestAccount: isTest } = await getTransporter()

  const defaultFrom = process.env.SMTP_FROM ||
    process.env.VITE_SMTP_FROM ||
    '"Office of the Market Supervisor - Municipality of Manticao" <anthony.jamaca@msunaawan.edu.ph>'

  const mailOptions = {
    from: from || defaultFrom,
    to: recipientName ? `"${recipientName}" <${targetEmail}>` : targetEmail,
    subject: emailSubject,
    text: emailText,
    html: emailHtml
  }

  const info = await activeTransporter.sendMail(mailOptions)

  let previewUrl = null
  if (isTest && nodemailer.getTestMessageUrl) {
    previewUrl = nodemailer.getTestMessageUrl(info)
    console.log(`[Nodemailer Preview URL]: ${previewUrl}`)
  }

  console.log(`[Nodemailer] Email dispatched from "${mailOptions.from}" to "${targetEmail}" (Message ID: ${info.messageId})`)

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
    isTestAccount: isTest,
    sender: defaultFrom,
    recipient: targetEmail,
    subject: emailSubject,
    transport: isTest ? 'nodemailer-ethereal-test' : 'nodemailer-smtp'
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
      port: config.port,
      sender: process.env.SMTP_USER || 'anthony.jamaca@msunaawan.edu.ph',
      mode: isTest ? 'Nodemailer Ethereal Sandbox' : 'Nodemailer Real SMTP'
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


