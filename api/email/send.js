import { sendEmail, verifyTransporter } from '../../server/mailer.js'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'GET') {
    try {
      const status = await verifyTransporter()
      return res.status(200).json({ status: 'online', ...status })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { to, recipientName, subject, html, text, from, notificationType, stakeholderId, metadata } = req.body

  if (!to) {
    return res.status(400).json({
      success: false,
      error: 'Recipient email address ("to") is required.'
    })
  }

  try {
    const result = await sendEmail({
      to,
      recipientName,
      subject,
      html,
      text,
      from
    })

    return res.status(200).json({
      success: true,
      ...result,
      notificationType,
      stakeholderId,
      metadata
    })
  } catch (err) {
    console.error('[api/email/send] Error sending email:', err)
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to dispatch email via Nodemailer.'
    })
  }
}
