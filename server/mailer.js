import nodemailer from 'nodemailer'

/**
 * ==============================================================================
 * AUTOMATED SYSTEM EMAIL DISPATCHER (NO GOOGLE APP PASSWORD REQUIRED)
 * ==============================================================================
 * Dispatches municipal notifications automatically using:
 * 1. Resend API (Primary modern HTTP auto-sender, zero SMTP/password config needed)
 * 2. Brevo API (Secondary HTTP auto-sender)
 * 3. Standard SMTP Server (Custom municipal or institutional mail relay)
 * 4. Ethereal Test Inbox (Zero-config local sandbox fallback)
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
    console.log(`[Auto-Sender SMTP] Transporter initialized for ${host}:${port} (${user})`)
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
    console.log(`[Auto-Sender] Initialized test mailbox: ${testAccount.user}`)
    return { transporter, isTestAccount, config: transporterConfig }
  } catch (err) {
    console.warn('[Auto-Sender] Could not create Ethereal test account, using JSON stream transporter:', err.message)
    transporter = nodemailer.createTransport({
      jsonTransport: true
    })
    isTestAccount = true
    return { transporter, isTestAccount, config: { host: 'json-fallback' } }
  }
}

/**
 * Dispatch an email to a real recipient.
 * Automatically tries modern HTTP Email APIs (Resend, Brevo) first before falling back to SMTP.
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

  // =========================================================================
  // 1. RESEND API AUTO-SENDER (NO GOOGLE APP PASSWORD NEEDED)
  // =========================================================================
  const resendApiKey = (process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || '').trim()
  if (resendApiKey) {
    try {
      const resendFrom = from ||
        process.env.RESEND_FROM ||
        process.env.VITE_RESEND_FROM ||
        'Office of the Market Supervisor <onboarding@resend.dev>'

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [targetEmail],
          subject: emailSubject,
          html: emailHtml,
          text: emailText
        })
      })

      const data = await res.json()
      if (res.ok && data?.id) {
        console.log(`[Auto-Sender: Resend] Dispatched directly to ${targetEmail} (ID: ${data.id})`)
        return {
          success: true,
          messageId: data.id,
          provider: 'resend',
          recipient: targetEmail,
          subject: emailSubject,
          transport: 'resend-api'
        }
      } else {
        console.warn('[Auto-Sender: Resend] API returned non-200:', data)
      }
    } catch (resendErr) {
      console.warn('[Auto-Sender: Resend] Network error, trying fallback:', resendErr.message)
    }
  }

  // =========================================================================
  // 2. BREVO API AUTO-SENDER (NO GOOGLE APP PASSWORD NEEDED)
  // =========================================================================
  const brevoApiKey = (process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY || '').trim()
  if (brevoApiKey) {
    try {
      const brevoFrom = process.env.BREVO_FROM || 'notifications@manticao-market.gov.ph'
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Office of the Market Supervisor', email: brevoFrom },
          to: [{ email: targetEmail, name: recipientName || targetEmail }],
          subject: emailSubject,
          htmlContent: emailHtml,
          textContent: emailText
        })
      })

      const data = await res.json()
      if (res.ok && (data?.messageId || data?.id)) {
        const msgId = data.messageId || data.id
        console.log(`[Auto-Sender: Brevo] Dispatched directly to ${targetEmail} (ID: ${msgId})`)
        return {
          success: true,
          messageId: msgId,
          provider: 'brevo',
          recipient: targetEmail,
          subject: emailSubject,
          transport: 'brevo-api'
        }
      } else {
        console.warn('[Auto-Sender: Brevo] API returned non-200:', data)
      }
    } catch (brevoErr) {
      console.warn('[Auto-Sender: Brevo] Network error, trying fallback:', brevoErr.message)
    }
  }

  // =========================================================================
  // 3. NODEMAILER SMTP / ETHEREAL FALLBACK
  // =========================================================================
  const { transporter: activeTransporter, isTestAccount: isTest } = await getTransporter()

  const defaultFrom = process.env.SMTP_FROM ||
    process.env.VITE_SMTP_FROM ||
    '"Office of the Market Supervisor - Municipality of Manticao" <noreply@manticao-market.gov.ph>'

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

  console.log(`[Nodemailer] Email sent successfully to ${targetEmail} (Message ID: ${info.messageId})`)

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
    isTestAccount: isTest,
    recipient: targetEmail,
    subject: emailSubject,
    transport: isTest ? 'ethereal-test' : 'smtp'
  }
}

/**
 * Verify transporter connectivity or active auto-sender service
 */
export async function verifyTransporter() {
  const resendApiKey = (process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || '').trim()
  if (resendApiKey) {
    return {
      connected: true,
      provider: 'resend',
      mode: 'Resend Email API (No Google App Password required)'
    }
  }

  const brevoApiKey = (process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY || '').trim()
  if (brevoApiKey) {
    return {
      connected: true,
      provider: 'brevo',
      mode: 'Brevo Email API (No Google App Password required)'
    }
  }

  const { transporter: activeTransporter, isTestAccount: isTest, config } = await getTransporter()
  try {
    await activeTransporter.verify()
    return {
      connected: true,
      isTestAccount: isTest,
      host: config.host,
      port: config.port,
      mode: isTest ? 'Ethereal Test Sandbox' : 'Custom SMTP Server'
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

