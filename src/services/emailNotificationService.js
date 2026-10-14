import { supabase } from '../config/supabase.js'

/**
 * ==============================================================================
 * STAKEHOLDER EMAIL NOTIFICATION SERVICE
 * ==============================================================================
 * Dispatches official municipal notifications via email to the email attached
 * to that particular stakeholder for:
 * 1. Application Progress Updates (Submission, Stage Approvals, Rejections, Activation)
 * 2. Billing Due Soon Notices & Overdue Statements
 * 3. Contract Expiration & Lease Renewal Notices (Due Soon: <= 30/60/90 days)
 *
 * Integrates directly with:
 * - Supabase Edge Functions ('approval-workflow' / 'send-email')
 * - In-app Notifications ('public.notifications')
 * - System Audit Logs ('public.audit_logs')
 */

const MUNICIPAL_LOGO_ALT = 'Municipality of Manticao'
const MUNICIPAL_OFFICE_TITLE = 'Office of the Market Supervisor'
const MUNICIPAL_ADDRESS = 'Municipal Public Market Administration, Poblacion, Manticao, Misamis Oriental, 9024'

/**
 * Resolve the email address and contact details attached to a particular stakeholder.
 * Checks stakeholders -> business_applications -> profiles.
 */
export async function resolveStakeholderContact(stakeholderId, userId = null) {
  let email = ''
  let fullName = ''
  let firstName = ''
  let lastName = ''
  let businessName = ''
  let contact = ''
  let stallNo = ''
  let resolvedUserId = userId
  let resolvedStakeholderId = stakeholderId

  // 1. Check stakeholders table
  if (stakeholderId) {
    try {
      const { data: st } = await supabase
        .from('stakeholders')
        .select('*, stall:stalls(*), occupant:occupants(*, stall:stalls(*))')
        .eq('id', Number(stakeholderId))
        .maybeSingle()

      if (st) {
        email = (st.email || '').trim()
        firstName = st.first_name || st.firstName || ''
        lastName = st.last_name || st.lastName || ''
        fullName = `${firstName} ${lastName}`.trim() || st.name || st.business_name || 'Stakeholder'
        businessName = st.business_name || st.businessName || ''
        contact = st.contact || ''
        resolvedUserId = resolvedUserId || st.user_id
        stallNo = st.stall?.stall_no || st.stall?.number || st.occupant?.stall?.stall_no || ''
      }
    } catch (err) {
      console.warn('[emailNotificationService] Error querying stakeholder:', err)
    }
  }

  // 2. Fallback to business_applications if email is missing
  if (!email && (resolvedUserId || stakeholderId)) {
    try {
      let query = supabase.from('business_applications').select('*').limit(1)
      if (resolvedUserId) {
        query = query.eq('user_id', resolvedUserId)
      } else {
        query = query.eq('id', Number(stakeholderId))
      }
      const { data: appData } = await query.maybeSingle()

      if (appData) {
        if (!email) email = (appData.email || '').trim()
        if (!firstName) firstName = appData.first_name || appData.firstName || ''
        if (!lastName) lastName = appData.last_name || appData.lastName || ''
        if (!fullName) fullName = `${firstName} ${lastName}`.trim() || appData.business_name || 'Stakeholder'
        if (!businessName) businessName = appData.business_name || ''
        if (!contact) contact = appData.contact || ''
      }
    } catch (err) {
      console.warn('[emailNotificationService] Error querying business_applications:', err)
    }
  }

  // 3. Fallback to profiles table
  if (!email && resolvedUserId) {
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', resolvedUserId)
        .maybeSingle()

      if (prof) {
        if (!email) email = (prof.email || '').trim()
        if (!fullName) fullName = prof.name || prof.username || 'Stakeholder'
      }
    } catch (err) {
      console.warn('[emailNotificationService] Error querying profiles:', err)
    }
  }

  return {
    stakeholderId: resolvedStakeholderId,
    userId: resolvedUserId,
    email: email || '',
    fullName: fullName || 'Valued Stakeholder',
    firstName,
    lastName,
    businessName,
    contact,
    stallNo
  }
}

