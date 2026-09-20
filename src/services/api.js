import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";
import { AUTH_TOKEN_KEY } from "../stores/auth";
import { supabase } from "../config/supabase";

const rawAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

rawAxios.interceptors.request.use(async (config) => {
  let token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      token = session.access_token;
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to convert snake_case strings to camelCase
function toCamel(str) {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

// Normalizes records so both snake_case and camelCase properties exist
export function normalizeRecord(item) {
  if (!item || typeof item !== 'object') return item;
  if (Array.isArray(item)) return item.map(normalizeRecord);

  const result = { ...item };
  for (const [key, val] of Object.entries(item)) {
    const camelKey = toCamel(key);
    const normalizedVal = (val && typeof val === 'object') ? normalizeRecord(val) : val;
    result[key] = normalizedVal;
    if (camelKey !== key) {
      result[camelKey] = normalizedVal;
    }
  }

  // Key explicit aliases for frontend template compatibility
  if (result.created_at && !result.createdAt) result.createdAt = result.created_at;
  if (result.updated_at && !result.updatedAt) result.updatedAt = result.updated_at;
  if (result.first_name && !result.firstName) result.firstName = result.first_name;
  if (result.last_name && !result.lastName) result.lastName = result.last_name;
  if (result.middle_name && !result.middleName) result.middleName = result.middle_name;
  if (result.business_name && !result.businessName) result.businessName = result.business_name;
  if (result.business_type && !result.businessType) result.businessType = result.business_type;
  if (result.advance_balance !== undefined && result.advanceBalance === undefined) result.advanceBalance = result.advance_balance;
  if (result.total_advance_amount !== undefined && result.totalAdvanceAmount === undefined) result.totalAdvanceAmount = result.total_advance_amount;
  if (result.advance_payment_paid !== undefined && result.advancePaymentPaid === undefined) result.advancePaymentPaid = result.advance_payment_paid;
  if (result.advance_payment_completed !== undefined && result.advancePaymentCompleted === undefined) result.advancePaymentCompleted = result.advance_payment_completed;
  if (result.advance_payment_amount !== undefined && result.advancePaymentAmount === undefined) result.advancePaymentAmount = result.advance_payment_amount;
  if (result.treasurer_approved !== undefined && result.treasurerApproved === undefined) result.treasurerApproved = result.treasurer_approved;
  if (result.market_supervisor_approved !== undefined && result.marketSupervisorApproved === undefined) result.marketSupervisorApproved = result.market_supervisor_approved;
  if (result.bplo_approved !== undefined && result.bploApproved === undefined) result.bploApproved = result.bplo_approved;
  if (result.endorsing_approved !== undefined && result.endorsingApproved === undefined) result.endorsingApproved = result.endorsing_approved;
  if (result.final_endorsed !== undefined && result.finalEndorsed === undefined) result.finalEndorsed = result.final_endorsed;
  if (result.onboarding_status && !result.onboardingStatus) result.onboardingStatus = result.onboarding_status;
  if (result.application_status && !result.applicationStatus) result.applicationStatus = result.application_status;
  if (result.file_name && !result.fileName) result.fileName = result.file_name;
  if (result.file_path && !result.filePath) result.filePath = result.file_path;
  if (result.document_type && !result.documentType) result.documentType = result.document_type;
  if (result.monthly_rent !== undefined && result.monthlyRent === undefined) result.monthlyRent = result.monthly_rent;
  if (result.stall_no && !result.stallNo) result.stallNo = result.stall_no;

  return result;
}

// Smart Adapter that translates REST endpoints directly into Supabase operations
const api = {
  interceptors: rawAxios.interceptors,

  async get(url, config = {}) {
    const cleanUrl = url.split('?')[0].replace(/^\/+/, '');

    // 1. Stalls
    if (cleanUrl === 'stalls') {
      const { data, error } = await supabase
        .from('stalls')
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
        .order('id', { ascending: true });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl.startsWith('stalls/')) {
      const id = cleanUrl.replace('stalls/', '');
      const { data, error } = await supabase.from('stalls').select('*').eq('id', id).single();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    // 2. Stall Types
    if (cleanUrl === 'stall-types' || cleanUrl === 'admin/stall-types') {
      const { data, error } = await supabase.from('stall_types').select('*').order('name', { ascending: true });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 3. Rental Rates
    if (cleanUrl === 'rental-rates' || cleanUrl === 'admin/rental-rates') {
      const { data, error } = await supabase.from('rental_rates').select('*').order('id', { ascending: true });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 4. System Settings
    if (cleanUrl === 'admin/system-settings' || cleanUrl === 'system-settings') {
      const { data, error } = await supabase.from('system_settings').select('*').eq('id', 1).single();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    // 5. Users
    if (cleanUrl === 'admin/users' || cleanUrl === 'users') {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 6. Stakeholders
    if (cleanUrl === 'stakeholders/for-approval' || cleanUrl === 'stakeholders') {
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*, selectedStall:stalls(*), documents:stakeholder_documents(*), occupant:occupants(*, stall:stalls(*))')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl.startsWith('stakeholders/user/')) {
      const userId = cleanUrl.replace('stakeholders/user/', '');
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*, occupant:occupants(*, stall:stalls(*)), documents:stakeholder_documents(*)')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.endsWith('/requirements')) {
      const stakeholderId = cleanUrl.replace('stakeholders/', '').replace('/requirements', '');
      const { data, error } = await supabase
        .from('stakeholder_documents')
        .select('*')
        .eq('stakeholder_id', stakeholderId);
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl.startsWith('stakeholders/') && !cleanUrl.includes('/', 13)) {
      const id = cleanUrl.replace('stakeholders/', '');
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*, selectedStall:stalls(*), documents:stakeholder_documents(*), occupant:occupants(*, stall:stalls(*))')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    // 7. Applications
    if (cleanUrl === 'applications') {
      const { data, error } = await supabase
        .from('business_applications')
        .select('*, stall:stalls(*)')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl.startsWith('applications/user/')) {
      const userId = cleanUrl.replace('applications/user/', '');
      const { data, error } = await supabase
        .from('business_applications')
        .select('*, stall:stalls(*)')
        .eq('user_id', userId)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    // 8. Billings
    if (cleanUrl === 'billings') {
      const { data, error } = await supabase
        .from('billings')
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), contract:contracts(*)')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 9. Payments
    if (cleanUrl === 'payments') {
      const { data, error } = await supabase
        .from('payments')
        .select('*, stakeholder:stakeholders(*), billing:billings(*)')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 10. Audit Logs
    if (cleanUrl === 'audit-logs' || cleanUrl === 'admin/audit-logs') {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 11. Login History
    if (cleanUrl === 'login-history' || cleanUrl === 'admin/login-history') {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .ilike('action', '%LOGIN%')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 12. Notifications
    if (cleanUrl === 'notifications') {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl.startsWith('notifications/stakeholder/')) {
      const parts = cleanUrl.split('/');
      const stakeholderId = parts[2];
      if (cleanUrl.endsWith('/unread-count')) {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('stakeholder_id', stakeholderId)
          .eq('is_read', false);
        if (error) throw error;
        return { data: count || 0 };
      } else {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('stakeholder_id', stakeholderId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return { data: normalizeRecord(data || []) };
      }
    }

    // 13. AI Insights
    if (cleanUrl.includes('ai/') || cleanUrl.includes('ai-insights')) {
      const { data, error } = await supabase.functions.invoke('ai-insights/summary');
      if (error) throw error;
      return { data };
    }

    return rawAxios.get(url, config);
  },

  async post(url, data, config = {}) {
    const cleanUrl = url.split('?')[0].replace(/^\/+/, '');

    // 1. Applications upload/create
    if (cleanUrl === 'applications') {
      if (data instanceof FormData) {
        let rawUserId = data.get('userId');
        let resolvedUserId = (rawUserId && rawUserId !== 'null' && rawUserId !== 'undefined') ? rawUserId : null;

        if (!resolvedUserId) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          resolvedUserId = authUser?.id || null;
        }

        if (!resolvedUserId) {
          throw new Error('Authentication required. Please log in before submitting an application.');
        }

        const idFile = data.get('idFile');
        const letterFile = data.get('letterFile');

        let idUrl = null;
        if (idFile && idFile.name) {
          const idPath = `applications/${Date.now()}_id_${idFile.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
          const { error: idErr } = await supabase.storage.from('uploads').upload(idPath, idFile);
          if (idErr) {
            console.warn('[STORAGE] ID upload warning:', idErr.message);
          } else {
            const { data: pub } = supabase.storage.from('uploads').getPublicUrl(idPath);
            idUrl = pub?.publicUrl || null;
          }
        }

        let letterUrl = null;
        if (letterFile && letterFile.name) {
          const letterPath = `applications/${Date.now()}_letter_${letterFile.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
          const { error: letErr } = await supabase.storage.from('uploads').upload(letterPath, letterFile);
          if (letErr) {
            console.warn('[STORAGE] Letter upload warning:', letErr.message);
          } else {
            const { data: pub } = supabase.storage.from('uploads').getPublicUrl(letterPath);
            letterUrl = pub?.publicUrl || null;
          }
        }

        // Upsert into business_applications
        const { data: appData, error: appErr } = await supabase.from('business_applications')
          .upsert({
            user_id: resolvedUserId,
            business_name: data.get('businessName') || '',
            business_type: data.get('businessType') || '',
            first_name: data.get('firstName') || '',
            middle_name: data.get('middleName') || '',
            last_name: data.get('lastName') || '',
            contact: data.get('contact') || '',
            email: data.get('email') || '',
            address: data.get('address') || '',
            id_document_url: idUrl,
            letter_document_url: letterUrl,
            application_status: 'PENDING',
            onboarding_status: 'NEW'
          }, { onConflict: 'user_id' })
          .select()
          .single();

        if (appErr) {
          console.error('[API] Error saving business application:', appErr);
          throw appErr;
        }

        // Upsert into stakeholders
        const { data: existingStakeholder } = await supabase
          .from('stakeholders')
          .select('id')
          .eq('user_id', resolvedUserId)
          .maybeSingle();

        let stakeholderId = existingStakeholder?.id;

        if (stakeholderId) {
          await supabase.from('stakeholders').update({
            business_name: data.get('businessName') || '',
            business_type: data.get('businessType') || '',
            first_name: data.get('firstName') || '',
            middle_name: data.get('middleName') || '',
            last_name: data.get('lastName') || '',
            contact: data.get('contact') || '',
            email: data.get('email') || '',
            address: data.get('address') || '',
            application_status: 'FOR_APPROVAL',
            onboarding_status: 'FOR_APPROVAL'
          }).eq('id', stakeholderId);
        } else {
          const { data: newStakeholder } = await supabase.from('stakeholders').insert({
            user_id: resolvedUserId,
            business_name: data.get('businessName') || '',
            business_type: data.get('businessType') || '',
            first_name: data.get('firstName') || '',
            middle_name: data.get('middleName') || '',
            last_name: data.get('lastName') || '',
            contact: data.get('contact') || '',
            email: data.get('email') || '',
            address: data.get('address') || '',
            application_status: 'FOR_APPROVAL',
            onboarding_status: 'FOR_APPROVAL'
          }).select('id').maybeSingle();
          stakeholderId = newStakeholder?.id;
        }

        if (stakeholderId) {
          localStorage.setItem('stakeholderId', String(stakeholderId));
          const docs = [];
          if (idUrl) {
            docs.push({
              stakeholder_id: stakeholderId,
              document_type: 'VALID_ID',
              file_path: idUrl,
              file_name: idFile?.name || 'valid_id'
            });
          }
          if (letterUrl) {
            docs.push({
              stakeholder_id: stakeholderId,
              document_type: 'APPLICATION_LETTER',
              file_path: letterUrl,
              file_name: letterFile?.name || 'letter_of_intent'
            });
          }
          if (docs.length > 0) {
            await supabase.from('stakeholder_documents').insert(docs);
          }
        }

        return { data: normalizeRecord(appData) };
      }
    }

    // 2. Stalls upload
    if (cleanUrl === 'stalls/upload') {
      const file = data.get ? (data.get('file') || data.get('image')) : null;
      if (file) {
        const filePath = `stalls/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
        const { error: upErr } = await supabase.storage.from('uploads').upload(filePath, file);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('uploads').getPublicUrl(filePath);
        return { data: pub?.publicUrl };
      }
    }

    // 3. Stalls create
    if (cleanUrl === 'stalls') {
      const { data: newStall, error } = await supabase.from('stalls').insert(data).select().single();
      if (error) throw error;
      return { data: normalizeRecord(newStall) };
    }

    // 4. Stall Types create
    if (cleanUrl === 'stall-types' || cleanUrl === 'admin/stall-types') {
      const { data: newType, error } = await supabase.from('stall_types').insert(data).select().single();
      if (error) throw error;
      return { data: normalizeRecord(newType) };
    }

    // 5. Rental Rates create
    if (cleanUrl === 'rental-rates' || cleanUrl === 'admin/rental-rates') {
      const { data: newRate, error } = await supabase.from('rental_rates').insert(data).select().single();
      if (error) throw error;
      return { data: normalizeRecord(newRate) };
    }

    // 6. Payments create
    if (cleanUrl === 'payments') {
      const receiptNo = data.receiptNo || `RCP-${Date.now().toString().slice(-8)}`;
      const { data: newPayment, error } = await supabase
        .from('payments')
        .insert({
          stakeholder_id: data.stakeholderId,
          billing_id: data.billingId || null,
          amount: data.amount,
          payment_type: data.paymentType || 'RENT_PAYMENT',
          reference_no: data.referenceNo || '',
          receipt_no: receiptNo,
          payment_date: data.paymentDate || new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return { data: normalizeRecord(newPayment) };
    }

    // 7. Stakeholder Approval Actions in POST
    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.includes('treasurer-approve')) {
      const stakeholderId = cleanUrl.split('/')[1];
      const { data: resData, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'treasurer-approve', stakeholderId, ...(data || {}) }
      });
      if (error || resData?.error) throw new Error(error?.message || resData?.error || 'Treasurer approval failed');
      return { data: resData };
    }

    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.includes('assign-stall')) {
      const stakeholderId = cleanUrl.split('/')[1];
      const { data: resData, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'assign-stall', stakeholderId, ...(data || {}) }
      });
      if (error || resData?.error) throw new Error(error?.message || resData?.error || 'Stall assignment failed');
      return { data: resData };
    }

    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.endsWith('/approve')) {
      const stakeholderId = cleanUrl.split('/')[1];
      const { data: resData, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'treasurer-approve', stakeholderId, ...(data || {}) }
      });
      if (error || resData?.error) throw new Error(error?.message || resData?.error || 'Approval failed');
      return { data: resData };
    }

    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.endsWith('/reject')) {
      const stakeholderId = cleanUrl.split('/')[1];
      const remarks = data?.remarks || config.params?.remarks || 'Application rejected';
      const { data: resData, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'reject', stakeholderId, remarks }
      });
      if (error || resData?.error) throw new Error(error?.message || resData?.error || 'Rejection failed');
      return { data: resData };
    }

    // 8. Direct Edge Function invocation
    if (cleanUrl.startsWith('approval-workflow')) {
      const { data: resData, error } = await supabase.functions.invoke(cleanUrl, { body: data });
      if (error) throw error;
      return { data: resData };
    }

    return rawAxios.post(url, data, config);
  },

  async put(url, data, config = {}) {
    const cleanUrl = url.split('?')[0].replace(/^\/+/, '');

    // 1. Applications endorse / approve / reject / bplo
    if (cleanUrl.includes('/reject') || cleanUrl.includes('/endorse-reject') || cleanUrl.includes('/bplo-reject')) {
      const id = cleanUrl.split('/')[1];
      const stage = cleanUrl.includes('/bplo-reject') ? 'BPLO' : (cleanUrl.includes('/endorse-reject') ? 'ENDORSEMENT' : 'WORKFLOW');
      const remarks = config.params?.remarks || data?.remarks || 'Application rejected';
      const { data: res, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'reject', stakeholderId: id, stage, remarks }
      });
      if (error || res?.error) throw new Error(error?.message || res?.error || 'Rejection failed');
      return { data: res };
    }

    if (cleanUrl.includes('/treasurer-approve') || (cleanUrl.startsWith('stakeholders/') && cleanUrl.endsWith('/approve'))) {
      const id = cleanUrl.split('/')[1];
      const { data: res, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'treasurer-approve', stakeholderId: id, ...(data || {}) }
      });
      if (error || res?.error) throw new Error(error?.message || res?.error || 'Approval failed');
      return { data: res };
    }

    if (cleanUrl.includes('/endorse') || cleanUrl.includes('/final-endorse')) {
      const id = cleanUrl.split('/')[1];
      const { data: res, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'final-endorse', stakeholderId: id, ...(data || {}) }
      });
      if (error || res?.error) throw new Error(error?.message || res?.error || 'Endorsement failed');
      return { data: res };
    }

    if (cleanUrl.includes('/bplo-approve')) {
      const id = cleanUrl.split('/')[1];
      const { data: res, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'bplo-approve', stakeholderId: id, ...(data || {}) }
      });
      if (error || res?.error) throw new Error(error?.message || res?.error || 'BPLO approval failed');
      return { data: res };
    }

    if (cleanUrl.includes('/assign-stall')) {
      const id = cleanUrl.split('/')[1];
      const { data: res, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'assign-stall', stakeholderId: id, ...(data || {}) }
      });
      if (error || res?.error) throw new Error(error?.message || res?.error || 'Stall assignment failed');
      return { data: res };
    }

    // 2. Update stalls
    if (cleanUrl.startsWith('stalls/')) {
      const id = cleanUrl.replace('stalls/', '');
      const { data: updated, error } = await supabase.from('stalls').update(data).eq('id', id).select().single();
      if (error) throw error;
      return { data: normalizeRecord(updated) };
    }

    // 3. Update stall types
    if (cleanUrl.startsWith('stall-types/') || cleanUrl.startsWith('admin/stall-types/')) {
      const id = cleanUrl.split('/')[1];
      const { data: updated, error } = await supabase.from('stall_types').update(data).eq('id', id).select().single();
      if (error) throw error;
      return { data: normalizeRecord(updated) };
    }

    // 4. Update rental rates
    if (cleanUrl.startsWith('rental-rates/') || cleanUrl.startsWith('admin/rental-rates/')) {
      const id = cleanUrl.split('/')[1];
      const { data: updated, error } = await supabase.from('rental_rates').update(data).eq('id', id).select().single();
      if (error) throw error;
      return { data: normalizeRecord(updated) };
    }

    // 5. Mark notifications read
    if (cleanUrl.startsWith('notifications/') && cleanUrl.endsWith('/read')) {
      const id = cleanUrl.split('/')[1];
      const { data: updated, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).select();
      if (error) throw error;
      return { data: updated };
    }

    return rawAxios.put(url, data, config);
  },

  async delete(url, config = {}) {
    const cleanUrl = url.split('?')[0].replace(/^\/+/, '');

    if (cleanUrl.startsWith('stalls/')) {
      const id = cleanUrl.replace('stalls/', '');
      const { data, error } = await supabase.from('stalls').delete().eq('id', id);
      if (error) throw error;
      return { data };
    }

    if (cleanUrl.startsWith('stall-types/')) {
      const id = cleanUrl.replace('stall-types/', '');
      const { data, error } = await supabase.from('stall_types').delete().eq('id', id);
      if (error) throw error;
      return { data };
    }

    if (cleanUrl.startsWith('rental-rates/')) {
      const id = cleanUrl.replace('rental-rates/', '');
      const { data, error } = await supabase.from('rental_rates').delete().eq('id', id);
      if (error) throw error;
      return { data };
    }

    return rawAxios.delete(url, config);
  }
};

export default api;
