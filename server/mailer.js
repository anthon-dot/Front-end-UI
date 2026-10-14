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

export async function getTransporter() {
  if (transporter) {
    return { transporter, config: transporterConfig }
  }

  const host = process.env.SMTP_HOST || process.env.VITE_SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT || process.env.VITE_SMTP_PORT || 587)
  const secure = (process.env.SMTP_SECURE || process.env.VITE_SMTP_SECURE) === 'true' || port === 465
  const user = (process.env.SMTP_USER || process.env.VITE_SMTP_USER || 'anthony.jamaca@msunaawan.edu.ph').trim()
  const pass = (process.env.SMTP_PASS || process.env.VITE_SMTP_PASS || '').trim()

  if (!pass) {
    throw new Error(
      `SMTP password (SMTP_PASS) is not configured. Real email delivery to external recipients requires authentication. ` +
      `Please configure SMTP_PASS in your Vercel Project Settings (Environment Variables) or .env file.`
    )
  }

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
  console.log(`[Nodemailer SMTP] Real transporter connected to ${host}:${port} (${user})`)
  return { transporter, config: transporterConfig }
}

/**
 * Dispatch an email strictly using Nodemailer to a real recipient.
 *
 * @param {Object} options
 * @param {string} options.to - Real recipient email address
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

  const { transporter: activeTransporter } = await getTransporter()

  const defaultFrom = process.env.SMTP_FROM ||
    process.env.VITE_SMTP_FROM ||
    `"Office of the Market Supervisor - Municipality of Manticao" <${process.env.SMTP_USER || 'anthony.jamaca@msunaawan.edu.ph'}>`

  const mailOptions = {
    from: from || defaultFrom,
    to: recipientName ? `"${recipientName}" <${targetEmail}>` : targetEmail,
    subject: emailSubject,
    text: emailText,
    html: emailHtml
  }

  const info = await activeTransporter.sendMail(mailOptions)

  console.log(`[Nodemailer] Real email dispatched to "${targetEmail}" (Message ID: ${info.messageId})`)

  return {
    success: true,
    messageId: info.messageId,
    sender: mailOptions.from,
    recipient: targetEmail,
    subject: emailSubject,
    transport: 'nodemailer-smtp'
  }
}

/**
 * Verify transporter connectivity
 */
export async function verifyTransporter() {
  try {
    const { transporter: activeTransporter, config } = await getTransporter()
    await activeTransporter.verify()
    return {
      connected: true,
      host: config.host,
      port: config.port,
      sender: process.env.SMTP_USER || 'anthony.jamaca@msunaawan.edu.ph',
      mode: 'Nodemailer SMTP (Real Delivery)'
    }
  } catch (err) {
    return {
      connected: false,
      error: err.message,
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      sender: process.env.SMTP_USER || 'anthony.jamaca@msunaawan.edu.ph'
    }
  }
}

export default {
  getTransporter,
  sendEmail,
  verifyTransporter
}