/**
 * Common HTML email header template with responsive municipal branding.
 */
function renderEmailHeader(categoryTitle, subtitle) {
  return `
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0; color: #ffffff;">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #f59e0b; margin-bottom: 6px;">
        Republic of the Philippines &bull; Province of Misamis Oriental
      </div>
      <h1 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
        MUNICIPALITY OF MANTICAO
      </h1>
      <div style="font-size: 13px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
        ${MUNICIPAL_OFFICE_TITLE}
      </div>
      <div style="margin-top: 16px; display: inline-block; padding: 4px 14px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 20px; font-size: 12px; font-weight: 700; color: #fbbf24;">
        ${categoryTitle}
      </div>
      ${subtitle ? `<div style="font-size: 13px; color: #cbd5e1; margin-top: 8px;">${subtitle}</div>` : ''}
    </div>
  `
}

/**
 * Common HTML email footer template.
 */
function renderEmailFooter(recipientEmail) {
  return `
    <div style="background-color: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6; text-align: center;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #334155;">
        ${MUNICIPAL_ADDRESS}
      </p>
      <p style="margin: 0 0 12px 0;">
        This is an official automated municipal transmission sent directly to the email address attached to your account:
        <strong style="color: #0f172a;">${recipientEmail}</strong>
      </p>
      <div style="font-size: 11px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 12px;">
        For inquiries or assistance, visit the Market Supervisor's Office during official hours (Monday–Friday, 8:00 AM – 5:00 PM).
      </div>
    </div>
  `
}

/**
 * Generates responsive HTML email for Stakeholder Application Progress.
 */
