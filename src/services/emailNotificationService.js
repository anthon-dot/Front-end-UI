import axios from 'axios'
import { supabase } from '../config/supabase.js'

/**
 * ==============================================================================
 * STAKEHOLDER EMAIL NOTIFICATION SERVICE (NODEMAILER ENABLED)
 * ==============================================================================
 * Dispatches official municipal notifications via Nodemailer SMTP to the email
 * address attached to that particular stakeholder from Supabase business_applications for:
 * 1. Application Progress Updates (Submission, Stage Approvals, Rejections, Activation)
 * 2. Billing Due Soon Notices & Overdue Statements
 * 3. Contract Expiration & Lease Renewal Notices (Due Soon: <= 30/60/90 days)
 *
 * Integrates directly with:
 * - Supabase 'business_applications' table (Authoritative source for applicant/stakeholder emails)
 * - Nodemailer Server / Vite Dev Plugin ('/api/email/send')
 * - In-app Notifications ('public.notifications')
 * - System Audit Logs ('public.audit_logs')
 * - Supabase Edge Functions ('approval-workflow' / 'send-email') as secondary fallback
 */

const MUNICIPAL_LOGO_ALT = 'Municipality of Manticao'
const MUNICIPAL_OFFICE_TITLE = 'Office of the Market Supervisor'
const MUNICIPAL_ADDRESS = 'Municipal Public Market Administration, Poblacion, Manticao, Misamis Oriental, 9024'

/**
 * Authoritative lookup for a stakeholder's real email registered in Supabase 'business_applications'.
 * Automatically resolves and auto-fills the email of the particular stakeholder receiving notifications.
 *
 * Matches by:
 * 1. userId (business_applications.user_id)
 * 2. stakeholderId (stakeholders.id -> user_id -> business_applications.email, or application id)
 * 3. selected_stall_id (business_applications.selected_stall_id)
 * 4. stallNo (via stalls table match)
 * 5. Full name (first_name + last_name) or business_name
 */
