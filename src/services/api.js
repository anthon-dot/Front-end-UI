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
      return { data };
    }

    if (cleanUrl.startsWith('stalls/')) {
      const id = cleanUrl.replace('stalls/', '');
      const { data, error } = await supabase.from('stalls').select('*').eq('id', id).single();
      if (error) throw error;
      return { data };
    }

    // 2. Stall Types
    if (cleanUrl === 'stall-types' || cleanUrl === 'admin/stall-types') {
      const { data, error } = await supabase.from('stall_types').select('*').order('name', { ascending: true });
      if (error) throw error;
      return { data };
    }

    // 3. Rental Rates
    if (cleanUrl === 'rental-rates' || cleanUrl === 'admin/rental-rates') {
      const { data, error } = await supabase.from('rental_rates').select('*').order('id', { ascending: true });
      if (error) throw error;
      return { data };
    }

    // 4. System Settings
    if (cleanUrl === 'admin/system-settings' || cleanUrl === 'system-settings') {
      const { data, error } = await supabase.from('system_settings').select('*').eq('id', 1).single();
      if (error) throw error;
      return { data };
    }

    // 5. Users
    if (cleanUrl === 'admin/users') {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return { data };
    }

    // 6. Stakeholders for approval
    if (cleanUrl === 'stakeholders/for-approval') {
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*, selectedStall:stalls(*), documents:stakeholder_documents(*)')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: data || [] };
    }

    if (cleanUrl.startsWith('stakeholders/user/')) {
      const userId = cleanUrl.replace('stakeholders/user/', '');
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*, occupant:occupants(*, stall:stalls(*))')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return { data };
    }

    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.endsWith('/requirements')) {
      const stakeholderId = cleanUrl.replace('stakeholders/', '').replace('/requirements', '');
      const { data, error } = await supabase
        .from('stakeholder_documents')
        .select('*')
        .eq('stakeholder_id', stakeholderId);
      if (error) throw error;
      return { data: data || [] };
    }

    // 7. Applications
    if (cleanUrl === 'applications') {
      const { data, error } = await supabase
        .from('business_applications')
        .select('*, stall:stalls(*)')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: data || [] };
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
      return { data };
    }

    // 8. Billings
    if (cleanUrl === 'billings') {
      const { data, error } = await supabase
        .from('billings')
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), contract:contracts(*)')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: data || [] };
    }

    // 9. Payments
    if (cleanUrl === 'payments') {
      const { data, error } = await supabase
        .from('payments')
        .select('*, stakeholder:stakeholders(*), billing:billings(*)')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: data || [] };
    }

    // 10. Audit Logs
    if (cleanUrl === 'audit-logs' || cleanUrl === 'admin/audit-logs') {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return { data: data || [] };
    }

    // 11. Notifications
    if (cleanUrl === 'notifications') {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return { data: data || [] };
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
        return { data: data || [] };
      }
    }

    // 12. AI Insights
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

        // Upsert into business_applications (handles both first submission & re-submissions)
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

        // Check if stakeholder record already exists
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

        return { data: appData };
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
      return { data: newStall };
    }

    // 4. Payments create
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
      return { data: newPayment };
    }

    // 5. Approval Workflow (Treasurer / Permit)
    if (cleanUrl.startsWith('approval-workflow/')) {
      const fnName = cleanUrl;
      const { data: resData, error } = await supabase.functions.invoke(fnName, { body: data });
      if (error) throw error;
      return { data: resData };
    }

    return rawAxios.post(url, data, config);
  },

  async put(url, data, config = {}) {
    const cleanUrl = url.split('?')[0].replace(/^\/+/, '');

    // 1. Applications endorse / approve / reject
    if (cleanUrl.includes('/endorse-reject') || cleanUrl.includes('/bplo-reject')) {
      const id = cleanUrl.split('/')[1];
      const stage = cleanUrl.includes('/bplo-reject') ? 'BPLO' : 'ENDORSEMENT';
      const { data: res, error } = await supabase.functions.invoke('approval-workflow/reject', {
        body: { stakeholderId: id, stage, remarks: config.params?.remarks || '' }
      });
      if (error) throw error;
      return { data: res };
    }

    if (cleanUrl.includes('/endorse')) {
      const id = cleanUrl.split('/')[1];
      const { data: res, error } = await supabase.functions.invoke('approval-workflow/final-endorse', {
        body: { stakeholderId: id }
      });
      if (error) throw error;
      return { data: res };
    }

    if (cleanUrl.includes('/bplo-approve')) {
      const id = cleanUrl.split('/')[1];
      const { data: res, error } = await supabase.functions.invoke('approval-workflow/bplo-approve', {
        body: { stakeholderId: id }
      });
      if (error) throw error;
      return { data: res };
    }

    // 2. Update stalls
    if (cleanUrl.startsWith('stalls/')) {
      const id = cleanUrl.replace('stalls/', '');
      const { data: updated, error } = await supabase.from('stalls').update(data).eq('id', id).select().single();
      if (error) throw error;
      return { data: updated };
    }

    // 3. Mark notifications read
    if (cleanUrl.startsWith('notifications/') && cleanUrl.endsWith('/read')) {
      const id = cleanUrl.split('/')[1];
      const { data: updated, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).select();
      if (error) throw error;
      return { data: updated };
    }

    return rawAxios.put(url, data, config);
  },

  async delete(url, config = {}) {
    return rawAxios.delete(url, config);
  }
};

export default api;