export function buildApplicationProgressEmail({
  applicantName,
  applicantEmail,
  stage,
  status,
  title,
  message,
  remarks,
  referenceNo,
  stallNo,
  actionUrl = 'https://manticao-market.gov.ph/application-progress'
}) {
  const isApproved = ['APPROVED', 'COMPLETED', 'ACTIVE', 'ENDORSED'].includes(String(status).toUpperCase())
  const isRejected = ['REJECTED', 'DISAPPROVED'].includes(String(status).toUpperCase())
  
  const statusColor = isRejected ? '#dc2626' : (isApproved ? '#059669' : '#0284c7')
  const statusBg = isRejected ? '#fef2f2' : (isApproved ? '#ecfdf5' : '#f0f9ff')
  const statusBorder = isRejected ? '#fecaca' : (isApproved ? '#a7f3d0' : '#bae6fd')

  const stageTitles = {
    SUBMISSION: 'Application Form Submission',
    TREASURER: 'Treasurer Advance Payment & Verification',
    MARKET_SUPERVISOR: 'Market Supervisor Review & Stall Allocation',
    STALL_ASSIGNMENT: 'Market Stall Assignment',
    BPLO: 'BPLO Business Permit Validation',
    ENDORSEMENT: 'Mayoral / Office Final Endorsement',
    PERMIT_PAYMENT: 'Business Permit Fee Settlement & Onboarding',
    COMPLETED: 'Lease Contract Activation'
  }
  const displayStage = stageTitles[stage] || stage || 'Multi-Stage Review'

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || 'Application Progress Update'}</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
        ${renderEmailHeader('Application Progress Update', `Reference: ${referenceNo || 'N/A'}`)}

        <div style="padding: 32px 28px;">
          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-size: 15px; color: #475569;">Dear <strong style="color: #0f172a;">${applicantName}</strong>,</p>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #334155;">
              This is an official progress update regarding your commercial stall application with the Municipality of Manticao.
            </p>
          </div>

          <!-- Status Highlight Card -->
          <div style="background-color: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Current Workflow Stage</span>
              <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; background-color: ${statusColor}; color: #ffffff;">
                ${status || 'IN_PROGRESS'}
              </span>
            </div>
            <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
              ${displayStage}
            </div>
            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #334155;">
              ${message || 'Your application progress has been recorded in the municipal workflow registry.'}
            </p>
            ${remarks ? `
              <div style="margin-top: 12px; padding: 10px 14px; background-color: rgba(255, 255, 255, 0.8); border-left: 3px solid ${statusColor}; border-radius: 4px; font-size: 13px; color: #334155;">
                <strong>Official Remarks:</strong> ${remarks}
              </div>
            ` : ''}
          </div>

          <!-- Application Details Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 13px;">
            <tbody>
              ${referenceNo ? `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Application Ref:</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #0f172a; font-family: monospace;">${referenceNo}</td>
                </tr>
              ` : ''}
              ${stallNo ? `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Target / Assigned Stall:</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #0f172a;">Stall No. ${stallNo}</td>
                </tr>
              ` : ''}
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Stakeholder Email:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #0f172a;">${applicantEmail}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Status Updated:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #0f172a;">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            </tbody>
          </table>

          <!-- Action Button -->
          <div style="text-align: center; margin: 32px 0 16px 0;">
            <a href="${actionUrl}" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: 700; font-size: 14px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.3);">
              Track Full Application Progress Online &rarr;
            </a>
          </div>
        </div>

        ${renderEmailFooter(applicantEmail)}
      </div>
    </body>
    </html>
  `
}

/**
 * Generates responsive HTML email for Billing Due Soon & Statement Notices.
 */
export function buildBillingDueEmail({
  stakeholderName,
  stakeholderEmail,
  billingNo,
  stallNo,
  billingPeriod,
  totalAmount,
  balance,
  dueDate,
  isOverdue = false,
  daysRemaining = null
}) {
  const formattedBalance = Number(balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const formattedTotal = Number(totalAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Due Date'
  
  const statusColor = isOverdue ? '#dc2626' : '#d97706'
  const statusBg = isOverdue ? '#fef2f2' : '#fffbeb'
  const statusBorder = isOverdue ? '#fecaca' : '#fde68a'
  const statusBadge = isOverdue ? 'OVERDUE' : (daysRemaining !== null && daysRemaining <= 3 ? 'DUE VERY SOON' : 'DUE SOON')

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Billing Statement Notice - ${billingNo}</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
        ${renderEmailHeader('Official Billing Statement', `Statement: ${billingNo}`)}

        <div style="padding: 32px 28px;">
          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-size: 15px; color: #475569;">Dear <strong style="color: #0f172a;">${stakeholderName}</strong>,</p>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #334155;">
              This is an official billing reminder regarding your market stall rental account with the Municipal Government of Manticao.
            </p>
          </div>

          <!-- Highlight Amount Due Card -->
          <div style="background-color: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 28px;">
            <div style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; background-color: ${statusColor}; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
              ${statusBadge}
            </div>
            <div style="font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
              Outstanding Balance Due
            </div>
            <div style="font-size: 36px; font-weight: 900; color: ${statusColor}; letter-spacing: -1px; margin-bottom: 8px;">
              ₱${formattedBalance}
            </div>
            <div style="font-size: 14px; font-weight: 600; color: #334155;">
              Due on or before: <span style="color: #0f172a; font-weight: 800;">${formattedDueDate}</span>
              ${daysRemaining !== null ? ` (${daysRemaining < 0 ? 'Past Due' : (daysRemaining === 0 ? 'Due Today!' : `${daysRemaining} days remaining`)})` : ''}
            </div>
          </div>

          <!-- Statement Breakdown Table -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin-bottom: 28px;">
            <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
              Statement Breakdown
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tbody>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px 0; color: #475569;">Statement / Invoice No:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a; font-family: monospace;">${billingNo}</td>
                </tr>
                ${stallNo ? `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px 0; color: #475569;">Stall Reference:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a;">Stall No. ${stallNo}</td>
                  </tr>
                ` : ''}
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px 0; color: #475569;">Billing Period:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${billingPeriod || 'Monthly Stall Rental'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px 0; color: #475569;">Total Period Charge:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">₱${formattedTotal}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">Net Payable Balance:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 800; color: ${statusColor}; font-size: 14px;">₱${formattedBalance}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Payment Procedure Callout -->
          <div style="background-color: #ecfdf5; border-left: 4px solid #059669; padding: 14px 18px; border-radius: 4px; font-size: 13px; line-height: 1.6; color: #064e3b; margin-bottom: 24px;">
            <strong>Official Payment Instructions:</strong> Please present your Statement No. (<strong>${billingNo}</strong>) or Stall No. (<strong>${stallNo || 'N/A'}</strong>) at the <strong>Municipal Treasurer's Office, Manticao Municipal Hall</strong>. All municipal market payments are officially receipted in cash. Once processed by the cashier, your online portal will update immediately.
          </div>
        </div>

        ${renderEmailFooter(stakeholderEmail)}
      </div>
    </body>
    </html>
  `
}