export async function fetchStakeholderEmailFromBusinessApplication({
  stakeholderId = null,
  userId = null,
  stallId = null,
  stallNo = null,
  name = null,
  businessName = null
} = {}) {
  try {
    // 1. If userId is provided, direct lookup on business_applications by user_id
    if (userId) {
      const { data: appByUser } = await supabase
        .from('business_applications')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (appByUser && appByUser.email && appByUser.email.trim()) {
        const email = appByUser.email.trim()
        const fName = appByUser.first_name || ''
        const lName = appByUser.last_name || ''
        return {
          email,
          firstName: fName,
          lastName: lName,
          fullName: `${fName} ${lName}`.trim() || appByUser.business_name || '',
          businessName: appByUser.business_name || '',
          contact: appByUser.contact || '',
          userId: appByUser.user_id,
          stallId: appByUser.selected_stall_id,
          applicationId: appByUser.id,
          source: 'Supabase business_applications (user_id match)'
        }
      }
    }

    // 2. If stakeholderId is provided, inspect Supabase stakeholders table to find their user_id or email
    let discoveredUserId = userId
    let discoveredName = name
    let discoveredBusinessName = businessName
    let discoveredStallId = stallId

    if (stakeholderId) {
      const queryId = !isNaN(Number(stakeholderId)) ? Number(stakeholderId) : null
      if (queryId) {
        const { data: st } = await supabase
          .from('stakeholders')
          .select('id, user_id, email, first_name, last_name, business_name, contact, stall_id')
          .eq('id', queryId)
          .maybeSingle()

        if (st) {
          if (st.user_id) discoveredUserId = st.user_id
          if (!discoveredName) discoveredName = `${st.first_name || ''} ${st.last_name || ''}`.trim()
          if (!discoveredBusinessName) discoveredBusinessName = st.business_name
          if (!discoveredStallId && st.stall_id) discoveredStallId = st.stall_id

          // If stakeholder record has a verified email and user_id, verify with business_applications
          if (st.user_id) {
            const { data: appByStUser } = await supabase
              .from('business_applications')
              .select('*')
              .eq('user_id', st.user_id)
              .order('id', { ascending: false })
              .limit(1)
              .maybeSingle()

            if (appByStUser && appByStUser.email && appByStUser.email.trim()) {
              const email = appByStUser.email.trim()
              const fName = appByStUser.first_name || st.first_name || ''
              const lName = appByStUser.last_name || st.last_name || ''
              return {
                email,
                firstName: fName,
                lastName: lName,
                fullName: `${fName} ${lName}`.trim() || appByStUser.business_name || '',
                businessName: appByStUser.business_name || st.business_name || '',
                contact: appByStUser.contact || st.contact || '',
                userId: appByStUser.user_id,
                stallId: appByStUser.selected_stall_id || discoveredStallId,
                applicationId: appByStUser.id,
                source: 'Supabase business_applications (stakeholder user_id match)'
              }
            }
          }

          // If stakeholder record itself has an email directly in stakeholders table
          if (st.email && st.email.trim()) {
            return {
              email: st.email.trim(),
              firstName: st.first_name || '',
              lastName: st.last_name || '',
              fullName: `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.business_name || '',
              businessName: st.business_name || '',
              contact: st.contact || '',
              userId: st.user_id,
              stallId: discoveredStallId,
              stakeholderId: st.id,
              source: 'Supabase stakeholders record'
            }
          }
        }
      }

      // Check if stakeholderId matches an application id directly in business_applications
      if (!isNaN(Number(stakeholderId))) {
        const { data: appById } = await supabase
          .from('business_applications')
          .select('*')
          .eq('id', Number(stakeholderId))
          .maybeSingle()

        if (appById && appById.email && appById.email.trim()) {
          const email = appById.email.trim()
          const fName = appById.first_name || ''
          const lName = appById.last_name || ''
          return {
            email,
            firstName: fName,
            lastName: lName,
            fullName: `${fName} ${lName}`.trim() || appById.business_name || '',
            businessName: appById.business_name || '',
            contact: appById.contact || '',
            userId: appById.user_id,
            stallId: appById.selected_stall_id,
            applicationId: appById.id,
            source: 'Supabase business_applications (application id match)'
          }
        }
      }
    }

    // 3. Query business_applications by selected_stall_id
    const targetStallId = discoveredStallId || stallId
    if (targetStallId && !isNaN(Number(targetStallId))) {
      const { data: appByStall } = await supabase
        .from('business_applications')
        .select('*')
        .eq('selected_stall_id', Number(targetStallId))
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (appByStall && appByStall.email && appByStall.email.trim()) {
        const email = appByStall.email.trim()
        const fName = appByStall.first_name || ''
        const lName = appByStall.last_name || ''
        return {
          email,
          firstName: fName,
          lastName: lName,
          fullName: `${fName} ${lName}`.trim() || appByStall.business_name || '',
          businessName: appByStall.business_name || '',
          contact: appByStall.contact || '',
          userId: appByStall.user_id,
          stallId: appByStall.selected_stall_id,
          applicationId: appByStall.id,
          source: 'Supabase business_applications (selected_stall_id match)'
        }
      }
    }

    // 4. Query business_applications by stallNo (resolve stall first)
    if (stallNo && String(stallNo).trim()) {
      const cleanStallNo = String(stallNo).trim()
      const { data: matchedStall } = await supabase
        .from('stalls')
        .select('id, stall_no')
        .ilike('stall_no', cleanStallNo)
        .limit(1)
        .maybeSingle()

      if (matchedStall?.id) {
        const { data: appByStallNo } = await supabase
          .from('business_applications')
          .select('*')
          .eq('selected_stall_id', matchedStall.id)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (appByStallNo && appByStallNo.email && appByStallNo.email.trim()) {
          const email = appByStallNo.email.trim()
          const fName = appByStallNo.first_name || ''
          const lName = appByStallNo.last_name || ''
          return {
            email,
            firstName: fName,
            lastName: lName,
            fullName: `${fName} ${lName}`.trim() || appByStallNo.business_name || '',
            businessName: appByStallNo.business_name || '',
            contact: appByStallNo.contact || '',
            userId: appByStallNo.user_id,
            stallId: appByStallNo.selected_stall_id,
            applicationId: appByStallNo.id,
            source: 'Supabase business_applications (stall_no match)'
          }
        }
      }
    }

    // 5. Query business_applications by Person Name (first_name, last_name)
    const targetName = discoveredName || name
    if (targetName && targetName.trim() && targetName !== 'Valued Stakeholder' && targetName !== 'Stallholder Lessee') {
      const clean = targetName.trim()
      const parts = clean.split(/\s+/)
      const fName = parts[0]
      const lName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0]

      let query = supabase
        .from('business_applications')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)

      if (parts.length > 1) {
        query = query.ilike('first_name', `%${fName}%`).ilike('last_name', `%${lName}%`)
      } else {
        query = query.or(`first_name.ilike.%${fName}%,last_name.ilike.%${fName}%`)
      }

      const { data: appByName } = await query.maybeSingle()
      if (appByName && appByName.email && appByName.email.trim()) {
        const email = appByName.email.trim()
        return {
          email,
          firstName: appByName.first_name || '',
          lastName: appByName.last_name || '',
          fullName: `${appByName.first_name || ''} ${appByName.last_name || ''}`.trim() || appByName.business_name || clean,
          businessName: appByName.business_name || '',
          contact: appByName.contact || '',
          userId: appByName.user_id,
          stallId: appByName.selected_stall_id,
          applicationId: appByName.id,
          source: 'Supabase business_applications (person name match)'
        }
      }
    }

    // 6. Query business_applications by Business Name
    const targetBiz = discoveredBusinessName || businessName
    if (targetBiz && String(targetBiz).trim()) {
      const { data: appByBiz } = await supabase
        .from('business_applications')
        .select('*')
        .ilike('business_name', `%${String(targetBiz).trim()}%`)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (appByBiz && appByBiz.email && appByBiz.email.trim()) {
        const email = appByBiz.email.trim()
        const fName = appByBiz.first_name || ''
        const lName = appByBiz.last_name || ''
        return {
          email,
          firstName: fName,
          lastName: lName,
          fullName: `${fName} ${lName}`.trim() || appByBiz.business_name || '',
          businessName: appByBiz.business_name || '',
          contact: appByBiz.contact || '',
          userId: appByBiz.user_id,
          stallId: appByBiz.selected_stall_id,
          applicationId: appByBiz.id,
          source: 'Supabase business_applications (business_name match)'
        }
      }
    }
  } catch (err) {
    console.warn('[emailNotificationService] Error querying Supabase business_applications:', err)
  }

  return null
}

/**
 * Resolve the email address and contact details attached to a particular stakeholder.
 * Authoritatively retrieves the authentic email from Supabase business_applications.
 * Never uses mock data or synthetic fallback email addresses.
 */
export async function resolveStakeholderContact(stakeholderId, userId = null) {
  let email = ''
  let fullName = ''
  let firstName = ''
  let lastName = ''
  let businessName = ''
  let contact = ''
  let stallNo = ''
  let stallId = null
  let resolvedUserId = userId
  let resolvedStakeholderId = stakeholderId

  // If stakeholderId is an object (common when callers pass the applicant/contract item)
  if (typeof stakeholderId === 'object' && stakeholderId !== null) {
    email = (stakeholderId.email || stakeholderId.email_address || stakeholderId.applicantEmail || stakeholderId.stakeholderEmail || '').trim()
    firstName = stakeholderId.firstName || stakeholderId.first_name || ''
    lastName = stakeholderId.lastName || stakeholderId.last_name || ''
    fullName = stakeholderId.name || stakeholderId.fullName || `${firstName} ${lastName}`.trim() || stakeholderId.businessName || ''
    businessName = stakeholderId.businessName || stakeholderId.business_name || stakeholderId.business || ''
    contact = stakeholderId.contact || stakeholderId.phone || ''
    stallNo = stakeholderId.stallNo || stakeholderId.stall_no || stakeholderId.stallRequested || stakeholderId.selectedStall?.stall_no || ''
    stallId = stakeholderId.stallId || stakeholderId.selected_stall_id || stakeholderId.selectedStallId || stakeholderId.selectedStall?.id || null
    resolvedUserId = resolvedUserId || stakeholderId.userId || stakeholderId.user_id
    resolvedStakeholderId = stakeholderId.id || stakeholderId.stakeholderId || stakeholderId.ref
  }

  // 1. Primary Source: Authoritative lookup in Supabase 'business_applications' table
  if (!email) {
    const appLookup = await fetchStakeholderEmailFromBusinessApplication({
      stakeholderId: resolvedStakeholderId,
      userId: resolvedUserId,
      stallId,
      stallNo,
      name: fullName,
      businessName
    })

    if (appLookup && appLookup.email) {
      email = appLookup.email
      if (!firstName) firstName = appLookup.firstName
      if (!lastName) lastName = appLookup.lastName
      if (!fullName) fullName = appLookup.fullName
      if (!businessName) businessName = appLookup.businessName
      if (!contact) contact = appLookup.contact
      if (!resolvedUserId) resolvedUserId = appLookup.userId
      console.log(`[emailNotificationService] Auto-filled authentic stakeholder email from Supabase: "${email}" (${appLookup.source})`)
    }
  }

  // 2. Check stakeholders table in Supabase if still not resolved
  if (!email && resolvedStakeholderId) {
    try {
      const queryId = !isNaN(Number(resolvedStakeholderId)) ? Number(resolvedStakeholderId) : null
      if (queryId) {
        const { data: st } = await supabase
          .from('stakeholders')
          .select('*, stall:stalls(*), occupant:occupants(*, stall:stalls(*))')
          .eq('id', queryId)
          .maybeSingle()

        if (st) {
          if (!email) email = (st.email || st.email_address || st.mail || st.occupant?.email || '').trim()
          if (!firstName) firstName = st.first_name || st.firstName || ''
          if (!lastName) lastName = st.last_name || st.lastName || ''
          if (!fullName) fullName = `${firstName} ${lastName}`.trim() || st.name || st.business_name || ''
          if (!businessName) businessName = st.business_name || st.businessName || ''
          if (!contact) contact = st.contact || st.phone || ''
          resolvedUserId = resolvedUserId || st.user_id
          if (!stallNo) stallNo = st.stall?.stall_no || st.stall?.number || st.occupant?.stall?.stall_no || ''

          // If stakeholder record has a user_id, perform authoritative query on business_applications
          if (!email && st.user_id) {
            const userApp = await fetchStakeholderEmailFromBusinessApplication({ userId: st.user_id })
            if (userApp?.email) {
              email = userApp.email
              if (!fullName || fullName === 'Valued Stakeholder') fullName = userApp.fullName
            }
          }
        }
      }
    } catch (err) {
      console.warn('[emailNotificationService] Error querying stakeholder:', err)
    }
  }

  // 3. Check profiles table in Supabase (authenticated user profile)
  if (!email && (resolvedUserId || resolvedStakeholderId)) {
    try {
      const pId = resolvedUserId || resolvedStakeholderId
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', pId)
        .maybeSingle()

      if (prof) {
        if (!email) email = (prof.email || '').trim()
        if (!fullName) fullName = prof.name || prof.username || ''
      }
    } catch (err) {
      console.warn('[emailNotificationService] Error querying profiles:', err)
    }
  }

  // 4. Check browser localStorage cache (only for authentic business applications cached locally)
  if (!email && typeof window !== 'undefined' && window.localStorage) {
    try {
      const storageKeys = ['business_applications', 'ms_applications', 'stakeholders']
      for (const key of storageKeys) {
        const raw = window.localStorage.getItem(key)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            const found = parsed.find(item =>
              String(item.id) === String(resolvedStakeholderId) ||
              String(item.stakeholderId) === String(resolvedStakeholderId) ||
              String(item.userId || item.user_id) === String(resolvedUserId) ||
              (item.email && item.name && fullName && item.name.toLowerCase() === fullName.toLowerCase())
            )
            if (found && found.email) {
              email = (found.email || found.email_address || '').trim()
              if (!fullName || fullName === 'Valued Stakeholder') {
                fullName = found.name || `${found.firstName || ''} ${found.lastName || ''}`.trim() || found.businessName || ''
              }
              if (!contact) contact = found.contact || found.phone || ''
              if (!stallNo) stallNo = found.stallNo || found.stallRequested || ''
            }
          }
        }
        if (email) break
      }
    } catch (_) {}
  }

  // STRICT RULE: No mock data! No synthetic placeholder/fallback email generation!

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
 * Low-level dispatch function: Dispatches email via Nodemailer SMTP endpoint,
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
    let targetEmail = (email || '').trim()
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

    // 2. Dispatch via Nodemailer API endpoint
    let mailerResponse = null
    let emailSent = false
    let emailError = null

    if (targetEmail) {
      // If running in a Node.js environment (e.g., test runner, SSR, CLI)
      if (typeof window === 'undefined') {
        try {
          const { sendEmail } = await import('../../server/mailer.js')
          mailerResponse = await sendEmail({
            to: targetEmail,
            recipientName: targetName,
            subject,
            html,
            text: text || subject
          })
          if (mailerResponse && (mailerResponse.success || mailerResponse.messageId)) {
            emailSent = true
            console.log(`[emailNotificationService] Direct Node mailer dispatched to "${targetEmail}" (MsgID: ${mailerResponse.messageId || 'OK'})`)
          }
        } catch (nodeErr) {
          console.warn('[emailNotificationService] Direct Node mailer error:', nodeErr.message)
        }
      }

      // In browser or fallback: try candidate HTTP endpoints
      if (!emailSent) {
        const candidateEndpoints = [
          (typeof import.meta !== 'undefined' && import.meta.env?.VITE_EMAIL_API_URL),
          '/api/email/send',
          'http://localhost:3001/api/email/send',
          'http://localhost:5173/api/email/send'
        ].filter(Boolean)

        for (const endpoint of candidateEndpoints) {
          try {
            const res = await axios.post(
              endpoint,
              {
                to: targetEmail,
                recipientName: targetName,
                subject,
                html,
                text: text || subject,
                notificationType,
                stakeholderId: stakeholderId ? Number(stakeholderId) : null,
                relatedRecordType,
                relatedRecordId: relatedRecordId ? Number(relatedRecordId) : null,
                metadata: { ...metadata, stallNo: resolvedStallNo }
              },
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
              }
            )

            if (res.data && (res.data.success || res.data.messageId)) {
              mailerResponse = res.data
              emailSent = true
              console.log(`[emailNotificationService] Nodemailer successfully dispatched to "${targetEmail}" via ${endpoint} (MsgID: ${res.data.messageId || 'OK'})`)
              break
            } else {
              emailError = res.data?.error || 'Nodemailer returned an unhandled response.'
            }
          } catch (postErr) {
            emailError = postErr.response?.data?.error || postErr.message
            // Continue to next candidate endpoint
          }
        }
      }

      // 3. Fallback to Supabase Edge Function if local/custom Nodemailer endpoint failed
      if (!emailSent) {
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
          if (!error && data?.success) {
            mailerResponse = data
            emailSent = true
            emailError = null
          }
        } catch (edgeErr) {
          console.warn('[emailNotificationService] Edge function fallback also bypassed:', edgeErr.message)
        }
      }
    }

    // 4. Register in 'public.notifications' so the stakeholder sees it in their notification center
    if (stakeholderId) {
      try {
        const queryId = !isNaN(Number(stakeholderId)) ? Number(stakeholderId) : null
        if (queryId) {
          await supabase.from('notifications').insert({
            stakeholder_id: queryId,
            title: subject,
            message: text || subject,
            priority: notificationType.includes('EXPIRATION') || notificationType.includes('OVERDUE') ? 'HIGH' : 'MEDIUM',
            notification_type: notificationType,
            related_record_type: relatedRecordType,
            related_record_id: relatedRecordId && !isNaN(Number(relatedRecordId)) ? Number(relatedRecordId) : null,
            is_read: false
          })
        }
      } catch (notifErr) {
        console.warn('[emailNotificationService] Could not insert in notifications table:', notifErr.message)
      }
    }

    // 5. Record in 'public.audit_logs'
    try {
      await supabase.from('audit_logs').insert({
        action: `EMAIL_${notificationType}`,
        entity_name: relatedRecordType || 'Stakeholder',
        entity_id: relatedRecordId || stakeholderId,
        details: `Dispatched ${notificationType} email via Nodemailer to "${targetEmail || 'No Email'}" (Subject: ${subject})`
      })
    } catch (_) {}

    if (!targetEmail) {
      return {
        success: false,
        emailMissing: true,
        error: `No email address registered for stakeholder #${stakeholderId}. In-app notification was saved, but email could not be delivered.`,
        recipientName: targetName
      }
    }

    if (!emailSent && emailError) {
      return {
        success: false,
        error: `Failed to dispatch email via Nodemailer: ${emailError}`,
        email: targetEmail,
        recipientName: targetName
      }
    }

    return {
      success: true,
      email: targetEmail,
      recipientName: targetName,
      subject,
      messageId: mailerResponse?.messageId,
      transport: 'nodemailer-smtp'
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
  dueDate = null,
  email = null
}) {
  const contact = await resolveStakeholderContact(stakeholderId)
  const targetEmail = (email || contact.email || '').trim()
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
  urgencyCategory = 'WARNING',
  email = null
}) {
  const contact = await resolveStakeholderContact(stakeholderId)
  const targetEmail = (email || contact.email || '').trim()
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
        dueDate: bill.dueDate || bill.due_date,
        email: bill.email || bill.stakeholderEmail || bill.occupant?.email
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
        urgencyCategory: contract.urgencyCategory,
        email: contract.email || contract.stakeholderEmail
      })
      if (res.success) {
        results.sent++
      } else {
        results.skipped++
        results.errors.push({ id: contract.id, error: res.error })
      }
    } catch (err) {
      results.errors.push({ id: contract.id, error: err.message })
    }
  }

  return results
}

export default {
  resolveStakeholderContact,
  fetchStakeholderEmailFromBusinessApplication,
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