/**
 * Generates responsive HTML email for Contract Expiration & Renewal Notices (Due Soon).
 */
export function buildContractDueEmail({
  stakeholderName,
  stakeholderEmail,
  contractNo,
  stallNo,
  stallType,
  monthlyRent,
  endDate,
  daysRemaining,
  urgencyCategory = 'WARNING'
}) {
  const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Lease Expiration Date'
  const formattedRent = Number(monthlyRent || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const isExpired = daysRemaining !== null && daysRemaining <= 0
  const isCritical = daysRemaining !== null && daysRemaining <= 30 && !isExpired

  const badgeColor = isExpired ? '#475569' : (isCritical ? '#dc2626' : '#d97706')
  const badgeBg = isExpired ? '#f1f5f9' : (isCritical ? '#fef2f2' : '#fffbeb')
  const countdownText = isExpired
    ? 'Lease Contract Overdue / Expired'
    : (daysRemaining === 0 ? 'Expires Today!' : `Expiring in ${daysRemaining} Days`)

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Notice of Lease Expiration - Stall ${stallNo || ''}</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
        ${renderEmailHeader('Official Municipal Notice', 'Lease Expiration & Renewal Directive')}

        <div style="padding: 32px 28px;">
          <!-- Formal Republic Notice Header Box -->
          <div style="background-color: ${badgeBg}; border: 1px solid ${isCritical ? '#fecaca' : '#fde68a'}; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; background-color: ${badgeColor}; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
              ${countdownText}
            </div>
            <h2 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 800; color: #0f172a;">
              NOTICE OF LEASE CONTRACT EXPIRATION
            </h2>
            <p style="margin: 0; font-size: 13px; color: #475569;">
              Official communication regarding lease agreement for <strong>Stall No. ${stallNo || 'N/A'}</strong>
            </p>
          </div>

          <div style="margin-bottom: 20px; font-size: 14px; line-height: 1.6; color: #334155;">
            <p style="margin: 0 0 12px 0;">Dear <strong style="color: #0f172a;">${stakeholderName}</strong>,</p>
            <p style="margin: 0 0 12px 0;">
              Please be advised that your municipal market stall lease agreement (Ref: <strong>${contractNo || 'N/A'}</strong>) for
              <strong>Stall No. ${stallNo || 'N/A'}</strong> (${stallType || 'Standard Commercial Stall'}) is scheduled to officially expire on:
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; text-align: center; font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">
              ${formattedEndDate}
            </div>
            <p style="margin: 0;">
              To ensure uninterrupted commercial operations and avoid stall re-allocation or vacancy declaration pursuant to municipal ordinances, you are respectfully requested to file your lease contract renewal at the Market Supervisor's Office prior to the expiration date.
            </p>
          </div>

          <!-- Requirements Checklist -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
              Required Renewal Documents
            </div>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7;">
              <li>Valid Government-Issued Identification</li>
              <li>Updated Barangay Clearance & Business Permit</li>
              <li>Latest Receipts of monthly rental settlement (₱${formattedRent}/month)</li>
              <li>Duly accomplished Municipal Lease Renewal Application Form</li>
            </ul>
          </div>

          <!-- Contact Notice -->
          <div style="background-color: #eff6ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #1e40af; line-height: 1.5;">
            <strong>Renewal Office:</strong> Office of the Market Supervisor, Municipal Public Market Administration, Manticao, Misamis Oriental.
          </div>
        </div>

        ${renderEmailFooter(stakeholderEmail)}
      </div>
    </body>
    </html>
  `
}

/**
 * Low-level dispatch function: Invokes Supabase Edge Function with action 'send_email',
 * inserts into 'public.notifications', and records into 'public.audit_logs'.
 */
export async function sendStakeholderEmail({
  stakeholderId,
  userId = null,
  email = null,
  recipientName = null,
  subject,
  html,
  text = null,
  notificationType = 'GENERAL_NOTICE',
  relatedRecordType = null,
  relatedRecordId = null,
  metadata = {}
}) {
  try {
    // 1. Resolve recipient details if not fully provided
    let targetEmail = email
    let targetName = recipientName
    let resolvedStallNo = metadata?.stallNo || ''

    if (!targetEmail || !targetName) {
      const contactInfo = await resolveStakeholderContact(stakeholderId, userId)
      targetEmail = targetEmail || contactInfo.email
      targetName = targetName || contactInfo.fullName
      resolvedStallNo = resolvedStallNo || contactInfo.stallNo
    }

    if (!targetEmail) {
      console.warn(`[emailNotificationService] No email address attached to stakeholder #${stakeholderId}. In-app notification will still be registered.`)
    }

    // 2. Dispatch via Supabase Edge Function ('approval-workflow' / 'send-email')
    let edgeFunctionResponse = null
    try {
      const { data, error } = await supabase.functions.invoke('approval-workflow', {
        body: {
          action: 'send_email',
          to: targetEmail,
          recipientName: targetName,
          subject,
          html,
          text: text || subject,
          notificationType,
          stakeholderId: stakeholderId ? Number(stakeholderId) : null,
          relatedRecordType,
          relatedRecordId: relatedRecordId ? Number(relatedRecordId) : null,
          metadata
        }
      })
      if (error) {
        console.warn('[emailNotificationService] Edge function invoke warning:', error.message)
      } else {
        edgeFunctionResponse = data
      }
    } catch (edgeErr) {
      console.warn('[emailNotificationService] Edge function call bypassed:', edgeErr.message)
    }

    // 3. Register in 'public.notifications' so the stakeholder sees it in their notification center
    if (stakeholderId) {
      try {
        await supabase.from('notifications').insert({
          stakeholder_id: Number(stakeholderId),
          title: subject,
          message: text || subject,
          priority: notificationType.includes('EXPIRATION') || notificationType.includes('OVERDUE') ? 'HIGH' : 'MEDIUM',
          notification_type: notificationType,
          related_record_type: relatedRecordType,
          related_record_id: relatedRecordId ? Number(relatedRecordId) : null,
          is_read: false
        })
      } catch (notifErr) {
        console.warn('[emailNotificationService] Could not insert in notifications table:', notifErr.message)
      }
    }

    // 4. Record in 'public.audit_logs'
    try {
      await supabase.from('audit_logs').insert({
        action: `EMAIL_${notificationType}`,
        entity_name: relatedRecordType || 'Stakeholder',
        entity_id: relatedRecordId || stakeholderId,
        details: `Dispatched ${notificationType} email to "${targetEmail || 'No Email'}" (Subject: ${subject})`
      })
    } catch (_) {}

    return {
      success: true,
      email: targetEmail,
      recipientName: targetName,
      subject,
      edgeResponse: edgeFunctionResponse
    }
  } catch (fatalErr) {
    console.error('[emailNotificationService] Fatal email sending error:', fatalErr)
    return {
      success: false,
      error: fatalErr.message
    }
  }
}

/**
 * High-level trigger: Send Application Progress Email
 */
export async function sendApplicationProgressNotification({
  stakeholderId,
  userId = null,
  stage = 'WORKFLOW',
  status = 'IN_PROGRESS',
  title = null,
  message = null,
  remarks = '',
  referenceNo = null,
  stallNo = null,
  email = null
}) {
  const contact = await resolveStakeholderContact(stakeholderId, userId)
  const targetEmail = email || contact.email
  const applicantName = contact.fullName
  const targetStall = stallNo || contact.stallNo

  const emailSubject = title || `Municipal Application Update: ${stage} - ${status}`
  const emailHtml = buildApplicationProgressEmail({
    applicantName,
    applicantEmail: targetEmail || 'No email attached',
    stage,
    status,
    title: emailSubject,
    message: message || `Your application status at stage ${stage} is currently: ${status}.`,
    remarks,
    referenceNo: referenceNo || `APP-${stakeholderId || 'REF'}`,
    stallNo: targetStall
  })

  return sendStakeholderEmail({
    stakeholderId,
    userId,
    email: targetEmail,
    recipientName: applicantName,
    subject: emailSubject,
    html: emailHtml,
    text: message || `Application status update: ${stage} is ${status}. Remarks: ${remarks}`,
    notificationType: 'APPLICATION_PROGRESS',
    relatedRecordType: 'STAKEHOLDER',
    relatedRecordId: stakeholderId,
    metadata: { stage, status, remarks, stallNo: targetStall, referenceNo }
  })
}

/**
 * High-level trigger: Send Billing Due Soon Email
 */
export async function sendBillingDueNotification({
  billingId,
  stakeholderId,
  billingNo,
  stallNo = '',
  billingPeriod = 'Monthly Rental',
  totalAmount = 0,
  balance = 0,
  dueDate = null
}) {
  const contact = await resolveStakeholderContact(stakeholderId)
  const targetEmail = contact.email
  const stakeholderName = contact.fullName
  const resolvedStall = stallNo || contact.stallNo

  const dueObj = dueDate ? new Date(dueDate) : new Date()
  const today = new Date()
  const diffDays = Math.ceil((dueObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = diffDays < 0

  const subject = isOverdue
    ? `URGENT: Municipal Billing Statement Overdue - ${billingNo || `BILL-${billingId}`}`
    : `Billing Due Notice: Statement ${billingNo || `BILL-${billingId}`} - ₱${Number(balance || 0).toLocaleString()}`

  const emailHtml = buildBillingDueEmail({
    stakeholderName,
    stakeholderEmail: targetEmail || 'No email attached',
    billingNo: billingNo || `BILL-${billingId}`,
    stallNo: resolvedStall,
    billingPeriod,
    totalAmount,
    balance,
    dueDate,
    isOverdue,
    daysRemaining: diffDays
  })

  return sendStakeholderEmail({
    stakeholderId,
    email: targetEmail,
    recipientName: stakeholderName,
    subject,
    html: emailHtml,
    text: `Your billing statement ${billingNo} for Stall ${resolvedStall} has a balance of ₱${Number(balance).toLocaleString()} due on ${dueDate}.`,
    notificationType: isOverdue ? 'BILLING_OVERDUE' : 'BILLING_DUE_SOON',
    relatedRecordType: 'BILLING',
    relatedRecordId: billingId,
    metadata: { billingNo, stallNo: resolvedStall, balance, dueDate, isOverdue }
  })
}

/**
 * High-level trigger: Send Contract Due Soon / Expiration Email
 */
export async function sendContractDueNotification({
  contractId,
  stakeholderId,
  contractNo,
  stallNo = '',
  stallType = 'Commercial Stall',
  monthlyRent = 0,
  endDate = null,
  daysRemaining = null,
  urgencyCategory = 'WARNING'
}) {
  const contact = await resolveStakeholderContact(stakeholderId)
  const targetEmail = contact.email
  const stakeholderName = contact.fullName
  const resolvedStall = stallNo || contact.stallNo

  let calcDays = daysRemaining
  if (calcDays === null && endDate) {
    const end = new Date(endDate)
    const today = new Date()
    calcDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const isExpired = calcDays !== null && calcDays <= 0
  const subject = isExpired
    ? `OFFICIAL NOTICE: Lease Contract Expired - Stall No. ${resolvedStall || 'N/A'}`
    : `Lease Renewal Notice: Contract Expiring in ${calcDays} Days - Stall No. ${resolvedStall || 'N/A'}`

  const emailHtml = buildContractDueEmail({
    stakeholderName,
    stakeholderEmail: targetEmail || 'No email attached',
    contractNo: contractNo || `CON-${contractId}`,
    stallNo: resolvedStall,
    stallType,
    monthlyRent,
    endDate,
    daysRemaining: calcDays,
    urgencyCategory
  })

  return sendStakeholderEmail({
    stakeholderId,
    email: targetEmail,
    recipientName: stakeholderName,
    subject,
    html: emailHtml,
    text: `Notice of lease expiration: Stall ${resolvedStall} lease contract expires on ${endDate}. Please visit the Market Supervisor Office to renew.`,
    notificationType: isExpired ? 'CONTRACT_EXPIRED' : 'CONTRACT_EXPIRATION',
    relatedRecordType: 'CONTRACT',
    relatedRecordId: contractId,
    metadata: { contractNo, stallNo: resolvedStall, endDate, daysRemaining: calcDays }
  })
}

/**
 * Bulk dispatch: Send reminders to all stakeholders with bills due soon (<= 7 days or overdue)
 */
export async function sendBulkBillingDueNotifications(billingsList) {
  const results = { sent: 0, skipped: 0, errors: [] }

  for (const bill of (billingsList || [])) {
    const balance = Number(bill.balance || 0)
    if (balance <= 0) {
      results.skipped++
      continue
    }

    const stakeholderId = bill.stakeholderId || bill.occupant?.stakeholder_id || bill.stakeholder_id
    if (!stakeholderId) {
      results.skipped++
      continue
    }

    try {
      const res = await sendBillingDueNotification({
        billingId: bill.rawId || bill.id,
        stakeholderId,
        billingNo: bill.billingNo || bill.billing_no || `BILL-${bill.id}`,
        stallNo: bill.stallNo || bill.stall?.stall_no || bill.occupant?.stall?.stall_no || '',
        billingPeriod: bill.billingPeriod || bill.billing_period,
        totalAmount: bill.totalAmount || bill.total_amount,
        balance,
        dueDate: bill.dueDate || bill.due_date
      })
      if (res.success) results.sent++
      else results.errors.push({ id: bill.id, error: res.error })
    } catch (err) {
      results.errors.push({ id: bill.id, error: err.message })
    }
  }

  return results
}

/**
 * Bulk dispatch: Send expiration notices to all stakeholders with contracts due soon (<= 90 days or overdue)
 */
export async function sendBulkContractDueNotifications(contractsList) {
  const results = { sent: 0, skipped: 0, errors: [] }

  for (const contract of (contractsList || [])) {
    const stakeholderId = contract.stakeholderId || contract.stakeholder_id || contract.occupant?.stakeholder_id
    if (!stakeholderId) {
      results.skipped++
      continue
    }

    try {
      const res = await sendContractDueNotification({
        contractId: contract.id || contract.rawId,
        stakeholderId,
        contractNo: contract.contractNo || contract.contract_no || contract.ref,
        stallNo: contract.stallNo || contract.stall?.stall_no || '',
        stallType: contract.stallType || contract.stall_type,
        monthlyRent: contract.monthlyRent || contract.monthly_rent,
        endDate: contract.endDate || contract.end_date,
        daysRemaining: contract.daysRemaining,
        urgencyCategory: contract.urgencyCategory
      })
      if (res.success) results.sent++
      else results.errors.push({ id: contract.id, error: res.error })
    } catch (err) {
      results.errors.push({ id: contract.id, error: err.message })
    }
  }

  return results
}

export default {
  resolveStakeholderContact,
  buildApplicationProgressEmail,
  buildBillingDueEmail,
  buildContractDueEmail,
  sendStakeholderEmail,
  sendApplicationProgressNotification,
  sendBillingDueNotification,
  sendContractDueNotification,
  sendBulkBillingDueNotifications,
  sendBulkContractDueNotifications
}
